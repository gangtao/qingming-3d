/* 05_structures.js — 城楼、城墙、虹桥、船 */
function skirtRoof(S,y0,W,D,ov,H){
  const B=S.r;
  for(const sd of[1,-1]){B.push().t(0,0,0).ry(sd>0?0:Math.PI);B.push().t(0,0,D/2);slopeFace(B,y0,W/2+ov,W/2,ov,H,0.35,1.3,[1,1,1],8,3);B.pop();B.pop();
    B.push().ry(sd*Math.PI/2).t(0,0,W/2);slopeFace(B,y0,D/2+ov,D/2,ov,H,0.35,1.3,[1,1,1],6,3);B.pop();}
}
function gateTower(x,z0){
  const y0=0;const T=14,Hh=11,half=120,pw=3.9,ph=6.6;
  hall({x:x,z:z0,ry:Math.PI/2,W:34,D:11,floors:2,H1:4.2,front:'house',y0:Hh,ov:2.4,hip:true,wall:0xc9bd9c,label:'城楼',pri:1});
  {const S2=scope(x,Hh,z0,Math.PI/2);skirtRoof(S2,0.35+4.2+0.05,34,11,2.2,1.1);S2.end();}
  const S=scope(x,y0,0,0),K=S.k,G=S.g;STAT.buildings++;
  // 墙身
  const seg=(za,zb,ya,yb)=>{K.bx(0,(ya+yb)/2,(za+zb)/2,T,yb-ya,zb-za,0xcfcabb,0.35);K.bx(0,(ya+0.9)/2,(za+zb)/2,T+1.4,0.9-ya,zb-za,0xb6b09f,0.35)};
  seg(z0-half,z0-pw,0,Hh);seg(z0+pw,z0+half,0,Hh);seg(z0-pw,z0+pw,ph,Hh);
  // 拱门：深色门洞内壁 + 拱券
  G.bx(0,ph/2,z0,T-1,ph,2*pw-0.4,0x241c14);
  let pa=null;for(let i=0;i<=10;i++){const a=Math.PI*i/10;const q=[Math.cos(a)*pw,ph-0.5+Math.sin(a)*1.2];
    for(const sx of[-1,1]){}}
  for(const sx of[-1,1]){G.bx(sx*(T/2+0.1),ph+0.4,z0,0.4,0.9,2*pw+1.0,0x8a8576);G.bx(sx*(T/2+0.08),ph/2,z0-pw-0.2,0.35,ph,0.4,0x8a8576);G.bx(sx*(T/2+0.08),ph/2,z0+pw+0.2,0.35,ph,0.4,0x8a8576);
    for(const sz of[-1,1])G.bx(sx*(T/2-0.2),ph/2,z0+sz*pw*0.5,0.12,ph*0.9,pw*0.9,0x4a3426)} // 城门扇
  // 女墙垛口
  for(const sx of[-1,1])for(let z=z0-half;z<z0+half;z+=1.8){if(Math.abs(z-z0)<20)continue;K.bx(sx*(T/2-0.4),Hh+0.6,z,0.7,1.2,1.0,0xc4bfae,0.4)}
  for(const sx of[-1,1])K.bx(sx*(T/2-0.4),Hh+0.12,z0,0.6,0.24,2*half,0xb0aa98,0.4);
  S.end();
  // 登城马道
  const S3=scope(x,0,z0,0);for(let i=0;i<12;i++){S3.k.bx(T/2+2.5+0.0,0.5+i*0.9,z0+pw+10+0,5,1.0,0.4,0xb6b09f,0.4)}S3.end();
}
/* 虹桥：以世界 x 为轴心，沿 z 方向跨河，中线 zc，河宽半径 hw */
const BRIDGE={x:0,z:0,sp:20,H:6.5,base:1.0,ry:-Math.PI/4};
function bridgeY(z){const dz=Math.abs(z);if(dz<BRIDGE.sp){const q=dz/BRIDGE.sp;return BRIDGE.base+BRIDGE.H*(1-q*q)}return BRIDGE.base*Math.max(0,1-(dz-BRIDGE.sp)/10)}
function buildBridge(x,zc){
  BRIDGE.x=x;BRIDGE.z=zc;const S=scope(x,0,zc,BRIDGE.ry),G=S.g,K=S.k;STAT.buildings++;
  const Wd=4.6,sp=BRIDGE.sp;
  // 桥面
  const step=0.8;let k=0;
  for(let z=-30;z<30;z+=step){const z2=z+step;const y1=bridgeY(z),y2=bridgeY(z2);const c=(k++)%2?0x8a7656:0x7d6a4c;
    G.quad([-Wd,y1,z],[-Wd,y2,z2],[Wd,y2,z2],[Wd,y1,z],c,[0,0,1,1],false);}
  // 侧梁
  for(const sx of[-1,1]){for(let z=-30;z<30;z+=1.6){const z2=z+1.6;G.ln(sx*(Wd+0.1),bridgeY(z)-0.25,z,sx*(Wd+0.1),bridgeY(z2)-0.25,z2,0.2,0.2,0x5a4430,4)}}
  // 栏杆
  for(const sx of[-1,1]){for(let z=-28;z<=28;z+=1.6){const y=bridgeY(z);G.cy(sx*(Wd-0.1),y+0.55,z,0.06,0.07,1.1,5,0x4a3426)}
    for(const hh of[1.05,0.55]){for(let z=-28;z<28;z+=1.6){G.ln(sx*(Wd-0.1),bridgeY(z)+hh,z,sx*(Wd-0.1),bridgeY(z+1.6)+hh,z+1.6,0.05,0.05,0x5e4332,4)}}}
  // 拱架：叠梁式 —— 多道拱肋 + 横撑
  const arcs=[[0.0,0.35,0],[0.0,1.9,1],[0.0,3.2,2]];
  for(const sx of[-3.9,-1.3,1.3,3.9]){
    for(const[a,rise,i]of arcs){const R=BRIDGE.H-0.35-rise*0.0;let pa=null;
      for(let q=-1;q<=1.001;q+=0.1){const z=q*sp;const y=0.1+(BRIDGE.base+BRIDGE.H-0.55-0.1-i*0.25)*(1-q*q)*(i===0?1:0.9-i*0.0);const p=[sx,y,z];if(pa)G.ln(pa[0],pa[1],pa[2],p[0],p[1],p[2],0.16,0.16,0x5a4430,4);pa=p}}
    // 竖撑 + 叉撑
    for(let z=-17;z<=17;z+=3.4){const yd=bridgeY(z)-0.35;const q=z/sp;const ya=0.1+(BRIDGE.base+BRIDGE.H-0.65)*(1-q*q);G.ln(sx,ya,z,sx,yd,z,0.1,0.1,0x4a3426,4);
      const z2=z+3.4;const q2=z2/sp;if(Math.abs(z2)<=sp){const yb2=0.1+(BRIDGE.base+BRIDGE.H-0.65-0.5)*(1-q2*q2);G.ln(sx,ya,z,sx,yb2+0.5,z2,0.07,0.07,0x4a3426,3)}}
  }
  for(let z=-18;z<=18;z+=3.4){const q=z/sp;const ya=0.1+(BRIDGE.base+BRIDGE.H-0.65)*(1-q*q);G.ln(-3.9,ya+0.2,z,3.9,ya+0.2,z,0.1,0.1,0x4a3426,4)}
  // 侧面大梁（虹桥的弧形厚梁）与下拱
  for(const sx of[-1,1]){for(let z=-30;z<30;z+=1.0){const z2=z+1.0;const a=bridgeY(z),b2=bridgeY(z2);
    const dep=(Math.abs(z)<sp?1.5:0.5)*(0.85+0.15*Math.cos(z/sp*Math.PI*0.5));
    G.quad([sx*(Wd+0.15),a-0.25-dep,z],[sx*(Wd+0.15),b2-0.25-dep,z2],[sx*(Wd+0.15),b2-0.15,z2],[sx*(Wd+0.15),a-0.15,z],0x5e4630,undefined,sx<0);}}
  for(const sx of[-1,1]){let pa=null;for(let q=-1;q<=1.001;q+=0.05){const z=q*sp;const y=0.2+(BRIDGE.base+BRIDGE.H-1.8)*(1-q*q);const p=[sx*(Wd+0.1),y,z];if(pa)G.ln(pa[0],pa[1],pa[2],p[0],p[1],p[2],0.28,0.28,0x4a3624,4);pa=p}}
  // 桥头石台
  for(const sz of[-1,1]){K.bx(0,-0.6,sz*(sp+1.4),Wd*2+1.2,3.4,3.2,0xb0aa98,0.4);for(const sx of[-1,1])K.bx(sx*(Wd+0.2),0.55,sz*(sp+4.5),0.5,1.0,6,0xa8a290,0.4)}
  S.end();
}
/* 船 */
function miniRoof(b,w,d,y,col){const hw=w/2+0.4,hd=d/2+0.3,h=1.0;
  b.quad([-hw,y,hd],[hw,y,hd],[hw,y+h,0],[-hw,y+h,0],col,undefined,true);b.quad([hw,y,-hd],[-hw,y,-hd],[-hw,y+h,0],[hw,y+h,0],col,undefined,true);
  b.quad([hw,y,hd],[hw,y,-hd],[hw,y+h,0],[hw,y+h,0],shade(col,0.8));b.tri([-hw,y,hd],[-hw,y+h,0],[-hw,y,-hd],shade(col,0.8));b.tri([hw,y,hd],[hw,y,-hd],[hw,y+h,0],shade(col,0.8));
  b.bx(0,y+h+0.05,0,w+0.7,0.12,0.25,0x3a2e24)}
