// ---- scenes after the race (22+): reached with the arrow keys or #N ----
// 22 equaliser city: night flight down an avenue; every tower is a level meter, its windows light up floor by floor with its band
shader(`float H(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}
vec3 sky(vec3 v){
  float y=max(v.y,0.),d=dot(v,normalize(vec3(.2,.33,1)));
  vec3 c=mix(pal(h+.55)*.45*(1.+.7*l),vec3(.01,.01,.04),pow(y,.3));
  vec2 s=v.xy/(abs(v.z)+.3)*70.;
  c+=step(.985,H(floor(s)))*smoothstep(.5,.1,length(fract(s)-.5))*y*3.;
  return c+smoothstep(.9925,.994,d)*vec3(1,.95,.8)+pow(max(d,0.),50.)*pal(h+.1)*.35;
}
void main(){
  UV;u*=R(ro);
  vec3 a=vec3(.5+sin(t*.31)*.22,.9+.5*sin(t*.23),t*2.5),v=normalize(vec3(u.x,u.y+.08,1.25*z)),col;
  v.xz*=R(sin(t*.21)*.35);v.xz+=1e-4;
  vec2 c=floor(a.xz),sg=sign(v.xz),iv=1./abs(v.xz),sd=(c+.5+.5*sg-a.xz)/v.xz;
  float s=0.,hit=0.,id,hh,nx=0.;
  for(int i=0;i<72;i++){ // exact walk through the city grid, cell by cell
    id=H(c);hh=(mod(c.x,4.)<.5||mod(c.y,6.)<.5)?0.:.5+3.*id*id+2.*B[int(id*31.)];
    float se=min(sd.x,sd.y),y1=a.y+v.y*se;
    if(a.y+v.y*s<hh){hit=1.;break;}
    if(y1<hh){s=(hh-a.y)/v.y;hit=2.;break;}
    if(y1<0.){s=-a.y/v.y;hit=3.;break;}
    s=se;
    if(sd.x<sd.y){sd.x+=iv.x;c.x+=sg.x;nx=1.;}else{sd.y+=iv.y;c.y+=sg.y;nx=0.;}
  }
  vec3 q=a+v*s,bg=sky(v);
  if(hit<.5)col=bg;
  else if(hit<1.5){
    vec2 w=vec2(nx>.5?q.z:q.x,q.y)*vec2(7,9),f=fract(w);
    float win=mix(.33,step(.2,f.x)*step(f.x,.8)*step(.25,f.y)*step(f.y,.8),exp(-s*.07)),fl=q.y/hh,on=step(fl,B[int(id*31.)]*1.05);
    col=vec3(.02,.025,.04)+win*(on*pal(h+id*.4+fl*.25)*(1.2+k)+(1.-on)*step(.8,H(floor(w)+c*7.))*vec3(.5,.4,.25)*.5);
  }
  else if(hit<2.5)col=vec3(.03)+pal(h+id)*.06;
  else{ // wet street: lane dashes, a light pulse racing along on the kick, a little sky in the puddles
    vec2 g=fract(q.xz);float av=step(mod(c.x,4.),.5);
    float ln=av>.5?smoothstep(.04,.02,abs(g.x-.5))*step(.5,fract(q.z*.5)):smoothstep(.04,.02,abs(g.y-.5))*step(.5,fract(q.x*.5));
    col=vec3(.015)+ln*pal(h+.5)*(.5+k)+sky(reflect(v,vec3(0,1,0)))*.35+pal(h)*k*.25*exp(-fract(q.z*.05-t*.5)*6.);
  }
  col=mix(hit<.5?bg:pal(h+.55)*.4*(1.+.7*l),col,exp(-s*.045));
  o=vec4(1.-exp(-col*2.2),1);
}`,GLPX*2);
