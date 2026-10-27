/* =========================================================
   RENDER
   ========================================================= */
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function disc(cx, cy, r, c) { ctx.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy)); ctx.fillRect(Math.round(cx) - hw, Math.round(cy) + dy, hw * 2 + 1, 1); } }
function bands(x, y, w, h, cols) { const n = cols.length; for (let i = 0; i < n; i++) rect(x, y + Math.floor(h * i / n), w, Math.ceil(h / n) + 1, cols[i]); }
let lights = [];
const pair_SNOT = pair(SNOT);
const light = (x, y, r, c, a = 0.22) => lights.push({ x, y, r, c, a });

/* ---------- lighting: darkness with banded light pools, plus colored glow ---------- */
const [LM, lmx] = canvasOf(W, H);
function drawLighting(dark = 0.6) {
  lmx.globalCompositeOperation = 'source-over';
  lmx.clearRect(0, 0, W, H);
  lmx.fillStyle = `rgba(14,4,28,${dark})`; lmx.fillRect(0, 0, W, H);
  lmx.globalCompositeOperation = 'destination-out';
  for (const L of lights) for (let k = 4; k >= 1; k--) { lmx.fillStyle = 'rgba(0,0,0,0.24)'; lmx.beginPath(); lmx.arc(L.x, L.y, L.r * k / 4, 0, 7); lmx.fill(); }
  ctx.drawImage(LM, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of lights) if (L.c) for (let k = 3; k >= 1; k--) { ctx.globalAlpha = L.a * 0.16; ctx.fillStyle = L.c; ctx.beginPath(); ctx.arc(L.x, L.y, L.r * k / 3 * 0.8, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

/* ---------- wall decor (parallax 0.6) ---------- */
const WALL_DECOR = [
  { t:'banner', x:110, y:52, str:'VOMITRON', c:'#ff70c0' }, { t:'window', x:250 }, { t:'penta', x:360, y:70 },
  { t:'goat', x:460, y:58 }, { t:'graffiti', x:540, y:128, str:'HAIL PUKE', c:'#c8ff3c' }, { t:'poster', x:640, i:2 },
  { t:'banner', x:720, y:52, str:'SKULLDRIFT', c:'#ffd850' }, { t:'guitar', x:850, y:104 }, { t:'window', x:930 },
  { t:'penta', x:1030, y:76 }, { t:'goat', x:1130, y:58 }, { t:'poster', x:1230, i:0 }, { t:'graffiti', x:1290, y:132, str:'MOSH OR DIE', c:'#ff70c0' },
  { t:'banner', x:1360, y:52, str:'DOOM PIZZA', c:'#80c8ff' }, { t:'poster', x:1470, i:1 }, { t:'bigpenta', x:1678, y:64 },
  { t:'banner', x:1678, y:42, str:'BLOOD GOAT', c:'#ff5040', center:true },
];
const GRAFFITI = ['HAIL PUKE', 'MOSH OR DIE', 'DEWEY SUX', 'PIZZA = LIFE', 'NOT A GATEWAY FOOD', 'BARF 4 EVER', 'VOMITRON RULEZ', 'FREE ROXY', 'SEND NO MONEY'];
const POSTER = [
  { bg:'#ff70c0', inner:'#1a0a20', icon:'skull' }, { bg:'#80c8ff', inner:'#0a1020', icon:'bolt' }, { bg:'#f4f0ff', inner:'#140810', icon:'cross' },
];
const PENTA = (() => {
  const mk = (r, col, glow) => paint(r * 2 + 6, r * 2 + 22, g => {
    const cx = r + 3, cy = r + 3;
    const stroke = (x, y, c) => { g.px(x, y, c); g.px(x + 1, y, c); };
    for (let i = 0; i < 720; i++) { const a = i * Math.PI / 360; stroke(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), col); }
    const pts = []; for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + k * 2 * Math.PI / 5; pts.push([cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2)]); }
    for (let k = 0; k < 5; k++) { const [ax, ay] = pts[k], [bx, by] = pts[(k + 2) % 5]; const n = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay))); for (let i = 0; i <= n; i++) stroke(Math.round(ax + (bx - ax) * i / n), Math.round(ay + (by - ay) * i / n), col); }
    const R = rng(r * 7); for (let i = 0; i < 6; i++) { const dx = Math.round(cx - r * 0.75 + R() * r * 1.5); const top = Math.round(cy + Math.sqrt(Math.max(0, r * r - (dx - cx) ** 2))); g.rect(dx, top, 1, 3 + Math.floor(R() * 12), col); g.px(dx, top + 2, glow); }
  }, null);
  return { s:mk(20, '#d02018', '#ff6040'), l:[mk(34, '#e02818', '#ff8050'), mk(34, '#ff5030', '#ffc080')] };
})();
const CROSS_INV = paint(10, 14, g => { g.rect(4, 0, 2, 14, '#e02818'); g.rect(1, 9, 8, 2, '#e02818'); }, null);
const SKULL = paint(12, 12, g => { g.ell(6, 5, 5, 4, '#f4f0e8'); g.rect(3, 8, 6, 3, '#f4f0e8'); g.rect(3, 4, 2, 2, '#140810'); g.rect(7, 4, 2, 2, '#140810'); g.px(6, 7, '#140810'); g.px(4, 10, '#140810'); g.px(6, 10, '#140810'); g.px(8, 10, '#140810'); }, null);
const BOLT = paint(10, 14, g => { g.line(7, 0, 2, 7, '#ffd850', 2); g.line(2, 7, 8, 7, '#ffd850', 2); g.line(8, 7, 3, 13, '#ffd850', 2); }, null);

