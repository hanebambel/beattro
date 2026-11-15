// ---- 35 light bikes: seven bikes of light race over a glowing grid and each leaves a wall of light behind it. They come in fast and in formation, swerve
// right and left, and then each one writes a letter of BEATTRO in one stroke with right-angle turns (the letters are 24 by 36 units: this is a big place).
// First the camera chases the first bike, low and close with a wide lens, so the grid rushes past; then it pulls back and up until all seven are in view
// and the word can be read. All lines, drawn additively: a wide soft stroke under a thin bright one makes them glow, the walls are translucent and mirror
// in the floor, their height is the level of the bike's band. Haze drifts through, every bike carries a flare and throws a beam ahead.
let BIKES=-1;
{
  const S=6,LET=[[0,0,0,6,3,6,3,3,0,3,4,3,4,0,0,0],[0,0,4,0,0,0,0,3,3,3,0,3,0,6,4,6],[0,0,0,6,4,6,4,0,4,3,0,3],[0,6,4,6,2,6,2,0],[0,6,4,6,2,6,2,0],[0,0,0,6,4,6,4,3,0,3,2,3,4,0],[0,0,0,6,4,6,4,0,0,0]]; // B E A T T R O on a 4 x 6 grid
  const len=q=>{const cl=[0];for(let k=1;k<q.length;k++)cl.push(cl[k-1]+hypot(q[k][0]-q[k-1][0],q[k][1]-q[k-1][1]));return cl};
  const RAW=LET.map((p,i)=>{const q=[];for(let k=0;k<p.length;k+=2)q.push([(p[k]+i*6-20)*S,(p[k+1]-3)*S]);return q}),TOT=max(...RAW.map(q=>len(q).at(-1)))+150;
  // every way is equally long, so all bikes go at the same speed: a run-in from the front (straight, a swerve of 12 units to the right, straight) and then the letter
  const PATH=RAW.map(q=>{const[sx,sz]=q[0],L=TOT-len(q).at(-1)-12,p=[[sx-12,sz-L],[sx-12,sz-70],[sx,sz-70],...q],cl=len(p);return{q:p,cl,len:cl.at(-1),lead:cl[3]}});
  const GLW=mkc(64,64),gg=GLW.getContext('2d'),gr=gg.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'#fff');gr.addColorStop(.25,'#fff8');gr.addColorStop(1,'#fff0');gg.fillStyle=gr;gg.fillRect(0,0,64,64);GLW.st=1;
  const E=[0,8,-30],T=[0,0,0],N=.3;let Rx,Ry,Rz,Ux,Uy,Uz,Fx,Fy,Fz,FF=1,t0=0,lc=-9,dur=16,sx,sy;
  const cam=(X,Y,Z)=>{const a=X-E[0],b=Y-E[1],c=Z-E[2];return[a*Rx+b*Ry+c*Rz,a*Ux+b*Uy+c*Uz,a*Fx+b*Fy+c*Fz]};
  const pt=(X,Y,Z)=>{const c=cam(X,Y,Z);if(c[2]<N)return 0;sx=c[0]/c[2]*FF;sy=-c[1]/c[2]*FF;return c[2]}; // > depth (0 = behind the camera), screen position in sx, sy
  const seg=(a,b,c,d,e,f,o)=>{ // a line in space, cut off where it passes behind the camera; added to the path, or to the list o (which is drawn later); returns its depth
    let p=cam(a,b,c),q=cam(d,e,f);if(p[2]<N&&q[2]<N)return 0;
    if(p[2]<N){const k=(N-p[2])/(q[2]-p[2]);p=p.map((v,i)=>v+(q[i]-v)*k)}else if(q[2]<N){const k=(N-q[2])/(p[2]-q[2]);q=q.map((v,i)=>v+(p[i]-v)*k)}
    const x0=p[0]/p[2]*FF,y0=-p[1]/p[2]*FF,x1=q[0]/q[2]*FF,y1=-q[1]/q[2]*FF;o?o.push(x0,y0,x1,y1):line(x0,y0,x1,y1);return(p[2]+q[2])/2;
  };
  const at=(P,s)=>{let k=0;while(k<P.q.length-2&&P.cl[k+1]<s)k++;const a=P.q[k],b=P.q[k+1],l=P.cl[k+1]-P.cl[k],f=min(1,max(0,(s-P.cl[k])/l));return[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,(b[0]-a[0])/l,(b[1]-a[1])/l]}; // position and direction after s units of the way
  const strokes=(L,w,st)=>{for(let b=0;b<L.length;b++){x.beginPath();for(let k=0;k<L[b].length;k+=4)line(L[b][k],L[b][k+1],L[b][k+2],L[b][k+3]);x.lineWidth=w(b);x.strokeStyle=st(b);x.stroke()}};
  BIKES=SC.push(()=>{
    if(tt-lc>.5||tt<lc){t0=tt;dur=BPM?sl*60/BPM:16;const h=at(PATH[0],0);E[0]=h[0];E[1]=4;E[2]=h[1]-12;T[0]=h[0];T[1]=1;T[2]=h[1]+12} // (re)entered: start the run
    lc=tt;if(tt-t0>dur*1.7)t0=tt; // held longer than its turn (L, or a long scene): the bikes start over
    const u=(tt-t0)/dur,pr=min(1,u*1.12),ga=x.globalAlpha,w=min(1,max(0,(u-.5)/.3)),ws=w*w*(3-2*w),h0=at(PATH[0],pr*PATH[0].len),e=min(1,dt*(6-3*ws)),
      // camera: close behind the first bike and low, wide lens; later high in front of the word, swaying slightly, normal lens
      ex=(h0[0]-h0[2]*8)*(1-ws)+sin(t*.2)*16*ws,ey=2.6*(1-ws)+118*ws,ez=(h0[1]-h0[3]*8)*(1-ws)-150*ws,tx=(h0[0]+h0[2]*14)*(1-ws),ty=1.2*(1-ws),tz=(h0[1]+h0[3]*14)*(1-ws)+2*ws;
    E[0]+=(ex-E[0])*e;E[1]+=(ey-E[1])*e;E[2]+=(ez-E[2])*e;T[0]+=(tx-T[0])*e;T[1]+=(ty-T[1])*e;T[2]+=(tz-T[2])*e;FF=F*(.6+.42*ws);
    let l=hypot(T[0]-E[0],T[1]-E[1],T[2]-E[2]);Fx=(T[0]-E[0])/l;Fy=(T[1]-E[1])/l;Fz=(T[2]-E[2])/l;
    l=hypot(Fz,Fx);Rx=Fz/l;Ry=0;Rz=-Fx/l;Ux=Fy*Rz-Fz*Ry;Uy=Fz*Rx-Fx*Rz;Uz=Fx*Ry-Fy*Rx;
    x.lineCap='round';
    // the grid: a fine one (3 units) around the camera, which is what makes the speed; a coarse one (12 units) over the whole place. Fainter with distance.
    const G=[[],[],[]],gx=Math.round(E[0]/3),gz=Math.round(E[2]/3);
    if(ws<1)for(let i=-14;i<=14;i++)for(let j=-6;j<=26;j++){const X=(gx+i)*3,Z=(gz+j)*3,d=pt(X+1.5,0,Z+1.5);if(d&&d<70){const o=G[min(2,d/24|0)];seg(X,0,Z,X,0,Z+3,o);seg(X,0,Z,X+3,0,Z,o)}}
    strokes(G,b=>D*(1.8-.4*b),b=>hs(hue+200,(.45-.14*b)*(1-ws)*ga,50));
    const C=[[],[],[]];
    for(let i=-13;i<=13;i++)for(let j=-24;j<=10;j++){const X=i*12,Z=j*12,d=pt(X+6,0,Z+6);if(d){const o=C[min(2,d/90|0)];seg(X,0,Z,X,0,Z+12,o);seg(X,0,Z,X+12,0,Z,o)}}
    strokes(C,b=>D*(1.8-.4*b),b=>hs(hue+200,(.42-.12*b)*(.35+.65*ws)*ga,45));
    // haze low over the ground
    x.globalAlpha=ga*.1;for(let i=0;i<2;i++){const o=(t*(i?17:-11)%W+W)%W;x.drawImage(HZ,o-W-W/2,-H*.2,W,H*.7);x.drawImage(HZ,o-W/2,-H*.2,W,H*.7)}
    x.globalAlpha=ga;
    PATH.forEach((P,i)=>{
      const hu=hue+i*47,L=pr*P.len,hd=at(P,L),wh=1.4+3.2*B[i*4+2],kg=1+kick*.6,top=[[],[],[]];
      // the wall of light behind the bike, in pieces of at most 6 units: a translucent face, its mirror image in the floor, and the edges.
      // Of the run-in only the last 60 units stay lit, so the word is not cluttered.
      for(let k=0;k<P.q.length-1&&P.cl[k]<L;k++){
        const a=P.q[k],b=P.q[k+1],s0=k<3?max(P.cl[k],L-60):P.cl[k],s1=min(L,P.cl[k+1]);if(s1<=s0)continue;
        const n=ceil((s1-s0)/6),dx=(b[0]-a[0])/(P.cl[k+1]-P.cl[k]),dz=(b[1]-a[1])/(P.cl[k+1]-P.cl[k]),o0=s0-P.cl[k],sl2=s1-s0;
        for(let j=0;j<n;j++){
          const x0=a[0]+dx*(o0+sl2*j/n),z0=a[1]+dz*(o0+sl2*j/n),x1=a[0]+dx*(o0+sl2*(j+1)/n),z1=a[1]+dz*(o0+sl2*(j+1)/n),d0=pt(x0,0,z0),ax=sx,ay=sy,d1=pt(x1,0,z1),bx=sx,by=sy;
          if(!d0||!d1)continue;
          pt(x1,wh,z1);const cx=sx,cy=sy;pt(x0,wh,z0);const ex2=sx,ey2=sy,fd=max(0,1-d0/420)*(k<3?min(1,(s0+sl2*j/n-(L-60))/25):1);
          x.fillStyle=hs(hu,.2*fd*ga*kg,55);x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.lineTo(cx,cy);x.lineTo(ex2,ey2);x.fill();
          pt(x1,-wh,z1);const mx=sx,my=sy;pt(x0,-wh,z0);
          x.fillStyle=hs(hu,.07*fd*ga,50);x.beginPath();x.moveTo(ax,ay);x.lineTo(bx,by);x.lineTo(mx,my);x.lineTo(sx,sy);x.fill();
          top[min(2,d0/60|0)].push(ex2,ey2,cx,cy,ax,ay,bx,by);
        }
      }
      strokes(top,b=>D*(16-5*b)*kg,()=>hs(hu,.12*ga,55)); // edges: a wide soft stroke and a thin bright one on top = glow; thicker close to the camera
      strokes(top,b=>D*(3.5-b),()=>hs(hu,.95*ga,78));
      // the bike: a low wedge between two wheels, a beam of light ahead, a flare
      const[bx,bz,dx,dz]=hd,px=-dz,pz=dx,d=pt(bx,1,bz),fx=sx,fy=sy;
      if(d&&pr<1){
        x.beginPath();
        for(const s of[-1.3,1.3]){let lx;for(let a=0;a<=8;a++){const an=a*TAU/8,X=bx+dx*(s+cos(an)*.75),Y=.75+sin(an)*.75,Z=bz+dz*(s+cos(an)*.75);if(a)seg(lx[0],lx[1],lx[2],X,Y,Z);lx=[X,Y,Z]}}
        seg(bx-dx*2,1.1,bz-dz*2,bx+dx*.4,1.9,bz+dz*.4);seg(bx+dx*.4,1.9,bz+dz*.4,bx+dx*2.2,.9,bz+dz*2.2);seg(bx-dx*2,1.1,bz-dz*2,bx+dx*2.2,.9,bz+dz*2.2);
        x.lineWidth=D*max(1.5,50/d);x.strokeStyle=hs(hu,.3*ga,60);x.stroke();x.lineWidth=D*max(1,13/d);x.strokeStyle=hs(hu,ga,88);x.stroke();
        const a=pt(bx+dx*26+px*8,0,bz+dz*26+pz*8),ax=sx,ay=sy,b=pt(bx+dx*26-px*8,0,bz+dz*26-pz*8),qx=sx,qy=sy,g=pt(bx+dx*2,0,bz+dz*2);
        if(a&&b&&g){x.fillStyle=hs(hu,.1*ga,70);x.beginPath();x.moveTo(sx,sy);x.lineTo(ax,ay);x.lineTo(qx,qy);x.fill()}
        const s=min(FF*.06,FF/d*1.6)*(1+kick*.6);x.globalAlpha=ga*.8;x.drawImage(GLW,fx-s,fy-s,2*s,2*s);x.globalAlpha=ga; // a flare, not a floodlight, when the bike is close
        x.beginPath();line(fx-s*3,fy,fx+s*3,fy);x.lineWidth=D*1.5;x.strokeStyle=hs(hu,.5*ga,80);x.stroke(); // the flare's streak
      }
    });
  })-1;
}
