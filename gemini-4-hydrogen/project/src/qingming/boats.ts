import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { buildArchedAwningGeometry } from './primitives';
import { riverCenterZ, WATER_LEVEL } from './world';

export interface AnimatedBoat {
  group: THREE.Group;
  baseX: number;
  baseZ: number;
  baseYaw: number;
  phase: number;
  isMoving: boolean;
  driftSpeed: number;
  driftRange: number;
  oars: { pivot: THREE.Group; side: number }[];
  rudderPivot?: THREE.Group;
  mastPivot?: THREE.Group;
  mastAnimated?: boolean;
}

export interface BoatSystem {
  boats: AnimatedBoat[];
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Builds a Song-dynasty upswept Bian River hull (两头上翘船身) with curved sheer & keel.
 */
function buildSongHullGeometry(length: number, beam: number, depth: number): THREE.BufferGeometry {
  const segL = 14;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Cross-section profile: bottom-left, chine-left, gunwale-left, gunwale-right, chine-right, bottom-right
  for (let i = 0; i <= segL; i++) {
    const t = i / segL; // 0 = stern, 1 = bow
    const z = (t - 0.5) * length;
    // Narrow to bow/stern
    const widthScale = Math.sin(Math.pow(t, 0.85) * Math.PI);
    const w = Math.max(0.14, widthScale) * (beam / 2);
    // Both bow and stern curve dramatically upward (两头上翘)
    const endDist = Math.abs(t - 0.5) * 2; // 0 midship .. 1 tips
    const sheerRise = Math.pow(endDist, 2.2) * depth * 1.15;
    const keelRise = Math.pow(endDist, 2.6) * depth * 0.95;

    const ring: [number, number][] = [
      [-w * 0.55, -depth * 0.45 + keelRise],
      [-w * 0.92, 0.0 + keelRise * 0.5],
      [-w, depth * 0.55 + sheerRise],
      [w, depth * 0.55 + sheerRise],
      [w * 0.92, 0.0 + keelRise * 0.5],
      [w * 0.55, -depth * 0.45 + keelRise],
    ];
    for (let k = 0; k < ring.length; k++) {
      positions.push(ring[k][0], ring[k][1], z);
      uvs.push(t * 3, k / 5);
    }
  }

  const ringStride = 6;
  for (let i = 0; i < segL; i++) {
    for (let k = 0; k < ringStride - 1; k++) {
      const a = i * ringStride + k;
      const b = a + 1;
      const c = a + ringStride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface BoatSpec {
  x: number;
  zOffset?: number;
  z?: number;
  yaw?: number;
  length?: number;
  beam?: number;
  kind?: 'barge' | 'ferry' | 'skiff';
  mastState?: 'raised' | 'lowering' | 'lowered' | 'none';
  isMoving?: boolean;
  driftSpeed?: number;
  driftRange?: number;
}

export function createBoatSystem(parent: THREE.Object3D, mats: MaterialLibrary, specs: BoatSpec[]): BoatSystem {
  const disposables: THREE.BufferGeometry[] = [];
  const boats: AnimatedBoat[] = [];

  // Shared geometries for oars, rudder, fenders, cargo sacks
  const oarGeo = new THREE.CylinderGeometry(0.04, 0.07, 4.4, 6);
  oarGeo.rotateX(Math.PI / 2);
  oarGeo.translate(0, 0, 1.9);
  const rudderBladeGeo = new THREE.BoxGeometry(0.12, 1.15, 2.4);
  const fenderGeo = new THREE.TorusGeometry(0.24, 0.09, 6, 12);
  fenderGeo.rotateY(Math.PI / 2);
  const sackGeo = new THREE.SphereGeometry(0.32, 7, 6);
  sackGeo.scale(1.2, 0.65, 0.9);
  disposables.push(oarGeo, rudderBladeGeo, fenderGeo, sackGeo);

  specs.forEach((sp, idx) => {
    const kind = sp.kind ?? 'barge';
    const length = sp.length ?? (kind === 'barge' ? 13.5 : kind === 'ferry' ? 8.5 : 6.2);
    const beam = sp.beam ?? (kind === 'barge' ? 3.4 : kind === 'ferry' ? 2.3 : 1.7);
    const depth = kind === 'barge' ? 1.25 : 0.85;

    const group = new THREE.Group();
    const bx = sp.x;
    const bz = sp.z ?? riverCenterZ(bx) + (sp.zOffset ?? 0);
    const yaw = sp.yaw ?? Math.PI * 0.44;
    group.position.set(bx, WATER_LEVEL + 0.16, bz);
    group.rotation.y = yaw;

    // 1. Upswept Song hull
    const hullGeo = buildSongHullGeometry(length, beam, depth);
    disposables.push(hullGeo);
    const hullMesh = new THREE.Mesh(hullGeo, mats.hullWood);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    group.add(hullMesh);

    // 2. Deck planks & gunwale rails
    const deckGeo = new THREE.BoxGeometry(beam * 0.78, 0.12, length * 0.76);
    disposables.push(deckGeo);
    const deck = new THREE.Mesh(deckGeo, mats.timberWarm);
    deck.position.y = depth * 0.36;
    deck.receiveShadow = true;
    group.add(deck);

    // Woven rope fenders along outer hull (exact painting detail!)
    if (kind === 'barge') {
      for (const side of [-1, 1]) {
        for (const fz of [-length * 0.22, 0, length * 0.22]) {
          const fender = new THREE.Mesh(fenderGeo, mats.ropeMat);
          fender.position.set(side * (beam * 0.49), depth * 0.28, fz);
          group.add(fender);
        }
      }
    }

    // 3. Arched bamboo-mat awning (拱形席篷) — NO SAILS anywhere!
    const awnLen = kind === 'barge' ? length * 0.46 : length * 0.4;
    const awnH = kind === 'barge' ? 1.55 : 1.05;
    const awnGeo = buildArchedAwningGeometry(beam * 0.86, awnLen, awnH, 0.06);
    disposables.push(awnGeo);
    const awning = new THREE.Mesh(awnGeo, mats.bambooMat);
    awning.position.set(0, depth * 0.4, -length * 0.04);
    awning.castShadow = true;
    awning.receiveShadow = true;
    group.add(awning);

    // Dark interior shadow block inside awning
    const darkCabinGeo = new THREE.BoxGeometry(beam * 0.72, awnH * 0.65, awnLen * 0.9);
    disposables.push(darkCabinGeo);
    const darkCabin = new THREE.Mesh(darkCabinGeo, mats.timberDark);
    darkCabin.position.set(0, depth * 0.4 + awnH * 0.34, -length * 0.04);
    group.add(darkCabin);

    // Cargo sacks / crates on foredeck
    if (kind === 'barge') {
      for (let s = 0; s < 5; s++) {
        const sack = new THREE.Mesh(sackGeo, mats.clothOchre);
        sack.position.set(((s % 2) - 0.5) * 0.85, depth * 0.52 + Math.floor(s / 3) * 0.28, length * 0.24 + (s % 3) * 0.45);
        sack.castShadow = true;
        group.add(sack);
      }
    }

    // 4. Stern Rudder House (舵楼) & Giant Balanced Stern Rudder (大舵)
    let rudderPivot: THREE.Group | undefined;
    if (kind !== 'skiff') {
      const rhW = beam * 0.68;
      const rhH = kind === 'barge' ? 1.35 : 0.95;
      const rhL = length * 0.16;
      const rhGeo = new THREE.BoxGeometry(rhW, rhH, rhL);
      disposables.push(rhGeo);
      const rudderHouse = new THREE.Mesh(rhGeo, mats.timberWarm);
      rudderHouse.position.set(0, depth * 0.55 + rhH / 2, -length * 0.34);
      rudderHouse.castShadow = true;
      group.add(rudderHouse);

      const latGeo = new THREE.BoxGeometry(rhW + 0.05, rhH * 0.5, rhL * 0.6);
      disposables.push(latGeo);
      const lat = new THREE.Mesh(latGeo, mats.latticeWindow);
      lat.position.set(0, depth * 0.55 + rhH * 0.56, -length * 0.34);
      group.add(lat);

      rudderPivot = new THREE.Group();
      rudderPivot.position.set(0, depth * 0.55, -length * 0.45);
      const rudderPostGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.35, 6);
      disposables.push(rudderPostGeo);
      const rudderPost = new THREE.Mesh(rudderPostGeo, mats.timberDark);
      rudderPost.position.set(0, -0.25, -0.25);
      rudderPivot.add(rudderPost);
      const blade = new THREE.Mesh(rudderBladeGeo, mats.timberDark);
      blade.position.set(0, -0.45, -1.32);
      blade.castShadow = true;
      rudderPivot.add(blade);
      // Tiller beam
      const tillerGeo = new THREE.CylinderGeometry(0.05, 0.06, 2.2, 6);
      tillerGeo.rotateX(Math.PI / 2);
      disposables.push(tillerGeo);
      const tiller = new THREE.Mesh(tillerGeo, mats.timberBridge);
      tiller.position.set(0, 0.35, 0.7);
      rudderPivot.add(tiller);
      group.add(rudderPivot);
    }

    // 5. Foldable A-frame Mast (可放倒的人字桅) — NO SAILS!
    let mastPivot: THREE.Group | undefined;
    const mastState = sp.mastState ?? (kind === 'barge' ? 'raised' : 'none');
    if (mastState !== 'none') {
      mastPivot = new THREE.Group();
      mastPivot.position.set(0, depth * 0.48, length * 0.2);
      const mastH = length * 0.58;
      const legGeo = new THREE.CylinderGeometry(0.06, 0.1, mastH, 7);
      disposables.push(legGeo);
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo, mats.timberDark);
        leg.position.set(side * 0.38, mastH * 0.48, 0);
        leg.rotation.z = side * 0.11;
        leg.castShadow = true;
        mastPivot.add(leg);
      }
      // Masthead crosspiece & stay rope (no sail cloth)
      const capGeo = new THREE.BoxGeometry(0.5, 0.14, 0.14);
      disposables.push(capGeo);
      const cap = new THREE.Mesh(capGeo, mats.timberWarm);
      cap.position.set(0, mastH * 0.94, 0);
      mastPivot.add(cap);

      const stayGeo = new THREE.CylinderGeometry(0.02, 0.02, mastH * 1.05, 4);
      disposables.push(stayGeo);
      const stay = new THREE.Mesh(stayGeo, mats.ropeMat);
      stay.position.set(0, mastH * 0.48, -mastH * 0.24);
      stay.rotation.x = 0.45;
      mastPivot.add(stay);

      if (mastState === 'lowered') {
        mastPivot.rotation.x = -1.25; // folded back over awning
      } else if (mastState === 'lowering') {
        mastPivot.rotation.x = -0.82;
      } else {
        mastPivot.rotation.x = -0.06;
      }
      group.add(mastPivot);
    }

    // 6. Side Sculling Oars (摇橹)
    const oars: { pivot: THREE.Group; side: number }[] = [];
    const oarSides = kind === 'skiff' ? [1] : [-1, 1];
    for (const side of oarSides) {
      const oPivot = new THREE.Group();
      oPivot.position.set(side * (beam * 0.45), depth * 0.52, -length * 0.18);
      const oarMesh = new THREE.Mesh(oarGeo, mats.timberBridge);
      oarMesh.rotation.x = 0.24;
      oarMesh.rotation.y = side * 0.25;
      oPivot.add(oarMesh);
      group.add(oPivot);
      oars.push({ pivot: oPivot, side });
    }

    parent.add(group);
    boats.push({
      group,
      baseX: bx,
      baseZ: bz,
      baseYaw: yaw,
      phase: idx * 1.13,
      isMoving: sp.isMoving ?? false,
      driftSpeed: sp.driftSpeed ?? 0.35,
      driftRange: sp.driftRange ?? 6.5,
      oars,
      rudderPivot,
      mastPivot,
      mastAnimated: mastState === 'lowering',
    });
  });

  return {
    boats,
    update: (elapsed: number) => {
      for (const b of boats) {
        // Gentle water heave, pitch & roll
        const heave = Math.sin(elapsed * 1.3 + b.phase) * 0.07;
        const pitch = Math.sin(elapsed * 0.95 + b.phase * 1.3) * 0.022;
        const roll = Math.cos(elapsed * 1.15 + b.phase * 0.7) * 0.028;

        b.group.position.y = WATER_LEVEL + 0.16 + heave;
        b.group.rotation.x = pitch;
        b.group.rotation.z = roll;

        // Subtle forward-back drift for moving vessels (ferries, skiffs, approaching barge)
        if (b.isMoving) {
          const offset = Math.sin(elapsed * b.driftSpeed + b.phase) * b.driftRange;
          b.group.position.x = b.baseX + Math.sin(b.baseYaw) * offset;
          b.group.position.z = b.baseZ + Math.cos(b.baseYaw) * offset;
        }

        // Sculling oar sweep (摇橹)
        for (const oar of b.oars) {
          const rate = b.isMoving ? 2.4 : 0.85;
          const amp = b.isMoving ? 0.34 : 0.1;
          oar.pivot.rotation.y = Math.sin(elapsed * rate + b.phase + oar.side) * amp;
          oar.pivot.rotation.x = Math.cos(elapsed * rate + b.phase) * (amp * 0.45);
        }

        // Stern rudder gentle steering
        if (b.rudderPivot) {
          b.rudderPivot.rotation.y = Math.sin(elapsed * 0.7 + b.phase) * 0.12;
        }

        // Dramatic bridge-passing barge actively tilting its A-frame mast (放倒人字桅)!
        if (b.mastPivot && b.mastAnimated) {
          b.mastPivot.rotation.x = -0.92 + Math.sin(elapsed * 0.55) * 0.28;
        }
      }
    },
    dispose: () => {
      disposables.forEach((g) => g.dispose());
    },
  };
}
