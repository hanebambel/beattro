// node test.mjs — builds index.html from src/, syntax-checks the page script and feeds the beat detector a 120 BPM kick.
import { readFileSync, readdirSync } from 'fs';
await import('./build.mjs'); // always test what src/ builds
import assert from 'assert';
const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]); // throws on syntax errors
// Code that slipped behind a line comment (a note added in the middle of a long line) is dead and no syntax check sees it: it happened three times
// (the look fade, then the K key, then a texture unit in the race). ponytail: a pattern match on "prose)name=value;" or "prose)call(args);" at the end of the line after the //, not a parser; widen it if another shape turns up
for (const f of readdirSync(new URL('src', import.meta.url)).filter(f => f.endsWith('.js'))) readFileSync(new URL('src/' + f, import.meta.url), 'utf8').split('\n').forEach((l, i) => {
  const c = l.search(/(?<![:'"`\\])\/\/ /), m = c >= 0 && /[);]\s?[a-zA-Z_$][\w$.\[\]]*(?:[-+*]?=(?!=)[^ ]{3,}|\([^ ]*\);?\s*$)/.exec(l.slice(c));
  assert(!m, `src/${f}:${i + 1}: code behind a comment: ${m && m[0].slice(0, 60)}`);
});
const mkBeat = eval(html.match(/const mkBeat=(.*);/)[1]), beat = mkBeat();
let hits = 0;
for (let i = 0; i < 600; i++) { // 10 s at 60 fps
  const t = i / 60;
  if (beat(Math.exp(-(t % .5) * 8) * .6 + Math.random() * .02, t)) hits++;
}
assert.equal(hits, 20, `expected 20 beats, got ${hits}`);
// the strict kick detector must ignore a wobbling bass line and still catch every kick on top of it
const [k, m, g] = eval(html.match(/KICK=(\[.*?\])/)[1]), kickDet = mkBeat(k, m, g);
let bassOnly = 0, kicks = 0;
kickDet(.3, -1); // prime: the bass is already playing
for (let i = 0; i < 600; i++) { const t = i / 60; if (kickDet(.3 + .12 * Math.sin(t * 20), t)) bassOnly++; }
const kd2 = mkBeat(k, m, g);
for (let i = 0; i < 600; i++) { const t = i / 60; if (kd2(.3 + .12 * Math.sin(t * 20) + Math.exp(-(t % .5) * 8) * .55, t)) kicks++; }
assert.equal(bassOnly, 0, `bass line alone triggered ${bassOnly} shakes`);
assert.equal(kicks, 20, `expected 20 kicks, got ${kicks}`);
// song analysis (ring world): a tone that only plays in the second half must show up in its band, there and only there
const SN = 4096, NB = 32, { min, max, floor, abs, cos, hypot, PI } = Math, TAU = PI * 2;
const ED = new Function('NB', 'max', 'const ' + html.match(/const (ED=\[1\];.*?;) \/\//)[1] + 'return ED')(NB, max);
let SD, SOK = 0, SEC; const songTex = () => {};
eval(html.match(/\/\/ <song>.*\n([\s\S]*?)\/\/ <\/song>/)[1].replace('const SD', 'SD').replace(',SEC=[]', '').replace('const songTex', 'const glTex') + ';globalThis.sa={spectro,songMap,sect:d=>(sect(d),SEC),KD,tempo,phase}');
const tone = Float32Array.from({ length: 441000 }, (_, i) => i > 220500 ? Math.sin(i * TAU * 440 / 44100) : 1e-4 * Math.random());
sa.songMap(sa.spectro(tone), 1);
const tb = ED.findIndex((e, b) => e <= 20 && ED[b + 1] > 20), at = c => SD[(tb * SN + c) * 4];
assert(at(3000) > 200 && at(1000) < 30, `tone band: ${at(1000)} before, ${at(3000)} during`);
// long files are decoded at half the sample rate with half the FFT size: the tone must land in the same band
const half = sa.spectro(Float32Array.from({ length: 220500 }, (_, i) => Math.sin(i * TAU * 440 / 22050)), 1024), col = [...half.subarray(2000 * NB, 2001 * NB)];
assert.equal(col.indexOf(max(...col)), tb, 'half-rate tone band');
// sections: 10 s quiet, 10 s with a kick drum, 10 s quiet > the beat comes in at 10 s and drops out at 20 s
const drum = Float32Array.from({ length: 1323000 }, (_, i) => { const t = i / 44100; return 1e-3 * Math.random() + (t > 10 && t < 20 ? Math.exp(-(t % .5) * 12) * Math.sin(t * TAU * 55) : 0); });
sa.songMap(sa.spectro(drum), 1);
const sec = sa.sect(30).map(([c, n]) => [Math.round(c / SN * 30), Math.sign(n)]);
assert.deepEqual(sec, [[10, 1], [20, -1]], `sections: ${JSON.stringify(sec)}`);
const kd = s => sa.KD[s / 30 * SN | 0]; // kicks per second: none in the quiet parts (they must not shake), two in the beat
assert(kd(5) < 1 && kd(25) < 1 && kd(11) > 1.5 && kd(19) > 1.5, `kick density ${[5, 11, 19, 25].map(kd)}`);
// tempo: the same drum track is 120 BPM with a kick on every beat, the first one at 10.0 s
const [bpm, t0, pat, sharp] = sa.tempo(drum, 44100), off = ((10 - t0) / (60 / bpm) % 1 + 1.5) % 1 - .5;
assert(Math.abs(bpm - 120) < .5 && Math.abs(off) < .06 && sharp > .5, `tempo ${bpm} BPM, off by ${off} beats, sharpness ${sharp}`);
assert.deepEqual([...pat].map(v => +(v > .3)), Array.from({ length: 64 }, (_, i) => +(i % 4 == 0)), 'kick pattern (16 beats, 64 steps)');
// a slow song: kick on every beat at 76 BPM, a softer bass note in between. It also fits a grid of 152 BPM, but must come out as 76
const slow = Float32Array.from({ length: 882000 }, (_, i) => { const t = i / 44100, b = t * 76 / 60; return 1e-3 * Math.random() + Math.exp(-(b % 1) * 9) * Math.sin(t * TAU * 55) + .25 * Math.exp(-((b + .5) % 1) * 9) * Math.sin(t * TAU * 80); });
const sb = sa.tempo(slow, 44100)[0];
assert(Math.abs(sb - 76) < .5, `slow song: ${sb} BPM`);
// disco tempo: kick on every beat at 108 BPM, an open hi-hat on every off-beat. Must come out as 108, not 54 or 216
const disco = Float32Array.from({ length: 882000 }, (_, i) => { const t = i / 44100, b = t * 108 / 60; return 1e-3 * Math.random() + Math.exp(-(b % 1) * 9) * Math.sin(t * TAU * 55) + .3 * Math.exp(-((b + .5) % 1) * 14) * Math.sin(t * TAU * 7000) + .2 * Math.exp(-((b + .5) % 1) * 9) * Math.sin(t * TAU * 110); });
const db = sa.tempo(disco, 44100)[0];
assert(Math.abs(db - 108) < .5, `disco song: ${db} BPM`);
// techno tempo: four on the floor at 140 BPM with an off-beat bass as loud as the kick, and a plain 174. Both must stay fast (not folded to half)
for (const bpm of [140, 174]) {
  const tr = Float32Array.from({ length: 882000 }, (_, i) => { const t = i / 44100, b = t * bpm / 60; return 1e-3 * Math.random() + Math.exp(-(b % 1) * 9) * Math.sin(t * TAU * 55) + (bpm == 140 ? Math.exp(-((b + .5) % 1) * 9) * Math.sin(t * TAU * 80) : 0); });
  const tb = sa.tempo(tr, 44100)[0];
  assert(Math.abs(tb - bpm) < .5, `techno song at ${bpm}: ${tb} BPM`);
}
// strobe limiter: asked for a flash on every sixteenth at 130 to 200 BPM for a minute, it must never start more than three in any one second
const mkStrobe = eval(html.match(/const mkStrobe=(.*);/)[1]);
for (let bpm = 130; bpm <= 200; bpm += 7) {
  const st = mkStrobe(), on = [];
  for (let i = 0; i < 3600; i++) { const t = i / 60; if (st(t, Math.floor(t * bpm / 15) != Math.floor((t - 1 / 60) * bpm / 15))) on.push(t); }
  assert(on.length > 60 && on.every((t, i) => i < 3 || t - on[i - 3] >= 1), `strobe at ${bpm} BPM: ${on.length} flashes`);
}
if (process.argv[3]) { // node test.mjs track.f32 map.bin : song map of a real track (mono 44.1 kHz float PCM) for the ?map= hook
  const { writeFileSync } = await import('fs'), b = readFileSync(process.argv[2]);
  sa.songMap(sa.spectro(new Float32Array(b.buffer, b.byteOffset, b.length >> 2)), 1); writeFileSync(process.argv[3], SD);
  let du = b.length / 4 / 44100, tp = sa.tempo(new Float32Array(b.buffer, b.byteOffset, b.length >> 2), 44100);
 console.log(sa.sect(du).map(([c, n, k]) => `${(c / SN * du).toFixed(2)} s  ${c / SN * du / 60 | 0}:${('0' + (c / SN * du % 60 | 0)).slice(-2)} ${n > 0 ? 'more' : 'less'} ${abs(n).toFixed(2)} beat after ${k.toFixed(2)}`).join('\n'));
  const up = sa.sect(du).find(s => s[1] > 0), [t0, pt] = sa.phase(tp[0], tp[1], tp[2], up ? up[0] / SN * du : -1);
  console.log(`${tp[0].toFixed(3)} BPM, pattern starts at ${t0.toFixed(3)} s, sharpness ${tp[3].toFixed(2)}\n${[...pt].map((v, i) => (i % 16 ? '' : ' | ') + (i % 4 ? '' : ' ') + (v > .6 ? 'X' : v > .3 ? 'x' : '.')).join('')}`);
}
console.log('ok: 20 beats in 10 s @ 120 BPM; kick detector ignores the bass line, catches 20/20 kicks; song map finds the tone; sections, tempo and kick pattern found');
