<h1 align="center">Heavy Metal Vomit Party</h1>

<p align="center">
  <b>A 16-bit style side-scroller that runs in your browser.</b><br>
  One metalhead. Five floors. A house full of televangelist-possessed party guests. One weapon: his stomach.
</p>

<p align="center">
  <img alt="Playable floors: 5 of 5" src="https://img.shields.io/badge/floors-5%20of%205-c8ff3c?style=flat-square&labelColor=1e1026">
  <img alt="No install: one HTML file" src="https://img.shields.io/badge/install-none-ff70c0?style=flat-square&labelColor=1e1026">
  <img alt="Zero image or audio files" src="https://img.shields.io/badge/assets-100%25%20code-80c8ff?style=flat-square&labelColor=1e1026">
</p>

---

## The story

It's 1987. Your band, **VOMITRON**, is playing the biggest basement show of the year. Halfway through the set, the pizza hits, and you run for the bathroom.

Upstairs, someone left the TV on. It's **Rev. Dewey Dollarson** and his show, *A Whole Hour of Glory*. Dollarson spends every broadcast warning America about satanic messages hidden in heavy metal records. He's the one hiding messages. Played backwards, his signal says **SEND MONEY. OBEY DEWEY.**

He also runs **P.U.R.E.**, Parents United for Righteous Entertainment, and VOMITRON is #1 on its Filth List. While you were throwing up, his broadcast turned every guest at the party into the **Born-Again Undead**: sweater vests, clip-on ties, fangs, and smiles that never move. Now they're dragging your singer, **Roxy**, to the roof for a live, on-air exorcism.

Crosses and holy water don't work on them. Only one thing does. Fight five floors up.

## Play

Download or clone the repo and open **`index.html`** in any modern browser. There's nothing to install and no server to run. If GitHub Pages is turned on for this repo, you can also play it straight from the Pages URL.

Click the game screen once so the sound can start, then press **Enter**.

| Button | Keyboard | Gamepad | Action |
| --- | --- | --- | --- |
| Move | Arrow keys or `WASD` | D-pad or left stick | Walk. Hold `↑` while puking to lob. |
| A | `Z`, `Space` or `K` | Bottom | Jump |
| B | `X` or `J` | Left | Puke |
| X | `C` or `I` | Top | Snot rocket |
| Y | `V` or `L` | Right | Fart |
| Start | `Enter`, `P` or `Esc` | Start | Start and pause |
| | `M` | | Sound on/off |

On phones and tablets, an on-screen controller appears below the game. Buttons under the screen toggle the sound, the CRT filter and fullscreen.

**Picking a floor:** on the title screen, press `←` or `→` to choose the starting floor, or open `index.html#1f`, `#2f`, `#3f` or `#roof`.

**Demo mode:** leave the title screen alone for 20 seconds, or open `index.html#demo`, and the game plays itself from the intro to the ending. Press any button to return to the title screen. Demo runs never count toward the high score.

**Every run is different:** each floor has remix slots that each pick one of several hand-built layouts, the enemy mix changes, and so do the jokes on the walls, posters and TVs. To replay a layout, open `index.html#seed=1234` (any number). Enemies still behave randomly, so only the layout repeats.

## Your arsenal

| Attack | What it does |
| --- | --- |
| **Puke** | An arcing splash that costs belly. The belly meter refills slowly on its own. Puke left on the floor makes the Undead slip. |
| **Snot rocket** | A fast, straight shot that costs nothing. It slimes enemies so they move at half speed. |
| **Fart** | On the ground, it leaves a stink cloud behind you that gasses anything walking into it. In the air, it's a double jump. |

Puke an Undead enough and it **purges**: the sweater vest flies off and a confused party guest stumbles away. Purges within two seconds of each other chain into combos (DOUBLE BARF, TRIPLE CHUNDER, MEGA HURL) for bonus points. Purge one near a working TV, though, and Dollarson's signal turns it right back. Puke the TVs until they go off the air.

When the Undead bite you, it's the **Tithe Bite**: you lose a heart, and up to $50 of your score floats off as dollar signs toward the nearest TV.

Fall into a pit and you lose a heart, then come back on the last solid ground you stood on. Lose all three hearts and you restart the floor.

### Power-ups

Every power-up is a pure upgrade, with no downside.

| Pickup | Effect |
| --- | --- |
| Pizza | +1 heart and some belly back |
| Party Punch | 10 seconds of 3-way puke spray at a lower belly cost, starting from a full belly |
| Turbo Cola | 10 seconds of speed and rapid fire |
| VOMITRON record | A hidden collectible on every floor: 1,000 points when you grab it and 3,000 more when you clear the floor |

