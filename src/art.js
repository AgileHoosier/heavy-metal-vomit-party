/* =========================================================
   ART: 16-bit procedural pixel painter + every sprite
   ========================================================= */
const W = 320, H = 240, T = 16, HUD = 24;
const OUT = '#140b1a';

function canvasOf(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  return [c, x];
}
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const _rgb = {};
function rgbOf(h) {
  if (_rgb[h]) return _rgb[h];
  const n = parseInt(h.slice(1), 16);
  return (_rgb[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
}
// Paint into an offscreen canvas pixel by pixel, then trace a 1px dark outline around the silhouette.
function paint(w, h, fn, outline = OUT) {
  const [c, x] = canvasOf(w, h);
  const img = x.createImageData(w, h), d = img.data;
  const set = (X, Y, col) => {
    X = Math.round(X); Y = Math.round(Y);
    if (X < 0 || Y < 0 || X >= w || Y >= h) return;
    const i = (Y * w + X) * 4;
    if (col === null) { d[i + 3] = 0; return; }
    const r = rgbOf(col); d[i] = r[0]; d[i + 1] = r[1]; d[i + 2] = r[2]; d[i + 3] = 255;
  };
  const has = (X, Y) => X >= 0 && Y >= 0 && X < w && Y < h && d[(Y * w + X) * 4 + 3] > 0;
  const g = {
    w, h, px:set, has,
    rect(X, Y, Wd, Hd, col) { for (let yy = 0; yy < Hd; yy++) for (let xx = 0; xx < Wd; xx++) set(X + xx, Y + yy, col); },
    line(x0, y0, x1, y1, col, th = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1), o = Math.floor((th - 1) / 2);
      for (let i = 0; i <= n; i++) {
        const X = Math.round(x0 + (x1 - x0) * i / n), Y = Math.round(y0 + (y1 - y0) * i / n);
        for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) set(X - o + a, Y - o + b, col);
      }
    },
    ell(cx, cy, rx, ry, col) {
      for (let yy = -ry; yy <= ry; yy++) {
        const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry || 1))));
        for (let xx = -hw; xx <= hw; xx++) set(cx + xx, cy + yy, col);
      }
    },
    recolor(from, to) { const a = rgbOf(from), b = rgbOf(to); for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] === a[0] && d[i + 1] === a[1] && d[i + 2] === a[2]) { d[i] = b[0]; d[i + 1] = b[1]; d[i + 2] = b[2]; } },
  };
  fn(g);
  if (outline) {
    const marks = [];
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      if (has(xx, yy)) continue;
      if (has(xx - 1, yy) || has(xx + 1, yy) || has(xx, yy - 1) || has(xx, yy + 1)) marks.push(xx, yy);
    }
    for (let i = 0; i < marks.length; i += 2) set(marks[i], marks[i + 1], outline);
  }
  x.putImageData(img, 0, 0);
  return c;
}
function flipC(src) { const [c, x] = canvasOf(src.width, src.height); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; }
function tintC(src, col, a) {
  const [c, x] = canvasOf(src.width, src.height);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  return c;
}
const pair = c => [c, flipC(c)];
const pick = (pr, face) => face > 0 ? pr[0] : pr[1];

