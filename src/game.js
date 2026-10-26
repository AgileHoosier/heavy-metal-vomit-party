/* =========================================================
   CORE
   ========================================================= */
const screenEl = document.getElementById('screen');
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------- text (Press Start 2P, thresholded to hard pixels) ---------- */
const tcache = new Map();
function timg(str, col, bands) {
  const key = str + '|' + col + '|' + (bands ? bands.join() : '');
  let c = tcache.get(key); if (c) return c;
  let x; [c, x] = canvasOf(Math.max(1, str.length * 8), 8);
  x.font = '8px "Press Start 2P", monospace'; x.textBaseline = 'top'; x.fillStyle = col;
  for (let i = 0; i < str.length; i++) x.fillText(str[i], i * 8, 0);
  try {
    const d = x.getImageData(0, 0, c.width, 8), a = d.data, rg = bands ? bands.map(rgbOf) : null;
    for (let i = 0; i < a.length; i += 4) {
      a[i + 3] = a[i + 3] > 96 ? 255 : 0;
      if (rg && a[i + 3]) { const row = Math.floor(i / 4 / c.width), rc = rg[Math.min(row, rg.length - 1)]; a[i] = rc[0]; a[i + 1] = rc[1]; a[i + 2] = rc[2]; }
    }
    x.putImageData(d, 0, 0);
  } catch (e) {}
  tcache.set(key, c); return c;
}
function text(str, x, y, col = '#f4f0ff', o = {}) {
  str = String(str); const sc = o.scale || 1, w = str.length * 8 * sc;
  if (o.align === 'center') x = Math.round(x - w / 2); else if (o.align === 'right') x = Math.round(x - w);
  if (o.shadow) ctx.drawImage(timg(str, o.shadow), x + sc, y + sc, w, 8 * sc);
  ctx.drawImage(timg(str, col, o.bands), x, y, w, 8 * sc);
}
if (document.fonts && document.fonts.load) document.fonts.load('8px "Press Start 2P"').then(() => tcache.clear()).catch(() => {});
function wrap(str, n) {
  const lines = []; let cur = '';
  for (const w of str.split(' ')) { if ((cur + ' ' + w).trim().length > n) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur); return lines;
}
const pad6 = n => String(Math.max(0, Math.floor(n))).padStart(6, '0');
const CHROME = ['#ffffff', '#ffffff', '#d8f0ff', '#a8d8ff', '#6aa8f0', '#4878d8', '#7058d0', '#4a2c98'];
const SLIME = ['#f0ffb0', '#d0ff60', '#b8f030', '#98d820', '#78c018', '#58a010', '#3c8008', '#285808'];
const GOLD = ['#fff8d0', '#ffe890', '#ffd850', '#f8c030', '#e8a020', '#d08818', '#b07010', '#885008'];

/* =========================================================
   INPUT
   ========================================================= */
const ACTS = ['left', 'right', 'up', 'down', 'jump', 'fire', 'snot', 'fart', 'start'];
const held = {}, pressed = {}, kbd = {}, touch = {}, prevHeld = {};
for (const a of ACTS) held[a] = pressed[a] = kbd[a] = touch[a] = prevHeld[a] = 0;
const KEYMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down',
  KeyZ:'jump', KeyK:'jump', Space:'jump', KeyX:'fire', KeyJ:'fire', KeyC:'snot', KeyI:'snot', KeyV:'fart', KeyL:'fart', Enter:'start', KeyP:'start', Escape:'start' };
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;
  if (e.code === 'KeyM') { auInit(); setSound(!AU.on); return; }
  const a = KEYMAP[e.code]; if (a) { kbd[a] = 1; e.preventDefault(); auInit(); }
});
addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) { kbd[a] = 0; e.preventDefault(); } });
addEventListener('blur', () => { for (const a of ACTS) kbd[a] = touch[a] = 0; });
function pollInput() {
  const gp = {};
  try {
    for (const p of (navigator.getGamepads ? navigator.getGamepads() : [])) {
      if (!p) continue;
      const b = i => !!(p.buttons[i] && p.buttons[i].pressed);
      gp.left = gp.left || b(14) || p.axes[0] < -0.45; gp.right = gp.right || b(15) || p.axes[0] > 0.45;
      gp.up = gp.up || b(12) || p.axes[1] < -0.45; gp.down = gp.down || b(13) || p.axes[1] > 0.45;
      gp.jump = gp.jump || b(0); gp.fire = gp.fire || b(2); gp.snot = gp.snot || b(3); gp.fart = gp.fart || b(1); gp.start = gp.start || b(9);
    }
  } catch (e) {}
  for (const a of ACTS) { const v = (kbd[a] || touch[a] || gp[a]) ? 1 : 0; pressed[a] = v && !prevHeld[a] ? 1 : 0; held[a] = v; prevHeld[a] = v; }
}
document.querySelectorAll('#pad .pb').forEach(el => {
  const k = el.dataset.k;
  const on = e => { e.preventDefault(); auInit(); touch[k] = 1; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (_) {} };
  const off = e => { e.preventDefault(); touch[k] = 0; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off);
  el.addEventListener('lostpointercapture', off); el.addEventListener('contextmenu', e => e.preventDefault());
});
screenEl.addEventListener('pointerdown', () => { screenEl.focus(); auInit(); if (state === 'title' || state === 'scene') touch.start = 1; });
screenEl.addEventListener('pointerup', () => { touch.start = 0; });
const sndBtn = document.getElementById('snd');
sndBtn.addEventListener('click', () => { auInit(); setSound(!AU.on); });
function setSound(on) {
  AU.on = on; if (AU.master) AU.master.gain.value = on ? 0.5 : 0;
  sndBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); sndBtn.textContent = on ? 'SOUND ON' : 'SOUND OFF';
  try { localStorage.setItem('hmvp_sound', on ? '1' : '0'); } catch (e) {}
}
const crtBtn = document.getElementById('crt');
crtBtn.addEventListener('click', () => {
  const on = !screenEl.classList.contains('crt'); screenEl.classList.toggle('crt', on);
  crtBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); crtBtn.textContent = on ? 'CRT ON' : 'CRT OFF';
});
document.getElementById('fs').addEventListener('click', () => {
  try { const p = screenEl.requestFullscreen ? screenEl.requestFullscreen() : null; if (p && p.catch) p.catch(() => {}); } catch (e) {}
  screenEl.focus();
});

/* =========================================================
   LEVELS
   ========================================================= */
