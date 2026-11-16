// Beat = jump in bass energy (flux) of at least m and k times its running average, min. g seconds apart. Checked by test.mjs.
const mkBeat=(k=2,m=.04,g=.25)=>{let p=0,a=0,l=-1;return(e,t)=>{if(t<l)l=-1;const f=Math.max(0,e-p),hit=f>a*k+m&&t-l>g;p=e;a+=(f-a)*.05;if(hit)l=t;return hit}};

let x=c.getContext('2d');const{sin,cos,min,max,abs,floor,ceil,hypot,PI}=Math,TAU=PI*2;
const IDLE='B E A T T R O\n\ndrop mp3 / mp4\nor click';
const BEAT=[2.5,.1],KICK=[3,.16,.3]; // detector settings [k, m, g]: beats (colour, flash, scene pacing) and the stricter kick that shakes the screen
const SHAKE=2.4,GLPX=1.3e6; // screen shake strength in vmin; pixel budget of the shader scene (it is upscaled; lower = faster)
const SP=7,NT=28,NR=32,M=10,NS=350,NB=32,NP=400; // speed, tunnel rings, terrain rows, ring sides, stars, spectrum bands, sphere dots
const S=Float32Array.from({length:NS*3},(_,i)=>i%3<2?Math.random()*30-15:Math.random()*30);
const SPH=new Float32Array(NP*3);for(let i=0;i<NP;i++){const y=1-2*(i+.5)/NP,r=Math.sqrt(1-y*y);SPH.set([cos(i*2.4)*r,y,sin(i*2.4)*r],i*3)}
const ED=[1];for(let b=1;b<=NB;b++)ED[b]=max(ED[b-1]+1,Math.round(700**(b/NB))); // log-spaced FFT bin edges, ~20 Hz..16 kHz
const B=new Float32Array(NB),BV=new Float32Array(NB),PB=new Float32Array(NB).fill(1e-4),PK=new Float32Array(NB);
const SH=new Float32Array(64*NB),wv=new Float32Array(1024),hist=new Float32Array(64),OP=new Float32Array(32);
let P=new Float32Array(82),Q=new Float32Array(82);
const O=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const pc=document.createElement('canvas');pc.width=192;pc.height=108;const px2=pc.getContext('2d'),PD=px2.createImageData(192,108);PD.data.fill(255);
// resolution as an effect: the chunky pixel scenes (plasma, voxel landscape) step through four resolutions and back, every 8 beats (every 3 s where there is no beat)
const rl=()=>[0,1,2,3,2,1][((quiet||!beats?t/3:beats/8)|0)%6];
const MSG='BEATTRO ... ONE HTML FILE, NO ASSETS, EVERYTHING IS CODE ... DROP ANY MP3 OR MP4 AND WATCH IT MOVE ... SPACE = PAUSE   F = FULLSCREEN   O = OPEN FILE   N = NEXT SCENE   1-9, 0 = PICK SCENE   SHIFT + 1-9, 0 = MORE SCENES   R = RACE   W = RING WORLD   G = GLOW FOREST   D = DANCE   T = TITLE   B = LIGHT BIKES   J = JUMP AND RUN   S = ATTACK RUN   U = THE DIVE   M = MOOD (AUTO / PARTY / DARK / DISCO / TECHNO)   P = GLOW ON / OFF   Q = RESOLUTION (STEADY 60 FPS / 4K / 2.5K / 1080P / 720P)   H = ALL KEYS   I = FRAME RATE   , AND . = PICTURE EARLIER / LATER (SYNC)   K = LOOK (CHANGES WITH THE SCENES / NORMAL / SOLID / NEON / PSYCHEDELIC / HDR / CODE RAIN)   L = LOCK SCENE   ARROWS = STEP THROUGH ALL ... MEOW ... GREETINGS TO EVERYONE WHO EVER WATCHED A CRACKTRO LONGER THAN THE GAME ...      ';
let W,H,D,ac,an,an2,w2,fd,beat=mkBeat(...BEAT),subBeat=mkBeat(...KICK),beats=0,hue=180,lvl=0,kick=0,fi=0,tt=+(/[?&]T=([\d.]+)/.exec(location.search)||[])[1]||0,last=0,pk=1e-3,sub=0,t=0,dt=0,F=1,R=1,row=-1,roll=0,ts=1;
const FAKE=/fake/.test(location.search); // test hooks: ?fake = synthetic beat, ?rt=8 = start the race at second 8, ?T=60 = start the clock at 60 s, ?dur=309 = pretend the song is that long
const dur=()=>sdu||an&&v.duration||FAKE&&+(/dur=([0-9.]+)/.exec(location.search)||[])[1]||300; // song length in s (the analysed length if there is one, so map columns and clock agree)
const DARK=[1,4,7,12,17,18,19,21,22,23,25,30,31,37]; // scenes for the dark mood: mountains, oscilloscope, dot wave, voxels, julia, moire, sponge, city, ocean, black hole, cave, ring world, glow forest, the dive (same ponytail as CALM)
const DISCO=[0,2,3,5,6,8,10,11,13,14,15,16,18,24,26,27,28,29,32,33],DQ=[3,5,16,18,26,29]; // the disco mood: tunnel, radial spectrum, dot sphere, plasma, wire cubes, copper bars, twister, vector balls, glenz, cat lattice, rotozoomer, metaballs, moire, cat choir, kaleidoscope, texture tunnel, kefrens, shadebobs, dance, title. DQ: its quiet parts (dot sphere, plasma, metaballs, moire, kaleidoscope, shadebobs). Same ponytail as CALM
const TECHNO=[0,2,3,4,6,7,10,13,18,19,21,23,25,27,28],TQ=[4,7,18,19,25]; // the techno mood: tunnel, radial spectrum, dot sphere, oscilloscope, wire cubes, dot wave, twister, glenz, moire, sponge, city, black hole, cave, texture tunnel, kefrens (plus race, light bikes and attack run, see pick()). TQ: its quiet parts. Same ponytail as CALM
// Strobe limiter: flashes never start less than 0.34 s apart, so there are at most three in any second, whatever the tempo or the music asks for
// (more than three flashes a second can trigger seizures in people with photosensitive epilepsy). Returns a function (time, wanted) > 1 = flash now.
// The three retro tube looks (retro.js). glow: the share of its light a phosphor still gives d seconds on (tau: its time constant). In the interlaced looks a line
// is only drawn every other frame and lives on its glow in between: there it never loses more than 15 % per frame, however slow the frames come
// (lines pulsing deeper than that would flicker), and in both looks a quarter of a second without a frame clears the tube.
const RTL=l=>l>5&&l<9,glow=(d,tau,il)=>!(d<=.25)?0:Math.max(il?.85:0,Math.exp(-d/tau));
const mkStrobe=(gap=.34)=>{let l=-9;return(t,w)=>{if(t<l)l=-9;return w&&t-l>=gap?(l=t,1):0}};
const strobe=mkStrobe();
const CALM=[1,4,7,17,18,22,25,30,31,37]; // ponytail: fixed indices, they shift if shader scenes drop out (no WebGL2); then the picks are just less fitting // scenes for the quiet parts: mountains, oscilloscope, dot wave, julia, moire, ocean, cave, ring world, glow forest
let lat=0,trim=0;try{trim=+localStorage.trim||0}catch(e){} // s: manual sync trim, + = picture later; the , and . keys change it in steps of 10 ms and it is remembered
let es=0,ft=tt,MO=+(/mood=([0123])/.exec(location.search)||[])[1]||0,mo=0,dk=0,dc=0,dca=0,tc=0,tca=0,stb=0,sbx=.5,sbn=0,sbu=-99,cfl='',ma=0,scn=0,BPM=0,T0=0,PAT=new Float32Array(64),bp=0,lst=-1,lph=-1,mv=5,mi=0,TR=0,lk=-9,sq=0,tk=0,ta=0,quiet=0,apr=-1,sdu=0,psc=0,arm=0,tl=2,bang=0,live=1,gm=0,gp=0,RACE=-1,RING=-1,lock=0,rp=0,rt=+(/rt=([\d.]+)/.exec(location.search)||[])[1]||0;
let cur=(+location.hash.slice(1)||1)-1,prev=-1,sw=tt-2,sb=0,bag=[],qbag=[]; // scene sequencer

