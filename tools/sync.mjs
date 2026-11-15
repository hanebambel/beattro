// node tools/sync.mjs track.f32 ... : how far is the page's tempo grid off the real kick onsets? (onset = where the low end starts to rise, at 1 ms steps)
// track.f32 = mono 44.1 kHz float PCM: ffmpeg -i song.m4a -ac 1 -ar 44100 -f f32le tools/out/song.f32
import {readFileSync} from 'fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),{min,max,floor,abs,cos,hypot,PI}=Math,TAU=PI*2,NB=32,SN=4096;
const ED=new Function('NB','max','const '+html.match(/const (ED=\[1\];.*?;) \/\//)[1]+'return ED')(NB,max);
let SD,SOK=0,SEC;const songTex=()=>{};
eval(html.match(/\/\/ <song>.*\n([\s\S]*?)\/\/ <\/song>/)[1].replace('const SD','SD').replace(',SEC=[]','').replace('const songTex','const glTex')+';globalThis.sa={spectro,songMap,sect:d=>(sect(d),SEC),tempo,phase}');
for(const f of process.argv.slice(2)){
  const b=readFileSync(f),d=new Float32Array(b.buffer,b.byteOffset,b.length>>2),sr=44100,du=d.length/sr;
  sa.songMap(sa.spectro(d),1);const up=sa.sect(du).find(s=>s[1]>0),tp=sa.tempo(d,sr),[t0,pat]=sa.phase(tp[0],tp[1],tp[2],up?up[0]/SN*du:-1),per=60/tp[0];
  // fine envelope: two 90 Hz low-passes, RMS over 2 ms, every 1 ms
  const a=1-Math.exp(-TAU*90/sr),n=floor(du*1000),env=new Float32Array(n);let l1=0,l2=0,i=0;const q=[];
  for(let j=0;j<n;j++){let e=0;const end=floor((j+1)*sr/1000);let c=0;for(;i<end;i++,c++){l1+=a*(d[i]-l1);l2+=a*(l1-l2);e+=l2*l2}env[j]=Math.sqrt(e/c)}
  const offs=[];
  for(let k=0;t0+k*per/4<du-1;k++){
    if(pat[k&63]<=.6)continue;const g=t0+k*per/4,j0=floor(g*1000);if(j0<100)continue;
    let pk=0,pj=0;for(let j=j0-60;j<j0+90;j++)if(env[j]>pk){pk=env[j];pj=j}
    let base=1e9;for(let j=j0-60;j<pj;j++)base=min(base,env[j]);
    if(pk<base*2.5||pk<.02)continue; // no clear kick here
    let on=pj;for(let j=pj;j>j0-60;j--){if(env[j]<base+(pk-base)*.15){on=j;break}} // where the rise starts (15 % of the way up)
    let sj=pj,sv=0;for(let j=j0-60;j<pj;j++){const v=env[j+3]-env[j-3];if(v>sv){sv=v;sj=j}}
    offs.push(on/1000-g);(globalThis.ST??=[]).push([g,sj/1000-g,on/1000-g]);
  }
  offs.sort((x,y)=>x-y);const med=offs[offs.length>>1],p10=offs[offs.length*.1|0],p90=offs[offs.length*.9|0];
  console.log(`${f.split('/').pop()}: ${tp[0].toFixed(3)} BPM, ${offs.length} kicks checked. Real onset minus grid: median ${(med*1000).toFixed(0)} ms (10th-90th percentile ${(p10*1000).toFixed(0)} .. ${(p90*1000).toFixed(0)} ms)`);
  // drift: first quarter vs last quarter of the song
  const md=a=>{a=[...a].sort((x,y)=>x-y);return (a[a.length>>1]*1000).toFixed(0)};for(let k=0;k<4;k++){const part=ST.filter(e=>e[0]>=du*k/4&&e[0]<du*(k+1)/4);if(part.length)console.log(`   quarter ${k+1}: ${part.length} kicks, start of rise ${md(part.map(e=>e[2]))} ms, steepest rise ${md(part.map(e=>e[1]))} ms`)}ST.length=0;
  const tm=offs.length;console.log('   (negative = the grid, and with it every pulse, comes after the kick has already started)');
}
