/* =========================================================
   AUDIO: distorted guitar, bass, lead, church organ, drums
   ========================================================= */
const AU = { ctx:null, on:true, song:null, step:0, next:0, pending:null, onEnd:null };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  let c; try { c = new AC(); } catch (e) { return; }
  AU.ctx = c;
  AU.master = c.createGain(); AU.master.gain.value = AU.on ? 0.5 : 0; AU.master.connect(c.destination);
  AU.mGain = c.createGain(); AU.mGain.gain.value = 0.55; AU.mGain.connect(AU.master);
  AU.sGain = c.createGain(); AU.sGain.gain.value = 0.8; AU.sGain.connect(AU.master);
  // guitar chain: per-note filter -> shaper -> cab filter
  const sh = c.createWaveShaper(), k = 55, n = 2048, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
  sh.curve = curve;
  const cab = c.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = 3200;
  const gG = c.createGain(); gG.gain.value = 0.16;
  sh.connect(cab); cab.connect(gG); gG.connect(AU.mGain);
  AU.gtrIn = sh;
  // echo bus for lead and organ
  const dl = c.createDelay(); dl.delayTime.value = 0.21;
  const fb = c.createGain(); fb.gain.value = 0.3;
  const wet = c.createGain(); wet.gain.value = 0.35;
  dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(AU.mGain);
  AU.echo = dl;
  // noise
  const len = c.sampleRate, b = c.createBuffer(1, len, c.sampleRate), ch = b.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  AU.noise = b;
  setInterval(sched, 25);
  if (AU.pending) { const p = AU.pending; AU.pending = null; playSong(p.name); }
}
function env(g, t, dur, vol, a = 0.004, rel = 0.05) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + Math.max(a + 0.001, dur - rel));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
}
function osc(type, f, t, dur, dest, vol, f1, detune) {
  const c = AU.ctx, o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (detune) o.detune.value = detune;
  const g = c.createGain(); env(g, t, dur, vol);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  return o;
}
function noiseHit(dest, t, dur, vol, type, f0, f1, q) {
  const c = AU.ctx, s = c.createBufferSource(); s.buffer = AU.noise; s.loop = true;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f0, t); if (q) fl.Q.value = q;
  if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const INST = {
  gtr(f, t, dur, vol, open) {
    const c = AU.ctx, d = open ? dur : Math.min(dur, 0.11);
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = open ? 2600 : 760;
    const g = c.createGain(); env(g, t, d, vol, 0.003, open ? 0.08 : 0.03);
    fl.connect(g); g.connect(AU.gtrIn);
    for (const m of [1, 1.4983, 2]) for (const dt of [-8, 8]) {
      const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * m; o.detune.value = dt;
      o.connect(fl); o.start(t); o.stop(t + d + 0.05);
    }
  },
  bass(f, t, dur, vol) {
    const c = AU.ctx, fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 480;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const g = c.createGain(); env(g, t, dur, vol);
    o.connect(fl); fl.connect(g); g.connect(AU.mGain); o.start(t); o.stop(t + dur + 0.05);
  },
  lead(f, t, dur, vol) {
    const c = AU.ctx, o = c.createOscillator(); o.type = 'square'; o.frequency.value = f;
    const lfo = c.createOscillator(), ld = c.createGain(); lfo.frequency.value = 5.6; ld.gain.value = 14;
    lfo.connect(ld); ld.connect(o.detune);
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2400;
    const g = c.createGain(); env(g, t, dur, vol, 0.01, 0.06);
    o.connect(fl); fl.connect(g); g.connect(AU.mGain); g.connect(AU.echo);
    o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
  },
  organ(f, t, dur, vol) {
    const c = AU.ctx, g = c.createGain(); env(g, t, dur, vol, 0.02, 0.08);
    const trem = c.createOscillator(), td = c.createGain(); trem.frequency.value = 6.5; td.gain.value = vol * 0.25;
    trem.connect(td); td.connect(g.gain);
    g.connect(AU.mGain); g.connect(AU.echo);
    [[1, 1], [2, 0.55], [3, 0.3], [4, 0.2], [0.5, 0.4]].forEach(([m, a]) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
      const og = c.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.1);
    });
    trem.start(t); trem.stop(t + dur + 0.1);
  },
  drum(dname, t) {
    const m = AU.mGain;
    if (dname === 'K') { osc('sine', 160, t, 0.16, m, 0.9, 42); noiseHit(m, t, 0.02, 0.3, 'highpass', 3000); }
    else if (dname === 'S') { noiseHit(m, t, 0.16, 0.42, 'bandpass', 1900, null, 0.8); osc('triangle', 210, t, 0.08, m, 0.25, 140); }
    else if (dname === 'h') noiseHit(m, t, 0.035, 0.12, 'highpass', 8000);
    else if (dname === 'C') noiseHit(m, t, 0.9, 0.22, 'highpass', 5200);
  },
};
const NOTE = { C:0, 'C#':1, D:2, 'D#':3, E:4, F:5, 'F#':6, G:7, 'G#':8, A:9, 'A#':10, B:11 };
function nfreq(n, o) { const midi = (+o + 1) * 12 + NOTE[n]; return 440 * Math.pow(2, (midi - 69) / 12); }
function parse(str) {
  const toks = str.trim().split(/\s+/), out = new Array(toks.length).fill(null);
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]; if (t === '.' || t === '~' || t === '|') continue;
    let len = 1; while (toks[i + len] === '~') len++;
    if (/^[KShC]$/.test(t)) { out[i] = { d:t, len }; continue; }
    const m = /^([A-G]#?)(\d)(!?)$/.exec(t);
    if (m) out[i] = { f:nfreq(m[1], m[2]), len, open:m[3] === '!' || len > 1 };
  }
  return out.filter((_, i) => toks[i] !== '|');
}
const rep = (s, n) => Array(n).fill(s).join(' ');
const RIFF =
  "E2 . E2 E2 E2 . E2 E2 E2 . E2 E2 G2! ~ A2! ~ " +
  "E2 . E2 E2 E2 . E2 E2 E2 . E2 E2 D3! ~ C3! ~ " +
  "C3! ~ ~ ~ C3 C3 C3 C3 D3! ~ ~ ~ D3 D3 D3 D3 " +
  "E2 . E2 E2 E2 . E2 E2 B2! ~ A#2! ~ A2! ~ G2! ~";
