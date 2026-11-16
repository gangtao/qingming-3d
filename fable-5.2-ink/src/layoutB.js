/* ================= 布景（续）：桥西街市、十字路口、城门、城内 ================= */
function wideHat(P){mk(GC,0x2b2018,P.torso,.52,.03,.52,0,1.06,0);mk(GC,0x2b2018,P.torso,.17,.16,.17,0,1.12,0);}
/* 彩楼欢门：酒楼门前用杆子扎起来的高架子 */
function cailou(g,w,h){var c=0x8a4a32,n=4;for(var t=0;t<n;t++){var ww=w*(1-t*.2),y0=t*h/n,y1=(t+1)*h/n;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){box(g,c,.12,h/n+.2,.12,s[0]*ww/2,(y0+y1)/2,s[1]*ww/2).castShadow=false;});
  [-1,1].forEach(function(s){box(g,c,ww+.3,.1,.1,0,y1,s*ww/2).castShadow=false;box(g,c,.1,.1,ww+.3,s*ww/2,y1,0).castShadow=false;var d=box(g,c,.08,Math.hypot(ww,h/n),.08,0,(y0+y1)/2,s*ww/2);d.rotation.z=Math.atan2(ww,h/n);d.castShadow=false;var d2=box(g,c,.08,Math.hypot(ww,h/n),.08,0,(y0+y1)/2,s*ww/2);d2.rotation.z=-Math.atan2(ww,h/n);d2.castShadow=false;});}
 for(var k=0;k<7;k++){var sp=box(g,c,.07,h*.7,.07,rr(-w*.3,w*.3),h+h*.3,rr(-w*.3,w*.3));sp.rotation.z=rr(-.12,.12);sp.castShadow=false;}
 box(g,0xa3523c,w+.5,.5,w+.5,0,h/n-.3,0).castShadow=false;box(g,0xd9c9a3,w+.6,.18,w+.6,0,h/n-.65,0).castShadow=false;
 for(var m=0;m<8;m++)sph(g,pick([0xb8483a,0xd6b24a,0x5f7f8c,0xe8dcc0]),.2,.2,.2,rr(-w/2,w/2),rr(h*.3,h*.9),w/2+.1).castShadow=false;return g;}
function fade(a,base){var st=a.step;a.loop=true;a.step=function(dt){st(dt);var L=a.path.len,k=Math.max(.001,Math.min(1,a.s/5,(L-a.s)/5));a.g.scale.setScalar(base*k);};a.step(0);return a;}
var laneC={};function LN(off,a,b){if(a>b){var t=a;a=b;b=t;}var k=off+'|'+Math.round(a)+'|'+Math.round(b);if(!laneC[k]){laneC[k]=lane(off,a,b);laneC[k].s0=a;}return laneC[k];}
function traffic(a,b,n,mounted){for(var i=0;i<n;i++){var p=LN(pick([-4.4,-2.2,0,2.2,4.4]),a,b),o=rndPerson();o.at=rnd()*p.len;if(mounted&&i<mounted){beast('donkey',p,{rider:{hat:pick(['cap','lady','straw']),long:1},at:o.at,v:rr(1.5,1.9),dir:rnd()<.5?1:-1});}else walker(p,o);}}
function party(path,S,dir,v,list){list.forEach(function(m){var o=Object.assign({},m.o||{});o.at=Math.max(1,Math.min(path.len-1,S-(path.s0||0)+dir*-1*-m.d*-1));o.at=Math.max(1,Math.min(path.len-1,(S-(path.s0||0))-dir*m.d));o.v=v;o.dir=dir;var a=m.f(path,o);fade(a.a||a,PS*((m.o&&m.o.s)||1));if(m.then)m.then(a);});}
function W_(o){return{f:walker,o:o||{},d:0};}
function mem(f,d,o,then){return{f:f,d:d,o:o,then:then};}
function B_(kind){return function(p,o){return beast(kind,p,o);};}
function barrel(g,x,z,s){s=s||1;cyl(g,0x8a6a44,.5*s,1.1*s,x,.55*s,z);cyl(g,0x4a3626,.52*s,.08,x,.3*s,z);cyl(g,0x4a3626,.52*s,.08,x,.85*s,z);}

/* ---- 第 9 段：桥西头的摊子，十千脚店的彩楼 ---- */
(function(){
 Hh(9,300,50,10,5,3,0,{});Hh(9,720,40,10,5,3,0,{open:1});Hh(9,1080,50,9,5,3,0,{});shed(Gp(9,1400,120,0),11,6,2.8,0);Seat(9,1330,190,3);Seat(9,1480,180,3);
 Tr(9,430,90,'willow',2.8,true);Tr(9,1650,150,'willow',2.6,true);Tr(9,1760,220,'willow',2.4,true);
 boatAt(9,280,225,WEST,{L:7.6,W:3.6,roof:2,deck:1});boatAt(9,900,215,WEST+.06,{L:7,W:3.6,roof:2,deck:2,cargo:1});
 /* 岸边那条船：几个人在船头撑篙 */
 var cr=[];for(var i=0;i<5;i++)cr.push({x:rr(-.9,.9),z:4+rr(-1,1.2),an:ANIM.pole,ry:rr(-.6,.6),o:{hat:'bun',carry:i<2?'pole2':null}});
 boatAt(9,900,545,-2.1,{L:5.2,W:3,crew:cr});
 [[1110,580,.5],[880,690,.5],[980,700,.5],[820,790,.3]].forEach(function(s){shed(Gp(9,s[0],s[1],s[2],1.15),5.5,3.4,2.5,1);});
 [[1120,660],[1530,650],[1390,950],[1320,1010],[580,860],[1010,820]].forEach(function(s){Par(9,s[0],s[1]);var p=TP(9,s[0],s[1]);box(at(p[0],p[1],0),0x8a6a44,2.2,.8,1.4,0,.4,1);St(9,s[0]+40,s[1]-10,rnd()*6,ANIM.vend,{hat:'cap'});});
 crowd(9,1150,1500,620,760,7);crowd(9,850,1250,760,900,6);crowd(9,600,900,900,1020,5);
 var v=TP(9,720,600),vg=at(v[0],v[1],0);cyl(vg,0x4a3626,.12,12,0,6,0);box(vg,0x4a3626,2.6,.12,.12,0,10.6,0);box(vg,0xe8e0c8,.5,.3,.9,0,12.2,0);
 var fl=Gp(9,640,700,0,2.2);cyl(fl,0x4a3626,.07,4.6,0,2.3,0);box(fl,0x4a3626,2.6,.08,.08,0,4.4,0);[-1,0,1].forEach(function(s){var b=pivot(fl,s*.8,4.4,0);box(b,s?0x7a8a94:0xe8e0c8,.7,2.2,.05,0,-1.1,0);flags.push(b);});
 cailou(Gp(9,350,860,0,1.9),4.6,8);Hh(9,90,1000,9,6,3.4,0,{});Sign('十千脚店',9,330,1120,{});Sign('天之美禄',9,480,1010,{dark:1});
 Hh(9,1820,1130,8,6,3.4,-.5,{});shed(Gp(9,1830,760,0,1.5),7,4,2.6,1);Seat(9,1850,860,3);
 Lb('十千脚店',9,350,860,22);
})();

