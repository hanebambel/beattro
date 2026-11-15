// 19 moire: two sets of rings interfering, ring density follows the bass
shader(`void main(){
  UV/z;u*=R(ro);
  float f=22.+14.*l,a=smoothstep(-.3,.3,sin(length(u-vec2(sin(t*.7),cos(t*.5))*.7)*f)),b=smoothstep(-.3,.3,sin(length(u-vec2(cos(t*.4),sin(t*.9))*.7)*f));
  o=vec4(mix(pal(h)*.12,pal(h+.5),a+b-2.*a*b)*(.7+k*.5),1);
}`);