const ROWS = 15, GROUND = 13 * T;
let COLS = 0, map = null, L = null;
let SPAWNS, PICKUPS, TV_COLS, CHECKS, ARENA_X, LOCK_X, BOSS_CX, DOOR_X, BOSS_HP;
// tiles: 0 air, 1 floor, 2 block, 3 one-way ledge, 4 soft block (crate/couch), 5 boss furniture, 6 fridge
function fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map[y * COLS + x] = t; }
const LEVELS = {
  b1: {
    id:'b1', label:'B1', name:'THE BASEMENT', tagline:'THE PARTY IS OVER. THE UNDEAD ARE NOT.', theme:'basement', song:'stage',
    cols:174, arena:154, lock:156, bossCx:2664, door:2724, boss:'drummer', bossHp:18, bossName:['THE POSSESSED', 'DRUMMER'],
    build() {
      fill(0, 13, COLS - 1, 14, 1);
      for (const [a, b] of [[36, 37], [72, 74], [110, 116]]) fill(a, 13, b, 14, 0);
      [[22, 12, 23, 12], [28, 11, 29, 12], [64, 12, 65, 12], [66, 11, 67, 12], [68, 10, 69, 12], [80, 12, 81, 12], [132, 11, 133, 12], [140, 12, 141, 12]].forEach(r => fill(...r, 2));
      [[44, 10, 48, 10], [50, 8, 53, 8], [58, 9, 61, 9], [111, 11, 113, 11], [114, 10, 116, 10], [112, 7, 113, 7], [126, 11, 128, 11], [145, 10, 148, 10]].forEach(r => fill(...r, 3));
      [[88, 12, 89, 12], [120, 12, 121, 12], [121, 11, 121, 11]].forEach(r => fill(...r, 4));
      fill(164, 11, 168, 12, 5);
    },
    spawns:[['mosher', 26], ['rat', 41], ['pusher', 47], ['rat', 56], ['mosher', 77], ['pusher', 84], ['rat', 93], ['pusher', 101], ['mosher', 104], ['rat', 119], ['pusher', 125], ['mosher', 130], ['rat', 137], ['pusher', 142], ['mosher', 147]],
    pickups:[['pizza', 51.5], ['punch', 59.5], ['pizza', 68.5], ['record', 112.5], ['pizza', 127], ['punch', 146.5]],
    tvs:[40, 88, 124, 152], checks:[3, 96, 150], gag:{ col:94, kind:'record' }, next:'f1',
  },
  f1: {
    id:'f1', label:'1F', name:'THE PARTY', tagline:'KITCHEN. LIVING ROOM. DEN. MOM.', theme:'house', song:'party',
    cols:190, arena:170, lock:172, bossCx:2950, door:2996, boss:'mom', bossHp:26, bossName:['THE CONCERNED', 'MOM'],
    build() {
      fill(0, 13, COLS - 1, 14, 1);
      for (const [a, b] of [[44, 46], [96, 98], [128, 132]]) fill(a, 13, b, 14, 0);
      // kitchen: counters, island, fridge
      [[7, 11, 10, 12], [23, 11, 27, 12], [31, 12, 33, 12], [54, 11, 57, 12]].forEach(r => fill(...r, 2));
      fill(34, 9, 35, 12, 6);
      [[15, 11, 19, 11], [48, 9, 51, 9]].forEach(r => fill(...r, 3));
      // living room: couches, coffee tables, bookshelf, stereo
      [[66, 11, 66, 12], [67, 12, 70, 12], [104, 12, 108, 12], [108, 11, 108, 11]].forEach(r => fill(...r, 4));
      [[74, 11, 76, 11], [84, 10, 86, 10], [84, 8, 86, 8], [84, 6, 86, 6], [129, 11, 131, 11], [120, 9, 123, 9]].forEach(r => fill(...r, 3));
      [[114, 11, 115, 12], [140, 12, 141, 12], [150, 11, 152, 12]].forEach(r => fill(...r, 2));
      [[158, 10, 161, 10]].forEach(r => fill(...r, 3));
    },
    spawns:[['pusher', 20], ['aerobic', 30], ['mosher', 40], ['airg', 52], ['aerobic', 63], ['pusher', 72], ['airg', 80], ['mosher', 92],
            ['aerobic', 102], ['pusher', 110], ['airg', 118], ['mosher', 126], ['aerobic', 136], ['airg', 146], ['pusher', 154], ['mosher', 162]],
    pickups:[['pizza', 17], ['record', 34.5], ['punch', 75], ['turbo', 85], ['pizza', 112], ['turbo', 130], ['pizza', 159.5]],
    tvs:[8, 60, 89, 121, 156], checks:[3, 100, 166], gag:{ col:25, kind:'phone' }, next:null,
  },
};
function loadLevel(id) {
  L = LEVELS[id]; COLS = L.cols; map = new Uint8Array(COLS * ROWS); L.build();
  SPAWNS = L.spawns; PICKUPS = L.pickups; TV_COLS = L.tvs; CHECKS = L.checks;
  ARENA_X = L.arena * T; LOCK_X = L.lock * T; BOSS_CX = L.bossCx; DOOR_X = L.door; BOSS_HP = L.bossHp;
}
loadLevel('b1');