/* ---- 第 10 段：河往北拐，岸边停满船；脚店的楼上有人吃酒 ---- */
(function(){
 boatAt(10,700,490,WEST-.12,{L:7.2,W:4,roof:3,deck:2});boatAt(10,510,300,WEST+.5,{L:6,W:3.4,roof:1,deck:1});boatAt(10,570,190,WEST+.5,{L:5.6,W:3.2,roof:1,deck:0,cargo:1});boatAt(10,690,80,WEST,{L:4.4,W:2.6,scale:1.9,roof:0,deck:1});
 var st=[];for(var i=0;i<6;i++)st.push({x:rr(-1,1),z:-4.4+rr(-.8,.8),an:ANIM.scull,ry:PI+rr(-.4,.4),o:{hat:'bun'}});st.push({x:0,z:5,an:ANIM.pole,o:{hat:'bun',carry:'pole2'}},{x:.5,z:1,y:2.5,an:ANIM.point});
 boatAt(10,1500,560,WEST+.08,{L:5.6,W:3.3,crew:st});
 var mb=boatAt(10,1420,180,.5,{L:5,W:3.3,mast:1,roof:1,deck:1,cargo:1});
 boatAt(10,1760,215,WEST,{L:7.4,W:3.6,roof:2,deck:1});
 Hh(10,300,50,10,5,3,.35,{});Hh(10,470,130,9,5,3,.35,{});Hh(10,120,60,8,5,3,.2,{});Hh(10,1820,70,8,5,3,0,{});Tr(10,1620,120,'willow',2.6,true);Tr(10,1500,80,'willow',2.2,true);Tr(10,950,10,'willow',2.4,true);
 var wp=PT([[10,330,250],[10,420,230],[10,520,330],[10,380,300]],true);walker(wp,{carry:'pole',v:1.2,dir:1});walker(wp,{at:wp.len/2,v:1.2,dir:1});
 /* 岸上的茶棚和房子 */
 Hh(10,170,520,10,7,3.4,.3,{});shed(Gp(10,300,720,0),12,6,2.8,1);Seat(10,200,790,3);Seat(10,330,800,3);Seat(10,450,780,2);shed(Gp(10,600,650,.2,1.4),6,4,2.6,1);Par(10,520,590);
 St(10,620,820,2.6,ANIM.talk,{hat:'cap',long:1});St(10,660,830,-2,ANIM.talk,{hat:'straw'});
 house2(Gp(10,1280,850,0,1.9),15,8);var up=TP(10,1280,850);for(var k=0;k<4;k++){var P=person(rndPerson({carry:null}));sit(P);P.g.position.y+=3.9*1.9+.9;still(P,up[0]-9+k*6,up[1]+4.5,rr(-.4,.4),pick([ANIM.drink,ANIM.talk]));}
 Hh(10,1750,900,8,6,3.2,0,{});Hh(10,300,1030,13,7,3.4,0,{});Hh(10,780,1060,12,7,3.4,0,{open:1});Hh(10,1250,1110,9,6,3.2,0,{});Hh(10,1700,1100,9,6,3.2,0,{open:1,awn:1});Hh(10,560,890,9,6,3.2,.4,{});
 Tr(10,800,700,'bare',2.8,true);Tr(10,720,780,'bare',2.4,true);Tr(10,960,620,'bare',2.2,true);Tr(10,1500,560,'willow',3,true);Tr(10,1680,650,'willow',2.8,true);Tr(10,1900,580,'willow',2.6,true);Tr(10,60,180,'willow',3,true);Tr(10,1050,1150,'willow',2.6,true);Tr(10,1520,1160,'willow',2.4,true);Tr(10,60,700,'bare',2.6,true);
 Lb('汴河北去',10,900,200,6);
})();

