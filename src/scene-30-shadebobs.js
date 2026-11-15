// 30 shadebobs: four bobs drag trails; where trails pile up the colour climbs the palette
shader(`void main(){
  UV/z;u*=R(ro);float f=0.;
  for(int i=0;i<96;i++){
    float b=float(i%4),a=t*1.3-float(i/4)*.06;
    f+=step(length(u-vec2(sin(a*(1.+.31*b)+b*2.1)*1.3,cos(a*(1.4-.23*b)+b*1.3)*.75)),.17+.14*B[i%4*9+2]+.05*k);
  }
  o=vec4(pal(h+f*.05)*min(1.,f*.25)*(1.+k*.4),1);
}`,GLPX*2);
