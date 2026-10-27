// Plays every floor headless: boss fights, door, broadcast, tally, and the floor-to-floor handoff.
const assert = require('assert');
const { G, step, save } = require('./headless.cjs');
const wait = ms => new Promise(r => setTimeout(r, ms));

async function bossRun(label, standOff) {
  const P = G.P; P.x = G.P.x; let guard = 0;
  while (G.boss.state !== 'gone' && G.state === 'play' && guard++ < 9000) {
    const k = {};
    if (G.boss.kind === 'heli') {
      // the helicopter is out of reach from the roof: stand on the top antenna platform and lob
      if (P.y > 120 && P.onGround) { P.x = G.L.arena * 16 + 9 * 16 + 20; P.y = 60; P.vy = 0; }
      k.up = 1; k.fire = guard % 14 < 2; if (guard % 50 < 8) k.jump = 1;
    } else {
      const bx = G.boss.kind === 'drummer' ? 2664 : G.boss.kind === 'phono' ? G.boss.x + 36 : G.boss.x + 30, want = bx - standOff;
      if (P.x < want - 6) k.right = 1; else if (P.x > want + 6) k.left = 1;
      if (!k.left && !k.right && P.face < 0) k.right = 1;
      k.up = G.boss.kind === 'drummer'; k.fire = guard % 16 < 2; if (guard % 45 < 10) k.jump = 1;
    }
    step(k); P.belly = 100; P.hearts = 3;
  }
  assert.strictEqual(G.boss.state, 'gone', `${label} boss should be purged`);
  for (let i = 0; i < 150; i++) step();
  await wait(2300);                     // the win jingle opens the door
  for (let i = 0; i < 400 && G.state === 'play'; i++) step({ right:1, jump:i % 30 < 12 });
  assert.strictEqual(G.state, 'scene', `${label} door should lead to the broadcast`);
  for (let s = 0; s < 12 && G.state === 'scene'; s++) { step({ jump:1 }); step(); for (let i = 0; i < 10; i++) step(); }
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
  step({ start:1 }); step();
  for (let i = 0; i < 170; i++) step();
  assert.strictEqual(G.state, 'play', '1F clear should continue into 2F');
  save('f2-start');
  for (const x of [700, 1100, 1800, 2210, 2600]) { G.P.x = x; G.P.y = 0; G.cam = x - 140; for (let i = 0; i < 90; i++) step(); save('f2-' + x); G.P.hearts = 3; }
  G.P.x = 2190; G.P.y = 0; G.cam = 2050;                  // waterbed: holding jump launches to the record shelf
  let top = 999; for (let i = 0; i < 160; i++) { step({ jump:1 }); top = Math.min(top, G.P.y); G.P.hearts = 3; }
  assert.ok(top < 70, 'waterbed should launch the player up to the high shelf (top y ' + top + ')');
  G.P.x = 2830; G.P.y = 0;
  for (let i = 0; i < 40; i++) step({ right:1 });
  await bossRun('f2', 90);
  step({ start:1 }); step();
  for (let i = 0; i < 170; i++) step();
  assert.strictEqual(G.L.id + G.state, 'f3play', '2F clear should continue into the attic');
  G.P.x = 2900; G.P.y = 0;
  for (let i = 0; i < 40; i++) step({ right:1 });
  await bossRun('f3', 110);
  step({ start:1 }); step();
  for (let i = 0; i < 170; i++) step();
  assert.strictEqual(G.L.id + G.state, 'rfplay', 'the attic should continue onto the roof');
  for (let i = 0; i < 600; i++) { step({ right:1, jump:i % 40 < 12 }); G.P.hearts = 3; }   // wind and weather run without errors
  G.P.x = 2450; G.P.y = 0;
  for (let i = 0; i < 40; i++) step({ right:1 });
  await bossRun('rf', 0);
  step({ start:1 }); step();
  assert.strictEqual(G.state, 'title', 'the roof is the last floor: back to the title');
  console.log('Smoke test passed: all five floors, all five bosses, transitions and the ending. Screenshots in test/shots/.');
})().catch(e => { console.error(e); process.exit(1); });
