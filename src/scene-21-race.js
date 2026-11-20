// ---- 21 the race: one anti-gravity craft, one track, six generations of graphics (4 s each) ----
// The track is a closed curve on a 512x512 map; height only exists in the polygon eras.
const NSEG=240,TA=u=>u*TAU/NSEG,TX=a=>256+170*cos(a)+36*cos(3*a),TY=a=>256+150*sin(a)+44*sin(2*a),TH=a=>sin(a*3)*14+sin(a*7)*5;
const ERA=['16-BIT / SCANLINE ROAD','16-BIT / ROTATING FLOOR','32-BIT / AFFINE TEXTURES, WOBBLY VERTICES','128-BIT / FILTERED TEXTURES, FAR HORIZON','TODAY / NEON NIGHT + BLOOM','BEYOND / RAINBOW HIGHWAY'];
const MP=(()=>{ // floor map for the rotating-floor era, painted at load
  const c=mkc(512,512),g=c.getContext('2d');
  for(let i=0;i<256;i++){g.fillStyle=(i^i>>4)&1?'#2a7a3a':'#2f8a40';g.fillRect((i&15)*32,(i>>4)*32,32,32)}
  g.beginPath();for(let i=0;i<NSEG;i++)g.lineTo(TX(TA(i)),TY(TA(i)));g.closePath();
  g.lineWidth=24;g.strokeStyle='#eee';g.stroke();g.setLineDash([6,6]);g.strokeStyle='#d22';g.stroke();g.setLineDash([]);
  g.lineWidth=18;g.strokeStyle='#445';g.stroke();g.setLineDash([5,9]);g.lineWidth=1.5;g.strokeStyle='#fd4';g.stroke();
  return new Uint32Array(g.getImageData(0,0,512,512).data.buffer);
})();
let RX,RY,RYH,RCS,RSN,RPT;
function camSet(){ // camera on the track; returns the curvature ahead (for banking)
  const a=TA(rp),b=TA(rp+1.5),hd=Math.atan2(TY(b)-TY(a),TX(b)-TX(a));
  RX=TX(a);RY=TY(a);RYH=TH(a)+3.5;RCS=cos(hd);RSN=sin(hd);RPT=(TH(TA(rp+3))-TH(a))/13;
  return sin(Math.atan2(TY(TA(rp+4))-TY(TA(rp+2.5)),TX(TA(rp+4))-TX(TA(rp+2.5)))-hd);
}
function retro(S0,m){ // m>0: scanlines flip one by one to the next style // 0: scanline road (flat colour bands per row), 1: textured floor plane rotating under the camera
  const p=VB.p,ho=Math.atan2(RSN,RCS)*200;
  for(let y=0;y<180;y++){
    const row=y*320,st=!S0&&(y*7&15)/16<m?1:S0;
    if(y<=70){
      const b=y>>3,sky=st?rgb(250-b*14,120-b*8,60+b*18):rgb(60+b*14,110+b*14,235);
      for(let X=0;X<320;X++){const q=X+ho;p[row+X]=70-y<18+sin(q*.045)*9+sin(q*.13)*5?(st?0xff281428:0xff603830):sky}
    }else{
      const z=560/(y-70);
      if(st){
        const sx=-RSN*z/160,sy=RCS*z/160;let wx=RX+RCS*z-160*sx,wy=RY+RSN*z-160*sy;
        for(let X=0;X<320;X++){p[row+X]=MP[(wy&511)<<9|wx&511];wx+=sx;wy+=sy}
      }else{
        const u=rp+z/4.2,a=TA(u),xc=160+((TY(a)-RY)*RCS-(TX(a)-RX)*RSN)/z*160,w=9/z*160,b=floor(u/2)&1;
        for(let X=0;X<320;X++){const d=abs(X-xc);p[row+X]=d<w*.05&&b?0xffffffff:d<w?(b?0xff605858:0xff585050):d<w*1.18?(b?0xff2020d0:0xffe8e8e8):b?0xff30a030:0xff289028}
      }
    }
  }
}
function ship(g,sx,sy,s,bank,st){ // the craft from behind: dart body, two swept pods, engines that flare with bass and kick
  const neo=st>2,dark=st>3;
  const P=(c,...q)=>{g.fillStyle=c;g.beginPath();for(let i=0;i<q.length;i+=2)g.lineTo(q[i]*s,q[i+1]*s);g.closePath();g.fill();if(dark){g.strokeStyle=hs(hue,1,70);g.lineWidth=s*.025;g.stroke()}};
  g.save();g.translate(sx,sy+sin(t*5)*s*.03);
  g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.ellipse(0,s*.52,s*.7,s*.09,0,0,TAU);g.fill();
  g.rotate(bank);
  for(const m of[-1,1])P(dark?'#161a2c':neo?hs(hue+180,1,72):'#eee',m*.25,.02,m*.8,.3,m*.74,.42,m*.2,.3);
  P(dark?'#0a0c18':neo?hs(hue+180,1,45):'#d22',0,-.55,.28,.1,.18,.32,-.18,.32,-.28,.1);
  P(neo?hs(hue,1,75):'#124',0,-.3,.09,-.02,-.09,-.02);
  if(neo)g.globalCompositeOperation='lighter';
  const fl=(.07+.06*min(1,lvl)+.07*kick)*s;
  for(const m of[-1,1])for(let i=dark?3:1;i>0;i--){g.fillStyle=neo?hs(hue+40,1/i,75):'#fc3';g.beginPath();g.arc(m*.12*s,.36*s,fl*i,0,TAU);g.fill()}
  g.restore();
}
// eras 5 + 6 in one shader: analytic road plane with curves, glowing gates, glossy reflections; m=1 turns it into a rainbow ribbon in space
const shR=shader(`float cx(float q){return sin(q*.02)*8.+sin(q*.011)*14.;}
float hsh(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}
vec3 sk(vec3 v){
  float st=step(.996,hsh(floor(v.xy/(abs(v.z)+.3)*220.)));
  if(m>.5)return pal(h+v.x*.3+v.y*.4+t*.05)*.1+st;
  return mix(pal(h+.55)*.35,vec3(.005,.01,.03),smoothstep(0.,.45,abs(v.y)))+pal(h)*.7*exp(-abs(v.y)*14.)+st*step(.15,v.y);
}
vec3 gt(vec3 a,vec3 v){ // glow of the next six gates: distance from the ray to each gate outline
  vec3 g=vec3(0);
  for(int i=0;i<6;i++){
    float zk=(floor(a.z/40.)+1.+float(i))*40.,s=(zk-a.z)/v.z;
    if(s<0.)continue;
    vec2 q=a.xy+v.xy*s-vec2(cx(zk),0);
    float d=m>.5?abs(length(q-vec2(0,2))-12.):abs(max(abs(q.x)-11.,q.y-10.));
    g+=pal(h+zk*.004+m*zk*.02)*(.3+1.5*B[int(mod(zk/40.,32.))])*.3/(d*d*.6+.06)*exp(-s*.012);
  }
  return g;
}
void main(){
  UV;u*=R(m*sin(t*.5)*.35+ro);u.y-=.12;
  float zw=p*4.2;
  vec3 a=vec3(cx(zw),3.5,zw),v=normalize(vec3(u,1.2*z)),c;
  v.xz*=R(-atan(cos(zw*.02)*.16+cos(zw*.011)*.154));
  c=sk(v);
  if(v.y<0.){
    float s=-a.y/v.y,f=exp(-s*.005),w=9.;vec3 q=a+v*s,g;float x=q.x-cx(q.z);
    if(abs(x)<w){
      if(m>.5)g=mix(c,pal(x/w*.5+q.z*.01-t*.5)*(.8+.6*l)+step(.97,hsh(floor(q.xz*1.5)))*(1.+k),.8);
      else{
        vec3 rv=v*vec3(1,-1,1);
        g=vec3(.02,.025,.04)+hsh(floor(q.xz*6.))*.015+(sk(rv)+gt(q,rv))*.3; // glossy: mirrored sky + gates
        g+=pal(h)*smoothstep(.3,.05,abs(abs(x)-w+.5))*2.5; // edge strips
        g+=smoothstep(.15,.05,abs(abs(x)-3.))*step(.5,fract(q.z*.08))*.5; // lane dashes
        g+=pal(h+.5)*step(.85,fract(q.z*.008))*step(.5,fract(q.z*.15+abs(x)*.12))*(.4+k); // boost chevrons
        g+=pal(h+.3)*B[int(fract(q.z*.004)*31.)]*smoothstep(3.,1.,w-abs(x))*1.2; // spectrum light panels
      }
    }else g=m>.5?c:vec3(.01,.012,.03)+pal(h+.5)*smoothstep(.46,.5,max(abs(fract(q.x*.06)-.5),abs(fract(q.z*.06)-.5)))*.3;
    c=mix(m>.5?c:pal(h)*.25,g,f);
  }
  c+=gt(a,v);
  o=vec4(1.-exp(-c*(1.6-.15*dot(u,u))),1);
}`,4e6,1);
// ---- polygon eras (32-bit, 128-bit, today): one textured WebGL mesh of the whole circuit, three ways to render it ----
const v3=(a,b,s)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],nrm=a=>{const l=hypot(...a);return a.map(v=>v/l)};
const HD=a=>Math.atan2(TY(a+.002)-TY(a),TX(a+.002)-TX(a));
const FRM=u=>{ // track frame at segment position u: centre, tangent, banked right + up, flat right
  const a=TA(u),c=[TX(a),TH(a),TY(a)],tx=TX(a+.002)-c[0],ty=TH(a+.002)-c[1],tz=TY(a+.002)-c[2],tl=hypot(tx,tz),
    b=max(-.4,min(.4,sin(HD(a+.04)-HD(a-.04))*2.2)),cb=cos(b),sb=sin(b),nx=-tz/tl,nz=tx/tl;
  return{c,t:nrm([tx,ty,tz]),r:[nx*cb,-sb,nz*cb],u:[nx*sb,cb,nz*sb],n:[nx,0,nz]};
};
let race3d;
if(gl){
  // 13 texture layers of 128x128, painted at load. Texels with lowered alpha are emissive (lights, signs, windows).
  const NL=13,TS=mkc(128,128*NL),tg=TS.getContext('2d',{willReadFrequently:true}),rnd=Math.random;
  const lay=(i,f)=>{tg.save();tg.translate(0,i*128);tg.beginPath();tg.rect(0,0,128,128);tg.clip();f();tg.restore()};
  const bx=(c,X,Y,w,h)=>{tg.fillStyle=c;tg.fillRect(X,Y,w,h)};
  const emi=f=>{f();tg.globalCompositeOperation='destination-out';tg.globalAlpha=.2;f();tg.globalCompositeOperation='source-over';tg.globalAlpha=1};
  const grit=(n,c)=>{for(let i=0;i<n;i++)bx(c,rnd()*128,rnd()*128,1+rnd()*3,1)};
  const txt=(str,X,Y,sz,c)=>{tg.font=`bold ${sz}px monospace`;tg.textAlign='center';tg.fillStyle=c;tg.fillText(str,X,Y)};
  const poly=(c,...q)=>{tg.fillStyle=c;tg.beginPath();for(let i=0;i<q.length;i+=2)tg.lineTo(q[i],q[i+1]);tg.fill()};
  const road=()=>{bx('#3a3d4a',0,0,128,128);grit(300,'rgba(0,0,0,.25)');grit(200,'rgba(255,255,255,.08)');bx('#23252e',0,0,128,2);bx('#2c2f3a',63,0,2,128);bx('#b8b8c4',30,0,3,128);bx('#b8b8c4',95,0,3,128);emi(()=>{bx('#fb3',2,0,5,128);bx('#fb3',121,0,5,128)})};
  lay(0,()=>{road();poly('#565a6c',50,80,78,80,64,104)});
  lay(1,()=>{road();emi(()=>{for(let k=0;k<3;k++)poly('#4ef',20,8+k*40,64,38+k*40,108,8+k*40,108,24+k*40,64,54+k*40,20,24+k*40)})});
  lay(2,()=>{road();for(let k=0;k<32;k++)bx(k+(k>>4)&1?'#fff':'#111',(k&15)*8,56+(k>>4)*8,8,8)});
  lay(3,()=>{bx('#8a8f9c',0,0,128,128);grit(200,'rgba(0,0,0,.2)');for(let k=-2;k<6;k++)poly(k&1?'#e8b414':'#1a1a1a',k*32,128,k*32+32,128,k*32+64,72,k*32+32,72);bx('#30333c',0,66,128,6);emi(()=>bx('#fff',0,8,128,5))});
  lay(4,()=>{bx('#c02a4a',0,0,128,128);bx('#fff',6,6,116,4);bx('#fff',6,118,116,4);emi(()=>txt('BEAT',64,58,40,'#fff'));emi(()=>txt('TRO',64,102,48,'#fd4'))});
  lay(5,()=>{bx('#1a2a6a',0,0,128,128);poly('#fb2',30,50,34,14,58,34);poly('#fb2',98,50,94,14,70,34);tg.beginPath();tg.arc(64,58,34,0,TAU);tg.fill();bx('#124',46,48,10,14);bx('#124',72,48,10,14);emi(()=>txt('MEOW!',64,122,30,'#fff'))});
  lay(6,()=>{bx('#e8e8e8',0,0,128,128);txt('SUB',64,56,56,'#111');emi(()=>txt('BASS',64,112,48,'#f60'))});
  lay(7,()=>{bx('#555b6b',0,0,128,128);grit(200,'rgba(0,0,0,.25)');for(let k=0;k<8;k++){bx('#2a2d36',8,k*16+6,4,4);bx('#2a2d36',116,k*16+6,4,4)}emi(()=>bx('#fff',52,0,24,128))});
  lay(8,()=>{bx('#4a4f5c',0,0,128,128);grit(250,'rgba(0,0,0,.2)');for(let k=0;k<4;k++){bx('#2e313a',k*32,0,2,128);bx('#2e313a',0,k*32,128,2)}emi(()=>bx('#fff',0,18,128,6))});
  lay(9,()=>{bx('#1c1e2a',0,0,128,128);for(let k=0;k<64;k++){const X=(k&7)*16+3,Y=(k>>3)*16+4;rnd()<.35?emi(()=>bx('#ffd',X,Y,10,9)):bx('#2a3040',X,Y,10,9)}});
  lay(10,()=>{bx('#0f1520',0,0,128,128);grit(400,'rgba(255,255,255,.05)');bx('#1f3a4a',0,0,128,2);bx('#1f3a4a',0,0,2,128)});
  lay(11,()=>{bx('#e8e8ee',0,0,128,128);bx('#333848',0,0,24,128);bx('#333848',104,0,24,128);bx('#d22',52,0,24,128);bx('#888',40,0,2,128);bx('#888',86,0,2,128);tg.fillStyle='#123';tg.beginPath();tg.ellipse(64,40,9,17,0,0,TAU);tg.fill();txt('7',64,116,30,'#fff');emi(()=>{bx('#fff',4,8,16,5);bx('#fff',108,8,16,5)})});
  lay(12,()=>emi(()=>{const q=tg.createRadialGradient(64,64,4,64,64,64);q.addColorStop(0,'#fff');q.addColorStop(.4,'#6cf');q.addColorStop(.95,'#000');tg.fillStyle=q;tg.fillRect(0,0,128,128)}));
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D_ARRAY,gl.createTexture());gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);
  gl.texImage3D(gl.TEXTURE_2D_ARRAY,0,gl.RGBA,128,128,NL,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(tg.getImageData(0,0,128,128*NL).data.buffer));
  gl.generateMipmap(gl.TEXTURE_2D_ARRAY);gl.activeTexture(gl.TEXTURE0);

  // geometry: 7 floats per vertex = position, u, v, texture layer, baked shade
  const GV=[],vtx=(p,u,v,l,s)=>GV.push(p[0],p[1],p[2],u,v,l,s);
  const quad=(a,b,c,d,u0,v0,u1,v1,l,s)=>{vtx(a,u0,v0,l,s);vtx(b,u1,v0,l,s);vtx(c,u1,v1,l,s);vtx(a,u0,v0,l,s);vtx(c,u1,v1,l,s);vtx(d,u0,v1,l,s)};
  const TUN=i=>i>150&&i<186,CEN=Array.from({length:NSEG},(_,j)=>FRM(j).c); // the middle of the road at every segment
  for(let i=0;i<NSEG;i++){
    const A=FRM(i),N=FRM(i+1),aL=v3(A.c,A.r,-9),aR=v3(A.c,A.r,9),bL=v3(N.c,N.r,-9),bR=v3(N.c,N.r,9),tn=TUN(i),wh=tn?9:3,wl=tn?8:3;
    const aLt=v3(aL,A.u,wh),aRt=v3(aR,A.u,wh),bLt=v3(bL,N.u,wh),bRt=v3(bR,N.u,wh);
    quad(aL,aR,bR,bL,0,i*.25,1,i*.25+.25,i?i%12==6?1:0:2,1); // road, boost pad every 12th, start grid at 0
    quad(aLt,bLt,bL,aL,i*.5,0,i*.5+.5,wh/3,wl,.8);quad(bRt,aRt,aR,bR,i*.5+.5,0,i*.5,wh/3,wl,.7); // walls
    if(tn)quad(aLt,aRt,bRt,bLt,0,i*.5,3,i*.5+.5,8,.5); // tunnel roof
    const o=(q,X,Y)=>v3(v3(q,A.r,X),A.u,Y);
    if(i%8==0&&!tn){ // gate: two posts and a sign beam
      quad(o(aL,-1.5,10),o(aL,0,10),aL,o(aL,-1.5,0),0,0,.25,2,7,.9);quad(o(aR,0,10),o(aR,1.5,10),o(aR,1.5,0),aR,0,0,.25,2,7,.9);
      quad(o(aL,-1.5,14),o(aR,1.5,14),o(aR,1.5,10),o(aL,-1.5,10),0,0,3,1,4+(i>>3)%3,1);
    }
    if(i%10==5&&!tn){ // trackside billboard
      const sd=i/10&1?1:-1,F=FRM(i+2),p0=v3(v3(A.c,A.r,sd*11),A.u,12),p1=v3(v3(F.c,F.r,sd*11),F.u,12),p2=v3(v3(F.c,F.r,sd*11),F.u,4),p3=o(A.c,sd*11,4);
      quad(p0,p1,p2,p3,sd>0?1:0,0,sd>0?0:1,1,4+(i/10|0)%3,1);
    }
    const th=nrm([A.t[0],0,A.t[2]]),gy=q=>[q[0],-25,q[2]];
    if(i%6==3){ // pylons carrying the track
      const a=v3(A.c,A.n,-1.5),b=v3(A.c,A.n,1.5),c=v3(A.c,th,-1.5),d=v3(A.c,th,1.5),hv=(A.c[1]+25)/8;
      quad(a,b,gy(b),gy(a),0,0,.4,hv,8,.5);quad(c,d,gy(d),gy(c),0,0,.4,hv,8,.4);
    }
    if(i%3==0)for(const sd of[-1,1]){ // buildings left and right
      const bc=v3(A.c,A.n,sd*(26+rnd()*34)),top=A.c[1]+rnd()*55-4,sx=4+rnd()*7,sz=4+rnd()*7,
        cn=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([e,f])=>{const q=v3(v3(bc,A.n,e*sx),th,f*sz);q[1]=top;return q});
      if(CEN.some(c=>hypot(c[0]-bc[0],c[2]-bc[2])<13+(sx+sz)))continue; // the track winds back on itself: no building where another stretch of road runs (they used to stand on it)
      for(let k=0;k<4;k++){const a=cn[k],b=cn[(k+1)%4];quad(a,b,gy(b),gy(a),0,0,(k&1?sx:sz)/3,(top+25)/6,9,k&1?.9:.6)}
      quad(cn[0],cn[1],cn[2],cn[3],0,0,1,1,8,.4);
    }
  }
  quad([-900,-25,-900],[1400,-25,-900],[1400,-25,1400],[-900,-25,1400],0,0,90,90,10,1); // ground
  const C0=GV.length/7,tri=(a,b,c,s)=>{for(const q of[a,b,c])vtx(q,q[0]/5+.5,.5-q[2]/5.5,11,s)}; // craft: hull texture projected from above
  {
    const N=[0,.1,2.6],RT=[0,.8,-1.6],RL=[-.9,0,-1.8],RR=[.9,0,-1.8],RB=[0,-.25,-1.6];
    tri(N,RL,RT,1);tri(N,RT,RR,.85);tri(N,RB,RL,.4);tri(N,RR,RB,.4);tri(RL,RR,RT,.6);tri(RL,RB,RR,.5);
    for(const s of[-1,1]){
      const PF=[s*1.9,0,1.2],PO=[s*2.2,.1,-2.2],PI=[s*1.2,.1,-2],PT=[s*1.7,.5,-2];
      tri(PF,PO,PT,.9);tri(PF,PT,PI,.7);tri(PF,PI,PO,.4);tri(PO,PI,PT,.5);
      tri([s*.5,.1,.6],[s*1.6,.05,.4],[s*1.5,.05,-1.4],.8);tri([s*.5,.1,.6],[s*1.5,.05,-1.4],[s*.7,.1,-1.5],.8);
      quad([s*1.7-.35,.55,-2.25],[s*1.7+.35,.55,-2.25],[s*1.7+.35,-.05,-2.25],[s*1.7-.35,-.05,-2.25],0,0,1,1,12,1);
    }
    quad([-.4,.6,-1.85],[.4,.6,-1.85],[.4,0,-1.85],[-.4,0,-1.85],0,0,1,1,12,1);
  }
  const C1=GV.length/7-C0,va=gl.createVertexArray();
  gl.bindVertexArray(va);gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(GV),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);gl.bindVertexArray(null);

  // e = era. 2: vertices snap to the pixel grid, texture coordinates interpolate affinely (they swim), nearest texels, 5-bit colour with dither, short fog.
  // 3: perspective-correct, mip-mapped, long view. 4: night, emissive texels drive the light, fresnel sheen, tone mapping (+ bloom in 2D).
  const mp=gl.createProgram(),mf=cmp(gl.FRAGMENT_SHADER,`precision highp float;precision highp sampler2DArray;
uniform sampler2DArray T;uniform float h,k,d,B[32];uniform vec3 FC,cam,tint;
in vec3 q,wp;in vec2 a;in float fz,e,fl;out vec4 o;
vec3 pal(float x){return .5+.5*cos(6.283*(x+vec3(0,.33,.67)));}
void main(){
  float af=clamp(3.-e,0.,1.),ni=clamp(e-3.,0.,1.); // how 32-bit, how much night (e is this part's own era, see the vertex shader): everything below blends with these
  vec2 uv=q.xy/q.z;vec4 c=af>.5?textureLod(T,vec3((floor(uv*128.)+.5)/128.,floor(a.x+.5)),0.):texture(T,vec3(uv,floor(a.x+.5))); // 32-bit: single texels, no smoothing
  if(a.x>11.5&&c.b<.12)discard; // round engine glow
  float em=step(c.a,.93),fg=exp(-fz*mix(mix(.006,.02,af),.0045,ni));
  vec3 col=c.rgb*a.y*tint*mix(1.,.4,ni);
  col=mix(col,c.rgb*pal(h+a.x*.13+wp.y*.01)*(.7+1.8*B[int(mod(wp.x*.11+wp.z*.07,32.))]+k)*mix(1.2,2.2,ni),em);
  vec3 n=normalize(cross(dFdx(wp),dFdy(wp)));col+=ni*pal(h+.55)*.5*pow(1.-abs(dot(n,normalize(cam-wp))),4.);
  col=mix(col,pal(h+wp.x*.03+wp.z*.02)*1.3,d*step(a.x,2.5)); // d: the road turns rainbow
  col=mix(FC,col+fl*.6,fg); // fl: the flash when a part changes era
  float lv=mix(255.,31.,af);col=floor(col*lv+(mod(gl_FragCoord.x,2.)*.5+mod(gl_FragCoord.y,2.)*.25)*af)/lv;
  col=mix(col,1.-exp(-col*1.5),ni);
  o=vec4(col,1);
}`);
  gl.attachShader(mp,cmp(gl.VERTEX_SHADER,`layout(location=0)in vec3 P;layout(location=1)in vec4 A;
uniform mat4 VP;uniform mat3 M;uniform vec3 O,cam;uniform vec2 r;uniform float E,g,fy,d;
out vec3 q,wp;out vec2 a;out float fz,e,fl;
void main(){
  wp=M*P+O;wp.y=mix(fy,wp.y,g); // g<1: the world is still folded flat onto the old floor plane
  if(A.z>2.5)wp.y-=d*d*150.; // d: everything but the road drops away
  // The era does not change for the whole picture at once: every patch of the world (24 units square) steps to the next era at its own moment.
  // Patches near the craft go first, the wave runs outwards, the order within it is random; a patch flashes as it changes.
  vec2 pc=floor((M*P+O).xz/24.);float ei=min(3.,floor(E)),st=clamp(((E-ei)*1.8-fract(sin(dot(pc,vec2(127.1,311.7)))*43758.5)*.6-clamp(length(wp.xz-cam.xz)/420.,0.,1.))*5.,0.,1.);
  e=ei+st;fl=st*(1.-st)*4.;
  vec4 c=VP*vec4(wp,1);float af=clamp(3.-e,0.,1.);
  if(af>0.&&c.w>0.)c.xy=floor(c.xy/c.w*r*.5)/(r*.5)*c.w;
  float w=mix(1.,max(c.w,.1),af);
  q=vec3(A.xy*w,w);a=A.zw;fz=c.w;gl_Position=c;
}`));
  gl.attachShader(mp,mf);gl.linkProgram(mp);
  if(!gl.getProgramParameter(mp,gl.LINK_STATUS))console.warn('race mesh off:',gl.getProgramInfoLog(mp),gl.getShaderInfoLog(mf));
  else{
    const L={},U=n=>L[n]??=gl.getUniformLocation(mp,n);
    const TINT=[[1,1,1],[.5,.8,1.3],[1.3,1.1,.4],[.6,1.3,.6]],FCS=[[.16,.1,.28],[.62,.4,.38],[.02,.03,.07]],TOP=[[12,8,32],[26,42,106],[0,0,8]],mix3=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f);
    race3d=(e,ga,g=1,d=0)=>{ // e is continuous: 2 = 32-bit, 3 = 128-bit, 4 = today, anything between is a blend
      const ei=min(3,e|0),fr=e-ei,FC=mix3(FCS[ei-2],FCS[ei-1],fr).map(v=>v*(1-d)),top=mix3(TOP[ei-2],TOP[ei-1],fr),
        gs=min(1,Math.sqrt(4e6*QS/W/H)),hf=H*gs|0,h=e<3?min(H,480)+(hf-min(H,480))*Math.round(fr*fr*8)/8|0:hf,w=h*W/H|0,lo=e<2.5;
      const T3=x.lo(w,h,1);gl.bindFramebuffer(gl.FRAMEBUFFER,T3.fb);
      gl.viewport(0,0,w,h);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.useProgram(mp);gl.bindVertexArray(va);
      gl.activeTexture(gl.TEXTURE1);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.activeTexture(gl.TEXTURE0); // (the 32-bit parts pick single texels themselves)
      // chase camera: behind and above the craft, looking down the track, half following the banking
      const fe=FRM(rp-1.1),fa=FRM(rp+3),eye=v3(fe.c,fe.u,4),f=nrm(v3(v3(fa.c,fa.u,3.2),eye,-1)),sd=nrm(crs(f,nrm(v3([0,1,0],fe.u,1)))),up=crs(sd,f),
        n=.3,fr2=1500,ft=1/Math.tan(.6),fx=ft*H/W,za=(fr2+n)/(fr2-n);
      gl.uniformMatrix4fv(U('VP'),false,[fx*sd[0],ft*up[0],za*f[0],f[0],fx*sd[1],ft*up[1],za*f[1],f[1],fx*sd[2],ft*up[2],za*f[2],f[2],-fx*dot(sd,eye),-ft*dot(up,eye),-za*dot(f,eye)-2*fr2*n/(fr2-n),-dot(f,eye)]);
      gl.uniform1i(U('T'),1);gl.uniform2f(U('r'),w,h);gl.uniform1f(U('E'),e);gl.uniform1f(U('h'),hue/360);gl.uniform1f(U('k'),kick);gl.uniform1fv(U('B'),B);
      gl.uniform3fv(U('FC'),FC);gl.uniform3fv(U('cam'),eye);gl.uniform1f(U('g'),g);gl.uniform1f(U('fy'),fe.c[1]);gl.uniform1f(U('d'),d);
      gl.uniformMatrix3fv(U('M'),false,[1,0,0,0,1,0,0,0,1]);gl.uniform3f(U('O'),0,0,0);gl.uniform3f(U('tint'),1,1,1);
      gl.drawArrays(gl.TRIANGLES,0,C0);
      gl.uniform1f(U('g'),1);gl.uniform1f(U('d'),0);
      if(g>.6)for(let i=0;i<4;i++){ // the player's craft and three rivals weaving ahead
        const c=FRM(i?rp+6+4*i+sin(t*.3+i)*3:rp+.7);
        gl.uniformMatrix3fv(U('M'),false,[...c.r,...c.u,...c.t].map(v=>v*1.7));gl.uniform3fv(U('O'),v3(v3(c.c,c.r,i?sin(t*.7+i*2)*5:sin(t*.4)*2.5),c.u,1.6+sin(t*5+i)*.12));gl.uniform3fv(U('tint'),TINT[i]);
        gl.drawArrays(gl.TRIANGLES,C0,C1);
      }
      gl.bindVertexArray(null);gl.disable(gl.DEPTH_TEST);
      // sky as a gradient, the transparent 3D frame on top (fog fades into the sky's horizon colour)
      const q=x.createLinearGradient(0,-H/2,0,H*.1),css=c=>`rgb(${c.map(v=>v|0)})`;q.addColorStop(0,css(top));q.addColorStop(1,css(FC.map(v=>v*255)));
      x.imageSmoothingEnabled=!lo;x.fillStyle=q;x.fillRect(-W/2,-H/2,W,H);
      x.drawImage(T3,-W/2,-H/2,W,H); // (the glow that the last era used to add itself now comes from the post pass)
    };
  }
}
RACE=SC.push(()=>{
  if(live){const sm=1-.55*dk;rt+=dt*sm;rp+=dt*(16+14*min(1,lvl))*sm} // slower in the dark mood
  // each generation morphs into the next during its last 1.2 s (m: 0 > 1)
  let st=lock?(rt/4|0)%6:min(5,rt/4|0),m=max(0,(rt%4-2.8)/1.2);m=st<5?m*m*(3-2*m):0; // (past its 24 s it stays in the last generation: a visit that runs over, in a slow song or waiting for a step in the song, must not start the race again. Held with L it goes round)
  if(!race3d||!shR){st&=1;m*=!st} // no WebGL: only the two 16-bit looks
  const bk=max(-.3,min(.3,camSet()*1.3)),ga=x.globalAlpha,rl=roll;
  const rainbow=a=>{x.globalAlpha=a;gm=1;gp=rp%3e4;roll=bk*.3;shR();roll=rl;x.translate(W/2,H/2);ship(x,-bk*R*.3,H*.2,R*.42,bk,5)};
  x.rotate(-roll);x.globalCompositeOperation='source-over';x.imageSmoothingEnabled=false;
  if(st<2){
    retro(st,m); // 0 > 1: scanlines flip to the rotating floor one by one
    const c=VB.put();if(!st||m<.6)ship(c.getContext('2d'),160-bk*40,128,34,bk,st);
    x.drawImage(c,-W/2,-H/2,W,H);
    if(st&&m){x.globalAlpha=ga*min(1,m*2);race3d(2,x.globalAlpha,m)} // 1 > 2: the flat floor unfolds, hills, walls and towers rise out of it
  }
  else if(st<4)race3d(st+m,ga); // 2 > 3 > 4: resolution, texture filtering, perspective, fog, daylight and bloom all slide over
  else if(st<5){race3d(4,ga,1,m);if(m)rainbow(ga*m)} // 4 > 5: the city drops away, the road turns rainbow
  else rainbow(ga);
  x.setTransform(XS,0,0,XS,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=ga;
  x.font=`bold ${H*.03}px monospace`;x.fillStyle='#fff';x.fillText(ERA[m>.5?st+1:st],W*.03,H*.07);
  x.fillText(`${300+400*min(1,lvl)+kick*60|0} KPH   LAP ${1+(rp/NSEG|0)%9}`,W*.03,H*.115);
})-1;
