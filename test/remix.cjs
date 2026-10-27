// Remix checks: slot rules for every variant, regression checks for the playability fixes,
// and the demo autopilot playing every floor across many seeds (hits, falls, stalls).
const assert = require('assert');
const { G, step } = require('./headless.cjs');
const wait = ms => new Promise(r => setTimeout(r, ms));
const FLOORS = (process.argv[2] || 'b1,f1,f2,f3,rf').split(',');
const SEEDS = +process.argv[3] || 12;
const snapshot = () => { const m = []; for (let x = 0; x < G.L.cols; x++) for (let y = 0; y < 15; y++) m.push(G.tile(x, y)); return m; };

function slotRules(id) {
  G.goto(id); const L = G.L, slots = L.slots || [];
  const inSlot = c => slots.some(s => c >= s.cols[0] - 1 && c <= s.cols[1] + 1);
  slots.forEach((s, i) => {
    assert.ok(s.cols[1] < L.arena - 2, `${id} slot ${i} must stay out of the arena`);
    slots.forEach((o, j) => assert.ok(j === i || s.cols[1] < o.cols[0] || o.cols[1] < s.cols[0], `${id} slots ${i} and ${j} overlap`));
  });
  for (const c of L.tvs) assert.ok(!inSlot(c) && !inSlot(c + 1), `${id} TV at col ${c} sits in a slot`);
  for (const c of L.checks) assert.ok(!inSlot(c), `${id} checkpoint at col ${c} sits in a slot`);
  assert.ok(!inSlot(L.gag.col), `${id} gag sits in a slot`);
  // every variant only changes tiles inside its own columns
  slots.forEach((s, i) => {
    G.goto(id, { pick:slots.map(() => 0), seed:1 }); const base = snapshot();
    for (let v = 1; v < s.variants.length; v++) {
      const pick = slots.map(() => 0); pick[i] = v; G.goto(id, { pick, seed:1 }); const m = snapshot();
      for (let x = 0; x < L.cols; x++) if (x < s.cols[0] || x > s.cols[1]) for (let y = 0; y < 15; y++)
        assert.strictEqual(m[x * 15 + y], base[x * 15 + y], `${id} slot ${i} variant ${v} changes col ${x} outside its range`);
    }
  });
  // checkpoints stand on open floor with nothing overhead
  G.goto(id);
  for (const c of L.checks) for (const x of [c, c + 1]) {
    assert.ok([1, 2].includes(G.tile(x, 13)), `${id} checkpoint col ${x} needs floor`);
    for (let y = 0; y < 13; y++) assert.strictEqual(G.tile(x, y), 0, `${id} checkpoint col ${x} has something overhead at row ${y}`);
  }
}

async function autopilot(id) {
  let hits = 0, falls = 0, stalls = 0, frames = 0, idleHeliHits = 0;
  for (let s = 0; s < SEEDS; s++) {
    G.goto(id, { seed:1000 + s }); G.setDemo(true);
    let prevInv = 0, prev = 'play', n = 0;
    for (; n < 40000 && (G.state === 'play' || G.state === 'fall'); n++) {
      G.update();
      if (G.P.inv > prevInv + 50) { hits++; if (G.boss.kind === 'heli' && G.boss.state === 'idle') idleHeliHits++; }
      prevInv = G.P.inv;
      if (G.state === 'fall' && prev !== 'fall') falls++;
      prev = G.state;
      if (n % 100 === 0) await wait(G.boss.state === 'gone' && !G.doorOpen ? 120 : 0);
    }
    G.setDemo(false);
    if (n >= 40000) { stalls++; console.log(`  STALL ${id} seed ${1000 + s} picks ${G.L.picks} at x ${G.P.x | 0}`); }
    frames += n;
  }
  return { hits, falls, stalls, avgSec:Math.round(frames / SEEDS / 60), ...(id === 'rf' ? { idleHeliHits } : {}) };
}

// regression checks for the playability findings
function regressions() {
  // a plain jump reaches each roof arena platform, from the roof and from the low platform
  const jumpFrom = (x, y, run) => { G.goto('rf', { seed:1 }); G.enemies.length = 0; const P = G.P; P.x = x; P.y = y; P.vy = 0; G.cam = G.L.arena * 16; for (let i = 0; i < 12; i++) step(); G.enemies.length = 0; for (let i = 0; i < 70; i++) step({ jump:1, right:run && i < 14 }); return P.y + P.h; };
  const ax = 152 * 16;
  assert.strictEqual(jumpFrom(ax + 4 * 16 + 20, 176, false), 160, 'a plain jump from the roof lands on the low arena platform (row 10)');
  assert.strictEqual(jumpFrom(ax + 7 * 16 + 2, 128, true), 112, 'a plain running jump from the low platform lands on the top platform (row 7)');
  // a player standing on the top platform never touches the idling helicopter
  G.goto('rf', { seed:1 }); const P = G.P; P.x = ax + 9 * 16 + 20; P.y = 80; G.cam = ax;
  for (let i = 0; i < 60; i++) step({ right:1 });
  P.x = ax + 9 * 16 + 20; P.y = 80; P.inv = 0;
  for (let i = 0; i < 1400; i++) {
    step(); P.hearts = 3; P.belly = 100; P.x = ax + 9 * 16 + 20; P.y = 80; P.vy = 0;
    const B = G.boss;
    if (['idle', 'plates', 'spot', 'troops'].includes(B.state) && B.t > 30) assert.ok(B.y + 18 < P.y, `hovering helicopter (state ${B.state}, box bottom ${B.y + 18 | 0}) must stay above a player on the top platform (top ${P.y})`);
  }
  // every enemy is purged when a boss goes down
  for (const id of ['b1', 'f1', 'f2', 'f3', 'rf']) {
    G.goto(id, { seed:1 }); G.P.x = G.L.arena * 16 + 40; G.P.y = 0; for (let i = 0; i < 200; i++) step({ right:1 });
    G.enemies.push(Object.assign({}, G.enemies[0] || { type:'rat', x:G.P.x + 60, y:200, w:16, h:9, hp:1, vx:0, vy:0, face:-1, mode:'walk', anim:0, flash:0, stun:0, slip:0, slipCd:0, cd:0 }));
    G.damageBoss(999, G.P.x, 100);
    assert.strictEqual(G.boss.state, 'dying', `${id} boss should be dying`);
    assert.strictEqual(G.enemies.length, 0, `${id}: enemies must be purged when the boss goes down`);
  }
  // a straight puke from the kitchen counter hits the phone
  G.goto('f1', { seed:1 }); G.enemies.length = 0; G.P.x = 372; G.P.y = 144; G.P.face = 1; G.cam = 232;
  for (let i = 0; i < 10; i++) step(); G.enemies.length = 0;
  for (let i = 0; i < 60; i++) step(i < 2 ? { fire:1 } : {});
  assert.ok(G.gag.done, 'a straight puke from the counter hits the phone');
  console.log('Regression checks hold: roof platforms reachable with plain jumps, helicopter clear of the top platform, enemies purged on every boss death, phone hittable.');
}

(async () => {
  regressions();
  for (const id of FLOORS) slotRules(id);
  console.log('Slot rules hold for', FLOORS.join(', '));
  const report = {};
  for (const id of FLOORS) { report[id] = await autopilot(id); console.log(`  ${id}: ${JSON.stringify(report[id])} over ${SEEDS} seeds`); }
  for (const id of FLOORS) assert.strictEqual(report[id].stalls, 0, `${id} autopilot stalled`);
  console.log('Remix test passed.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
