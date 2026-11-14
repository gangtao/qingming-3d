/* 基础零件、确定性随机数、分区静态合批、动态实例池。Three.js r128。 */
'use strict';
const Q = window.Q = { actors: [], labels: [], counts: {people:0,animals:0,boats:0,buildings:0}, seed: 1024 };
const T = THREE, PI = Math.PI, TAU = PI * 2;
Q.rand = (a=0,b=1) => { Q.seed = (Math.imul(Q.seed,1664525)+1013904223)>>>0; return a+(b-a)*Q.seed/4294967296; };
Q.pick = a => a[Math.floor(Q.rand(0,a.length))];
Q.clamp = (v,a,b) => Math.max(a,Math.min(b,v));
Q.v = (x=0,y=0,z=0) => new T.Vector3(x,y,z);
Q.colors = {ink:0x40372c,wood:0x756044,dark:0x514638,lightWood:0xa18a61,wall:0xc3b38d,roof:0x77766b,straw:0xb2a077,skin:0xc6ab82,cloth:0xc3baa0,red:0x855849,water:0xa5a58e,stone:0x99917a,leaf:0x838364};
Q.scene = new T.Scene();
Q.scene.background = new T.Color(0xd8c8a6);
Q.scene.fog = new T.Fog(0xd8c8a6,280,680);
Q.geos = {
 box:new T.BoxGeometry(1,1,1), ball:new T.SphereGeometry(1,10,7),
 cyl:new T.CylinderGeometry(1,1,1,9), cone:new T.CylinderGeometry(0,1,1,12),
 robe:new T.CylinderGeometry(.7,1,1,10), ring:new T.TorusGeometry(1,.085,5,20),
 plane:new T.PlaneGeometry(1,1), disc:new T.CircleGeometry(1,16)
};
Q.mats = {}; Q.staticBuckets = new Map(); Q.staticMeshes=[];
Q.texture = (kind) => {
 const c=document.createElement('canvas');c.width=c.height=256;const p=c.getContext('2d');
 const colors={wood:'#a58c65',wall:'#d0c19e',roof:'#939084',straw:'#bdac80',stone:'#aea58d',earth:'#c8b88f'};
 p.fillStyle=colors[kind]||'#b6a07d';p.fillRect(0,0,256,256);
 for(let i=0;i<7500;i++){const v=Q.rand(50,225)|0;p.fillStyle=`rgba(${v},${v-7},${v-20},${Q.rand(.015,.08)})`;p.fillRect(Q.rand(0,256),Q.rand(0,256),Q.rand(1,3),1);}
 p.lineWidth=1;
 if(kind==='wood'||kind==='straw'){
  for(let i=0;i<160;i++){p.strokeStyle=i%3?'#65533940':'#f2d9a130';p.beginPath();const x=Q.rand(0,256);p.moveTo(x,0);p.bezierCurveTo(x+Q.rand(-8,8),80,x+Q.rand(-6,6),180,x+Q.rand(-5,5),256);p.stroke();}
 }
 if(kind==='roof'){
  for(let x=0;x<256;x+=16){p.fillStyle='#4a4c414d';p.fillRect(x,0,3,256);p.fillStyle='#e6dab14d';p.fillRect(x+4,0,2,256);for(let y=0;y<256;y+=26){p.strokeStyle='#4e50486b';p.beginPath();p.moveTo(x,y);p.quadraticCurveTo(x+8,y+5,x+16,y);p.stroke();}}
 }
 if(kind==='stone'){
  p.strokeStyle='#625c4d80';for(let y=0;y<256;y+=20){p.beginPath();p.moveTo(0,y);p.lineTo(256,y);p.stroke();for(let x=(y%40?0:24);x<256;x+=48){p.beginPath();p.moveTo(x,y);p.lineTo(x,y+20);p.stroke();}}
 }
 const tx=new T.CanvasTexture(c);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.anisotropy=4;return tx;
};
for(const key of ['wood','wall','roof','straw','stone','earth']){
 Q.mats[key]=new T.MeshLambertMaterial({map:Q.texture(key),vertexColors:true,side:T.DoubleSide});
}
Q.mats.flat = new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
Q.matCache = new Map();
Q.material = (color,kind='flat') => {const k=kind+color;if(!Q.matCache.has(k)){const m=Q.mats[kind].clone();m.vertexColors=false;m.color.set(color);m.userData.kind=kind;Q.matCache.set(k,m);}return Q.matCache.get(k);};
Q.group=(parent,x=0,y=0,z=0,rot=0)=>{const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;if(parent)parent.add(g);return g;};
Q.part=(parent,geo,color,x,y,z,sx=1,sy=1,sz=1,kind='flat')=>{const m=new T.Mesh(typeof geo==='string'?Q.geos[geo]:geo,Q.material(color,kind));m.position.set(x,y,z);m.scale.set(sx,sy,sz);if(parent)parent.add(m);return m;};
Q.box=(p,c,x,y,z,sx,sy,sz,k='flat')=>Q.part(p,'box',c,x,y,z,sx,sy,sz,k);
Q.ball=(p,c,x,y,z,sx,sy=sx,sz=sx)=>Q.part(p,'ball',c,x,y,z,sx,sy,sz);
Q.beam=(parent,a,b,r,color=Q.colors.wood,kind='flat',r2=r)=>{
 const A=Q.v(...a),B=Q.v(...b),d=B.clone().sub(A);const ratio=Math.round(r2/r*100)/100;const key='taper'+ratio;const g=r===r2?Q.geos.cyl:(Q.geos[key]||(Q.geos[key]=new T.CylinderGeometry(ratio,1,1,7)));
 const m=Q.part(parent,g,color,...A.clone().add(B).multiplyScalar(.5).toArray(),r,d.length(),r,kind);m.quaternion.setFromUnitVectors(Q.v(0,1,0),d.normalize());return m;
};
Q.line=(p,pts,r=.035,c=Q.colors.dark)=>{for(let i=1;i<pts.length;i++)Q.beam(p,pts[i-1],pts[i],r,c);};
Q.bake=(root)=>{
 root.updateMatrixWorld(true);
 root.traverse(m=>{if(!m.isMesh)return;
  const kind=m.material.userData.kind||'flat';const x=new T.Vector3().setFromMatrixPosition(m.matrixWorld).x;
  const key=Math.floor(x/64)+'|'+kind;let bucket=Q.staticBuckets.get(key);if(!bucket){bucket={kind,geos:[]};Q.staticBuckets.set(key,bucket);}
  const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());g.applyMatrix4(m.matrixWorld);
  const n=g.attributes.position.count,co=new Float32Array(n*3),c=m.material.color;
  for(let i=0;i<n;i++){co[i*3]=c.r;co[i*3+1]=c.g;co[i*3+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(co,3));bucket.geos.push(g);
 });
};
Q.flushStatic=()=>{
 for(const bucket of Q.staticBuckets.values()){
  const n=bucket.geos.reduce((s,g)=>s+g.attributes.position.count,0),out=new T.BufferGeometry();
  for(const [key,size] of [['position',3],['normal',3],['uv',2],['color',3]]){
   const a=new Float32Array(n*size);let off=0;
   for(const g of bucket.geos){const at=g.attributes[key];if(at)a.set(at.array,off);off+=g.attributes.position.count*size;}out.setAttribute(key,new T.BufferAttribute(a,size));
  }
  out.computeBoundingSphere();const m=new T.Mesh(out,Q.mats[bucket.kind]);m.castShadow=true;m.receiveShadow=true;Q.scene.add(m);Q.staticMeshes.push(m);bucket.geos.forEach(g=>g.dispose());
 }Q.staticBuckets.clear();
};
Q.registerActor=(root,update,kind='other')=>{
 const parts=[];root.updateMatrixWorld(true);root.traverse(m=>{if(m.isMesh){parts.push(m);if(!m.geometry.userData.poolKey)m.geometry.userData.poolKey=m.geometry.uuid;}});
 const a={root,update,parts,kind,phase:Q.rand(0,TAU)};Q.actors.push(a);return a;
};
Q.pools=new Map();
Q.initPools=()=>{
 const counts=new Map();for(const a of Q.actors)for(const p of a.parts){const key=p.geometry.userData.poolKey;const e=counts.get(key)||{geo:p.geometry,n:0};e.n++;counts.set(key,e);}
 const mat=new T.MeshLambertMaterial({color:0xffffff,side:T.DoubleSide});
 for(const [key,e] of counts){const m=new T.InstancedMesh(e.geo,mat,e.n);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(e.n*3),3).setUsage(T.DynamicDrawUsage);m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;Q.scene.add(m);Q.pools.set(key,{mesh:m,n:0});}
};
Q.updateActors=(t,cam)=>{
 for(const p of Q.pools.values())p.n=0;
 const range=Math.max(100,cam.distance*2.1);
 for(const a of Q.actors){if(Math.abs(a.root.position.x-cam.x)>range)continue;a.update(t,a.phase);a.root.updateMatrixWorld(true);
  const near=a.root.position.distanceTo(Q.camera.position)<100;
  for(const m of a.parts){if(m.userData.detail&&!near)continue;const p=Q.pools.get(m.geometry.userData.poolKey);p.mesh.setMatrixAt(p.n,m.matrixWorld);p.mesh.setColorAt(p.n,m.material.color);p.n++;}
 }
 for(const p of Q.pools.values()){p.mesh.count=p.n;p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.instanceColor)p.mesh.instanceColor.needsUpdate=true;}
};
Q.shadow=(parent,x,z,sx=1,sz=1,y=.035)=>{const m=Q.part(parent,'disc',0xafa17f,x,y,z,sx,sz,1);m.rotation.x=-PI/2;return m;};
Q.label=(text,x,y,z,extra='')=>{const el=document.createElement('div');el.className='scene-label'+(extra?' important':'');el.textContent=text;document.getElementById('labels').append(el);Q.labels.push({text,pos:Q.v(x,y,z),el});};
Q.sign=(p,text,x,y,z,w=2.6,h=1.1,vertical=false)=>{
 const canvas=document.createElement('canvas');canvas.width=vertical?128:512;canvas.height=vertical?512:160;const c=canvas.getContext('2d');c.fillStyle='#cfc09a';c.fillRect(0,0,canvas.width,canvas.height);c.strokeStyle='#695439';c.lineWidth=8;c.strokeRect(8,8,canvas.width-16,canvas.height-16);c.fillStyle='#453b2b';c.textAlign='center';c.textBaseline='middle';
 if(vertical){c.font=`${Math.min(88,440/text.length)}px WenKai,serif`;[...text].forEach((v,i)=>c.fillText(v,64,45+(i+.5)*420/text.length));}
 else {c.font=`${Math.min(95,460/text.length)}px WenKai,serif`;c.fillText(text,256,81);}
 const tex=new T.CanvasTexture(canvas),mat=new T.MeshLambertMaterial({map:tex,side:T.DoubleSide});const m=new T.Mesh(Q.geos.plane,mat);m.position.set(x,y,z);m.scale.set(w,h,1);p.add(m);
 // 招牌保留纹理单独合入小量专用网格，不被纯色合批覆盖。
 m.userData.sign=true;return m;
};
Q.bakeWithSigns=(g)=>{g.updateMatrixWorld(true);const signs=[];g.traverse(m=>{if(m.userData.sign)signs.push(m);});for(const s of signs){const copy=s.clone();s.matrixWorld.decompose(copy.position,copy.quaternion,copy.scale);Q.scene.add(copy);s.parent.remove(s);}Q.bake(g);};