/* ---------- humanoid rig (facing right, 30x40, feet on row 38) ---------- */
function humanoid(S, P) {
  return paint(30, 40, g => {
    const bob = P.bob || 0, lean = P.lean || 0;
    const shY = 15 + bob;
    const headTop = 4 + bob + (P.headDy || 0);
    const hx = 12 + lean + (P.headDx || 0);
    const tx = 11 + Math.round(lean * 0.5);
    const fF = P.footF || [17, 38], fB = P.footB || [12, 38];
    const hF = P.handF || [19, shY + 10], hB = P.handB || [12, shY + 10];
    const hipF = [17, 27], hipB = [13, 27];

    const leg = (hip, foot, pc, sc, skinC, rip) => {
      const ankle = [foot[0], foot[1] - 3];
      const knee = [Math.round((hip[0] + ankle[0]) / 2 + (P.kneeBend || 1)), Math.round((hip[1] + ankle[1]) / 2)];
      g.line(hip[0], hip[1], knee[0], knee[1], pc, 4);
      g.line(knee[0], knee[1], ankle[0], ankle[1], pc, 4);
      if (rip) { g.px(knee[0], knee[1], skinC); g.px(knee[0] + 1, knee[1], skinC); }
      if (S.legwarmers) { g.line(knee[0], knee[1] + 2, ankle[0], ankle[1], pc === S.pants ? S.legwarmers : S.legwarmersS, 5); for (let yy = knee[1] + 3; yy < ankle[1]; yy += 2) g.px(ankle[0] + 1, yy, S.legwarmersS); }
      g.rect(ankle[0] - 2, foot[1] - 2, 7, 3, sc[0]);
      g.rect(ankle[0] - 2, foot[1], 7, 1, sc[1]);
      if (S.hightop) g.rect(ankle[0] - 2, foot[1] - 3, 4, 1, sc[0]);
    };
    const arm = (sh, hand, sleeve, skin, hasSleeve) => {
      const mid = [Math.round(sh[0] + (hand[0] - sh[0]) * 0.4), Math.round(sh[1] + (hand[1] - sh[1]) * 0.4)];
      g.line(sh[0], sh[1], hand[0], hand[1], skin, 3);
      if (hasSleeve) g.line(sh[0], sh[1], mid[0], mid[1], sleeve, 3);
      g.rect(hand[0] - 1, hand[1] - 1, 3, 3, skin);
      if (S.wristband && sleeve !== S.vest) g.px(Math.round((mid[0] + hand[0]) / 2) + 1, Math.round((mid[1] + hand[1]) / 2) + 1, '#d8d8e0');
    };

    // back arm + back leg (shaded)
    leg(hipB, fB, S.pantsS, [S.shoeS, S.shoeS2 || OUT], S.skinS, false);
    arm([tx + 3, shY + 1], hB, S.sleeveS, S.skinS, S.sleeves !== false);

    // big hair / mullet volume behind the head
    if (S.hair === 'big') { g.ell(hx + 3, headTop + 4, 8, 7, S.hairS); g.ell(hx + 3, headTop + 3, 7, 6, S.hairC); for (let i = 0; i < 5; i++) g.px(hx - 3 + i * 3, headTop - 1 + (i % 2) * 2, S.hairH); }
    if (S.hair === 'mullet') { g.rect(hx - 3, headTop + 2, 6, 13, S.hairS); g.rect(hx - 2, headTop + 2, 4, 12, S.hairC); g.px(hx - 1, headTop + 9, S.hairH); }
    // long hair falls behind the shoulders
    if (S.hair === 'long' && !P.hairFwd) {
      const sw = P.sway || 0;
      g.rect(hx - 3, headTop + 2, 6, 13, S.hairS);
      g.rect(hx - 4 + sw, headTop + 10, 6, 7, S.hairS);
      g.rect(hx - 2, headTop + 2, 4, 11, S.hairC);
      g.px(hx - 1, headTop + 5, S.hairH); g.px(hx, headTop + 8, S.hairH); g.px(hx - 2 + sw, headTop + 13, S.hairH);
    }

    // torso
    g.rect(tx, shY, 10, 11, S.shirt);
    g.rect(tx, shY, 2, 11, S.shirtS);
    g.rect(tx + 1, shY - 1, 8, 1, S.shirt);
    if (S.cross) { g.rect(tx + 5, shY + 2, 2, 7, S.cross); g.rect(tx + 3, shY + 4, 6, 2, S.cross); }
    if (S.logo) { const L = S.logo; g.px(tx + 4, shY + 3, L); g.px(tx + 5, shY + 4, L); g.px(tx + 6, shY + 5, L); g.px(tx + 7, shY + 4, L); g.px(tx + 8, shY + 3, L); g.rect(tx + 4, shY + 7, 5, 1, L); }
    if (S.vest) {
      g.rect(tx, shY + 1, 10, 10, S.vest);
      g.rect(tx, shY + 1, 2, 10, S.vestS);
      for (let k = 0; k < 3; k++) { const yy = shY + 3 + k * 3; g.px(tx + 4, yy, S.vestH); g.px(tx + 3, yy + 1, S.vestH); g.px(tx + 5, yy + 1, S.vestH); g.px(tx + 4, yy + 2, S.vestH); }
      g.rect(tx + 6, shY, 3, 3, S.collar || '#eeeef4');
      g.px(tx + 7, shY + 3, S.collar || '#eeeef4');
      g.rect(tx + 7, shY + 1, 2, 9, S.tie || '#c82830');
      g.px(tx + 7, shY + 1, '#8a1018');
    }
    // belt
    g.rect(tx, shY + 11, 10, 2, S.belt || '#2a1a12');
    g.px(tx + 7, shY + 11, '#e8c048');

    // front leg, front arm
    leg(hipF, fF, S.pants, [S.shoe, S.shoeS], S.skin, S.rips);
    if (S.robe) { g.rect(tx - 1, shY + 11, 12, 9, S.shirt); g.rect(tx - 1, shY + 11, 2, 9, S.shirtS); g.rect(tx + 7, shY + 11, 1, 9, S.shirtS); g.rect(tx - 1, shY + 11, 12, 1, S.robe); }
    if (S.holding === 'pamphlets') g.rect(hF[0] - 1, hF[1] - 5, 5, 6, '#f4f0e0'), g.rect(hF[0] - 1, hF[1] - 5, 5, 1, '#e0b040');
    if (S.holding === 'acoustic') {
      g.line(tx + 7, shY + 9, tx + 18, shY + 2, '#5a3418', 2); g.rect(tx + 17, shY, 3, 3, '#3a2010'); g.px(tx + 18, shY - 1, '#e8e8f0');
      g.ell(tx + 4, shY + 10, 5, 4, '#d89848'); g.ell(tx + 3, shY + 10, 3, 3, '#e8b060'); g.ell(tx + 5, shY + 9, 1, 1, '#2a1408');
      g.rect(tx + 1, shY + 13, 6, 1, '#8a5428');
    }
    if (S.holding === 'clipboard') { g.rect(hF[0] - 2, hF[1] - 8, 7, 9, '#8a5428'); g.rect(hF[0] - 1, hF[1] - 6, 5, 6, '#f8f4e4'); g.rect(hF[0], hF[1] - 9, 3, 2, '#c8c4d4'); g.px(hF[0], hF[1] - 4, '#c02030'); g.px(hF[0] + 2, hF[1] - 2, '#c02030'); }
    arm([tx + 7, shY + 1], hF, S.sleeve, S.skin, S.sleeves !== false);

    // neck + head
    g.rect(hx + 3, headTop + 9, 3, 3, S.skinS);
    g.rect(hx, headTop + 1, 9, 9, S.skin);
    g.px(hx, headTop + 1, null); g.px(hx + 8, headTop + 9, null);
    g.rect(hx, headTop + 2, 2, 7, S.skinS);
    g.rect(hx + 4, headTop + 9, 4, 1, S.skin);           // jaw
    g.px(hx + 9, headTop + 5, S.skin);                   // nose
    g.px(hx + 3, headTop + 5, S.skinS); g.px(hx + 3, headTop + 6, S.skinS);  // ear
    // eyes
    if (S.glow) { g.rect(hx + 6, headTop + 4, 2, 1, S.glow); g.px(hx + 8, headTop + 4, S.glow); }
    else { g.px(hx + 6, headTop + 4, OUT); g.px(hx + 6, headTop + 5, OUT); g.px(hx + 7, headTop + 3, S.brow || S.hairC); g.px(hx + 6, headTop + 3, S.brow || S.hairC); }
    // mouth
    if (P.mouth === 'puke') {
      g.rect(hx + 6, headTop + 7, 4, 2, '#7a1828');
      g.rect(hx + 8, headTop + 7, 4, 2, '#8ad020'); g.px(hx + 11, headTop + 9, '#c8f040'); g.px(hx + 10, headTop + 9, '#5aa018');
    } else if (S.fangs) {
      g.rect(hx + 4, headTop + 7, 5, 1, '#5a1020');
      g.px(hx + 5, headTop + 8, '#ffffff'); g.px(hx + 8, headTop + 8, '#ffffff');
    } else if (P.mouth === 'open') {
      g.rect(hx + 6, headTop + 7, 2, 2, '#5a1020');
    } else g.rect(hx + 6, headTop + 7, 2, 1, S.skinS);
    if (S.headband) { g.rect(hx - 1, headTop + 1, 10, 2, S.headband); g.px(hx + 2, headTop + 1, '#ffffff'); }
    if (S.glasses) { g.rect(hx + 5, headTop + 3, 4, 3, '#202838'); g.rect(hx + 6, headTop + 4, 2, 1, S.glow || '#a8d8f8'); }

    // hair on top
    if (S.hair === 'long') {
      if (P.hairFwd) {
        g.rect(hx - 1, headTop - 1, 11, 4, S.hairC);
        g.rect(hx + 3, headTop + 2, 8, 9, S.hairC);
        g.rect(hx + 5, headTop + 10, 6, 4, S.hairS);
        g.px(hx + 4, headTop + 4, S.hairH); g.px(hx + 8, headTop + 6, S.hairH); g.px(hx + 6, headTop + 11, S.hairH);
      } else {
        g.rect(hx - 1, headTop - 1, 10, 3, S.hairC);
        g.rect(hx + 5, headTop + 1, 4, 2, S.hairC);
        g.rect(hx - 1, headTop, 3, 9, S.hairC);
        g.px(hx + 2, headTop - 1, S.hairH); g.px(hx + 3, headTop - 1, S.hairH); g.px(hx + 6, headTop, S.hairH);
      }
    } else if (S.hair === 'short') {
      g.rect(hx - 1, headTop - 1, 10, 3, S.hairC);
      g.rect(hx - 1, headTop, 3, 6, S.hairC);
      g.rect(hx + 1, headTop - 1, 6, 1, S.hairH);
    } else if (S.hair === 'big') {
      g.rect(hx - 2, headTop - 2, 12, 4, S.hairC); g.rect(hx + 5, headTop + 1, 5, 2, S.hairC); g.rect(hx - 2, headTop, 3, 8, S.hairC);
      g.px(hx + 1, headTop - 2, S.hairH); g.px(hx + 5, headTop - 2, S.hairH); g.px(hx + 8, headTop - 1, S.hairH);
    } else if (S.hair === 'mullet') {
      g.rect(hx - 1, headTop - 1, 10, 3, S.hairC); g.rect(hx - 1, headTop, 3, 7, S.hairC); g.rect(hx + 1, headTop - 1, 6, 1, S.hairH);
    } else if (S.hair === 'curlers') {
      g.rect(hx - 1, headTop - 2, 11, 4, S.hairC); g.rect(hx - 1, headTop, 3, 6, S.hairC);
      for (let i = 0; i < 4; i++) { g.rect(hx - 1 + i * 3, headTop - 3, 2, 2, '#ff90c8'); g.px(hx - 1 + i * 3, headTop - 3, '#ffd0e8'); }
      g.rect(hx - 3, headTop + 1, 2, 2, '#ff90c8');
    } else if (S.hair === 'capback') {
      g.rect(hx - 1, headTop - 1, 10, 3, S.capC); g.rect(hx - 4, headTop + 1, 4, 1, S.capC); g.px(hx + 4, headTop - 1, '#ffffff');
      g.rect(hx + 5, headTop + 2, 4, 1, S.hairC); g.rect(hx - 1, headTop + 2, 3, 4, S.hairC); g.px(hx + 7, headTop + 3, S.hairH);
    } else if (S.hair === 'cap') {
      g.rect(hx - 1, headTop - 1, 10, 3, S.capC);
      g.rect(hx + 8, headTop + 1, 4, 1, S.capC);
    }
  });
}

/* ---------- pose library ---------- */
function runPose(p, extra = {}) {
  const s = Math.sin(p * Math.PI * 2), c = Math.cos(p * Math.PI * 2);
  return Object.assign({
    footF:[15 + Math.round(6 * s), 38 - Math.max(0, Math.round(3 * c))],
    footB:[15 - Math.round(6 * s), 38 - Math.max(0, Math.round(-3 * c))],
    handF:[17 - Math.round(4 * s), 25], handB:[15 + Math.round(4 * s), 25],
    bob:Math.abs(c) > 0.7 ? 0 : 1, lean:1, kneeBend:2, sway:Math.round(-s),
  }, extra);
}
const IDLE = (b) => ({ footF:[18, 38], footB:[12, 38], handF:[19, 25 + b], handB:[12, 25 + b], bob:b });