const tileT = (tx, ty) => (tx < 0 || tx >= COLS) ? 1 : (ty < 0 || ty >= ROWS) ? 0 : map[ty * COLS + tx];
const isSolid = t => t === 1 || t === 2 || t === 4 || t === 5 || t === 6;
function groundYAt(px, h) {
  const tx = Math.floor(px / T);
  for (let ty = 0; ty < ROWS; ty++) { const t = tileT(tx, ty); if (isSolid(t) || t === 3) return ty * T - h; }
  return GROUND - h;
}
function collideX(e) {
  e.hitWall = 0;
  const top = Math.floor(e.y / T), bot = Math.floor((e.y + e.h - 1) / T);
  if (e.vx > 0) { const tx = Math.floor((e.x + e.w - 1) / T); for (let ty = top; ty <= bot; ty++) if (isSolid(tileT(tx, ty))) { e.x = tx * T - e.w; e.vx = 0; e.hitWall = 1; break; } }
  else if (e.vx < 0) { const tx = Math.floor(e.x / T); for (let ty = top; ty <= bot; ty++) if (isSolid(tileT(tx, ty))) { e.x = (tx + 1) * T; e.vx = 0; e.hitWall = -1; break; } }
}
function collideY(e, pb) {
  e.onGround = false;
  const l = Math.floor(e.x / T), r = Math.floor((e.x + e.w - 1) / T);
  if (e.vy > 0) {
    const ty = Math.floor((e.y + e.h - 0.01) / T);
    for (let tx = l; tx <= r; tx++) { const t = tileT(tx, ty); if (isSolid(t) || (t === 3 && pb <= ty * T + 0.5)) { e.y = ty * T - e.h; e.vy = 0; e.onGround = true; break; } }
  } else if (e.vy < 0) {
    const ty = Math.floor(e.y / T);
    for (let tx = l; tx <= r; tx++) if (isSolid(tileT(tx, ty))) { e.y = (ty + 1) * T; e.vy = 0; break; }
  }
}
function moveBody(e, grav = 0.26, maxFall = 6) {
  e.vy = Math.min(e.vy + grav, maxFall);
  e.x += e.vx; collideX(e);
  const pb = e.y + e.h; e.y += e.vy; collideY(e, pb);
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function edgeAhead(e) {
  const fx = e.face > 0 ? e.x + e.w + 1 : e.x - 1;
  const below = tileT(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
  const ahead = tileT(Math.floor(fx / T), Math.floor((e.y + e.h - 3) / T));
  return !(isSolid(below) || below === 3) || isSolid(ahead);
}

/* =========================================================
   STATE
   ========================================================= */
let state = 'title', stateT = 0, frame = 0;
let hiscore = 0;
try { hiscore = +localStorage.getItem('hmvp_hi') || 0; } catch (e) {}
try { if (localStorage.getItem('hmvp_sound') === '0') AU.on = false; } catch (e) {}
let score = 0, shake = 0, cam = 0, camLock = false, doorOpen = false, cpIndex = 0;
let frisbees = [], carts = [], yells = [], startFloor = 'b1', floorScore = 0;
try { if (/^#?(1f|f1|floor2|level2)$/i.test(location.hash || '')) startFloor = 'f1'; } catch (e) {}
let clouds = [], snots = [], P, enemies, dazed, blobs, puddles, parts, pops, pickups, sticks, waves, boss, spawns, lamps, tvs, tracts, trash, beams, gag;
let sceneList = null, sceneIdx = 0, afterScene = null, tally = 0, clearBonus = 0;

function newPlayer(x) {
  return { x, y:GROUND - 32, w:12, h:32, vx:0, vy:0, face:1, onGround:false, coyote:0, jumpBuf:0,
    hearts:3, belly:100, cool:0, inv:0, turbo:0, snotCd:0, snotT:0, fartT:0, fartCd:0, fartJumped:false, punch:0, anim:0, pukeT:0, emptyCd:0, record:false };
}
function makeTrash() {
  const R = rng(4242), out = [];
  for (let tx = 2; tx < 162; tx++) {
    if (!isSolid(tileT(tx, 13)) || tileT(tx, 12) !== 0) continue;
    if (R() > 0.55) continue;
    const roll = R();
    const type = roll < 0.3 ? 'can' : roll < 0.5 ? 'cup' : roll < 0.62 ? 'pizzabox' : roll < 0.74 ? 'chips' : roll < 0.86 ? 'tape' : 'pamphlet';
    out.push({ type, x:tx * T + Math.floor(R() * 12), y:GROUND, vx:0, vy:0, rest:true, rot:0, flip:R() < 0.5 });
  }
  return out;
}
function resetLevel() {
  frisbees = []; carts = []; yells = [];
  clouds = []; snots = []; enemies = []; dazed = []; blobs = []; puddles = []; parts = []; pops = []; sticks = []; waves = []; tracts = []; beams = [];
  trash = makeTrash();
  spawns = SPAWNS.map(([type, x]) => ({ type, x:x * T, done:false }));
  pickups = PICKUPS.map(([type, x]) => {
    const w = 14, h = type === 'punch' || type === 'turbo' ? 17 : 14, px0 = x * T;
    return { type, x:px0 - 7 + 8, y:groundYAt(px0 + 8, h) - 3, w, h, taken:false };
  });
  lamps = CHECKS.map((c, i) => ({ x:c * T, on:i === 0 }));
  tvs = TV_COLS.map(c => { const x = c * T; return { x, y:groundYAt(x + 16, 28), w:32, h:28, hp:5, on:true, flash:0 }; });
  if (L.gag.kind === 'record') gag = { kind:'record', x:L.gag.col * T + 2, y:GROUND - 30, w:26, h:30, done:false, t:0 };
  else { const gx = L.gag.col * T; gag = { kind:'phone', x:gx, y:groundYAt(gx + 11, 18), w:22, h:18, done:false, t:0 }; }
  if (L.boss === 'drummer') boss = { kind:'drummer', x:BOSS_CX - 20, y:144, w:40, h:34, hp:BOSS_HP, state:'wait', t:0, flash:0, arms:0, phase:1, qi:0, crashFlash:0 };
  else boss = { kind:'mom', x:BOSS_CX - 30, y:GROUND - 78, w:60, h:80, hp:BOSS_HP, state:'wait', t:0, flash:0, phase:1, qi:0, face:-1, pose:'idle', anim:0 };
  camLock = false; doorOpen = false; cpIndex = 0;
  P = newPlayer(CHECKS[0] * T + 14);
  cam = 0;
}
function startRun() { score = 0; floorScore = 0; resetLevel(); }

/* ---------- helpers ---------- */
function addScore(n, x, y) { score = Math.max(0, score + n); if (x !== undefined) pops.push({ x, y, str:(n > 0 ? '+' : '') + n, life:50, c:n > 0 ? '#f4f0ff' : '#ff7088' }); }
function popText(str, x, y, c = '#c8ff3c', life = 70) { pops.push({ x, y, str, life, c }); }
function burst(x, y, n, colors, spd = 1.6, g = 0.15) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = Math.random() * spd + 0.4;
    parts.push({ x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s - 1, life:20 + Math.random() * 22, c:colors[i % colors.length], g });
  }
}
function staticPuff(x, y) { for (let i = 0; i < 18; i++) parts.push({ x:x + (Math.random() - 0.5) * 14, y:y + (Math.random() - 0.5) * 20, vx:(Math.random() - 0.5) * 0.6, vy:-0.3 - Math.random() * 0.6, life:20 + Math.random() * 20, c:Math.random() < 0.5 ? '#ffffff' : '#9aa0b8', g:0, sq:true }); }
function nearestTV(x, maxD) { let best = null, bd = maxD; for (const t of tvs) { if (!t.on) continue; const d = Math.abs(t.x + 16 - x); if (d < bd) { bd = d; best = t; } } return best; }
function hurt(srcX, bite) {
  if (P.inv > 0 || state !== 'play') return;
  P.hearts--; sfx(bite ? 'bite' : 'hurt'); shake = 6;
  P.inv = 100; P.vx = P.x + P.w / 2 < srcX ? -2.4 : 2.4; P.vy = -3.2;
  if (bite && score > 0) {
    const take = Math.min(score, 100); score -= take;
    popText('-$' + take + ' TITHE', P.x + 6, P.y - 10, '#ffd850');
    const tv = nearestTV(P.x, 400);
    for (let i = 0; i < 5; i++) parts.push({ x:P.x + 6, y:P.y + 4, vx:(Math.random() - 0.5) * 1.5, vy:-1.5 - Math.random(), life:60, c:'#ffd850', g:0.02, dollar:true, home:tv ? { x:tv.x + 16, y:tv.y + 14 } : null });
  }
  if (P.hearts <= 0) die();
}
function die() { state = 'dying'; stateT = 0; P.vy = -5; P.vx = 0; stopSong(); sfx('die'); }
function saveHi() { if (score > hiscore) { hiscore = score; try { localStorage.setItem('hmvp_hi', String(hiscore)); } catch (e) {} } }

/* =========================================================
   UPDATE
   ========================================================= */
function update() {
  frame++; stateT++;
  pollInput();
  if (shake > 0) shake--;
  switch (state) {
    case 'title':
      if (pressed.left || pressed.right) { startFloor = startFloor === 'b1' ? 'f1' : 'b1'; sfx('select'); }
      if (pressed.start || pressed.jump || pressed.fire) {
        auInit(); sfx('select'); loadLevel(startFloor); startRun();
        if (startFloor === 'b1') { runScenes(INTRO, () => toFloorCard()); playSong('title'); } else toFloorCard();
      }
      break;
    case 'scene': updateScene(); break;
    case 'floorcard':
      if (stateT > 160 || (stateT > 30 && (pressed.start || pressed.jump))) { state = 'play'; stateT = 0; playSong(L.song); }
      break;
    case 'play':
      if (pressed.start) { state = 'pause'; sfx('pause'); break; }
      updatePlay(); break;
    case 'pause': if (pressed.start) { state = 'play'; sfx('pause'); } break;
    case 'fall':
      if (stateT === 40) respawn();
      if (stateT > 70) { state = 'play'; stateT = 0; playSong(camLock ? 'boss' : L.song); }
      break;
    case 'dying':
      P.vy += 0.22; P.y += P.vy; updateParts();
      if (stateT === 60) playSong('over');
      if (stateT > 150) { saveHi(); runScenes(GAMEOVER, () => { score = floorScore; resetLevel(); toFloorCard(); }, true); }
      break;
    case 'tally':
      updateParts();
      if (stateT > 40 && tally < clearBonus) { const s = Math.min(50, clearBonus - tally); tally += s; score += s; if (stateT % 3 === 0) sfx('type'); }
      if (stateT > 120 && tally >= clearBonus && (pressed.start || pressed.jump)) {
        saveHi(); sfx('select'); stopSong();
        if (L.next && LEVELS[L.next]) { loadLevel(L.next); resetLevel(); floorScore = score; toFloorCard(); }
        else { state = 'title'; stateT = 0; }
      }
      break;
  }
}
function toFloorCard() { state = 'floorcard'; stateT = 0; stopSong(); }
function respawn() {
  const cp = lamps[cpIndex];
  P.x = cp.x + 16; P.y = groundYAt(P.x + 6, P.h); P.vx = 0; P.vy = 0; P.inv = 100; P.face = 1; P.belly = Math.max(P.belly, 50);
  cam = Math.max(0, Math.min(P.x - 140, COLS * T - W));
  blobs = []; sticks = []; tracts = [];
}

function updatePlay() {
  updatePlayer();
  if (state !== 'play') return;
  if (!camLock && P.x > LOCK_X) { camLock = true; boss.state = 'intro'; boss.t = 0; playSong('boss'); enemies = enemies.filter(e => e.x > ARENA_X - 40); }
  if (camLock) { cam += (ARENA_X - cam) * 0.1; if (Math.abs(cam - ARENA_X) < 0.5) cam = ARENA_X; }
  else { cam += ((P.x - 140 + P.face * 24) - cam) * 0.12; cam = Math.max(0, Math.min(cam, COLS * T - W)); }
  for (const s of spawns) if (!s.done && s.x < cam + W + 24 && s.x > cam - 24) { s.done = true; enemies.push(makeEnemy(s.type, s.x)); }
  lamps.forEach((l, i) => { if (!l.on && P.x > l.x) { l.on = true; cpIndex = i; sfx('check'); popText('CHECKPOINT', l.x + 6, GROUND - 40, '#ff88cc'); } });
  for (const e of enemies) updateEnemy(e);
  enemies = enemies.filter(e => !e.gone);
  updateDazed(); updateBlobs(); updateSnots(); updateClouds(); updateTracts(); updateBoss(); updateSticks(); updateWaves(); updateMomStuff(); updatePickups(); updateTrash(); updateTVs(); updateParts();
  for (const p of puddles) p.life--; puddles = puddles.filter(p => p.life > 0);
  for (const b of beams) b.life--; beams = beams.filter(b => b.life > 0);
  if (gag.t > 0) gag.t--;
  if (doorOpen && P.x + P.w > DOOR_X + 14 && P.onGround) {
    clearBonus = P.hearts * 1000 + 2000 + (P.record ? 3000 : 0) + tvs.filter(t => !t.on).length * 500;
    P.recordsFound = (P.recordsFound || 0) + (P.record ? 1 : 0);
    tally = 0; stopSong();
    runScenes(BROADCASTS[L.id], () => { state = 'tally'; stateT = 0; playSong('win'); });
  }
}

function updatePlayer() {
  const p = P;
  const ax = p.onGround ? 0.18 : 0.13, maxV = p.turbo > 0 ? 2.8 : 1.9;
  if (p.turbo > 0) { p.turbo--; if (frame % 3 === 0 && Math.abs(p.vx) > 1) parts.push({ x:p.x + 6 - p.face * 6, y:p.y + 10 + Math.random() * 20, vx:-p.face * 0.6, vy:0, life:12, c:'#60e8ff', g:0 }); }
  if (held.left && !held.right) { p.vx -= ax; p.face = -1; }
  else if (held.right && !held.left) { p.vx += ax; p.face = 1; }
  else { p.vx *= p.onGround ? 0.72 : 0.94; if (Math.abs(p.vx) < 0.05) p.vx = 0; }
  p.vx = Math.max(-maxV, Math.min(maxV, p.vx));
  if (pressed.jump) p.jumpBuf = 7;
  if (p.jumpBuf > 0) p.jumpBuf--;
  if (p.jumpBuf > 0 && p.coyote > 0) { p.vy = -5.6; p.jumpBuf = 0; p.coyote = 0; sfx('jump'); }
  if (!held.jump && p.vy < -2.2) p.vy = -2.2;
  moveBody(p);
  if (camLock && p.x < ARENA_X + 2) { p.x = ARENA_X + 2; p.vx = Math.max(0, p.vx); }
  p.coyote = p.onGround ? 6 : Math.max(0, p.coyote - 1);
  p.anim += Math.abs(p.vx) * 0.09;
  if (p.cool > 0) p.cool--; if (p.pukeT > 0) p.pukeT--; if (p.emptyCd > 0) p.emptyCd--;
  if (held.fire && p.cool <= 0) {
    const cost = p.punch > 0 ? 4 : 7;
    if (p.belly >= cost) {
      p.belly -= cost; p.cool = p.turbo > 0 ? 6 : p.punch > 0 ? 9 : 15; p.pukeT = 12;
      const lob = held.up, baseVy = lob ? -3.3 : -1.7;
      const spreads = p.punch > 0 ? [-1.1, 0, 1.0] : [0];
      for (const s of spreads) blobs.push({ x:p.x + (p.face > 0 ? p.w + 2 : -10), y:p.y + 9, w:8, h:8, vx:p.face * (lob ? 2.6 : 3.4) + p.vx * 0.35, vy:baseVy + s, life:170 });
      sfx('puke');
    } else if (p.emptyCd <= 0) { p.emptyCd = 30; sfx('empty'); popText('DRY HEAVE', p.x + 6, p.y - 8, '#c8c4d4'); }
  }
  // snot rocket: fast, straight, free; slimes what it hits
  if (p.snotCd > 0) p.snotCd--;
  if (p.snotT > 0) p.snotT--;
  if (pressed.snot && !p.snotCd) {
    p.snotCd = p.turbo > 0 ? 18 : 40; p.snotT = 10; sfx('snot');
    snots.push({ x:p.x + (p.face > 0 ? p.w : -12), y:p.y + 8, w:10, h:5, vx:p.face * 5.5 + p.vx * 0.3, face:p.face, life:80 });
  }
  // flatulence: stink cloud behind you on the ground, a double jump in the air
  if (p.fartCd > 0) p.fartCd--;
  if (p.fartT > 0) p.fartT--;
  if (p.onGround) p.fartJumped = false;
  if (pressed.fart && !p.fartCd) {
    if (!p.onGround && !p.fartJumped) {
      p.fartJumped = true; p.fartCd = 30; p.fartT = 14; p.vy = -4.6; sfx('fart');
      clouds.push({ x:p.x + 6, y:p.y + p.h + 2, r:3, max:14, life:60, hit:new Set() });
      popText('PFFT!', p.x + 6, p.y + p.h + 4, '#c8c060', 30);
    } else if (p.onGround) {
      p.fartCd = 50; p.fartT = 14; sfx('fart');
      clouds.push({ x:p.x + 6 - p.face * 16, y:p.y + 18, r:4, max:20, life:100, hit:new Set(), drift:-p.face * 0.25 });
    }
  }
  p.belly = Math.min(100, p.belly + 0.07);
  if (p.punch > 0) p.punch--;
  if (p.inv > 0) p.inv--;
  if (p.y > H + 24) { p.hearts--; sfx('hurt'); if (p.hearts <= 0) die(); else { state = 'fall'; stateT = 0; stopSong(); } }
}

function makeEnemy(type, x) {
  const base = { type, x, vx:0, vy:0, face:-1, flash:0, stun:0, slip:0, slipCd:0, anim:0, onGround:false, mode:'walk', mt:0, cd:40 };
  if (type === 'rat') Object.assign(base, { w:16, h:9, hp:1 });
  else Object.assign(base, { w:12, h:32, hp:type === 'mosher' ? 3 : 2, hops:0 });
  base.y = groundYAt(x + base.w / 2, base.h);
  return base;
}
function killEnemy(e) {
  e.gone = true;
  const cx = e.x + e.w / 2;
  if (e.type === 'rat') { burst(cx, e.y + 4, 10, ['#c8ff3c', '#58a010', '#ffffff']); addScore(100, cx, e.y - 10); sfx('hit'); return; }
  staticPuff(cx, e.y + 14); sfx('purge');
  parts.push({ x:cx - 6, y:e.y + 12, vx:(Math.random() < 0.5 ? -1 : 1) * 1.6, vy:-3.4, life:70, g:0.15, spr:e.type === 'mosher' ? VEST : VEST_PINK, spin:true });
  addScore(e.type === 'mosher' ? 300 : e.type === 'pusher' ? 200 : 250, cx, e.y - 10);
  popText('PURGED!', cx, e.y - 20, '#c8ff3c', 50);
  const tv = nearestTV(cx, 150);
  dazed.push({ type:e.type, x:e.x, y:e.y, w:12, h:32, vx:0, vy:0, face:tv ? (tv.x + 16 > cx ? 1 : -1) : (P.x < e.x ? 1 : -1), t:0, tv, onGround:true, anim:0 });
}
function updateEnemy(e) {
  if (e.flash > 0) e.flash--; if (e.slipCd > 0) e.slipCd--; if (e.cd > 0) e.cd--;
  if (e.slip > 0) { e.slip--; e.vx *= 0.975; }
  else if (e.stun > 0) { e.stun--; e.vx *= 0.8; }
  else if (e.type === 'mosher') updateMosher(e);
  else if (e.type === 'pusher') updatePusher(e);
  else if (e.type === 'aerobic') updateAerobic(e);
  else if (e.type === 'airg') updateAirG(e);
  else { e.vx = e.face * 1.05; if (e.onGround && edgeAhead(e)) { e.face *= -1; e.vx = e.face * 1.05; } }
  if (e.slimed > 0) { e.slimed--; e.vx *= 0.45; if (frame % 10 === 0) parts.push({ x:e.x + Math.random() * e.w, y:e.y + 6 + Math.random() * 10, vx:0, vy:0.6, life:24, c:'#9ad828', g:0.05 }); }
  moveBody(e);
  if (e.hitWall && !e.slip) { e.face = -e.hitWall; if (e.mode === 'charge') { e.mode = 'dizzy'; e.mt = 70; shake = 3; sfx('hit'); } }
  e.anim += Math.abs(e.vx) * (e.type === 'rat' ? 0.25 : 0.09);
  if (e.onGround && !e.slip && !e.slipCd) {
    for (const p of puddles) {
      if (Math.abs(e.y + e.h - p.y) < 2 && e.x + e.w > p.x + 2 && e.x < p.x + p.w - 2) {
        e.slip = 46; e.slipCd = 140; e.vx = (e.vx >= 0 ? 1 : -1) * 1.8; e.hp--; e.flash = 8;
        sfx('slip'); popText('SLIP!', e.x + e.w / 2, e.y - 10, '#c8ff3c'); addScore(50);
        if (e.hp <= 0) { e.slip = 0; killEnemy(e); }
        break;
      }
    }
  }
  if (e.y > H + 30) { e.gone = true; addScore(100); }
  if (!e.gone && !e.slip && overlap(e, P)) hurt(e.x + e.w / 2, true);
}
function updateMosher(e) {
  const dx = (P.x + P.w / 2) - (e.x + e.w / 2);
  switch (e.mode) {
    case 'walk':
      e.vx = e.face * 0.42;
      if (e.onGround && edgeAhead(e)) { e.face *= -1; e.vx = e.face * 0.42; }
      if (!e.cd && Math.abs(dx) < 130 && Math.abs(P.y - e.y) < 34 && e.onGround) { e.face = dx >= 0 ? 1 : -1; e.mode = 'bang'; e.mt = 42; }
      break;
    case 'bang': e.vx = 0; if (--e.mt <= 0) { e.mode = 'charge'; e.mt = 70; sfx('charge'); } break;
    case 'charge':
      e.vx = e.face * 2.6;
      if (frame % 4 === 0) parts.push({ x:e.x + e.w / 2 - e.face * 6, y:e.y + e.h - 2, vx:-e.face * 0.4, vy:-0.3, life:14, c:'#8a8498', g:0 });
      if ((e.onGround && edgeAhead(e)) || --e.mt <= 0) { e.mode = 'dizzy'; e.mt = 56; e.vx = 0; }
      break;
    case 'dizzy': e.vx *= 0.7; if (--e.mt <= 0) { e.mode = 'walk'; e.cd = 70; } break;
  }
}
function updateAerobic(e) {
  const dx = (P.x + P.w / 2) - (e.x + e.w / 2);
  switch (e.mode) {
    case 'walk':
      e.vx = e.face * 0.5;
      if (e.onGround && edgeAhead(e)) { e.face *= -1; e.vx = e.face * 0.5; }
      if (!e.cd && Math.abs(dx) < 140 && Math.abs(P.y - e.y) < 60 && e.onGround) { e.face = dx >= 0 ? 1 : -1; e.mode = 'squat'; e.mt = 16; e.hops = 3; }
      break;
    case 'squat': e.vx = 0; if (--e.mt <= 0) { e.mode = 'hop'; e.vy = -5.4; e.face = dx >= 0 ? 1 : -1; e.vx = e.face * 1.7; } break;
    case 'hop':
      e.vx = e.face * 1.7;
      if (e.onGround && e.vy >= 0) { shake = Math.max(shake, 2); if (--e.hops > 0) { e.mode = 'squat'; e.mt = 10; } else { e.mode = 'walk'; e.cd = 70; } }
      break;
  }
}
function updateAirG(e) {
  const dx = (P.x + P.w / 2) - (e.x + e.w / 2);
  switch (e.mode) {
    case 'walk':
      e.vx = e.face * 0.35;
      if (e.onGround && edgeAhead(e)) { e.face *= -1; e.vx = e.face * 0.35; }
      if (!e.cd && Math.abs(dx) < 200 && Math.abs(P.y - e.y) < 50 && e.onGround) { e.face = dx >= 0 ? 1 : -1; e.mode = 'strum'; e.mt = 44; }
      break;
    case 'strum':
      e.vx = 0;
      if (e.mt === 12) { waves.push({ x:e.x + e.w / 2 + e.face * 8 - 7, y:e.y + e.h - 12, w:14, h:12, vx:e.face * 2.6, life:80, ground:e.y + e.h }); sfx('crash'); }
      if (--e.mt <= 0) { e.mode = 'walk'; e.cd = 120; }
      break;
  }
}
function updatePusher(e) {
  const dx = (P.x + P.w / 2) - (e.x + e.w / 2);
  switch (e.mode) {
    case 'walk':
      e.vx = e.face * 0.35;
      if (e.onGround && edgeAhead(e)) { e.face *= -1; e.vx = e.face * 0.35; }
      if (!e.cd && Math.abs(dx) < 170 && Math.abs(P.y - e.y) < 70) { e.face = dx >= 0 ? 1 : -1; e.mode = 'wind'; e.mt = 22; }
      break;
    case 'wind': e.vx = 0; if (--e.mt <= 0) {
      e.mode = 'toss'; e.mt = 16; sfx('toss');
      const sx = e.x + e.w / 2 + e.face * 8, sy = e.y + 6, ft = 44, g = 0.14;
      const tx = P.x + P.w / 2, ty = P.y + 14;
      tracts.push({ x:sx, y:sy, vx:(tx - sx) / ft, vy:(ty - sy - 0.5 * g * ft * ft) / ft, rot:0 });
    } break;
    case 'toss': e.vx = 0; if (--e.mt <= 0) { e.mode = 'walk'; e.cd = 80; } break;
  }
}
function updateDazed() {
  for (const d of dazed) {
    d.t++;
    if (d.tv && !d.tv.on) { d.tv = null; d.face = P.x < d.x ? 1 : -1; }
    if (d.tv) {
      const tx = d.tv.x + 16 - 6;
      d.face = tx > d.x ? 1 : -1;
      d.vx = Math.abs(tx - d.x) > 4 ? d.face * 0.5 : 0;
      if (Math.abs(tx - d.x) <= 4 || d.t > 170) {
        if (!d.zap) { d.zap = 1; beams.push({ x0:d.tv.x + 16, y0:d.tv.y + 14, x1:d.x + 6, y1:d.y + 8, life:40 }); sfx('zap'); }
        if (++d.zap > 40) {
          d.gone = true;
          const e = makeEnemy(d.type, d.x); e.y = d.y; e.face = P.x < d.x ? -1 : 1; e.cd = 60; enemies.push(e);
          staticPuff(d.x + 6, d.y + 14); popText('RE-TURNED!', d.x + 6, d.y - 12, '#ff7088');
        }
      }
    } else d.vx = d.face * 0.55;
    moveBody(d);
    if (d.hitWall) d.face = -d.face;
    d.anim += Math.abs(d.vx) * 0.09;
    if ((!d.tv && d.t > 150) || d.y > H + 20) d.gone = true;
  }
  dazed = dazed.filter(d => !d.gone);
}

function updateBlobs() {
  for (const b of blobs) {
    b.vy += 0.12; b.x += b.vx; b.y += b.vy; b.life--;
    const cx = b.x + 4, by = b.y + 8;
    const tx = Math.floor(cx / T), ty = Math.floor(by / T), t = tileT(tx, ty);
    const kitTop = t === 5 && ty < 12;
    if ((isSolid(t) && !kitTop) || (t === 3 && b.vy > 0 && by - b.vy <= ty * T + 1)) {
      const top = ty * T, fromAbove = by - b.vy <= top + 1 && !isSolid(tileT(tx, ty - 1));
      if (fromAbove && t !== 5) { if (puddles.length > 16) puddles.shift(); puddles.push({ x:cx - 8, y:top, w:16, life:480 }); }
      burst(cx, by - 2, 6, ['#a8e030', '#58a010', '#e8ffa0'], 1.2);
      sfx('splat'); b.dead = true; continue;
    }
    for (const e of enemies) {
      if (!e.gone && overlap(b, e)) {
        b.dead = true; e.hp--; e.flash = 8; e.stun = 12; e.vx = Math.sign(b.vx) * 1.3;
        if (e.mode === 'charge' || e.mode === 'bang') { e.mode = 'dizzy'; e.mt = 40; }
        burst(b.x + 4, b.y + 4, 7, ['#a8e030', '#58a010']);
        if (e.hp <= 0) killEnemy(e); else sfx('hit');
        break;
      }
    }
    if (b.dead) continue;
    for (const tv of tvs) {
      if (tv.on && overlap(b, { x:tv.x + 2, y:tv.y + 6, w:28, h:20 })) {
        b.dead = true; tv.hp--; tv.flash = 6; sfx('tvhit'); burst(b.x + 4, b.y + 4, 6, ['#ffffff', '#80c8ff', '#a8e030']);
        if (tv.hp <= 0) {
          tv.on = false; sfx('tvdie'); shake = 4; addScore(500, tv.x + 16, tv.y - 10); popText('OFF THE AIR!', tv.x + 16, tv.y - 22, '#80c8ff');
          burst(tv.x + 16, tv.y + 14, 22, ['#ffffff', '#ffd850', '#80c8ff'], 2.6);
        }
        break;
      }
    }
    if (b.dead) continue;
    if (!gag.done && overlap(b, gag)) {
      b.dead = true; gag.done = true; gag.t = 220; sfx(gag.kind === 'phone' ? 'record' : 'backward'); addScore(300, gag.x + 13, gag.y - 8);
      continue;
    }
    if (bossHittable() && overlap(b, bossBox())) {
      b.dead = true; burst(b.x + 4, b.y + 4, 9, ['#a8e030', '#58a010', '#ffffff']); damageBoss(1, b.x, b.y);
      continue;
    }
    for (const s of sticks) {
      if (!s.harmless && overlap(b, { x:s.x - 4, y:s.y - 4, w:8, h:8 })) { b.dead = true; s.harmless = true; s.vx = Math.sign(b.vx) * 2; s.vy = -2.5; addScore(50, s.x, s.y - 6); sfx('stick'); break; }
    }
    if (b.life <= 0 || b.y > H || b.x < cam - 16 || b.x > cam + W + 16) b.dead = true;
  }
  blobs = blobs.filter(b => !b.dead);
}
function updateClouds() {
  for (const c of clouds) {
    c.life--; if (c.r < c.max) c.r += 1.2; c.y -= 0.12; if (c.drift) c.x += c.drift;
    const box = { x:c.x - c.r, y:c.y - c.r, w:c.r * 2, h:c.r * 2 };
    for (const e of enemies) {
      if (e.gone || c.hit.has(e) || !overlap(box, e)) continue;
      c.hit.add(e); e.hp--; e.flash = 8; e.stun = 55; e.vx = (e.x + e.w / 2 > c.x ? 1 : -1) * 1.6;
      if (e.mode === 'charge' || e.mode === 'bang') { e.mode = 'dizzy'; e.mt = 70; }
      popText('GASSED!', e.x + e.w / 2, e.y - 12, '#c8c060', 45);
      if (e.hp <= 0) killEnemy(e); else sfx('hit');
    }
    for (const t of tracts) if (overlap(box, { x:t.x - 4, y:t.y - 3, w:8, h:6 })) { t.dead = true; burst(t.x, t.y, 6, ['#f8f4e4', '#e0b040']); addScore(25); }
    for (const s of sticks) if (!s.harmless && overlap(box, { x:s.x - 4, y:s.y - 4, w:8, h:8 })) { s.harmless = true; s.vy = -2; s.vx *= -0.5; addScore(50, s.x, s.y - 6); }
    if (!c.hitBoss && bossHittable() && overlap(box, bossBox())) {
      c.hitBoss = true; popText('GASSED!', c.x, boss.y - 10, '#c8c060', 45); damageBoss(1, c.x, c.y);
    }
  }
  clouds = clouds.filter(c => c.life > 0);
}
function updateSnots() {
  for (const s of snots) {
    s.x += s.vx; s.life--;
    if (frame % 2 === 0) parts.push({ x:s.x + (s.face > 0 ? 0 : 10), y:s.y + 2, vx:-s.face * 0.3, vy:0.2, life:10, c:'#6aa818', g:0 });
    const t = tileT(Math.floor((s.x + 5) / T), Math.floor((s.y + 2) / T));
    const kitTop = t === 5 && Math.floor((s.y + 2) / T) < 12;
    if (isSolid(t) && !kitTop) { s.dead = true; burst(s.x + 5, s.y + 2, 5, ['#9ad828', '#e8ffa0'], 1); sfx('splat'); continue; }
    for (const e of enemies) {
      if (e.gone || !overlap(s, e)) continue;
      s.dead = true; e.hp--; e.flash = 8; e.stun = 6; e.slimed = 150;
      if (e.mode === 'charge') { e.mode = 'dizzy'; e.mt = 50; }
      burst(s.x + 5, s.y + 2, 6, ['#9ad828', '#e8ffa0']); popText('SLIMED!', e.x + e.w / 2, e.y - 12, '#9ad828', 40);
      if (e.hp <= 0) killEnemy(e); else sfx('hit');
      break;
    }
    if (s.dead) continue;
    for (const tv of tvs) if (tv.on && overlap(s, { x:tv.x + 2, y:tv.y + 6, w:28, h:20 })) {
      s.dead = true; tv.hp--; tv.flash = 6; sfx('tvhit');
      if (tv.hp <= 0) { tv.on = false; sfx('tvdie'); shake = 4; addScore(500, tv.x + 16, tv.y - 10); popText('OFF THE AIR!', tv.x + 16, tv.y - 22, '#80c8ff'); burst(tv.x + 16, tv.y + 14, 22, ['#ffffff', '#ffd850', '#80c8ff'], 2.6); }
      break;
    }
    if (s.dead) continue;
    if (bossHittable() && overlap(s, bossBox())) {
      s.dead = true; burst(s.x + 5, s.y + 2, 8, ['#9ad828', '#ffffff']); damageBoss(1, s.x, s.y);
      continue;
    }
    for (const st of sticks) if (!st.harmless && overlap(s, { x:st.x - 4, y:st.y - 4, w:8, h:8 })) { s.dead = true; st.harmless = true; st.vx = s.face * 2; st.vy = -2.5; addScore(50, st.x, st.y - 6); sfx('stick'); break; }
    for (const tr of tracts) if (!s.dead && overlap(s, { x:tr.x - 4, y:tr.y - 3, w:8, h:6 })) { s.dead = true; tr.dead = true; burst(tr.x, tr.y, 6, ['#f8f4e4', '#e0b040']); addScore(25); }
    if (s.life <= 0 || s.x < cam - 20 || s.x > cam + W + 20) s.dead = true;
  }
  snots = snots.filter(s => !s.dead);
}
function updateTracts() {
  for (const t of tracts) {
    t.vy += 0.14; t.x += t.vx; t.y += t.vy; t.rot++;
    if (overlap(P, { x:t.x - 4, y:t.y - 3, w:8, h:6 })) { hurt(t.x, false); t.dead = true; }
    const tt = tileT(Math.floor(t.x / T), Math.floor((t.y + 3) / T));
    if (isSolid(tt) && t.vy > 0) { t.dead = true; trash.push({ type:'pamphlet', x:t.x - 4, y:Math.floor((t.y + 3) / T) * T, vx:0, vy:0, rest:true, rot:0, flip:false }); }
    for (const b of blobs) if (!b.dead && overlap(b, { x:t.x - 4, y:t.y - 3, w:8, h:6 })) { b.dead = true; t.dead = true; burst(t.x, t.y, 6, ['#f8f4e4', '#e0b040']); addScore(25); }
    if (t.y > H) t.dead = true;
  }
  tracts = tracts.filter(t => !t.dead);
}
function updateTVs() {
  for (const tv of tvs) {
    if (tv.flash > 0) tv.flash--;
    if (!tv.on && frame % 9 === 0) parts.push({ x:tv.x + 10 + Math.random() * 12, y:tv.y + 6, vx:(Math.random() - 0.5) * 0.3, vy:-0.5, life:40, c:'#5a5468', g:-0.003 });
  }
}

const bossBox = () => boss.kind === 'mom' ? { x:boss.x + 18, y:boss.y + 8, w:24, h:70 } : { x:boss.x + 6, y:boss.y, w:28, h:24 };
const bossHittable = () => ['idle', 'volley', 'crash', 'roll', 'records', 'cart', 'yell', 'walk'].includes(boss.state);
function throwStick(ft, jitter) {
  const g = 0.15, sx = BOSS_CX - 10, sy = boss.y + 4;
  const tx = P.x + P.w / 2 + (Math.random() * 2 - 1) * jitter;
  sticks.push({ x:sx, y:sy, vx:(tx - sx) / ft, vy:(GROUND - 4 - sy - 0.5 * g * ft * ft) / ft, rot:0, bounced:false, harmless:false });
  sfx('stick');
}
function updateBoss() { if (boss.kind === 'mom') updateMom(); else updateDrummer(); }
function updateDrummer() {
  const B = boss;
  if (B.state === 'wait') return;
  if (B.state === 'gone') { if (frame % 40 === 0) popText('Z', BOSS_CX + 10 + Math.random() * 6, B.y + 4, '#a8d8ff', 60); return; }
  B.t++; if (B.flash > 0) B.flash--; if (B.crashFlash > 0) B.crashFlash--;
  const p2 = B.phase === 2;
  switch (B.state) {
    case 'intro': B.arms = (B.t >> 3) & 1; if (B.t > 120) { B.state = 'idle'; B.t = 0; } break;
    case 'idle': B.arms = 0; if (B.t > (p2 ? 34 : 60)) { B.state = ['volley', 'crash', 'roll'][B.qi++ % 3]; B.t = 0; if (B.state === 'volley' && Math.random() < 0.5) popText('STICKS OF RIGHTEOUSNESS!', BOSS_CX - 30, B.y - 14, '#ffd850', 60); } break;
    case 'volley': {
      const throws = p2 ? [30, 38, 46, 54, 62] : [30, 42, 54];
      B.arms = B.t < 30 ? 1 : (throws.some(f => B.t >= f && B.t < f + 5) ? 0 : 1);
      throws.forEach((f, i) => { if (B.t === f) throwStick(48 + i * 7, 20); });
      if (B.t > 82) { B.state = 'idle'; B.t = 0; }
      break;
    }
    case 'crash':
      B.arms = 1;
      if (B.t === 40 || (p2 && B.t === 72)) { B.crashFlash = 10; shake = 10; sfx('crash'); B.arms = 0; waves.push({ x:BOSS_CX - 60, y:GROUND - 12, w:14, h:12, vx:p2 ? -2.8 : -2.3, life:140 }); }
      if (B.t > (p2 ? 100 : 80)) { B.state = 'idle'; B.t = 0; }
      break;
    case 'roll':
      B.arms = (B.t >> 2) & 1;
      if (B.t >= 10 && B.t <= (p2 ? 66 : 50) && B.t % 8 === 2) throwStick(32 + Math.random() * 8, 34);
      if (B.t > 84) { B.state = 'idle'; B.t = 0; }
      break;
    case 'dying':
      B.arms = (B.t >> 2) & 1; shake = 4;
      if (B.t % 6 === 0) staticPuff(B.x + 8 + Math.random() * 24, B.y + Math.random() * 20);
      if (B.t % 18 === 0) sfx('purge');
      if (B.t === 120) {
        B.state = 'gone'; sfx('boom');
        parts.push({ x:BOSS_CX - 6, y:B.y + 18, vx:-1.2, vy:-4, life:90, g:0.15, spr:VEST, spin:true });
        addScore(5000, BOSS_CX, B.y - 16); popText('DRUMMER PURGED!', BOSS_CX, B.y - 30, '#c8ff3c', 90);
        playSong('win', () => { doorOpen = true; if (state === 'play') { playSong('stage'); popText('GO UPSTAIRS', DOOR_X + 18, GROUND - 70, '#c8ff3c', 120); } });
      }
      break;
  }
  if (bossHittable() && overlap(P, bossBox())) hurt(BOSS_CX, true);
}
function updateMom() {
  const B = boss;
  if (B.state === 'wait') return;
  if (B.state === 'gone') { if (frame % 120 === 0) popText('WHY IS THE HOUSE SO MESSY?', B.x + 30, B.y - 8, '#c8c4d4', 100); return; }
  B.t++; if (B.flash > 0) B.flash--;
  const p2 = B.phase === 2, dx = (P.x + P.w / 2) - (B.x + 30);
  const turn = () => { B.face = dx >= 0 ? 1 : -1; };
  switch (B.state) {
    case 'intro': B.pose = (B.t >> 4) & 1 ? 'yell' : 'idle'; turn(); if (B.t > 120) { B.state = 'idle'; B.t = 0; } break;
    case 'idle': B.pose = 'idle'; turn();
      if (B.t > (p2 ? 28 : 46)) { B.state = ['records', 'walk', 'cart', 'yell'][B.qi++ % 4]; B.t = 0; } break;
    case 'walk':
      turn(); B.pose = 'walk'; B.anim += 0.1;
      B.x += B.face * (p2 ? 1.3 : 0.8);
      B.x = Math.max(ARENA_X + 20, Math.min(DOOR_X - 66, B.x));
      if (B.t > 60 || Math.abs(dx) < 30) { B.state = 'idle'; B.t = 0; }
      break;
    case 'records': {
      const n = p2 ? 5 : 3;
      B.pose = B.t < 24 ? 'wind' : 'toss';
      for (let i = 0; i < n; i++) if (B.t === 24 + i * 12) {
        const hy = [GROUND - 14, GROUND - 46, GROUND - 26][(i + B.qi) % 3];
        frisbees.push({ x:B.x + 30 + B.face * 22, y:hy, vx:B.face * (p2 ? 3.4 : 2.9), dir:B.face, t:0 }); sfx('toss');
      }
      if (B.t === 24) popText(['NO MORE RECORDS!', 'CONFISCATED!', 'NOT UNDER MY ROOF!'][B.qi % 3], B.x + 30, B.y - 10, '#ff88cc', 60);
      if (B.t > 24 + n * 12 + 10) { B.state = 'idle'; B.t = 0; }
      break;
    }
    case 'cart':
      B.pose = B.t < 20 ? 'wind' : 'toss';
      if (B.t === 20) { carts.push({ x:B.x + 30 + B.face * 10 - 19, y:GROUND - 36, w:38, h:36, vx:B.face * (p2 ? 3.4 : 2.7), hp:3 }); sfx('charge'); popText('TV TIME!', B.x + 30, B.y - 10, '#80c8ff', 50); }
      if (B.t > 50) { B.state = 'idle'; B.t = 0; }
      break;
    case 'yell':
      B.pose = 'yell';
      if (B.t === 14 || (p2 && B.t === 44)) { yells.push({ x:B.x + 30 + B.face * 20 - 36, y:GROUND - 13, w:72, h:9, vx:B.face * (p2 ? 2.8 : 2.2), life:200 }); sfx('crash'); shake = 4; }
      if (B.t > (p2 ? 70 : 50)) { B.state = 'idle'; B.t = 0; }
      break;
    case 'dying':
      B.pose = 'idle'; shake = 4;
      if (B.t % 6 === 0) staticPuff(B.x + 18 + Math.random() * 24, B.y + 10 + Math.random() * 60);
      if (B.t % 18 === 0) sfx('purge');
      if (B.t === 120) {
        B.state = 'gone'; sfx('boom');
        addScore(6000, B.x + 30, B.y - 16); popText('MOM PURGED!', B.x + 30, B.y - 30, '#c8ff3c', 90);
        playSong('win', () => { doorOpen = true; if (state === 'play') { playSong(L.song); popText('GO UPSTAIRS', DOOR_X + 18, GROUND - 70, '#c8ff3c', 120); } });
      }
      break;
  }
  if (bossHittable() && overlap(P, bossBox())) hurt(B.x + 30, true);
}
function damageBoss(n, x, y) {
  boss.hp -= n; boss.flash = 8; shake = 3; sfx('bossHit'); addScore(100);
  if (boss.hp <= Math.floor(BOSS_HP / 2) && boss.phase === 1) { boss.phase = 2; popText(boss.kind === 'mom' ? 'NOW SHE\'S MAD!' : 'HE IS ENRAGED!', x, 120, '#ff5060'); }
  if (boss.hp <= 0) { boss.state = 'dying'; boss.t = 0; stopSong(); sticks = []; waves = []; frisbees = []; carts = []; yells = []; }
}
function updateMomStuff() {
  for (const f of frisbees) {
    f.t++; f.x += f.vx; if (f.t > 50) f.vx -= f.dir * 0.12;
    if (overlap(P, { x:f.x - 6, y:f.y - 3, w:12, h:6 })) { hurt(f.x, false); f.dead = true; }
    for (const b of blobs) if (!b.dead && overlap(b, { x:f.x - 6, y:f.y - 3, w:12, h:6 })) { b.dead = true; f.dead = true; burst(f.x, f.y, 8, ['#141018', '#9ae030']); addScore(50, f.x, f.y - 8); }
    for (const s of snots) if (!s.dead && overlap(s, { x:f.x - 6, y:f.y - 3, w:12, h:6 })) { s.dead = true; f.dead = true; burst(f.x, f.y, 8, ['#141018', '#9ae030']); addScore(50, f.x, f.y - 8); }
    if (f.t > 200 || f.x < ARENA_X - 20 || f.x > ARENA_X + W + 20) f.dead = true;
  }
  frisbees = frisbees.filter(f => !f.dead);
  for (const c of carts) {
    c.x += c.vx;
    if (overlap(P, c)) hurt(c.x + 19, false);
    const hitWall = c.x < ARENA_X + 2 || c.x + c.w > ARENA_X + W - 2;
    for (const b of blobs) if (!b.dead && overlap(b, c)) { b.dead = true; c.hp--; sfx('tvhit'); burst(b.x, b.y, 6, ['#ffffff', '#80c8ff']); }
    for (const s of snots) if (!s.dead && overlap(s, c)) { s.dead = true; c.hp--; sfx('tvhit'); }
    if (c.hp <= 0 || hitWall) { c.dead = true; sfx('tvdie'); shake = 5; burst(c.x + 19, c.y + 12, 24, ['#ffffff', '#ffd850', '#80c8ff', '#8a5428'], 2.8); if (c.hp <= 0) addScore(200, c.x + 19, c.y - 10); }
  }
  carts = carts.filter(c => !c.dead);
  for (const y of yells) {
    y.x += y.vx; y.life--;
    if (overlap(P, y)) hurt(y.x + 36, false);
    if (y.life <= 0 || y.x < ARENA_X - 80 || y.x > ARENA_X + W + 10) y.dead = true;
  }
  yells = yells.filter(y => !y.dead);
}
function updateSticks() {
  for (const s of sticks) {
    s.vy += 0.15; s.x += s.vx; s.y += s.vy; s.rot++;
    const t = tileT(Math.floor(s.x / T), Math.floor((s.y + 2) / T));
    if (isSolid(t) && s.vy > 0) {
      if (s.bounced || s.harmless) s.dead = true;
      else { s.bounced = true; s.vy = -1.6; s.vx *= 0.45; s.y = Math.floor((s.y + 2) / T) * T - 3; }
    }
    if (!s.harmless && overlap(P, { x:s.x - 4, y:s.y - 4, w:8, h:8 })) { hurt(s.x, false); s.dead = true; }
    if (s.y > H || s.x < ARENA_X - 20) s.dead = true;
  }
  sticks = sticks.filter(s => !s.dead);
}
function updateWaves() {
  for (const w of waves) {
    w.x += w.vx; w.life = (w.life || 140) - 1;
    if (overlap(P, w)) hurt(w.x + 6, false);
    const fx = Math.floor((w.x + 7 + Math.sign(w.vx) * 7) / T), gy = w.ground || GROUND;
    if (w.life <= 0 || isSolid(tileT(fx, Math.floor((gy - 4) / T))) || !isSolid(tileT(fx, Math.floor((gy + 2) / T)))) w.dead = true;
  }
  waves = waves.filter(w => !w.dead);
}
function updatePickups() {
  for (const k of pickups) {
    if (k.taken || !overlap(P, k)) continue;
    k.taken = true;
    if (k.type === 'pizza') { P.hearts = Math.min(3, P.hearts + 1); P.belly = Math.min(100, P.belly + 35); sfx('pickup'); popText('PIZZA!', k.x + 7, k.y - 6, '#ffd850'); addScore(50); }
    else if (k.type === 'punch') { P.punch = 600; P.belly = 100; sfx('power'); popText('PARTY PUNCH!', k.x + 7, k.y - 8, '#ff88cc'); addScore(100); }
    else if (k.type === 'turbo') { P.turbo = 600; sfx('power'); popText('TURBO COLA!', k.x + 7, k.y - 8, '#60e8ff'); addScore(100); }
    else { P.record = true; sfx('record'); popText('VOMITRON RECORD!', k.x + 7, k.y - 10, '#c8ff3c', 100); addScore(1000); }
    burst(k.x + 7, k.y + 7, 12, ['#ffd850', '#ff88cc', '#ffffff']);
  }
}
function updateTrash() {
  for (const k of trash) {
    if (k.type !== 'can' && k.type !== 'cup') continue;
    if (k.rest) {
      if (Math.abs(P.vx) > 0.6 && P.onGround && P.x < k.x + 4 && P.x + P.w > k.x && Math.abs(P.y + P.h - k.y) < 3) { k.rest = false; k.vx = P.vx * 1.7; k.vy = -1.8 - Math.random(); sfx(k.type === 'can' ? 'clink' : 'splat'); }
      continue;
    }
    k.vy += 0.2; k.x += k.vx; k.y += k.vy; k.rot++;
    const t = tileT(Math.floor((k.x + 2) / T), Math.floor(k.y / T));
    if (isSolid(t) && k.vy > 0) {
      k.y = Math.floor(k.y / T) * T;
      if (Math.abs(k.vy) > 1.2) { k.vy = -k.vy * 0.35; if (k.type === 'can') sfx('clink'); }
      else { k.vy = 0; k.vx *= 0.8; if (Math.abs(k.vx) < 0.1) { k.vx = 0; k.rest = true; } }
    }
    if (isSolid(tileT(Math.floor((k.x + 2 + Math.sign(k.vx) * 3) / T), Math.floor((k.y - 2) / T)))) k.vx = -k.vx * 0.5;
    if (k.y > H + 10) k.dead = true;
  }
  trash = trash.filter(k => !k.dead);
}
function updateParts() {
  for (const p of parts) {
    if (p.home) { p.vx += (p.home.x - p.x) * 0.004; p.vy += (p.home.y - p.y) * 0.004; p.vx *= 0.95; p.vy *= 0.95; }
    else p.vy += p.g || 0;
    p.x += p.vx; p.y += p.vy; p.life--;
  }
  parts = parts.filter(p => p.life > 0);
  for (const p of pops) { p.y -= 0.4; p.life--; }
  pops = pops.filter(p => p.life > 0);
}
