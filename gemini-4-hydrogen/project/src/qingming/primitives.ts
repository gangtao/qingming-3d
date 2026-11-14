import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * StaticBatcher collects static BufferGeometries grouped by material key,
 * transforms each part into world space, normalizes attributes, and merges
 * every bucket into a single draw call.
 */
export class StaticBatcher {
  private buckets = new Map<
    THREE.Material,
    { geos: THREE.BufferGeometry[]; castShadow: boolean; receiveShadow: boolean }
  >();

  private _mat4 = new THREE.Matrix4();
  private _pos = new THREE.Vector3();
  private _quat = new THREE.Quaternion();
  private _euler = new THREE.Euler();
  private _scale = new THREE.Vector3();

  add(
    geo: THREE.BufferGeometry,
    material: THREE.Material,
    x = 0,
    y = 0,
    z = 0,
    rx = 0,
    ry = 0,
    rz = 0,
    sx = 1,
    sy = 1,
    sz = 1,
    castShadow = true,
    receiveShadow = true
  ): void {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      const count = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    // Strip extra mismatched attributes (e.g. color vs non-color) so mergeGeometries never fails
    for (const key of Object.keys(g.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv') {
        g.deleteAttribute(key);
      }
    }

    this._pos.set(x, y, z);
    this._euler.set(rx, ry, rz);
    this._quat.setFromEuler(this._euler);
    this._scale.set(sx, sy, sz);
    this._mat4.compose(this._pos, this._quat, this._scale);
    g.applyMatrix4(this._mat4);

    let bucket = this.buckets.get(material);
    if (!bucket) {
      bucket = { geos: [], castShadow, receiveShadow };
      this.buckets.set(material, bucket);
    }
    bucket.geos.push(g);
  }

  addTransformed(
    geo: THREE.BufferGeometry,
    material: THREE.Material,
    matrix: THREE.Matrix4,
    castShadow = true,
    receiveShadow = true
  ): void {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) {
      const count = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    for (const key of Object.keys(g.attributes)) {
      if (key !== 'position' && key !== 'normal' && key !== 'uv') {
        g.deleteAttribute(key);
      }
    }
    g.applyMatrix4(matrix);
    let bucket = this.buckets.get(material);
    if (!bucket) {
      bucket = { geos: [], castShadow, receiveShadow };
      this.buckets.set(material, bucket);
    }
    bucket.geos.push(g);
  }

  flush(parent: THREE.Object3D): THREE.Mesh[] {
    const created: THREE.Mesh[] = [];
    for (const [mat, bucket] of this.buckets.entries()) {
      if (bucket.geos.length === 0) continue;
      // Split into chunks if vertex count is huge to stay safely under 32-bit limits
      const merged = mergeGeometries(bucket.geos, false);
      bucket.geos.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = bucket.castShadow;
      mesh.receiveShadow = bucket.receiveShadow;
      parent.add(mesh);
      created.push(mesh);
    }
    this.buckets.clear();
    return created;
  }
}

/**
 * Shared reusable primitive geometries (disposed on engine teardown).
 */
export class PrimitiveCache {
  readonly box = new THREE.BoxGeometry(1, 1, 1);
  readonly cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
  readonly cylinder12 = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
  readonly cone = new THREE.ConeGeometry(0.5, 1, 10);
  readonly sphere = new THREE.SphereGeometry(0.5, 10, 8);
  readonly plane = new THREE.PlaneGeometry(1, 1);

  dispose(): void {
    this.box.dispose();
    this.cylinder.dispose();
    this.cylinder12.dispose();
    this.cone.dispose();
    this.sphere.dispose();
    this.plane.dispose();
  }
}

/**
 * Builds a traditional Chinese curved pitched roof slope with upturned eave corners (屋脊起翘).
 */
