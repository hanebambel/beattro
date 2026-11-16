// ---- real HDR (look "HDR", where the browser can do it): WebGL has no way yet to hand the browser pixels brighter than white, WebGPU has. So the finished
// frame is copied from the WebGL canvas into a WebGPU canvas lying on top of it, configured for extended range, and one small pass turns the brightest
// parts up beyond white (up to about four times as bright; a little more on every kick): neon, flares, the reactor, the moon really shine.
// Needs Chrome or Edge 129+ and a screen in HDR mode. Everywhere else the HDR look stays the "HDR style" of the post pass. Test hook: ?hdr forces it on.
let XDR=0;
if(gl&&navigator.gpu&&(/[?&]hdr/.test(location.search)||/Chrome\//.test(navigator.userAgent)&&matchMedia('(dynamic-range: high)').matches))(async()=>{ // (Safari accepts the setting but, as far as known, shows no HDR: hence Chrome only)
  try{
    const ad=await navigator.gpu.requestAdapter(),dev=await ad.requestDevice(),hc=mkc(1,1),cx=hc.getContext('webgpu');
    dev.onuncapturederror=e=>console.warn('HDR error:',e.error.message);
    cx.configure({device:dev,format:'rgba16float',toneMapping:{mode:'extended'},alphaMode:'opaque'});
    hc.style.cssText='position:absolute;inset:0;display:none';document.body.insertBefore(hc,ui);hc.onclick=go;
    const mod=dev.createShaderModule({code:`struct V{@builtin(position)p:vec4f,@location(0)u:vec2f};
@vertex fn v(@builtin(vertex_index)i:u32)->V{var o:V;let q=vec2f(f32(i&1u),f32(i>>1u))*2.;o.p=vec4f(q*2.-1.,0.,1.);o.u=vec2f(q.x,1.-q.y);return o;}
@group(0)@binding(0)var s:sampler;@group(0)@binding(1)var t:texture_2d<f32>;@group(0)@binding(2)var<uniform> g:vec4f;
@fragment fn f(i:V)->@location(0)vec4f{let c=textureSample(t,s,i.u).rgb;let b=smoothstep(.55,1.,max(c.r,max(c.g,c.b)));return vec4f(c*(1.+g.x*b*b)*g.y,1.);}`}), // the brighter a pixel, the more it is turned up (g.y: the retro tubes instead get everything turned up evenly)
      pl2=dev.createRenderPipeline({layout:'auto',vertex:{module:mod,entryPoint:'v'},fragment:{module:mod,entryPoint:'f',targets:[{format:'rgba16float'}]}}),
      sm=dev.createSampler({magFilter:'linear',minFilter:'linear'}),ub=dev.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),ga=new Float32Array(4);
    let tx,bg;
    XDR={on:0,
      show(on){XDR.on=on;hc.style.display=on?'block':'none';view.style.transform=view.style.filter='';cfl='';view=on?hc:gc},
      draw(rt){ // rt: a retro tube look. Its phosphor mask and scan lines leave most of the glass dark, so on a normal screen a white area is only a third as bright as without them
        // and bright colours hit the limit. Here the lit strips may go past white instead: retro.js draws the tube RHG times darker (so nothing is cut off), this pass turns it up again.
        if(hc.width!=W||hc.height!=H||!tx){hc.width=W;hc.height=H;tx=dev.createTexture({size:[W,H],format:'rgba8unorm',usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.RENDER_ATTACHMENT});
          bg=dev.createBindGroup({layout:pl2.getBindGroupLayout(0),entries:[{binding:0,resource:sm},{binding:1,resource:tx.createView()},{binding:2,resource:{buffer:ub}}]})}
        dev.queue.copyExternalImageToTexture({source:gc},{texture:tx},[W,H]);ga[0]=rt?0:.8+.3*kick;ga[1]=rt?RHG*RHB:1;dev.queue.writeBuffer(ub,0,ga);
        const en=dev.createCommandEncoder(),ps=en.beginRenderPass({colorAttachments:[{view:cx.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store'}]});
        ps.setPipeline(pl2);ps.setBindGroup(0,bg);ps.draw(3);ps.end();dev.queue.submit([en.finish()]);
      }};
  }catch(e){console.warn('HDR off:',e)}
})();
