// Two shuffle bags, so nothing comes twice before everything has had its turn: one with all scenes, one with the scenes for the parts without a beat
// (the same list as the dark mood). Section changes pick from the bags too. A scene that is shown is taken out of both.
const shuf=a=>{for(let i=a.length;i>1;){const j=Math.random()*i--|0;[a[i],a[j]]=[a[j],a[i]]}return a}; // (a fair shuffle; sorting by random numbers is not)
const pick=calm=>{
  const fill=a=>{shuf(a);if(a.at(-1)==cur)a.reverse();return a}; // a new bag holds every scene (the one on screen too, just not as the first to come out)
  if(!bag.length)bag=fill(SC.map((_,i)=>i).filter(i=>tc?TECHNO.includes(i)||i==RACE||i==BIKES||i==FLY:dc?DISCO.includes(i)||i==FLOOR:dk<.5||DARK.includes(i)));
  if(!qbag.length)qbag=fill((tc?TQ:dc?DQ:DARK).filter(i=>SC[i]));
  return calm?qbag.at(-1):calm===0?bag.findLast(i=>!CALM.includes(i)&&i!=RACE)??bag.at(-1):bag.at(-1); // calm: 1 = a calm one, 0 = a wild one, undefined = whatever is next
};
function next(n){
  prev=cur;cur=n??pick(quiet?1:undefined);
  bag=bag.filter(i=>i!=cur);qbag=qbag.filter(i=>i!=cur);sw=tt;sb=beats;scn++;
  // how long the new scene stays: 8 or 16 beats, and the faster the song, the more often 8 (at 90 BPM in 25 % of the cases, at 150 BPM in 60 %).
  // Only the scenes with more to see stay longer: ring world, glow forest, the title, the light bikes and the dive 32 beats, the race, the jump & run and the attack run 48. The dark mood takes its time: 16 or 32 beats, 64 for those three.
  // The transition into it takes a bar (four in the dark mood, but no more than 10 s), at most half of the scene that is leaving. nx = the beat on which the next scene takes over.
  const tb=min(dk>.5?16:4,sl/2),fa=BPM?min(1,max(0,(BPM-90)/60)):.5,rn=Math.random(),big=cur==RACE||cur==JUMP||cur==FLY||cur==DIVE||cur==RING||cur==WOOD||cur==TITLE||cur==BIKES;tl=min(dk>.5?10:6,BPM?tb*60/BPM:2+4*dk);
  sl=dk>.5?big?64:rn<.5?16:32:cur==RACE||cur==JUMP||cur==FLY?48:big?32:rn<.25+.35*fa?8:16;
  if(abs(bp-nx)>4)nx=ceil(bp/4)*4;nx+=sl;
  pl=look;alk=tc?[0,0,1,2,2][Math.random()*5|0]:dc?[0,0,0,3,4,4][Math.random()*6|0]:[0,0,0,0,0,1,2,2,3,4][Math.random()*10|0]; // and its look, when looks change with the scenes: mostly normal, sometimes solid, neon, psychedelic or the HDR style (disco: no solid, no neon; techno: only normal, solid and neon). Code rain is a transition now and a look only on K
  tk=TR?(quiet||dk>.5?[4,5,6][Math.random()*3|0]:[0,1,2,3,5,5,6,6][Math.random()*8|0]):Math.random()*6|0;if(tk==6&&lkm==5)tk=4; // (no code rain over the code rain look)
  ta=Math.random()*TAU;if(TR){x.copy(MAIN,OLD);if(tk==5){x.save();x.use(NEW);x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.fillStyle='#000';x.fillRect(0,0,W,H);x.use(MAIN);x.restore()}}if(cur==RACE)rt=0; // the old scene moves to its own render target (half size: it only shows on shrinking tiles)
}
const show=(i,a,s)=>{x.save();x.scale(ts=s,s);x.globalAlpha=a;SC[i]();x.restore()};

