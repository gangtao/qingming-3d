var boats=[];
function deckY(t){return 1+.4*Math.pow(abs(t),2.2)*(t<0?1.3:1);}
/* 船身：两头收窄上翘的弧形船壳，贴木板纹 */
var GHull2=(function(){var N=16,P=[],U=[],I=[],DP=[],DI=[];for(var i=0;i<=N;i++){var t=-1+2*i/N,a=abs(t),w=Math.max(.14,.5*Math.pow(Math.max(0,1-Math.pow(a,t<0?3.4:2.5)),.55)),yd=deckY(t),yk=.6*Math.pow(a,2.6),ym=(yd+yk)*.5;
  [[-w,yd],[-w*.95,ym],[-w*.55,yk],[w*.55,yk],[w*.95,ym],[w,yd]].forEach(function(p){P.push(p[0],p[1],t);U.push(i/N*5,p[1]*2.2);});DP.push(-w,yd-.05,t,w,yd-.05,t);
  if(i<N){for(var j=0;j<5;j++){var q=i*6+j;I.push(q,q+1,q+6,q+1,q+7,q+6);}var d=i*2;DI.push(d,d+1,d+2,d+1,d+3,d+2);}}
 [0,N].forEach(function(i){for(var j=1;j<5;j++)I.push(i*6,i*6+j,i*6+j+1);});
 var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
 var dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(DP,3));dg.setIndex(DI);dg.computeVertexNormals();return{hull:g,deck:dg};})();
function boat(o){var g=new T.Group(),st=new T.Group(),L=o.L||6,W=o.W||3.2,B={g:g,crew:[],o:o},i;g.add(st);
 mk(GHull2.hull,MT(0x6b4a30,'plank',1),st,W,1,L,0,0,0);mk(GHull2.deck,M(0x8f6f48,{side:T.DoubleSide}),st,W,1,L,0,0,0).castShadow=false;
 [-1,1].forEach(function(s){box(st,0x4a3626,.1,.14,L*1.15,s*W*.5,1.04,0).castShadow=false;});
 if(o.cabin!==0){var cl=L*.95,cz=-.1;box(st,0x7a5a3a,W*.72,1,cl,0,1.5,cz);
  [-1,1].forEach(function(s){box(st,0xa98a5c,.05,.5,cl*.94,s*W*.365,1.62,cz).castShadow=false;for(var k=0;k<=8;k++)box(st,0x3b2b1f,.07,1,.1,s*W*.37,1.5,cz-cl/2+k*cl/8).castShadow=false;box(st,0x5a4028,.5,.06,cl,s*W*.4,1.99,cz).castShadow=false;});
  var r=mk(GC,MT(0xb79c66,'mat'),st,W*.42,cl+.3,.55,0,2.0,cz);r.rotation.x=PI/2;for(i=0;i<6;i++){var rb=mk(GC,0x6a5238,st,W*.435,.08,.58,0,2.0,cz-cl/2+.1+i*(cl-.2)/5);rb.rotation.x=PI/2;rb.castShadow=false;}
  if(L>=5.5){var sy=deckY(-.78);box(st,0x7a5a3a,W*.56,1.0,L*.26,0,sy+.5,-L*.78);box(st,0x9a8250,W*.66,.08,L*.34,0,sy+1.25,-L*.78);[-1,1].forEach(function(s){box(st,0x5a4028,.08,1.3,.08,s*W*.3,sy+.62,-L*.63).castShadow=false;});}}
 var by=deckY(.8);cyl(st,0x4a3626,.16,.7,0,by+.3,L*.8);box(st,0x4a3626,.9,.08,.08,0,by+.5,L*.8).castShadow=false;mk(GC,0xc9b88a,st,.36,.12,.36,W*.16,deckY(.62)+.02,L*.62).castShadow=false;
 box(st,0x4a3626,.14,2.3,1.5,0,.75,-L-.5);box(st,0x4a3626,.1,.1,1.8,0,deckY(-1)+.5,-L+.3).castShadow=false;
 if(o.cargo)for(var c=0;c<8;c++)sph(st,0xd9cfae,.42,.24,.5,rr(-.5,.5),deckY(.55)+.2+Math.floor(c/4)*.4,L*.5+(c%4)*.28-.5);
 if(o.mast){var m=pivot(g,0,2.2,L*.25);m.userData.dyn=true;if(o.mast==='down'){m.rotation.x=-1.3;}[-1,1].forEach(function(s){var lg=cyl(m,0x4a3626,.1,8.2,s*.55,4,0);lg.rotation.z=s*.135;});box(m,0x4a3626,1.3,.1,.1,0,2.2,0);box(m,0x4a3626,.8,.1,.1,0,5,0);if(o.sail)box(m,0xddd0aa,3.4,4.8,.08,0,4.6,.15);B.mast=m;}
 B.oar=pivot(g,0,deckY(-.9)+.6,-L*.9);B.oar.userData.dyn=true;box(B.oar,0x4a3626,.09,.09,5,0,-.5,-2.3).rotation.x=-.25;
 (o.crew||[]).forEach(function(c){var P=person(Object.assign({raw:1},c.o||{hat:'bun'}));P.g.userData.dyn=true;P.g.position.set(c.x,c.y!=null?c.y:deckY(c.z/L)-.03,c.z);P.g.rotation.y=c.ry||0;P.y0=P.g.position.y;P.g.scale.setScalar(1.3/(o.scale||1));g.add(P.g);B.crew.push({P:P,an:c.an});});
 bake(st);
 g.scale.setScalar(o.scale||1);scene.add(g);
 B.pose=function(t){g.rotation.z=sin(t*.9+L)*.025;B.oar.rotation.y=sin(t*1.7)*.4;for(var i=0;i<B.crew.length;i++)B.crew[i].an(B.crew[i].P,t);};
 boats.push(B);return B;}
var ro={};

/* 行船的水纹：船头分出两道八字波，船尾拖几条短浪，都用墨线勾，随船一起走 */
var WKM=new T.LineBasicMaterial({color:0x5a4a36,transparent:true,opacity:.55,depthWrite:false});
function wake(B){var L=B.o.L||6,W=B.o.W||3.2,P=[],n,k;[-1,1].forEach(function(s){for(n=0;n<3;n++){var x0=s*(W*.3+n*.5),z0=L*(.95-n*.5);for(k=0;k<7;k++){var a=k/7,b=(k+1)/7;P.push(x0+s*a*(W*.9+n*.6)+sin(a*9+n)*.12,0,z0-a*L*(1.5+n*.3),x0+s*b*(W*.9+n*.6)+sin(b*9+n)*.12,0,z0-b*L*(1.5+n*.3));}}});
 for(n=0;n<4;n++){var zx=-L*(1.15+n*.32),hwk=W*(.28+n*.1);for(k=0;k<6;k++){var a2=-1+k/3,b2=-1+(k+1)/3;P.push(a2*hwk,0,zx-cos(a2*1.5)*.5,b2*hwk,0,zx-cos(b2*1.5)*.5);}}
 var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));var l=new T.LineSegments(g,WKM);l.position.y=.02;l.userData.dyn=true;B.g.add(l);B.wake=l;var p0=B.pose;B.pose=function(t){p0(t);l.scale.z=1+sin(t*2.2+L)*.07;l.scale.x=1+sin(t*1.6+L)*.05;l.rotation.z=-B.g.rotation.z;};return l;}
