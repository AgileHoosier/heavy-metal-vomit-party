// Builds index.html from src/: the shell page plus the four game scripts, inlined into one file.
import { readFileSync, writeFileSync } from 'node:fs';
const src = f => readFileSync(new URL(`./src/${f}`, import.meta.url), 'utf8');
const js = ['art.js', 'audio.js', 'game.js', 'render.js'].map(src).join('\n');
writeFileSync(new URL('./index.html', import.meta.url), src('shell.html').replace('/*__SCRIPT__*/', () => js));
console.log('Built index.html');
