// ---- 37 attack run: a small fighter flies at a giant ship, in through an opening in its hull, along a winding service tunnel (ribs, pipes, beams to
// slip past, wider bays) and into the reactor hall at the end, fires, and the screen goes white. On the way the rendering grows up, like the race and the
// jump & run do: first everything is glowing vector lines, drawn like the tunnel and the mountains (wire() below: the same tunnel, hull and fighter as
// lines); then the panels turn solid one by one, in a wave that runs ahead of the fighter, textured with coarse pixels at first;
// then lamps along the tunnel light them; at the end there is soft shadowing in the corners, shine on the metal, lit windows, haze and the glow of the
// engines and the reactor. One ray-marched scene; m = how far the run has got (0..1). Ship and station are designs of our own.
let FLY=-1;
{
  const fd=shader(`const float ZC=430.;float ID,sb;vec3 SP,RC;
float Hh(vec2 c){return fract(sin(dot(c,vec2(127.1,311.7)))*43758.5);}
vec2 pth(float w){return vec2(sin(w*.06)*4.,sin(w*.043+1.)*2.5)*smoothstep(0.,30.,w);} // the tunnel's course: straight at the mouth, then winding
float bx(vec3 q,vec3 s){vec3 d=abs(q)-s;return length(max(d,0.))+min(max(d.x,max(d.y,d.z)),0.);}
float shp(vec3 q){ // the fighter, nose towards +z: a tapering hull, a swept wing with upturned tips, two engines
  q.xy*=R(sb);
  float tp=1.-.65*clamp(q.z/.8+.2,0.,1.),d=bx(vec3(q.xy/tp,q.z),vec3(.17,.11,.8))*tp;
  vec3 w=vec3(abs(q.x),q.y,q.z+abs(q.x)*.55+.2);
  d=min(d,min(bx(w-vec3(.45,0,0),vec3(.45,.03,.26)),bx(w-vec3(.9,.13,0),vec3(.03,.16,.22))));
  return min(d,length(vec2(length(vec2(abs(q.x)-.3,q.y+.03)),max(0.,abs(q.z+.55)-.25)))-.1)-.015;
}
float map(vec3 q){ // ID: 0 hull, 1 ribs / pipes / beams, 2 the fighter, 3 the reactor
  vec2 w=q.xy-pth(q.z);vec3 rc=q-RC;
  float oc=max(max(abs(w.x),abs(w.y)),(abs(w.x)+abs(w.y))*.72),Rr=2.7+.7*smoothstep(.25,.4,abs(fract(q.z/32.)-.5)),cv=length(rc)-10.,
    d=max(-q.z,-min(oc-Rr,cv)),a; // solid = everything behind the hull's face, minus the tunnel (eight-sided, a wider bay every 32 units) and the reactor hall
  ID=0.;
  vec2 gc=floor(q.xy/6.);a=bx(vec3(fract(q.xy/6.)*6.-3.,q.z+.1),vec3(2.2,2.2,.5+3.*Hh(gc)));if(length(gc+.5)>1.2&&a<d)d=a; // towers on the hull's face, none around the mouth
  a=max(max(max(abs(fract(q.z/4.)-.5)*4.-.35,Rr-.4-oc),-q.z),-cv);if(a<d){d=a;ID=1.;} // a rib every 4 units
  a=max(max(min(length(w-vec2(1.75,-1.9))-.2,length(w+vec2(1.9,-1.4))-.14),-q.z),-cv);if(a<d){d=a;ID=1.;} // two pipes
  a=max(max(abs(fract(q.z/48.+.5)-.5)*48.-.35,abs(mod(floor(q.z/48.+.5),2.)<.5?w.y+.95:w.x-.95)-.28),40.-q.z);a=max(a,-cv);if(a<d){d=a;ID=1.;} // a beam across every 48 units
  a=min(length(vec2(length(rc.xz)-4.2,rc.y))-.28,length(vec2(length(rc.xy)-5.4,rc.z))-.22);if(a<d){d=a;ID=1.;} // rings around the reactor
  a=length(rc)-2.5;if(a<d){d=a;ID=3.;}
  a=shp(q-SP);if(a<d){d=a;ID=2.;}
  return d;
}
vec3 nrm(vec3 q){vec2 e=vec2(.003,-.003);return normalize(e.xyy*map(q+e.xyy)+e.yyx*map(q+e.yyx)+e.yxy*map(q+e.yxy)+e.xxx*map(q+e.xxx));}
void main(){
  UV/z;u*=R(ro);
  float fl=min(1.,m/.9),cz=-80.+(ZC+64.)*fl,zs=cz+3.4,s1=smoothstep(.2,.5,m),s2=smoothstep(.36,.68,m),s3=smoothstep(.52,.86,m),A=0.,s=.05,gr=0.,ge=0.,gb=0.,d;
  RC=vec3(pth(ZC),ZC);SP=vec3(pth(zs)+vec2(sin(t*.9)*.3,cos(t*.7)*.15-.15),zs);sb=(pth(zs-1.5).x-pth(zs+1.5).x)*.35+sin(t*.9)*.12;
  vec3 e=vec3(pth(cz)+vec2(0,.5),cz),f=normalize(SP+vec3(0,.25,2.5)-e),rx=normalize(cross(vec3(0,1,0),f)),v=normalize(u.x*rx+u.y*cross(f,rx)+f*1.25),q,
    bo=mix(SP,RC,clamp((m-.87)/.06,0.,1.)); // the shot: from the fighter to the reactor
  for(int i=0;i<120;i++){
    q=e+v*s;d=map(q);
    vec3 en=q-SP+vec3(0,0,.85);en.x=abs(en.x)-.3;
    gr+=min(d,1.)*.03/(.3+dot(q-RC,q-RC)*.03);ge+=min(d,.5)*.012/(.004+dot(en,en));gb+=min(d,.5)*.02/(.006+dot(q-bo,q-bo))*step(.87,m);
    if(d<.002*s||s>300.)break;s+=d*.9;
  }
  vec3 col=vec3(0),glo;
  if(s<300.){
    float id=ID;vec3 n=nrm(q),al,em=vec3(0);vec2 w=q.xy-pth(q.z),uv=q.z<.3&&n.z<-.5?q.xy/2.:vec2(atan(w.y,w.x)*2.546,q.z/2.);
    if(id>1.5&&id<2.5)uv=(q-SP).xz*5.;if(id>2.5)uv=vec2(atan(n.x,n.z),asin(n.y))*4.;
    // texture: every panel its own grey, some striped as warnings, some carrying rows of little hatches; coarse pixels at first
    // The style does not change for the whole picture at once but panel by panel: every panel has its own moments at which it turns from lines into a
    // solid, textured surface (a1), gets lit (a2) and gets the full treatment (a3). Panels near the fighter go first, the wave runs ahead down the tunnel,
    // and within it the order is random; so wire, flat texture, lit and finished panels stand side by side. A panel that is not solid yet is left
    // transparent (the vector lines show there); the moment it turns solid it flashes.
    float hz=Hh(floor(uv)+id*17.),fw=clamp((q.z-SP.z)/50.,0.,1.),a1=clamp((s1*1.8-hz*.6-fw)*5.,0.,1.),a2=clamp((s2*1.8-fract(hz*7.3)*.6-fw)*5.,0.,1.),a3=clamp((s3*1.8-fract(hz*13.7)*.6-fw)*5.,0.,1.);
    if(id>2.5)a1=a2=a3=1.;A=step(.001,a1);
    float px=mix(5.,40.,a1);vec2 uq=mix(floor(uv*px)/px,uv,step(.97,a1)),ci=floor(uq),fp=fract(uq);
    float hp=Hh(ci),dt=step(.5,Hh(floor(uq*vec2(8,4))+ci))*step(.75,Hh(ci+5.))*step(.2,fp.y)*step(fp.y,.8);
    al=vec3(.2+.3*hp)*(1.-.35*dt)*(.85+.15*step(.06,min(fp.x,fp.y)));
    if(Hh(ci+3.)>.86)al=mix(vec3(.9,.7,.05),vec3(.03),step(.5,fract((uq.x+uq.y)*3.)));
    if(id>.5&&id<1.5)al=vec3(.12,.13,.16)+.25*step(.5,fract(uq.x*.5+uq.y))*vec3(.9,.6,0)*step(.9,Hh(floor(uq.yy*.5)));
    if(id>1.5&&id<2.5)al=mix(vec3(.62,.64,.7),pal(h+.5),step(.42,abs(fract(uv.x*.2)-.5))*.8);
    if(id>2.5){al=vec3(1,.6,.2);em=pal(h+.1)*(2.+3.*l+2.*k)*(.6+.4*sin(uv.x*3.+t*4.)*sin(uv.y*5.-t*3.));}
    if(hp>.9&&id<.5)em=pal(h+.3+ci.y*.03)*step(.25,fp.x)*step(fp.x,.75)*step(.4,fp.y)*step(fp.y,.6)*(.5+2.*B[int(mod(ci.y,32.))]); // lit windows, each row on a band
    // light: a lamp under the ceiling every 8 units (the two nearest count), the reactor, and the fighter's own lamp
    vec3 L=vec3(.1);
    for(int i=0;i<2;i++){float zl=(floor(q.z/8.)+float(i))*8.+4.;vec3 dl=vec3(pth(zl)+vec2(0,2.2),zl)-q;float r2=dot(dl,dl);L+=pal(h+zl*.004)*(.7+.9*B[int(mod(zl/8.,32.))])*max(dot(n,dl)/sqrt(r2),0.)*5./(r2+2.)*step(0.,zl);}
    vec3 dr=RC-q,ds=SP+vec3(0,0,.6)-q;L+=pal(h+.1)*max(dot(n,normalize(dr)),0.)*40./(dot(dr,dr)+20.)*(1.+k)+vec3(.8,.9,1)*max(dot(n,normalize(ds)),0.)*1.5/(dot(ds,ds)+.6);
    L=mix(L,vec3(.25)+max(dot(n,normalize(vec3(-.5,.6,-.6))),0.)*vec3(1,.95,.85),step(q.z,.3)*step(id,.5)); // outside: a far sun
    float ao=mix(1.,clamp(map(q+n*.35)/.35,0.,1.)*.6+.4,a3),sp=pow(max(dot(reflect(v,n),normalize(dr+ds*8.)),0.),24.)*a3;
    col=al*mix(vec3(.75),L*ao,a2)+em*mix(.4,1.,a3)+sp*(pal(h+.1)+.5)*.6+mix(pal(h+.3),vec3(1),.4)*(1.-a1)*(1.-a1)*1.6;
    col=mix(col,vec3(.01,.015,.03),(1.-exp(-s*.007))*a3)*A;
  }
  glo=pal(h+.55)*ge*(.6+.5*k)+pal(h+.1)*gr*mix(.25,1.,s3)+vec3(1,.5,.3)*gb; // the glows are added as light, also over what is still lines
  A=max(A,smoothstep(.93,.985,m));col=mix(col+glo,vec3(1.6,1.4,1.1),smoothstep(.93,.985,m)); // the reactor goes up
  o=vec4(1.-exp(-col*1.6),A);
}`,GLPX,1);
  const ERA=['VECTOR / GLOWING LINES','PANEL BY PANEL: TEXTURES','PANEL BY PANEL: LIGHTS','SHADOW, SHINE, HAZE AND GLOW'];let t0=0,lc=-9,dur=24;
  // the same world as lines (kept in step with the shader by hand: same course, same cross-section, same camera)
  const ZC=430,ss=(a,b,v)=>{v=min(1,max(0,(v-a)/(b-a)));return v*v*(3-2*v)},pth=w=>{const k=ss(0,30,w);return[sin(w*.06)*4*k,sin(w*.043+1)*2.5*k]},
    Rr=z=>2.7+.7*ss(.25,.4,abs(z/32-floor(z/32)-.5)),OC=[[1,.389],[.389,1],[-.389,1],[-1,.389],[-1,-.389],[-.389,-1],[.389,-1],[1,-.389]],hh=(i,j)=>{const v=sin(i*127.1+j*311.7)*43758.5;return v-floor(v)};
  // the fighter as lines (nose towards +z): hull, swept wings, fins at the tips
  const SHIP=[];{const L=(...p)=>{for(let i=0;i<p.length-3;i+=3)SHIP.push(p.slice(i,i+6))};
    for(const a of[-1,1]){for(const b of[-1,1])L(0,0,.8,a*.17,b*.11,-.8);L(a*.17,-.11,-.8,a*.17,.11,-.8);L(-.17,a*.11,-.8,.17,a*.11,-.8);
      L(a*.17,0,.06,a*.9,0,-.435,a*.9,0,-.955,a*.17,0,-.46);L(a*.9,-.03,-.435,a*.9,.29,-.5,a*.9,.29,-.9,a*.9,-.03,-.955);}}
  const wire=(u,ga)=>{
    const fl=min(1,u/.9),cz=-80+(ZC+64)*fl,zs=cz+3.4,ps=pth(zs),SP=[ps[0]+sin(t*.9)*.3,ps[1]+cos(t*.7)*.15-.15,zs],sb=(pth(zs-1.5)[0]-pth(zs+1.5)[0])*.35+sin(t*.9)*.12,
      pe=pth(cz),E=[pe[0],pe[1]+.5,cz],nr=a=>{const l=hypot(...a);return a.map(v=>v/l)},f=nr([SP[0]-E[0],SP[1]+.25-E[1],SP[2]+2.5-E[2]]),rx=nr([f[2],0,-f[0]]),
      up=[f[1]*rx[2]-f[2]*rx[1],f[2]*rx[0]-f[0]*rx[2],f[0]*rx[1]-f[1]*rx[0]],FF=1.25*H/2,N=.15;
    const cam=(X,Y,Z)=>{const a=X-E[0],b=Y-E[1],c=Z-E[2];return[a*rx[0]+b*rx[1]+c*rx[2],a*up[0]+b*up[1]+c*up[2],a*f[0]+b*f[1]+c*f[2]]};
    const seg=(a,b,c,d,e,g)=>{let p=cam(a,b,c),q=cam(d,e,g);if(p[2]<N&&q[2]<N)return; // a line in space, cut off where it passes behind the camera
      if(p[2]<N){const k=(N-p[2])/(q[2]-p[2]);p=p.map((v,i)=>v+(q[i]-v)*k)}else if(q[2]<N){const k=(N-q[2])/(p[2]-q[2]);q=q.map((v,i)=>v+(p[i]-v)*k)}
      line(p[0]/p[2]*FF,-p[1]/p[2]*FF,q[0]/q[2]*FF,-q[1]/q[2]*FF)};
    // the tunnel: an eight-sided ring at every rib, its rib inside it, eight lines to the next ring; far rings first, like the tunnel scene
    for(let k=floor(max(0,cz)/4)+34;k>=floor(max(0,cz)/4);k--){
      const z=k*4,c=pth(z),R=Rr(z),zn=z+4,cn=pth(zn),Rn=Rr(zn),d=z-cz;if(d<-2)continue;
      x.beginPath();
      for(let i=0;i<8;i++){const a=OC[i],b=OC[(i+1)%8];
        seg(c[0]+a[0]*R,c[1]+a[1]*R,z,c[0]+b[0]*R,c[1]+b[1]*R,z);seg(c[0]+a[0]*(R-.4),c[1]+a[1]*(R-.4),z,c[0]+b[0]*(R-.4),c[1]+b[1]*(R-.4),z);
        seg(c[0]+a[0]*R,c[1]+a[1]*R,z,cn[0]+a[0]*Rn,cn[1]+a[1]*Rn,zn)}
      seg(c[0]+1.75,c[1]-1.9,z,cn[0]+1.75,cn[1]-1.9,zn);seg(c[0]-1.9,c[1]+1.4,z,cn[0]-1.9,cn[1]+1.4,zn); // the pipes
      if(k%12==0&&z>40){const o=k/12&1;for(const e of[-.28,.28])o?seg(c[0]+.95+e,c[1]-R,z,c[0]+.95+e,c[1]+R,z):seg(c[0]-R,c[1]-.95+e,z,c[0]+R,c[1]-.95+e,z)} // a beam across
      x.lineWidth=D*min(6,1+5/max(.5,d))*(1+kick);x.strokeStyle=hs(hue+k*5,max(0,1-d/140)*ga);x.stroke();
    }
    if(cz<12){ // the hull's face: a grid with the mouth left open, and towers standing on it
      x.beginPath();
      for(let i=-10;i<=10;i++){const p=i*6;if(i){seg(p,-60,0,p,60,0);seg(-60,p,0,60,p,0)}else for(const s of[-1,1]){seg(0,s*3,0,0,s*60,0);seg(s*3,0,0,s*60,0,0)}}
      for(let i=-7;i<7;i++)for(let j=-7;j<7;j++){
        const h=hh(i,j);if(hypot(i+.5,j+.5)<1.3||h<.5)continue;
        const X=i*6+3,Y=j*6+3,z=-1-6*(h-.5)*2;
        for(const a of[-2.2,2.2])for(const b of[-2.2,2.2]){seg(X+a,Y+b,0,X+a,Y+b,z);seg(X+a,Y-2.2,z,X+a,Y+2.2,z);seg(X-2.2,Y+b,z,X+2.2,Y+b,z)}
      }
      x.lineWidth=D*1.5*(1+kick);x.strokeStyle=hs(hue+40,.75*ga);x.stroke();
    }
    x.beginPath();const cs=cos(sb),sn=sin(sb),tr=(X,Y,Z)=>[SP[0]+X*cs-Y*sn,SP[1]+X*sn+Y*cs,SP[2]+Z];
    for(const l of SHIP){const a=tr(l[0],l[1],l[2]),b=tr(l[3],l[4],l[5]);seg(...a,...b)}
    for(const a of[-.3,.3])for(let i=0;i<8;i++){const p=tr(a+cos(i*TAU/8)*.1,-.03+sin(i*TAU/8)*.1,-.8),q=tr(a+cos((i+1)*TAU/8)*.1,-.03+sin((i+1)*TAU/8)*.1,-.8);seg(...p,...q)} // the engines
    x.lineWidth=D*5;x.strokeStyle=hs(hue+180,.25*ga,60);x.stroke();x.lineWidth=D*1.8;x.strokeStyle=hs(hue+180,ga,80);x.stroke();
  };
  if(fd)FLY=SC.push(()=>{
    if(tt-lc>.5||tt<lc){t0=tt;dur=BPM?sl*60/BPM:24} // (re)entered: start the run
    lc=tt;if(tt-t0>dur*1.15)t0=tt;
    const u=min(1,(tt-t0)/dur),ga=x.globalAlpha,lf=1-ss(.55,.85,u);gm=u;
    if(u>.2){x.save();fd();x.restore()} // the solid panels (the shader leaves the others transparent)
    if(lf>0){x.globalCompositeOperation='lighter';wire(u,ga*lf)} // the lines: under them the panels turn solid one by one; they fade once most of the tunnel is lit
    x.setTransform(XS,0,0,XS,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=ga;x.font=`bold ${H*.03}px monospace`;x.fillStyle='#fff';x.fillText(ERA[u<.22?0:u<.42?1:u<.6?2:3],W*.03,H*.07);
  })-1;
}
