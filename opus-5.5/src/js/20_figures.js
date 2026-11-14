// ============================================================
// 20_figures.js — 人物、牲口、车、轿
// 每类模型做成一个实例化网格；动作在顶点着色器里按部位（aPart）分段旋转，
// 一个绘制调用就能画出几百个各自走动、挑担、喝茶、摇橹的人。
// ============================================================

// ---------- 着色器公共函数 ----------
const RIG_COMMON = `
uniform float uTime;
mat3 RX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 RY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 RZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
void rotP(inout vec3 p, inout vec3 n, vec3 pv, mat3 R){ p = R*(p-pv)+pv; n = R*n; }
bool isP(float a, float b){ return abs(a-b)<0.5; }
`;

// 人物动作编号
const ACT = {
  idle: 0, walk: 1, porter: 2, sit: 3, track: 4, scull: 5, punt: 6, ride: 7, bear: 8, rail: 9,
  push: 10, work: 11, backCarry: 12, lift: 13, wave: 14, squat: 15, lead: 16, shoulder: 17, pull: 18
};

const HUMAN_POSE = `
attribute float aPart; attribute float aTint; attribute float aOpt;
attribute vec4 iAnim; attribute vec3 iColA; attribute vec3 iColB; attribute vec2 iFlags;
void humanPose(inout vec3 p, inout vec3 n){
  float act = iAnim.x, t = uTime*iAnim.z + iAnim.y, v = iAnim.w;
  float s = sin(t), c = cos(t);
  float sl = uTime*0.8 + iAnim.y*2.7;
  float hipL=0.,hipR=0.,knL=0.04,knR=0.04,abHL=0.,abHR=0.;
  float shL=0.05,shR=0.05,elL=0.18,elR=0.18,abL=0.06,abR=0.06;
  float lean=0.,twist=0.,hP=0.,hY=0.,bob=0.,poleB=0.,bsw=0.,skA=0.,skS=1.;
  bool walking = (act>0.5&&act<2.5)||isP(act,4.)||isP(act,8.)||isP(act,10.)||isP(act,12.)||isP(act,16.)||isP(act,17.);
  if(walking){
    float A = isP(act,1.)||isP(act,16.) ? 0.42 : 0.34;
    hipL = A*s; hipR = -A*s;
    knL = 0.08+0.65*max(0.,c); knR = 0.08+0.65*max(0.,-c);
    shL = -0.32*s; shR = 0.32*s;
    elL = 0.25+0.12*max(0.,-s); elR = 0.25+0.12*max(0.,s);
    bob = 0.035*c*c - 0.02; lean = 0.05;
    hY = 0.18*sin(sl*0.3)*step(0.3,sin(sl*0.11));
  }
  if(isP(act,0.)){
    hY = 0.6*sin(sl*0.37)*smoothstep(-0.2,0.8,sin(sl*0.13));
    hP = 0.06*sin(sl*0.5);
    shL = 0.05+0.04*sin(sl); shR = 0.05+0.04*sin(sl*1.1+1.);
    elL = 0.2; elR = 0.2; lean = 0.02*sin(sl*0.4); bob = 0.004*sin(sl*1.3);
    if(v>0.5&&v<1.5){ shR = 0.5+0.25*sin(sl*1.9); elR = 1.1+0.4*sin(sl*2.7); abR = 0.15; hY = 0.3*sin(sl*0.9); }
    else if(v>1.5&&v<2.5){ shL=0.45; shR=0.45; elL=1.35; elR=1.35; abL=-0.28; abR=-0.28; }
    else if(v>2.5){ shR = 1.4+0.12*sin(sl*2.); elR = 0.1; hP = -0.15; }
  } else if(isP(act,1.)){
    if(v>0.5&&v<1.5){ shL=0.45; shR=0.45; elL=1.35; elR=1.35; abL=-0.28; abR=-0.28; }
    else if(v>1.5){ shR = 0.5+0.1*s; elR = 0.6; }
  } else if(isP(act,2.)){
    lean = 0.12; shR = 0.9; elR = 2.0; abR = 0.1; elL = 0.3;
    bob = 0.04*c*c - 0.03; poleB = 0.045*sin(2.*t); bsw = 0.13*s;
  } else if(isP(act,3.)){
    hipL=1.57; hipR=1.57; knL=1.5; knR=1.5; bob=-0.42; skA=1.2; skS=0.55;
    shL=0.55; shR=0.55; elL=0.9; elR=0.9; lean = 0.1+0.04*sin(sl*0.7);
    if(v<0.5){ float k = smoothstep(0.55,0.95,sin(sl*0.6)); shR = 0.55+0.65*k; elR = 0.9+1.35*k; hP = -0.15*k; }
    else if(v<1.5){ shR = 0.6+0.3*sin(sl*2.1)*step(0.,sin(sl*0.5)); elR = 1.0+0.3*sin(sl*1.7); hY = 0.5*sin(sl*0.31); }
    else { hP = 0.35; shL = 0.7+0.15*sin(sl*2.3); shR = 0.7+0.15*sin(sl*2.9); elL=1.1; elR=1.1; hY=0.15*sin(sl*0.2); }
  } else if(isP(act,4.)){
    lean = 0.55; shL=0.25; shR=0.25; elL=1.7; elR=1.7; abL=-0.2; abR=-0.2; hP=-0.35;
    knL += 0.15; knR += 0.15;
  } else if(isP(act,5.)){
    hipL=0.28; hipR=-0.2; knL=0.25; knR=0.1;
    lean = 0.18+0.14*s; twist = 0.22*s; shL = 1.0+0.35*s; shR = 1.0+0.35*s; elL = 0.6-0.4*s; elR = 0.6-0.4*s;
    abL=-0.15; abR=-0.15; bob = -0.03+0.02*s;
  } else if(isP(act,6.)){
    float k = 0.5+0.5*s;
    lean = 0.25+0.35*k; shL = 1.3+0.6*c; shR = 1.1+0.6*c; elL=0.5; elR=0.4; hipL = 0.35*k; hipR=-0.2; knL=0.3*k; bob=-0.05*k;
  } else if(isP(act,7.)){
    hipL=1.15; hipR=1.15; abHL=0.42; abHR=0.42; knL=0.95; knR=0.95;
    bob = 0.025*sin(2.*t); shL=0.6; shR=0.6; elL=0.9; elR=0.9; abL=-0.1; abR=-0.1; lean = 0.06+0.03*sin(2.*t);
    skA=1.0; skS=0.6;
    if(v>0.5){ shR = 0.3; elR=0.3; abR=0.15; }
  } else if(isP(act,8.)){
    shR = 0.3; abR = 0.35; elR = 2.4; lean = 0.1; elL = 0.3;
  } else if(isP(act,9.)){
    lean = 0.42+0.04*sin(sl*0.5); shL=1.05; shR=1.05; elL=0.85; elR=0.85; abL=-0.1; abR=-0.1;
    hP = -0.25+0.1*sin(sl*0.7); hY = 0.45*sin(sl*0.23); hipL=-0.05; hipR=-0.05;
    if(v>0.5){ shR = 1.9+0.25*sin(sl*3.); elR = 0.15; hP = -0.35; }
  } else if(isP(act,10.)){
    lean = 0.3; shL=0.75; shR=0.75; elL=0.25; elR=0.25; abL=-0.1; abR=-0.1; hP=-0.2;
  } else if(isP(act,11.)){
    lean = 0.2; shL = 0.7+0.2*sin(t); shR = 0.7+0.2*sin(t+2.); elL = 1.0+0.4*sin(t*1.3); elR = 1.0+0.4*sin(t*1.1+1.);
    hP = 0.25; hY = 0.2*sin(sl*0.4);
  } else if(isP(act,12.)){
    shL=0.25; shR=0.25; elL=1.7; elR=1.7; abL=-0.15; abR=-0.15; lean=0.18;
  } else if(isP(act,13.)){
    float k = 0.5+0.5*s;
    lean = 0.95*k; hipL=0.35*k; hipR=0.35*k; knL=0.55*k; knR=0.55*k; bob=-0.14*k;
    shL = 0.6+0.7*k; shR = 0.6+0.7*k; elL=0.3; elR=0.3; hP=-0.4*k;
  } else if(isP(act,14.)){
    shL = 2.5+0.35*sin(t*2.); shR = 2.3+0.35*sin(t*2.+1.3); elL=0.3; elR=0.3; abL=0.3; abR=0.3; hP=-0.2; lean=-0.05;
    bob = 0.02*abs(sin(t*2.));
  } else if(isP(act,15.)){
    hipL=1.9; hipR=1.9; knL=2.5; knR=2.5; bob=-0.6; lean=0.3; shL=0.9; shR=0.9; elL=0.6; elR=0.6; skA=1.4; skS=0.4;
    hY = 0.4*sin(sl*0.3);
  } else if(isP(act,16.)){
    shR = 0.75; elR = 0.4; abR = 0.05;
  } else if(isP(act,17.)){
    shL = 0.2; abL = 0.3; elL = 2.6; lean = 0.15;
  } else if(isP(act,18.)){
    lean = 0.2+0.25*s; shL = 1.3-0.6*s; shR = 1.3-0.6*s; elL=0.3; elR=0.3; hipL=0.3; knL=0.3; hP=-0.2;
  }
  float pr = aPart;
  if(isP(pr,4.)) rotP(p,n,vec3(0.205,1.12,0.),RX(-elL));
  if(isP(pr,3.)||isP(pr,4.)) rotP(p,n,vec3(0.19,1.36,0.),RZ(abL)*RX(-shL));
  if(isP(pr,6.)) rotP(p,n,vec3(-0.205,1.12,0.),RX(-elR));
  if(isP(pr,5.)||isP(pr,6.)) rotP(p,n,vec3(-0.19,1.36,0.),RZ(-abR)*RX(-shR));
  if(isP(pr,8.)) rotP(p,n,vec3(0.09,0.47,0.),RX(knL));
  if(isP(pr,7.)||isP(pr,8.)) rotP(p,n,vec3(0.09,0.9,0.),RZ(abHL)*RX(-hipL));
  if(isP(pr,10.)) rotP(p,n,vec3(-0.09,0.47,0.),RX(knR));
  if(isP(pr,9.)||isP(pr,10.)) rotP(p,n,vec3(-0.09,0.9,0.),RZ(-abHR)*RX(-hipR));
  if(isP(pr,2.)) rotP(p,n,vec3(0.,1.46,0.),RY(hY)*RX(hP));
  if(isP(pr,13.)) rotP(p,n,vec3(-0.21,1.47,0.8),RX(bsw));
  if(isP(pr,14.)) rotP(p,n,vec3(-0.21,1.47,-0.8),RX(bsw*0.8));
  if(pr>11.5) p.y += poleB;
  if(isP(pr,11.)){ p.y = (p.y-0.9)*skS+0.9; rotP(p,n,vec3(0.,0.9,0.),RX(skA + 0.06*sin(t)*(walking?1.:0.))); }
  if((pr>0.5&&pr<6.5)||pr>11.5) rotP(p,n,vec3(0.,0.9,0.),RY(twist)*RX(lean));
  p.y += bob;
  if(aOpt>0.5 && iFlags.x<0.5) p = vec3(0.,-20.,0.);
}
`;

