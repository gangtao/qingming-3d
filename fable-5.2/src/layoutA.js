/* ================= 布景：逐段对照原画 ================= */
var SB=1.8;
function Gp(n,px,py,ry,sc){var p=TP(n,px,py),g=at(p[0],p[1],ry||0);g.scale.setScalar(sc||SB);return g;}
function Hh(n,px,py,w,d,h,ry,o){return house(Gp(n,px,py,ry),w,d,h,o);}
function Tr(n,px,py,kind,s,force){var p=TP(n,px,py);return tree(p[0],p[1],kind||'willow',s,force);}
function St(n,px,py,ry,anim,o){var p=TP(n,px,py);return still(person(o||rndPerson({carry:null})),p[0],p[1],ry==null?rnd()*6.28:ry,anim||ANIM.idle,groundY(p[0],p[1]));}
function Sit(n,px,py,ry,anim,o,up){var p=TP(n,px,py),P=person(o||rndPerson({carry:null}));sit(P);P.g.position.y+=(up==null?.3:up);return still(P,p[0],p[1],ry==null?rnd()*6.28:ry,anim||ANIM.talk);}
function crowd(n,px0,px1,py0,py1,cnt,anims,focus,o){for(var i=0;i<cnt;i++){var p=TP(n,rr(px0,px1),rr(py0,py1)),ry=focus?Math.atan2(focus[0]-p[0],focus[1]-p[1])+rr(-.3,.3):rnd()*6.28;still(person(o?Object.assign({},o):rndPerson({carry:null})),p[0],p[1],ry,pick(anims||[ANIM.talk,ANIM.idle,ANIM.idle,ANIM.bow]),groundY(p[0],p[1]));}}
function PT(arr,closed){return mkPath(arr.map(function(a){return TP(a[0],a[1],a[2]);}),closed);}
function Lb(txt,n,px,py,h){var p=TP(n,px,py);label(txt,p[0],h||9,p[1]);}
function Seat(n,px,py,k){var p=TP(n,px,py);seatGroup(p[0],p[1],k||3);}
function Stall(n,px,py,ry,o){var p=TP(n,px,py);return stall(p[0],p[1],ry||0,o);}
function Sign(txt,n,px,py,o){var g=Gp(n,px,py,(o&&o.ry)||0,1.7);return sign(g,txt,0,0,o);}
function Par(n,px,py,c,sc){var g=Gp(n,px,py,0,sc||1.6);parasol(g,0,0,c||0xcdbb8c);return g;}
function shed(g,w,d,h,th){var c=0x5a4028;[[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1]].forEach(function(s){box(g,c,.16,h,.16,s[0]*(w/2-.2),h/2,s[1]*(d/2-.2));});roof(g,w,d,h,th?1.9:1.5,th?pick(THATCH):pick(TILE),1.6);
 box(g,0x7a5a3a,w*.36,.1,d*.3,-w*.22,.8,0);box(g,0x7a5a3a,w*.36,.1,d*.3,w*.22,.8,0);box(g,0x6a4a33,w*.36,.08,.3,-w*.22,.45,d*.28);box(g,0x6a4a33,w*.36,.08,.3,w*.22,.45,d*.28);return g;}
function pavilion(g){[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){box(g,0x8c3b2a,.2,4.6,.2,s[0]*1.6,2.3,s[1]*1.6);});box(g,0x8f8876,4.4,.5,4.4,0,.25,0);box(g,0x7a4a34,3.8,.2,3.8,0,2.4,0);mk(GK4,0x5d6263,g,3.2,1.6,3.2,0,5.4,0);return g;}
function cartStill(n,px,py,ry,big){var g=Gp(n,px,py,ry,big?1.6:1.35);cartBody(g);return g;}
function sedanStill(n,px,py,ry){var g=Gp(n,px,py,ry,PS);sedanBody(g,.06);return g;}
function crewOf(L,nRoof,nDeck,extra){var c=[{x:0,z:-L*.9,an:ANIM.scull,ry:PI}];for(var i=0;i<nRoof;i++)c.push({x:rr(-.6,.6),z:rr(-L*.5,L*.4),y:2.5,an:pick([ANIM.idle,ANIM.talk,ANIM.idle]),ry:rnd()*6});for(var j=0;j<nDeck;j++)c.push({x:rr(-.8,.8),z:rr(L*.5,L*.9),an:pick([ANIM.idle,ANIM.lean,ANIM.cook]),ry:rnd()*6});return extra?c.concat(extra):c;}
function boatAt(n,px,py,ry,o){o.scale=o.scale||2.2;if(!o.crew)o.crew=crewOf(o.L||6,o.roof==null?1:o.roof,o.deck==null?1:o.deck);var B=boat(o),p=TP(n,px,py);B.g.position.set(p[0],.1,p[1]);B.g.rotation.y=ry;actors.push({g:B.g,x:p[0],pose:B.pose});return B;}
var WEST=-PI/2;