// Techno strobes: a lamp above the picture fires on the beat, but only in runs: through the last bar of every four, and for two bars after the song steps up
// (there it replaces the white flash of the other moods). Each flash comes from the next of four lamps. Never more than three a second (mkStrobe),
// none for people who asked their system for reduced motion, none before the fog is in. b: the beat number. (The limiter runs on the wall clock, not the song's.)
const flash=b=>{if(tca>.8&&(b%16>=12||bp>=sbu&&bp-sbu<8)&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&strobe(last/1e3,1)){stb=1;sbx=[.2,.8,.4,.6][sbn++&3]}};
function frame(now){
  requestAnimationFrame(frame);
  const pf0=performance.now();fa+=(now-last)/1e3;fn++;fw=max(fw,now-last);
  if(fa>=1){ // once a second: frame rate, and in the 60 fps mode the resolution step
    fps=fn/fa;fa=fn=0;wst=fw;fw=0;
    if(!qm&&!document.hidden&&fps>5){
      if(fps<55){if(now-lup<3e3){bad=lv;bt=now}if(++slow>1&&lv<QL.length-1){lv++;size()}good=0} // two slow seconds in a row: one hitch (a shader compiling) is not a reason
      else slow=0;
      if(fps>58.5&&++good>=5&&lv&&!(lv-1==bad&&now-bt<3e4)){lv--;lup=now;good=0;size()}
    }
    if(inf>1e9&&/bench/.test(location.search))console.log(`BENCH${XDR&&XDR.on?' HDR':''} ${fps.toFixed(1)} fps ${W}x${H} lv${lv} s${cur+1} worst ${wst.toFixed(0)} ms js ${(jsa/max(1,jsn)).toFixed(2)} ms${t-sw<tl?' TR'+tk:''}`);jsa=jsn=0; // test hook ?bench: read by the scratch benchmark
  }
  dt=min(.1,(now-last)/1e3);last=now;stb*=Math.exp(-dt*14); // (a strobe flash is over in a tenth of a second)
  document.body.classList.toggle('p',FAKE||!v.paused&&!v.ended);
  // clock: own smooth clock, snapped to the media time so pause/seek stay in sync; free-running before a file plays
  live=!an||!v.paused;
  if(live)tt+=dt;
  if(an){ // locked to the media clock: jumps (seek, a long hitch) are taken at once, small differences are pulled in within a fraction of a second
    // (before, up to 150 ms were tolerated for good, e.g. after one long frame). The target is shifted by what the sound needs to reach the ears
    // (the audio output's latency: little on speakers, a lot on Bluetooth) minus what the picture needs to reach the screen (about two frames), plus the trim.
    lat=(ac.outputLatency||0)+(ac.baseLatency||0);
    const er=v.currentTime-lat+.03-trim-tt;tt=abs(er)>.2?tt+er:tt+er*min(1,dt*6);
  }
  t=tt;

  // audio -> e (bass energy), B (32 spectrum bands, each 0..1 relative to its own recent peak), wv (waveform)
  let e=0,hi=0,sb3=0,i;
  if(FAKE){ // index.html?fake : synthetic 120 BPM for testing without a file; the normal idle screen stays calm
    e=Math.exp(-(t%.5)*8)*.6;
    for(i=0;i<NB;i++)BV[i]=(.5+.5*sin(t*1.7+i*.6))*e*1.5;
    for(i=0;i<1024;i++)wv[i]=sin(i*.05+t*6)*e*.6;
    sb3=e;
  }else if(an&&!v.paused){
    // dB -> linear amplitude, normalised by slowly decaying peaks so loud masters don't clip and quiet ones still move
    an.getFloatFrequencyData(fd);an.getFloatTimeDomainData(wv);
    an2.getFloatTimeDomainData(w2); // loudness (RMS) of the last 21 ms of the low-passed signal, relative to its recent peak
    for(i=0;i<1024;i++)e+=w2[i]*w2[i];e=Math.sqrt(e/1024);sb3=e/=pk=max(pk*.9995,e,1e-3);
    for(let b=0;b<NB;b++){
      let s=0;for(i=ED[b];i<ED[b+1];i++)s+=10**(fd[i]/20);s/=ED[b+1]-ED[b];
      BV[b]=s/(PB[b]=max(PB[b]*.9995,s,1e-4));
    }
  }else BV.fill(0);
  // bass follows fast (punch), mids and treble ever slower: hi-hats would otherwise make every treble band jump several times a second (measured on a real track)
  for(i=0;i<NB;i++){const sl=min(1,i/20);B[i]+=(BV[i]-B[i])*(BV[i]>B[i]?.5-.38*sl:.15-.11*sl);if(i>19)hi+=B[i]/12}
  // The analysed song knows what the running peaks above can't: whether this part has a kick drum at all, and how loud it is compared to the rest.
  // Parts without one (piano intro, hi-hats only, breaks) stay still: no flash, no zoom pulse, no shake, no beat counting; and they move less.
  const col=min(SN-1,max(0,t/dur()*SN|0)),known=sdu&&(an||FAKE),eg=known?.35+.65*SL[col]:1;
  quiet=known&&KD[col]<1; // fewer than one kick per second
  const bh=live&&beat(e,t),grid=known&&BPM>0;
  bp=grid?(t-T0)*BPM/60:0; // position in beats; bp/4 = bars
  if(grid){ // the analysed tempo and kick pattern drive the pulses: every kick of the pattern, exactly on its sixteenth, none missed, none extra
    const st=floor(bp*4);
    if(live&&st!=lst){
      if(st==lst+1&&!quiet&&PAT[st&63]>.3)kick=max(kick,PAT[st&63]); // softer kicks pulse softer
      if(st%4==0){beats=st/4;if(st==lst+1&&beats%16==0)hue+=67;if(st==lst+1&&!quiet)flash(beats)} // colours change every 4 bars, on the bar line
      lst=st;
    }
  }else if(bh&&!quiet){ // no tempo known: count the detected beats
    kick=1;
    if(++beats%16==0)hue+=67;flash(beats);
  }
  // camera: every scene gets the same flowing arc over its 8 bars (16 s without a tempo), no jumps anywhere: push in over the first half, sway like a
  // pendulum, pump with the kick pattern in the third quarter, pull back out in the last, and (every other scene) one full roll into the transition.
  // Every third scene the picture also fades into a mirror image of itself in the middle. Parts without a beat only get the slow push and pull.
  const sm=(a,b,v)=>{v=min(1,max(0,(v-a)/(b-a)));return v*v*(3-2*v)},u=((grid?(bp-sb)/sl:(t-sw)/(sl/2))%1+1)%1,wild=quiet||dk>.5?0:1;
  let cz=1+.45*sm(0,.5,u)-.45*sm(.75,1,u)+.1*kick*sm(.5,.55,u)*sm(.75,.7,u)*wild,cr=sin(u*TAU*4)*.12*sm(.2,.35,u)*sm(.8,.65,u)+(scn&1&&sl>15?sm(.875,1,u)*TAU*wild:0)+dk*sin(ft*.23)*.15+dca*sin(bp*PI/2)*.04*wild; // the dark mood drifts instead
  ma+=((scn%3==1&&u>.4&&u<.8?1:0)-ma)*min(1,dt*1.5);
  // mood: slow songs (under ~100 BPM) and songs without a kick drum switch to the dark mood: steel-blue film look, vignette, grain, drifting haze, black bars,
  // no scroller, no shake, softer and longer pulses, scenes twice as long, only the brooding scenes. Songs from 100 to 115 BPM get the disco mood: the party pace, but only
  // the scenes that fit, a slow sway on every bar, and the picture through a seventies lens (post.js): mirror ball, its spots of light, star filter, warm colours. From 130 BPM: techno. Cold colours, the hard scenes,
  // fog drifting through the picture and strobe lamps above it that fire in short runs (flash()). M cycles auto / party / dark / disco / techno.
  const md=mo?mo-1:MO;dk=+(md==1);dc=+(md==2);dca+=(dc-dca)*min(1,dt*(dc?.6:2.2));tc=+(md==3);tca+=(tc-tca)*min(1,dt*(tc?.6:2.2));look=lkm>8?alk:lkm;if(lkm<9)pl=look; // (a mood builds up over a few seconds but clears out in one: the mirror ball used to hang around for four seconds after M)
  const fl=dk?'grayscale(.85) sepia(.3) hue-rotate(170deg) contrast(1.25) brightness(.9)':'none';if(fl!=cfl)view.style.filter=cfl=fl;
  // a kick shakes the whole screen (CSS transform on the canvas); the base zoom hides the edges
  // only a big sudden jump of the low-passed level triggers it, harder kicks shake more; then it dies away slowly
  if(live&&subBeat(sb3,t)&&!quiet){if(t-lk>2||t<lk)sq=4;lk=t;if(sq>0&&sq--)sub=max(sub,min(1,sb3))} // only the first 4 kicks after a pause of 2 s or more
  sub*=Math.exp(-dt*2.5);
  const sk=sub*SHAKE*(1-dk);
  view.style.transform=`translate(${(Math.random()-.5)*sk}vmin,${(Math.random()-.5)*sk}vmin) scale(${1.03+sub*.03})`;
  lvl+=(e*eg-lvl)*(e>lvl?.6:.1);kick*=Math.exp(-dt*(6-3.5*dk));
  hist[fi=fi+1&63]=min(1.5,lvl+kick*.5); // history lets the bass pulse travel down the tunnel

  // sequencer: new scene every 8 bars (32 beats), at least 10 s and at most 24 s apart
  if(t<sw)sw=t;
  // sections: the analysed song knows where the beat comes in or drops out (SEC). Shortly before such a point it is armed and then fired
  // on the next audible beat, so the cut sits on the kick: fast cut to a wild scene (more) or a calm one (the beat drops out); a big "more" also flashes and shakes,
  // and because the future is known, the picture dims during the 2 s before it.
  const cps=SN/dur(),sc=t*cps,SE=an||FAKE?SEC:[];let pre=arm&&arm[1]>.6?1:0; // not before the song plays: the waiting screen stays calm
  for(const s of SE){
    if(psc<s[0]-.3*cps&&sc>=s[0]-.3*cps&&sc-psc<cps)arm=[t,s[1],s[2]];
    if(s[1]>.6&&s[0]>sc)pre=max(pre,1-(s[0]-sc)/cps/2);
  }
  psc=sc;
  if(arm&&(t<arm[0]||t-arm[0]>(arm[1]<0?.3:.6)||arm[1]>0&&bh&&t-arm[0]>.1)){
    const up=arm[1]>0,a=min(1,abs(arm[1]));
    if(up&&t>=arm[0]){bang=a;hue+=67;sbu=bp;flash(12);if(a>.6)sub=max(sub,a)}
    if(!lock&&cur!=RACE&&t>=arm[0]){next(pick(up?0:arm[2]>.25?undefined:1));tl=dk>.5?4:.9} // more: a wild scene; the beat drops out: a calm one; quieter but the beat goes on: any // the race always runs its full 24 s
    arm=0;
  }
  bang*=Math.exp(-dt*4);view.style.opacity=1-pre*pre*.75;
  const soon=SE.some(s=>s[0]>sc&&s[0]<sc+3*cps); // a section change is coming: let it do the switching
  // with a tempo: a new scene every 8 or 16 beats, the big ones longer (see next()). The transition starts half its length early, so its turning point (the wall has become the shape and bursts) is on the beat
  if(!lock&&!soon&&t-sw>1&&((grid&&!quiet?bp>=nx-min(dk>.5?16:4,sl/2)/2:cur!=RACE&&beats-sb>=sl)||t-sw>(grid&&!quiet?60:24)*(1+dk)))next();
  const p=min(1,(t-sw)/tl),q=p*p*(3-2*p);lf=p<1&&prev>=0?q:1; // lf: how far the look has faded over from the old scene's to the new one's
  QS=qm?1e9:QL[lv]*(p<1&&prev>=0?.5:1); // pixel budget of the shader scenes; halved while two scenes run at once in a transition

  // flow: the scenes don't run on the wall clock but on one that speeds up and slows down with the slow swell of the music (es: the level over the
  // last ~2 s, relative to the whole song). So everything streams along with the song without snapping to beats; slower and heavier in the dark mood.
  es+=(min(1,B.reduce((a,b)=>a+b)/NB*eg*2.5)-es)*min(1,dt*.7);if(live)ft+=dt*(dk?.16+.5*es:.5+1.1*es); // (the dark mood runs everything at a third of the pace: slow motion)
  const tr=t;t=ft;
  const zf=floor(t*SP)+NR;if(row>zf||row<zf-64)row=zf-1; // spectrum history per terrain row
  while(row<zf)SH.set(B,(++row&63)*NB);
  // fade instead of clear = glow trails; everything else is additive
  x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';
  if(cub&&!(p<1&&prev>=0)){x.copy(NEW,MAIN);cub=0} // the cube has landed: the new scene moves from its own target to the frame, trails and all
  x.fillStyle='rgba(0,0,10,.4)';x.fillRect(0,0,W,H);
  x.globalCompositeOperation='lighter';
  x.fillStyle=hs(hue,(kick*.07+bang*.5*(1-tca))*(1-.7*dk),50+bang*40*(1-tca));x.fillRect(0,0,W,H);
  roll=sin(t*.4)*.15+cr;x.translate(W/2,H/2);x.rotate(roll);
  R=min(W,H)/2;F=R*1.6*(1+kick*.04);

  // stars (sky only over the mountains)
  x.fillStyle='#cdf';
  for(i=0;i<NS*3;i+=3){
    const z=((S[i+2]-t*4)%30+30)%30+.1,s=(1-z/30)*2*D+hi*3*D;let Y=S[i+1]/z*F;
    if(cur==1&&q>.5)Y=-abs(Y);
    x.fillRect(S[i]/z*F,Y,s,s);
  }

    if(p<1&&prev>=0&&TR){ // 3D: the old scene keeps running in its own render target (with its own trails) and is the picture on the tiles in front of the new one
      const pre=()=>{x.globalAlpha=1;x.globalCompositeOperation='source-over';x.fillStyle='rgba(0,0,10,.4)';x.fillRect(0,0,W,H);x.globalCompositeOperation='lighter';x.translate(W/2,H/2);x.rotate(roll)};
      const LK=look;x.save();x.use(OLD);XS=.5;x.setTransform(XS,0,0,XS,0,0);pre();look=pl;show(prev,1,cz);look=LK;XS=1; // (solid is drawn by the scenes themselves, so the old scene keeps its own look)
      if(tk==5){ // cube: the new scene, too, runs in a target of its own (full size, it ends up filling the screen) and both are faces of the cube
        x.use(NEW);x.setTransform(1,0,0,1,0,0);pre();show(cur,1,cz);x.use(MAIN);x.restore();
        TR.cube(q,scn&1?1:-1);cub=1;
      }else{x.use(MAIN);x.restore();show(cur,1,cz);tk==6?TR.rain(p):TR.draw(p,tk)}
    }
  else if(p<1&&prev>=0){
    // six wipes, picked at random: the new scene is drawn inside a growing shape, the old one outside it, and the edge glows
    const s=hypot(W,H),A=new Path2D,O=new Path2D,n=10,c=s/n;
    if(tk==0)A.arc(0,0,q*s*.51,0,TAU); // iris
    else if(tk==1)for(let i=0;i<n;i++)A.rect(-s,-s/2+i*c,2*s,q*c); // blinds
    else if(tk==2){const dx=cos(ta),dy=sin(ta),e=(q-.5)*s;A.moveTo(-s*dx+s*dy,-s*dy-s*dx);A.lineTo(e*dx+s*dy,e*dy-s*dx);A.lineTo(e*dx-s*dy,e*dy+s*dx);A.lineTo(-s*dx-s*dy,-s*dy+s*dx);A.closePath()} // straight wipe at a random angle
    else if(tk==3)for(let i=0;i<NB;i++){const h=s*min(1,max(0,q*1.3-.3+.5*B[i]*(1-q)));A.rect(-s/2+i*s/NB,s/2-h,s/NB+1,h)} // a curtain of spectrum bars rising
    else if(tk==4)for(let i=0;i<n;i++)for(let j=0;j<n;j++){const f=c*min(1,max(0,q*2-(i+j)/n/2));A.rect(-s/2+(i+.5)*c-f/2,-s/2+(j+.5)*c-f/2,f,f)} // tiles growing along the diagonal
    else{A.moveTo(0,0);A.arc(0,0,s,ta,ta+q*TAU);A.closePath()} // clock hand
    O.rect(-s,-s,2*s,2*s);O.addPath(A);
    x.save();x.clip(O,'evenodd');show(prev,1,1);x.restore();
    x.save();x.clip(A);show(cur,1,cz);x.restore();
    x.strokeStyle=hs(hue,1-q,80);x.lineWidth=3*D;x.stroke(A);
  }else show(cur,1,cz);
  if(ma>.01&&cur!=RACE&&cur!=RING&&cur!=23){ // (not the race and the ring world: they carry text; not the black hole: it looks wrong doubled) // mirror: the left half fades in again on the right, every other time also the top at the bottom
    const mi=1+(scn%6==1),src=()=>{if(!GX)return c;const S=x.lo(W,H);x.copy(MAIN,S);return S}; // WebGL: a copy of the frame as it is now
    x.save();x.globalAlpha=ma;x.globalCompositeOperation='source-over';x.setTransform(-1,0,0,1,W,0);x.drawImage(src(),0,0,W/2,H,0,0,W/2,H);
    if(mi>1){x.setTransform(1,0,0,-1,0,H);x.drawImage(src(),0,0,W,H/2,0,0,W,H/2)}
    x.restore();
  }

  // sine scroller (not in the dark mood)
  x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;da+=(dk-da)*min(1,dt);
  const fz=H*.06,cw=fz*.62,off=t*fz*4%(MSG.length*cw);
  x.font=`bold ${fz}px monospace`;
  for(let px=-(off%cw),n=floor(off/cw);px<W;px+=cw,n++){
    x.fillStyle=hs(hue+n*9,1-da);
    x.fillText(MSG[n%MSG.length],px,H*.9+sin(t*3+n*.35)*H*.035*(1+lvl));
  }
  if(da>.01){ // dark mood, on top of everything: two layers of haze drifting against each other, darkened corners, film grain, cinema bars
    x.globalCompositeOperation='lighter';x.globalAlpha=da*.1;
    for(let i=0;i<2;i++){const o=(t*(i?13:-9)%W+W)%W;x.drawImage(HZ,o-W,0,W,H);x.drawImage(HZ,o,0,W,H)}
    x.globalCompositeOperation='source-over';x.globalAlpha=da;
    if(!GX){ // (with WebGL the post pass darkens the corners and adds the grain)
      const g=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,hypot(W,H)*.55);g.addColorStop(0,'#0000');g.addColorStop(1,'#000d');x.fillStyle=g;x.fillRect(0,0,W,H);
      x.globalAlpha=da*.09;x.globalCompositeOperation='overlay';x.fillStyle=GRP??=x.createPattern(GR,'repeat');
      const gx=Math.random()*128|0,gy=Math.random()*128|0;x.translate(gx,gy);x.fillRect(-gx,-gy,W,H);x.setTransform(1,0,0,1,0,0);
    }
    x.globalCompositeOperation='source-over';x.globalAlpha=1;x.fillStyle='#000';x.fillRect(0,0,W,H*.1*da);x.fillRect(0,H*(1-.1*da),W,H*.1*da);
  }
  x.globalCompositeOperation='lighter';
  t=tr;
  // the song as a ring while it is analysed, and on the waiting / pause screen (white ticks: it gets bigger there, blue: smaller; line: where you are)
  if(apr>=0&&(apr<1||!an||v.paused)){
    const r=min(W,H)*.46,ri=r*.53,a=tt/dur()*TAU-PI/2,on=an&&!v.paused;
    x.save();x.translate(W/2,H/2);x.globalAlpha=on?.5:1;x.drawImage(mc,-r,-r,2*r,2*r);
    x.strokeStyle='#fff';x.lineWidth=r*.012;x.beginPath();
    if(apr<1)x.arc(0,0,ri,apr?-PI/2:t*4,apr?apr*TAU-PI/2:t*4+1.2); // decoding: a spinner; analysing: the progress
    else{x.moveTo(cos(a)*ri,sin(a)*ri);x.lineTo(cos(a)*r,sin(a)*r)}
    x.stroke();
    x.font=`bold ${r*.07}px monospace`;x.textAlign='center';x.fillStyle='#fff';sst.split('\n').map((l,i)=>x.fillText(l,0,(on?0:r*.36)+i*r*.1,r*1.9));
    x.restore();
  }
  if(GX&&da>.01){ // dark mood: motion blur. Three quarters of every picture is the one before it, so whatever moves draws a soft streak behind it.
    x.save();x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=.74*da;x.drawImage(HIS,0,0,W,H);x.restore();x.copy(MAIN,HIS);
  }
  if(GX&&wu<SC.length+4){ // warm-up, one item per frame right after loading: every scene and the three transition programs are drawn once, tiny and out of sight.
    // The graphics driver only really builds a shader when it is first used, which used to cost a hitch of up to half a second the first time a scene came up.
    const q0=QS;QS=1e-3;x.save();x.use(OLD);XS=.5;x.setTransform(.5,0,0,.5,0,0);x.globalAlpha=1;x.translate(W/2,H/2);
    try{if(wu<SC.length)SC[wu]();else if(wu==SC.length)race3d&&race3d(3,1);else if(TR)wu>SC.length+2?TR.rain(1):wu>SC.length+1?TR.cube(.5,1,1):TR.draw(1,0)}catch(e){console.warn('warm-up',wu,e)}
    XS=1;QS=q0;x.use(MAIN);x.restore();wu++;
  }
  if(POST)POST.draw();
  if(GX)x.use(SCR); // the two overlays go straight onto the screen, after the post pass: no look, glow or grain touches them
  if(now<inf){ // frame rate, resolution, quality mode
    x.save();x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.font=`bold ${H*.025}px monospace`;x.textAlign='right';
    const s=`${fps.toFixed(0)} FPS   SLOWEST FRAME ${wst.toFixed(0)} MS   ${W} x ${H}   ${qm?RN[qm-1]+' FIXED':'STEADY 60: '+(QL[lv]*100|0)+' % OF THE PIXELS'}   LOOK: ${LOOKS()[look]}   SYNC: AUDIO OUT ${lat*1e3|0} MS, TRIM ${trim*1e3|0} MS`;
    const tw=min(W*.96,x.measureText(s).width);x.fillStyle='#000a';x.fillRect(W*.985-tw-H*.02,H*.03,tw+H*.04,H*.045);x.fillStyle='#fff';x.fillText(s,W*.985,H*.062,W*.96);x.restore();
  }
  if(help){ // H: every key and what it is set to right now
    const o=(a,i)=>a.map((v,j)=>j==i?'['+v+']':v).join('  '),Lk=LOOKS(),L=[['SPACE','PLAY / PAUSE'],['O','OPEN A FILE (OR DROP ONE ON THE PAGE)'],['F','FULLSCREEN'],
      ['N','NEXT SCENE (RANDOM)'],['ARROWS','NEXT / PREVIOUS SCENE IN ORDER     NOW: '+(cur+1)+' OF '+SC.length],['L','HOLD THE SCENE     '+o(['OFF','ON'],lock)],
      ['1-9, 0','SCENES 1 TO 10     WITH SHIFT: 11 TO 20'],['R W G D','RACE, RING WORLD, GLOW FOREST, DANCE'],['T B J S U C','TITLE, LIGHT BIKES, JUMP AND RUN, ATTACK RUN, THE DIVE, DANCE FLOOR'],
      ['M','MOOD     '+o(['AUTO ('+['PARTY','DARK','DISCO','TECHNO'][MO]+')','PARTY','DARK','DISCO','TECHNO'],mo)],['K','LOOK     '+o(['WITH THE SCENES ('+Lk[look]+')'],lkm>8?0:-1)+'  '+o(Lk,lkm>8?-1:lkm)],
      ['Q','RESOLUTION     '+o(['STEADY 60 FPS',...RN],qm)],['P','GLOW AND LENS     '+o(['OFF','ON'],+!!post)],['I','FRAME RATE DISPLAY     '+o(['OFF','ON'],+(inf>1e9))],
      [', AND .','PICTURE EARLIER / LATER     NOW: '+(trim*1e3|0)+' MS'],['H / ESC','THIS LIST']],
      fz=min(H*.027,W*.0125),lh=fz*1.55,pw=min(W*.96,fz*78),ph=lh*(L.length+1.6),px=(W-pw)/2,py=(H-ph)/2;
    x.save();x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.fillStyle='#000d';x.fillRect(px,py,pw,ph);x.font=`bold ${fz}px monospace`;
    L.forEach(([k,d],i)=>{x.fillStyle=hs(hue+i*14,1,72);x.fillText(k,px+fz*1.5,py+lh*(i+1.4));x.fillStyle='#fff';x.fillText(d,px+fz*10,py+lh*(i+1.4),pw-fz*11.5)});
    x.restore();
  }
  if(GX){x.flush();x.use(MAIN)}
  if(XDR){const on=+(post&&look==4);if(on!=XDR.on)XDR.show(on);if(on)XDR.draw()} // real HDR: the finished frame goes on to the WebGPU canvas
  jsa+=performance.now()-pf0;jsn++; // time the script itself needs per frame (shown by the ?bench hook)
}
if(!SC[cur])cur=0; // #N beyond the last scene
requestAnimationFrame(frame);
