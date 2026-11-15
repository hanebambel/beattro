// ---- 34 title: BEATTRO in glass. Seven extruded letters (built from boxes, rounded frames and one slanted bar) stand on a checkered, slightly mirroring
// floor in front of a row of neon tubes, one per band, whose height is the band's level. Ray traced the demo way (ray marching): a ray that hits a letter
// splits into a reflection and a refracted ray that travels through the glass, is tinted by how much glass it crosses, and leaves bent on the other side,
// so the tubes behind show distorted through the letters. The floor mirrors everything once. The haze lights up around the tubes (collected along every ray).
// Two spotlights stand behind it all: their light shows as beams in drifting fog, and letters and ball cut shadows into the beams and onto the floor.
// A red-and-white checkered ball, the classic of the era, bounces through in time: it touches the floor on every beat.
let TITLE=-1;
{
  const td=shader(`const float W=.085;float ID,BI,DN;vec3 GL,BP,LP[2],LC[2]; // LP, LC: the two spotlights behind the letters and their colours
float bx(vec2 q,vec2 c,vec2 s){vec2 d=abs(q-c)-s;return length(max(d,0.))+min(max(d.x,d.y),0.);}
float rg(vec2 q,vec2 c,vec2 s,float rr){vec2 d=abs(q-c)-s+rr;return abs(length(max(d,0.))+min(max(d.x,d.y),0.)-rr)-W;} // a rounded frame
float sg(vec2 q,vec2 a,vec2 b){vec2 e=b-a,w=q-a;return length(w-e*clamp(dot(w,e)/dot(e,e),0.,1.))-W;}
float glyph(vec2 q,int i){ // the letters as flat shapes: B E A T T R O, each .8 wide and 1.4 tall
  float st=bx(q,vec2(-.31,0),vec2(W,.7));
  if(i==0)return min(st,min(rg(q,vec2(-.025,.3075),vec2(.285,.3075),.2),rg(q,vec2(0,-.3075),vec2(.31,.3075),.2)));
  if(i==1)return min(min(st,bx(q,vec2(0,.615),vec2(.39,W))),min(bx(q,vec2(-.06,0),vec2(.3,W)),bx(q,vec2(0,-.615),vec2(.39,W))));
  if(i==2)return min(max(rg(q,vec2(0,-.3),vec2(.31,.915),.28),-.7-q.y),bx(q,vec2(0,-.12),vec2(.3,W)));
  if(i==3||i==4)return min(bx(q,vec2(0,.615),vec2(.39,W)),bx(q,vec2(0,-.04),vec2(W,.66)));
  if(i==5)return min(min(st,rg(q,vec2(-.01,.29),vec2(.3,.325),.2)),sg(q,vec2(-.05,-.04),vec2(.3,-.62)));
  return rg(q,vec2(0),vec2(.31,.615),.27);
}
float letters(vec3 q){ // only the letter of the cell the point is in has to be looked at
  float c=clamp(floor(q.x+3.5),0.,6.),d=glyph(vec2(q.x+3.-c,q.y-.8),int(c)),e=abs(q.z)-.17;
  return min(max(d,e),0.)+length(max(vec2(d,e),0.))-.025;
}
float g2(vec2 c){float i=clamp(floor(c.x+3.5),0.,6.);return glyph(vec2(c.x+3.-i,c.y-.8),int(i));} // the flat lettering at a point of the plane the letters stand in
float shd(vec3 q,int i){ // how much of spotlight i reaches a point: the letters stand between (their flat shape is looked up where the way to the light crosses their plane;
  vec3 d=LP[i]-q,b=BP-q;float a=1.;                                    // glass lets a little through), and so can the ball
  if(q.z<-.17)a=.12+.88*smoothstep(-.02,.1,g2((q+d*(-q.z/d.z)).xy));
  return a*smoothstep(.36,.52,length(b-d*clamp(dot(b,d)/dot(d,d),0.,1.)));
}
float fogd(vec3 q){ // drifting fog: thicker near the floor, in slow swirls
  vec3 w=q*vec3(.9,1.6,.9)+vec3(t*.15,-t*.08,t*.11);w.xz+=1.3*sin(w.zx*.9+t*.21);
  return (.35+.65*exp(-q.y*1.1))*(.08+.92*smoothstep(-.5,.8,sin(w.x*1.7)*sin(w.y*2.3+w.z)*sin(w.z*1.3)+.6*sin(w.x*3.1+w.y*1.9)*sin(w.z*3.7-w.y)));
}
float mapf(vec3 q){ // the whole scene; ID: 0 floor, 1 glass, 2 neon tube, 3 ball
  float d=q.y,a=letters(q),c=clamp(floor(q.x+.5),-5.,5.),hh=1.2+2.*B[int(mod(c*3.+16.,32.))];ID=0.;BI=c;
  if(a<d){d=a;ID=1.;}
  DN=length(vec2(length(vec2(q.x-c,q.z-1.5)),max(0.,abs(q.y-hh*.5)-hh*.5)))-.045;if(DN<d){d=DN;ID=2.;}
  a=length(q-BP)-.42;if(a<d){d=a;ID=3.;}
  return d;
}
vec3 nrm(vec3 q){vec2 e=vec2(.002,-.002);return normalize(e.xyy*mapf(q+e.xyy)+e.yyx*mapf(q+e.yyx)+e.yxy*mapf(q+e.yxy)+e.xxx*mapf(q+e.xxx));}
float mr(vec3 e,vec3 v,int n,float tm){ // march a ray; on the way the haze picks up the light of the tubes it passes
  float s=.02;
  for(int i=0;i<n;i++){
    vec3 q=e+v*s;float d=mapf(q);
    float fg=.5+.5*sin(q.x*1.3+t*.4)*sin(q.y*2.1-t*.3+q.z*.7);
    GL+=min(d,.3)*(pal(h+BI*.07)*.03/(.012+DN*DN)*(.4+.4*fg+.6*k)+vec3(.25,.35,.6)*.012*exp(-q.y*2.5)*fg); // + a thin mist over the floor
    if(d<.0015*s||s>tm)break;s+=d;
  }
  return s;
}
vec3 env(vec3 v){return mix(vec3(.01,.012,.03),vec3(.03,.02,.07),smoothstep(-.2,.6,v.y))+pal(h+v.x*.25+.1)*smoothstep(.1,.9,v.z)*exp(-abs(v.y-.12)*5.)*(.15+.4*k);} // night, and a wash of neon low on the far side
vec3 lit(vec3 q,vec3 n,vec3 v,float id){ // floor, tube or ball, lit by the five nearest tubes
  vec3 L=vec3(0),c,sun=normalize(vec3(-.4,.8,-.5));float c0=floor(q.x+.5);
  for(int i=-2;i<3;i++){float cc=clamp(c0+float(i),-5.,5.),hh=1.2+2.*B[int(mod(cc*3.+16.,32.))];vec3 d=vec3(cc,hh*.5,1.5)-q;float r2=dot(d,d);L+=pal(h+cc*.07)*hh*max(dot(n,d/sqrt(r2)),0.)/(r2+.4);}
  L*=.5+k;
  if(id<.5){ // the floor also gets the spotlights from behind, so the letters and the ball throw long shadows towards the camera
    for(int i=0;i<2;i++){vec3 d=LP[i]-q;float r2=dot(d,d);L+=LC[i]*max(dot(n,d/sqrt(r2)),0.)*shd(q+vec3(0,.01,0),i)*9./(r2+2.);}
    vec2 w=floor(q.xz);c=mix(vec3(.03,.03,.045),vec3(.3,.3,.34),mod(w.x+w.y,2.))*(.2+L*1.6);
  }
  else if(id<2.5)c=pal(h+BI*.07)*3.+1.;
  else{vec3 w=q-BP;w.xy*=R(.3);w.xz*=R(t*2.);
    c=mix(vec3(.9),vec3(.9,.05,.05),mod(floor(atan(w.z,w.x)/3.1416*4.)+floor(acos(clamp(w.y/.42,-1.,1.))/3.1416*8.),2.))*(.25+L*1.5+.8*max(dot(n,sun),0.))+pow(max(dot(reflect(v,n),sun),0.),30.);}
  return c;
}
vec3 sh2(vec3 e,vec3 v,int n){ // what a reflected or refracted ray sees (glass is simplified here: no ray splits a second time)
  float s=mr(e,v,n,30.);if(s>30.)return env(v);
  float id=ID;vec3 q=e+v*s,nn=nrm(q);
  if(id>.5&&id<1.5)return env(reflect(v,nn))+pal(h+floor(q.x+3.5)*.09)*.2+vec3(.5,.8,1)*pow(1.-abs(dot(nn,v)),3.)*.6;
  return mix(lit(q,nn,v,id),env(v),1.-exp(-s*.03));
}
void main(){
  UV/z;u*=R(ro);
  float bf=fract(m);BP=vec3(mod(t*.9+6.,14.)-7.,.42+6.4*bf*(1.-bf),-1.4);GL=vec3(0); // the ball: a parabola per beat, like a real bounce (up 1.6, down on the beat)
  LP[0]=vec3(-1.7+.5*sin(t*.31),1.+.3*sin(t*.4),2.7);LP[1]=vec3(1.7+.5*cos(t*.27),1.+.3*cos(t*.33),2.7);LC[0]=pal(h+.02)*(.7+.9*k+l);LC[1]=pal(h+.45)*(.7+.9*k+l);
  float ca=sin(t*.17)*.55,s;vec3 e=vec3(sin(ca)*5.4,1.05+.35*sin(t*.23),-cos(ca)*5.4),f=normalize(vec3(0,.95,0)-e),rx=normalize(cross(vec3(0,1,0),f)),v=normalize(u.x*rx+u.y*cross(f,rx)+f*1.6),col;
  s=mr(e,v,80,40.);
  if(s>40.)col=env(v);
  else{
    float id=ID;vec3 q=e+v*s,n=nrm(q);
    if(id>.5&&id<1.5){ // glass: reflection + the way through
      float li=floor(q.x+3.5),F=.05+.95*pow(1.-max(dot(n,-v),0.),5.),ln=0.;
      vec3 rf=sh2(q+n*.01,reflect(v,n),36),rr=refract(v,n,.67),w=q-n*.02;
      for(int i=0;i<24;i++){float d=-letters(w);if(d<.003)break;w+=rr*max(d,.01);ln+=max(d,.01);}
      vec3 no=nrm(w),r2=refract(rr,-no,1.5);if(dot(r2,r2)<.01)r2=reflect(rr,-no);
      col=mix(sh2(w+no*.02,r2,44)*exp(-ln*vec3(.6,.18,.12)),rf,F)+pal(h+li*.09)*(.14+.6*B[int(li*4.+2.)])*(.3+.7*F); // every letter also glows with a band of its own
      for(int i=0;i<2;i++)col+=LC[i]*(pow(max(dot(reflect(v,n),normalize(LP[i]-q)),0.),50.)*3.+pow(max(dot(r2,normalize(LP[i]-w)),0.),40.)*2.); // glints of the spotlights on and through the glass
    }else{
      col=lit(q,n,v,id);
      if(id<.5)col=mix(col,sh2(q+n*.01,reflect(v,n),44),.08+.5*pow(1.-max(dot(n,-v),0.),4.)); // the floor mirrors
    }
    col=mix(col,env(v),1.-exp(-s*.025));
  }
  // volumetric light: along the ray to what it hit, the fog is lit by the two spotlights wherever they are not shadowed. Looking towards a light the fog
  // glows strongly, so the letters stand in beams of light with their shadows cut into them.
  float vt=min(s,16.),jt=fract(sin(dot(gl_FragCoord.xy,vec2(12.99,78.23)))*43758.5);vec3 vol=vec3(0);
  for(int i=0;i<32;i++){
    vec3 w=e+v*(float(i)+jt)/32.*vt;float fd=fogd(w)*vt/32.;
    for(int j=0;j<2;j++){vec3 d=LP[j]-w;float r2=dot(d,d);vol+=LC[j]*fd*shd(w,j)*(.15+2.5*pow(max(dot(v,d)/sqrt(r2),0.),4.))*5.5/(r2+2.);}
  }
  o=vec4(1.-exp(-(col+GL+vol)*1.5),1);
}`,GLPX,1);
  if(td)TITLE=SC.push(()=>{gm=bp||t*2;td()})-1; // m: the position in beats, for the ball
}
