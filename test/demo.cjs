// Lets the demo autopilot play the whole game headless, intro to THE END, then checks a key press hands control back.
const assert = require('assert');
const { G, step } = require('./headless.cjs');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  for (let i = 0; i < 1300 && !G.demo; i++) step();
  assert.ok(G.demo, 'the demo should start after 20 seconds idle on the title screen');
  const seen = [];
  let n = 0;
  for (; n < 60000 && G.demo; n++) {
    G.update();
    if (G.state === 'floorcard' && seen[seen.length - 1] !== G.L.id) { seen.push(G.L.id); console.log(`  floor ${G.L.label} at ${Math.round(n / 60)}s`); }
    if (n % 100 === 0) await wait(G.boss.state === 'gone' && !G.doorOpen ? 120 : 0);   // the win jingle opens the door on a real-time timer
  }
  assert.deepStrictEqual(seen, ['b1', 'f1', 'f2', 'f3', 'rf'], 'the demo should play every floor in order');
  assert.ok(!G.demo && G.state === 'title', 'the demo should finish the ending and return to the title');
  console.log(`  finished in ${Math.round(n / 60)}s of game time`);

  for (let i = 0; i < 1300 && !G.demo; i++) step();
  for (let i = 0; i < 200; i++) G.update();
  assert.ok(G.demo, 'the demo should start again from an idle title');
  step({ jump:1 });
  assert.ok(!G.demo && G.state === 'title', 'a real button press should end the demo');
  console.log('Demo test passed: the autopilot plays all five floors and the ending, and any button hands control back.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