const PARTY_RIFF =
  "A2 A2 . A2 A2 . A2 A2 C3! ~ A2 A2 D3! ~ D#3! ~ " +
  "A2 A2 . A2 A2 . A2 A2 G3! ~ F3! ~ E3! ~ D3! ~ " +
  "F2! ~ F2 F2 F2 . F2 F2 G2! ~ G2 G2 G2 . G2 G2 " +
  "A2 A2 . A2 A2 . A2 A2 E3! ~ ~ ~ E2! ~ G2! ~";
const UP_RIFF =
  "D2 D2 D2 . D2 D2 F2! ~ D2 D2 D2 . G2! ~ G#2! ~ " +
  "D2 D2 D2 . D2 D2 F2! ~ D2 D2 C3! ~ A#2! ~ A2! ~ " +
  "A#1! ~ A#1 A#1 A#1 . A#1 A#1 C2! ~ C2 C2 C2 . C2 C2 " +
  "D2 D2 D2 . D2 D2 F2! ~ D2 D2 A2! ~ G#2! ~ G2! ~";
const ATTIC_RIFF =
  "C2! ~ ~ ~ C2 . C2 . D#2! ~ ~ ~ D2! ~ C#2! ~ " +
  "C2! ~ ~ ~ C2 . C2 . F#2! ~ ~ ~ F2! ~ D#2! ~ " +
  "G#1! ~ ~ ~ G#1 . G#1 . A#1! ~ ~ ~ A#1 . A#1 . " +
  "C2! ~ ~ ~ C2 . C2 . G2! ~ F#2! ~ F2! ~ D#2! ~";
const ROOF_RIFF =
  "E2 E2 B2! ~ E2 E2 A2! ~ E2 E2 G2! ~ F#2! ~ G2! ~ " +
  "E2 E2 B2! ~ E2 E2 D3! ~ C3! ~ B2! ~ A2! ~ G2! ~ " +
  "C2! ~ C2 C2 G2! ~ C2 C2 D2! ~ D2 D2 A2! ~ D2 D2 " +
  "E2 E2 B2! ~ E2 E2 A2! ~ G2! ~ A2! ~ B2! ~ ~ ~";
