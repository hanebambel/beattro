// ---- WebGL2 fragment shader scenes: rendered into a small render target at a pixel budget, then drawn (enlarged) into the frame ----
const gc=mkc(1,1),gl=gc.getContext('webgl2');
const cmp=(ty,src)=>{const o=gl.createShader(ty);gl.shaderSource(o,'#version 300 es\n'+src);gl.compileShader(o);return o};
const VS=gl&&cmp(gl.VERTEX_SHADER,'void main(){gl_Position=vec4(vec2(gl_VertexID%2,gl_VertexID/2)*4.-1.,0,1);}');
// uniforms: r resolution, t time, k kick, l bass level, h hue, z transition zoom, ro camera roll, m mode, p race position, B spectrum, T texture
const HDR=`precision highp float;
uniform vec2 r;uniform float t,k,l,h,z,ro,m,p,B[32];uniform sampler2D T;out vec4 o;
mat2 R(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 pal(float x){return .5+.5*cos(6.283*(x+vec3(0,.33,.67)));}
#define UV vec2 u=(gl_FragCoord.xy*2.-r)/r.y
`;
function shader(src,px=8e6,keep){ // keep: return the draw function instead of adding it as a scene; 2: that function only renders, into a target of its own, and returns it (for a scene whose second pass, at the same pixel budget, reads it)
  if(!gl)return;
  const pg=gl.createProgram(),fs=cmp(gl.FRAGMENT_SHADER,HDR+src);
  gl.attachShader(pg,VS);gl.attachShader(pg,fs);gl.linkProgram(pg);
  if(!gl.getProgramParameter(pg,gl.LINK_STATUS))return console.warn('shader scene off:',gl.getProgramInfoLog(pg),gl.getShaderInfoLog(fs));
  const L={},U=n=>L[n]??=gl.getUniformLocation(pg,n);
  const draw=()=>{
    // ponytail: fixed pixel budget per shader; make it adaptive to frame time if machines differ too much
    const gs=min(1,Math.sqrt(px*QS/W/H)),w=max(1,W*gs|0),h=max(1,H*gs|0),T=keep>1?(x.lo(w,h),x.lo(w,h,0,'a')):x.lo(w,h); // (2: the second pass's target is asked for first, so that making it cannot push this one out of the pool)
    gl.bindFramebuffer(gl.FRAMEBUFFER,T.fb);gl.viewport(0,0,w,h);gl.useProgram(pg); // (what GX has collected for the frame so far stays collected: the frame is then drawn in one go)
    gl.uniform2f(U('r'),w,h);gl.uniform1f(U('t'),t);gl.uniform1f(U('k'),kick);gl.uniform1f(U('l'),min(1,lvl));
    gl.uniform1f(U('h'),hue/360);gl.uniform1f(U('z'),ts);gl.uniform1f(U('ro'),roll);gl.uniform1f(U('m'),gm);gl.uniform1f(U('p'),gp);gl.uniform1fv(U('B'),B);gl.uniform1i(U('S'),2);gl.uniform1i(U('X'),3);
    gl.drawArrays(gl.TRIANGLES,0,3);if(keep>1)return T;
    // zoom + roll happen in the shader; drawn opaque (crossfaded by alpha) so it stays crisp, no trails
    x.setTransform(XS,0,0,XS,0,0);x.globalCompositeOperation='source-over';x.drawImage(T,0,0,W,H); // XS: .5 while drawing into the half-size target of a transition
  };
  if(keep)return draw;
  SC.push(draw);
}
if(gl){
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,TC);gl.generateMipmap(gl.TEXTURE_2D);
}