function boat(o){ // o: x,z,h,len,kind('cargo','ferry','skiff'),mast('up','down',none),dir
  const Lb=o.len||18,B=o.beam||Lb*0.2,b=GB.ag.at(o.x);STAT.boats++;
  const y=WATER_Y+0.5;entStart(b,Object.assign({},o,{y}),12);b.st.part=0;b.jit=0.04;const ph=b.st.ph;b.st.flag=0;
  const N=14,ring=[[-1,1.0,0x5a4430],[-1,0.62,0xa5804e],[-1,0.25,0x9a7646],[-1,-0.05,0x8a6a40],[-0.55,-0.85,0x7a5c38],[0,-1,0x6a4e30]];
  const bh=u=>B/2*Math.pow(Math.max(0,1-Math.pow(Math.abs(u),3.0)),0.55)+0.12*(1-Math.abs(u)); // 半宽
  const top=u=>0.6+1.25*Math.pow(Math.abs(u),2.6)+(u<0?0.25*Math.pow(-u,3):0),bot=u=>-0.75+0.55*u*u;
  const sec=u=>{const t=top(u),bt=bot(u),w=bh(u);return ring.map(r=>[r[0],r[1]]).map(([sg,f])=>0).length&&[[w,t],[w*1.0,lerp(bt,t,0.62)],[w*0.98,lerp(bt,t,0.3)],[w*0.88,lerp(bt,t,0.08)],[w*0.5,bt+0.08],[0,bt]]};
  const cols=[0x5a4430,0xa5804e,0x9a7646,0x8a6a40,0x7a5c38];
  for(let i=0;i<N;i++){const u0=-1+2*i/N,u1=-1+2*(i+1)/N,x0=u0*Lb/2,x1=u1*Lb/2,s0=sec(u0),s1=sec(u1);
    for(let k=0;k<5;k++){for(const sd of[1,-1]){
      const a=[x0,s0[k][1],sd*s0[k][0]],bq=[x1,s1[k][1],sd*s1[k][0]],c=[x1,s1[k+1][1],sd*s1[k+1][0]],d=[x0,s0[k+1][1],sd*s0[k+1][0]];
      if(sd>0)b.quad(a,d,c,bq,cols[k]);else b.quad(a,bq,c,d,cols[k]);}}
    // 甲板
    const w0=s0[0][0]-0.12,w1=s1[0][0]-0.12;b.quad([x0,0.1,-w0],[x1,0.1,-w1],[x1,0.1,w1],[x0,0.1,w0],i%2?0x7a6444:0x6e5a3c);
    // 内舷
    for(const sd of[1,-1]){const a=[x0,s0[0][1]-0.02,sd*(s0[0][0]-0.1)],bq=[x1,s1[0][1]-0.02,sd*(s1[0][0]-0.1)],c=[x1,0.1,sd*(s1[0][0]-0.12)],d=[x0,0.1,sd*(s0[0][0]-0.12)];if(sd>0)b.quad(d,c,bq,a,0x7a5c38);else b.quad(a,bq,c,d,0x7a5c38)}
    // 舷边粗木
    for(const sd of[1,-1])b.ln(x0,s0[0][1]+0.05,sd*s0[0][0],x1,s1[0][1]+0.05,sd*s1[0][0],0.1,0.1,0x4a3628,4);
    if(i%2===0)for(const sd of[1,-1])b.ln(x0,s0[0][1]+0.0,sd*(s0[0][0]+0.02),x0,s0[2][1],sd*(s0[2][0]+0.05),0.07,0.07,0x4a3628,3);
  }
  // 船头/尾封板
  const bt0=top(1),w1=0.25;b.quad([Lb/2,bot(1),-w1],[Lb/2,bot(1),w1],[Lb/2,bt0,w1],[Lb/2,bt0,-w1],0x6a4e30);
  const st0=top(-1);b.quad([-Lb/2,st0,-0.5],[-Lb/2,st0,0.5],[-Lb/2,bot(-1),0.5],[-Lb/2,bot(-1),-0.5],0x6a4e30);b.bx(-Lb/2+0.1,st0-0.4,0,0.2,0.8,1.1,0x6a4e30);
  const kind=o.kind||'cargo';
  if(kind==='cargo'){
    const cx0=-Lb*0.12,cx1=Lb*0.22;
    // 席篷
    archCover(b,cx0,cx1,0.95,B*0.42,B*0.4,8,0xa08c5e,0x8a7850);
    for(let x=cx0;x<=cx1+0.01;x+=(cx1-cx0)/6){let pa=null;for(let i=0;i<=8;i++){const a=Math.PI*i/8;const q=[x,0.95+Math.sin(a)*B*0.43,Math.cos(a)*B*0.41];if(pa)b.ln(pa[0],pa[1],pa[2],q[0],q[1],q[2],0.04,0.04,0x4a3a28,3);pa=q}}
    // 舱壁窗
    for(const sd of[1,-1]){b.bx((cx0+cx1)/2,0.62,sd*(B*0.41),cx1-cx0,0.9,0.1,0x3a2c20);for(let x=cx0+0.7;x<cx1-0.5;x+=1.3)win(b,x,0.7,sd*B*0.43,0.8,0.55,sd>0?0:Math.PI)}
    // 舵楼
    const sx0=-Lb*0.4;b.bx(sx0,1.7,0,Lb*0.16,1.8,B*0.62,0x8f7a54);miniRoof(b,Lb*0.16,B*0.62,2.6,0x5c4e3c);
    for(const sd of[1,-1])win(b,sx0,1.9,sd*B*0.32,1.1,0.9,sd>0?0:Math.PI);
    b.bx(sx0+Lb*0.08+0.01,1.4,0,0.05,1.2,0.9,0x2a2118);
    // 人字桅
    const mx=Lb*0.1;
    if(o.mast==='up'){b.ln(mx,0.3,B*0.34,mx+0.3,9.5,0.0,0.14,0.07,0x6a5030,5);b.ln(mx,0.3,-B*0.34,mx+0.3,9.5,0.0,0.14,0.07,0x6a5030,5);b.bx(mx+0.1,4.8,0,0.12,0.12,B*0.4,0x5a4430);
      b.ln(mx+0.3,9.5,0,Lb/2-0.5,top(1)+0.2,0,0.02,0.02,0x3a2e22,3);b.ln(mx+0.3,9.5,0,-Lb/2+1,top(-1)+0.2,0,0.02,0.02,0x3a2e22,3);b.sp(mx+0.3,9.7,0,0.2,0.15,0.2,0x4a3a28,5,4)}
    else if(o.mast==='down'){b.ln(mx,1.0+B*0.45,B*0.25,Lb*0.48,top(1)+0.9,B*0.08,0.12,0.08,0x6a5030,5);b.ln(mx,1.0+B*0.45,-B*0.25,Lb*0.48,top(1)+0.9,-B*0.08,0.12,0.08,0x6a5030,5)}
    // 货物
    for(let i=0;i<ri(5,9);i++){const xx=rr(Lb*0.26,Lb*0.44);const zz=rr(-B*0.3,B*0.3);const t=rnd();
      if(t<0.4)b.sp(xx,0.4,zz,0.4,0.3,0.4,pick([0xcdbf9a,0xb09a68,0x9a8355]),6,4);else if(t<0.7)b.bx(xx,0.4,zz,0.7,0.5,0.5,pick([0x8a7448,0x6a5a3c]));else b.cy(xx,0.5,zz,0.28,0.3,0.7,7,pick([0x6a5a46,0x7a6a52]))}
    // 篷顶杂物/卷席
    b.ln(cx0,0.95+B*0.46,0,cx1,0.95+B*0.46,0,0.1,0.1,0x6a5a3c,4);
  } else if(kind==='ferry'){
    const cx0=-Lb*0.1,cx1=Lb*0.28;archCover(b,cx0,cx1,0.7,B*0.45,B*0.42,7,0xa6925f,0x8c7a50);
    b.sp(Lb*0.4,0.35,0,0.5,0.3,0.4,0xcdbf9a,5,4);
  } else if(kind==='skiff'){
    b.bx(0,0.45,0,Lb*0.2,0.06,B*0.6,0x6a5030);
  }
  // 舵与橹
  b.st.part=14;b.pv(-Lb/2-0.2,0.5,0);
  b.bx(-Lb/2-0.45,-0.35,0,0.15,1.9,0.9,0x6a4e30);b.ln(-Lb/2-0.2,1.2,0,-Lb/2+1.6,top(-1)+1.4,0,0.07,0.06,0x5a4430,4);
  if(kind!=='skiff'||true){b.st.part=13;b.pv(-Lb*0.32,top(-0.4)+0.3,B/2);
    b.ln(-Lb*0.32,top(-0.4)+0.3,B/2,-Lb*0.32+0.6,-0.5,B/2+3.4,0.08,0.06,0x6a5030,4);b.bx(-Lb*0.32+0.7,-0.8,B/2+3.7,0.2,0.1,1.2,0x5a4430);
    b.ln(-Lb*0.32,top(-0.4)+0.3,B/2,-Lb*0.32-0.7,top(-0.4)+1.3,B/2-0.2,0.06,0.05,0x5a4430,3);}
  b.st.part=0;
  b.jit=0.03;
  return {x:o.x,z:o.z,h:o.h||0,y,ph,Lb,B};
}
/* 船上的人：lx 沿船长，lz 沿船宽（局部坐标） */
function boatPerson(bt,lx,lz,role,mode,ex){
  const c=Math.cos(bt.h),s=Math.sin(bt.h);
  person(Object.assign({x:bt.x+lx*c+lz*s,z:bt.z-lx*s+lz*c,y:bt.y+0.1,h:bt.h+(lz>0?0:0),flag:10+bt.ph,mode,role,spd:1,rng:0},ex||{}));
}