/* ---- 第 11 段：十字路口，茶坊、车铺、算命棚 ---- */
(function(){
 var north=mkPath(sidePath([[11,1170,800],[11,1200,450],[11,1350,120],[11,1480,-200],[11,1500,-900]],5.5));
 for(var i=0;i<12;i++)walker(north,rndPerson({at:rnd()*north.len*.5}));
 [0,3.4,6.8].forEach(function(d){beast('donkey',north,{pack:'bales',at:60+d,v:1.2,dir:-1});});walker(north,{hat:'straw',carry:'staff',at:71,v:1.2,dir:-1});
 Hh(11,850,450,13,8,3.8,0,{open:1,awn:1});Seat(11,720,640,3);Seat(11,860,650,3);Seat(11,990,640,3);cartStill(11,600,610,WEST,1);
 Hh(11,1790,560,11,8,3.6,-.3,{open:1});Seat(11,1700,760,3);Seat(11,1850,780,3);Seat(11,1930,700,2);
 /* 车铺：地上躺着一只车轮，一个抡锤，一个刨木头 */
 var w=TP(11,1330,540),wg=at(w[0],w[1],0);var rim=mk(GC,0x4a3626,wg,2,.25,2,0,.3,0);mk(GC,0xdcc89d,wg,1.6,.27,1.6,0,.3,0);for(var k=0;k<3;k++){var sp=box(wg,0x7a5a3a,3.8,.12,.2,0,.42,0);sp.rotation.y=k*PI/3;}box(wg,0x7a5a3a,3,.3,.5,4,.2,1).rotation.y=.4;box(wg,0x7a5a3a,2.6,.3,.5,4.4,.2,-1).rotation.y=-.2;
 St(11,1280,490,1.2,ANIM.hammer,{hat:'bun'});var sw=St(11,1400,580,-1.4,ANIM.saw,{hat:'bun'});
 Hh(11,1450,380,6,5,3,-.6,{open:1});Lb('车铺',11,1330,540,8);
 crowd(11,960,1130,300,420,9,[ANIM.talk,ANIM.bow,ANIM.idle,ANIM.talk],null,{hat:'cap',long:1});
 Hh(11,1560,90,10,5,3,-.35,{open:1});Seat(11,1500,200,3);Hh(11,1100,60,8,5,3,0,{});
 /* 算命棚 */
 shed(Gp(11,350,430,0,1.6),7,4.5,2.7,1);Sign('神课',11,270,500,{});Sign('看命',11,330,505,{});Sign('决疑',11,390,500,{});
 Sit(11,350,455,0,ANIM.tell,{hat:'cap',long:1});crowd(11,220,460,530,600,7,[ANIM.idle,ANIM.talk,ANIM.bow],TP(11,350,455));Lb('看相算命',11,350,430,10);
 Tr(11,480,450,'willow',3.8,true);Tr(11,150,260,'willow',3,true);Tr(11,260,140,'willow',2.6,true);Tr(11,640,150,'willow',2.4,true);
 Tr(11,1500,300,'bare',3,true);Tr(11,1760,250,'bare',3.2,true);Tr(11,950,150,'bare',2.8,true);Tr(11,820,90,'bare',2.4,true);Tr(11,1550,640,'bare',3,true);Tr(11,200,1160,'willow',2.6,true);
 var fl=Gp(11,120,640,0,2.2);cyl(fl,0x4a3626,.07,4.6,0,2.3,0);box(fl,0x4a3626,1.8,.08,.08,0,4.4,0);[-1,1].forEach(function(s){var b=pivot(fl,s*.5,4.4,0);box(b,s>0?0x7a8a94:0xe8e0c8,.7,2,.05,0,-1,0);flags.push(b);});
 Hh(11,420,930,14,8,3.6,PI,{});Hh(11,130,1010,9,7,3.4,PI,{});Hh(11,640,1120,7,5,3,-PI/2,{open:1});Hh(11,1550,1010,12,8,3.6,-PI/2,{});Hh(11,1860,1080,9,7,3.4,0,{door:0});Hh(11,1450,1190,8,5,3,PI/2,{});
 var h=TP(11,1320,700);quadStill('horse',h[0],h[1],-1.9,{});St(11,1270,690,1.4,ANIM.bow,{hat:'cap',long:1});St(11,1370,730,-1.2,ANIM.talk,{hat:'cap'});St(11,1300,760,2.8,ANIM.idle,{hat:'bun'});
 Lb('茶坊',11,850,450,12);
})();

/* ---- 第 12 段：递铺门口歇着的兵卒，路上的轿子和牛车 ---- */
(function(){
 Hh(12,1700,230,8,5,3.4,0,{dx:1});var f=TP(12,1450,330);for(var i=0;i<14;i++)box(at(f[0]+i*1.4,f[1]-3,0),0x6a5238,.12,2.4,.12,0,1.2,0);
 [[1480,410,.4],[1560,430,-.3],[1650,440,.2],[1420,450,1],[1740,420,-.6],[1800,450,-1]].forEach(function(s,i){var P=Sit(12,s[0],s[1],s[2],i%2?ANIM.idle:ANIM.lean,{hat:'cap',robe:0x7c6a52},0);});
 var sp=TP(12,1600,360);[0,1,2].forEach(function(k){var b=box(at(sp[0]+k*1.2,sp[1],0),0x4a3626,.07,5,.07,0,2.4,0);b.rotation.x=.2;});box(at(sp[0]+5,sp[1]+3,0),0x5a4028,2.4,1,1.4,0,.5,0);
 Lb('递铺兵卒',12,1600,420,8);
 Tr(12,1200,300,'willow',3.8,true);Tr(12,1330,370,'willow',3.6,true);Tr(12,1080,240,'willow',3.2,true);Tr(12,1880,330,'bare',3,true);
 [[200,200,3],[400,350,3],[150,500,3.2],[520,150,2.6],[60,330,2.8],[330,60,2.4]].forEach(function(t){Tr(12,t[0],t[1],'willow',t[2],true);});
 [[1150,1000,3.2],[300,1120,3],[1720,1170,2.8],[90,1060,3],[560,1150,2.6]].forEach(function(t){Tr(12,t[0],t[1],'willow',t[2],true);});
 /* 两顶歇着的轿子、牵马的人 */
 sedanStill(12,900,470,-1.3);sedanStill(12,1030,470,-1.3);St(12,850,500,1.2,ANIM.talk,{hat:'cap',long:1});St(12,960,510,-.4,ANIM.bow,{hat:'cap'});St(12,1090,510,.3,ANIM.idle,{hat:'cap'});St(12,1140,480,-1,ANIM.talk,{hat:'bun'});St(12,1210,520,1.6,ANIM.idle,{s:.62,hat:'bun'});
 var hz=TP(12,710,490);quadStill('horse',hz[0],hz[1],.3,{});St(12,740,520,-1,ANIM.idle,{hat:'cap'});
 /* 伞下的摊子 */
 Par(12,420,570,0xd8c08a,2.1);Par(12,260,620,0xb9a184,2.1);shed(Gp(12,80,620,0,1.4),6,4,2.6,1);crowd(12,200,520,540,620,9,[ANIM.vend,ANIM.talk,ANIM.bow,ANIM.idle]);
 var wh=St(12,610,590,1.2,ANIM.talk,{hat:'bun',long:1});mk(GK,0xc7a559,wh.torso,.6,.26,.6,0,1.08,0);
 Hh(12,700,1010,12,7,3.4,PI,{});Hh(12,1480,880,13,7,3.6,PI,{});Hh(12,1850,880,9,6,3.4,PI,{});Hh(12,1560,1120,10,6,3,0,{open:1});Seat(12,1400,1180,3);
 var fl=Gp(12,1790,640,0,2.2);cyl(fl,0x4a3626,.07,4.6,0,2.3,0);box(fl,0x4a3626,1.8,.08,.08,0,4.4,0);[-1,1].forEach(function(s){var b=pivot(fl,s*.5,4.4,0);box(b,s>0?0x7a8a94:0xe8e0c8,.7,2,.05,0,-1,0);flags.push(b);});
 Hh(12,450,50,10,5,3,0,{open:1});Hh(12,180,50,9,5,3,0,{});Hh(12,780,90,8,5,3,0,{});shed(Gp(12,820,210,0,1.3),5,3,2.5,1);
 /* 往北去的小路：一群猪 */
 var np=mkPath(sidePath([[12,900,540],[12,760,330],[12,640,180],[12,560,-100],[12,500,-900]],3.5));
 [0,1.6,3,4.6,6].forEach(function(d,i){var b=beast('pig',np,{at:20+d,v:.9,dir:1});});walker(np,{hat:'straw',carry:'staff',at:16,v:.9,dir:1});walker(np,{carry:'pole',at:34,v:1.2,dir:-1});
 [0,3].forEach(function(d){beast('donkey',np,{pack:'bales',at:44+d,v:1.1,dir:-1});});
})();

