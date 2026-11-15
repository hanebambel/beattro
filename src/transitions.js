// ---- 3D transitions (drawn straight into the frame; the two scenes are the render targets OLD and NEW): the old scene becomes the picture on a wall of 64 x 36 tiles in front of the new one. Over the bar before the change the tiles
// shrink to glowing wire frames and the wall bends into a sphere, a tunnel, a rolling landscape or a twisted ribbon, whose shape is the spectrum
// (each column of tiles is pushed out by its band, all of it by the kick). On the bar line it bursts and fades. Parts without a beat and the dark
// mood get no shape: there the old picture drifts and dissolves in slow waves.
// The cube (also in the quiet parts): the old scene is the front of a box, the camera pulls back, the box turns a quarter and the side that comes round
// is the new scene, then the camera moves in until it fills the screen. Both scenes keep running on their faces.
// Code rain: down every column of characters a front falls, each at its own moment. Below it the old scene still runs; behind it the old scene is left
// standing as characters in its own colours for a dozen rows, the first one nearly white, and above that the new scene is free.
let cub=0;
if(gl){
  const tp=gl.createProgram(),tf=cmp(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D X;uniform float h,q,ty,t;in vec2 uv,cn;in float m,fo;out vec4 o;
void main(){
  if(ty>3.5){
    float th=.5+.3*sin(uv.x*5.+sin(uv.y*6.+t*.4)*2.+t*.2)+.15*sin(uv.y*9.-t*.3),a=1.-smoothstep(th-.25,th+.25,q*1.9-.45);
    o=vec4(texture(X,uv+vec2(sin(uv.y*7.+t),cos(uv.x*6.-t*.8))*.03*q).rgb*a,a);return;
  }
  float e=max(abs(cn.x-.5),abs(cn.y-.5))*2.,ln=smoothstep(.72,.9,e)*m*(1.-fo),a=max((1.-.5*m)*(1.-smoothstep(.5,.72,q)),ln);
  o=vec4(mix(texture(X,uv).rgb,(.5+.5*cos(6.283*(h+uv.x*.4+vec3(0,.33,.67))))*1.3,ln)*a,a);
}`);
  gl.attachShader(tp,cmp(gl.VERTEX_SHADER,`precision highp float;uniform float q,ty,as,t,k,B[32];out vec2 uv,cn;out float m,fo;
vec3 shp(vec2 u,float sp){ // where a point of the screen (-1..1) goes: from the flat wall (m = 0) to the shape (m = 1)
  vec3 a=vec3(u.x*as,u.y,0),b;float d=1.+.35*B[int(clamp((u.x*.5+.5)*32.,0.,31.))]+.12*k;
  if(ty<.5){float lo=u.x*3.1416+sp,la=u.y*1.5708;b=vec3(cos(la)*sin(lo)*.8*d,sin(la)*.8*d,1.4-cos(la)*cos(lo)*.8*d);}
  else if(ty<1.5){float an=u.x*3.1416+sp*.5;b=vec3(sin(an)*.95/d,cos(an)*.95/d,(u.y+1.)*3.);}
  else if(ty<2.5)b=vec3(u.x*as*2.,-.6+.15*sin(u.x*8.+t*3.)*cos(u.y*6.+t*2.)+.6*(d-1.),(u.y+1.)*2.5+.2);
  else if(ty<3.5){float w=u.y*5.+sp;b=vec3(cos(w)*u.x*as*.8*d,u.y*1.2,1.2+sin(w)*u.x*as*.8*d);}
  else return a;
  return mix(a,b,m);
}
void main(){
  int n=gl_InstanceID,i=gl_VertexID;cn=vec2(i==1||i>3,i==2||i==3||i==5);
  vec2 c=(vec2(n%64,n/64)+.5)/vec2(64,36)*2.-1.,e=c+(cn-.5)*2./vec2(64,36);
  m=ty>3.5?0.:smoothstep(0.,.5,q);fo=ty>3.5?0.:smoothstep(.5,1.,q);
  vec3 p=mix(shp(c,q*4.),shp(e,q*4.),1.-.4*m);p.xy*=1.+fo*1.2;
  uv=e*.5+.5;gl_Position=vec4(p.x/as,p.y,0,1.+p.z*.55);
}`));
  gl.attachShader(tp,tf);gl.linkProgram(tp);
  if(!gl.getProgramParameter(tp,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(tp),gl.getShaderInfoLog(tf));
  else{
    const L={},U=n=>L[n]??=gl.getUniformLocation(tp,n),va=gl.createVertexArray();
    // the cube: 36 vertices straight from the vertex number; face 0 is the front, 1 / 2 the right / left side
    const cp=gl.createProgram(),cf=cmp(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D X,Y;uniform float dir,h;in vec2 uv,cn;in float fc,sh;out vec4 o;
void main(){
  vec3 c,p=.5+.5*cos(6.283*(h+vec3(0,.33,.67)));int f=int(fc+.5);vec2 g=abs(fract(uv*8.)-.5);
  if(f==0)c=texture(X,uv).rgb;else if(f==(dir>0.?1:2))c=texture(Y,uv).rgb;
  else c=p*(.04+.5*smoothstep(.46,.5,max(g.x,g.y))); // the other faces: a glowing grid
  o=vec4(c*sh+p.gbr*smoothstep(.985,1.,max(abs(cn.x-.5),abs(cn.y-.5))*2.)*(1.-sh)*2.,1); // faces turned away are darker and their edges light up
}`);
    gl.attachShader(cp,cmp(gl.VERTEX_SHADER,`precision highp float;uniform float q,dir,as,k;out vec2 uv,cn;out float fc,sh;
vec3 ro(vec3 p,float c,float s,float cx,float sx){p=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);return vec3(p.x,p.y*cx-p.z*sx,p.y*sx+p.z*cx);}
void main(){
  int i=gl_VertexID,f=i/6,j=i%6;cn=vec2(j==1||j>3,j==2||j==3||j==5);
  float a=cn.x*2.-1.,b=cn.y*2.-1.,zo=sin(q*3.1416),th=smoothstep(.15,.85,q)*1.5708*dir;vec3 p,n;
  if(f==0){p=vec3(a*as,b,-as);n=vec3(0,0,-1);}
  else if(f==1){p=vec3(as,b,a*as);n=vec3(1,0,0);}
  else if(f==2){p=vec3(-as,b,-a*as);n=vec3(-1,0,0);}
  else if(f==3){p=vec3(-a*as,b,as);n=vec3(0,0,1);}
  else if(f==4){p=vec3(a*as,1,b*as);n=vec3(0,1,0);}
  else{p=vec3(a*as,-1,-b*as);n=vec3(0,-1,0);}
  p=ro(p*(1.+.03*k*zo),cos(th),sin(th),cos(.3*zo),sin(.3*zo));n=ro(n,cos(th),sin(th),cos(.3*zo),sin(.3*zo));
  float z=p.z+as+2.+zo*zo*3.2; // at the start and at the end the face in front fills the screen exactly
  fc=float(f);sh=.5+.5*max(0.,-n.z);uv=cn;gl_Position=vec4(p.x*2./as,p.y*2.,(z-4.)/12.*z,z);
}`));
    gl.attachShader(cp,cf);gl.linkProgram(cp);
    if(!gl.getProgramParameter(cp,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(cp),gl.getShaderInfoLog(cf));
    const CL={},CU=n=>CL[n]??=gl.getUniformLocation(cp,n);
    // code rain: one triangle over the frame. The grid of characters is the one of the code rain look (post.js): 42 rows
    const rp=gl.createProgram(),rf=cmp(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D X,GA;uniform vec2 r;uniform vec3 ga;uniform float q,tf,h,k;out vec4 o;
void main(){
  vec2 p=gl_FragCoord.xy/r,cs=vec2(.62/42.*r.y/r.x,1./42.),gp=vec2(p.x,1.-p.y)/cs,ce=floor(gp),lc=fract(gp),cc=vec2((ce.x+.5)*cs.x,1.-(ce.y+.5)*cs.y),e=cs*.25;
  float hc=fract(sin(ce.x*127.1)*43758.5),d=q*85.-hc*30.-1.-ce.y; // d: how many rows the front is past this one. 42 rows + 12 of trail + up to 30 of delay: at q = 0 nothing has started, at q = 1 all is gone
  vec3 old=texture(X,p).rgb;if(d<-.5){o=vec4(old,1);return;}
  vec3 s=(texture(X,cc+e).rgb+texture(X,cc-e).rgb+texture(X,cc+e*vec2(1,-1)).rgb+texture(X,cc-e*vec2(1,-1)).rgb)*.25,pc=.5+.5*cos(6.283*(h+.3+vec3(0,.33,.67)));
  float L=dot(s,vec3(.3,.5,.2)),ao=1.-smoothstep(0.,3.,d),tr=pow(clamp(1.-d/12.,0.,1.),1.5)*step(0.,d),hd=smoothstep(1.,0.,abs(d-.5)),
    gi=floor(fract(sin(dot(ce,vec2(12.9898,78.233))+floor(tf*(.15+.6*fract(hc*3.1))+hc*10.)*.37)*43758.5)*94.)+1.,
    gm=texture(GA,vec2((mod(gi,16.)*ga.x+(.08+.84*lc.x)*ga.z),(floor(gi/16.)+.06+.9*lc.y)*ga.y)).a;
  o=vec4(old*ao+gm*((mix(vec3(L),s,.65)*2.4+pc*.5)*tr*(1.-.6*ao)+vec3(.9,1,.95)*hd*(.75+L)*(1.+.4*k)),max(ao,.75*tr)); // the trail darkens what is behind it, so the characters stay readable
}`);
    gl.attachShader(rp,VS);gl.attachShader(rp,rf);gl.linkProgram(rp);
    if(!gl.getProgramParameter(rp,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(rp),gl.getShaderInfoLog(rf));
    const RL={},RU=n=>RL[n]??=gl.getUniformLocation(rp,n);
    const bind=(T=MAIN)=>{x.flush();gl.bindFramebuffer(gl.FRAMEBUFFER,T.fb);gl.viewport(0,0,W,H);
      gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,OLD.tex);gl.activeTexture(gl.TEXTURE9);gl.bindTexture(gl.TEXTURE_2D,NEW.tex);gl.activeTexture(gl.TEXTURE0)}; // both scenes are textures already
    TR={
      cube(q,dir,warm){ // replaces the frame: dark background, the box (drawn in a target with a depth buffer, then copied; the frame itself has none)
        const T=x.lo(W,H,1);bind(T);gl.clearColor(.004,.004,.02,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
        gl.useProgram(cp);gl.bindVertexArray(va);
        gl.uniform1i(CU('X'),6);gl.uniform1i(CU('Y'),9);gl.uniform1f(CU('q'),q);gl.uniform1f(CU('dir'),dir);gl.uniform1f(CU('as'),W/H);gl.uniform1f(CU('h'),hue/360);gl.uniform1f(CU('k'),kick);
        gl.drawArrays(gl.TRIANGLES,0,36);
        gl.bindVertexArray(null);gl.disable(gl.DEPTH_TEST);if(!warm)x.copy(T,MAIN);
      },
      rain(q){ // on top of the frame, which already shows the new scene
        bind();gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(rp);
        gl.activeTexture(gl.TEXTURE13);gl.bindTexture(gl.TEXTURE_2D,x.at[0]);gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(RU('X'),6);gl.uniform1i(RU('GA'),13);gl.uniform2f(RU('r'),W,H);gl.uniform3f(RU('ga'),x.at[1],x.at[2],x.at[3]);gl.uniform1f(RU('q'),q);gl.uniform1f(RU('tf'),t);gl.uniform1f(RU('h'),hue/360);gl.uniform1f(RU('k'),kick);
        gl.drawArrays(gl.TRIANGLES,0,3);gl.disable(gl.BLEND);
      },
      draw(q,ty){ // on top of the frame, which already shows the new scene
        bind();gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(tp);gl.bindVertexArray(va);
        gl.uniform1i(U('X'),6);gl.uniform1f(U('q'),q);gl.uniform1f(U('ty'),ty);gl.uniform1f(U('as'),W/H);gl.uniform1f(U('t'),t);gl.uniform1f(U('h'),hue/360);gl.uniform1f(U('k'),kick);gl.uniform1fv(U('B'),B);
        gl.drawArraysInstanced(gl.TRIANGLES,0,6,2304);
        gl.bindVertexArray(null);gl.disable(gl.BLEND);
      }
    };
  }
}
