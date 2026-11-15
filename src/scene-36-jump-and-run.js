// ---- 36 jump & run through the console generations: a small knight runs to the right over platforms, hopping over gaps and steps.
// 8-bit: 160 x 90 pixels, a handful of colours, flat tiles. 16-bit: twice the resolution, shaded tiles, hills and clouds that scroll at their own speeds.
// Then the picture gains a third dimension: every pixel of the knight becomes a little cube, every tile a block, and the camera, which looked at the game
// from the side all along, swings round behind him. From there on the world grows up: the resolution climbs, the day turns into a stormy night, moorland
// rises around the causeway with dead trees on it, grass grows on the blocks, torches light the wet stone, rain falls, fog closes in, and ahead on its hill
// stands a dark castle with battlements and a few lit windows, the moon behind it.
// The 2D part is drawn pixel by pixel in JavaScript; the 3D part is boxes (knight: 2304 possible cubes, kept where both his side view and his back view
// have a pixel), a terrain grid and a sky, all placed in the vertex shader. Both read the same level, so the switch is seamless.
let JUMP=-1;
{
  const PAL={k:[20,16,24],s:[154,164,184],S:[216,224,240],r:[200,40,60],R:[240,96,112],f:[240,192,144],b:[106,68,40],y:[232,192,64],d:[90,100,120]};
  const TOP=['....rr......','...rRRr.....','...ksSSk....','..ksSSSSk...','..kSSkkfk...','..ksSSSfk...','...kssskk...','..rkSsSSk...','.rrkSsSSky..','.rrksSSsk...','.rrkdssdk...','..rkddddk...'];
  const SIDE=[[...TOP,'...kd.kdk...','...kd..kd...','..kbb..kbb..','..kkk..kkk..'],[...TOP,'....kddk....','....kdk.....','...kbbk.....','...kkkk.....']]; // the knight from the side, two running frames (12 x 16)
  const BACK=['.....rr.....','....rRRr....','...kSSSSk...','..kSSssSSk..','..kSssssSk..','..kSSssSSk..','...kssssk...','..krrrrrrk..','.kSrrRRrrSk.','.kSrrRRrrSk.','..krrrrrrk..','..krrrrrrk..','...kd..dk...','...kd..dk...','..kbb..bbk..','..kkk..kkk..']; // and from behind
  const SPX=new Uint8Array(24*32*4);
  for(let f=0;f<2;f++)for(let y=0;y<16;y++)for(let c=0;c<24;c++){const ch=(c<12?SIDE[f][y][c]:BACK[y][c-12]),q=PAL[ch];if(q)SPX.set([...q,255],((f*16+y)*24+c)*4)}
  // the level: height of the ground in tiles per column, 0 = a gap; and the knight's height over it (he hops over gaps and steps)
  const hgt=i=>i%11==7?0:max(2,4+floor(sin(i*.35)*1.5+sin(i*.13)*1.2));
  const cyT=X=>{
    for(let b=floor(X-1.7);b<=floor(X)+1;b++){
      const g=!hgt(b),a=g?b-.7:b-.6,e=g?b+1.7:b+.4,h0=hgt(b-1)||hgt(b-2),h1=g?hgt(b+1)||hgt(b+2):hgt(b);
      if(X>=a&&X<e&&(g||hgt(b-1)&&h1!=h0)){const s=(X-a)/(e-a);return h0+(h1-h0)*s*s*(3-2*s)+(g?1.7:.5+abs(h1-h0)*.4)*4*s*(1-s)}
    }
    return hgt(floor(X))||hgt(floor(X)-1);
  };
  const JB=buf(320,180);let t0=0,lc=-9,dur=24;
  const q4=v=>(v>>6)*85; // 8-bit: four levels per colour channel
  const TH=new Float32Array(12);
  function flat(camL,X,Y,fr,m){ // the game as pixels; m: 0 = 8-bit, 1 = 16-bit, between: the tiles change over one by one
    const p=JB.p,KC=floor(X/16);
    for(let sx=0;sx<320;sx++){
      const ti=floor((floor(camL)+sx)/16),xx=sx&~1,wx0=floor(camL)+sx; // 16-bit arrives tile by tile: the tiles near the knight first, the rest in a wave outwards, in random order
      for(let j=0;j<12;j++){const v=sin(ti*127.1+j*311.7)*43758.5;TH[j]=m*1.8-(v-floor(v))*.6-min(1,abs(ti-KC)/14)}
      let wx=wx0,i=ti,H=hgt(i)*16,tx=((wx%16)+16)%16;const 
        
        h1=64+26*sin((wx*.35+900)*.011)+10*sin(wx*.35*.037),h2=44+18*sin((wx*.6+300)*.017)+7*sin(wx*.6*.051);
      for(let sy=0;sy<180;sy++){
        const tv=TH[(179-sy)>>4],hp=tv>0,yy=hp?sy:sy&~1,wy=179-yy;let r,g,b;
        if(!hp&&wx!=floor(camL)+xx){wx=floor(camL)+xx;i=floor(wx/16);H=hgt(i)*16;tx=((wx%16)+16)%16}else if(hp&&wx!=wx0){wx=wx0;i=ti;H=hgt(i)*16;tx=((wx%16)+16)%16}
        if(wy<H){ // ground
          if(hp){const d=H-wy;if(d<5){r=50+d*8;g=190-d*14;b=60}else{const sp=(wx*13+wy*7)%11<2,ln=tx==0||wy%8==0;r=150-(sp?30:0)-(ln?24:0)-d*.25;g=96-(sp?20:0)-(ln?18:0)-d*.2;b=48-(ln?10:0)}}
          else if(H-wy<4){r=0;g=168;b=0}else{const ln=tx<2||wy%8<2;r=ln?90:200;g=ln?30:76;b=12}
        }else if(hp){ // 16-bit sky: gradient, two ranges of hills, clouds
          const cl=sin((wx*.2+yy*3)*.02)+sin(wx*.2*.045+yy*.11);
          if(wy<h2){r=40;g=150-(h2-wy)*.5;b=90}else if(wy<h1){r=70;g=130;b=175}
          else if(cl>1.35&&wy>110){r=g=b=250}else{r=90+yy*.5;g=150+yy*.35;b=250}
        }else{r=92;g=148;b=252}
        if(hp&&tv<.12){const f=(1-tv/.12)*150;r+=f;g+=f;b+=f} // a tile flashes as it changes
        p[sy*320+sx]=hp?rgb(clamp(r),clamp(g),clamp(b)):rgb(q4(clamp(r)),q4(clamp(g)),q4(clamp(b)));
      }
    }
    for(let y=0;y<16;y++)for(let c=0;c<12;c++){ // the knight
      const o=((fr*16+y)*24+c)*4;if(!SPX[o+3])continue;
      for(let k=0;k<(m<.5?4:1);k++){const sx=floor(X-camL)-6+(m<.5?(c&~1)+(k&1):c),sy=179-floor(Y)-15+(m<.5?(y&~1)+(k>>1):y),oo=m<.5?((fr*16+(y&~1))*24+(c&~1))*4:o;
        if(sx>=0&&sx<320&&sy>=0&&sy<180&&SPX[oo+3])p[sy*320+sx]=m<.5?rgb(q4(SPX[oo]),q4(SPX[oo+1]),q4(SPX[oo+2])):rgb(SPX[oo],SPX[oo+1],SPX[oo+2])}
    }
    x.imageSmoothingEnabled=false;x.drawImage(JB.put(),-W/2,-H/2,W,H);x.imageSmoothingEnabled=true;
  }
  let solid=0;
  if(gl){
    const CM=`precision highp float;precision highp int;
uniform mat4 VP;uniform vec3 cam,cr,cu,cf,CC,CA,fogc,sun,mdir;uniform vec4 CB[16];uniform float t,k,h,g,ap,fr,I0,m3,sa,hs[64],B[32];uniform int M;uniform sampler2D SP,NZ;
float H(vec2 c){return fract(sin(dot(c,vec2(127.1,311.7)))*43758.5);}
float nz(vec2 q){return textureLod(NZ,q,0.).r;}
// every column of the level has its own moment for each step: w = how far the step has got overall; near the knight first, then a wave, random within it
float own(float w,float col,float sd){return clamp((w*1.8-H(vec2(col,sd))*.6-min(1.,abs(col-CC.x/16.)/26.))*5.,0.,1.);}
float th(vec2 q){ // the land beside the causeway: rolling moor, low next to the path, a hill where the castle stands
  float y=-70.+(nz(q*.0006)-.5)*260.+nz(q*.0035)*50.*g;
  y=mix(-46.,y,smoothstep(70.,260.,abs(q.y)));
  return mix(y,CA.y+10.,exp(-dot(q-CA.xz,q-CA.xz)/5e5))-(1.-ap)*500.;
}
vec3 torch(vec3 p,vec3 n){ // the light of the torches near a point: the pair on the nearest sixth column and the pair on the one after it
  vec3 L=vec3(0);float pc=p.x/16.-.5,c0=floor(pc/6.+.5)*6.;
  for(int i=0;i<2;i++){
    float cc=c0+float(i)*(pc>c0?6.:-6.);int ci=int(cc-I0);if(ci<0||ci>63||hs[ci]<1.)continue;
    for(int j=0;j<2;j++){vec3 d=vec3(cc*16.+8.,hs[ci]*16.+17.,float(j)*104.-52.)-p;float r2=dot(d,d);L+=vec3(1,.5,.15)*max(dot(n,d)/sqrt(r2),0.)*(.7+.5*B[3]+.3*sin(t*9.+cc))*900./(r2+250.);}
  }
  return L*ap;
}
`;
    const jp=gl.createProgram(),jf=cmp(gl.FRAGMENT_SHADER,CM+`in vec3 P,N,C1,C2;out vec4 o;
void main(){
  vec3 c,e=vec3(0),n=normalize(N);float ng=smoothstep(0.,.6,g),d=length(P-cam);
  if(M==4){ // sky: a game sky of flat blue with blocky clouds by day; later night clouds, a moon over the castle, sheet lightning on hard kicks
    vec3 v=normalize(cf+P.x*cr+P.y*cu);vec2 w=v.xz/(abs(v.y)+.25);
    float cl=smoothstep(.45,.7,nz(w*.12+t*.004)*.65+nz(w*.31-t*.006)*.35),m=max(dot(v,mdir),0.);
    vec3 day=mix(vec3(.75,.88,1),vec3(.36,.58,.98),smoothstep(0.,.6,v.y))+step(.62,nz(floor(w*14.)/14.*.07+t*.002))*.25*step(.05,v.y),
      nt=mix(vec3(.15,.19,.28),vec3(.02,.03,.07),smoothstep(0.,.55,v.y));
    nt=mix(nt,vec3(.07,.09,.13)+vec3(.45,.5,.6)*pow(m,5.)*.6,cl*.8)+vec3(1,.96,.85)*smoothstep(.9985,.999,m)*(1.-cl*.7)+vec3(.5,.6,.8)*pow(m,60.)*.5+vec3(.5,.55,.8)*cl*k*k*.5;
    o=vec4(mix(day,nt,ng)*sa,sa);return; // sa: the sky only comes once all blocks have become solid (until then the pixel picture shows)
  }
  vec3 V=normalize(cam-P);
  if(M==0)c=abs(n.x)>.5?C2:C1; // the knight: side faces show his side view, front and back his back view
  else if(M==1){ // a block of the level: grass on top, bricks below; earth by day, wet stone by night
    // the textures grow up too: from two-unit pixels to fine grain; stone gets a wet sheen, the tops get puddles, steps and the knight throw soft shadows
    vec2 q=abs(n.z)>.5?P.xy:P.zy;float br=step(.12,fract(q.y/8.))*step(.06,fract(q.x/16.+floor(q.y/8.)*.5)),lg=own(g,floor(P.x/16.),9.),sp=mix(H(floor(q/2.)),nz(q*.045)*1.5,lg),ao=1.; // lg: this column's own share of the detail
    int ci=int(floor(P.x/16.)-I0);
    if(n.y>.5){
      float fx=fract(P.x/16.),pd=smoothstep(.62,.7,nz(P.xz*.011))*lg,kd=dot(P.xz-CC.xz,P.xz-CC.xz);
      if(ci>0&&ci<63){if(hs[ci+1]>hs[ci])ao*=.5+.5*smoothstep(0.,.6,1.-fx);if(hs[ci-1]>hs[ci])ao*=.5+.5*smoothstep(0.,.6,fx);}
      ao*=1.-.55*exp(-kd/70.)*step(abs(P.y-CC.y),24.);
      c=mix(mix(vec3(.2,.62,.2),vec3(.05,.1,.07),lg)*(.8+.4*mix(H(floor(P.xz/2.)),nz(P.xz*.06)*1.4,lg)),fogc*.9,pd*.8);
      e=pd*(torch(P,reflect(-V,n))*.25+vec3(.5,.6,.8)*pow(max(dot(reflect(-V,n),mdir),0.),40.));
    }else{
      ao*=.6+.4*smoothstep(0.,26.,P.y);
      c=mix(vec3(.6,.38,.2),vec3(.16,.16,.2),lg)*(.55+.45*br)*(.85+.3*sp)+fogc*pow(1.-max(dot(n,V),0.),3.)*.35*lg;
    }
    c*=ao;e+=vec3(.9,1,1)*(C1.x*C1.x*.9+lg*(1.-lg)*1.2); // a block flashes as it becomes solid, and again as it gets its detail
  }else if(M==5){c=vec3(.05,.04,.04);e=vec3(1,.5,.12)*step(.55,C1.y)*(1.5+2.*B[3]+k);} // a torch: post and flame
  else if(M==6)c=mix(vec3(.02,.06,.03),vec3(.1,.24,.1),C1.y)*(.6+.8*C1.x); // a blade of grass
  else if(M==7)c=vec3(.035,.028,.024)*(.6+.8*nz(P.xy*.03)); // a dead tree
  else if(M==2){n=normalize(cross(dFdx(P),dFdy(P)));if(n.y<0.)n=-n;c=mix(vec3(.2,.5,.2),mix(vec3(.05,.08,.05),vec3(.1,.08,.07),nz(P.xz*.004)),ng)*(.7+.6*nz(P.xz*.02));} // moor
  else{ // the castle: nearly black stone, a few windows lit and flickering
    vec2 q=vec2((abs(n.x)>.5?P.z:P.x)/11.,P.y/15.);if(abs(n.y)<.5&&P.y>C2.x-16.&&fract(q.x*.55)>.5)discard; // battlements: every other bit of the top edge is cut away
    float wn=step(.86,H(floor(q)+C1.x*7.))*step(.3,fract(q.x))*step(fract(q.x),.7)*step(.25,fract(q.y))*step(fract(q.y),.8);
    c=vec3(.035,.035,.045)*(.6+.8*nz(P.xy*.01+P.z*.01));e=vec3(1,.6,.2)*wn*(.7+.6*sin(t*7.+H(floor(q))*40.)*B[5]);
  }
  float dif=max(dot(n,sun),0.);
  c=c*mix(vec3(.5)+dif*vec3(.7,.68,.6),vec3(.12,.15,.23)+dif*vec3(.45,.52,.7)+pow(1.-max(dot(n,V),0.),4.)*.25+(M==3?vec3(0):torch(P,n)),ng)+e; // by night: moonlight from behind the castle, a rim of light, and the torches
  o=vec4(mix(c,fogc,1.-exp(-d*mix(.00015,.0011,ng)*(1.+ng*1.5*exp(-max(P.y+40.,0.)*.015)))),1); // fog, thicker low down
}`);
    gl.attachShader(jp,cmp(gl.VERTEX_SHADER,CM+`out vec3 P,N,C1,C2;
void main(){
  int i=gl_VertexID,n=gl_InstanceID,f=i/6,j=i%6;vec2 a=vec2(j==1||j>3,j==2||j==3||j==5)*2.-1.;vec3 p,s=vec3(1),q;C1=C2=vec3(0);
  if(M==4){gl_Position=vec4(vec2(i%2,i/2)*4.-1.,1,1);P=gl_Position.xyz;N=vec3(0,1,0);return;}
  if(M==2){ // terrain: 72 x 72 cells of 28 units around the knight
    vec2 w=(vec2(i/6%72,i/6/72)+(a*.5+.5)-36.)*28.+floor(CC.xz/28.)*28.;P=vec3(w.x,th(w),w.y);N=vec3(0,1,0);gl_Position=VP*vec4(P,1);return;
  }
  if(M==6){ // grass on the blocks: 140 blades per column, one quad each, swaying; it grows as the world grows up
    int ci=n%64;float m=float(n/64),hh=hs[ci]*16.,r1=H(vec2(I0+float(ci),m)),r2=H(vec2(m,I0+float(ci))+7.),bh=(3.+6.*r2)*own(g,I0+float(ci),9.),tp=a.y*.5+.5,an=r1*40.;
    if(hh<1.||bh<.1){gl_Position=vec4(2,2,2,1);return;}
    P=vec3((I0+float(ci)+r1)*16.,hh,(r2*2.-1.)*54.)+vec3(cos(an),0,sin(an))*a.x*.9*(1.-.8*tp)+vec3(sin(t*2.+r1*30.)*.25+.15,1,cos(t*1.7+r2*20.)*.2)*tp*bh;
    N=vec3(0,1,0);C1=vec3(r2,tp,0);gl_Position=VP*vec4(P,1);return;
  }
  if(f==0){N=vec3(1,0,0);q=vec3(1,a.y,a.x);}else if(f==1){N=vec3(-1,0,0);q=vec3(-1,a.y,-a.x);}else if(f==2){N=vec3(0,1,0);q=vec3(a.x,1,a.y);}
  else if(f==3){N=vec3(0,-1,0);q=vec3(a.x,-1,-a.y);}else if(f==4){N=vec3(0,0,1);q=vec3(a.x,a.y,1);}else{N=vec3(0,0,-1);q=vec3(-a.x,a.y,-1);}
  if(M==0){ // the knight: cube (sx, y, bx) exists where the side view has a pixel at (sx, y) and the back view at (bx, y)
    int sx=n%12,bx=n/12%12,y=n/144;vec4 sd=texelFetch(SP,ivec2(sx,15-y+16*int(fr)),0),bk=texelFetch(SP,ivec2(12+bx,15-y),0);
    if(sd.a<.5||bk.a<.5||H(vec2(float(n),1.))>m3*1.7){gl_Position=vec4(2,2,2,1);return;} // his cubes appear one by one
    C1=sd.rgb;C2=bk.rgb;p=CC+vec3(float(sx)-5.5,float(y)+.5,float(bx)-5.5);s=vec3(.5);
    if(sd.r>.7&&sd.g<.45&&sx<4)p.x-=g*(.6+.5*sin(t*9.+float(y)*.9))*float(4-sx)*.7; // his cape streams out behind him
  }else if(M==1){ // level blocks: 64 columns x 7 rows deep, each as tall as its column
    int ci=n%64;float hh=hs[ci]*16.,a1=own(m3,I0+float(ci),3.);if(hh<1.||a1<=0.){gl_Position=vec4(2,2,2,1);return;}C1.x=1.-a1; // a column of the pixel picture becomes blocks at its own moment
    p=vec3((I0+float(ci))*16.+8.,hh*.5,float(n/64-3)*16.);s=vec3(8,hh*.5,8);
  }else if(M==5){ // torches on both edges of every sixth column
    float c0=floor(I0/6.)*6.+float(n/2)*6.;int ci=int(c0-I0);if(ci<0||ci>63||hs[ci]<1.||ap<.01){gl_Position=vec4(2,2,2,1);return;}
    p=vec3(c0*16.+8.,hs[ci]*16.+9.*ap,(float(n%2)*2.-1.)*52.);s=vec3(1.6,9.*ap,1.6);C1=q*.5+.5;
  }else if(M==7){ // dead trees on the moor: a trunk and three crooked branches each, on a loose grid on both sides of the causeway
    int tid=n/4,pt=n%4;vec2 cl=vec2(floor(CC.x/110.)+float(tid%20)-5.,float(tid/20));float r1=H(cl),r2=H(cl+3.),sd=cl.y<5.?-1.:1.;
    vec2 w=vec2((cl.x+r1*.8)*110.,sd*(130.+mod(cl.y,5.)*120.+r2*80.));
    if(r1+r2<.7||ap<.01){gl_Position=vec4(2,2,2,1);return;}
    float an=(float(pt)-2.)*.9+r1,hh=26.+r2*18.;vec3 v=q*(pt==0?vec3(2.6,hh,2.6):vec3(1.5,hh*.45,1.5));
    if(pt>0){v.xy=vec2(v.x*cos(an)-v.y*sin(an),v.x*sin(an)+v.y*cos(an));v+=vec3(-sin(an)*hh*.4,hh*(1.+float(pt)*.25),(r2-.5)*6.);}else v.y+=hh;
    P=vec3(w.x,th(w)-2.,w.y)+v;gl_Position=VP*vec4(P,1);return;
  }else{vec4 b=CB[n]*2.2;p=CA+vec3(b.x,b.w*.5,b.y);s=vec3(b.z,b.w*.5,b.z);C1=vec3(float(n));C2=vec3(CA.y+b.w);if(ap<.01){gl_Position=vec4(2,2,2,1);return;}p.y-=(1.-ap)*500.;} // castle: 16 boxes
  P=p+q*s;gl_Position=VP*vec4(P,1);
}`));
    gl.attachShader(jp,jf);gl.linkProgram(jp);
    if(!gl.getProgramParameter(jp,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(jp),gl.getShaderInfoLog(jf));
    else{
      const L={},U=n=>L[n]??=gl.getUniformLocation(jp,n),va=gl.createVertexArray(),nr=a=>{const l=hypot(...a);return a.map(v=>v/l)},cx=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
      gl.activeTexture(gl.TEXTURE12);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,24,32,0,gl.RGBA,gl.UNSIGNED_BYTE,SPX);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.activeTexture(gl.TEXTURE0);
      // the castle: keep, four corner towers with thinner tops, a wide plinth, three bastions, a gate house, one tall thin tower (x, z, half width, height)
      const CB=[0,0,62,230,-115,-95,26,270,115,-95,26,270,-115,95,26,270,115,95,26,270,-115,-95,14,345,115,-95,14,345,-115,95,14,350,115,95,14,340,0,0,130,75,0,-108,22,165,0,108,22,165,118,0,22,165,-170,0,30,190,45,-30,18,400,45,-30,9,470];
      const hsA=new Float32Array(64);
      solid=(X,Y,fr,c,g,res,ga,m3)=>{ // c: 0 = seen from the side like the 2D game, 1 = from behind; g: how far the world has grown up; res: 0 = 320 x 180, 1 = the full pixel budget
        const gs=min(1,Math.sqrt(GLPX*2*QS/W/H)),hf=max(1,H*gs|0),hh=max(1,min(hf,180+(hf-180)*Math.round(res*8)/8)|0),w=max(1,hh*W/H|0),T=x.lo(w,hh,1),ce=c*c*(3-2*c),
          I0=floor(X/16)-22,az=ce*1.45,Dd=Math.exp(Math.log(1400)*(1-ce)+Math.log(70)*ce),ft=Math.exp(Math.log(1400/90)*(1-ce)+Math.log(1.25)*ce), // (the scene's zoom is already in the 2D transform the picture is drawn with)
          tg=[X+60*(1-ce)+55*ce,90*(1-ce)+(Y+14)*ce,0],hb=max(...[0,1,2,3,4,5,6].map(i=>hgt(floor(X/16)-i)))*16, // the tallest block between the camera and the knight: the camera stays above it
          eye=[tg[0]-sin(az)*Dd-90*ce,max(tg[1]+34*ce,(hb+26)*ce),tg[2]+cos(az)*Dd],
          f=nr([tg[0]-eye[0],tg[1]-eye[1],tg[2]-eye[2]]),s0=nr(cx(f,[0,1,0])),u0=cx(s0,f),rl=roll*ce,sd=s0.map((v,i)=>v*cos(rl)+u0[i]*sin(rl)),up=cx(sd,f),
          n=2,fr2=9000,fx=ft*H/W,za=(fr2+n)/(fr2-n),ng=min(1,g/.6),fc=[.75,.88,1].map((v,i)=>v+([.15,.19,.28][i]-v)*ng*ng*(3-2*ng)),M=U('M');
        for(let i=0;i<64;i++)hsA[i]=hgt(I0+i);
        gl.bindFramebuffer(gl.FRAMEBUFFER,T.fb);gl.viewport(0,0,w,hh);gl.useProgram(jp);gl.bindVertexArray(va);gl.disable(gl.BLEND);
        gl.uniformMatrix4fv(U('VP'),false,[fx*sd[0],ft*up[0],za*f[0],f[0],fx*sd[1],ft*up[1],za*f[1],f[1],fx*sd[2],ft*up[2],za*f[2],f[2],-fx*dt3(sd,eye),-ft*dt3(up,eye),-za*dt3(f,eye)-2*fr2*n/(fr2-n),-dt3(f,eye)]);
        gl.uniform3fv(U('cam'),eye);gl.uniform3fv(U('cr'),sd.map(v=>v/fx));gl.uniform3fv(U('cu'),up.map(v=>v/ft));gl.uniform3fv(U('cf'),f);
        const CA=[X+3200-900*g,-30,-900],md=nr([CA[0]-eye[0],CA[1]+700-eye[1],CA[2]-eye[2]]); // the castle stands off to the side ahead, the moon behind it
        gl.uniform3f(U('CC'),X,Y,0);gl.uniform3fv(U('CA'),CA);gl.uniform3fv(U('fogc'),fc);gl.uniform3fv(U('mdir'),md);gl.uniform3fv(U('sun'),nr([.5,.8,.6].map((v,i)=>v+(md[i]-v)*ng)));
        gl.uniform4fv(U('CB'),CB);gl.uniform1f(U('t'),t);gl.uniform1f(U('k'),kick);gl.uniform1f(U('h'),hue/360);gl.uniform1f(U('g'),g);gl.uniform1f(U('ap'),min(1,g*4));
        gl.uniform1f(U('fr'),fr);gl.uniform1f(U('I0'),I0);gl.uniform1fv(U('hs'),hsA);gl.uniform1fv(U('B'),B);gl.uniform1i(U('SP'),12);gl.uniform1i(U('NZ'),4);
        gl.uniform1f(U('m3'),m3);gl.uniform1f(U('sa'),min(1,max(0,m3*5-4)));
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniform1i(M,4);gl.drawArrays(gl.TRIANGLES,0,3);gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.uniform1i(M,1);gl.drawArraysInstanced(gl.TRIANGLES,0,36,448);
        if(g>0){gl.uniform1i(M,2);gl.drawArrays(gl.TRIANGLES,0,72*72*6);gl.uniform1i(M,3);gl.drawArraysInstanced(gl.TRIANGLES,0,36,16);gl.uniform1i(M,5);gl.drawArraysInstanced(gl.TRIANGLES,0,36,24);
          gl.uniform1i(M,7);gl.drawArraysInstanced(gl.TRIANGLES,0,36,800);gl.uniform1i(M,6);gl.drawArraysInstanced(gl.TRIANGLES,0,6,8960)}
        gl.uniform1i(M,0);gl.drawArraysInstanced(gl.TRIANGLES,0,36,2304);
        gl.disable(gl.DEPTH_TEST);gl.bindVertexArray(null);
        x.globalAlpha=ga;x.imageSmoothingEnabled=res>.5;x.drawImage(T,-W/2,-H/2,W,H);x.imageSmoothingEnabled=true;
        if(g>.2){ // rain
          x.beginPath();for(let i=0;i<140;i++){const a=i*7.31%1,b=((i*3.77+t*(1.6+a))%1+1)%1,px=(a*1.3-.6)*W-b*H*.25,py=(b-.5)*H*1.2,l=H*(.03+.04*(i*.61%1));line(px,py,px-l*.25,py+l)}
          x.lineWidth=D;x.strokeStyle=hs(210,.22*min(1,(g-.2)*3)*ga,80);x.stroke();
        }
      };
    }
  }
  const ERA=['8-BIT / 160 X 90, A HANDFUL OF COLOURS','16-BIT / SHADED TILES, PARALLAX','32-BIT / EVERY PIXEL BECOMES A CUBE','THE WORLD GROWS UP'];
  JUMP=SC.push(()=>{
    if(tt-lc>.5||tt<lc){t0=tt;dur=BPM?sl*60/BPM:24} // (re)entered: start the level
    lc=tt;if(tt-t0>dur*1.3)t0=tt;
    const u=min(1,(tt-t0)/dur),sp=(BPM||120)/60*2,X=(8+(tt-t0)*sp)*16,Y=cyT(X/16)*16,fr=floor(X/8)&1,ga=x.globalAlpha,sm=(a,b,v)=>{v=min(1,max(0,(v-a)/(b-a)));return v*v*(3-2*v)},
      c=solid?sm(.46,.62,u):0,m3=solid?sm(.33,.46,u):0; // two tiles per beat; c: the camera's swing; m3: how far the pixel picture has turned into cubes (column by column)
    x.rotate(-roll);x.globalCompositeOperation='source-over';
    if(m3<1)flat(X-100,X,Y,fr,sm(.17,.24,u));
    if(m3>0)solid(X,Y,fr,c,sm(.6,1,u),sm(.5,.75,u),ga,m3);
    else if(QS<.01&&solid)solid(X,Y,fr,1,1,0,0,1); // warm-up: build the 3D shader now, not when the cubes first appear
    x.setTransform(XS,0,0,XS,0,0);x.globalAlpha=ga;x.font=`bold ${H*.03}px monospace`;x.fillStyle='#fff';x.fillText(ERA[u<.2?0:u<.36?1:u<.6?2:3],W*.03,H*.07);
  })-1;
}
