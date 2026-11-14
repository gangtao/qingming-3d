import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createActorSystem } from './actors';
import { ArchContext, ChimneyEmitter, SwayingBanner } from './architecture';
import { createBoatSystem } from './boats';
import { ScrollCameraController } from './camera';
import { createMaterialLibrary } from './materials';
import { PrimitiveCache, StaticBatcher } from './primitives';
import { buildAllSections } from './sections';
import { createQingmingUI } from './ui';
import { buildTerrainAndWater } from './world';

export interface QingmingEngineHandle {
  dispose: () => void;
  getStats: () => {
    humans: number;
    animals: number;
    carts: number;
    boats: number;
    drawCalls: number;
  };
}

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export function createQingmingEngine(mountEl: HTMLElement): QingmingEngineHandle {
  const isSoftwareGl = detectSoftwareWebGL();
  const width = mountEl.clientWidth || window.innerWidth;
  const height = mountEl.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  mountEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const silkColor = 0xc2ab83;
  scene.background = new THREE.Color(silkColor);
  scene.fog = new THREE.FogExp2(silkColor, 0.0046);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.25, 420);

  // Studio environment reflections (RoomEnvironment + PMREMGenerator)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();

  // Warm key sunlight + cool-warm hemisphere fill + soft rim light
  const hemiLight = new THREE.HemisphereLight(0xefe5cf, 0x7c674a, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff1d4, 1.85);
  keyLight.position.set(28, 44, 32);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 140;
  const shadowD = 48;
  keyLight.shadow.camera.left = -shadowD;
  keyLight.shadow.camera.right = shadowD;
  keyLight.shadow.camera.top = shadowD;
  keyLight.shadow.camera.bottom = -shadowD;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.03;
  scene.add(keyLight);
  scene.add(keyLight.target);

  const rimLight = new THREE.DirectionalLight(0xd9ceb8, 0.45);
  rimLight.position.set(-20, 18, -36);
  scene.add(rimLight);

  // Build Materials, Terrain, Architecture, Boats, and Animated Actors
  const mats = createMaterialLibrary(renderer);
  const prims = new PrimitiveCache();
  const batcher = new StaticBatcher();

  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const terrainRes = buildTerrainAndWater(worldGroup, mats);

  const banners: SwayingBanner[] = [];
  const chimneys: ChimneyEmitter[] = [];
  const archDisposables: THREE.BufferGeometry[] = [];

  const archCtx: ArchContext = {
    batcher,
    mats,
    prims,
    dynamicParent: worldGroup,
    banners,
    chimneys,
    disposables: archDisposables,
  };

  const pop = buildAllSections(archCtx);
  const staticMeshes = batcher.flush(worldGroup);
  const boatSys = createBoatSystem(worldGroup, mats, pop.boats);
  const actorSys = createActorSystem(
    worldGroup,
    mats,
    pop.humans,
    pop.animals,
    pop.carts,
    chimneys
  );

  // Camera & UI
  let ui: ReturnType<typeof createQingmingUI>;
  const controller = new ScrollCameraController(camera, renderer.domElement, () => {
    ui?.showFirstInteractionFade();
  });
  ui = createQingmingUI(mountEl, controller, pop.landmarks);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // Handle resize & WebGL context loss
  const onResize = () => {
    const w = mountEl.clientWidth || window.innerWidth;
    const h = mountEl.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  let contextLost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    contextLost = true;
  };
  const onRestored = () => {
    contextLost = false;
  };
  renderer.domElement.addEventListener('webglcontextlost', onLost);
  renderer.domElement.addEventListener('webglcontextrestored', onRestored);

  // Animation loop with Software-WebGL afterDraw pacing
  let disposed = false;
  let rafId = 0;
  let timerId = 0;
  let lastTime = performance.now();
  let elapsed = 0;

  const afterDraw = (cb: () => void) => {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      timerId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        timerId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        timerId = window.setTimeout(cb, 80);
      }
    };
    timerId = window.setTimeout(poll, 5);
  };

  const tick = () => {
    if (disposed) return;
    const now = performance.now();
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    elapsed += dt;

    if (!contextLost) {
      controller.update(dt, isSoftwareGl);

      // Keep tight shadow frustum centered around active scroll target
      keyLight.target.position.set(controller.current.targetX, 0, controller.current.targetZ);
      keyLight.position.set(
        controller.current.targetX + 28,
        44,
        controller.current.targetZ + 32
      );

      mats.updateWaterTime(elapsed);
      mats.updateWindTime(elapsed);

      for (const b of banners) {
        b.mesh.rotation.z = b.baseRotZ + Math.sin(elapsed * 2.3 + b.phase) * 0.085;
      }

      boatSys.update(elapsed);
      actorSys.update(elapsed, dt);
      ui.update(camera, controller);
      renderer.render(scene, camera);
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  };

  if (isSoftwareGl) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = requestAnimationFrame(tick);
  }

  return {
    getStats: () => ({
      humans: actorSys.humanCount,
      animals: actorSys.animalCount,
      carts: actorSys.cartCount,
      boats: boatSys.boats.length,
      drawCalls: renderer.info.render.calls,
    }),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('webglcontextlost', onLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onRestored);
      controller.dispose();
      ui.dispose();
      boatSys.dispose();
      actorSys.dispose();
      terrainRes.disposables.forEach((g) => g.dispose());
      archDisposables.forEach((g) => g.dispose());
      staticMeshes.forEach((m) => m.geometry.dispose());
      prims.dispose();
      mats.dispose();
      envTex.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
