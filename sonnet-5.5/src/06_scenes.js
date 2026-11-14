/* 06_scenes.js — 各段布景：郊野春色 / 汴河虹桥 / 城门街市 */
const PI=Math.PI;
function streetZ(x){const p=ROADS[0].p;for(let i=0;i<p.length-1;i++){if(x<=p[i][0]&&x>=p[i+1][0]){const f=(x-p[i][0])/(p[i+1][0]-p[i][0]);return lerp(p[i][1],p[i+1][1],f)}}return p[p.length-1][1]}
const faceTo=(x,z,tx,tz)=>Math.atan2(-(tz-z),tx-x);
function folk(x,z,o){
  o=o||{};if(waterSDF(x,z)<2)return;const r=rnd();let role='walk';
  if(r<0.1)role='porter';else if(r<0.2)role='basket';else if(r<0.3)role='bundle';else if(r<0.36)role='traveler';else if(r<0.42)role='scholar';else if(r<0.46)role='elder';
  const h=o.h!==undefined?o.h:(rnd()<0.6?PI:0);
  person(Object.assign({x,z,h,role,spd:rr(0.7,1.25),rng:rr(3,16),mode:role==='porter'?4:1},o));
}
function chat(x,z,n,o){const cx=x,cz=z;for(let i=0;i<n;i++){const a=i/n*PI*2+rr(0.5);const px=cx+Math.cos(a)*0.8,pz=cz+Math.sin(a)*0.8;
  if(waterSDF(px,pz)<2)continue;person(Object.assign({x:px,z:pz,h:faceTo(px,pz,cx,cz),mode:2,role:pick(['walk','scholar','elder','basket','porter']),rng:0},o||{}))}}