const ANIMAL_POSE = `
attribute float aPart; attribute float aTint; attribute vec3 aPiv; attribute vec3 aPiv2;
attribute vec4 iAnim; attribute vec3 iColA;
void animalPose(inout vec3 p, inout vec3 n){
  float act = iAnim.x, t = uTime*iAnim.z + iAnim.y, v = iAnim.w;
  float s = sin(t), c = cos(t);
  float sl = uTime*0.6 + iAnim.y*3.;
  float nod = 0., turn = 0., bob = 0.;
  float tail = 0.35*sin(uTime*1.9+iAnim.y*5.)*smoothstep(0.,0.6,sin(sl*0.7));
  float A = 0.;
  if(act<0.5){
    nod = 0.15 + 0.45*smoothstep(0.2,0.9,sin(sl*0.35)) + 0.05*sin(sl*3.);
    turn = 0.25*sin(sl*0.27);
  } else {
    A = act>1.5 ? 0.3 : 0.38;
    nod = 0.08*sin(2.*t) + (act>1.5 ? 0.25 : 0.05);
    bob = 0.025*cos(2.*t);
  }
  float pr = aPart;
  if(pr>2.5 && pr<10.5 && A>0.){
    float ph = (isP(pr,3.)||isP(pr,7.)||isP(pr,6.)||isP(pr,10.)) ? 1. : -1.;
    float sw = A*s*ph; float cw = c*ph;
    if(pr>6.5){ rotP(p,n,aPiv,RX(0.75*max(0.,cw))); rotP(p,n,aPiv2,RX(-sw)); }
    else rotP(p,n,aPiv,RX(-sw));
  }
  if(isP(pr,1.)) rotP(p,n,aPiv,RY(turn)*RX(nod));
  if(isP(pr,2.)) rotP(p,n,aPiv,RZ(tail)*RX(0.1*sin(sl*2.)));
  p.y += bob;
}
`;

function rigMaterial(kind, opts) {
  const m = new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true }, opts || {}));
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    const pose = kind === 'human' ? HUMAN_POSE : ANIMAL_POSE;
    const fn = kind === 'human' ? 'humanPose' : 'animalPose';
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + RIG_COMMON + pose)
      .replace('#include <beginnormal_vertex>', `vec3 objectNormal = vec3(normal); vec3 posedP = vec3(position); ${fn}(posedP, objectNormal);`)
      .replace('#include <begin_vertex>', 'vec3 transformed = posedP;')
      .replace('#include <color_vertex>', kind === 'human'
        ? 'vColor = color; if(aTint>0.5&&aTint<1.5) vColor *= iColA; else if(aTint>1.5) vColor *= iColB;'
        : 'vColor = color; if(aTint>0.5) vColor *= iColA;');
  };
  m.customProgramCacheKey = () => 'rig-' + kind + (opts && opts.map ? '-map' : '');
  return m;
}