/* 远山 */
[[660,-300,140,40],[480,-330,180,52],[280,-340,160,36],[60,-350,200,46],[-180,-340,180,38],[-420,-350,220,50],[-660,-330,160,40],[840,-290,160,46],[-860,-310,180,44]].forEach(function(m){var s=mk(GS,M(0xa9a88c),scene,m[2],m[3],m[2]*.45,m[0],-2,m[1],true);s.receiveShadow=false;});

/* ---- 虹桥 ---- */
(function(){
 var bg=at(BC[0],BC[1],Math.atan2(-BDZ,BDX)),N=30,RED=0x8c5236;
 for(var i=0;i<N;i++){var x0=-BL+i*2*BL/N,x1=x0+2*BL/N,xm=(x0+x1)/2,y0=BH*(1-x0*x0/BL/BL),y1=BH*(1-x1*x1/BL/BL),a=Math.atan2(y1-y0,x1-x0),len=Math.hypot(x1-x0,y1-y0)+.1;
  var d=box(bg,0x9a6a48,len,.5,BW*2+.8,xm,(y0+y1)/2,0);d.rotation.z=a;
  [-5.4,-2.7,0,2.7,5.4].forEach(function(z){var r=box(bg,0x6e3f2a,len,.5,.7,xm,(y0+y1)/2-.5,z);r.rotation.z=a;r.castShadow=false;});
  [-1,1].forEach(function(s){var r=box(bg,RED,len,.14,.14,xm,(y0+y1)/2+1.35,s*(BW+.15));r.rotation.z=a;r.castShadow=false;var r2=box(bg,RED,len,.1,.1,xm,(y0+y1)/2+.8,s*(BW+.15));r2.rotation.z=a;r2.castShadow=false;box(bg,RED,.18,1.4,.18,x0,y0+.8,s*(BW+.15)).castShadow=false;});}
 [-1,1].forEach(function(s){box(bg,0x8f8876,9,4.4,BW*2+2.4,s*(BL-3.2),1.3,0);});
 [-1,1].forEach(function(s){[-1,1].forEach(function(q){cyl(bg,0x4a3626,.16,11,s*(BL+2.5),5.5,q*8.5);box(bg,0x4a3626,1.6,.12,.12,s*(BL+2.5),10.4,q*8.5);box(bg,0xe8e0c8,.5,.5,.9,s*(BL+2.5),11,q*8.5);});});
 label('虹桥',BC[0],BH+8,BC[1]);
 /* 桥上：靠北栏杆往下看船的人、桥面两侧的摊子 */
 function onB(l,w){return [BC[0]+BDX*l-BDZ*w,BC[1]+BDZ*l+BDX*w];}
 var up=Math.atan2(-BDZ,BDX)+PI;/* 桥的局部 -z（上游一侧）朝向 */
 for(var o=0;o<34;o++){var l=rr(-BL*.62,BL*.62),side=o<24?-1:1,p=onB(l,side*(BW-.9)),ry=Math.atan2(-BDZ*-side,BDX*-side);/* 面向栏杆外 */
  ry=Math.atan2(-side*-BDZ,-side*BDX);var P=person(rndPerson({carry:null}));still(P,p[0],p[1],Math.atan2(side*-BDZ,side*BDX),pick([ANIM.point,ANIM.wave,ANIM.lean,ANIM.shout,ANIM.point,ANIM.lean]),groundY(p[0],p[1]));}
 [[-BL*.72,1],[-BL*.5,-1],[BL*.7,1],[BL*.55,-1],[-BL*.86,-1],[BL*.84,-1]].forEach(function(s){var p=onB(s[0],s[1]*(BW-2.2));var g=at(p[0],p[1],0);g.position.y=groundY(p[0],p[1])-.1;g.scale.setScalar(1.4);parasol(g,0,0);box(g,0x8a6a44,1.6,.8,.9,0,.4,0);still(person({hat:'cap'}),p[0]+.6,p[1]-.9,rnd()*6,ANIM.vend,groundY(p[0],p[1]));});
})();

