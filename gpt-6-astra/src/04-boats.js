/* 汴河漕船：翘首尾、席篷、舵楼、卧桅；全场无张帆模型。 */
Q.hullCache=new Map();
Q.boat=(x,z,length=22,width=5.2,angle=PI/2,opts={})=>{
 Q.counts.boats++;const root=Q.group(null,x,0,z,angle),g=Q.group(root),L=length,W=width;
 const key=L+':'+W;let geo=Q.hullCache.get(key);
 const sheer=t=>.9*Math.pow(Math.abs(t*2-1),3),wide=t=>W*.5*Math.pow(Math.max(.0001,Math.sin(t*PI)),.45);
 if(!geo){const pos=[],uv=[],ids=[];for(let i=0;i<=32;i++){let t=i/32;for(let j=0;j<5;j++){let s=[-1,-.75,0,.75,1][j],y=[.65,-.3,-.7,-.3,.65][j]+sheer(t);pos.push(wide(t)*s,y,(t-.5)*L);uv.push(t*L/5,j/4);}}
  for(let i=0;i<32;i++)for(let j=0;j<4;j++){let a=i*5+j;ids.push(a,a+1,a+5,a+1,a+6,a+5);}geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();Q.hullCache.set(key,geo);
 }
 Q.part(g,geo,0x967b51,0,0,0,1,1,1);
 for(let i=1;i<27;i++){let t=i/28;Q.box(g,0xb39a6c,0,.64+sheer(t),(t-.5)*L,wide(t)*1.85,.09,L/28-.025);}
 for(let side of [-1,1]){
  for(let j=0;j<4;j++){const pts=[];for(let i=0;i<=24;i++){let t=i/24;pts.push([side*wide(t)*(1-j*.085),.67-j*.25+sheer(t),(t-.5)*L]);}Q.line(g,pts,.028,0x584a34);}
  for(let i=0;i<12;i++){let t=.08+i*.075;Q.ball(g,0x544a35,side*wide(t)*.99,.46+sheer(t),(t-.5)*L,.045);}
 }
 if(opts.canopy!==false){
  const cl=L*.42,cw=W*.83,ch=W*.4,cy=.95,cz=-L*.025;
  const cacheKey='can'+cl+':'+cw;let canopy=Q.hullCache.get(cacheKey);
  if(!canopy){const pos=[],uv=[],ids=[];for(let i=0;i<=16;i++){let a=i/16*PI;for(let j=0;j<2;j++){pos.push(Math.cos(a)*cw/2,Math.sin(a)*ch,j?cl/2:-cl/2);uv.push(i/16*3,j*3);}}for(let i=0;i<16;i++){let k=i*2;ids.push(k,k+1,k+2,k+1,k+3,k+2);}canopy=new T.BufferGeometry();canopy.setAttribute('position',new T.Float32BufferAttribute(pos,3));canopy.setAttribute('uv',new T.Float32BufferAttribute(uv,2));canopy.setIndex(ids);canopy.computeVertexNormals();Q.hullCache.set(cacheKey,canopy);}
  Q.part(g,canopy,0xb3a27c,0,cy,cz,1,1,1);
  for(let zz=-cl/2;zz<=cl/2+.01;zz+=cl/6){const pts=[];for(let j=0;j<=12;j++){const a=j/12*PI;pts.push([Math.cos(a)*(cw/2+.03),cy+Math.sin(a)*(ch+.03),zz+cz]);}Q.line(g,pts,.045,0x756243);}
  for(let s of [-1,1])for(let yy of [1,1.4])Q.beam(g,[s*cw/2,yy,-cl/2+cz],[s*cw/2,yy,cl/2+cz],.05,0x786549);
 }
 if(L>=20){const zz=-L*.32;
  Q.box(g,0x806d4d,0,1.75,zz,W*.65,1.8,L*.15);
  Q.lattice(g,0,1.85,zz+L*.075+.02,W*.52,1.1);
  Q.box(g,0xb29c73,0,2.8,zz,W*.82,.14,L*.2);
  for(let s of [-1,1])Q.beam(g,[s*W*.33,.8,zz],[s*W*.33,2.75,zz],.065,0x5f5038);
 }
 // 可放倒人字桅，桥下主船卧桅贴近篷顶；其他船也不设帆。
 const mast=Q.group(g,0,.75,L*.16),up=opts.mast==='upright';
 for(let s of [-1,1])Q.beam(mast,[s*W*.33,0,0],[0,up?L*.48:1.1,up?-.6:L*.38],.08,0x806b49);
 Q.beam(mast,[0,up?L*.48:1.1,up?-.6:L*.38],[0,up?L*.48+.4:1.2,up?-.6:L*.43],.06,0x796347);
 for(let side of [-1,1])Q.beam(g,[side*W*.4,.8,-L*.25],[0,up?L*.48+.75:1.9,L*(up?.16:.54)],.012,0x5f523b);
 const rudder=Q.group(g,0,.4,-L*.49);Q.box(rudder,0x756043,0,-.1,-.8,.15,2.1,1.5);Q.beam(rudder,[0,-.9,0],[0,2.8,0],.07,0x5b4d36);Q.beam(rudder,[0,2.2,0],[0,2.2,2.6],.07,0x5b4d36);
 const oars=[];for(let s of opts.small?[1]:[-1,1]){const oar=Q.group(g,s*W*.42,1,-L*.35);Q.beam(oar,[0,0,0],[s*2.6,-.8,-3],.045,0x6a593d);Q.box(oar,0x8b7650,s*2.7,-.85,-3.2,.16,.12,1.2).rotation.y=-s*.7;oars.push(oar);}
 for(let j=0;j<3;j++){let zz=L*.27+j*.65;Q.basket(g,0,.7,zz,.45);}
 // 甲板上的盘缆。
 for(let i=0;i<4;i++){const m=Q.part(g,'ring',0x8b7852,W*.2,.78+i*.035,L*.3,.4-i*.06,.4-i*.06,.4-i*.06);m.rotation.x=PI/2;}
 const phase=Q.rand(0,6);
 const a=Q.registerActor(root,t=>{root.position.y=Math.sin(t*.8+phase)*.045;root.rotation.z=Math.sin(t*.65+phase)*.008;root.rotation.x=Math.sin(t*.58+phase)*.007;rudder.rotation.y=Math.sin(t*.6+phase)*.08;oars.forEach((o,i)=>{o.rotation.y=Math.sin(t*1.4+phase+i)*.22;o.rotation.x=Math.cos(t*1.4+phase+i)*.1;});},'boat');
 const crew=opts.crew|| (L>=24?5:3);
 for(let i=0;i<crew;i++){
  const xx=((i%2)-.5)*W*.52,zz=i<2?-L*.4:L*.33-(i-2)*1.1;
  Q.human(x,z,opts.danger&&i>1?'watch':'rower',{scale:.95,hat:i%2?'bun':'straw',bind:()=>({x:x+Math.cos(angle)*xx+Math.sin(angle)*zz,y:.76+root.position.y,z:z-Math.sin(angle)*xx+Math.cos(angle)*zz,angle:angle+(i%2?0:PI)})});
 }
 return a;
};
