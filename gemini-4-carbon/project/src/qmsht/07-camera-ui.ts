import * as THREE from 'three';
import { SCROLL_THUMB_DATA_URI, WENKAI_FONT_CSS } from './00-embedded-assets';
import {
  buildSilkStudioEnvironment,
  createMaterialLibrary,
  SILK_PALETTE,
} from './01-primitives';
import {
  buildWorldTerrainAndWater,
  groundHeightAt,
  uToWorldX,
  walkableHeightAt,
  WORLD_BOUNDS,
  worldXToU,
} from './02-world';
import {
  populateFullScrollScene,
  SCENE_PLAQUES,
  SECTION_ZONES,
} from './06-scenes';

/**
 * 模块七：镜头控制、三维渲染循环与中式绢本界面（07-camera-ui.ts）
 * - 完全手动浏览（无自动播放）：左键平移（前后左右）、右键或 Shift+拖动旋转俯仰、滚轮缩放、
 *   触屏单指平移与双指捏合缩放/旋转/俯仰、方向键与加减号控制。
 * - 近看贴近街面平视百态细节，远看长焦俯瞰散点长卷，观感对比鲜明。
 * - 底部通栏原画缩略图范围导航条 + 右下角可折叠“视角”面板 + 左上角动态段落说明 + 右上角竖排“清明上河图” + 首次操作后淡出提示。
 */

const INITIAL_VIEW = {
  targetX: 3.5, // 默认停驻于全卷核心“汴河虹桥”处
  targetZ: 2.2,
  zoomT: 0.46, // 适中偏近视角（约 34m），既见虹桥全景又见桥下大船与桥上百态
  pitchDeg: 31,
  yawDeg: 0,
};

/**
 * 根据长卷横向坐标给出推荐的主视觉中心 Z，供点击底部缩略图跳转时精准对齐画心焦点
 */
function recommendedCenterZForX(x: number): number {
  if (x > 165) return 2.8; // 郊野农舍与小桥驴队
  if (x > 118) return 7.4; // 古柳踏青轿队
  if (x > 42) return 3.6; // 汴河东段码头漕船与粮仓
  if (x > -12) return 1.8; // 虹桥与过桥大船
  if (x > -82) return 4.8; // 十千脚店与西北河湾
  if (x > -142) return 7.2; // 城外大道与护城河桥
  if (x > -162) return 5.4; // 城门东口与穿门双峰驼队
  return 4.6; // 城内大街、孙羊正店与十字街口
}

/**
 * 相机防穿模安全净空高度：当镜头掠过城门砖台、城墙或高大二层酒楼屋顶上方时，自动柔和托举镜头高度，绝不卡入砖墙内部
 */
function structureClearanceHeightAt(x: number, z: number): number {
  let clearY = -Infinity;

  // 1. 城门城楼与砖砌墩台核心区（X ≈ -153.5, Z ≈ 4.5）
  const dxGate = x - -153.5;
  const dzGate = z - 4.5;
  if (Math.abs(dxGate) < 8.2 && Math.abs(dzGate) < 10.5) {
    clearY = Math.max(clearY, 15.2);
  } else if (Math.abs(dxGate) < 6.5 && Math.abs(dzGate) < 42.0) {
    // 南北夯土旧城垣净空
    clearY = Math.max(clearY, 5.4);
  }

  // 2. 主要二层大酒楼屋脊安全包络（十千脚店、临汴酒楼、孙羊正店、久住王员外家、沉檀拣香）
  const tallRoofs: Array<[number, number, number, number, number]> = [
    [-24.5, 12.2, 6.2, 4.4, 9.2],
    [-37.5, 10.2, 6.4, 4.5, 9.2],
    [-185.0, -4.8, 7.2, 4.8, 9.6],
    [-203.0, -4.4, 6.4, 4.4, 9.0],
    [-183.0, 14.2, 6.0, 4.2, 8.8],
  ];
  for (let i = 0; i < tallRoofs.length; i++) {
    const [rx, rz, hw, hd, topH] = tallRoofs[i];
    if (Math.abs(x - rx) < hw && Math.abs(z - rz) < hd) {
      clearY = Math.max(clearY, topH);
    }
  }
  return clearY;
}

function injectAppStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = `
${WENKAI_FONT_CSS}

.qmsht-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #cbb793;
  font-family: 'QmshtKaiti', 'LXGW WenKai', 'KaiTi', 'STKaiti', 'DFKai-SB', serif;
  color: #2c2117;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.qmsht-canvas-wrap {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
}
.qmsht-canvas-wrap.is-dragging {
  cursor: grabbing;
}

/* 左上角段落标题与说明 */
.qmsht-top-left {
  position: absolute;
  top: 18px;
  left: 20px;
  z-index: 20;
  max-width: min(410px, calc(100vw - 110px));
  padding: 12px 16px;
  background: rgba(243, 234, 215, 0.90);
  border: 1px solid rgba(84, 62, 40, 0.30);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(42, 30, 18, 0.12);
  pointer-events: none;
}
.qmsht-tl-title {
  font-size: 20px;
  font-weight: 700;
  color: #2a1e13;
  letter-spacing: 0.06em;
  line-height: 1.3;
  margin-bottom: 5px;
}
.qmsht-tl-desc {
  font-size: 14px;
  font-weight: 400;
  color: #4a3826;
  line-height: 1.58;
  letter-spacing: 0.02em;
}

/* 右上角竖排题名“清明上河图” */
.qmsht-top-right {
  position: absolute;
  top: 18px;
  right: 20px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px 12px;
  background: rgba(243, 234, 215, 0.90);
  border: 1px solid rgba(84, 62, 40, 0.32);
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(42, 30, 18, 0.12);
  pointer-events: none;
}
.qmsht-tr-main {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #261b11;
  line-height: 1.15;
}
.qmsht-tr-seal {
  margin-top: 8px;
  padding: 3px 4px;
  border: 1.5px solid #8f3626;
  color: #8f3626;
  font-size: 11px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 0.08em;
  line-height: 1.1;
  border-radius: 2px;
}

/* 首次操作前提示条 */
.qmsht-hint {
  position: absolute;
  left: 50%;
  bottom: 78px;
  transform: translateX(-50%);
  z-index: 20;
  padding: 8px 18px;
  background: rgba(44, 33, 22, 0.84);
  color: #f3ead7;
  border: 1px solid rgba(218, 198, 162, 0.35);
  border-radius: 4px;
  font-size: 14px;
  letter-spacing: 0.04em;
  white-space: nowrap;
  max-width: 92vw;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.qmsht-hint.is-hidden {
  opacity: 0;
}

/* 右下角可折叠“视角”控制面板 */
.qmsht-view-panel {
  position: absolute;
  right: 16px;
  bottom: 72px;
  z-index: 25;
  width: 236px;
  background: rgba(243, 234, 215, 0.94);
  border: 1px solid rgba(84, 62, 40, 0.34);
  border-radius: 4px;
  box-shadow: 0 6px 20px rgba(38, 27, 16, 0.16);
}
.qmsht-view-panel.is-collapsed {
  width: auto;
}
.qmsht-vp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 8px 14px;
  background: transparent;
  border: none;
  color: #2a1e13;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
}
.qmsht-vp-header:hover {
  background: rgba(120, 92, 58, 0.08);
}
.qmsht-vp-body {
  padding: 6px 14px 12px;
  border-top: 1px solid rgba(84, 62, 40, 0.16);
}
.qmsht-view-panel.is-collapsed .qmsht-vp-body {
  display: none;
}
.qmsht-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #3e2e1e;
}
.qmsht-slider-label {
  width: 32px;
  flex-shrink: 0;
  font-weight: 700;
}
.qmsht-slider-input {
  flex: 1;
  height: 4px;
  accent-color: #7c412f;
  cursor: pointer;
}
.qmsht-slider-val {
  width: 38px;
  text-align: right;
  font-size: 12px;
  color: #5b4631;
  font-variant-numeric: tabular-nums;
}
.qmsht-vp-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.qmsht-btn {
  flex: 1;
  padding: 6px 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #2f2216;
  background: rgba(224, 209, 180, 0.72);
  border: 1px solid rgba(84, 62, 40, 0.34);
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.qmsht-btn:hover {
  background: rgba(206, 187, 152, 0.92);
}
.qmsht-btn.is-active {
  background: #783f2e;
  border-color: #613022;
  color: #f6efe0;
}

/* 屏幕底部通栏全卷缩略图范围选择条 */
.qmsht-navbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 58px;
  z-index: 30;
  background: #2b2117;
  border-top: 2px solid #6b5237;
  cursor: pointer;
  overflow: hidden;
}
.qmsht-nav-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  filter: sepia(0.08) contrast(1.04);
}
.qmsht-nav-mask-left,
.qmsht-nav-mask-right {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(30, 22, 14, 0.44);
  pointer-events: none;
}
.qmsht-nav-mask-left {
  left: 0;
}
.qmsht-nav-mask-right {
  right: 0;
}
.qmsht-nav-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 1px;
  background: rgba(244, 232, 206, 0.52);
  pointer-events: none;
}
.qmsht-nav-sec-label {
  position: absolute;
  top: 4px;
  z-index: 4;
  transform: translateX(-50%);
  padding: 1px 7px;
  background: rgba(34, 24, 15, 0.82);
  border: 1px solid rgba(224, 204, 166, 0.28);
  color: #f3e8ce;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 2px;
  pointer-events: none;
  white-space: nowrap;
}
.qmsht-nav-viewport {
  position: absolute;
  top: 1px;
  bottom: 1px;
  z-index: 2;
  border: 2px solid #e9d7b0;
  box-shadow: 0 0 0 1px rgba(42, 28, 16, 0.85), inset 0 0 8px rgba(255, 240, 205, 0.25);
  background: rgba(255, 245, 220, 0.08);
  cursor: ew-resize;
  pointer-events: none;
}
.qmsht-nav-viewport::before,
.qmsht-nav-viewport::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 3px;
  height: 16px;
  transform: translateY(-50%);
  background: #e9d7b0;
  border-radius: 1px;
}
.qmsht-nav-viewport::before {
  left: 2px;
}
.qmsht-nav-viewport::after {
  right: 2px;
}

/* 三维空间投影场景与店铺“题签”浮标 */
.qmsht-plaques-layer {
  position: absolute;
  inset: 0;
  z-index: 15;
  pointer-events: none;
  overflow: hidden;
}
.qmsht-plaque {
  position: absolute;
  left: 0;
  top: 0;
  padding: 4px 6px;
  writing-mode: vertical-rl;
  text-orientation: upright;
  background: rgba(244, 235, 215, 0.92);
  color: #2b1f14;
  border: 1px solid rgba(92, 66, 42, 0.55);
  border-top: 3px solid #7e3e2d;
  border-radius: 2px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  line-height: 1.15;
  box-shadow: 0 2px 8px rgba(35, 24, 14, 0.18);
  will-change: transform, opacity;
}
.qmsht-plaque.is-major {
  background: rgba(247, 239, 221, 0.96);
  border-top-color: #8f3423;
  font-size: 14px;
}

@media (max-width: 767px) {
  .qmsht-top-left {
    top: 10px;
    left: 10px;
    padding: 8px 11px;
    max-width: calc(100vw - 88px);
  }
  .qmsht-tl-title {
    font-size: 16px;
    margin-bottom: 2px;
  }
  .qmsht-tl-desc {
    font-size: 12px;
    line-height: 1.45;
  }
  .qmsht-top-right {
    top: 10px;
    right: 10px;
    padding: 9px 7px 8px;
  }
  .qmsht-tr-main {
    font-size: 20px;
  }
  .qmsht-navbar {
    height: 48px;
  }
  .qmsht-view-panel {
    right: 10px;
    bottom: 58px;
  }
  .qmsht-hint {
    left: 10px;
    right: 98px;
    bottom: 58px;
    transform: none;
    max-width: none;
    text-align: center;
    font-size: 12px;
    padding: 7px 10px;
  }
}
`;
  document.head.appendChild(style);
  return style;
}

