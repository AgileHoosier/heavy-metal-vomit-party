<h1 align="center">Heavy Metal Vomit Party</h1>

<p align="center">
  <img src="docs/screenshots/gameplay.gif" alt="The hero pukes on a Born-Again Undead in the basement, knocking off its sweater vest" width="640">
</p>

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

<p align="center">
  <img src="docs/screenshots/broadcast.png" alt="Rev. Dewey Dollarson on TV: A Whole Hour of Glory" width="400">
  <img src="docs/screenshots/filth-list.png" alt="The P.U.R.E. Filth List, with VOMITRON at number one" width="400">
</p>

## Play

Download or clone the repo and open **`index.html`** in any modern browser. There's nothing to install and no server to run. If GitHub Pages is turned on for this repo, you can also play it straight from the Pages URL.

Click the game screen once so the sound can start, then press **Enter**.

| Button | Keyboard | Gamepad | Action |
| --- | --- | --- | --- |
| A | `Z` or `Space` | Bottom | Jump |
| B | `X` | Left | Puke. Hold `↑` to lob it over obstacles. |
| X | `C` | Top | Snot rocket |
| Y | `V` | Right | Fart |
| Start | `Enter` | Start | Start and pause |
| | `M` | | Sound on/off |

On phones and tablets, an on-screen controller appears below the game. On the title screen, press `←` or `→` to pick the starting floor, or open `index.html#1f`, `#2f`, `#3f` or `#roof` to start on that floor.

## Your arsenal

| Attack | What it does |
| --- | --- |
| **Puke** | An arcing splash that costs belly. The belly meter refills slowly on its own. Puke left on the floor makes the Undead slip. |
| **Snot rocket** | A fast, straight shot that costs nothing. Slimes enemies so they move at half speed. |
| **Fart** | On the ground, it leaves a stink cloud behind you that gasses anything walking into it. In the air, it's a double jump. |

Puke an Undead enough and it **purges**: the sweater vest flies off and a confused party guest stumbles away. Purge one near a working TV, though, and Dollarson's signal turns it right back. Puke the TVs until they go off the air.

When the Undead bite you, it's the **Tithe Bite**: you lose a heart, and your score floats off as dollar signs toward the nearest TV.

### Power-ups

Every power-up is a pure upgrade, with no downside.

| Pickup | Effect |
| --- | --- |
| Pizza | +1 heart and a belly refill |
| Party Punch | 10 seconds of 3-way puke spray |
| Turbo Cola | 10 seconds of speed and rapid fire |
| VOMITRON record | A hidden collectible on every floor, worth 3,000 points |

## The floors

| Floor | Setting | Boss | Status |
| --- | --- | --- | --- |
| B1 | **The Basement**: VOMITRON's show, amps, candles, goat banners | The Possessed Drummer | Playable |
| 1F | **The Party**: kitchen, living room and den | The Concerned Mom | Playable |
| 2F | **The Bedrooms**: hallway, a sleepover, the bathroom and a metalhead's room | The Radical Youth Pastor | Playable |
| 3F | **The Attic**: rafters, insulation pits and the house's confiscated stash | The Backmasker, a possessed phonograph | Playable |
| Roof | **The Roof**: a storm, wind gusts and the broadcast mast | Rev. Dewey Dollarson in the Glory One helicopter | Playable |

**2F** adds Bedsheet Ghosts that float overhead and swoop (lob your puke at them) and a waterbed that launches you sky-high if you hold jump. **3F** adds porcelain dolls that sit perfectly still until you get close. On **the Roof**, wind gusts shove you around (watch for the WIND warning), and the helicopter is out of reach from the shingles: climb the antenna platforms and lob. Beat Dollarson, free Roxy, and see the ending.

<table>
  <tr>
    <td><img src="docs/screenshots/basement.png" alt="Floor B1: the basement show, under string lights and a pentagram"></td>
    <td><img src="docs/screenshots/drummer.png" alt="Boss: the Possessed Drummer behind his kit under the BLOOD GOAT banner"></td>
  </tr>
  <tr>
    <td align="center"><b>B1: The Basement.</b> Undead Moshers, Pamphlet Pushers and possessed rats.</td>
    <td align="center"><b>The Possessed Drummer.</b> Sticks of righteousness and cymbal shockwaves.</td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/kitchen.png" alt="Floor 1F: the kitchen, with checkered linoleum and an Aerobics Undead mid-hop"></td>
    <td><img src="docs/screenshots/concerned-mom.png" alt="Boss: the Concerned Mom in curlers and a bathrobe, holding her clipboard"></td>
  </tr>
  <tr>
    <td align="center"><b>1F: The Party.</b> Aerobics Undead, Air Guitar Undead, and a fireplace full of burning records.</td>
    <td align="center"><b>The Concerned Mom.</b> Confiscated-record frisbees, a runaway TV cart, and GROUNDED.</td>
  </tr>
</table>

## How it's made

- **No image or audio files.** Every sprite is painted pixel by pixel in code, then given a dark outline. All the music and sound effects are synthesized live with the Web Audio API: distorted guitar, bass, a vibrato lead, a cheesy church organ and drums.
- **16-bit era look.** It renders at 320×240 with shaded sprites, parallax layers, and colored light from party bulbs, candles and TV screens. An optional CRT filter adds scanlines.
- **One file to ship.** The source lives in `src/`, and a small build script inlines it into a single playable `index.html`.

### Project layout

```
src/
  art.js        Pixel painter, character rig, every sprite, tile and wall
  audio.js      Synth instruments, songs and sound effects
  game.js       Input, level data, physics, enemies, bosses, game state
  render.js     Drawing, lighting, HUD, cutscenes, title screen, main loop
  shell.html    The page around the game canvas
build.mjs       Inlines src/ into index.html
index.html      The built game (committed so GitHub Pages can serve it)
test/           Headless harness, smoke test, and screenshot capture
docs/           README screenshots
```

### Develop

The game itself needs nothing but a browser. Node 18 or newer is only needed for building and the headless tests.

```sh
npm install           # installs the headless canvas used by the tests
npm run build         # rebuild index.html after editing anything in src/
npm test              # build, then play all five floors, every boss and the ending headless
npm run screenshots   # recapture the README screenshots and gameplay GIF (needs Python with Pillow)
```

To add a floor, add an entry to `LEVELS` in `src/game.js` with its map, spawns, pickups, TVs, checkpoints and boss. Then add its wall decor and end-of-floor broadcast in `src/render.js`.

### Publish on GitHub Pages

In the repo's **Settings → Pages**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`. GitHub will serve the game from `index.html`.

## Content note

The game contains crude humor (puke, snot and farts), cartoon violence, and satire of a fictional televangelist and the 1980s moral panic over heavy metal. There's no alcohol, drug use or sexual content. Rev. Dewey Dollarson, P.U.R.E., VOMITRON and every other band and character are invented. The satire is aimed at one con man's greed and hypocrisy, not at faith or churchgoers.