const BOSS_RIFF =
  "E2 E2 E2 E2 F2! ~ E2 . E2 E2 E2 E2 A#2! ~ A2! ~ " +
  "E2 E2 E2 E2 F2! ~ E2 . G2! ~ F#2! ~ F2! ~ E2! ~ " +
  "E2 E2 E2 E2 F2! ~ E2 . E2 E2 E2 E2 A#2! ~ A2! ~ " +
  "E2 E2 E2 E2 C3! ~ B2! ~ A#2! ~ A2! ~ G#2! ~ G2! ~";
const SONGS = {
  title: { bpm:92, loop:true, ch:{
    organ:{ inst:'organ', vol:0.07, steps:parse(
      "E4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ C4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ " +
      "D4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ B3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~") },
    organ2:{ inst:'organ', vol:0.05, steps:parse(
      "B4 ~ ~ ~ ~ ~ ~ ~ G4 ~ ~ ~ ~ ~ ~ ~ G4 ~ ~ ~ ~ ~ ~ ~ E4 ~ ~ ~ ~ ~ ~ ~ " +
      "A4 ~ ~ ~ ~ ~ ~ ~ F#4 ~ ~ ~ ~ ~ ~ ~ F#4 ~ ~ ~ ~ ~ ~ ~ D#4 ~ ~ ~ ~ ~ ~ ~") },
    gtr:{ inst:'gtr', vol:0.5, steps:parse(
      "E2! ~ ~ ~ ~ ~ ~ ~ . . . . . . E2 E2 C2! ~ ~ ~ ~ ~ ~ ~ . . . . . . C2 C2 " +
      "D2! ~ ~ ~ ~ ~ ~ ~ . . . . . . D2 D2 B1! ~ ~ ~ ~ ~ ~ ~ . . B1 . B1 . B1 B1") },
    drum:{ steps:parse(rep("K . . . . . . . S . . . . . . .", 7) + " K . . . S . . . S . S . S S S S") },
  }},
  stage: { bpm:150, loop:true, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse(RIFF) },
    bass:{ inst:'bass', vol:0.3, steps:parse(RIFF) },
    lead:{ inst:'lead', vol:0.05, steps:parse(
      "E5 ~ . . . . . . . . . . . . . . " + rep(". . . . . . . . . . . . . . . .", 2) +
      "B4 ~ . . . . . . A#4 . B4 . D5 . E5 . " +
      "E4 ~ ~ ~ G4 ~ A4 ~ B4 ~ ~ ~ A4 ~ G4 ~ " +
      "A4 ~ G4 ~ E4 ~ ~ ~ D4 ~ E4 ~ ~ ~ ~ ~ " +
      "C5 ~ ~ ~ B4 ~ A4 ~ G4 ~ A4 ~ B4 ~ ~ ~ " +
      "E5 ~ D5 ~ B4 ~ A4 ~ G4 ~ A4 ~ B4 ~ D5 ~") },
    drum:{ steps:parse("C . h . S . h . K . K h S . h h " + rep("K . h . S . h . K . K h S . h h", 6) + " S S S S S . S S S S S S K K K K") },
  }},
  party: { bpm:164, loop:true, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse(PARTY_RIFF) },
    bass:{ inst:'bass', vol:0.3, steps:parse(PARTY_RIFF) },
    lead:{ inst:'lead', vol:0.05, steps:parse(
      rep(". . . . . . . . . . . . . . . .", 3) + "A4 . C5 . D5 . E5 . G5 . E5 . D5 . C5 . " +
      "A5 ~ ~ ~ G5 ~ E5 ~ ~ ~ D5 ~ E5 ~ ~ ~ " +
      "C5 ~ D5 ~ E5 ~ ~ ~ G5 ~ A5 ~ ~ ~ ~ ~ " +
      "F5 ~ ~ ~ E5 ~ D5 ~ C5 ~ D5 ~ E5 ~ ~ ~ " +
      "A4 ~ C5 ~ D5 ~ E5 ~ G5 ~ E5 ~ A5 ~ ~ ~") },
    drum:{ steps:parse("C . h h S . h h K K h h S . h h " + rep("K . h h S . h h K K h h S . h K", 6) + " S S K S S K S S K K S S C . . .") },
  }},
  upstairs: { bpm:158, loop:true, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse(UP_RIFF) },
    bass:{ inst:'bass', vol:0.3, steps:parse(UP_RIFF) },
    organ:{ inst:'organ', vol:0.035, steps:parse(
      "D5 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ " + rep(". . . . . . . . . . . . . . . .", 3)) },
    lead:{ inst:'lead', vol:0.05, steps:parse(
      rep(". . . . . . . . . . . . . . . .", 4) +
      "D5 ~ ~ ~ F5 ~ E5 ~ D5 ~ C5 ~ A4 ~ ~ ~ " +
      "A#4 ~ ~ ~ A4 ~ G4 ~ A4 ~ ~ ~ ~ ~ ~ ~ " +
      "F5 ~ ~ ~ E5 ~ D5 ~ C5 ~ D5 ~ E5 ~ ~ ~ " +
      "D5 ~ F5 ~ A5 ~ G#5 ~ G5 ~ F5 ~ D5 ~ ~ ~") },
    drum:{ steps:parse("C . h . S . h h K . K h S . h . " + rep("K . h . S . h h K . K h S . h .", 6) + " S . S . S S K . S S S S C . . .") },
  }},
  attic: { bpm:112, loop:true, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse(ATTIC_RIFF) },
    bass:{ inst:'bass', vol:0.32, steps:parse(ATTIC_RIFF) },
    organ:{ inst:'organ', vol:0.05, steps:parse(
      "C4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ C4 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ " +
      "G#3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ G3 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~") },
    lead:{ inst:'lead', vol:0.045, steps:parse(
      rep(". . . . . . . . . . . . . . . .", 4) +
      "C5 ~ ~ ~ D#5 ~ ~ ~ D5 ~ C#5 ~ C5 ~ ~ ~ " +
      "G4 ~ ~ ~ F#4 ~ ~ ~ G4 ~ ~ ~ ~ ~ ~ ~ " +
      "G#4 ~ ~ ~ A#4 ~ ~ ~ C5 ~ ~ ~ D5 ~ ~ ~ " +
      "D#5 ~ D5 ~ C5 ~ A#4 ~ G4 ~ ~ ~ ~ ~ ~ ~") },
    drum:{ steps:parse("C . . . S . . . K . K . S . . . " + rep("K . . . S . . h K . K . S . . h", 6) + " S . S . S . S S K K K K C . . .") },
  }},
  roof: { bpm:176, loop:true, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse(ROOF_RIFF) },
    bass:{ inst:'bass', vol:0.3, steps:parse(ROOF_RIFF) },
    lead:{ inst:'lead', vol:0.05, steps:parse(
      rep(". . . . . . . . . . . . . . . .", 4) +
      "B4 ~ ~ ~ E5 ~ ~ ~ G5 ~ F#5 ~ E5 ~ D5 ~ " +
      "E5 ~ ~ ~ B4 ~ ~ ~ D5 ~ C5 ~ B4 ~ A4 ~ " +
      "C5 ~ ~ ~ G5 ~ ~ ~ D5 ~ ~ ~ A5 ~ ~ ~ " +
      "B5 ~ A5 ~ G5 ~ F#5 ~ E5 ~ ~ ~ ~ ~ ~ ~") },
    drum:{ steps:parse("C . h h S . h h K K h h S . h h " + rep("K . h h S . h h K K h h S . h K", 6) + " S S S S K K S S S S K K C . C .") },
  }},
  final: { bpm:184, loop:true, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse(BOSS_RIFF) },
    bass:{ inst:'bass', vol:0.3, steps:parse(BOSS_RIFF) },
    organ:{ inst:'organ', vol:0.06, steps:parse(
      "E5 ~ ~ ~ ~ ~ ~ ~ F5 ~ ~ ~ ~ ~ ~ ~ E5 ~ ~ ~ ~ ~ ~ ~ A#4 ~ ~ ~ ~ ~ ~ ~ " +
      "E5 ~ ~ ~ ~ ~ ~ ~ F5 ~ ~ ~ ~ ~ ~ ~ G5 ~ ~ ~ F5 ~ ~ ~ E5 ~ ~ ~ D5 ~ ~ ~") },
    drum:{ steps:parse(rep("K h S h K K S h K h S h K K S S", 4)) },
  }},
  boss: { bpm:172, loop:true, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse(BOSS_RIFF) },
    bass:{ inst:'bass', vol:0.3, steps:parse(BOSS_RIFF) },
    lead:{ inst:'lead', vol:0.05, steps:parse(
      "B4 ~ ~ ~ A#4 ~ ~ ~ B4 ~ ~ ~ E5 ~ ~ ~ F5 ~ ~ ~ E5 ~ ~ ~ D5 ~ C5 ~ B4 ~ ~ ~ " +
      "B4 ~ ~ ~ A#4 ~ ~ ~ B4 ~ ~ ~ E5 ~ ~ ~ E5 . E5 . F5 . E5 . G5 ~ F5 ~ E5 ~ D5 ~") },
    drum:{ steps:parse("C h S h K K S h K h S h K K S S " + rep("K h S h K K S h K h S h K K S S", 3)) },
  }},
  glory: { bpm:104, loop:true, ch:{
    organ:{ inst:'organ', vol:0.08, steps:parse(
      "C5 ~ ~ ~ E5 ~ G5 ~ ~ ~ ~ ~ E5 ~ C5 ~ D5 ~ ~ ~ F5 ~ A5 ~ ~ ~ ~ ~ G5 ~ ~ ~ " +
      "E5 ~ ~ ~ C5 ~ G4 ~ ~ ~ A4 ~ B4 ~ C5 ~ D5 ~ ~ ~ B4 ~ G4 ~ C5 ~ ~ ~ ~ ~ ~ ~") },
    organ2:{ inst:'organ', vol:0.05, steps:parse(
      "C4 ~ ~ ~ ~ ~ ~ ~ E4 ~ ~ ~ ~ ~ ~ ~ F4 ~ ~ ~ ~ ~ ~ ~ G4 ~ ~ ~ ~ ~ ~ ~ " +
      "C4 ~ ~ ~ ~ ~ ~ ~ F4 ~ ~ ~ ~ ~ ~ ~ G4 ~ ~ ~ ~ ~ ~ ~ C4 ~ ~ ~ ~ ~ ~ ~") },
  }},
  win: { bpm:150, loop:false, ch:{
    gtr:{ inst:'gtr', vol:0.55, steps:parse("E2 E2 G2 A2 E3! ~ ~ ~ ~ ~ . . E2! ~ ~ ~ ~ ~ ~ ~ . . . .") },
    lead:{ inst:'lead', vol:0.06, steps:parse("E5 G5 A5 B5 E6 ~ ~ ~ ~ ~ . . B5 ~ ~ ~ E6 ~ ~ ~ ~ ~ . .") },
    drum:{ steps:parse("K K S S C . . . . . . . K . . . C . . . . . . .") },
  }},
  over: { bpm:84, loop:false, ch:{
    organ:{ inst:'organ', vol:0.08, steps:parse("C5 ~ ~ ~ B4 ~ ~ ~ A#4 ~ ~ ~ A4 ~ ~ ~ ~ ~ ~ ~ . . . .") },
    gtr:{ inst:'gtr', vol:0.5, steps:parse(". . . . . . . . . . . . E1! ~ ~ ~ ~ ~ ~ ~ . . . .") },
  }},
};
for (const k in SONGS) { const s = SONGS[k]; s.len = Math.max(...Object.values(s.ch).map(c => c.steps.length)); }