// ---------- 人物几何 ----------
const HATTR = { aPart: 1, aTint: 1, aOpt: 1 };
function limb(B, a, b, ra, rb, color, attrs, seg, open) {
  const k = Math.round((rb / ra) * 10) / 10;
  const geo = gTaper(0.5 * k, 0.5, seg || 6, open !== false);
  const m = cylBetween(a, b).multiply(new THREE.Matrix4().makeScale(2 * ra, 1, 2 * ra));
  B.add(geo, m, color, attrs);
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const WHITE = 0xffffff;

function buildHumanBody(kind) {
  const B = new GeoBuilder(HATTR);
  const robe = kind === 'robe';
  const pa = (part, tint, opt) => ({ aPart: part, aTint: tint || 0, aOpt: opt || 0 });
  // 影子
  B.add(gCyl(10), M(0, 0.012, 0, 0, 0, 0, 0.55, 0.01, 0.42), 0x9b8662, pa(0));
  // 鞋
  for (const sx of [1, -1]) {
    const part = sx > 0 ? 8 : 10;
    B.add(gBox(), M(0.09 * sx, 0.035, 0.035, 0, 0, 0, 0.09, 0.07, 0.22), 0x2a241e, pa(part));
    // 小腿、裹腿
    limb(B, V(0.09 * sx, 0.07, 0), V(0.09 * sx, 0.48, 0), 0.05, 0.058, robe ? 0xe8e0d0 : WHITE, pa(part, robe ? 0 : 2));
    if (!robe) limb(B, V(0.09 * sx, 0.09, 0), V(0.09 * sx, 0.33, 0), 0.056, 0.06, 0xd9cfbb, pa(part));
    // 大腿
    limb(B, V(0.09 * sx, 0.46, 0), V(0.09 * sx, 0.92, 0), 0.06, 0.075, WHITE, pa(sx > 0 ? 7 : 9, 2));
  }
  // 胯
  B.add(gSphere(8, 5), M(0, 0.9, 0, 0, 0, 0, 0.3, 0.2, 0.2), WHITE, pa(0, 2));
  // 躯干
  B.add(gTaper(0.5, 0.42, 8, false), M(0, 1.14, 0, 0, 0, 0, 0.38, 0.52, 0.24), WHITE, pa(1, 1));
  B.add(gSphere(8, 5), M(0, 1.37, 0, 0, 0, 0, 0.42, 0.14, 0.25), WHITE, pa(1, 1));
  if (robe) {
    B.add(gTaper(0.33, 0.5, 10, true), M(0, 0.5, 0, 0, 0, 0, 0.58, 0.9, 0.46), 0xf4f0e8, pa(11, 1));
    B.add(gTaper(0.5, 0.5, 10, true), M(0, 0.07, 0, 0, 0, 0, 0.585, 0.04, 0.465), 0xcfc8bc, pa(11, 1)); // 下摆缘
    B.add(gCyl(8, true), M(0, 0.93, 0, 0, 0, 0, 0.345, 0.05, 0.25), 0x3a332b, pa(1)); // 腰带
  } else {
    B.add(gTaper(0.39, 0.5, 8, true), M(0, 0.77, 0, 0, 0, 0, 0.44, 0.32, 0.32), 0xf2eee6, pa(1, 1)); // 短衣下摆
    B.add(gCyl(8, true), M(0, 0.93, 0, 0, 0, 0, 0.345, 0.05, 0.25), WHITE, pa(1, 2)); // 腰带
  }
  // 交领：白色内领与深色领缘
  B.add(gBox(), M(0.035, 1.28, 0.114, 0, 0, 0.62, 0.035, 0.24, 0.012), 0xeee8da, pa(1));
  B.add(gBox(), M(-0.035, 1.28, 0.116, 0, 0, -0.62, 0.035, 0.24, 0.012), 0x2f2a24, pa(1));
  // 颈
  limb(B, V(0, 1.38, 0), V(0, 1.5, 0), 0.045, 0.045, PAL.skin, pa(1));
  // 头
  B.add(gSphere(8, 6), M(0, 1.575, 0.005, 0, 0, 0, 0.19, 0.22, 0.2), PAL.skin, pa(2));
  B.add(gHemi(8, 4), M(0, 1.588, -0.016, -0.5, 0, 0, 0.206, 0.17, 0.215), PAL.hair, pa(2));
  B.add(gSphere(6, 4), M(0, 1.705, -0.02, 0, 0, 0, 0.1, 0.09, 0.1), PAL.hair, pa(2)); // 发髻
  // 五官
  for (const sx of [1, -1]) {
    B.add(gBox(), M(0.04 * sx, 1.587, 0.097, 0, 0, 0, 0.032, 0.013, 0.01), 0x17120f, pa(2));
    B.add(gBox(), M(0.04 * sx, 1.61, 0.095, 0, 0, -0.18 * sx, 0.042, 0.009, 0.01), 0x221c17, pa(2));
    B.add(gSphere(5, 4), M(0.098 * sx, 1.57, 0, 0, 0, 0, 0.03, 0.06, 0.045), 0xcfa57c, pa(2));
  }
  B.add(gBox(), M(0, 1.562, 0.102, -0.2, 0, 0, 0.024, 0.045, 0.03), 0xcca27a, pa(2));
  B.add(gBox(), M(0, 1.527, 0.096, 0, 0, 0, 0.042, 0.009, 0.01), 0x7a4636, pa(2));
  // 胡须（可选）
  B.add(gCone(6), M(0, 1.47, 0.07, Math.PI - 0.2, 0, 0, 0.08, 0.11, 0.05), PAL.hair, pa(2, 0, 1));
  B.add(gBox(), M(0, 1.538, 0.1, 0, 0, 0, 0.07, 0.012, 0.012), PAL.hair, pa(2, 0, 1));
  // 手臂
  for (const sx of [1, -1]) {
    const up = sx > 0 ? 3 : 5, lo = sx > 0 ? 4 : 6;
    limb(B, V(0.19 * sx, 1.38, 0), V(0.205 * sx, 1.11, 0), 0.055, 0.05, WHITE, pa(up, 1));
    limb(B, V(0.205 * sx, 1.13, 0), V(0.21 * sx, 0.9, 0), 0.047, 0.042, WHITE, pa(lo, 1));
    if (robe) {
      // 宽袖
      B.add(gTaper(0.32, 0.5, 8, true), M(0.21 * sx, 1.0, 0, 0, 0, 0, 0.21, 0.26, 0.2), 0xf4f0e8, pa(lo, 1));
    } else {
      limb(B, V(0.21 * sx, 0.93, 0), V(0.21 * sx, 0.9, 0), 0.05, 0.05, 0xe7dfcf, pa(lo)); // 袖口
    }
    B.add(gSphere(6, 4), M(0.21 * sx, 0.86, 0.01, 0, 0, 0, 0.075, 0.09, 0.06), PAL.skin, pa(lo));
  }
  return B.build();
}

function buildHat(kind) {
  const B = new GeoBuilder(HATTR);
  const pa = { aPart: 2, aTint: 0 };
  const blk = 0x1c1814;
  if (kind === 'futou' || kind === 'futouWing') {
    B.add(gHemi(10, 4), M(0, 1.625, -0.005, -0.18, 0, 0, 0.232, 0.2, 0.24), blk, pa);
    B.add(gBox(), M(0, 1.71, -0.03, 0, 0, 0, 0.14, 0.1, 0.12), blk, pa);
    B.add(gSphere(6, 4), M(0, 1.755, -0.03, 0, 0, 0, 0.14, 0.06, 0.12), blk, pa);
    if (kind === 'futouWing') {
      B.add(gBox(), M(0, 1.68, -0.1, 0, 0, 0, 0.82, 0.018, 0.03), blk, pa);
    } else {
      for (const sx of [1, -1]) B.add(gBox(), M(0.045 * sx, 1.53, -0.115, 0.12, 0, 0.1 * sx, 0.035, 0.24, 0.01), blk, pa);
    }
  } else if (kind === 'douli') {
    B.add(gCone(14), M(0, 1.73, 0, 0, 0, 0, 0.66, 0.17, 0.66), 0xb49b6b, pa);
    B.add(gTaper(0.5, 0.5, 14, true), M(0, 1.645, 0, 0, 0, 0, 0.665, 0.015, 0.665), 0x7d6845, pa);
    B.add(gSphere(6, 4), M(0, 1.82, 0, 0, 0, 0, 0.05, 0.05, 0.05), 0x7d6845, pa);
    B.add(gHemi(8, 3), M(0, 1.62, 0, 0, 0, 0, 0.22, 0.12, 0.22), 0xa58c5c, pa);
  } else if (kind === 'kerchief') {
    B.add(gHemi(10, 4), M(0, 1.615, -0.01, -0.3, 0, 0, 0.228, 0.2, 0.238), WHITE, { aPart: 2, aTint: 2 });
    B.add(gSphere(6, 4), M(0, 1.66, -0.12, 0, 0, 0, 0.09, 0.07, 0.07), WHITE, { aPart: 2, aTint: 2 });
  }
  return B.build();
}

function buildProp(kind) {
  const B = new GeoBuilder(HATTR);
  const bam = 0x8a7148, wood = 0x6b5034;
  if (kind === 'pole') {
    B.add(gBox(), M(-0.21, 1.47, 0, 0, 0, 0, 0.045, 0.04, 1.9), wood, { aPart: 12 });
    for (const [zz, part] of [[0.8, 13], [-0.8, 14]]) {
      const pr = { aPart: part };
      B.add(gTaper(0.5, 0.42, 10, true), M(-0.21, 0.55, zz, 0, 0, 0, 0.42, 0.28, 0.42), bam, pr);
      B.add(gCyl(10), M(-0.21, 0.42, zz, 0, 0, 0, 0.35, 0.02, 0.35), bam, pr);
      B.add(gSphere(7, 4), M(-0.21, 0.69, zz, 0, 0, 0, 0.38, 0.16, 0.38), RNG.pick([0xcdbf9e, 0x9a8a5a, 0xb7a074, 0x8f8a6a]), pr);
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI * 2;
        const ax = -0.21 + Math.cos(a) * 0.19, az = zz + Math.sin(a) * 0.19;
        limb(B, V(ax, 0.68, az), V(-0.21, 1.46, zz), 0.006, 0.006, 0x5a4a38, pr, 3);
      }
    }
  } else if (kind === 'backBasket') {
    B.add(gTaper(0.5, 0.36, 10, true), M(0, 1.12, -0.24, 0.15, 0, 0, 0.4, 0.55, 0.36), bam, { aPart: 1 });
    B.add(gSphere(7, 4), M(0, 1.38, -0.27, 0, 0, 0, 0.36, 0.16, 0.32), 0x6f6a48, { aPart: 1 });
    for (const sx of [1, -1]) limb(B, V(0.11 * sx, 1.38, 0.08), V(0.12 * sx, 1.0, -0.12), 0.012, 0.012, 0x4a3b2c, { aPart: 1 }, 3);
  } else if (kind === 'bundle') {
    B.add(gSphere(8, 5), M(0, 1.2, -0.2, 0, 0, 0, 0.36, 0.26, 0.2), WHITE, { aPart: 1, aTint: 2 });
    B.add(gBox(), M(0, 1.28, 0.02, 0.7, 0, 0.0, 0.03, 0.3, 0.012), 0x4a3b2c, { aPart: 1 });
  } else if (kind === 'sack') {
    B.add(gSphere(8, 5), M(0.05, 1.53, -0.04, 0, 0, 0.25, 0.62, 0.26, 0.32), 0xd8cdb2, { aPart: 1 });
  } else if (kind === 'cup') {
    B.add(gTaper(0.5, 0.4, 7, false), M(-0.21, 0.84, 0.06, 0, 0, 0, 0.06, 0.06, 0.06), 0xe9e3d4, { aPart: 6 });
  } else if (kind === 'stick') {
    limb(B, V(-0.21, 0.15, 0.04), V(-0.21, 1.7, 0.06), 0.016, 0.014, wood, { aPart: 6 }, 4);
  } else if (kind === 'punt') {
    limb(B, V(-0.21, -2.2, 0.35), V(-0.21, 2.6, -0.3), 0.025, 0.02, 0x7a6040, { aPart: 6 }, 4);
  } else if (kind === 'rope') {
    limb(B, V(0.15, 1.42, 0.05), V(0.35, 1.0, -0.9), 0.012, 0.012, 0x5d4c38, { aPart: 1 }, 3);
    B.add(gBox(), M(0.0, 1.35, 0.12, 0, 0, 0.7, 0.05, 0.5, 0.02), 0x5d4c38, { aPart: 1 });
  } else if (kind === 'fan') {
    B.add(gCyl(8), M(-0.21, 0.98, 0.1, 0, 0, 0, 0.22, 0.01, 0.24), 0xe0d6c0, { aPart: 6 });
  }
  return B.build();
}