/* ---- 城墙、城门、城楼、护城河桥 ---- */
(function(){
 var g=at(WALLX,0,0),EARTH=0xa58f63,HT=14,gz=GATEZ,GW=5.5;
 box(g,EARTH,WALLT,HT,260,0,HT/2,gz-GW-130);box(g,EARTH,WALLT,HT,160,0,HT/2,gz+GW+80);box(g,EARTH,WALLT,HT-9.5,GW*2,0,9.5+(HT-9.5)/2,gz);box(g,0x3b2b1f,WALLT-.4,.4,GW*2,0,9.3,gz);
 [-1,1].forEach(function(s){box(g,0x8f8876,WALLT+.8,9.3,1.4,0,4.65,gz+s*(GW+.5));});
 [-1,1].forEach(function(s){box(g,0xa8916a,WALLT+6,3,260,0,1.5,gz-GW-130).castShadow=false;});
 for(var i=0;i<26;i++){var tz=gz+(rnd()<.6?-rr(22,150):rr(22,90));var tg=tree(WALLX+rr(-10,10),tz,'bare',1.3,true);tg.position.y=HT;}
 for(var j=0;j<14;j++){tree(WALLX+WALLT/2+rr(2,7),gz+(rnd()<.5?-rr(14,120):rr(14,70)),'bare',1.5,true);}
 /* 城楼 */
 box(g,0x8f8876,26,1.2,40,0,HT+.6,gz);[-1,1].forEach(function(s){box(g,0x9c4a34,26.4,.16,.16,0,HT+2.4,gz+s*20);box(g,0x9c4a34,.16,.16,40,s*13,HT+2.4,gz);});
 for(var c=0;c<8;c++)[-1,1].forEach(function(s){cyl(g,0x8c3b2a,.34,7,s*8,HT+4.7,gz-14+c*4);});
 box(g,0xa2523a,14.5,6.4,27,0,HT+4.4,gz);box(g,0x3b2b1f,14.8,3.4,5,0,HT+3,gz);box(g,0xd9c9a3,14.9,1.2,26,0,HT+6.6,gz);
 box(g,TILE[2],24,.5,38,0,HT+8.4,gz);var pv=pivot(g,0,0,gz);pv.rotation.y=PI/2;roof(pv,32,20,HT+8.6,6,TILE[0],3);
 [-1,1].forEach(function(s){var e=box(g,0x3d3a38,.5,.4,12,s*5.5,HT+11.6,gz-17.2);e.rotation.z=s*.5;e.castShadow=false;});
 /* 城内上城楼的马道 */
 var rp=box(g,EARTH,9,1,44,-WALLT/2-4.5,HT/2,gz-GW-26);rp.rotation.x=-.31;box(g,EARTH,9,HT*.5,44,-WALLT/2-4.5,HT*.22,gz-GW-30);
 label('城门',WALLX+WALLT/2,HT+19,gz);
 /* 护城河上的平桥 */
 var b=at(MOATX,roadZ(MOATX),0),bz=0;box(b,0xb39a6a,MOATHW*2+6,.24,17,0,.13,0).castShadow=false;
 [-1,1].forEach(function(s){box(b,0x8c5236,MOATHW*2+6,.14,.14,0,1.5,s*8.4);box(b,0x8c5236,MOATHW*2+6,.1,.1,0,.9,s*8.4);for(var i=0;i<12;i++)box(b,0x8c5236,.2,1.6,.2,-MOATHW-3+i*(MOATHW*2+6)/11,.8,s*8.4);});
 for(var k=0;k<5;k++)[-1,1].forEach(function(s){cyl(b,0x5a4028,.3,2,-MOATHW+2+k*5,-.95,s*7.6);});
 var mz=roadZ(MOATX);
 for(var p=0;p<13;p++)still(person(rndPerson({carry:null})),MOATX+rr(-11,11),mz-7.4,PI,pick([ANIM.lean,ANIM.lean,ANIM.talk,ANIM.point]));
 for(var q=0;q<9;q++)still(person(rndPerson({carry:null})),MOATX+rr(-10,8),mz+7.4,0,pick([ANIM.lean,ANIM.lean,ANIM.point]));
 label('护城河桥',MOATX,7,mz+8);
})();

