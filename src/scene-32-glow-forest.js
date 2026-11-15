// ---- 32 glow forest: a moonlit forest of giant glowing mushrooms that grows out of the song. Real geometry this time (no ray marching):
// ground, ~70,000 blades of grass, mushrooms and fireflies are all built in the vertex shader from the vertex / instance number, so there are no meshes to load.
// The path is the song: the camera walks it at playback speed. Where the song is quiet the mushrooms stay small and sparse, where it is loud they tower.
// Every mushroom belongs to one band and its gills glow with it; the grass tips do the same, and every kick runs through the grass as a wave.
// Light: the moon casts real shadows (a shadow map of the big mushrooms), every big mushroom has a halo of light in the mist, glowing things bloom.
// Drawn into a 4x anti-aliased buffer (thin blades would crawl otherwise); a last pass adds bloom and the moon's light shafts: whatever covers the moon cuts into them.
let WOOD=-1;
if(gl){
  const GX=220,GZ=330,TX=18,TZ=22,UX=30,UZ=40,NF=2500,WPX=GLPX*1.5,SPD=3,SMS=2048; // grass grid (GX*GZ blades: the density knob), grid of big / small mushrooms, fireflies, pixel budget, walking speed, shadow map size
  const CM=`precision highp float;precision highp int;precision highp sampler2DShadow;
uniform mat4 VP,LV;uniform vec3 cam,md,cr,cu,cf;uniform vec2 r;uniform float t,k,h,mk,LEN,B[32];uniform int M,SU,SV;uniform sampler2D S,NZ;uniform sampler2DShadow SM;
const float CS=5.,GS=.14,US=1.6;const int GX=${GX},TX=${TX},UX=${UX};
vec3 pal(float x){return .5+.5*cos(6.283*(x+vec3(0,.33,.67)));}
uint hu(uvec2 p){p*=uvec2(1597334673u,3812015801u);uint n=(p.x^p.y)*1597334673u;n^=n>>15;n*=2246822519u;n^=n>>13;return n;}
float H(ivec2 c,int s){return float(hu(uvec2(c+s*ivec2(7919,104729)))>>8)/16777216.;} // integer hash: stays sharp far from the origin. Colours: pal(h+band*.009) keeps all bands within a third of the colour wheel
float nz(vec2 p){return textureLod(NZ,p,0.).r;} // smooth noise (a texture made at start)
float px(float z){return sin(z*.031)*9.+sin(z*.013)*14.;} // the path
float hp(float z){return sin(z*.043)*2.;}
float hT(vec2 p){float d=p.x-px(p.y);return hp(p.y)+(1.-exp(-d*d*.02))*(sin(p.x*.07+p.y*.05)*1.5+sin(p.x*.19-p.y*.13)*.6+1.+nz(p*.011)*2.5);} // ground height
float lev(float z,float b){return mix(.45,textureLod(S,vec2(z/LEN,(b+.5)/32.),2.).g,mk);} // how loud the song is at this spot of the path, in this band
vec4 mush(ivec2 c){ // the big mushroom of a 5 m cell: xz position, height (0 = none), band
  vec2 p=(vec2(c)+.2+.6*vec2(H(c,1),H(c,2)))*CS;
  float b=floor(H(c,3)*32.),L=lev(p.y,b),d=p.x-px(p.y),hh=H(c,4);
  p.x+=(d<0.?-1.:1.)*max(0.,4.-abs(d)); // keep the path free
  return vec4(p,H(c,5)<.3+.6*L?.8+2.*hh+13.*L*L*hh:0.,b);
}
vec4 mini(ivec2 c){ // the small mushroom of a 1.6 m cell: they stand in clusters
  vec2 p=(vec2(c)+vec2(H(c,21),H(c,22)))*US;float b=floor(H(c,23)*32.);
  return vec4(p,H(c,25)<smoothstep(.42,.6,nz(p*.027))*.8&&abs(p.x-px(p.y))>1.3?.12+.45*H(c,24)*(.5+lev(p.y,b)):0.,b);
}
float capR(ivec2 c,float m){return m*(M==6?.45+.4*H(c,6):.3+.25*H(c,6))*(1.2-.5*H(c,8));}
vec4 glow(vec2 q){ // light of the mushrooms around a spot on the ground (rgb) and the dark patch under their stems (a)
  vec4 g=vec4(0,0,0,1);ivec2 c0=ivec2(floor(q/CS-.5));
  for(int i=0;i<4;i++){ivec2 c=c0+ivec2(i%2,i/2);vec4 m=mush(c);if(m.z>0.){float R=m.z*(.3+.25*H(c,6))*(1.2-.5*H(c,8)),d=length(q-m.xy);
    g.rgb+=pal(h+m.w*.009)*(.12+1.5*B[int(m.w)])*R*R/(d*d+R*R*.6+.3)*.6;g.a*=1.-.7*exp(-d*d/(R*R*.12+.05));}}
  return g;
}
float shd(vec3 p){ // 1 = in moonlight, 0 = in the shadow of a mushroom (four taps of the shadow map)
  vec3 q=(LV*vec4(p,1)).xyz*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 1.;
  float s=0.;for(int i=0;i<4;i++)s+=texture(SM,vec3(q.xy+(vec2(i%2,i/2)-.5)*${(2.5/SMS).toFixed(6)},q.z-.002));
  return s*.25;
}
`;
  const wp=gl.createProgram(),wf=cmp(gl.FRAGMENT_SHADER,CM+`in vec3 P,G;in vec4 A;out vec4 o;
vec3 sky(vec3 v){return mix(vec3(.035,.08,.13),vec3(.004,.012,.035),sqrt(max(v.y,0.)))+vec3(.25,.4,.55)*pow(max(dot(v,md),0.),6.)*.35;}
void main(){
  vec3 c;float a=0.,tau=-log(max(k,.002))/6.,ds=length(P-cam);
  if(M==7){o=vec4(0);return;} // shadow pass: depth only
  if(M==4){ // sky: moon, its halo, drifting clouds, stars that twinkle with the treble. Alpha = how much light comes from here (feeds the light shafts)
    vec3 v=normalize(cf+P.x*cr+P.y*cu);float m=max(dot(v,md),0.),dc=smoothstep(.99955,.9997,m);
    vec2 s=v.xz/(abs(v.y)+.15)*40.,w=v.xz/(abs(v.y)+.3)*.13+t*.002;ivec2 ci=ivec2(floor(s));
    float cl=smoothstep(.42,.75,nz(w)*.65+nz(w*2.9+.3)*.35)*smoothstep(0.,.2,v.y);
    c=sky(v)+step(.985,H(ci,9))*smoothstep(.35,0.,length(fract(s)-.5))*(.4+.6*B[24+int(H(ci,10)*8.)])*step(0.,v.y)*(1.-cl)
      +vec3(1,.96,.85)*dc*1.6+vec3(.5,.65,.8)*pow(m,220.)*.6;
    c=mix(c,vec3(.03,.05,.08)+vec3(.45,.55,.7)*(pow(m,5.)*.5+.04)*(1.-cl*.6),cl*.85); // clouds: dark bodies, moonlit where they are thin and near the moon
    o=vec4(c,(dc+.6*pow(m,40.)+.06)*(1.-.6*cl));return;
  }
  if(M==5){float d=dot(A.xy,A.xy);o=vec4(pal(h+A.z*.009)*(.05+.5*B[int(A.z)])*exp(-d*3.5)*(1.-d)*exp(-ds*.012),0);return;} // halo of light around a big mushroom
  if(M==3){float d=dot(A.xy,A.xy);o=vec4(pal(h+A.z*.3)*exp(-d*5.)*(1.-smoothstep(.8,1.,d))*(.5+.5*sin(t*3.+A.z*40.))*exp(-ds*.02),0);return;} // firefly
  if(M==0){ // ground: moss and bare soil in patches, moonlight with shadows, the glow of the mushrooms
    vec2 q=P.xz;float e=.15,sp=H(ivec2(floor(q*7.)),8),pt=nz(q*.05),fi=nz(q*.6);
    vec3 N=normalize(vec3(hT(q-vec2(e,0))-hT(q+vec2(e,0))+(fi-.5)*.3,2.*e,hT(q-vec2(0,e))-hT(q+vec2(0,e))+(nz(q*.6+.5)-.5)*.3));vec4 g=glow(q);
    c=mix(mix(vec3(.012,.035,.028),vec3(.04,.035,.03),smoothstep(.45,.6,pt)),vec3(.06,.06,.055),smoothstep(1.6,.4,abs(q.x-px(q.y))))*(.5+.6*sp+.6*fi);
    c=c*(.22+shd(P+N*.05)*max(dot(N,md),0.)*vec3(.5,.7,1)*3.)*g.a+g.rgb*(.12+.1*sp)+pal(h+.5)*exp(-abs(length(q-cam.xz)-tau*30.)*.8)*sqrt(k)*.1;
  }else if(M==1){ // grass: dark at the foot, tips catch the moon and glow with their band; a few carry a glowing flower
    float v=A.x,b=B[int(A.y)];
    c=mix(vec3(.006,.02,.018),vec3(.03,.09,.06),v)*(.4+1.5*v)*(.22+A.z*1.1)*(.7+.6*fract(A.y*.37))+G*(.15+.3*v)+pal(h+A.y*.009)*v*v*v*(.03+.9*b*b)+vec3(.1,.15,.2)*v*v*A.z
      +A.w*step(.6,v)*pal(h+A.y*.009+.45)*(.25+1.2*b);
  }else{ // mushroom: stem, gills (the lamp), cap with glowing spots whose rim lets the light through
    vec3 N=normalize(G),V=normalize(cam-P),pc=pal(h+A.y*.009);if(dot(N,V)<0.)N=-N;
    float v=A.x,lv=B[int(A.y)],mo=max(dot(N,md),0.)*shd(P+N*.08),fb=nz(vec2(A.z*.32,v*1.5+A.y*.1));
    if(v<.55)c=vec3(.2,.24,.27)*(.5+fb)*(.06+mo*.6)+pc*(.05+lv)*smoothstep(.1,.55,v)*.5;
    else if(v<.7)c=pc*(.25+2.2*lv)*(.35+.65*abs(sin(A.z*24.)))*(.4+.6*smoothstep(.55,.7,v));
    else{vec2 q=vec2(A.z*1.2732,(v-.7)*16.);ivec2 ci=ivec2(floor(q));
      c=pc*.05*(.4+1.2*fb)+mix(vec3(.05,.07,.1),pc,.3)*(.4+1.2*fb)*mo*1.5+pc*smoothstep(.3,.15,length(fract(q)-.5-.3*(vec2(H(ci,11),H(ci,12))-.5)))*step(.4,H(ci,13))*(.2+1.8*lv)
        +pc*(.15+lv)*exp(-(v-.7)*22.);}
    c+=vec3(.3,.45,.6)*pow(1.-max(dot(N,V),0.),3.)*.25*(.3+mo);
  }
  // fog: far things sink into the night, brighter towards the moon; a layer of drifting mist lies on the ground
  float mi=exp(-max(P.y-hp(P.z),0.)*.6)*(.3+.7*nz(P.xz*.013+t*.004));
  o=vec4(mix(c,sky(normalize(vec3(P.x-cam.x,.03*ds,P.z-cam.z)))*(1.+mi*.3),1.-exp(-ds*(.018+.02*mi))),a);
}`);
  gl.attachShader(wp,cmp(gl.VERTEX_SHADER,CM+`out vec3 P,G;out vec4 A;
vec2 prof(float v,float m,float R,float sr,float dh){ // outline of a mushroom, turned around its axis: radius and height along v (stem that flares into the cap, gills, cap; dh = how domed the cap is)
  if(v<.55){float s=v/.55;return vec2(sr*(1.6-1.1*s+.5*s*s+.9*pow(s,6.)),s*.84*m);}
  if(v<.7){float s=(v-.55)/.15;return vec2(mix(sr,R,s),m*(.84-.07*s*s));}
  float a=(v-.7)/.3*1.5708;return vec2(R*cos(a)+.001,m*.77+R*dh*sin(a));
}
void main(){
  int i=gl_VertexID,n=gl_InstanceID,j=i%6;vec3 p;A=vec4(0);G=vec3(0);
  vec2 cn=vec2(j==1||j>3,j==2||j==3||j==5); // corner of a quad made of two triangles
  if(M==4){gl_Position=vec4(vec2(i%2,i/2)*4.-1.,1,1);P=gl_Position.xyz;return;}
  if(M==0)p.xz=vec2(ivec2(i/6%96,i/6/96)+ivec2(floor(cam.xz))-ivec2(48,6))+cn,p.y=hT(p.xz); // 96 x 110 cells of 1 m that follow the camera
  else if(M==1){ // one blade per cell of a jittered grid around the camera: a strip of 7 vertices, bent by wind and by the kick wave; tall in some patches, short in others
    ivec2 c=ivec2(n%GX,n/GX)+ivec2(floor(cam.xz/GS))-ivec2(GX/2,8);
    vec2 q=(vec2(c)+vec2(H(c,1),H(c,2)))*GS,f;
    float v=float(i/2)/3.,sd=i==6?0.:float(i%2)*2.-1.,ds=length(q-cam.xz),b=floor(H(c,3)*32.),L=lev(q.y,b),an=H(c,5)*6.283,tau=-log(max(k,.002))/6.,fl=step(H(c,6),.012),
      hh=(.2+.7*H(c,4))*(.45+1.3*L)*(.3+1.4*nz(q*.04+.37))*(.25+.75*smoothstep(.6,3.,abs(q.x-px(q.y))))*smoothstep(44.,34.,ds)*(1.-fl*.35),
      wd=sin(t*1.3+q.x*.31+q.y*.23)*.1+.15+.5*exp(-abs(ds-tau*30.)*.6)*sqrt(k);
    f=vec2(cos(an),sin(an));
    p=vec3(q.x,hT(q),q.y)+vec3(f.y,0,-f.x)*sd*(.022+ds*.0015)*(fl>0.&&i>3?1.3:1.-v*.8)+vec3(f.x,0,f.y)*wd*v*v*hh+vec3(0,v*hh,0); // wider with distance: never thinner than a pixel
    A=vec4(v,b,shd(p+vec3(0,.3,0)),fl);G=glow(q).rgb;
  }else if(M==2||M==6||M==7){ // big mushrooms (also for the shadow map) and small ones: the same shape at two sizes
    ivec2 c=M==6?ivec2(n%UX,n/UX)+ivec2(floor(cam.xz/US))-ivec2(UX/2,3):ivec2(n%TX,n/TX)+ivec2(floor(cam.xz/CS))-ivec2(TX/2,2);vec4 m=M==6?mini(c):mush(c);
    if(m.z==0.){gl_Position=vec4(2,2,2,1);return;}
    float u=(float(i/6%SU)+cn.x)/float(SU)*6.2832,v=(float(i/6/SU)+cn.y)/float(SV),R=capR(c,m.z),sr=.05*m.z+(M==6?.01:.06),ba=H(c,7)*6.283,dh=.25+.75*H(c,8);
    vec2 a=prof(v,m.z,R,sr,dh),b=prof(v+.01,m.z,R,sr,dh)-a,bd=vec2(cos(ba),sin(ba))*(.12+sin(t*.7+ba)*.02)*m.z*pow(a.y/m.z,2.);vec3 e=vec3(cos(u),0,sin(u));
    p=vec3(m.x,hT(m.xy)-.1*m.z*.2,m.y)+e*a.x+vec3(bd.x,a.y,bd.y);
    G=cross(vec3(e.x*b.x,b.y,e.z*b.x),vec3(-e.z,0,e.x));A=vec4(v,m.w,u,0);
  }else if(M==5){ // halo: a soft disc of light at the gills of every big mushroom, always facing the camera
    ivec2 c=ivec2(n%TX,n/TX)+ivec2(floor(cam.xz/CS))-ivec2(TX/2,2);vec4 m=mush(c);
    if(m.z==0.){gl_Position=vec4(2,2,2,1);return;}
    p=vec3(m.x,hT(m.xy)+m.z*.8,m.y);A=vec4(cn*2.-1.,m.w,0);P=p;
    gl_Position=VP*vec4(p,1);gl_Position.xy+=(cn-.5)*vec2(r.y/r.x,1)*capR(c,m.z)*7.;return;
  }else{ // fireflies drift in a box that wraps around the camera; they swell with the treble
    vec3 q=vec3(H(ivec2(n,1),1),H(ivec2(n,2),2),H(ivec2(n,3),3)),bx=vec3(44,7,56);
    q=q*bx+vec3(sin(t*.3+float(n))*1.5,t*.15*(.3+q.x),cos(t*.23+float(n)*1.7)*1.5);
    p=cam+mod(q-cam,bx)-bx*vec3(.5,0,.12);p.y=hT(p.xz)+.2+mod(q.y,7.);
    A=vec4(cn*2.-1.,H(ivec2(n,4),4),0);P=p;
    gl_Position=VP*vec4(p,1);gl_Position.xy+=(cn-.5)*vec2(r.y/r.x,1)*(.1+.25*B[20+n%12]);return;
  }
  P=p;gl_Position=VP*vec4(p,1);
}`));
  gl.attachShader(wp,wf);gl.linkProgram(wp);
  // last pass: the picture plus bloom (its own blurred copies), light shafts (the sky's light smeared away from the moon, so anything in front of it casts dark streaks), vignette, grain, tone mapping
  const fin=shader(`uniform sampler2D X;
void main(){
  vec2 q=gl_FragCoord.xy/r,d=(vec2(m,p)-q)/20.;
  float g=0.,n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+t)*43758.5);
  for(int i=0;i<20;i++)g+=texture(X,q+d*(float(i)+n)).a*(1.-float(i)/20.);
  vec3 bl=textureLod(X,q,2.5).rgb+textureLod(X,q,4.).rgb+textureLod(X,q,5.5).rgb,
    c=(textureLod(X,q,0.).rgb+max(bl/3.-.1,0.)*1.1+vec3(.55,.75,1)*g*.13*(1.+k*.6))*(1.-.7*dot(q-.5,q-.5));
  o=vec4(1.-exp(-c*2.2)+(n-.5)*.012,1);
}`,WPX,1);
  if(!gl.getProgramParameter(wp,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(wp),gl.getShaderInfoLog(wf));
  else if(fin){
    const L={},U=n=>L[n]??=gl.getUniformLocation(wp,n),va=gl.createVertexArray(),fa=gl.createFramebuffer(),fb=gl.createFramebuffer(),fs2=gl.createFramebuffer(),rc=gl.createRenderbuffer(),rd=gl.createRenderbuffer(),tx=gl.createTexture();
    const pX=z=>sin(z*.031)*9+sin(z*.013)*14,hP=z=>sin(z*.043)*2,nr=a=>{const l=hypot(...a);return a.map(v=>v/l)},cx=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
    const MD=nr([.25,.3,1]),LR=nr(cx(MD,[0,1,0])),LU=cx(LR,MD);let fw=0,fh=0;
    // made once: the noise texture (unit 4) and the shadow map (unit 5, a depth texture the shader compares against)
    const tex=(u,f)=>{gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());f();gl.activeTexture(gl.TEXTURE0)};
    tex(4,()=>{gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,256,256,0,gl.RED,gl.UNSIGNED_BYTE,NZ);gl.generateMipmap(gl.TEXTURE_2D)});
    tex(5,()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,SMS,SMS,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fs2);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,gl.getParameter(gl.TEXTURE_BINDING_2D),0);gl.drawBuffers([gl.NONE]);gl.bindFramebuffer(gl.FRAMEBUFFER,null)});
    tex(8,()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1,1,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE)});
    WOOD=SC.push(()=>{
      const gs=min(1,Math.sqrt(WPX*QS/W/H)),w=W*gs|0,hh=H*gs|0;
      if(w!=fw||hh!=fh){ // (re)build the buffers: 4x anti-aliased colour + depth, and a plain texture (unit 3) the last pass reads
        fw=w;fh=hh;
        gl.bindRenderbuffer(gl.RENDERBUFFER,rc);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.RGBA8,w,hh);
        gl.bindRenderbuffer(gl.RENDERBUFFER,rd);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.DEPTH_COMPONENT24,w,hh);
        gl.bindFramebuffer(gl.FRAMEBUFFER,fa);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,rc);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rd);
        gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,hh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);
        gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tx,0);
      }
      // camera: walks the path at eye height, looks a little up the path so caps and moon are in view; transition zoom and roll are done by the camera
      const z=tt*SPD,eye=[pX(z),hP(z)+1.7+sin(t*.5)*.12,z],f=nr([pX(z+12)-eye[0],hP(z+12)+3.6-eye[1],12]),s0=nr(cx(f,[0,1,0])),u0=cx(s0,f),sd=s0.map((v,i)=>v*cos(roll)+u0[i]*sin(roll)),up=cx(sd,f),
        n=.1,fr=300,ft=ts/Math.tan(.55),fx=ft*H/W,za=(fr+n)/(fr-n),mf=dt3(f,MD),M=U('M'),
        // the moon's view for the shadow map: a 140 m square around a spot 45 m ahead, moved in whole texels so the shadows don't swim
        q=140/SMS,ce=[eye[0],0,z+45],lx=Math.round(dt3(LR,ce)/q)*q,ly=Math.round(dt3(LU,ce)/q)*q,lz=dt3(MD,ce);
      gl.useProgram(wp);gl.bindVertexArray(va);gl.enable(gl.DEPTH_TEST);
      gl.uniform3fv(U('cam'),eye);gl.uniform3fv(U('md'),MD);gl.uniform3fv(U('cr'),sd.map(v=>v/fx));gl.uniform3fv(U('cu'),up.map(v=>v/ft));gl.uniform3fv(U('cf'),f);
      gl.uniform2f(U('r'),w,hh);gl.uniform1f(U('t'),t);gl.uniform1f(U('k'),kick);gl.uniform1f(U('h'),hue/360);gl.uniform1f(U('mk'),SOK);gl.uniform1f(U('LEN'),dur()*SPD);gl.uniform1fv(U('B'),B);
      gl.uniform1i(U('S'),2);gl.uniform1i(U('NZ'),4);gl.uniform1i(U('SM'),5);gl.uniform1i(U('SU'),14);gl.uniform1i(U('SV'),20);
      const LVm=[LR[0]/70,LU[0]/70,-MD[0]/200,0,LR[1]/70,LU[1]/70,-MD[1]/200,0,LR[2]/70,LU[2]/70,-MD[2]/200,0,-lx/70,-ly/70,lz/200,1];
      gl.uniformMatrix4fv(U('LV'),false,LVm);gl.uniformMatrix4fv(U('VP'),false,LVm);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fs2);gl.viewport(0,0,SMS,SMS);gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.uniform1i(U('SM'),8);gl.uniform1i(M,7);gl.drawArraysInstanced(gl.TRIANGLES,0,14*20*6,TX*TZ);gl.uniform1i(U('SM'),5); // (the map can't be bound while it is drawn into; unit 8 holds a 1 x 1 stand-in)
      gl.bindFramebuffer(gl.FRAMEBUFFER,fa);gl.viewport(0,0,w,hh);
      gl.uniformMatrix4fv(U('VP'),false,[fx*sd[0],ft*up[0],za*f[0],f[0],fx*sd[1],ft*up[1],za*f[1],f[1],fx*sd[2],ft*up[2],za*f[2],f[2],-fx*dt3(sd,eye),-ft*dt3(up,eye),-za*dt3(f,eye)-2*fr*n/(fr-n),-dt3(f,eye)]);
      gl.clear(gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);gl.uniform1i(M,4);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);
      gl.uniform1i(M,0);gl.drawArrays(gl.TRIANGLES,0,96*110*6);
      gl.uniform1i(M,2);gl.drawArraysInstanced(gl.TRIANGLES,0,14*20*6,TX*TZ);
      gl.uniform1i(U('SU'),8);gl.uniform1i(U('SV'),10);gl.uniform1i(M,6);gl.drawArraysInstanced(gl.TRIANGLES,0,8*10*6,UX*UZ);
      gl.uniform1i(M,1);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,7,GX*GZ);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false);
      gl.uniform1i(M,5);gl.drawArraysInstanced(gl.TRIANGLES,0,6,TX*TZ);
      gl.uniform1i(M,3);gl.drawArraysInstanced(gl.TRIANGLES,0,6,NF);
      gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER,fa);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,fb);gl.blitFramebuffer(0,0,w,hh,0,0,w,hh,gl.COLOR_BUFFER_BIT,gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,tx);gl.generateMipmap(gl.TEXTURE_2D);gl.activeTexture(gl.TEXTURE0); // blurred copies for the bloom (unit 3 is shared with the dive: each binds its own picture before its last pass)
      gm=.5+.5*fx*dt3(sd,MD)/mf;gp=.5+.5*ft*dt3(up,MD)/mf;fin(); // where the moon is on screen
    })-1;
  }
}
