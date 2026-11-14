Q.fail=e=>{document.getElementById('loading').style.display='none';document.getElementById('error').hidden=false;document.getElementById('error-detail').textContent=e.message||String(e);console.error(e);};
window.addEventListener('error',e=>{if(!Q.ready)Q.fail(e.error||e.message);});
Q.start=async()=>{
 try{
  await document.fonts.ready;Q.initView();await new Promise(r=>setTimeout(r,40));Q.buildWorld();Q.updateCamera();Q.updateActors(0,Q.cam);Q.renderer.render(Q.scene,Q.camera);Q.ready=true;
  const load=document.getElementById('loading');load.style.opacity=0;setTimeout(()=>load.remove(),900);
  const clock=new T.Clock();let elapsed=0,last=0,frames=0,frameMs=0;Q.metrics={};
  const loop=now=>{requestAnimationFrame(loop);if(document.hidden){clock.getDelta();return;}if(innerWidth<700&&now-last<30)return;last=now;const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
   Q.updateCamera();Q.updateActors(elapsed,Q.cam);Q.waterMaterial.uniforms.time.value=elapsed;
   for(const f of Q.flags||[]){f.g.rotation.z=Math.sin(elapsed*1.2+f.phase)*.045;f.s.rotation.y=Math.sin(elapsed*1.6+f.phase)*.17;}
   for(const p of Q.smokes)for(let i=0;i<p.sprites.length;i++){const a=(elapsed*.18+i/5+p.phase)%1,s=p.sprites[i];s.position.set(p.x+Math.sin(a*3+p.phase)*a*2,p.y+a*8,p.z+a*1.8);s.scale.setScalar(1+a*4);}
   Q.renderer.render(Q.scene,Q.camera);frames++;frameMs+=dt;if(frameMs>1){Q.metrics={fps:Math.round(frames/frameMs),drawCalls:Q.renderer.info.render.calls,triangles:Q.renderer.info.render.triangles,people:Q.counts.people,animals:Q.counts.animals,boats:Q.counts.boats,buildings:Q.counts.buildings};frames=0;frameMs=0;}
  };requestAnimationFrame(loop);
 }catch(e){Q.fail(e);}
};Q.start();
