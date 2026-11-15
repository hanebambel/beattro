// 25 cat choir: an endless row of porcelain lucky cats on a mirror floor; every cat raises its paw with its own band, all bounce on the kick
shader(`float ID,MT;vec3 V;
float el(vec3 q,vec3 e){return (length(q/e)-1.)*min(e.x,min(e.y,e.z));}
float cap(vec3 q,vec3 A,vec3 C,float w){vec3 pa=q-A,ba=C-A;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.))-w;}
float sm(float x,float y,float w){float e=clamp(.5+.5*(y-x)/w,0.,1.);return mix(y,x,e)-w*e*(1.-e);}
float map(vec3 q){
  float fl=q.y,c=floor(q.x/2.2+.5);q.x-=c*2.2;ID=fract(sin(c*91.7)*43758.5);
  float lv=B[int(ID*31.)],wl=(sign(V.x)*1.1-q.x)/V.x+.02; // never step past the cell wall into the neighbour cat
  q.y-=.12*k;
  vec3 hq=q-vec3(0,1.28,0);hq.xy*=R(sin(t*2.+ID*6.)*.13);
  vec3 e=vec3(abs(hq.x)-.3,hq.y-.4,hq.z),fq=vec3(abs(q.x)-.27,q.y-.12,q.z+.33);
  float w=.25+1.*lv+.3*k;vec3 sh=vec3(.4,.85,-.1),pw=sh+.62*vec3(.1,cos(w),-sin(w));
  float d=sm(el(q-vec3(0,.55,0),vec3(.5,.6,.45)),el(hq,vec3(.52,.44,.45)),.08);
  d=sm(d,max((abs(e.x)*1.4+abs(e.z)*2.2+e.y-.2)*.4,-e.y-.15),.05);
  d=sm(d,cap(q,sh,pw,.12),.06);d=sm(d,length(q-pw)-.16,.05);
  d=min(d,min(length(fq)-.17,length(q-vec3(-.34,.5,-.36))-.15));
  float co=length(vec2(length(q.xz)-.37,q.y-.97))-.055,be=length(q-vec3(0,.86,-.42))-.1;
  float ey=length(vec3(abs(hq.x)-.2,hq.y-.05,hq.z+.39))-.07,no=length(hq-vec3(0,-.07,-.45))-.04;
  MT=0.;
  if(co<d){d=co;MT=1.;}if(be<d){d=be;MT=2.;}if(ey<d){d=ey;MT=3.;}if(no<d){d=no;MT=1.;}if(fl<d){d=fl;MT=4.;}
  return min(d*.85,wl);
}
vec3 bg(vec3 v){return pal(h+.6+v.x*.1)*(.05+.12*l)*(1.+2.*pow(.5+.5*sin(atan(v.x,v.y)*9.+t),8.));} // stage light fans
void main(){
  UV;u*=R(ro);
  vec3 a=vec3(t*.7,1.15+.3*sin(t*.4),-3.4),v=normalize(vec3(u.x,u.y-.05,1.5*z)),col=vec3(0),at=vec3(1);
  v.xz*=R(sin(t*.3)*.35);
  for(int b=0;b<2;b++){
    float s=0.,d;V=v+1e-4;
    for(int i=0;i<(b<1?80:40);i++){d=map(a+v*s);if(d<.002||s>40.)break;s+=d;}
    if(d>.01){col+=at*bg(v);break;}
    vec3 q=a+v*s,c;float id=ID,mt=MT,lv=B[int(ID*31.)],rf=0.;
    vec2 e=vec2(.002,-.002);
    vec3 n=normalize(e.xyy*map(q+e.xyy)+e.yyx*map(q+e.yyx)+e.yxy*map(q+e.yxy)+e.xxx*map(q+e.xxx));
    float df=.2+.8*max(dot(n,normalize(vec3(-.4,.8,-.6))),0.),sp=pow(max(dot(reflect(v,n),normalize(vec3(-.4,.8,-.6))),0.),30.);
    vec3 gl=pal(h+id)*(.15+1.3*lv); // each cat's own stage light
    if(mt>3.5){float cx=q.x-floor(q.x/2.2+.5)*2.2;rf=.45;c=vec3(.03+.05*mod(floor(q.x/1.1)+floor(q.z/1.1),2.))+gl*.5*exp(-(cx*cx+q.z*q.z)*1.2);}
    else if(mt>2.5)c=gl*2.*sp+gl*.3;
    else if(mt>1.5)c=vec3(1,.7,.15)*df+sp;
    else if(mt>.5)c=vec3(.8,.05,.08)*df+sp*.5;
    else c=vec3(.95,.92,.86)*df*(.55+gl)+sp*.7+pow(1.+dot(v,n),3.)*gl;
    float f=exp(-s*.045);
    col+=at*mix(bg(v),c*(1.-rf),f);
    at*=rf*f;if(rf<.1)break;
    a=q+n*.01;v=reflect(v,n);
  }
  o=vec4(1.-exp(-col*1.7),1);
}`,GLPX);