// Resolution switch (Q): steady 60 fps with a resolution that adapts (the default), or a fixed picture height: 4K, 2.5K, 1080p, 720p (RES; shaders run at
// that full size too, whatever the frame rate; never more than the screen has). The steady mode: QL are the steps (share of the pixels); the frame rate is checked once a second, a drop goes one step down at once, five good seconds
// try one step up, and a step that just failed is left alone for 30 s. I shows frame rate, resolution and step.
const LOOKS=()=>['NORMAL','SOLID','NEON','PSYCHEDELIC',XDR?'HDR (REAL: BRIGHTER THAN WHITE)':'HDR STYLE'+(P3?' (WIDE COLOUR)':''),'CODE RAIN','RETRO TUBE OCS (HAM6, 384 X 288)','RETRO TUBE OCS INTERLACED (HAM6, 384 X 576)','RETRO TUBE AGA (HAM8, 768 X 576, INTERLACED)'];
const QL=[1,.8,.64,.5,.4,.3,.22,.16],RES=[2160,1440,1080,720],RN=['4K','2.5K','1080P','720P'];
let qm=/[?&]max/.test(location.search)?1:0,lv=+(/[?&]lv=([0-7])/.exec(location.search)||[])[1]||0,lkm=+(/look=([0-9])/.exec(location.search)||[,9])[1],look=0,pl=0,alk=0,lf=1,sl=16,nx=16,QS=1,XS=1,fps=0,fa=0,fn=0,fw=0,wst=0,jsa=0,jsn=0,wu=0,help=0,slow=0,good=0,bad=-1,bt=0,lup=0,inf=/bench/.test(location.search)?1e12:0;
let GX=0,MAIN=0,OLD=0,NEW=0,HIS=0,SCR=0; // the WebGL drawing layer and its render targets (gx.js); without WebGL2 everything stays on the 2D canvas
const size=()=>{ // steady mode never draws more than a 4K picture (8.3 million pixels) times the current step; measured: beyond that even an M3 Max drops frames in transitions
  const iw=RTL(lkm)?min(innerWidth,innerHeight*4/3):innerWidth;document.body.style.cssText=iw<innerWidth?`width:${iw}px;margin:0 auto`:''; // the retro tube is 4:3: with that look chosen the whole picture is drawn 4:3 and centred, so nothing is cut off (when the look only comes with a scene, the tube shows the middle of the frame: retro.js)
  D=qm?min(devicePixelRatio||1,RES[qm-1]/innerHeight):min(devicePixelRatio||1,1.5,Math.sqrt(8.3e6/iw/innerHeight))*Math.sqrt(QL[lv]);W=c.width=iw*D|0;H=c.height=innerHeight*D|0;if(GX)GX.resize()};
