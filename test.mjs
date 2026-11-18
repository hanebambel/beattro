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
eval(html.match(/\/\/ <song>.*\n([\s\S]*?)\/\/ <\/song>/)[1].replace('const SD', 'SD').replace(',SEC=[]', '').replace('const songTex', 'const glTex') + ';globalThis.sa={spectro,songMap,sect:d=>(sect(d),SEC),KD,tempo,phase,tags}');
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
// interlaced retro tube: a line that waits for its field must never dim by more than 15 % in one frame, at any frame rate; a long gap clears the tube
const glow = eval(html.match(/glow=(\(d,tau,il\)=>.*?);\n/)[1]);
for (const tau of [.05, .08, .12, .15]) { for (let d = 1 / 144; d <= .25; d += .002) assert(glow(d, tau, 1) >= .85, `glow ${d} ${tau}`); assert.equal(glow(.3, tau, 1), 0); assert.equal(glow(.3, tau, 0), 0); }
// the zap: one burst of snow and no second one (snow is 1 from the cut, then only falls, and stays 0 once it is 0), the picture only ever rolls towards its place, colour comes on once,
// and at every tempo all of it is over within a beat, back at exactly "nothing going on". And it must be picked through the strobe limiter, or strobes and zaps together could pass three a second
{ const [, zn, f] = html.match(/const ZN=(\[.*?\]),zapEnv=(.*);\n/), ZN = eval(zn), zapEnv = eval(f), tuneEnv = eval(html.match(/const tuneEnv=([\s\S]*?\]\});\n/)[1]);
  for (const bpm of [0, 80, 100, 120, 150, 180, 200]) for (const f0 of [.3, .9]) for (const e0 of [.2, -.2]) {
    const k = Math.min(1.2, Math.max(.72, 120 / (bpm || 120))), beat = 60 / (bpm || 120); let pv = zapEnv(0, k, f0, e0), col = 0;
    assert.deepEqual(pv.slice(0, 4), [1, 0, 0, 0], 'zap starts as snow');
    for (let s = .002; s < 2; s += .002) { const z = zapEnv(s, k, f0, e0);
      assert(z[0] <= pv[0] && (pv[0] > 0 || z[0] == 0) && z[0] >= 0 && z[0] <= 1, `zap snow at ${s}`); assert(z[3] >= pv[3], 'zap colour'); if (z[3] > pv[3]) col++;
      if (pv[1] > 0) assert(z[1] < pv[1] && z[1] >= 0, `zap roll at ${s}`); assert(z[4] >= 1 && z[4] <= 1.1 && Math.abs(z[2]) <= .2 && Math.abs(z[5]) <= .04, 'zap sizes');
      if (s >= Math.min(beat, .62)) assert(z[0] == 0 && z[1] == 0 && z[2] == 0 && z[3] == 1, `zap over within a beat at ${bpm} BPM (${s.toFixed(3)}: ${z})`);
      pv = z; }
    assert(col == 1 && pv[4] < 1.001 && pv[5] == 0, 'zap ends clean'); }
  assert.deepEqual(ZN.slice(0, 6), zapEnv(9, 1, .5, .2).map(v => +v.toFixed(6))); assert(ZN.length == 12 && /if\(!zapOn\)\{zapOn=1;if\(!strobe\(last\/1e3,1\)\)zapDry=1\}/.test(html) && /if\(zapDry\)ZP\[0\]=0/.test(html), 'the zap registers its snow with the strobe limiter and goes without if refused');
  // the tune: starts from the standing picture, the snow comes up and goes down once and never quickly (no step of the brightness of the frame), the scenes change while there is nothing but
  // snow, the new picture only ever rolls towards its place and sits before the end, and at the end only blur, gain and colour are still off: that is the snap
  let pv = tuneEnv(0), top = 0; assert.deepEqual(pv.map(v => v + 0), ZN, 'tune starts clean');
  for (let i = 1; i < 1000; i++) { const p = i / 1000, z = tuneEnv(p); assert(z.length == 12 && z.every(v => v == v), 'tune values');
    assert(Math.abs(z[0] - pv[0]) < .012 && z[0] >= 0 && z[0] <= 1 && (top ? z[0] <= pv[0] : z[0] >= pv[0]), `tune snow at ${p}`); if (z[0] == 1) top = top || p; if (p > .6) top = top || 1;
    if (p > .43 && p < .57) assert(z[0] == 1, 'only snow while the scenes change'); else assert(Math.abs(z[4] - pv[4]) < .01, `tune gain at ${p}`);
    if (i > 501) assert(z[1] <= pv[1] && z[1] >= 0, `tune roll at ${p}`); assert(z[4] >= .5 && z[4] <= 1 && z[6] >= 0 && z[6] <= 3 && z[7] <= .16 && z[8] <= 1 && z[9] <= .5 && Math.abs(z[2]) <= .07);
    pv = z; }
  assert(top > .3 && top < .43 && pv[0] == 0 && pv[1] == 0 && pv[2] == 0 && pv[3] == 0 && pv[4] > .8 && pv[6] > 0, 'tune ends just short of tuned: ' + pv); }