/* ---- 第 13 段：城门外 ---- */
(function(){
 for(var i=0;i<16;i++){Tr(13,rr(700,960),rr(120,680),'willow',rr(2.6,3.6),true);}
 for(var j=0;j<12;j++){Tr(13,rr(1570,1900),rr(80,560),'willow',rr(2.6,3.4),true);}
 for(var k=0;k<10;k++){Tr(13,rr(520,880),rr(1040,1240),'willow',rr(2.4,3.2),true);Tr(13,rr(1680,1980),rr(1040,1240),'willow',rr(2.4,3.2),true);}
 Tr(13,650,620,'willow',3.4,true);Tr(13,790,640,'willow',3.4,true);
 crowd(13,470,700,740,810,7,[ANIM.point,ANIM.talk,ANIM.idle],TP(13,300,860));Sit(13,650,880,1.5,ANIM.bow,{hat:'bun'},0);St(13,500,690,2,ANIM.bow,{hat:'bun'});
 Hh(13,1700,60,9,5,3,0,{});Hh(13,1900,90,8,5,3,0,{});
 shed(Gp(13,1760,650,0,1.3),5,3,2.5,1);Par(13,1900,640,0xb9a184,2.1);
})();

/* ---- 第 14 段：进城，税务、弓店、孙羊正店 ---- */
(function(){
 Hh(14,1090,460,9,6,3.4,0,{open:1});var t=TP(14,1100,585),tg=at(t[0],t[1],0);box(tg,0x7a5a3a,3.4,.12,1.6,0,1.3,0);box(tg,0x5a4028,.14,1.3,.14,-1.5,.65,.6);box(tg,0x5a4028,.14,1.3,.14,1.5,.65,-.6);
 Sit(14,1100,555,0,ANIM.vend,{hat:'cap',long:1,robe:0x6f7f8c},.3);St(14,1030,650,2.6,ANIM.talk,{hat:'cap',long:1});St(14,1090,670,PI,ANIM.bow,{hat:'cap'});St(14,960,560,1.2,ANIM.idle,{hat:'cap',long:1});
 var b=TP(14,1190,650),bg=at(b[0],b[1],.2);for(var i=0;i<7;i++)box(bg,0xc9b88a,1.5,.9,1.1,(i%3)*1.6-1.6,.45+Math.floor(i/3)*.9,(i%2)*.4);var sm=Sit(14,1190,650,.4,ANIM.talk,{hat:'bun'},2);St(14,1280,640,-1.3,ANIM.point,{hat:'cap'});
 Lb('税务',14,1090,460,11);
 Hh(14,720,460,9,6,3.4,0,{open:1});var bb=TP(14,690,590),bbg=at(bb[0],bb[1],0);[-3,-1.5,0,1.5,3].forEach(function(x){barrel(bbg,x,0,1.5);});St(14,800,560,-1.2,ANIM.point,{hat:'cap'});St(14,640,540,.4,ANIM.idle,{hat:'cap',long:1});
 /* 孙羊正店 */
 house2(Gp(14,270,250,0,2.1),17,9);var up=TP(14,270,250);for(var k=0;k<5;k++){var P=person(rndPerson({carry:null}));sit(P);P.g.position.y+=3.9*2.1+.9;still(P,up[0]-12+k*6,up[1]+6,rr(-.4,.4),pick([ANIM.drink,ANIM.talk]));}
 cailou(Gp(14,170,480,0,2.1),5.2,9);Hh(14,560,300,7,6,3.4,0,{});
 Sign('香',14,410,585,{});Sign('正店',15,1630,600,{});Sign('孙羊店',15,1370,480,{dark:1});
 var lg=Gp(14,40,570,0,1.6);[-2.4,2.4].forEach(function(x){cyl(lg,0x4a3626,.06,3.4,x,1.7,0);sph(lg,0xd9a24a,.42,.55,.42,x,3.4,0);});
 crowd(14,0,380,610,680,9,[ANIM.talk,ANIM.bow,ANIM.idle,ANIM.talk],null);crowd(15,1560,2000,640,700,9,[ANIM.talk,ANIM.bow,ANIM.idle,ANIM.vend],null);
 Par(15,1450,545,0xcdbb8c,2.1);var fs=TP(15,1420,660);[0,3.2,6].forEach(function(x){var g=at(fs[0]+x,fs[1]+rr(-.5,.5),0);cyl(g,0x8a6a44,1.1,.5,0,.9,0);box(g,0x5a4028,.1,.9,.1,0,.45,0);for(var q=0;q<6;q++)sph(g,pick([0xb8483a,0xd6b24a,0xe8dcc0,0x7c8a66]),.25,.25,.25,rr(-.7,.7),1.3,rr(-.7,.7));});St(15,1500,640,.3,ANIM.vend,{hat:'bun'});
 Lb('孙羊正店',14,170,480,26);
 /* 卸货的驴队 */
 [[470,640,1.3],[560,655,1.5],[650,640,1.2],[740,660,1.7],[820,645,1.4]].forEach(function(d,i){var p=TP(14,d[0],d[1]);quadStill('donkey',p[0],p[1],d[2],{pack:i%2?'goods':'bales'});});St(14,520,690,1,ANIM.bow,{hat:'bun'});St(14,700,700,-.8,ANIM.bow,{hat:'cap'});St(14,880,680,-1.4,ANIM.hammer,{hat:'bun'});
 var hs=TP(14,870,130);[0,3,6,1.5,4.5].forEach(function(x,i){mk(GS,0xc9b06a,at(hs[0]+x,hs[1]-(i>2?3:0),0),2,2.6,2,0,1.6,0);});
 Hh(14,1130,240,9,5,3.2,0,{});Hh(14,1150,60,10,5,3.2,0,{});Tr(14,850,330,'willow',3.2,true);Tr(14,1010,360,'willow',2.8,true);Tr(14,1000,80,'willow',2.6,true);Tr(14,700,150,'willow',2.6,true);
 Hh(14,420,1090,13,7,3.4,PI,{});Hh(14,760,1170,10,7,3.4,PI,{});shed(Gp(14,1250,1070,PI,1.5),6,4,2.7,0);St(14,1150,1130,1,ANIM.talk,{hat:'cap'});St(14,1200,1150,-1.5,ANIM.talk,{hat:'cap'});St(14,1000,1060,.5,ANIM.idle,{hat:'cap',long:1});
 Tr(14,100,1120,'willow',3,true);Tr(14,250,1190,'willow',2.8,true);Tr(14,1000,1190,'willow',2.6,true);
})();

