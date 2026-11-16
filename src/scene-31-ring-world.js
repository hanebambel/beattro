// The song as a flat ring for the waiting / pause screen: it builds up while the file is analysed. One spoke = one moment, bass inside, treble outside.
const mc=document.createElement('canvas');mc.width=mc.height=512;const m2=mc.getContext('2d');m2.lineWidth=3.6;
const spoke=(c,lv)=>{const a=c/SN*TAU-PI/2;for(let b=0;b<NB;b++){m2.strokeStyle=`hsl(${190+b*6},100%,${lv(b)*65}%)`;m2.beginPath();m2.arc(256,256,140+b*3.1,a,a+.01);m2.stroke()}};
async function analyse(file){
  const g=++sgen;SOK=0;SEC=[];sdu=BPM=MO=0;apr=0;sst='READING THE FILE';setNP();
  m2.clearRect(0,0,512,512);SD.fill(0);songTex();
  try{
    const buf=await file.arrayBuffer();
    if(g!=sgen)return;
    try{setNP(...tags(buf))}catch(e){console.warn('tags',e)} // (before decoding: that takes the buffer away. And on its own: a file with odd tags must still be analysed)
    await new Promise(r=>v.readyState||v.error?r():['loadedmetadata','error'].map(e=>v.addEventListener(e,r,{once:1}))); // need the length
    // ponytail: the whole file is decoded into memory. Long files are decoded at half or a quarter of the sample rate to stay around 600 MB
    // (their map has no top treble); if even that fails, the catch below falls back to the ring written live. Streaming decode if that ever matters.
    let k=0;while(k<2&&v.duration*(44100>>k)*8>6e8)k++;
    if(g!=sgen)return;
    sst='DECODING ...';
    const ab=await new OfflineAudioContext(1,1,44100>>k).decodeAudioData(buf);
    if(g!=sgen)return;
    if(ab.length<4096)throw'too short';
    const d=ab.getChannelData(0),E=new Float32Array(SN*NB);let pk=1e-9;
    for(let c=0;c<SN;c+=48){ // in slices, a frame apart: no hitch, and the ring can be watched growing
      spectro(d,2048>>k,E,c,min(SN,c+48));
      for(let q=c;q<c+48&&q<SN;q+=4){for(let b=0;b<NB;b++)pk=max(pk,E[q*NB+b]);spoke(q,b=>max(0,1+Math.log10(E[q*NB+b]/pk+1e-9)/2.5))}
      apr=c/SN;sst='ANALYSING THE SONG '+(apr*100|0)+' %';
      await new Promise(requestAnimationFrame);
      if(g!=sgen)return;
    }
    songMap(E,1);sect(sdu=ab.duration);
    const tp=tempo(d,44100>>k),up=SEC.find(s=>s[1]>0);
    if(tp[3]>.1){BPM=tp[0];[T0,PAT]=phase(BPM,tp[1],tp[2],up?up[0]/SN*sdu:-1)} // a clear tempo
    MO=BPM?BPM<100?1:BPM<=115?2:BPM>=130?3:0:+(KD.filter(v=>v>=1).length<SN*.15);bag=[];qbag=[]; // slow, or hardly any kick drum: the dark mood. 100 to 115 BPM: disco. From 130 BPM: techno
    m2.clearRect(0,0,512,512);for(let c=0;c<SN;c+=4)spoke(c,b=>SD[(b*SN+c)*4]/255); // once more, now with the final levels
    for(const[c,n]of SEC){const a=c/SN*TAU-PI/2;m2.strokeStyle=n>0?'#fff':'#48f';m2.beginPath();m2.moveTo(256+cos(a)*241,256+sin(a)*241);m2.lineTo(256+cos(a)*255,256+sin(a)*255);m2.stroke()}
    const ps=[...PAT].map(v=>v>.6?'X':v>.3?'x':'.').join(''),pl=[16,32,64].find(l=>ps==ps.slice(0,l).repeat(64/l)); // shown as long as it takes to repeat: 4, 8 or 16 beats
    apr=1;sst=['','DARK MOOD   ','DISCO MOOD   ','TECHNO MOOD   '][MO]+(BPM?BPM.toFixed(1)+' BPM   ':'')+SEC.length+' SECTION CHANGES'+(BPM?'\nKICK '+ps.slice(0,pl):'');
  }catch(e){console.warn('song analysis off:',e)}
  if(g==sgen&&!SOK){apr=-1;sst='WRITTEN LIVE AS IT PLAYS (LOOKING BACK)'}
}
const ringDraw=shader(`uniform sampler2D S;
const float RR=60.,WW=20.,WL=.5;
float H(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}
vec4 sg(float an,float xx,float lod){float y=abs(xx)/WW*30.+.5,f=fract(y);return textureLod(S,vec2(p+an/6.2832,(floor(y)+.5+f*f*(3.-2.*f))/32.),lod);} // smooth steps from band to band
float hf(vec4 c,float an,float xx){
  float bd=abs(xx)/WW;
  return 6.*pow(c.g,1.4)+3.*smoothstep(.86,1.,bd)+.9*B[int(min(bd,1.)*31.)]*exp(-(an*RR-5.)*(an*RR-5.)*.08); // the ground just ahead of the camera dances live
}
float pl(float an){float us=fract(p+an/6.2832);return (1.-smoothstep(p,p+.002,us))*smoothstep(0.,.002,us);} // 1 = this part of the song has been played
vec3 em(vec3 q){ // what a place on the ring looks like from far away
  float an=atan(q.z,-q.y);vec4 c=sg(an,q.x,2.5);
  return pal(h+abs(q.x)/WW*.5)*(c.r*c.r*c.r*1.2+.2*c.g+.02)*mix(.45,1.4,pl(an))+c.b*.2;
}
vec3 sky(vec3 v){
  vec2 s=vec2(atan(v.x,v.z),v.y)*90.,ci=floor(s);
  return step(.9,H(ci))*smoothstep(.3,0.,length(fract(s)-.5-(vec2(H(ci+1.),H(ci+2.))-.5)*.5))*vec3(.8,.9,1)*H(ci+5.)+pal(h+.6+v.y*.2)*.025;
}
void main(){
  UV;u*=R(ro);
  vec3 a=vec3(sin(t*.17)*7.,abs(m)-RR,0.),v=normalize(vec3(u.x,u.y,.95*z)),q,col;vec4 c;
  v.yz*=R(-.3-.22*sin(t*.11));v.xz*=R(sin(t*.13)*.3);v.z*=sign(m); // looks up the ring now and then; m<0: look back
  float s=H(gl_FragCoord.xy)*.02,d=1.,g=0.,hit=0.,an,ds,rho;
  for(int i=0;i<120;i++){
    q=a+v*s;if(abs(q.x)>WW)break;
    rho=length(q.yz);an=atan(q.z,-q.y);ds=.06+.04*s;
    c=sg(an,q.x,log2(ds*8.));
    d=RR-rho-max(hf(c,an,q.x),WL);
    if(d<.003*s){hit=1.;break;}
    ds=min(max(d*.6,.01),ds);
    g+=c.b*exp(-d*1.6-s*.05)*ds; // every kick of the song stands on the ring as a low curtain of light
    s+=ds;
  }
  vec3 hz=pal(h+.62)*.09*(1.+l);
  if(hit>.5){
    vec3 up=vec3(0,-q.yz)/rho,tn=vec3(0,q.z,-q.y)/rho;
    float lf=max(0.,log2(s*.03)),bd=abs(q.x)/WW,e=.1+.012*s,fd=smoothstep(80.,20.,s),P=pl(an);
    c=sg(an,q.x,lf);float hh=hf(c,an,q.x),lv=c.r*c.r*c.r,kl=sg(an,q.x,min(lf,1.)).b;
    vec3 bc=pal(h+bd*.5);
    if(hh<WL){ // lake: mirrors the far side of the song
      vec3 n=normalize(up+.02*sin(q.x*9.+t*2.)*vec3(1,0,0)+.02*sin(an*RR*7.-t*3.)*tn),rf=reflect(v,n);
      float A=dot(rf.yz,rf.yz)+1e-5,Bq=dot(q.yz,rf.yz),ta=(-Bq+sqrt(max(Bq*Bq-A*(dot(q.yz,q.yz)-(RR-2.)*(RR-2.)),0.)))/A;
      vec3 q2=q+rf*ta;float fr=.4+.6*pow(1.-max(dot(-v,n),0.),4.);
      col=vec3(0,.015,.04)+hz*.5+(abs(q2.x)<WW?em(q2)*1.6:sky(rf)*.6)*fr+bc*.35*smoothstep(.3,0.,WL-hh)+kl*bc*.4;
    }else{
      float hx=hf(sg(an,q.x+e,lf+1.),an,q.x+e)-hf(sg(an,q.x-e,lf+1.),an,q.x-e),ht=hf(sg(an+e/RR,q.x,lf+1.),an+e/RR,q.x)-hf(sg(an-e/RR,q.x,lf+1.),an-e/RR,q.x);
      vec3 n=normalize(up*2.*e-vec3(hx,0,0)-tn*ht);
      float f1=hh*1.2,f2=bd*15.,w1=fwidth(f1),w2=fwidth(f2); // contour lines and lane lines, one pixel wide, fading out where they would crowd
      float cl=(1.-smoothstep(w1*.6,w1*1.6,abs(fract(f1+.5)-.5)))*smoothstep(.45,.15,w1),gx=(1.-smoothstep(w2*.6,w2*1.6,abs(fract(f2+.5)-.5)))*smoothstep(.45,.15,w2);
      col=bc*(.03+.22*max(dot(n,normalize(up-tn*.7)),0.))*(.25+c.g) // lit from ahead
        +bc*lv*.45*mix(.5,1.6,P) // the song's loudness, painted on; brighter once played
        +mix(bc,vec3(1),.4)*max(cl,gx*.7)*(.35+1.5*lv)
        +pow(1.+dot(v,n),3.)*pal(h+.5)*.25
        +(bc*.6+.5)*kl*fd*1.3*smoothstep(.9,.86,bd) // a line of light across the ring at every kick
        +pal(h+.1)*2.*smoothstep(.02,0.,abs(bd-.9)); // rim lights
    }
    float tau=-log(max(k,.002))/6.;
    col+=pal(h+.5)*exp(-abs(abs(an)*RR-tau*40.)*.7)*sqrt(k)*.6; // the kick you just passed runs away around the ring
    col=mix(hz,col,exp(-s*.012));
  }else col=sky(v);
  float tc=-dot(a,v);vec3 cp=a+v*tc;
  if(tc>0.&&(hit<.5||tc<s))col+=(vec3(1,.9,.7)*.15+pal(h+.1)*.25*(.5+2.*k+l))/(dot(cp,cp)*.5+.12); // the little sun on the axis
  col+=g*(pal(h+.15)*.6+.3)*(.5+.6*k);
  o=vec4(1.-exp(-col*2.),1);
}`,GLPX,1);
if(ringDraw){
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.activeTexture(gl.TEXTURE0);
  { // until a file is loaded: an invented song (intro, build, main part, break, finale) at 120 BPM
    const E=new Float32Array(SN*NB);
    for(let c=0;c<SN;c++){
      const u=c/SN,bt=u*600%1,lv=u<.08?.25:u<.2?.25+(u-.08)*5:u<.45?1:u<.55?.15:u<.92?1:.3;
      for(let b=0;b<NB;b++)E[c*NB+b]=min(1,lv*((b<5?Math.exp(-bt*7):0)+(b>23?Math.exp(-((bt+.5)%1)*9)*.7:0)+(b>4&&b<24?.5+.4*sin(u*80+b*.7)*sin(u*31+b):0)*(.6+.4*Math.exp(-(u*1200%1)*3)))+.02);
    }
    songMap(E);
  }
  RING=SC.push(()=>{
    const du=dur(),P=tt/du%1,c0=P*SN|0,bx=(abs(sin(t*.17)*7)/20*.94+.015)*NB|0;let mx=0;
    if(!SOK&&an&&!v.paused){ // no analysis: write the ring while the song plays
      for(let b=0;b<NB;b++){const i=(b*SN+c0)*4,j=(b*SN+(c0+SN-1)%SN)*4;SD[i]=B[b]*255;SD[i+1]=c0==lc?SD[i+1]:SD[j+1]*.85+B[b]*255*min(1,lvl)*.15;SD[i+2]=kick>.8?255:0;SD[i+3]=255}
      lc=c0;
      songTex();
    }
    // fly above the highest ground just ahead
    for(let dc=-8;dc<40;dc++)for(let b=max(0,bx-2);b<min(NB,bx+3);b++)mx=max(mx,SD[(b*SN+(c0+dc+SN)%SN)*4+1]);
    mx=max(.5,6*(mx/255)**1.4)+2;calt=max(mx-1,calt?calt+(mx-calt)*min(1,dt*2.5):mx); // eases, but never closer than 1 above the ground
    gm=SOK?calt:-calt;gp=P;ringDraw();
    const ms=s=>(s/60|0)+':'+('0'+(s%60|0)).slice(-2);
    x.font=`bold ${H*.03}px monospace`;x.fillStyle='#fff';x.fillText(`RING WORLD / ONCE AROUND = THE WHOLE SONG   ${ms(P*du)} / ${ms(du)}`,W*.03,H*.07);if(!SOK)x.fillText(sst,W*.03,H*.115);
  })-1;
  const sq=/map=([^&#]+)/.exec(location.search); // test hook: ?map=file loads a ready-made song map (raw bytes; scratch tool: node test.mjs track.f32 map.bin)
  if(sq){const q=new XMLHttpRequest;q.open('GET',sq[1],false);q.overrideMimeType('text/plain;charset=x-user-defined');q.send();for(let i=0;i<SD.length;i++)SD[i]=q.responseText.charCodeAt(i);songTex();sect(sdu=dur());BPM=120;for(let i=0;i<64;i+=4)PAT[i]=1} // synchronous on purpose: headless screenshots don't wait
}
