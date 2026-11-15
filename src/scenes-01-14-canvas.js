// Looks (K): 0 normal, 1 solid (the vector scenes get filled, shaded faces), 2 neon (the 80s: heavy glow, magenta and cyan, scan lines),
// 3 psychedelic (flat poster colours that keep turning, dark outlines, striped backgrounds, a slight wobble). 2 and 3 are done by the post pass.
let HA=new Float32Array(41),HB=new Float32Array(41);
const SC=[
()=>{ // 1 tunnel: bass pulse travels down the rings, spectrum bends the corners
  const cam=t*SP,k0=ceil(cam+.3),cx=ox(cam),cy=oy(cam);
  for(let j=NT-1;j>=0;j--){
    const k=k0+j,z=k-cam,r=1.7*(1+.4*hist[fi-j*2&63]),a=k*.12+t*.2,X0=ox(k)-cx,Y0=oy(k)-cy;
    x.beginPath();
    for(let i=0;i<M;i++){const rr=r*(1+.35*B[i*3]);x.lineTo(P[i*2]=(X0+cos(a+i*TAU/M)*rr)/z*F,P[i*2+1]=(Y0+sin(a+i*TAU/M)*rr)/z*F)}
    x.closePath();
    if(j<NT-1)for(let i=0;i<M*2;i+=2)line(P[i],P[i+1],Q[i],Q[i+1]);
    if(look==1&&j<NT-1){ // solid: the wall between this ring and the one behind it, panel by panel, far ones first
      x.save();x.globalCompositeOperation='source-over';
      for(let i=0;i<M;i++){const n=(i+1)%M*2,m=i*2;x.fillStyle=hs(hue+k*5,1,(8+30*(.5+.5*sin(a+i*TAU/M+1)))*(1-z/NT)+6*kick);x.beginPath();x.moveTo(P[m],P[m+1]);x.lineTo(P[n],P[n+1]);x.lineTo(Q[n],Q[n+1]);x.lineTo(Q[m],Q[m+1]);x.fill()}
      x.restore();
    }
    x.lineWidth=D*min(6,1+2/z)*(1+kick);x.strokeStyle=hs(hue+k*5,1-z/NT);x.stroke();
    [P,Q]=[Q,P];
  }
},
()=>{ // 2 mountains: every row is the spectrum frozen at the moment it appeared on the horizon
  const cam=t*SP,z0=floor(cam);
  x.lineWidth=D*(1+kick);
  for(let j=NR;j>0;j--){
    const z=z0+j-cam,k=z0+j;if(z<.2)continue;
    x.beginPath();
    for(let i=0;i<41;i++){
      const X=(i-20)*2,h=hf(X,k)*(.4+1.3*SH[(k&63)*NB+min(NB-1,max(0,abs(i-20)-2)*2)])+sin(X*.3+t*.8+k*.25)*sin(k*.15-t*.5)*(.15+.5*es); // + a slow swell that follows the music
      x.lineTo(P[i*2]=X/z*F,P[i*2+1]=(1.2-(HA[i]=h))/z*F);
    }
    if(j<NR)for(let i=0;i<82;i+=2)line(P[i],P[i+1],Q[i],Q[i+1]);
    if(look==1&&j<NR){ // solid: the faces between this row and the one behind it, far rows first; slopes facing the camera are brighter, high ground lighter
      x.save();x.globalCompositeOperation='source-over';
      for(let i=0;i<40;i++){
        const m=i*2,hm=(HA[i]+HA[i+1]+HB[i]+HB[i+1])/4,sl=HB[i]+HB[i+1]-HA[i]-HA[i+1];
        x.fillStyle=hs(hue+j*4+hm*14,1,max(4,(20+10*hm+30*max(-.5,min(1,sl*1.5)))*(1-.8*z/NR)));
        x.beginPath();x.moveTo(P[m],P[m+1]);x.lineTo(P[m+2],P[m+3]);x.lineTo(Q[m+2],Q[m+3]);x.lineTo(Q[m],Q[m+1]);x.fill();
      }
      x.restore();
    }
    x.strokeStyle=hs(hue+j*4,1-z/NR);x.stroke();
    [P,Q]=[Q,P];[HA,HB]=[HB,HA];
  }
  const r=1.5+kick; // spinning octahedron in the sky
  for(let i=0;i<6;i++)pr(O[i][0]*r,O[i][1]*r,O[i][2]*r,t*.9,t*.6,11,i*2,-3.5);
  x.beginPath();
  for(let i=0;i<6;i++)for(let k=i+1;k<6;k++)if(i>>1!=k>>1)line(OP[i*2],OP[i*2+1],OP[k*2],OP[k*2+1]);
  x.lineWidth=D*2;x.strokeStyle=hs(hue+180,1,65);x.stroke();
},
()=>{ // 3 radial spectrum, mirrored, around spinning polygons
  const r0=R*.28*(1+kick*.25);
  x.lineWidth=R*.035;
  for(let b=0;b<NB;b++)for(let s=-1;s<2;s+=2){
    const a=t*.3-PI/2+s*(b+.5)/NB*PI,l=r0+B[b]*R*.6+2;
    x.beginPath();line(cos(a)*r0,sin(a)*r0,cos(a)*l,sin(a)*l);x.strokeStyle=hs(hue+b*9);x.stroke();
  }
  x.lineWidth=D*2;
  for(let n=3;n<6;n++){
    x.beginPath();for(let i=0;i<n;i++){const a=t*(n-4||.5)+i*TAU/n;x.lineTo(cos(a)*r0*.8,sin(a)*r0*.8)}
    x.closePath();x.strokeStyle=hs(hue+n*50);x.stroke();
  }
},
()=>{ // 4 dot sphere: latitude = frequency band, pushed outwards
  for(let i=0;i<NP*3;i+=3){
    const b=(SPH[i+1]+1)/2*NB|0,s=1+.7*B[b],d=pr(SPH[i]*s,SPH[i+1]*s,SPH[i+2]*s,t*.5,t*.3,3.6,0)/F*12*D;
    x.fillStyle=hs(hue+b*8);x.fillRect(OP[0],OP[1],d,d);
  }
},
()=>{ // 5 oscilloscope: the raw waveform as rings and a classic scope line
  x.lineWidth=D*2;
  for(let c=0;c<3;c++){
    x.beginPath();
    for(let i=0;i<256;i++){const a=i/256*TAU+t*.2*(c+1),r=R*(.25+.2*c)+wv[i*4]*sin(i/256*PI)*R*.5;x.lineTo(cos(a)*r,sin(a)*r)}
    x.closePath();x.strokeStyle=hs(hue+c*40);x.stroke();
  }
  x.beginPath();for(let i=0;i<512;i++)x.lineTo((i/511-.5)*W*1.3,wv[i*2]*R*.7);
  x.strokeStyle=hs(hue+180);x.stroke();
},
()=>{ // 6 plasma, computed at 24x13 .. 192x108 (see rl) and blown up; spectrum adds mirrored stripes
  const d=PD.data,h=hue/57.3,l=(.3+.7*min(1,lvl))*255,sx=sin(t)*30,w=24<<rl(),hh=w*9>>4,f=96/w;
  for(let j=0;j<hh;j++)for(let i=0,o=j*768;i<w;i++,o+=4){
    const px=i*f,py=j*f,v=(sin(px*.11+t)+sin(py*.15-t*1.3)+sin((px+py)*.07+t*.7)+sin(hypot(px-48+sx,py-27)*.2-t*2)+B[min(NB-1,abs(px-48)*NB/49|0)]*2)*1.5+h;
    d[o]=(.5+.5*sin(v))*l;d[o+1]=(.5+.5*sin(v+2.1))*l;d[o+2]=(.5+.5*sin(v+4.2))*l;
  }
  px2.putImageData(PD,0,0);
  const s=hypot(W,H);x.globalAlpha*=.4;x.imageSmoothingEnabled=w>96;x.drawImage(pc,0,0,w,hh,-s,-s,s*2,s*2);x.imageSmoothingEnabled=true; // .4 = trail fade, so filled areas don't burn out
},
()=>{ // 7 nested wire cubes: bass, mids, highs
  x.lineWidth=D*2;
  for(let c=0;c<3;c++){
    const s=(.5+c*.45)*(1+.6*B[c*12+2]);
    for(let i=0;i<8;i++)pr(i&1?s:-s,i&2?s:-s,i&4?s:-s,t*(.5+c*.3),t*(.4-c*.25),5,i*2);
    x.beginPath();
    for(let i=0;i<8;i++)for(let b=1;b<8;b*=2)if(!(i&b))line(OP[i*2],OP[i*2+1],OP[(i|b)*2],OP[(i|b)*2+1]);
    x.strokeStyle=hs(hue+c*120);x.stroke();
  }
},
()=>{ // 8 dot wave: ripples from the centre, distance = frequency band
  for(let i=0;i<26;i++)for(let j=0;j<26;j++){
    const X=(i-12.5)*.22,Z=(j-12.5)*.22,r=hypot(X,Z),b=min(NB-1,r*9|0),d=pr(X,sin(r*4-t*3)*.25-B[b]*.9,Z,t*.3,-.6,5.2,0)/F*14*D;
    x.fillStyle=hs(hue+b*9);x.fillRect(OP[0],OP[1],d,d);
  }
},
()=>{ // 9 copper bars + spectrum analyser with falling peak caps
  const s=hypot(W,H),bh=H*.012,bw=W*.8/NB;
  x.globalAlpha*=.4;
  for(let i=0;i<6;i++){
    const y=sin(t*1.5+i*.55)*H*.32;
    for(let k=-6;k<7;k++){x.fillStyle=hs(hue+i*45,1,40-abs(k)*6);x.fillRect(-s,y+k*bh,s*2,bh+1)}
  }
  for(let b=0;b<NB;b++){
    const X=(b-NB/2)*bw,h=B[b]*H*.35;PK[b]=max(B[b],PK[b]-dt*.5);
    x.fillStyle=hs(hue+b*9);x.fillRect(X,H*.2-h,bw*.8,h);
    x.fillStyle=hs(hue+b*9,1,25);x.fillRect(X,H*.2,bw*.8,h*.4);
    x.fillStyle='#fff';x.fillRect(X,H*.2-PK[b]*H*.35-bh,bw*.8,bh);
  }
},
()=>{ // 10 fire: classic heat buffer, the spectrum stokes the bottom row (bass in the middle)
  for(let i=0;i<128;i++)FH[72*128+i]=FH[73*128+i]=min(255,Math.random()*420*(.25+B[min(NB-1,abs(i-64)>>1)]));
  for(let o=0;o<72*128;o++){FH[o]=(FH[o+127]+FH[o+128]+FH[o+129]+FH[o+256])*.2485;FB.p[o]=FP[FH[o]]}
  x.globalAlpha*=.45;x.drawImage(FB.put(),-W,-H*1.5,W*2,H*2.1);
},
()=>{ // 11 twister: a twisting four-sided column, bass twists it, each scanline bulges with its band
  x.globalAlpha*=.45;
  const n=120,rh=H*1.3/n;
  for(let j=0;j<n;j++){
    const y=(j/n-.5)*H*1.3,a=t*1.5+sin(j*.05+t)*(1.5+3*min(1,lvl)),wd=R*.3*(1+.6*B[j*NB/n|0]),cx=sin(t*.7+j*.03)*R*.3;
    for(let i=0;i<4;i++){
      const x1=sin(a+i*PI/2)*wd,x2=sin(a+(i+1)*PI/2)*wd;
      if(x2>x1){x.fillStyle=hs(hue+i*90,1,15+45*(x2-x1)/wd/1.42);x.fillRect(cx+x1,y,x2-x1,rh+1)}
    }
  }
},
()=>{ // 12 vector balls: 64 sprites morphing cube > sphere > helix, depth sorted
  const shp=((beats>>3)+(t/8|0))%3;
  for(let i=0;i<64;i++){
    const a=i/64*TAU*3,j=i*3;let X,Y,Z;
    if(!shp){X=((i&3)-1.5)*.7;Y=((i>>2&3)-1.5)*.7;Z=((i>>4)-1.5)*.7}
    else if(shp==1){X=SPH[i*18]*1.4;Y=SPH[i*18+1]*1.4;Z=SPH[i*18+2]*1.4}
    else{X=cos(a)*1.3;Y=(i/32-1)*1.4;Z=sin(a)*1.3}
    VP[j]+=(X-VP[j])*.08;VP[j+1]+=(Y-VP[j+1])*.08;VP[j+2]+=(Z-VP[j+2])*.08;
    BW[i]=pr(VP[j],VP[j+1],VP[j+2],t*.6,t*.4,5,0);BX[i]=OP[0];BY[i]=OP[1];
  }
  ORD.sort((a,b)=>BW[a]-BW[b]);
  x.globalCompositeOperation='source-over';
  for(const i of ORD){const s=BW[i]*.28*(1+.6*B[i>>1]);x.drawImage(SPR[((i>>2)+(hue/60|0))%6],BX[i]-s,BY[i]-s,s*2,s*2)}
},
()=>{ // 13 voxel landscape: one ray per column over the height map, drawn front to back
  const p=VX.p,px=t*25,py=sin(t*.15)*70,ang=Math.atan2(cos(t*.15)*10.5,25),hsc=.5*(1+.2*min(1,lvl));
  vh+=(HM[(py*2&511)<<9|px*2&511]*hsc+35-vh)*.05;
  const w=[240,320,480,640][rl()],h=w*9>>4,sc=w/320; // 240x135 .. 640x360 (the lowest step used to be 80x45)
  for(let i=0;i<w;i++){
    const a=ang+(i/w-.5)*1.1,dx=cos(a),dy=sin(a);let yb=h;
    for(let z=3,dz=1;z<400&&yb>0;z+=dz,dz+=.015){
      const m=((py+dy*z)*2&511)<<9|(px+dx*z)*2&511,sy=((vh-HM[m]*hsc)/z*110+50)*sc|0;
      if(sy<yb){const col=CM[m]&0xffffff|255-z*.6<<24;for(let y=max(sy,0);y<yb;y++)p[y*640+i]=col;yb=sy}
    }
    for(let y=0;y<yb;y++)p[y*640+i]=0; // sky stays transparent: stars show through
  }
  x.globalCompositeOperation='source-over';x.imageSmoothingEnabled=w>480;x.drawImage(VX.put(),0,0,w,h,-W*.75,-H*.75,W*1.5,H*1.5);x.imageSmoothingEnabled=true;
},
()=>{ // 14 glenz vectors: two nested glass icosahedra, each face lights up with its band
  x.globalAlpha*=.4;x.lineWidth=D;x.strokeStyle='#fff';
  for(let g=0;g<2;g++){
    const s=(g?.5:1)*(1+.3*min(1,lvl))*.75;
    for(let i=0;i<12;i++)pr(IV[i][0]*s,IV[i][1]*s,IV[i][2]*s,t*(g?-.7:.5),t*(g?.4:-.3),4.5,i*2);
    IF.forEach(([a,b,c],f)=>{
      x.beginPath();x.moveTo(OP[a*2],OP[a*2+1]);x.lineTo(OP[b*2],OP[b*2+1]);x.lineTo(OP[c*2],OP[c*2+1]);x.closePath();
      x.fillStyle=hs(hue+f*18+g*120,.15+.7*B[f+g*10]);x.fill();x.stroke();
    });
  }
}];

