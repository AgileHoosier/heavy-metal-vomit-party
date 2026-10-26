// Plays both floors headless: boss fights, door, broadcast, tally, and the floor-to-floor handoff.
const assert = require('assert');
const { G, step, save } = require('./headless.cjs');
const wait = ms => new Promise(r => setTimeout(r, ms));

async function bossRun(label, standOff) {
  const P = G.P; P.x = G.P.x; let guard = 0;
  while (G.boss.state !== 'gone' && G.state === 'play' && guard++ < 6000) {
    const bx = G.boss.kind === 'mom' ? G.boss.x + 30 : 2664, want = bx - standOff, k = {};
    if (P.x < want - 6) k.right = 1; else if (P.x > want + 6) k.left = 1;
    if (!k.left && !k.right && P.face < 0) k.right = 1;
    k.up = G.boss.kind !== 'mom'; k.fire = guard % 16 < 2; if (guard % 45 < 10) k.jump = 1;
    step(k); P.belly = 100; P.hearts = 3;
  }
  assert.strictEqual(G.boss.state, 'gone', `${label} boss should be purged`);
  for (let i = 0; i < 150; i++) step();
  await wait(2300);                     // the win jingle opens the door
  for (let i = 0; i < 400 && G.state === 'play'; i++) step({ right:1, jump:i % 30 < 12 });
  assert.strictEqual(G.state, 'scene', `${label} door should lead to the broadcast`);
  for (let s = 0; s < 8 && G.state === 'scene'; s++) { step({ jump:1 }); step(); for (let i = 0; i < 10; i++) step(); }
  for (let i = 0; i < 200; i++) step();
  assert.strictEqual(G.state, 'tally', `${label} should reach the tally`);
  save(label + '-tally');
}

(async () => {
  for (let i = 0; i < 30; i++) step();
  step({ start:1 }); step();
  step({ start:1 }); step();                         // skip the intro
  for (let i = 0; i < 170; i++) step();
  assert.strictEqual(G.state, 'play', 'B1 should start');
  save('b1-start');
  G.P.x = 2470; G.P.y = 0;
  for (let i = 0; i < 40; i++) step({ right:1 });
  await bossRun('b1', 100);
  step({ start:1 }); step();
  for (let i = 0; i < 170; i++) step();
  assert.strictEqual(G.state, 'play', 'B1 clear should continue into 1F');
  save('f1-start');
  G.P.x = 2730; G.P.y = 0;
  for (let i = 0; i < 40; i++) step({ right:1 });
  await bossRun('f1', 90);
  console.log('Smoke test passed: both floors, both bosses, transitions. Screenshots in test/shots/.');
})().catch(e => { console.error(e); process.exit(1); });
