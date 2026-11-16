// ---- 39 dance floor: a floor of glowing tiles in front of a wall of light, and on it the three cats of the silhouette dance. The wall is the equaliser:
// one column of panels per band, bass in the middle, lit as high as the band is loud. On the floor other tiles fade up on every beat and each kick sends
// a ring of light outwards from the dancer in front. The floor is polished: it mirrors the wall and the dancers. Made for the disco mood; key C.
let FLOOR=-1;
{
  const PT=.22,fl=CATS&&shader(`float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
vec3 wall(vec2 p){ // the wall at the back, p = the spot on it (x, height above the floor)
  vec2 g=p/.5,id=floor(g),f=abs(fract(g)-.5)*2.;int b=int(min(abs(id.x+.5),31.));float e=max(f.x,f.y);
  return pal(h+.1+id.y*.035)*(.1+smoothstep(-.6,1.2,B[b]*15.-id.y)*(.7+.6*B[b])*(1.+.2*k))*smoothstep(.97,.8,e)*(.7+.3*(1.-e))*step(0.,p.y);
}
void main(){
  UV;u*=R(ro);
  vec3 d=vec3(u,1.4*z),v=normalize(vec3(d.x,d.y*cos(${PT})-d.z*sin(${PT}),d.y*sin(${PT})+d.z*cos(${PT}))),c; // the camera: 1 above the floor, looking a little down
  if(1.+v.y*14./v.z>0.)c=wall(vec2(v.x,v.y)*14./v.z+vec2(0,1)); // the wall stands 14 away
  else{
    float s=1./-v.y;vec2 q=v.xz*s,g=q/.7,id=floor(g),f=abs(fract(g)-.5)*2.;float e=max(f.x,f.y),pn=smoothstep(.97,.85,e),rd=length((id+.5)*.7-vec2(0,5.5));
    c=pal(h+.55+hsh(id)*.25)*(mix(step(.62,hsh(id+floor(m-1.)*.37)),step(.62,hsh(id+floor(m)*.37)),smoothstep(0.,.45,fract(m)))*.55+.06+k*.6*exp(-(rd-(1.-k)*9.)*(rd-(1.-k)*9.)*.8))*pn*(.75+.25*(1.-e));
    float s2=(14.-q.y)/v.z;c+=wall(vec2(q.x+v.x*s2,-v.y*s2))*(.12+.5*pow(1.+v.y,4.))*pn; // the mirror image of the wall, stronger at a flat angle
    c*=exp(-s*.02);
  }
  o=vec4(1.-exp(-c*1.6),1);
}`,8e6,1);
  if(fl)FLOOR=SC.push(()=>{
    gm=bp||beats;x.save();fl();x.restore(); // (the shader helper resets the canvas transform)
    CATS.step();
    const ga=x.globalAlpha,cp=cos(PT),sp=sin(PT);x.globalCompositeOperation='source-over';
    for(const[X,Z,dl]of[[-2.4,8,8],[2.4,8,16],[0,5.5,0]]){ // where they stand on the floor > where that is on screen (the same camera as in the shader)
      const dz=sp+Z*cp,px=1.4*X/dz*H/2,py=(cp-Z*sp)/dz*1.4*H/2,sc=1.7/1.21*1.4/dz*H/2,o=CATS.at(dl);
      x.save();x.translate(px,py);
      x.save();x.scale(1,-1);x.translate(0,-.61*sc);x.globalAlpha=ga*.4;CATS.cat(o,0,sc,'#000');x.restore(); // mirrored in the floor
      x.translate(0,-.61*sc); // (the cat's feet are .61 of its size below its origin)
      x.globalAlpha=ga*.45;for(let j=2;j;j--)CATS.cat(CATS.at(dl+j*6),0,sc*(1+j*.05),hs(hue+150+j*40,1,55));
      x.globalAlpha=ga;CATS.cat(o,0,sc,'#000',hs(hue+180,1,70));
      x.restore();
    }
  })-1;
}
