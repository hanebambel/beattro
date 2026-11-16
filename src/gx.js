// ---- GX: everything is drawn by WebGL. The older scenes were written for the 2D canvas (lines, polygons, rectangles, pictures, text); GX is that same
// set of calls, done on the graphics card, so those scenes run unchanged and nothing has to be copied between a 2D canvas and a texture any more.
// It draws into render targets (textures): MAIN is the frame (it is never cleared, only faded: that makes the trails), OLD and NEW hold the two scenes of a
// transition. Calls are collected into one vertex buffer and sent when the blend mode, the texture or the target changes.
// Differences to the 2D canvas, on purpose: lines of one path that cross add up in the additive mode (they glow more where they meet); polygons are filled
// as fans (fine for the convex shapes used here) and their edges are not smoothed; text comes from one sheet of glyphs.
if(gl){
  const pg=gl.createProgram(),fg=cmp(gl.FRAGMENT_SHADER,`precision highp float;uniform sampler2D T;in vec2 u;in vec4 c;in float m;out vec4 o;
void main(){o=c*(m>1.5?vec4(clamp(u.y-abs(u.x)+.5,0.,1.)):m>.5?texture(T,u):vec4(1));}`); // m: 0 plain, 1 picture, 2 line (u.x = distance from its middle, u.y = half its width, in pixels)
  gl.attachShader(pg,cmp(gl.VERTEX_SHADER,`precision highp float;layout(location=0)in vec2 P;layout(location=1)in vec2 U;layout(location=2)in vec4 C;layout(location=3)in float M;uniform vec2 R;out vec2 u;out vec4 c;out float m;
void main(){u=U;c=C;m=M;gl_Position=vec4(P.x/R.x*2.-1.,1.-P.y/R.y*2.,0,1);}`));
  gl.attachShader(pg,fg);gl.linkProgram(pg);
  if(!gl.getProgramParameter(pg,gl.LINK_STATUS))console.warn('shader scene off:',gl.getProgramInfoLog(pg),gl.getShaderInfoLog(fg));
  else{
    const NV=131072,V=new Float32Array(NV*9),va=gl.createVertexArray(),vb=gl.createBuffer(),uR=gl.getUniformLocation(pg,'R'),uT=gl.getUniformLocation(pg,'T');
    gl.bindVertexArray(va);gl.bindBuffer(gl.ARRAY_BUFFER,vb);
    [[2,0],[2,8],[4,16],[1,32]].map(([s,o],i)=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,s,gl.FLOAT,false,36,o)});gl.bindVertexArray(null);
    let n=0,tgt=0,ctex=0,cnear=0,cadd=0,path=[],sub=0,ux=0,uy=0;const stack=[],pool=new Map,texs=new WeakMap;
    const KEYS=['a','b','c','d','e','f','globalAlpha','globalCompositeOperation','fillStyle','strokeStyle','lineWidth','font','textAlign','lineCap','lineJoin','imageSmoothingEnabled'];
    const mkTex=(w,h,src)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE10);gl.bindTexture(gl.TEXTURE_2D,t);
      if(src)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.activeTexture(gl.TEXTURE0);return t};
    const mkT=(w,h,depth)=>{ // a render target: a texture to draw into, optionally with a depth buffer
      const T={w,h,tex:mkTex(w,h),fb:gl.createFramebuffer()};gl.bindFramebuffer(gl.FRAMEBUFFER,T.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,T.tex,0);
      if(depth){T.rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,T.rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,T.rb)}
      gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return T};
    const del=T=>{if(T){gl.deleteTexture(T.tex);gl.deleteFramebuffer(T.fb);T.rb&&gl.deleteRenderbuffer(T.rb)}};
    // colours: the strings the scenes use (hsla(), hsl(), rgb(), rgba(), #rgb, #rgba, #rrggbb, #rrggbbaa) > [r, g, b, a]
    const CC=new Map,col=s=>{
      let q=CC.get(s);if(q)return q;
      if(s[0]=='#'){const h=s.length<6?[...s.slice(1)].map(v=>v+v).join(''):s.slice(1);q=[0,2,4,6].map(i=>i<h.length?parseInt(h.substr(i,2),16)/255:1)}
      else{
        const v=s.match(/-?\d*\.?\d+(?:e-?\d+)?/g).map(Number);
        if(s[0]=='h'){const l=min(1,max(0,v[2]/100)),c=v[1]/100*min(l,1-l),f=k=>{k=(k+v[0]/30)%12;if(k<0)k+=12;return l-c*max(-1,min(k-3,9-k,1))};q=[f(0),f(8),f(4),v[3]??1]}
        else q=[v[0]/255,v[1]/255,v[2]/255,v[3]??1];
      }
      q[3]=min(1,max(0,q[3]));if(CC.size>4e3)CC.clear();CC.set(s,q);return q;
    };
    // text: one sheet with the 95 printable characters, bold monospace like before, 16 per row. Below them six more rows that fill up as other characters are asked for
    // (a song title has umlauts, accents or another script): gph() draws such a character into the next free cell, squeezed to the cell's width if it is wider, and the sheet is loaded again before the next draw
    const FS=120,AC=mkc(1,1),ag=AC.getContext('2d');ag.font=`bold ${FS}px monospace`;
    const CW=Math.ceil(ag.measureText('M').width),ADV=ag.measureText('M').width/FS,CH=FS*1.3|0;AC.width=CW*16+32;AC.height=CH*12;
    ag.font=`bold ${FS}px monospace`;ag.fillStyle='#fff';for(let i=0;i<95;i++)ag.fillText(String.fromCharCode(32+i),i%16*(CW+2),(i>>4)*CH+FS);
    const EX=new Map;let exd=0;const gph=cp=>{let k=EX.get(cp);if(!k){if(EX.size>95)EX.clear();EX.set(cp,k=96+EX.size);ag.clearRect(k%16*(CW+2),(k>>4)*CH,CW+2,CH);ag.fillText(String.fromCodePoint(cp),k%16*(CW+2),(k>>4)*CH+FS,CW);exd=1}return k}; // ponytail: 96 cells; when they are full it starts over, and a character still on screen shows a wrong glyph until it is drawn again a frame later
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,1);const atlas=mkTex(0,0,AC);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0);
    gl.activeTexture(gl.TEXTURE10);gl.bindTexture(gl.TEXTURE_2D,atlas);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.activeTexture(gl.TEXTURE0);
    const G=GX={a:1,b:0,c:0,d:1,e:0,f:0,globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:'#000',strokeStyle:'#000',lineWidth:1,font:'10px monospace',textAlign:'left',lineCap:'butt',lineJoin:'miter',imageSmoothingEnabled:true};
    const flush=G.flush=()=>{ // sets all the GL state it needs itself, so the scenes with their own GL code in between can't upset it; leaves blending off and no vertex array bound
      if(n){
        gl.bindFramebuffer(gl.FRAMEBUFFER,tgt.fb);gl.viewport(0,0,tgt.w,tgt.h);gl.useProgram(pg);gl.uniform2f(uR,tgt.w,tgt.h);gl.uniform1i(uT,10);
        if(exd){exd=0;gl.activeTexture(gl.TEXTURE10);gl.bindTexture(gl.TEXTURE_2D,atlas);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,AC);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0);gl.generateMipmap(gl.TEXTURE_2D)}
        gl.activeTexture(gl.TEXTURE10);gl.bindTexture(gl.TEXTURE_2D,ctex||atlas);
        if(ctex&&ctex!=atlas){gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,cnear?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,cnear?gl.NEAREST:gl.LINEAR)}
        gl.activeTexture(gl.TEXTURE0);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,cadd?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);
        gl.bindVertexArray(va);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,V.subarray(0,n*9),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,n);
        gl.bindVertexArray(null);gl.disable(gl.BLEND);n=0;
      }
    };
    const need=(k,tex,near)=>{const add=G.globalCompositeOperation=='lighter';if(n&&(add!=cadd||tex&&(tex!=ctex||near!=cnear)||n+k>NV))flush();cadd=add;if(tex){ctex=tex;cnear=near}};
    const vx=(x,y,u,w,r,g,b,a,m)=>{const i=n++*9;V[i]=x;V[i+1]=y;V[i+2]=u;V[i+3]=w;V[i+4]=r;V[i+5]=g;V[i+6]=b;V[i+7]=a;V[i+8]=m};
    const px=(x,y)=>G.a*x+G.c*y+G.e,py=(x,y)=>G.b*x+G.d*y+G.f,sc=()=>Math.sqrt(abs(G.a*G.d-G.b*G.c));
    const pm=s=>{const q=col(s),a=q[3]*G.globalAlpha;return[q[0]*a,q[1]*a,q[2]*a,a]};
    Object.assign(G,{
      save(){const s={};for(const k of KEYS)s[k]=G[k];stack.push(s)},restore(){Object.assign(G,stack.pop())},
      setTransform(a,b,c,d,e,f){G.a=a;G.b=b;G.c=c;G.d=d;G.e=e;G.f=f},
      translate(x,y){G.e+=G.a*x+G.c*y;G.f+=G.b*x+G.d*y},
      rotate(t){const c=cos(t),s=sin(t),{a,b}=G;G.a=a*c+G.c*s;G.b=b*c+G.d*s;G.c=G.c*c-a*s;G.d=G.d*c-b*s},
      scale(x,y){G.a*=x;G.b*=x;G.c*=y;G.d*=y},
      // paths: points are placed (transformed) as they are added, like on the 2D canvas
      beginPath(){path=[];sub=0},
      moveTo(x,y){path.push(sub={p:[px(x,y),py(x,y)],cl:0});ux=x;uy=y},
      lineTo(x,y){if(!sub)return G.moveTo(x,y);sub.p.push(px(x,y),py(x,y));ux=x;uy=y},
      closePath(){if(sub)sub.cl=1},
      ellipse(x,y,rx,ry,ro,a0,a1){if(a1<a0)a1+=TAU;const k=max(8,min(160,abs(a1-a0)*max(rx,ry)*sc()/5|0)),c=cos(ro),s=sin(ro);
        for(let i=0;i<=k;i++){const a=a0+(a1-a0)*i/k,X=cos(a)*rx,Y=sin(a)*ry;G.lineTo(x+X*c-Y*s,y+X*s+Y*c)}},
      arc(x,y,r,a0,a1){G.ellipse(x,y,r,r,0,a0,a1)},
      quadraticCurveTo(cx,cy,x,y){const x0=ux,y0=uy;for(let i=1;i<=12;i++){const t=i/12,s=1-t;G.lineTo(s*s*x0+2*s*t*cx+t*t*x,s*s*y0+2*s*t*cy+t*t*y)}},
      fill(){const[r,g,b,a]=pm(G.fillStyle);for(const{p}of path){need(p.length*1.5);for(let i=2;i<p.length-2;i+=2){vx(p[0],p[1],0,0,r,g,b,a,0);vx(p[i],p[i+1],0,0,r,g,b,a,0);vx(p[i+2],p[i+3],0,0,r,g,b,a,0)}}},
      stroke(){ // every line is a strip of quads one pixel wider than the line on each side; the pixel shader fades that margin, so lines are smooth without multisampling
        const[r,g,b,a]=pm(G.strokeStyle),hw=G.lineWidth*sc()/2,e=hw+1,rnd=G.lineCap=='round';
        for(const{p,cl}of path){
          const m=p.length/2;if(m<2)continue;need(m*6+(rnd?60:0));
          let lx,ly,rx,ry;
          for(let i=0;i<m+cl;i++){
            const j=i%m*2,pj=(i+m-1)%m*2,nj=(i+1)%m*2;
            let ax=p[j]-p[pj],ay=p[j+1]-p[pj+1],bx=p[nj]-p[j],by=p[nj+1]-p[j+1],al=hypot(ax,ay),bl=hypot(bx,by);
            if(!cl&&i==0||al<1e-6){ax=bx;ay=by;al=bl}if(!cl&&i==m-1||bl<1e-6){bx=ax;by=ay;bl=al}if(al<1e-6)continue;
            ax/=al;ay/=al;bx/=bl;by/=bl;
            let nx=-(ay+by),ny=ax+bx,nl=hypot(nx,ny);if(nl<1e-6){nx=-ay;ny=ax;nl=1}nx/=nl;ny/=nl;
            const k=e/max(.4,nx*-ay+ny*ax),X=p[j],Y=p[j+1],Lx=X+nx*k,Ly=Y+ny*k,Rx=X-nx*k,Ry=Y-ny*k; // corner: both sides meet on the bisector
            if(lx!==undefined){vx(lx,ly,e,hw,r,g,b,a,2);vx(rx,ry,-e,hw,r,g,b,a,2);vx(Lx,Ly,e,hw,r,g,b,a,2);vx(rx,ry,-e,hw,r,g,b,a,2);vx(Rx,Ry,-e,hw,r,g,b,a,2);vx(Lx,Ly,e,hw,r,g,b,a,2)}
            lx=Lx;ly=Ly;rx=Rx;ry=Ry;
          }
          if(rnd&&!cl)for(const[j,k]of[[0,2],[m*2-2,m*2-4]]){ // round ends: half a disc beyond each end
            const d=Math.atan2(p[j+1]-p[k+1],p[j]-p[k]);
            for(let i=0;i<8;i++){const a0=d-PI/2+i*PI/8,a1=a0+PI/8;vx(p[j],p[j+1],0,0,r,g,b,a,0);vx(p[j]+cos(a0)*hw,p[j+1]+sin(a0)*hw,0,0,r,g,b,a,0);vx(p[j]+cos(a1)*hw,p[j+1]+sin(a1)*hw,0,0,r,g,b,a,0)}
          }
        }
      },
      createLinearGradient(x0,y0,x1,y1){const s=[];return{s,x0,y0,dx:x1-x0,dy:y1-y0,addColorStop(t,c){s.push(col(c))}}}, // two stops, which is all that is used
      fillRect(x,y,w,h){
        const F=G.fillStyle,q=(X,Y,c)=>vx(px(X,Y),py(X,Y),0,0,c[0],c[1],c[2],c[3],0);
        if(F.s){ // gradient: in eight strips, each corner coloured by where it lies along the gradient
          need(48);const ga=G.globalAlpha,at=(X,Y)=>{const t=min(1,max(0,((X-F.x0)*F.dx+(Y-F.y0)*F.dy)/(F.dx*F.dx+F.dy*F.dy))),a=F.s[0],b=F.s[1],al=(a[3]+(b[3]-a[3])*t)*ga;return[0,1,2].map(i=>(a[i]+(b[i]-a[i])*t)*al).concat(al)};
          for(let i=0;i<8;i++){const y0=y+h*i/8,y1=y+h*(i+1)/8,A=at(x,y0),B=at(x+w,y0),C=at(x,y1),E=at(x+w,y1);q(x,y0,A);q(x+w,y0,B);q(x,y1,C);q(x+w,y0,B);q(x+w,y1,E);q(x,y1,C)}
        }else{need(6);const c=pm(F);q(x,y,c);q(x+w,y,c);q(x,y+h,c);q(x+w,y,c);q(x+w,y+h,c);q(x,y+h,c)}
      },
      // pictures: a canvas (sent to the graphics card each time it is drawn, unless marked .st = it never changes) or a render target
      drawImage(im,...q){
        const iw=im.w||im.width,ih=im.h||im.height,[sx,sy,sw,sh,dx,dy,dw,dh]=q.length>4?q:[0,0,iw,ih,q[0],q[1],q[2]??iw,q[3]??ih],near=!G.imageSmoothingEnabled;
        let t=im.tex;
        if(!t){
          t=texs.get(im);need(6,t||1,near);
          if(!t||!im.st){gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,1);
            if(t){gl.activeTexture(gl.TEXTURE10);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.activeTexture(gl.TEXTURE0)}else texs.set(im,t=mkTex(0,0,im));
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0)}
        }
        need(6,t,near);
        const a=G.globalAlpha,u0=sx/iw,u1=(sx+sw)/iw,fl=im.tex?1:0,v0=fl?1-sy/ih:sy/ih,v1=fl?1-(sy+sh)/ih:(sy+sh)/ih,c=(X,Y,u,v)=>vx(px(X,Y),py(X,Y),u,v,a,a,a,a,1);
        c(dx,dy,u0,v0);c(dx+dw,dy,u1,v0);c(dx,dy+dh,u0,v1);c(dx+dw,dy,u1,v0);c(dx+dw,dy+dh,u1,v1);c(dx,dy+dh,u0,v1);
      },
      glyphs(s){for(const c of s)if(c.codePointAt(0)>160)gph(c.codePointAt(0))}, // all of a text's special characters at once: one reload of the sheet instead of one per character as it scrolls in
      measureText(s){return{width:s.length*ADV*parseFloat(/([\d.]+)px/.exec(G.font)[1])}},
      fillText(s,x,y,mw){
        const z=parseFloat(/([\d.]+)px/.exec(G.font)[1]),w=s.length*ADV*z,k=mw&&w>mw?mw/w:1,[r,g,b,a]=pm(G.fillStyle),ad=ADV*z*k,h=z*CH/FS,top=y-z;
        need(s.length*6,atlas,0);x-=G.textAlign=='center'?w*k/2:G.textAlign=='right'?w*k:0;
        for(let i=0,j=0;i<s.length;i++,j++){ // ponytail: width and centring count a character outside the basic plane (an emoji) as two cells
          const cp=s.codePointAt(i),ch=cp<127?cp-32:cp>160?gph(cp):0;if(cp>65535)i++;if(ch<1)continue;
          const u0=ch%16*(CW+2)/AC.width,u1=u0+ADV*FS/AC.width,v0=(ch>>4)*CH/AC.height,v1=v0+CH/AC.height,X=x+j*ad,c=(X,Y,u,v)=>vx(px(X,Y),py(X,Y),u,v,r,g,b,a,1);
          c(X,top,u0,v0);c(X+ad,top,u1,v0);c(X,top+h,u0,v1);c(X+ad,top,u1,v0);c(X+ad,top+h,u1,v1);c(X,top+h,u0,v1);
        }
      },
      // render targets
      use(T){if(T!=tgt){flush();tgt=T}},
      copy(A,B){flush();gl.bindFramebuffer(gl.READ_FRAMEBUFFER,A.fb);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,B.fb);gl.blitFramebuffer(0,0,A.w,A.h,0,0,B.w,B.h,gl.COLOR_BUFFER_BIT,gl.LINEAR);gl.bindFramebuffer(gl.FRAMEBUFFER,null)},
      lo(w,h,depth,tag=''){const k=w+'x'+h+depth+tag;let T=pool.get(k);if(!T){if(pool.size>23){const o=pool.keys().next().value;del(pool.get(o));pool.delete(o)}pool.set(k,T=mkT(w,h,depth))}return T}, // at most 24 are kept // scratch targets for the shader scenes (they render small and are drawn enlarged), kept per size
      at:[atlas,(CW+2)/AC.width,CH/AC.height,ADV*FS/AC.width], // the sheet of glyphs: texture, a glyph's pitch across and down, its width
      resize(){flush();[MAIN,OLD,NEW,HIS,...pool.values()].map(del);pool.clear();ctex=0;MAIN=mkT(W,H);OLD=mkT(W>>1,H>>1);NEW=mkT(W,H);HIS=mkT(W,H);SCR={fb:null,w:W,h:H}; // SCR: the screen itself; HIS: the previous frame, for the motion blur of the dark mood
        tgt=MAIN;gc.width=W;gc.height=H},
    });
    G.resize();x=G;
  }
}