function drawBanner(x, y, str, col) {
  const w = str.length * 8 + 16;
  rect(x, y, w, 18, '#0c0810'); rect(x, y, w, 1, col); rect(x, y + 17, w, 1, '#2a1a30');
  for (let i = 0; i < w; i += 4) rect(x + i, y + 18, 2, 2, '#0c0810');
  rect(x - 1, y - 3, 1, 5, '#8a8498'); rect(x + w, y - 3, 1, 5, '#8a8498');
  text(str, x + 8, y + 5, col, { shadow:'#000' });
  for (let i = 0; i < str.length; i += 3) rect(x + 10 + i * 8, y + 13, 1, 2 + (i * 5) % 4, col);
}
const HERO_TURBO = tintSet(HERO, '#40e0ff', 0.3);
const FLOOR_ZONE = tx => L.zone ? L.zone(tx) : null;
const DECOR_F1 = [
  { t:'cabinets', x:96, w:90 }, { t:'clock', x:205 }, { t:'cabinets', x:300, w:120 }, { t:'window', x:470 }, { t:'banned', x:600 },
  { t:'cabinets', x:780, w:110 }, { t:'streamers', x:900, w:160 },
  { t:'partybanner', x:1060 }, { t:'window', x:1180 }, { t:'portrait', x:1240 }, { t:'photos', x:1420 }, { t:'streamers', x:1500, w:220 },
  { t:'window', x:1700 }, { t:'portrait', x:1840 }, { t:'partybanner', x:1990 }, { t:'streamers', x:2100, w:140 },
  { t:'trophies', x:2290 }, { t:'pure', x:2420 }, { t:'banned', x:2560 }, { t:'portrait', x:2760 }, { t:'window', x:2860 },
];
const DECOR_F2 = [
  { t:'photos', x:110 }, { t:'window', x:250 }, { t:'stitch', x:420 }, { t:'portrait', x:560 }, { t:'window', x:660 },
  { t:'stars', x:780, w:820 }, { t:'unicorn', x:860 }, { t:'list', x:1020, title:'CHORES', items:['PRAY', 'TITHE', 'NO MTV', 'NO FUN', 'PRAY'], c:'#3048c0' },
  { t:'window', x:1200 }, { t:'boyband', x:1330 }, { t:'unicorn', x:1480 },
  { t:'mirror', x:1700 }, { t:'mirror', x:1880 },
  { t:'keepout', x:2080 }, { t:'banner', x:2130, str:'VOMITRON', c:'#ff70c0' }, { t:'poster', x:2300, i:0 }, { t:'window', x:2380 }, { t:'banner', x:2470, str:'SKULLDRIFT', c:'#ffd850' },
  { t:'poster', x:2640, i:1 }, { t:'poster', x:2700, i:2 },
  { t:'portrait', x:2860 }, { t:'pure', x:2940 }, { t:'portrait', x:3040 },
];
const DECOR_F3 = [
  { t:'roundwin', x:200 }, { t:'stencil', x:330, str:'XMAS' }, { t:'roundwin', x:700 }, { t:'stencil', x:880, str:'BABY CLOTHES' },
  { t:'stencil', x:1240, str:'CONFISCATED' }, { t:'roundwin', x:1450 }, { t:'stencil', x:1620, str:'CONFISCATED' }, { t:'stencil', x:1900, str:'BURN LATER' },
  { t:'pure', x:2180 }, { t:'roundwin', x:2440 }, { t:'stencil', x:2560, str:'PLEDGES' }, { t:'stencil', x:2760, str:'DO NOT PLAY' }, { t:'roundwin', x:2960 },
];
const HOUSE_CFG = {
  f1:{ walls:[[960, KITCHEN_WALL], [2240, LIVING_WALL], [1e9, DEN_WALL]], decor:DECOR_F1, fixtures:[180, 560, 900, 1300, 1700, 2100, 2500, 2860], fix:'#fff0c0', molding:['#f0e8d8', '#c8b898', '#8a7a5a'] },
  f2:{ walls:[[768, HALL_WALL], [1600, SIS_WALL], [2048, BATH_WALL], [2816, TEEN_WALL], [1e9, MASTER_WALL]], decor:DECOR_F2,
       fixtures:[200, 560, 1000, 1400, 1840, 2900, 3060], fix:'#fff0c0', molding:['#e8e0d0', '#b8a888', '#6a5a3a'], doorways:[768, 1600, 2048, 2816] },
  f3:{ walls:[[1e9, ATTIC_WALL]], decor:DECOR_F3, fixtures:[120, 420, 760, 1100, 1380, 1700, 2000, 2300, 2620, 2940, 3120], fix:'#ffd890', molding:['#24160a', '#3a2614', '#140a04'], bulbs:true },
};
function drawHouseWall(cx) {
  const cfg = HOUSE_CFG[L.id], x0 = Math.floor(cx / 64) * 64;
  for (let wx = x0; wx < cx + W + 64; wx += 64) ctx.drawImage(cfg.walls.find(w => wx < w[0])[1], wx - cx, HUD);
  // crown molding + ceiling
  rect(0, HUD, W, 6, cfg.molding[0]); rect(0, HUD + 6, W, 2, cfg.molding[1]); rect(0, HUD + 8, W, 1, cfg.molding[2]);
  for (const dx of cfg.doorways || []) {
    const x = dx - cx; if (x < -40 || x > W + 40) continue;
    rect(x - 10, HUD + 9, 20, GROUND - HUD - 9, '#e8dcc0'); rect(x - 8, HUD + 9, 2, GROUND - HUD - 9, '#ffffff'); rect(x + 6, HUD + 9, 4, GROUND - HUD - 9, '#b8a888');
  }
  for (const d of cfg.decor) {
    const x = Math.round(d.x - cx);
    if (x < -240 || x > W + 240) continue;
    switch (d.t) {
      case 'cabinets':
        rect(x, HUD + 9, d.w, 40, '#9a6a3a'); rect(x, HUD + 48, d.w, 2, '#5a3418');
        for (let i = 0; i < d.w; i += 30) { rect(x + i + 2, HUD + 12, 26, 34, '#b07a44'); rect(x + i + 2, HUD + 12, 26, 1, '#d09858'); rect(x + i + 24, HUD + 30, 2, 4, '#e8c048'); }
        break;
      case 'clock': disc(x, 80, 10, '#f4f0e8'); disc(x, 80, 8, '#ffffff'); rect(x, 74, 1, 6, '#141018'); rect(x, 80, 5, 1, '#141018'); rect(x - 10, 80, 1, 1, '#8a8698'); break;
      case 'window':
        rect(x, 62, 48, 50, '#f0e8d8'); rect(x + 3, 65, 42, 44, '#101848'); rect(x + 3, 65, 42, 6, '#1a2868');
        rect(x + 23, 65, 2, 44, '#f0e8d8'); rect(x + 3, 86, 42, 2, '#f0e8d8'); rect(x + 9, 70, 2, 2, '#c0d8ff'); rect(x + 35, 76, 1, 1, '#ffffff');
        rect(x - 6, 58, 8, 58, '#c02848'); rect(x + 46, 58, 8, 58, '#c02848'); rect(x - 8, 56, 64, 3, '#8a5428');
        if ((frame >> 6) % 5 === 0) { rect(x + 30, 92, 3, 16, '#0a0410'); rect(x + 31, 95, 1, 1, '#c8ff3c'); }
        light(x + 24, 88, 34, '#3050c0', 0.14); break;
      case 'banned': {
        rect(x, 66, 64, 76, '#f8f4e4'); rect(x, 66, 64, 12, '#c02030');
        text('BANNED', x + 32, 68, '#ffffff', { align:'center' });
        ['ROCK', 'DICE', 'LAVA LAMPS', 'SKATES', 'BLACK'].forEach((w, i) => { text(w, x + 6, 84 + i * 11, '#3a3020'); rect(x + 4, 87 + i * 11, w.length * 8 + 4, 1, '#c02030'); });
        break;
      }
      case 'streamers':
        for (let i = 0; i < d.w; i += 4) { const y = HUD + 10 + Math.round(Math.sin(i / d.w * Math.PI) * 14); rect(x + i, y, 4, 2, ['#ff60c0', '#60e8ff', '#ffd850'][(i / 4) % 3]); }
        for (let i = 10; i < d.w; i += 40) { disc(x + i, HUD + 30 + (i % 3) * 4, 5, ['#e02838', '#40c0ff', '#ffd850'][(i / 40 | 0) % 3]); rect(x + i, HUD + 36 + (i % 3) * 4, 1, 12, '#c8c4d4'); }
        break;
      case 'partybanner':
        for (let i = 0; i < 8; i++) { const bx = x + i * 14, by = 54 + Math.round(Math.sin(i / 7 * Math.PI) * 6); ctx.fillStyle = ['#ff60c0', '#60e8ff', '#ffd850', '#c8ff3c'][i % 4]; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 12, by); ctx.lineTo(bx + 6, by + 12); ctx.fill(); }
        text('PARTY!', x + 56, 72, '#ffd850', { align:'center', shadow:'#000' }); break;
      case 'portrait':
        ctx.drawImage(FRAME_DEWEY, x, 64);
        bands(x + 3, 67, 24, 30, ['#5838a8', '#7048b8', '#c8a040', '#7048b8']);
        ctx.drawImage(DEWEY_SMALL, 0, 0, 20, 15, x + 5, 74, 20, 15);
        rect(x + 3, 92, 24, 5, '#c02030'); light(x + 15, 80, 22, '#ffd850', 0.12); break;
      case 'photos':
        for (let i = 0; i < 3; i++) { const px0 = x + i * 26, py0 = 70 + (i % 2) * 10; rect(px0, py0, 20, 24, '#c89838'); rect(px0 + 2, py0 + 2, 16, 20, '#a8c8e8'); disc(px0 + 10, py0 + 10, 4, '#c6d3bd'); rect(px0 + 8, py0 + 9, 1, 1, '#c8ff3c'); rect(px0 + 11, py0 + 9, 1, 1, '#c8ff3c'); rect(px0 + 6, py0 + 15, 8, 7, '#3a6ec8'); }
        break;
      case 'trophies':
        rect(x, 110, 90, 4, '#8a5428'); rect(x, 110, 90, 1, '#c08048');
        for (let i = 0; i < 4; i++) { const tx0 = x + 8 + i * 22; rect(tx0, 96, 10, 10, '#ffc030'); rect(tx0 + 3, 106, 4, 4, '#c89020'); rect(tx0 - 2, 98, 2, 4, '#ffc030'); rect(tx0 + 10, 98, 2, 4, '#ffc030'); rect(tx0 + 2, 97, 2, 6, '#fff0a0'); }
        text('CHOIR', x + 45, 118, '#ffc030', { align:'center' }); break;
      case 'pure':
        rect(x, 60, 70, 90, '#f4f0ff'); rect(x + 3, 63, 64, 84, '#2a1858');
        text('P.U.R.E.', x + 35, 70, '#ffd850', { align:'center', bands:GOLD });
        text('STOP', x + 35, 88, '#ffffff', { align:'center' }); text('THE', x + 35, 98, '#ffffff', { align:'center' }); text('FILTH', x + 35, 108, '#ff5060', { align:'center' });
        ctx.drawImage(RECORD, x + 27, 122); rect(x + 25, 129, 20, 2, '#e02838'); break;
      case 'stitch':
        rect(x, 66, 76, 46, '#8a5428'); rect(x + 3, 69, 70, 40, '#f8f4e4');
        for (let i = 0; i < 70; i += 4) { rect(x + 3 + i, 70, 2, 1, '#c02848'); rect(x + 3 + i, 107, 2, 1, '#c02848'); }
        text('BLESS', x + 38, 76, '#3a6a30', { align:'center' }); text('THIS', x + 38, 86, '#3a6a30', { align:'center' }); text('MESS', x + 38, 96, '#c02848', { align:'center' }); break;
      case 'stars':
        for (let i = 0; i < d.w; i += 23) { const sy = 40 + ((i * 37) % 70), tw = ((frame >> 4) + i) % 5; rect(x + i, sy, 1, 3, '#c8ffb0'); rect(x + i - 1, sy + 1, 3, 1, '#c8ffb0'); if (tw === 0) rect(x + i, sy + 1, 1, 1, '#ffffff'); }
        break;
      case 'unicorn':
        rect(x, 66, 40, 50, '#ffffff'); rect(x + 2, 68, 36, 46, '#a8d8ff');
        for (let i = 0; i < 5; i++) rect(x + 2, 100 + i * 2, 36, 2, ['#ff6060', '#ffc040', '#f8f060', '#60e080', '#6090ff'][i]);
        disc(x + 20, 86, 8, '#ffffff'); rect(x + 14, 90, 12, 10, '#ffffff'); rect(x + 24, 72, 2, 8, '#ffd850'); rect(x + 22, 84, 2, 2, '#ff60c0'); rect(x + 12, 80, 4, 8, '#ff88cc'); break;
      case 'list':
        rect(x, 66, 64, 76, '#f8f4e4'); rect(x, 66, 64, 12, d.c);
        text(d.title, x + 32, 68, '#ffffff', { align:'center' });
        d.items.forEach((w, i) => { text(w, x + 14, 84 + i * 11, '#3a3020'); rect(x + 5, 85 + i * 11, 5, 5, '#3a3020'); rect(x + 6, 86 + i * 11, 3, 3, '#f8f4e4'); });
        break;
      case 'boyband':
        rect(x, 62, 60, 70, '#40c0ff'); rect(x + 2, 64, 56, 66, '#ffe0f0');
        for (let i = 0; i < 4; i++) { const bx = x + 8 + i * 13; disc(bx + 2, 84, 4, '#f0c8a0'); rect(bx - 2, 78, 9, 4, ['#3a2010', '#e8c060', '#3a2010', '#8a5428'][i]); rect(bx - 2, 90, 9, 18, ['#ff60c0', '#ffd850', '#60e8ff', '#c8ff3c'][i]); }
        text('THE GOOD', x + 30, 112, '#c02848', { align:'center' }); text('BOYS', x + 30, 121, '#c02848', { align:'center' }); break;
      case 'mirror':
        rect(x, 70, 56, 50, '#c8c4d4'); rect(x + 3, 73, 50, 44, '#90b0c8'); rect(x + 6, 76, 10, 2, '#ffffff'); rect(x + 6, 80, 4, 2, '#ffffff');
        text(d.x < 1800 ? 'YENOM' : 'YEWED', x + 28, 86, '#e02838', { align:'center' }); text(d.x < 1800 ? 'DNES' : 'YEBO', x + 28, 98, '#e02838', { align:'center' });
        light(x + 28, 96, 30, '#c0e0ff', 0.12); break;
      case 'keepout':
        rect(x, 80, 40, 28, '#ffd850'); rect(x + 2, 82, 36, 24, '#141018'); text('KEEP', x + 20, 85, '#ffd850', { align:'center' }); text('OUT', x + 20, 96, '#ff5060', { align:'center' }); break;
      case 'banner': drawBanner(x, 52, d.str, d.c); break;
      case 'roundwin':
        disc(x, 80, 20, '#5a3a20'); disc(x, 80, 17, '#0e1440'); rect(x - 17, 79, 34, 2, '#5a3a20'); rect(x - 1, 63, 2, 34, '#5a3a20');
        rect(x + 6, 70, 2, 2, '#f4ecd0'); rect(x - 9, 86, 1, 1, '#ffffff');
        light(x, 80, 40, '#4060d0', 0.16); break;
      case 'stencil': text(d.str, x, 132, '#8a6a42'); break;
      case 'poster': {
        const p = POSTER[d.i], y = 70;
        rect(x, y, 30, 40, p.bg); rect(x + 2, y + 2, 26, 36, p.inner); rect(x + 2, y + 2, 26, 1, '#ffffff');
        ctx.drawImage(p.icon === 'skull' ? SKULL : p.icon === 'bolt' ? BOLT : CROSS_INV, x + 15 - 6, y + 8, p.icon === 'skull' ? 12 : 10, p.icon === 'skull' ? 12 : 14);
        rect(x + 5, y + 27, 20, 2, p.bg); rect(x + 7, y + 31, 16, 1, p.bg); break;
      }
    }
  }
  // ceiling light fixtures
  for (const fx of cfg.fixtures) {
    const x = fx - cx; if (x < -80 || x > W + 80) continue;
    if (cfg.bulbs) {
      // bare bulbs on pull chains; some flicker
      const sw = Math.round(Math.sin(frame * 0.03 + fx) * 2), on = (fx % 7 !== 3) || Math.random() > 0.08;
      rect(x, HUD + 9, 1, 26, '#5a5468'); rect(x - 3 + sw, HUD + 35, 7, 3, '#8a8698'); rect(x - 2 + sw, HUD + 38, 5, 6, on ? '#fff0b0' : '#5a5040'); rect(x + 4 + sw, HUD + 38, 1, 12, '#c8c4d4');
      if (on) { light(x + sw, HUD + 44, 80, cfg.fix, 0.2); light(x + sw, GROUND - 30, 70, null); }
      continue;
    }
    rect(x - 10, HUD + 6, 20, 5, '#f0e8d8'); rect(x - 7, HUD + 11, 14, 3, '#fff8d0');
    light(x, HUD + 50, 90, cfg.fix, 0.18);
  }
}
function drawWall(cx) { if (L.theme === 'basement') drawBasementWall(cx); else if (L.theme === 'roof') drawRoofSky(cx); else drawHouseWall(cx); }
const SKY_STARS = Array.from({ length:40 }, (_, i) => { const r = rng(i * 31 + 7); return [Math.floor(r() * 640), HUD + Math.floor(r() * 70)]; });
const SUBURB = Array.from({ length:24 }, (_, i) => { const r = rng(i * 13 + 5); return { x:i * 64 + Math.floor(r() * 20), w:40 + Math.floor(r() * 20), h:22 + Math.floor(r() * 18), roof:r() < 0.5 }; });
function drawRoofSky(cx) {
  bands(0, HUD, W, GROUND - HUD, ['#0a0820', '#100c2c', '#181238', '#221844', '#2c1c4c', '#3a2250']);
  for (const [sx, sy] of SKY_STARS) { const x = ((sx - cx * 0.05) % 640 + 640) % 640; if (x < W && ((frame >> 5) + sx) % 9) rect(x, sy, 1, 1, '#8a88b0'); }
  const mx = 250 - cx * 0.04; disc(mx, HUD + 38, 15, '#e8e0c8'); disc(mx - 4, HUD + 34, 3, '#c8c0a8');
  // storm clouds drift over the moon
  for (let i = 0; i < 6; i++) { const x = ((i * 90 - frame * 0.15 - cx * 0.1) % 540 + 540) % 540 - 100, y = HUD + 18 + (i % 3) * 14; ctx.globalAlpha = 0.85; disc(x, y, 18, '#1a1430'); disc(x + 20, y + 4, 14, '#1a1430'); disc(x - 18, y + 6, 12, '#1a1430'); ctx.globalAlpha = 1; }
  // the Glory broadcast tower on the horizon
  const tx = 60 - cx * 0.08;
  ctx.strokeStyle = '#2a2040'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx - 14, GROUND - 40); ctx.lineTo(tx, HUD + 30); ctx.lineTo(tx + 14, GROUND - 40); ctx.stroke();
  for (let y = HUD + 40; y < GROUND - 40; y += 12) { const hw = (y - HUD - 30) * 0.17; rect(tx - hw, y, hw * 2, 1, '#2a2040'); }
  if ((frame >> 5) & 1) { rect(tx - 1, HUD + 28, 3, 3, '#ff3030'); light(tx, HUD + 29, 14, '#ff3030', 0.4); }
  // suburb skyline with every TV tuned to the Reverend
  for (const h of SUBURB) {
    const x = ((h.x - cx * 0.25) % 1536 + 1536) % 1536 - 80; if (x < -70 || x > W + 10) continue;
    const top = GROUND - 26 - h.h;
    rect(x, top, h.w, GROUND - top, '#120c22');
    if (h.roof) { ctx.fillStyle = '#120c22'; ctx.beginPath(); ctx.moveTo(x - 4, top); ctx.lineTo(x + h.w / 2, top - 12); ctx.lineTo(x + h.w + 4, top); ctx.fill(); }
    for (let k = 0; k < 2; k++) { const wx = x + 6 + k * (h.w - 16), lit = ((frame >> 4) + h.x + k) % 13 > 1; rect(wx, top + 8, 8, 7, lit ? '#3a5cd0' : '#5a7cf0'); if (lit) light(wx + 4, top + 11, 12, '#4060ff', 0.2); }
  }
  bands(0, GROUND - 26, W, 26, ['#0c0818', '#08060f']);
}
function drawBasementWall(cx) {
  const wx = cx * 0.6;
  const off = Math.floor(wx) % 96;
  for (let x = -off; x < W; x += 96) ctx.drawImage(WALL, x, HUD);
  for (const d of WALL_DECOR) {
    const x = Math.round(d.x - wx);
    if (x < -120 || x > W + 120) continue;
    switch (d.t) {
      case 'banner': drawBanner(d.center ? Math.round(x - (d.str.length * 8 + 16) / 2) : x, d.y, d.str, d.c); break;
      case 'window':
        rect(x, 42, 40, 20, '#4a4458'); rect(x + 2, 44, 36, 16, '#101848'); rect(x + 2, 44, 36, 4, '#1a2868');
        rect(x + 19, 44, 2, 16, '#4a4458'); rect(x + 6, 47, 2, 2, '#c0d8ff'); rect(x + 28, 50, 1, 1, '#ffffff'); rect(x + 11, 54, 1, 1, '#ffffff');
        light(x + 20, 52, 26, '#3050c0', 0.12); break;
      case 'penta': ctx.drawImage(PENTA.s, x - 23, d.y); break;
      case 'bigpenta':
        rect(x - 46, d.y - 6, 92, 100, '#0a0610'); rect(x - 46, d.y - 6, 92, 1, '#a01818'); rect(x - 46, d.y - 6, 1, 100, '#a01818'); rect(x + 45, d.y - 6, 1, 100, '#a01818');
        for (let i = 0; i < 92; i += 6) rect(x - 46 + i, d.y + 94, 6, (i / 6) % 2 ? 5 : 2, '#0a0610');
        ctx.drawImage(PENTA.l[(frame >> 5) & 1], x - 37, d.y + 4);
        light(x, d.y + 40, 54, '#ff2010', 0.14); break;
      case 'goat':
        rect(x, d.y, 32, 48, '#0c0810'); rect(x, d.y, 32, 2, '#a01818'); rect(x, d.y, 1, 48, '#a01818'); rect(x + 31, d.y, 1, 48, '#a01818');
        for (let i = 0; i < 32; i += 4) rect(x + i, d.y + 48, 4, (i / 4) % 2 ? 4 : 1, '#0c0810');
        rect(x - 4, d.y - 3, 40, 3, '#8a5428'); ctx.drawImage(GOAT, x + 6, d.y + 6);
        rect(x + 15, d.y + 26, 2, 16, '#e02818'); rect(x + 11, d.y + 36, 10, 2, '#e02818'); break;
      case 'graffiti': {
        const str = seedPick(GRAFFITI, d.x);
        text(str, x, d.y, d.c, { shadow:'#000' });
        for (let i = 0; i < str.length; i += 2) rect(x + 2 + i * 8, d.y + 8, 1, 2 + (i * 7) % 6, d.c); break;
      }
      case 'poster': {
        const p = POSTER[d.i], y = 70;
        rect(x, y, 30, 40, p.bg); rect(x + 2, y + 2, 26, 36, p.inner); rect(x + 2, y + 2, 26, 1, '#ffffff');
        ctx.drawImage(p.icon === 'skull' ? SKULL : p.icon === 'bolt' ? BOLT : CROSS_INV, x + 15 - 6, y + 8, p.icon === 'skull' ? 12 : 10, p.icon === 'skull' ? 12 : 14);
        rect(x + 5, y + 27, 20, 2, p.bg); rect(x + 7, y + 31, 16, 1, p.bg); break;
      }
      case 'guitar': rect(x + 8, d.y - 3, 1, 3, '#a8a8b8'); rect(x + 20, d.y - 3, 1, 3, '#a8a8b8'); ctx.drawImage(FLYV, x, d.y); break;
    }
  }
  // the crowd behind the stage, still moshing to a show that already ended
  for (let i = 0; i < 22; i++) {
    const hx = Math.round(1380 + i * 22 - wx), beat = ((frame >> 3) + i * 3) % 4 < 2 ? 3 : 0;
    if (hx < -20 || hx > W + 20) continue;
    disc(hx, 168 - beat, 7, '#0e0812'); rect(hx - 7, 172 - beat, 14, 20, '#0e0812');
    if (i % 3 === 0) { rect(hx - 9, 156 - beat * 2, 2, 10, '#0e0812'); rect(hx + 7, 156 - beat * 2, 2, 10, '#0e0812'); }
    if (i % 4 === 1) rect(hx - 2, 166 - beat, 4, 1, '#c8ff3c');
  }
  // ceiling joists, pipe, string lights (parallax 1)
  rect(0, HUD, W, 14, '#24140c'); rect(0, HUD + 13, W, 1, '#140a06');
  const jo = cx % 56; for (let x = -jo; x < W; x += 56) { rect(x, HUD, 8, 14, '#5a3418'); rect(x, HUD, 8, 1, '#8a5428'); rect(x + 7, HUD, 1, 14, '#2a1408'); }
  rect(0, HUD + 9, W, 4, '#7a7486'); rect(0, HUD + 9, W, 1, '#c8c4d4'); rect(0, HUD + 13, W, 1, '#3a3646');
  const po = cx % 72; for (let x = -po; x < W; x += 72) { rect(x, HUD + 8, 4, 6, '#a8a4b8'); rect(x, HUD + 8, 4, 1, '#e0dcf0'); }
  const lo = cx % 96, LC = ['#ff4030', '#ffc030', '#60ff90', '#40c0ff', '#ff60c0'];
  for (let x0 = -lo - 96; x0 < W + 96; x0 += 96) {
    for (let i = 0; i <= 96; i += 2) rect(x0 + i, HUD + 16 + Math.round(Math.sin(i / 96 * Math.PI) * 10), 1, 1, '#2a1a12');
    for (let i = 8; i < 96; i += 12) {
      const sag = Math.round(Math.sin(i / 96 * Math.PI) * 10), k = Math.floor((x0 + cx + i) / 12), on = ((k + (frame >> 4)) % 3) !== 0;
      const col = LC[((k % 5) + 5) % 5];
      rect(x0 + i, HUD + 17 + sag, 2, 3, on ? col : '#4a4458');
      if (on && x0 + i > -10 && x0 + i < W + 10 && k % 2 === 0) light(x0 + i + 1, HUD + 19 + sag, 12, col, 0.18);
    }
  }
}

