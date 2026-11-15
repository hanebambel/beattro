// 20 menger sponge: flight down an endless fractal corridor, shaded by march step count, spectrum as light bands along the way
shader(`float map(vec3 p){
  float d=-1e3,s=1.;
  for(int m=0;m<4;m++){vec3 a=mod(p*s,2.)-1.;s*=3.;vec3 q=abs(1.-3.*abs(a));d=max(d,(min(max(q.x,q.y),min(max(q.y,q.z),max(q.z,q.x)))-1.)/s);}
  return d;
}
void main(){
  UV;u*=R(ro+t*.15);
  vec3 a=vec3(0,0,t*.8),v=normalize(vec3(u,1.1*z));v.xz*=R(sin(t*.3)*.5);v.yz*=R(cos(t*.23)*.4);
  float s=0.,d,g=0.;
  for(int i=0;i<70;i++){d=map(a+v*s);if(d<.0008*s+.0003||s>12.)break;s+=d;g++;}
  g/=70.;vec3 p=a+v*s;
  vec3 c=pal(h+g*.6+p.z*.04)*(g*2.2+.1)*(.6+l*.8)+pal(h+.5)*g*(k+B[int(fract(p.z*.25)*31.)]);
  o=vec4(c*exp(-s*.2)+pal(h+.6)*.03,1);
}`,GLPX);
