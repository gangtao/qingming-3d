(function(){
'use strict';
var T=THREE,PI=Math.PI,sin=Math.sin,cos=Math.cos,abs=Math.abs;
var seed=20261113;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function rr(a,b){return a+(b-a)*rnd();}
function pick(a){return a[Math.floor(rnd()*a.length)];}
var canvas=document.getElementById('c');
var renderer=new T.WebGLRenderer({canvas:canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
var SILK=0xd9c59a;
var scene=new T.Scene();scene.background=new T.Color(SILK);scene.fog=new T.Fog(SILK,130,300);
var cam=new T.PerspectiveCamera(28,1,2,1100);
scene.add(new T.HemisphereLight(0xfff6e0,0x9c8660,0.66));
var sun=new T.DirectionalLight(0xfff1d6,0.5);sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096);var sc=sun.shadow.camera;sc.left=-190;sc.right=190;sc.top=170;sc.bottom=-170;sc.near=10;sc.far=520;sun.shadow.bias=-0.0006;
scene.add(sun);scene.add(sun.target);

var tagsEl=document.getElementById('tags'),tags=[],signs=[],GP=new T.PlaneGeometry(1,1);
/* ---------- 基础零件 ---------- */
var mats={};function M(c,o){var k=c+(o?JSON.stringify(o):'');if(!mats[k]){var p={color:c};if(o)for(var i in o)p[i]=o[i];mats[k]=new T.MeshLambertMaterial(p);}return mats[k];}
var GB=new T.BoxGeometry(1,1,1),GC=new T.CylinderGeometry(1,1,1,10),GS=new T.SphereGeometry(1,9,7),GK=new T.ConeGeometry(1,1,10),GK4=new T.ConeGeometry(1,1,4);
GK4.rotateY(PI/4);
var GR=(function(){var s=new T.Shape();s.moveTo(-.5,0);s.lineTo(.5,0);s.lineTo(0,1);s.lineTo(-.5,0);var g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});g.translate(0,0,-.5);return g;})();
var GBody=new T.CylinderGeometry(.16,.25,.66,7),GSkirt=new T.CylinderGeometry(.24,.31,.55,7);
var GHull=(function(){var s=new T.Shape();s.moveTo(0,-1);s.quadraticCurveTo(.56,-.85,.5,0);s.quadraticCurveTo(.5,.72,.14,1);s.lineTo(-.14,1);s.quadraticCurveTo(-.5,.72,-.5,0);s.quadraticCurveTo(-.56,-.85,0,-1);
var g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:6});g.rotateX(PI/2);g.translate(0,1,0);return g;})();
function mk(geo,c,p,sx,sy,sz,x,y,z,noShadow){var m=new T.Mesh(geo,typeof c==='number'?M(c):c);m.scale.set(sx,sy,sz);m.position.set(x,y,z);if(!noShadow){m.castShadow=true;}m.receiveShadow=true;if(p)p.add(m);return m;}
function box(p,c,sx,sy,sz,x,y,z){return mk(GB,c,p,sx,sy,sz,x,y,z);}
function cyl(p,c,r,h,x,y,z){return mk(GC,c,p,r,h,r,x,y,z);}
function sph(p,c,sx,sy,sz,x,y,z){return mk(GS,c,p,sx,sy,sz,x,y,z);}
function pivot(p,x,y,z){var g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
var chunks={};
function chunk(x){var i=Math.floor((x+500)/60);if(!chunks[i]){var g=new T.Group();g.userData.cx=i*60-500+30;scene.add(g);chunks[i]=g;}return chunks[i];}
var fronts=[];function at(x,z,ry){var g=new T.Group();fronts.push({g:g,x:x,z:z});g.position.set(x,0,z);g.rotation.y=ry||0;chunk(x).add(g);return g;}