Clearing a floor pays a bonus: 2,000 points, plus 1,000 for every heart you have left, 500 for every TV you knocked off the air, and the record bonus.

## The floors

| Floor | Setting | Boss |
| --- | --- | --- |
| B1 | **The Basement**: VOMITRON's show, amps, candles, goat banners | The Possessed Drummer |
| 1F | **The Party**: kitchen, living room and den | The Concerned Mom |
| 2F | **The Bedrooms**: hallway, a sleepover, the bathroom and a metalhead's room | The Radical Youth Pastor |
| 3F | **The Attic**: rafters, insulation pits and the house's confiscated stash | The Backmasker, a possessed phonograph |
| Roof | **The Roof**: a storm, wind gusts and the broadcast mast | Rev. Dewey Dollarson in the Glory One helicopter |

Every floor has its own tricks:

- **B1:** some amp stacks are live. Puke one and its feedback blasts every Undead nearby.
- **1F:** a conga line of Aerobics Undead. Purge one and the whole line goes down like dominoes.
- **2F:** Bedsheet Ghosts float overhead, shout BOO! and swoop (lob your puke at them). The waterbed launches you sky-high if you hold jump, and puking into the toilet flushes a geyser that shoots you up to a bonus shelf.
- **3F:** porcelain dolls sit perfectly still until you get close. On some runs, jack-in-the-box springs bounce you over the gaps, and one stretch of the attic has no lights.
- **Roof:** wind gusts shove you around (watch for the WIND warning). Lightning picks off the Reverend's own flock, never you. The helicopter is out of reach from the shingles, so climb the antenna platforms and lob. Beat Dollarson, free Roxy, and see the ending.

Each floor also hides a gag to puke for points. The one in the attic gives you a heart and a full belly too.

## How it's made

- **No image or audio files.** Every sprite is painted pixel by pixel in code, then given a dark outline. All the music and sound effects are synthesized live with the Web Audio API: distorted guitar, bass, a vibrato lead, a cheesy church organ and drums.
- **16-bit era look.** It renders at 320×240 with shaded sprites, parallax layers, and colored light from party bulbs, candles and TV screens. A CRT filter, on by default, adds scanlines.
- **One file to ship.** The source lives in `src/`, and a small build script inlines it into a single playable `index.html`.

### Project layout

```
src/
  art.js        Pixel painter, character rig, every sprite, tile and wall
  audio.js      Synth instruments, songs and sound effects
  game.js       Input, level data and remix slots, physics, enemies, bosses, game state
  demo.js       The demo-mode autopilot that plays every floor
  render.js     Drawing, scenery and joke text, lighting, HUD, cutscenes, title screen, main loop
  shell.html    The page around the game canvas
build.mjs       Inlines src/ into index.html
index.html      The built game (committed so GitHub Pages can serve it)
test/
  headless.cjs  Runs the game in Node on a real canvas
  smoke.cjs     Plays all five floors, every boss and the ending
  demo.cjs      Lets the demo autopilot play the whole game
  remix.cjs     Checks slot rules and fairness fixes, then runs the autopilot across many seeds
```

### Develop

The game itself needs nothing but a browser. Node 18 or newer is only needed for building and the headless tests.

```sh
npm install           # installs the headless canvas used by the tests
npm run build         # rebuild index.html after editing anything in src/
npm test              # build, then play all five floors, every boss and the ending headless
npm run test:demo     # let the demo autopilot play the whole game headless
npm run test:remix    # slot rules, playability regressions, and the autopilot on every floor across 12 seeds
```

To narrow the remix run, pass a comma-separated list of floors and a seed count, for example `node test/remix.cjs rf,f2 5`.

To add a floor, add an entry to `LEVELS` in `src/game.js` with its map, remix slots, spawns, pickups, TVs, checkpoints and boss. Then add its wall decor and end-of-floor broadcast in `src/render.js`.

### Publish on GitHub Pages

In the repo's **Settings → Pages**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`. GitHub will serve the game from `index.html`.

## Content note

The game contains crude humor (puke, snot and farts), cartoon violence, and satire of a fictional televangelist and the 1980s moral panic over heavy metal. There's no alcohol, drug use or sexual content. Rev. Dewey Dollarson, P.U.R.E., VOMITRON and every other band and character are invented. The satire is aimed at one con man's greed and hypocrisy, not at faith or churchgoers.