/* ---- 第 1 段：卷首，疏林、驮炭驴队、小木桥 ---- */
(function(){
 [[1100,600],[1010,540],[660,620],[560,500],[250,500],[120,620],[60,540],[330,420],[820,480],[1250,520],[1330,640],[900,420]].forEach(function(t){Tr(1,t[0],t[1],'bare',rr(1.8,2.6));});
 [[150,300],[420,260],[700,300],[1000,300]].forEach(function(t){Tr(1,t[0],t[1],'willow',2.4);});
 var p=TP(1,480,790),b=at(p[0],p[1],0);box(b,0x9a7a52,11,.22,5.5,0,.2,0).castShadow=false;for(var i=0;i<6;i++){box(b,0x5a4028,.22,1.3,.22,-5+i*2,.1,2.6);box(b,0x5a4028,.22,1.3,.22,-5+i*2,.1,-2.6);}
 boatAt(1,420,930,-1.2,{L:3,W:1.7,cabin:0,scale:1.5,crew:[]});
 Lb('小木桥',1,480,790,5);
})();

/* ---- 第 2 段：林间茅舍、打谷场 ---- */
(function(){
 [[150,560,.2],[330,540,-.1],[480,575,.3],[60,605,0],[230,470,.1]].forEach(function(h){Hh(2,h[0],h[1],rr(5,6.5),4.2,2.4,h[2],{thatch:1,wall:0xc9b78c});});
 Hh(2,1100,455,8,5,3,0,{});shed(Gp(2,1000,560,0),9,4.5,2.6,1);Hh(2,860,520,5,4,2.4,.1,{thatch:1,wall:0xc9b78c});
 Tr(2,1330,470,'willow',2.9,true);
 for(var i=0;i<16;i++)Tr(2,rr(60,1060),rr(230,610),'bare',rr(1.9,2.8));
 for(var j=0;j<9;j++)Tr(2,rr(1380,2000),rr(240,500),'willow',rr(2,2.6));
 [[1680,640],[1760,720],[1900,620],[1840,780]].forEach(function(t){Tr(2,t[0],t[1],'bare',2.4);});
 var p=TP(2,560,505);[0,1].forEach(function(k){var c=mk(GC,0x8f8876,at(p[0]+k*4,p[1]+k,rr(0,3)),.9,2.2,.9,0,.9,0);c.rotation.z=PI/2;});
 St(2,760,565,1,ANIM.idle,{hat:'bun'});St(2,1190,590,2,ANIM.cook,{hat:'bun'});
 Lb('茅舍',2,330,520,9);
})();

/* ---- 第 3 段：水边的老柳 ---- */
(function(){
 [[250,850,3.6],[520,880,3.4],[700,950,3.8],[950,900,3.6],[1080,1000,3.8],[1300,860,3.4],[330,200,3],[130,90,2.8],[560,330,3],[160,520,3]].forEach(function(t){Tr(3,t[0],t[1],'willow',t[2],true);});
 [[1050,200],[1250,180],[1420,300],[1700,230],[1780,290],[1950,200],[1560,160],[1150,330]].forEach(function(t){Tr(3,t[0],t[1],'bare',rr(2,2.8));});
 Hh(3,1800,570,6,4.5,2.5,.2,{thatch:1,wall:0xc9b78c});Hh(3,1930,600,5,4,2.3,-.1,{thatch:1,wall:0xc9b78c});
 Hh(3,60,800,6,4.5,2.6,.3,{thatch:1,wall:0xc9b78c});var f=TP(3,150,890);for(var i=0;i<9;i++)box(at(f[0]-6+i*1.4,f[1],0),0x6a5238,.12,1.5,.12,0,.75,0);
 Lb('老柳',3,700,900,16);
})();