/* ---------- character specs ---------- */
const HERO_S = {
  skin:'#f2c49a', skinS:'#c98d63', hair:'long', hairC:'#5e3519', hairS:'#3b1f0d', hairH:'#93592a',
  shirt:'#1e1a28', shirtS:'#0f0c17', sleeve:'#1e1a28', sleeveS:'#0f0c17', logo:'#9ae030',
  pants:'#4069c0', pantsS:'#2a4588', shoe:'#f2f2f6', shoeS:'#b8b8c8', shoeS2:'#8a8aa0', rips:true, hightop:true, wristband:true,
};
const MOSHER_S = {
  skin:'#c6d3bd', skinS:'#93a88e', glow:'#c8ff3c', fangs:true, hair:'long', hairC:'#e2bf5a', hairS:'#a8862e', hairH:'#fff0a0',
  shirt:'#1e1a28', shirtS:'#0f0c17', sleeve:'#1e1a28', sleeveS:'#0f0c17',
  vest:'#3a6ec8', vestS:'#244c94', vestH:'#f0d040', tie:'#d02838',
  pants:'#4a5470', pantsS:'#323a52', shoe:'#1a1420', shoeS:'#0a080e', rips:true,
};
const PUSHER_S = {
  skin:'#c6d3bd', skinS:'#93a88e', glow:'#c8ff3c', fangs:true, glasses:true, hair:'short', hairC:'#3a2a20', hairH:'#6a5040',
  shirt:'#ececf4', shirtS:'#b8b8cc', sleeve:'#ececf4', sleeveS:'#b8b8cc',
  vest:'#c84870', vestS:'#923050', vestH:'#f8e0a0', tie:'#2840a0', collar:'#ffffff',
  pants:'#b89a68', pantsS:'#8a7048', shoe:'#6a3a1a', shoeS:'#40200c', holding:'pamphlets',
};
function unpossessed(S, skin, skinS) { return Object.assign({}, S, { skin, skinS, glow:null, fangs:false, vest:null, holding:null, glasses:false }); }
const ROXY_S = {
  skin:'#f4cfae', skinS:'#cc9a78', hair:'long', hairC:'#e0386a', hairS:'#9a1c44', hairH:'#ff88aa',
  shirt:'#24142c', shirtS:'#120a18', sleeves:false, sleeve:'#24142c', sleeveS:'#120a18',
  pants:'#1a1420', pantsS:'#0c0a10', shoe:'#c02038', shoeS:'#801020', wristband:true,
};

function buildSet(S) {
  const run = [], runP = [];
  for (let i = 0; i < 6; i++) { run.push(pair(humanoid(S, runPose(i / 6)))); runP.push(pair(humanoid(S, runPose(i / 6, { mouth:'puke', headDx:1, headDy:1 })))); }
  const set = {
    idle:[pair(humanoid(S, IDLE(0))), pair(humanoid(S, IDLE(1)))],
    idleP:[pair(humanoid(S, Object.assign(IDLE(0), { mouth:'puke', headDx:1, headDy:1, handF:[21, 23] }))), pair(humanoid(S, Object.assign(IDLE(1), { mouth:'puke', headDx:1, headDy:2, handF:[21, 24] })))],
    run, runP,
    jump:pair(humanoid(S, { footF:[20, 34], footB:[11, 37], handF:[22, 16], handB:[10, 17], kneeBend:3 })),
    jumpP:pair(humanoid(S, { footF:[20, 34], footB:[11, 37], handF:[22, 18], handB:[10, 17], kneeBend:3, mouth:'puke', headDx:1, headDy:1 })),
    fall:pair(humanoid(S, { footF:[18, 38], footB:[11, 37], handF:[23, 19], handB:[8, 18], mouth:'open' })),
    fallP:pair(humanoid(S, { footF:[18, 38], footB:[11, 37], handF:[23, 21], handB:[8, 18], mouth:'puke', headDx:1, headDy:1 })),
    hurt:pair(humanoid(S, { footF:[16, 38], footB:[11, 38], handF:[21, 12], handB:[10, 13], lean:-2, headDx:-1, mouth:'open' })),
    snot:pair(humanoid(S, Object.assign(IDLE(0), { handF:[22, 12], handB:[12, 25], headDx:1, lean:1 }))),
    fart:pair(humanoid(S, { footF:[20, 38], footB:[10, 38], handF:[22, 22], handB:[8, 20], lean:3, headDx:2, headDy:1, mouth:'open' })),
  };
  return set;
}
const HERO = buildSet(HERO_S);
// Party Punch glow version of every hero frame
function tintSet(set, col, a) {
  const out = {};
  for (const k in set) {
    const v = set[k];
    if (Array.isArray(v[0])) out[k] = v.map(p => [tintC(p[0], col, a), tintC(p[1], col, a)]);
    else out[k] = [tintC(v[0], col, a), tintC(v[1], col, a)];
  }
  return out;
}
const HERO_PUNCH = tintSet(HERO, '#ff60c0', 0.32);

function enemySet(S, kind) {
  const walk = [], walkW = [];
  for (let i = 0; i < 4; i++) {
    const p = runPose(i / 4, { lean:0, handF:[24, 21 + (i % 2)], handB:[22, 22 - (i % 2)] });
    if (kind === 'pusher') { p.handF = [21, 24]; p.handB = [14, 25 + (i % 2)]; }
    const c = humanoid(S, p); walk.push(pair(c)); walkW.push(pair(tintC(c, '#ffffff', 0.85)));
  }
  const set = { walk, walkW };
  if (kind === 'mosher') {
    set.bang = [pair(humanoid(S, Object.assign(IDLE(0), { hairFwd:true, headDy:4, headDx:3, lean:2, handF:[22, 30], handB:[10, 30] }))), pair(humanoid(S, Object.assign(IDLE(1), { headDy:0, lean:1 })))];
    set.charge = [0, 1].map(i => pair(humanoid(S, runPose(i / 2 + 0.25, { lean:4, headDx:2, headDy:2, handF:[27, 20], handB:[25, 22] }))));
    set.dizzy = pair(humanoid(S, Object.assign(IDLE(0), { headDx:-1, handF:[20, 28], handB:[11, 28] })));
  } else {
    set.wind = pair(humanoid(S, Object.assign(IDLE(0), { handF:[11, 9], handB:[12, 24], lean:-1 })));
    set.toss = pair(humanoid(S, Object.assign(IDLE(0), { handF:[26, 15], handB:[12, 24], lean:2 })));
  }
  set.dazed = [0, 1, 2, 3].map(i => pair(humanoid(unpossessed(S, '#f0c8a0', '#c8946a'), runPose(i / 4, { lean:-1, headDx:-1, handF:[20, 30], handB:[10, 30] }))));
  return set;
}
const MOSHER = enemySet(MOSHER_S, 'mosher');
const PUSHER = enemySet(PUSHER_S, 'pusher');
const ROXY = pair(humanoid(ROXY_S, Object.assign(IDLE(0), { handF:[22, 12], mouth:'open' })));
const ROXY_DRAG = pair(humanoid(ROXY_S, { footF:[22, 36], footB:[16, 38], handF:[27, 14], handB:[10, 12], lean:3, mouth:'open' }));

/* ---------- rat ---------- */
function ratFrame(f) {
  return paint(24, 13, g => {
    g.line(1, 9, 5, 8 - f, '#e898a8', 1); g.px(0, 10, '#e898a8');
    g.ell(11, 7, 7, 4, '#6a6070'); g.ell(11, 6, 6, 3, '#8a8094'); g.rect(7, 4, 6, 1, '#a49cb0');
    g.ell(18, 7, 3, 3, '#8a8094'); g.px(21, 8, '#f0a0b4'); g.px(19, 6, '#c8ff3c'); g.px(20, 6, '#c8ff3c');
    g.ell(16, 4, 2, 2, '#e898a8'); g.px(16, 4, '#b86878');
    g.rect(7 + f * 2, 11, 2, 1, '#e898a8'); g.rect(15 - f * 2, 11, 2, 1, '#e898a8');
    g.px(20, 10, '#ffffff');
  });
}
const RAT = [pair(ratFrame(0)), pair(ratFrame(1))];
const RAT_W = RAT.map(p => [tintC(p[0], '#ffffff', 0.85), tintC(p[1], '#ffffff', 0.85)]);

