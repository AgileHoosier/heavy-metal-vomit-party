/* =========================================================
   DEMO: an autopilot that plays every floor, intro to ending.
   Starts after 20 seconds idle on the title screen (or with index.html#demo).
   Any real button press returns to the title. Hearts and belly stay full,
   and demo runs never touch the high score.
   ========================================================= */
let demo = null, demoHash = false;
const DEMO_IDLE = 1200;
try { demoHash = /^#?demo$/i.test(location.hash || ''); } catch (e) {}

function startDemo() {
  auInit(); demo = makeDemo(); startFloor = 'b1';
  newSeed(); loadLevel('b1'); startRun();
  runScenes(INTRO, () => toFloorCard()); playSong('title');
}
function stopDemo() {
  demo = null; stopSong(); loadLevel('b1'); resetLevel();
  state = 'title'; stateT = 0;
}

function makeDemo() {
  const k = {};
  const solid = t => isSolid(t);
  let f = 0, wait = 0, lastX = 0, still = 0, holdT = 0, jumpHold = 0, cool = 0, lastState = '';
  const hasFloor = (tx, fromRow) => { for (let ty = fromRow; ty < ROWS; ty++) { const t = tileT(tx, ty); if (solid(t) || t === 3) return true; } return false; };
  const jump = (n = 16) => { if (jumpHold <= 0 && cool <= 0 && P.onGround) { jumpHold = n; cool = n + 2; } };
  const move = dir => { if (dir > 0) k.right = 1; else if (dir < 0) k.left = 1; };

  // fire at the nearest enemy in the line of fire (lob at ghosts), else at a live TV ahead
  function shootAhead() {
    let best = null, bd = 1e9;
    for (const e of enemies) {
      const dx = (e.x + e.w / 2) - (P.x + 6), dy = (e.y + e.h) - (P.y + P.h);
      if (Math.sign(dx) !== P.face || Math.abs(dx) > 140) continue;
      if (e.type !== 'sheet' && Math.abs(dy) >= 40) continue;
      if (Math.abs(dx) < bd) { bd = Math.abs(dx); best = e; }
    }
    if (best) {
      if (best.type === 'sheet') { k.up = 1; if (f % 10 < 2) k.fire = 1; }
      else { if (f % 12 < 2) k.fire = 1; if (f % 70 === 0) k.snot = 1; }
      return bd;
    }
    for (const tv of tvs) { const dx = tv.x + 16 - (P.x + 6); if (tv.on && Math.sign(dx) === P.face && Math.abs(dx) < 110) { if (f % 12 < 2) k.fire = 1; break; } }
    return 1e9;
  }
  function traverse() {
    const near = shootAhead();
    holdT = near > 34 ? 0 : holdT + 1;
    if (near > 34 || !P.onGround || holdT > 40) move(1);
    if (holdT > 40 && P.onGround) { jump(18); holdT = 0; }
    const ahead = P.x + P.w + 3, footRow = Math.floor((P.y + P.h - 1) / T), atx = Math.floor(ahead / T);
    const wall = solid(tileT(atx, footRow)) || solid(tileT(atx, footRow - 1));
    let pit = false;
    for (const d of [4, 12]) if (!hasFloor(Math.floor((P.x + P.w + d) / T), footRow + 1)) pit = true;
    // at a ledge the drop carries you forward, so look where you'd land
    const t1 = tileT(Math.floor((P.x + P.w + 4) / T), footRow + 1);
    if (!pit && !solid(t1) && t1 !== 3) for (let d = 12; d <= 64; d += 8) if (!hasFloor(Math.floor((P.x + P.w + d) / T), footRow + 1)) pit = true;
    if (P.onGround && pit) jump(18);
    else if (P.onGround && wall) { let h = 0; while (h < 5 && solid(tileT(atx, footRow - h))) h++; jump(h <= 1 ? 7 : h === 2 ? 11 : 18); }
    if ((k.right || k.left) && Math.abs(P.x - lastX) < 0.25) still++; else still = 0;
    if (still > 26 && P.onGround) { jump(18); still = 0; }
    // falling over a gap: spend the fart double jump
    const overGap = !hasFloor(Math.floor((P.x + 6) / T), footRow + 1) && !hasFloor(Math.floor((P.x + P.w + 4) / T), footRow + 1);
    if (!P.onGround && P.vy > 0.5 && (overGap || wall) && !P.fartJumped) k.fart = 1;
  }
  function fightGround() {
    const B = boss, bx = B.kind === 'drummer' ? BOSS_CX : B.kind === 'phono' ? B.x + 36 : B.x + 30;
    const want = bx - (B.kind === 'phono' ? 112 : B.kind === 'drummer' ? 104 : 92);
    if (P.x < want - 8) k.right = 1; else if (P.x > want + 8) k.left = 1; else if (P.face < 0) k.right = 1;
    if (B.kind === 'drummer') k.up = 1;
    if (f % 14 < 2) k.fire = 1;
    if (f % 90 === 30) k.snot = 1;
    const threat = (B.pose === 'plank' && Math.abs(B.x + 30 - (P.x + 6)) < 80) || discs.some(d => Math.abs(d.x - P.x - 6) < 40);
    if (threat || f % 70 === 0) jump(14);
  }
  function fightHeli() {
    // climb the antenna platforms (the low one needs a fart double jump), then lob from the top
    const B = boss, lowPlat = ARENA_X + 4 * T + 24, highX = ARENA_X + 9 * T + 20, feet = P.y + P.h;
    if (!P.onGround && P.vy > -0.8 && feet > 140 && !P.fartJumped) k.fart = 1;
    if (feet > 190) {
      if (shootAhead() < 60) { if (P.onGround && f % 50 === 0) jump(18); }
      else if (P.x < lowPlat - 6) k.right = 1; else if (P.x > lowPlat + 6) k.left = 1; else jump(18);
    } else if (feet > 130) { shootAhead(); k.right = 1; if (P.x > ARENA_X + 7 * T - 4) jump(18); }
    else {
      if (P.x < highX - 10) k.right = 1; else if (P.x > highX + 10) k.left = 1;
      else if ((B.x < P.x + 6 ? -1 : 1) !== P.face) { if (B.x < P.x) k.left = 1; else k.right = 1; }
      k.up = 1; if (f % 12 < 2) k.fire = 1;
      if (B.state === 'spot' && B.spot && B.spot.lock > 0 && Math.abs(B.spot.x - P.x - 6) < 20) { k.left = 1; k.right = 0; }
    }
  }
  return function tick() {
    if (hitStop > 0 && state === 'play') return k;   // the game is frozen for a beat: hold the same buttons
    f++; for (const a of ACTS) k[a] = 0;
    if (cool > 0) cool--;
    if (state !== lastState) { wait = 0; lastState = state; }
    wait++;
    if (state === 'scene') { if (wait % 280 === 0) k.jump = 1; return k; }
    if (state === 'tally') { if (wait > 300 && wait % 60 === 0) k.start = 1; return k; }
    if (state === 'pause') { if (wait % 4 === 0) k.start = 1; return k; }
    if (state !== 'play') { jumpHold = 0; return k; }
    P.hearts = 3; P.belly = 100;
    if (boss.state !== 'wait' && boss.state !== 'gone') { if (boss.kind === 'heli') fightHeli(); else fightGround(); }
    else if (boss.state === 'gone' && !doorOpen) { if (f % 30 === 0) k.fire = 1; }
    else traverse();
    if (jumpHold > 0) { k.jump = 1; jumpHold--; }
    lastX = P.x;
    return k;
  };
}
