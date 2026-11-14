import * as THREE from 'three';
import { mainRoadZ, riverCenterZ, SCROLL_HALF_LENGTH, SCROLL_LENGTH, xToU } from './world';

export interface CameraState {
  targetX: number;
  targetZ: number;
  distance: number; // 3.8 (close street view) .. 78 (grand scroll overview)
  pitch: number; // radians from horizontal: 0.16 (low street angle) .. 1.18 (steep bird's-eye)
  azimuth: number; // radians around Y: 0 = facing North (-Z), range [-1.35, +1.35]
}

export const DEFAULT_CAMERA_STATE: CameraState = {
  targetX: 4,
  targetZ: 4,
  distance: 36,
  pitch: 0.44,
  azimuth: 0.08,
};

export const CAMERA_LIMITS = {
  minX: -SCROLL_HALF_LENGTH + 8,
  maxX: SCROLL_HALF_LENGTH - 8,
  minZ: -38,
  maxZ: 38,
  minDistance: 3.8,
  maxDistance: 78,
  minPitch: 0.14,
  maxPitch: 1.22,
  minAzimuth: -1.35,
  maxAzimuth: 1.35,
};

export class ScrollCameraController {
  readonly camera: THREE.PerspectiveCamera;
  readonly target: CameraState = { ...DEFAULT_CAMERA_STATE };
  readonly current: CameraState = { ...DEFAULT_CAMERA_STATE };

  private dom: HTMLElement;
  private onFirstInteract: () => void;
  private interacted = false;

  // Pointer & touch tracking
  private activePointers = new Map<number, { x: number; y: number }>();
  private prevSingle: { x: number; y: number } | null = null;
  private prevPinchDist = 0;
  private prevPinchAngle = 0;
  private prevPinchMidY = 0;
  private dragMode: 'none' | 'pan' | 'orbit' = 'none';

  // Held keys
  private keysDown = new Set<string>();

  private listeners: (() => void)[] = [];

  constructor(camera: THREE.PerspectiveCamera, dom: HTMLElement, onFirstInteract: () => void) {
    this.camera = camera;
    this.dom = dom;
    this.onFirstInteract = onFirstInteract;
    this.applyCameraToThree();
    this.bindEvents();
  }

  private markInteracted(): void {
    if (!this.interacted) {
      this.interacted = true;
      this.onFirstInteract();
    }
  }

  private clampTargets(): void {
    this.target.targetX = THREE.MathUtils.clamp(this.target.targetX, CAMERA_LIMITS.minX, CAMERA_LIMITS.maxX);
    this.target.targetZ = THREE.MathUtils.clamp(this.target.targetZ, CAMERA_LIMITS.minZ, CAMERA_LIMITS.maxZ);
    this.target.distance = THREE.MathUtils.clamp(this.target.distance, CAMERA_LIMITS.minDistance, CAMERA_LIMITS.maxDistance);
    this.target.pitch = THREE.MathUtils.clamp(this.target.pitch, CAMERA_LIMITS.minPitch, CAMERA_LIMITS.maxPitch);
    this.target.azimuth = THREE.MathUtils.clamp(this.target.azimuth, CAMERA_LIMITS.minAzimuth, CAMERA_LIMITS.maxAzimuth);
  }

  private panByScreenDelta(dxPx: number, dyPx: number): void {
    // Pan speed scales naturally with camera distance so both close-up and overview feel responsive
    const scale = this.current.distance * 0.00145;
    const sinA = Math.sin(this.current.azimuth);
    const cosA = Math.cos(this.current.azimuth);
    // Screen right (+dx) moves camera left along view right vector; dragging scene right pans view left
    const moveRight = -dxPx * scale;
    const moveForward = -dyPx * scale * (1 / Math.max(0.32, Math.sin(this.current.pitch)));

    this.target.targetX += moveRight * cosA - moveForward * sinA;
    this.target.targetZ += -moveRight * sinA - moveForward * cosA;
    this.clampTargets();
  }

