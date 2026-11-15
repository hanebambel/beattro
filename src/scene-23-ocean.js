// 23 ocean: a heaving sea under a striped sun; the spectrum hangs in the sky as an aurora and glitters back off the waves
shader(`float wv(vec2 q,int n){
  float y=0.,am=.5,f=.4;
  for(int i=0;i<n;i++){q*=R(1.1);y+=am*(1.-abs(sin(q.x*f+t*sqrt(f)*1.3)));am*=.5;f*=1.9;}
  return y*(.6+.6*l);
}
vec3 sky(vec3 v){
  float y=max(v.y,0.),az=atan(v.x,v.z);int i=int(min(abs(az)*20.,31.));
  vec3 c=mix(pal(h+.05)*.7,pal(h+.6)*.08,pow(y,.4));
  vec2 s=v.xy/max(v.z,.01)-vec2(0,.16);float d=length(s);
  c+=smoothstep(.2,.19,d)*step(0.,v.z)*mix(pal(h+.15),vec3(1,.9,.6),s.y*4.+.5)*(s.y>0.?1.:step(.45,fract(s.y*22.-t*.5)))*(1.4+k);
  c+=pal(h+.1)*.25/(1.+d*d*30.)*(1.+k);
  return c+pal(h+.3+float(i)*.012)*B[i]*smoothstep(.12+.5*B[i],.0,v.y)*(.5+.3*sin(az*70.+t*2.))*.6;
}
void main(){
  UV;u*=R(ro);
  vec3 a=vec3(0,2.+.4*sin(t*.5),t*3.),v=normalize(vec3(u.x,u.y-.12,1.4*z)),col=sky(v);
  if(v.y<0.){
    float s=(a.y-1.3)/-v.y,d;
    for(int i=0;i<40;i++){vec3 q=a+v*s;d=q.y-wv(q.xz,4);if(d<.004*s)break;s+=d*.75;}
    vec3 q=a+v*s;float e=.02+s*.004;
    vec3 n=normalize(vec3(wv(q.xz-vec2(e,0),7)-wv(q.xz+vec2(e,0),7),2.*e,wv(q.xz-vec2(0,e),7)-wv(q.xz+vec2(0,e),7)));
    vec3 rf=reflect(v,n);rf.y=abs(rf.y);
    float fr=.04+.96*pow(1.-max(dot(-v,n),0.),5.);
    col=mix(mix(vec3(0,.03,.06)+pal(h+.55)*.04,sky(rf),fr),col,1.-exp(-s*.012));
  }
  o=vec4(1.-exp(-col*1.8),1);
}`,GLPX);
