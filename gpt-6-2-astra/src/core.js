const T=THREE, scene=new T.Scene(), camera=new T.PerspectiveCamera(38,1,.12,900);
const renderer=new T.WebGLRenderer({antialias:true,alpha:false});
document.querySelector('main').prepend(renderer.domElement);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
scene.background=new T.Color(0xe4d7b9);scene.fog=new T.FogExp2(0xe4d7b9,.0062);
scene.add(new T.HemisphereLight(0xfff4da,0xbab19c,.83));
const sun=new T.DirectionalLight(0xfff4df,.39);sun.position.set(-30,56,24);scene.add(sun);
let seed=6291;function rand(a=0,b=1){seed=(1664525*seed+1013904223)>>>0;return a+(b-a)*seed/4294967296}
const pick=a=>a[Math.floor(rand(0,a.length))], pi=Math.PI,vec=(x,y,z)=>new T.Vector3(x,y,z);
const shapes={box:new T.BoxGeometry(),round:new T.SphereGeometry(.5,8,6),pole:new T.CylinderGeometry(.5,.5,1,7),cone:new T.ConeGeometry(.5,1,10),ring:new T.TorusGeometry(.47,.03,5,14)};
const timber=0x624b38,dark=0x413c32,reed=0xad9269,plaster=0xd0bb91;
const batches=new Map(), moving=[], dummy=new T.Object3D();
let parent=null;
function group(x,y,z,angle,fn,animate){let prev=parent,g=new T.Object3D();g.position.set(x,y,z);g.rotation.y=angle;g.updateMatrix();if(prev)g.matrix.premultiply(prev.matrix);parent=g;fn();parent=prev;if(animate)moving.push({g,animate,base:g.matrix.clone(),x:g.matrix.elements[12]});return g}
function part(shape,x,y,z,w,h,d,color,rx=0,ry=0,rz=0){
 let batch=batches.get(shape);if(!batch)batches.set(shape,batch=[]);
 dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();
 batch.push({m:dummy.matrix.clone(),parent,color});
}
const box=(...a)=>part('box',...a), oval=(...a)=>part('round',...a);
function stick(a,b,r,c){let v=vec(...b).sub(vec(...a)),mid=vec(...a).addScaledVector(v,.5);let e=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(vec(0,1,0),v.clone().normalize()));part('pole',mid.x,mid.y,mid.z,r,v.length(),r,c,e.x,e.y,e.z)}
const matrix=new T.Matrix4();
function shade(x,z,w,d){oval(x,-.011,z,w,.016,d,0xb6a786)}
function bake(){for(const [shape,items] of batches){const mesh=new T.InstancedMesh(shapes[shape],new T.MeshLambertMaterial(),items.length);items.forEach(({m,parent,color},i)=>{mesh.setMatrixAt(i,parent?matrix.multiplyMatrices(parent.matrix,m):m);mesh.setColorAt(i,new T.Color(color));if(parent)(parent.parts??=[]).push({mesh,i,m})});mesh.frustumCulled=false;scene.add(mesh)}}
function tick(t){for(let {g,animate,base,x} of moving){if(Math.abs(x-focus.x)>distance*1.4+28)continue;animate(t);g.updateMatrix();for(let p of g.parts||[]) {p.mesh.setMatrixAt(p.i,matrix.multiplyMatrices(g.matrix,p.m));p.mesh.instanceMatrix.needsUpdate=true}}}
