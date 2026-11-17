# python3 tools/dbg.py "<query>#scene" [name] [w h] : a still or a flicker figure from the software renderer (no GPU, no window).
# Builds index.html, writes tools/out/dbg.html (the page with frames stepped by hand) and runs it in Playwright's headless shell.
#   n=N        step N frames synchronously before the picture is taken      dtm=MS   length of one step (default 100)
#   seq=time:scene:transition,...   switch scenes at these times (transition -1 = whatever the page picks)
#   lock help info                  hold the scene / show the key list / show the frame rate line
#   keys=KeyV,+KeyX,...             press these keys before the first frame (+ = with shift)
#   flk        no picture: print the mean and largest frame-to-frame change over the 12 frames after n (0..255)
#   strip=N    the picture is a contact sheet of the N frames after n, five across (for transitions: dtm=16.7)
#   lum        no picture: print the mean light (0..1, linear) of each of the 40 frames after n
#   probe=JS   no picture: print the value of a JavaScript expression after the n frames (URL-encoded; NN = n, STP = the step, frame(ms) steps on)
# plus everything the page itself understands: fake T= look= mood= max lv= ...
# Example: python3 tools/dbg.py "fake&look=0&mood=2&lock&max&n=100#34" disco 1600 900   > tools/out/disco.png
# ponytail: stills from separate runs are not comparable pixel by pixel (the noise texture is random); flk measures inside one run.
# The warm-up draws every scene once during the first ~45 frames: keep seq times after that.
import subprocess,sys,glob,os,re
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));O=R+'/tools/out';os.makedirs(O,exist_ok=True)
subprocess.run(['node','build.mjs'],cwd=R,check=True,stdout=subprocess.DEVNULL)
s=open(R+'/index.html').read()
def rep(a,b,n=-1):
    global s
    assert a in s,a   # the page changed under the hook
    s=s.replace(a,b,n)
rep("requestAnimationFrame(frame)","(NN||requestAnimationFrame(frame))")
rep("<script>","<script>var NN=+(/n=([0-9]+)/.exec(location.search)||[])[1]||0,SEQ=(/seq=([0-9.,:-]+)/.exec(location.search)||[,''])[1].split(',').filter(Boolean).map(q=>q.split(':').map(Number));\n",1)
rep("  psc=sc;\n","  psc=sc;\n  if(SEQ[0]&&t>=SEQ[0][0]){next(SEQ[0][1]);if(SEQ[0][2]>=0)tk=SEQ[0][2];ta=.5;if(tk==7)zapAt=tl/2;SEQ.shift()}\n")
rep("</script>","if(/lock/.test(location.search))lock=1;if(/help/.test(location.search))help=1;if(/info/.test(location.search))inf=1e12;(/keys=([\\w,+]*)/.exec(location.search)||[,''])[1].split(',').filter(Boolean).forEach(k=>onkeydown({code:k.replace('+',''),shiftKey:k[0]=='+'}));\nconst STP=+(/dtm=([0-9.]+)/.exec(location.search)||[,100])[1];for(let i=1;i<=NN;i++)frame(i*STP);if(/flk/.test(location.search)&&gl){let pv,sum=0,mx=0,k=0;for(let i=1;i<=12;i++){frame((NN+i)*STP);gl.bindFramebuffer(gl.FRAMEBUFFER,null);const b=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,b);if(pv){let d=0;for(let j=0;j<b.length;j+=16)d+=Math.abs(b[j]-pv[j])+Math.abs(b[j+1]-pv[j+1])+Math.abs(b[j+2]-pv[j+2]);d/=b.length/16*3;sum+=d;mx=Math.max(mx,d);k++}pv=b}document.title='FLK mean '+(sum/k).toFixed(2)+' max '+mx.toFixed(2)}const STR=+(/strip=([0-9]+)/.exec(location.search)||[])[1]||0;if(STR&&gl){const w=innerWidth/5|0,h=w*H/W|0,sc=document.createElement('canvas'),g=sc.getContext('2d');sc.width=w*5;sc.height=h*Math.ceil(STR/5);for(let i=0;i<STR;i++){frame((NN+1+i)*STP);g.drawImage(gl.canvas,i%5*w,(i/5|0)*h,w,h)}sc.style.cssText='position:fixed;left:0;top:0;z-index:99;background:#000';document.body.append(sc)}if(/lum/.test(location.search)&&gl){const L=[];for(let i=1;i<=40;i++){frame((NN+i)*STP);gl.bindFramebuffer(gl.FRAMEBUFFER,null);const b=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,b);let m=0;for(let j=0;j<b.length;j+=16)m+=.2126*(b[j]/255)**2.2+.7152*(b[j+1]/255)**2.2+.0722*(b[j+2]/255)**2.2;L.push((m/(b.length/16)).toFixed(3))}document.title='PROBE '+L.join(' ')}const PRB=/probe=([^&#]+)/.exec(location.search);if(PRB)document.title='PROBE '+eval(decodeURIComponent(PRB[1]));\n</script>")
open(O+'/dbg.html','w').write(s)
if len(sys.argv)<2:sys.exit()
q=sys.argv[1];name=(sys.argv[2:3]+['shot'])[0];w,h=(sys.argv[3:5]+['1280','720'])[:2]
q,_,sc=q.partition('#')
C=glob.glob(os.path.expanduser('~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell'))[-1]
flk='flk' in q or 'probe=' in q or 'lum' in q
try:r=subprocess.run([C,'--enable-unsafe-swiftshader','--use-angle=swiftshader','--allow-file-access-from-files','--use-mock-keychain','--password-store=basic',f'--window-size={w},{h}','--virtual-time-budget=6000','--dump-dom' if flk else f'--screenshot={O}/{name}.png',f'file://{O}/dbg.html?{q}#{sc}'],capture_output=True,text=True,timeout=170)
except subprocess.TimeoutExpired:sys.exit('timed out: fewer frames (n=) or a smaller window')
for l in r.stderr.split('\n'):
    if re.search(r'Uncaught|shader scene off|INVALID|warm-up',l):print(l.strip()[-240:])
print(re.search(r'(FLK|PROBE)[^<]*',r.stdout).group(0) if flk and re.search(r'FLK|PROBE',r.stdout) else 'no figure' if flk else f'{O}/{name}.png')