function stallScene(x,z,ry,goods){
  if(waterSDF(x,z)<2)return;const S=scope(x,groundY(x,z),z,ry);stall(S,0,0,0,0,goods);S.end();
  const c=Math.cos(ry),s=Math.sin(ry);const px=x+(-0.8)*s,pz=z+(-0.8)*c;
  person({x:px,z:pz,h:ry-PI/2,mode:7,role:pick(['walk','elder','basket']),rng:0});
}
function seatedGroup(x,z,ry,n){ // 桌边坐着的人
  const y=groundY(x,z);const S=scope(x,y,z,ry);table(S.g,0,0,0,0);S.end();
  const c=Math.cos(ry),s=Math.sin(ry);
  for(let i=0;i<n;i++){const side=i%2?1:-1;const lx=(i>>1?0.35:-0.35)*(i>1?1:1),lz=side*0.62;
    const px=x+lx*c+lz*s,pz=z-lx*s+lz*c;const S2=scope(px,y,pz,ry);stool(S2.g,0,0,0,0);S2.end();
    person({x:px,z:pz,y:y+0.0,h:ry-PI/2+(side>0?PI:0),mode:3,role:'sit',rng:0})}
}
function rider(x,z,h,o){ // 骑马/驴 + 骑者，同行
  o=o||{};const kind=o.kind||'horse';const back=kind==='horse'?1.15+0.4:1.0+0.3;
  grp({x,z,h,rng:o.rng||14,spd:o.spd||1.5,mode:14,flag:o.flag||0},[
    [(q)=>animal(kind,Object.assign(q,{load:'saddle',c:pick([0x7a5a3c,0x5a4634,0x8a7a62,0xa08a66])})),0,0],
    [(q)=>person(Object.assign(q,{role:'rider',mode:8,ph:q.gph,y:groundY(q.x,q.z)+back-0.55,hat:pick(['futou','dou','cap'])})),0,0]]);
}
function donkeyTrain(x,z,h,n,o){o=o||{};const L2=[];
  for(let i=0;i<n;i++)L2.push([(q)=>animal('donkey',Object.assign(q,{load:'pack',ph:q.gph+i*0.3})),-i*2.3,rr(-0.2,0.2)]);
  L2.push([(q)=>person(Object.assign(q,{role:'walk',ph:q.gph})),1.4,0.9]);
  grp({x,z,h,rng:o.rng||6,spd:o.spd||0.9,mode:14},L2);
}
/* ---------- 郊野春色 t 0–0.26 ---------- */
function sceneCountry(){
  for(let i=0;i<58;i++){const t=rr(0.0,0.2),z=rr(-120,60);const x=TX(t);if(waterSDF(x,z)>3&&roadDist(x,z)>1)bareTree(x,z,rr(0.8,1.5))}
  for(let i=0;i<12;i++){const x=TX(rr(0.0,0.1)),z=rr(126,150);if(waterSDF(x,z)>3)bareTree(x,z,rr(0.9,1.4))}
  for(let i=0;i<24;i++){const x=TX(rr(0.14,0.255)),z=rr(-75,70);if(waterSDF(x,z)>4&&roadDist(x,z)>2)willow(x,z,rr(0.9,1.35))}
  for(let i=0;i<40;i++){const x=TX(rr(0.0,0.27)),z=rr(-190,-110);bareTree(x,z,rr(1.0,1.8))}
  // 农舍：茅顶歇山，竹篱
  hall({x:TX(0.118),z:-26,ry:0,W:9,D:6.5,floors:1,front:'house',roof:'thatch',hip:false,ov:1.1,H1:3.0,wall:0xb8aa86});
  hall({x:TX(0.136),z:-34,ry:0.2,W:7,D:5.5,floors:1,front:'house',roof:'thatch',hip:true,ov:1.0,H1:2.8,wall:0xb8aa86});
  fence(TX(0.105),-14,TX(0.145),-14);fence(TX(0.105),-14,TX(0.105),-38);fence(TX(0.145),-14,TX(0.145),-22);
  haystack(TX(0.098),-30,1.1);haystack(TX(0.15),-27,0.9);smoke(TX(0.118)+2,5.5,-26);
  hall({x:TX(0.205),z:-18,ry:0,W:14,D:8,floors:1,front:'house',hip:true,ov:1.5,H1:3.2});
  hall({x:TX(0.222),z:-26,ry:0,W:10,D:7,floors:1,front:'shop',hip:false,ov:1.3,H1:3.2});
  hall({x:TX(0.236),z:-8,ry:0,W:12,D:8,floors:1,front:'house',hip:true,ov:1.4,H1:3.2});
  mudWall(TX(0.19),0,TX(0.215),0);
  smoke(TX(0.205)+3,5.5,-18);
  // 池上小船
  boat({x:TX(0.036),z:70,h:PI*0.9,len:6,kind:'skiff',beam:1.5});
  boat({x:TX(0.065),z:104,h:0.3,len:7,kind:'skiff',beam:1.6});
  // 驮队：驴
  donkeyTrain(TX(0.055),44,PI,5);
  donkeyTrain(TX(0.2),32,0,4,{rng:8});
  // 轿与随从
  grp({x:TX(0.238),z:46,h:PI,rng:5,spd:1.0,mode:4},[[sedan,0,0],
    [(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:0,hat:'futou',robe:0x6d5a48})),-1.7,0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:3.14,hat:'futou',robe:0x6d5a48})),-1.7,-0.55],
    [(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:3.14,hat:'futou',robe:0x6d5a48})),1.7,0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:0,hat:'futou',robe:0x6d5a48})),1.7,-0.55]]);
  rider(TX(0.246),52,PI,{kind:'horse'});rider(TX(0.233),55,PI,{kind:'horse',rng:8});
  for(let i=0;i<3;i++)folk(TX(0.228+i*0.006),50+rr(-3,3),{h:PI,rng:5});
  // 行路人
  for(let i=0;i<14;i++){const t=rr(0.01,0.25);const z=streetZ0(t)+rr(-2,2);folk(TX(t),z)}
  chat(TX(0.3-0.14),20,3);chat(TX(0.07),48,2);
  animal('dog',{x:TX(0.12),z:-8,h:PI,mode:14,spd:0.8,rng:12});STAT.animals;
  animal('pig',{x:TX(0.13),z:-18,h:0,mode:14,spd:0.5,rng:5});animal('pig',{x:TX(0.132),z:-17,h:0.4,mode:15,spd:0.5});
  for(let i=0;i<14;i++)bird(TX(rr(0.04,0.22)),rr(10,16),rr(-80,10),rr(14,34));
}
function streetZ0(t){const p=ROADS[0].p;const x=TX(t);return streetZ(x)}
/* ---------- 汴河虹桥 + 城门街市 的房屋带 ---------- */
const NO_BUILD=[[0.605,9],[0.785,10],[0.875,16],[0.93,10]];
function blocked(x,W,z,D){for(const[t,h]of NO_BUILD)if(Math.abs(x-TX(t))<h+W/2)return true;if(z!==undefined){if(Math.hypot(x-TX(0.5),z-BRIDGE_C)<40+W/2)return true;D=D||8;for(const o of OCC)if(Math.abs(x-o[0])<(W+o[2])/2+1.5&&Math.abs(z-o[1])<(D+o[3])/2+1.5)return true}return false}
const BRIDGE_C=riverAt(TX(0.5)).z;
function rowBuild(side,t0,t1,zFn,o){
  o=o||{};let x=TX(t0);const xe=TX(t1);
  while(x>xe){
    const W=rr(o.w0||9,o.w1||17),D=rr(6.5,9.5);const cx=x-W/2;
    const z=zFn(cx,D);if(blocked(cx,W,z,D)){x-=2;continue}
    const r=rnd();
    const tavern=r<0.18,shop=r<0.62;
    const info=hall({x:cx,z,ry:side>0?PI:0,W,D,floors:tavern?2:(rnd()<0.12?2:1),front:tavern?'tavern':(shop?'shop':'house'),hip:rnd()<0.55,ov:rr(1.2,1.7),H1:tavern?3.6:3.3,
      sign:rnd()<0.3?pick(['酒','茶','药','肉','饼','食店','脚店','香药','解库']):null,flag:tavern&&rnd()<0.6,wall:pick([0xd2c6a8,0xc9bd9c,0xd8cdb0,0xbfb293])});
    if(tavern&&rnd()<0.6){const p=hallPt(info,rr(-W/3,W/3),D/2+0.7);huanmen(p[0],p[1],info.ry,rr(5,7),rr(6,8))}
    if(rnd()<0.3){const p=hallPt(info,rr(-W/3,W/3),D/2+2.6);seatedGroup(p[0],p[1],info.ry,pick([2,3,4]))}
    if(rnd()<0.5)smoke(...(()=>{const p=hallPt(info,W*0.2,0);return [p[0],info.y0+8,p[1]]})());
    x-=W+rr(0.3,2.5);
  }
}
function sceneBuildings(){
  named();
  // 南岸 / 街南侧 (面朝北)
  rowBuild(1,0.30,0.998,(x,D)=>streetZ(x)+7.5+D/2);
  // 北岸（河北）t 0.30–0.64 ；街北侧 t>0.66
  rowBuild(-1,0.31,0.64,(x,D)=>{const t=XT(x);const r=riverAt(x);return (r?r.z-r.hw:0)-13-4.5-D/2});
  rowBuild(-1,0.66,0.998,(x,D)=>streetZ(x)-7.5-D/2);
  // 第二排（远处）
  const r2=(side,t0,t1,off)=>{let x=TX(t0);while(x>TX(t1)){const W=rr(10,18),D=rr(7,10);const cx=x-W/2;
    const z=side>0?streetZ(cx)+7.5+rr(18,24)+off+D/2:(()=>{const r=riverAt(cx);return (r&&XT(cx)<0.64?r.z-r.hw-13-14:streetZ(cx)-14)-rr(12,16)-off-D/2})();
    if(!blocked(cx,W,z,D)&&waterSDF(cx,z)>6)hall({x:cx,z,ry:side>0?PI:0,W,D,floors:rnd()<0.15?2:1,front:rnd()<0.5?'house':'blank',hip:rnd()<0.5,ov:1.4,H1:3.2,roof:rnd()<0.15?'thatch':'tile'});
    x-=W+rr(2,9)}};
  r2(1,0.30,0.998,0);r2(-1,0.31,0.998,0);r2(-1,0.31,0.998,16);r2(-1,0.31,0.998,34);r2(1,0.30,0.998,18);
  // 街树
  for(let i=0;i<110;i++){const t=rr(0.29,0.99);const x=TX(t);const z=rr(-150,130);if(blocked(x,0)||!onLand(x,z,3))continue;
    if(Math.abs(z-streetZ(x))<12)continue;if(rnd()<0.6)willow(x,z,rr(0.9,1.3));else bareTree(x,z,rr(0.9,1.4))}
  // 街边小品
  for(let i=0;i<10;i++){const t=rr(0.32,0.99);const x=TX(t);if(blocked(x,2))continue;stallScene(x,streetZ(x)+rr(-4.6,4.6),pick([0,PI]),pick(['fruit','cloth','pot','mix','mix']))}
  for(let i=0;i<22;i++){const t=rr(0.65,0.99);const x=TX(t);if(blocked(x,2))continue;const z=streetZ(x)+pick([-1,1])*rr(4.2,6);const S=scope(x,groundY(x,z),z,0);umbrella(S,0,0,0,rr(1.4,1.9));S.end()}
}
function named(){
  const north=(t,D)=>streetZ(TX(t))-7.5-D/2,south=(t,D)=>streetZ(TX(t))+7.5+D/2;
  const place=(t,side,W,D,name,fl,sign)=>{const x=TX(t);const z=side<0?north(t,D):south(t,D);
    const info=hall({x,z,ry:side>0?PI:0,W,D,floors:fl,front:fl>1?'tavern':'shop',hip:true,ov:1.8,H1:3.8,sign,flag:true,label:name,pri:0,wall:0xcfc4a4});
    const p=hallPt(info,0,side>0?-D/2-1.2:D/2+1.2);return {info,p}};
  const n1=place(0.912,-1,24,11,'孙羊正店',2,'孙羊正店');
  {const p=hallPt(n1.info,0,D_(11)/2+0.8);huanmen(p[0],p[1],0,12,9.5)}
  const n2=place(0.958,-1,15,9,'赵太丞家',1,'赵太丞家');
  const n3=place(0.985,1,14,9,'久住王员外家',1,'久住王员外家');
  const n4=place(0.84,1,13,8,'王家纸马',1,'王家纸马');
  const n5=place(0.74,1,13,8,'刘家香铺',1,'刘家香铺');
  // 十千脚店：桥西北岸
  const t0=0.563;const r=riverAt(TX(t0));const z=r.z-r.hw-13-4.5-5.5;
  const info=hall({x:TX(t0),z,ry:0,W:20,D:11,floors:2,front:'tavern',hip:true,ov:1.8,H1:3.8,sign:'十千脚店',flag:true,label:'十千脚店',pri:0});
  {const p=hallPt(info,0,6.3);huanmen(p[0],p[1],0,13,9.5)}
  // 北岸水榭式脚店（敞轩，伸向河）
  const t1=0.452;const r1=riverAt(TX(t1));hall({x:TX(t1),z:r1.z-r1.hw-12-5,ry:0,W:16,D:9,floors:2,front:'tavern',hip:false,ov:1.6,H1:3.6,label:'脚店',pri:1,flag:true});
}
function D_(d){return d}
/* ---------- 汴河 ---------- */
function sceneRiver(){
  const rz=t=>riverAt(TX(t)).z;
  const bk=[];const add=(t,dz,h,len,kind,mast,people,ex)=>{const x=TX(t),r=riverAt(x);const z=r.z+dz*r.hw/20;const bt=boat(Object.assign({x,z,h,len,kind,mast},ex||{}));bk.push(bt);
    const L1=len;
    if(kind==='cargo'){
      boatPerson(bt,L1*0.38,0,'boatman',6,{hat:'cap'});boatPerson(bt,L1*0.3,B_(bt)*0.2,'boatman',6);
      boatPerson(bt,-L1*0.2,0,'walk',2,{hat:'dou'});boatPerson(bt,-L1*0.34,B_(bt)*0.25,'walk',2);
      boatPerson(bt,L1*0.15,-B_(bt)*0.2,'boatman',2);boatPerson(bt,-L1*0.46,0,'boatman',6,{hat:'bun'});
      if(rnd()<0.6)boatPerson(bt,L1*0.46,0,'boatman',6);
      if(people>6)boatPerson(bt,0,B_(bt)*0.1,'walk',2,{role:'elder'});
    }else if(kind==='ferry'){boatPerson(bt,len*0.4,0,'boatman',6,{hat:'dou'});boatPerson(bt,-len*0.1,0,'walk',2);boatPerson(bt,-len*0.38,0,'boatman',6)}
    else{boatPerson(bt,0,0,'boatman',6,{hat:'dou'})}
    return bt;};
  // tile 5: 南岸泊船
  add(0.31,5,PI,17,'cargo',null,6);add(0.335,-3,PI*1.04,18,'cargo','down',6);
  // tile 6: 北岸并排三艘
  add(0.385,-12,0.04,20,'cargo','down',7);add(0.405,-6,PI,19,'cargo',null,6);add(0.395,2,PI+0.08,18,'cargo','up',6);
  // tile 7：纤夫拉的船
  const tow=add(0.447,-6,PI,20,'cargo','up',7);
  add(0.432,10,0.15,9,'ferry',null,3);add(0.462,12,PI,6.5,'skiff',null,1);add(0.425,-12,PI+0.1,9,'ferry',null,3);
  // 桥下与桥旁
  add(0.528,2,PI,19,'cargo','down',7);add(0.513,9,0.0,7,'skiff',null,1);add(0.495,-9,PI,7,'skiff',null,1);
  // tile 9：桥西落桅的船与竖桅船
  add(0.553,-4,PI+0.15,20,'cargo','up',7);add(0.575,8,0.1,19,'cargo','up',7);add(0.585,-8,PI,18,'cargo','down',6);
  add(0.62,-6,PI,19,'cargo','up',7);add(0.642,-4,0.2,17,'cargo','up',6);add(0.612,3,PI+0.05,8,'ferry',null,3);
  add(0.682,-3,PI,18,'cargo','down',6);add(0.705,-3,0.1,16,'cargo','up',6);
  // 纤夫：沿北岸向左(西)拉
  const x0=tow.x-tow.Lb*0.12,y=0;const rope=[];
  const trackers=9;const tr=riverAt(x0-12);
  const zr=(x)=>{const r=riverAt(x);return r.z-r.hw-2.5};
  const mastTop=[tow.x-(tow.Lb*0.1+0.3),9.5,tow.z];
  const gb=GB.gen.at(tow.x);
  for(let i=0;i<trackers;i++){const x=tow.x-30-i*2.6;const z=zr(x);
    person({x,z,h:PI,role:'walk',mode:5,rng:0,spd:1,hat:pick(['bun','cap','none']),robe:pick([0xd9cfb4,0xcbbd9a,0xb4a384]),long:false,ph:i*0.7});
  }
  const last=[tow.x-30-(trackers-1)*2.6,zr(tow.x-30-(trackers-1)*2.6)];
  // 纤绳
  let pa=[mastTop[0]-tow.Lb*0.0,mastTop[1],mastTop[2]];
  for(let k=1;k<=24;k++){const f=k/24;const px=lerp(mastTop[0],tow.x-30,f),pz=lerp(mastTop[2],zr(tow.x-30),f);const py=lerp(mastTop[1],1.3,Math.pow(f,0.6))-Math.sin(f*PI)*0.4;
    gb.ln(pa[0],pa[1],pa[2],px,py,pz,0.03,0.03,0x4a3c28,3);pa=[px,py,pz]}
  for(let i=0;i<trackers-1;i++){const x1=tow.x-30-i*2.6,x2=x1-2.6;gb.ln(x1,1.3,zr(x1),x2,1.3,zr(x2),0.025,0.025,0x4a3c28,3)}
  // 码头木桩与栈桥
  for(const t of[0.31,0.335,0.385,0.405,0.553,0.575,0.62]){const x=TX(t),r=riverAt(x);const sd=(t===0.385||t===0.405||t===0.62||t===0.553)?-1:1;
    for(let i=0;i<6;i++){const px=x-9+i*3.6,pz=r.z+sd*(r.hw-1.2);GB.gen.at(px).ln(px,-2,pz,px,1.0,pz,0.14,0.12,0x4a3a2c,5)}
    GB.gen.at(x).bx(x,0.35,r.z+sd*(r.hw+0.4),22,0.15,1.6,0x6a5438)}
  // 岸边人群（码头装卸）
  for(const t of[0.312,0.338,0.388,0.41,0.557,0.58,0.624,0.646]){const x=TX(t),r=riverAt(x);const sd=(t===0.388||t===0.41||t===0.624||t===0.557)?-1:1;
    for(let i=0;i<5;i++)folk(x+rr(-9,9),r.z+sd*(r.hw+rr(2,8)),{rng:rr(2,8)});
    chat(x+rr(-5,5),r.z+sd*(r.hw+5),3)}
  // 货堆、箩筐
  for(const t of[0.312,0.388,0.557,0.624]){const x=TX(t),r=riverAt(x);const sd=(t===0.388||t===0.624||t===0.557)?-1:1;const g=GB.gen.at(x);
    for(let i=0;i<9;i++){const px=x+rr(-10,10),pz=r.z+sd*(r.hw+rr(2.5,5));if(rnd()<0.5)g.sp(px,0.4,pz,0.5,0.35,0.5,pick([0xcdbf9a,0xb09a68]),6,4);else g.bx(px,0.35,pz,0.8,0.6,0.6,pick([0x8a7448,0x6a5a3c]))}}
}
function B_(bt){return bt.B}
/* ---------- 虹桥 ---------- */
function bp(s,w){const c=Math.cos(BRIDGE.ry),sn=Math.sin(BRIDGE.ry);return [BRIDGE.x+w*c+s*sn,BRIDGE.z-w*sn+s*c]}
function sceneBridge(){
  const x=TX(0.5),r=riverAt(x),zc=r.z;buildBridge(x,zc);
  const sp=BRIDGE.sp,ry=BRIDGE.ry,hSW=ry-PI/2,hNE=ry+PI/2;
  // 桥面两侧披檐摊位
  for(const sd of[-1,1])for(let i=0;i<8;i++){const s=-17+i*4.9+rr(-0.4,0.4);const y=bridgeY(s);const p=bp(s,sd*2.95);const S=scope(p[0],y-0.4,p[1],ry);const G=S.g;
    G.bx(0,0.6,0,1.9,0.07,1.6,0x6a5038);G.bx(sd*0.9,1.4,0,0.07,1.6,1.6,0x4a3428);
    for(const q of[-1,1])G.bx(-sd*0.9,1.0,q*0.75,0.06,2.0,0.06,0x4a3828);
    S.r.push();S.r.quad([-1.1*sd,2.0,0.9],[-1.1*sd,2.0,-0.9],[1.1*sd,2.45,-0.9],[1.1*sd,2.45,0.9],[0.9,0.88,0.8],[0,0,2,2],sd>0);S.r.pop();
    for(let k=0;k<5;k++)G.bx(rr(-0.7,0.7),0.8,rr(-0.5,0.5),rr(0.15,0.3),rr(0.1,0.25),rr(0.15,0.3),pick([0xb09a68,0x8a7448,0xcdbf9a,0x9a8355]));
    S.end();
    const pp=bp(s,sd*3.4);person({x:pp[0],z:pp[1],y:0,h:ry+(sd>0?PI:0),mode:7,role:pick(['walk','elder']),rng:0,flag:-1})}
  // 桥上行人：沿桥轴向两边走
  for(let i=0;i<52;i++){const s=rr(-21,21);const dirn=rnd()<0.5?1:-1;const w=rr(-1.8,1.8)+(dirn>0?0.9:-0.9);const pp=bp(s,w);
    folk(pp[0],pp[1],{h:dirn>0?hSW:hNE,rng:rr(3,7),spd:rr(0.5,0.9),flag:-1,y:0})}
  // 靠栏看热闹
  for(const sd of[-1,1])for(let i=0;i<14;i++){const pp=bp(rr(-18,18),sd*4.05);person({x:pp[0],z:pp[1],y:0,h:ry+(sd>0?0:PI),mode:9,role:pick(['walk','scholar','elder','bundle']),rng:0,flag:-1,hat:pick(['futou','bun','dou','cap'])})}
  // 桥上牲口
  for(let i=0;i<3;i++){const pp=bp(rr(-6,6),(i%2?1:-1)*1.2);rider(pp[0],pp[1],i%2?hNE:hSW,{kind:pick(['horse','donkey']),rng:5,spd:0.9,flag:-1})}
  // 桥头：两端人群与摊
  for(const sg of[-1,1])for(let i=0;i<16;i++){const pp=bp(sg*(sp+rr(3,20)),rr(-8,8));folk(pp[0],pp[1],{rng:rr(1,5),h:rnd()*PI*2})}
  for(const sg of[-1,1]){let pp=bp(sg*(sp+10),3);chat(pp[0],pp[1],4);pp=bp(sg*(sp+16),-5);chat(pp[0],pp[1],3);
    for(const w of[-9,9]){pp=bp(sg*(sp+6),w);stallScene(pp[0],pp[1],ry+(w>0?PI/2:-PI/2),pick(['fruit','mix','pot']))}}
  const pp=bp(sp+11,1.5);
  grp({x:pp[0],z:pp[1],h:hNE,rng:5,spd:1.0,mode:4},[[sedan,0,0],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:0,hat:'futou',robe:0x6d5a48})),-1.7,0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:3.14,hat:'futou',robe:0x6d5a48})),-1.7,-0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:3.14,hat:'futou',robe:0x6d5a48})),1.7,0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:0,hat:'futou',robe:0x6d5a48})),1.7,-0.55]]);
  LABELS.push({txt:'虹桥',x,y:BRIDGE.base+BRIDGE.H+2.5,z:zc,pri:0});
  LABELS.push({txt:'汴河',x:TX(0.4),y:0,z:riverAt(TX(0.4)).z,pri:1});
}
/* ---------- 城门街市 ---------- */
function sceneCity(){
  gateTower(TX(0.875),4);
  LABELS.push({txt:'城门',x:TX(0.875),y:14,z:4,pri:0});
  // 街上人群：疏密有致
  for(let i=0;i<230;i++){const t=rr(0.605,0.995);const x=TX(t);if(Math.abs(x-TX(0.875))<9)continue;
    const dens=1;const z=streetZ(x)+rr(-4.5,4.5);folk(x,z,{rng:rr(3,18)})}
  for(let i=0;i<14;i++){const t=rr(0.62,0.99);const x=TX(t);if(Math.abs(x-TX(0.875))<10)continue;chat(x,streetZ(x)+rr(-4,4),pick([2,3,4]))}
  // 城门内外的骆驼队
  {const L2=[];for(let i=0;i<4;i++)L2.push([(q)=>animal('camel',Object.assign(q,{load:'camel',ph:q.gph+i*0.4})),-i*3.2,0]);L2.push([(q)=>person(Object.assign(q,{role:'traveler',ph:q.gph,hat:'dou'})),2.2,1.0]);L2.push([(q)=>person(Object.assign(q,{role:'walk',ph:q.gph})),-12.5,1.0]);
   grp({x:TX(0.895),z:3.5,h:0,rng:18,spd:1.0,mode:14},L2)}
  // 牛车
  oxTeam({x:TX(0.79),z:8,h:PI,rng:14,spd:0.9},4);oxTeam({x:TX(0.77),z:-2,h:0,rng:12,spd:0.8},2);oxTeam({x:TX(0.945),z:6,h:PI,rng:10,spd:0.8},2);
  oxTeam({x:TX(0.71),z:1,h:PI,rng:10,spd:0.8},2);oxTeam({x:TX(0.99),z:2,h:PI,rng:5,spd:0.7},1);
  // 独轮车
  for(let i=0;i<5;i++){const t=rr(0.65,0.99);const x=TX(t);if(Math.abs(x-TX(0.875))<10)continue;const z=streetZ(x)+rr(-3,3);const h=rnd()<0.5?PI:0;
    grp({x,z,h,rng:rr(5,14),spd:0.9,mode:1},[[barrow,0,0],[(q)=>person(Object.assign(q,{role:'walk',ph:q.gph,spd:0.9})),-1.5,0]])}
  // 轿
  for(const t of[0.8,0.935]){const x=TX(t);grp({x,z:streetZ(x)-1,h:PI,rng:9,spd:1.0,mode:4},[[sedan,0,0],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:0,hat:'futou',robe:0x6d5a48})),-1.7,0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:3.14,hat:'futou',robe:0x6d5a48})),-1.7,-0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:3.14,hat:'futou',robe:0x6d5a48})),1.7,0.55],[(q)=>person(Object.assign(q,{role:'holdup',mode:4,ph:0,hat:'futou',robe:0x6d5a48})),1.7,-0.55]])}
  // 骑者与驴队
  for(let i=0;i<9;i++){const t=rr(0.64,0.99);const x=TX(t);if(Math.abs(x-TX(0.875))<10)continue;rider(x,streetZ(x)+rr(-3,3),rnd()<0.5?PI:0,{kind:pick(['horse','horse','donkey']),rng:rr(8,18),spd:rr(1.2,1.8)})}
  for(const t of[0.73,0.86,0.965]){const x=TX(t);donkeyTrain(x,streetZ(x)+3,PI,ri(3,5),{rng:10})}
  // 猪狗羊
  for(let i=0;i<7;i++){const x=TX(rr(0.66,0.99));const z=streetZ(x)+rr(-5,5);animal(pick(['dog','pig','dog','pig']),{x,z,h:rnd()*6.28,mode:rnd()<0.5?14:15,spd:0.6,rng:rnd()<0.5?rr(4,10):0})}
  for(let i=0;i<5;i++){const x=TX(rr(0.74,0.77));const z=streetZ(x)+9+rr(-1,2);animal('sheep',{x:x+i*1.1,z:z+rr(-1,1),h:rr(6.28),mode:15,spd:0.5})}
  // 十字街口：大柳 + 茶摊
  for(const[t,z]of[[0.775,-14],[0.79,-12],[0.9335,-14],[0.95,-12],[0.925,16]]){willow(TX(t),z,rr(1.2,1.5))}
  for(let i=0;i<10;i++)bird(TX(rr(0.7,0.99)),rr(10,16),rr(-30,10),rr(12,30));
  for(let i=0;i<4;i++)bird(TX(rr(0.4,0.6)),rr(9,14),rr(-30,10),rr(12,26));
}