/* ---- 第 4 段：踏青归来、惊马、路边茶肆 ---- */
(function(){
 Hh(4,1250,740,9,6,3,-.35,{});Hh(4,1750,870,6,4.5,2.6,.2,{thatch:1,wall:0xc9b78c});
 var f=TP(4,1650,960);for(var i=0;i<12;i++)box(at(f[0]-9+i*1.5,f[1],0),0x6a5238,.12,1.5,.12,0,.75,0);
 shed(Gp(4,150,410,0),10,5,2.7,1);Hh(4,330,320,8,5,3,0,{thatch:1,wall:0xc9b78c});Hh(4,100,250,7,5,2.8,0,{thatch:1,wall:0xc9b78c});Hh(4,560,300,6,4.5,2.6,.2,{thatch:1,wall:0xc9b78c});
 Seat(4,110,470,3);Seat(4,230,480,3);
 var d=TP(4,290,455);quadStill('donkey',d[0],d[1],-1.2,{bray:1});
 var o1=TP(4,620,510),o2=TP(4,690,470);quadStill('ox',o1[0],o1[1],.8,{lie:1});quadStill('ox',o2[0],o2[1],-1.4,{});
 var rl=TP(4,800,455);var c=mk(GC,0x8f8876,at(rl[0],rl[1],.5),.9,2.2,.9,0,.9,0);c.rotation.z=PI/2;
 /* 田垄 */
 [[400,130,60,16],[150,60,30,10],[700,90,24,12]].forEach(function(q){var p=TP(4,q[0],q[1]),g=at(p[0],p[1],-.25);var m=box(g,0xcfc48c,q[2],.04,q[3],0,.03,0);m.castShadow=false;for(var k=1;k<q[3]/2.6;k++)box(g,0xa99b68,q[2]-1,.02,.14,0,.06,-q[3]/2+k*2.6).castShadow=false;});
 [[450,300,2.6],[600,250,2.4],[950,250,2.6],[1450,250,2.8],[1550,290,2.6],[1900,150,2.6],[1800,60,2.4],[250,650,2.8],[150,880,3.6],[1500,650,3.4],[1850,720,3],[900,120,2.2],[1100,90,2.4]].forEach(function(t){Tr(4,t[0],t[1],'willow',t[2],true);});
 for(var s=0;s<8;s++)Tr(4,rr(700,950),rr(770,900),'bare',rr(.8,1.2),true);
 St(4,440,690,1.6,ANIM.idle,{carry:'staff',hat:'cap',long:1});
 var hx=TP(4,1150,560);St(4,1450,420,Math.atan2(hx[0]-TP(4,1450,420)[0],hx[1]-TP(4,1450,420)[1]),ANIM.point);St(4,1350,470,-1.2,ANIM.shout,{s:.6,hat:'bun'});St(4,760,620,1.4,ANIM.wave,{hat:'bun'});
 Lb('茶肆',4,150,400,10);
})();

/* ---- 第 5 段：码头，卸粮的漕船 ---- */
(function(){
 shed(Gp(5,1780,400,-.15),11,6,2.8,1);shed(Gp(5,1620,300,-.15),9,5,2.8,0);Seat(5,1820,450,3);Seat(5,1930,410,3);Seat(5,1650,330,3);Seat(5,1300,330,2);
 var d=TP(5,1940,470);quadStill('donkey',d[0],d[1],-1,{bray:1});
 pavilion(Gp(5,1580,110,0,1.9));
 Hh(5,650,100,10,5,3.2,0,{open:1});Hh(5,1000,80,9,5,3.2,0,{open:1,awn:1});Hh(5,1260,110,8,5,3.2,0,{open:1});
 Hh(5,800,370,11,6,3.2,-.4,{open:1,awn:1});Hh(5,1120,440,8,5,3,-.4,{open:1,awn:1});Seat(5,1040,570,3);Seat(5,1200,590,3);
 Hh(5,120,250,10,7,3.6,0,{});Hh(5,170,120,9,6,3.4,0,{});Hh(5,340,390,7,5,3,0,{});
 Sign('酒',5,500,150);var fl=Gp(5,1180,540,0,1.6);flag(fl,0,0,6,0xe8e0c8);
 /* 卸货 */
 var pl=TP(5,1330,600),pg=at(pl[0],pl[1],0);for(var s=0;s<22;s++)sph(pg,0xd9cfae,.75,.42,.5,rr(-3,3),.3+Math.floor(s/8)*.55,rr(-1.6,1.6));
 var boss=person({hat:'cap',long:1});sit(boss);boss.g.position.y+=1.5;still(boss,pl[0],pl[1]+.4,.3,ANIM.vend);
 St(5,1320,490,.2,ANIM.talk,{hat:'cap',long:1});St(5,1380,500,1.2,ANIM.bow,{hat:'bun'});St(5,1440,510,-1.2,ANIM.bow,{hat:'cap'});St(5,1130,590,1,ANIM.idle,{hat:'bun'});
 var dock=PT([[5,1560,820],[5,1520,700],[5,1420,630],[5,1350,640],[5,1460,590],[5,1590,720]],true);for(var w=0;w<7;w++)walker(dock,{hat:'bun',carry:'sack',v:1.6,dir:1,at:w*dock.len/7,robe:pick([0xcfc3a3,0xa9785a,0xb7a074])});
 var gp=TP(5,1540,770);var pk=box(at(gp[0],gp[1],.5),0x9a7a52,1.4,.12,9,0,.9,0);pk.rotation.x=.12;
 boatAt(5,1020,870,2.55,{L:6.2,W:3.5,cargo:1,roof:1,deck:2});boatAt(5,1430,960,2.4,{L:5.6,W:3.2,cargo:1});boatAt(5,1660,1130,1.9,{L:5,W:3,roof:0});boatAt(5,170,560,WEST,{L:7.5,W:4,roof:2,deck:1});
 Tr(5,480,330,'willow',2.9,true);Tr(5,1750,660,'willow',3,true);Tr(5,1920,900,'willow',3.2,true);Tr(5,1650,1010,'willow',2.8,true);Tr(5,1420,90,'bare',2.4);Tr(5,1330,60,'bare',2.2);
 Lb('码头卸货',5,1400,600,9);Lb('汴河',5,500,1000,5);
})();