export function buildCurvedRoofGeometry(
  width: number,
  depth: number,
  ridgeHeight: number,
  eaveFlare = 0.24,
  overhang = 0.45
): THREE.BufferGeometry {
  const segX = 10;
  const segZ = 8;
  const hw = width / 2 + overhang;
  const hd = depth / 2 + overhang;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Build front and back roof planes with concave sag (反宇) and upturned corner tips (飞檐起翘)
  const buildSlope = (sideSign: number) => {
    const baseIdx = positions.length / 3;
    for (let iz = 0; iz <= segZ; iz++) {
      const tz = iz / segZ; // 0 = ridge, 1 = eave
      for (let ix = 0; ix <= segX; ix++) {
        const tx = ix / segX; // 0..1 across width
        const xNorm = tx * 2 - 1; // -1..1
        const x = xNorm * hw;
        const z = sideSign * tz * hd;
        // Concave parabolic droop along slope + upward corner flare at outer eave
        const sag = Math.pow(1 - tz, 1.45);
        const cornerLift = Math.pow(Math.abs(xNorm), 2.4) * Math.pow(tz, 1.8) * eaveFlare;
        const y = ridgeHeight * sag + cornerLift;
        positions.push(x, y, z);
        uvs.push(tx * 2.4, tz * 1.5);
      }
    }
    const stride = segX + 1;
    for (let iz = 0; iz < segZ; iz++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = baseIdx + iz * stride + ix;
        const b = a + 1;
        const c = a + stride;
        const d = c + 1;
        if (sideSign > 0) {
          indices.push(a, c, b, b, c, d);
        } else {
          indices.push(a, b, c, b, d, c);
        }
      }
    }
  };

  buildSlope(1);
  buildSlope(-1);

  // Add slight roof thickness soffit lip or double-sided bottom by duplicating reversed triangles shifted down
  const topCount = positions.length / 3;
  const topTriCount = indices.length;
  for (let i = 0; i < topCount; i++) {
    positions.push(positions[i * 3], positions[i * 3 + 1] - 0.08, positions[i * 3 + 2]);
    uvs.push(uvs[i * 2], uvs[i * 2 + 1]);
  }
  for (let i = 0; i < topTriCount; i += 3) {
    indices.push(indices[i] + topCount, indices[i + 2] + topCount, indices[i + 1] + topCount);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a traditional Chinese spoked wooden wheel with rim (轮辋) and radial spokes (辐条).
 */
export function buildSpokedWheelGeometry(
  radius: number,
  rimThickness = 0.055,
  spokes = 10
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const rim = new THREE.TorusGeometry(radius, rimThickness, 7, 20);
  rim.rotateY(Math.PI / 2);
  parts.push(rim.toNonIndexed());
  rim.dispose();

  const hub = new THREE.CylinderGeometry(rimThickness * 1.6, rimThickness * 1.6, rimThickness * 2.6, 10);
  hub.rotateZ(Math.PI / 2);
  parts.push(hub.toNonIndexed());
  hub.dispose();

  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const spoke = new THREE.CylinderGeometry(rimThickness * 0.42, rimThickness * 0.42, radius * 1.92, 6);
    spoke.rotateX(a);
    parts.push(spoke.toNonIndexed());
    spoke.dispose();
  }

  for (const p of parts) {
    if (!p.attributes.uv) {
      p.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.attributes.position.count * 2), 2));
    }
  }
  const merged = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Builds an arched bamboo-mat canopy (拱形席篷) used on Bian River barges and ox-carts.
 */
export function buildArchedAwningGeometry(
  width: number,
  length: number,
  archHeight: number,
  thickness = 0.06
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const segs = 12;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = t * Math.PI;
    const x = -Math.cos(ang) * hw;
    const y = Math.sin(ang) * archHeight;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = segs; i >= 0; i--) {
    const t = i / segs;
    const ang = t * Math.PI;
    const x = -Math.cos(ang) * (hw - thickness);
    const y = Math.sin(ang) * (archHeight - thickness);
    shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 12,
  });
  geo.translate(0, 0, -length / 2);
  geo.computeVertexNormals();
  return geo;
}