// ---------- 牲口几何 ----------
const AATTR = { aPart: 1, aTint: 1, aPiv: 3, aPiv2: 3 };
function buildAnimal(sp) {
  const B = new GeoBuilder(AATTR);
  const s = sp.scale || 1;
  const T = (part, tint, piv, piv2) => ({ aPart: part, aTint: tint ? 1 : 0, aPiv: piv ? [piv.x, piv.y, piv.z] : [0, 0, 0], aPiv2: piv2 ? [piv2.x, piv2.y, piv2.z] : [0, 0, 0] });
  const by = sp.bodyY * s, bl = sp.bodyL * s, bw = sp.bodyW * s, bh = sp.bodyH * s;
  const legTop = by - bh * 0.25, knee = sp.knee * s;
  // 影子
  B.add(gCyl(10), M(0, 0.012, 0, 0, 0, 0, bw * 1.8, 0.01, bl * 1.3), 0x9b8662, T(0));
  // 身躯：胸、腹、臀
  B.add(gSphere(10, 7), M(0, by, 0, 0, 0, 0, bw, bh, bl), WHITE, T(0, 1));
  B.add(gSphere(9, 6), M(0, by + bh * 0.04, bl * 0.3, 0, 0, 0, bw * 0.95, bh * 1.0, bl * 0.42), WHITE, T(0, 1));
  B.add(gSphere(9, 6), M(0, by + bh * 0.05, -bl * 0.32, 0, 0, 0, bw * 1.04, bh * 1.04, bl * 0.46), WHITE, T(0, 1));
  if (sp.belly) B.add(gSphere(8, 5), M(0, by - bh * 0.22, 0, 0, 0, 0, bw * 0.8, bh * 0.55, bl * 0.7), sp.belly, T(0));
  if (sp.hump) B.add(gSphere(8, 5), M(0, by + bh * 0.42, bl * 0.28, 0, 0, 0, bw * 0.7, bh * 0.5, bl * 0.3), WHITE, T(0, 1));
  if (sp.humps) for (const zz of [0.22, -0.18]) {
    B.add(gSphere(8, 6), M(0, by + bh * 0.55, bl * zz, 0, 0, 0, bw * 0.62, bh * 0.75, bl * 0.28), WHITE, T(0, 1));
    B.add(gSphere(7, 5), M(0, by + bh * 0.86, bl * zz, 0, 0, 0, bw * 0.45, bh * 0.3, bl * 0.2), sp.shag, T(0));
  }
  // 颈与头（部位 1，以颈根为轴）
  const nb = V(0, by + bh * 0.15, bl * 0.42);
  const nkPts = sp.neck.map((p) => V(p[0] * s, p[1] * s, p[2] * s));
  let prev = nb;
  for (let i = 0; i < nkPts.length; i++) {
    const r0 = (sp.neckR[0] + (sp.neckR[1] - sp.neckR[0]) * i / nkPts.length) * s;
    const r1 = (sp.neckR[0] + (sp.neckR[1] - sp.neckR[0]) * (i + 1) / nkPts.length) * s;
    limb(B, prev, nkPts[i], r0, r1, WHITE, T(1, 1, nb), 8, true);
    B.add(gSphere(7, 5), M(nkPts[i].x, nkPts[i].y, nkPts[i].z, 0, 0, 0, r1 * 2, r1 * 2, r1 * 2), WHITE, T(1, 1, nb));
    prev = nkPts[i];
  }
  const hp = nkPts[nkPts.length - 1];
  const hd = sp.head; // [len, w, h, pitch]
  const hc = V(hp.x, hp.y - Math.sin(hd[3]) * hd[0] * 0.35 * s, hp.z + Math.cos(hd[3]) * hd[0] * 0.35 * s);
  B.add(gSphere(8, 6), M(hc.x, hc.y, hc.z, hd[3], 0, 0, hd[1] * s, hd[2] * s, hd[0] * s), WHITE, T(1, 1, nb));
  const mz = V(hp.x, hp.y - Math.sin(hd[3]) * hd[0] * 0.75 * s, hp.z + Math.cos(hd[3]) * hd[0] * 0.75 * s);
  B.add(gSphere(7, 5), M(mz.x, mz.y, mz.z, hd[3], 0, 0, hd[1] * 0.85 * s, hd[2] * 0.8 * s, hd[0] * 0.35 * s), sp.muzzle || WHITE, T(1, !sp.muzzle, nb));
  // 眼
  for (const sx of [1, -1]) {
    const e = V(sx * hd[1] * 0.42 * s, hc.y + hd[2] * 0.18 * s, hc.z - hd[0] * 0.05 * s);
    B.add(gSphere(5, 4), M(e.x, e.y, e.z, 0, 0, 0, 0.035 * s, 0.035 * s, 0.035 * s), 0x15110e, T(1, 0, nb));
    // 耳
    if (sp.ears) {
      const ea = V(sx * hd[1] * 0.3 * s, hp.y + hd[2] * 0.35 * s, hp.z - 0.02 * s);
      B.add(gCone(5), M(ea.x + sx * sp.ears[1] * 0.3 * s, ea.y + sp.ears[0] * 0.45 * s, ea.z, -0.35, 0, -0.35 * sx, sp.ears[1] * s, sp.ears[0] * s, sp.ears[1] * 0.6 * s), WHITE, T(1, 1, nb));
    }
    if (sp.horns) {
      const hb = V(sx * hd[1] * 0.38 * s, hp.y + hd[2] * 0.35 * s, hp.z + 0.02 * s);
      const ht = V(sx * (hd[1] * 0.38 + 0.2) * s, hb.y + 0.12 * s, hb.z - 0.05 * s);
      const ht2 = V(sx * (hd[1] * 0.38 + 0.26) * s, hb.y + 0.28 * s, hb.z + 0.04 * s);
      limb(B, hb, ht, 0.04 * s, 0.03 * s, 0xd8ccb0, T(1, 0, nb), 5);
      limb(B, ht, ht2, 0.03 * s, 0.008 * s, 0xd8ccb0, T(1, 0, nb), 5);
    }
  }
  // 鬃
  if (sp.mane) {
    let a = nb.clone().add(V(0, bh * 0.35, -0.05 * s));
    for (const p of nkPts) {
      const b = p.clone().add(V(0, sp.neckR[1] * s * 0.9, -0.02 * s));
      limb(B, a, b, 0.035 * s, 0.03 * s, sp.mane, T(1, 0, nb), 4);
      a = b;
    }
  }
  if (sp.shag) {
    limb(B, nb.clone().add(V(0, -0.1 * s, 0.05 * s)), nkPts[0].clone().add(V(0, -0.12 * s, 0)), sp.neckR[0] * s * 1.15, sp.neckR[1] * s * 1.2, sp.shag, T(1, 0, nb), 6);
  }
  // 腿（3..6 上段，7..10 下段）
  const lx = bw * 0.32, fz = bl * 0.33, hz = -bl * 0.36;
  const legs = [[lx, fz, 3, 7], [-lx, fz, 4, 8], [lx, hz, 5, 9], [-lx, hz, 6, 10]];
  for (const [x, z, up, lo] of legs) {
    const top = V(x, legTop, z), kn = V(x, knee, z + (z > 0 ? 0.02 : -0.03) * s);
    const ft = V(x, 0.06 * s, z);
    limb(B, top.clone().add(V(0, 0.08 * s, 0)), kn, sp.legR[0] * s, sp.legR[1] * s, WHITE, T(up, 1, top), 6);
    limb(B, kn, ft, sp.legR[1] * s, sp.legR[2] * s, sp.leg2 || WHITE, T(lo, !sp.leg2, kn, top), 6);
    B.add(gSphere(6, 4), M(kn.x, kn.y, kn.z, 0, 0, 0, sp.legR[1] * 2.1 * s, sp.legR[1] * 2.1 * s, sp.legR[1] * 2.1 * s), sp.leg2 || WHITE, T(lo, !sp.leg2, kn, top));
    B.add(gTaper(0.45, 0.55, 6, false), M(ft.x, 0.035 * s, ft.z + 0.01 * s, 0, 0, 0, sp.legR[2] * 2.4 * s, 0.07 * s, sp.legR[2] * 2.6 * s), sp.hoof || 0x2a231d, T(lo, 0, kn, top));
  }
  // 尾
  const tr = V(0, by + bh * 0.2, -bl * 0.52);
  const tl = sp.tail; // [len, r, tuftcolor]
  const te = V(0, tr.y - tl[0] * s, tr.z - 0.1 * s);
  limb(B, tr, te, tl[1] * s, tl[1] * 0.6 * s, tl[3] ? WHITE : tl[2], T(2, !!tl[3], tr), 4);
  B.add(gSphere(6, 4), M(te.x, te.y, te.z, 0, 0, 0, tl[1] * 3 * s, tl[1] * 6 * s, tl[1] * 3 * s), tl[2], T(2, 0, tr));
  const geo = B.build();
  geo.userData = { saddleY: by + bh * 0.5, legTop, bodyL: bl };
  return geo;
}