/* ---------- floor props (parallax 1) ---------- */
const PROPS_B1 = [
  { t:'bathdoor', x:4 }, { t:'merch', x:1960 }, { t:'bulb', x:60 }, { t:'washer', x:110 }, { t:'dryer', x:144 }, { t:'heater', x:290 },
  { t:'couch', x:430 }, { t:'candles', x:500 }, { t:'bulb', x:560 }, { t:'boxes', x:600 }, { t:'candles', x:760, y:160 },
  { t:'bulb', x:940 }, { t:'couch', x:1240 }, { t:'candles', x:1310 }, { t:'mirrorball', x:1440 }, { t:'bulb', x:1700 },
  { t:'candles', x:1900 }, { t:'bulb', x:2100 }, { t:'bgamps', x:2300 }, { t:'rug', x:2480 }, { t:'candles', x:2500 },
  { t:'candles', x:2700 }, { t:'mic', x:2560 }, { t:'spot', x:2664 },
];
const PROPS_F1 = [
  { t:'basedoor', x:2 }, { t:'sink', x:390 }, { t:'stove', x:440 }, { t:'chairs', x:236 }, { t:'archway', x:924 },
  { t:'fireplace', x:1596 }, { t:'floorlamp', x:1010 }, { t:'floorlamp', x:1760 }, { t:'plant', x:1262 }, { t:'archway', x:2230 },
  { t:'floorlamp', x:2380 }, { t:'plant', x:2700 }, { t:'stairs', x:2996 },
];
const PROPS_F2 = [
  { t:'basedoor', x:2, label:'1F' }, { t:'nightlight', x:150 }, { t:'nightlight', x:690 }, { t:'bunk', x:896 }, { t:'teddy', x:1150 }, { t:'nightlight', x:1270 },
  { t:'tank', x:1824 }, { t:'towels', x:1960 }, { t:'lavalamp', x:2240 }, { t:'blacklight', x:2420 }, { t:'lavalamp', x:2560 }, { t:'bgamps', x:2600 },
  { t:'nightstand', x:2846 }, { t:'nightstand', x:3010 },
];
const PROPS_F3 = [
  { t:'basedoor', x:2, label:'2F' }, { t:'dressform', x:230 }, { t:'xmastree', x:560 }, { t:'rocker', x:800 }, { t:'crib', x:990 },
  { t:'dressform', x:1320 }, { t:'recordpile', x:1500 }, { t:'recordpile', x:1760 }, { t:'cashbags', x:2290 }, { t:'cashbags', x:2600 },
  { t:'recordpile', x:2860 },
];
const PROPS_RF = [
  { t:'hatch', x:6 }, { t:'tvantenna', x:300 }, { t:'dish', x:690 }, { t:'tvantenna', x:1040 }, { t:'weathervane', x:1380 }, { t:'tvantenna', x:1700 },
  { t:'dish', x:2120 }, { t:'mast', x:2700 },
];
const PROPS = { b1:PROPS_B1, f1:PROPS_F1, f2:PROPS_F2, f3:PROPS_F3, rf:PROPS_RF };
function drawProps(cx) {
  for (const d of PROPS[L.id]) {
    const x = Math.round(d.x - cx);
    if (x < -120 || x > W + 120) continue;
    switch (d.t) {
      case 'bathdoor':
        rect(x, GROUND - 52, 34, 52, '#3a2410'); rect(x + 2, GROUND - 50, 30, 50, '#d8e8f8');
        for (let yy = 0; yy < 50; yy += 6) for (let xx = (yy / 6) % 2 * 6; xx < 30; xx += 12) rect(x + 2 + xx, GROUND - 50 + yy, 6, 6, '#b8cce0');
        rect(x + 6, GROUND - 22, 14, 14, '#f4f4fa'); rect(x + 8, GROUND - 28, 10, 7, '#f4f4fa'); rect(x + 9, GROUND - 19, 8, 4, '#a8e030');
        rect(x + 32, GROUND - 50, 8, 50, '#7a5028'); rect(x + 32, GROUND - 50, 8, 1, '#a87040'); rect(x + 37, GROUND - 26, 2, 3, '#e8c048');
        text('WC', x + 9, GROUND - 46, '#4a6888');
        light(x + 17, GROUND - 30, 40, '#e0f0ff', 0.2); break;
      case 'bulb': {
        const gels = ['#ffd890', '#ff90d0', '#90d8ff', '#c8a8ff'], col = gels[(Math.floor(d.x / 100) + (frame >> 7)) % 4];
        rect(x, HUD + 14, 1, 12, '#5a5468'); rect(x - 3, HUD + 26, 7, 6, col); rect(x - 2, HUD + 32, 5, 1, '#ffffff');
        if (Math.random() > 0.02) { light(x, HUD + 50, 70, col, 0.22); light(x, GROUND - 20, 64, null); }
        break;
      }
      case 'washer': case 'dryer':
        rect(x, GROUND - 36, 32, 36, '#d8d8e4'); rect(x, GROUND - 36, 32, 2, '#ffffff'); rect(x, GROUND - 36, 2, 36, '#f0f0f8'); rect(x + 30, GROUND - 36, 2, 36, '#a8a8b8');
        rect(x + 2, GROUND - 31, 28, 1, '#a8a8b8');
        disc(x + 16, GROUND - 15, 10, '#8a8a9a'); disc(x + 16, GROUND - 15, 8, d.t === 'washer' ? '#2a58c0' : '#141018');
        if (d.t === 'washer') { const sp = (frame >> 3) % 4; disc(x + 12 + sp, GROUND - 17, 2, '#c0e0ff'); }
        rect(x + 4, GROUND - 35, 5, 2, '#e02838'); rect(x + 22, GROUND - 35, 6, 2, '#141018'); break;
      case 'merch':
        rect(x, GROUND - 24, 70, 4, '#8a5428'); rect(x + 4, GROUND - 20, 3, 20, '#5a3418'); rect(x + 63, GROUND - 20, 3, 20, '#5a3418');
        for (let i = 0; i < 3; i++) { rect(x + 6 + i * 21, GROUND - 40, 16, 16, ['#1e1a28', '#c02848', '#1e1a28'][i]); rect(x + 10 + i * 21, GROUND - 36, 8, 2, '#9ae030'); }
        rect(x + 4, GROUND - 62, 62, 18, '#f8f4e4'); text('TEES $5', x + 35, GROUND - 60, '#c02848', { align:'center' }); text('XXL ONLY', x + 35, GROUND - 52, '#3a3020', { align:'center' }); break;
      case 'heater':
        for (let i = 0; i < 2; i++) { const dy = (frame * 1.5 + i * 40) % 60; rect(x + 4, GROUND - 56 + dy, 1, 3, '#80c8ff'); }
        rect(x - 6, GROUND - 1, 30, 1, '#3a68b8');
        rect(x, GROUND - 54, 22, 54, '#8a8698'); rect(x + 2, GROUND - 54, 4, 54, '#c8c4d4'); rect(x + 18, GROUND - 54, 4, 54, '#5a5668');
        rect(x - 1, GROUND - 56, 24, 3, '#c8c4d4'); rect(x + 9, HUD + 14, 4, GROUND - 70 - HUD, '#7a7486');
        rect(x + 7, GROUND - 14, 8, 5, ((frame >> 3) & 1) ? '#ff5020' : '#ff9030'); light(x + 11, GROUND - 12, 22, '#ff6020', 0.3); break;
      case 'couch':
        rect(x, GROUND - 22, 64, 22, '#5a2a48'); rect(x, GROUND - 22, 64, 2, '#8a4a70'); rect(x - 6, GROUND - 16, 8, 16, '#7a3a60'); rect(x + 62, GROUND - 16, 8, 16, '#7a3a60');
        rect(x + 2, GROUND - 10, 60, 2, '#3a1a30'); rect(x + 31, GROUND - 20, 2, 10, '#3a1a30');
        rect(x + 8, GROUND - 13, 14, 3, '#f8d880'); rect(x + 40, GROUND - 14, 10, 4, '#c8ff3c'); rect(x + 44, GROUND - 12, 2, 1, '#78c018'); break;
      case 'candles': {
        const by = d.y || GROUND;
        [[0, 10, '#f4f0e8'], [5, 7, '#c02030'], [9, 14, '#f4f0e8'], [14, 6, '#c02030'], [18, 9, '#d8d4c8']].forEach(([ox, hg, col], i) => {
          rect(x + ox, by - hg, 3, hg, col); rect(x + ox, by - hg, 1, hg, '#ffffff');
          const fl = ((frame >> 2) + i * 3) % 4;
          rect(x + ox, by - hg - 3 - (fl === 0 ? 1 : 0), 3, 3, fl === 2 ? '#ffe890' : '#ffb030'); rect(x + ox + 1, by - hg - 4 - (fl === 0 ? 1 : 0), 1, 1, '#ffffff');
        });
        rect(x - 2, by - 1, 24, 1, '#f4f0e8');
        light(x + 10, by - 10, 34 + ((frame >> 3) & 1) * 2, '#ff9030', 0.35); break;
      }
      case 'boxes':
        rect(x, GROUND - 22, 30, 22, '#a87038'); rect(x, GROUND - 22, 30, 2, '#e0a860'); rect(x + 13, GROUND - 22, 4, 22, '#e8c890');
        rect(x + 32, GROUND - 16, 24, 16, '#986028'); rect(x + 32, GROUND - 16, 24, 2, '#d09858');
        rect(x + 5, GROUND - 42, 22, 20, '#c07840'); rect(x + 5, GROUND - 42, 22, 2, '#f0b070'); rect(x + 14, GROUND - 42, 4, 20, '#e8c890');
        text('XMAS', x + 7, GROUND - 34, '#7a3a10'); break;
      case 'bgamps':
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
          const ax = x + i * 30, ay = GROUND - 28 - j * 28;
          rect(ax, ay, 28, 27, '#1c1820'); rect(ax, ay, 28, 1, '#5a5468'); rect(ax + 2, ay + 2, 8, 2, '#e8e0c8');
          for (let yy = 6; yy < 25; yy += 2) for (let xx = 2; xx < 26; xx += 2) rect(ax + xx + (yy % 4 ? 1 : 0), ay + yy, 1, 1, '#3a3440');
        }
        break;
      case 'rug':
        rect(x, GROUND - 2, 200, 2, '#8a1020');
        for (let i = 0; i < 200; i += 8) rect(x + i, GROUND - 2, 4, 1, '#ffc030'); break;
      case 'mic':
        rect(x, GROUND - 48, 1, 48, '#8a8698'); rect(x - 6, GROUND - 1, 13, 1, '#8a8698');
        rect(x - 2, GROUND - 53, 5, 6, '#c8c4d4'); rect(x - 2, GROUND - 53, 5, 1, '#ffffff'); break;
      case 'mirrorball': {
        rect(x, HUD + 14, 1, 14, '#5a5468');
        for (let yy = -7; yy <= 7; yy++) { const hw = Math.floor(Math.sqrt(49 - yy * yy)); for (let xx = -hw; xx <= hw; xx++) rect(x + xx, HUD + 35 + yy, 1, 1, ((xx + yy + (frame >> 3)) & 3) === 0 ? '#ffffff' : (xx + yy) % 2 ? '#a8a4b8' : '#d8d4e8'); }
        for (let i = 0; i < 18; i++) {
          const ox = ((i * 53 + frame * (i % 2 ? 0.7 : -0.5)) % 300 + 300) % 300 - 150, oy = 50 + ((i * 37) % 140);
          rect(x + ox, oy, 2, 2, i % 3 ? '#ffffff' : '#a8d8ff');
        }
        light(x, HUD + 35, 30, '#ffffff', 0.2); break;
      }
      case 'basedoor':
        rect(x, GROUND - 56, 40, 56, '#5a3418'); rect(x + 3, GROUND - 53, 34, 53, '#0a0610');
        for (let i = 0; i < 5; i++) rect(x + 4, GROUND - 10 - i * 10, 32, 2, '#3a2a30');
        text(d.label || 'B1', x + 20, GROUND - 66, '#80c8ff', { align:'center', shadow:'#000' }); break;
      case 'dressform':
        rect(x + 7, GROUND - 14, 2, 14, '#5a3418'); rect(x + 1, GROUND - 2, 14, 2, '#5a3418');
        disc(x + 8, GROUND - 34, 8, '#c8a890'); rect(x + 2, GROUND - 34, 13, 18, '#c8a890'); rect(x + 6, GROUND - 46, 4, 6, '#8a6a50');
        rect(x, GROUND - 26, 16, 10, '#f4f0ff'); rect(x, GROUND - 26, 16, 1, '#ffffff'); text('?', x + 4, GROUND - 40, '#5a4a3a'); break;
      case 'xmastree':
        for (let i = 0; i < 4; i++) { ctx.fillStyle = '#1a4a28'; ctx.beginPath(); ctx.moveTo(x + 18, GROUND - 60 + i * 10); ctx.lineTo(x + 2 - i * 2, GROUND - 40 + i * 10); ctx.lineTo(x + 34 + i * 2, GROUND - 40 + i * 10); ctx.fill(); }
        rect(x + 15, GROUND - 10, 6, 10, '#5a3418');
        for (let i = 0; i < 7; i++) { const lx = x + 6 + (i * 13) % 26, ly = GROUND - 48 + i * 6, on = ((frame >> 4) + i) % 3; rect(lx, ly, 2, 2, on ? ['#ff4030', '#ffd850', '#40c0ff'][i % 3] : '#3a3446'); }
        rect(x + 16, GROUND - 64, 4, 4, '#ffd850'); break;
      case 'rocker':
        ctx.strokeStyle = '#8a5428'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 18, GROUND - 26, 22, 0.5, 2.6); ctx.stroke();
        rect(x + 6, GROUND - 26, 26, 10, '#f4f0e8'); disc(x + 30, GROUND - 32, 6, '#f4f0e8'); rect(x + 33, GROUND - 34, 2, 2, '#140b1a'); rect(x + 24, GROUND - 40, 4, 6, '#c02838');
        rect(x + 8, GROUND - 16, 2, 10, '#8a5428'); rect(x + 26, GROUND - 16, 2, 10, '#8a5428'); break;
      case 'crib':
        rect(x, GROUND - 40, 60, 3, '#e8dcc0'); rect(x, GROUND - 14, 60, 3, '#e8dcc0'); for (let i = 0; i <= 60; i += 6) rect(x + i, GROUND - 40, 2, 40, '#e8dcc0');
        text('Z', x + 30, GROUND - 56 - ((frame >> 4) % 3) * 2, '#5a5468'); break;
      case 'recordpile':
        for (let i = 0; i < 6; i++) { rect(x + (i % 2) * 3, GROUND - 4 - i * 4, 30, 4, '#141018'); rect(x + 12 + (i % 2) * 3, GROUND - 3 - i * 4, 6, 2, ['#9ae030', '#ff60c0', '#ffd850'][i % 3]); }
        rect(x + 32, GROUND - 22, 22, 22, '#b8864a'); rect(x + 32, GROUND - 22, 22, 2, '#d8a868'); text('X', x + 39, GROUND - 16, '#c02838'); break;
      case 'cashbags':
        for (const [ox, sz] of [[0, 10], [16, 13], [36, 9]]) { disc(x + ox + sz, GROUND - sz, sz, '#c8b888'); rect(x + ox + sz - 3, GROUND - sz * 2 - 3, 6, 4, '#a89868'); text('$', x + ox + sz - 4, GROUND - sz - 4, '#3a6a30'); }
        light(x + 30, GROUND - 14, 30, '#ffd850', 0.15); break;
      case 'hatch':
        rect(x, GROUND - 4, 36, 4, '#5a3418'); rect(x + 2, GROUND - 22, 32, 18, '#3a2410'); rect(x + 2, GROUND - 22, 32, 1, '#8a5428'); rect(x + 4, GROUND - 26, 2, 8, '#8a8698');
        text('3F', x + 18, GROUND - 38, '#80c8ff', { align:'center', shadow:'#000' }); break;
      case 'tvantenna':
        rect(x, GROUND - 70, 2, 70, '#5a5468');
        for (let i = 0; i < 4; i++) rect(x - 14 + i * 2, GROUND - 66 + i * 8, 30 - i * 4, 1, '#8a8698');
        rect(x - 1, GROUND - 72, 4, 2, '#8a8698'); break;
      case 'dish':
        rect(x + 10, GROUND - 22, 3, 22, '#5a5468'); ctx.fillStyle = '#c8c4d4'; ctx.beginPath(); ctx.ellipse(x + 10, GROUND - 30, 14, 9, -0.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#8a8698'; ctx.beginPath(); ctx.ellipse(x + 11, GROUND - 30, 10, 6, -0.5, 0, 7); ctx.fill(); rect(x + 14, GROUND - 38, 2, 8, '#5a5468'); break;
      case 'weathervane': {
        const wd = Math.sign(wind || 1);
        rect(x, GROUND - 60, 2, 60, '#5a5468'); rect(x - 12 * wd, GROUND - 56, 24, 2, '#c8a040'); rect(x + 10 * wd, GROUND - 60, 4, 8, '#c8a040'); text('N', x - 3, GROUND - 74, '#8a8698'); break;
      }
      case 'mast':
        rect(x + 4, HUD + 30, 3, GROUND - HUD - 30, '#6a6478'); rect(x + 4, HUD + 30, 1, GROUND - HUD - 30, '#a8a4b8');
        for (let i = 0; i < 4; i++) rect(x - 10 + i * 2, HUD + 36 + i * 10, 30 - i * 4, 2, '#8a8698');
        if ((frame >> 4) & 1) { rect(x + 3, HUD + 26, 5, 4, '#ff3030'); light(x + 5, HUD + 28, 20, '#ff3030', 0.4); } break;
      case 'nightlight':
        rect(x, GROUND - 24, 6, 8, '#f4f0e8'); rect(x + 1, GROUND - 23, 4, 5, '#ffe890'); light(x + 3, GROUND - 20, 26, '#ffe890', 0.3); break;
      case 'bunk':
        for (const ox of [0, 92]) { rect(x + ox, GROUND - 92, 4, 92, '#a86a30'); rect(x + ox, GROUND - 92, 4, 1, '#d89a58'); }
        for (let i = 0; i < 5; i++) rect(x + 96, GROUND - 16 - i * 14, 8, 2, '#a86a30'); rect(x + 96, GROUND - 80, 2, 80, '#a86a30'); rect(x + 102, GROUND - 80, 2, 80, '#a86a30');
        rect(x + 6, GROUND - 46, 16, 6, '#ffffff'); rect(x + 6, GROUND - 94, 16, 6, '#ffffff'); break;
      case 'teddy':
        disc(x + 8, GROUND - 8, 7, '#a8703c'); disc(x + 8, GROUND - 20, 6, '#a8703c'); disc(x + 3, GROUND - 25, 2, '#a8703c'); disc(x + 13, GROUND - 25, 2, '#a8703c');
        rect(x + 6, GROUND - 21, 1, 1, '#141018'); rect(x + 10, GROUND - 21, 1, 1, '#141018'); disc(x + 8, GROUND - 17, 2, '#e8c890'); rect(x + 4, GROUND - 13, 9, 2, '#e02838'); break;
      case 'tank':
        rect(x, GROUND - 46, 30, 16, '#f4f4fa'); rect(x, GROUND - 46, 30, 2, '#ffffff'); rect(x + 26, GROUND - 46, 4, 16, '#c8c8d8'); rect(x + 4, GROUND - 42, 5, 2, '#c8c4d4');
        rect(x + 2, GROUND - 52, 26, 6, '#f8f4e4'); text('P.U.R.E.', x + 15, GROUND - 52, '#3048c0', { align:'center' }); break;
      case 'towels':
        rect(x, GROUND - 90, 40, 2, '#c8c4d4'); rect(x + 4, GROUND - 88, 14, 26, '#ff88b8'); rect(x + 20, GROUND - 88, 14, 22, '#80d8d0'); rect(x + 4, GROUND - 66, 14, 2, '#e05888'); break;
      case 'lavalamp': {
        rect(x, GROUND - 6, 10, 6, '#c8c4d4'); rect(x + 1, GROUND - 30, 8, 24, '#ff5040'); rect(x + 2, GROUND - 34, 6, 4, '#c8c4d4');
        const by = GROUND - 12 - ((frame * 0.3 + d.x) % 18); disc(x + 5, by, 2, '#ffd850'); disc(x + 4, GROUND - 26 + ((frame * 0.2) % 8), 1, '#ffd850');
        light(x + 5, GROUND - 18, 40, '#ff6040', 0.3); break;
      }
      case 'blacklight':
        rect(x - 30, HUD + 12, 60, 4, '#2a1a40'); rect(x - 28, HUD + 16, 56, 2, '#a060ff'); light(x, HUD + 70, 120, '#9040ff', 0.35); break;
      case 'nightstand':
        rect(x, GROUND - 26, 24, 26, '#7a4a28'); rect(x, GROUND - 26, 24, 2, '#b07848'); rect(x + 10, GROUND - 16, 4, 2, '#e8c048');
        rect(x + 10, GROUND - 40, 4, 14, '#c8a040'); ctx.fillStyle = '#f0d890'; ctx.beginPath(); ctx.moveTo(x + 2, GROUND - 40); ctx.lineTo(x + 22, GROUND - 40); ctx.lineTo(x + 18, GROUND - 52); ctx.lineTo(x + 6, GROUND - 52); ctx.fill();
        light(x + 12, GROUND - 40, 50, '#ffe0a0', 0.28); break;
      case 'sink':
        rect(x, GROUND - 52, 4, 10, '#c8c4d4'); rect(x, GROUND - 52, 14, 3, '#c8c4d4');
        for (let i = 0; i < 4; i++) { const sy = GROUND - 60 - ((frame * 0.4 + i * 9) % 36); rect(x + 4 + Math.sin(sy * 0.2 + i) * 3, sy, 3, 3, '#7a7486'); }
        rect(x - 4, GROUND - 40, 8, 4, '#1a1420'); rect(x + 2, GROUND - 42, 6, 3, '#1a1420'); rect(x + 6, GROUND - 40, 1, 1, '#ff5020');
        light(x + 4, GROUND - 40, 14, '#ff5020', 0.3); break;
      case 'stove':
        rect(x, GROUND - 34, 34, 34, '#e8e4f0'); rect(x, GROUND - 34, 34, 2, '#ffffff'); rect(x + 4, GROUND - 26, 26, 18, '#1a1420'); rect(x + 6, GROUND - 24, 22, 1, '#3a3446');
        rect(x, GROUND - 40, 34, 6, '#c8c4d4'); for (let i = 0; i < 4; i++) rect(x + 4 + i * 8, GROUND - 38, 3, 2, '#141018');
        rect(x + 4, GROUND - 36, 8, 2, (frame >> 3) & 1 ? '#ff5020' : '#ff9030'); light(x + 8, GROUND - 36, 18, '#ff5020', 0.3); break;
      case 'chairs':
        for (const ox of [0, 92]) { rect(x + ox, GROUND - 28, 3, 28, '#8a5428'); rect(x + ox, GROUND - 14, 12, 3, '#a86a30'); rect(x + ox + 10, GROUND - 14, 2, 14, '#8a5428'); }
        break;
      case 'archway':
        rect(x, HUD + 9, 20, GROUND - HUD - 9, '#e8dcc0'); rect(x + 2, HUD + 9, 2, GROUND - HUD - 9, '#ffffff'); rect(x + 16, HUD + 9, 4, GROUND - HUD - 9, '#b8a888');
        break;
      case 'fireplace':
        rect(x, GROUND - 70, 90, 70, '#8a4a30'); for (let yy = 0; yy < 70; yy += 8) for (let xx = (yy / 8) % 2 * 8; xx < 90; xx += 16) rect(x + xx, GROUND - 70 + yy, 15, 7, '#9a5a3a');
        rect(x - 6, GROUND - 74, 102, 6, '#5a3418'); rect(x - 6, GROUND - 74, 102, 1, '#a86a30');
        rect(x + 20, GROUND - 44, 50, 44, '#140808');
        for (let i = 0; i < 6; i++) { const fh = 10 + ((frame >> 2) + i * 5) % 10; rect(x + 24 + i * 7, GROUND - 6 - fh, 6, fh, i % 2 ? '#ff7020' : '#ffc030'); }
        rect(x + 22, GROUND - 6, 46, 4, '#3a2010');
        ctx.drawImage(RECORD, x + 30, GROUND - 20); ctx.drawImage(RECORD, x + 46, GROUND - 22);
        text('BURN', x + 45, GROUND - 66, '#ffd850', { align:'center' });
        light(x + 45, GROUND - 20, 60, '#ff7020', 0.4); break;
      case 'floorlamp':
        rect(x, GROUND - 60, 2, 60, '#c8a040'); rect(x - 5, GROUND - 2, 12, 2, '#c8a040');
        ctx.fillStyle = '#f0d890'; ctx.beginPath(); ctx.moveTo(x - 9, GROUND - 60); ctx.lineTo(x + 11, GROUND - 60); ctx.lineTo(x + 6, GROUND - 74); ctx.lineTo(x - 4, GROUND - 74); ctx.fill();
        light(x + 1, GROUND - 60, 56, '#ffe0a0', 0.26); break;
      case 'plant':
        rect(x, GROUND - 14, 14, 14, '#c86a30'); rect(x, GROUND - 14, 14, 2, '#e88a50');
        for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4; ctx.strokeStyle = '#3a8a30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 7, GROUND - 14); ctx.lineTo(x + 7 + Math.cos(a) * 18, GROUND - 14 + Math.sin(a) * 22); ctx.stroke(); }
        break;
      case 'stairs':
        if (boss.state === 'gone') break;
        break;
      case 'spot':
        if (boss.state !== 'wait') { light(x, GROUND - 40, 80, '#ff4040', 0.12); light(x, boss.y + 10, 44, null); }
        break;
    }
  }
}
function drawTiles(cx) {
  const c0 = Math.floor(cx / T), c1 = c0 + Math.ceil(W / T) + 1;
  for (let ty = 0; ty < ROWS; ty++) for (let tx = c0; tx <= c1; tx++) {
    if (tx < 0 || tx >= COLS) continue;
    const t = map[ty * COLS + tx]; if (!t || t === 5) continue;
    const x = tx * T - cx, y = ty * T;
    const below = tileT(tx, ty - 1);
    if (L.theme === 'house') {
      if (t === 1) { const z = HOUSE[FLOOR_ZONE(tx)]; ctx.drawImage(below === 1 ? z.fill : z.top, x, y); }
      else if (t === 2) ctx.drawImage(HOUSE.counter[below === 2 ? 1 : 0], x, y);
      else if (t === 3) ctx.drawImage(HOUSE.table, x, y);
      else if (t === 4) ctx.drawImage(HOUSE.couch[below === 4 ? 1 : 0], x, y);
      else if (t === 6) {
        rect(x, y, T, T, '#f4f4fa'); rect(x, y, 1, T, '#ffffff'); rect(x + T - 1, y, 1, T, '#b8b8c8');
        if (below !== 6) { rect(x, y, T, 2, '#ffffff'); rect(x, y + 14, T, 1, '#b8b8c8'); }
        if (ty === 10) rect(x + (tx % 2 ? 2 : 12), y + 4, 2, 10, '#c8c4d4');
        if (ty === 11 && tx % 2 === 0) { rect(x + 4, y + 3, 3, 3, '#ff4060'); rect(x + 9, y + 7, 3, 3, '#40c0ff'); }
      }
      continue;
    }
    if (L.theme === 'attic' || L.theme === 'roof') {
      const roof = L.theme === 'roof';
      if (t === 1) { const z = roof ? HOUSE.shingle : HOUSE.plank; ctx.drawImage(below === 1 ? z.fill : z.top, x, y); }
      else if (t === 2) ctx.drawImage(roof ? (below === 2 ? HOUSE.shingle.fill : HOUSE.shingle.top) : HOUSE.box[below === 2 ? 1 : 0], x, y);
      else if (t === 3) ctx.drawImage(roof ? HOUSE.grate : HOUSE.beam, x, y);
      else if (t === 4) ctx.drawImage(roof ? HOUSE.chimney[below === 4 ? 1 : 0] : TILE.crate, x, y);
      if (roof && t === 4 && below !== 4 && frame % 12 === tx % 12) parts.push({ x:tx * T + 8, y:y - 2, vx:0.3 + wind * 0.8, vy:-0.5, life:60, c:'#4a4458', g:-0.003 });
      continue;
    }
    if (L.theme === 'upstairs') {
      if (t === 1) { const z = HOUSE[FLOOR_ZONE(tx)]; ctx.drawImage(below === 1 ? z.fill : z.top, x, y); }
      else if (t === 2) ctx.drawImage(HOUSE.dresser[below === 2 ? 1 : 0], x, y);
      else if (t === 3) ctx.drawImage(TILE.shelf, x, y);
      else if (t === 4) ctx.drawImage(HOUSE.chest[below === 4 ? 1 : 0], x, y);
      else if (t === 6) {
        rect(x, y, T, T, '#f4f4fa'); rect(x, y + T - 2, T, 2, '#c8c8d8');
        if (below !== 6) { rect(x, y, T, 3, '#ffffff'); rect(x, y + 3, T, 1, '#b8b8c8'); }
        if (tileT(tx - 1, ty) !== 6) rect(x, y, 2, T, '#ffffff'); if (tileT(tx + 1, ty) !== 6) rect(x + T - 2, y, 2, T, '#b8b8c8');
      } else if (t === 7) {
        rect(x, y, T, T, '#3a6ec8'); rect(x, y + 12, T, 4, '#5a3418'); rect(x, y + 12, T, 1, '#8a5428');
        const ph = Math.sin(frame * 0.1 + tx * 1.3), hy = Math.round(1 + ph);
        rect(x, y + hy, T, 2, '#80c8ff'); rect(x + ((tx * 5 + (frame >> 2)) % 12), y + 5 + hy, 4, 1, '#a8d8ff');
        if (tileT(tx - 1, ty) !== 7) rect(x, y - 4, 3, T + 4, '#5a3418'); if (tileT(tx + 1, ty) !== 7) rect(x + T - 3, y - 4, 3, T + 4, '#5a3418');
      }
      continue;
    }
    if (t === 1) ctx.drawImage(below === 1 ? TILE.fill[(tx * 7 + ty) % 4] : TILE.top[(tx * 5 + ty * 3) % 4], x, y);
    else if (t === 2) ctx.drawImage(TILE.amp, x, y);
    else if (t === 3) ctx.drawImage(TILE.shelf, x, y);
    else if (t === 4) ctx.drawImage(TILE.crate, x, y);
  }
  // pit mouths: a dark void instead of flat black
  for (let tx = c0; tx <= c1; tx++) if (tx >= 0 && tx < COLS && tileT(tx, 13) === 0) rect(tx * T - cx, GROUND, T, H - GROUND, '#06020a');
}
function drawTrash(cx) {
  for (const k of trash) {
    const x = Math.round(k.x - cx), y = Math.round(k.y);
    if (x < -20 || x > W + 20) continue;
    switch (k.type) {
      case 'can': {
        const flat = k.rest ? k.flip : ((k.rot >> 3) & 1);
        if (flat) { rect(x, y - 4, 8, 4, '#d82838'); rect(x + 3, y - 4, 2, 4, '#f4f4f8'); rect(x + 7, y - 4, 1, 4, '#c8c4d4'); rect(x, y - 4, 8, 1, '#ff6870'); }
        else { rect(x + 1, y - 8, 5, 8, '#d82838'); rect(x + 1, y - 5, 5, 2, '#f4f4f8'); rect(x + 1, y - 8, 5, 1, '#c8c4d4'); rect(x + 1, y - 8, 1, 8, '#ff6870'); }
        break;
      }
      case 'cup': rect(x, y - 5, 7, 5, '#d82838'); rect(x + (k.flip ? 6 : 0), y - 5, 1, 5, '#f4f4f8'); rect(x + 1, y - 2, 5, 1, '#a01828'); if (k.rest) rect(x + (k.flip ? 8 : -4), y - 1, 4, 1, '#f070b8'); break;
      case 'pizzabox': rect(x, y - 4, 18, 4, '#e8d0a0'); rect(x, y - 4, 18, 1, '#fff0d0'); rect(x + 5, y - 3, 4, 2, '#c8782c'); if (k.flip) { rect(x + 17, y - 12, 2, 8, '#e8d0a0'); } break;
      case 'chips': rect(x, y - 7, 8, 7, '#ffc030'); rect(x, y - 4, 8, 2, '#e02838'); rect(x + 9, y - 1, 1, 1, '#ffe890'); rect(x + 11, y - 1, 1, 1, '#ffe890'); break;
      case 'tape': rect(x, y - 5, 9, 5, '#1a1420'); rect(x + 1, y - 5, 7, 2, '#f4f0e8'); rect(x + 2, y - 2, 1, 1, '#8a8498'); rect(x + 6, y - 2, 1, 1, '#8a8498'); for (let i = 0; i < 10; i++) rect(x + 9 + i, y - 1 - ((i >> 1) & 1), 1, 1, '#5a3418'); break;
      case 'pamphlet': rect(x, y - 2, 10, 2, '#f8f4e4'); rect(x, y - 2, 10, 1, '#e0b040'); break;
    }
  }
}
function drawTV(tv, cx) {
  const x = Math.round(tv.x - cx), y = Math.round(tv.y);
  if (x < -40 || x > W + 40) return;
  ctx.drawImage(TV_BODY, x, y);
  const sx = x + 4, sy = y + 10, sw = 19, sh = 13;
  if (!tv.on) {
    rect(sx, sy, sw, sh, '#0a0a0e'); rect(sx + 3, sy + 2, 1, 6, '#5a5468'); rect(sx + 4, sy + 7, 6, 1, '#5a5468'); rect(sx + 10, sy + 7, 1, 4, '#5a5468');
    return;
  }
  if (tv.flash > 0) { rect(sx, sy, sw, sh, '#ffffff'); }
  else {
    bands(sx, sy, sw, sh, ['#5838a8', '#7048b8', '#c8a040', '#e8c860', '#7048b8']);
    const jit = (frame % 47 < 2) ? 1 : 0;
    ctx.drawImage(DEWEY_SMALL, 0, 0, 19, 13, sx + jit, sy, 19, 13);
    rect(sx, sy + sh - 2, sw, 2, '#a01828');
    for (let i = 0; i < 4; i++) rect(sx + ((i * 6 - frame * 0.5) % sw + sw) % sw, sy + sh - 2, 3, 1, '#ffd850');
    ctx.globalAlpha = 0.25; for (let r = 0; r < sh; r += 2) rect(sx, sy + r, sw, 1, '#000'); ctx.globalAlpha = 1;
  }
  light(x + 14, y + 16, 50 + (frame % 9 < 3 ? 6 : 0), '#4070ff', 0.26);
  // now and then the Reverend talks through the set
  const ph = (frame + tv.x * 3) % 420;
  if (ph < 80) {
    const say = seedPick(TV_SLOGANS, Math.floor((frame + tv.x * 3) / 420) + (tv.x | 0)), bw = say.length * 8 + 6;
    rect(x + 16 - bw / 2, y - 16, bw, 12, '#f8f4e4'); rect(x + 13, y - 4, 4, 3, '#f8f4e4');
    text(say, x + 16, y - 14, '#a01828', { align:'center' });
  }
}
const TV_SLOGANS = ['CALL NOW!', '$19.95!', 'OBEY.', 'TITHE, SON', 'SEND MONEY', 'GLORY!', 'OPERATORS!', 'NO REFUNDS', 'I SEE YOU'];
function drawToy(t, x) {
  if (x < -60 || x > W + 60) return;
  switch (t.kind) {
    case 'amp': {
      const y = t.y, ready = !t.cd;
      rect(x, y, 24, 30, '#1c1820'); rect(x, y, 24, 1, '#5a5468'); rect(x + 2, y + 2, 8, 2, '#e8e0c8'); rect(x + 14, y + 2, 2, 2, ready ? '#ff3030' : '#3a2a2a');
      for (let yy = 6; yy < 28; yy += 2) for (let xx = 2; xx < 22; xx += 2) rect(x + xx + (yy % 4 ? 1 : 0), y + yy, 1, 1, '#3a3440');
      disc(x + 12, y + 17, 6 + (t.fired > 0 ? (frame & 1) : 0), '#2a242e'); disc(x + 12, y + 17, 2, '#5a5468');
      if (ready && (frame % 90) < 20) { text('!', x + 9, y - 12, '#ffd850', { shadow:'#000' }); light(x + 12, y + 10, 24, '#ff3030', 0.3); }
      if (t.fired > 0) for (let k = 0; k < 3; k++) { const r = (60 - t.fired) * 4 + k * 22; ctx.strokeStyle = k % 2 ? '#ffd850' : '#ffffff'; ctx.globalAlpha = t.fired / 60; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 12, y + 16, r, -1.2, 1.2); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 12, y + 16, r, Math.PI - 1.2, Math.PI + 1.2); ctx.stroke(); ctx.globalAlpha = 1; }
      break;
    }
  }
}
function drawGag(cx) {
  const x = Math.round(gag.x - cx), y = gag.y;
  if (x < -60 || x > W + 60) return;
  if (gag.kind === 'dice') {
    ctx.drawImage(DICEBOX, x, y);
    if (gag.done && gag.t > 0) {
      const rolling = gag.t > 190, n = rolling ? 1 + (frame % 20) : 20;
      text('D' + n, x + 12, y - 16, rolling ? '#ffffff' : '#c8ff3c', { align:'center', shadow:'#000' });
      if (!rolling) { text('NATURAL 20!', x + 12, y - 40, '#ffd850', { align:'center', shadow:'#000' }); text('+1 HEART', x + 12, y - 28, '#ff88cc', { align:'center', shadow:'#000' }); }
    } else if ((frame % 140) < 30) light(x + 16, y + 4, 20, '#e83860', 0.35);
    return;
  }
  if (gag.kind === 'cat') {
    ctx.drawImage(CAT[gag.done && gag.t > 0 ? 1 : (frame >> 5) & 1], x, y + 8);
    if (gag.done && gag.t > 0) { text('MRRROW.', x + 10, y - 30, '#ffd850', { align:'center', shadow:'#000' }); text('(HAIL PUKE)', x + 10, y - 18, '#a8a4b8', { align:'center', shadow:'#000' }); }
    return;
  }
  if (gag.kind === 'board') {
    ctx.drawImage(BOARD, x, y + 8);
    const a = gag.done ? frame * 0.21 : frame * 0.03;
    ctx.drawImage(PLANCHETTE, x + 9 + Math.round(Math.cos(a) * 7), y + 10 + Math.round(Math.sin(a * 1.7) * 2));
    if (!gag.done && (frame % 160) < 40) light(x + 13, y + 14, 22, '#c8ff3c', 0.3);
    if (gag.done && gag.t > 0) {
      const say = 'P-U-K-E R-U-L-E-S', n = Math.min(say.length, Math.floor((240 - gag.t) / 6));
      text('THE BOARD SAYS:', x + 13, y - 34, '#a8a4b8', { align:'center', shadow:'#000' });
      text(say.slice(0, n), x + 13, y - 20, '#c8ff3c', { align:'center', shadow:'#000' });
    }
    return;
  }
  if (gag.kind === 'phone') {
    const ring = !gag.done && (frame % 120) < 24;
    ctx.drawImage(PHONE, x + (ring ? ((frame >> 1) & 1) : 0), y + (gag.done && gag.t > 0 ? 0 : 0));
    if (ring) text('RING!', x + 11, y - 10, '#ffd850', { align:'center', shadow:'#000' });
    if (gag.done && gag.t > 0) {
      text('P.U.R.E. HOTLINE:', x + 11, y - 42, '#a8a4b8', { align:'center', shadow:'#000' });
      text('THANK YOU FOR', x + 11, y - 30, '#ffd850', { align:'center', shadow:'#000' });
      text('YOUR $500 PLEDGE', x + 11, y - 20, '#ffd850', { align:'center', shadow:'#000' });
    }
    return;
  }
  rect(x, y + 14, 26, 3, '#8a5428'); rect(x, y + 14, 26, 1, '#c88a50'); rect(x + 2, y + 17, 2, 13, '#5a3418'); rect(x + 22, y + 17, 2, 13, '#5a3418');
  rect(x + 1, y + 6, 24, 8, '#2a2030'); rect(x + 1, y + 6, 24, 1, '#5a5068');
  const spin = gag.done ? -frame * 0.5 : frame * 0.12;
  ctx.fillStyle = '#141018'; ctx.beginPath(); ctx.ellipse(x + 11, y + 8, 9, 3, 0, 0, 7); ctx.fill();
  rect(x + 10, y + 7, 3, 2, '#c8ff3c');
  rect(x + 11 + Math.round(Math.cos(spin) * 6), y + 8 + Math.round(Math.sin(spin) * 2), 1, 1, '#8a8498');
  rect(x + 21, y + 3, 1, 5, '#c8c4d4'); rect(x + 15, y + 3, 7, 1, '#c8c4d4');
  if (gag.done && gag.t > 0) {
    text('PIZZA IS A', x + 13, y - 30, '#ffd850', { align:'center', shadow:'#000' });
    text('GATEWAY FOOD', x + 13, y - 20, '#ffd850', { align:'center', shadow:'#000' });
    text('(BACKWARDS)', x + 13, y - 42, '#a8a4b8', { align:'center', shadow:'#000' });
  }
}
function drawLamps(cx) {
  for (const l of lamps) {
    const x = Math.round(l.x - cx), y = groundYAt(l.x + 6, 22);
    if (x < -20 || x > W + 20) continue;
    ctx.drawImage(l.on ? LAMP_ON : LAMP_OFF, x, y);
    if (l.on) { const b = (frame >> 3) % 8; rect(x + 5, y + 12 - (b % 6), 2, 2, '#ffb030'); light(x + 6, y + 10, 28, '#ff60c0', 0.3); }
  }
}
function drawDoor(cx) {
  const x = DOOR_X - cx, y = GROUND - 56;
  if (x > W + 4) return;
  if (L.id === 'rf') {
    // Roxy, tied to the base of the broadcast mast
    if (!doorOpen) {
      ctx.drawImage(pick(ROXY, -1), Math.round(x + 2), GROUND - 40);
      for (let i = 0; i < 3; i++) rect(x + 8, GROUND - 26 + i * 6, 18, 1, '#c8a878');
      if ((frame % 160) < 60) text('HELP!', x + 18, GROUND - 54, '#ff88cc', { align:'center', shadow:'#000' });
    } else {
      ctx.drawImage(pick(ROXY_FREE, -1), Math.round(x + 2), GROUND - 40 - ((frame >> 3) & 1) * 2);
      light(x + 18, GROUND - 20, 40, '#ff88cc', 0.3);
    }
    return;
  }
  rect(x - 4, y - 4, 44, 60, '#3a2410'); rect(x - 4, y - 4, 44, 3, '#8a5428');
  if (!doorOpen) {
    rect(x, y, 36, 56, '#6a2a18');
    for (const [px0, py0] of [[3, 3], [20, 3], [3, 30], [20, 30]]) { rect(x + px0, y + py0, 13, 22, '#7a3420'); rect(x + px0, y + py0, 13, 1, '#9a4a30'); }
    rect(x + 30, y + 28, 3, 3, '#e8c048');
    const [l1, l2] = L.doorSign || ['KEEP', 'OUT'];
    text(l1, x + 18, y + 16, '#e8e0c8', { align:'center' }); text(l2, x + 18, y + 26, '#e8e0c8', { align:'center' });
  } else {
    rect(x, y, 36, 56, '#0a0610');
    for (let i = 0; i < 7; i++) { rect(x + 2 + i * 5, y + 48 - i * 7, 34 - i * 5, 2, '#7a7486'); rect(x + 2 + i * 5, y + 50 - i * 7, 34 - i * 5, 1, '#3a3646'); }
    light(x + 18, y + 20, 46, '#fff0c0', 0.3);
    if ((frame >> 4) & 1) text('UP', x + 18, y - 16, '#c8ff3c', { align:'center', shadow:'#000' });
  }
}
function drawPuddles(cx) {
  for (const p of puddles) {
    if (p.perm) { const x = Math.round(p.x - cx); if (x < -20 || x > W) continue; ctx.globalAlpha = 0.7; rect(x, p.y - 4, 16, 4, '#3a68b8'); ctx.globalAlpha = 1; rect(x + ((frame >> 3) + (p.x >> 4)) % 12, p.y - 4, 3, 1, '#a8d8ff'); continue; }
    if (p.life < 60 && (frame >> 2) & 1) continue;
    const x = Math.round(p.x - cx);
    rect(x + 2, p.y - 3, p.w - 4, 1, '#a8e030'); rect(x, p.y - 2, p.w, 2, '#58a010'); rect(x + 4, p.y - 3, 3, 1, '#e8ffa0');
  }
}
function drawPickups(cx) {
  for (const k of pickups) {
    if (k.taken) continue;
    const bob = Math.round(Math.sin((frame + k.x) * 0.08) * 1.5), x = Math.round(k.x - cx), y = Math.round(k.y + bob);
    if (x < -20 || x > W + 20) continue;
    if (k.type === 'pizza') ctx.drawImage(PIZZA, x - 1, y);
    else if (k.type === 'punch') { ctx.drawImage(PUNCH_CUP, x, y); light(x + 7, y + 8, 26, '#ff60c0', 0.3); }
    else if (k.type === 'turbo') { ctx.drawImage(TURBO, x + 1, y); light(x + 7, y + 8, 26, '#60e8ff', 0.3); }
    else {
      const sq = Math.abs(Math.cos(frame * 0.06));
      ctx.drawImage(RECORD, x - 1 + Math.round(8 * (1 - sq)), y, Math.max(2, Math.round(16 * sq)), 16);
      light(x + 7, y + 8, 30, '#c8ff3c', 0.35);
    }
  }
}
function drawPhono(cx) {
  const B = boss, x = Math.round(B.x - cx), y = B.y;
  if (x < -160 || x > W + 60) return;
  if (B.state === 'gone') {
    rect(x + 4, GROUND - 24, 64, 24, '#4a2a14'); rect(x + 4, GROUND - 24, 64, 2, '#7a4a28'); rect(x + 20, GROUND - 30, 30, 6, '#3a2010');
    ctx.save(); ctx.translate(x - 4, GROUND - 6); ctx.rotate(-0.3); rect(0, -6, 30, 12, '#8a6a30'); ctx.restore();
    if (frame % 10 === 0) parts.push({ x:B.x + 30 + Math.random() * 10, y:GROUND - 26, vx:0, vy:-0.6, life:50, c:'#4a4458', g:-0.003 });
    return;
  }
  if (B.state === 'dying' && (frame & 2)) return;
  const fl = B.flash > 0 && (B.flash & 2), wood = fl ? '#ffffff' : '#6a3a1a', woodH = fl ? '#ffffff' : '#9a5a2a';
  // horn: a flared brass bell rising up and to the left
  const hx = x - 22, hy = GROUND - 120, sing = B.state === 'backmask' ? Math.sin(frame * 0.6) * 2 : 0;
  ctx.strokeStyle = fl ? '#ffffff' : '#a87820'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x + 20, y - 8); ctx.quadraticCurveTo(x + 6, hy + 30, hx + 10, hy + 12); ctx.stroke();
  disc(hx, hy, 24 + sing, fl ? '#ffffff' : '#c89838'); disc(hx - 3, hy, 19 + sing, '#e8c060'); disc(hx - 6, hy, 13 + sing, '#3a2010'); disc(hx - 8, hy, 7, '#140808');
  if (B.state === 'backmask') light(hx - 6, hy, 40, '#c8ff3c', 0.4);
  // cabinet with a speaker-grille face
  rect(x, y, 72, 64, wood); rect(x, y, 72, 3, woodH); rect(x + 70, y, 2, 64, '#3a2010');
  rect(x + 8, y + 14, 56, 36, '#2a1608');
  for (let i = 0; i < 56; i += 4) rect(x + 8 + i, y + 14, 2, 36, '#4a2a10');
  const glare = B.state === 'idle' || B.state === 'intro' ? '#c8ff3c' : '#ff4040';
  rect(x + 14, y + 22, 12, 6, glare); rect(x + 46, y + 22, 12, 6, glare); rect(x + 22, y + 40, 28, 4, '#140808');
  for (let i = 0; i < 6; i++) rect(x + 24 + i * 4, y + 38, 2, 3, '#f4f0e0');
  light(x + 36, y + 26, 30, glare, 0.3);
  rect(x + 4, y + 56, 8, 8, '#3a2010'); rect(x + 60, y + 56, 8, 8, '#3a2010');
  // platter + spinning record
  rect(x + 4, y - 6, 60, 6, '#8a8698'); rect(x + 4, y - 6, 60, 1, '#c8c4d4');
  ctx.fillStyle = '#141018'; ctx.beginPath(); ctx.ellipse(x + 34, y - 9, 26, 4, 0, 0, 7); ctx.fill();
  rect(x + 31, y - 10, 6, 2, '#9ae030'); rect(x + 34 + Math.round(Math.cos(frame * 0.3) * 18), y - 10, 2, 1, '#6a6080');
  // tonearm
  if (B.arm) {
    const px0 = x + 62, py0 = y - 8, ax = Math.round(B.arm.x - cx), ay = Math.round(B.arm.y);
    rect(px0 - 4, py0 - 6, 8, 8, '#c8c4d4');
    ctx.strokeStyle = '#c8c4d4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px0, py0 - 2); ctx.quadraticCurveTo((px0 + ax) / 2, Math.min(py0, ay) - 40, ax, ay - 10); ctx.stroke();
    ctx.strokeStyle = '#8a8698'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px0, py0 - 3); ctx.quadraticCurveTo((px0 + ax) / 2, Math.min(py0, ay) - 41, ax, ay - 11); ctx.stroke();
    rect(ax - 5, ay - 14, 10, 8, '#e8e4f0'); rect(ax - 1, ay - 6, 2, 6, '#ffffff');
    if (B.state === 'needle' && B.t >= 30 && B.t < 52 && (frame & 4)) { rect(Math.round(B.tx - cx) - 8, GROUND - 2, 16, 2, '#ff4040'); text('X', Math.round(B.tx - cx), GROUND - 14, '#ff4040', { align:'center' }); }
  }
}
function drawGloryOne(cx) {
  const B = boss; if (B.state === 'wait' || B.state === 'gone') return;
  const x = Math.round(B.x - cx), y = Math.round(B.y);
  if (B.state === 'dying' && (frame & 4)) return;
  const fl = B.flash > 0 && (B.flash & 2);
  const img = fl ? pick(HELI.flash, B.face) : pick(B.phase === 2 ? HELI.hurt : HELI.ok, B.face);
  // spotlight
  if (B.spot) {
    const S = B.spot, sx = Math.round(S.x - cx), hot = S.lock > 0;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = S.fire > 0 ? 0.6 : hot ? ((frame & 4) ? 0.3 : 0.16) : 0.14;
    ctx.fillStyle = S.fire > 0 ? '#ffffff' : hot ? '#fff0a0' : '#d0e0ff';
    ctx.beginPath(); ctx.moveTo(x - 4, y + 8); ctx.lineTo(sx - (S.fire > 0 ? 12 : 22), GROUND); ctx.lineTo(sx + (S.fire > 0 ? 12 : 22), GROUND); ctx.lineTo(x + 4, y + 8); ctx.fill();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    light(sx, GROUND - 10, 30, '#fff0a0', 0.3);
    if (S.fire > 0) rect(sx - 12, HUD, 24, GROUND - HUD, 'rgba(255,255,255,0.5)');
  }
  ctx.save(); ctx.translate(x, y); ctx.rotate(B.tilt);
  ctx.drawImage(img, -48, -24);
  // rotor
  const rw = 52 - ((frame >> 1) & 1) * 30;
  rect(-rw - 2, -26, rw * 2, 2, (frame & 1) ? '#c8c4d4' : '#6a6478');
  // the Reverend in the door
  ctx.drawImage(DEWEY_SMALL, 0, 0, 20, 15, B.face > 0 ? -16 : -4, -10, 20, 15);
  ctx.restore();
  rect(x - 40 * B.face - 1, y - 6, 3, 3, (frame >> 3) & 1 ? '#ff3030' : '#601010');
  light(x, y, 40, '#fff0c0', 0.2);
}
function drawDiscs(cx) {
  for (const d of discs) {
    const x = Math.round(d.x - cx), y = Math.round(d.y), sq = Math.abs(Math.round(Math.cos(d.r * 0.3) * 7));
    ctx.fillStyle = '#141018'; ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, sq), 7, 0, 0, 7); ctx.fill();
    rect(x - 1, y - 2, 2, 4, '#9ae030');
  }
}
function drawBossObj(cx) { if (boss.kind === 'heli') drawGloryOne(cx); else if (boss.kind === 'phono') drawPhono(cx); else if (boss.kind === 'pastor') drawPastor(cx); else if (boss.kind === 'mom') drawMom(cx); else drawKit(cx); }
function drawSkateboard(x, y) {
  rect(x, y, 40, 3, '#e02838'); rect(x, y, 40, 1, '#ff6870'); rect(x - 2, y - 1, 3, 2, '#e02838'); rect(x + 39, y - 1, 3, 2, '#e02838');
  for (const wx of [6, 30]) { rect(x + wx, y + 3, 4, 2, '#8a8698'); disc(x + wx + 2, y + 6, 2, '#ffd850'); }
}
function drawPastor(cx) {
  const B = boss; if (B.state === 'wait' && B.x - cx > W + 60) return;
  const x = Math.round(B.x - cx), y = Math.round(B.y);
  if (B.state === 'gone') { ctx.drawImage(pick(PASTOR_PURGED, B.face), x, y); return; }
  if (B.state === 'dying' && (frame & 2)) return;
  const fl = B.flash > 0 && (B.flash & 2);
  if (B.pose === 'plank') {
    ctx.save(); ctx.translate(x + 30, GROUND - 22); ctx.rotate(B.face * Math.PI / 2);
    ctx.drawImage(fl ? pick(PASTOR.flash, B.face) : pick(PASTOR.idle[0], B.face), -32, -40); ctx.restore();
    drawSkateboard(x + 10, GROUND - 9);
    light(x + 30 + B.face * 30, GROUND - 22, 18, '#c8ff3c', 0.4);
    return;
  }
  let img;
  if (fl) img = pick(PASTOR.flash, B.face);
  else if (B.pose === 'strum') img = pick(PASTOR.strum[(frame >> 3) & 1], B.face);
  else if (B.pose === 'crouch') img = pick(PASTOR.crouch, B.face);
  else if (B.pose === 'jump') img = pick(PASTOR.jump, B.face);
  else if (B.pose === 'yell') img = pick(PASTOR.yell, B.face);
  else img = pick(PASTOR.idle[(frame >> 5) & 1], B.face);
  ctx.drawImage(img, x, y);
  if (B.state === 'luge') drawSkateboard(x + 10, GROUND - 9);
  light(x + 30 + B.face * 8, y + 18, 16, '#c8ff3c', 0.4);
}
function drawNotes(cx) {
  for (const n of notes) {
    const x = Math.round(n.x - cx), y = Math.round(n.y), c = (n.t >> 3) & 1 ? '#ffd850' : '#ff88cc';
    if (n.ch) { text(n.ch, x - 4, y - 4, (n.t >> 2) & 1 ? '#c8ff3c' : '#ffffff', { shadow:'#3a1060' }); light(x, y, 16, '#c8ff3c', 0.35); continue; }
    disc(x - 2, y + 3, 3, OUT); disc(x - 2, y + 3, 2, c); rect(x, y - 6, 2, 9, OUT); rect(x, y - 6, 1, 9, c); rect(x + 1, y - 6, 3, 2, c);
    light(x, y, 16, c, 0.35);
  }
}
function drawMom(cx) {
  const B = boss; if (B.state === 'wait' && B.x - cx > W + 60) return;
  const x = Math.round(B.x - cx), y = Math.round(B.y);
  if (B.state === 'gone') { ctx.drawImage(pick(MOM_PURGED, B.face), x, y); return; }
  if (B.state === 'dying' && (frame & 2)) return;
  let img;
  if (B.flash > 0 && (B.flash & 2)) img = pick(MOM.flash, B.face);
  else if (B.pose === 'walk') img = pick(MOM.walk[Math.floor(B.anim * 4) % 4], B.face);
  else if (B.pose === 'wind') img = pick(MOM.wind, B.face);
  else if (B.pose === 'toss') img = pick(MOM.toss, B.face);
  else if (B.pose === 'yell') img = pick(MOM.yell, B.face);
  else img = pick(MOM.idle[(frame >> 5) & 1], B.face);
  ctx.drawImage(img, x, y);
  light(x + 30 + B.face * 8, y + 18, 16, '#ff4060', 0.4);
}
function drawMomStuff(cx) {
  for (const f of frisbees) {
    const x = Math.round(f.x - cx), y = Math.round(f.y), sq = 2 + Math.abs(Math.round(Math.sin(f.t * 0.5) * 2));
    ctx.fillStyle = '#141018'; ctx.beginPath(); ctx.ellipse(x, y, 7, sq, 0, 0, 7); ctx.fill();
    rect(x - 1, y - 1, 3, 2, '#9ae030'); rect(x - 5, y - 1, 2, 1, '#6a6080');
  }
  for (const c of carts) {
    const x = Math.round(c.x - cx);
    ctx.drawImage(CART, x, c.y);
    bands(x + 7, c.y + 5, 19, 14, ['#5838a8', '#c8a040', '#7048b8']);
    ctx.drawImage(DEWEY_SMALL, 0, 0, 19, 14, x + 7, c.y + 5, 19, 14);
    light(x + 16, c.y + 12, 34, '#4070ff', 0.3);
  }
  for (const y of yells) {
    const x = Math.round(y.x - cx);
    text('GROUNDED!', x + 36 + ((frame >> 1) & 1), Math.round(y.y), (frame >> 2) & 1 ? '#ff5060' : '#ffffff', { align:'center', shadow:'#000' });
  }
}
function drawKit(cx) {
  const kx = BOSS_CX - cx; if (kx < -100 || kx > W + 100) return;
  const B = boss;
  if (B.state !== 'gone') {
    let img = B.arms ? DRUM_UP : DRUM_DN;
    if (B.flash > 0 && (B.flash & 2)) img = B.arms ? DRUM_UP_W : DRUM_DN_W;
    if (!(B.state === 'dying' && (frame & 2))) ctx.drawImage(img, Math.round(B.x - cx), B.y + (B.state === 'dying' ? (frame & 1) : 0));
  } else ctx.drawImage(DRUM_PURGED, Math.round(B.x - cx), B.y + 10);
  // stands + cymbals
  rect(kx - 52, 146, 1, GROUND - 146, '#8a8698'); rect(kx + 52, 142, 1, GROUND - 142, '#8a8698');
  const sh = B.state === 'crash' && B.t < 40 ? (frame & 2 ? 1 : 0) : 0, cc = B.crashFlash > 0 ? '#ffffff' : '#ffc030';
  rect(kx - 66, 146 + sh, 28, 2, cc); rect(kx - 63, 148 + sh, 22, 1, '#a87010'); rect(kx - 54, 144 + sh, 4, 2, cc);
  rect(kx + 38, 142 - sh, 28, 2, cc); rect(kx + 41, 144 - sh, 22, 1, '#a87010'); rect(kx + 50, 140 - sh, 4, 2, cc);
  if (B.crashFlash > 0) light(kx, 150, 90, '#ffffff', 0.4);
  // snare + floor tom
  rect(kx - 42, 182, 18, 9, '#c8c4d4'); rect(kx - 42, 182, 18, 2, '#ffffff'); rect(kx - 34, 191, 1, 17, '#8a8698');
  rect(kx + 24, 184, 18, 22, '#a01828'); rect(kx + 24, 184, 18, 2, '#ffffff'); rect(kx + 24, 186, 18, 1, '#c8c4d4'); rect(kx + 24, 204, 18, 1, '#c8c4d4'); rect(kx + 24, 184, 2, 22, '#d02838');
  // bass drum with the show's logo painted over the band's
  disc(kx, 186, 22, '#c8c4d4'); disc(kx, 186, 20, '#7a1020'); disc(kx, 186, 17, '#f4f0e8');
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rect(kx + Math.round(Math.cos(a) * 12), 186 + Math.round(Math.sin(a) * 12), 2, 2, '#ffd850'); }
  disc(kx, 186, 9, '#ffd850'); disc(kx, 186, 7, '#fff0b0');
  text('GLORY', kx, 182, '#a01828', { align:'center' });
  rect(kx - 14, 202, 4, 6, '#8a8698'); rect(kx + 11, 202, 4, 6, '#8a8698');
  for (const tx0 of [kx - 22, kx + 5]) { rect(tx0, 160, 17, 12, '#a01828'); rect(tx0, 160, 17, 2, '#ffffff'); rect(tx0, 162, 17, 1, '#c8c4d4'); rect(tx0, 171, 17, 1, '#c8c4d4'); rect(tx0, 160, 2, 12, '#d02838'); }
}
function drawStick(s, cx) {
  const x = Math.round(s.x - cx), y = Math.round(s.y), a = s.rot * 0.35;
  const dx = Math.round(Math.cos(a) * 5), dy = Math.round(Math.sin(a) * 5);
  if (s.plate) { ctx.fillStyle = s.harmless ? '#8a8498' : '#ffd850'; ctx.beginPath(); ctx.ellipse(x, y, 6, Math.max(1, Math.abs(dy)), 0, 0, 7); ctx.fill(); if (!s.harmless) { rect(x - 2, y - 1, 4, 1, '#fff8d0'); light(x, y, 12, '#ffd850', 0.3); } return; }
  ctx.strokeStyle = s.harmless ? '#8a8498' : '#f0d890'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
  if (!s.harmless) rect(x + dx - 1, y + dy - 1, 2, 2, '#ffffff');
}
function drawWave(w, cx) {
  const x = Math.round(w.x - cx);
  const gy = w.ground || GROUND;
  for (let i = 0; i < 14; i += 2) { const h = 4 + ((i * 3 + frame) % 8); rect(x + i, gy - h, 2, h, i % 4 ? '#ffc030' : '#ffffff'); }
  light(x + 7, gy - 6, 20, '#ffc030', 0.3);
}
function drawHumanoidEntity(set, e, cx, white) {
  const x = Math.round(e.x + 6 - 15 - cx), y = Math.round(e.y + 32 - 39);
  if (x < -40 || x > W + 40) return;
  let fr;
  if (e.mode === 'bang' && set.bang) fr = set.bang[(frame >> 2) & 1];
  else if (e.mode === 'charge' && set.charge) fr = set.charge[(frame >> 2) & 1];
  else if (e.mode === 'dizzy' && set.dizzy) fr = set.dizzy;
  else if (e.mode === 'wind' && set.wind) fr = set.wind;
  else if (e.mode === 'toss' && set.toss) fr = set.toss;
  else if (e.mode === 'squat' && set.squat) fr = set.squat;
  else if (e.mode === 'hop' && set.hop) fr = set.hop;
  else if (e.mode === 'strum' && set.strum) fr = set.strum[(frame >> 2) & 1];
  else fr = (white ? set.walkW : set.walk)[Math.floor(e.anim) % 4];
  const im = pick(fr, e.face);
  if (e.slip > 0) {
    ctx.save(); ctx.translate(x + 15, y + 30); ctx.rotate(-e.face * Math.PI / 2 * Math.min(1, (46 - e.slip) / 6)); ctx.drawImage(im, -15, -30); ctx.restore();
  } else ctx.drawImage(im, x, y);
  if (white && !(e.mode === 'walk')) { ctx.globalAlpha = 0.6; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(im, x, y); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  if (e.mode === 'dizzy') for (let i = 0; i < 3; i++) { const a = frame * 0.15 + i * 2.1; rect(x + 15 + Math.cos(a) * 8, y + 1 + Math.sin(a) * 2, 2, 2, i ? '#ffd850' : '#ffffff'); }
  // undead eyes glow in the dark
  if (!e.slip) light(x + 15 + e.face * 4, y + 9, 10, '#c8ff3c', 0.35);
}
function drawEnemy(e, cx) {
  const white = e.flash > 0 && (e.flash & 2);
  if (e.type === 'doll') {
    const x = Math.round(e.x - 3 - cx), y = Math.round(e.y - 4);
    if (x < -30 || x > W + 30) return;
    const fr = e.mode === 'sit' ? 0 : e.mode === 'wake' ? 0 : 1 + ((frame >> 2) & 1);
    ctx.drawImage(pick((white ? DOLL_W : DOLL)[fr], e.face), x, y);
    if (e.mode !== 'sit') light(x + 8 + e.face * 2, y + 6, 12, '#c8ff3c', 0.4);
    return;
  }
  if (e.type === 'sheet') {
    const x = Math.round(e.x - 2 - cx), y = Math.round(e.y - 1);
    if (x < -30 || x > W + 30) return;
    if (e.mode === 'warn' || e.mode === 'swoop') { const sw = e.mode === 'warn' ? 6 + (e.mt >> 2) : 12; ctx.globalAlpha = 0.45; rect(x + 9 - sw, groundYAt(e.x + 7, 0) - 2, sw * 2, 2, '#000'); ctx.globalAlpha = 1; }
    const wob = e.mode === 'warn' ? ((frame >> 1) & 1) : 0;
    ctx.globalAlpha = e.mode === 'swoop' ? 1 : 0.88; ctx.drawImage(pick((white ? SHEET_W : SHEET)[Math.floor(e.anim) % 2], e.face), x + wob, y); ctx.globalAlpha = 1;
    light(x + 9 + e.face * 3, y + 7, 14, '#c8ff3c', 0.35);
    return;
  }
  if (e.type === 'rat') {
    const x = Math.round(e.x + 8 - 12 - cx), y = Math.round(e.y + 9 - 12);
    if (x < -30 || x > W + 30) return;
    ctx.drawImage(pick((white ? RAT_W : RAT)[Math.floor(e.anim) % 2], e.face), x, y);
    return;
  }
  drawHumanoidEntity(SETS[e.type], e, cx, white);
}
const SETS = { mosher:MOSHER, pusher:PUSHER, aerobic:AEROBIC, airg:AIRG };
const DAZED_LINES = {
  mosher:['WHAT YEAR IS IT?', 'WHO PUT ME IN A VEST?', 'MY HAIR SMELLS LIKE PUKE', 'DID I MISS THE ENCORE?'],
  pusher:['WHY AM I IN A TIE?', 'I OWE WHO $500?', 'I SOLD PAMPHLETS?!', 'MY GLASSES ARE FAKE'],
  aerobic:['MY LEGS HURT', 'HOW MANY JUMPING JACKS?', 'I HATE LEG WARMERS'],
  airg:['WHERE\'S MY GUITAR?', 'WAS I... AIR PIANO?', 'MY FINGERS ARE TIRED'],
};
function drawDazed(d, cx) {
  const set = SETS[d.type];
  if (!d.tv && d.t > 110 && (frame & 2)) return;
  const x = Math.round(d.x + 6 - 15 - cx), y = Math.round(d.y + 32 - 39);
  ctx.drawImage(pick(set.dazed[Math.floor(d.anim) % 4], d.face), x, y);
  if (d.zap && (frame & 2)) { ctx.globalAlpha = 0.6; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(pick(set.dazed[0], d.face), x, y); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
  if (d.t > 10 && d.t < 80 && !d.tv && DAZED_LINES[d.type]) text(seedPick(DAZED_LINES[d.type], d.x | 0), x + 15, y - 10, '#c8c4d4', { align:'center', shadow:'#000' });
}
function heroFrame(face, forceMode) {
  const set = P.punch > 0 && (P.punch > 120 || (frame >> 3) & 1) ? HERO_PUNCH : P.turbo > 0 && (P.turbo > 120 || (frame >> 3) & 1) ? HERO_TURBO : HERO;
  const pk = P.pukeT > 0;
  let fr;
  if (forceMode === 'hurt' || (P.inv > 110 && state === 'play')) fr = set.hurt;
  else if (P.fartT > 0) fr = set.fart;
  else if (P.snotT > 0 && P.onGround) fr = set.snot;
  else if (!P.onGround) fr = P.vy < 0 ? (pk ? set.jumpP : set.jump) : (pk ? set.fallP : set.fall);
  else if (Math.abs(P.vx) > 0.25) fr = (pk ? set.runP : set.run)[Math.floor(P.anim) % 6];
  else fr = (pk ? set.idleP : set.idle)[(frame >> 5) & 1];
  return pick(fr, face);
}
function drawPlayer(cx) {
  if (P.inv > 0 && P.inv <= 110 && (frame >> 2) & 1) return;
  ctx.drawImage(heroFrame(P.face), Math.round(P.x - 9 - cx), Math.round(P.y - 7));
  if (P.punch > 0) light(P.x + 6 - cx, P.y + 14, 34, '#ff60c0', 0.35);
  else light(P.x + 6 - cx, P.y + 14, 30, null);
}
function drawParts(cx) {
  for (const p of parts) {
    if (p.spr) {
      if (p.life < 25 && (frame & 2)) continue;
      if (p.spin) { ctx.save(); ctx.translate(Math.round(p.x - cx + 6), Math.round(p.y + 6)); ctx.rotate(p.life * 0.2); ctx.drawImage(p.spr, -6, -6); ctx.restore(); }
      else ctx.drawImage(p.spr, Math.round(p.x - cx), Math.round(p.y));
    } else if (p.dollar) text('$', Math.round(p.x - cx), Math.round(p.y), '#ffd850', { shadow:'#000' });
    else { const s = p.sq ? 2 : (p.life > 25 ? 2 : 1); rect(p.x - cx, p.y, s, s, p.c); }
  }
  for (const b of beams) {
    ctx.strokeStyle = (frame & 2) ? '#80c8ff' : '#ffffff'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(b.x0 - cx, b.y0);
    for (let i = 1; i <= 6; i++) ctx.lineTo(b.x0 - cx + (b.x1 - b.x0) * i / 6 + (i < 6 ? (Math.random() - 0.5) * 8 : 0), b.y0 + (b.y1 - b.y0) * i / 6 + (i < 6 ? (Math.random() - 0.5) * 8 : 0));
    ctx.stroke(); light(b.x1 - cx, b.y1, 30, '#80c8ff', 0.4);
  }
  for (const p of pops) {
    if (p.life < 15 && (frame & 2)) continue;
    const hw = p.str.length * 4 + 2;
    text(p.str, Math.round(Math.max(hw, Math.min(W - hw, p.x - cx))), Math.round(p.y), p.c, { align:'center', shadow:'#000' });
  }
}
function drawForeground(cx) {
  const fx = cx * 1.35;
  const off = fx % 640;
  for (let x = -off - 60; x < W + 60; x += 640) {
    const px0 = Math.round(x + 200);
    rect(px0, HUD, 11, H - HUD, '#0a0610'); rect(px0 + 9, HUD, 2, H - HUD, '#1e1424'); rect(px0 - 4, HUD, 19, 8, '#0a0610');
    ctx.strokeStyle = '#0a0610'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px0 + 16, HUD + 30); ctx.quadraticCurveTo(px0 + 70, HUD + 80, px0 + 130, HUD + 34); ctx.stroke();
  }
}
function drawRain() {
  const sl = 1.5 + wind * 3;
  for (let i = 0; i < 60; i++) { const x = ((i * 53 + frame * (3 + sl)) % (W + 40)) - 20, y = HUD + ((i * 97 + frame * 7) % (GROUND - HUD)); rect(x, y, 1, 4, '#6a78a8'); }
  if (flashT > 6) { ctx.globalAlpha = 0.5; rect(0, HUD, W, H - HUD, '#e0e8ff'); ctx.globalAlpha = 1; }
  if (windT >= 300 && windT < 360 && !camLock && (frame >> 3) & 1) text(windDir > 0 ? 'WIND \u25BA\u25BA' : '\u25C4\u25C4 WIND', 160, HUD + 8, '#c8ff3c', { align:'center', shadow:'#000' });
}
function drawHUD() {
  bands(0, 0, W, HUD, ['#2e1838', '#26142e', '#1e1026', '#180c1e']);
  rect(0, HUD - 1, W, 1, '#6a3a80'); rect(0, HUD - 2, W, 1, '#0a0410');
  for (let i = 0; i < 3; i++) ctx.drawImage(i < P.hearts ? HEART : HEART_E, 6 + i * 13, 3);
  const punch = P.punch > 0;
  text(punch ? 'PUNCH' : P.turbo > 0 ? 'TURBO' : 'BELLY', 6, 15, punch ? '#ff88cc' : P.turbo > 0 ? '#60e8ff' : '#c8c4d4');
  rect(48, 14, 74, 8, '#0a0410'); rect(48, 14, 74, 1, '#6a3a80');
  const fw = Math.round(P.belly / 100 * 72), low = P.belly < 15 && (frame >> 3) & 1;
  const cols = punch ? ['#ffb0e0', '#ff60c0', '#c83090'] : low ? ['#ff8080', '#e02838', '#a01020'] : ['#d8ff70', '#8ad020', '#4a8a10'];
  for (let i = 0; i < 3; i++) rect(49, 15 + i * 2, fw, 2, cols[i]);
  text('SCORE', 140, 4, '#a8a4b8'); text(pad6(score), 140, 14, '#f4f0ff');
  ctx.globalAlpha = P.record ? 1 : 0.3; ctx.drawImage(RECORD, 216, 5); ctx.globalAlpha = 1;
  text('FLOOR', 270, 4, '#80c8ff'); text(L.label, 286, 14, '#f4f0ff');
  if (boss.state !== 'wait' && boss.state !== 'gone') {
    const n = boss.state === 'intro' ? Math.min(BOSS_HP, Math.floor(boss.t / 5)) : Math.max(0, boss.hp);
    const bx0 = 302, by0 = 36, bh = BOSS_HP * 3 + 4;
    rect(bx0, by0, 10, bh, '#0a0410'); rect(bx0, by0, 10, 1, '#ffffff'); rect(bx0, by0 + bh - 1, 10, 1, '#ffffff'); rect(bx0, by0, 1, bh, '#ffffff'); rect(bx0 + 9, by0, 1, bh, '#ffffff');
    for (let i = 0; i < BOSS_HP; i++) { const y = by0 + bh - 4 - i * 3; rect(bx0 + 2, y, 6, 2, i < n ? '#ffc030' : '#3a2010'); if (i < n) rect(bx0 + 2, y, 6, 1, '#fff0a0'); }
  }
}
function drawPlayScene() {
  lights = [];
  const sx = shake ? Math.round((Math.random() * 2 - 1) * Math.min(3, shake)) : 0, sy = shake ? Math.round((Math.random() * 2 - 1) * Math.min(2, shake)) : 0;
  const cx = Math.round(cam);
  ctx.save(); ctx.translate(sx, sy);
  rect(0, HUD, W, H - HUD, '#0a0610');
  drawWall(cx); drawProps(cx); drawDoor(cx); drawTiles(cx); drawTrash(cx); drawLamps(cx); drawPuddles(cx);
  for (const tv of tvs) drawTV(tv, cx);
  drawGag(cx); for (const t of toys) drawToy(t, Math.round(t.x - cx)); drawPickups(cx); drawBossObj(cx);
  for (const d of dazed) drawDazed(d, cx);
  for (const e of enemies) drawEnemy(e, cx);
  if (state !== 'dying') drawPlayer(cx);
  else { ctx.save(); ctx.translate(Math.round(P.x + 6 - cx), Math.round(P.y + 16)); ctx.scale(1, -1); ctx.drawImage(heroFrame(P.face, 'hurt'), -15, -20); ctx.restore(); }
  for (const b of blobs) { ctx.drawImage(BLOB, Math.round(b.x - cx), Math.round(b.y)); }
  for (const c of clouds) {
    const fade = Math.min(1, c.life / 30);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05 + c.life * 0.03, rr = c.r * (0.55 + (i % 3) * 0.15);
      ctx.globalAlpha = 0.42 * fade; disc(c.x - cx + Math.cos(a) * c.r * 0.45, c.y + Math.sin(a) * c.r * 0.35, Math.max(2, Math.round(rr)), i % 2 ? '#8a9a38' : '#a8b048');
    }
    ctx.globalAlpha = 0.6 * fade;
    for (let i = -1; i <= 1; i++) { const sx = c.x - cx + i * c.r * 0.5, sy = c.y - c.r - 2; for (let k = 0; k < 5; k++) rect(sx + Math.round(Math.sin((c.life + k * 3 + i * 7) * 0.4) * 2), sy - k * 2, 1, 1, '#d8d070'); }
    ctx.globalAlpha = 1;
  }
  for (const s of snots) ctx.drawImage(pick(pair_SNOT, s.face), Math.round(s.x - cx), Math.round(s.y));
  for (const t of tracts) { ctx.save(); ctx.translate(Math.round(t.x - cx), Math.round(t.y)); ctx.rotate(t.rot * 0.25); ctx.drawImage(TRACT, -5, -4); ctx.restore(); }
  for (const s of sticks) drawStick(s, cx);
  for (const w of waves) drawWave(w, cx);
  drawMomStuff(cx); drawNotes(cx); drawDiscs(cx);
  drawParts(cx);
  drawLighting(flashT > 0 ? 0.08 : { house:0.34, upstairs:0.44, attic:0.62, roof:0.46 }[L.theme] || 0.6);
  if (L.theme === 'roof') drawRain();
  if (L.theme === 'basement') drawForeground(cx);
  ctx.restore();
  drawHUD();
  if (demo && (frame >> 5) & 1) text('DEMO PLAY \u00B7 PRESS ANY BUTTON', 160, H - 12, '#c8ff3c', { align:'center', shadow:'#000' });
  if (boss.state === 'intro' && (boss.t >> 3) % 2 === 0) {
    rect(60, 96, 200, 34, '#0a0410'); rect(60, 96, 200, 1, '#ff5060'); rect(60, 129, 200, 1, '#ff5060');
    text(L.bossName[0], 160, 102, '#ff5060', { align:'center' }); text(L.bossName[1], 160, 116, '#f4f0ff', { align:'center', scale:1 });
  }
}

