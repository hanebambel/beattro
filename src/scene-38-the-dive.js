// ---- 38 the dive: the song as a dive. Where the song is loud the camera drifts through sunlit shallows: light shafts fall through the rippling surface,
// its light pattern runs over the sand, schools of fish circle. Where the song is quiet it sinks into the deep, where the only light is alive.
// Everything that lives here is the music: the reef is an equaliser (thousands of tube sponges in colonies, every colony a band: they stretch and their
// rims glow with it), every jellyfish belongs to a band and contracts with it (the big ones are the bass), the sea whips' tips glow with theirs, the fish
// scatter on every kick, the drifting snow sparkles with the treble. Real geometry like the glow forest (all of it built in the vertex shader from the
// vertex and instance number): seabed, 4,500 tubes, 50,000 whips, 5,400 fish, 40 jellyfish with tentacles, particles; drawn 4x anti-aliased, then a last
// pass adds glow and a haze of light from the surface. The shafts of light are 90 long sheets hanging in the water; whatever swims in front covers them.
let DIVE=-1;
if(gl){
  const TX=64,TZ=70,WX=200,WZ=260,NFI=5400,NJ=40,NS=3500,WPX=GLPX*1.5; // tube grid, whip grid, fish, jellyfish, snow, pixel budget
  const CM=`precision highp float;precision highp int;
uniform mat4 VP;uniform vec3 cam,cr,cu,cf,sn;uniform vec2 r;uniform float t,k,l,h,su,B[32];uniform int M;uniform sampler2D NZ; // sn: where the sun is; su: 1 = sunlit shallows, 0 = the deep
const int TX=${TX},WX=${WX};
vec3 pal(float x){return .5+.5*cos(6.283*(x+vec3(0,.33,.67)));}
uint hu(uvec2 p){p*=uvec2(1597334673u,3812015801u);uint n=(p.x^p.y)*1597334673u;n^=n>>15;n*=2246822519u;n^=n>>13;return n;}
float H(ivec2 c,int s){return float(hu(uvec2(c+s*ivec2(7919,104729)))>>8)/16777216.;}
float Hf(float n,float s){return fract(sin(n*127.1+s*311.7)*43758.5);}
float nz(vec2 p){return textureLod(NZ,p,0.).r;}
float hB(vec2 p){return (nz(p*.012)-.5)*5.+(nz(p*.05+3.)-.5)*1.2+sin(p.x*2.2+nz(p*.06)*9.+p.y*.7)*.04;} // the seabed: dunes with ripples
float caus(vec2 p){ // the light pattern the waves throw on what lies below: bright lines where three warped wave fields cancel
  p*=.55;vec2 q=p;float a=0.;
  for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.7+t*.3+float(i)),cos(q.x*1.9-t*.26))*.55;a+=abs(sin(q.x*2.1)+sin(q.y*2.3));}
  return pow(max(1.-a/4.5,0.),4.)*3.5;
}
vec3 wcol(vec3 v){return mix(mix(vec3(0,.006,.02),vec3(0,.16,.26),su),mix(vec3(0,.02,.05),vec3(.1,.55,.6),su),smoothstep(-.3,.9,v.y));} // the water's colour in a direction
vec4 tube(ivec2 c){ // the tube sponge of a .9 m cell: xz position, height (0 = none), band. They stand in colonies, and a colony shares a band
  vec2 p=(vec2(c)+.15+.7*vec2(H(c,1),H(c,2)))*.9;float cl=nz(p*.03+.4);
  return vec4(p,step(.52,cl)*step(H(c,3),(cl-.52)*4.+.15)*(.25+.9*H(c,4)),clamp(floor(nz(p*.017+7.)*40.-4.),0.,31.));
}
void jelly(int n,out vec3 p0,out float sz,out float pu,out float b){ // jellyfish n: where it is, how big, how far contracted, which band
  float f=float(n);vec3 bx=vec3(34,13,38),q=vec3(Hf(f,1.),Hf(f,2.),Hf(f,3.))*bx+vec3(sin(t*.1+f)*2.,t*.12*(.5+Hf(f,4.)),0);
  p0=cam+mod(q-cam,bx)-bx*vec3(.5,.25,.2);p0.y=max(p0.y,hB(p0.xz)+1.6);
  b=float(n%32);sz=mix(1.3,.24,pow(b/31.,.6))*(.8+.4*Hf(f,5.));pu=clamp(B[n%32]*1.3+(b<6.?k*.6:0.),0.,1.);
}
`;
  const dp=gl.createProgram(),df=cmp(gl.FRAGMENT_SHADER,CM+`in vec3 P,G;in vec4 A;out vec4 o;
void main(){
  vec3 c;float ds=length(P-cam),fg=exp(-ds*mix(.055,.028,su));
  if(M==4){ // the water, and above it the surface seen from below: only in the cone overhead, rippling, with the sun as a glare in it. Alpha = the light that feeds the shafts
    vec3 v=normalize(cf+P.x*cr+P.y*cu);vec2 sp=cam.xz+v.xz*mix(70.,9.,su)/max(v.y,.02);
    float wv=nz(sp*.02+t*.01)+nz(sp*.05-t*.013)*.5,wn=smoothstep(.5,.8,v.y),m=max(dot(v,sn),0.);
    o=vec4(wcol(v)+su*wn*(vec3(.25,.6,.6)*(.3+wv*.9)+vec3(1,.95,.8)*pow(m,24.)*(1.5+wv)),su*wn*(.2+.9*pow(m,10.))*(.4+wv));return;
  }
  if(M==5){ // a jellyfish's bell: glass that glows at its outline, with canals running down from the top and four bright petals under it; brighter as it contracts
    vec3 N=normalize(G),pc=pal(h+A.y*.012+.05);float fr=pow(1.-abs(dot(N,normalize(cam-P))),2.);
    o=vec4((pc*(fr*1.1+.12+pow(abs(sin(A.w*8.)),8.)*smoothstep(.2,.9,A.x)*.35)*(.5+.9*A.z)+mix(pc,vec3(1),.5)*smoothstep(.5,.1,A.x)*(.5+.5*cos(A.w*4.))*(.3+1.5*A.z))*mix(1.,.5,su)*fg*smoothstep(.4,2.5,ds),0);return;
  }
  if(M==6){o=vec4(pal(h+A.y*.012+.05)*(.22+.5*A.z)*(1.-A.x*.6)*(1.-A.w*A.w)*mix(1.,.5,su)*fg*smoothstep(.4,2.5,ds),0);return;} // a tentacle
  if(M==8){float a=1.-A.x*A.x;o=vec4(vec3(.55,.95,.85)*a*a*su*(1.-A.y)*(.02+.14*A.z)*fg*smoothstep(.5,3.,ds)*(1.+.5*k),0);return;} // a shaft of light
  if(M==7){float d=dot(A.xy,A.xy);o=vec4(mix(vec3(.3,.8,1)*(.3+2.*B[26]),vec3(.5),su)*exp(-d*5.)*(1.-smoothstep(.8,1.,d))*(.4+.6*sin(t*2.+A.z*40.))*fg,0);return;} // drifting snow: in the deep it glows
  if(M==0){ // the seabed: sand, the light pattern of the waves, the glow of the tubes standing on it and the dark at their feet, sparks in the deep on every kick
    vec2 q=P.xz;float e=.12,sp=H(ivec2(floor(q*9.)),8),cs=caus(q)*su;ivec2 c0=ivec2(floor(q/.9-.5));
    vec3 N=normalize(vec3(hB(q-vec2(e,0))-hB(q+vec2(e,0)),2.*e,hB(q-vec2(0,e))-hB(q+vec2(0,e))));
    c=mix(vec3(.03,.05,.07),vec3(.46,.4,.3),su)*vec3(.5,.85,1)*(.75+.35*sp)*(.35+.65*max(dot(N,sn),0.))*(1.+cs*1.3)+vec3(.3,.6,.7)*cs*.1;
    for(int i=0;i<4;i++){vec4 tb=tube(c0+ivec2(i%2,i/2));if(tb.z>0.){float d=length(q-tb.xy);c=c*(1.-.5*exp(-d*d*30.))+pal(h+tb.w*.012)*(.05+1.2*B[int(tb.w)])*(1.-su*.8)*.05/(d*d+.05);}}
    c+=vec3(.2,.7,1)*step(.985,sp)*k*(1.-su);
  }else if(M==1){ // a tube sponge: dark at the foot, its rim glows with its band
    vec3 pc=pal(h+A.y*.012);float v=A.x;
    c=mix(vec3(.25,.12,.2),pc*.5,.5)*(.3+.7*v)*(.25+su*(.5+.6*max(dot(normalize(G),sn),0.)+caus(P.xz)*v))+pc*(.2+2.2*A.z)*smoothstep(.7,1.,v)*(1.2-su*.7)+pc*abs(sin(v*20.))*A.z*.25;
  }else if(M==2){float v=A.x,b=B[int(A.y)];c=mix(vec3(.01,.05,.04),vec3(.05,.3,.18),v)*(.3+.9*su)*vec3(.6,.9,1)+pal(h+A.y*.012)*v*v*v*(.05+1.1*b*b)*(1.3-su);} // a sea whip: its tip glows
  else{ // a fish: lit from above, the wave pattern shimmers on its back; in the deep only a glowing line along its side shows
    vec3 N=normalize(G);float j=A.y;
    c=(j<.5?vec3(.55,.7,.8):j<1.5?vec3(.9,.72,.2):vec3(.9,.4,.5))*(.75+.25*step(.5,fract(A.x*2.5+A.z)))*vec3(.6,.9,1)*su*(.3+.7*max(dot(N,sn),0.)+caus(P.xz+P.y)*.6*max(N.y,0.))
      +vec3(.02,.03,.04)+pal(h+j*.2+.1)*exp(-abs(A.w)*40.)*(1.-su)*(.5+1.5*B[int(4.+j*9.)]);
  }
  o=vec4(mix(wcol(normalize(P-cam)),c,fg),0);
}`);
  gl.attachShader(dp,cmp(gl.VERTEX_SHADER,CM+`out vec3 P,G;out vec4 A;
const vec3 FV[9]=vec3[9](vec3(0,0,1),vec3(0,0,-.8),vec3(0,.3,.15),vec3(0,-.26,.15),vec3(-.11,0,.15),vec3(.11,0,.15),vec3(0,0,-.7),vec3(0,.33,-1.35),vec3(0,-.33,-1.35)); // a fish: nose, tail root, back, belly, two flanks, tail fin
const int FI[27]=int[27](0,2,4,0,5,2,0,4,3,0,3,5,1,4,2,1,2,5,1,3,4,1,5,3,6,7,8);
vec3 crv(float s,float j,vec3 c0){float R=6.+2.5*j;return c0+vec3(cos(s)*R*1.4,sin(s*2.+j)*1.2,sin(s)*R*.8);} // the course of school j: a ring ahead of the camera
void main(){
  int i=gl_VertexID,n=gl_InstanceID,j=i%6;vec3 p=vec3(0);A=vec4(0);G=vec3(0,1,0);
  vec2 cn=vec2(j==1||j>3,j==2||j==3||j==5); // corner of a quad made of two triangles
  if(M==4){gl_Position=vec4(vec2(i%2,i/2)*4.-1.,1,1);P=gl_Position.xyz;return;}
  if(M==0)p.xz=vec2(ivec2(i/6%96,i/6/96)+ivec2(floor(cam.xz))-ivec2(48,8))+cn,p.y=hB(p.xz); // 96 x 110 cells of 1 m that follow the camera
  else if(M==1){ // a tube: 8 sides, 5 rings, flaring at the rim; as tall as its band is loud, swaying a little
    ivec2 c=ivec2(n%TX,n/TX)+ivec2(floor(cam.xz/.9))-ivec2(TX/2,6);vec4 tb=tube(c);
    if(tb.z==0.){gl_Position=vec4(2,2,2,1);return;}
    float u=(float(i/6%8)+cn.x)*.7854,v=(float(i/6/8)+cn.y)/5.,lv=B[int(tb.w)],ht=tb.z*(.5+1.6*lv),rd=(.07+.1*H(c,5))*(.75+.3*v+.9*pow(v,8.));
    p=vec3(tb.x,hB(tb.xy)-.05,tb.y)+vec3(cos(u)*rd,v*ht,sin(u)*rd)+vec3(sin(t*.8+tb.x*.3),0,cos(t*.6+tb.y*.3))*.06*v*v*ht;
    G=vec3(cos(u),.15,sin(u));A=vec4(v,tb.w,lv,0);
  }else if(M==2){ // a sea whip: a strip of 7 vertices in a meadow, bent by the current and by the wave every kick sends out
    ivec2 c=ivec2(n%WX,n/WX)+ivec2(floor(cam.xz/.22))-ivec2(WX/2,14);vec2 q=(vec2(c)+vec2(H(c,1),H(c,2)))*.22,f;
    float v=float(i/2)/3.,sd=i==6?0.:float(i%2)*2.-1.,ds=length(q-cam.xz),an=H(c,5)*6.283,tau=-log(max(k,.002))/6.,
      hh=(.25+.9*H(c,4))*smoothstep(.45,.6,nz(q*.025+11.))*smoothstep(46.,36.,ds),wd=sin(t*1.1+q.x*.4+q.y*.3)*.25+.25+.5*exp(-abs(ds-tau*25.)*.6)*sqrt(k);
    if(hh<.06){gl_Position=vec4(2,2,2,1);return;}
    f=vec2(cos(an),sin(an));
    p=vec3(q.x,hB(q),q.y)+vec3(f.y,0,-f.x)*sd*(.012+ds*.0012)*(1.-v*.8)+vec3(f.x,0,f.y)*wd*v*v*hh+vec3(0,v*hh,0);
    A=vec4(v,floor(H(c,3)*32.),0,0);
  }else if(M==3){ // a fish: three schools, each strung along its ring in a tube around the course; on a kick the tube swells: they scatter
    float jj=float(n%3),f=float(n/3),dr=jj==1.?-1.:1.,s=t*(.25+.08*jj)*dr+(Hf(f,1.)-.5)*1.9+.04*sin(t*2.+f),ro=(.25+1.6*sqrt(Hf(f,2.)))*(1.+.7*k)*(.8+.2*jj),ph=Hf(f,3.)*6.283+t*(Hf(f,4.)-.5)*1.2;
    vec3 c0=cam+normalize(vec3(cf.x,0,cf.z))*13.+vec3(0,1.5+jj*1.2,0),T=normalize(crv(s+.01,jj,c0)-crv(s-.01,jj,c0))*dr,Bn=normalize(cross(T,vec3(0,1,0))),Nn=cross(Bn,T),lv=FV[FI[i]];
    lv.x+=sin(t*9.+f*3.+lv.z*3.)*.1*(1.-lv.z)*.5; // the tail beats
    p=crv(s,jj,c0)+(Nn*cos(ph)*.6+Bn*sin(ph))*ro+(Bn*lv.x+Nn*lv.y+T*lv.z)*(.16+.14*Hf(f,5.));
    G=Bn*lv.x*3.+Nn*lv.y*1.5+T*lv.z*.2;A=vec4(lv.z,jj,Hf(f,6.),lv.y);
  }else if(M==5){ // a bell: a flattened dome that curls in at the rim; contracting, the rim narrows and the dome rises
    vec3 p0;float sz,pu,b;jelly(n,p0,sz,pu,b);
    float ph=(float(i/6%16)+cn.x)*.3927,th=(float(i/6/16)+cn.y)*.19,rr=sin(th)*(1.-.32*pu*smoothstep(.5,1.9,th))*(1.+.05*sin(ph*8.)*smoothstep(1.2,1.9,th));
    p=p0+vec3(cos(ph)*rr,cos(th)*(.75+.2*pu),sin(ph)*rr)*sz;G=vec3(cos(ph)*sin(th),cos(th),sin(ph)*sin(th));A=vec4(th/1.9,b,pu,ph);
  }else if(M==6){ // a tentacle: 8 per jellyfish, a ribbon of 16 segments hanging from the rim, a wave running down it
    vec3 p0;float sz,pu,b;jelly(n/8,p0,sz,pu,b);
    float v=float(i/2)/16.,sd=float(i%2)*2.-1.,f=float(n),ph=float(n%8)*.7854+Hf(float(n/8),7.),rr=.946*(1.-.32*pu);
    p=p0+vec3(cos(ph)*rr,-.25,sin(ph)*rr)*sz+vec3(sin(t*1.3+v*5.+f)*.25*v,-v*(2.+2.5*Hf(f,8.)),cos(t*1.1+v*4.+f*1.7)*.25*v)*sz+normalize(cross(cf,vec3(0,1,0)))*sd*(.02*sz*(1.-v*.7)+.004);
    A=vec4(v,b,pu,sd);
  }else if(M==8){ // a shaft of light: a long narrow sheet hanging from above along the sun's direction, turned towards the camera, widening downwards; the waves make it come and go
    float f=float(n);vec3 bx=vec3(46,1,46),tp=cam+mod(vec3(Hf(f,11.),0,Hf(f,12.))*bx-cam,bx)-bx*vec3(.5,0,.3);tp.y=cam.y+11.;
    vec3 c0=tp-sn*22.*cn.y;
    p=c0+normalize(cross(sn,c0-cam))*(cn.x-.5)*(.3+1.3*Hf(f,13.))*(1.+cn.y*1.5);
    A=vec4(cn.x*2.-1.,cn.y,smoothstep(.42,.7,nz(tp.xz*.04+t*.015)),0);
  }else{ // snow drifts in a box that wraps around the camera
    float f=float(n);vec3 q=vec3(Hf(f,1.),Hf(f,2.),Hf(f,3.)),bx=vec3(30,14,30);
    q=q*bx+vec3(sin(t*.2+f)*1.2,-t*.08*(.3+q.x),cos(t*.17+f*1.7)*1.2);
    p=cam+mod(q-cam,bx)-bx*vec3(.5,.4,.15);A=vec4(cn*2.-1.,Hf(f,4.),0);P=p;
    gl_Position=VP*vec4(p,1);gl_Position.xy+=(cn-.5)*vec2(r.y/r.x,1)*(.035+.05*Hf(f,5.));return;
  }
  P=p;gl_Position=VP*vec4(p,1);
}`));
  gl.attachShader(dp,df);gl.linkProgram(dp);
  // last pass: the picture plus the light shafts, glow from its own blurred copies, darker corners, tone mapping
  const fin=shader(`uniform sampler2D X;
void main(){
  vec2 q=gl_FragCoord.xy/r,d=(vec2(m,p)-q)/24.;
  float g=0.,n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+t)*43758.5);
  for(int i=0;i<24;i++)g+=texture(X,q+d*(float(i)+n)).a*(1.-float(i)/24.);
  vec3 c=(textureLod(X,q,0.).rgb+max((textureLod(X,q,3.).rgb+textureLod(X,q,4.5).rgb)*.5-.1,0.)+vec3(.5,.9,.85)*g*.07*(1.+k*.5))*(1.-.6*dot(q-.5,q-.5));
  o=vec4(1.-exp(-c*2.),1);
}`,WPX,1);
  if(!gl.getProgramParameter(dp,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(dp),gl.getShaderInfoLog(df));
  else if(fin){
    const L={},U=n=>L[n]??=gl.getUniformLocation(dp,n),va=gl.createVertexArray(),fa=gl.createFramebuffer(),fb=gl.createFramebuffer(),rc=gl.createRenderbuffer(),rd=gl.createRenderbuffer(),tx=gl.createTexture();
    const nr=a=>{const l=hypot(...a);return a.map(v=>v/l)},cx=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],SUN=nr([.3,.85,.45]);
    // the noise the shader reads from a texture, read here as well (the camera has to know how high the seabed is)
    const nzj=(X,Y)=>{X=X*256-.5;Y=Y*256-.5;const x0=floor(X),y0=floor(Y),fx=X-x0,fy=Y-y0,g=(a,b)=>NZ[(b&255)<<8|a&255]/255;return(g(x0,y0)*(1-fx)+g(x0+1,y0)*fx)*(1-fy)+(g(x0,y0+1)*(1-fx)+g(x0+1,y0+1)*fx)*fy},
      hB=(X,Z)=>(nzj(X*.012,Z*.012)-.5)*5+(nzj(X*.05+3,Z*.05+3)-.5)*1.2;
    let fw=0,fh=0,sv=.6,cy=3;
    DIVE=SC.push(()=>{
      const gs=min(1,Math.sqrt(WPX*QS/W/H)),w=max(1,W*gs|0),hh=max(1,H*gs|0);
      if(w!=fw||hh!=fh){ // (re)build the buffers: 4x anti-aliased colour + depth, and a plain texture the last pass reads
        fw=w;fh=hh;
        gl.bindRenderbuffer(gl.RENDERBUFFER,rc);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.RGBA8,w,hh);
        gl.bindRenderbuffer(gl.RENDERBUFFER,rd);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.DEPTH_COMPONENT24,w,hh);
        gl.bindFramebuffer(gl.FRAMEBUFFER,fa);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,rc);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rd);
        gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,tx);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,hh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);
        gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tx,0);
      }
      // how deep: the loudness of the song where it is now, compared with the rest of it (without an analysis it wanders between both worlds); the dark mood stays low
      sv+=((sdu&&(an||FAKE)?SL[min(SN-1,max(0,tt/dur()*SN|0))]:.55+.45*sin(t*.13))*(1-.65*dk)-sv)*min(1,dt*.5);
      // camera: drifts forward over the seabed, weaving, looking a little up towards the surface
      const z=t*1.2,X=sin(t*.07)*6,yw=sin(t*.05)*.5,gy=max(hB(X,z),hB(X,z+3),hB(X+sin(yw)*3,z+6))+2.7;cy+=(gy-cy)*min(1,dt*1.2);
      const eye=[X,cy+sin(t*.4)*.15,z],f=nr([sin(yw),.17+.06*sin(t*.11),cos(yw)]),s0=nr(cx(f,[0,1,0])),u0=cx(s0,f),sd=s0.map((v,i)=>v*cos(roll)+u0[i]*sin(roll)),up=cx(sd,f),
        n=.1,fr=200,ft=ts/Math.tan(.6),fx=ft*H/W,za=(fr+n)/(fr-n),mf=dt3(f,SUN),M=U('M'),su=sv*sv*(3-2*sv);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fa);gl.viewport(0,0,w,hh);gl.useProgram(dp);gl.bindVertexArray(va);gl.disable(gl.BLEND);
      gl.uniformMatrix4fv(U('VP'),false,[fx*sd[0],ft*up[0],za*f[0],f[0],fx*sd[1],ft*up[1],za*f[1],f[1],fx*sd[2],ft*up[2],za*f[2],f[2],-fx*dt3(sd,eye),-ft*dt3(up,eye),-za*dt3(f,eye)-2*fr*n/(fr-n),-dt3(f,eye)]);
      gl.uniform3fv(U('cam'),eye);gl.uniform3fv(U('sn'),SUN);gl.uniform3fv(U('cr'),sd.map(v=>v/fx));gl.uniform3fv(U('cu'),up.map(v=>v/ft));gl.uniform3fv(U('cf'),f);
      gl.uniform2f(U('r'),w,hh);gl.uniform1f(U('t'),t);gl.uniform1f(U('k'),kick);gl.uniform1f(U('l'),min(1,lvl));gl.uniform1f(U('h'),hue/360);gl.uniform1f(U('su'),su);gl.uniform1fv(U('B'),B);gl.uniform1i(U('NZ'),4);
      gl.clear(gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);gl.uniform1i(M,4);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);
      gl.uniform1i(M,0);gl.drawArrays(gl.TRIANGLES,0,96*110*6);
      gl.uniform1i(M,1);gl.drawArraysInstanced(gl.TRIANGLES,0,240,TX*TZ);
      gl.uniform1i(M,2);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,7,WX*WZ);
      gl.uniform1i(M,3);gl.drawArraysInstanced(gl.TRIANGLES,0,27,NFI);
      gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.depthMask(false); // what glows is added: bells, tentacles, snow
      gl.uniform1i(M,5);gl.drawArraysInstanced(gl.TRIANGLES,0,960,NJ);
      gl.uniform1i(M,6);gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,34,NJ*8);
      gl.uniform1i(M,7);gl.drawArraysInstanced(gl.TRIANGLES,0,6,NS);
      gl.uniform1i(M,8);gl.drawArraysInstanced(gl.TRIANGLES,0,6,90);
      gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER,fa);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,fb);gl.blitFramebuffer(0,0,w,hh,0,0,w,hh,gl.COLOR_BUFFER_BIT,gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,tx);gl.generateMipmap(gl.TEXTURE_2D);gl.activeTexture(gl.TEXTURE0); // unit 3 is shared with the glow forest: each binds its own picture before its last pass
      gm=.5+.5*fx*dt3(sd,SUN)/mf;gp=.5+.5*ft*dt3(up,SUN)/mf;fin(); // where the sun is on screen
    })-1;
  }
}
