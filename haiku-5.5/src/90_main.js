/* ===== 90 入口：渲染器、灯光、字体、建场景、主循环 ===== */
async function main() {
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  QM.renderer = renderer;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9c9a2);
  scene.fog = new THREE.Fog(0xd3c294, 420, 1500);
  QM.scene = scene;
  const camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.2, 4000);
  QM.camera = camera;

  // 灯光：偏暖的侧光 + 半球环境光，接近绢本的温和明暗
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x6b5a40, 0.85));
  const sun = new THREE.DirectionalLight(0xfff0d2, 0.55);
  sun.position.set(-120, 260, 160);
  scene.add(sun);

  // 字体：等字体载入后再画题签（字体已内嵌）
  try { await document.fonts.load('40px WK'); } catch (e) { /* 失败则用楷体回退 */ }

  initTex();
  initMat();
  buildScene();
  flushStatic(scene);
  QM.labelGroup = new THREE.Group();
  scene.add(QM.labelGroup);
  buildLabels(QM.labelGroup);
  buildRigs();

  resizeNav();
  buildNavLabels();
  bindInput(canvas);
  bindNav();
  bindPanel();
  QM.labelGroup.visible = true;

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    resizeNav();
  };
  window.addEventListener('resize', onResize);
  onResize();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stepCam(dt);
    updateMoving(dt);
    updateUI();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  QM.ready = true;
}

try {
  main();
} catch (err) {
  console.error(err);
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = '页面初始化失败：' + err.message;
}