const SPECIES = {
  donkey: { bodyY: 0.86, bodyL: 1.05, bodyW: 0.38, bodyH: 0.42, knee: 0.42, neck: [[0, 1.13, 0.6], [0, 1.27, 0.7]], neckR: [0.12, 0.09], head: [0.46, 0.18, 0.21, 0.75], ears: [0.26, 0.06], legR: [0.065, 0.045, 0.036], tail: [0.42, 0.022, 0x2a241e], mane: 0x3a322a, muzzle: 0xc8bba4, belly: 0xb9ab95 },
  horse: { scale: 1.22, bodyY: 0.95, bodyL: 1.2, bodyW: 0.38, bodyH: 0.44, knee: 0.46, neck: [[0, 1.2, 0.6], [0, 1.38, 0.72]], neckR: [0.13, 0.09], head: [0.5, 0.16, 0.2, 0.9], ears: [0.12, 0.05], legR: [0.07, 0.045, 0.035], tail: [0.62, 0.05, 0x2a221a], mane: 0x2a221a },
  ox: { bodyY: 0.98, bodyL: 1.55, bodyW: 0.62, bodyH: 0.66, knee: 0.44, neck: [[0, 1.02, 0.88], [0, 0.98, 1.0]], neckR: [0.22, 0.17], head: [0.5, 0.3, 0.32, 1.05], ears: [0.1, 0.08], horns: true, hump: true, legR: [0.1, 0.07, 0.055], tail: [0.62, 0.03, 0x2b241c, 1], muzzle: 0x5c5046, belly: 0xc2ad8c },
  camel: { bodyY: 1.6, bodyL: 1.45, bodyW: 0.52, bodyH: 0.62, knee: 0.78, neck: [[0, 1.42, 1.0], [0, 1.6, 1.22], [0, 1.95, 1.32]], neckR: [0.16, 0.1], head: [0.46, 0.18, 0.2, 0.25], ears: [0.08, 0.04], humps: true, shag: 0x6d5a40, legR: [0.1, 0.06, 0.05], leg2: 0x9d8a6a, tail: [0.42, 0.03, 0x4a3c2c], muzzle: 0x9a8a70 },
  pig: { bodyY: 0.4, bodyL: 0.82, bodyW: 0.42, bodyH: 0.42, knee: 0.18, neck: [[0, 0.44, 0.44]], neckR: [0.17, 0.15], head: [0.3, 0.24, 0.24, 0.35], ears: [0.1, 0.09], legR: [0.06, 0.05, 0.04], tail: [0.12, 0.015, 0x2a2420], muzzle: 0x6a5850 },
  dog: { bodyY: 0.38, bodyL: 0.62, bodyW: 0.2, bodyH: 0.24, knee: 0.2, neck: [[0, 0.5, 0.36], [0, 0.56, 0.42]], neckR: [0.07, 0.06], head: [0.24, 0.13, 0.13, 0.25], ears: [0.09, 0.04], legR: [0.04, 0.03, 0.025], tail: [-0.2, 0.02, 0xb8a888], muzzle: 0x2a2420 }
};
const ANIMAL_COLORS = {
  donkey: [0x7b6e60, 0x6a5e52, 0x8c7f70, 0x5b524a, 0x9a8c7a],
  horse: [0x8a6a4a, 0x5a4636, 0xb7aa96, 0x6e5440, 0xd2c8b6, 0x3e342c],
  ox: [0xb39672, 0x9b7c58, 0xc4a985, 0x8a6f52],
  camel: [0xb59c78, 0xa48c6a],
  pig: [0x3e3833, 0x504741],
  dog: [0xc2ae8c, 0x8c7860, 0xe0d4be]
};

