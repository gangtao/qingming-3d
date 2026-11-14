/* ---------- 细节：贴图、合并网格 ---------- */
function texOf(sz,draw,rx,ry){var cv=document.createElement('canvas');cv.width=cv.height=sz;var c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,sz,sz);draw(c,sz);var t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;if(rx)t.repeat.set(rx,ry);return t;}
var TX={
 tile:texOf(32,function(c,s){var g=c.createLinearGradient(0,0,s,0);g.addColorStop(0,'#777');g.addColorStop(.18,'#c8c8c8');g.addColorStop(.5,'#fff');g.addColorStop(.82,'#c8c8c8');g.addColorStop(1,'#777');c.fillStyle=g;c.fillRect(0,0,s,s);c.fillStyle='rgba(0,0,0,.22)';for(var y=0;y<s;y+=8)c.fillRect(0,y,s,1);}),
 thatch:texOf(64,function(c,s){for(var i=0;i<150;i++){c.fillStyle=pick(['rgba(0,0,0,.2)','rgba(0,0,0,.1)','rgba(90,60,20,.22)']);c.fillRect(rnd()*s,rnd()*s,1.4,rr(8,22));}c.fillStyle='rgba(0,0,0,.14)';for(var y=0;y<s;y+=21)c.fillRect(0,y,s,2);}),
 plank:texOf(32,function(c,s){c.fillStyle='rgba(0,0,0,.3)';for(var y=0;y<s;y+=8)c.fillRect(0,y,s,1.5);c.fillStyle='rgba(0,0,0,.14)';c.fillRect(7,0,1,8);c.fillRect(22,8,1,8);c.fillRect(13,16,1,8);c.fillRect(27,24,1,8);}),
 lattice:texOf(32,function(c,s){c.fillStyle='#e6d8b4';c.fillRect(0,0,s,s);c.strokeStyle='#4a3020';c.lineWidth=2;for(var i=0;i<=s;i+=8){c.beginPath();c.moveTo(i,0);c.lineTo(i,s);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(s,i);c.stroke();}},2,1),
 mat:texOf(32,function(c,s){c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=1;for(var i=-s;i<s*2;i+=5){c.beginPath();c.moveTo(i,0);c.lineTo(i+s,s);c.stroke();c.beginPath();c.moveTo(i,s);c.lineTo(i+s,0);c.stroke();}},6,3)
};
var mtx={};function MT(c,name,side){var k=c+name+(side||'');if(!mtx[k])mtx[k]=new T.MeshLambertMaterial({color:c,map:TX[name],side:side?T.DoubleSide:T.FrontSide});return mtx[k];}
var GT=new T.CylinderGeometry(.6,1,1,7);
/* 把一组静态零件按材质合并成很少的几个网格，细节多了也不卡 */
function bake(g){g.updateMatrixWorld(true);var inv=new T.Matrix4().copy(g.matrixWorld).invert(),by={},list=[],m4=new T.Matrix4(),n3=new T.Matrix3(),v=new T.Vector3();
 g.traverse(function(m){if(!m.isMesh)return;var p=m.parent,ok=true;while(p&&p!==g){if(p.userData.dyn){ok=false;break;}p=p.parent;}if(m.userData.dyn)ok=false;if(ok)list.push(m);});
 if(list.length<2)return;
 list.forEach(function(m){var k=m.material.uuid+(m.castShadow?'c':'')+(m.receiveShadow?'r':''),b=by[k]||(by[k]={m:m,P:[],N:[],U:[],I:[]});
  var geo=m.geometry,pa=geo.attributes.position,na=geo.attributes.normal,ua=geo.attributes.uv,base=b.P.length/3;m4.multiplyMatrices(inv,m.matrixWorld);n3.getNormalMatrix(m4);
  for(var i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m4);b.P.push(v.x,v.y,v.z);if(na){v.fromBufferAttribute(na,i).applyMatrix3(n3).normalize();b.N.push(v.x,v.y,v.z);}else b.N.push(0,1,0);if(ua)b.U.push(ua.getX(i),ua.getY(i));else b.U.push(0,0);}
  if(geo.index){var ix=geo.index;for(var j=0;j<ix.count;j++)b.I.push(base+ix.getX(j));}else for(var q=0;q<pa.count;q++)b.I.push(base+q);});
 list.forEach(function(m){m.parent.remove(m);});
 for(var k in by){var b=by[k],bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(b.P,3));bg.setAttribute('normal',new T.Float32BufferAttribute(b.N,3));bg.setAttribute('uv',new T.Float32BufferAttribute(b.U,2));bg.setIndex(b.I);var mm=new T.Mesh(bg,b.m.material);mm.castShadow=b.m.castShadow;mm.receiveShadow=b.m.receiveShadow;g.add(mm);}}
var GT2=new T.CylinderGeometry(1,.6,1,7),GTor=new T.TorusGeometry(1,.07,5,18),VCM=new T.MeshLambertMaterial({vertexColors:true});
/* 把一个关节下面的零件并成一个带顶点颜色的网格：细节再多，每个关节也只画一次 */
function bakeC(g){g.updateMatrixWorld(true);var inv=new T.Matrix4().copy(g.matrixWorld).invert(),by={},list=[],m4=new T.Matrix4(),n3=new T.Matrix3(),v=new T.Vector3();
 g.traverse(function(m){if(!m.isMesh||m.material.map||m.material.transparent||m.material===VCM||m.userData.dyn)return;var p=m.parent;while(p&&p!==g){if(p.userData.dyn)return;p=p.parent;}list.push(m);});
 if(list.length<2)return;
 list.forEach(function(m){var k=m.castShadow?'c':'n',b=by[k]||(by[k]={c:m.castShadow,P:[],N:[],C:[],I:[]}),geo=m.geometry,pa=geo.attributes.position,na=geo.attributes.normal,base=b.P.length/3,col=m.material.color;m4.multiplyMatrices(inv,m.matrixWorld);n3.getNormalMatrix(m4);
  for(var i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m4);b.P.push(v.x,v.y,v.z);v.fromBufferAttribute(na,i).applyMatrix3(n3).normalize();b.N.push(v.x,v.y,v.z);b.C.push(col.r,col.g,col.b);}
  var ix=geo.index;if(ix)for(var j=0;j<ix.count;j++)b.I.push(base+ix.getX(j));else for(var q=0;q<pa.count;q++)b.I.push(base+q);});
 list.forEach(function(m){m.parent.remove(m);});
 for(var k in by){var b=by[k],bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(b.P,3));bg.setAttribute('normal',new T.Float32BufferAttribute(b.N,3));bg.setAttribute('color',new T.Float32BufferAttribute(b.C,3));bg.setIndex(b.I);var mm=new T.Mesh(bg,VCM);mm.castShadow=b.c;mm.receiveShadow=true;g.add(mm);}}
function bakeParts(g,parts){parts.forEach(function(p){p.userData.dyn=true;});g.userData.dyn=true;bakeC(g);parts.forEach(bakeC);}
function dark(c,k){return new T.Color(c).multiplyScalar(k).getHex();}