/* ---------- cutscene art ---------- */
function bigTV(cx, cy, w, h, inner) {
  rect(cx - w / 2 - 8, cy - h / 2 - 8, w + 16, h + 20, '#6a3a18'); rect(cx - w / 2 - 8, cy - h / 2 - 8, w + 16, 3, '#a86438');
  rect(cx - w / 2 - 8, cy + h / 2 + 9, w + 16, 3, '#3a1c08');
  rect(cx - w / 2, cy - h / 2, w, h, '#101018');
  ctx.save(); ctx.beginPath(); ctx.rect(cx - w / 2, cy - h / 2, w, h); ctx.clip(); inner(cx - w / 2, cy - h / 2, w, h); ctx.restore();
  ctx.globalAlpha = 0.2; for (let r = 0; r < h; r += 2) rect(cx - w / 2, cy - h / 2 + r, w, 1, '#000'); ctx.globalAlpha = 1;
}
function gloryScreen(x, y, w, h, title) {
  bands(x, y, w, h, ['#3a2078', '#4a2a90', '#6a38a8', '#a87838', '#d8a848', '#6a38a8', '#3a2078']);
  for (let i = 0; i < 9; i++) { ctx.globalAlpha = 0.15; ctx.fillStyle = '#ffe890'; ctx.beginPath(); ctx.moveTo(x + w / 2, y + h * 0.55); ctx.lineTo(x + (i / 8) * w - 6, y); ctx.lineTo(x + (i / 8) * w + 6, y); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.drawImage(DEWEY_BIG, Math.round(x + w / 2 - 32), Math.round(y + h - 60));
  if (title) { text(title, x + w / 2, y + 4, '#ffd850', { align:'center', bands:GOLD, shadow:'#3a1060' }); }
  rect(x, y + h - 9, w, 9, '#a01828');
  text('CALL 1-800-GLORY-$$', x + w - ((frame) % (w + 160)), y + h - 9, '#ffd850');
}
function sceneBasement() {
  for (let x = 0; x < W; x += 96) ctx.drawImage(WALL, 0, 0, 96, 164, x, 0, 96, 164);
  rect(0, 140, W, 24, '#4a4656'); rect(0, 140, W, 2, '#a09cb0');
  lights = [];
  const t = frame;
  for (let i = 0; i < 4; i++) { const cx = 60 + i * 66, col = ['#ff60c0', '#40c0ff', '#ffc030', '#60ff90'][(i + (t >> 5)) % 4]; ctx.globalAlpha = 0.18; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx - 40 + Math.sin(t * 0.03 + i) * 30, 140); ctx.lineTo(cx + 40 + Math.sin(t * 0.03 + i) * 30, 140); ctx.fill(); ctx.globalAlpha = 1; }
  drawBanner(110, 14, 'VOMITRON', '#ff70c0');
  ctx.drawImage(DRUM_PURGED, 140, 84);
  disc(160, 122, 16, '#c8c4d4'); disc(160, 122, 14, '#7a1020'); disc(160, 122, 12, '#f4f0e8'); text('VTRN', 160, 118, '#7a1020', { align:'center' });
  const b = (t >> 3) & 1;
  ctx.drawImage(ROXY[1], 0, 0, 30, 40, 200, 64 + b, 60, 80);
  rect(204, 74, 2, 66, '#8a8698');
  ctx.drawImage(HERO.idle[b][0], 0, 0, 30, 40, 60, 64 - b, 60, 80);
  ctx.save(); ctx.translate(96, 112); ctx.rotate(-0.3); rect(-20, -4, 44, 4, '#8a5428'); rect(-24, -10, 14, 16, '#d82838'); ctx.restore();
  for (let i = 0; i < 14; i++) { const hx = i * 24 + 6, hy = 146 + ((t >> 3) + i) % 2 * 3; disc(hx, hy, 9, '#0a0610'); if (i % 3 === 0) { rect(hx - 6, hy - 22 - ((t >> 3) % 2) * 3, 2, 8, '#0a0610'); rect(hx - 9, hy - 26, 2, 4, '#0a0610'); rect(hx - 4, hy - 26, 2, 4, '#0a0610'); } }
}
function sceneBathroom() {
  for (let y = 0; y < 164; y += 10) for (let x = (y / 10) % 2 * 10 - 10; x < W; x += 20) { rect(x, y, 10, 10, '#c8dcf0'); rect(x + 10, y, 10, 10, '#a8c0d8'); }
  rect(0, 130, W, 34, '#7a90a8'); rect(0, 130, W, 2, '#c8dcf0');
  rect(150, 92, 50, 44, '#f4f4fa'); rect(140, 82, 70, 14, '#ffffff'); rect(155, 70, 40, 14, '#e8e8f4'); rect(158, 98, 36, 10, '#a8e030');
  const b = (frame >> 4) & 1;
  ctx.drawImage(HERO.idleP[b][0], 0, 0, 30, 40, 82, 52, 60, 80);
  for (let i = 0; i < 8; i++) { const ph = (frame * 2 + i * 13) % 40; rect(146 + ph * 0.6, 80 + Math.sin(ph * 0.3 + i) * 6 + ph * 0.2, 3, 3, i % 2 ? '#a8e030' : '#58a010'); }
  if ((frame >> 5) % 2) text('BLAAAARGH', 120, 26, '#58a010', { scale:2, shadow:'#fff' });
}
function sceneTV() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(160, 78, 170, 120, (x, y, w, h) => gloryScreen(x, y, w, h, 'A WHOLE HOUR OF GLORY'));
}
function sceneTurned() {
  rect(0, 0, W, 164, '#06040e');
  ctx.globalAlpha = 0.25; bands(0, 0, W, 164, ['#101848', '#182868', '#203888', '#182868']); ctx.globalAlpha = 1;
  const row = [MOSHER, PUSHER, MOSHER, PUSHER, MOSHER];
  row.forEach((s, i) => { const fl = (frame + i * 7) % 60 < 3; ctx.drawImage(s.walk[0][1], 0, 0, 30, 40, 14 + i * 60, 50, 60, 80); if (fl) rect(14 + i * 60 + 22, 66, 12, 2, '#ffffff'); });
  const msg = 'YENOM DNES', m2 = 'YEWED YEBO';
  text(msg, 160, 18 + Math.sin(frame * 0.05) * 3, '#c8ff3c', { align:'center', scale:2, shadow:'#000' });
  text(m2, 160, 140, '#c8ff3c', { align:'center', scale:2, shadow:'#000' });
}
function sceneStairs() {
  for (let x = 0; x < W; x += 96) ctx.drawImage(WALL, 0, 0, 96, 164, x, 0, 96, 164);
  rect(0, 140, W, 24, '#4a4656'); rect(0, 140, W, 2, '#a09cb0');
  for (let i = 0; i < 8; i++) { rect(180 + i * 16, 140 - i * 14, W, 14, '#5a3418'); rect(180 + i * 16, 140 - i * 14, W, 2, '#8a5428'); }
  const step = Math.min(60, Math.floor(frame / 3) % 90);
  ctx.drawImage(MOSHER.walk[(frame >> 3) % 4][0], 0, 0, 30, 40, 200 + step, 60 - step * 0.9, 45, 60);
  ctx.drawImage(ROXY_DRAG[1], 0, 0, 30, 40, 175 + step, 70 - step * 0.9, 45, 60);
  rect(4, 64, 40, 76, '#3a2410'); rect(6, 66, 36, 74, '#d8e8f8');
  ctx.drawImage(HERO.idle[0][0], 0, 0, 30, 40, 36, 62, 60, 80);
  if ((frame >> 4) & 1) text('...', 60, 50, '#f4f0ff', { scale:2 });
}
function scenePuke() {
  rect(0, 0, W, 164, '#140818');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + frame * 0.01; ctx.globalAlpha = 0.12; ctx.fillStyle = i % 2 ? '#c8ff3c' : '#ff60c0'; ctx.beginPath(); ctx.moveTo(110, 90); ctx.lineTo(110 + Math.cos(a) * 300, 90 + Math.sin(a) * 300); ctx.lineTo(110 + Math.cos(a + 0.2) * 300, 90 + Math.sin(a + 0.2) * 300); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.drawImage(HERO.idleP[0][0], 0, 0, 30, 40, 50, 20, 90, 120);
  for (let i = 0; i < 5; i++) { const ph = (frame * 2 + i * 30) % 150; ctx.drawImage(BLOB, 0, 0, 9, 9, 140 + ph, 66 - ph * 0.4 + ph * ph * 0.004, 18, 18); }
}
function sceneFilthList() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(84, 80, 144, 118, (x, y, w, h) => gloryScreen(x, y, w, h, 'P.U.R.E.'));
  text('THE FILTH LIST', 240, 14, '#ffd850', { align:'center', bands:GOLD, shadow:'#3a1060' });
  rect(166, 28, 148, 1, '#6a3a80');
  const rows = ['#1 VOMITRON', '#2 SKULLDRIFT', '#3 DOOM PIZZA', '#4 BLOOD GOAT'];
  rows.forEach((r, i) => { if (stateT > 20 + i * 18) text(r, 172, 38 + i * 16, i === 0 ? ((frame >> 3) & 1 ? '#ff5060' : '#ffffff') : '#ffd850', { shadow:'#000' }); });
  if (stateT > 100) {
    ctx.save(); ctx.translate(244, 128); ctx.rotate(-0.12);
    rect(-62, -14, 124, 28, '#f4f0e8'); rect(-60, -12, 120, 24, '#101010');
    text('WARNING:', 0, -9, '#f4f0e8', { align:'center' }); text('PUKE CONTENT', 0, 2, '#f4f0e8', { align:'center' });
    ctx.restore();
  }
}
function sceneSevenSigns() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(84, 80, 144, 118, (x, y, w, h) => gloryScreen(x, y, w, h, '7 SIGNS YOUR'));
  text('TEEN SERVES SATAN', 240, 16, '#ffd850', { align:'center', bands:GOLD, shadow:'#3a1060' });
  rect(164, 30, 150, 1, '#6a3a80');
}
function sceneGameOver() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(160, 78, 140, 84, (x, y, w, h) => gloryScreen(x, y, w, h, null));
  text('YOU BLEW', 160, 6, '#ffffff', { align:'center', scale:2, bands:CHROME, shadow:'#000' });
  text('CHUNKS', 160, 142, '#c8ff3c', { align:'center', scale:2, bands:SLIME, shadow:'#000' });
}
const INTRO = [
  { art:sceneBasement, song:'title', text:'1987. VOMITRON IS PLAYING THE BIGGEST BASEMENT SHOW OF THE YEAR.' },
  { art:sceneBathroom, text:'HALFWAY THROUGH THE SET, THE PIZZA HITS. YOU RUN FOR THE BATHROOM.' },
  { art:sceneTV, song:'glory', text:'UPSTAIRS, SOMEONE LEFT THE TV ON. REV. DEWEY DOLLARSON: "FRIENDS, GIVE ME JUST ONE WHOLE HOUR... OF GLORY."' },
  { art:sceneTurned, song:'title', text:'PLAYED BACKWARDS, HIS SIGNAL SAYS: SEND MONEY. OBEY DEWEY. EVERY GUEST TURNS INTO THE BORN-AGAIN UNDEAD.' },
  { art:sceneFilthList, song:'glory', text:'DOLLARSON ALSO RUNS P.U.R.E., PARENTS UNITED FOR RIGHTEOUS ENTERTAINMENT. VOMITRON TOPS THEIR FILTH LIST FOR AMERICA\'S VILEST LYRICS.' },
  { art:sceneStairs, song:'title', text:'YOU STUMBLE OUT INTO A DEAD-SILENT PARTY. THE UNDEAD DRAG ROXY TO THE ROOF. DEWEY WANTS HER EXORCISED LIVE ON AIR.' },
  { art:scenePuke, text:'CROSSES AND HOLY WATER WON\'T STOP THEM. ONLY ONE THING WILL. FIGHT FIVE FLOORS UP.' },
];
const BROADCAST = [
  { art:sceneSevenSigns, song:'glory', text:'"FRIENDS, IS YOUR TEENAGER SERVING SATAN? WATCH FOR THESE SEVEN SIGNS."',
    items:['1. WEARS BLACK', '2. SLEEPS TILL NOON', '3. OWNS CALCULATOR', '4. HAS HAIR', '5. CEREAL AT DINNER', '6. LISTENS TO MUSIC', '7. IS A TEENAGER'] },
  { art:sceneSevenSigns, text:'"IF YOU SEE EVEN ONE SIGN, CALL NOW. OPERATORS ARE STANDING BY. AND SON, IF YOU\'RE WATCHING: I SEE YOU."' },
];
function sceneToyBox() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(84, 80, 144, 118, (x, y, w, h) => gloryScreen(x, y, w, h, 'P.U.R.E. WATCH'));
  text('THE DEVIL\'S TOY BOX', 240, 14, '#ffd850', { align:'center', bands:GOLD, shadow:'#3a1060' });
  rect(166, 28, 148, 1, '#6a3a80');
  for (let i = 0; i < 9; i++) { const fh = 8 + ((frame >> 2) + i * 3) % 8; rect(170 + i * 16, 150 - fh, 10, fh, i % 2 ? '#ff7020' : '#ffc030'); }
  light(240, 144, 60, '#ff7020', 0.3);
}
const BROADCAST_F1 = [
  { art:sceneToyBox, song:'glory', text:'"THIS WEEK ON P.U.R.E. WATCH: THE DEVIL\'S TOY BOX. WE BURN THEM ALL, LIVE, FOR THE CHILDREN."',
    items:['1. PUZZLE CUBES', '2. BLUE GNOMES', '3. 20-SIDED DICE', '4. ROLLER SKATES', '5. LAVA LAMPS', '6. TROLL DOLLS', '7. FUN'] },
  { art:sceneToyBox, text:'"SON, YOU MAY HAVE BEATEN ONE MOTHER. P.U.R.E. HAS TEN THOUSAND OF THEM. CALL NOW."' },
];
function sceneCloth() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(84, 80, 144, 118, (x, y, w, h) => gloryScreen(x, y, w, h, 'GLORY CLOTH'));
  text('ONLY $49.95', 240, 14, '#ffd850', { align:'center', bands:GOLD, shadow:'#3a1060' });
  rect(166, 28, 148, 1, '#6a3a80');
  const sw = Math.sin(frame * 0.08) * 2;
  ctx.save(); ctx.translate(84, 54 + sw); ctx.rotate(-0.08); rect(-20, -9, 40, 18, '#f8f0d0'); rect(-20, -9, 40, 2, '#ffffff'); rect(-6, -6, 12, 9, '#e8d8a0'); text('$', -4, -6, '#c89838'); ctx.restore();
}
const BROADCAST_F2 = [
  { art:sceneCloth, song:'glory', text:'"FRIENDS, THIS GENUINE GLORY CLOTH HAS BEEN SOAKED IN MY OWN HOLY SWEAT. IT CURES:"',
    items:['1. ACNE', '2. BACKMASKING', '3. MULLETS', '4. AIR GUITAR', '5. SLEEPOVERS', '6. SAXOPHONE', '7. YOUR WALLET'] },
  { art:sceneCloth, text:'"SON, I SEE YOU\'VE MADE IT TO THE ATTIC STAIRS. THAT\'S WHERE THIS HOUSE KEEPS WHAT IT\'S ASHAMED OF. COME ON UP."' },
];
function sceneChopper() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(84, 80, 144, 118, (x, y, w, h) => {
    bands(x, y, w, h, ['#0a0820', '#141030', '#221844', '#2c1c4c']);
    for (let i = 0; i < 20; i++) rect(x + ((i * 37 + frame) % w), y + (i * 23) % h, 1, 3, '#6a78a8');
    ctx.save(); ctx.translate(x + w / 2, y + 48 + Math.sin(frame * 0.05) * 3); ctx.drawImage(HELI.ok[0], -48, -24); ctx.drawImage(DEWEY_SMALL, 0, 0, 20, 15, -16, -10, 20, 15); rect(-50, -26, 100, 2, '#c8c4d4'); ctx.restore();
    rect(x, y + h - 9, w, 9, '#a01828'); text('LIVE: GLORY ONE', x + w - (frame % (w + 140)), y + h - 9, '#ffd850');
  });
  text('TONIGHT, LIVE', 240, 14, '#ffd850', { align:'center', bands:GOLD, shadow:'#3a1060' });
  rect(166, 28, 148, 1, '#6a3a80');
}
const BROADCAST_F3 = [
  { art:sceneChopper, song:'glory', text:'"FRIENDS, I AM IN THE GLORY ONE, FLYING TO THAT HOUSE. TONIGHT, ON THAT ROOF, THE ROCK GETS CAST OUT OF THAT GIRL. LIVE."',
    items:['PLEDGE GOAL:', '$1,000,000', '', 'PLEDGED:', '$12', '', 'CALL NOW'] },
  { art:sceneChopper, text:'"AND SON? IF YOU\'RE COMING UP TO THAT ROOF, BRING YOUR CHECKBOOK."' },
];
function sceneSignalLost() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(160, 78, 170, 120, (x, y, w, h) => {
    const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    cols.forEach((c, i) => rect(x + Math.floor(i * w / 7), y, Math.ceil(w / 7) + 1, h * 0.7, c));
    rect(x, y + h * 0.7, w, h * 0.3, '#101018');
    rect(x + 30, y + 40, w - 60, 22, '#000000'); text('SIGNAL LOST', x + w / 2, y + 47, '#ffffff', { align:'center' });
  });
}
function sceneRoofDawn(lineup) {
  bands(0, 0, W, 164, ['#3a2a68', '#6a3a78', '#b85a70', '#f08a60', '#ffc070']);
  disc(260, 120, 22, '#fff0a0');
  for (let x = 0; x < W; x += 10) { const h = 8 + ((x * 37) % 13); rect(x, 130 - h, 10, h, '#2a1a40'); }
  ctx.fillStyle = '#1a1028'; ctx.beginPath(); ctx.moveTo(0, 164); ctx.lineTo(0, 132); ctx.lineTo(W, 120); ctx.lineTo(W, 164); ctx.fill();
  const b = (frame >> 3) & 1;
  if (lineup) {
    ctx.drawImage(ROXY_FREE[0], 0, 0, 30, 40, 150, 52 + b, 60, 80);
    ctx.drawImage(HERO.idle[b][0], 0, 0, 30, 40, 90, 56 - b, 60, 80);
    ctx.drawImage(DRUM_PURGED, 220, 92); ctx.drawImage(MOSHER.dazed[0][0], 0, 0, 30, 40, 30, 70, 45, 60);
    drawBanner(100, 12, 'VOMITRON', '#ff70c0');
  } else {
    ctx.drawImage(ROXY_FREE[1], 0, 0, 30, 40, 170, 54 + b, 60, 80);
    ctx.drawImage(HERO.idleP[b][0], 0, 0, 30, 40, 100, 56, 60, 80);
  }
}
function sceneWreck() {
  rect(0, 0, W, 164, '#0c0818');
  bigTV(160, 78, 170, 120, (x, y, w, h) => {
    bands(x, y, w, h, ['#1a1430', '#2a1c40', '#3a2448']);
    rect(x + 20, y + 70, 120, 20, '#8a8698'); rect(x + 60, y + 50, 40, 22, '#e8e8f0'); rect(x + 100, y + 60, 30, 3, '#ffd850');
    for (let i = 0; i < 6; i++) { const fh = 6 + ((frame >> 2) + i * 3) % 8; rect(x + 30 + i * 18, y + 70 - fh, 8, fh, i % 2 ? '#ff7020' : '#ffc030'); }
    ctx.drawImage(DEWEY_BIG, Math.round(x + w / 2 - 32), Math.round(y + h - 60));
    rect(x + w / 2 - 20, y + h - 60, 40, 14, '#2a1a40');
    rect(x, y + h - 9, w, 9, '#a01828'); text('BREAKING: REVEREND IN CUL-DE-SAC CRASH', x + w - (frame % (w + 300)), y + h - 9, '#ffd850');
  });
}
function sceneLawn() {
  bands(0, 0, W, 164, ['#3a2a68', '#6a3a78', '#b85a70', '#f08a60']);
  rect(0, 120, W, 44, '#2a5a28'); rect(0, 120, W, 2, '#4a8a40');
  const row = [MOSHER, PUSHER, AEROBIC, AIRG, MOSHER];
  row.forEach((s, i) => { const b = ((frame >> 4) + i) & 1; ctx.drawImage(s.dazed[(frame >> 3) % 4][i % 2], 0, 0, 30, 40, 10 + i * 62, 64 + b, 45, 60); });
  text('?', 50, 50, '#ffffff', { scale:2 }); text('?', 180, 44, '#ffffff', { scale:2 }); text('?', 270, 52, '#ffffff', { scale:2 });
}
const ENDING = [
  { art:sceneSignalLost, song:'over', text:'THE GLORY ONE SPINS INTO THE CUL-DE-SAC. EVERY TV ON THE BLOCK CUTS TO COLOR BARS.' },
  { art:sceneLawn, song:'title', text:'ON THE LAWN, THE BORN-AGAIN UNDEAD WAKE UP. NOBODY REMEMBERS ANYTHING. EVERYBODY REMEMBERS THE PUKE.' },
  { art:sceneWreck, song:'glory', text:'REV. DOLLARSON CRAWLS OUT OF THE WRECKAGE AND STRAIGHT INTO A NEWS CAMERA: "FRIENDS... THE DEVIL\'S MUSIC DID THIS. CALL NOW."' },
  { art:() => sceneRoofDawn(false), song:'title', text:'ROXY: "YOU PUKED YOUR WAY UP FIVE FLOORS... FOR ME?"  YOU: "MOSTLY THE PIZZA. BUT ALSO YES."' },
  { art:() => sceneRoofDawn(true), song:'stage', text:'AT DAWN, VOMITRON PLAYS THE REST OF THE SET ON THE ROOF. THE WHOLE STREET COMES OUT TO WATCH. THE END.' },
];
const BROADCASTS = { b1:BROADCAST, f1:BROADCAST_F1, f2:BROADCAST_F2, f3:BROADCAST_F3, rf:ENDING };
const GAMEOVER = [
  { art:sceneGameOver, song:'glory', text:'"SON, THAT WASN\'T PUKE. THAT WAS SIN LEAVING YOUR BODY. CONTINUE? CALL NOW."' },
];
function runScenes(list, done, isOver) {
  sceneList = list; sceneIdx = 0; afterScene = done; state = 'scene'; stateT = 0;
  if (list[0].song) playSong(list[0].song);
}
function updateScene() {
  const sc = sceneList[sceneIdx], full = sc.text.length, shown = Math.floor(stateT / 1.6);
  if (shown <= full && stateT % 4 === 0) sfx('type');
  const finish = () => { const cb = afterScene; afterScene = null; cb && cb(); };
  if (pressed.start && sceneList === INTRO) { finish(); return; }
  if (pressed.jump || pressed.fire || pressed.start) {
    if (shown < full) stateT = Math.ceil(full * 1.6) + 1;
    else if (sceneIdx < sceneList.length - 1) { sceneIdx++; stateT = 0; sfx('select'); if (sceneList[sceneIdx].song) playSong(sceneList[sceneIdx].song); }
    else finish();
  }
}
function drawScene() {
  const sc = sceneList[sceneIdx];
  rect(0, 0, W, H, '#000');
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 164); ctx.clip(); sc.art(); ctx.restore();
  rect(0, 164, W, 76, '#0a0410'); rect(0, 164, W, 1, '#6a3a80'); rect(6, 168, W - 12, 1, '#2a1a30');
  const shown = sc.text.slice(0, Math.floor(stateT / 1.6));
  let used = 0;
  wrap(sc.text, 37).forEach((ln, i) => { const part = shown.slice(used, used + ln.length); used += ln.length + 1; text(part, 12, 174 + i * 12, '#f4f0ff'); });
  if (sc.items) sc.items.forEach((it, i) => { if (stateT > 30 + i * 22) text(it, 166, 40 + i * 16, i === 6 ? '#ff5060' : '#ffd850', { shadow:'#000' }); });
  if (shown.length >= sc.text.length && (frame >> 4) & 1) text(sceneIdx < sceneList.length - 1 ? 'NEXT ►' : (sceneList === GAMEOVER ? 'CONTINUE ►' : 'GO ►'), W - 10, 226, '#c8ff3c', { align:'right' });
  if (sceneList === INTRO) text('START: SKIP', 12, 226, '#5a5468');
}