/* ---- 第 15 段：十字街口，香铺、说书、久住王员外家 ---- */
(function(){
 var cross=mkPath(sidePath([[15,820,760],[15,900,450],[15,960,200],[15,1010,-150],[15,1040,-900]],6));
 for(var i=0;i<16;i++)walker(cross,rndPerson({at:rnd()*cross.len*.45}));
 oxcart(cross,{kind:'donkey',at:38,v:1.1,dir:-1});oxcart(cross,{kind:'donkey',at:74,v:1.1,dir:1});barrow(cross,{donkey:1,at:22,v:1,dir:1});
 Hh(15,540,250,11,8,3.8,.45,{open:1});Sign('刘家上色沉檀拣香',15,700,340,{});Lb('香铺',15,540,250,12);
 Hh(15,280,90,11,7,3.6,.3,{});Hh(15,200,330,9,6,3.4,.2,{});Tr(15,130,360,'willow',3.6,true);Tr(15,60,160,'willow',3,true);
 Hh(15,1240,370,11,8,3.8,0,{open:1,awn:1});Hh(15,1080,40,10,5,3,0,{open:1});Hh(15,1420,120,8,6,3.4,0,{});Sign('王家罗锦匹帛铺',15,1230,180,{dark:1});Sign('孙好手馒头',15,880,80,{});
 /* 说书 */
 var tp=TP(15,1140,570);St(15,1140,570,0,ANIM.tell,{hat:'cap',long:1,robe:0x5d6a70});crowd(15,960,1330,610,690,17,[ANIM.idle,ANIM.idle,ANIM.talk,ANIM.bow],tp);Lb('说书',15,1140,570,8);
 [[150,520,0x8a7458],[300,525,0xb9a184],[450,545,0x8a7458]].forEach(function(s){Par(15,s[0],s[1],s[2],2.2);var p=TP(15,s[0],s[1]);var g=at(p[0],p[1]+2,0);box(g,0x8a6a44,3,.9,1.4,0,.45,0);for(var q=0;q<6;q++)mk(pick([GB,GS,GC]),pick([0xb8483a,0xd6b24a,0x7c8a66,0xe8dcc0]),g,.2,.2,.2,rr(-1.2,1.2),1,rr(-.4,.4));});
 crowd(15,80,520,590,680,12,[ANIM.talk,ANIM.bow,ANIM.idle,ANIM.vend]);
 var mk1=St(15,700,720,1.2,ANIM.talk,{hat:'bun',long:1,robe:0xe8dcc0});St(15,750,740,-1.3,ANIM.talk,{hat:'cap',long:1});St(15,610,750,.8,ANIM.talk,{hat:'cap',long:1,robe:0x4a4038});St(15,650,790,-.5,ANIM.bow,{hat:'cap',long:1,robe:0x7a6a8a});
 house2(Gp(15,1180,1130,PI,1.9),14,8);Sign('久住王员外家',15,770,975,{});Lb('久住王员外家',15,1180,1130,16);
 Hh(15,820,1190,8,6,3.2,PI,{});shed(Gp(15,60,930,PI,1.5),7,4,2.7,1);Par(15,620,1060,0x8a7458,2.2);Par(15,1450,935,0x8a7458,2.2);Par(15,540,1150,0x8a7458,2);
 crowd(15,150,360,1000,1100,7,[ANIM.talk,ANIM.idle,ANIM.bow],null,{hat:'cap',long:1});
 Tr(15,1700,1160,'willow',3,true);Tr(15,1900,1120,'willow',2.8,true);Tr(15,1560,1210,'willow',2.6,true);
})();

/* ---- 第 16 段：赵太丞家、水井、解库 ---- */
(function(){
 Hh(16,1240,440,9,7,3.6,0,{open:1});Sign('治酒所伤真方集香丸',16,1060,640,{});Sign('大理中丸医肠胃药',16,1350,600,{});Sign('赵太丞家',16,1200,560,{dark:1,y:3.2});
 Sit(16,1180,560,.3,ANIM.talk,{hat:'lady',long:1,robe:0xc98f7a},.3);Sit(16,1230,570,-.3,ANIM.talk,{hat:'lady',long:1,robe:0x9fb0a0},.3);St(16,1280,575,-1.2,ANIM.talk,{hat:'cap',long:1});Lb('赵太丞家',16,1240,440,12);
 Hh(16,890,440,7,6,3.8,0,{});Hh(16,960,180,12,7,3.6,0,{});Hh(16,1500,140,11,7,3.6,0,{});Hh(16,1850,250,10,7,3.6,0,{});Hh(16,700,250,7,6,3.4,0,{});
 var w=TP(16,1700,560),wl=at(w[0]+3,w[1]-2,0);box(wl,0xd9c9a3,16,3.4,.5,0,1.7,0);box(wl,0x5d6263,16.4,.3,.9,0,3.5,0);
 Sit(16,800,640,1.2,ANIM.idle,{hat:'cap'},0);St(16,960,690,1,ANIM.idle,{carry:'back'});St(16,1010,680,-1,ANIM.talk,{hat:'cap'});
 /* 水井 */
 var z=TP(16,1560,700),zg=at(z[0],z[1],0);box(zg,0x8f8876,4.4,.5,4.4,0,.25,0);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){box(zg,0x2b2623,1.5,.06,1.5,s[0]*1,.52,s[1]*1);});barrel(zg,-3.4,1,.8);barrel(zg,3.2,-.6,.8);barrel(zg,-3,-1.6,.8);
 still(person({hat:'bun'}),z[0]-2.6,z[1]-.6,1.4,ANIM.well);still(person({hat:'cap'}),z[0]+2.6,z[1]+.4,-1.5,ANIM.well);still(person({hat:'bun',carry:'pole'}),z[0]-1,z[1]+3.6,2.6,ANIM.idle);
 Lb('水井',16,1560,700,7);
 Par(16,1850,560,0x8a7458,2.2);Par(16,1960,585,0x8a7458,2.2);Tr(16,1690,420,'willow',3.8,true);Tr(16,770,380,'willow',3.2,true);Tr(16,660,620,'bare',2.4,true);Tr(16,700,900,'willow',2.8,true);Tr(16,820,1130,'willow',3,true);Tr(16,660,1240,'willow',2.6,true);
 Hh(16,1130,970,6,5,3,PI,{});Hh(16,1290,1140,11,8,3.6,PI,{});shed(Gp(16,1640,1010,PI,1.6),9,4.5,2.8,1);
 Sign('解',16,1530,1175,{y:2});St(16,1700,1100,0,ANIM.tell,{hat:'cap',long:1});crowd(16,1620,2000,1130,1260,15,[ANIM.idle,ANIM.idle,ANIM.talk,ANIM.bow],TP(16,1700,1100),null);
 var h=TP(16,1760,1290);quadStill('horse',h[0],h[1],2.6,{rider:{hat:'cap',long:1}});
 Lb('解库',16,1560,1150,9);
})();