/* ---------- the Possessed Drummer (front view, behind his kit) ---------- */
function drummer(up, purged) {
  const sk = purged ? '#f0c8a0' : '#c6d3bd', skS = purged ? '#c8946a' : '#93a88e';
  return paint(40, 34, g => {
    const cx = 20;
    // big hair
    g.ell(cx, 9, 13, 10, '#c89838'); g.ell(cx, 8, 11, 8, '#e8bc58');
    for (let i = 0; i < 6; i++) g.px(cx - 9 + i * 3, 3 + (i % 2), '#fff0a0');
    g.rect(cx - 13, 10, 4, 12, '#c89838'); g.rect(cx + 10, 10, 4, 12, '#c89838');
    // face
    if (purged) {
      g.rect(cx - 5, 9, 10, 9, sk); g.rect(cx - 5, 9, 10, 2, '#e8bc58');
      g.rect(cx - 3, 13, 2, 1, OUT); g.rect(cx + 2, 13, 2, 1, OUT); g.rect(cx - 1, 16, 3, 1, skS);
    } else {
      g.rect(cx - 5, 6, 10, 11, sk); g.rect(cx - 5, 6, 2, 11, skS);
      g.rect(cx - 6, 6, 12, 2, '#d02838');
      g.rect(cx - 4, 10, 3, 1, '#c8ff3c'); g.rect(cx + 2, 10, 3, 1, '#c8ff3c');
      g.rect(cx - 3, 14, 7, 1, '#5a1020'); g.px(cx - 2, 15, '#ffffff'); g.px(cx + 2, 15, '#ffffff');
    }
    // torso: bare arms, sweater vest + tie
    const ty = 18;
    g.rect(cx - 7, ty, 14, 14, sk);
    if (!purged) {
      g.rect(cx - 7, ty, 14, 14, '#3a6ec8'); g.rect(cx - 7, ty, 3, 14, '#244c94');
      for (let k = 0; k < 3; k++) { g.px(cx - 2, ty + 4 + k * 4, '#f0d040'); g.px(cx + 3, ty + 4 + k * 4, '#f0d040'); }
      g.rect(cx - 2, ty, 4, 3, '#eeeef4'); g.rect(cx - 1, ty + 1, 2, 11, '#d02838');
    } else { g.rect(cx - 7, ty, 14, 14, '#1e1a28'); g.px(cx, ty + 5, '#9ae030'); }
    // arms
    const stick = '#f0d890';
    if (purged) {
      g.line(cx - 7, ty + 2, cx - 12, ty + 12, sk, 3); g.line(cx + 7, ty + 2, cx + 12, ty + 12, sk, 3);
    } else if (up) {
      g.line(cx - 7, ty + 1, cx - 13, ty - 8, sk, 3); g.line(cx + 7, ty + 1, cx + 13, ty - 8, sk, 3);
      g.line(cx - 13, ty - 9, cx - 17, ty - 17, stick, 2); g.line(cx + 13, ty - 9, cx + 17, ty - 17, stick, 2);
    } else {
      g.line(cx - 7, ty + 1, cx - 15, ty + 9, sk, 3); g.line(cx + 7, ty + 1, cx + 15, ty + 9, sk, 3);
      g.line(cx - 15, ty + 9, cx - 19, ty + 14, stick, 2); g.line(cx + 15, ty + 9, cx + 19, ty + 14, stick, 2);
    }
  });
}
const DRUM_UP = drummer(true), DRUM_DN = drummer(false), DRUM_PURGED = drummer(false, true);
const DRUM_UP_W = tintC(DRUM_UP, '#ffffff', 0.85), DRUM_DN_W = tintC(DRUM_DN, '#ffffff', 0.85);

/* ---------- Rev. Dewey Dollarson ---------- */
function dewey(size) {
  // size: 'big' (64x60, cutscenes) or 'small' (20x15, TV screens)
  if (size === 'small') {
    return paint(20, 15, g => {
      g.ell(10, 4, 6, 4, '#2a1a10'); g.ell(11, 2, 5, 2, '#3a2418'); g.px(13, 1, '#fff'); g.px(12, 1, '#c8b8a0');
      g.rect(6, 5, 8, 7, '#f0c098'); g.rect(6, 5, 1, 7, '#c88a64');
      g.px(8, 7, OUT); g.px(11, 7, OUT); g.rect(8, 10, 4, 1, '#fff'); g.px(12, 10, '#f0c000');
      g.rect(2, 12, 16, 3, '#f4f4fa'); g.rect(9, 12, 2, 3, '#c02030');
    }, null);
  }
  return paint(64, 60, g => {
    // white suit shoulders
    g.ell(32, 58, 28, 12, '#f2f2f8'); g.ell(32, 60, 26, 10, '#d8d8e4');
    g.rect(27, 46, 10, 14, '#f8f0f0'); g.line(32, 47, 32, 59, '#c02030', 3); g.rect(30, 46, 5, 3, '#a01828');
    g.line(26, 47, 20, 59, '#c8c8d8', 2); g.line(38, 47, 44, 59, '#c8c8d8', 2);
    g.rect(15, 52, 4, 3, '#f0c000'); g.px(16, 52, '#fff8c0');
    // neck + face
    g.rect(27, 38, 10, 9, '#d8a07a');
    g.ell(32, 30, 12, 13, '#f0c098'); g.ell(29, 30, 9, 12, '#f0c098'); g.rect(20, 24, 3, 14, '#c88a64');
    g.ell(20, 31, 2, 3, '#d8a07a'); g.ell(44, 31, 2, 3, '#d8a07a');
    // the pompadour that never moves
    g.ell(33, 15, 15, 9, '#2a1a10'); g.ell(35, 10, 13, 7, '#3a2418'); g.ell(38, 7, 9, 4, '#4a3020');
    g.rect(19, 15, 4, 10, '#2a1a10'); g.rect(42, 15, 4, 10, '#2a1a10');
    g.line(30, 6, 42, 5, '#ffffff', 1); g.line(28, 9, 34, 8, '#c8b8a0', 1);
    // eyes, brows, tears
    g.rect(25, 27, 4, 2, '#ffffff'); g.rect(36, 27, 4, 2, '#ffffff'); g.px(27, 27, OUT); g.px(38, 27, OUT); g.px(27, 28, OUT); g.px(38, 28, OUT);
    g.line(24, 24, 29, 25, '#2a1a10', 1); g.line(35, 25, 40, 24, '#2a1a10', 1);
    g.px(25, 30, '#80c8ff'); g.px(25, 31, '#80c8ff'); g.px(24, 33, '#80c8ff');
    g.rect(31, 29, 2, 6, '#e0a07a'); g.px(33, 34, '#c88a64');
    // the smile, with one gold tooth
    g.rect(26, 37, 13, 4, '#7a1828'); g.rect(26, 37, 13, 2, '#ffffff'); g.px(35, 37, '#f0c000'); g.px(35, 38, '#f0c000');
    g.px(25, 36, '#c88a64'); g.px(39, 36, '#c88a64');
  });
}
const DEWEY_BIG = dewey('big'), DEWEY_SMALL = dewey('small');