// 牲口配件：鞍、驮包
function buildAnimalGear(kind) {
  const B = new GeoBuilder(AATTR);
  const T = { aPart: 0 };
  if (kind === 'donkeySaddle' || kind === 'horseSaddle') {
    const s = kind === 'horseSaddle' ? 1.22 : 1;
    const sp = kind === 'horseSaddle' ? SPECIES.horse : SPECIES.donkey;
    const y = (sp.bodyY + sp.bodyH * 0.48) * s;
    B.add(gBox(), M(0, y - 0.02, -0.02, 0, 0, 0, sp.bodyW * s * 1.25, 0.03, 0.5 * s), 0x6b3e2e, T); // 鞍鞯
    B.add(gBox(), M(0, y + 0.04, -0.02, 0, 0, 0, sp.bodyW * s * 0.8, 0.08, 0.38 * s), 0x3a2c22, T);
    B.add(gBox(), M(0, y + 0.1, 0.16 * s, 0, 0, 0, sp.bodyW * s * 0.7, 0.1, 0.05), 0x3a2c22, T);
    for (const sx of [1, -1]) {
      B.add(gBox(), M(sx * sp.bodyW * s * 0.62, y - 0.18 * s, 0, 0, 0, 0, 0.012, 0.36 * s, 0.03), 0x3a2c22, T);
      B.add(gBox(), M(sx * sp.bodyW * s * 0.62, y - 0.38 * s, 0, 0, 0, 0, 0.05, 0.02, 0.1), 0x2a2420, T);
    }
  } else if (kind === 'donkeyPack') {
    const sp = SPECIES.donkey, y = sp.bodyY + sp.bodyH * 0.5;
    B.add(gBox(), M(0, y + 0.02, 0, 0, 0, 0, 0.42, 0.06, 0.5), 0x5a4632, T);
    for (const sx of [1, -1]) {
      B.add(gSphere(8, 6), M(sx * 0.3, y - 0.05, -0.02, 0, 0, sx * 0.15, 0.3, 0.46, 0.62), 0x3b3530, T); // 炭包
      B.add(gBox(), M(sx * 0.3, y + 0.0, -0.02, 0, 0, sx * 0.15, 0.31, 0.03, 0.64), 0x6a5a44, T);
    }
    B.add(gSphere(7, 4), M(0, y + 0.14, 0, 0, 0, 0, 0.38, 0.18, 0.55), 0x2e2925, T);
  } else if (kind === 'camelPack') {
    const sp = SPECIES.camel, y = sp.bodyY + sp.bodyH * 0.75;
    for (const zz of [0.32, -0.28]) B.add(gBox(), M(0, y + 0.2, zz, 0, 0, 0, 0.9, 0.06, 0.08), 0x5a4632, T);
    for (const sx of [1, -1]) {
      B.add(gBox(), M(sx * 0.45, y - 0.05, 0.02, 0, 0, 0, 0.3, 0.5, 0.9), 0xc9bc9c, T);
      B.add(gBox(), M(sx * 0.46, y - 0.05, 0.02, 0, 0, 0, 0.31, 0.04, 0.92), 0x5a4632, T);
      B.add(gBox(), M(sx * 0.46, y - 0.05, 0.02, 0, 0, 0, 0.31, 0.52, 0.04), 0x5a4632, T);
    }
    B.add(gSphere(7, 4), M(0, y + 0.32, 0.02, 0, 0, 0, 0.6, 0.25, 0.7), 0x8a7a5e, T);
  }
  return B.build();
}

// ---------- 车、轿 ----------
function buildWheel() {
  const B = new GeoBuilder();
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, a2 = (i + 1) / n * Math.PI * 2;
    const p1 = V(0, Math.cos(a) * 0.93, Math.sin(a) * 0.93), p2 = V(0, Math.cos(a2) * 0.93, Math.sin(a2) * 0.93);
    const m = cylBetween(p1, p2).multiply(new THREE.Matrix4().makeScale(0.12, 1.03, 0.14));
    B.add(gBox(), m, 0x4e3a28); // 轮辋
    B.add(gBox(), M(0, Math.cos(a) * 0.47, Math.sin(a) * 0.47, a, 0, 0, 0.05, 0.9, 0.045), 0x5d4630); // 辐条
  }
  B.add(gCyl(10), M(0, 0, 0, 0, 0, Math.PI / 2, 0.26, 0.3, 0.26), 0x3c2c20); // 毂
  B.add(gCyl(8), M(0, 0, 0, 0, 0, Math.PI / 2, 0.12, 0.42, 0.12), 0x2a2018);
  return B.build();
}

function buildCartBody(kind) {
  const B = new GeoBuilder();
  const cu = [0.12, 0.12];
  const wood = 0x5f4630, wood2 = 0x725842;
  if (kind === 'oxCart') {
    // 太平车：长车厢，上覆拱形席篷
    B.add(gBox(), M(0, 1.02, 0, 0, 0, 0, 1.75, 0.12, 4.2), wood, null, cu);
    for (const sx of [1, -1]) {
      B.add(gBox(), M(sx * 0.86, 1.32, 0, 0, 0, 0, 0.06, 0.5, 4.1), wood2, null, cu);
      for (let k = -4; k <= 4; k++) B.add(gBox(), M(sx * 0.88, 1.32, k * 0.48, 0, 0, 0, 0.05, 0.56, 0.05), wood, null, cu);
      // 车辕
      B.add(gBox(), M(sx * 0.42, 0.98, 3.1, 0.1, 0, 0, 0.09, 0.09, 2.6), wood, null, cu);
    }
    B.add(gBox(), M(0, 0.86, 4.25, 0, 0, 0, 1.2, 0.1, 0.12), wood, null, cu); // 轭横木
    const vault = new THREE.CylinderGeometry(0.95, 0.95, 3.7, 14, 1, true, -Math.PI / 2, Math.PI).toNonIndexed();
    B.add(vault, M(0, 1.55, -0.1, -Math.PI / 2, 0, 0, 1, 1, 1), 0xe8dcc0);
    B.add(gBox(), M(0, 1.15, 0, 0, 0, 0, 1.0, 0.25, 3.0), 0x8a7a5a, null, cu); // 货
    // 篷两端垂帘
    for (const zz of [1.75, -1.95]) B.add(new THREE.CircleGeometry(0.95, 12, 0, Math.PI).toNonIndexed(), M(0, 1.55, zz, 0, zz > 0 ? 0 : Math.PI, 0, 1, 1, 1), 0xcbbd9a);
  } else if (kind === 'barrow') {
    // 独轮车：两根长把，中间大轮，上置货，覆席
    for (const sx of [1, -1]) {
      B.add(gBox(), M(sx * 0.32, 0.72, -0.2, -0.12, 0, 0, 0.07, 0.07, 2.6), wood, null, cu);
      B.add(gBox(), M(sx * 0.3, 0.38, 0.05, 0, 0, 0, 0.05, 0.6, 0.05), wood, null, cu);
    }
    B.add(gBox(), M(0, 0.82, 0.1, 0, 0, 0, 0.76, 0.06, 1.3), wood2, null, cu);
    B.add(gBox(), M(0, 1.05, 0.1, 0, 0, 0, 0.7, 0.4, 1.1), 0xbfae88, null, cu);
    const vault = new THREE.CylinderGeometry(0.42, 0.42, 1.25, 10, 1, true, -Math.PI / 2, Math.PI).toNonIndexed();
    B.add(vault, M(0, 1.22, 0.1, -Math.PI / 2, 0, 0, 1, 1, 1), 0xe0d3b5);
  } else if (kind === 'handCart') {
    B.add(gBox(), M(0, 0.95, 0, 0, 0, 0, 1.3, 0.1, 2.6), wood, null, cu);
    for (const sx of [1, -1]) B.add(gBox(), M(sx * 0.32, 0.9, 2.0, 0.12, 0, 0, 0.07, 0.07, 2.0), wood, null, cu);
    // 酒桶、麻袋
    for (const zz of [-0.7, 0.1]) B.add(gCyl(10), M(0, 1.38, zz, Math.PI / 2, 0, 0, 0.75, 0.7, 0.75), 0x8a6a48, null, cu);
    B.add(gSphere(8, 5), M(0, 1.15, 0.9, 0, 0, 0, 0.9, 0.4, 0.6), 0xcfc2a2, null, cu);
  }
  return B.build();
}

