/* ---------- 原画坐标：第 n 段分图（1 最右，16 最左）上的像素 → 世界坐标 ----------
   全卷长 1200 个单位（x 从 +600 到 -600），画面上下对应 z 从 -50（远）到 +40（近）。 */
function TP(n,px,py){var x=n===1?517.5+82.5*px/2000:n===16?-600+82.5*px/2000:600-75*n-7.5+90*px/2000;return [x,-50+90*py/((n===1||n===16)?1363:1250)];}
var ground=new T.Mesh(new T.PlaneGeometry(2800,1000),M(0xdcc89d));ground.rotation.x=-PI/2;ground.position.set(0,0,-80);ground.receiveShadow=true;scene.add(ground);
var ro={},ro2={};
function curveOf(pts){return new T.CatmullRomCurve3(pts.map(function(p){return new T.Vector3(p[0],0,p[1]);}));}
function tableOf(curve,N,hws){var tb=[],len=0,prev=null,n=hws?hws.length-1:0;for(var i=0;i<=N;i++){var t=i/N,p=curve.getPoint(t),tg=curve.getTangent(t),hw=0;if(hws){var f=t*n,k=Math.min(n-1,Math.floor(f));hw=hws[k]+(hws[k+1]-hws[k])*(f-k);}if(prev)len+=Math.hypot(p.x-prev.x,p.z-prev.z);tb.push({x:p.x,z:p.z,tx:tg.x,tz:tg.z,hw:hw,s:len});prev=p;}tb.len=len;return tb;}
function tableAt(tb,s,off,out){s=Math.max(0,Math.min(tb.len,s));var lo=0,hi=tb.length-1;while(hi-lo>1){var m=(lo+hi)>>1;if(tb[m].s<=s)lo=m;else hi=m;}var a=tb[lo],b=tb[hi],f=(s-a.s)/((b.s-a.s)||1),tx=a.tx+(b.tx-a.tx)*f,tz=a.tz+(b.tz-a.tz)*f,l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;out.hw=a.hw+(b.hw-a.hw)*f;out.x=a.x+(b.x-a.x)*f-tz*off;out.z=a.z+(b.z-a.z)*f+tx*off;out.dx=tx;out.dz=tz;return out;}
function tableNear(tb,x,z){var b=0,bd=1e12;for(var i=0;i<tb.length;i++){var dx=tb[i].x-x,dz=tb[i].z-z,d=dx*dx+dz*dz;if(d<bd){bd=d;b=i;}}return{i:b,s:tb[b].s,d:Math.sqrt(bd)};}
function ribbonOf(tb,hw,y,color,pad){var pos=[],idx=[];for(var i=0;i<tb.length;i++){var a=tb[i],w=(typeof hw==='number'?hw:a.hw)+(pad||0);pos.push(a.x-a.tz*w,y,a.z+a.tx*w,a.x+a.tz*w,y,a.z-a.tx*w);if(i<tb.length-1){var k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}
 var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();var m=new T.Mesh(g,M(color,{side:T.DoubleSide}));m.receiveShadow=true;scene.add(m);return m;}

/* 汴河：每个控制点是 [x, 河心 z, 半宽]，由原画上北岸和南岸的位置算出 */
function RB(n,px,pyN,pyS){var a=TP(n,px,pyN),b=TP(n,px,pyS);return [a[0],(a[1]+b[1])/2,(b[1]-a[1])/2];}
var RCP=[[680,32,22],RB(1,1390,820,1400),RB(1,700,860,1400),RB(2,1500,800,1400),RB(2,500,790,1400),RB(3,1500,930,1400),RB(3,700,1120,1400),RB(4,1500,1180,1400),RB(4,500,1090,1400),
 RB(5,1600,760,1400),RB(5,900,640,1400),RB(5,300,470,1400),RB(6,1500,500,1400),RB(6,600,400,1400),RB(7,1500,390,1400),RB(7,800,320,1250),RB(7,300,290,1050),
 RB(8,1500,110,900),RB(8,800,130,790),RB(8,200,140,760),RB(9,1700,130,640),RB(9,1000,160,620),RB(9,300,170,600),RB(10,1700,150,600),
 [TP(10,1050,330)[0],TP(10,1050,330)[1],22],[TP(10,900,60)[0],TP(10,900,60)[1],19],[-119,-110,16],[-120,-260,14]];
var RT=tableOf(curveOf(RCP),600,RCP.map(function(p){return p[2];})),RLEN=RT.len;
ribbonOf(RT,null,.05,0xa48c5e,1.5);ribbonOf(RT,null,.08,0xa7b29c,0);
function riverAt(u,off,out){return tableAt(RT,u*RLEN,off,out);}
function uNear(x,z){return tableNear(RT,x,z).s/RLEN;}
function uT(n,px,py){var p=TP(n,px,py);return uNear(p[0],p[1]);}
function inRiver(x,z,pad){pad=pad==null?2:pad;for(var i=0;i<RT.length;i+=2){var dx=RT[i].x-x,dz=RT[i].z-z,r=RT[i].hw+pad;if(dx*dx+dz*dz<r*r)return true;}return false;}
var ripples=[];(function(){var m=M(0xdfe6d2,{transparent:true,opacity:.5});for(var i=0;i<220;i++){var r=mk(GB,m,scene,.14,.02,rr(2,5),0,.1,0,true);r.receiveShadow=false;ripples.push({m:r,u:rr(.02,.97),f:rr(-.9,.9),v:rr(.004,.009)});}})();
/* 沼泽里的沙洲、护城河 */
(function(){[[1,900,1050,26,8],[1,300,1150,34,9],[2,1200,1020,30,7],[2,500,1180,40,12],[3,1500,1150,26,8],[2,1800,1150,20,6]].forEach(function(s){var p=TP(s[0],s[1],s[2]);var m=mk(GC,0xd3bf93,scene,s[3]/2,.14,s[4]/2,p[0],.1,p[1],true);m.scale.set(s[3]/2,.14,s[4]/2);});
 var inl=TP(1,480,740);var w=mk(GB,0xa7b29c,scene,8,.06,26,inl[0],.09,inl[1]+6,true);})();
var MOATX=-325.5,MOATHW=12;
(function(){var m=mk(GB,0xa7b29c,scene,MOATHW*2,.06,520,MOATX,.08,-70,true);var b=mk(GB,0xa48c5e,scene,MOATHW*2+3,.04,520,MOATX,.05,-70,true);})();

/* 大路：按原画里人流的走向 */
var RDP=[[690,-32],[640,-22]].concat([[1,1150,640],[1,800,690],[1,480,790],[1,150,800],[2,1700,760],[2,1250,650],[2,700,700],[2,250,740],[3,1700,800],[3,1100,930],[3,400,960],[4,1700,1000],[4,1200,1010],[4,700,960],[4,300,830],
 [5,1700,640],[5,1380,560],[5,1050,330],[5,600,180],[5,150,110],[6,1300,40],[6,450,190],[6,100,220],[7,1700,230],[7,1200,80],[7,600,110],[7,200,90],[8,1700,50],[8,1250,60],[8,1080,170],
 [9,1480,780],[9,1300,890],[9,1000,1010],[9,700,1130],[9,450,1230],[10,1700,1300],[10,900,1310],[10,300,1300],[11,1500,1290],[11,1050,1230],[11,1100,1000],[11,1170,800],[11,800,740],[11,300,700],
 [12,1700,650],[12,1200,640],[12,900,630],[12,500,700],[12,150,800],[13,1700,890],[13,1300,900],[13,900,900],[13,600,880],[13,290,820],[14,1500,800],[14,1100,790],[14,700,800],[14,300,850],
 [15,1700,820],[15,1200,770],[15,800,720],[15,400,760],[15,100,800],[16,1750,880],[16,1300,900],[16,900,950]].map(function(a){return TP(a[0],a[1],a[2]);}),[[-640,14],[-700,16]]);
var RD=tableOf(curveOf(RDP),1600),RDLEN=RD.len;
ribbonOf(RD,6.5,.03,0xe6d6ae,0);
function roadAt(s,off,out){return tableAt(RD,s,off,out);}
function sNear(x,z){return tableNear(RD,x,z).s;}
function sT(n,px,py){var p=TP(n,px,py);return sNear(p[0],p[1]);}
function nearRoad(x,z){var bd=1e12;for(var i=0;i<RD.length;i+=2){var dx=RD[i].x-x,dz=RD[i].z-z,d=dx*dx+dz*dz;if(d<bd)bd=d;}return Math.sqrt(bd);}
var roadZx={};(function(){for(var i=0;i<RD.length;i++){var k=Math.round(RD[i].x/4);if(roadZx[k]==null)roadZx[k]=RD[i].z;}})();
function roadZ(x){var k=Math.round(x/4);for(var d=0;d<40;d++){if(roadZx[k+d]!=null)return roadZx[k+d];if(roadZx[k-d]!=null)return roadZx[k-d];}return 0;}
function sidePath(arr,hw){var pts=arr.map(function(a){return a.length===3?TP(a[0],a[1],a[2]):a;});var tb=tableOf(curveOf(pts),Math.max(20,pts.length*14));ribbonOf(tb,hw||3.5,.035,0xe6d6ae,0);var out=[];for(var i=0;i<tb.length;i++)out.push([tb[i].x,tb[i].z]);return out;}

/* 虹桥：从北岸的桥头斜着跨到西南岸 */
var BE=TP(8,1080,170),BWp=TP(9,1480,780),BC=[(BE[0]+BWp[0])/2,(BE[1]+BWp[1])/2],BL=Math.hypot(BE[0]-BWp[0],BE[1]-BWp[1])/2,BW=6.5,BH=11,BDX=(BE[0]-BWp[0])/(2*BL),BDZ=(BE[1]-BWp[1])/(2*BL);
function groundY(x,z){var rx=x-BC[0],rz=z-BC[1],lx=rx*BDX+rz*BDZ,lz=-rx*BDZ+rz*BDX;if(abs(lx)<BL&&abs(lz)<BW)return BH*(1-(lx/BL)*(lx/BL))+.3;return 0;}
var WALLX=-385,WALLT=30,GATEZ=roadAt(sNear(-385,16),0,ro).z;
function squeeze(x,z){if(groundY(x,z)>0)return .62;if(abs(x-WALLX)<WALLT/2+6)return .5;if(abs(x-TP(1,480,0)[0])<9)return .4;return 1;}