/* ================= 画外的远景和近景 ================= */
(function(){
 function ok(x,z){return !inRiver(x,z,6)&&nearRoad(x,z)>13&&abs(x-MOATX)>MOATHW+5&&abs(x-WALLX)>WALLT/2+8&&abs(x+172-(z+50)*.05)>10&&abs(x+283-(z+50)*.05)>8&&abs(x+489)>10;}
 for(var x=640;x>-650;x-=9){
  var city=x<WALLX-10,sub=x<5&&x>-300;
  for(var r=0;r<3;r++){var z=-62-r*24+rr(-6,6),xx=x+rr(-4,4);if(!ok(xx,z))continue;
   if(city||(sub&&rnd()<.45)||rnd()<.07){if(rnd()<(city?.8:.6)){var g=at(xx,z,rr(-.15,.15));g.scale.setScalar(SB);house(g,rr(7,11),rr(5,7),rr(3,3.6),{thatch:!city&&!sub,door:0});}else tree(xx,z,'willow',rr(2.4,3.2),true);}
   else if(rnd()<.6)tree(xx,z,rnd()<.5?'bare':'willow',rr(2.2,3.2),true);}
  for(var q=0;q<1;q++){var z2=62+rr(-4,6),x2=x+rr(-4,4);if(!ok(x2,z2)||x2>300)continue;
   if(city||sub){if(rnd()<.42){var g2=at(x2,z2,PI+rr(-.15,.15));g2.scale.setScalar(SB);house(g2,rr(7,11),rr(5,7),rr(3,3.4),{door:0});}}
   else if(rnd()<.3)tree(x2,z2,'willow',rr(2.4,3),true);}
 }
})();

