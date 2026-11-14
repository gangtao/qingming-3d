import * as THREE from 'three';
import { ScrollCameraController } from './camera';
import { WENKAI_FONT_BASE64 } from './fontData';
import { SCROLL_THUMB_DATA_URI } from './scrollThumbData';
import { getSectionAtU, LandmarkLabel, SECTIONS, xToU } from './world';

export interface QingmingUI {
  showFirstInteractionFade: () => void;
  update: (camera: THREE.PerspectiveCamera, controller: ScrollCameraController) => void;
  dispose: () => void;
}

const STYLE_ID = 'qingming-ui-styles';

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
@font-face {
  font-family: "QingmingWenKai";
  src: url("data:font/woff2;base64,${WENKAI_FONT_BASE64}") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}

.qm-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 20;
  font-family: "QingmingWenKai", "Kaiti SC", "STKaiti", "KaiTi", serif;
  color: #2c2117;
}

.qm-root * {
  box-sizing: border-box;
  font-family: inherit;
}

.qm-top-left {
  position: absolute;
  top: 16px;
  left: 16px;
  max-width: min(360px, calc(100vw - 110px));
  background: rgba(242, 232, 211, 0.90);
  border: 1px solid rgba(92, 68, 42, 0.28);
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 4px 18px rgba(48, 34, 18, 0.14);
  pointer-events: auto;
}

.qm-sec-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: 0.06em;
  color: #2b1f14;
  margin: 0 0 4px 0;
}

.qm-sec-desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: #4f3d2b;
  margin: 0;
}

.qm-top-right {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(242, 232, 211, 0.88);
  border: 1px solid rgba(92, 68, 42, 0.28);
  border-radius: 4px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 18px rgba(48, 34, 18, 0.14);
}

.qm-vtitle {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: #261a10;
  margin: 0;
}

.qm-seal {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 11px;
  line-height: 1.15;
  color: #f6ede0;
  background: #923a29;
  padding: 4px 3px;
  border-radius: 2px;
  letter-spacing: 0.08em;
}

.qm-hint {
  position: absolute;
  left: 50%;
  bottom: 92px;
  transform: translateX(-50%);
  background: rgba(44, 32, 20, 0.82);
  color: #f3e8d2;
  padding: 7px 16px;
  border-radius: 4px;
  font-size: 13px;
  letter-spacing: 0.03em;
  white-space: nowrap;
  max-width: 92vw;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: opacity 0.55s ease, transform 0.55s ease;
  pointer-events: none;
}

.qm-hint.is-hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

.qm-panel {
  position: absolute;
  right: 16px;
  bottom: 88px;
  width: 228px;
  background: rgba(242, 232, 211, 0.93);
  border: 1px solid rgba(92, 68, 42, 0.3);
  border-radius: 4px;
  box-shadow: 0 6px 22px rgba(42, 28, 14, 0.18);
  pointer-events: auto;
  overflow: hidden;
}

.qm-panel-hdr {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(226, 211, 182, 0.55);
  border: none;
  border-bottom: 1px solid rgba(92, 68, 42, 0.18);
  color: #2b1f14;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  min-height: 40px;
}

.qm-panel-hdr:hover {
  background: rgba(218, 200, 166, 0.75);
}

.qm-panel-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.qm-panel.is-collapsed .qm-panel-body {
  display: none;
}

.qm-panel.is-collapsed .qm-panel-hdr {
  border-bottom: none;
}

.qm-slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #463524;
}

.qm-slider-row label {
  width: 34px;
  flex-shrink: 0;
}

.qm-slider-row input[type="range"] {
  flex: 1;
  accent-color: #7d4a28;
  cursor: pointer;
  height: 18px;
}

.qm-btn-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 2px;
}

.qm-btn {
  padding: 6px 10px;
  min-height: 36px;
  font-size: 13.5px;
  border-radius: 3px;
  border: 1px solid rgba(92, 68, 42, 0.34);
  background: rgba(252, 246, 234, 0.85);
  color: #2c2117;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}

.qm-btn:hover {
  background: #e6d7b9;
}

.qm-btn.is-active {
  background: #7b4827;
  color: #f9f1e2;
  border-color: #693c1e;
}

.qm-minimap-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 76px;
  background: #cbb690;
  border-top: 1px solid rgba(78, 57, 35, 0.38);
  pointer-events: auto;
  display: flex;
  flex-direction: column;
}