/* ---- 第 6 段：临河的大酒楼、成排的漕船 ---- */
(function(){
 house2(Gp(6,1300,270,0,1.9),17,8);Hh(6,1780,300,9,6,3.2,0,{});Hh(6,850,250,8,6,3.2,.1,{open:1});Hh(6,1900,150,7,5,3,0,{});
 var tg=TP(6,1300,430);var tp=at(tg[0],tg[1],0);box(tp,0x8f8876,30,1.2,5,0,.6,0);for(var i=0;i<10;i++)box(tp,0x8c5236,.2,1.3,.2,-14+i*3.1,1.8,2.3);box(tp,0x8c5236,29,.14,.14,0,2.4,2.3);
 for(var k=0;k<5;k++){var P=person(rndPerson({carry:null}));sit(P);P.g.position.y+=1.5;still(P,tg[0]-10+k*5,tg[1]+.4,rr(-.4,.4),pick([ANIM.drink,ANIM.talk]));}
 boatAt(6,1250,570,WEST+.05,{L:7.2,W:3.9,roof:2,deck:2,cargo:1});boatAt(6,1810,570,WEST,{L:6.6,W:3.6,roof:1,deck:1});boatAt(6,780,480,WEST+.15,{L:6.2,W:3.5,roof:1,deck:2,cargo:1});boatAt(6,520,430,WEST+.25,{L:5.2,W:3.1,roof:1,deck:1});boatAt(6,1560,640,WEST-.05,{L:6,W:3.4,roof:1,deck:1});
 shed(Gp(6,130,140,0),10,5.5,2.8,0);Seat(6,60,230,3);Seat(6,200,250,3);
 var hm=Gp(6,900,95,0,2.2);huanmen(hm,0,0,5);Hh(6,960,30,10,6,3.2,0,{open:1});var fl=Gp(6,690,200,0,2);flag(fl,0,0,6,0xbfc6b8);
 var lp=PT([[6,560,300],[6,360,230],[6,200,170],[6,380,280]],true);for(var w=0;w<4;w++)walker(lp,{hat:'bun',carry:'sack',v:1.5,dir:1,at:w*lp.len/4});
 Tr(6,620,90,'willow',2.6,true);Tr(6,1960,420,'willow',2.6,true);
 Lb('临河酒楼',6,1300,270,17);Lb('漕船',6,1250,570,10);
})();

