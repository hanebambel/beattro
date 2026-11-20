// 24 black hole: light rays bend around it; the accretion disc is the spectrum, bass at the inner edge, treble outside; stars circle in the disc,
// the inner ones faster, and like the disc they show a second time above and below the hole, where their light is bent around it
// The hole itself is shared with the grand tour (scene 41), which ends at it: hole() follows one ray (a: where it starts, the hole in the middle with its edge at 1; v: its
// direction, which comes back bent) and returns the light of the disc on the way; al: how much of the sky behind still shows (0: the ray fell in); e2: how far out to follow it (squared); kk: how much the disc swells with the kick.
const HOLE=`float H(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}
vec3 hole(inout vec3 a,inout vec3 v,out float al,float e2,float kk){
  vec3 col=vec3(0);al=1.;
  for(int i=0;i<120;i++){
    float d2=dot(a,a),ds=.07*sqrt(d2);
    if(d2<1.){al=0.;break;}
    if(d2>e2)break;
    v=normalize(v-a/(d2*sqrt(d2))*ds*1.5);
    vec3 b=a+v*ds;
    if(a.y*b.y<0.){ // crossed the disc plane
      vec3 q=mix(a,b,a.y/(a.y-b.y));float rr=length(q.xz),bn=(rr-1.8)/4.2,an=atan(q.z,q.x);
      if(rr>1.6&&rr<8.){ // stars: rings a third of a unit wide, each divided into cells that turn at the speed of an orbit at that radius; some cells hold a star, twinkling with the treble
        float rs=rr*3.,ri=floor(rs),rc=(ri+.5)/3.,nc=floor(rc*6.)+3.,th=(an+t*2.5/pow(rc,1.5))/6.2832*nc;
        vec2 cl=vec2(ri,mod(floor(th),nc)),dd=vec2((fract(th)-.5-(H(cl)-.5)*.5)*6.2832*rc/nc,(fract(rs)-.5-(H(cl+7.)-.5)*.5)/3.);
        col+=al*step(.6,H(cl+3.))*mix(vec3(1,.9,.7),vec3(.7,.85,1),H(cl+5.))*(.6+1.5*B[20+int(H(cl+9.)*11.)])*.0011/(dot(dd,dd)+.00035)*smoothstep(8.,6.,rr);
      }
      if(bn>0.&&bn<1.){
        float tex=.6+.4*sin(rr*13.+sin(an*2.+t*4./rr)*3.);
        col+=al*mix(vec3(1,.85,.6),pal(h+bn*.6),.75)*(.12+1.7*B[int(bn*31.)])*tex*smoothstep(1.,.75,bn)*smoothstep(0.,.07,bn)/(.35+bn*1.5)
          *(1.+.7*dot(normalize(vec3(-q.z,0,q.x)),v))*(1.+kk);
        al*=.3;
      }
    }
    a=b;
  }
  return col;
}
`;
shader(HOLE+`void main(){
  UV;u*=R(ro+.35);
  float ca=t*.15,al;
  vec3 a=vec3(sin(ca)*9.,1.3+sin(t*.2)*.9,-cos(ca)*9.),f=normalize(-a),rx=normalize(cross(vec3(0,1,0),f)),v=normalize(u.x*rx+u.y*cross(f,rx)+f*1.7*z),col=hole(a,v,al,300.,k);
  vec2 sp=vec2(atan(v.x,v.z),asin(clamp(v.y,-1.,1.)))*38.,ci=floor(sp);
  col+=al*(step(.9,H(ci))*smoothstep(.35,0.,length(fract(sp)-.5-(vec2(H(ci+1.),H(ci+2.))-.5)*.5))*pal(H(ci+3.))*1.5+pal(h+.4+v.y*.2)*.03);
  o=vec4(1.-exp(-col*1.6),1);
}`,GLPX*2);
