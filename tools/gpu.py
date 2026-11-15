# The page in real Chromium on the real graphics card (Metal), headless. Two measurements:
#   python3 tools/gpu.py run "<query>" seconds [w h]   plays with vsync and prints what the page logs once a second (?bench):
#        frame rate, resolution, quality level, scene, worst frame, script time, TRn while transition n runs. Also every GL or script error.
#        Example: python3 tools/gpu.py run "mood=2" 60
#   python3 tools/gpu.py time scene ["<query>"]        renders 3 x 100 frames of one scene back to back and waits for the card to finish:
#        ms per frame (script + graphics card) at 4K. Example: python3 tools/gpu.py time 34 "look=0&mood=2"
# With tools/out/map.bin (node test.mjs track.f32 tools/out/map.bin) the page gets that song's map; DUR= its length in seconds (default 308.85).
# ponytail: the software renderer (dbg.py) does not report GL errors that Metal does, so new shader code needs one run here.
import subprocess,sys,glob,os,re,tempfile,threading,shutil
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));O=R+'/tools/out';os.makedirs(O,exist_ok=True)
C=glob.glob(os.path.expanduser('~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/*'))[-1]
subprocess.run(['node','build.mjs'],cwd=R,check=True,stdout=subprocess.DEVNULL)
mp=f"&dur={os.environ.get('DUR','308.85')}&map=file://{O}/map.bin" if os.path.exists(O+'/map.bin') else ''
mode,a=sys.argv[1],sys.argv[2:]
if mode=='run':
    sec=int(a[1]);w,h=(a[2:4]+['2880','1620'])[:2];url=f"file://{R}/index.html?fake&bench{mp}&{a[0]}";pat=r'BENCH[ HDR]* ([^"]*)'
else:
    hook="""{lock=1;requestAnimationFrame=()=>{};setTimeout(()=>{const px=new Uint8Array(4),fin=()=>{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px)};
for(let i=0;i<80;i++)frame(1e5+i*16.7);fin();const r=[];for(let k=0;k<3;k++){const t0=performance.now();for(let i=0;i<100;i++)frame(2e5+k*2e3+i*16.7);fin();r.push(((performance.now()-t0)/100).toFixed(2))}
console.log('BENCH2 '+r.join(' / ')+' ms per frame at '+W+'x'+H)},400)}
"""
    open(O+'/gt.html','w').write(open(R+'/index.html').read().replace('</script>',hook+'</script>'))
    sec=60;w,h='2560','1440';url=f"file://{O}/gt.html?fake{mp}&{(a[1:2]+['look=0'])[0]}&T=100#{a[0]}";pat=r'BENCH2 ([^"]*)'
d=tempfile.mkdtemp(dir=O) # a throw-away profile; with the two keychain switches the browser never asks for the keychain
p=subprocess.Popen([C,'--headless=new','--use-mock-keychain','--password-store=basic','--use-angle=metal','--enable-gpu','--allow-file-access-from-files','--enable-logging=stderr',f'--user-data-dir={d}',f'--window-size={w},{h}','--force-device-scale-factor=1.5',url],stderr=subprocess.PIPE,stdout=subprocess.DEVNULL,text=True)
threading.Timer(sec,p.kill).start() # (this browser does not exit by itself)
try:
    for l in p.stderr:
        m=re.search(pat,l)
        if m:
            print(m.group(1),flush=True)
            if mode!='run':break
        elif re.search(r'Uncaught|shader scene off|INVALID|HDR off|HDR error',l):print(l.strip()[-260:],flush=True)
finally:p.kill();p.wait();shutil.rmtree(d,ignore_errors=True)