/* ---------- title ---------- */
const STARS = Array.from({ length:70 }, (_, i) => { const r = rng(i * 97 + 3); return [Math.floor(r() * W), Math.floor(r() * 150), Math.floor(r() * 60)]; });
const DRIPS = Array.from({ length:14 }, (_, i) => ({ x:30 + i * 19 + (i % 3) * 4, len:Math.random() * 14, sp:0.05 + Math.random() * 0.12 }));
function drawHouse(t) {
  const cx = 168, gy = 214, x0 = 92, x1 = 244;
  for (let r = 0; r <= 42; r++) { const hw = Math.round(r * 1.85) + 2, y = 100 + r; rect(cx - hw, y, hw * 2, 1, r % 4 === 0 ? '#1e1028' : '#160a20'); rect(cx - hw, y, 2, 1, '#6a3a90'); }
  rect(198, 100, 10, 24, '#160a20'); rect(198, 100, 10, 2, '#6a3a90');
  rect(x0, 142, x1 - x0, gy - 142, '#140820');
  for (let y = 146; y < gy; y += 6) rect(x0, y, x1 - x0, 1, '#1e1030');
  rect(x0, 142, 2, gy - 142, '#6a3a90'); rect(x1 - 2, 142, 2, gy - 142, '#3a1a50'); rect(x0 - 6, 141, x1 - x0 + 12, 2, '#6a3a90');
  const tv = (i) => ((t >> 3) + i * 5) % 11 < 2 ? '#a8c8ff' : (((t >> 4) + i) % 3 ? '#4070ff' : '#5088ff');
  rect(cx - 6, 120, 12, 12, '#ffc040'); rect(cx - 1, 120, 2, 12, '#140820'); rect(cx - 6, 125, 12, 2, '#140820');
  for (let i = 0; i < 4; i++) { const wx = x0 + 12 + i * 36; rect(wx, 150, 16, 18, tv(i)); rect(wx + 7, 150, 2, 18, '#140820'); if (i === 2) { rect(wx + 3, 158, 3, 10, '#0a0410'); rect(wx + 3, 156, 3, 3, '#0a0410'); rect(wx + 4, 157, 1, 1, '#c8ff3c'); } }
  for (let i = 0; i < 3; i++) { const wx = [x0 + 12, x0 + 48, x0 + 120][i]; rect(wx, 182, 16, 18, tv(i + 4)); rect(wx + 7, 182, 2, 18, '#140820'); }
  rect(x0 + 82, 184, 18, 30, '#5a1a10'); rect(x0 + 96, 198, 2, 2, '#ffc040');
  for (let i = 0; i < 3; i++) rect(x0 + 16 + i * 44, 207, 16, 6, ((t >> 2) + i) % 6 < 3 ? '#c8ff3c' : '#58a010');
  rect(0, gy, W, H - gy, '#0e1e10'); rect(0, gy, W, 1, '#2a4a20');
}
function drawHeli(x, y) {
  x = Math.round(x); y = Math.round(y);
  rect(x - 30, y - 9, 60, 2, (frame & 1) ? '#c8c4d4' : '#6a6478');
  rect(x - 1, y - 8, 2, 4, '#5a5468');
  for (let yy = 0; yy < 12; yy++) { const hw = Math.round(14 * Math.sqrt(1 - ((yy - 6) / 7) ** 2)); rect(x - hw - 2, y - 4 + yy, hw * 2, 1, yy < 3 ? '#ffffff' : '#e0dcec'); }
  rect(x + 4, y - 2, 8, 5, '#80c8ff'); rect(x + 5, y - 2, 3, 1, '#ffffff');
  rect(x - 34, y + 1, 20, 3, '#e0dcec'); rect(x - 36, y - 4, 3, 9, '#ffc030');
  rect(x - 14, y + 2, 28, 2, '#ffc030'); rect(x - 10, y + 10, 22, 1, '#8a8698'); rect(x - 6, y + 8, 1, 3, '#8a8698'); rect(x + 6, y + 8, 1, 3, '#8a8698');
  rect(x - 12, y + 3, 1, 1, (frame >> 3) & 1 ? '#ff3030' : '#601010');
}
function drawTitle() {
  lights = [];
  bands(0, 0, W, 214, ['#06020e', '#0a0418', '#100622', '#18082c', '#220c36', '#2e1040', '#3a1448', '#4a1a4c']);
  for (const [x, y, ph] of STARS) if (((frame + ph * 4) >> 4) % 7) rect(x, y, 1, 1, ph % 5 ? '#a8a4c8' : '#ffffff');
  disc(270, 96, 16, '#f4ecd0'); disc(266, 92, 3, '#d8ccb0'); disc(276, 102, 2, '#d8ccb0');
  for (let x = 0; x < W; x += 10) { const h = 8 + ((x * 37) % 13); rect(x, 214 - h, 10, h, '#0c0614'); }
  drawHouse(frame);
  const hx = 70 + Math.sin(frame / 90) * 30, hy = 82 + Math.sin(frame / 31) * 3;
  const tx = 168 + Math.sin(frame / 50) * 50;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff0a0';
  ctx.beginPath(); ctx.moveTo(hx, hy + 6); ctx.lineTo(tx - 26, 214); ctx.lineTo(tx + 26, 214); ctx.fill();
  ctx.globalAlpha = 0.12; disc(tx, 196, 26, '#fff0a0'); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawHeli(hx, hy);
  text('HEAVY METAL', 160, 8, '#ffffff', { align:'center', scale:2, bands:CHROME, shadow:'#a01828' });
  text('VOMIT PARTY', 160, 28, '#c8ff3c', { align:'center', scale:3, bands:SLIME, shadow:'#000' });
  for (const d of DRIPS) { d.len += d.sp; if (d.len > 18) d.len = 0; rect(d.x, 52, 2, Math.floor(d.len), '#58a010'); if (d.len > 2) rect(d.x - 1, 52 + Math.floor(d.len), 4, 3, '#a8e030'); }
  if ((frame >> 5) & 1 || frame < 30) text('PRESS START', 160, 222, '#ffffff', { align:'center', shadow:'#000' });
  text('HI ' + pad6(hiscore), 6, 232, '#6a6478');
  text('\u25C4 START: FLOOR ' + LEVELS[startFloor].label + ' \u25BA', 160, 207, ({ b1:'#a8a4b8', f1:'#80c8ff', f2:'#ff88cc', f3:'#ffd850', rf:'#c8ff3c' })[startFloor], { align:'center', shadow:'#000' });
  text('©198X BARFTRONICS', 314, 232, '#58a010', { align:'right' });
}
function drawFloorCard() {
  rect(0, 0, W, H, '#06020a');
  text('FLOOR ' + L.label, 160, 70, '#ffffff', { align:'center', scale:2, bands:CHROME });
  text(L.name, 160, 100, '#c8ff3c', { align:'center' });
  text(L.tagline, 160, 118, '#6a6478', { align:'center' });
  ctx.drawImage(HERO.run[(frame >> 3) % 6][0], 145, 140);
  rect(110, 181, 100, 1, '#4428bc');
  for (let i = 0; i < 3; i++) ctx.drawImage(HEART, 140 + i * 14, 192);
}
function drawPause() {
  rect(70, 70, 180, 108, '#0a0410'); rect(70, 70, 180, 1, '#ffffff'); rect(70, 177, 180, 1, '#ffffff'); rect(70, 70, 1, 108, '#ffffff'); rect(249, 70, 1, 108, '#ffffff');
  text('PAUSE', 160, 80, '#ffffff', { align:'center' });
  [['A', 'Z', 'JUMP'], ['B', 'X', 'PUKE'], ['\u2191B', '\u2191X', 'LOB'], ['X', 'C', 'SNOT ROCKET'], ['Y', 'V', 'FART']].forEach(([b, k, v], i) => { text(b, 86, 98 + i * 14, '#ff88cc'); text(k, 108, 98 + i * 14, '#c8ff3c'); text(v, 134, 98 + i * 14, '#c8c4d4'); });
}
function drawTally() {
  rect(0, 0, W, H, '#06020a');
  text('FLOOR ' + L.label, 160, 24, '#ffffff', { align:'center', scale:2, bands:CHROME });
  text('CLEAR!', 160, 46, '#c8ff3c', { align:'center', scale:2, bands:SLIME });
  const rows = [['HEARTS x1000', P.hearts * 1000], ['FLOOR BONUS', 2000], ['TVS OFF THE AIR', tvs.filter(t => !t.on).length * 500], ['VOMITRON RECORD', P.record ? 3000 : 0]];
  rows.forEach(([k, v], i) => { if (stateT > 16 + i * 8) { text(k, 60, 84 + i * 12, '#c8c4d4'); text(String(v), 260, 84 + i * 12, '#f4f0ff', { align:'right' }); } });
  if (stateT > 50) text('SCORE ' + pad6(score), 160, 140, '#ffd850', { align:'center' });
  if (stateT > 120) {
    const nx = L.next && LEVELS[L.next];
    if (nx) {
      text(nx.id === 'rf' ? 'ROXY IS RIGHT ABOVE YOU...' : 'ROXY IS STILL UP THERE...', 160, 164, '#ff88cc', { align:'center' });
      text('NEXT: FLOOR ' + nx.label + '  ' + nx.name, 160, 182, '#80c8ff', { align:'center' });
    } else {
      text('THE END', 160, 164, '#c8ff3c', { align:'center', bands:SLIME });
      text('THANKS FOR PLAYING', 160, 182, '#80c8ff', { align:'center' });
      text('RECORDS FOUND: ' + (P.recordsFound || 0) + ' OF 5', 160, 196, '#ffd850', { align:'center' });
    }
    if ((frame >> 4) & 1) text('PRESS START', 160, 222, '#ffffff', { align:'center' });
  }
  ctx.drawImage(HERO.idle[(frame >> 4) & 1][0], 270, 190);
}

