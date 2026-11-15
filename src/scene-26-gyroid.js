// 26 gyroid: flight through an endless minimal-surface cave; the walls thicken where their band is loud
shader(`vec2 pth(float w){return vec2(sin(w*.3)*1.2,cos(w*.23));}
float map(vec3 q){
  float g=abs(dot(sin(q*1.5),cos(q.yzx*1.5)))/1.5-.03-.12*B[int(fract(q.z*.05)*31.)];
  return max(g*.7,.5-length(q.xy-pth(q.z)));
}
void main(){
  UV;u*=R(ro+t*.1);
  float w=t*2.,s=0.,d,g=0.;
  vec3 a=vec3(pth(w),w),f=normalize(vec3(pth(w+1.)-pth(w),1.)),rx=normalize(cross(vec3(0,1,0),f)),v=normalize(u.x*rx+u.y*cross(f,rx)+f*1.1*z);
  for(int i=0;i<64;i++){d=map(a+v*s);if(d<.001*s+.0005||s>25.)break;s+=d;g++;}
  vec3 q=a+v*s;vec2 e=vec2(.01,-.01);
  vec3 n=normalize(e.xyy*map(q+e.xyy)+e.yyx*map(q+e.yyx)+e.yxy*map(q+e.yxy)+e.xxx*map(q+e.xxx));
  float bd=B[int(fract(q.z*.05)*31.)];
  vec3 c=pal(h+q.z*.03+n.y*.15)*(.25+.75*max(dot(n,-v),0.))*(.5+1.5*bd)+pal(h+.5)*pow(1.+dot(v,n),2.)*(.5+k)+pal(h+.3)*g/64.*(.6+l)+pal(h+.55+q.z*.03)*smoothstep(.07,0.,abs(fract(q.y*3.+q.z*.5+t*.3)-.5))*(.25+1.5*bd);
  o=vec4(1.-exp(-c*exp(-s*.13)*2.),1);
}`,GLPX*1.5);
