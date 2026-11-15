// 27 kaleidoscope: six mirrors, five folds; each fold draws a ring whose size is a band
shader(`void main(){
  UV/z;u*=R(ro+t*.1);
  float rr=length(u),a=abs(mod(atan(u.y,u.x),1.0472)-.5236),sc=1.;vec2 q=rr*vec2(cos(a),sin(a));vec3 col=vec3(0);
  for(int i=0;i<5;i++){
    q=abs(q)-vec2(.5+.1*sin(t*.3),.25+.2*l);q*=R(t*.2+float(i)*.7)*1.35;sc*=1.35;
    col+=pal(h+float(i)*.13+rr*.3-t*.1)*.004/(abs(length(q)-.4-.5*B[i*6])/sc+.002);
  }
  o=vec4(1.-exp(-col*(1.+k)),1);
}`);