/* ================= 路上的行人、车马 ================= */
(function(){
 traffic(10,RDLEN-10,60,8);
 traffic(sT(1,1150,640),sT(4,300,830),14,2);
 traffic(sT(5,1700,640),sT(8,1250,60),44,3);
 traffic(sT(8,1500,50),sT(9,700,1130),64,3);
 traffic(sT(9,1000,1010),sT(12,150,800),64,4);
 traffic(sT(12,900,630),sT(14,1100,790),26,2);
 traffic(sT(14,1100,790),sT(16,900,950),110,4);
 /* 卷首的驮炭驴队 */
 var c1=LN(1.5,6,sT(5,1700,640)),S=sT(1,700,700);
 party(c1,S,1,1.25,[mem(walker,-3.5,{s:.62,hat:'bun'}),mem(B_('donkey'),0,{pack:'charcoal'}),mem(B_('donkey'),3.3,{pack:'charcoal'}),mem(B_('donkey'),6.6,{pack:'charcoal'}),mem(B_('donkey'),9.9,{pack:'charcoal'}),mem(B_('donkey'),13.2,{pack:'charcoal'},function(a){labelOn('驮炭驴队',a.Q.g,5);}),mem(walker,16.5,{hat:'straw',carry:'staff'})]);
 /* 踏青扫墓回城的一队人：轿子上插着柳枝 */
 var sp=mkPath(sidePath([[3,300,330],[4,1500,420],[4,1150,560],[4,650,600],[5,1380,560]],3.2));
 party(sp,sp.len*.4,1,1.5,[mem(walker,-7,{hat:'cap'}),mem(walker,-5,{hat:'cap',carry:'staff'}),mem(B_('horse'),-1.5,{rider:{hat:'cap',long:1}},function(a){wideHat(a.Q.rider);}),mem(sedan,3.5,{willow:1},function(a){labelOn('踏青归来',a.g,6);}),mem(walker,7,{carry:'pole'}),mem(walker,9,{hat:'bun',carry:'back'}),mem(walker,11,{s:.62,hat:'bun',carry:'willow'})]);
 /* 惊马 */
 var hp=PT([[4,1280,520],[4,1050,470],[4,880,540],[4,1040,660],[4,1300,640]],true);var wh=beast('white',hp,{at:0,v:6.5,dir:1});labelOn('惊马',wh.Q.g,5);walker(hp,{hat:'bun',at:hp.len-6,v:6.5,dir:1});walker(hp,{hat:'cap',at:hp.len-9,v:6.5,dir:1});
 /* 戴帷帽骑驴的妇人和随从 */
 var c2=LN(-2.2,sT(3,1700,800),sT(5,1380,560));party(c2,sT(4,1200,1010),1,1.4,[mem(walker,-3,{hat:'cap',carry:'staff'}),mem(B_('donkey'),0,{rider:{hat:'lady',long:1,robe:0xd6ceb8}}),mem(walker,3,{carry:'back'}),mem(B_('donkey'),6,{rider:{hat:'cap',long:1}}),mem(walker,9,{carry:'pole'})]);
 /* 码头边的骡车 */
 var c3=LN(2.2,sT(5,1050,330),sT(8,1250,60));oxcart(c3,{kind:'donkey',at:c3.len*.4,v:1.1,dir:1});barrow(c3,{at:c3.len*.7,v:1,dir:-1});
 /* 桥顶：轿子和骑马的迎面碰上 */
 var b1=LN(-1.6,sT(8,1700,50),sT(9,700,1130)),b2=LN(1.8,sT(8,1700,50),sT(9,700,1130));
 fade(sedan(b1,{at:b1.len*.55,v:1.2,dir:-1}),PS);walker(b1,{hat:'cap',at:b1.len*.55-3.5,v:1.2,dir:-1});
 var rd=beast('horse',b2,{rider:{hat:'cap',long:1},at:b2.len*.25,v:1.3,dir:1});fade(rd.a,PS);walker(b2,{hat:'cap',at:b2.len*.25+3,v:1.3,dir:1});walker(b2,{hat:'bun',at:b2.len*.25-3,v:1.3,dir:1});
 /* 桥西：独轮车、驴、猪 */
 var c4=LN(2.6,sT(9,1300,890),sT(11,800,740)),c5=LN(-2.8,sT(9,1300,890),sT(11,800,740));
 barrow(c4,{donkey:1,at:10,v:1,dir:1});barrow(c5,{donkey:1,at:40,v:1,dir:-1});beast('pig',c4,{at:30,v:.8,dir:1});beast('donkey',c5,{pack:'goods',at:70,v:1.2,dir:-1});
 var rh=beast('horse',c4,{rider:{hat:'cap',long:1},at:c4.len*.5,v:1.4,dir:1});
 /* 十字路口到城门：牛车、轿子 */
 var c6=LN(2.4,sT(11,1100,1000),sT(13,1700,890)),c7=LN(-2.4,sT(11,1100,1000),sT(13,1700,890));
 oxcart(c6,{at:c6.len*.25,v:.8,dir:1});oxcart(c7,{at:c7.len*.55,v:.8,dir:-1});oxcart(c6,{at:c6.len*.8,v:.8,dir:1});sedan(c7,{at:c7.len*.2,v:1.4,dir:-1});
 /* 城门口：驼队出城 */
 var cm=LN(0,sT(12,600,700),sT(15,1500,800)),Sg=sNear(WALLX+WALLT/2+2,GATEZ);
 party(cm,Sg,-1,1.15,[mem(walker,-4.5,{hat:'cap',carry:'staff'}),mem(B_('camel'),0,{pack:'goods'},function(a){labelOn('驼队出城',a.Q.g,7);}),mem(B_('camel'),5.5,{pack:'goods'}),mem(B_('camel'),11,{pack:'bales'}),mem(walker,15.5,{hat:'bun',carry:'back'})]);
 var c8=LN(3,sT(12,300,760),sT(14,1100,790)),c9=LN(-3,sT(12,300,760),sT(14,1100,790));
 barrow(c8,{donkey:1,at:c8.len*.5,v:1,dir:1});var wr=beast('donkey',c8,{rider:{hat:'cap',long:1},at:c8.len*.7,v:1.4,dir:1});wideHat(wr.Q.rider);beast('donkey',c9,{rider:{hat:'cap'},at:c9.len*.3,v:1.5,dir:-1});beast('donkey',c9,{rider:{hat:'bun',s:.8},at:c9.len*.3+4,v:1.5,dir:-1});beast('pig',c9,{at:c9.len*.5,v:.8,dir:1});
 /* 城里：轿子、骑马的官人和随从、拉酒桶的驴车 */
 var d1=LN(2.6,sT(14,1000,790),sT(16,900,950)),d2=LN(-2.6,sT(14,1000,790),sT(16,900,950));
 sedan(d1,{at:d1.len*.2,v:1.4,dir:1});sedan(d2,{at:d2.len*.45,v:1.4,dir:-1});sedan(d1,{at:d1.len*.55,v:1.4,dir:1});
 party(d2,sT(14,500,930),1,1.4,[mem(walker,-3,{hat:'cap'}),mem(B_('horse'),0,{rider:{hat:'cap',long:1}}),mem(walker,3.2,{hat:'cap',carry:'staff'}),mem(walker,5,{carry:'back'})]);
 party(d1,sT(16,1250,900),1,1.3,[mem(walker,-5,{hat:'cap',carry:'pole'}),mem(walker,-3,{hat:'cap'}),mem(B_('horse'),0,{rider:{hat:'cap',long:1,robe:0xe8dcc0}},function(a){wideHat(a.Q.rider);}),mem(walker,3,{hat:'cap'}),mem(walker,4.6,{hat:'cap',carry:'back'})]);
 oxcart(d1,{kind:'donkey',at:d1.len*.75,v:1,dir:1});barrow(d2,{at:d2.len*.8,v:1,dir:-1});
 var u0=uT(4,1000,1300),u1=uT(7,900,1000);
 /* 过路的漕船：从卷首外面的河上驶来，一条跟一条穿过码头、钻过虹桥，拐出画面。
    航道是算出来的：把河面切成格子，避开所有停着的船、纤夫拉的船、小船的水道和桥墩，挑一条最宽敞又不急转的线 */
 (function(){var NU=260,FS=[],obs=[],o={},i,j;for(var f=-.7;f<=.701;f+=.05)FS.push(f);
  boats.forEach(function(B){if(B.moving)return;var s=B.o.scale||1,L=(B.o.L||6)*s,ry=B.g.rotation.y,p=B.g.position;obs.push([p.x-sin(ry)*L,p.z-cos(ry)*L,p.x+sin(ry)*L,p.z+cos(ry)*L,(B.o.W||3.2)*s/2]);});
  var tA=TP(6,330,600),tB=TP(7,1050,470);obs.push([tA[0],tA[1],tB[0],tB[1],4.6]);
  [-1,1].forEach(function(s){obs.push([BC[0]+s*BDX*BL*.62,BC[1]+s*BDZ*BL*.62,BC[0]+s*BDX*(BL+6),BC[1]+s*BDZ*(BL+6),BW+1]);});
  function clr(x,z){var m=1e9;for(var n=0;n<obs.length;n++){var s=obs[n],vx=s[2]-s[0],vz=s[3]-s[1],t=((x-s[0])*vx+(z-s[1])*vz)/((vx*vx+vz*vz)||1);t=Math.max(0,Math.min(1,t));var d=Math.hypot(x-s[0]-vx*t,z-s[1]-vz*t)-s[4];if(d<m)m=d;}return m;}
  var cost=[],off=[],back=[];for(i=0;i<=NU;i++){cost.push([]);off.push([]);back.push([]);riverAt(i/NU,0,o);var hw=o.hw;for(j=0;j<FS.length;j++){riverAt(i/NU,FS[j]*hw,o);var c=clr(o.x,o.z)-3,bk=hw*(1-abs(FS[j]))-2.6,pen=(c<.6?4000:60/(c*c))+(bk<1?4000:20/(bk*bk));off[i].push(FS[j]*hw);
    if(!i){cost[i].push(pen);back[i].push(0);continue;}var best=1e18,bj=0;for(var p=0;p<FS.length;p++){var dd=off[i][j]-off[i-1][p],v=cost[i-1][p]+dd*dd*3;if(v<best){best=v;bj=p;}}cost[i].push(best+pen);back[i].push(bj);}}
  var lane=[],bj2=0,bv=1e18;for(j=0;j<FS.length;j++)if(cost[NU][j]<bv){bv=cost[NU][j];bj2=j;}for(i=NU;i>=0;i--){lane[i]=off[i][bj2];bj2=back[i][bj2];}
  for(var pass=0;pass<6;pass++)for(i=1;i<NU;i++)lane[i]=(lane[i-1]+lane[i]*2+lane[i+1])/4;
  var mc=1e9,mu=0;for(i=0;i<=NU;i++){riverAt(i/NU,lane[i],o);var c2=clr(o.x,o.z);if(c2<mc){mc=c2;mu=i/NU;}}window.__lane={min:mc,at:mu,pos:lanePos,clr:clr};
  function lanePos(u,out){var x=Math.max(0,Math.min(NU-1e-6,u*NU)),a=Math.floor(x);riverAt(u,lane[a]+(lane[a+1]-lane[a])*(x-a),out);return out;}
  var KIND=[{L:5.8,W:3.3,scale:1.9,cargo:1,roof:1,deck:2},{L:5.4,W:3.1,scale:1.9,roof:1,deck:1},{L:6,W:3.4,scale:1.9,cargo:1,roof:2,deck:2},{L:4.8,W:2.8,scale:1.8,roof:0,deck:2},{L:5.6,W:3.2,scale:1.9,cargo:1,roof:1,deck:1},{L:5.2,W:3,scale:1.9,roof:1,deck:2},{L:4.4,W:2.5,scale:1.7,roof:0,deck:1},{L:4.4,W:2.5,scale:1.7,cabin:0,roof:0,deck:1},{L:4.6,W:2.6,scale:1.7,roof:0,deck:1}],NB=KIND.length,o2={};
  KIND.forEach(function(kd,n){kd.crew=crewOf(kd.L,kd.roof,0,[{x:kd.W*.3,z:kd.L*.7,an:ANIM.pole,o:{hat:'straw',carry:'pole2'},ry:.5},{x:-kd.W*.3,z:kd.L*.45,an:ANIM.pole,o:{hat:'bun',carry:'pole2'},ry:-.5}].slice(0,kd.deck));var B=boat(kd);B.moving=1;wake(B);
   actors.push({g:B.g,x:0,u:(((n*4)%NB)+rr(-.15,.15))/NB,v:4.4/RLEN,always:1,step:function(dt){this.u+=this.v*dt;if(this.u>1)this.u-=1;lanePos(this.u,o);lanePos(Math.min(1,this.u+.004),o2);B.g.position.set(o.x,.1,o.z);if(this.u<.995)B.g.rotation.y=Math.atan2(o2.x-o.x,o2.z-o.z);this.x=o.x;},pose:function(t){B.pose(t);B.g.rotation.x=sin(t*1.1+n)*.012;}});});
  labelOn('漕船进京',boats[boats.length-3].g,12);
 })();
 /* 水纹：原画的河面满是一圈圈细墨线勾的漩纹，这里沿河撒几百组同心短弧 */
 (function(){var P=[],o={},n,k,q;for(n=0;n<620;n++){riverAt(rr(.0,.86),0,o);var hw=o.hw,f=rr(-.88,.88);riverAt(uNear(o.x,o.z),f*hw,o);var cx=o.x+rr(-2,2),cz=o.z+rr(-1,1),a0=rnd()*6.28,rings=1+Math.floor(rnd()*3);
   for(q=0;q<rings;q++){var r=rr(.5,.9)+q*rr(.45,.7),span=rr(2.2,4.6),st=a0+rr(-.5,.5);for(k=0;k<9;k++){var a=st+span*k/9,b=st+span*(k+1)/9;P.push(cx+cos(a)*r*1.5,0,cz+sin(a)*r*.8,cx+cos(b)*r*1.5,0,cz+sin(b)*r*.8);}}}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));var l=new T.LineSegments(g,new T.LineBasicMaterial({color:0x5a4a36,transparent:true,opacity:.34,depthWrite:false}));l.position.y=.1;l.frustumCulled=false;scene.add(l);})();
 /* 点苔和草：岸边、路旁、空地上撒些三两笔的小墨点，地面就不是一张白纸 */
 (function(){var P=[],n=0,guard=0;while(n<2600&&guard++<20000){var x=rr(-590,590),z=rr(-49,40);if(inRiver(x,z,-.5))continue;var nr=nearRoad(x,z);if(nr<5.5)continue;if(rnd()<.55&&nr>22&&!inRiver(x,z,7))continue;var y=groundY(x,z)+.04,m=2+Math.floor(rnd()*3);for(var k=0;k<m;k++){var dx=rr(-.3,.3),h=rr(.25,.6);P.push(x+dx,y,z+rr(-.1,.1),x+dx+rr(-.22,.22),y+h,z+rr(-.1,.1));}n++;}
  var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));var l=new T.LineSegments(g,new T.LineBasicMaterial({color:0x4f4a30,transparent:true,opacity:.5,depthWrite:false}));l.frustumCulled=false;scene.add(l);})();
 /* 炊烟、飞鸟、狗 */
 [[2,330,540],[4,330,320],[6,1300,270],[10,300,720],[11,850,450],[14,270,250],[15,1180,1130]].forEach(function(s){var p=TP(s[0],s[1],s[2]);smoke(p[0],9,p[1]-2);});
 flock(46,-40,5,300);flock(54,-80,4,-120);
 [[2,700,600],[5,1500,420],[9,1000,960],[12,1300,620],[15,500,820]].forEach(function(s){var lp=PT([[s[0],s[1],s[2]],[s[0],s[1]-160,s[2]+40],[s[0],s[1]-120,s[2]-50],[s[0],s[1]+60,s[2]-70]],true);beast('dog',lp,{v:2.2});});
})();
