// Loads index.html's game script into Node with a real canvas, so tests can step frames and save screenshots.
const fs = require('fs'), path = require('path');
const { createCanvas } = require('@napi-rs/canvas');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const el = () => ({ addEventListener() {}, classList:{ toggle() {}, add() {}, remove() {}, contains() { return true; } }, setAttribute() {}, focus() {}, dataset:{}, textContent:'' });
const game = createCanvas(320, 240);
const els = { game, screen:el(), snd:el(), crt:el(), fs:el(), pad:el() };
global.window = global; global.addEventListener = () => {};
global.document = { getElementById:id => els[id], createElement:() => createCanvas(1, 1), querySelectorAll:() => [], addEventListener() {}, hidden:false };
global.localStorage = { getItem() { return null; }, setItem() {} };
global.requestAnimationFrame = () => {}; global.navigator = {}; global.location = { hash:'' };
eval(js);
const G = window.__HMVP;
const step = (keys = {}) => { for (const k in G.kbd) G.kbd[k] = keys[k] ? 1 : 0; G.update(); };
const save = name => { fs.mkdirSync(path.join(__dirname, 'shots'), { recursive:true }); fs.writeFileSync(path.join(__dirname, 'shots', name + '.png'), game.toBuffer('image/png')); };
module.exports = { G, step, save };
