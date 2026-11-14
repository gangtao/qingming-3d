/* 03_figures.js — 人物、牲口、车、轿、伞、摊子 */
const ROBES=[0xd9cfb4,0xcbbd9a,0xb4a384,0x8f7e63,0x746f60,0x5f6d72,0x7b5c3e,0xa87a4c,0x9b6b52,0x56624f,0xc9b684,0xe0d8c0,0x6d5a48,0x8a8f84];
const SKINS=[0xdcb48a,0xcb9f76,0xbb8c65,0xd5a880];
const DARKH=0x2b231a,SHOE=0x2a2118;
function entStart(b,o,mode){
  b.reset();const s=b.st;s.h=o.h||0;s.mode=mode;s.ph=o.ph!==undefined?o.ph:rr(6.28);s.spd=o.spd||1;s.rng=o.rng||0;
  s.tp=o.tp!==undefined?o.tp:rnd();s.flag=o.flag||0;s.amp=o.amp||0;s.part=0;s.pv=[0,0,0];
  s.root=[o.x,o.y!==undefined?o.y:groundY(o.x,o.z),o.z];
}
/* 一个人。面朝 +x；part: 0躯干 1左臂 2右臂 3左腿 4右腿 5头 6担子 */
function person(o){
  const b=GB.ag.at(o.x);const role=o.role||'walk';
  let mode=o.mode||(role==='sit'?3:role==='porter'?4:1);
  const sitting=mode===3||role==='rider';
  entStart(b,o,mode);b.jit=0.04;
  const sc=o.sc||1;STAT.people++;
  const robe=o.robe!==undefined?o.robe:pick(ROBES),skin=o.skin||pick(SKINS);
  const long=o.long!==undefined?o.long:(role==='official'||role==='scholar'||(!o.sc&&rnd()<0.25));
  const pants=o.pants||pick([0xcfc4a6,0x8f866f,0x6b6354]);
  const belt=o.belt||pick([0x3b3228,0x6a4a34,0x8a7a58]);
  const hat=o.hat||(role==='official'?'futou':role==='porter'||role==='traveler'?pick(['dou','dou','bun','futou']):role==='boatman'||role==='tracker'?pick(['bun','cap','none']):pick(['futou','futou','bun','cap','dou','none']));
  b.push().s(sc);
  const down=sitting?-0.36:0;
  // 腿
  for(const sd of[-1,1]){
    b.st.part=sd<0?3:4;b.pv(0,0.86,sd*0.1);
    if(sitting){b.st.part=0;
      b.bx(0.2,0.5-0.36+0.3,sd*0.1,0.46,0.14,0.15,pants);
      b.bx(0.4,0.22,sd*0.1,0.13,0.5,0.14,pants);b.bx(0.46,0.02,sd*0.1,0.27,0.07,0.14,SHOE);
    }else{
      b.bx(0,0.43,sd*0.1,0.15,0.86,0.16,long?shade(robe,0.85):pants);
      b.bx(0.06,0.04,sd*0.1,0.28,0.08,0.15,SHOE);
    }
  }
  b.st.part=0;
  b.push().t(0,down,0);
  // 身躯：衣袍
  b.push().s(1,1,1.28);
  if(long)b.cy(0,0.76,0,0.2,0.3,1.3,8,robe,false,shade(robe,0.8));
  else b.cy(0,1.13,0,0.2,0.26,0.66,8,robe,true,shade(robe,0.85));
  b.pop();
  b.push().s(1,1,1.28).cy(0,1.0,0,0.235,0.235,0.07,8,belt).pop();
  // 交领
  b.ln(0.17,1.44,-0.09,0.2,1.2,0.0,0.022,0.022,0xe9e1cb,3);b.ln(0.17,1.44,0.09,0.2,1.2,0.0,0.022,0.022,0xe9e1cb,3);
  b.bx(0.04,1.43,0.0,0.06,0.06,0.18,0xe9e1cb);
  b.cy(0,1.49,0,0.07,0.08,0.1,6,skin);
  // 背负
  if(role==='basket'){b.bx(-0.26,1.15,0,0.3,0.42,0.36,0x9a8355);b.bx(-0.26,1.37,0,0.32,0.04,0.38,0x6e5a38);b.ln(0.0,1.38,-0.18,-0.2,1.0,-0.18,0.02,0.02,0x6e5a38,3);b.ln(0.0,1.38,0.18,-0.2,1.0,0.18,0.02,0.02,0x6e5a38,3)}
  if(role==='bundle'){b.sp(-0.12,1.56,0.12,0.17,0.15,0.15,pick([0xcdbf9a,0x8c7a5c,0x6f7a80]),7,5);b.ln(0,1.42,0.1,-0.1,1.5,0.15,0.02,0.02,0x5a4a32,3)}
  b.pop();
  // 头
  b.st.part=5;b.pv(0,1.45+down,0);b.push().t(0,down,0);
  b.sp(0.01,1.62,0,0.125,0.148,0.12,skin,8,6);
  b.bx(0.112,1.625,0.045,0.016,0.02,0.022,0x1c140d);b.bx(0.112,1.625,-0.045,0.016,0.02,0.022,0x1c140d);
  b.bx(0.108,1.652,0.045,0.014,0.012,0.032,0x2b231a);b.bx(0.108,1.652,-0.045,0.014,0.012,0.032,0x2b231a);
  b.bx(0.125,1.585,0,0.03,0.04,0.025,shade(skin,0.88));b.bx(0.114,1.54,0,0.012,0.014,0.05,0x7a3f30);
  b.bx(-0.005,1.6,0.118,0.03,0.05,0.012,shade(skin,0.9));b.bx(-0.005,1.6,-0.118,0.03,0.05,0.012,shade(skin,0.9));
  if(role==='elder'||(rnd()<0.12&&role!=='kid')){b.sp(0.075,1.52,0,0.05,0.07,0.07,0xe5e0d2,6,4)}
  if(hat==='futou'){b.bx(-0.02,1.76,0,0.2,0.13,0.23,0x211a14);b.bx(-0.02,1.83,0,0.15,0.04,0.17,0x211a14);b.bx(-0.16,1.78,0.2,0.1,0.016,0.2,0x211a14);b.bx(-0.16,1.78,-0.2,0.1,0.016,0.2,0x211a14)}
  else if(hat==='bun'){b.sp(-0.02,1.66,0,0.128,0.125,0.125,DARKH,8,5);b.sp(-0.04,1.82,0,0.06,0.06,0.06,DARKH,6,4);b.cy(0,1.7,0,0.125,0.125,0.03,8,pick([0xd8cfb8,0x5f6d72,0x8a3b2c]))}
  else if(hat==='dou'){b.cy(0.0,1.77,0,0.05,0.42,0.17,10,0xb69a5a,true,0x8c7440)}
  else if(hat==='cap'){b.cy(-0.01,1.73,0,0.09,0.13,0.12,8,pick([0x2b231a,0x5b5a52]));}
  else b.sp(-0.02,1.65,0,0.128,0.12,0.125,DARKH,8,5);
  b.pop();
  // 手臂
  const sleeve=o.sleeve!==undefined?o.sleeve:robe;
  const handsIn=role==='official'||role==='scholar'||role==='elder'||(role==='sit'&&false);
  for(const sd of[-1,1]){
    const pvv=[0,1.38+down,sd*0.21];
    if(handsIn||role==='sit'&&rnd()<0.3){b.st.part=0;
      b.ln(0,1.36+down,sd*0.21,0.16,1.13+down,sd*0.07,0.06,0.055,sleeve,5);b.ln(0.16,1.13+down,sd*0.07,0.18,1.1+down,-sd*0.04,0.055,0.06,sleeve,5);
    }else if(role==='porter'&&mode===4||o.role==='holdup'){b.st.part=0;
      b.ln(0,1.36+down,sd*0.21,0.1,1.45+down,sd*0.16,0.05,0.045,sleeve,5);b.sp(0.12,1.47+down,sd*0.15,0.04,0.04,0.04,skin,5,4);
    }else{
      b.st.part=sd<0?1:2;b.pv(...pvv);
      b.bx(0,1.38+down-0.15,sd*0.21,0.1,0.34,0.1,sleeve);b.bx(0.0,1.38+down-0.4,sd*0.21,0.075,0.2,0.075,shade(sleeve,0.95));b.sp(0.01,1.38+down-0.52,sd*0.21,0.04,0.045,0.04,skin,5,4);
    }
  }
  // 担子
  if(role==='porter'){b.st.part=6;b.pv(0,1.42,0);
    b.ln(-1.0,1.46,0,1.0,1.46,0,0.03,0.03,0x7a6038,5);
    for(const sx of[-0.9,0.9]){b.ln(sx,1.46,0,sx,0.95,-0.12,0.008,0.008,0x4a3c26,3);b.ln(sx,1.46,0,sx,0.95,0.12,0.008,0.008,0x4a3c26,3);
      b.cy(sx,0.88,0,0.26,0.19,0.16,10,pick([0x9a8355,0x8a7448,0xb09a68]));b.sp(sx,0.97,0,0.2,0.07,0.2,pick([0xcdbf9a,0x7e8a5a,0x8a6a40]),7,3);}
  }
  b.pop();
  b.st.part=0;b.jit=0.03;return b;
}
/* 动物：面朝 +x。part: 3/4 腿组，5 头颈，8 尾 */
function animal(kind,o){
  const b=GB.ag.at(o.x);entStart(b,o,o.mode||14);STAT.animals++;b.jit=0.05;
  const sc=o.sc||1;b.push().s(sc);
  const P={horse:{c:0x7a5a3c,body:[0.95,0.4,0.33],h:1.22,leg:1.0,neck:1.75,len:0.62},donkey:{c:0x8a8272,body:[0.8,0.34,0.27],h:1.0,leg:0.78,neck:1.45,len:0.52},
   ox:{c:o.c||0x8c6a40,body:[0.95,0.46,0.4],h:1.08,leg:0.74,neck:1.2,len:0.55},camel:{c:0x9a7e56,body:[0.9,0.48,0.34],h:1.75,leg:1.4,neck:2.7,len:0.62},
   pig:{c:o.c||0x4a4038,body:[0.52,0.27,0.24],h:0.5,leg:0.32,neck:0.5,len:0.3},dog:{c:o.c||0xa38a5a,body:[0.34,0.14,0.12],h:0.46,leg:0.3,neck:0.55,len:0.26},
   sheep:{c:0xe0d8c4,body:[0.4,0.26,0.24],h:0.62,leg:0.36,neck:0.8,len:0.3}}[kind];
  const c=P.c,[bx,by,bz]=P.body,hy=P.h,leg=P.leg;
  // 躯干
  b.st.part=0;b.sp(0,hy,0,bx,by,bz,c,10,7);
  if(kind==='horse'||kind==='donkey'||kind==='ox'){b.sp(P.len*0.9,hy+0.02,0,bx*0.5,by*1.05,bz*1.0,c,8,6);b.sp(-P.len*0.8,hy+0.04,0,bx*0.5,by*1.05,bz*0.95,c,8,6)}
  if(kind==='camel'){for(const hx of[-0.38,0.38]){b.sp(hx,hy+by*0.9,0,0.28,0.45,0.26,shade(c,1.05),8,6)}b.sp(0,hy+by*0.3,0,bx*0.95,by*0.7,bz*1.0,shade(c,0.92),8,5);}
  if(kind==='sheep'){b.sp(0,hy+0.04,0,bx*1.08,by*1.1,bz*1.1,0xf0e9d8,8,6)}
  // 腿
  const lx=bx*0.62,lz=bz*0.55;const lc=shade(c,0.78);
  const legs=[[lx,lz,3],[lx,-lz,4],[-lx,lz,4],[-lx,-lz,3]];
  for(const[x,z,pt]of legs){b.st.part=pt;b.pv(x,hy-by*0.3,z);
    const r=kind==='ox'?0.075:kind==='camel'?0.075:kind==='pig'?0.05:0.06;
    b.ln(x,hy-by*0.3,z,x+0.02,leg*0.5,z,r*1.2,r,lc,5);b.ln(x+0.02,leg*0.5,z,x,0.05,z,r,r*0.75,lc,5);
    if(kind==='horse'||kind==='donkey'||kind==='ox'||kind==='camel')b.bx(x+0.02,0.03,z,0.15,0.07,0.12,0x2a2118);}
  // 头颈
  b.st.part=5;const nx0=bx*0.8,ny0=hy+by*0.35;b.pv(nx0,ny0,0);
  const hd=shade(c,1.05);
  if(kind==='camel'){
    b.ln(nx0,ny0,0,nx0+0.3,ny0+0.55,0,0.2,0.14,c,6);b.ln(nx0+0.3,ny0+0.55,0,nx0+0.2,P.neck-0.15,0,0.14,0.11,c,6);b.ln(nx0+0.2,P.neck-0.15,0,nx0+0.45,P.neck,0,0.11,0.1,c,6);
    b.sp(nx0+0.65,P.neck-0.02,0,0.28,0.12,0.11,hd,7,5);b.sp(nx0+0.55,P.neck+0.12,0,0.07,0.04,0.04,c,5,4);
    b.bx(nx0+0.72,P.neck+0.05,0.06,0.02,0.02,0.02,0x111111);b.bx(nx0+0.72,P.neck+0.05,-0.06,0.02,0.02,0.02,0x111111);
  } else if(kind==='pig'){
    b.sp(nx0+0.28,hy-0.08,0,0.2,0.16,0.16,hd,7,5);b.sp(nx0+0.5,hy-0.1,0,0.1,0.08,0.09,shade(c,1.4),6,4);
    b.bx(nx0+0.36,hy+0.07,0.09,0.03,0.08,0.06,c);b.bx(nx0+0.36,hy+0.07,-0.09,0.03,0.08,0.06,c);
  } else if(kind==='dog'){
    b.ln(nx0,hy+0.05,0,nx0+0.15,hy+0.18,0,0.07,0.06,c,5);b.sp(nx0+0.27,hy+0.2,0,0.1,0.07,0.065,hd,6,5);b.sp(nx0+0.38,hy+0.17,0,0.05,0.035,0.04,0x2a2118,5,4);
    b.bx(nx0+0.2,hy+0.28,0.05,0.04,0.07,0.025,shade(c,0.7));b.bx(nx0+0.2,hy+0.28,-0.05,0.04,0.07,0.025,shade(c,0.7));
  } else if(kind==='sheep'){
    b.ln(nx0,hy+0.1,0,nx0+0.2,hy+0.32,0,0.09,0.07,0xece5d2,5);b.sp(nx0+0.3,hy+0.35,0,0.1,0.11,0.08,0xd9cfba,6,5);b.bx(nx0+0.28,hy+0.4,0.09,0.06,0.02,0.07,0xd9cfba);b.bx(nx0+0.28,hy+0.4,-0.09,0.06,0.02,0.07,0xd9cfba);
  } else {
    const tl=P.neck;const ox=kind==='ox'?0.2:0.38;
    b.ln(nx0,ny0,0,nx0+ox,kind==='ox'?hy+0.12:tl-0.15,0,0.19,0.13,c,6);
    const hx=nx0+ox,hyy=kind==='ox'?hy+0.12:tl-0.15;
    b.ln(hx,hyy,0,hx+0.4,hyy-(kind==='ox'?0.25:0.28),0,0.12,0.075,hd,6);
    b.sp(hx+0.43,hyy-(kind==='ox'?0.27:0.3),0,0.06,0.07,0.07,shade(c,0.9),6,4);
    b.bx(hx+0.1,hyy+0.06,0.09,0.02,0.02,0.02,0x111111);b.bx(hx+0.1,hyy+0.06,-0.09,0.02,0.02,0.02,0x111111);
    if(kind==='donkey'){b.ln(hx-0.02,hyy+0.05,0.05,hx-0.12,hyy+0.4,0.07,0.04,0.02,c,4);b.ln(hx-0.02,hyy+0.05,-0.05,hx-0.12,hyy+0.4,-0.07,0.04,0.02,c,4);}
    else if(kind==='ox'){b.ln(hx-0.02,hyy+0.08,0.1,hx+0.05,hyy+0.3,0.22,0.035,0.01,0xe0d8bc,4);b.ln(hx-0.02,hyy+0.08,-0.1,hx+0.05,hyy+0.3,-0.22,0.035,0.01,0xe0d8bc,4);b.ln(hx-0.04,hyy+0.04,0.1,hx-0.15,hyy+0.1,0.2,0.04,0.03,c,4);b.ln(hx-0.04,hyy+0.04,-0.1,hx-0.15,hyy+0.1,-0.2,0.04,0.03,c,4)}
    else{b.ln(hx-0.02,hyy+0.08,0.05,hx-0.06,hyy+0.24,0.06,0.035,0.012,c,4);b.ln(hx-0.02,hyy+0.08,-0.05,hx-0.06,hyy+0.24,-0.06,0.035,0.012,c,4);
      for(let i=0;i<7;i++){const f=i/6;b.bx(nx0+0.35*f-0.1,ny0+(hyy-ny0)*f+0.12,0,0.06,0.1,0.04,0x2a2118)}}
  }
  // 尾
  b.st.part=8;b.pv(-bx*0.95,hy+by*0.3,0);
  if(kind==='pig')b.ln(-bx*0.95,hy+0.1,0,-bx*1.1,hy+0.2,0,0.02,0.012,c,3);
  else b.ln(-bx*0.95,hy+by*0.3,0,-bx*1.12,hy-by*(kind==='camel'?0.6:0.9),0,0.05,0.025,shade(c,0.6),4);
  b.st.part=0;
  // 鞍垫/驮包
  const back=hy+by*0.9;
  if(o.load==='pack'){b.bx(0,back-0.02,0,0.5,0.05,0.55,0x8a3b2c);
    for(const sd of[-1,1])b.sp(0,back-0.08,sd*0.38,0.28,0.2,0.14,pick([0x9a8355,0xb8a67a,0x7a6a4a]),7,5);
    b.sp(0,back+0.18,0,0.3,0.14,0.2,pick([0xcdbf9a,0x6f7a80]),7,5);}
  if(o.load==='saddle'){b.bx(0,back-0.01,0,0.5,0.05,0.52,0x7a3b2c);b.bx(0.0,back+0.05,0,0.36,0.08,0.3,0x3a2c20);b.bx(-0.2,back+0.12,0,0.06,0.14,0.28,0x3a2c20);b.bx(0.2,back+0.1,0,0.06,0.1,0.28,0x3a2c20)}
  if(o.load==='camel'){for(const hx of[-0.38,0.38])b.sp(hx,hy+by*0.9+0.4,0,0.32,0.18,0.3,pick([0xb09a68,0x7a6a4a,0xcdbf9a]),7,5);b.sp(0,hy+by*0.95+0.1,0,0.4,0.16,0.4,0x8a3b2c,7,4)}
  if(o.load==='yoke'){b.ln(nx0+0.05,ny0+0.12,-0.6,nx0+0.05,ny0+0.12,0.6,0.05,0.05,0x6a5030,5)}
  b.pop();b.jit=0.03;return b;
}
/* 一组共同行走的成员：o={x,z,h,rng,spd,tp}，list=[[fn,dx,dz,额外参数]] */
function grp(o,list){
  const c=Math.cos(o.h||0),s=Math.sin(o.h||0);const tp=o.tp!==undefined?o.tp:rnd();const ph=rr(6.28);
  for(const[fn,dx,dz,eo]of list){fn(Object.assign({},o,{tp,gph:ph},{x:o.x+dx*c+dz*s,z:o.z-dx*s+dz*c},eo||{}))}
}
/* 车轮：part 11，pivot 在轴心 */
function wheel(b,x,y,z,r){
  const pm=b.st.mode,pp=b.st.part;b.st.part=11;b.st.amp=r;b.st.mode=11;b.pv(x,y,z);
  const n=14;
  for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=(i+1)/n*Math.PI*2;
    b.ln(x+Math.cos(a0)*r,y+Math.sin(a0)*r,z,x+Math.cos(a1)*r,y+Math.sin(a1)*r,z,0.06,0.06,0x5a4430,4);}
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;b.ln(x,y,z,x+Math.cos(a)*r,y+Math.sin(a)*r,z,0.035,0.03,0x6a5236,3)}
  b.push().t(x,y,z).rx(Math.PI/2).cyl(0.1,0.1,0.24,7,0x3a2c20).pop();
  b.st.part=pp;b.st.mode=pm;b.st.amp=0;
}
function archCover(b,x0,x1,yb,R,rz,seg,c1,c2){ // 沿 x 的半圆拱席篷
  for(let i=0;i<seg;i++){const a0=Math.PI*i/seg,a1=Math.PI*(i+1)/seg;
    const y0=yb+Math.sin(a0)*R,y1=yb+Math.sin(a1)*R,z0=Math.cos(a0)*rz,z1=Math.cos(a1)*rz;
    b.quad([x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1],i%2?c1:c2,undefined,true);b.quad([x0,y1,z1],[x1,y1,z1],[x1,y0,z0],[x0,y0,z0],shade(c1,0.7));}
}
function cart(o){ // 席篷大车（不含牲口）
  const b=GB.ag.at(o.x);entStart(b,o,0);const W=1.55,Ln=3.0;b.jit=0.05;
  b.bx(0,1.0,0,Ln,0.14,W,0x6d5538);
  for(const sd of[-1,1]){b.bx(0,1.15,sd*W/2,Ln,0.16,0.06,0x5a4430);for(let i=-3;i<=3;i++)b.bx(i*0.4,1.28,sd*W/2,0.04,0.3,0.04,0x5a4430)}
  archCover(b,-Ln*0.5,Ln*0.5,1.08,0.95,0.78,10,0x8a7650,0x9d885a);
  for(const x of[-0.48*Ln,-0.15*Ln,0.15*Ln,0.48*Ln]){let pa=null;for(let i=0;i<=10;i++){const a=Math.PI*i/10;const q=[x,1.08+Math.sin(a)*0.98,Math.cos(a)*0.8];if(pa)b.ln(pa[0],pa[1],pa[2],q[0],q[1],q[2],0.03,0.03,0x4a3a28,3);pa=q}}
  b.bx(Ln*0.5+0.01,1.5,0,0.02,0.9,1.3,0x2e2418);b.bx(-Ln*0.5-0.01,1.5,0,0.02,0.9,1.3,0x2e2418);
  for(const sd of[-1,1])b.ln(Ln*0.5,1.02,sd*0.45,Ln*0.5+2.6,0.95,sd*0.4,0.05,0.045,0x5a4430,4);
  wheel(b,-0.2,0.78,W/2+0.1,0.78);wheel(b,-0.2,0.78,-W/2-0.1,0.78);
  b.ln(-0.2,0.78,-W/2,-0.2,0.78,W/2,0.05,0.05,0x3a2c20,4);
  return b;
}
function oxTeam(o,n){ // 车 + n 头牛 + 赶车人
  const cs=[0x8c6a40,0x7a5a38,0x9a7a4c,0x5a4a3a,0xa08050];const L2=[[cart,0,0]];
  for(let i=0;i<n;i++){const row=Math.floor(i/2),side=i%2?1:-1;L2.push([(q)=>animal('ox',Object.assign(q,{load:'yoke',c:pick(cs)})),3.6+row*1.9,(n===1?0:side*0.5)])}
  L2.push([(q)=>person(Object.assign(q,{role:'walk',ph:q.gph})),3.2+Math.ceil(n/2)*1.9-0.6,1.5]);
  grp(Object.assign({mode:14},o),L2);
}
function barrow(o){ // 独轮车
  const b=GB.ag.at(o.x);entStart(b,o,0);b.jit=0.04;
  b.bx(0.2,0.62,0,1.4,0.07,0.55,0x6d5538);b.bx(0.2,0.84,0.3,1.2,0.06,0.05,0x5a4430);b.bx(0.2,0.84,-0.3,1.2,0.06,0.05,0x5a4430);
  for(const sd of[-1,1]){b.ln(-0.5,0.7,sd*0.26,-1.4,0.95,sd*0.22,0.035,0.03,0x5a4430,4);b.ln(0.5,0.4,sd*0.1,0.5,0.7,sd*0.26,0.025,0.025,0x5a4430,3)}
  wheel(b,0.5,0.4,0,0.4);
  const k=pick([0,1,2]);
  if(k===0){for(const sd of[-1,1])b.sp(0.1,0.95,sd*0.2,0.38,0.22,0.18,pick([0xb09a68,0xcdbf9a]),7,5)}
  else if(k===1){b.sp(0.2,1.0,0,0.5,0.28,0.34,0xcdbf9a,7,5)}
  else{for(let i=0;i<3;i++)b.bx(0.2,0.75+i*0.17,0,0.7,0.16,0.42,pick([0x8a7448,0x9a8355]))}
  return b;
}
function sedan(o){
  const b=GB.ag.at(o.x);entStart(b,o,4);b.st.part=6;b.pv(0,1.4,0);b.jit=0.04;
  for(const sd of[-1,1])b.ln(-1.6,1.45,sd*0.55,1.6,1.45,sd*0.55,0.04,0.04,0x6a5030,5);
  b.bx(0,1.35,0,1.0,0.1,0.95,0x5a4028);
  b.bx(0,2.1,0,1.0,1.3,0.95,0x3e3228);
  for(const sd of[-1,1]){b.bx(0.0,2.15,sd*0.485,0.7,0.7,0.03,0x2a2018);for(let i=-1;i<=1;i++)b.bx(i*0.2,2.15,sd*0.5,0.03,0.7,0.03,0x8a7448);for(let j=-1;j<=1;j++)b.bx(0,2.15+j*0.2,sd*0.5,0.7,0.03,0.03,0x8a7448)}
  b.bx(0.505,2.1,0,0.03,1.0,0.8,0x241c14);
  b.cy(0,2.85,0,0.7,0.95,0.3,4,0x4a3a2c,true);
  b.push().t(0,3.05,0).ry(Math.PI/4).cyl(0.2,0.55,0.25,4,0x3a2e24).pop();
  b.sp(0,3.25,0,0.1,0.1,0.1,0x8a7448,6,4);
  return b;
}