.qm-minimap-labels {
  height: 20px;
  display: flex;
  width: 100%;
  background: rgba(238, 226, 202, 0.94);
  border-bottom: 1px solid rgba(92, 68, 42, 0.2);
  font-size: 12px;
  color: #4a3826;
}

.qm-minimap-sec {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px dashed rgba(92, 68, 42, 0.28);
  cursor: pointer;
  letter-spacing: 0.12em;
  transition: background-color 0.15s ease;
}

.qm-minimap-sec:last-child {
  border-right: none;
}

.qm-minimap-sec:hover {
  background: rgba(196, 173, 132, 0.35);
}

.qm-minimap-track {
  position: relative;
  flex: 1;
  width: 100%;
  overflow: hidden;
  cursor: grab;
  background: #baa279;
}

.qm-minimap-track:active {
  cursor: grabbing;
}

.qm-minimap-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
  pointer-events: none;
  opacity: 0.96;
}

.qm-minimap-shade-l,
.qm-minimap-shade-r {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(34, 24, 14, 0.34);
  pointer-events: none;
}

.qm-minimap-shade-l { left: 0; }
.qm-minimap-shade-r { right: 0; }

.qm-minimap-box {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border: 2px solid #963726;
  background: rgba(255, 245, 224, 0.12);
  box-shadow: 0 0 0 1px rgba(255, 245, 224, 0.55);
  pointer-events: none;
}

.qm-labels-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.qm-pin {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(246, 236, 214, 0.92);
  border: 1px solid rgba(102, 71, 41, 0.55);
  color: #2f2115;
  padding: 2px 7px;
  font-size: 12.5px;
  line-height: 1.3;
  border-radius: 2px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(42, 28, 14, 0.18);
  pointer-events: none;
}

.qm-pin::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 100%;
  width: 1px;
  height: 10px;
  background: rgba(102, 71, 41, 0.65);
}