/* ---------- objects ---------- */
const TV_BODY = paint(32, 28, g => {
  g.line(10, 6, 4, 0, '#a8a8b8', 1); g.line(20, 6, 27, 0, '#a8a8b8', 1); g.px(4, 0, '#e8e8f0'); g.px(27, 0, '#e8e8f0');
  g.rect(13, 4, 6, 3, '#3a3a48');
  g.rect(1, 7, 30, 19, '#7a4420'); g.rect(1, 7, 30, 2, '#a86438'); g.rect(1, 24, 30, 2, '#4a2810');
  for (let i = 0; i < 5; i++) g.line(2, 11 + i * 3, 4, 11 + i * 3, '#6a3818', 1);
  g.rect(3, 9, 21, 15, '#1a1a22');
  g.rect(25, 10, 4, 4, '#c8c8d0'); g.px(26, 11, '#5a5a68'); g.rect(25, 16, 4, 4, '#c8c8d0'); g.px(27, 18, '#5a5a68');
  g.rect(26, 21, 2, 2, '#e8c048');
  g.rect(4, 26, 2, 2, '#2a1810'); g.rect(26, 26, 2, 2, '#2a1810');
});
const RECORD = paint(16, 16, g => {
  g.ell(8, 8, 7, 7, '#141018'); g.ell(8, 8, 5, 5, '#24202c'); g.ell(8, 8, 3, 3, '#9ae030'); g.px(8, 8, '#141018');
  g.px(4, 4, '#6a6080'); g.px(5, 3, '#6a6080');
});
const PIZZA = paint(16, 14, g => {
  for (let y = 0; y < 11; y++) { const hw = Math.round(7 - y * 0.62); g.rect(8 - hw, 2 + y, hw * 2, 1, '#f8c848'); }
  g.rect(1, 1, 14, 2, '#c8782c'); g.rect(1, 1, 14, 1, '#e8a050');
  g.ell(5, 5, 1, 1, '#c02830'); g.ell(10, 6, 1, 1, '#c02830'); g.ell(7, 9, 1, 1, '#c02830');
  g.px(9, 3, '#fff0b0'); g.px(4, 7, '#fff0b0');
});
const PUNCH_CUP = paint(14, 17, g => {
  g.line(9, 0, 7, 6, '#40c8f0', 1);
  g.rect(1, 3, 12, 2, '#f4f4f8'); g.rect(2, 4, 10, 1, '#f070b8');
  for (let y = 5; y < 15; y++) { const inset = Math.floor((y - 5) / 4); g.rect(2 + inset, y, 10 - inset * 2, 1, '#d82838'); g.px(2 + inset, y, '#ff6870'); }
  g.rect(3, 8, 8, 2, '#f4f4f8');
  g.rect(4, 15, 6, 1, '#a01828');
});
const LAMP_OFF = paint(12, 22, g => { g.rect(2, 18, 8, 3, '#8a8a98'); g.rect(3, 16, 6, 2, '#b8b8c8'); g.ell(6, 9, 3, 7, '#3a2858'); g.rect(4, 1, 4, 2, '#b8b8c8'); });
const LAMP_ON = paint(12, 22, g => { g.rect(2, 18, 8, 3, '#8a8a98'); g.rect(3, 16, 6, 2, '#b8b8c8'); g.ell(6, 9, 3, 7, '#f060b0'); g.ell(6, 12, 2, 2, '#ffb030'); g.ell(5, 6, 1, 1, '#ff8040'); g.rect(4, 1, 4, 2, '#b8b8c8'); });
const VEST = paint(12, 12, g => { g.rect(1, 1, 10, 10, '#3a6ec8'); g.rect(4, 1, 4, 4, null); g.px(3, 6, '#f0d040'); g.px(8, 6, '#f0d040'); });
const VEST_PINK = paint(12, 12, g => { g.rect(1, 1, 10, 10, '#c84870'); g.rect(4, 1, 4, 4, null); g.px(3, 6, '#f8e0a0'); g.px(8, 6, '#f8e0a0'); });
const SNOT = paint(12, 6, g => { g.ell(8, 2, 3, 2, '#9ad828'); g.rect(1, 2, 6, 1, '#6aa818'); g.px(0, 2, '#4a8810'); g.px(9, 1, '#e8ffa0'); g.px(5, 3, '#b8f040'); }, '#2a5008');
const TRACT = paint(10, 8, g => { g.rect(1, 1, 8, 6, '#f8f4e4'); g.rect(1, 1, 8, 2, '#e0b040'); g.rect(2, 4, 5, 1, '#8a8070'); g.rect(2, 5, 4, 1, '#8a8070'); });
const BLOB = paint(9, 9, g => { g.ell(4, 4, 3, 3, '#6ab818'); g.ell(3, 3, 2, 2, '#a8e030'); g.px(3, 2, '#e8ffa0'); }, '#2a5008');
const HEART = paint(12, 11, g => { g.ell(3, 3, 2, 2, '#e02838'); g.ell(8, 3, 2, 2, '#e02838'); for (let y = 0; y < 5; y++) g.rect(1 + y, 4 + y, 9 - y * 2, 1, '#e02838'); g.rect(2, 2, 2, 1, '#ffb0b8'); g.px(2, 3, '#ffb0b8'); g.rect(1 + 2, 7, 5, 1, '#a01020'); });
const HEART_E = paint(12, 11, g => { g.ell(3, 3, 2, 2, '#3a2840'); g.ell(8, 3, 2, 2, '#3a2840'); for (let y = 0; y < 5; y++) g.rect(1 + y, 4 + y, 9 - y * 2, 1, '#3a2840'); });
const GOAT = paint(20, 18, g => {
  g.line(1, 1, 5, 7, '#d8d0c0', 2); g.line(18, 1, 14, 7, '#d8d0c0', 2);
  g.ell(10, 9, 5, 5, '#f0ece0'); g.rect(7, 12, 6, 5, '#f0ece0'); g.rect(8, 16, 4, 1, '#f0ece0');
  g.rect(7, 8, 2, 2, '#200810'); g.rect(11, 8, 2, 2, '#200810'); g.px(8, 9, '#ff3020'); g.px(12, 9, '#ff3020');
  g.rect(9, 13, 2, 2, '#200810');
});
const FLYV = paint(30, 10, g => {
  g.line(1, 1, 9, 5, '#d82838', 3); g.line(1, 9, 9, 5, '#d82838', 3); g.px(2, 1, '#ff8890'); g.px(3, 8, '#ff8890');
  g.rect(9, 4, 17, 2, '#8a5428'); for (let i = 11; i < 25; i += 3) g.px(i, 4, '#e8e8f0');
  g.rect(25, 3, 4, 4, '#2a2030'); g.px(26, 3, '#d8d8e0');
});

/* ---------- tiles ---------- */
const TILE = { top:[], fill:[] };
for (let v = 0; v < 4; v++) {
  const r = rng(91 + v * 17);
  TILE.top.push(paint(16, 16, g => {
    g.rect(0, 0, 16, 16, '#6c6878'); g.rect(0, 0, 16, 1, '#c8c4d4'); g.rect(0, 1, 16, 2, '#a09cb0'); g.rect(0, 3, 16, 1, '#86829a');
    for (let i = 0; i < 10; i++) g.px(r() * 16, 4 + r() * 12, r() < 0.5 ? '#7c788c' : '#5a5668');
    if (v === 1) { g.line(4, 4, 7, 9, '#46424f'); g.line(7, 9, 9, 10, '#46424f'); }
    if (v === 3) g.ell(9, 8, 3, 1, '#5a5468');
  }, null));
  TILE.fill.push(paint(16, 16, g => {
    g.rect(0, 0, 16, 16, '#4a4656');
    for (let i = 0; i < 14; i++) g.px(r() * 16, r() * 16, r() < 0.5 ? '#3a3646' : '#57536a');
  }, null));
}
TILE.amp = paint(16, 16, g => {
  g.rect(0, 0, 16, 16, '#1c1820'); g.rect(0, 0, 16, 1, '#4a4452'); g.rect(0, 15, 16, 1, '#0c0a10');
  g.rect(1, 1, 14, 3, '#28222e'); g.rect(2, 2, 5, 1, '#e8e0c8'); g.px(10, 2, '#e8c048'); g.px(12, 2, '#e8c048');
  for (let y = 5; y < 14; y++) for (let x = 2; x < 14; x++) g.px(x, y, (x + y) % 2 ? '#3a3440' : '#2a242e');
  g.rect(1, 4, 14, 1, '#100c14');
}, null);
TILE.shelf = paint(16, 16, g => {
  g.rect(0, 0, 16, 4, '#9a6630'); g.rect(0, 0, 16, 1, '#e0a860'); g.rect(0, 3, 16, 1, '#5a3410');
  g.px(4, 1, '#7a4c20'); g.px(5, 1, '#7a4c20'); g.px(11, 2, '#7a4c20');
  g.rect(3, 4, 2, 7, '#7a7486'); for (let i = 0; i < 5; i++) g.px(5 + i, 4 + i, '#7a7486');
}, null);
TILE.crate = paint(16, 16, g => {
  g.rect(0, 0, 16, 16, '#a06a30'); g.rect(0, 0, 16, 1, '#e0a860'); g.rect(0, 15, 16, 1, '#4a2a10');
  g.rect(0, 0, 1, 16, '#4a2a10'); g.rect(15, 0, 1, 16, '#4a2a10');
  for (let i = 1; i < 15; i++) { g.px(i, i, '#6a4018'); g.px(15 - i, i, '#6a4018'); }
  g.rect(1, 7, 14, 1, '#6a4018');
}, null);

// back wall: 16-bit brick with per-brick tone, banded lighting baked in
const WALL = paint(96, 184, g => {
  const r = rng(5);
  const tones = ['#5a2018', '#682620', '#4e1a14', '#61231c'];
  for (let row = 0; row < 184 / 8; row++) {
    const off = (row % 2) * 12;
    for (let col = -1; col < 5; col++) {
      const x0 = col * 24 + off, y0 = row * 8;
      const t = tones[Math.floor(r() * 4)];
      g.rect(x0 + 1, y0 + 1, 23, 7, t);
      g.rect(x0 + 1, y0 + 1, 23, 1, '#7c3428');
      g.rect(x0 + 1, y0 + 7, 23, 1, '#3a1410');
      if (r() < 0.3) g.px(x0 + 3 + r() * 18, y0 + 3 + r() * 3, '#3a1410');
    }
  }
}, null);
// darken the wall in bands toward the ceiling and floor
{
  const x = WALL.getContext('2d');
  const bands = [[0, 10, 0.55], [10, 20, 0.4], [20, 34, 0.25], [34, 50, 0.12], [150, 166, 0.12], [166, 184, 0.3]];
  for (const [a, b, al] of bands) { x.fillStyle = `rgba(16,4,20,${al})`; x.fillRect(0, a, 96, b - a); }
}