  private bindEvents(): void {
    const onContext = (e: Event) => e.preventDefault();
    this.dom.addEventListener('contextmenu', onContext);
    this.listeners.push(() => this.dom.removeEventListener('contextmenu', onContext));

    const onPointerDown = (e: PointerEvent) => {
      this.markInteracted();
      this.dom.setPointerCapture?.(e.pointerId);
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 1) {
        this.prevSingle = { x: e.clientX, y: e.clientY };
        const isOrbit = e.button === 2 || (e.button === 0 && e.shiftKey);
        this.dragMode = isOrbit ? 'orbit' : 'pan';
      } else if (this.activePointers.size === 2) {
        this.dragMode = 'none';
        const pts = Array.from(this.activePointers.values());
        this.prevPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        this.prevPinchAngle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
        this.prevPinchMidY = (pts[0].y + pts[1].y) * 0.5;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.activePointers.has(e.pointerId)) return;
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 1 && this.prevSingle) {
        const dx = e.clientX - this.prevSingle.x;
        const dy = e.clientY - this.prevSingle.y;
        this.prevSingle = { x: e.clientX, y: e.clientY };

        if (this.dragMode === 'orbit') {
          this.target.azimuth -= dx * 0.0055;
          this.target.pitch += dy * 0.0048;
          this.clampTargets();
        } else if (this.dragMode === 'pan') {
          this.panByScreenDelta(dx, dy);
        }
      } else if (this.activePointers.size === 2) {
        const pts = Array.from(this.activePointers.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
        const midY = (pts[0].y + pts[1].y) * 0.5;

        if (this.prevPinchDist > 10) {
          const ratio = this.prevPinchDist / Math.max(10, dist);
          this.target.distance *= ratio;
        }

        let dAng = angle - this.prevPinchAngle;
        if (dAng > Math.PI) dAng -= Math.PI * 2;
        if (dAng < -Math.PI) dAng += Math.PI * 2;
        this.target.azimuth -= dAng * 0.85;

        const dMidY = midY - this.prevPinchMidY;
        this.target.pitch += dMidY * 0.0045;

        this.prevPinchDist = dist;
        this.prevPinchAngle = angle;
        this.prevPinchMidY = midY;
        this.clampTargets();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      this.activePointers.delete(e.pointerId);
      if (this.activePointers.size === 1) {
        const rem = Array.from(this.activePointers.values())[0];
        this.prevSingle = { x: rem.x, y: rem.y };
        this.dragMode = 'pan';
      } else if (this.activePointers.size === 0) {
        this.prevSingle = null;
        this.dragMode = 'none';
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      this.markInteracted();
      const factor = Math.exp(e.deltaY * 0.0011);
      this.target.distance *= factor;
      this.clampTargets();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_'].includes(e.key)) {
        this.markInteracted();
        this.keysDown.add(e.key);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysDown.delete(e.key);
    };

    this.dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    this.dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    this.listeners.push(
      () => this.dom.removeEventListener('pointerdown', onPointerDown),
      () => window.removeEventListener('pointermove', onPointerMove),
      () => window.removeEventListener('pointerup', onPointerUp),
      () => window.removeEventListener('pointercancel', onPointerUp),
      () => this.dom.removeEventListener('wheel', onWheel),
      () => window.removeEventListener('keydown', onKeyDown),
      () => window.removeEventListener('keyup', onKeyUp)
    );
  }

  jumpToU(u: number): void {
    this.markInteracted();
    const clampedU = THREE.MathUtils.clamp(u, 0.02, 0.98);
    const tx = SCROLL_HALF_LENGTH - clampedU * SCROLL_LENGTH;
    this.target.targetX = tx;
    this.target.targetZ = clampedU > 0.27 && clampedU < 0.54 ? riverCenterZ(tx) + 3.5 : mainRoadZ(tx) + 1.5;
    this.clampTargets();
  }

  setZoomNorm(norm01: number): void {
    this.markInteracted();
    // Exponential zoom curve: 0 = closest street level, 1 = widest overview
    const t = THREE.MathUtils.clamp(norm01, 0, 1);
    this.target.distance = CAMERA_LIMITS.minDistance * Math.pow(CAMERA_LIMITS.maxDistance / CAMERA_LIMITS.minDistance, t);
    this.clampTargets();
  }

  getZoomNorm(): number {
    const ratio = this.current.distance / CAMERA_LIMITS.minDistance;
    const maxRatio = CAMERA_LIMITS.maxDistance / CAMERA_LIMITS.minDistance;
    return THREE.MathUtils.clamp(Math.log(ratio) / Math.log(maxRatio), 0, 1);
  }

  setPitchNorm(norm01: number): void {
    this.markInteracted();
    this.target.pitch = THREE.MathUtils.lerp(CAMERA_LIMITS.minPitch, CAMERA_LIMITS.maxPitch, THREE.MathUtils.clamp(norm01, 0, 1));
    this.clampTargets();
  }

  getPitchNorm(): number {
    return THREE.MathUtils.clamp(
      (this.current.pitch - CAMERA_LIMITS.minPitch) / (CAMERA_LIMITS.maxPitch - CAMERA_LIMITS.minPitch),
      0,
      1
    );
  }

  setAzimuthNorm(norm01: number): void {
    this.markInteracted();
    this.target.azimuth = THREE.MathUtils.lerp(CAMERA_LIMITS.minAzimuth, CAMERA_LIMITS.maxAzimuth, THREE.MathUtils.clamp(norm01, 0, 1));
    this.clampTargets();
  }

  getAzimuthNorm(): number {
    return THREE.MathUtils.clamp(
      (this.current.azimuth - CAMERA_LIMITS.minAzimuth) / (CAMERA_LIMITS.maxAzimuth - CAMERA_LIMITS.minAzimuth),
      0,
      1
    );
  }

  reset(): void {
    this.markInteracted();
    Object.assign(this.target, DEFAULT_CAMERA_STATE);
    this.clampTargets();
  }

  getMinimapViewport(): { uCenter: number; uWidth: number } {
    const uCenter = xToU(this.current.targetX);
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const visibleH = 2 * Math.tan(vFov * 0.5) * this.current.distance;
    const visibleW = visibleH * this.camera.aspect;
    const uWidth = THREE.MathUtils.clamp(visibleW / SCROLL_LENGTH, 0.02, 0.42);
    return { uCenter, uWidth };
  }

  update(dt: number, isSoftwareGl = false): void {
    // Keyboard continuous navigation
    const panRate = this.current.distance * 0.85 * dt;
    if (this.keysDown.has('ArrowLeft')) this.target.targetX -= panRate;
    if (this.keysDown.has('ArrowRight')) this.target.targetX += panRate;
    if (this.keysDown.has('ArrowUp')) this.target.targetZ -= panRate;
    if (this.keysDown.has('ArrowDown')) this.target.targetZ += panRate;
    if (this.keysDown.has('+') || this.keysDown.has('=')) this.target.distance *= Math.exp(-1.4 * dt);
    if (this.keysDown.has('-') || this.keysDown.has('_')) this.target.distance *= Math.exp(1.4 * dt);
    this.clampTargets();

    const alpha = isSoftwareGl ? 1 : 1 - Math.exp(-11 * dt);
    this.current.targetX = THREE.MathUtils.lerp(this.current.targetX, this.target.targetX, alpha);
    this.current.targetZ = THREE.MathUtils.lerp(this.current.targetZ, this.target.targetZ, alpha);
    this.current.distance = THREE.MathUtils.lerp(this.current.distance, this.target.distance, alpha);
    this.current.pitch = THREE.MathUtils.lerp(this.current.pitch, this.target.pitch, alpha);
    this.current.azimuth = THREE.MathUtils.lerp(this.current.azimuth, this.target.azimuth, alpha);

    this.applyCameraToThree();
  }

  private applyCameraToThree(): void {
    const { targetX, targetZ, distance, pitch, azimuth } = this.current;
    // Lower look-at Y slightly when zoomed close to street so faces & shopfronts fill frame
    const targetY = THREE.MathUtils.lerp(1.15, 2.1, this.getZoomNorm());
    const horizDist = Math.cos(pitch) * distance;
    const camY = targetY + Math.sin(pitch) * distance;
    const camX = targetX + Math.sin(azimuth) * horizDist;
    const camZ = targetZ + Math.cos(azimuth) * horizDist;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(targetX, targetY, targetZ);
  }

  dispose(): void {
    this.listeners.forEach((off) => off());
    this.listeners = [];
  }
}
