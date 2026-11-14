/* 木构、瓦屋、彩楼、街具与早春林木。 */
Q.roof=(parent,w,d,y,h=2.4,thatch=false)=>{
 const g=Q.group(parent,0,y,0),mat=thatch?'straw':'roof',base=thatch?0xc6b68e:0xa6a499;
 const pos=[],uv=[],ids=[],nx=12,nz=10;
 const height=(x,t)=>h*Math.pow(1-t,1.65)+.3*Math.pow(t,7)+.35*Math.pow(Math.abs(x)/(w/2),8)*Math.pow(t,3);
 for(const side of [-1,1]){
  const start=pos.length/3;
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const x=-w/2+w*i/nx,t=j/nz;pos.push(x,height(x,t),side*d/2*t);uv.push(i/nx*w/5,t*d/5);}
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=start+i*(nz+1)+j,b=a+nz+1;ids.push(a,b,a+1,b,b+1,a+1);}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();Q.part(g,geo,base,0,0,0,1,1,1,mat);
 // 瓦垄为立体线条，瓦片接缝由自制贴图提供。
 if(!thatch){for(let x=-w/2+.15;x<w/2;x+=.44){for(const side of [-1,1]){const pts=[];for(let i=0;i<=7;i++){const t=i/7;pts.push([x,height(x,t)+.045,side*d/2*t]);}Q.line(g,pts,.045,0x77786e);Q.ball(g,0x62665d,x,height(x,1)+.03,side*d/2,.07,.065,.07);}}
  Q.beam(g,[-w/2,h+.08,0],[w/2,h+.08,0],.15,0x696b62);
  for(const side of [-1,1])Q.line(g,[[side*(w/2-.8),h+.1,0],[side*(w/2+.1),h+.28,0],[side*(w/2+.35),h+.62,0]],.11,0x65685f);
 }else{
  for(let x=-w/2;x<w/2;x+=.24)for(const side of [-1,1])Q.beam(g,[x,height(x,.75),side*d*.375],[x+Q.rand(-.1,.1),height(x,1)-Q.rand(.1,.35),side*d*.51],.026,0x8f7d56);
  Q.beam(g,[-w/2,h+.1,0],[w/2,h+.1,0],.2,0x9b895f);
 }
 // 山墙边缝与出檐木条。
 for(const x of [-w/2,w/2])for(const side of [-1,1]){const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push([x,height(x,t)-.1,side*d/2*t]);}Q.line(g,pts,.075,0x61533d);}
 return g;
};
Q.lattice=(p,x,y,z,w,h)=>{
 Q.box(p,0x574e3c,x,y,z,w,h,.07);Q.box(p,0xb0a383,x,y,z+.045,w-.1,h-.1,.05);
 for(let a=-w/2;a<=w/2+.01;a+=.25)Q.box(p,0x6c5c41,x+a,y,z+.09,.045,h,.06);
 for(let a=-h/2;a<=h/2+.01;a+=.3)Q.box(p,0x6c5c41,x,y+a,z+.1,w,.045,.06);
};
Q.railing=(p,a,b,y)=>{
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.ceil(len/.8);
 for(let i=0;i<=n;i++){const t=i/n;Q.box(p,0x887454,a[0]+dx*t,y+.5,a[1]+dz*t,.1,1,.1);}
 for(let h of [.2,.85])Q.beam(p,[a[0],y+h,a[1]],[b[0],y+h,b[1]],.07,0x7c674a);
};
Q.house=(x,z,w=13,d=9,opts={})=>{
 Q.counts.buildings++;const h=opts.h||4.3,g=Q.group(null,x,opts.y||0,z,opts.rot||0),floor=opts.two?2:1;
 Q.box(g,0xafa388,0,.22,0,w+.8,.45,d+.6,'stone');
 for(let f=0;f<floor;f++){
  const y=.5+f*(h+.4),front=d/2;
  Q.box(g,0xe0d1ac,0,y+h/2,-d/2+.15,w,h,.3,'wall');
  for(let s of [-1,1])Q.box(g,0xd2c29c,s*(w/2-.15),y+h/2,0,.3,h,d,'wall');
  Q.box(g,0x9b845d,0,y-.03,0,w,.16,d,'wood');
  let bays=Math.max(2,Math.round(w/3));
  for(let i=0;i<=bays;i++){
   const xx=-w/2+i*w/bays;Q.box(g,0x746043,xx,y+h/2,front-.1,.2,h,.2,'wood');
   Q.box(g,0x8a7653,xx,y+h-.12,front-.1,.65,.16,.6);Q.box(g,0x756344,xx,y+h+.02,front-.1,.95,.12,.28);
   if(i<bays){let mid=xx+w/bays/2;
    if((opts.open!==false&&f===0&&i%3!==0)||opts.two&&f===1&&i%2===0){Q.box(g,0x584c39,mid,y+h/2,-d/2+.32,w/bays-.3,h-.5,.03);}
    else Q.lattice(g,mid,y+h*.55,front,w/bays-.4,h*.57);
   }
  }
  for(let yy of [y+.4,y+h-.5,y+h])Q.box(g,0x7c6749,0,yy,front-.1,w+.3,.13,.16);
  if(opts.two&&f===1){Q.box(g,0x927b54,0,y-.12,d/2+.9,w+1,.22,2.1,'wood');Q.railing(g,[-w/2-.4,d/2+1.8],[w/2+.4,d/2+1.8],y);for(let side of [-1,1])Q.railing(g,[side*(w/2+.4),-d/2],[side*(w/2+.4),d/2+1.8],y);}
 }
 const roofY=.5+floor*h+(floor-1)*.4;
 Q.roof(g,w+2,d+2.2,roofY,opts.thatch?2.5:Math.min(3.3,d*.3),opts.thatch);
 if(opts.two)Q.roof(g,w+1.5,d+1.2,h+.3,1.1,false);
 if(opts.awning!==false){const aw=Q.box(g,0xc6b48a,0,h*.8,d/2+1.35,w*.94,.09,2.7,opts.thatch?'straw':'wood');aw.rotation.x=.13;for(let side of [-1,1])Q.beam(g,[side*w*.46,.5,d/2+2.4],[side*w*.46,h*.8-.15,d/2+2.4],.08,0x7f6c49);}
 if(opts.name){Q.sign(g,opts.name,0,h-.5,d/2+.25,Math.min(w-1,opts.name.length*.85),.95);Q.label(opts.name,x,roofY+3.4,z,opts.major?'main':'');}
 if(opts.vertical){Q.beam(g,[w/2+.3,h,0],[w/2+2,h,0],.055);Q.sign(g,opts.vertical,w/2+1.45,h-1.4,.08,.8,3.2,true);}
 Q.bakeWithSigns(g);return {x,z,w,d,h,opts};
};
Q.table=(p,x,z,goods=false,y=0)=>{
 Q.box(p,0x987f54,x,y+1.05,z,2.1,.15,1.3,'wood');for(let xx of [-.82,.82])for(let zz of [-.4,.4])Q.box(p,0x6b583e,x+xx,y+.5,z+zz,.12,1,.12);
 if(goods){for(let i=0;i<7;i++){let xx=x+Q.rand(-.8,.8),zz=z+Q.rand(-.45,.45);Q.part(p,'robe',Q.pick([0xc6b38d,0x8e7c57,0xaaa68b]),xx,y+1.25,zz,.19,.3,.19);}}
 else{for(let xx of [-.5,.5]){Q.part(p,'cyl',0xd2c7aa,x+xx,y+1.17,z,.16,.11,.16);Q.part(p,'cyl',0x65553b,x+xx,y+1.23,z,.11,.015,.11);}Q.part(p,'ball',0x807757,x,y+1.28,z,.22,.2,.22);Q.beam(p,[x+.12,y+1.35,z],[x+.34,y+1.36,z],.06,0x807757);}
};
Q.basket=(p,x,y,z,r=.4)=>{
 Q.part(p,'robe',0xb19b6d,x,y+r*.5,z,r,r,r);for(let i=0;i<4;i++){const m=Q.part(p,'ring',0x7d6948,x,y+i*r/4,z,r*(.95-i*.05),r*(.95-i*.05),r*(.95-i*.05));m.rotation.x=PI/2;}
};
Q.umbrella=(p,x,z,r=2.5,y=3.7)=>{
 Q.beam(p,[x,0,z],[x,y+.35,z],.065,0x69573d);
 Q.part(p,'cone',0xb8a57c,x,y,z,r,.9,r,'straw');
 for(let i=0;i<18;i++){const a=i/18*TAU;Q.beam(p,[x,y+.46,z],[x+Math.cos(a)*r,y-.44,z+Math.sin(a)*r],.023,0x786848);}
 Q.ball(p,0x776247,x,y+.56,z,.12,.2,.12);
};
Q.stall=(x,z,rot=0,type=0)=>{
 const g=Q.group(null,x,0,z,rot);Q.table(g,0,0,true);
 if(type%2===0)Q.umbrella(g,0,-.35,2.3,3.35);
 else{for(let xx of [-1.5,1.5])for(let zz of [-1,1])Q.beam(g,[xx,0,zz],[xx,3.1,zz],.06);Q.box(g,0xbfae83,0,3.1,0,3.4,.12,2.5,'straw');}
 for(let i=0;i<3;i++)Q.basket(g,-1.6+i*.8,0,1.35,.32+Q.rand(0,.2));Q.bake(g);
};
Q.flag=(x,y,z,text='酒',rot=0)=>{
 const p=Q.group(null,x,y,z,rot);Q.beam(p,[0,-y,0],[0,1.5,0],.075);Q.beam(p,[0,1.25,0],[2.6,1.25,0],.06);Q.bake(p);
 const g=Q.group(null,x+.9,y,z,rot);const s=Q.sign(g,text,.5,-.25,0,1.25,2.4,true);s.userData.sign=false;
 // 纹理招幌为独立动态网格，保留文字和布面形变。
 Q.scene.add(g);Q.flags=Q.flags||[];Q.flags.push({g,s,phase:Q.rand(0,6)});
};
Q.pailou=(x,z,w=10,h=9,rot=0)=>{
 const g=Q.group(null,x,0,z,rot);
 for(let s of [-1,1]){Q.box(g,0x766043,s*w/2,h/2,0,.3,h,.3);Q.box(g,0xb3a17b,s*w/2,.25,0,.9,.5,.9);}
 for(let level=0;level<3;level++){
  const yy=h-2.8+level*1.25,ww=w+1-level*1.2;
  for(let z0 of [-.55,.55]){Q.box(g,0x876345,0,yy,z0,ww,.18,.13);Q.box(g,0xb49b6a,0,yy+.3,z0,ww,.12,.13);
   for(let xx=-ww/2;xx<=ww/2;xx+=.65)Q.box(g,0x8c7550,xx,yy+.5,z0,.05,.9,.05);
  }
  for(let i=0;i<11-level*2;i++){const xx=-ww/2+.45+i*(ww-.9)/(10-level*2);Q.beam(g,[xx,yy+.5,0],[xx,yy+1.7,0],.035,0x8a7654);Q.ball(g,0xb3a47d,xx,yy+.9,0,.2,.32,.12);Q.ball(g,0x88684e,xx,yy+1.3,0,.12,.2,.1);}
 }
 for(let i=0;i<7;i++){const xx=-w/2+i*w/6;Q.beam(g,[xx,h-.8,0],[xx,h+2+(i%2)*.8,0],.04,0x8b7856);}
 for(let side of [-1,1])Q.line(g,[[side*(w/2),h-1,0],[side*(w/2+1.5),h-.3,0],[side*(w/2+1.8),h+.6,0]],.09,0x94794f);
 Q.bake(g);
 for(let s of [-1,1])Q.flag(x+s*w*.4,h-3,z+.1,'新酒',rot);
};
Q.tree=(x,z,size=1,willow=true)=>{
 const g=Q.group(null,x,0,z),color=0x77684d;
 const lean=Q.rand(-.8,.8),h=(willow?4.5:6.4)*size;
 const trunk=[[0,0,0],[.3*size,h*.3,.25],[lean*size,h*.65,-.25],[lean*size+.3,h,0]];
 for(let i=1;i<trunk.length;i++)Q.beam(g,trunk[i-1],trunk[i],(.6-i*.11)*size,color,'wood',(.5-i*.1)*size);
 for(let i=0;i<8;i++){const a=i*TAU/8;Q.beam(g,[0,.45,0],[Math.cos(a)*size,0,Math.sin(a)*size],.16*size,color,'wood',.05);}
 for(let i=0;i<5;i++)Q.ball(g,0x6c5d44,lean*.5+Q.rand(-.3,.3),Q.rand(1,h*.7),Q.rand(-.3,.3),.3*size,.4*size,.25*size);
 const crown=Q.group(null,x+lean*size+.3,h,z);
 for(let k=0;k<(willow?13:9);k++){
  const a=k*TAU/(willow?13:9)+Q.rand(-.25,.25),len=Q.rand(3.8,6.3)*size;
  const A=[0,0,0],B=[Math.cos(a)*len*.45,Q.rand(1.2,2.3)*size,Math.sin(a)*len*.45],C=[Math.cos(a)*len,Q.rand(2.4,4.8)*size,Math.sin(a)*len];
  Q.beam(g,[lean*size+.3,h,0],[B[0]+lean*size+.3,B[1]+h,B[2]],.11*size,color,'wood',.05);
  Q.beam(crown,B,C,.045*size,color,'flat',.018);
  for(let j=0;j<4;j++){
   const t=.25+j*.18,b=[B[0]+(C[0]-B[0])*t,B[1]+(C[1]-B[1])*t,B[2]+(C[2]-B[2])*t];
   const a2=a+(j%2?-.45:.45),end=[b[0]+Math.cos(a2)*len*.35,b[1]+size*(willow?1.1:1.7),b[2]+Math.sin(a2)*len*.35];
   Q.beam(crown,b,end,.018*size,color,'flat',.007);
   const tip=[end[0]+Math.cos(a2)*size*.5,end[1]-(willow?Q.rand(.8,2.2):-.3)*size,end[2]+Math.sin(a2)*size*.5];Q.beam(crown,end,tip,.009*size,0x837455);
   if(willow&&j%3===0)for(let u of [.3,.6,.9])Q.ball(crown,0x8d8b62,tip[0]*u+end[0]*(1-u),tip[1]*u+end[1]*(1-u),tip[2]*u+end[2]*(1-u),.065*size,.16*size,.04*size);
  }
 }
 Q.bake(g);Q.registerActor(crown,(t,ph)=>{crown.rotation.z=Math.sin(t*.65+ph)*.012;crown.rotation.x=Math.sin(t*.43+ph)*.008;},'tree');
};
Q.cityGate=()=>{
 const {x,z}=Q.world.gate,g=Q.group(null,x,0,z),W=32,H=16,D=13;
 // 大门正对东西向街道，墙身沿 z 延伸；门洞为原图中的直壁方门。
 for(let s of [-1,1])Q.box(g,0xc0b49a,0,H/2,s*(W/4+3),D,H,W/2-6,'stone');
 Q.box(g,0xbfb398,0,H-2,0,D,4,12,'stone');
 for(let s of [-1,1]){Q.box(g,0x897b60,0,6,s*5.8,D+.1,12,.3,'stone');Q.box(g,0x746047,s*D/2,5.2,s*5.3,.22,10.4,1.1,'wood');}
 Q.box(g,0xb3a68a,0,H+.1,0,D+2,.5,W+2,'stone');
 for(let a=-W/2;a<W/2;a+=1.6)for(let xx of [-D/2-.5,D/2+.5])Q.box(g,0xab9d80,xx,H+.75,a,.7,1.1,.95,'stone');
 Q.bake(g);
 Q.house(x,z,25,11,{y:H+.5,h:5.4,rot:PI/2,awning:false,open:false});
 // 城内一侧的登城台阶及扶栏。
 const stairs=Q.group(null,x-15,0,z-16);
 for(let i=0;i<28;i++)Q.box(stairs,0xb8a98a,0,(i+.5)*H/28,-i*.62,4,(i+1)*H/28,.65,'stone');
 for(let s of [-1,1])Q.beam(stairs,[s*2,1.1,0],[s*2,H+1.1,-17],.11,0x8a7757);Q.bake(stairs);
 // 城墙在原画上方消失，保留短段而不虚构一圈城池。
 const wall=Q.group();Q.box(wall,0xb9ac8f,x,H*.4,-49,D*.8,H*.8,24,'stone');Q.bake(wall);
 Q.label('城门',x,26,z,'main');
 // 城外沟渠上的平桥，独立于虹桥。
 const bridge=Q.group(null,x+36,0,z);
 Q.box(bridge,0x8f8165,0,.35,0,22,.6,13,'wood');
 for(let i=-10;i<=10;i+=.65)Q.box(bridge,0xb3a17b,i,.71,0,.6,.12,13,'wood');
 for(let s of [-1,1])Q.railing(bridge,[-11,s*6.5],[11,s*6.5],.7);Q.bake(bridge);
};