/* =========================================================
   FLOOR 1F: THE PARTY — new cast, objects, tiles, walls
   ========================================================= */
const AEROBIC_S = {
  skin:'#c6d3bd', skinS:'#93a88e', glow:'#c8ff3c', fangs:true, hair:'big', hairC:'#f0c050', hairS:'#b8862a', hairH:'#fff0a0', headband:'#ff3c90',
  shirt:'#28c0b8', shirtS:'#188880', sleeves:false, sleeve:'#28c0b8', sleeveS:'#188880',
  vest:'#f070a8', vestS:'#b84078', vestH:'#ffffff', tie:'#3048c0',
  pants:'#e04898', pantsS:'#a02868', legwarmers:'#f8f040', legwarmersS:'#c8b820', shoe:'#f4f4f8', shoeS:'#b8b8c8',
};
const AIRG_S = {
  skin:'#c6d3bd', skinS:'#93a88e', glow:'#c8ff3c', fangs:true, hair:'mullet', hairC:'#8a5428', hairS:'#5a3418', hairH:'#c08048',
  shirt:'#4a70b8', shirtS:'#30508a', sleeve:'#4a70b8', sleeveS:'#30508a',
  vest:'#3a8a48', vestS:'#245a30', vestH:'#f0d040', tie:'#d02838',
  pants:'#2a2430', pantsS:'#16121c', shoe:'#f4f4f8', shoeS:'#b8b8c8', hightop:true,
};
const MOM_S = {
  skin:'#c6d3bd', skinS:'#93a88e', glow:'#ff4060', fangs:true, hair:'curlers', hairC:'#a8703c', hairS:'#6a4420', hairH:'#d8a060',
  shirt:'#f4a8c8', shirtS:'#c87098', sleeve:'#f4a8c8', sleeveS:'#c87098', robe:'#ffd0e4',
  vest:null, tie:'#d02838',
  pants:'#c6d3bd', pantsS:'#93a88e', shoe:'#ffc0e0', shoeS:'#e080b0', holding:'clipboard',
};
function aerobicSet(S) {
  const walk = [], walkW = [];
  for (let i = 0; i < 4; i++) { const c = humanoid(S, runPose(i / 4, { lean:0, handF:[22, 20], handB:[9, 21] })); walk.push(pair(c)); walkW.push(pair(tintC(c, '#ffffff', 0.85))); }
  const set = { walk, walkW };
  set.hop = pair(humanoid(S, { footF:[24, 35], footB:[6, 35], handF:[25, 5], handB:[5, 5], kneeBend:0 }));
  set.squat = pair(humanoid(S, Object.assign(IDLE(1), { footF:[21, 38], footB:[9, 38], handF:[20, 24], handB:[10, 24], bob:2, kneeBend:3 })));
  set.dazed = [0, 1, 2, 3].map(i => pair(humanoid(unpossessed(S, '#f0c8a0', '#c8946a'), runPose(i / 4, { lean:-1, headDx:-1, handF:[20, 30], handB:[10, 30] }))));
  return set;
}
function airgSet(S) {
  const walk = [], walkW = [];
  for (let i = 0; i < 4; i++) { const c = humanoid(S, runPose(i / 4, { lean:0, handF:[24, 20], handB:[18, 27] })); walk.push(pair(c)); walkW.push(pair(tintC(c, '#ffffff', 0.85))); }
  const set = { walk, walkW };
  set.strum = [0, 1].map(i => pair(humanoid(S, { footF:[22, 38], footB:[7, 38], handF:[26, 15], handB:[19, 24 + i * 4], lean:1, headDy:i * 2, headDx:i, kneeBend:2 })));
  set.dazed = [0, 1, 2, 3].map(i => pair(humanoid(unpossessed(S, '#f0c8a0', '#c8946a'), runPose(i / 4, { lean:-1, headDx:-1, handF:[20, 30], handB:[10, 30] }))));
  return set;
}
const AEROBIC = aerobicSet(AEROBIC_S);
const AIRG = airgSet(AIRG_S);
// the Concerned Mom: drawn on the same rig, then doubled for boss size
function x2(src) { const [c, x] = canvasOf(src.width * 2, src.height * 2); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height); return c; }
const momPose = {
  idle:[IDLE(0), IDLE(1)].map(p => Object.assign(p, { handF:[21, 20] })),
  wind:{ footF:[19, 38], footB:[10, 38], handF:[6, 10], handB:[13, 24], lean:-2 },
  toss:{ footF:[22, 38], footB:[9, 38], handF:[28, 15], handB:[12, 24], lean:3 },
  yell:{ footF:[19, 38], footB:[11, 38], handF:[28, 11], handB:[11, 22], lean:2, mouth:'open' },
  walk:[0, 1, 2, 3].map(i => runPose(i / 4, { lean:0, handF:[21, 20] })),
};
const MOM = {
  idle:momPose.idle.map(p => pair(x2(humanoid(MOM_S, p)))),
  walk:momPose.walk.map(p => pair(x2(humanoid(MOM_S, p)))),
  wind:pair(x2(humanoid(MOM_S, momPose.wind))),
  toss:pair(x2(humanoid(MOM_S, momPose.toss))),
  yell:pair(x2(humanoid(Object.assign({}, MOM_S, { fangs:false }), momPose.yell))),
};
MOM.flash = pair(tintC(MOM.idle[0][0], '#ffffff', 0.85));
const MOM_PURGED = pair(x2(humanoid(Object.assign(unpossessed(MOM_S, '#f0c8a0', '#c8946a'), { pants:'#f0c8a0', pantsS:'#c8946a', holding:null }), { footF:[17, 38], footB:[12, 38], handF:[20, 9], handB:[11, 10], headDx:-1, mouth:'open' })));

const TURBO = paint(11, 17, g => {
  g.rect(1, 2, 9, 14, '#e02838'); g.rect(1, 2, 2, 14, '#ff6870'); g.rect(8, 2, 2, 14, '#a01020');
  g.rect(1, 1, 9, 2, '#d8d8e4'); g.rect(1, 15, 9, 1, '#a8a8b8');
  g.rect(1, 6, 9, 5, '#f4f4f8'); g.line(2, 10, 8, 7, '#e02838', 1); g.px(5, 4, '#ffd850'); g.px(5, 13, '#ffd850');
});
const PHONE = paint(22, 18, g => {
  g.rect(2, 7, 18, 10, '#d8b030'); g.rect(2, 7, 18, 2, '#f8d860'); g.ell(11, 12, 4, 3, '#f4f0e0');
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.px(11 + Math.round(Math.cos(a) * 3), 12 + Math.round(Math.sin(a) * 2), '#3a3020'); }
  g.rect(1, 2, 20, 4, '#d8b030'); g.rect(1, 2, 4, 5, '#d8b030'); g.rect(17, 2, 4, 5, '#d8b030'); g.rect(3, 2, 16, 1, '#f8d860');
});
const CART = paint(38, 36, g => {
  g.rect(2, 22, 34, 4, '#8a8698'); g.rect(2, 22, 34, 1, '#c8c4d4'); g.rect(4, 26, 2, 6, '#8a8698'); g.rect(32, 26, 2, 6, '#8a8698');
  g.ell(6, 33, 2, 2, '#1a1420'); g.ell(32, 33, 2, 2, '#1a1420');
  g.rect(5, 2, 28, 20, '#5a3418'); g.rect(5, 2, 28, 2, '#8a5428'); g.rect(7, 5, 19, 14, '#1a1a22');
  g.rect(28, 6, 3, 3, '#c8c4d4'); g.rect(28, 11, 3, 3, '#c8c4d4');
});
const FRAME_DEWEY = paint(30, 36, g => {
  g.rect(0, 0, 30, 36, '#c89838'); g.rect(1, 1, 28, 34, '#e8c060'); g.rect(3, 3, 24, 30, '#3a2878');
}, null);

