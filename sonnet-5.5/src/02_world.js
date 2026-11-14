/* 02_world.js — 世界坐标、汴河、地形、道路 */
const ZMIN=-250,ZMAX=190,XMIN=-L/2-120,XMAX=L/2+120;
// 汴河中线 [t, z, 半宽]
const RV=[[0.245,125,0],[0.27,98,8],[0.305,72,14],[0.36,38,19],[0.43,16,18],[0.475,3,15],[0.5,0,14],[0.525,-3,15],[0.58,-14,18],[0.64,-38,18.5],[0.70,-78,14],[0.745,-130,0]];
function cr(p0,p1,p2,p3,f){return 0.5*((2*p1)+(-p0+p2)*f+(2*p0-5*p1+4*p2-p3)*f*f+(-p0+3*p1-3*p2+p3)*f*f*f)}
function riverAt(x){
  const t=XT(x);if(t<=RV[0][0]||t>=RV[RV.length-1][0])return null;
  let i=0;while(t>RV[i+1][0])i++;
  const f=(t-RV[i][0])/(RV[i+1][0]-RV[i][0]);const g=k=>RV[clamp(k,0,RV.length-1)];
  const z=cr(g(i-1)[1],g(i)[1],g(i+1)[1],g(i+2)[1],f)+Math.sin(t*95)*1.2;
  const hw=Math.max(0,cr(g(i-1)[2],g(i)[2],g(i+1)[2],g(i+2)[2],f));
  return {z,hw};
}
const POND={x:TX(0.045),z:88,a:112,b:34};
function waterSDF(x,z){
  let d=1e9;const r=riverAt(x);
  if(r&&r.hw>0.4){const t=XT(x);const ahead=riverAt(x-3),beh=riverAt(x+3);let sl=0;if(ahead&&beh)sl=(ahead.z-beh.z)/6;d=(Math.abs(z-r.z)-r.hw)/Math.sqrt(1+sl*sl)}
  const e=Math.sqrt(((x-POND.x)/POND.a)**2+((z-POND.z)/POND.b)**2);d=Math.min(d,(e-1)*POND.b*0.85);
  return d+(vnoise(x*0.08,z*0.08)-0.5)*2.5;
}
const MOUNDS=[];for(let i=0;i<26;i++){MOUNDS.push({x:TX(rr(0.01,0.26)),z:rr(-100,60),r:rr(14,40),h:rr(0.5,1.7)})}
function groundY(x,z){
  const s=waterSDF(x,z);let y=0;
  for(const m of MOUNDS){const d=Math.hypot(x-m.x,z-m.z);if(d<m.r*1.6)y+=m.h*Math.exp(-(d*d)/(m.r*m.r*0.6))}
  if(s<0)y=y*sstep(0,6,s+6)-2.4*sstep(0,3.5,-s);
  return y;
}
const WATER_Y=-0.6;
// 道路折线 [t,z]，宽度
function riverBank(t,side,off){const r=riverAt(TX(t));return r?r.z+side*(r.hw+off):0}
const ROADS=[];
{
  const southSt=[],northSt=[];
  for(let t=0.30;t<=0.66;t+=0.02){southSt.push([TX(t),riverBank(t,1,13)]);}
  for(let t=0.31;t<=0.645;t+=0.02){northSt.push([TX(t),riverBank(t,-1,13)]);}
  ROADS.push({w:7,p:[[TX(0.0),34],[TX(0.06),30],[TX(0.12),24],[TX(0.18),30],[TX(0.23),52],[TX(0.27),84],[TX(0.30),riverBank(0.30,1,13)]].concat(southSt).concat([[TX(0.7),4],[TX(0.75),4],[TX(0.82),4],[TX(1.0),4]])});
  ROADS.push({w:6,p:northSt});
  {const bz=riverAt(TX(0.5)).z,ax=[-Math.SQRT1_2,Math.SQRT1_2];ROADS.push({w:9,p:[[TX(0.5)-ax[0]*62,bz-ax[1]*62],[TX(0.5),bz],[TX(0.5)+ax[0]*62,bz+ax[1]*62]]});}   // 桥路（斜跨）
  ROADS.push({w:8,p:[[TX(0.93),-130],[TX(0.93),0],[TX(0.93),130]]});               // 十字街
  ROADS.push({w:8,p:[[TX(0.785),-100],[TX(0.785),4],[TX(0.785),90]]});
  ROADS.push({w:6,p:[[TX(0.605),-60],[TX(0.605),20]]});
  ROADS.push({w:5,p:[[TX(0.11),-40],[TX(0.12),24]]});
}
function roadDist(x,z){
  let best=1e9;
  for(const r of ROADS){const p=r.p;for(let i=0;i<p.length-1;i++){
    const ax=p[i][0],az=p[i][1],bx=p[i+1][0],bz=p[i+1][1];const dx=bx-ax,dz=bz-az;const l2=dx*dx+dz*dz||1;
    const t=clamp(((x-ax)*dx+(z-az)*dz)/l2,0,1);const d=Math.hypot(x-(ax+dx*t),z-(az+dz*t))-r.w/2;if(d<best)best=d}}
  return best;
}
const EARTH=hex(0xb6a477),ROAD=hex(0xd2c196),GRASS=hex(0xa09c70),DARK=hex(0x8f7d58),WET=hex(0x6c5a3a);
function buildTerrain(){
  const step=3.5;const nx=Math.ceil((XMAX-XMIN)/step),nz=Math.ceil((ZMAX-ZMIN)/step);
  const P=[],N=[],K=[],U=[],I=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const x=XMIN+i*step,z=ZMIN+j*step;const y=groundY(x,z);
    P.push(x,y,z);U.push(x*0.045,z*0.045);
    const s=waterSDF(x,z);
    let c=mixc(EARTH,GRASS,sstep(0.35,0.75,fbm(x*0.02+3,z*0.02)));
    c=mixc(c,DARK,sstep(0.55,0.8,fbm(x*0.06,z*0.06+9))*0.5);
    const rd=roadDist(x,z);c=mixc(c,ROAD,1-sstep(-0.5,2.5,rd));
    c=mixc(c,WET,(1-sstep(-0.5,3.0,Math.abs(s-0.8)))*0.7);
    c=mixc(c,hex(0x7a6a46),sstep(60,200,Math.abs(z+30)-60)*0.0);
    const k=0.93+fbm(x*0.3,z*0.3)*0.16;
    const fe=Math.max(sstep(-150,-240,z),sstep(110,185,z),sstep(XMAX-60,XMAX,Math.abs(x)));const fc=hex(LIGHT.fog);
    K.push(lerp(c[0]*k,fc[0],fe),lerp(c[1]*k,fc[1],fe),lerp(c[2]*k,fc[2],fe));
  }
  const hh=(i,j)=>P[(j*(nx+1)+i)*3+1];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const dx=(hh(Math.min(i+1,nx),j)-hh(Math.max(i-1,0),j))/(2*step),dz=(hh(i,Math.min(j+1,nz))-hh(i,Math.max(j-1,0)))/(2*step);
    const l=Math.hypot(dx,1,dz);N.push(-dx/l,1/l,-dz/l);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;I.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(K,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
  g.computeBoundingSphere();
  const m=new THREE.Mesh(g,MAT.ground);m.frustumCulled=false;return m;
}
function buildWater(){
  const g=new THREE.PlaneGeometry(XMAX-XMIN,ZMAX-ZMIN,1,1);g.rotateX(-Math.PI/2);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(XMAX-XMIN)/10,uv.getY(i)*(ZMAX-ZMIN)/10);
  const m=new THREE.Mesh(g,MAT.water);m.position.set((XMAX+XMIN)/2,WATER_Y,(ZMAX+ZMIN)/2);m.frustumCulled=false;return m;
}
const onLand=(x,z,m)=>waterSDF(x,z)>(m||2)&&roadDist(x,z)>-0.5;
