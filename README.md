# Heavy Metal Vomit Party

A 16-bit style side-scroller that runs in the browser. It's 1987. Rev. Dewey Dollarson's TV broadcast, *A Whole Hour of Glory*, has turned every guest at VOMITRON's basement show into the Born-Again Undead and carried the band's singer, Roxy, to the roof for a live on-air exorcism. You were in the bathroom throwing up when it happened. Fight up five floors of the house and puke on every one of them.

**Playable now:** Floor B1 (The Basement) and Floor 1F (The Party). Floors 2F, Attic and Roof are next.

## Play

Open `index.html` in any modern browser. No server or install needed.

| Button | Keyboard | Action |
| --- | --- | --- |
| A | Z / Space | Jump |
| B | X | Puke (hold ↑ to lob) |
| X | C | Snot rocket |
| Y | V | Fart (stink cloud behind you; double jump in the air) |
| Start | Enter | Start / pause |
|  | M | Sound on/off |

Gamepads and touch screens work too. On the title screen, press ← or → to choose the starting floor, or open `index.html#1f` to start on 1F.

## Project layout

| Path | What's in it |
| --- | --- |
| `src/art.js` | Pixel painter with auto-outline, the character rig, and every sprite, tile and wall. No image files. |
| `src/audio.js` | Web Audio synth (distorted guitar, bass, lead, organ, drums), the songs, and sound effects. |
| `src/game.js` | Input, level definitions, physics, enemies, bosses, and game state. |
| `src/render.js` | Drawing, lighting, HUD, cutscenes, title screen, and the main loop. |
| `src/shell.html` | The page around the game canvas. |
| `build.mjs` | Inlines the four scripts into the shell and writes `index.html`. |
| `index.html` | The built, playable game. Commit it so GitHub Pages can serve it. |
| `test/` | A headless harness and a smoke test that plays both floors and both bosses. |

## Develop

```sh
npm install        # only needed for the headless tests
npm run build      # rebuild index.html after editing src/
npm test           # build, then play both floors headless
```

To add a floor, add an entry to `LEVELS` in `src/game.js` (map, spawns, pickups, TVs, checkpoints, boss) and its decor and broadcast in `src/render.js`.

## Publish on GitHub Pages

In the repo's **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`. The game will be served from `index.html`.

## Content

Crude humor, cartoon violence, and satire of a fictional televangelist and the 1980s moral panic over heavy metal. Rev. Dewey Dollarson, P.U.R.E., VOMITRON and every other band and character are invented.