/* ---- 第 7 段：纤夫拉纤、八人摇橹 ---- */
(function(){
 var sg=Gp(7,1200,270,0),p=TP(7,1200,270);box(sg,0x7a5a3a,12,.4,7,0,1.4,0);for(var i=0;i<5;i++)[-1,1].forEach(function(s){box(sg,0x5a4028,.25,1.4,.25,-5.5+i*2.75,.7,s*3.2);});var up=pivot(sg,0,1.6,0);shed(up,11,6,2.6,0);
 for(var k=0;k<5;k++){var P=person(rndPerson({carry:null}));sit(P);P.g.position.y+=1.6*SB+.2;still(P,p[0]-7+k*3.5,p[1]+rr(-2,2),rnd()*6,pick([ANIM.drink,ANIM.talk]));}
 Hh(7,880,120,13,5,3,0,{});Hh(7,1720,140,9,5.5,3,0,{open:1});Seat(7,1650,260,3);Seat(7,1800,240,3);Seat(7,1560,230,2);Hh(7,330,40,9,5,3,0,{});
 Tr(7,640,160,'willow',2.8,true);Tr(7,560,90,'willow',2.4,true);
 boatAt(7,1200,500,WEST-.12,{L:8.2,W:4.1,roof:3,deck:2});boatAt(7,130,185,WEST+.3,{L:5.2,W:3.1,roof:1,deck:0});
 var bow=[];for(var b=0;b<8;b++)bow.push({x:rr(-.9,.9),z:4+rr(-.8,1.4),an:ANIM.scull,ry:rr(-.5,.5),o:{hat:'bun'}});
 var ob=boatAt(7,820,730,WEST-.2,{L:5.6,W:3.1,crew:bow.concat([{x:0,z:-5,an:ANIM.scull,ry:PI}])});var oar=pivot(ob.g,0,1.5,5.6);box(oar,0x4a3626,.12,.12,7,0,-.4,3).rotation.x=.2;actors.push({g:oar,x:ob.g.position.x,always:1,pose:function(t){oar.rotation.y=sin(t*1.7)*.35;}});
 Lb('八人摇橹',7,820,730,9);
 boatAt(7,760,1120,WEST+.1,{L:4.6,W:2.5,scale:1.8,roof:0,deck:1});boatAt(7,500,1090,WEST+.2,{L:3.6,W:2,cabin:0,scale:1.7,crew:[]});
 St(7,880,1150,2.2,ANIM.wash,{hat:'bun'});
 Hh(7,150,1150,9,6,3,PI,{door:0});Hh(7,330,1240,9,6,3.2,PI,{door:0});St(7,450,1125,1,ANIM.idle,{hat:'straw'});
 /* 纤夫拉着带桅杆的大船往桥那边走 */
 var A=TP(6,330,600),B2=TP(7,1050,470),P0=TP(7,1250,330),P1=TP(7,380,150);
 var tb=boat({L:7.6,W:4,mast:1,scale:2.2,cargo:1,crew:crewOf(7.6,4,2)}),tugs=[],k0=0;
 var rope=new T.Line(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3)),new T.LineBasicMaterial({color:0x3a2e22}));rope.frustumCulled=false;scene.add(rope);
 for(var t=0;t<5;t++){var Tg=person({hat:pick(['bun','straw']),robe:pick([0xcfc3a3,0xa9785a,0x8a6a4a])});Tg.lock=1;Tg.torso.rotation.x=.8;Tg.armL.rotation.x=Tg.armR.rotation.x=.7;scene.add(Tg.g);tugs.push(Tg);}
 var hd=Math.atan2(P1[0]-P0[0],P1[1]-P0[1]),bh=Math.atan2(B2[0]-A[0],B2[1]-A[1]),pl=Math.hypot(P1[0]-P0[0],P1[1]-P0[1]);
 actors.push({g:tb.g,x:0,k:.2,d:0,always:1,step:function(dt){this.k+=dt/170;if(this.k>1)this.k=0;this.d+=dt;var k=this.k,sc=Math.min(1,k*40,(1-k)*40);tb.g.scale.setScalar(2.2*sc);tb.g.position.set(A[0]+(B2[0]-A[0])*k,.1,A[1]+(B2[1]-A[1])*k);tb.g.rotation.y=bh;this.x=tb.g.position.x;
   for(var i=0;i<5;i++){var f=k-i*2.6/pl,g=tugs[i].g;g.position.set(P0[0]+(P1[0]-P0[0])*f,0,P0[1]+(P1[1]-P0[1])*f);g.rotation.y=hd;g.scale.setScalar(PS*sc);}
   var mt=new T.Vector3(0,8,0);tb.mast.localToWorld(mt);var q=rope.geometry.attributes.position,t0=tugs[4].g.position;q.setXYZ(0,mt.x,mt.y,mt.z);q.setXYZ(1,t0.x,1.7,t0.z);q.needsUpdate=true;},
  pose:function(t){tb.pose(t);for(var i=0;i<5;i++)walk(tugs[i],this.d*3.2+i,.8);}});
 labelOn('纤夫拉纤',tugs[2].g,5);
})();

