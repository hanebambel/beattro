// ---- 40 suits: an endless zoom through the four suits of a deck of cards. A heart is laid out of small spades, each spade of diamonds, each diamond of
// clubs, each club of hearts again, and every other one of them is the next suit, so red and black always mix. The camera flies into the symbol in the middle; as a symbol grows it hollows out from its middle to an outline and
// what it is made of shows. Over it two bands wind through the picture, carrying the suits along like a river. Card colours only, always: red and black on ivory (no hue, no flash); on the kick the solid symbols swell a little.
let SUITS=-1;
{
  const N=15,PER=16,TW=.5,
    BA=.7,BT=1.25,BR=BA/Math.sin(BT),BH=BR*Math.cos(BT),BP=BR*BT/4,BW=.08,F=v=>v.toFixed(4); // the bands: half the length and half the angle of one of the arcs they are made of, its radius, how far its centre is off the axis, the spacing of the symbols (four per arc), half the width
  // symbols across a symbol (odd: the one in the middle is the way in) = the zoom per level, beats per level, turn per level
  const sd=shader(`const vec3 IV=vec3(.82,.78,.66),RD=vec3(.7,.06,.08),BK=vec3(.06,.05,.06);
float sd(vec2 p,int s){ // roughly the distance to a suit that reaches from -1 to 1: 0 heart, 1 spade, 2 diamond, 3 club (the middle is well inside each of them)
  p.x=abs(p.x);
  if(s==2)return(p.x*1.4+abs(p.y)-.95)*.58;
  if(s==0){p.y+=.08;return min((p.x+abs(p.y)-.707)*.707,length(p-.354)-.5);} // a square on its corner with a circle on each upper side
  float st=max(p.x-.05-.3*pow(clamp((-.3-p.y)/.6,0.,1.),2.),abs(p.y+.45)-.48); // the foot of spade and club
  if(s==1){p=vec2(p.x,(.28-p.y)*.87)/.85;return min(st,min((p.x+abs(p.y)-.707)*.707,length(p-.354)-.5)*.85);} // the heart upside down
  return min(min(st,length(p-vec2(0,.05))-.22),min(length(p-vec2(0,.42)),length(p-vec2(.39,-.12)))-.33);
}
// A band that winds through the picture like a river: arcs of a circle, bending up and down in turn (so the distance to it and the way along it are exact
// and the symbols on it keep their shape). p: the place, x along the axis of the band; mv: how far the bends have travelled; fl: how far the symbols have flowed.
void band(inout vec3 col,vec2 p,float mv,float fl,vec3 c1,vec3 c2,float e){
  p.x+=mv;float i=floor(p.x/${F(2*BA)}+.5),sg,ph;vec2 v;
  for(int n=0;n<2;n++){sg=1.-2.*mod(i,2.);v=p-vec2(i*${F(2*BA)},-sg*${F(BH)});ph=atan(v.x,sg*v.y);if(abs(ph)<=${F(BT)})break;i+=sign(v.x);} // which arc: the one in whose sector the place lies (the arcs meet at a slant)
  float d=length(v)-${F(BR)},ad=abs(d);if(ad>${F(BW+.03)}||abs(ph)>${F(BT+.05)})return;
  float us=(${F(BR)}*ph+i*${F(2*BR*BT)})/${F(BP)}-fl,id=floor(us);vec2 l=vec2((us-id-.5)*${F(BP)},sg*d)/${F(BW*.52)};
  col=mix(col,IV,smoothstep(${F(BW+.016)}+e,${F(BW+.016)}-e,ad));col=mix(col,c2,smoothstep(${F(BW)}+e,${F(BW)}-e,ad));col=mix(col,c1,smoothstep(${F(BW*.86)}+e,${F(BW*.86)}-e,ad)); // a gap in ivory, the edge, the band
  e/=${F(BW*.52)};col=mix(col,IV,max(smoothstep(e,-e,sd(l,int(mod(id,4.)))-.05*k),smoothstep(.13+e,.13-e,length(vec2(abs(l.x)-${F(BP/2/(BW*.52))},abs(l.y)-1.36))))); // the four suits in turn, a dot between them at either edge
}
void main(){
  UV/z;u*=R(ro);vec2 u0=u;
  float f=fract(m),S=pow(${N}.,2.+f),vis=1.;int b=int(m),pa=0;vec2 q=R(-${TW}*(f+1.7))*u/S; // S: the size of a cell of this level on screen (1 = half the height); q: the place in that cell
  vec3 col=IV;
  for(int j=0;j<5;j++){ // from the level far too big to see down to the smallest
    int s=(b+j+pa)&3;float w=smoothstep(.5,1.6,S),px=4.6/r.y/S;vec2 l=q*2.3;
    float d=sd(l,s)-.05*k*(1.-w),hl=mix(.8,.023/S,w), // hl: how deep the colour reaches in from the edge: all the way while small, a line when big
      a=smoothstep(px,-px,d)*smoothstep(-hl-px,-hl+px,d)*smoothstep(9.,3.,S)*vis;
    col=mix(col,(s&1)>0?BK:RD,a);vis*=1.-a; // (what lies under the colour of a symbol stays hidden)
    vec2 g=R(${TW})*q*${N}.,id=floor(g+.5);
    if(sd(R(-${TW})*id*2.3/${N}.,s)>-1./${N}.)break; // only the symbols whose middle is inside make up the big one
    q=g-id;S/=${N}.;pa=int(mod(id.x+id.y,2.));
  }
  float e=2./z/r.y;
  band(col,R(.35)*u0+vec2(0,.5+.06*sin(t*.13)),m*${F(BA)},m*8.,RD,BK,e);
  band(col,R(-.5)*u0-vec2(0,.45+.06*sin(t*.11)),-m*${F(BA)},-m*8.,BK,RD,e);
  u=gl_FragCoord.xy/r-.5;o=vec4(col*(1.-.7*dot(u,u)),1);
}`,8e6,1);
  if(sd)SUITS=SC.push(()=>{gm=((bp||t*2)/PER%4+4)%4;sd()})-1; // m: the level the camera is at, wrapped after the four suits (the picture is the same again)
}