function buildSedan() {
  const B = new GeoBuilder();
  const cu = [0.06, 0.06];
  const dark = 0x3e2e22, red = 0x6a3a2a;
  // 轿厢：四面格子窗
  B.add(gBox(), M(0, 0.86, 0, 0, 0, 0, 0.82, 1.08, 1.0), 0x4d3a2a, null, cu);
  for (const sx of [1, -1]) {
    const pl = gPlane();
    B.add(pl, M(sx * 0.415, 0.98, 0, 0, sx * Math.PI / 2, 0, 0.7, 0.5, 1), 0xd8cfb8, null);
  }
  B.add(gPlane(), M(0, 0.95, 0.505, 0, 0, 0, 0.6, 0.75, 1), 0xb7a888, null, [0.5, 0.06]); // 门帘
  B.add(gBox(), M(0, 0.35, 0, 0, 0, 0, 0.9, 0.08, 1.08), dark, null, cu);
  // 轿顶：四坡，檐口起翘
  B.add(gCone(4), M(0, 1.6, 0, 0, Math.PI / 4, 0, 1.45, 0.36, 1.6), red, null, cu);
  B.add(gBox(), M(0, 1.43, 0, 0, 0, 0, 1.06, 0.04, 1.2), dark, null, cu);
  B.add(gSphere(6, 4), M(0, 1.82, 0, 0, 0, 0, 0.1, 0.12, 0.1), 0x8a7040, null, cu);
  // 轿杠
  for (const sx of [1, -1]) B.add(gCyl(6), M(sx * 0.5, 1.42, 0, Math.PI / 2, 0, 0, 0.07, 3.6, 0.07), 0x5f4630, null, cu);
  B.add(gBox(), M(0, 1.42, 1.65, 0, 0, 0, 1.1, 0.06, 0.06), 0x5f4630, null, cu);
  B.add(gBox(), M(0, 1.42, -1.65, 0, 0, 0, 1.1, 0.06, 0.06), 0x5f4630, null, cu);
  // 清明插柳：轿顶的柳枝
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2;
    limb(B, V(0, 1.75, 0), V(Math.cos(a) * 0.55, 2.25 + (k % 3) * 0.1, Math.sin(a) * 0.5), 0.012, 0.008, 0x6b6a40, null, 3);
  }
  return B.build();
}

// ---------- 注册与实例化 ----------
const FIG = {
  people: [], animals: [], carts: [], sedans: [],
  movers: [], attachments: [], meshes: {}, wheelSlots: []
};

const HATS = ['futou', 'futouWing', 'douli', 'kerchief'];
const PROPS = ['pole', 'backBasket', 'bundle', 'sack', 'cup', 'stick', 'punt', 'rope', 'fan'];

// spec: { x, z, y, yaw, act, body:'robe'|'short', hat, prop, colA, colB, beard, speed, phase, variant }
function addPerson(spec) {
  const r = RNG;
  const p = Object.assign({
    body: r() < 0.45 ? 'robe' : 'short',
    act: ACT.idle, variant: 0, phase: r() * 20, gait: 0,
    yaw: 0, x: 0, z: 0, y: null
  }, spec);
  if (p.hat === undefined) {
    const k = r();
    p.hat = p.body === 'robe' ? (k < 0.75 ? 'futou' : k < 0.85 ? 'futouWing' : null) : (k < 0.35 ? null : k < 0.6 ? 'kerchief' : k < 0.85 ? 'futou' : 'douli');
  }
  if (p.colA == null) p.colA = p.body === 'robe' ? r.pick(CLOTH.slice(0, 12)) : r.pick(CLOTH);
  if (p.colB == null) p.colB = r.pick(CLOTH_DARK.concat([0xb8aa8a, 0xd5c9ae]));
  if (p.beard == null) p.beard = r() < 0.35;
  if (!p.gait) p.gait = p.act === ACT.walk ? 5.6 : p.act === ACT.porter ? 7.2 : p.act === ACT.track ? 3.6 : 4 + r() * 1.5;
  p.kind = 'person';
  p.id = FIG.people.length;
  FIG.people.push(p);
  return p;
}

function addAnimal(spec) {
  const p = Object.assign({ species: 'donkey', act: 0, phase: RNG() * 20, gait: 4.5, yaw: 0, x: 0, z: 0, gear: null }, spec);
  if (p.color == null) p.color = RNG.pick(ANIMAL_COLORS[p.species]);
  p.kind = 'animal';
  FIG.animals.push(p);
  return p;
}
function addCart(spec) {
  const p = Object.assign({ type: 'oxCart', yaw: 0, x: 0, z: 0, wheelAngle: 0 }, spec);
  p.kind = 'cart';
  FIG.carts.push(p);
  return p;
}
function addSedan(spec) {
  const p = Object.assign({ yaw: 0, x: 0, z: 0 }, spec);
  p.kind = 'sedan';
  FIG.sedans.push(p);
  return p;
}

// 移动者：沿路径往返，带一串成员（轿夫、牛车、骑手……）
// members: [{ ent, back, lat, dy }]
function addMover(path, opts) {
  const m = Object.assign({ path, s: 0, v: 1.1, dir: 1, mode: 'pingpong', members: [], pause: 0 }, opts);
  if (m.s0 != null) m.s = m.s0 * path.total;
  FIG.movers.push(m);
  return m;
}
// 附着在船等移动物体上
function attachTo(ent, obj, local, yaw) {
  FIG.attachments.push({ ent, obj, local: local.clone ? local.clone() : V(local[0], local[1], local[2]), yaw: yaw || 0 });
}