function render() {
  ctx.imageSmoothingEnabled = false;
  switch (state) {
    case 'title': drawTitle(); break;
    case 'scene': drawScene(); break;
    case 'floorcard': drawFloorCard(); break;
    case 'play': case 'dying': drawPlayScene(); break;
    case 'pause': drawPlayScene(); drawPause(); break;
    case 'fall': drawPlayScene(); if (stateT > 20 && stateT < 56) rect(0, HUD, W, H - HUD, '#000'); break;
    case 'tally': drawTally(); break;
  }
}

/* =========================================================
   LOOP
   ========================================================= */
let last = 0, acc = 0, running = false;
const STEP = 1000 / 60;
function loop(ts) {
  if (!last) last = ts;
  acc += Math.min(100, ts - last); last = ts;
  let n = 0; while (acc >= STEP && n < 4) { update(); acc -= STEP; n++; }
  render(); requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') state = 'pause'; });
function boot(data) {
  if (running) return; running = true;
  if (data && data.hiscore > hiscore) hiscore = data.hiscore;
  setSound(AU.on); resetLevel(); requestAnimationFrame(loop);
}
try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ hiscore })); } catch (e) {}
const hot = window.claude && window.claude.hot;
if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
window.__HMVP = { tile:tileT, get demo() { return !!demo; }, startDemo, get tvs() { return tvs; }, get camLock() { return camLock; }, get doorOpen() { return doorOpen; }, get discs() { return discs; }, get notes() { return notes; }, update, render, kbd, goto(id, o = {}) { forcedPick = o.pick || null; if (o.seed !== undefined) { const f = forcedSeed; forcedSeed = o.seed; newSeed(); forcedSeed = f; } else newSeed(); loadLevel(id); forcedPick = null; startRun(); state = 'play'; stateT = 0; playSong(L.song); }, makeDemo, setDemo(on) { demo = on ? makeDemo() : null; }, damageBoss, get toys() { return toys; }, get puddles() { return puddles; }, get hitStop() { return hitStop; }, get L() { return L; }, get pickups() { return pickups; }, get gag() { return gag; }, get state() { return state; }, set state(v) { state = v; }, get P() { return P; }, get boss() { return boss; }, get enemies() { return enemies; }, get dazed() { return dazed; }, get score() { return score; }, get cam() { return cam; }, set cam(v) { cam = v; } };
