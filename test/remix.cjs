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
  let hits = 0, falls = 0, stalls = 0, frames = 0;
  for (let s = 0; s < SEEDS; s++) {
    G.goto(id, { seed:1000 + s }); G.setDemo(true);
    let prevInv = 0, prev = 'play', n = 0;
    for (; n < 40000 && (G.state === 'play' || G.state === 'fall'); n++) {
      G.update();
      if (G.P.inv > prevInv + 50) hits++;
      prevInv = G.P.inv;
      if (G.state === 'fall' && prev !== 'fall') falls++;
      prev = G.state;
      if (n % 100 === 0) await wait(G.boss.state === 'gone' && !G.doorOpen ? 120 : 0);
    }
    G.setDemo(false);
    if (n >= 40000) { stalls++; console.log(`  STALL ${id} seed ${1000 + s} picks ${G.L.picks} at x ${G.P.x | 0}`); }
    frames += n;
  }
  return { hits, falls, stalls, avgSec:Math.round(frames / SEEDS / 60) };
}

(async () => {
  for (const id of FLOORS) slotRules(id);
  console.log('Slot rules hold for', FLOORS.join(', '));
  const report = {};
  for (const id of FLOORS) { report[id] = await autopilot(id); console.log(`  ${id}: ${JSON.stringify(report[id])} over ${SEEDS} seeds`); }
  for (const id of FLOORS) assert.strictEqual(report[id].stalls, 0, `${id} autopilot stalled`);
  console.log('Remix test passed.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
