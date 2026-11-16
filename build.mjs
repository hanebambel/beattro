// node build.mjs : pours src/ into the one index.html (also run by test.mjs, so the page is never stale)
import { readFileSync, writeFileSync } from 'fs';
const src = n => readFileSync(new URL('src/' + n, import.meta.url), 'utf8');
const FILES = [ // in this order; scene files push themselves onto the scene list, so their order is the scene numbering
  'core.js',
  'assets.js',
  'scenes-01-14-canvas.js',
  'gl.js',
  'gx.js',
  'scene-15-cat-lattice.js',
  'scene-16-rotozoomer.js',
  'scene-17-metaballs.js',
  'scene-18-julia.js',
  'scene-19-moire.js',
  'scene-20-menger.js',
  'scene-21-race.js',
  'scene-22-city.js',
  'scene-23-ocean.js',
  'scene-24-black-hole.js',
  'scene-25-cat-choir.js',
  'scene-26-gyroid.js',
  'scene-27-kaleidoscope.js',
  'scene-28-texture-tunnel.js',
  'scene-29-kefrens.js',
  'scene-30-shadebobs.js',
  'song-analysis.js',
  'scene-31-ring-world.js',
  'scene-32-glow-forest.js',
  'scene-33-dance.js',
  'scene-34-title.js',
  'scene-35-light-bikes.js',
  'scene-36-jump-and-run.js',
  'scene-37-attack-run.js',
  'scene-38-the-dive.js',
  'scene-39-dance-floor.js',
  'transitions.js',
  'post.js',
  'retro.js',
  'hdr.js',
  'main.js',
];
const out = src('page.html').replace('/*#SRC*/\n', () => FILES.map(src).join(''));
writeFileSync(new URL('index.html', import.meta.url), out);
console.log(`index.html: ${out.length} bytes from ${FILES.length} files`);