function instAttr(geo, name, size, n) {
  const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size);
  a.setUsage(THREE.StaticDrawUsage);
  geo.setAttribute(name, a);
  return a;
}
function shareGeo(base) {
  const g = new THREE.BufferGeometry();
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

function finalizeFigures(scene) {
  const matH = rigMaterial('human');
  const matA = rigMaterial('animal');
  const C = new THREE.Color(), C2 = new THREE.Color();
  // ---- 人 ----
  const groups = {};
  const addTo = (key, p) => { (groups[key] = groups[key] || []).push(p); };
  for (const p of FIG.people) {
    p.slots = [];
    addTo('body_' + p.body, p);
    if (p.hat) addTo('hat_' + p.hat, p);
    if (p.prop) addTo('prop_' + p.prop, p);
  }
  const baseGeo = {};
  for (const key in groups) {
    const list = groups[key];
    let base = baseGeo[key];
    if (!base) {
      const [cat, name] = key.split('_');
      base = cat === 'body' ? buildHumanBody(name) : cat === 'hat' ? buildHat(name) : buildProp(name);
    }
    const g = shareGeo(base);
    const n = list.length;
    const aA = instAttr(g, 'iAnim', 4, n), cA = instAttr(g, 'iColA', 3, n), cB = instAttr(g, 'iColB', 3, n), fl = instAttr(g, 'iFlags', 2, n);
    const mesh = new THREE.InstancedMesh(g, matH, n);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    list.forEach((p, i) => {
      aA.setXYZW(i, p.act, p.phase, p.gait, p.variant);
      C.set(p.colA); C2.set(p.colB);
      cA.setXYZ(i, C.r, C.g, C.b); cB.setXYZ(i, C2.r, C2.g, C2.b);
      fl.setXY(i, p.beard ? 1 : 0, 0);
      p.slots.push([mesh, i]);
    });
    mesh.name = key;
    FIG.meshes[key] = mesh;
    scene.add(mesh);
  }
  // ---- 牲口 ----
  const ag = {};
  for (const a of FIG.animals) {
    a.slots = [];
    (ag['an_' + a.species] = ag['an_' + a.species] || []).push(a);
    if (a.gear) (ag['gear_' + a.gear] = ag['gear_' + a.gear] || []).push(a);
  }
  for (const key in ag) {
    const list = ag[key];
    const [cat, name] = key.split('_');
    const base = cat === 'an' ? buildAnimal(SPECIES[name]) : buildAnimalGear(name);
    const g = shareGeo(base);
    const n = list.length;
    const aA = instAttr(g, 'iAnim', 4, n), cA = instAttr(g, 'iColA', 3, n);
    const mesh = new THREE.InstancedMesh(g, matA, n);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    list.forEach((a, i) => {
      aA.setXYZW(i, a.act, a.phase, a.gait, 0);
      C.set(a.color); cA.setXYZ(i, C.r, C.g, C.b);
      a.slots.push([mesh, i]);
    });
    FIG.meshes[key] = mesh;
    scene.add(mesh);
  }
  // ---- 车 ----
  const cg = {};
  let wheelCount = 0;
  for (const c of FIG.carts) {
    c.slots = [];
    (cg[c.type] = cg[c.type] || []).push(c);
    c.wheels = c.type === 'barrow' ? [[0, 0.5, 0.15, 0.48]] : c.type === 'oxCart' ? [[0.98, 0.78, -0.3, 0.78], [-0.98, 0.78, -0.3, 0.78]] : [[0.75, 0.55, -0.2, 0.55], [-0.75, 0.55, -0.2, 0.55]];
    wheelCount += c.wheels.length;
  }
  const cartMat = new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.mat, side: THREE.DoubleSide });
  for (const type in cg) {
    const list = cg[type];
    const mesh = new THREE.InstancedMesh(buildCartBody(type), cartMat, list.length);
    mesh.frustumCulled = false;
    list.forEach((c, i) => c.slots.push([mesh, i]));
    FIG.meshes['cart_' + type] = mesh;
    scene.add(mesh);
  }
  if (wheelCount) {
    const wm = new THREE.InstancedMesh(buildWheel(), MAT.vc, wheelCount);
    wm.frustumCulled = false;
    FIG.meshes.wheels = wm;
    let k = 0;
    for (const c of FIG.carts) { c.wheelIdx = k; k += c.wheels.length; }
    scene.add(wm);
  }
  // ---- 轿 ----
  if (FIG.sedans.length) {
    const sm = new THREE.InstancedMesh(buildSedan(), new THREE.MeshLambertMaterial({ vertexColors: true, map: TEX.lattice }), FIG.sedans.length);
    sm.frustumCulled = false;
    FIG.sedans.forEach((s, i) => { s.slots = [[sm, i]]; });
    FIG.meshes.sedan = sm;
    scene.add(sm);
  }
  // 初始摆放
  for (const list of [FIG.people, FIG.animals, FIG.carts, FIG.sedans]) for (const e of list) {
    const y = e.y != null ? e.y : surfaceY(e.x, e.z);
    placeEntity(e, e.x, y, e.z, e.yaw);
  }
  updateFigures(0);
  for (const k in FIG.meshes) FIG.meshes[k].instanceMatrix.needsUpdate = true;
}

const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pp = new THREE.Vector3(), _ps = new THREE.Vector3(1, 1, 1), _yaxis = new THREE.Vector3(0, 1, 0);
const _wm = new THREE.Matrix4(), _wm2 = new THREE.Matrix4();
function placeEntity(e, x, y, z, yaw, extraQ) {
  e.cx = x; e.cy = y; e.cz = z; e.cyaw = yaw;
  _pq.setFromAxisAngle(_yaxis, yaw);
  if (extraQ) _pq.multiply(extraQ);
  _pp.set(x, y, z);
  const sc = e.scale || 1;
  _ps.set(sc, sc, sc);
  _pm.compose(_pp, _pq, _ps);
  if (e.slots) for (const [mesh, i] of e.slots) mesh.setMatrixAt(i, _pm);
  if (e.kind === 'cart' && FIG.meshes.wheels && e.wheels) {
    const wm = FIG.meshes.wheels;
    e.wheels.forEach((w, k) => {
      _wm.makeRotationX(e.wheelAngle * (0.78 / w[3]));
      _wm.scale(_ps.set(1, w[3], w[3]));
      _wm.setPosition(w[0], w[1], w[2]);
      _wm2.multiplyMatrices(_pm, _wm);
      wm.setMatrixAt(e.wheelIdx + k, _wm2);
    });
  }
}

// 行走面高度：地面或桥面
function surfaceY(x, z) {
  let y = groundY(x, z);
  if (WORLD.bridgeDeckY) { const b = WORLD.bridgeDeckY(x, z); if (b != null && b > y - 0.5) y = b; }
  if (WORLD.flatBridges) for (const fb of WORLD.flatBridges) if (x > fb.x0 && x < fb.x1 && z > fb.z0 && z < fb.z1) y = Math.max(y, fb.y);
  if (y < WATER_Y - 0.2 && !(WORLD.inWaterOK)) y = Math.max(y, WATER_Y);
  return y;
}

const _at = {};
function updateFigures(dt) {
  // 往返行走
  for (const m of FIG.movers) {
    if (m.pause > 0) { m.pause -= dt; }
    else {
      m.s += m.v * dt * m.dir;
      const lo = m.lo != null ? m.lo : 0, hi = m.hi != null ? m.hi : m.path.total;
      if (m.mode === 'pingpong') {
        if (m.s > hi) { m.s = hi; m.dir = -1; m.pause = m.rest || 0; }
        if (m.s < lo) { m.s = lo; m.dir = 1; m.pause = m.rest || 0; }
      } else if (m.mode === 'wrap') {
        if (m.s > m.path.total) m.s -= m.path.total;
        if (m.s < 0) m.s += m.path.total;
      }
    }
    for (const mb of m.members) {
      const s = m.s - mb.back * m.dir;
      m.path.at(m.mode === 'wrap' ? ((s % m.path.total) + m.path.total) % m.path.total : s, _at);
      const nx = -_at.dz, nz = _at.dx;
      const x = _at.x + nx * mb.lat * m.dir, z = _at.z + nz * mb.lat * m.dir;
      const yaw = Math.atan2(_at.dx * m.dir, _at.dz * m.dir);
      const e = mb.ent;
      const y = surfaceY(x, z) + (mb.dy || 0);
      if (e.kind === 'cart' && e.cx != null && m.pause <= 0) e.wheelAngle += m.v * dt;
      // 坡道上俯仰（车、轿）
      placeEntity(e, x, y, z, yaw + (mb.yaw || 0));
    }
  }
  // 船上、牲口上的附着者
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), eu = new THREE.Euler();
  for (const a of FIG.attachments) {
    a.obj.updateMatrixWorld();
    v.copy(a.local).applyMatrix4(a.obj.matrixWorld);
    a.obj.getWorldQuaternion(q);
    eu.setFromQuaternion(q, 'YXZ');
    placeEntity(a.ent, v.x, v.y, v.z, eu.y + a.yaw, a.tilt ? q : null);
  }
}

function markFiguresDirty() {
  for (const k in FIG.meshes) FIG.meshes[k].instanceMatrix.needsUpdate = true;
}
