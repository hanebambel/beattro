// ---- looks "retro tube": the finished frame as a home computer of the late eighties or early nineties would have put it on a tube monitor.
// Two small passes behind the post pass. Pass A makes the computer's picture: the frame at the mode's size (with the look chosen on K the frame is 4:3
// already, core.js; when the look only comes with a scene, the middle 4:3 of it), in hold-and-modify colours: along a line a pixel can only change one of
// red, green and blue of the pixel before it, or take one of a few fixed colours, so a sharp edge needs up to three pixels to arrive and wears a fringe
// of wrong colours. The older mode has 16 steps per colour and 16 fixed colours (here a grey ramp), the later one 64 steps and 64 fixed colours (here
// a 4 x 4 x 4 cube) at twice the size: its fringes are much finer. The same pass keeps the tube's afterglow: what was bright fades out over a few frames.
// The later mode and the tall version of the older one are interlaced: every frame only every other line is drawn, the lines in between live on their afterglow. Things that move get a comb
// edge and fine lines shimmer. How far a waiting line may dim is capped (glow() in core.js), and people who asked for reduced motion get whole frames.
// Pass B is the tube: bulging glass, scan lines whose beam gets wider where it is brighter, stripes of red, green and blue phosphor, rounded
// corners, darker towards the edge. No rolling, no hum bars.
if(gl&&POST){
  const MD=[[384,288,15,0],[384,576,15,1],[768,576,63,1]], // per look: width, height (the PAL frame of 768 x 576, or half of it each way), steps per colour - 1, interlaced. The middle one has pixels twice as wide as high
    TAU3=[.12,.15,.08]; // s: how long red, green and blue glow on (the tail turns a little yellow-green)
  const mk=src=>{const p=gl.createProgram(),f=cmp(gl.FRAGMENT_SHADER,src),L={};gl.attachShader(p,VS);gl.attachShader(p,f);gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){console.warn('shader scene off: retro look',gl.getProgramInfoLog(p),gl.getShaderInfoLog(f));return 0}
    p.U=n=>L[n]??=gl.getUniformLocation(p,n);return p};
  const pa=mk(`precision highp float;uniform sampler2D X,PV;uniform vec2 r,cp;uniform float ld,qn,il;uniform vec3 dk;uniform vec4 zp,zq,zt,zb;uniform uint zs;out vec4 o;
vec3 S(float i,float y){return floor(textureLod(X,.5+(vec2((i+.5)/r.x,y)-.5)*cp,ld+zt.x).rgb*qn+.5)/qn;} // the frame at pixel i of this line, in the mode's steps per colour
float hsh(vec2 p){uvec3 v=uvec3(uint(p.x),uint(p.y),zs)*1664525u+1013904223u;v.x+=v.y*v.z;v.y+=v.z*v.x;v.z+=v.x*v.y;v^=v>>16u;v.x+=v.y*v.z;return float(v.x>>8u)/16777216.;} // whole numbers in, 0..1 out: the same grain on every graphics card, new every frame (zs)
void main(){
  vec2 p=floor(gl_FragCoord.xy);float y=(p.y+.5)/r.y;vec3 pv=max(texelFetch(PV,ivec2(p),0).rgb*dk-.004,0.); // what still glows here (the small step down: 8 bits would otherwise never quite reach black)
  if(il>=0.&&mod(p.y,2.)!=il){o=vec4(pv,1);return;} // interlaced: this line belongs to the other field, it is not drawn this frame
  // the zap (core.js: zapEnv): what the set makes of the signal while it finds the new channel. zp: snow, roll, tear, colour; zq: gain, bend, brightness of the snow, how much of the afterglow stays. All of it in whole lines
  // and whole pixels of this mode, so the colours replay as they do in a picture that stands. A line is 1.23 pictures wide and a frame 1.08 high: what lies between is black
  float f=1.-y,vy=mod(y+floor(zp.y*1.08*r.y)/r.y,1.08),lw=floor(r.x*1.23),
    px=mod(p.x+floor(r.x*(zp.z*exp(-f/.9)+zq.y*exp((vy-1.)*20.)+(hsh(vec2(0,p.y))-.5)*.1*zp.x*(1.-zp.x)))+2.*lw,lw); // (the last: while snow and picture mix, the noise pulls single lines about)
  y=vy;
  vec3 s=S(max(px-4.,0.),y); // ponytail: the real thing carries its state along the whole line; here every pixel replays the four before it, which is the same wherever the picture held still for four pixels
  for(int i=3;i>=0;i--){
    vec3 g=S(max(px-float(i),0.),y),e=abs(s-g),m=s,gy=qn<20.?vec3(floor(dot(g,vec3(.3,.5,.2))*15.+.5)/15.):floor(g*3.+.5)/3.;
    if(e.r>=e.g&&e.r>=e.b)m.r=g.r;else if(e.g>=e.b)m.g=g.g;else m.b=g.b; // modify: the colour that is furthest off
    s=dot(abs(gy-g),vec3(1))<dot(abs(m-g),vec3(1))?gy:m; // or a colour from the palette, if that is closer
  }
  bool on=px<r.x&&vy<1.;s=min(s*zq.x,1.);
  if(on){ // the tune (core.js: tuneEnv; zt: blur, fine pattern, colour speckle, time; zb: the two bars, how far the pattern is pushed): colour as far as the set still finds it, speckled where it is weak
    vec2 cq=floor(p/vec2(4,1));vec3 cn=vec3(hsh(cq+vec2(9,0)),hsh(cq+vec2(40,0)),hsh(cq+vec2(77,0)));s=max(mix(vec3(dot(s,vec3(.3,.59,.11))),s,zp.w)+zt.z*(cn-dot(cn,vec3(.3,.59,.11))),0.); // (colour has a quarter of the picture's sharpness along the line: so has its noise, and being colour only it leaves the brightness alone)
    s=max(s+(s+.15)*(zt.y*sin(6.2832*(px/r.x*56.+vy*r.y*.31+zb.z))+zb.x*sin(6.2832*(vy*1.5+zt.w*.37))+zb.y*sin(6.2832*(vy*3.7-zt.w*.53))),0.); // the sound in the picture: the beat between sound and colour carrier, 56 slanted stripes to the line, and the sound itself as bars, wide ones for the bass, narrower ones above (added to the signal, so they show in the dark parts too)
  }else s=vec3(0);pv*=on?zq.w:zq.w*.4; // (while the picture rolls, the long afterglow of this look would smear it into a bright blur and fill the black bar: it is cut short for those frames, on the lines that are drawn)
  float nv=mix(hsh(p),hsh(p+vec2(1,0)),.3); // snow: every line and every frame new, along the line a little smeared; mostly dark with bright specks
  o=vec4(mix(max(s,pv),vec3(nv*nv*zq.z),zp.x),1); // (the snow does not go through the afterglow: adding up there it would only get brighter and smear)
}`),pb=mk(`precision highp float;uniform sampler2D X,P;uniform vec2 r,pr;uniform float a,hs;uniform vec2 ml;out vec4 o;
vec3 px(vec2 i){vec3 c=texelFetch(P,ivec2(clamp(i,vec2(0),pr-1.)),0).rgb;return c*c;} // (the beam adds up light, not screen values)
void main(){
  vec2 q=gl_FragCoord.xy/r;float as=r.x/r.y,tw=min(1.,1.3333/as),th=min(1.,as/1.3333); // the tube: 4:3, as big as fits
  vec2 u=(q-.5)/vec2(tw,th)*2.;u*=1.+vec2(.04,.055)*u.yx*u.yx; // the glass bulges
  vec3 c=vec3(0);float rr=length(max(abs(u)-.93,0.));
  if(rr<.07){
    vec2 g=(u*.5+.5)*pr-.5,i=floor(g),f=g-i;float fx=f.x*f.x*(3.-2.*f.x),ppl=r.y*th/pr.y,sd=smoothstep(1.6,3.6,ppl); // sd: with too few screen pixels per line there are no scan lines, they would only make moire
    vec3 l0=mix(px(i),px(i+vec2(1,0)),fx),l1=mix(px(i+vec2(0,1)),px(i+vec2(1,1)),fx),
      w0=.26+.2*l0,w1=.26+.2*l1; // the beam is wider where it is brighter
    c=mix(mix(l0,l1,f.y),(l0*exp(-f.y*f.y/(2.*w0*w0))+l1*exp(-(1.-f.y)*(1.-f.y)/(2.*w1*w1)))*1.25,sd);
    // the phosphor: triads of a red, a green and a blue strip, each strip ms canvas pixels wide (two on a 4K screen, so they survive the browser's scaling), cut into
    // slots by dark gaps that sit half a slot lower in every other triad. Each spot of the glass can only shine in its own colour: that is the sub-pixel pattern of a tube.
    float ms=max(1.,floor(r.y/1100.+.5));vec2 mp=floor(gl_FragCoord.xy/ms);vec3 mk=vec3(ml.y);mk[int(mod(mp.x,3.))]=ml.x; // ml: lit strip and unlit strips, RML in core.js; 2 and .5 unless turned on the keys (those add up to the same light as no mask up to about two thirds of full brightness; above that the lit strip is at its limit, so full white comes out about a third darker)
    c*=mk*(mod(mp.y+3.*mod(floor(mp.x/3.),2.),6.)<1.?.5:1.1);
    c=sqrt(c)*(1.-.22*dot(u,u))*smoothstep(.07,.045,rr)+.012;
  }
  o=vec4(mix(texture(X,q).rgb,c,a)*hs,1); // hs: with real HDR everything is drawn darker here and turned up again afterwards (hdr.js), so the lit phosphor strips can be brighter than white
}`);
  let n=0;const lt=MD.map(()=>0);
  if(pa&&pb)RETRO=(F,a,m)=>{ // F: the target the post pass has just drawn the frame into; a: how far the look is in (it fades with the scene change); m: which of the modes
    const[RW,RH,qn,il]=MD[m],fld=il&&!matchMedia('(prefers-reduced-motion: reduce)').matches,A=x.lo(RW,RH,0,'r'+(n&1)),B=x.lo(RW,RH,0,'r'+(++n&1)),d=max(0,(last-lt[m])/1e3),tw=min(1,4/3*H/W),th=min(1,W/H*3/4);lt[m]=last;
    gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,F.tex);gl.generateMipmap(gl.TEXTURE_2D); // (unit 7 has the sampler with the blurred copies; the post pass binds its own texture there again next frame)
    gl.activeTexture(gl.TEXTURE14);gl.bindTexture(gl.TEXTURE_2D,B.tex);
    gl.bindFramebuffer(gl.FRAMEBUFFER,A.fb);gl.viewport(0,0,RW,RH);gl.useProgram(pa);gl.uniform1i(pa.U('X'),7);gl.uniform1i(pa.U('PV'),14);gl.uniform2f(pa.U('r'),RW,RH);gl.uniform2f(pa.U('cp'),tw,th);
    gl.uniform1f(pa.U('ld'),Math.log2(max(1,Math.sqrt(W*tw/RW*H*th/RH))));gl.uniform3f(pa.U('dk'),...TAU3.map(v=>glow(d,v,fld)));gl.uniform1f(pa.U('qn'),qn);gl.uniform1f(pa.U('il'),fld?n&1:-1);gl.uniform4f(pa.U('zp'),ZP[0],ZP[1],ZP[2],ZP[3]);gl.uniform4f(pa.U('zq'),ZP[4],ZP[5],XDR&&XDR.on?.66:1.1,ZP[1]||ZP[2]?.45:1);gl.uniform1ui(pa.U('zs'),n&65535);gl.uniform4f(pa.U('zt'),ZP[6],ZP[7],ZP[9],t%997);gl.uniform4f(pa.U('zb'),ZP[8],ZP[10],ZP[11],0); // (the snow is held back in real HDR, where the tube is several times as bright) // (d: since this mode last ran, so nothing stale glows on after the look was away)
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindTexture(gl.TEXTURE_2D,A.tex);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W,H);gl.useProgram(pb);gl.uniform1i(pb.U('X'),7);gl.uniform1i(pb.U('P'),14);gl.uniform2f(pb.U('r'),W,H);gl.uniform2f(pb.U('pr'),RW,RH);gl.uniform1f(pb.U('a'),a);gl.uniform2f(pb.U('ml'),RML,(3-RML)/2);gl.uniform1f(pb.U('hs'),XDR&&RTL(look)?1/RHG:1); // (the same condition that switches the HDR canvas on in main.js, so the two never disagree for a frame)
    gl.drawArrays(gl.TRIANGLES,0,3);gl.activeTexture(gl.TEXTURE0);
  };
}