// house floor tiles
function tileSet(top, fill) { return { top, fill }; }
const HOUSE = {};
{
  const r = rng(77);
  HOUSE.lino = tileSet(paint(16, 16, g => { for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) g.rect(x, y, 8, 8, ((x + y) / 8) % 2 ? '#e8e4f0' : '#1c1824'); g.rect(0, 0, 16, 1, '#ffffff'); g.px(3, 4, '#c8c4d4'); g.px(12, 11, '#3a3446'); }, null),
                       paint(16, 16, g => { g.rect(0, 0, 16, 16, '#3a2a1c'); for (let i = 0; i < 10; i++) g.px(r() * 16, r() * 16, '#2a1c10'); }, null));
  HOUSE.shag = tileSet(paint(16, 16, g => { g.rect(0, 0, 16, 16, '#c8641c'); for (let i = 0; i < 40; i++) g.px(r() * 16, r() * 16, r() < 0.5 ? '#e88a30' : '#9a4810'); g.rect(0, 0, 16, 1, '#f8b060'); for (let x = 0; x < 16; x += 2) g.px(x, 1, '#e88a30'); }, null),
                       paint(16, 16, g => { g.rect(0, 0, 16, 16, '#3a2a1c'); for (let i = 0; i < 10; i++) g.px(r() * 16, r() * 16, '#2a1c10'); }, null));
  HOUSE.wood = tileSet(paint(16, 16, g => { g.rect(0, 0, 16, 16, '#8a5428'); g.rect(0, 0, 16, 1, '#d89a58'); for (let y = 4; y < 16; y += 4) g.rect(0, y, 16, 1, '#5a3418'); g.rect(6, 1, 1, 3, '#5a3418'); g.rect(11, 5, 1, 3, '#5a3418'); g.rect(3, 9, 1, 3, '#5a3418'); g.rect(13, 13, 1, 3, '#5a3418'); g.px(9, 2, '#b07038'); }, null),
                       paint(16, 16, g => { g.rect(0, 0, 16, 16, '#3a2a1c'); }, null));
  HOUSE.counter = [paint(16, 16, g => { g.rect(0, 0, 16, 16, '#9a6a3a'); g.rect(0, 0, 16, 4, '#e8e0c8'); g.rect(0, 0, 16, 1, '#ffffff'); g.rect(0, 4, 16, 1, '#5a3418'); g.rect(1, 6, 14, 9, '#b07a44'); g.rect(1, 6, 14, 1, '#d09858'); g.rect(6, 8, 4, 1, '#e8c048'); }, null),
                    paint(16, 16, g => { g.rect(0, 0, 16, 16, '#9a6a3a'); g.rect(1, 1, 14, 14, '#b07a44'); g.rect(1, 1, 14, 1, '#d09858'); g.rect(6, 3, 4, 1, '#e8c048'); }, null)];
  HOUSE.couch = [paint(16, 16, g => { g.rect(0, 0, 16, 16, '#6a2a78'); g.rect(0, 0, 16, 3, '#9a4aa8'); g.rect(0, 0, 16, 1, '#c070d0'); g.rect(0, 8, 16, 1, '#4a1a58'); g.px(4, 5, '#4a1a58'); g.px(12, 5, '#4a1a58'); }, null),
                  paint(16, 16, g => { g.rect(0, 0, 16, 16, '#5a2068'); g.rect(0, 0, 16, 1, '#7a3a88'); g.rect(2, 12, 2, 4, '#3a1a10'); g.rect(12, 12, 2, 4, '#3a1a10'); }, null)];
  HOUSE.table = paint(16, 16, g => { g.rect(0, 0, 16, 4, '#7a4420'); g.rect(0, 0, 16, 1, '#c08048'); g.rect(0, 3, 16, 1, '#4a2410'); g.rect(2, 4, 2, 12, '#5a3418'); g.rect(12, 4, 2, 12, '#5a3418'); }, null);
}
// house walls (100% parallax: interior rooms)
const KITCHEN_WALL = paint(64, 184, g => {
  g.rect(0, 0, 64, 184, '#e8d8a8');
  for (let y = 0; y < 70; y += 10) for (let x = 0; x < 64; x += 16) { g.rect(x + 7, y, 2, 6, '#d06838'); g.px(x + 6, y + 2, '#d06838'); g.px(x + 9, y + 2, '#d06838'); g.px(x + 15, y + 5, '#88a048'); }
  g.rect(0, 70, 64, 4, '#a07040');
  for (let y = 74; y < 184; y += 10) for (let x = 0; x < 64; x += 10) { g.rect(x, y, 9, 9, (x + y) % 20 ? '#b8e0d0' : '#a8d4c4'); g.rect(x, y, 9, 1, '#d8f0e8'); }
}, null);
const LIVING_WALL = paint(64, 184, g => {
  for (let x = 0; x < 64; x += 8) { g.rect(x, 0, 8, 90, (x / 8) % 2 ? '#c89a58' : '#b8884a'); g.rect(x + 3, 0, 1, 90, '#d8a868'); }
  for (let y = 10; y < 90; y += 20) for (let x = 4; x < 64; x += 16) { g.ell(x, y, 2, 2, '#a86a30'); g.px(x, y, '#e8c080'); }
  g.rect(0, 90, 64, 4, '#6a3a18'); g.rect(0, 90, 64, 1, '#a86a30');
  for (let x = 0; x < 64; x += 16) { g.rect(x, 94, 16, 90, '#7a4a22'); g.rect(x, 94, 1, 90, '#4a2a10'); g.rect(x + 7, 94, 1, 90, '#6a3a18'); g.rect(x + 1, 94, 1, 90, '#9a6230'); }
}, null);
const DEN_WALL = paint(64, 184, g => {
  g.rect(0, 0, 64, 184, '#5a1a2a');
  for (let y = 6; y < 184; y += 20) for (let x = (y / 20 % 2) * 16; x < 64; x += 32) { g.ell(x + 8, y, 3, 3, '#7a2a3a'); g.px(x + 8, y, '#c8a040'); g.px(x + 6, y + 3, '#3a6a30'); g.px(x + 10, y + 3, '#3a6a30'); }
  g.rect(0, 120, 64, 3, '#c8a040');
  for (let x = 0; x < 64; x += 16) { g.rect(x, 123, 16, 61, '#3a1018'); g.rect(x + 2, 126, 12, 55, '#4a1820'); }
}, null);

/* =========================================================
   FLOOR 2F: THE BEDROOMS — sheet ghosts, the Youth Pastor, upstairs tiles + walls
   ========================================================= */
function sheetFrame(f) {
  return paint(18, 24, g => {
    g.ell(9, 7, 7, 7, '#f4f4fa'); g.rect(2, 7, 15, 11, '#f4f4fa'); g.rect(2, 7, 3, 11, '#c8c8dc'); g.ell(5, 5, 2, 2, '#ffffff');
    for (let x = 2; x < 17; x++) g.rect(x, 18, 1, 1 + ((x + f * 2) % 4 < 2 ? 1 : 0), x < 5 ? '#c8c8dc' : '#f4f4fa');
    g.rect(10, 6, 2, 3, '#140b1a'); g.rect(14, 6, 2, 3, '#140b1a'); g.px(10, 7, '#c8ff3c'); g.px(14, 7, '#c8ff3c');
    g.rect(12, 11, 3, 2, '#140b1a');
    g.rect(5 + f, 21, 4, 2, '#e02838'); g.rect(11 - f, 21, 4, 2, '#e02838'); g.rect(5 + f, 22, 4, 1, '#ffffff'); g.rect(11 - f, 22, 4, 1, '#ffffff');
  });
}
const SHEET = [pair(sheetFrame(0)), pair(sheetFrame(1))];
const SHEET_W = SHEET.map(p => [tintC(p[0], '#ffffff', 0.85), tintC(p[1], '#ffffff', 0.85)]);
const SHEET_RAG = paint(18, 12, g => { g.rect(1, 2, 16, 8, '#f4f4fa'); g.rect(1, 2, 16, 2, '#ffffff'); g.rect(5, 4, 2, 2, '#140b1a'); g.rect(11, 4, 2, 2, '#140b1a'); });
const GUITAR_SPR = paint(12, 12, g => { g.ell(4, 7, 3, 3, '#d89848'); g.px(4, 7, '#2a1408'); g.line(6, 5, 10, 1, '#5a3418', 1); });
const BOARD = paint(26, 12, g => {
  g.rect(1, 1, 24, 10, '#d8b878'); g.rect(1, 1, 24, 1, '#f0d8a0'); g.rect(1, 10, 24, 1, '#a8885a');
  for (let i = 0; i < 9; i++) g.px(3 + i * 2 + 1, 3 + (i % 2), '#3a2010');
  for (let i = 0; i < 8; i++) g.px(4 + i * 2 + 1, 6 + (i % 2), '#3a2010');
  g.rect(4, 8, 3, 1, '#3a2010'); g.rect(19, 8, 3, 1, '#3a2010');
});
const PLANCHETTE = paint(8, 7, g => { g.rect(1, 2, 6, 3, '#f4f0e0'); g.rect(2, 1, 4, 5, '#f4f0e0'); g.px(4, 3, '#3a2010'); });
const PASTOR_S = {
  skin:'#c6d3bd', skinS:'#93a88e', glow:'#c8ff3c', fangs:true, hair:'capback', capC:'#ff3c90', hairC:'#e8c060', hairS:'#b08830', hairH:'#fff0a0',
  shirt:'#40e0d0', shirtS:'#20a098', sleeve:'#40e0d0', sleeveS:'#20a098', cross:'#ffd850',
  pants:'#6a88d0', pantsS:'#4a68a8', shoe:'#f4f4f8', shoeS:'#b8b8c8', hightop:true, rips:true, holding:'acoustic',
};
const pastorPose = {
  idle:[IDLE(0), IDLE(1)].map(p => Object.assign(p, { handF:[16, 26 + p.bob], handB:[24, 20 + p.bob] })),
  strum:[0, 1].map(i => Object.assign(IDLE(i), { handF:[15 + i, 24 + i * 3], handB:[24, 19], headDy:i, lean:1 })),
  crouch:{ footF:[22, 38], footB:[8, 38], handF:[26, 22], handB:[4, 22], bob:3, kneeBend:4, lean:2 },
  jump:{ footF:[20, 34], footB:[10, 34], handF:[24, 6], handB:[6, 6], kneeBend:3, mouth:'open' },
  yell:{ footF:[19, 38], footB:[11, 38], handF:[16, 26], handB:[24, 20], lean:1, mouth:'open' },
};
const PASTOR = {
  idle:pastorPose.idle.map(p => pair(x2(humanoid(PASTOR_S, p)))),
  strum:pastorPose.strum.map(p => pair(x2(humanoid(PASTOR_S, p)))),
  crouch:pair(x2(humanoid(PASTOR_S, pastorPose.crouch))),
  jump:pair(x2(humanoid(PASTOR_S, pastorPose.jump))),
  yell:pair(x2(humanoid(Object.assign({}, PASTOR_S, { fangs:false }), pastorPose.yell))),
};
PASTOR.flash = pair(tintC(PASTOR.idle[0][0], '#ffffff', 0.85));
const PASTOR_PURGED = pair(x2(humanoid(Object.assign(unpossessed(PASTOR_S, '#f0c8a0', '#c8946a'), { holding:null, cross:null }), { footF:[17, 38], footB:[12, 38], handF:[20, 30], handB:[11, 30], headDx:-1, headDy:1 })));

