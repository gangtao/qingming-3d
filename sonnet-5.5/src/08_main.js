/* 08_main.js — 组装场景并运行 */
async function main(){
  const status=document.getElementById('loading');
  try{await document.fonts.load('30px WenKai',document.documentElement.textContent||'清明上河图')}catch(e){}
  makeMaterials();
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);
  document.getElementById('stage').appendChild(renderer.domElement);
  const scene=new THREE.Scene();const fogC=new THREE.Color(LIGHT.fog);scene.background=fogC;scene.fog=new THREE.Fog(fogC,100,900);
  const camera=new THREE.PerspectiveCamera(45.8,innerWidth/innerHeight,0.3,5000);
  const hemi=new THREE.HemisphereLight(new THREE.Color(...LIGHT.sky),new THREE.Color(...LIGHT.gnd),1);scene.add(hemi);
  const sun=new THREE.DirectionalLight(new THREE.Color(...LIGHT.sunCol),1);sun.position.copy(SUN).multiplyScalar(100);scene.add(sun);
  await new Promise(r=>setTimeout(r,30));
  const T0=performance.now();
  sceneCountry();sceneBuildings();sceneRiver();sceneBridge();sceneCity();
  scene.add(buildTerrain());scene.add(buildWater());
  const add=(layer,mat,margin)=>layer.meshes(mat,margin).forEach(m=>scene.add(m));
  add(GB.gen,MAT.gen);add(GB.roof,MAT.roof);add(GB.thatch,MAT.thatch);add(GB.brick,MAT.brick);add(GB.sign,MAT.sign);add(GB.ag,MAT.ag,45);
  const bz=BRIDGE;MAT.ag.uniforms.uB1.value.set(bz.x,bz.z,Math.sin(bz.ry),Math.cos(bz.ry));MAT.ag.uniforms.uB2.value.set(bz.sp,bz.H,bz.base,10);
  window.__stats=Object.assign({},STAT,{buildMs:Math.round(performance.now()-T0),verts:{gen:GB.gen.count(),roof:GB.roof.count(),thatch:GB.thatch.count(),brick:GB.brick.count(),ag:GB.ag.count()}});
  initCamera(renderer,camera,renderer.domElement);
  const ui=initUI(camera,renderer);
  window.__cam=CAM;window.__scene=scene;window.__renderer=renderer;window.__camera=camera;
  status.classList.add('done');setTimeout(()=>status.remove(),900);
  addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
  let last=performance.now(),T=0;
  function frame(now){
    const dt=Math.min(0.05,(now-last)/1000);last=now;T+=dt;
    MAT.ag.uniforms.uTime.value=T;TEX.water.offset.x+=dt*0.012;TEX.water.offset.y+=dt*0.004;
    CAM.tick(dt);
    scene.fog.near=CAM.dist*1.1+60;scene.fog.far=CAM.dist*5+420;
    ui();renderer.render(scene,camera);window.__frames=(window.__frames||0)+1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
main().catch(e=>{console.error(e);const s=document.getElementById('loading');if(s)s.textContent='加载失败：'+e.message});
