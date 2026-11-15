// ---- assets, all generated at load ----
const mkc=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const buf=(w,h)=>{const c=mkc(w,h),g=c.getContext('2d'),d=g.createImageData(w,h);return{p:new Uint32Array(d.data.buffer),put(){g.putImageData(d,0,0);return c}}}; // low-res pixel buffer
const rgb=(r,g,b)=>0xff000000|b<<16|g<<8|r;
const clamp=v=>max(0,min(255,v));
// fire: heat buffer + palette black > red > yellow > white
const FB=buf(128,72),FH=new Uint8Array(128*74),FP=Uint32Array.from({length:256},(_,i)=>rgb(clamp(i*3),clamp(i*3-180),clamp(i*4-700)));
// voxel landscape: tileable fractal height map (5 octaves of value noise) + a pre-lit colour map
let NZ,GRP,da=0;const HZ=mkc(256,256),GR=mkc(128,128),HM=new Uint8Array(262144),CM=new Uint32Array(262144),VB=buf(320,180),VX=buf(640,360);let vh=160;
{
  const hm=new Float32Array(262144); // 512 x 512: twice as fine as it used to be, with one more octave of detail
  for(let f=4,a=1;f<=128;f*=2,a*=.5){
    const g=Float32Array.from({length:f*f},Math.random),c=512/f;
    for(let y=0;y<512;y++)for(let X=0;X<512;X++){
      const gx=X/c,gy=y/c,x0=gx|0,y0=gy|0,fx=gx-x0,fy=gy-y0,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),x1=(x0+1)%f,y1=(y0+1)%f;
      hm[y<<9|X]+=a*((g[y0*f+x0]*(1-sx)+g[y0*f+x1]*sx)*(1-sy)+(g[y1*f+x0]*(1-sx)+g[y1*f+x1]*sx)*sy);
    }
  }
  NZ=Uint8Array.from({length:65536},(_,i)=>hm[(i>>8)<<10|(i&255)<<1]/1.97*255); // the plain noise (every other value), kept as a 256 x 256 texture for the glow forest
  { // and as two little pictures for the dark mood: soft haze (tileable) and film grain
    const a=HZ.getContext('2d'),b=GR.getContext('2d'),d=a.createImageData(256,256),e=b.createImageData(128,128);
    for(let i=0;i<65536;i++){const v=max(0,NZ[i]-90)*2.2;d.data.set([v*.7,v*.85,v,255],i*4)}
    for(let i=0;i<16384;i++){const v=Math.random()*255;e.data.set([v,v,v,255],i*4)}
    a.putImageData(d,0,0);b.putImageData(e,0,0);HZ.st=1;
  }
  for(let i=0;i<262144;i++)HM[i]=max(60,255*(hm[i]/1.97)**1.5); // 60 = water level
  for(let i=0;i<262144;i++){
    // colours by height, blended into each other: deep and shallow water, a strip of sand, meadow, forest, red rock, snow. Lit from one side:
    // slopes towards the light are brighter and warmer, slopes away from it darker and bluer.
    const h=HM[i],dp=min(1,max(0,(60-255*(hm[i]/1.97)**1.5)/45)),l=h>60?max(.35,min(1.8,1+(h-HM[i-2&262143])*.11)):1+.2*sin((i&511)*.21)*sin((i>>9)*.17),w=l>1?[1.08,1.03,.88]:[.82,.92,1.15],
      K=[[60,[20,190,215]],[66,[236,208,120]],[74,[90,205,70]],[100,[30,130,60]],[118,[170,96,60]],[150,[150,120,110]],[170,[240,246,255]]]; // from this height on: this colour
    let c=h<=60?[20+10*(1-dp),70+120*(1-dp),170+50*(1-dp)].map(v=>v*(1-.45*dp)):K[0][1];
    if(h>60)for(let k=1;k<K.length;k++)if(h>=K[k-1][0]){const f=min(1,(h-K[k-1][0])/(K[k][0]-K[k-1][0]));c=K[k-1][1].map((v,j)=>v+(K[k][1][j]-v)*f)}
    CM[i]=rgb(clamp(c[0]*l*w[0]),clamp(c[1]*l*w[1]),clamp(c[2]*l*w[2]));
  }
}
// vector balls: six shaded ball sprites
const SPR=[0,1,2,3,4,5].map(i=>{ // (.st: these pictures never change, GX sends them to the graphics card once)
  const c=mkc(64,64),g=c.getContext('2d'),q=g.createRadialGradient(22,22,2,32,32,32);
  q.addColorStop(0,'#fff');q.addColorStop(.35,`hsl(${i*60},100%,55%)`);q.addColorStop(.92,`hsl(${i*60},100%,10%)`);q.addColorStop(1,'transparent');
  g.fillStyle=q;g.fillRect(0,0,64,64);c.st=1;return c;
});
const VP=new Float32Array(192),BX=new Float32Array(64),BY=new Float32Array(64),BW=new Float32Array(64),ORD=[...Array(64).keys()];
// glenz: icosahedron, faces found as vertex triples that are all one edge apart
const IV=[],IF=[];
for(const a of[-1,1])for(const b of[-1.618,1.618])IV.push([0,a,b],[a,b,0],[b,0,a]);
{
  const e=(a,b)=>abs(hypot(IV[a][0]-IV[b][0],IV[a][1]-IV[b][1],IV[a][2]-IV[b][2])-2)<.01;
  for(let a=0;a<12;a++)for(let b=a+1;b<12;b++)for(let c=b+1;c<12;c++)if(e(a,b)&&e(b,c)&&e(a,c))IF.push([a,b,c]);
}
// rotozoomer texture: XOR pattern with a cat on it
const TC=mkc(256,256);
{
  const g=TC.getContext('2d'),d=g.createImageData(256,256);
  for(let i=0;i<65536;i++){d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=(i&255^i>>8)*.6;d.data[i*4+3]=255}
  g.putImageData(d,0,0);
  const tri=(a,b,c,e,f,h)=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,e);g.lineTo(f,h);g.fill()};
  g.fillStyle='#fff';g.beginPath();g.arc(128,145,72,0,TAU);g.fill();tri(62,120,66,40,125,85);tri(194,120,190,40,131,85);
  g.fillStyle='#000';for(const X of[98,158]){g.beginPath();g.ellipse(X,135,17,23,0,0,TAU);g.fill()}tri(118,165,138,165,128,177);
  g.fillStyle='#fff';for(const X of[98,158]){g.beginPath();g.ellipse(X,135,5,20,0,0,TAU);g.fill()}
}

const hs=(h,a=1,l=60)=>`hsla(${h},100%,${l}%,${a})`;
const line=(a,b,c,d)=>{x.moveTo(a,b);x.lineTo(c,d)};
// rotate (a around Y, b around X), project into OP[i], OP[i+1]; returns the perspective scale
const pr=(X,Y,Z,a,b,dist,i,o=0)=>{let u=X*cos(a)-Z*sin(a);Z=X*sin(a)+Z*cos(a);X=u;u=Y*cos(b)-Z*sin(b);Z=Y*sin(b)+Z*cos(b);const w=F/(Z+dist);OP[i]=X*w;OP[i+1]=(u+o)*w;return w};
const hf=(X,Z)=>(sin(X*.21+Z*.2)+sin(X*.09-Z*.31)*1.5+sin(Z*.5+X*.4)*.4+2.9)*.8*min(1,abs(X)/6)**2; // valley in the middle to fly through
const ox=z=>sin(z*.11)*1.5,oy=z=>cos(z*.07)*1.2; // tunnel bends

// Scenes draw around the screen centre; the sequencer sets alpha + zoom for transitions.