// the tube's headroom follows the strength of its phosphor strips: the brightest spot (two scan lines of full white overlapping on a lit strip that also sits in the bright part of
// its slot) must still fit into the canvas at every setting of the V key, and the shipped values must be ones the keys X and V can come back to
{ const [, f, m0, b0] = html.match(/const rhg=(.*?);let RML=([\d.]+),RHB=([\d.]+),RHG=rhg\(RML\)/), rhg = eval(f), stp = (v, n) => Math.abs(v * n - Math.round(v * n)) < 1e-9;
  assert(m0 >= 1 && m0 <= 3 && stp(m0, 10) && b0 >= .8 && b0 <= 2 && stp(b0, 20), 'tube settings as shipped');
  for (let m = 1; m <= 3.001; m += .1) assert((Math.sqrt(1.385 * 1.1 * m) + .012) / rhg(m) < 1.001, 'tube headroom at ' + m); }
assert(Math.abs(glow(1 / 60, .12, 0) - .87) < .01); assert.equal(glow(NaN, .12, 1), 0);
// dimming before a big step up: it must count beats. A step at 10.3 s on a grid that starts at .25 s falls on beat 20 at 120 BPM: nothing 8 beats before, half way 4 before, full on the beat.
// The same in seconds at 90 BPM (beat 15 at 10.25 s) must take longer; without a tempo it is the last 2 s
const [, DIMB, preDim] = html.match(/const DIMB=(\d+),preDim=(.*);/), pdm = eval(preDim.replace(/DIMB/g, DIMB)), near = (a, b) => Math.abs(a - b) < 1e-9;
assert(pdm(10.3, .25 + 12 * .5, .25, 120) == 0 && near(pdm(10.3, .25 + 16 * .5, .25, 120), .5) && pdm(10.3, .25 + 20 * .5, .25, 120) == 1 && pdm(10.3, 10.28, .25, 120) == 1, 'dimming at 120 BPM');
assert(pdm(10.3, .25 + 7 / 1.5, .25, 90) == 0 && near(pdm(10.3, .25 + 11 / 1.5, .25, 90), .5) && near(pdm(10.3, 9.3, .25, 0), .5) && pdm(10.3, 8, .25, 0) == 0, 'dimming at 90 BPM and without a tempo');
// title and artist from the file's tags. ID3: v2.3 (plain frame sizes, Latin-1 and UTF-16 either way round), v2.4 (frame sizes with 7 bits per byte, UTF-8, an accent that arrives as a separate
// character), v2.2 (three-letter frames); each with a 200-byte frame in front, which only a correctly read size gets past. MP4: the iTunes list behind a box with a 64-bit size
{
  const B = (...a) => Buffer.concat(a.map(v => typeof v == 'string' ? Buffer.from(v, 'latin1') : Buffer.from(v))), u32 = n => [n >>> 24, n >>> 16 & 255, n >>> 8 & 255, n & 255], ss = n => [n >> 21 & 127, n >> 14 & 127, n >> 7 & 127, n & 127];
  const id3 = (V, ...fr) => { const b = B(...fr.map(([id, d]) => V < 3 ? B(id, u32(d.length).slice(1), d) : B(id, V > 3 ? ss(d.length) : u32(d.length), [0, 0], d))); return B('ID3', [V, 0, 0], ss(b.length + 50), b, new Uint8Array(60)); };
  const pad = Buffer.alloc(200, 65), u16 = (s, be) => { const b = Buffer.from('﻿' + s, 'utf16le'); return be ? b.swap16() : b; }, T = b => sa.tags(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
  assert.deepEqual(T(id3(3, ['TALB', pad], ['TIT2', B([0], 'Caf\xe9 Song')], ['TPE1', B([1], u16('Die Ärzte'))])), ['Café Song', 'Die Ärzte'], 'ID3v2.3');
  assert.deepEqual(T(id3(3, ['TPE1', B([1], u16('Big Endian', 1))], ['TIT2', B([2], u16('No Mark', 1).subarray(2))])), ['No Mark', 'Big Endian'], 'ID3v2.3, UTF-16 big endian');
  assert.deepEqual(T(id3(4, ['TALB', pad], ['TIT2', B([3], Buffer.from('Märchen\0second value'))], ['TPE1', B([3], Buffer.from('A\tB' + 'x'.repeat(100)))])), ['Märchen', 'A B' + 'x'.repeat(77)], 'ID3v2.4');
  assert.deepEqual(T(id3(2, ['TAL', pad], ['TT2', B([0], 'Old')], ['TP1', B([0], 'Tag')])), ['Old', 'Tag'], 'ID3v2.2');
  const box = (id, ...c) => { const b = B(...c); return B(u32(b.length + 8), id, b); }, item = (id, s) => box(id, box('data', [0, 0, 0, 1, 0, 0, 0, 0], Buffer.from(s)));
  const mp4 = meta => B(box('ftyp', 'M4A '), B(u32(1), 'mdat', [0, 0, 0, 0], u32(24), new Uint8Array(8)), box('moov', box('mvhd', new Uint8Array(20)), box('udta', meta)));
  assert.deepEqual(T(mp4(box('meta', [0, 0, 0, 0], box('hdlr', new Uint8Array(12)), box('ilst', item('\xa9alb', 'Album'), item('\xa9nam', 'Straße'), item('\xa9ART', 'Björk'))))), ['Straße', 'Björk'], 'MP4');
  assert.deepEqual(T(mp4(box('meta', box('ilst', item('\xa9nam', 'Only a title'))))), ['Only a title', ''], 'QuickTime-style meta, no artist');
  // nothing to find, cut-off or senseless files: empty, never an exception (a throw would cost the song its analysis)
  const good = id3(3, ['TIT2', B([1], u16('Cut off'))]), m4 = mp4(box('meta', [0, 0, 0, 0], box('ilst', item('\xa9nam', 'x'))));
  for (const b of [B(), B('ID3'), good.subarray(0, 24), m4.subarray(0, m4.length - 5), B('ID3', [3, 0, 0, 127, 127, 127, 127], 'TIT2', [255, 255, 255, 255, 0, 0, 1]), B(u32(0), 'moov'), B(u32(1), 'moov', [255, 255, 255, 255, 255, 255, 255, 255]), Buffer.from(Array.from({ length: 4096 }, (_, i) => i * 7919 % 256))])
    assert.deepEqual(T(b).map(v => typeof v), ['string', 'string'], 'odd file');
  assert.deepEqual(T(B('RIFF', new Uint8Array(100))), ['', '']);
}
// looks: the K key steps through them plus "with the scenes"; the four places that know how many there are must agree (a wrong default boots the page in the last look)
const lm = +html.match(/lkm=\(lkm\+1\)%(\d+)/)[1];
for (const q of [`look=([0-${lm - 1}])`, `||[,${lm - 1}])[1]`, `look=lkm>${lm - 2}?alk:lkm`, `if(lkm<${lm - 1})pl=look`]) assert(html.includes(q), `look count: ${q}`);
// the playlist: only audio and video files (those of unknown type by their ending, so no folder), in the order of their names, numbers counted as numbers
{ const plist = eval(html.match(/const plist=(.*);\n/)[1]), f = (name, type) => ({ name, type });
  assert.deepEqual(plist([f('10 c.mp3', 'audio/mpeg'), f('cover.jpg', 'image/jpeg'), f('2 b.flac', ''), f('1 a.mp4', 'video/mp4'), f('notes.txt', 'text/plain'), f('Album', ''), f('disc.cue', '')]).map(q => q.name), ['1 a.mp4', '2 b.flac', '10 c.mp3']);
  for (const q of ['if(pli<PL.length-1)track(pli+1,1)', "e.shiftKey?skip(1):next("]) assert(html.includes(q), `playlist: ${q}`); }
assert(html.includes('if(cur==SUITS)alk=0'), 'the suits scene keeps the normal look when looks change with the scenes (card colours only)');
console.log('ok: 20 beats in 10 s @ 120 BPM; kick detector ignores the bass line, catches 20/20 kicks; song map finds the tone; sections, tempo and kick pattern found');