/* ---- 第 8 段：漕船落桅过虹桥 ---- */
(function(){
 Hh(8,900,100,9,5,3,0,{open:1});Hh(8,1180,40,8,5,3,0,{});Hh(8,1500,30,9,5,3,0,{});Seat(8,820,180,3);
 boatAt(8,1500,205,WEST,{L:7.2,W:3.8,roof:2,deck:1});boatAt(8,1860,170,WEST+.1,{L:6.2,W:3.5,roof:1,deck:1});boatAt(8,1290,300,WEST-.1,{L:6.6,W:3.4,cargo:1,roof:1,deck:2});
 /* 那条来不及放倒桅杆的大船 */
 var cr=[{x:0,z:-7,an:ANIM.scull,ry:PI},{x:.5,z:-6.2,an:ANIM.scull,ry:PI},{x:1.5,z:6,an:ANIM.pole,o:{hat:'bun',carry:'pole2'}},{x:-1.5,z:5.4,an:ANIM.pole,o:{hat:'straw',carry:'pole2'},ry:-.4},{x:1.6,z:2,an:ANIM.pole,o:{hat:'bun',carry:'pole2'},ry:1.2},{x:-1.6,z:1,an:ANIM.pole,o:{hat:'bun',carry:'pole2'},ry:-1.2},{x:1.6,z:-2.5,an:ANIM.pole,o:{hat:'bun',carry:'pole2'},ry:1.4},
  {x:0,z:2.6,y:2.5,an:ANIM.shout},{x:.6,z:.4,y:2.5,an:ANIM.wave},{x:-.6,z:-1.6,y:2.5,an:ANIM.shout,ry:PI},{x:.3,z:-3.4,y:2.5,an:ANIM.point},{x:-.4,z:4.2,y:2.5,an:ANIM.wave},{x:.7,z:-5,y:2.5,an:ANIM.shout,ry:2},{x:-.9,z:6.8,an:ANIM.wave},{x:.2,z:7.4,an:ANIM.point},{x:-1,z:-4.4,an:ANIM.lean},{x:1,z:4,an:ANIM.shout},{x:0,z:5.4,y:2.5,an:ANIM.point}];
 var by=-2.15,big=boat({L:8.4,W:4.3,mast:'down',scale:2.2,crew:cr}),p=TP(8,720,410);big.g.position.set(p[0],.1,p[1]);
 actors.push({g:big.g,x:p[0],pose:function(t){big.pose(t);big.g.rotation.y=by+sin(t*.5)*.07;big.mast.rotation.x=-1.3+sin(t*.8)*.05;}});
 Lb('落桅过桥',8,720,410,13);
 /* 南岸：停着的船，船顶上有人朝大船喊；岸上茶摊 */
 var sb=boatAt(8,820,770,WEST+.1,{L:6.2,W:3.4,crew:[{x:0,z:1,y:2.5,an:ANIM.shout,ry:PI},{x:.5,z:-1,y:2.5,an:ANIM.wave,ry:PI},{x:-.6,z:3,y:2.5,an:ANIM.point,ry:PI},{x:0,z:-5,an:ANIM.idle}]});boatAt(8,1450,730,WEST+.35,{L:5.2,W:3,roof:1,deck:1});boatAt(8,1220,800,WEST+.2,{L:4.4,W:2.6,scale:1.9,roof:0,deck:1});
 Hh(8,260,930,10,6,3.2,PI,{door:0});Hh(8,820,980,11,7,3.4,PI,{door:0});Hh(8,1500,1150,11,7,3.4,PI,{door:0});Hh(8,90,1150,9,6,3.2,PI,{door:0});Hh(8,560,1180,10,7,3.4,PI,{door:0});
 shed(Gp(8,150,790,0,1.6),7,4,2.6,1);Par(8,360,810);Par(8,560,890);Seat(8,180,850,3);Seat(8,430,860,3);Seat(8,920,1120,3);Par(8,980,1080);
 Tr(8,1650,1010,'willow',3.8,true);Tr(8,1050,1060,'willow',3.2,true);Tr(8,1220,140,'willow',2.8,true);Tr(8,1120,90,'willow',2.4,true);Tr(8,1900,1100,'willow',3,true);
 St(8,1530,930,1.4,ANIM.bow,{hat:'cap',long:1});St(8,1575,940,-1.7,ANIM.bow,{hat:'cap',long:1});
})();
