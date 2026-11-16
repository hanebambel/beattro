// ---- 31 ring world: the whole song as a place ----
// On load the complete file is decoded and analysed (spectrum every ~75 ms). That map becomes the landscape on the inside of a ring:
// once around = the whole track, across = frequency (bass in the middle, treble at the rims), loud = mountains, quiet = lakes.
// The camera flies at exactly playback speed, so every kick of the song lies ahead as a line of light across the ground and you cross it on the beat;
// the part already played is painted brighter, lakes mirror the far side of the song, and the rest of it hangs overhead.
// If the file can't be analysed (too big, or the browser can't decode it), the ring is written live at the camera and the camera looks back at it.
const SN=gl?min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE)):4096; // time columns of the song map
// <song> the analysis between these markers is also run by test.mjs
// Radix-2 FFT in place.
const fft=(re,im)=>{const n=re.length,C=fft.c?.length==n/2?fft.c:fft.c=Float64Array.from({length:n/2},(_,i)=>Math.cos(2*Math.PI*i/n)),Z=fft.s?.length==n/2?fft.s:fft.s=Float64Array.from({length:n/2},(_,i)=>-Math.sin(2*Math.PI*i/n));for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){let q=re[i];re[i]=re[j];re[j]=q;q=im[i];im[i]=im[j];im[j]=q}}for(let L=2;L<=n;L*=2)for(let i=0,st=n/L;i<n;i+=L)for(let k=0;k<L/2;k++){const c=C[k*st],s=Z[k*st],p=i+k,q=p+L/2,xr=re[q]*c-im[q]*s,xi=re[q]*s+im[q]*c;re[q]=re[p]-xr;im[q]=im[p]-xi;re[p]+=xr;im[p]+=xi}};
const SD=new Uint8Array(SN*NB*4); // song map: SN time columns x NB bands; r level, g level smoothed over ~2 s, b kick
let SOK=0,sgen=0,calt=0,sst='',lc=-1,SEC=[];
const songTex=()=>{if(!gl)return;gl.activeTexture(gl.TEXTURE2);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,SN,NB,0,gl.RGBA,gl.UNSIGNED_BYTE,SD);gl.generateMipmap(gl.TEXTURE_2D);gl.activeTexture(gl.TEXTURE0)};
function songMap(E,db){ // E[col*NB+band]: magnitudes (db) or levels 0..1
  const pc=(a,q)=>Float32Array.from(a).sort()[a.length*q|0]||1e-9,K=SN>>9,fl=new Float32Array(SN),L=new Float32Array(SN),G=new Float32Array(SN*NB),col=new Float32Array(SN);
  for(let b=0;b<NB;b++){ // each band: its top 30 dB, measured from its own 99th percentile
    for(let c=0;c<SN;c++)col[c]=E[c*NB+b];
    const pk=pc(col,.99);
    if(db)for(let c=0;c<SN;c++)E[c*NB+b]=max(0,min(1,1+Math.log10(E[c*NB+b]/pk+1e-9)/1.5));
  }
  for(let c=0;c<SN;c++)for(let b=0;b<NB;b++){
    if(b<6)fl[c]+=max(0,E[c*NB+b]-E[(c+SN-1)%SN*NB+b]); // kick = jump in the bass bands
    G[c*NB+b]=E[c*NB+b];
  }
  for(let n=0;n<3;n++)for(let b=0;b<NB;b++){ // three box blurs = a smooth bell over ~2 s (one alone turns every kick into a stair)
    let g=0;for(let j=-K;j<=K;j++)g+=G[(j+SN)%SN*NB+b];
    for(let c=0;c<SN;c++){col[c]=g/(2*K+1);g+=G[(c+K+1)%SN*NB+b]-G[(c-K+SN)%SN*NB+b]}
    for(let c=0;c<SN;c++)G[c*NB+b]=col[c];
  }
  for(let c=0;c<SN;c++)for(let b=0;b<NB;b++)L[c]+=G[c*NB+b]/NB;
  // the big shape of the song: overall loudness (smoothed over ~2 s), stretched between its quiet and its loud parts
  const lo=pc(L,.03),hi=pc(L,.9),fm=pc(fl,.97);
  for(let c=0;c<SN;c++)for(let b=0;b<NB;b++){
    const i=(b*SN+c)*4,l=max(0,min(1,(L[c]-lo)/(hi-lo+1e-9)))**.6;
    SD[i]=E[c*NB+b]*255;SD[i+1]=l*(.3+.7*G[c*NB+b])*255;SD[i+2]=min(1,(fl[c]/fm)**2)*(fl[c]>fm*.45)*255;SD[i+3]=255;
  }
  songTex();SOK=1;
}
// mono samples > magnitudes per time column and band. n = FFT size: 2048 at 44.1 kHz, half of that at half the rate, so the bins stay ~21.5 Hz wide
// (bands above half the sample rate stay empty). Columns c0..c1 only, so the caller can do it in slices.
function spectro(d,n=2048,E=new Float32Array(SN*NB),c0=0,c1=SN){
  const re=new Float32Array(n),im=new Float32Array(n);
  for(let c=c0;c<c1;c++){
    const s0=floor(c/SN*(d.length-n));
    for(let i=0;i<n;i++){re[i]=d[s0+i]*(.5-.5*cos(i*TAU/n));im[i]=0}
    fft(re,im);
    for(let b=0;b<NB;b++){let s=0;for(let i=ED[b];i<ED[b+1]&&i<n/2;i++)s+=hypot(re[i],im[i]);E[c*NB+b]=s/(ED[b+1]-ED[b])}
  }
  return E;
}
// Where the song changes: the beat comes in or drops out, it gets louder or quieter. Compares the 4 s after each column with the 4 s before it
// (kicks per second + raw level) and keeps the biggest jumps, at least 8 s apart. SEC = [[column, jump, beat], ..]; jump > 0 = more, < 0 = less; beat = how much kick drum follows (0..1).
const KD=new Float32Array(SN),SL=new Float32Array(SN); // per column: kicks per second in the 2 s before it (or a kick within the next half second, so a beat that comes in counts from its first kick), loudness relative to the loudest part
function sect(du){
  const w=max(2,SN/du*4|0),L=new Float32Array(SN+1),Kc=new Float32Array(SN+1),N=new Float32Array(SN),m=(P,a,b)=>(P[b]-P[a])/w;
  for(let c=0;c<SN;c++){let l=0;for(let b=0;b<NB;b++)l+=SD[(b*SN+c)*4];L[c+1]=L[c]+l/NB/255;Kc[c+1]=Kc[c]+(SD[c*4+2]>99&&!(SD[c*4-2]>99))}
  let km=du/SN,lm=1e-9;for(let c=w;c<SN-w;c++)km=max(km,m(Kc,c,c+w));
  for(let c=0,h=w>>1;c<SN;c++){const a=max(0,c-h),b=min(SN,c+h);KD[c]=max(Kc[c]-Kc[a],(Kc[min(SN,c+(w>>3))]-Kc[c])*2)/(h*du/SN);lm=max(lm,SL[c]=(L[b]-L[a])/(b-a))}
  for(let c=0;c<SN;c++)SL[c]/=lm; // a beat is at least one kick per second
  for(let c=w;c<SN-w;c++)N[c]=(m(Kc,c,c+w)-m(Kc,c-w,c))/km+(m(L,c,c+w)-m(L,c-w,c))*2;
  for(SEC=[];;){let bi=0;for(let c=0;c<SN;c++)if(abs(N[c])>abs(N[bi]))bi=c;if(abs(N[bi])<.5)break;let k=bi;if(N[bi]>0)for(let c=bi-(w>>3);c<bi+(w>>2);c++)if(Kc[c+1]>Kc[c]){k=c;break} // "more" starts on its first kick
    SEC.push([k,N[bi],m(Kc,bi,bi+w)/km]);N.fill(0,max(0,bi-2*w),bi+2*w)}
  SEC.sort((a,b)=>a[0]-b[0]);
}
// Tempo and kick pattern of the whole song: the low end (two 90 Hz low-passes) every 10 ms, its rises over 20 ms = kick onsets. Every tempo from 70 to 180 BPM
// is tried by folding all onsets onto one beat: at the right tempo they pile up at one spot. A second, finer pass gets the tempo exact enough to stay
// in step for minutes. Then the onsets are folded onto 16 beats (64 sixteenth steps) = the kick pattern; patterns of 4, 8 or 16 beats all fit in. Returns [bpm, time of a beat, pattern(64), sharpness].
// ponytail: assumes one constant tempo (true for most electronic music); for songs that drift, track the beat locally instead.
function tempo(d,sr){
  const hop=sr/100|0,n=d.length/hop|0,f=new Float32Array(n),a=1-Math.exp(-TAU*90/sr),bin=new Float32Array(64);
  let l1=0,l2=0,pe=0,p2=0,sum=1e-9,best=[0,0,0];
  for(let j=0,i=0;j<n;j++){let e=0;for(let q=0;q<hop;q++,i++){l1+=a*(d[i]-l1);l2+=a*(l1-l2);e+=l2*l2}e=Math.sqrt(e/hop);sum+=f[j]=max(0,e-p2)**2;p2=pe;pe=e} // squared: kicks count, the softer bass notes hardly
  const fold=(bpm,nb)=>{ // > [share of all onsets that fall on the fullest spot of the beat, where that spot is (0..1)]
    bin.fill(0);const per=6000/bpm;let bi=0;
    for(let j=0;j<n;j++)if(f[j])bin[j/per%1*nb|0]+=f[j];
    for(let b=1;b<nb;b++)if(bin[b]>bin[bi])bi=b;
    const l=bin[(bi+nb-1)%nb],r=bin[(bi+1)%nb];
    return[(bin[bi]+l+r)/sum,(bi+.5+(r-l)/(bin[bi]+l+r))/nb];
  };
  for(let b=70;b<180;b+=.05){const[s,p]=fold(b,32);if(s>best[0])best=[s,b,p]}
  // Half or double? The fold can't tell: a beat at 76 BPM also fits a grid of 152. But if nearly all onsets that fit the fast grid sit on every
  // second line of it, the song is the slow one (a kick on every fast beat would leave only about half of them there).
  if(best[1]>=120&&fold(best[1]/2,32)[0]>best[0]*.7)best[1]/=2;
  best[0]=0;for(let b=best[1]-.1,b0=b;b<b0+.2;b+=.002){const[s,p]=fold(b,64);if(s>best[0])best=[s,b,p]}
  const[sh,bpm,ph]=best,per=6000/bpm,pat=new Float32Array(64);
  for(let j=0;j<n;j++)if(f[j])pat[Math.round((j/per-ph)*4)%64+64&63]+=f[j];
  const pm=Float32Array.from(pat).sort()[60]; // measured against the 4th strongest step, so one extra loud kick doesn't make the others look weak
  return[bpm,ph*per/100,pat.map(v=>min(1,v/pm)),sh];
}
// Where the bar starts: if one of the four beats carries clearly more kick than the others, that is the "one"; which of the four bars comes first is taken
// from the first moment the beat comes in (up, in s; -1 = unknown). Returns [time of the first beat of the 16-beat pattern, the pattern starting there].
function phase(bpm,t0,pat,up){
  const e=[0,1,2,3].map(b=>pat[b*4]+pat[b*4+16]+pat[b*4+32]+pat[b*4+48]),bw=e.indexOf(max(...e));
  let r=up<0?0:(Math.round((up-t0)*bpm/60)%16+16)%16;
  if(e.filter(v=>v>e[bw]*.75).length==1){const d=((bw-r)%4+4)%4;r=(r+(d>2?d-4:d)+16)%16}
  return[t0+r*60/bpm,pat.map((_,i)=>pat[(i+r*4)%64])];
}
// Title and artist from the file's own tags: ID3v2 at the start of an MP3 (frames TIT2 and TPE1; in v2.2 TT2 and TP1), or the iTunes list of an MP4
// (moov > udta > meta > ilst > (c)nam and (c)ART > data). Returns [title, artist], '' where there is none; cleaned of control characters, composed (NFC), at most 80 characters each.
// ponytail: no ID3v1, no FLAC or Ogg comments, no unsynchronised, compressed or encrypted frames: such a file simply shows nothing. Add them when a file turns up that needs them
const tags=buf=>{
  const u=new Uint8Array(buf),N=u.length,o=['',''],s4=p=>String.fromCharCode(u[p],u[p+1],u[p+2],u[p+3]),be=(p,n=4)=>{let v=0;for(let i=0;i<n;i++)v=v*256+u[p+i];return v},
    dec=(p,n,e)=>n>0&&p<N?new TextDecoder(e).decode(u.subarray(p,min(N,p+n))):'',
    cl=s=>[...s.replace(/\0[^]*$/,'').replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').trim().normalize('NFC')].slice(0,80).join('');
  if(N>10&&s4(0).startsWith('ID3')&&u[3]>1&&u[3]<5&&!(u[5]&128)){
    const V=u[3],ss=p=>u[p]<<21|u[p+1]<<14|u[p+2]<<7|u[p+3],end=min(N,10+ss(6)),h=V<3?6:10; // (sizes with 7 bits per byte: the whole tag always, a frame only in v2.4)
    let p=10;if(V>2&&u[5]&64)p+=V>3?ss(10):be(10)+4; // an extended header first
    while(p+h<end&&u[p]){
      const id=s4(p).slice(0,V<3?3:4),n=V<3?be(p+3,3):V>3?ss(p+4):be(p+4),k=id=='TIT2'||id=='TT2'?0:id=='TPE1'||id=='TP1'?1:-1,q=p+h+1,m=min(n,end-p-h)-1;
      if(n<1)break;
      if(k>=0&&!o[k]&&!(V>2&&u[p+9]&(V>3?15:192)))o[k]=cl(dec(q,m,[,u[q]==254?'utf-16be':'utf-16le','utf-16be','utf-8'][u[q-1]]||'latin1')); // the byte before the text says how it is encoded; UTF-16 with a mark in front says which way round itself
      p+=h+n;
    }
  }else{
    const at=(p,end,id)=>{while(p+8<=end){let n=be(p),h=8;if(n==1){n=be(p+8,8);h=16}else if(!n)n=end-p;if(n<h||p+n>end)return 0;if(s4(p+4)==id)return[p+h,p+n];p+=n}return 0}, // the box called id among those between p and end: where its content starts and ends
      mv=at(0,N,'moov'),ud=mv&&at(mv[0],mv[1],'udta'),me=ud&&at(ud[0],ud[1],'meta')||mv&&at(mv[0],mv[1],'meta'),il=me&&(at(me[0]+4,me[1],'ilst')||at(me[0],me[1],'ilst')); // (meta has four more bytes before its boxes in an MP4, none in a QuickTime file)
    if(il)['\xa9nam','\xa9ART'].map((id,k)=>{const d=at(il[0],il[1],id),t=d&&at(d[0],d[1],'data');if(t)o[k]=cl(dec(t[0]+8,t[1]-t[0]-8,'utf-8'))});
  }
  return o;
};
// </song>
