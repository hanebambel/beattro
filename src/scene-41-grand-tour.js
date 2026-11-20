// ---- 41 grand tour: a flight out of the solar system and on to a black hole, in five legs. 0: off from an orbit round the Earth, past the Moon. 1: through the
// asteroid belt and past Jupiter. 2: to Saturn and down through its rings. 3: past two comets to a space probe on its way out (a simplified model of
// our own of the Voyager probes). 4: faster than light (the stars drawn out into lines) to a black hole, round it and into it: the hole of scene 24, its disc the spectrum of the
// song (HOLE there; the picture is the hole's own in this leg, no sun and no lens). Everything is computed: spheres and the ring plane are hit exactly, the rocks sit in a grid the ray walks through,
// only the probe is ray-marched. Sizes and distances are squeezed a lot (true to scale there would be nothing but black).
// The light is staged: every leg has the sun where it looks best (it rises over the Earth's rim, the Moon covers it, it stands ahead beyond the rocks of the belt, Jupiter covers it and lets it out again,
// it stands beside Saturn seen from below the rings and beyond the probe at the end), the lens answers with rays, a streak and ghosts (not through a planet),
// and the planets stand in a thin haze through which their shadows run as dark shafts.
// Over all of it lies a fog lit by the sun, done in a second pass as in the glow forest (see there and below): whatever stands in front of the light draws a shadow through it.
// Two clocks drive the same path (m = 0..5, the leg and how far it has got): as one scene among the others every visit shows the next leg (a visit
// that was cut short before half of it is shown again); on E (core.js: trip) the scene is held and the song is the flight: Earth as it starts, the black hole as it ends.
// What follows the music: the kick pushes the rocks, the ice and the lines of the stars on a little faster (p), the lights on the Earth's night side and the lightning in
// Jupiter's clouds go with the bass, the ice in the rings glints with the treble, the comets' tails glow with the level, the hole's disc is the spectrum and swells a little with the kick. No flashes from the flight itself: the sun comes and goes
// behind a rim over many frames, and through the rings only their broad shape dims it.
let TOUR=-1;
{
  const V=a=>`vec3(${a.map(v=>v.toFixed(4))})`,
    nrm=a=>a.map(v=>v/Math.hypot(...a)),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
    RN=nrm([-.2,.9,-.4]),SAT=[9,-4,50],SR=5, // Saturn: the axis of its rings, where it is, its radius
    pj=v=>v.map((x,i)=>x-RN[i]*dot(v,RN)),rx=nrm(pj([-1,0,-.5])),PC=SAT.map((v,i)=>v+rx[i]*SR*2.13), // where the camera goes through the rings: in the outer ring, on the near left
    ip=nrm(pj([.3,0,1])),CD=nrm(ip.map((v,i)=>v*Math.cos(.35)-RN[i]*Math.sin(.35))); // and in which direction: forward, at a shallow angle to the rings
  const EA=nrm([-.75,.6,-.3]),EB=nrm([0,0,1].map((v,i)=>v-EA[i]*EA[2])),n1=EA.map((v,i)=>Math.cos(1.1)*v+Math.sin(1.1)*EB[i]),TT=a=>EB.map((v,i)=>Math.cos(a)*v-Math.sin(a)*EA[i]),T1=TT(1.1), // the orbit round the Earth: where it starts, which way it goes; where it ends (after 1.1 rad) and the way on from there
    cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sx=cr(n1,T1),MO=n1.map((v,i)=>1.27*v+T1[i]*2.2+sx[i]*.75), // the Moon: beside that way
    // Towards the sun, a place of its own for every leg (they are separate pictures): 0: it rises over the Earth's rim early in the orbit, a little to the side, where the Moon then covers it
    // for a while; 1: ahead on the right, so the rocks of the belt stand against it and draw their shadows through the fog, Jupiter comes as a dark ball with a thin lit edge, covers the sun as it passes and lets it out again, and is half lit as it falls behind; 2: behind the camera, so that from below the rings
    // the sun stands beside Saturn; 3: beyond the probe, as seen from where the flight ends
    SS=[nrm(TT(1.03).map((v,i)=>v*Math.cos(.45)+sx[i]*Math.sin(.45))),nrm([.64,.06,.77]),nrm([.08,.5,-.86]),nrm([.72,.12,-.68])];
  // The camera, shared by the two passes (the picture, and the fog over it, which has to know where the sun stands on the screen): where it is (O) and which way it looks (fw)
  // at m; L, f: the leg and how far it has got. Sets SD, the way to the sun in this leg. (In the last leg it also turns the picture a little: u.)
  const CAM=`const vec3 S0=${V(SS[0])},S1=${V(SS[1])},S2=${V(SS[2])},S3=${V(SS[3])},RN=${V(RN)},SAT=${V(SAT)},PC=${V(PC)},CD=${V(CD)},EA=${V(EA)},EB=${V(EB)},MO=${V(MO)};
vec3 SD;
float ss(float a,float b,float x){return smoothstep(a,b,x);}
// how much of the sun shows past a sphere (oc: from its middle to the camera); sf: how soft the edge is, as an angle
float occ(vec3 oc,float a,float sf){float b=dot(oc,SD);sf*=max(-b,0.);return b>0.?1.:ss(a-sf,a+sf,sqrt(max(dot(oc,oc)-b*b,0.)));}
// The sun as seen from O in leg L: sc = its colour (red while it stands in the Earth's air), returns how much of it shows past the planets of that leg
// (through Saturn's rings only their broad shape dims it, so it does not flicker; of the probe only a ball where its dish is)
float sunv(float L,vec3 O,out vec3 sc){float sa=L<1.?.04:L<2.?.028:L<3.?.02:.008;sc=vec3(1,.93,.8);
  if(L<1.){float b=dot(O,SD);sc=mix(vec3(1,.42,.15),sc,min(1.,ss(1.,1.14,sqrt(max(dot(O,O)-b*b,0.)))+step(0.,b)));return occ(O,1.,sa)*occ(O-MO,.4,sa);}
  if(L<2.)return occ(O-vec3(13,-1,60),6.,sa);
  if(L<3.){vec3 os=O-SAT;float ws=-dot(os,RN)/dot(SD,RN),xs=length(os+SD*ws)/5.;return occ(os,5.,sa)*(ws>0.?exp(-2.5*ss(1.24,1.5,xs)*ss(2.28,2.2,xs)*(1.-.8*ss(1.9,1.97,xs)*ss(2.07,2.,xs))):1.);}
  return L<4.?occ(O-vec3(2.6,-.4,55),.6,.03):0.;}
void cam(inout vec2 u,out float L,out float f,out vec3 O,out vec3 fw){
  L=floor(m);f=m-L;float e=f*f*(3.-2.*f);fw=vec3(0,0,1);
  SD=L<1.?S0:L<2.?S1:L<3.?S2:S3;
  if(L<1.){float th=3.667*min(f,.3),g=max(f-.3,0.);vec3 n=cos(th)*EA+sin(th)*EB,T=cos(th)*EB-sin(th)*EA; // Earth: a third of the leg in a low orbit, from the day side over into the night;
    O=1.27*n+T*(4.66*g+6.*g*g);fw=normalize(T-.55*n); // then straight on and away, faster and faster. The camera looks ahead and down, then at the Moon as it comes,
    fw=normalize(mix(fw,normalize(mix(normalize(MO-O),SD,.65*ss(.46,.54,f)*ss(.68,.58,f))),ss(.3,.48,f)));fw=normalize(mix(fw,normalize(.3*normalize(MO-O)-normalize(O)),ss(.62,.82,f)));} // (as the sun comes out from behind the Moon the camera stays with the sun for a moment: beside the Moon's night side there is nothing to see) // then back: the Earth and the Moon in full light, getting smaller
  else if(L<2.){O=vec3(0,0,95.*f*(.55+.45*f));fw=normalize(mix(fw,normalize(vec3(13,-1,60)-O),ss(.4,.64,f)));} // the belt, then a look at Jupiter as it passes on the right and falls behind
  else if(L<3.){vec3 a=vec3(0,2,0),b=SAT+vec3(-9,-9,40),c1=PC-CD*12.,c2=PC+CD*12.;float h=f*2.; // Saturn: down to the rings, through them at a shallow angle, away below
    O=h<1.?mix(mix(a,c1,h),mix(c1,PC,h),h):mix(mix(PC,c2,h-1.),mix(c2,b,h-1.),h-1.);
    fw=normalize(mix(fw,normalize(SAT-O),ss(.0,.2,f)));}
  else if(L<4.){O=vec3(0,0,57.*e);fw=normalize(mix(fw,normalize(vec3(2.6,-.4,55)-O),ss(.6,.8,f)));} // the comets, then the probe: the camera slows down beside it and keeps looking at it
  else{float g=clamp((f-.38)/.22,0.,1.),D=40.-24.*(1.-(1.-g)*(1.-g)*(1.-g))-7.*ss(.58,.86,f)-8.1*ss(.86,1.,f),ca=.6+2.4*f,el=mix(.5,.12,ss(.42,.8,f))+.5*ss(.84,1.,f); // the hole (in the middle of its own space): far off while the stars are lines,
    O=D*vec3(sin(ca)*cos(el),sin(el),-cos(ca)*cos(el));fw=normalize(-O);u*=R(.3);} // then in fast and slower, round it and down until the far side of the disc stands bent over the hole, and at the very end from above into it
}
`;
  const sd=shader(HOLE+CAM+`
float H(vec3 p){p=fract(p*.3183+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float N(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);vec2 e=vec2(0,1);
  return mix(mix(mix(H(i),H(i+e.yxx),f.x),mix(H(i+e.xyx),H(i+e.yyx),f.x),f.y),mix(mix(H(i+e.xxy),H(i+e.yxy),f.x),mix(H(i+e.xyy),H(i+1.),f.x),f.y),f.z);}
float F(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*N(p);p=p*2.03+7.3;a*=.5;}return s;}
// a sphere of radius R round the origin, seen from o along d: how much of the pixel it covers (soft at the edge), w = how far away
float sp(vec3 o,vec3 d,float a,out float w){float b=dot(o,d),m2=dot(o,o)-b*b,e=max(-b,0.)*1.4/r.y;w=-b-sqrt(max(a*a-m2,0.));return b>0.?0.:ss(a+e,a-e,sqrt(m2));}
float lit(vec3 n){return clamp(dot(n,SD)*1.2+.03,0.,1.);}
// Thin haze round a planet, lit by the sun (thickest at the planet, none beyond the distance G), with the planet's shadow as a dark shaft through it:
// the light it adds along the ray as far as w. Exact: the haze thins out as 1-r*r/G*G, which can be summed along a straight line.
float hzi(float x0,float x1,float b,float m2,float G){float u0=x0+b,u1=x1+b;return (1.-m2/G/G)*(x1-x0)-(u1*u1*u1-u0*u0*u0)/(3.*G*G);}
float haze(vec3 oc,vec3 d,float a,float G,float w){
  float b=dot(oc,d),m2=dot(oc,oc)-b*b,h=G*G-m2;if(h<=0.)return 0.;h=sqrt(h);
  float a0=max(-b-h,0.),a1=min(-b+h,w);if(a1<=a0)return 0.;
  float I=hzi(a0,a1,b,m2,G),os=dot(oc,SD),ds=dot(d,SD);vec3 op=oc-SD*os,dp=d-SD*ds;float A=dot(dp,dp),Bq=dot(op,dp),D=Bq*Bq-A*(dot(op,op)-a*a); // the shadow: a cylinder behind the planet
  if(D>0.&&A>1e-6){D=sqrt(D);float c0=(-Bq-D)/A,c1=(-Bq+D)/A;
    if(ds>1e-5)c1=min(c1,-os/ds);else if(ds<-1e-5)c0=max(c0,-os/ds);else if(os>0.)c1=c0;
    c0=max(c0,a0);c1=min(c1,a1);if(c1>c0)I-=hzi(c0,c1,b,m2,G);}
  return max(I,0.)/G;}
// stars: one in some of the cells of a grid on a big sphere, in two sizes of grid; the band of the Milky Way
vec3 stars(vec3 d){vec3 c=vec3(0);float e=1.9/r.y;
  for(int i=0;i<2;i++){float s=i==0?60.:140.,rs=clamp(e*s,.05,.3);vec3 q=d*s,id=floor(q);float h=H(id+float(i)*31.);
    c+=ss(rs,rs*.2,length(fract(q)-.5-.2*(vec3(H(id+1.3),H(id+4.7),H(id+9.1))-.5)*2.))*pow(h,14.)*mix(vec3(1,.75,.55),vec3(.7,.85,1),H(id+2.2))*3.;}
  float b=1.-abs(dot(d,vec3(.36,.8,-.48)));return c+vec3(.5,.55,.75)*pow(b,6.)*F(d*5.)*.22;}
// a lumpy rock in each cell of a grid (some cells are empty): the ray walks through the cells; in one that has a rock it marches a few steps to its surface.
// o, d: the ray in the grid's own space; mx: how far to look; ic: 0 = rock (zo: how far the grid has drifted along z; the rocks shrink to nothing at the ends of the belt),
// 1 = ice (only in a layer round y = 0). ld: where the light comes from. Returns the cover; cl = its colour.
float rocks(vec3 o,vec3 d,float mx,float ic,float zo,vec3 ld,float dens,out vec3 cl){
  d+=1e-4*(1.-abs(sign(d)));float t0=0.,tc=0.;cl=vec3(0);
  if(ic>.5&&abs(o.y)>2.){t0=(sign(o.y)*2.-o.y)/d.y;if(t0<0.||t0>mx)return 0.;t0+=.001;} // (from outside the layer of ice the walk starts where the ray gets to it, so no step is spent on the empty cells before)
  vec3 c=floor(o+d*t0),sg=sign(d),st=abs(1./d),tm=(c+.5+.5*sg-o)/d;
  for(int i=0;i<30;i++){
    float h=H(c),rr=(.1+.32*H(c+5.5)*H(c+8.1))*(ic>.5?step(abs(c.y+.5),1.6):ss(1.,8.,c.z-zo)*ss(46.,34.,c.z-zo));
    if(h<dens&&rr>.03){vec3 ce=c+.5+(vec3(H(c+1.1),H(c+2.3),H(c+3.7))-.5)*(1.-2.2*rr),q=o-ce;
      float lq=length(q);rr*=ss(.2,1.1,lq-rr)*mix(1.,ss(mx,mx*.45,lq),ic)*ss(.05,.2,acos(clamp(dot(-q,ld)/lq,-1.,1.))-rr/lq); // (and the way to the sun is kept clear in the same way: a rock right in front of the sun would switch the lens flare and the light in the fog off and on, several times a second)
      // (the ice comes out of the rings as the camera gets near: grains first, that grow)
      // (a rock in the camera's way shrinks to nothing before it gets there: otherwise it would fill the whole picture for a frame or two, a flash)
      float b=dot(q,d),m2=dot(q,q)-b*b;
      if(b<0.&&m2<rr*rr){float w=-b-sqrt(rr*rr-m2),a=t*(.2+h*2.)+h*40.,f;mat2 r1=R(a),r2=R(a*.7);vec3 g;
        for(int j=0;j<7;j++){g=q+d*w;g.xy*=r1;g.yz*=r2;f=length(g)-rr*(.62+.38*N(g/rr*1.6+h*50.));if(f<.004*rr)break;w+=f*.8;}
        vec3 pp=q+d*w;if(dot(pp,pp)<rr*rr*1.02){
          vec3 lr=ld;lr.xy*=r1;lr.yz*=r2;float n0=N(g/rr*1.6+h*50.),n1=N((g+lr*.12*rr)/rr*1.6+h*50.); // lumps: darker where the ground rises towards the light
          float di=clamp(dot(normalize(pp),ld)-(n1-n0)*4.,0.,1.)*(.55+.9*N(g/rr*7.));
          float nr=ss(mx*.85,mx*.35,w); // (far off the ice still has the colour and the flat light of the rings it is part of)
          cl=mix(vec3(.38,.33,.29)+.1*h,mix(vec3(.88,.8,.64),vec3(.75,.85,.95),nr),ic)*(mix(di,mix(.4+.45*di,di,nr),ic)+.03)+ic*nr*vec3(.6,.8,1)*B[22]*pow(N(g/rr*9.+t),6.)*4.;
          return ss(mx,mx*.6,w);}
      }
    }
    if(tm.x<tm.y&&tm.x<tm.z){tc=tm.x;tm.x+=st.x;c.x+=sg.x;}else if(tm.y<tm.z){tc=tm.y;tm.y+=st.y;c.y+=sg.y;}else{tc=tm.z;tm.z+=st.z;c.z+=sg.z;}
    if(tc>mx||ic>.5&&abs(c.y+.5)>2.)break; // (or out of the layer of ice again)
  }
  return 0.;
}
float rho(float x){ // how dense Saturn's rings are at x radii from its middle: the faint inner ring, the bright one, the gap, the outer ring with its fine gap
  float d=ss(1.24,1.3,x)*ss(2.28,2.265,x)*mix(.3,1.,ss(1.5,1.54,x));
  d*=1.-.93*ss(1.94,1.955,x)*ss(2.035,2.02,x);d*=1.-.8*ss(2.198,2.203,x)*ss(2.214,2.209,x);
  return d*(.5+.3*N(vec3(x*45.,0,0))+.2*N(vec3(x*160.,1,0)))*mix(1.,.7,ss(2.03,2.1,x));}
float cap(vec3 p,vec3 a,vec3 b,float w){vec3 q=p-a,e=b-a;return length(q-e*clamp(dot(q,e)/dot(e,e),0.,1.))-w;}
float probe(vec3 p,out float id){ // the probe, its dish (radius 1) open to +z: 1 dish, 2 the body, 3 gold, 4 the dark parts
  float r2=dot(p.xy,p.xy),d=max(abs(p.z-.25*r2)/sqrt(1.+.25*r2)-.012,sqrt(r2)-1.),e;id=1.;
  vec3 q;e=min(cap(p,vec3(.87,0,.19),vec3(0,0,.72),.012),cap(vec3(-abs(p.x),abs(p.y),p.z),vec3(-.43,.75,.19),vec3(0,0,.72),.012));
  e=min(e,max(length(p.xy)-.13,abs(p.z-.74)-.03));if(e<d){d=e;id=4.;}
  e=max(length(p.xy)-.48,abs(p.z+.32)-.14);if(e<d){d=e;id=2.;}
  e=max(length(p.yz-vec2(.2,-.32))-.15,abs(p.x-.49)-.012);if(e<d){d=e;id=3.;} // the record on its side
  e=min(cap(p,vec3(-.4,0,-.32),vec3(-1.25,0,-.5),.02),cap(p,vec3(.4,0,-.32),vec3(1.9,0,-.25),.02));
  e=min(e,cap(p,vec3(0,-.3,-.4),vec3(-2.6,-4.2,-2.),.014)); // the long boom
  e=min(e,min(cap(p,vec3(0,.2,-.45),vec3(1.4,1.9,-1.2),.008),cap(p,vec3(0,.2,-.45),vec3(-1.6,1.6,-1.3),.008))); // two whip antennas
  if(e<d){d=e;id=4.;}
  e=cap(p,vec3(-1.3,0,-.51),vec3(-2.5,0,-.76),.1);if(e<d){d=e;id=4.;} // the three power cells in a row
  q=p-vec3(2.05,0,-.23);e=max(max(abs(q.x)-.16,abs(q.y)-.2),abs(q.z)-.13);if(e<d){d=e;id=2.;} // the platform with the cameras
  e=cap(p,vec3(2.05,.2,-.2),vec3(2.05,.2,.1),.07);if(e<d){d=e;id=3.;}
  return d;}
vec3 tail(vec3 o,vec3 d,vec3 a,float w0,float len,vec3 c){ // a comet's tail from the origin along a: the glow summed along the ray, near enough (the closest the ray comes to the tail's axis)
  float b=dot(d,a),e=dot(o,d),f=dot(o,a),s=clamp((f-b*e)/(1.0001-b*b),0.,len),u=max(b*s-e,0.);vec3 q=o+d*u-a*s;
  float w=w0*(1.+s*.5),x=s/len;return c*exp(-dot(q,q)/w/w)*(1.-x)*(1.-x)*w0/w*(.7+.5*N(vec3(length(q)/w*3.,s*.6-t*.4,2)));}
vec3 warp(vec2 u,float s,float wf){ // faster than light: stars as lines that run out from the middle of the picture. s: how far they have come, wf: the speed, which is their length
  float rr=length(u),an=atan(u.y,u.x)/6.2832,wd=max(1.6/r.y,.0016)*(1.+rr);vec3 c=vec3(0);
  for(int i=0;i<3;i++){float n=80.+60.*float(i),ac=floor(an*n),hh=H(vec3(ac,float(i)*7.,3.)),y=fract(hh*9.+s*(.3+hh)),r0=y*y*2.4, // one star to each slice of the circle: it starts in the middle and gets faster on its way out
      da=abs(fract(an*n)-.5-(H(vec3(ac,5.,float(i)))-.5)*.6)/n*6.2832*rr;
    c+=mix(vec3(.6,.78,1),vec3(1,.86,.7),H(vec3(ac,9.,float(i))))*step(.35,hh)*ss(wd,wd*.3,da)*ss(r0*(1.-.75*wf)-.006,r0,rr)*ss(r0+.006,r0,rr)*ss(.02,.35,r0)*ss(.03,.5,rr)*ss(1.,.8,y)*2.;}
  return c*ss(0.,.3,wf)+vec3(.45,.65,1)*wf*.05/(rr*rr*6.+.06);}
void main(){
  UV/z;u*=R(ro);vec2 q0;
  float L,f,w;vec3 O,fw;cam(u,L,f,O,fw);
  vec3 rt=normalize(cross(vec3(0,1,0),fw)),up=cross(fw,rt),d=normalize(u.x*rt+u.y*up+1.5*fw),sc=vec3(1,.93,.8);
  float sa=L<1.?.04:L<2.?.028:L<3.?.02:.008,an=sqrt(max(2.-2.*dot(d,SD),0.)),a2=an/max(sa,.02),ph=pow(max(dot(d,SD),0.),6.),am=min(1.,.08*ss(-.2,.5,dot(d,SD))+.92*pow(max(dot(d,SD),0.),16.));an/=sa; // (am: how much of the sun's light comes through the fog from here, for the second pass: a wide glow round the sun, cut out by everything that is in front)
  // (above) the sun: smaller with every leg
  sunv(L,O,sc);
  vec3 col=stars(d)+sc*(ss(1.1,.9,an)*3.+1.5/(1.+a2*a2)+.2/(1.+a2*.3));
  if(L<1.){ // ---- Earth and Moon
    vec3 M=MO;float wm,cm=sp(O-M,d,.4,wm),ce=sp(O,d,1.,w);
    for(int i=0;i<2;i++){ // the farther of the two first
      if((i==0)==(wm>w)){if(cm>0.){vec3 n=normalize(O-M+d*wm),q=n*3.;float mr=F(q*.7+3.),cr=0.,cs=0.;
          for(int j=0;j<2;j++){float s=j==0?4.:9.;vec3 g=n*s,ci=floor(g),cc=ci+.5+(vec3(H(ci),H(ci+1.7),H(ci+3.1))-.5)*.5;float cz=.18+.2*H(ci+6.);vec3 dl=g-cc;float x=length(dl)/cz; // craters: a bowl with a rim, lit from the sun's side
            cr+=ss(1.3,.9,x)*(ss(.6,1.,x)-.5)*.5;cs+=ss(1.25,.8,x)*dot(dl/cz,SD)*ss(.3,1.,x);}
          col=mix(col,vec3(.62,.6,.57)*(.55+.5*ss(.4,.6,mr)+cr*.3)*(clamp(lit(n)*(1.-cs*.9),0.,1.)+vec3(.05,.08,.13)*max(dot(n,-normalize(M)),0.)),cm);}} // (its night side: the light of the Earth)
      else if(ce>0.){vec3 n=normalize(O+d*w),q=vec3(dot(n,vec3(.64,-.76,0)),dot(n,vec3(.76,.64,0)),n.z);q.xz*=R(t*.012+1.); // (its axis lies across the flight: the orbit runs along the warm latitudes, not over a pole)
          float h=F(q*2.6+11.)+.1*F(q*9.)-.05,ld=ss(.47,.5,h),ice=ss(.78,.86,abs(q.y)+.1*N(q*7.)),cd=ss(.53,.76,F(q*3.3+vec3(0,t*.008,0)+.9*N(q*2.))+.12*F(q*13.)-.06);
          vec3 c=mix(mix(vec3(.02,.07,.22),vec3(.03,.2,.35),ss(.4,.5,h)),mix(vec3(.11,.2,.08),vec3(.4,.34,.22),clamp(N(q*5.)*1.3-.25+ss(.58,.7,h),0.,1.)),ld);
          c=mix(mix(c,vec3(.9,.93,.97),ice),vec3(1),cd);float li=lit(n),fr=pow(1.-max(dot(n,-d),0.),3.);
          c=c*li*mix(vec3(1,.55,.3),vec3(1),ss(0.,.35,li))+(1.-ld)*(1.-cd)*pow(max(dot(reflect(d,n),SD),0.),40.)*.8+vec3(.3,.55,1)*fr*(li+.05)+.02*cd; // evening light at the edge of the night, // the sun on the sea, the blue of the air at the rim
          c+=vec3(1,.75,.4)*ld*(1.-ice)*(1.-cd*.7)*ss(.5,.8,N(q*110.))*ss(.42,.6,N(q*12.+4.))*ss(.25,0.,li)*(.7+2.*l); // the cities at night, brighter with the bass
          col=mix(col,c,ce);}
    }
    float b=dot(O,d),dm=sqrt(max(dot(O,O)-b*b,0.));if(b<0.)col+=mix(vec3(1,.5,.25),vec3(.25,.5,1),ss(0.,.5,lit(normalize(O-d*b))))*exp(-max(dm-1.,0.)/.025)*(1.-ce)*(lit(normalize(O-d*b))+.04)*(.9+2.5*ph); // the air glowing beyond the rim: red where the sun is low, bright against the sun
    col+=vec3(.45,.65,1)*haze(O,d,1.,3.2,min(ce>.5?w:1e9,cm>.5?wm:1e9))*(.025+.4*ph);am*=(1.-ce)*(1.-cm);
  }else if(L<2.){ // ---- the belt and Jupiter
    vec3 J=vec3(13,-1,60),oj=O-J;float wi,cj=sp(oj,d,6.,w);
    if(cj>0.){vec3 n=normalize(oj+d*w),q=n;q.xy*=R(.05);float y=q.y;q.xz*=R(t*.02+.8+.05*sin(y*21.));
      q+=.05*(vec3(F(q*5.),F(q*5.+3.),F(q*5.+6.))-.5);y=q.y;float tu=F(q*vec3(4,13,4)+2.),bd=N(vec3(y*8.+tu*1.6,3,0)),b2=N(vec3(y*23.+tu*2.5,7,0));
      vec3 c=mix(vec3(.84,.78,.66),vec3(.58,.41,.29),ss(.3,.7,bd));c=mix(c,vec3(.92,.9,.85),ss(.55,.8,b2)*.6);c*=.85+.3*tu;c=mix(c,vec3(.45,.5,.6),ss(.8,1.,abs(y))*.6);
      vec2 e2=n.xz*R(-2.75+t*.004),s=vec2(atan(e2.x,e2.y),(y+.37)*2.2);float sr=length(s*vec2(1.,1.9))/.33;c=mix(c,vec3(.7,.34,.2)*(.85+.25*sin(sr*9.+tu*6.)),ss(1.,.6,sr)*.85); // the red spot
      float li=lit(n);c=c*li*(.35+.65*pow(max(dot(n,-d),0.),.4))+vec3(.6,.75,1)*ss(.2,-.1,li)*pow(N(n*13.+vec3(0,0,t*.35)),26.)*l*l*400. // lightning on the night side, with the bass
        +vec3(1,.75,.5)*pow(1.-max(dot(n,-d),0.),4.)*ph*ss(-.3,.1,dot(n,SD))*2.; // against the sun its rim lights up
      col=mix(col,c,cj);}
    col+=vec3(1,.84,.62)*haze(oj,d,6.,17.,cj>.5?w:1e9)*(.025+.4*ph);am*=1.-cj;
    for(int i=0;i<2;i++){vec3 q=O-J-(i==0?vec3(-8.5,.3,-4.5):vec3(3,1.2,-9.5));float ci=sp(q,d,i==0?.32:.26,wi); // two moons
      if(ci>0.&&(cj<.5||wi<w)){vec3 n=normalize(q+d*wi);col=mix(col,(i==0?vec3(.85,.75,.4):vec3(.8,.8,.82))*(.7+.4*N(n*6.))*lit(n),ci);am*=1.-ci;}}
    vec3 cl; // the belt: it ends before Jupiter
    if(O.z<50.){float cr=rocks(O+vec3(.5,.5,p*.6),d,14.,0.,p*.6,SD,.3,cl);col=mix(col,cl,cr);am*=1.-cr;}
  }else if(L<3.){ // ---- Saturn, flattened along its axis, and its rings
    vec3 os=O-SAT,o2=os+RN*dot(os,RN)*.11,d2=d+RN*dot(d,RN)*.11;float dl=length(d2);d2/=dl;
    float cs=sp(o2,d2,5.,w),wr=-dot(os,RN)/dot(d,RN);w/=dl;
    vec3 pr=os+d*wr;float x=length(pr)/5.,de=wr>0.?rho(x):0.,mu=abs(dot(d,RN)),al=(1.-exp(-2.2*de/(mu+.03)))*ss(2.,7.,wr); // (close to the camera the sheet gives way to single lumps of ice)
    float b=dot(pr,SD),sh=ss(4.9,5.3,sqrt(max(dot(pr,pr)-b*b,0.)))+step(0.,b);sh=min(sh,1.); // the planet's shadow on the rings
    vec3 rc=vec3(.88,.8,.64)*(dot(os,RN)>0.?.25+.75*de:(de*exp(-2.5*de)*2.2+.04)*(1.+2.5*ph))*(.08+.92*sh); // lit from above; from below only the thin parts let the light through
    vec3 e1=normalize(cross(RN,vec3(0,0,1))),e2=cross(RN,e1),pg=O+d*wr-PC; // (the grid the lumps of ice sit in, see below)
    {vec2 g2=vec2(dot(pg,e1),dot(pg,e2)+p*.5)*2.,ci=floor(g2),fc=g2-ci-.5-.3*(vec2(H(vec3(ci,5.)),H(vec3(ci,7.)))-.5),sn=normalize(vec2(dot(SD,e1),dot(SD,e2))); // As the camera comes nearer the smooth rings turn out to be
      float hh=H(vec3(ci,3.)),sz=.12+.2*hh,gs=step(hh,.6)*ss(26.,7.,wr)*ss(.5,.15,wr/(.375*r.y)/max(mu,.05)); // grains: a pale spot with its shadow beside it in some cells of that grid, from far off and stronger and stronger
      rc*=1.+gs*(.5*ss(sz,sz*.4,length(fc))-.6*ss(sz,sz*.4,length(fc+sn*sz*.8)));} // (not where a cell is smaller than a pixel: there it would shimmer). Out of these the lumps then grow.
    for(int i=0;i<2;i++){
      if((i==0)==(wr>w||cs<.5)){col=mix(col,rc,al);}
      else if(cs>0.){vec3 p3=os+d*w,n=normalize(p3+RN*dot(p3,RN)*.23);float y=dot(n,RN),tu=F(n*vec3(4,4,4)+RN*y*9.);
        vec3 c=mix(vec3(.9,.8,.56),vec3(.74,.6,.38),ss(.3,.7,N(vec3(y*11.+tu*.6,5,0))));c=mix(c,vec3(.6,.62,.5),ss(.75,1.,abs(y))*.5);
        float ws=-dot(p3,RN)/dot(SD,RN),xs=length(p3+SD*ws)/5.; // the rings' shadow on the planet
        col=mix(col,c*lit(n)*(.3+.7*pow(max(dot(n,-d),0.),.5))*(1.-(ws>0.?.85*rho(xs):0.))+vec3(1,.8,.55)*pow(1.-max(dot(n,-d),0.),4.)*ph*ss(-.3,.1,dot(n,SD))*2.,cs);}
    }
    col+=vec3(1,.88,.66)*haze(os,d,5.,16.,cs>.5?w:1e9)*(.025+.4*ph);am*=(1.-cs)*(1.-.75*al);
    float hc=dot(O-PC,RN);vec3 cl; // near the plane: lumps of ice, in a grid that lies in the rings
    if(abs(hc)<9.){vec3 og=vec3(dot(O-PC,e1),hc,dot(O-PC,e2)+p*.5)*2.,dg=vec3(dot(d,e1),dot(d,RN),dot(d,e2));
      float cr=rocks(og,dg,16.,1.,0.,vec3(dot(SD,e1),dot(SD,RN),dot(SD,e2)),.3,cl);col=mix(col,cl,cr);am*=1.-cr;}
  }else if(L<4.){ // ---- comets and the probe
    vec3 K=vec3(6,3,22),ok=O-K,ta=-SD;float lv=.6+.8*l;
    col+=(tail(ok,d,ta,.28,22.,vec3(.35,.6,1))+tail(ok,d,normalize(ta+vec3(.1,-.15,.4)),.5,14.,vec3(1,.9,.7)))*lv; // the near one: a straight blue tail and a wider pale one, both away from the sun
    float b=dot(ok,d);col+=vec3(.8,.95,1)*.05/(.02+dot(ok,ok)-b*b*step(b,0.))*lv; // its head
    ok=O-vec3(-24,12,88);col+=(tail(ok,d,ta,.6,40.,vec3(.35,.6,1))+tail(ok,d,normalize(ta+vec3(.3,.2,.4)),1.,26.,vec3(1,.9,.7)))*lv*.8; // the far one
    vec3 op=(O-vec3(2.6,-.4,55))*1.6;float bb=dot(op,d),m2=dot(op,op)-bb*bb; // the probe: its dish looks back at the sun
    if(bb<0.&&m2<40.){vec3 az=SD,ax=normalize(cross(vec3(0,1,0),az)),ay=cross(az,ax);vec3 lo=vec3(dot(op,ax),dot(op,ay),dot(op,az)),ldr=vec3(dot(d,ax),dot(d,ay),dot(d,az));
      float tq=max(-bb-sqrt(40.-m2),0.),id,g;
      for(int i=0;i<70;i++){g=probe(lo+ldr*tq,id);if(g<.002||tq>-bb+7.)break;tq+=g*.9;}
      if(g<.004*(1.+tq*.2)){vec3 q=lo+ldr*tq;vec2 h2=vec2(.003,0);float i2;
        vec3 n=normalize(vec3(probe(q+h2.xyy,i2),probe(q+h2.yxy,i2),probe(q+h2.yyx,i2))-g);
        vec3 c=id<1.5?vec3(.8,.8,.78):id<2.5?vec3(.25,.24,.22):id<3.5?vec3(.9,.65,.2):vec3(.12,.12,.13);
        vec3 lg=vec3(.36,.3,.88);float di=max(dot(n,lg),0.),spc=pow(max(dot(reflect(ldr,n),lg),0.),id>2.5&&id<3.5?12.:30.); // (the dish looks at the Earth, a little beside the sun: so the light shows its curve)
        col=c*(di+.05+.12*max(dot(n,-ldr),0.))+spc*(id>2.5&&id<3.5?vec3(1,.75,.3):vec3(.5))*.6;am=0.;}
    }
  }
  if(L>=4.){ // ---- faster than light, and the black hole. The speed rises and falls again (so the lines grow out of the stars and shrink back into them, no jump); the hole comes out of the dark as they do. Its disc swells with the kick much less than in scene 24: here it comes to fill the whole picture
    float x=clamp((f-.02)/.48,0.,1.),wf=4.*x*(1.-x),hv=ss(.3,.46,f),al=1.;vec3 v=d,hc=vec3(0);
    if(hv>0.){vec3 a=O;hc=hole(a,v,al,max(300.,dot(O,O)*1.5),.3*k)*hv;al=mix(1.,al,hv);}
    col=1.-exp(-((stars(v)*(1.-.9*ss(0.,.5,wf))+warp(u,p,wf)*(.7+.6*l))*al+hc)*1.6);} // (p: how far the lines have come, counted by the driver below; they are a little brighter when the song is loud)
  q0=gl_FragCoord.xy/r-.5;o=vec4(col*(1.-.9*dot(q0,q0))*ss(0.,.025,f)*ss(1.,.975,f),am); // (every leg comes out of the dark and goes back into it)
}`,6e6,2);
  // The second pass, the fog: as in the glow forest the light that comes through (the alpha of the first pass) is smeared away from the sun, so everything in front of that light, a planet,
  // a moon, a rock, a lump of ice, the probe, draws a dark shaft through the fog behind it. The lens flare is drawn here too, because only here it is known whether something small stands in front of the sun. Each pixel looks a stretch of the way towards the sun (at most 1.3 picture heights / 2) and adds up
  // the light it finds there, the near part counting most. No sun in the last leg, none when it stands behind the camera. Not with the kick: these shafts go across the whole picture.
  const fin=shader(CAM+`uniform sampler2D X;
vec2 tc(vec2 v){v=v*R(-ro)*z;return (v*r.y+r)/(2.*r);} // from the turned and zoomed picture back to where that is in the texture
void main(){
  vec4 c=texture(X,gl_FragCoord.xy/r);UV/z;u*=R(ro);float L,f,g=0.;vec3 O,fw,sc;cam(u,L,f,O,fw);
  vec3 rt=normalize(cross(vec3(0,1,0),fw)),up=cross(fw,rt);float vs=dot(SD,fw),vis=sunv(L,O,sc);
  if(L<4.&&vs>.05){vec2 ps=vec2(dot(SD,rt),dot(SD,up))/vs*1.5,dv=ps-u,q=gl_FragCoord.xy/r-.5;float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+t)*43758.5),fd=(1.-.9*dot(q,q))*ss(0.,.025,f)*ss(1.,.975,f); // (fd: darker towards the corners and at both ends of the leg, as the first pass)
    dv*=min(1.,1.3/length(dv))/24.;
    for(int i=0;i<24;i++)g+=texture(X,tc(u+dv*(float(i)+n))).a*(1.-float(i)/24.);
    c.rgb+=sc*g/12.5*ss(.05,.3,vs)*(L<3.?.5:.3)*fd;
    if(vs>.2){ // What the lens makes of the sun: rays, a streak, a ring, and ghosts on the line through the middle. Not through a planet (vis), and not through a rock, a lump of ice or the probe either:
      q=ps*R(-ro)*z;float sv=0.,on=ss(1.02,.9,abs(q.y))*ss(.02,-.1,abs(q.x)-r.x/r.y); // while the sun is in the picture the light that comes through round it tells (eight spots, so that it dims and comes back softly)
      for(int i=0;i<8;i++)sv+=texture(X,tc(ps+(i%2==0?.03:.07)*vec2(cos(float(i)*.785),sin(float(i)*.785)))).a;
      q=u-ps;vis*=mix(1.,min(1.,sv/6.),on)*ss(2.4,1.3,length(ps));
      float dq=length(q),ag=atan(q.y,q.x);
      vec3 fl=sc*(pow(abs(cos(ag*3.)),30.)*.5+pow(abs(cos(ag*4.+.6)),80.)*.35+.25)*.06/(dq*dq*3.+.02)+vec3(.45,.65,1)*exp(-abs(q.y)*45.)*.5/(1.+q.x*q.x*1.5)+pal(dq*2.+.1)*exp(-pow((dq-.5)*22.,2.))*.07;
      for(int i=0;i<5;i++){float fi=float(i),rr=.04+.11*fract(fi*.618+.2),g=length(u+ps*(i<4?.4+fi*.42:-.35))/rr;fl+=pal(fi*.21+.55)*ss(1.,.85,g)*(.25+.75*g*g)*.07;}
      c.rgb+=fl*vis*fd;}}
  o=vec4(c.rgb,1);
}`,6e6,1);
  let s0=+(/[?&]sp=([\d.]+)/.exec(location.search)||[])[1]||0,sv=s0,lc=-9,t0=0,du=24,fl=0,in1=0,ws=0; // ?sp=2.4: start the first visit there (a test hook)
  if(sd&&fin)TOUR=SC.push(()=>{
    if(tt-lc>.5||tt<lc){if(in1++)s0=Math.round(sv)%5;t0=tt;du=BPM?sl*60/BPM:24} // (re)entered: on with the next leg
    lc=tt;if(!trip)sv=s0+(tt-t0)/du;fl+=dt*kick; // (a held flight does not count as a visit: afterwards the legs go on where they were)
    gm=trip?min(4.999,max(0,5*tt/dur())):(s0+.9*(sv-s0))%5;const x=min(1,max(0,(gm%1-.02)/.48));if(gm>=4)ws+=dt*4*x*(1-x)*(.9+1.2*kick);gp=gm<4?t+fl*3:ws;
    const T=sd();gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,T.tex);gl.activeTexture(gl.TEXTURE0);fin();gp=0})-1; // (unit 3: the picture for a last pass, as in the glow forest and the dive)
  // a visit shows nine tenths of its leg: the last bit, where the leg goes dark, is only for the held flight
  // (the last leg: p is how far the lines of the stars have come instead; their speed rises and falls as in the shader, and the kick pushes them too)
}
