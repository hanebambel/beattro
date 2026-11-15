// 17 metaballs: eight blobs, each sized by a band
shader(`void main(){
  UV/z;u*=R(ro);float f=0.;
  for(int i=0;i<8;i++){
    float a=float(i),s=.13+.22*B[i*4];
    vec2 c=vec2(sin(t*(.5+a*.13)+a*2.)*1.2,cos(t*(.4+a*.11)+a)*.7);
    f+=s*s/dot(u-c,u-c);
  }
  o=vec4(pal(h+f*.12)*smoothstep(.95,1.05,f)+pal(h+.5)*min(f,1.)*.3*(1.+k),1);
}`);
