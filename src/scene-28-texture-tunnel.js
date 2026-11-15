// 28 texture tunnel: the classic 1/r tunnel wearing the cat texture; it morphs between round and square, the spectrum runs along it as rings
shader(`void main(){
  UV/z;u*=R(ro);u+=vec2(sin(t*.7),cos(t*.5))*.25;
  float e=2.+3.*(.5+.5*sin(t*.4)),rr=pow(pow(abs(u.x),e)+pow(abs(u.y),e),1./e);
  vec2 w=vec2(atan(u.y,u.x)/1.5708+sin(t*.3),.5/rr+t*1.2);
  vec3 c=textureLod(T,w,clamp(log2(.25/rr),0.,6.)).rgb;
  o=vec4((c*pal(h+w.y*.07)*(.7+l+k*.5)*1.6+pal(h+.5)*B[int(fract(w.y*.125)*31.)]*.5)*min(1.,rr*2.2),1);
}`);