onresize=size;size();ui.textContent=IDLE;

function load(file){
  if(!file)return;
  v.pause();URL.revokeObjectURL(v.src);v.src=URL.createObjectURL(file);
  beat=mkBeat(...BEAT);subBeat=mkBeat(...KICK);beats=sb=0;pk=1e-3;PB.fill(1e-4);ui.textContent=file.name+'\n\nclick / space to start';analyse(file);
}
function go(){ // must run inside a user gesture: starts audio + fullscreen
  if(!v.src)return f.click();
  if(!v.paused&&!v.ended){ui.textContent='P A U S E D\n\nclick / space';return v.pause()}
  if(!ac){
    ac=new AudioContext;an=ac.createAnalyser();an.fftSize=2048;an.smoothingTimeConstant=.3;
    ac.createMediaElementSource(v).connect(an);an.connect(ac.destination);fd=new Float32Array(an.frequencyBinCount);
    // kick path: 24 dB/oct low-pass at 90 Hz into its own analyser, so only the drum's body is left (no bass-line harmonics, no FFT smear)
    const lp=[0,0].map(()=>{const f=ac.createBiquadFilter();f.frequency.value=90;return f});
    an.connect(lp[0]);lp[0].connect(lp[1]);an2=ac.createAnalyser();an2.fftSize=1024;lp[1].connect(an2);w2=new Float32Array(1024);
  }
  if(v.currentTime<.5&&!location.hash){quiet=sdu&&KD[0]<1;next()} // a song starts with a scene drawn from the bag, not always with the tunnel of the waiting screen
  ac.resume();v.play();fs(1);
}
const fs=on=>document.fullscreenElement?on||document.exitFullscreen():document.documentElement.requestFullscreen?.()?.catch(()=>{});
f.onchange=()=>load(f.files[0]);
ui.onclick=c.onclick=go;
ondragover=e=>e.preventDefault();
ondrop=e=>{e.preventDefault();load(e.dataTransfer.files[0])};
onkeydown=e=>{if(e.code=='Space')go();if(e.code=='KeyF')fs();if(e.code=='KeyO')f.click();if(e.code=='KeyN')next();if(e.code=='ArrowRight')next((cur+1)%SC.length);if(e.code=='ArrowLeft')next((cur+SC.length-1)%SC.length);if(e.code=='KeyR')next(RACE);if(e.code=='KeyW'&&RING>=0)next(RING);if(e.code=='KeyG'&&WOOD>=0)next(WOOD);if(e.code=='KeyD')next(DANCE);if(e.code=='KeyC'&&FLOOR>=0)next(FLOOR);if(e.code=='KeyT'&&TITLE>=0)next(TITLE);if(e.code=='KeyB')next(BIKES);if(e.code=='KeyJ')next(JUMP);if(e.code=='KeyS'&&FLY>=0)next(FLY);if(e.code=='KeyU'&&DIVE>=0)next(DIVE);if(e.code=='KeyM'){mo=(mo+1)%5;bag=[];qbag=[]}if(e.code=='KeyP'&&POST)POST(!post);if(e.code=='KeyQ'){const nat=innerHeight*(devicePixelRatio||1);do qm=(qm+1)%5;while(qm>1&&RES[qm-1]>=nat);inf=max(inf,performance.now()+3e3);size()}if(e.code=='KeyI')inf=inf>1e9?0:1e12;if(e.code=='KeyH')help^=1;if(e.code=='Escape')help=0;if(e.code=='Comma'||e.code=='Period'){trim=Math.round(trim*100+(e.code=='Comma'?-1:1))/100;try{localStorage.trim=trim}catch(e){}inf=max(inf,performance.now()+3e3)}if(e.code=='KeyK'){const w=RTL(lkm);lkm=(lkm+1)%10;if(w!=RTL(lkm))size();inf=max(inf,performance.now()+3e3);if(POST&&!post)POST(1)}if(e.code=='KeyL')lock^=1;const m=/^Digit(\d)$/.exec(e.code),n=m&&(+m[1]+9)%10+(e.shiftKey?10:0);if(m&&SC[n])next(n)};
v.onended=()=>ui.textContent='click / space to replay\n\nor drop another file';
v.onerror=()=>{v.removeAttribute('src');ui.textContent="can't play this file\n\ndrop another one"};

