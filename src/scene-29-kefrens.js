// 29 kefrens bars: one bar per scanline, each line keeps everything drawn above it (done here by searching upwards for the nearest bar that covers the pixel)
shader(`void main(){
  UV/z;u*=R(ro);
  float y=floor((1.-u.y)*70.);vec3 col=vec3(0);
  for(int j=0;j<140;j++){
    float yy=y-float(j);if(yy<0.)break;
    float ph=yy*.04,dx=(u.x-sin(ph*2.3+t*2.1)*.7-sin(ph*5.1-t*3.3)*.35*(.4+l)-sin(t*.7)*.4)/.09;
    if(abs(dx)<1.){col=pal(h+yy*.006+t*.1)*(1.-dx*dx)*(.45+1.2*B[int(mod(yy,140.)/140.*31.)]+k*.5)+pow(max(0.,1.-abs(dx+.3)),6.)*.6;break;}
  }
  o=vec4(col,1);
}`,GLPX*2);
