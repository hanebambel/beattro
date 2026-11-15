// 18 julia fractal: the constant wanders and two bands push it around
shader(`void main(){
  UV/z;u*=R(ro+t*.1)*(1.3-.2*l);
  vec2 c=vec2(-.8+.12*cos(t*.31)+.08*B[3],.156+.12*sin(t*.23)+.08*B[14]),q=u;float n=0.;
  for(int i=0;i<90;i++){q=vec2(q.x*q.x-q.y*q.y,2.*q.x*q.y)+c;if(dot(q,q)>16.)break;n++;}
  if(n>89.)o=vec4(pal(h+.5)*.1*(1.+3.*k),1);
  else{n-=log2(log2(dot(q,q)))-1.;o=vec4(pal(h+n*.035)*(.35+.65*n/(n+8.))*(.8+k*.5),1);}
}`,3e6);
