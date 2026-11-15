// 16 rotozoomer over the generated cat texture
shader(`void main(){
  UV/z;u*=R(ro+t*.5)*(1.7+sin(t*.7)*1.3-k*.3);
  vec3 c=texture(T,u*.5+vec2(t*.2,sin(t*.3))).rgb;
  o=vec4(c*pal(h+c.r*.4)*(.7+l)*1.5,1);
}`);
