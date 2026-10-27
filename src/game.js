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
  if (demo) {
    // any real button takes the controls back: return to the title
    if (ACTS.some(a => (kbd[a] || touch[a] || gp[a]) && !prevHeld[a])) { stopDemo(); for (const a of ACTS) { prevHeld[a] = (kbd[a] || touch[a] || gp[a]) ? 1 : 0; pressed[a] = held[a] = 0; } return; }
    const dk = demo();
    for (const a of ACTS) { const v = dk[a] ? 1 : 0; pressed[a] = v && !demoPrev[a] ? 1 : 0; held[a] = v; demoPrev[a] = v; prevHeld[a] = (kbd[a] || touch[a] || gp[a]) ? 1 : 0; }
    return;
  }
  for (const a of ACTS) { const v = (kbd[a] || touch[a] || gp[a]) ? 1 : 0; pressed[a] = v && !prevHeld[a] ? 1 : 0; held[a] = v; prevHeld[a] = v; }
}
const demoPrev = {};
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
// tiles: 0 air, 1 floor, 2 block, 3 one-way ledge, 4 soft block (crate/couch), 5 boss furniture, 6 fridge/porcelain, 7 waterbed (bouncy)
function fill(x0, y0, x1, y1, t) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map[y * COLS + x] = t; }
const LEVELS = {
  b1: {
    id:'b1', label:'B1', name:'THE BASEMENT', tagline:'THE PARTY IS OVER. THE UNDEAD ARE NOT.', theme:'basement', song:'stage',
    cols:174, arena:154, lock:156, bossCx:2664, door:2724, boss:'drummer', bossHp:16, bossName:['THE POSSESSED', 'DRUMMER'],
    build() {
      fill(0, 13, COLS - 1, 14, 1);
      fill(36, 13, 37, 14, 0);
      [[64, 12, 65, 12], [66, 11, 67, 12], [68, 10, 69, 12], [80, 12, 81, 12], [132, 11, 133, 12], [140, 12, 141, 12]].forEach(r => fill(...r, 2));
      [[44, 10, 48, 10], [50, 8, 53, 8], [58, 9, 61, 9], [126, 11, 128, 11], [145, 10, 148, 10]].forEach(r => fill(...r, 3));
      [[88, 12, 89, 12], [120, 12, 121, 12], [121, 11, 121, 11]].forEach(r => fill(...r, 4));
      fill(164, 11, 168, 12, 5);
    },
    // remix slots: each run picks one variant per slot
    slots:[
      { cols:[18, 32], variants:[
        () => { [[22, 12, 23, 12], [28, 11, 29, 12]].forEach(r => fill(...r, 2)); return { spawns:[['ground', 26]] }; },
        () => { [[20, 12, 21, 12], [24, 11, 25, 12]].forEach(r => fill(...r, 4)); fill(26, 9, 29, 9, 3); return { spawns:[['ground', 22], ['rat', 30]], pickups:[['pizza', 27.5]] }; },
        () => { fill(25, 12, 25, 12, 2); return { flood:[19, 31], spawns:[['ground', 23], ['rat', 28]] }; },
      ] },
      { cols:[70, 76], variants:[
        () => { fill(72, 13, 74, 14, 0); },
        () => { fill(71, 13, 75, 14, 0); fill(70, 10, 76, 10, 3); return { spawns:[['rat', 74]] }; },
        () => { fill(74, 12, 74, 12, 4); return { spawns:[['rat', 71], ['rat', 73], ['rat', 76]] }; },
      ] },
      { cols:[108, 118], variants:[
        () => { fill(110, 13, 116, 14, 0); [[111, 11, 113, 11], [114, 10, 116, 10], [112, 7, 113, 7]].forEach(r => fill(...r, 3)); return { pickups:[['record', 112.5]] }; },
        () => { fill(110, 13, 116, 14, 0); fill(112, 12, 114, 12, 2); fill(112, 9, 114, 9, 3); return { pickups:[['record', 113]] }; },
        () => { fill(109, 13, 111, 14, 0); fill(115, 13, 117, 14, 0); fill(113, 12, 113, 12, 4); fill(112, 9, 114, 9, 3); return { pickups:[['record', 113]] }; },
      ] },
    ],
    pools:{ ground:['mosher', 'pusher', 'mosher'] },
    // FEEDBACK AMPS: puke one and it blasts every Undead on screen
    toys:R => [54, 86, 100, 136].filter(() => R() < 0.6).slice(0, 3).map(c => ({ kind:'amp', x:c * T, y:GROUND - 30, w:24, h:30, cd:0, onHit:ampBlast })),
    spawns:[['rat', 41], ['pusher', 47], ['rat', 56], ['ground', 77], ['pusher', 84], ['rat', 93], ['pusher', 101], ['ground', 104], ['rat', 119], ['pusher', 125], ['ground', 130], ['rat', 137], ['pusher', 142], ['mosher', 147]],
    pickups:[['pizza', 51.5], ['punch', 59.5], ['pizza', 68.5], ['pizza', 127], ['punch', 146.5]],
    tvs:[40, 88, 124, 152], checks:[3, 42, 96, 130, 150], gag:{ col:94, kind:'record' }, next:'f1',
  },
  f1: {
    id:'f1', label:'1F', name:'THE PARTY', tagline:'KITCHEN. LIVING ROOM. DEN. MOM.', theme:'house', song:'party',
    cols:190, arena:170, lock:172, bossCx:2950, door:2996, boss:'mom', bossHp:22, bossName:['THE CONCERNED', 'MOM'],
    build() {
      fill(0, 13, COLS - 1, 14, 1);
      for (const [a, b] of [[44, 46], [96, 98]]) fill(a, 13, b, 14, 0);
      // kitchen: counters, fridge
      [[7, 11, 10, 12], [23, 11, 27, 12], [31, 12, 33, 12], [54, 11, 57, 12]].forEach(r => fill(...r, 2));
      fill(34, 9, 35, 12, 6);
      [[15, 11, 19, 11], [48, 9, 51, 9]].forEach(r => fill(...r, 3));
      // living room: second couch, coffee table, bookshelf, stereo
      [[104, 12, 108, 12], [108, 11, 108, 11]].forEach(r => fill(...r, 4));
      [[74, 11, 76, 11], [84, 10, 86, 10], [84, 8, 86, 8], [84, 6, 86, 6], [120, 9, 123, 9]].forEach(r => fill(...r, 3));
      [[114, 11, 115, 12], [140, 12, 141, 12], [150, 11, 152, 12]].forEach(r => fill(...r, 2));
      [[158, 10, 161, 10]].forEach(r => fill(...r, 3));
    },
    slots:[
      { cols:[37, 43], variants:[
        () => { fill(39, 11, 41, 12, 2); return { spawns:[['ground', 40]] }; },
        () => { fill(38, 10, 42, 10, 3); return { spawns:[['ground', 42]], pickups:[['pizza', 40]] }; },
        () => ({ flood:[37, 43], spawns:[['aerobic', 40]] }),
      ] },
      { cols:[64, 72], variants:[
        () => { fill(66, 11, 66, 12, 4); fill(67, 12, 70, 12, 4); return { spawns:[['pusher', 72]] }; },
        () => { fill(66, 12, 70, 12, 7); fill(67, 7, 69, 7, 3); return { spawns:[['pusher', 72]], pickups:[['pizza', 68]] }; },
        () => { fill(65, 11, 66, 12, 4); fill(70, 11, 71, 12, 4); fill(67, 11, 69, 11, 3); return { spawns:[['ground', 68]] }; },
      ] },
      { cols:[126, 134], variants:[
        () => { fill(128, 13, 132, 14, 0); fill(129, 11, 131, 11, 3); return { spawns:[['ground', 126]], pickups:[['turbo', 130]] }; },
        () => { fill(127, 11, 128, 11, 3); fill(129, 12, 130, 12, 4); fill(131, 10, 133, 10, 3); return { spawns:[['ground', 126]], pickups:[['turbo', 132]] }; },
        () => { fill(127, 13, 132, 14, 0); fill(129, 11, 130, 11, 3); return { spawns:[['ground', 134]], pickups:[['turbo', 129.5]] }; },
      ] },
    ],
    pools:{ ground:['mosher', 'pusher'] },
    spawns:[['pusher', 20], ['aerobic', 30], ['airg', 52], ['aerobic', 63],
            // the conga line: puke one and they all go down
            ['aerobic', 88, { conga:'A', idx:0 }], ['aerobic', 89.3, { conga:'A', idx:1 }], ['aerobic', 90.6, { conga:'A', idx:2 }], ['aerobic', 91.9, { conga:'A', idx:3 }],
            ['ground', 102], ['airg', 118], ['aerobic', 137], ['airg', 146], ['pusher', 154], ['mosher', 162]],
    pickups:[['pizza', 17], ['record', 34.5], ['punch', 75], ['turbo', 85], ['pizza', 112], ['pizza', 159.5]],
    tvs:[8, 60, 89, 121, 156], checks:[3, 52, 100, 136, 166], gag:{ col:25, kind:'phone' }, next:'f2',
    zone:tx => tx < 60 ? 'lino' : tx < 140 ? 'shag' : 'wood', doorSign:['NO', 'ENTRY'],
  },
  f2: {
    id:'f2', label:'2F', name:'THE BEDROOMS', tagline:'LIGHTS OUT. NOBODY IS SLEEPING.', theme:'upstairs', song:'upstairs',
    cols:196, arena:176, lock:178, bossCx:3040, door:3092, boss:'pastor', bossHp:26, bossName:['THE RADICAL', 'YOUTH PASTOR'],
    build() {
      fill(0, 13, COLS - 1, 14, 1);
      for (const [a, b] of [[38, 40], [90, 92], [124, 127], [160, 162]]) fill(a, 13, b, 14, 0);
      // hallway: hamper, linen shelf, dresser
      [[12, 12, 13, 12]].forEach(r => fill(...r, 4));
      [[26, 11, 27, 12], [42, 11, 43, 12]].forEach(r => fill(...r, 2));
      [[18, 10, 21, 10], [44, 9, 47, 9]].forEach(r => fill(...r, 3));
      // sister's room: bunk beds, toy chest, dollhouse, desk
      [[56, 11, 61, 11], [56, 8, 61, 8], [80, 10, 83, 10]].forEach(r => fill(...r, 3));
      [[66, 12, 68, 12]].forEach(r => fill(...r, 4));
      [[74, 11, 76, 12]].forEach(r => fill(...r, 2));
      // bathroom: tub, toilet, vanity, towel shelf, the rotted floor
      [[104, 11, 108, 12], [114, 12, 115, 12]].forEach(r => fill(...r, 6));
      [[119, 11, 121, 12]].forEach(r => fill(...r, 2));
      [[110, 9, 112, 9], [125, 11, 126, 11]].forEach(r => fill(...r, 3));
      // the teen's room: waterbed, a shelf way above it, speakers, desk, dresser
      fill(136, 12, 141, 12, 7);
      [[137, 6, 140, 6], [154, 10, 157, 10]].forEach(r => fill(...r, 3));
      [[148, 11, 149, 12], [166, 11, 167, 12]].forEach(r => fill(...r, 2));
    },
    spawns:[['rat', 16], ['pusher', 24], ['sheet', 31], ['mosher', 46], ['sheet', 54], ['aerobic', 64], ['sheet', 72], ['airg', 82], ['pusher', 96],
            ['rat', 106], ['sheet', 112], ['mosher', 118], ['airg', 134], ['sheet', 144], ['mosher', 152], ['aerobic', 158], ['sheet', 165], ['pusher', 170]],
    pickups:[['pizza', 19.5], ['punch', 58.5], ['pizza', 81.5], ['turbo', 111], ['record', 138.5], ['pizza', 155.5], ['punch', 172]],
    tvs:[9, 63, 101, 131, 168], checks:[3, 99, 172], gag:{ col:70, kind:'board' }, next:'f3', trashEnd:174,
    zone:tx => tx < 48 ? 'carpet' : tx < 100 ? 'pink' : tx < 128 ? 'lino' : tx < 176 ? 'purple' : 'wood', doorSign:['GOD', 'SEES'],
  },
  f3: {
    id:'f3', label:'3F', name:'THE ATTIC', tagline:'WHERE THIS HOUSE KEEPS WHAT IT\'S ASHAMED OF.', theme:'attic', song:'attic',
    cols:200, arena:180, lock:182, bossCx:3056, door:3150, boss:'phono', bossHp:28, bossName:['THE', 'BACKMASKER'],
    build() {
      fill(0, 13, COLS - 1, 14, 1);
      // gaps between the joists: step on the insulation and you go through
      for (const [a, b] of [[40, 42], [66, 68], [96, 98], [128, 131], [160, 162]]) fill(a, 13, b, 14, 0);
      // cardboard boxes and filing cabinets
      [[10, 11, 12, 12], [30, 12, 31, 12], [52, 10, 53, 12], [76, 11, 78, 12], [110, 11, 111, 12], [146, 10, 147, 12], [150, 10, 151, 12], [170, 11, 172, 12]].forEach(r => fill(...r, 2));
      // crates of confiscated records
      [[20, 12, 22, 12], [58, 12, 59, 12], [86, 12, 88, 12], [118, 12, 120, 12], [138, 12, 139, 12]].forEach(r => fill(...r, 4));
      // rafters and plank catwalks, plus one high beam with the record on it
      [[16, 9, 19, 9], [34, 8, 38, 8], [44, 10, 47, 10], [62, 9, 65, 9], [70, 9, 73, 9], [90, 8, 93, 8], [102, 10, 105, 10], [104, 5, 106, 5],
       [128, 10, 131, 10], [134, 8, 137, 8], [154, 9, 157, 9], [164, 10, 167, 10]].forEach(r => fill(...r, 3));
    },
    spawns:[['doll', 14], ['rat', 24], ['mosher', 33], ['doll', 46], ['sheet', 50], ['pusher', 60], ['doll', 74], ['airg', 82], ['sheet', 92], ['doll', 100],
            ['aerobic', 108], ['mosher', 116], ['doll', 124], ['sheet', 134], ['pusher', 142], ['doll', 152], ['airg', 158], ['mosher', 166], ['doll', 172]],
    pickups:[['pizza', 17.5], ['punch', 36], ['pizza', 71.5], ['turbo', 91.5], ['record', 105], ['pizza', 135.5], ['punch', 155.5], ['pizza', 174]],
    tvs:[7, 48, 81, 113, 143], checks:[3, 100, 176], gag:{ col:26, kind:'dice' }, next:'rf', trashEnd:178, doorSign:['TO', 'ROOF'],
  },
  rf: {
    id:'rf', label:'RF', name:'THE ROOF', tagline:'STORM. HELICOPTER. ROXY. LIVE ON AIR.', theme:'roof', song:'roof', bossSong:'final', wind:true,
    cols:172, arena:152, lock:154, bossCx:2600, door:2708, boss:'heli', bossHp:32, bossName:['REV. DEWEY', 'DOLLARSON'],
    build() {
      fill(0, 13, COLS - 1, 14, 1);
      for (const [a, b] of [[30, 32], [68, 71], [106, 108], [138, 140]]) fill(a, 13, b, 14, 0);
      // gables, chimneys, antenna and satellite-dish platforms
      [[14, 11, 19, 12], [42, 10, 47, 12], [84, 11, 90, 12], [118, 10, 123, 12]].forEach(r => fill(...r, 2));
      [[24, 10, 25, 12], [58, 10, 59, 12], [98, 10, 99, 12], [130, 10, 131, 12]].forEach(r => fill(...r, 4));
      [[35, 9, 38, 9], [50, 8, 53, 8], [62, 9, 65, 9], [74, 9, 77, 9], [92, 6, 94, 6], [111, 9, 114, 9], [144, 9, 147, 9],
       [156, 9, 159, 9], [161, 6, 164, 6], [166, 9, 168, 9]].forEach(r => fill(...r, 3));
    },
    spawns:[['pusher', 18], ['sheet', 28], ['mosher', 40], ['aerobic', 48], ['sheet', 57], ['airg', 66], ['pusher', 78], ['sheet', 88],
            ['mosher', 96], ['aerobic', 104], ['sheet', 114], ['airg', 122], ['pusher', 128], ['sheet', 136], ['mosher', 146]],
    pickups:[['pizza', 37], ['punch', 51.5], ['pizza', 75.5], ['record', 93.5], ['turbo', 112.5], ['pizza', 145.5], ['punch', 150]],
    tvs:[9, 55, 80, 126], checks:[3, 82, 150], gag:{ col:61, kind:'cat' }, next:null, trashEnd:150,
  },
};
const FLOOR_ORDER = Object.keys(LEVELS);
/* ---------- run seed: each run remixes the floors ---------- */
let runSeed = 1, forcedSeed = null, forcedPick = null, R = Math.random;
try { const m = /seed=(\d+)/i.exec(location.hash || ''); if (m) forcedSeed = +m[1]; } catch (e) {}
// spread nearby seeds apart before they reach the linear generator
function mixSeed(n) { n = Math.imul((n >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0; n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35) >>> 0; return (n ^ (n >>> 16)) >>> 0; }
function newSeed() { runSeed = forcedSeed !== null ? forcedSeed : 1 + Math.floor(Math.random() * 1e9); }
// stable per-run choice from a pool, keyed by where it is used (so jokes stay put while you play)
function seedPick(pool, key) { let h = (runSeed ^ Math.imul(key | 0, 2654435761)) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return pool[((h ^ (h >>> 13)) >>> 0) % pool.length]; }
function loadLevel(id) {
  L = LEVELS[id]; COLS = L.cols; map = new Uint8Array(COLS * ROWS); L.build();
  R = rng(mixSeed(runSeed * 31 + FLOOR_ORDER.indexOf(id)));
  SPAWNS = L.spawns.slice(); PICKUPS = L.pickups.slice(); TV_COLS = L.tvs; CHECKS = L.checks; FLOODS = [];
  // remix slots: each picks one hand-built variant; the variant owns everything in its columns
  L.picks = (L.slots || []).map((sl, i) => {
    const v = forcedPick && forcedPick[i] != null ? forcedPick[i] % sl.variants.length : Math.floor(R() * sl.variants.length);
    const add = sl.variants[v]() || {};
    if (add.spawns) SPAWNS.push(...add.spawns);
    if (add.pickups) PICKUPS.push(...add.pickups);
    if (add.flood) FLOODS.push(add.flood);
    return v;
  });
  SPAWNS = SPAWNS.map(([t, x, o]) => [L.pools && L.pools[t] ? L.pools[t][Math.floor(R() * L.pools[t].length)] : t, x, o]).sort((a, b) => a[1] - b[1]);
  ARENA_X = L.arena * T; LOCK_X = L.lock * T; BOSS_CX = L.bossCx; DOOR_X = L.door; BOSS_HP = L.bossHp;
}
// a per-run shuffle of a pool, for lists that must not repeat
function seedShuffle(pool, key) { const r = rng(mixSeed(runSeed + key * 131)), a = pool.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const slotIs = (i, v) => L.picks && L.picks[i] === v;
let FLOODS = [];
newSeed(); loadLevel('b1');

const tileT = (tx, ty) => (tx < 0 || tx >= COLS) ? 1 : (ty < 0 || ty >= ROWS) ? 0 : map[ty * COLS + tx];
const isSolid = t => t === 1 || t === 2 || t === 4 || t === 5 || t === 6 || t === 7;
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
    for (let tx = l; tx <= r; tx++) { const t = tileT(tx, ty); if (isSolid(t) || (t === 3 && pb <= ty * T + 0.5)) { e.y = ty * T - e.h; e.vy = 0; e.onGround = true; e.floorT = t; break; } }
  } else if (e.vy < 0) {
    const ty = Math.floor(e.y / T);
    for (let tx = l; tx <= r; tx++) if (isSolid(tileT(tx, ty))) { e.y = (ty + 1) * T; e.vy = 0; break; }
  }
}
function moveBody(e, grav = 0.26, maxFall = 6) {
  e.vy = Math.min(e.vy + grav, maxFall); e.landVy = e.vy;
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
try { const h = location.hash || ''; if (/^#?(1f|f1|floor2|level2)$/i.test(h)) startFloor = 'f1'; else if (/^#?(2f|f2|floor3|level3)$/i.test(h)) startFloor = 'f2'; else if (/^#?(3f|f3|attic)$/i.test(h)) startFloor = 'f3'; else if (/^#?(rf|roof)$/i.test(h)) startFloor = 'rf'; } catch (e) {}
const frozenPress = {};
let toys = [], combo = 0, comboT = 0, hitStop = 0, smite = null, lastLine = 0, wind = 0, windT = 0, windDir = 1, flashT = 0, boltT = 400, discs = [], notes = [], clouds = [], snots = [], P, enemies, dazed, blobs, puddles, parts, pops, pickups, sticks, waves, boss, spawns, lamps, tvs, tracts, trash, beams, gag;
let sceneList = null, sceneIdx = 0, afterScene = null, tally = 0, clearBonus = 0;

function newPlayer(x) {
  return { x, y:GROUND - 32, w:12, h:32, vx:0, vy:0, face:1, onGround:false, coyote:0, jumpBuf:0,
    hearts:3, belly:100, cool:0, inv:0, turbo:0, bounceT:0, snotCd:0, snotT:0, fartT:0, fartCd:0, fartJumped:false, punch:0, anim:0, pukeT:0, emptyCd:0, record:false };
}
function makeTrash() {
  const Rt = rng(mixSeed(runSeed * 3 + 4242)), out = [];
  for (let tx = 2; tx < (L.trashEnd || 162); tx++) {
    if (!isSolid(tileT(tx, 13)) || tileT(tx, 12) !== 0) continue;
    if (Rt() > 0.55) continue;
    const roll = Rt(), R = Rt;
    const type = roll < 0.3 ? 'can' : roll < 0.5 ? 'cup' : roll < 0.62 ? 'pizzabox' : roll < 0.74 ? 'chips' : roll < 0.86 ? 'tape' : 'pamphlet';
    out.push({ type, x:tx * T + Math.floor(R() * 12), y:GROUND, vx:0, vy:0, rest:true, rot:0, flip:R() < 0.5 });
  }
  return out;
}
function resetLevel() {
  frisbees = []; carts = []; yells = []; notes = []; discs = []; wind = 0; windT = 0; flashT = 0;
  clouds = []; snots = []; enemies = []; dazed = []; blobs = []; puddles = []; parts = []; pops = []; sticks = []; waves = []; tracts = []; beams = [];
  trash = makeTrash();
  spawns = SPAWNS.map(([type, x, o]) => ({ type, x:x * T, done:false, o }));
  for (const [a, b] of FLOODS) for (let c = a; c <= b; c++) puddles.push({ x:c * T, y:groundYAt(c * T + 8, 0), w:16, life:Infinity, perm:true });
  toys = L.toys ? L.toys(R) : []; combo = 0; comboT = 0; hitStop = 0; smite = null;
  pickups = PICKUPS.map(([type, x]) => {
    const w = 14, h = type === 'punch' || type === 'turbo' ? 17 : 14, px0 = x * T;
    return { type, x:px0 - 7 + 8, y:groundYAt(px0 + 8, h) - 3, w, h, taken:false };
  });
  lamps = CHECKS.map((c, i) => ({ x:c * T, on:i === 0 }));
  tvs = TV_COLS.map(c => { const x = c * T; return { x, y:groundYAt(x + 16, 28), w:32, h:28, hp:5, on:true, flash:0 }; });
  if (L.gag.kind === 'record') gag = { kind:'record', x:L.gag.col * T + 2, y:GROUND - 30, w:26, h:30, done:false, t:0 };
  else { const gx = L.gag.col * T, gw = { board:26, dice:24, cat:20 }[L.gag.kind] || 22, gh = { board:20, dice:20, cat:24, phone:24 }[L.gag.kind] || 18; gag = { kind:L.gag.kind, x:gx, y:groundYAt(gx + gw / 2, gh), w:gw, h:gh, done:false, t:0 }; }
  if (L.boss === 'drummer') boss = { kind:'drummer', x:BOSS_CX - 20, y:144, w:40, h:34, hp:BOSS_HP, state:'wait', t:0, flash:0, arms:0, phase:1, qi:0, crashFlash:0 };
  else if (L.boss === 'phono') boss = { kind:'phono', x:BOSS_CX - 36, y:GROUND - 64, w:72, h:64, hp:BOSS_HP, state:'wait', t:0, flash:0, phase:1, qi:0, face:-1, arm:null };
  else if (L.boss === 'heli') boss = { kind:'heli', x:BOSS_CX + 200, y:-40, hp:BOSS_HP, state:'wait', t:0, flash:0, phase:1, qi:0, face:-1, tx:BOSS_CX, ty:66, spot:null, tilt:0 };
  else if (L.boss === 'pastor') boss = { kind:'pastor', x:BOSS_CX - 30, y:GROUND - 80, w:60, h:80, hp:BOSS_HP, state:'wait', t:0, flash:0, phase:1, qi:0, face:-1, pose:'idle', vx:0, vy:0, air:false };
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
  P.inv = 130; P.vx = P.x + P.w / 2 < srcX ? -2.4 : 2.4; P.vy = -3.2;
  if (bite && score > 0) {
    const take = Math.min(score, 50); score -= take;
    popText('-$' + take + ' TITHE', P.x + 6, P.y - 10, '#ffd850');
    const tv = nearestTV(P.x, 400);
    for (let i = 0; i < 5; i++) parts.push({ x:P.x + 6, y:P.y + 4, vx:(Math.random() - 0.5) * 1.5, vy:-1.5 - Math.random(), life:60, c:'#ffd850', g:0.02, dollar:true, home:tv ? { x:tv.x + 16, y:tv.y + 14 } : null });
  }
  if (P.hearts <= 0) die();
}
function die() { state = 'dying'; stateT = 0; P.vy = -5; P.vx = 0; stopSong(); sfx('die'); }
function saveHi() { if (!demo && score > hiscore) { hiscore = score; try { localStorage.setItem('hmvp_hi', String(hiscore)); } catch (e) {} } }

/* =========================================================
   UPDATE
   ========================================================= */
function update() {
  frame++; stateT++;
  pollInput();
  if (shake > 0) shake--;
  switch (state) {
    case 'title':
      if (demoHash || stateT > DEMO_IDLE) { demoHash = false; startDemo(); break; }
      if (pressed.left || pressed.right) { stateT = 0; const n = FLOOR_ORDER.length; startFloor = FLOOR_ORDER[(FLOOR_ORDER.indexOf(startFloor) + (pressed.right ? 1 : n - 1)) % n]; sfx('select'); }
      if (pressed.start || pressed.jump || pressed.fire) {
        auInit(); sfx('select'); newSeed(); loadLevel(startFloor); startRun();
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
      if (stateT > 70) { state = 'play'; stateT = 0; playSong(camLock ? L.bossSong || 'boss' : L.song); }
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
        else { state = 'title'; stateT = 0; demo = null; }
      }
      break;
  }
}
function toFloorCard() { state = 'floorcard'; stateT = 0; stopSong(); }
function respawn() {
  // back on the last safe ground you stood on (easier than the checkpoint), else the checkpoint
  if (P.safeX !== undefined) { P.x = P.safeX; P.y = P.safeY; }
  else { const cp = lamps[cpIndex]; P.x = cp.x + 16; P.y = groundYAt(P.x + 6, P.h); }
  P.vx = 0; P.vy = 0; P.inv = 130; P.face = 1; P.belly = Math.max(P.belly, 50);
  cam = Math.max(0, Math.min(P.x - 140, COLS * T - W));
  blobs = []; sticks = []; tracts = [];
}

function updateWeather() {
  // roof: rain, lightning, and gusts that shove you (telegraphed on the HUD), calm during the boss
  if (--boltT <= 0) { boltT = 420 + Math.floor(Math.random() * 360); flashT = 10; setTimeout(() => sfx('thunder'), 500); }
  if (flashT > 0) flashT--;
  windT = (windT + 1) % 480;
  if (windT === 300) windDir = Math.random() < 0.5 ? -1 : 1;
  wind = !camLock && windT >= 360 ? windDir * 0.9 * Math.sin((windT - 360) / 120 * Math.PI) : 0;
  if (windT === 360 && !camLock) sfx('wind');
  if (wind && state === 'play') {
    const v = P.vx; P.vx = wind; P.x += wind; collideX(P); P.vx = v;
    for (const b of blobs) b.vx += wind * 0.02;
    if (frame % 2 === 0) parts.push({ x:cam + (wind > 0 ? -4 : W + 4), y:HUD + Math.random() * (GROUND - HUD), vx:wind * 6, vy:0.3, life:60, c:Math.random() < 0.3 ? '#6a8a3a' : '#8a98b8', g:0 });
  }
}
function updatePlay() {
  // hit-stop freezes everything for a beat, player included; presses made during it are kept, not dropped
  if (hitStop > 0) { hitStop--; for (const k of ACTS) if (pressed[k]) frozenPress[k] = 1; return; }
  for (const k of ACTS) if (frozenPress[k]) { pressed[k] = 1; frozenPress[k] = 0; }
  updatePlayer();
  if (state !== 'play') return;
  if (L.wind) updateWeather();
  if (!camLock && P.x > LOCK_X) { camLock = true; boss.state = 'intro'; boss.t = 0; playSong(L.bossSong || 'boss'); enemies = enemies.filter(e => e.x > ARENA_X - 40); }
  if (camLock) { cam += (ARENA_X - cam) * 0.1; if (Math.abs(cam - ARENA_X) < 0.5) cam = ARENA_X; }
  else { cam += ((P.x - 140 + P.face * 24) - cam) * 0.12; cam = Math.max(0, Math.min(cam, COLS * T - W)); }
  for (const s of spawns) if (!s.done && s.x < cam + W + 24 && s.x > cam - 24) { s.done = true; enemies.push(makeEnemy(s.type, s.x, s.o)); }
  lamps.forEach((l, i) => { if (!l.on && P.x > l.x) { l.on = true; cpIndex = i; sfx('check'); popText('CHECKPOINT', l.x + 6, GROUND - 40, '#ff88cc'); } });
  for (const e of enemies) updateEnemy(e);
  enemies = enemies.filter(e => !e.gone);
  updateDazed(); updateBlobs(); updateSnots(); updateClouds(); updateTracts(); updateBoss(); updateSticks(); updateWaves(); updateMomStuff(); updateNotes(); updateDiscs(); updatePickups(); updateTrash(); updateTVs(); updateParts();
  for (const p of puddles) p.life--; puddles = puddles.filter(p => p.life > 0);
  updateToys(); if (comboT > 0 && --comboT === 0) combo = 0;
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
  if (!held.jump && p.vy < -2.2 && !p.bounceT) p.vy = -2.2;
  if (p.bounceT > 0) p.bounceT--;
  moveBody(p);
  // waterbed: hold jump to launch, let go and the bounces die down
  if (p.onGround && p.floorT === 7 && (held.jump || p.landVy > 2.4)) {
    p.vy = held.jump ? -8.2 : -p.landVy * 0.6; p.onGround = false; p.bounceT = 24; p.jumpBuf = 0; sfx('boing');
    for (let i = 0; i < 6; i++) parts.push({ x:p.x + 6 + (Math.random() - 0.5) * 20, y:p.y + p.h, vx:(Math.random() - 0.5) * 1.2, vy:-0.8 - Math.random(), life:18, c:i % 2 ? '#80c8ff' : '#ffffff', g:0.1 });
  }
  if (camLock && p.x < ARENA_X + 2) { p.x = ARENA_X + 2; p.vx = Math.max(0, p.vx); }
  // remember solid footing a step back from any edge, for the ledge respawn
  if (p.onGround && p.floorT !== 7) {
    const fy = Math.floor((p.y + p.h + 1) / T), firm = c => { const t = tileT(c, fy); return isSolid(t) || t === 3; };
    if (firm(Math.floor((p.x - 10) / T)) && firm(Math.floor((p.x + p.w + 10) / T)) && firm(Math.floor((p.x + 6) / T))) { p.safeX = p.x; p.safeY = p.y; }
  }
  p.coyote = p.onGround ? 6 : Math.max(0, p.coyote - 1);
  p.anim += Math.abs(p.vx) * 0.09;
  if (p.cool > 0) p.cool--; if (p.pukeT > 0) p.pukeT--; if (p.emptyCd > 0) p.emptyCd--;
  if (held.fire && p.cool <= 0) {
    const cost = p.punch > 0 ? 3 : 5;
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

function makeEnemy(type, x, o) {
  const base = { type, x, vx:0, vy:0, face:-1, flash:0, stun:0, slip:0, slipCd:0, anim:0, onGround:false, mode:'walk', mt:0, cd:40 };
  if (type === 'rat') Object.assign(base, { w:16, h:9, hp:1 });
  else if (type === 'doll') { Object.assign(base, { w:10, h:16, hp:1, mode:'sit', face:-1 }); base.y = groundYAt(x + 5, 16); return base; }
  else if (type === 'sheet') { Object.assign(base, { w:14, h:20, hp:1, y:GROUND - 74, by:GROUND - 74, mt:0, cd:60 }); return base; }
  else Object.assign(base, { w:12, h:32, hp:type === 'mosher' ? 3 : 2, hops:0 });
  if (o) Object.assign(base, o, o.conga ? { mode:'conga' } : {});
  base.y = groundYAt(x + base.w / 2, base.h);
  return base;
}
const COMBO_NAMES = ['', '', 'DOUBLE BARF!', 'TRIPLE CHUNDER!', 'MEGA HURL!', 'ULTRA SPEW!'];
function killEnemy(e) {
  e.gone = true;
  const cx = e.x + e.w / 2;
  // purges within two seconds chain into a combo
  combo = comboT > 0 ? combo + 1 : 1; comboT = 120; hitStop = Math.max(hitStop, 3);
  if (combo >= 2) { popText(COMBO_NAMES[Math.min(combo, 5)] + (combo > 5 ? ' x' + combo : ''), P.x + 6, P.y - 26, '#ffd850', 70); addScore(combo * 100); sfx('power'); }
  // the conga line goes down like dominoes
  if (e.conga) {
    const line = enemies.filter(o => o.conga === e.conga && !o.gone && !o.domino);
    line.forEach((o, i) => { o.domino = 12 + i * 12; });
    if (line.length) { popText('CONGA-RATULATIONS!', cx, e.y - 34, '#ff88cc', 90); addScore(500); }
  }
  if (e.type === 'rat') { burst(cx, e.y + 4, 10, ['#c8ff3c', '#58a010', '#ffffff']); addScore(100, cx, e.y - 10); sfx('hit'); return; }
  if (e.type === 'doll') {
    burst(cx, e.y + 6, 14, ['#f8f0f0', '#ffffff', '#d8b8c8', '#c8ff3c'], 2); sfx('shatter');
    addScore(150, cx, e.y - 10); popText('SHATTERED!', cx, e.y - 20, '#f4f0ff', 45); return;
  }
  if (e.type === 'sheet') {
    staticPuff(cx, e.y + 10); sfx('purge'); burst(cx, e.y + 10, 10, ['#ffffff', '#c8ff3c']);
    parts.push({ x:cx - 9, y:e.y, vx:(Math.random() < 0.5 ? -1 : 1) * 0.8, vy:-1.5, life:80, g:0.04, spr:SHEET_RAG, spin:true });
    addScore(250, cx, e.y - 10); popText('UNSHEETED!', cx, e.y - 20, '#c8ff3c', 50); return;
  }
  staticPuff(cx, e.y + 14); sfx('purge');
  parts.push({ x:cx - 6, y:e.y + 12, vx:(Math.random() < 0.5 ? -1 : 1) * 1.6, vy:-3.4, life:70, g:0.15, spr:e.type === 'mosher' ? VEST : VEST_PINK, spin:true });
  addScore(e.type === 'mosher' ? 300 : e.type === 'pusher' ? 200 : 250, cx, e.y - 10);
  popText('PURGED!', cx, e.y - 20, '#c8ff3c', 50);
  const tv = nearestTV(cx, 150);
  dazed.push({ type:e.type, x:e.x, y:e.y, w:12, h:32, vx:0, vy:0, face:tv ? (tv.x + 16 > cx ? 1 : -1) : (P.x < e.x ? 1 : -1), t:0, tv, onGround:true, anim:0 });
}
// what the Born-Again Undead say when they first spot you
const LINES = {
  mosher:['THIS VEST IS PURE', 'MUSIC? NO THANKS', 'I MISS MY LEATHER', 'DEWEY KNOWS BEST', 'HAVE YOU TRIED SMILING?'],
  pusher:['HAVE YOU HEARD THE GOOD NEWS?', 'PAMPHLET?', 'SIGN THE PETITION!', 'REPENT. ALSO, TITHE.', 'TAKE ONE. TAKE TEN.'],
  aerobic:['FEEL THE BURN... OF SIN!', 'AND ONE AND PRAY!', 'JAZZERCISE FOR DEWEY!', 'LEG WARMERS ARE HOLY'],
  airg:['AIR GUITAR IS DEVIL GUITAR', 'I PLAY AIR PIANO NOW', '*SILENT STRUMMING*', 'THIS RIFF IS APPROVED'],
  sheet:['BOO.', 'OOOOH... TITHE...', 'I AM A GHOST (FOR DEWEY)'],
  rat:['SQUEAK OF GLORY'],
};
function enemyLine(e) {
  if (e.spoke || !LINES[e.type] || frame - lastLine < 110 || Math.abs(P.x - e.x) > 150) return;
  e.spoke = true;
  if (Math.random() < 0.5) { lastLine = frame; popText(LINES[e.type][Math.floor(Math.random() * LINES[e.type].length)], e.x + e.w / 2, e.y - 14, '#c8c4d4', 80); }
}
function updateEnemy(e) {
  enemyLine(e);
  if (e.domino > 0 && --e.domino === 0) { e.flash = 8; killEnemy(e); return; }
  if (e.mode === 'conga') {
    const dx = (P.x + P.w / 2) - (e.x + e.w / 2);
    e.face = dx >= 0 ? 1 : -1; e.vx = e.face * 0.45; e.anim += 0.05; moveBody(e);
    if (Math.abs(dx) < 46) for (const o of enemies) if (o.conga === e.conga && o.mode === 'conga') { o.mode = 'walk'; o.cd = 40; }
    if (overlap(e, P)) hurt(e.x + e.w / 2, true);
    return;
  }
  if (e.flash > 0) e.flash--; if (e.slipCd > 0) e.slipCd--; if (e.cd > 0) e.cd--;
  if (e.type === 'sheet') { updateSheet(e); return; }
  if (e.slip > 0) { e.slip--; e.vx *= 0.975; }
  else if (e.stun > 0) { e.stun--; e.vx *= 0.8; }
  else if (e.type === 'mosher') updateMosher(e);
  else if (e.type === 'pusher') updatePusher(e);
  else if (e.type === 'aerobic') updateAerobic(e);
  else if (e.type === 'airg') updateAirG(e);
  else if (e.type === 'doll') updateDoll(e);
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
// bedsheet ghost: floats above head height, swoops down at you, ignores walls
function updateSheet(e) {
  e.mt++;
  const dx = (P.x + P.w / 2) - (e.x + e.w / 2);
  if (e.stun > 0) { e.stun--; e.vx *= 0.85; e.vy = (e.by - e.y) * 0.05; if (e.mode === 'swoop') { e.mode = 'walk'; e.cd = 80; } }
  else if (e.mode === 'warn') {
    e.vx *= 0.85; e.vy = (e.by - 6 - e.y) * 0.1;
    if (e.mt > 30) { e.mode = 'swoop'; e.mt = 0; e.ty = Math.min(GROUND - e.h, P.y + 8); sfx('whip'); }
  } else if (e.mode === 'swoop') {
    e.vx = e.face * 1.7; e.vy = ((e.mt < 36 ? e.ty : e.by) - e.y) * 0.075;
    if (e.mt > 72) { e.mode = 'walk'; e.cd = 120; }
  } else {
    if (Math.abs(dx) < 260) e.face = dx >= 0 ? 1 : -1;
    e.vx += (e.face * 0.55 - e.vx) * 0.05;
    e.vy = (e.by + Math.sin(e.mt * 0.06) * 8 - e.y) * 0.1;
    if (!e.cd && Math.abs(dx) < 120 && Math.abs(dx) > 30) { e.mode = 'warn'; e.mt = 0; popText('BOO!', e.x + e.w / 2, e.y - 10, '#ffffff', 30); }
  }
  if (e.slimed > 0) { e.slimed--; e.vx *= 0.5; if (frame % 10 === 0) parts.push({ x:e.x + Math.random() * e.w, y:e.y + 10, vx:0, vy:0.6, life:24, c:'#9ad828', g:0.05 }); }
  e.x += e.vx; e.y = Math.min(GROUND - e.h, e.y + e.vy);
  e.anim += 0.12;
  if (overlap(e, P)) hurt(e.x + e.w / 2, true);
}
// porcelain doll: sits like decor until you get close, then sprints at you in little hops
function updateDoll(e) {
  const dx = (P.x + P.w / 2) - (e.x + e.w / 2);
  if (e.mode === 'sit') { e.vx = 0; if (Math.abs(dx) < 84 && Math.abs(P.y + P.h - e.y - e.h) < 48) { e.mode = 'wake'; e.mt = 22; e.face = dx >= 0 ? 1 : -1; sfx('doll'); popText('PLAY WITH ME', e.x + 5, e.y - 10, '#ff88cc', 40); } }
  else if (e.mode === 'wake') { e.vx = 0; if (--e.mt <= 0) e.mode = 'run'; }
  else {
    if (frame % 24 === 0) e.face = dx >= 0 ? 1 : -1;
    e.vx = e.face * 1.9;
    if (e.onGround && edgeAhead(e)) { e.vy = -3.6; }
    else if (e.onGround && frame % 20 === 0) e.vy = -1.8;
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
      if (fromAbove && t !== 5) { if (puddles.filter(p => !p.perm).length > 16) puddles.splice(puddles.findIndex(p => !p.perm), 1); puddles.push({ x:cx - 8, y:top, w:16, life:480 }); }
      if (onBlobTile) onBlobTile(tx, ty, b);
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
      b.dead = true; gag.done = true; gag.t = 240; sfx(gag.kind === 'phone' ? 'record' : gag.kind === 'dice' ? 'dice' : gag.kind === 'cat' ? 'meow' : 'backward'); addScore(300, gag.x + 13, gag.y - 8);
      if (gag.kind === 'dice') { P.hearts = Math.min(3, P.hearts + 1); P.belly = 100; }
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

const bossBox = () => boss.kind === 'heli' ? { x:boss.x - 30, y:boss.y - 12, w:60, h:30 } : boss.kind === 'phono' ? { x:boss.x, y:boss.y - 8, w:72, h:72 } : boss.kind === 'pastor' ? (boss.pose === 'plank' ? { x:boss.x - 10, y:GROUND - 30, w:80, h:26 } : { x:boss.x + 18, y:boss.y + 8, w:24, h:70 })
  : boss.kind === 'mom' ? { x:boss.x + 18, y:boss.y + 8, w:24, h:70 } : { x:boss.x + 6, y:boss.y, w:28, h:24 };
const bossHittable = () => ['idle', 'volley', 'crash', 'roll', 'records', 'cart', 'yell', 'walk', 'strum', 'luge', 'slam', 'spit', 'needle', 'backmask', 'plates', 'spot', 'strafe', 'troops'].includes(boss.state);
function throwStick(ft, jitter) {
  const g = 0.15, sx = BOSS_CX - 10, sy = boss.y + 4;
  const tx = P.x + P.w / 2 + (Math.random() * 2 - 1) * jitter;
  sticks.push({ x:sx, y:sy, vx:(tx - sx) / ft, vy:(GROUND - 4 - sy - 0.5 * g * ft * ft) / ft, rot:0, bounced:false, harmless:false });
  sfx('stick');
}
function updateBoss() { if (boss.kind === 'heli') updateHeli(); else if (boss.kind === 'phono') updatePhono(); else if (boss.kind === 'pastor') updatePastor(); else if (boss.kind === 'mom') updateMom(); else updateDrummer(); }
function updateDrummer() {
  const B = boss;
  if (B.state === 'wait') return;
  if (B.state === 'gone') { if (frame % 40 === 0) popText('Z', BOSS_CX + 10 + Math.random() * 6, B.y + 4, '#a8d8ff', 60); return; }
  B.t++; if (B.flash > 0) B.flash--; if (B.crashFlash > 0) B.crashFlash--;
  const p2 = B.phase === 2;
  switch (B.state) {
    case 'intro': B.arms = (B.t >> 3) & 1; if (B.t > 120) { B.state = 'idle'; B.t = 0; } break;
    case 'idle': B.arms = 0; if (B.t > (p2 ? 44 : 60)) { B.state = ['volley', 'crash', 'roll'][B.qi++ % 3]; B.t = 0; if (B.state === 'volley' && Math.random() < 0.5) popText('STICKS OF RIGHTEOUSNESS!', BOSS_CX - 30, B.y - 14, '#ffd850', 60); } break;
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
      if (B.t > (p2 ? 36 : 50)) { B.state = ['records', 'walk', 'cart', 'yell'][B.qi++ % 4]; B.t = 0; } break;
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
      if (B.t === 1) { sfx('honk'); popText('HONK HONK!', B.x + 30, B.y - 22, '#ffd850', 40); }
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
  if ((B.state === 'walk' || B.state === 'idle') && overlap(P, bossBox())) hurt(B.x + 30, true);
}
function updatePastor() {
  const B = boss;
  if (B.state === 'wait') return;
  if (B.state === 'gone') { if (frame % 140 === 0) popText(['IS IT TOO LATE TO START A BAND?', 'I WAS NEVER COOL.'][(frame / 140 | 0) % 2], B.x + 30, B.y - 8, '#c8c4d4', 110); return; }
  B.t++; if (B.flash > 0) B.flash--;
  const p2 = B.phase === 2, dx = (P.x + P.w / 2) - (B.x + 30);
  const turn = () => { B.face = dx >= 0 ? 1 : -1; };
  const LEFT = ARENA_X + 12, RIGHT = DOOR_X - 66;
  switch (B.state) {
    case 'intro':
      B.pose = (B.t >> 4) & 1 ? 'yell' : 'strum'; turn();
      if (B.t === 20) popText('WHO WANTS TO RAP ABOUT PURITY?', B.x + 30, B.y - 12, '#80c8ff', 90);
      if (B.t > 120) { B.state = 'idle'; B.t = 0; }
      break;
    case 'idle': B.pose = 'idle'; turn();
      if (B.t > (p2 ? 34 : 48)) { B.state = ['strum', 'luge', 'slam'][B.qi++ % 3]; B.t = 0; } break;
    case 'strum': {
      // a homing verse of music notes; puke them out of the air
      turn(); B.pose = 'strum';
      const n = p2 ? 5 : 3;
      for (let i = 0; i < n; i++) if (B.t === 18 + i * 12) {
        notes.push({ x:B.x + 30 + B.face * 24, y:B.y + 26, by:B.y + 26, vx:B.face * (p2 ? 2.1 : 1.7), t:i * 9 }); sfx('strum');
      }
      if (B.t === 18) popText(['KUMBAYA, DUDES!', 'THIS ONE GOES OUT TO PURITY!', 'SING ALONG!'][B.qi % 3], B.x + 30, B.y - 10, '#80c8ff', 60);
      if (B.t > 18 + n * 12 + 16) { B.state = 'idle'; B.t = 0; }
      break;
    }
    case 'luge':
      // belly-down on a skateboard, straight across the room: jump him
      if (B.t < 34) { B.pose = 'crouch'; if (B.t === 1) { B.face = B.x + 30 < (LEFT + RIGHT) / 2 + 30 ? 1 : -1; popText('TOTALLY RIGHTEOUS!', B.x + 30, B.y - 10, '#ffd850', 50); } }
      else {
        if (B.t === 34) { sfx('charge'); B.pose = 'plank'; }
        B.x += B.face * (p2 ? 4 : 3.2);
        if (frame % 3 === 0) parts.push({ x:B.x + 30 - B.face * 30, y:GROUND - 2, vx:-B.face * 0.6, vy:-0.4, life:14, c:'#ffd850', g:0 });
        if ((B.face > 0 && B.x >= RIGHT) || (B.face < 0 && B.x <= LEFT)) { B.x = Math.max(LEFT, Math.min(RIGHT, B.x)); B.state = 'idle'; B.t = 0; B.pose = 'idle'; shake = 3; sfx('hit'); }
      }
      break;
    case 'slam':
      // trust fall: leaps at you and lands with a shockwave each way
      if (B.t < 20) { B.pose = 'crouch'; turn(); if (B.t === 1) popText('TRUST FALL!', B.x + 30, B.y - 10, '#ff88cc', 50); }
      else if (B.t === 20) { const tx = P.x + P.w / 2 - 30; B.vx = Math.max(-3, Math.min(3, (tx - B.x) / 52)); B.vy = -6.6; B.air = true; B.pose = 'jump'; sfx('jump'); }
      else if (B.air) {
        B.vy += 0.26; B.x = Math.max(LEFT, Math.min(RIGHT, B.x + B.vx)); B.y += B.vy;
        if (B.y >= GROUND - 80) {
          B.y = GROUND - 80; B.air = false; B.pose = 'crouch'; shake = 10; sfx('boom');
          for (const d of [-1, 1]) waves.push({ x:B.x + 30 - 7 + d * 22, y:GROUND - 12, w:14, h:12, vx:d * (p2 ? 2.8 : 2.3), life:140 });
          B.land = B.t;
        }
      } else if (B.t - B.land > 24) {
        if (p2 && !B.again) { B.again = true; B.t = 19; } else { B.again = false; B.state = 'idle'; B.t = 0; }
      }
      break;
    case 'dying':
      B.pose = 'idle'; shake = 4;
      if (B.t % 6 === 0) staticPuff(B.x + 18 + Math.random() * 24, B.y + 10 + Math.random() * 60);
      if (B.t % 18 === 0) sfx('purge');
      if (B.t === 120) {
        B.state = 'gone'; sfx('boom');
        parts.push({ x:B.x + 24, y:B.y + 20, vx:1.4, vy:-4.5, life:90, g:0.15, spr:GUITAR_SPR, spin:true });
        addScore(7000, B.x + 30, B.y - 16); popText('PASTOR PURGED!', B.x + 30, B.y - 30, '#c8ff3c', 90);
        playSong('win', () => { doorOpen = true; if (state === 'play') { playSong(L.song); popText('GO UPSTAIRS', DOOR_X + 18, GROUND - 70, '#c8ff3c', 120); } });
      }
      break;
  }
  if (bossHittable() && overlap(P, bossBox())) hurt(B.x + 30, true);
}
function updatePhono() {
  const B = boss;
  if (B.state === 'wait' || B.state === 'gone') return;
  B.t++; if (B.flash > 0) B.flash--;
  const p2 = B.phase === 2, pcx = P.x + P.w / 2;
  const pivot = { x:B.x + 62, y:B.y - 8 }, rest = { x:B.x + 26, y:B.y - 10 };
  if (!B.arm) B.arm = { x:rest.x, y:rest.y };
  const armTo = (x, y, k) => { B.arm.x += (x - B.arm.x) * k; B.arm.y += (y - B.arm.y) * k; };
  switch (B.state) {
    case 'intro':
      armTo(rest.x, rest.y, 0.2);
      if (B.t === 30) popText('NAEM I EVOL... OOT TSUJ', B.x - 20, B.y - 90, '#c8ff3c', 90);
      if (B.t > 120) { B.state = 'idle'; B.t = 0; }
      break;
    case 'idle': armTo(rest.x, rest.y, 0.15); if (B.t > (p2 ? 36 : 50)) { B.state = ['spit', 'needle', 'backmask'][B.qi++ % 3]; B.t = 0; } break;
    case 'spit': {
      // flings records off the platter; they roll and hop along the floor
      armTo(rest.x, rest.y, 0.15);
      const n = p2 ? 5 : 3;
      for (let i = 0; i < n; i++) if (B.t === 16 + i * 16) { discs.push({ x:B.x + 10, y:B.y - 14, vx:-(p2 ? 2.9 : 2.4) - (i % 2) * 0.4, vy:-2.6, r:0 }); sfx('scratch'); }
      if (B.t > 16 + n * 16 + 14) { B.state = 'idle'; B.t = 0; }
      break;
    }
    case 'needle': {
      // the tonearm swings out, locks on, and drops the needle like a pickaxe
      if (B.t === 1) { B.tx = pcx; popText('SCRATCH!', B.x + 36, B.y - 40, '#ff5060', 50); }
      if (B.t < 34) { B.tx += (pcx - B.tx) * 0.12; armTo(B.tx, GROUND - 120, 0.12); }
      else if (B.t < 50) armTo(B.tx, GROUND - 120, 0.3);
      else if (B.t < 58) { armTo(B.tx, GROUND - 4, 0.45); if (B.t === 57) { shake = 9; sfx('boom'); for (const d of [-1, 1]) waves.push({ x:B.tx - 7 + d * 12, y:GROUND - 12, w:14, h:12, vx:d * (p2 ? 2.8 : 2.2), life:140 }); } }
      else if (B.t > 80) armTo(rest.x, rest.y, 0.12);
      if (B.t >= 50 && B.t < 80 && overlap(P, { x:B.arm.x - 5, y:B.arm.y - 16, w:10, h:20 })) hurt(B.arm.x, false);
      if (B.t > 104) { if (p2 && !B.again) { B.again = true; B.t = 0; } else { B.again = false; B.state = 'idle'; B.t = 0; } }
      break;
    }
    case 'backmask': {
      // the horn sings backwards: each letter homes in on you
      armTo(rest.x, rest.y, 0.15);
      const msg = (B.qi % 2 ? 'YEWEDYEBO' : 'YENOMDNES'), every = p2 ? 7 : 10;
      if (B.t === 6) popText('...' + (B.qi % 2 ? 'YEWED YEBO' : 'YENOM DNES') + '...', B.x - 30, B.y - 112, '#c8ff3c', 70);
      if (B.t >= 14 && (B.t - 14) % every === 0 && (B.t - 14) / every < msg.length) {
        notes.push({ x:B.x - 40, y:GROUND - 118, by:GROUND - 118, vx:-(p2 ? 2.0 : 1.6), t:0, ch:msg[(B.t - 14) / every] }); sfx('strum');
      }
      if (B.t > 14 + msg.length * every + 20) { B.state = 'idle'; B.t = 0; }
      break;
    }
    case 'dying':
      armTo(B.x + 36 + Math.sin(B.t * 0.5) * 30, B.y - 30, 0.3); shake = 4;
      if (B.t % 6 === 0) staticPuff(B.x + 10 + Math.random() * 52, B.y + Math.random() * 50);
      if (B.t % 14 === 0) { sfx('scratch'); parts.push({ x:B.x + 26, y:B.y - 12, vx:(Math.random() - 0.5) * 4, vy:-3 - Math.random() * 2, life:80, g:0.15, spr:RECORD, spin:true }); }
      if (B.t === 120) {
        B.state = 'gone'; sfx('boom'); shake = 12;
        for (let i = 0; i < 10; i++) parts.push({ x:B.x + 36, y:B.y, vx:(Math.random() - 0.5) * 5, vy:-2 - Math.random() * 4, life:90, g:0.15, spr:RECORD, spin:true });
        addScore(8000, B.x + 36, B.y - 30); popText('BACKMASKER BUSTED!', B.x + 36, B.y - 50, '#c8ff3c', 90);
        playSong('win', () => { doorOpen = true; if (state === 'play') { playSong(L.song); popText('UP TO THE ROOF', DOOR_X + 18, GROUND - 70, '#c8ff3c', 120); } });
      }
      break;
  }
  if (bossHittable() && overlap(P, bossBox())) hurt(B.x + 36, true);
}
function updateDiscs() {
  for (const d of discs) {
    d.vy += 0.2; d.x += d.vx; d.y += d.vy; d.r++;
    if (d.y > GROUND - 8) { d.y = GROUND - 8; d.vy = -2.8; }
    const box = { x:d.x - 7, y:d.y - 7, w:14, h:14 };
    if (overlap(P, box)) { hurt(d.x, false); d.dead = true; }
    for (const b of blobs) if (!b.dead && overlap(b, box)) { b.dead = true; d.dead = true; }
    for (const s of snots) if (!s.dead && overlap(s, box)) { s.dead = true; d.dead = true; }
    if (d.dead && !overlap(P, box)) { burst(d.x, d.y, 8, ['#141018', '#9ae030', '#6a6080']); addScore(50, d.x, d.y - 8); sfx('stick'); }
    if (d.x < ARENA_X - 20) d.dead = true;
  }
  discs = discs.filter(d => !d.dead);
}
function throwPlate(sx, sy, ft, jitter) {
  const g = 0.15, tx = P.x + P.w / 2 + (Math.random() * 2 - 1) * jitter, ty = P.y + P.h - 4;
  sticks.push({ x:sx, y:sy, vx:(tx - sx) / ft, vy:(ty - sy - 0.5 * g * ft * ft) / ft, rot:0, bounced:false, harmless:false, plate:true });
  sfx('toss');
}
function updateHeli() {
  const B = boss;
  if (B.state === 'wait') return;
  if (B.state === 'gone') { if (frame % 6 === 0) parts.push({ x:ARENA_X + 30 + Math.random() * 30, y:GROUND + 10, vx:0.2, vy:-0.8, life:120, c:'#3a3446', g:-0.002 }); return; }
  B.t++; if (B.flash > 0) B.flash--;
  const p2 = B.phase === 2, pcx = P.x + P.w / 2, L0 = ARENA_X + 50, R0 = ARENA_X + W - 50;
  const fly = (tx, ty, k = 0.04) => { const dx = tx - B.x; B.x += dx * k; B.y += (ty - B.y) * k; B.tilt = Math.max(-0.25, Math.min(0.25, dx * 0.004)); };
  const bob = Math.sin(frame * 0.05) * 4;
  if (B.state !== 'strafe') B.face = pcx < B.x ? -1 : 1;
  if (p2 && frame % 5 === 0 && B.state !== 'dying') parts.push({ x:B.x + 20 * -B.face, y:B.y - 8, vx:(Math.random() - 0.5) * 0.4, vy:-0.6, life:50, c:'#4a4458', g:-0.004 });
  switch (B.state) {
    case 'intro':
      fly(BOSS_CX, 40, 0.035);
      if (B.t === 40) popText('FRIENDS! WE ARE LIVE!', BOSS_CX, 110, '#ffd850', 90);
      if (B.t > 140) { B.state = 'idle'; B.t = 0; }
      break;
    case 'idle':
      if (B.t === 1) B.tx = L0 + Math.random() * (R0 - L0);
      fly(B.tx, 40 + bob);
      if (B.t > (p2 ? 44 : 60)) { B.state = ['plates', 'spot', 'strafe', 'plates', 'troops'][B.qi++ % 5]; B.t = 0; }
      break;
    case 'plates': {
      // collection plates, flung at you
      fly(B.tx, 40 + bob, 0.03);
      const throws = p2 ? [20, 30, 40, 50, 60] : [20, 34, 48];
      throws.forEach((f, i) => { if (B.t === f) throwPlate(B.x + B.face * 10, B.y + 12, 40 + i * 4, 18); });
      if (B.t === 18) popText(['PASS THE PLATE!', 'GIVE TILL IT HURTS!', 'TITHE, SON!'][B.qi % 3], B.x, B.y - 26, '#ffd850', 50);
      if (B.t > (p2 ? 84 : 74)) { B.state = 'idle'; B.t = 0; }
      break;
    }
    case 'spot': {
      // the spotlight hunts you; when it locks on, the Reverend calls down a smiting
      fly(B.tx, 40 + bob, 0.03);
      if (B.t === 1) { B.spot = { x:B.x, lock:0, strikes:0 }; popText('LET ME SEE YOU, SON!', B.x, B.y - 26, '#fff0a0', 50); }
      const S = B.spot;
      if (!S.lock) { S.x += Math.sign(pcx - S.x) * Math.min(Math.abs(pcx - S.x), p2 ? 2.6 : 1.9); if (Math.abs(pcx - S.x) < 4 || B.t > 150) { S.lock = 1; sfx('charge'); } }
      else if (++S.lock === 50) { sfx('zap'); shake = 6; S.fire = 12; }
      if (S.fire > 0) { S.fire--; if (overlap(P, { x:S.x - 12, y:0, w:24, h:GROUND })) hurt(S.x, false); if (frame % 2 === 0) burst(S.x, GROUND - 4, 4, ['#ffffff', '#fff0a0'], 2); }
      if (S.lock > 68) { S.strikes++; if (p2 && S.strikes < 2) { S.lock = 0; } else { B.state = 'idle'; B.t = 0; B.spot = null; } }
      break;
    }
    case 'strafe': {
      // dives low and sweeps the roof: get off the platforms
      if (B.t === 1) { B.face = B.x < (L0 + R0) / 2 ? 1 : -1; B.sx = B.face > 0 ? L0 - 30 : R0 + 30; popText('HALLELUJAH!', B.x, B.y - 26, '#ff88cc', 50); }
      if (B.t < 40) fly(B.sx, 50, 0.08);
      else if (B.t < 44) { if (B.t === 40) sfx('charge'); }
      else { B.x += B.face * (p2 ? 3.8 : 3); B.y += (118 - B.y) * 0.1; B.tilt = B.face * 0.3;
        if ((B.face > 0 && B.x > R0 + 30) || (B.face < 0 && B.x < L0 - 30)) { B.state = 'idle'; B.t = 0; } }
      break;
    }
    case 'troops':
      fly(B.tx, 44 + bob, 0.04);
      if (B.t === 10) popText('SEND IN THE FAITHFUL!', B.x, B.y - 26, '#80c8ff', 50);
      if ((B.t === 30 || (p2 && B.t === 60)) && enemies.length < 3) {
        const e = makeEnemy(B.t === 30 ? 'pusher' : 'mosher', B.x - 6); e.y = B.y + 14; e.vy = 0; enemies.push(e); sfx('toss');
      }
      if (B.t > 80) { B.state = 'idle'; B.t = 0; }
      break;
    case 'dying':
      B.tilt = Math.sin(B.t * 0.4) * 0.6; B.x -= 1.2; B.y += 0.5 + B.t * 0.01; shake = 4;
      if (B.t % 4 === 0) parts.push({ x:B.x, y:B.y, vx:(Math.random() - 0.5), vy:-1, life:60, c:Math.random() < 0.5 ? '#ff7020' : '#3a3446', g:-0.01 });
      if (B.t % 18 === 0) sfx('purge');
      if (B.t === 40) popText('NOT ON LIVE TV!', B.x, B.y - 26, '#ffd850', 70);
      if (B.t === 160) {
        B.state = 'gone'; sfx('boom'); shake = 16; flashT = 14;
        for (const tv of tvs) if (tv.on) { tv.on = false; burst(tv.x + 16, tv.y + 14, 10, ['#ffffff', '#80c8ff'], 2); }
        addScore(10000, BOSS_CX, 90); popText('GLORY ONE IS DOWN!', BOSS_CX, 80, '#c8ff3c', 120); popText('SIGNAL LOST', BOSS_CX, 100, '#80c8ff', 120);
        playSong('win', () => { doorOpen = true; if (state === 'play') { playSong('stage'); popText('FREE ROXY!', DOOR_X + 18, GROUND - 74, '#ff88cc', 160); } });
      }
      break;
  }
  if (B.state === 'strafe' && overlap(P, bossBox())) hurt(B.x, false);
}
/* ---------- toys: per-floor interactive set pieces ---------- */
function ampBlast(t) {
  t.cd = 420; t.fired = 60; shake = 8; sfx('feedback'); popText('FEEDBACK!', t.x + 12, t.y - 12, '#ffd850', 60);
  for (const e of enemies) {
    const d = (e.x + e.w / 2) - (t.x + 12);
    if (Math.abs(d) > 230 || e.gone) continue;
    e.stun = 90; e.vx = Math.sign(d || 1) * 3; e.vy = -2.5; e.flash = 8; e.hp--;
    if (e.mode === 'charge' || e.mode === 'bang') { e.mode = 'dizzy'; e.mt = 90; }
    if (e.hp <= 0) killEnemy(e);
  }
}
function onBlobTile(tx, ty, b) { for (const t of toys) if (t.onTile) t.onTile(t, tx, ty, b); }
function updateToys() {
  for (const t of toys) {
    if (t.cd > 0) t.cd--; if (t.fired > 0) t.fired--;
    if (t.update) t.update(t);
    if (!t.onHit || (t.cd || 0) > 0) continue;
    const box = { x:t.x, y:t.y, w:t.w, h:t.h };
    for (const b of blobs) if (!b.dead && overlap(b, box)) { b.dead = true; t.onHit(t); break; }
    if ((t.cd || 0) > 0) continue;
    for (const sn of snots) if (!sn.dead && overlap(sn, box)) { sn.dead = true; t.onHit(t); break; }
  }
}
function updateNotes() {
  for (const n of notes) {
    n.t++; n.x += n.vx;
    n.by += Math.sign(P.y + 12 - n.by) * 0.35;
    n.y = n.by + Math.sin(n.t * 0.14) * 10;
    const box = { x:n.x - 5, y:n.y - 6, w:10, h:12 };
    if (overlap(P, box)) { hurt(n.x, false); n.dead = true; }
    for (const b of blobs) if (!b.dead && overlap(b, box)) { b.dead = true; n.dead = true; }
    for (const s of snots) if (!s.dead && overlap(s, box)) { s.dead = true; n.dead = true; }
    for (const c of clouds) if (overlap({ x:c.x - c.r, y:c.y - c.r, w:c.r * 2, h:c.r * 2 }, box)) n.dead = true;
    if (n.dead && !overlap(P, box)) { burst(n.x, n.y, 8, ['#ffd850', '#ff88cc', '#ffffff']); addScore(50, n.x, n.y - 8); sfx('stick'); }
    if (n.t > 260 || n.x < ARENA_X - 20 || n.x > ARENA_X + W + 20) n.dead = true;
  }
  notes = notes.filter(n => !n.dead);
}
function damageBoss(n, x, y) {
  hitStop = Math.max(hitStop, 3);
  boss.hp -= n; boss.flash = 8; shake = 3; sfx('bossHit'); addScore(100);
  if (boss.hp <= Math.floor(BOSS_HP / 2) && boss.phase === 1) { boss.phase = 2; popText(boss.kind === 'mom' ? 'NOW SHE\'S MAD!' : boss.kind === 'pastor' ? 'NOT COOL, DUDE!' : boss.kind === 'phono' ? 'SKIPPING!' : boss.kind === 'heli' ? 'ENGINE SMOKING!' : 'HE IS ENRAGED!', x, 120, '#ff5060'); }
  if (boss.hp <= 0) {
    boss.state = 'dying'; boss.t = 0; stopSong(); sticks = []; waves = []; frisbees = []; carts = []; yells = []; notes = []; discs = []; tracts = [];
    for (const e of enemies) staticPuff(e.x + e.w / 2, e.y + e.h / 2);
    enemies = []; dazed = []; if (boss.kind === 'pastor') { boss.pose = 'idle'; boss.y = GROUND - 80; boss.air = false; } }
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