@media (max-width: 767px) {
  .qm-top-left {
    top: 10px;
    left: 10px;
    padding: 8px 11px;
    max-width: calc(100vw - 84px);
  }
  .qm-sec-title { font-size: 16px; }
  .qm-sec-desc { font-size: 12px; }
  .qm-top-right { top: 10px; right: 10px; padding: 10px 7px; }
  .qm-vtitle { font-size: 18px; }
  .qm-panel { right: 10px; bottom: 84px; width: 204px; }
  .qm-hint {
    bottom: 132px;
    font-size: 11.5px;
    padding: 5px 10px;
    white-space: normal;
    text-align: center;
    line-height: 1.35;
    max-width: calc(100vw - 24px);
  }
}
`;
  document.head.appendChild(style);
}

export function createQingmingUI(
  container: HTMLElement,
  controller: ScrollCameraController,
  landmarks: LandmarkLabel[]
): QingmingUI {
  injectStyles();

  const root = document.createElement('div');
  root.className = 'qm-root';

  // 1. Floating Landmark Labels (题签)
  const labelsLayer = document.createElement('div');
  labelsLayer.className = 'qm-labels-layer';
  const pinElems = landmarks.map((lm) => {
    const el = document.createElement('div');
    el.className = 'qm-pin';
    el.textContent = lm.name;
    labelsLayer.appendChild(el);
    return { lm, el };
  });
  let showLabels = true;
  root.appendChild(labelsLayer);

  // 2. Top-Left Section Title & Description
  const topLeft = document.createElement('div');
  topLeft.className = 'qm-top-left';
  const secTitleEl = document.createElement('h2');
  secTitleEl.className = 'qm-sec-title';
  const secDescEl = document.createElement('p');
  secDescEl.className = 'qm-sec-desc';
  topLeft.appendChild(secTitleEl);
  topLeft.appendChild(secDescEl);
  root.appendChild(topLeft);

  // 3. Top-Right Vertical Title
  const topRight = document.createElement('div');
  topRight.className = 'qm-top-right';
  const vTitle = document.createElement('h1');
  vTitle.className = 'qm-vtitle';
  vTitle.textContent = '清明上河图';
  const seal = document.createElement('span');
  seal.className = 'qm-seal';
  seal.textContent = '张择端本';
  topRight.appendChild(vTitle);
  topRight.appendChild(seal);
  root.appendChild(topRight);

  // 4. First-Interaction Hint
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hint = document.createElement('div');
  hint.className = 'qm-hint';
  hint.textContent = isTouch
    ? '单指拖动平移 · 双指捏合缩放 · 双指旋转俯仰'
    : '左键拖动平移（含前后） · 右键或按住 Shift 拖动旋转俯仰 · 滚轮缩放 · 方向键与加减号浏览';
  root.appendChild(hint);

  // 5. Bottom-Right Collapsible "视角" Panel (collapsed by default on narrow screens)
  const panel = document.createElement('div');
  const startCollapsed = window.innerWidth < 768;
  panel.className = startCollapsed ? 'qm-panel is-collapsed' : 'qm-panel';

  const panelHdr = document.createElement('button');
  panelHdr.type = 'button';
  panelHdr.className = 'qm-panel-hdr';
  const hdrTitle = document.createElement('span');
  hdrTitle.textContent = '视角';
  const hdrState = document.createElement('span');
  hdrState.style.fontSize = '12.5px';
  hdrState.style.color = '#65513b';
  hdrState.textContent = startCollapsed ? '展开' : '收起';
  panelHdr.appendChild(hdrTitle);
  panelHdr.appendChild(hdrState);

  const panelBody = document.createElement('div');
  panelBody.className = 'qm-panel-body';

  const makeSlider = (labelText: string, onInput: (v: number) => void) => {
    const row = document.createElement('div');
    row.className = 'qm-slider-row';
    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    const inp = document.createElement('input');
    inp.type = 'range';
    inp.min = '0';
    inp.max = '1';
    inp.step = '0.005';
    inp.addEventListener('input', () => onInput(parseFloat(inp.value)));
    row.appendChild(lbl);
    row.appendChild(inp);
    panelBody.appendChild(row);
    return inp;
  };

  // Zoom slider: left = 远(1) -> right = 近(0) or left=0(远) right=1(近) — let's make right = 拉近(close), left = 拉远(far)
  const zoomSlider = makeSlider('缩放', (v) => controller.setZoomNorm(1 - v));
  const pitchSlider = makeSlider('俯仰', (v) => controller.setPitchNorm(v));
  const rotSlider = makeSlider('旋转', (v) => controller.setAzimuthNorm(v));

  const btnRow = document.createElement('div');
  btnRow.className = 'qm-btn-row';

  const labelBtn = document.createElement('button');
  labelBtn.type = 'button';
  labelBtn.className = 'qm-btn is-active';
  labelBtn.textContent = '题签';
  labelBtn.addEventListener('click', () => {
    showLabels = !showLabels;
    labelsLayer.style.display = showLabels ? 'block' : 'none';
    labelBtn.classList.toggle('is-active', showLabels);
  });

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'qm-btn';
  resetBtn.textContent = '复位';
  resetBtn.addEventListener('click', () => controller.reset());

  btnRow.appendChild(labelBtn);
  btnRow.appendChild(resetBtn);
  panelBody.appendChild(btnRow);

  panelHdr.addEventListener('click', () => {
    const collapsed = panel.classList.toggle('is-collapsed');
    hdrState.textContent = collapsed ? '展开' : '收起';
  });

  panel.appendChild(panelHdr);
  panel.appendChild(panelBody);
  root.appendChild(panel);

  // 6. Bottom Full-Width Scroll Minimap Bar
  // Remember: Painting reads right-to-left (u=0 right=郊野春色, u=1 left=城门街市)
  const minimapWrap = document.createElement('div');
  minimapWrap.className = 'qm-minimap-wrap';

  const labelsBar = document.createElement('div');
  labelsBar.className = 'qm-minimap-labels';
  // Left-to-right widths matching u ranges:
  // 城门街市: u = 0.58..1.00 (42%) | 汴河虹桥: u = 0.26..0.58 (32%) | 郊野春色: u = 0.00..0.26 (26%)
  const secBarDefs = [
    { sec: SECTIONS[2], widthPct: (SECTIONS[2].uEnd - SECTIONS[2].uStart) * 100 },
    { sec: SECTIONS[1], widthPct: (SECTIONS[1].uEnd - SECTIONS[1].uStart) * 100 },
    { sec: SECTIONS[0], widthPct: (SECTIONS[0].uEnd - SECTIONS[0].uStart) * 100 },
  ];
  secBarDefs.forEach(({ sec, widthPct }) => {
    const btn = document.createElement('div');
    btn.className = 'qm-minimap-sec';
    btn.style.width = `${widthPct}%`;
    btn.textContent = sec.title;
    btn.addEventListener('click', () => {
      controller.jumpToU((sec.uStart + sec.uEnd) * 0.5);
    });
    labelsBar.appendChild(btn);
  });

  const track = document.createElement('div');
  track.className = 'qm-minimap-track';
  const img = document.createElement('img');
  img.className = 'qm-minimap-img';
  img.src = SCROLL_THUMB_DATA_URI;
  img.alt = '清明上河图全卷缩略图';
  img.draggable = false;

  const shadeL = document.createElement('div');
  shadeL.className = 'qm-minimap-shade-l';
  const shadeR = document.createElement('div');
  shadeR.className = 'qm-minimap-shade-r';
  const vpBox = document.createElement('div');
  vpBox.className = 'qm-minimap-box';

  track.appendChild(img);
  track.appendChild(shadeL);
  track.appendChild(shadeR);
  track.appendChild(vpBox);

  let draggingMinimap = false;
  const scrubToClientX = (clientX: number) => {
    const rect = track.getBoundingClientRect();
    const normX = THREE.MathUtils.clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const u = 1 - normX; // right edge = 卷首(u=0), left edge = 卷尾(u=1)
    controller.jumpToU(u);
  };
  track.addEventListener('pointerdown', (e) => {
    draggingMinimap = true;
    track.setPointerCapture?.(e.pointerId);
    scrubToClientX(e.clientX);
  });
  track.addEventListener('pointermove', (e) => {
    if (draggingMinimap) scrubToClientX(e.clientX);
  });
  const endDrag = () => {
    draggingMinimap = false;
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', (e) => scrubToClientX(e.clientX));

  minimapWrap.appendChild(labelsBar);
  minimapWrap.appendChild(track);
  root.appendChild(minimapWrap);

  container.appendChild(root);

  let lastSecId = '';
  const _proj = new THREE.Vector3();

  const update = (camera: THREE.PerspectiveCamera, ctrl: ScrollCameraController) => {
    // Update Top-Left section header based on camera target X
    const u = xToU(ctrl.current.targetX);
    const sec = getSectionAtU(u);
    if (sec.id !== lastSecId) {
      lastSecId = sec.id;
      secTitleEl.textContent = sec.title;
      secDescEl.textContent = sec.subtitle;
    }

    // Sync sliders with damped camera state (skip if user actively dragging slider)
    if (document.activeElement !== zoomSlider) zoomSlider.value = String(1 - ctrl.getZoomNorm());
    if (document.activeElement !== pitchSlider) pitchSlider.value = String(ctrl.getPitchNorm());
    if (document.activeElement !== rotSlider) rotSlider.value = String(ctrl.getAzimuthNorm());

    // Update Minimap Viewport Frame
    const { uCenter, uWidth } = ctrl.getMinimapViewport();
    const screenCenterPct = (1 - uCenter) * 100;
    const widthPct = uWidth * 100;
    const leftPct = THREE.MathUtils.clamp(screenCenterPct - widthPct * 0.5, 0, 100 - widthPct);
    const rightPct = THREE.MathUtils.clamp(100 - (leftPct + widthPct), 0, 100);

    vpBox.style.left = `${leftPct.toFixed(2)}%`;
    vpBox.style.width = `${widthPct.toFixed(2)}%`;
    shadeL.style.width = `${leftPct.toFixed(2)}%`;
    shadeR.style.width = `${rightPct.toFixed(2)}%`;

    // Update projected 题签 labels
    if (showLabels) {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      for (const { lm, el } of pinElems) {
        _proj.set(lm.x, lm.y, lm.z);
        _proj.project(camera);
        if (_proj.z < -1 || _proj.z > 1 || _proj.x < -1.1 || _proj.x > 1.1 || _proj.y < -1.1 || _proj.y > 1.1) {
          el.style.display = 'none';
          continue;
        }
        const sx = (_proj.x * 0.5 + 0.5) * w;
        const sy = (-_proj.y * 0.5 + 0.5) * h;
        // Avoid colliding directly over the bottom minimap
        if (sy > h - 82 || sy < 14) {
          el.style.display = 'none';
          continue;
        }
        el.style.display = 'block';
        el.style.left = `${sx.toFixed(1)}px`;
        el.style.top = `${sy.toFixed(1)}px`;
      }
    }
  };

  return {
    showFirstInteractionFade: () => {
      hint.classList.add('is-hidden');
    },
    update,
    dispose: () => {
      root.remove();
    },
  };
}
