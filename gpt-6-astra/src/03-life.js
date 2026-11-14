/* 人物均为带骨节的实例化模型：五官、衣领、幞头、腰带、袖口与鞋。 */
Q.human=(x,z,role='walk',opts={})=>{
 Q.counts.people++;
 const root=Q.group(null,x,opts.y||0,z,opts.angle||0),body=Q.group(root),cloth=opts.color||Q.pick([0xb9b39b,0xc9bfa0,0x8a8979,0x777e74,0x998770,0xa4a28c,0x8e7661,0xc3b08b]),skin=Q.pick([0xbda07a,0xc7ac86,0xcdb18b]),ink=0x403a30;
 const labor=['porter','puller','rower','vendor','carrier','driver'].includes(role),seat=role==='tea';
 const torso=Q.group(body,0,seat?.51:.96,0);
 Q.part(torso,'robe',cloth,0,.15,0,.255,.49,.2);
 Q.part(body,'robe',cloth,0,seat?.47:.67,0,.3,labor?.3:.65,.235);
 // 交领以两条浅色衣襟相交，腰带绕身。
 for(let s of [-1,1])Q.beam(torso,[s*.17,.4,.16],[-s*.02,.13,.205],.026,0xd4c8a7);
 Q.part(torso,'cyl',0x625740,0,-.12,0,.262,.065,.205);
 Q.box(torso,0xbca579,.035,-.13,.21,.07,.07,.035);
 const head=Q.group(torso,0,.66,0);
 Q.ball(head,skin,0,0,0,.164,.215,.16);
 Q.ball(head,skin,0,-.025,.158,.036,.048,.039).userData.detail=true;
 for(let s of [-1,1]){Q.ball(head,skin,s*.164,-.005,0,.038,.06,.038);Q.ball(head,ink,s*.061,.035,.145,.018,.014,.012).userData.detail=true;Q.beam(head,[s*.035,.075,.147],[s*.091,.073,.134],.009,ink).userData.detail=true;}
 Q.beam(head,[-.033,-.085,.146],[.033,-.085,.146],.008,0x79513c).userData.detail=true;
 if(opts.beard||Q.rand()<.14)Q.part(head,'cone',0x595043,0,-.17,.09,.07,.16,.04).rotation.x=PI;
 const hat=opts.hat||((labor&&Q.rand()<.45)?'straw':Q.rand()<.6?'futou':'bun');
 if(hat==='straw'){Q.part(head,'cone',0xb7a173,0,.26,0,.38,.21,.38);Q.part(head,'cyl',0xa48a5d,0,.15,0,.38,.025,.38);}
 else if(hat==='futou'){Q.part(head,'cyl',ink,0,.19,-.014,.17,.16,.16);for(let s of [-1,1]){const m=Q.box(head,ink,s*.25,.17,-.1,.23,.045,.075);m.rotation.y=s*.2;}}
 else{Q.ball(head,ink,0,.12,-.03,.167,.125,.154);Q.ball(head,ink,0,.25,-.06,.087,.09,.085);Q.beam(head,[-.11,.25,-.06],[.13,.25,-.06],.012,0xb49d70);}
 const arms=[],legs=[];
 for(let s of [-1,1]){
  const arm=Q.group(torso,s*.26,.32,0);Q.part(arm,'robe',cloth,0,-.16,0,.12,.32,.115);const fore=Q.group(arm,0,-.31,0);Q.part(fore,'robe',cloth,0,-.11,0,.125,.26,.12);Q.part(fore,'cyl',0xd0c1a1,0,-.245,0,.12,.035,.115);Q.ball(fore,skin,0,-.29,.018,.07,.085,.065);arms.push({arm,fore});
  const leg=Q.group(body,s*.115,seat?.46:.49,0);Q.part(leg,'cyl',0x8a8270,0,-.2,0,.082,.4,.085);Q.box(leg,ink,0,-.43,.065,.17,.12,.3);legs.push(leg);
 }
 if(role==='porter'){
  Q.beam(torso,[-1.1,.42,0],[1.1,.42,0],.035,0x776243);
  for(let s of [-1,1]){Q.beam(torso,[s*.97,.42,0],[s*.97,-.62,0],.014,0x68593e);Q.basket(torso,s*.97,-.87,0,.33);}
 }
 if(role==='carrier'||opts.pack){Q.basket(torso,0,-.12,-.31,.29);Q.beam(torso,[-.18,.3,.14],[-.18,-.18,-.31],.025,0x726348);Q.ball(torso,0xbaaa83,0,.15,-.4,.27,.32,.2);}
 if(role==='vendor'){Q.box(torso,0xa18b61,0,.01,.44,.8,.09,.4);for(let i=0;i<4;i++)Q.ball(torso,0xc8b58b,(i-1.5)*.15,.1,.44,.07);}
 if(role==='tea'){Q.part(arms[1].fore,'cyl',0xbfbda4,0,-.32,.04,.085,.09,.085);}
 if(role==='puller'){Q.beam(torso,[-.2,.29,.1],[.18,-.16,-.2],.027,0x7d6b49);}
 if(opts.staff)Q.beam(root,[.4,.1,.32],[.4,1.6,.32],.025,0x766044);
 const scale=opts.scale||Q.rand(.91,1.08);root.scale.setScalar(scale);
 const phase=Q.rand(0,TAU),speed=Q.rand(1.9,3.1),baseY=opts.y||0,travel=opts.travel??(role==='walk'||role==='porter'||role==='carrier'?3.2:0),angle=opts.angle||0;
 const actor=Q.registerActor(root,(t)=>{
  const cyc=t*speed+phase,s=Math.sin(cyc),c=Math.cos(cyc),prog=Math.sin(t*.12+phase),direction=Math.cos(t*.12+phase)>=0?1:-1;
  if(opts.bind){const p=opts.bind(t);root.position.set(p.x,p.y||baseY,p.z);root.rotation.y=p.angle??angle;}
  else{root.position.set(x+Math.sin(angle)*prog*travel,baseY,z+Math.cos(angle)*prog*travel);root.rotation.y=angle+(travel&&direction<0?PI:0);}
  body.position.y=travel?Math.abs(s)*.035:Math.sin(t*1.3+phase)*.009;
  body.rotation.z=Math.sin(cyc*.5)*.018;
  head.rotation.y=Math.sin(t*.7+phase)*.13;
  for(let i=0;i<2;i++){legs[i].rotation.x=seat?-1.32:travel?s*(i?-.42:.42):Math.sin(t+phase)*.015;arms[i].arm.rotation.x=travel?s*(i?.38:-.38):-.12;arms[i].arm.rotation.z=(i?1:-1)*.06;arms[i].fore.rotation.x=-.12;}
  if(role==='porter'||role==='bearer'){arms[0].arm.rotation.x=-1.2;arms[0].fore.rotation.x=-.5;torso.rotation.z=s*.035;}
  if(role==='carrier'){torso.rotation.x=.16;arms[0].arm.rotation.x=-.9;}
  if(role==='puller'){torso.rotation.x=.5;arms.forEach((a,i)=>{a.arm.rotation.x=-1.3+Math.sin(cyc+i)*.08;a.fore.rotation.x=-.3;});legs[0].rotation.x=s*.24;legs[1].rotation.x=-s*.24;}
  if(role==='rower'){torso.rotation.x=.22+Math.sin(cyc*.6)*.18;arms.forEach(a=>{a.arm.rotation.x=-1.05+Math.sin(cyc*.6)*.22;a.fore.rotation.x=-.35;});}
  if(role==='talk'||role==='watch'||role==='vendor'){arms[1].arm.rotation.x=-.7-Math.sin(t*1.8+phase)*.25;arms[1].fore.rotation.x=-.45;head.rotation.y=Math.sin(t*.8+phase)*.25;}
  if(role==='tea'){arms[1].arm.rotation.x=-.9-Math.sin(t*.8+phase)*.35;arms[1].fore.rotation.x=-1.1;arms[0].arm.rotation.x=-.6;}
  if(role==='rider'){legs[0].rotation.x=legs[1].rotation.x=-.6;legs[0].rotation.z=-.4;legs[1].rotation.z=.4;arms.forEach(a=>a.arm.rotation.x=-.85);}
  if(role==='driver'){arms[1].arm.rotation.x=-.8+Math.sin(t+phase)*.2;}
 },'person');return actor;
};
Q.animal=(x,z,type='horse',opts={})=>{
 Q.counts.animals++;const root=Q.group(null,x,opts.y||0,z,opts.angle||0),g=Q.group(root);
 const small=type==='dog'||type==='pig',camel=type==='camel',ox=type==='ox',donkey=type==='donkey';
 const size=small?(type==='dog'?.42:.52):camel?1.3:donkey?.83:1;
 root.scale.setScalar(size);
 const col=opts.color||({horse:0x8d7557,donkey:0x8c8776,ox:0xa18c67,camel:0xaa9064,dog:0x9a8564,pig:0xafa085}[type]);
 Q.ball(g,col,0,1.25,0,.4,.5,.85);Q.ball(g,col,0,1.3,.6,.34,.5,.38);
 const neck=Q.group(g,0,1.42,.6);Q.beam(neck,[0,0,0],[0,camel?.95:.65,camel?.48:.25],.22,col,'flat',.17);
 const head=Q.group(neck,0,camel?.94:.64,camel?.52:.28);
 Q.ball(head,col,0,0,.12,.19,.25,.39);Q.ball(head,ox?0x695d48:col,0,-.12,.36,.16,.13,.2);
 for(let s of [-1,1]){Q.ball(head,0x322f28,s*.17,.07,.15,.03,.034,.026);const ear=Q.part(head,'cone',col,s*.13,.31,0,.075,donkey?.44:.23,.07);ear.rotation.z=s*-.3;
  if(ox)Q.line(head,[[s*.18,.17,-.08],[s*.4,.33,-.15],[s*.46,.53,-.05]],.055,0xc9bd9d);
 }
 if(!small&&!ox){for(let i=0;i<8;i++)Q.ball(neck,0x574c39,0,i*.085,-.15+i*.035,.1,.13,.12);}
 if(camel){for(let z0 of [-.38,.32])Q.ball(g,col,0,1.82,z0,.3,.48,.35);Q.ball(g,0x8d7553,0,1.05,.55,.3,.32,.25);}
 if(opts.pack||camel){Q.box(g,0x847559,0,1.64,-.1,.78,.13,1.1);for(let s of [-1,1]){Q.box(g,0xb4a27a,s*.45,1.46,-.15,.35,.55,.75);Q.beam(g,[s*.5,1.75,-.5],[s*.5,1.18,.23],.025,0x6e5b3d);}}
 if(opts.rider){Q.box(g,0x9f8a63,0,1.72,-.05,.68,.13,.75);Q.ball(g,0x65533b,0,1.81,-.08,.27,.12,.32);}
 // 缰绳、口衔、鞍带。
 Q.beam(head,[-.2,-.08,.23],[.2,-.08,.23],.025,0x514835);
 for(let s of [-1,1])Q.beam(g,[s*.18,1.95,.93],[s*.22,1.45,-.15],.015,0x62543b);
 const legs=[];for(let xx of [-.25,.25])for(let zz of [-.55,.5]){const leg=Q.group(g,xx,1.12,zz);Q.beam(leg,[0,0,0],[0,-.48,.05],.09,col);Q.beam(leg,[0,-.48,.05],[0,-.98,0],.055,col);Q.box(leg,0x4b4333,0,-1.05,.055,.16,.14,.22);legs.push(leg);}
 const tail=Q.group(g,0,1.5,-.8);Q.beam(tail,[0,0,0],[0,-.6,-.2],.045,0x67583e);Q.ball(tail,0x544b38,0,-.62,-.2,.08,.2,.08);
 const phase=Q.rand(0,TAU),angle=opts.angle||0,travel=opts.travel??2,baseY=opts.y||0;
 const a=Q.registerActor(root,t=>{const cy=t*2.2+phase,pr=Math.sin(t*.12+phase);if(opts.bind){const p=opts.bind(t);root.position.set(p.x,p.y||baseY,p.z);root.rotation.y=p.angle??angle;}else{root.position.set(x+Math.sin(angle)*pr*travel,baseY,z+Math.cos(angle)*pr*travel);root.rotation.y=angle+(travel&&Math.cos(t*.12+phase)<0?PI:0);}
  legs.forEach((leg,i)=>leg.rotation.x=Math.sin(cy+(i===0||i===3?0:PI))*((travel||opts.bind)?.4:.12));g.position.y=Math.abs(Math.sin(cy))*.025;head.rotation.x=Math.sin(cy*.5)*.08;tail.rotation.z=Math.sin(cy*.7)*.3;
 },'animal');
 if(opts.rider)Q.human(x,z,'rider',{scale:camel?1:.95,bind:()=>({x:root.position.x,y:root.position.y+1.5*size,z:root.position.z-.1,angle:root.rotation.y})});
 return a;
};
Q.wheel=(g,x,y,z,r)=>{
 const w=Q.group(g,x,y,z);const ring=Q.part(w,'ring',0x6d5a3f,0,0,0,r,r,r);ring.rotation.y=PI/2;
 const hub=Q.part(w,'cyl',0x89714d,0,0,0,.18,.5,.18);hub.rotation.z=PI/2;
 for(let i=0;i<12;i++){const a=i/12*TAU;Q.beam(w,[0,0,0],[0,Math.cos(a)*r,Math.sin(a)*r],.04,0x947c54);}
 return w;
};
Q.cart=(x,z,type='ox',angle=-PI/2)=>{
 const g=Q.group(null,x,0,z,angle),wheelbarrow=type==='barrow',sedan=type==='sedan',wheels=[];
 if(sedan){Q.box(g,0x8d7855,0,1.7,0,1.4,1.95,1.5);Q.lattice(g,0,2, .77,1.1,1.1);Q.roof(g,1.8,1.9,2.7,.45);for(let s of [-1,1])Q.beam(g,[s*.68,1.12,-2.6],[s*.68,1.12,2.6],.065,0x6e593c);}
 else{
  Q.box(g,0xa48c61,0,1.02,0,wheelbarrow?1.8:2.4,.18,3,'wood');
  if(wheelbarrow)wheels.push(Q.wheel(g,0,.92,0,.9));else for(let s of [-1,1])wheels.push(Q.wheel(g,s*1.4,1,0,1));
  if(!wheelbarrow){for(let s of [-1,1])Q.box(g,0x8b7650,s*1.13,1.5,0,.12,.9,3,'wood');
   // 席篷大车：连续的半圆篷顶与外露竹弓。
   const can=new T.CylinderGeometry(1.28,1.28,2.85,16,1,true,0,PI);can.rotateZ(PI/2);can.rotateY(PI/2);Q.part(g,can,0xb5a47b,0,1.55,0,1,1,1,'straw');
   for(let zz of [-1.3,-.65,0,.65,1.3]){const pts=[];for(let j=0;j<=12;j++){let a=j/12*PI;pts.push([Math.cos(a)*1.3,1.55+Math.sin(a)*1.3,zz]);}Q.line(g,pts,.045,0x7c6746);}
  }else{for(let s of [-1,1])Q.ball(g,0xb9aa84,s*.55,1.5,0,.4,.42,1.1);}
  for(let s of [-1,1])Q.beam(g,[s*.85,1,-.6],[s*.85,1,4.2],.065,0x765e3f);
 }
 const ph=Q.rand(0,6),motion=t=>Math.sin(t*.13+ph)*2.4;
 const a=Q.registerActor(g,t=>{g.position.x=x+Math.sin(angle)*motion(t);g.position.z=z+Math.cos(angle)*motion(t);g.position.y=Math.sin(t*3+ph)*.025;wheels.forEach(w=>w.rotation.x=motion(t)/(wheelbarrow?.9:1));},'cart');
 const at=(lateral,forward,y=0)=>()=>({x:g.position.x+Math.cos(angle)*lateral+Math.sin(angle)*forward,z:g.position.z-Math.sin(angle)*lateral+Math.cos(angle)*forward,y,angle});
 if(sedan){for(let zz of [-2.4,2.4])for(let xx of [-.67,.67])Q.human(x,z,'bearer',{bind:at(xx,zz),travel:2,scale:.95});}
 else if(wheelbarrow){Q.human(x,z,'driver',{bind:at(0,3.2),travel:2});}
 else{Q.animal(x,z,'ox',{bind:at(0,4.4),travel:2});Q.human(x,z,'driver',{bind:at(1.8,3.5),travel:2,staff:true});}
 return a;
};