// upstairs floor tiles
{
  const r = rng(303), shagTop = (base, lo, hi, edge) => paint(16, 16, g => { g.rect(0, 0, 16, 16, base); for (let i = 0; i < 40; i++) g.px(r() * 16, r() * 16, r() < 0.5 ? hi : lo); g.rect(0, 0, 16, 1, edge); for (let x = 0; x < 16; x += 2) g.px(x, 1, hi); }, null);
  const under = HOUSE.lino.fill;
  HOUSE.carpet = tileSet(shagTop('#b89868', '#98784a', '#d0b080', '#e8d0a0'), under);
  HOUSE.pink = tileSet(shagTop('#e078a8', '#b85080', '#f8a0c8', '#ffd0e4'), under);
  HOUSE.purple = tileSet(shagTop('#4a2878', '#2e1650', '#6a40a0', '#9a70d0'), under);
  HOUSE.dresser = [paint(16, 16, g => { g.rect(0, 0, 16, 16, '#7a4a28'); g.rect(0, 0, 16, 2, '#b07848'); g.rect(0, 0, 16, 1, '#d8a068'); g.rect(1, 4, 14, 5, '#8a5a30'); g.rect(1, 4, 14, 1, '#a87040'); g.rect(7, 6, 2, 1, '#e8c048'); g.rect(1, 11, 14, 4, '#8a5a30'); g.rect(1, 11, 14, 1, '#a87040'); g.rect(7, 12, 2, 1, '#e8c048'); }, null),
                   paint(16, 16, g => { g.rect(0, 0, 16, 16, '#7a4a28'); g.rect(1, 1, 14, 6, '#8a5a30'); g.rect(1, 1, 14, 1, '#a87040'); g.rect(7, 3, 2, 1, '#e8c048'); g.rect(1, 9, 14, 6, '#8a5a30'); g.rect(1, 9, 14, 1, '#a87040'); g.rect(7, 11, 2, 1, '#e8c048'); }, null)];
  HOUSE.chest = [paint(16, 16, g => { g.rect(0, 0, 16, 16, '#f070a8'); g.rect(0, 0, 16, 3, '#ffa0c8'); g.rect(0, 0, 16, 1, '#ffd0e4'); g.rect(0, 3, 16, 1, '#b84078'); g.ell(8, 9, 3, 3, '#ffffff'); g.px(8, 9, '#f8d040'); g.rect(1, 14, 14, 1, '#b84078'); }, null),
                 paint(16, 16, g => { g.rect(0, 0, 16, 16, '#d85890'); g.rect(1, 1, 14, 14, '#f070a8'); }, null)];
}
// upstairs walls (100% parallax)
const HALL_WALL = paint(64, 184, g => {
  for (let x = 0; x < 64; x += 8) { g.rect(x, 0, 8, 100, (x / 8) % 2 ? '#c8c098' : '#d8d0a8'); g.rect(x + 4, 0, 1, 100, '#b8b088'); }
  for (let y = 12; y < 100; y += 24) for (let x = 4; x < 64; x += 16) { g.px(x, y, '#8a9858'); g.px(x - 1, y + 1, '#8a9858'); g.px(x + 1, y + 1, '#8a9858'); g.px(x, y + 2, '#b85868'); }
  g.rect(0, 100, 64, 4, '#f0e8d8'); g.rect(0, 103, 64, 1, '#a89878');
  for (let x = 0; x < 64; x += 8) { g.rect(x, 104, 8, 80, '#e8e0cc'); g.rect(x, 104, 1, 80, '#c0b498'); g.rect(x + 1, 104, 1, 80, '#fffaf0'); }
}, null);
const SIS_WALL = paint(64, 184, g => {
  g.rect(0, 0, 64, 184, '#f4b8d0');
  for (let y = 8; y < 184; y += 22) for (let x = (y / 22 % 2) * 16 + 6; x < 64; x += 32) { g.ell(x, y, 2, 2, '#ff88b8'); g.ell(x + 3, y, 2, 2, '#ff88b8'); for (let k = 0; k < 4; k++) g.rect(x - 2 + k, y + 1 + k, 7 - k * 2, 1, '#ff88b8'); }
  for (let x = 0; x < 64; x += 16) g.ell(x + 10, 60, 5, 2, '#ffffff');
}, null);
const BATH_WALL = paint(64, 184, g => {
  g.rect(0, 0, 64, 70, '#a8e0d8'); for (let y = 6; y < 70; y += 14) for (let x = (y / 14 % 2) * 12; x < 64; x += 24) { g.ell(x + 4, y, 3, 2, '#f8a060'); g.px(x + 8, y, '#f8a060'); g.px(x + 3, y - 1, '#ffffff'); }
  g.rect(0, 70, 64, 3, '#ffffff');
  for (let y = 73; y < 184; y += 8) for (let x = 0; x < 64; x += 8) { g.rect(x, y, 7, 7, (x + y) % 16 ? '#f8c8d8' : '#f0b0c8'); g.px(x, y, '#ffffff'); }
}, null);
const TEEN_WALL = paint(64, 184, g => {
  g.rect(0, 0, 64, 184, '#1e1428');
  const r = rng(808); for (let i = 0; i < 30; i++) g.px(r() * 64, r() * 184, r() < 0.5 ? '#2a1e38' : '#140c1c');
  g.rect(0, 176, 64, 8, '#120a18'); g.rect(0, 176, 64, 1, '#3a2850');
}, null);
const MASTER_WALL = paint(64, 184, g => {
  g.rect(0, 0, 64, 184, '#2a3068');
  for (let y = 10; y < 130; y += 24) for (let x = (y / 24 % 2) * 16 + 8; x < 64; x += 32) { g.rect(x, y - 3, 1, 7, '#c8a040'); g.rect(x - 3, y, 7, 1, '#c8a040'); g.px(x, y, '#fff0a0'); }
  g.rect(0, 130, 64, 3, '#c8a040'); for (let x = 0; x < 64; x += 16) { g.rect(x, 133, 16, 51, '#1a1e48'); g.rect(x + 2, 136, 12, 45, '#22285a'); }
}, null);
