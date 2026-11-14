/* 对照 ref/tile-01…16 的布景表。小物用确定性种子补足，地标不用随机坐标。 */
Q.makeCountryside=()=>{
 for(const [x,z,w,d] of [[949,-22,12,8],[930,-28,10,8],[907,-23,13,10],[892,-33,10,8],[871,-24,12,9],[811,21,11,8],[796,-28,14,10]])Q.house(x,z,w,d,{thatch:x>850,open:true,awning:x<850});
 for(const [x,z,s,w] of [[981,12,1,0],[967,-17,.9,0],[947,-5,1.1,0],[923,-10,1.25,1],[904,19,1.3,1],[888,22,1.25,1],[871,17,1.1,1],[857,-22,.9,0],[838,26,1.3,1],[814,37,1.4,1],[793,35,1.3,1],[805,-16,1.1,1],[960,-41,.85,0],[945,-43,1,0],[922,-46,.9,0],[897,-46,1.1,0],[878,-41,1.05,0],[857,-43,.9,0]])Q.tree(x,z,s,!!w);
 const p=Q.group();
 // 柳边院墙、柴垛与篱笆。
 for(let i=0;i<15;i++){let x=862+i*1.7;Q.beam(p,[x,.1,-13],[x,1.4,-13],.06,0x8a7854);}
 Q.beam(p,[862,.5,-13],[886,.5,-13],.04);Q.beam(p,[862,1.1,-13],[886,1.1,-13],.04);
 Q.box(p,0xc9b991,819,1.1,10,15,2.2,.7,'wall');
 for(let i=0;i<12;i++)Q.beam(p,[932+Q.rand(-2,2),.2,-17],[933+Q.rand(-2,2),1.9,-19],.09,0x8f7b53);
 for(let x of [797,808]){Q.table(p,x,-20,false);Q.table(p,x+1,-17,false);}
 Q.bake(p);
 for(let i=0;i<37;i++){const pt=Q.samplePath(Q.northRoad,.66+i/36*.32);Q.human(pt.x,pt.z+Q.rand(-2,2),i%5===0?'porter':i%4===0?'carrier':'walk',{angle:-PI/2,travel:Q.rand(1.5,4.5),hat:i%4===0?'straw':undefined});}
 for(let i=0;i<7;i++)Q.human(796+i*1.6,-15+Q.rand(-1,1),i%3===0?'tea':'talk',{travel:0});
 for(let i=0;i<4;i++)Q.animal(846-i*4,10+i*.4,'donkey',{angle:-PI/2,pack:true,rider:i===2,travel:2.5});
 Q.human(829,12,'driver',{angle:-PI/2,travel:2,staff:true});
 Q.animal(823,-2,'ox',{angle:2.3,travel:1});Q.animal(828,-4,'ox',{angle:1.7,travel:1.2});
 for(let i=0;i<3;i++)Q.animal(790+i*1.5,8+i,'pig',{travel:1.2,angle:PI/2});
 Q.animal(877,9,'dog',{travel:2,angle:PI/2});Q.cart(861,3,'sedan',-PI/2);
 Q.label('郊野春色',898,13,-13,'main');
 Q.smokeAt(933,-26,6);Q.smokeAt(797,-27,8);
};
Q.makeRiver=()=>{
 // 河港北岸店屋随河岸弯折，而非两排平行的复制建筑。
 for(const [x,z,w,d,h] of [[774,-31,15,10,4.5],[753,-33,17,12,4.4],[729,-38,17,11,5],[704,-47,17,11,5.3],[679,-58,19,13,5.2],[653,-64,17,12,4.3],[630,-69,18,11,4.8],[608,-73,17,11,4.4],[584,-73,19,12,4.8],[557,-67,17,12,4.4],[531,-64,14,10,4.2],[508,-64,15,11,4.5],[486,-68,14,10,4.4],[463,-75,15,10,4.5]])Q.house(x,z,w,d,{h,open:true,two:x===679,vertical:x===753?'茶':x===584?'脚店':undefined});
 for(const [x,z,w,d,rot] of [[571,61,18,12,PI],[548,66,17,11,PI],[526,63,20,13,PI],[503,64,17,12,PI],[478,68,17,12,PI],[432,64,17,12,PI],[412,67,15,11,PI],[444,12,15,11,0]])Q.house(x,z,w,d,{rot,open:true,two:x===526});
 Q.house(461,54,19,13,{h:4.7,two:true,name:'十千脚店',major:true,rot:PI});Q.pailou(461,39,12,9.7);
 Q.flag(747,6,-24,'酒');Q.flag(690,7,-40,'茶');Q.flag(607,6,-58,'酒');
 for(const [x,z,s] of [[781,23,1.35],[755,8,1.2],[711,-22,1.1],[664,-30,1],[613,-41,1],[568,-46,1.15],[547,40,1.4],[524,43,1.3],[575,44,1.1],[489,-54,1.1],[438,-62,1.2],[412,10,1.1]])Q.tree(x,z,s,true);
 const p=Q.group();
 // 靠岸的木栈、系缆桩和成组货物。
 for(let x of [735,688,641,583,439]){const r=Q.riverAt(x),zz=r.z-r.w;
  Q.box(p,0xa08b60,x,.2,zz+2,8,.35,4,'wood');
  for(let s of [-1,1])Q.beam(p,[x+s*3.6,-.5,zz+3.4],[x+s*3.6,1.4,zz+3.4],.12,0x67573e);
  for(let i=0;i<8;i++){const xx=x+Q.rand(-3,3),z0=zz-3+Q.rand(-2,0);Q.basket(p,xx,0,z0,Q.rand(.4,.7));}
 }
 Q.bake(p);
 const boats=[
 [775,47,19,4.7,2.1],[751,40,22,5.2,1.85],[722,17,24,5.7,1.7],[693,5,27,6,1.62],
 [666,5,25,5.5,1.58],[637,-2,22,5.2,1.57],[609,3,25,5.7,1.65],[576,-8,26,6,1.7],
 [546,1,25,5.6,2.4],[516,7,29,6.3,2.3],[496,-28,24,5.6,1.6],[467,-41,27,5.8,1.6],
 [437,-18,24,5.5,2.1],[414,-42,22,5.2,2.35],[401,-62,19,4.7,2.5],
 [589,29,14,3.2,1.8],[558,24,14,3.2,1.7],[460,-9,14,3.2,2.4],[424,-59,14,3.2,2.5],
 [720,46,14,3.2,2.1],[666,31,14,3.2,1.65],[377,-87,14,3.2,2.9]
 ];
 for(let i=0;i<boats.length;i++){const [x,z,l,w,a]=boats[i];Q.boat(x,z,l,w,a,{danger:i===9,mast:i===3||i===8||i===17?'upright':'lowered',crew:i===9?8:l>23?5:3,small:l<16});}
 // 桥面密集人流、围栏边看船者；人物高度跟随拱曲线。
 for(let i=0;i<95;i++){
  const u=.025+(i%24)/23*.95,off=(Math.floor(i/24)-1.5)*1.8+Q.rand(-.3,.3),pt=Q.bridgePoint(u,off),role=i%5===0?'watch':i%9===0?'porter':'walk';
  Q.human(pt.x,pt.z,role,{y:pt.y+.18,angle:Q.world.bridge.angle+(i%2?PI:0),travel:0,bind:t=>{let tt=role==='watch'?u:Q.clamp(u+Math.sin(t*.16+i)*.008,.02,.98),p=Q.bridgePoint(tt,off);return {...p,y:p.y+.18,angle:Q.world.bridge.angle+(i%2?PI:0)};}});
 }
 // 桥上两侧的摊担，沿桥面布置而不堵住中间通路。
 for(let u of [.12,.24,.72,.86]){const pt=Q.bridgePoint(u,3.8),b=Q.group(null,pt.x,pt.y+.2,pt.z,Q.world.bridge.angle);Q.table(b,0,0,true);Q.basket(b,-.6,0,1,.4);Q.bake(b);}
 for(let i=0;i<118;i++){
  const pt=Q.samplePath(Q.northRoad,(i/118)*.7),role=i%7===0?'porter':i%11===0?'carrier':i%6===0?'talk':'walk';Q.human(pt.x,pt.z+Q.rand(-3.7,3.7),role,{angle:pt.angle+PI,travel:Q.rand(1,3)});
 }
 for(let i=0;i<43;i++){const x=Q.rand(448,492),z=Q.rand(33,48);Q.human(x,z,i%4===0?'vendor':i%3===0?'talk':'walk',{angle:Q.rand(0,6),travel:i%3===0?0:1});}
 for(let i=0;i<14;i++){let x=580+i*2.15,r=Q.riverAt(x);Q.human(x,r.z-r.w-2,'puller',{angle:PI/2,travel:0});}
 // 纤绳连向船首；粗细独立于人物动作。
 const ropes=Q.group();Q.beam(ropes,[610,1,-32],[579,1.3,-7],.022,0x6f6045);Q.beam(ropes,[609,1.1,-32],[581,1.4,-9],.015,0x79694b);Q.bake(ropes);
 for(const [x,z,r] of [[476,31,0],[485,44,1],[449,35,0],[537,-49,1],[558,-51,0],[730,-19,1],[650,-44,0],[590,-49,1],[516,47,0]])Q.stall(x,z,0,r);
 Q.cart(568,-52,'barrow',-PI/2);Q.animal(480,43,'donkey',{angle:-.7,rider:true,travel:1});
 Q.smokeAt(691,-51,8);Q.smokeAt(449,9,8);
};
Q.makeCity=()=>{
 // 城外由密集沿河铺面过渡到带大树的车道。
 for(const [x,z,w,d] of [[409,18,15,11],[386,10,16,11],[365,6,16,12],[341,0,17,12],[313,-7,19,13],[285,-10,18,11],[260,-10,16,11],[237,-8,15,10],[411,70,16,12],[388,64,18,12],[366,62,17,11],[342,58,19,13],[318,57,17,11],[290,56,17,12],[264,51,17,11],[238,50,15,11]])Q.house(x,z,w,d,{rot:z>40?PI:0,two:x===365,h:4.6,vertical:x===341?'解':x===260?'茶':undefined});
 for(const [x,z,w,d] of [[365,-49,16,10],[340,-45,17,12],[300,-48,20,13],[274,-43,15,11],[254,-39,15,10],[231,-42,17,11]])Q.house(x,z,w,d,{awning:false,open:false});
 for(const [x,z,s] of [[389,28,1.1],[350,19,1.4],[327,-19,1.2],[299,10,1.4],[271,7,1.3],[245,5,1.15],[213,-11,1.3],[204,43,1.3],[232,72,1.1],[280,73,1.2],[329,76,1.3],[361,76,1.15],[242,-27,1.1]])Q.tree(x,z,s,true);
 Q.cityGate();
 Q.house(132,-18,28,16,{h:5.3,two:true,name:'孙羊正店',major:true});Q.pailou(132,-1,18,12);
 Q.house(28,-24,19,12,{h:4.5,name:'赵太丞家',major:true,vertical:'治酒所伤真方集香丸'});
 Q.house(88,48,22,14,{h:4.8,two:true,name:'久住王员外家',major:true,rot:PI});
 for(const [x,z,w,d] of [[161,-12,13,11],[157,49,16,12],[131,55,17,12],[58,-19,18,12],[57,52,17,12],[27,54,17,12],[10,-45,17,11],[45,-51,16,11],[70,-51,18,12],[108,-53,17,12],[144,-56,19,12]])Q.house(x,z,w,d,{h:4.6,rot:z>30?PI:0,open:true,vertical:x===58?'刘家沉檀香':undefined});
 for(const [x,z,s,w] of [[156,7,1.1,1],[114,42,1.15,0],[68,3,1.4,1],[13,0,1.3,1],[21,38,1.1,0],[80,-36,1.1,1],[164,-44,1,0]])Q.tree(x,z,s,!!w);
 // 街口伞摊、店前桌凳和盛货的筐篓。
 for(const [x,z,k] of [[169,32,1],[148,6,0],[118,12,0],[108,0,1],[75,13,0],[61,24,0],[40,7,1],[26,23,0],[305,13,0],[277,15,1],[332,17,0],[371,28,1],[396,40,0]])Q.stall(x,z,0,k);
 const props=Q.group();
 for(const [x,z] of [[125,-5],[139,-6],[363,15],[344,10],[285,1],[31,-13],[91,35]]){Q.table(props,x,z,false);for(let s of [-1,1])Q.box(props,0x88714c,x+s*1.3,.48,z,.4,.14,1.5);}
 for(let i=0;i<30;i++)Q.basket(props,Q.rand(122,143),0,Q.rand(-8,-2),Q.rand(.35,.6));Q.bake(props);
 for(const [x,z] of [[125,-5],[139,-6],[363,15],[344,10],[285,1],[31,-13],[91,35]])for(let s of [-1,1])Q.human(x+s*1.3,z,'tea',{angle:s>0?-PI/2:PI/2,y:.1,travel:0});
 for(let i=0;i<168;i++){const pt=Q.samplePath(Q.roadNodes,i/168*.9);let z=pt.z+Q.rand(-4.8,4.8);if(pt.x>174&&pt.x<194)z=17+Q.rand(-3.8,3.8);const role=i%8===0?'porter':i%13===0?'carrier':i%5===0?'talk':'walk';Q.human(pt.x,z,role,{angle:pt.angle+(i%2?PI:0),travel:role==='talk'?0:Q.rand(.8,2.8)});}
 for(let i=0;i<50;i++){const x=Q.rand(100,158),z=Q.rand(1,30);Q.human(x,z,i%4===0?'talk':i%7===0?'vendor':'walk',{angle:Q.rand(0,6),travel:i%4===0?0:1.2});}
 for(let i=0;i<18;i++)Q.human(Q.rand(21,42),Q.rand(-13,2),i%3===0?'talk':'walk',{angle:Q.rand(0,6),travel:.6});
 for(let i=0;i<16;i++)Q.human(92+Q.rand(-3.2,3.2),-25+i*3,'walk',{angle:0,travel:1.6});
 Q.cart(282,29,'ox',-PI/2);Q.cart(331,35,'ox',PI/2);Q.cart(239,19,'ox',-PI/2);Q.cart(67,17,'ox',PI/2);
 Q.cart(301,22,'sedan',-PI/2);Q.cart(124,29,'sedan',PI/2);Q.cart(46,32,'barrow',PI/2);Q.cart(373,37,'barrow',-PI/2);
 for(let i=0;i<4;i++)Q.animal(163+i*6,19,'camel',{angle:-PI/2,travel:1.7,pack:true});
 Q.human(157,19,'driver',{angle:-PI/2,travel:1.7,staff:true});
 for(const [x,z,type,rider] of [[212,18,'horse',true],[348,32,'donkey',true],[141,23,'donkey',false],[152,25,'horse',false],[94,18,'horse',true],[261,30,'dog',false],[83,22,'dog',false],[305,-32,'pig',false]])Q.animal(x,z,type,{angle:-PI/2,rider,pack:!rider&&type==='donkey',travel:1.3});
 Q.label('十字街口',96,7,12);
 Q.smokeAt(115,-18,9);Q.smokeAt(365,4,8);
};
Q.smokes=[];
Q.smokeAt=(x,z,y)=>{Q.smokes.push({x,y,z,phase:Q.rand(0,10)});};
Q.buildAtmosphere=()=>{
 const cvs=document.createElement('canvas');cvs.width=cvs.height=64;const ctx=cvs.getContext('2d'),gr=ctx.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(211,204,181,.14)');gr.addColorStop(1,'rgba(211,204,181,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,64,64);const mat=new T.SpriteMaterial({map:new T.CanvasTexture(cvs),transparent:true,depthWrite:false});
 for(const p of Q.smokes){p.sprites=[];for(let i=0;i<5;i++){const s=new T.Sprite(mat);s.scale.set(3,3,3);Q.scene.add(s);p.sprites.push(s);}}
 for(let i=0;i<11;i++){
  const x=Q.rand(750,965),z=Q.rand(-45,35),g=Q.group(null,x,18+Q.rand(0,10),z);const wings=[];Q.ball(g,0x6d6655,0,0,0,.08,.1,.25);
  for(let s of [-1,1]){const wing=Q.group(g);Q.beam(wing,[0,0,0],[s*.7,.05,-.1],.045,0x6d6655);Q.beam(wing,[s*.7,.05,-.1],[s*1,.1,-.4],.03,0x6d6655);wings.push(wing);}
  Q.registerActor(g,(t,ph)=>{g.position.x=x+Math.sin(t*.1+ph)*12;g.position.z=z+Math.cos(t*.1+ph)*5;g.rotation.y=-t*.1-ph;wings[0].rotation.z=Math.sin(t*4+ph)*.5;wings[1].rotation.z=-Math.sin(t*4+ph)*.5;},'bird');
 }
};
Q.buildWorld=()=>{Q.buildTerrain();Q.buildBridge();Q.makeCountryside();Q.makeRiver();Q.makeCity();Q.buildAtmosphere();Q.flushStatic();Q.initPools();};