export function mountQingmingScrollApp(container: HTMLElement): () => void {
  const styleEl = injectAppStyles();

  // 构建语义化中式界面结构
  const rootEl = document.createElement('div');
  rootEl.className = 'qmsht-root';
  container.appendChild(rootEl);

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'qmsht-canvas-wrap';
  rootEl.appendChild(canvasWrap);

  const plaquesLayer = document.createElement('div');
  plaquesLayer.className = 'qmsht-plaques-layer';
  rootEl.appendChild(plaquesLayer);

  // 左上角当前段落说明
  const topLeft = document.createElement('div');
  topLeft.className = 'qmsht-top-left';
  const tlTitle = document.createElement('div');
  tlTitle.className = 'qmsht-tl-title';
  const tlDesc = document.createElement('div');
  tlDesc.className = 'qmsht-tl-desc';
  topLeft.append(tlTitle, tlDesc);
  rootEl.appendChild(topLeft);

  // 右上角竖排标题“清明上河图”
  const topRight = document.createElement('div');
  topRight.className = 'qmsht-top-right';
  topRight.innerHTML = `<div class="qmsht-tr-main">清明上河图</div><div class="qmsht-tr-seal">张择端</div>`;
  rootEl.appendChild(topRight);

  // 操作提示（首次交互后淡出）
  const isTouchPrimary = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hintEl = document.createElement('div');
  hintEl.className = 'qmsht-hint';
  hintEl.textContent = isTouchPrimary
    ? '单指拖动漫游 · 双指捏合缩放与旋转俯仰 · 点击底部长卷跳转'
    : '左键拖动漫游 · 右键或 Shift 拖动旋转俯仰 · 滚轮缩放 · 点击底部长卷跳转';
  rootEl.appendChild(hintEl);

  let hintDismissed = false;
  const dismissHint = () => {
    if (!hintDismissed) {
      hintDismissed = true;
      hintEl.classList.add('is-hidden');
    }
  };

  // 右下角可折叠“视角”控制面板（窄屏默认收起）
  let panelCollapsed = window.innerWidth < 768;
  let showPlaques = true;

  const viewPanel = document.createElement('div');
  viewPanel.className = `qmsht-view-panel${panelCollapsed ? ' is-collapsed' : ''}`;
  viewPanel.innerHTML = `
    <button type="button" class="qmsht-vp-header" aria-expanded="${!panelCollapsed}">
      <span>视角</span>
      <span class="qmsht-vp-arrow">${panelCollapsed ? '▴' : '▾'}</span>
    </button>
    <div class="qmsht-vp-body">
      <label class="qmsht-slider-row">
        <span class="qmsht-slider-label">缩放</span>
        <input type="range" min="0" max="100" step="1" class="qmsht-slider-input" data-ctrl="zoom" />
        <span class="qmsht-slider-val" data-val="zoom">44%</span>
      </label>
      <label class="qmsht-slider-row">
        <span class="qmsht-slider-label">俯仰</span>
        <input type="range" min="10" max="72" step="1" class="qmsht-slider-input" data-ctrl="pitch" />
        <span class="qmsht-slider-val" data-val="pitch">31°</span>
      </label>
      <label class="qmsht-slider-row">
        <span class="qmsht-slider-label">旋转</span>
        <input type="range" min="-180" max="180" step="1" class="qmsht-slider-input" data-ctrl="yaw" />
        <span class="qmsht-slider-val" data-val="yaw">0°</span>
      </label>
      <div class="qmsht-vp-actions">
        <button type="button" class="qmsht-btn is-active" data-btn="plaques">题签</button>
        <button type="button" class="qmsht-btn" data-btn="reset">复位</button>
      </div>
    </div>
  `;
  rootEl.appendChild(viewPanel);

  // 底部通栏全卷缩略图导航条
  // 原画左至右依次为：城门街市 (0%..34%) | 汴河虹桥 (34%..74%) | 郊野春色 (74%..100%)
  const navBar = document.createElement('div');
  navBar.className = 'qmsht-navbar';
  navBar.innerHTML = `
    <img class="qmsht-nav-img" src="${SCROLL_THUMB_DATA_URI}" alt="清明上河图全卷导览" draggable="false" />
    <div class="qmsht-nav-mask-left"></div>
    <div class="qmsht-nav-mask-right"></div>
    <div class="qmsht-nav-divider" style="left: 34%;"></div>
    <div class="qmsht-nav-divider" style="left: 74%;"></div>
    <div class="qmsht-nav-sec-label" style="left: 17%;">城门街市</div>
    <div class="qmsht-nav-sec-label" style="left: 54%;">汴河虹桥</div>
    <div class="qmsht-nav-sec-label" style="left: 87%;">郊野春色</div>
    <div class="qmsht-nav-viewport"></div>
  `;
  rootEl.appendChild(navBar);

  const navMaskLeft = navBar.querySelector('.qmsht-nav-mask-left') as HTMLDivElement;
  const navMaskRight = navBar.querySelector('.qmsht-nav-mask-right') as HTMLDivElement;
  const navViewport = navBar.querySelector('.qmsht-nav-viewport') as HTMLDivElement;

  // 创建题签 DOM 元素
  const plaqueEls = SCENE_PLAQUES.map((p) => {
    const el = document.createElement('div');
    el.className = `qmsht-plaque${p.major ? ' is-major' : ''}`;
    el.textContent = p.label;
    plaquesLayer.appendChild(el);
    return { spec: p, el };
  });

  // =========================================================================
  // 初始化 Three.js 渲染器（带软件 WebGL 检测与绢本电影级色调映射）
  // =========================================================================
  const isSoftwareGl = (() => {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  })();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  if ('outputColorSpace' in renderer) {
    (renderer as unknown as { outputColorSpace: string }).outputColorSpace = THREE.SRGBColorSpace;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasWrap.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SILK_PALETTE.skySilk);
  const sceneFog = new THREE.FogExp2(SILK_PALETTE.fogSilk, 0.0042);
  scene.fog = sceneFog;

  // 摄影棚环境反射贴图
  const envTex = buildSilkStudioEnvironment(renderer);
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(
    34,
    window.innerWidth / window.innerHeight,
    0.22,
    520,
  );

  // 三点暖冷互补光照（晨间暖阳主光 + 天光绢色半球补光 + 柔和逆光轮廓）
  const hemiLight = new THREE.HemisphereLight(0xf3e7cf, 0x897252, 0.88);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xfff0d2, 1.55);
  keyLight.castShadow = !isSoftwareGl;
  if (!isSoftwareGl) {
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 220;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.025;
  }
  scene.add(keyLight);
  scene.add(keyLight.target);

  const rimLight = new THREE.DirectionalLight(0xdce2df, 0.42);
  rimLight.position.set(-45, 32, -55);
  scene.add(rimLight);

  // 构建全卷材质、地形水面与三大段市井百态
  const matLib = createMaterialLibrary(renderer);
  buildWorldTerrainAndWater(scene, matLib.uTime);
  const { crowd, vessels } = populateFullScrollScene(scene, matLib);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // =========================================================================
  // 手动相机状态与平滑阻尼参数
  // =========================================================================
  const camTarget = { ...INITIAL_VIEW };
  const camCurrent = { ...INITIAL_VIEW };

  const clampCameraTargets = () => {
    camTarget.targetX = THREE.MathUtils.clamp(
      camTarget.targetX,
      WORLD_BOUNDS.scrollMinX,
      WORLD_BOUNDS.scrollMaxX,
    );
    camTarget.targetZ = THREE.MathUtils.clamp(camTarget.targetZ, -22, 22);
    camTarget.zoomT = THREE.MathUtils.clamp(camTarget.zoomT, 0, 1);
    // 拉近到街面时允许更低平视俯仰角（10°），拉远鸟瞰时最低 18°
    const minPitch = THREE.MathUtils.lerp(18, 9, camTarget.zoomT);
    camTarget.pitchDeg = THREE.MathUtils.clamp(camTarget.pitchDeg, minPitch, 72);
    // 旋转角保持在 [-180, 180]
    if (camTarget.yawDeg > 180) camTarget.yawDeg -= 360;
    if (camTarget.yawDeg < -180) camTarget.yawDeg += 360;
  };

  // 获取当前镜头距离（156m 恢弘长卷全景俯瞰 <-> 5.6m 贴近街面平视人物五官衣饰，远近观感层次悬殊！）
  const getDistanceFromZoom = (zT: number) => 156 * Math.pow(5.6 / 156, zT);

  // 同步面板控件引用
  const vpHeaderBtn = viewPanel.querySelector('.qmsht-vp-header') as HTMLButtonElement;
  const vpArrow = viewPanel.querySelector('.qmsht-vp-arrow') as HTMLSpanElement;
  const zoomInput = viewPanel.querySelector('[data-ctrl="zoom"]') as HTMLInputElement;
  const pitchInput = viewPanel.querySelector('[data-ctrl="pitch"]') as HTMLInputElement;
  const yawInput = viewPanel.querySelector('[data-ctrl="yaw"]') as HTMLInputElement;
  const zoomVal = viewPanel.querySelector('[data-val="zoom"]') as HTMLSpanElement;
  const pitchVal = viewPanel.querySelector('[data-val="pitch"]') as HTMLSpanElement;
  const yawVal = viewPanel.querySelector('[data-val="yaw"]') as HTMLSpanElement;
  const plaquesBtn = viewPanel.querySelector('[data-btn="plaques"]') as HTMLButtonElement;
  const resetBtn = viewPanel.querySelector('[data-btn="reset"]') as HTMLButtonElement;

  vpHeaderBtn.addEventListener('click', () => {
    panelCollapsed = !panelCollapsed;
    viewPanel.classList.toggle('is-collapsed', panelCollapsed);
    vpHeaderBtn.setAttribute('aria-expanded', String(!panelCollapsed));
    vpArrow.textContent = panelCollapsed ? '▴' : '▾';
  });

  zoomInput.addEventListener('input', () => {
    dismissHint();
    camTarget.zoomT = Number(zoomInput.value) / 100;
    clampCameraTargets();
  });
  pitchInput.addEventListener('input', () => {
    dismissHint();
    camTarget.pitchDeg = Number(pitchInput.value);
    clampCameraTargets();
  });
  yawInput.addEventListener('input', () => {
    dismissHint();
    camTarget.yawDeg = Number(yawInput.value);
    clampCameraTargets();
  });

  plaquesBtn.addEventListener('click', () => {
    showPlaques = !showPlaques;
    plaquesBtn.classList.toggle('is-active', showPlaques);
    plaquesLayer.style.display = showPlaques ? 'block' : 'none';
  });

  resetBtn.addEventListener('click', () => {
    dismissHint();
    Object.assign(camTarget, INITIAL_VIEW);
  });

  // =========================================================================
  // 鼠标、触屏、键盘与底部长卷导航条交互绑定
  // =========================================================================
  let pointerMode: 'none' | 'pan' | 'orbit' = 'none';
  let lastMouseX = 0;
  let lastMouseY = 0;

  const panByScreenPixels = (dxPx: number, dyPx: number) => {
    const dist = getDistanceFromZoom(camCurrent.zoomT);
    const vFovRad = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * dist * Math.tan(vFovRad * 0.5);
    const metersPerPx = visibleHeight / Math.max(window.innerHeight, 1);

    const yawRad = THREE.MathUtils.degToRad(camCurrent.yawDeg);
    const pitchRad = THREE.MathUtils.degToRad(Math.max(camCurrent.pitchDeg, 16));
    const forwardScale = 1 / Math.sin(pitchRad);

    // 屏幕右方向对应世界 (cos(yaw), 0, -sin(yaw))；屏幕上方向对应世界 (-sin(yaw), 0, -cos(yaw))
    const rightX = Math.cos(yawRad);
    const rightZ = -Math.sin(yawRad);
    const fwdX = -Math.sin(yawRad);
    const fwdZ = -Math.cos(yawRad);

    camTarget.targetX -= (dxPx * rightX + dyPx * fwdX * forwardScale * 0.68) * metersPerPx;
    camTarget.targetZ -= (dxPx * rightZ + dyPx * fwdZ * forwardScale * 0.68) * metersPerPx;
    clampCameraTargets();
  };

  const onMouseDown = (e: MouseEvent) => {
    dismissHint();
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (e.button === 2 || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      pointerMode = 'orbit';
    } else if (e.button === 0) {
      pointerMode = 'pan';
    }
    canvasWrap.classList.add('is-dragging');
  };

  const onMouseMove = (e: MouseEvent) => {
    if (pointerMode === 'none') return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    if (pointerMode === 'pan') {
      panByScreenPixels(dx, dy);
    } else if (pointerMode === 'orbit') {
      camTarget.yawDeg -= dx * 0.28;
      camTarget.pitchDeg = THREE.MathUtils.clamp(camTarget.pitchDeg + dy * 0.24, 9, 72);
      clampCameraTargets();
    }
  };

  const onMouseUp = () => {
    pointerMode = 'none';
    canvasWrap.classList.remove('is-dragging');
  };

  const onContextMenu = (e: Event) => e.preventDefault();

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    dismissHint();
    const delta = THREE.MathUtils.clamp(e.deltaY, -120, 120);
    camTarget.zoomT -= delta * 0.0011;
    // 拉近时自动平顺压低一点俯仰角以增强贴近街面观感；拉远时适度抬升俯瞰长卷
    if (delta < 0 && camTarget.zoomT > 0.65 && camTarget.pitchDeg > 24) {
      camTarget.pitchDeg -= Math.abs(delta) * 0.035;
    } else if (delta > 0 && camTarget.zoomT < 0.35 && camTarget.pitchDeg < 30) {
      camTarget.pitchDeg += Math.abs(delta) * 0.03;
    }
    clampCameraTargets();
  };

  canvasWrap.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvasWrap.addEventListener('contextmenu', onContextMenu);
  canvasWrap.addEventListener('wheel', onWheel, { passive: false });

  // 触屏支持：单指平移（前后左右），双指捏合缩放、双指旋转与上下俯仰
  let prevTouchCount = 0;
  let touchPrevX = 0;
  let touchPrevY = 0;
  let touchPrevDist = 0;
  let touchPrevAngle = 0;

  const onTouchStart = (e: TouchEvent) => {
    dismissHint();
    prevTouchCount = e.touches.length;
    if (e.touches.length === 1) {
      touchPrevX = e.touches[0].clientX;
      touchPrevY = e.touches[0].clientY;
    } else if (e.touches.length >= 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      touchPrevX = (t0.clientX + t1.clientX) * 0.5;
      touchPrevY = (t0.clientY + t1.clientY) * 0.5;
      touchPrevDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      touchPrevAngle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length !== prevTouchCount) {
      onTouchStart(e);
      return;
    }
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchPrevX;
      const dy = e.touches[0].clientY - touchPrevY;
      touchPrevX = e.touches[0].clientX;
      touchPrevY = e.touches[0].clientY;
      panByScreenPixels(dx, dy);
    } else if (e.touches.length >= 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const midX = (t0.clientX + t1.clientX) * 0.5;
      const midY = (t0.clientY + t1.clientY) * 0.5;
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const ang = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);

      // 双指捏合缩放
      if (touchPrevDist > 10) {
        const ratio = dist / touchPrevDist;
        camTarget.zoomT += Math.log(ratio) * 0.55;
      }
      // 双指扭转旋转视角
      let dAng = ang - touchPrevAngle;
      if (dAng > Math.PI) dAng -= Math.PI * 2;
      if (dAng < -Math.PI) dAng += Math.PI * 2;
      camTarget.yawDeg += THREE.MathUtils.radToDeg(dAng) * 0.85;

      // 双指同向纵向滑动调节俯仰
      const dyMid = midY - touchPrevY;
      camTarget.pitchDeg += dyMid * 0.22;

      touchPrevX = midX;
      touchPrevY = midY;
      touchPrevDist = dist;
      touchPrevAngle = ang;
      clampCameraTargets();
    }
  };

  canvasWrap.addEventListener('touchstart', onTouchStart, { passive: false });
  canvasWrap.addEventListener('touchmove', onTouchMove, { passive: false });

  // 键盘方向键与加减号控制
  const activeKeys = new Set<string>();
  const onKeyDown = (e: KeyboardEvent) => {
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '=', '+', '-', '_', 'NumpadAdd', 'NumpadSubtract'].includes(
        e.key,
      ) ||
      ['NumpadAdd', 'NumpadSubtract'].includes(e.code)
    ) {
      dismissHint();
      activeKeys.add(e.key);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    activeKeys.delete(e.key);
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // 底部全卷缩略图导航条点击与拖动跳转
  let isScrubbingNav = false;
  const scrubNavAtClientX = (clientX: number) => {
    dismissHint();
    const rect = navBar.getBoundingClientRect();
    const u = THREE.MathUtils.clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const newX = uToWorldX(u);
    camTarget.targetX = newX;
    camTarget.targetZ = recommendedCenterZForX(newX);
    clampCameraTargets();
  };

  const onNavPointerDown = (e: PointerEvent) => {
    isScrubbingNav = true;
    navBar.setPointerCapture(e.pointerId);
    scrubNavAtClientX(e.clientX);
  };
  const onNavPointerMove = (e: PointerEvent) => {
    if (isScrubbingNav) scrubNavAtClientX(e.clientX);
  };
  const onNavPointerUp = (e: PointerEvent) => {
    if (isScrubbingNav) {
      isScrubbingNav = false;
      navBar.releasePointerCapture(e.pointerId);
    }
  };
  navBar.addEventListener('pointerdown', onNavPointerDown);
  navBar.addEventListener('pointermove', onNavPointerMove);
  navBar.addEventListener('pointerup', onNavPointerUp);
  navBar.addEventListener('pointercancel', onNavPointerUp);

  // 窗口尺寸自适应
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  // =========================================================================
  // 动画与渲染主循环（兼顾硬件 GPU 60fps 与软件 WebGL fenceSync 节拍控制）
  // =========================================================================
  const clock = new THREE.Clock();
  const projVec = new THREE.Vector3();
  let frameId = 0;
  let disposed = false;
  let activeZoneSubTitle = '';

  function afterDrawSoftware(cb: () => void) {
    const gl = renderer.getContext() as WebGL2RenderingContext;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    } else {
      frameId = window.setTimeout(cb, 80);
    }
  }

  function tick() {
    if (disposed) return;
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const elapsed = clock.elapsedTime;

    // 键盘连续平滑移动与缩放
    if (activeKeys.size > 0) {
      const dist = getDistanceFromZoom(camCurrent.zoomT);
      const moveSpeed = dist * 0.65 * dt;
      const yawRad = THREE.MathUtils.degToRad(camCurrent.yawDeg);
      const rightX = Math.cos(yawRad);
      const rightZ = -Math.sin(yawRad);
      const fwdX = -Math.sin(yawRad);
      const fwdZ = -Math.cos(yawRad);

      if (activeKeys.has('ArrowLeft')) {
        camTarget.targetX -= rightX * moveSpeed;
        camTarget.targetZ -= rightZ * moveSpeed;
      }
      if (activeKeys.has('ArrowRight')) {
        camTarget.targetX += rightX * moveSpeed;
        camTarget.targetZ += rightZ * moveSpeed;
      }
      if (activeKeys.has('ArrowUp')) {
        camTarget.targetX += fwdX * moveSpeed;
        camTarget.targetZ += fwdZ * moveSpeed;
      }
      if (activeKeys.has('ArrowDown')) {
        camTarget.targetX -= fwdX * moveSpeed;
        camTarget.targetZ -= fwdZ * moveSpeed;
      }
      if (activeKeys.has('+') || activeKeys.has('=')) {
        camTarget.zoomT += 0.55 * dt;
      }
      if (activeKeys.has('-') || activeKeys.has('_')) {
        camTarget.zoomT -= 0.55 * dt;
      }
      clampCameraTargets();
    }

    // 指数阻尼插值相机状态（软件渲染时直接到位避免多帧拖尾）
    const alpha = isSoftwareGl ? 1.0 : 1 - Math.exp(-12 * dt);
    camCurrent.targetX += (camTarget.targetX - camCurrent.targetX) * alpha;
    camCurrent.targetZ += (camTarget.targetZ - camCurrent.targetZ) * alpha;
    camCurrent.zoomT += (camTarget.zoomT - camCurrent.zoomT) * alpha;
    camCurrent.pitchDeg += (camTarget.pitchDeg - camCurrent.pitchDeg) * alpha;
    // 处理旋转角最短圆弧插值
    let dYaw = camTarget.yawDeg - camCurrent.yawDeg;
    if (dYaw > 180) dYaw -= 360;
    if (dYaw < -180) dYaw += 360;
    camCurrent.yawDeg += dYaw * alpha;

    // 远看长焦散点俯瞰（约 140m 宽幅手卷构图） vs 近看街面广角平视（贴近街巷看清眉眼衣褶）
    const dist = getDistanceFromZoom(camCurrent.zoomT);
    const streetCloseFactor = THREE.MathUtils.smoothstep(camCurrent.zoomT, 0.50, 1.0);
    const targetFov = THREE.MathUtils.lerp(27, 45, streetCloseFactor);
    if (Math.abs(camera.fov - targetFov) > 0.02) {
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
    sceneFog.density = THREE.MathUtils.lerp(0.0017, 0.0058, streetCloseFactor);

    const baseGroundY = walkableHeightAt(camCurrent.targetX, camCurrent.targetZ);
    const focusY = baseGroundY + THREE.MathUtils.lerp(0.45, 1.42, streetCloseFactor);

    const pitchRad = THREE.MathUtils.degToRad(camCurrent.pitchDeg);
    const yawRad = THREE.MathUtils.degToRad(camCurrent.yawDeg);
    const horizDist = Math.cos(pitchRad) * dist;
    const camX = camCurrent.targetX + Math.sin(yawRad) * horizDist;
    const camZ = camCurrent.targetZ + Math.cos(yawRad) * horizDist;
    const minCamY = Math.max(
      groundHeightAt(camX, camZ) + 0.95,
      structureClearanceHeightAt(camX, camZ),
    );
    const camY = Math.max(minCamY, focusY + Math.sin(pitchRad) * dist);

    camera.position.set(camX, camY, camZ);
    camera.lookAt(camCurrent.targetX, focusY, camCurrent.targetZ);

    // 动态跟随焦点的锐利太阳阴影视锥（按纹素对齐防止拖动闪烁）
    if (!isSoftwareGl) {
      const shadowHalf = THREE.MathUtils.lerp(72, 16, camCurrent.zoomT);
      const texelStep = (shadowHalf * 2) / 2048;
      const snapX = Math.round(camCurrent.targetX / texelStep) * texelStep;
      const snapZ = Math.round(camCurrent.targetZ / texelStep) * texelStep;
      keyLight.target.position.set(snapX, 0, snapZ);
      keyLight.position.set(snapX + 34, 62, snapZ + 40);
      const sc = keyLight.shadow.camera;
      if (Math.abs(sc.right - shadowHalf) > 0.25) {
        sc.left = -shadowHalf;
        sc.right = shadowHalf;
        sc.top = shadowHalf;
        sc.bottom = -shadowHalf;
        sc.updateProjectionMatrix();
      }
    }

    // 推进着色器时间、全卷船只摇橹与几百名市井人物车马动画
    matLib.uTime.value = elapsed;
    vessels.update(elapsed);
    crowd.update(elapsed, dt);

    // 同步底部通栏缩略图导航框位置与宽度（宽度随镜头缩放实时变化！）
    const uCenter = worldXToU(camCurrent.targetX);
    const visibleWorldHeight = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const visibleWorldWidth = visibleWorldHeight * camera.aspect;
    const boxWidthPct = THREE.MathUtils.clamp(
      (visibleWorldWidth / WORLD_BOUNDS.scrollWidth) * 100,
      1.5,
      100,
    );
    const boxLeftPct = THREE.MathUtils.clamp(
      uCenter * 100 - boxWidthPct * 0.5,
      0,
      100 - boxWidthPct,
    );
    navViewport.style.left = `${boxLeftPct.toFixed(2)}%`;
    navViewport.style.width = `${boxWidthPct.toFixed(2)}%`;
    navMaskLeft.style.width = `${boxLeftPct.toFixed(2)}%`;
    navMaskRight.style.width = `${Math.max(0, 100 - boxLeftPct - boxWidthPct).toFixed(2)}%`;

    // 同步左上角当前段落标题与说明
    for (const zInfo of SECTION_ZONES) {
      if (uCenter >= zInfo.uMin && uCenter <= zInfo.uMax) {
        if (activeZoneSubTitle !== zInfo.subTitle) {
          activeZoneSubTitle = zInfo.subTitle;
          tlTitle.textContent = zInfo.subTitle;
          tlDesc.textContent = zInfo.description;
        }
        break;
      }
    }

    // 同步右下角“视角”滑杆数值显示
    const zPct = Math.round(camCurrent.zoomT * 100);
    const pDeg = Math.round(camCurrent.pitchDeg);
    const yDeg = Math.round(camCurrent.yawDeg);
    if (document.activeElement !== zoomInput) zoomInput.value = String(zPct);
    if (document.activeElement !== pitchInput) pitchInput.value = String(pDeg);
    if (document.activeElement !== yawInput) yawInput.value = String(yDeg);
    zoomVal.textContent = `${zPct}%`;
    pitchVal.textContent = `${pDeg}°`;
    yawVal.textContent = `${yDeg}°`;

    // 更新三维空间投影“题签”浮标（远景仅显核心名铺地标，拉近显现丰富市井细部题签）
    if (showPlaques) {
      camera.updateMatrixWorld();
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < plaqueEls.length; i++) {
        const item = plaqueEls[i];
        if (!item.spec.major && camCurrent.zoomT < 0.28) {
          item.el.style.opacity = '0';
          continue;
        }
        projVec.set(item.spec.x, item.spec.y, item.spec.z);
        const dToCam = projVec.distanceTo(camera.position);
        projVec.project(camera);

        if (
          projVec.z > 1 ||
          projVec.x < -0.96 ||
          projVec.x > 0.96 ||
          projVec.y < -0.86 ||
          projVec.y > 0.92 ||
          dToCam > 195
        ) {
          item.el.style.opacity = '0';
          continue;
        }
        const sx = (projVec.x * 0.5 + 0.5) * w;
        const sy = (-projVec.y * 0.5 + 0.5) * h;
        item.el.style.transform = `translate3d(${(sx - 13).toFixed(1)}px, ${(sy - 46).toFixed(1)}px, 0)`;
        item.el.style.opacity = dToCam > 155 ? ((195 - dToCam) / 40).toFixed(2) : '1';
      }
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDrawSoftware(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  frameId = requestAnimationFrame(tick);

  // 返回完整资源清理函数
  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
    envTex.dispose();
    matLib.dispose();
    renderer.dispose();
    rootEl.remove();
    styleEl.remove();
  };
}
