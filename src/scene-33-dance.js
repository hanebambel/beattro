// ---- 33 silhouette dance: three black cat silhouettes dance in front of a slow sunburst, each trailed by coloured echoes of its last moves
// (flat shapes, hard contrast and motion echoes in the spirit of early-90s Amiga dance demos; the dancer and its moves are made up here).
// A new pose on every beat; where the song has no beat, they only sway from pose to pose.
let DANCE=-1,CATS=0; // CATS: the dancers, for the dance floor (scene 39) too
{
  // pose: hip sway, lean, left arm (shoulder, elbow), right arm, left leg, right leg, head tilt, (bounce); angles from "hanging down"
  const PO=[[0,0,2.6,.3,2.6,.3,.15,.15,0],[.6,.15,2.9,.2,.6,1.4,.1,.5,.2],[-.6,-.15,.6,1.4,2.9,.2,.5,.1,-.2],[0,0,1.57,0,1.57,0,.5,.5,0],[.4,-.2,2.3,0,.9,.9,0,.6,-.25],[-.3,.25,1.2,1.2,1.2,1.2,.7,.7,.15]],
    cp=new Float32Array(10),HP=new Float32Array(640);let hq=0,pi=0,lb=-1;
  const cat=(o,cx,sc,fill,eyes)=>{ // one cat from the pose stored at HP[o..]
    const g=i=>HP[o+i],hx=cx+g(0)*.12*sc,hy=(.15-g(9))*sc,a0=g(1),a1=a0+g(8),nx=hx+sin(a0)*.42*sc,ny=hy-cos(a0)*.42*sc,ex=nx+sin(a1)*.17*sc,ey=ny-cos(a1)*.17*sc;
    x.strokeStyle=x.fillStyle=fill;x.lineCap=x.lineJoin='round';
    x.lineWidth=.17*sc;x.beginPath();x.moveTo(hx,hy);x.lineTo(nx,ny);x.stroke();
    for(const sg of[-1,1]){
      const a=g(sg<0?2:4),b=a+g(sg<0?3:5),sx=nx+sg*.05*sc,sy=ny+.04*sc,qx=sx+sg*sin(a)*.2*sc,qy=sy+cos(a)*.2*sc,l=g(sg<0?6:7),kx=hx+sg*(.05+sin(l)*.22)*sc,ky=hy+cos(l)*.22*sc,ea=a1+sg*.6;
      x.lineWidth=.06*sc;x.beginPath();x.moveTo(sx,sy);x.lineTo(qx,qy);x.lineTo(qx+sg*sin(b)*.2*sc,qy+cos(b)*.2*sc);x.stroke();
      x.lineWidth=.075*sc;x.beginPath();x.moveTo(hx+sg*.05*sc,hy);x.lineTo(kx,ky);x.lineTo(kx+sg*sin(l*.3)*.24*sc,ky+cos(l*.3)*.24*sc);x.stroke();
      x.beginPath();x.moveTo(ex+sin(ea-.45)*.1*sc,ey-cos(ea-.45)*.1*sc);x.lineTo(ex+sin(ea)*.22*sc,ey-cos(ea)*.22*sc);x.lineTo(ex+sin(ea+.45)*.1*sc,ey-cos(ea+.45)*.1*sc);x.fill(); // ear
    }
    x.beginPath();x.arc(ex,ey,.125*sc,0,TAU);x.fill();
    x.lineWidth=.04*sc;x.beginPath();x.moveTo(hx,hy);x.quadraticCurveTo(hx-.3*sc,hy+.1*sc,hx-(.32-sin(t*3)*.05)*sc,hy-(.22-g(0)*.1)*sc);x.stroke(); // tail
    if(eyes){x.fillStyle=eyes;for(const sg of[-1,1]){x.beginPath();x.arc(ex+sg*cos(a1)*.05*sc,ey+sg*sin(a1)*.05*sc,.022*sc,0,TAU);x.fill()}}
  };
  const step=()=>{ // one frame of dancing: towards the pose of this beat, and into the history for the echoes
    const bt=quiet||!beats?t/2|0:beats,e=min(1,dt*(quiet?3:14));
    if(bt!=lb){lb=bt;pi=(pi+1+bt*7%4)%6}
    for(let i=0;i<9;i++)cp[i]+=(PO[pi][i]-cp[i])*e;cp[9]=kick*.05;
    hq=hq+1&63;HP.set(cp,hq*10);
  };
  CATS={cat,step,at:d=>(hq-d&63)*10};
  DANCE=SC.push(()=>{
    const s=hypot(W,H),sc=R*.75,ga=x.globalAlpha;step();
    x.globalCompositeOperation='source-over';
    for(let i=0;i<12;i++){x.fillStyle=hs(hue+(i&1)*25,1,(i&1?26:38)+kick*6);x.beginPath();x.moveTo(0,0);x.arc(0,0,s,i*TAU/12+t*.15,(i+1)*TAU/12+t*.15+.01);x.fill()}
    for(const[cx,k,dl]of[[-R*1.05,.6,8],[R*1.05,.6,16],[0,1,0]]){
      x.globalAlpha=ga*.5;for(let j=4;j;j--)cat((hq-dl-j*5&63)*10,cx,sc*k*(1+j*.07),hs(hue+150+j*30,1,55));
      x.globalAlpha=ga;cat((hq-dl&63)*10,cx,sc*k,'#000',hs(hue+180,1,70));
    }
  })-1;
}
