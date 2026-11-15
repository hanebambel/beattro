// 15 the heavy one: a raymarched, endless lattice of chrome cat heads with one reflection bounce.
// Every cat listens to its own frequency band: it swells and its eyes glow with it; pupils widen with the bass, heads nod on the beat.
shader(`float E,N,ID,MT;vec3 Q,V;
float H(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5);}
float map(vec3 p){
  vec3 c=floor(p/3.+.5);p-=c*3.;ID=H(c);
  vec3 w=(sign(V)*1.5-p)/V;float wl=min(w.x,min(w.y,w.z))+.02; // distance to the cell wall along the ray V: never step past it into a neighbour cat
  p.xz*=R(sin(t*.7+ID*6.3)*.5);p.yz*=R(sin(t+ID*9.)*.2-k*.3);
  float s=1.+.35*B[int(ID*31.)];p/=s;p.x=abs(p.x);Q=p;
  float d=length(p*vec3(1,1.15,1.1))-.5; // head
  vec3 q=p-vec3(.28,.38,0);
  float e=max((abs(q.x)*1.6+abs(q.z)*2.5+q.y-.32)*.35,-q.y-.2); // ear
  float m=max(.06-abs(d-e),0.)/.06;d=min(d,e)-m*m*.015;
  E=length(p-vec3(.19,.06,-.4))-.1; // eye
  N=length(p-vec3(0,-.07,-.45))-.045; // nose
  MT=E<min(d,N)?1.:N<d?2.:0.;
  return min(min(d,min(E,N))*s*.8,wl);
}
void main(){
  UV;u*=R(ro);
  vec3 a=vec3(1.5+sin(t*.4)*.6,1.5+cos(t*.3)*.5,t*2.5),v=normalize(vec3(u,1.3*z)),col=vec3(0),at=vec3(1),G=vec3(0);
  for(int b=0;b<2;b++){
    float s=0.,d;V=v+1e-4;
    for(int i=0;i<(b<1?90:32);i++){
      d=map(a+v*s);
      G+=at*pal(ID+h+.5)*(.2+B[int(ID*31.)])*.02/(1.+E*E*80.); // eye glow
      if(d<.002||s>45.)break;s+=d;
    }
    vec3 bg=pal(h+.6+v.y*.15)*(.06+.1*l);
    if(d>.002){col+=at*bg;break;} // flew out or ran out of steps
    vec3 p=a+v*s,q=Q,c;float id=ID,m=MT,bd=B[int(ID*31.)],rf=0.;
    vec2 e=vec2(.002,-.002);
    vec3 n=normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));
    if(m>1.5)c=vec3(1,.4,.6);
    else if(m>.5){float w=.012+.06*l;c=pal(id+h+.5)*(.5+2.*bd)*smoothstep(w,w+.02,abs(q.x-.19))+.05;}
    else{rf=.45;c=pal(id+h)*(.6+.4*sin(q.y*26.+sin(q.x*12.)*2.))*(.15+.85*max(dot(n,normalize(vec3(.5,.8,-.6))),0.))*(1.+k)+pow(1.+dot(v,n),3.)*pal(h+.3)*.6;}
    float f=exp(-s*.05);
    col+=at*mix(bg,c*(1.-rf),f);
    at*=rf*f;if(rf<.1)break;
    a=p+n*.01;v=reflect(v,n);
  }
  o=vec4(1.-exp(-(col+G)*1.6),1);
}`,GLPX);
