// ---- post: the finished frame (the render target MAIN) goes through one last pass onto the screen: everything bright glows
// (bloom from blurred copies of the frame), faint colour fringes and darker corners like a lens, a breath of grain. All scenes get it. P switches it off.
let view=c,POST=0,post=0,P3=0,RETRO=0;
if(gl){
  const pp=gl.createProgram(),pf=cmp(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D X,GA,NZ;uniform vec2 r;uniform vec3 ga;uniform float t,tf,h,da,lf,dc,k,tc,sb,sx,lp,gn;uniform int lk,l2;out vec4 o;
float L(vec2 p){return dot(textureLod(X,p,1.).rgb,vec3(.3,.5,.2));}
vec3 look(int lk,vec2 q){ // the frame in one of the looks (-1: untouched)
  vec2 d=q-.5;vec3 c,b=textureLod(X,q,2.).rgb*.4+textureLod(X,q,3.5).rgb*.3+textureLod(X,q,5.).rgb*.2+textureLod(X,q,6.5).rgb*.1;
  if(lk==3){ // psychedelic: soft poster colours that keep turning, gentle outlines, pastel stripes in the background, everything wobbles a little
    vec2 w=q+vec2(sin(q.y*9.+t*.7),cos(q.x*7.+t*.5))*.005,e=vec2(1.5/r.y*r.y/r.x,1.5/r.y);
    vec3 s=texture(X,w).rgb,k=vec3(.57735);
    float l=L(w),ed=abs(L(w+vec2(e.x,0))-L(w-vec2(e.x,0)))+abs(L(w+vec2(0,e.y))-L(w-vec2(0,e.y))),a=t*.25+floor(l*5.)*.9,
      st=floor((q.y+sin(q.x*4.+t*.3)*.08+t*.02)*7.);
    c=mix(s/(max(s.r,max(s.g,s.b))+.001),floor(s/(max(s.r,max(s.g,s.b))+.001)*3.+.5)/3.,.7)*(.45+mix(l,floor(l*5.+.5)/5.,.6)*.6); // soft steps, nothing darker than mid-grey
    c=mix(vec3(dot(c,vec3(.3,.5,.2))),c,.8);
    c=c*cos(a)+cross(k,c)*sin(a)+k*dot(k,c)*(1.-cos(a)); // turn the hue
    c=mix(mix(vec3(.4),.5+.5*cos(6.283*(h+st*.17+vec3(0,.33,.67))),.55)*(.5+.06*mod(st,2.)),c,smoothstep(.03,.14,l)); // where the picture is black: slow pastel stripes
    return c*(1.-.55*smoothstep(.08,.3,ed)); // outlines: darker, not black
  }
  if(lk==5){ // code rain: the picture is set in characters, 42 rows of them. How bright a character is, is the picture at that spot, so every scene stays itself;
    // down every column runs a stream that lights the characters it passes, its head nearly white. Characters change now and then. All of it slow.
    vec2 cs=vec2(.62/42.*r.y/r.x,1./42.),gp=vec2(q.x,1.-q.y)/cs,ce=floor(gp),lc=fract(gp);
    vec3 s=textureLod(X,vec2((ce.x+.5)*cs.x,1.-(ce.y+.5)*cs.y),log2(r.y/42.)-1.).rgb,pc=.5+.5*cos(6.283*(h+.3+vec3(0,.33,.67)));
    float L=dot(s,vec3(.3,.5,.2)),hc=fract(sin(ce.x*127.1)*43758.5),tr=0.,hd=0.;
    for(int i=0;i<2;i++){float hh=fract(hc*(7.3+float(i)*5.1)),on=step(.45,fract(hh*9.7)),dd=fract(tf*(.05+.11*hh)+hh+float(i)*.5)*42.*1.7-ce.y;tr+=on*(dd>0.?exp(-dd*.12):0.);hd+=on*smoothstep(1.,0.,abs(dd-.5));} // (not every column has a stream at any time)
    float gi=floor(fract(sin(dot(ce,vec2(12.9898,78.233))+floor(tf*(.15+.6*fract(hc*3.1))+hc*10.)*.37)*43758.5)*94.)+1.,
      gm=texture(GA,vec2((mod(gi,16.)*ga.x+(.08+.84*lc.x)*ga.z),(floor(gi/16.)+.06+.9*lc.y)*ga.y)).a;
    return gm*(mix(vec3(L),s,.65)*2.4*(.32+.9*min(tr,1.))+pc*min(tr,1.)*.3+vec3(.9,1,.95)*min(hd,1.)*(.18+L*1.3))+s*.1;
  }
  if(lk==4){ // HDR style. Not real HDR (WebGL cannot hand a browser brighter-than-white pixels yet): the picture is treated the way HDR footage is brought
    // to a normal screen. More local contrast (the difference to the blurred picture is added), a wide glow, then a film curve that keeps detail in the
    // highlights and lets the darks go deep, and more colour. On a wide-gamut display the canvas is switched to Display P3, so the colours really are stronger.
    c=texture(X,q).rgb;c=max(c+(c-b)*.55,0.)+b*.4;c*=1.15;
    c=clamp(c*(2.51*c+.03)/(c*(2.43*c+.59)+.14),0.,1.);
    float l=dot(c,vec3(.3,.5,.2));return mix(vec3(l),c,1.3);
  }
  c=vec3(texture(X,q+d*.003).r,texture(X,q).g,texture(X,q-d*.003).b);
  if(lk==2){ // neon: everything glows hard, colours are pulled to magenta (warm) and cyan (cool), violet haze in the dark, scan lines
    c+=b*1.6;float l=dot(c,vec3(.3,.5,.2));
    c=mix(c,mix(vec3(.1,.9,1),vec3(1,.15,.75),smoothstep(-.1,.1,c.r-c.b))*l*1.5,.6)+vec3(.05,0,.1)*(1.-min(1.,l));
    return c*(.8+.2*sin(q.y*1700.));
  }
  return lk<0?c:c+max(b-.05,0.)*.9*(1.-min(1.,dot(c,vec3(.3,.5,.2)))); // the glow spreads into the dark around bright things; what is bright already stays as it is
}
// One laser head at e throwing a fan of nb thin beams around the direction ce, sp apart; fg = how much fog there is at this pixel. A beam is a line through the head:
// thin where it leaves, a little wider the further it has come (it is coming towards us), with a soft glow around it, and brighter where it crosses a bank of fog.
float laser(vec2 q,vec2 e,float as,float ce,float sp,float nb,float fg){
  vec2 v=(q-e)*vec2(as,1);float r=length(v),d=mod(atan(v.y,v.x)-ce+3.1416,6.2832)-3.1416,pp=abs(mod(d+sp*.5,sp)-sp*.5)*r,w=.0011+.0035*r;
  return (exp(-pp*pp/(w*w))+.22*exp(-pp/(w*5.)))*smoothstep(sp*nb*.5+sp*.1,sp*nb*.5-sp*.1,abs(d))*(.18+2.*fg)+exp(-r*70.)*.8;
}
vec3 hl(vec2 p,float l,vec3 b){return max(textureLod(X,p,l).rgb-b,0.);} // what is bright enough to throw a star: brighter than its surroundings by a good bit
void main(){
  vec2 q=gl_FragCoord.xy/r,d=q-.5;
  vec3 c=look(lk,q);if(lf<1.&&l2!=lk)c=mix(look(l2,q),c,lf); // during a transition the old scene's look fades into the new one's
  if(dc>.002){ // the disco mood, seventies style. It arrives piece by piece as dc goes from 0 to 1: the mirror ball is lowered in on its string (s1),
    // then its spots of light start to wander over the picture (s2), last the lens: soft focus with a warm halo, faded-film colours and a star filter (s3).
    float as=r.x/r.y,s1=smoothstep(0.,.45,dc),s2=smoothstep(.3,.75,dc),s3=smoothstep(.55,1.,dc),ml=log2(r.y)-7.; // ml: the blurred copy that is 1/128 of the height wide
    float hr=1.-.7*min(1.,dot(c,vec3(.3,.5,.2)));vec3 w=c+textureLod(X,q,ml).rgb*vec3(.5,.32,.2)*.55*hr; // (hr: what is bright already gets less on top, a bright scene must not wash out)
    c=mix(c,pow(w,vec3(.9,1.,1.14))*vec3(1.05,.99,.86)+vec3(.028,.014,.004),s3);
    vec2 a1=vec2(.94/as,.34)*.1,a2=vec2(-.34/as,.94)*.1;vec3 g=vec3(0),bg=textureLod(X,q,ml+3.).rgb*.8+.3; // (so a big bright area does not wash out, only small lights and edges throw rays) // star filter: four soft rays out of everything bright, slightly tilted, a little rainbow towards their tips
    float jt=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5); // (every pixel starts its rays at a slightly different distance: eight samples would otherwise show as eight ghost pictures)
    for(int i=1;i<=8;i++){float f=(float(i)-jt)/8.;g+=(1.-f)*(1.-f)*(hl(q+a1*f,ml-.5,bg)+hl(q-a1*f,ml-.5,bg)+hl(q+a2*f,ml-.5,bg)+hl(q-a2*f,ml-.5,bg))*mix(vec3(1),.5+.5*cos(6.283*(f*1.5+vec3(0,.33,.67))),.35);}
    c+=g*.48*s3*hr;
    float by=1.09-.21*s1;vec2 v=(q-vec2(.5,by))*vec2(as,1); // the ball hangs top centre. Its spots: a grid on a sphere around it, seen on a wall behind the picture, turning with the ball
    vec2 gp=vec2(atan(v.x,.6)*8.+tf*.22,atan(v.y,length(vec2(v.x,.6)))*8.);gp.x+=.5*mod(floor(gp.y),2.);
    vec2 id=floor(gp);float hs=fract(sin(dot(vec2(mod(id.x,89.),id.y),vec2(127.1,311.7)))*43758.5);
    c+=step(.45,hs)*smoothstep(.16+.2*fract(hs*7.),.04,length(fract(gp)-.5+.2*vec2(fract(hs*13.)-.5,fract(hs*29.)-.5)))*mix(vec3(1,.85,.6),.5+.5*cos(6.283*(h+hs*3.+vec3(0,.33,.67))),.5)*(.1+.25*fract(hs*17.)+.06*k)*s2; // (not every mirror throws one, and they differ in size and strength)
    // fog: every spot is the end of a beam that starts at the ball, and haze in the room makes the beam visible. Seen from here a beam is a thin cone from the
    // ball to its spot, so this pixel walks outwards from the ball through the grid of spots (a third of a cell per step) and is lit by every spot whose cone it is in.
    float rr=length(v),ps=atan(rr,.6);vec2 vh=v/max(rr,1e-4);vec3 bm=vec3(0);
    for(int i=0;i<24;i++){
      float a=ps+(float(i)+jt)*.042;if(a>1.25)break;
      vec2 P=vh*.6*tan(a),g2=vec2(atan(P.x,.6)*8.+tf*.22,atan(P.y,length(vec2(P.x,.6)))*8.);float o2=.5*mod(floor(g2.y),2.);g2.x+=o2;
      vec2 i2=floor(g2);float h2=fract(sin(dot(vec2(mod(i2.x,89.),i2.y),vec2(127.1,311.7)))*43758.5);if(h2<.45)continue;
      vec2 gc=i2+.5-.2*vec2(fract(h2*13.)-.5,fract(h2*29.)-.5),cw=vec2(.6*tan((gc.x-o2-tf*.22)/8.),0);cw.y=tan(gc.y/8.)*length(vec2(cw.x,.6)); // where that spot is on the wall
      float wr=(.16+.2*fract(h2*7.))/8.*(.36+dot(cw,cw))/.6;
      bm=max(bm,mix(vec3(1,.85,.6),.5+.5*cos(6.283*(h+h2*3.+vec3(0,.33,.67))),.5)*fract(h2*17.)*fract(h2*17.)*smoothstep(wr,wr*.2,abs(cw.x*vh.y-cw.y*vh.x))*smoothstep(-.03,.03,dot(cw,vh)-rr));
    }
    c+=(bm*(.3+.7*exp(-rr*1.6))*(.65+.35*sin(v.x*6.+tf*.25+sin(v.y*5.-tf*.2)*1.5))*.75*hr+vec3(1,.8,.55)*exp(-rr*5.)*.05)*s2; // (the brightest spots have the clearest beams; the haze is uneven and drifts; a little glow around the ball)
    c=mix(c,vec3(.3,.27,.22),smoothstep(.0024,.001,abs(v.x))*step(0.,v.y)); // the string
    vec2 bv=v/.06;float b2=dot(bv,bv);
    if(b2<1.){ // the ball: small square mirrors. Each shows the part of the picture it happens to face and flashes when it faces one of three lamps
      vec3 n=vec3(bv,sqrt(1.-b2));float ro=tf*.2;vec2 tg=vec2(atan(n.x,n.z)+ro,asin(n.y))*6.,ti=(floor(tg)+.5)/6.,tc=abs(fract(tg)-.5);
      vec3 rf=reflect(vec3(0,0,-1),vec3(cos(ti.y)*sin(ti.x-ro),sin(ti.y),cos(ti.y)*cos(ti.x-ro)));
      float sp=pow(max(dot(rf,vec3(.5,.5,.707)),0.),30.)+pow(max(dot(rf,vec3(-.69,.2,.69)),0.),30.)+pow(max(dot(rf,vec3(.1,-.6,.8)),0.),30.);
      c=mix(c,(textureLod(X,.5+rf.xy*.42,ml).rgb*1.4+.06+vec3(1,.93,.8)*sp*1.6)*(.3+.7*n.z)*smoothstep(.5,.4,max(tc.x,tc.y)),smoothstep(1.,.9,b2));
    }
  }
  if(tc>.002){ // the techno mood, arriving in two steps as tc goes from 0 to 1: fog first (f1), then the colours turn cold and hard (f2). The strobes only fire once it is all there.
    float as=r.x/r.y,f1=smoothstep(0.,.6,tc),f2=smoothstep(.5,1.,tc),l=dot(c,vec3(.3,.5,.2));
    c=mix(c,mix(vec3(l),c,.5)*vec3(.85,.97,1.12)*(.75+.5*l),f2); // steel colours: half the colour, the darks darker
    // fog: three layers of the noise texture drifting against each other, thicker towards the floor. It has no light of its own: it shows what the scene around it
    // shines into it (a wide blur of the frame), and what the strobe throws in. ponytail: the noise texture is the glow forest's (unit 4); without that scene, no fog.
    vec2 fq=vec2(q.x*as,q.y);float n=texture(NZ,fq*vec2(.5,1.1)+vec2(tf*.011,tf*.003)).r*.5+texture(NZ,fq*vec2(1.3,3.1)-vec2(tf*.017,tf*.004)).r*.3+texture(NZ,fq*vec2(3.3,7.)+vec2(tf*.023,-tf*.006)).r*.2,dn=smoothstep(.36,.66,n)*(.35+.65*smoothstep(.85,0.,q.y)); // (wider than high: banks and wisps)
    c=mix(c,textureLod(X,q,log2(r.y)-4.5).rgb*1.3+vec3(.035,.045,.065),dn*.6*f1);
    float ld=length((q-vec2(sx,1.04))*vec2(as,1)); // the strobe: a lamp just above the top edge at sx. Its flash lights the fog around it and falls off with distance: never the whole frame white
    c+=vec3(.86,.93,1)*sb*(exp(-ld*2.)*(.15+1.6*dn+.5*n)+exp(-ld*22.)*1.5);
    // laser show: three heads at the back of the room (left, right, top centre) throw fans of beams through the fog towards us. The fans swing and open and close slowly
    // with the flow of the song; every four bars (lp) they change their figure and colours. They come on last (f2).
    float u1=tf*.19+lp*2.1,u2=tf*.13+lp*1.3,fo=.035+.05*(.5+.5*sin(u2)),nb=5.+2.*mod(lp,3.),fg=dn+.12*n;
    vec3 la=.5+.5*cos(6.283*(lp*.21+vec3(.33,0,.67))); // one saturated colour per figure, its two neighbours for the other heads
    c+=(max(la-.25,0.)*1.5*laser(q,vec2(.16,.62),as,-.55+.5*sin(u1),fo,nb,fg)+max(la.gbr-.25,0.)*1.5*laser(q,vec2(.84,.62),as,3.1416+.55-.5*sin(u1+.6),fo,nb,fg)
      +max(la.brg-.25,0.)*1.5*laser(q,vec2(.5,.8),as,-1.5708+.6*sin(u1*.8+1.),fo*1.3,nb+2.,fg))*(.5+.2*k)*f2;
  }
  o=vec4(c*(1.-(.5+1.6*da)*dot(d,d))+(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))+t)*43758.5)-.5)*(.012+.05*da)*gn,1); // da: the dark mood has darker corners and more grain
}`);
  gl.attachShader(pp,VS);gl.attachShader(pp,pf);gl.linkProgram(pp);
  if(!gl.getProgramParameter(pp,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(pp),gl.getShaderInfoLog(pf));
  else{
    const L={},U=n=>L[n]??=gl.getUniformLocation(pp,n);
    gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);
    const sm=gl.createSampler();gl.samplerParameteri(sm,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.samplerParameteri(sm,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.samplerParameteri(sm,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.bindSampler(7,sm);
    document.body.insertBefore(gc,ui);gc.onclick=go;c.style.cssText='position:absolute;visibility:hidden';view=gc; // the WebGL canvas is the one on screen
    POST=on=>{post=on}; // P: the effects on / off (the frame still goes through this pass, it is what puts it on screen)
    POST.draw=()=>{
      x.flush();
      // the retro tube (retro.js) takes the finished frame as its picture: then this pass draws into a target of its own instead of onto the screen. ra: how far that look is in
      const ra=post&&RETRO?(RTL(look)?lf:0)+(RTL(pl)&&lf<1?1-lf:0):0,F=ra>0?x.lo(W,H,0,'f'):0;
      gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,MAIN.tex);gl.generateMipmap(gl.TEXTURE_2D);gl.activeTexture(gl.TEXTURE0); // the blurred copies for the glow
      gl.bindFramebuffer(gl.FRAMEBUFFER,F?F.fb:null);gl.viewport(0,0,W,H);gl.useProgram(pp);gl.uniform1f(U('gn'),1-ra);gl.uniform1i(U('X'),7);gl.uniform2f(U('r'),W,H);gl.uniform1f(U('t'),t);gl.uniform1f(U('tf'),ft);gl.uniform1f(U('h'),hue/360);gl.activeTexture(gl.TEXTURE13);gl.bindTexture(gl.TEXTURE_2D,x.at[0]);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(U('GA'),13);gl.uniform3f(U('ga'),x.at[1],x.at[2],x.at[3]);gl.uniform1f(U('da'),da);const rl2=l=>l==4&&XDR||RTL(l)?0:l;gl.uniform1i(U('lk'),post?rl2(look):-1);gl.uniform1i(U('l2'),post?rl2(pl):-1);gl.uniform1f(U('lf'),lf);gl.uniform1f(U('dc'),post?dca:0);gl.uniform1f(U('k'),kick);gl.uniform1f(U('tc'),post?tca:0);gl.uniform1f(U('sb'),post?stb*(XDR&&XDR.on?.6:1):0);gl.uniform1f(U('sx'),sbx);gl.uniform1f(U('lp'),floor(beats/16));gl.uniform1i(U('NZ'),4); // (in real HDR the strobe is held back: the HDR pass would push it past paper white)
      // with real HDR the HDR look is the normal picture, turned up afterwards (hdr.js)
      const p3=+(post&&!XDR&&(look==4||pl==4&&lf<1)&&matchMedia('(color-gamut: p3)').matches);if(p3!=P3){P3=p3;try{gl.drawingBufferColorSpace=p3?'display-p3':'srgb'}catch(e){P3=0}} // wide colour for the HDR style
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(F)RETRO(F,ra,(RTL(look)?look:pl)-6);
    };
    POST(1);
  }
}