function sched() {
  if (!AU.ctx || !AU.song) return;
  const s = AU.song, sd = 60 / s.bpm / 4;
  if (AU.next < AU.ctx.currentTime - 0.2) AU.next = AU.ctx.currentTime + 0.02;
  while (AU.song === s && AU.next < AU.ctx.currentTime + 0.12) {
    const i = AU.step, t = AU.next;
    for (const k in s.ch) {
      const c = s.ch[k], ev = c.steps[i % c.steps.length];
      if (!ev) continue;
      if (ev.d) INST.drum(ev.d, t);
      else INST[c.inst](ev.f, t, ev.len * sd * 0.94, c.vol, ev.open);
    }
    AU.step++; AU.next += sd;
    if (AU.step >= s.len) {
      if (s.loop) AU.step = 0;
      else { AU.song = null; const cb = AU.onEnd; AU.onEnd = null; if (cb) setTimeout(cb, sd * 2000); }
    }
  }
}
function playSong(name, onEnd) {
  if (!AU.ctx) { if (onEnd) setTimeout(onEnd, 1800); else AU.pending = { name }; return; }
  if (AU.song === SONGS[name] && SONGS[name].loop) return;
  AU.song = SONGS[name]; AU.step = 0; AU.next = AU.ctx.currentTime + 0.05; AU.onEnd = onEnd || null;
}
function stopSong() { AU.song = null; AU.pending = null; }
const SFX = {
  jump()   { const t = AU.ctx.currentTime; osc('square', 240, t, 0.12, AU.sGain, 0.06, 560); },
  puke()   { const t = AU.ctx.currentTime; osc('sawtooth', 190, t, 0.22, AU.sGain, 0.07, 60); noiseHit(AU.sGain, t, 0.24, 0.3, 'bandpass', 1300, 260, 1.5); },
  splat()  { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.09, 0.22, 'lowpass', 900, 200); },
  hit()    { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.08, 0.3, 'bandpass', 2400); osc('square', 180, t, 0.07, AU.sGain, 0.05, 90); },
  hurt()   { const t = AU.ctx.currentTime; osc('square', 520, t, 0.3, AU.sGain, 0.08, 90); },
  bite()   { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.06, 0.3, 'highpass', 3000); [1320, 1760].forEach((f, i) => osc('triangle', f, t + 0.06 + i * 0.06, 0.08, AU.sGain, 0.08)); },
  pickup() { const t = AU.ctx.currentTime; [0, 4, 7, 12].forEach((s, i) => osc('square', 660 * Math.pow(2, s / 12), t + i * 0.045, 0.07, AU.sGain, 0.05)); },
  power()  { const t = AU.ctx.currentTime; [0, 4, 7, 12, 16, 19, 24, 28].forEach((s, i) => osc('square', 330 * Math.pow(2, s / 12), t + i * 0.04, 0.08, AU.sGain, 0.05)); },
  record() { const t = AU.ctx.currentTime; [0, 7, 12, 19, 24].forEach((s, i) => osc('triangle', 520 * Math.pow(2, s / 12), t + i * 0.07, 0.14, AU.sGain, 0.1)); },
  empty()  { const t = AU.ctx.currentTime; osc('sawtooth', 95, t, 0.25, AU.sGain, 0.05, 55); },
  purge()  { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.45, 0.25, 'bandpass', 5000, 600, 0.7); osc('sine', 900, t, 0.3, AU.sGain, 0.06, 200); },
  tvhit()  { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.1, 0.3, 'highpass', 4000); osc('square', 60, t, 0.1, AU.sGain, 0.06); },
  tvdie()  { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.7, 0.4, 'bandpass', 3000, 300); osc('sine', 15000, t, 0.4, AU.sGain, 0.02, 400); },
  zap()    { const t = AU.ctx.currentTime; osc('sawtooth', 120, t, 0.4, AU.sGain, 0.06, 900); },
  bossHit(){ const t = AU.ctx.currentTime; osc('square', 120, t, 0.12, AU.sGain, 0.08, 60); noiseHit(AU.sGain, t, 0.1, 0.3, 'lowpass', 1500); },
  boom()   { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.6, 0.55, 'lowpass', 1400, 70); osc('sine', 90, t, 0.4, AU.sGain, 0.3, 30); },
  crash()  { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.9, 0.4, 'highpass', 4500); },
  stick()  { const t = AU.ctx.currentTime; osc('triangle', 1100, t, 0.04, AU.sGain, 0.06, 1500); },
  pause()  { const t = AU.ctx.currentTime; osc('square', 990, t, 0.06, AU.sGain, 0.05); osc('square', 660, t + 0.08, 0.08, AU.sGain, 0.05); },
  select() { const t = AU.ctx.currentTime; osc('square', 880, t, 0.05, AU.sGain, 0.05); },
  check()  { const t = AU.ctx.currentTime; [0, 7, 12].forEach((s, i) => osc('triangle', 520 * Math.pow(2, s / 12), t + i * 0.07, 0.1, AU.sGain, 0.1)); },
  die()    { const t = AU.ctx.currentTime; osc('sawtooth', 600, t, 0.8, AU.sGain, 0.07, 50); },
  slip()   { const t = AU.ctx.currentTime; osc('triangle', 300, t, 0.2, AU.sGain, 0.1, 1200); },
  clink()  { const t = AU.ctx.currentTime; osc('triangle', 1700, t, 0.05, AU.sGain, 0.05, 2000); osc('triangle', 2500, t + 0.03, 0.04, AU.sGain, 0.03); },
  charge() { const t = AU.ctx.currentTime; osc('sawtooth', 90, t, 0.35, AU.sGain, 0.07, 220); noiseHit(AU.sGain, t, 0.3, 0.2, 'bandpass', 600, 1800); },
  toss()   { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.08, 0.15, 'bandpass', 3000, 1200); },
  backward(){ const t = AU.ctx.currentTime; osc('sawtooth', 200, t, 0.9, AU.sGain, 0.05, 900); osc('square', 700, t + 0.2, 0.7, AU.sGain, 0.03, 150); },
  fart()   {
    const t = AU.ctx.currentTime, c = AU.ctx;
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.45);
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 520;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.02); g.gain.linearRampToValueAtTime(0.0001, t + 0.48);
    const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.setValueAtTime(34, t); lfo.frequency.linearRampToValueAtTime(18, t + 0.45);
    const ld = c.createGain(); ld.gain.value = 0.07; lfo.connect(ld); ld.connect(g.gain);
    o.connect(fl); fl.connect(g); g.connect(AU.sGain); o.start(t); o.stop(t + 0.5); lfo.start(t); lfo.stop(t + 0.5);
    noiseHit(AU.sGain, t, 0.3, 0.12, 'bandpass', 300, 120, 1.5);
  },
  feedback(){ const t = AU.ctx.currentTime; osc('square', 1760, t, 0.6, AU.sGain, 0.05, 2400); osc('sawtooth', 110, t, 0.5, AU.sGain, 0.12, 55); noiseHit(AU.sGain, t, 0.5, 0.3, 'bandpass', 2000, 400, 2); },
  honk()   { const t = AU.ctx.currentTime; [0, 0.22].forEach(d => { osc('square', 330, t + d, 0.16, AU.sGain, 0.07); osc('square', 415, t + d, 0.16, AU.sGain, 0.05); }); },
  flush()  { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 1.1, 0.35, 'lowpass', 1800, 200, 1); osc('sine', 300, t + 0.2, 0.6, AU.sGain, 0.08, 90); },
  doll()   { const t = AU.ctx.currentTime; [0, 3, 7, 3, 12].forEach((s, i) => osc('triangle', 1046 * Math.pow(2, s / 12), t + i * 0.07, 0.09, AU.sGain, 0.04)); },
  shatter(){ const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.25, 0.3, 'highpass', 5000); [2600, 3400, 2100].forEach((f, i) => osc('triangle', f, t + i * 0.03, 0.06, AU.sGain, 0.05)); },
  scratch(){ const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.18, 0.3, 'bandpass', 800, 2600, 3); noiseHit(AU.sGain, t + 0.18, 0.14, 0.25, 'bandpass', 2600, 700, 3); },
  dice()   { const t = AU.ctx.currentTime; for (let i = 0; i < 6; i++) noiseHit(AU.sGain, t + i * 0.06, 0.03, 0.25, 'bandpass', 3000 + i * 300); [0, 4, 7, 12, 16].forEach((s, i) => osc('square', 523 * Math.pow(2, s / 12), t + 0.4 + i * 0.06, 0.1, AU.sGain, 0.05)); },
  meow()   { const t = AU.ctx.currentTime; osc('sawtooth', 600, t, 0.35, AU.sGain, 0.05, 900); osc('sawtooth', 900, t + 0.15, 0.3, AU.sGain, 0.04, 500); },
  wind()   { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 2.2, 0.18, 'bandpass', 400, 1200, 1); },
  thunder(){ const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 1.6, 0.4, 'lowpass', 600, 60); osc('sine', 50, t, 1.2, AU.sGain, 0.15, 30); },
  boing()  { const t = AU.ctx.currentTime; osc('sine', 140, t, 0.28, AU.sGain, 0.14, 420); osc('triangle', 280, t + 0.02, 0.2, AU.sGain, 0.05, 700); },
  strum()  { const t = AU.ctx.currentTime; [0, 4, 7, 12].forEach((s, i) => osc('triangle', 392 * Math.pow(2, s / 12), t + i * 0.025, 0.3, AU.sGain, 0.05)); },
  whip()   { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.16, 0.3, 'bandpass', 600, 3500, 1.2); },
  snot()   { const t = AU.ctx.currentTime; noiseHit(AU.sGain, t, 0.05, 0.25, 'lowpass', 500); noiseHit(AU.sGain, t + 0.05, 0.14, 0.3, 'bandpass', 2600, 900, 2); osc('square', 700, t + 0.05, 0.1, AU.sGain, 0.04, 1400); },
  type()   { const t = AU.ctx.currentTime; osc('square', 1300, t, 0.015, AU.sGain, 0.02); },
};
function sfx(name) { if (AU.ctx && AU.on) try { SFX[name](); } catch (e) {} }
