/* 04_buildings.js — 屋顶、厅屋、酒楼、欢门、城楼、虹桥、树木、小品 */
const C={wood:0x5e4332,woodD:0x3e2d22,beam:0x4a3426,plaster:0xd2c6a8,plasterD:0xbfb293,stone:0x9d968a,tile:0xe8e0d0,ridge:0x4d4234,straw:0xd8c590,lattice:0x8a7650,dark:0x2a2118,cloth:[0xa5493a,0x6d7a6a,0xc59a4a,0x58626a,0x9a8a5a]};
/* 坡面：eave 在 z=+run，屋脊在 z=0 */
function slopeFace(B,y0,a0,a1,run,H,U,p,col,M,S,uvk){
  M=M||8;S=S||5;uvk=uvk||0.5;
  const Pt=(fi,s)=>{const sx=2*fi-1;const x=lerp(a0,a1,s)*sx;const y=y0+H*Math.pow(s,p)+U*Math.pow(Math.abs(sx),2.6)*(1-sstep(0,0.35,s))*(a0>0.5?1:0);return [x,y,run*(1-s)]};
  let dist=0;const rows=[];
  for(let j=0;j<=S;j++){const row=[];for(let i=0;i<=M;i++)row.push(Pt(i/M,j/S));rows.push(row)}
  const cd=[0];for(let j=1;j<=S;j++){const a=rows[j-1][M>>1],b=rows[j][M>>1];cd.push(cd[j-1]+Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]))}
  for(let j=0;j<S;j++)for(let i=0;i<M;i++){
    const a=rows[j][i],b=rows[j][i+1],c=rows[j+1][i+1],d=rows[j+1][i];
    B.quad(a,b,c,d,col,[a[0]*uvk,cd[j]*uvk,b[0]*uvk,cd[j+1]*uvk]);}
  return rows;
}
function roofShape(S,y0,W,D,H,o){ // 屋顶（瓦/茅），本体 + 屋脊
  o=Object.assign({o:1.3,U:0.55,p:1.5,type:'hip',col:0xffffff,thatch:false},o||{});
  const B=o.thatch?S.h:S.r,G=S.g;
  let swap=false;if(o.type==='hip'&&W<D){swap=true;[W,D]=[D,W]}
  if(swap){B.push().ry(Math.PI/2);G.push().ry(Math.PI/2)}
  const ov=o.o,run=D/2+ov;
  const a0=W/2+(o.type==='gable'?Math.min(ov,0.6):ov);
  const a1=o.type==='gable'?a0:Math.max(0,W/2-D/2);
  const hipTop=o.type==='gable'?1:0;
  // 前后坡
  for(const sd of[1,-1]){B.push().ry(sd>0?0:Math.PI);slopeFace(B,y0,a0,a1,run,H,o.U,o.p,o.col,8,5);B.pop()}
  if(o.type==='hip'){for(const sd of[1,-1]){B.push().ry(sd*Math.PI/2);slopeFace(B,y0,run,0,W/2+ov-a1,H,o.U,o.p,o.col,6,5);B.pop()}}
  // 屋檐封板（深色）
  const fa=0.22,col2=o.thatch?0x6a5a38:0x3a2e24;
  for(const sd of[1,-1]){const z=run*sd;G.quad([-a0*sd,y0-fa+o.U*0.0,z],[a0*sd,y0-fa,z],[a0*sd,y0+0.05,z],[-a0*sd,y0+0.05,z],col2,undefined,sd<0?false:false)}
  if(o.type==='hip'){for(const sd of[1,-1]){const x=(W/2+ov)*sd;G.quad([x,y0-fa,run],[x,y0-fa,-run],[x,y0+0.05,-run],[x,y0+0.05,run],col2);G.quad([x,y0-fa,-run],[x,y0-fa,run],[x,y0+0.05,run],[x,y0+0.05,-run],col2)}}
  // 檐下暗面
  const hx=W/2+ov,hz=run;G.quad([-hx,y0-0.02,-hz],[hx,y0-0.02,-hz],[hx,y0-0.02,hz],[-hx,y0-0.02,hz],0x2c241a);
  // 正脊与翘角
  if(!o.thatch){
    const rl=(o.type==='gable'?a0:a1)+0.4;G.bx(0,y0+H+0.12,0,rl*2,0.3,0.4,C.ridge);
    for(const sd of[-1,1]){G.bx(sd*(rl-0.05),y0+H+0.38,0,0.22,0.5,0.34,C.ridge);G.bx(sd*(rl+0.1),y0+H+0.6,0,0.14,0.26,0.28,C.ridge)}
    const onSurf=(s)=>[lerp(a0,a1,s),y0+H*Math.pow(s,o.p)+o.U*(1-sstep(0,0.35,s))+0.08,run*(1-s)];
    if(o.type==='hip'){for(const sx of[-1,1])for(const sz of[-1,1]){let pa=null;for(let k=0;k<=6;k++){const q=onSurf(k/6);const p=[sx*q[0],q[1],sz*q[2]];if(pa)G.ln(pa[0],pa[1],pa[2],p[0],p[1],p[2],0.11,0.1,C.ridge,4);pa=p}G.bx(sx*a0,y0+o.U+0.12,sz*run,0.22,0.3,0.22,C.ridge)}}
    else{for(const sx of[-1,1])for(const sz of[-1,1]){let pa=null;for(let k=0;k<=6;k++){const q=onSurf(k/6);const p=[sx*(a0+0.02),q[1],sz*q[2]];if(pa)G.ln(pa[0],pa[1],pa[2],p[0],p[1],p[2],0.07,0.07,C.ridge,3);pa=p}}}
  } else {
    const rl=(o.type==='gable'?a0:a1)+0.3;G.bx(0,y0+H+0.1,0,rl*2,0.32,0.5,0x9a8650);
    if(o.type==='hip'){for(const sx of[-1,1])for(const sz of[-1,1]){let pa=null;for(let k=0;k<=5;k++){const f=k/5;const p=[sx*lerp(a0,a1,f),y0+H*Math.pow(f,o.p)+0.1,sz*run*(1-f)];if(pa)G.ln(pa[0],pa[1],pa[2],p[0],p[1],p[2],0.12,0.1,0x8a7646,4);pa=p}}}
  }
  if(swap){B.pop();G.pop()}
}
function shedRoof(S,y0,x0,x1,z0,run,H,col,thatch){ // 单坡披檐：墙在 z0，向 +z 伸出 run，檐口 y0，靠墙更高
  const B=thatch?S.h:S.r;const W=(x1-x0)/2,cx=(x0+x1)/2;
  B.push().t(cx,0,z0+run);B.ry(0);
  // 坡面：eave 在 z=+0 ，屋脊在 z=-run
  const rows=[];const M=6,Sg=3;
  for(let j=0;j<=Sg;j++){const s=j/Sg;const row=[];for(let i=0;i<=M;i++){const sx=2*i/M-1;row.push([sx*W,y0+H*s,-run*s])}rows.push(row)}
  for(let j=0;j<Sg;j++)for(let i=0;i<M;i++){const a=rows[j][i],b=rows[j][i+1],c=rows[j+1][i+1],d=rows[j+1][i];B.quad(a,b,c,d,col,[a[0]*0.5,j*run/Sg*0.6,b[0]*0.5,(j+1)*run/Sg*0.6])}
  S.g.quad([-W,y0-0.15,0],[W,y0-0.15,0],[W,y0+0.02,0],[-W,y0+0.02,0],0x3a2e24);
  B.pop();
}
/* 窗棂 */
function win(G,x,y,z,w,h,ry){
  G.push().t(x,y,z);if(ry)G.ry(ry);
  const q=(x0,y0,x1,y1,zz,c)=>G.quad([x0,y0,zz],[x1,y0,zz],[x1,y1,zz],[x0,y1,zz],c);
  q(-w/2,-h/2,w/2,h/2,0.02,0x2c231a);
  const f=0.05;q(-w/2-f,h/2,w/2+f,h/2+f,0.04,C.wood);q(-w/2-f,-h/2-f,w/2+f,-h/2,0.04,C.wood);q(-w/2-f,-h/2,-w/2,h/2,0.04,C.wood);q(w/2,-h/2,w/2+f,h/2,0.04,C.wood);
  const nv=Math.max(2,Math.round(w/0.22)),nh=Math.max(1,Math.round(h/0.4));
  for(let i=1;i<nv;i++){const xx=-w/2+w*i/nv;q(xx-0.012,-h/2,xx+0.012,h/2,0.045,C.lattice)}
  for(let j=1;j<nh+1;j++){const yy=-h/2+h*j/(nh+1);q(-w/2,yy-0.012,w/2,yy+0.012,0.046,C.lattice)}
  G.pop();
}
function table(G,x,y,z,ry,w,d){
  w=w||1.2;d=d||0.7;G.push().t(x,y,z).ry(ry||0);G.bx(0,0.74,0,w,0.07,d,0x6a5038);
  for(const sx of[-1,1])for(const sz of[-1,1])G.bx(sx*(w/2-0.06),0.36,sz*(d/2-0.06),0.06,0.72,0.06,0x4a3828);G.pop();
}
function stool(G,x,y,z,ry){G.push().t(x,y,z).ry(ry||0);G.bx(0,0.45,0,0.5,0.05,0.28,0x6a5038);for(const sx of[-1,1])G.bx(sx*0.2,0.22,0,0.05,0.44,0.24,0x4a3828);G.pop()}
function umbrella(S,x,y,z,r){ // 大伞
  const G=S.g;r=r||1.7;G.push().t(x,y,z);G.cy(0,1.2,0,0.05,0.05,2.4,5,0x5a4430);
  G.push().t(0,2.55,0).cyl(0.06,r,0.7,12,0xc3b283,true,0xa39463);G.pop();
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;G.ln(0,2.9,0,Math.cos(a)*r,2.2,Math.sin(a)*r,0.025,0.02,0x5a4430,3)}G.pop();
}
function stall(S,x,y,z,ry,goods,w){
  w=w||2.2;const G=S.g;G.push().t(x,y,z).ry(ry||0);
  G.bx(0,0.8,0,w,0.07,0.9,0x6a5038);for(const sx of[-1,1])for(const sz of[-1,1])G.bx(sx*(w/2-0.08),0.4,sz*0.38,0.07,0.8,0.07,0x4a3828);
  const n=ri(4,7);for(let i=0;i<n;i++){const gx=-w/2+0.2+i*(w-0.4)/Math.max(1,n-1);
    if(goods==='fruit')G.sp(gx,0.95,rr(-0.2,0.2),0.14,0.1,0.14,pick([0xb7683c,0xc8a45a,0x8c9a4a]),6,4);
    else if(goods==='cloth')G.bx(gx,0.9,0,0.3,0.2,0.4,pick(C.cloth));
    else if(goods==='pot')G.cy(gx,0.96,0,0.1,0.14,0.22,7,pick([0x6a5a46,0x8a7658,0x4a4238]));
    else G.bx(gx,0.9+rr(0,0.08),rr(-0.15,0.15),rr(0.15,0.3),rr(0.1,0.25),rr(0.15,0.3),pick([0xb09a68,0x8a7448,0xcdbf9a,0x7a6a4a]));}
  if(rnd()<0.8)umbrella({g:G},0,0,0.1,1.5);
  G.pop();
}
function signBoard(S,lx,ly,lz,name,w,h,ry){
  const s=S.s;s.push().t(lx,ly,lz);if(ry)s.ry(ry);
  const uv=signUV(name);s.quad([-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0],[1,1,1],uv);
  s.quad([w/2,-h/2,-0.04],[-w/2,-h/2,-0.04],[-w/2,h/2,-0.04],[w/2,h/2,-0.04],[0.8,0.8,0.75],[uv[0],uv[1],uv[2],uv[3]]);
  s.pop();
}
function flagCloth(x,y,z,ry,w,h,col){ // 酒旗：摆动
  const b=GB.ag.at(x);b.reset();const s=b.st;s.h=0;s.mode=10;s.ph=rr(6.28);s.spd=1;s.rng=0;s.amp=0.3;s.flag=0;s.root=[x,y,z];s.part=0;s.tp=0;
  b.pv(0,h,0);b.push().ry(ry);
  b.strip([[0,h,0],[0,h*0.5,0],[0,0,0]],w,col);
  b.pop();
}
const OCC=[];
/* 厅屋：局部坐标 前面朝 +z */
function hall(o){
  const W=o.W,D=o.D,fl=o.floors||1,H1=o.H1||3.5,y0=o.y0!==undefined?o.y0:groundY(o.x,o.z);
  const S=scope(o.x,y0,o.z,o.ry||0),G=S.g;STAT.buildings++;{const sw=Math.abs(Math.sin(o.ry||0))>0.7;OCC.push([o.x,o.z,sw?D:W,sw?W:D])}
  const thatch=o.roof==='thatch';const wallc=o.wall||pick([0xd2c6a8,0xc9bd9c,0xd8cdb0]);
  const fr=o.front||'house';const base=0.35;
  G.bx(0,base/2,0,W+0.9,base,D+0.9,C.stone);
  const nb=Math.max(2,Math.round(W/3.1)),bw=W/nb;
  for(let f=0;f<fl;f++){
    const yb=base+f*H1;const top=yb+H1;
    // 后墙、侧墙
    G.bx(0,yb+H1/2,-D/2+0.15,W,H1,0.22,wallc);
    for(const sx of[-1,1]){G.bx(sx*(W/2-0.1),yb+H1/2,0,0.22,H1,D-0.3,wallc);if(!thatch&&f===0||fl>1)win(G,sx*(W/2),yb+H1*0.55,-D*0.1,0.9,0.8,sx*Math.PI/2)}
    // 柱、枋
    for(let i=0;i<=nb;i++){const x=-W/2+i*bw;G.cy(x,yb+H1/2,D/2-0.3,0.15,0.16,H1,7,C.wood);if(i%2===0||true)G.cy(x,yb+H1/2,-D/2+0.3,0.14,0.15,H1,6,C.wood)}
    G.bx(0,top-0.14,D/2-0.3,W+0.3,0.26,0.24,C.beam);G.bx(0,yb+0.1,D/2-0.3,W,0.2,0.2,C.beam);
    // 前立面
    const open=(fr==='shop'||fr==='tavern')&&f===0||(fr==='tavern'&&f===1);
    for(let i=0;i<nb;i++){const cx=-W/2+(i+0.5)*bw;
      if(open){
        G.bx(cx,yb+H1/2,D/2-1.0,bw-0.3,H1-0.5,0.08,0x2e241a); // 暗室
        if(f===0&&fr==='shop'&&i%2===0){G.bx(cx,yb+0.55,D/2-0.45,bw-0.3,1.0,0.5,0x5a4430);G.bx(cx,yb+1.08,D/2-0.45,bw-0.2,0.06,0.6,0x6a5038)}
        else if(f===0&&fr==='shop'){G.bx(cx,yb+H1/2-0.1,D/2-0.35,0.08,H1-0.3,0.08,0x3a2c20);}
        if(f===1||fr==='tavern'){for(let k=-1;k<=1;k+=2)G.bx(cx+k*0.5,yb+0.3,D/2-0.15,0.04,0.3,0.04,C.wood)}
      } else if(f===0&&i===Math.floor(nb/2)&&fr!=='blank'){ // 门
        G.bx(cx,yb+1.15,D/2-0.12,bw*0.6,2.3,0.1,0x3e2d22);G.bx(cx-bw*0.15,yb+1.15,D/2-0.04,0.04,2.2,0.04,0x6a5038);G.bx(cx+bw*0.15,yb+1.15,D/2-0.04,0.04,2.2,0.04,0x6a5038);
        G.bx(cx,yb+2.4,D/2-0.1,bw*0.7,0.12,0.14,C.beam);
      } else {
        G.bx(cx,yb+H1/2,D/2-0.18,bw,H1,0.14,wallc);
        if(fr!=='blank')win(G,cx,yb+H1*0.55,D/2-0.08,Math.min(1.5,bw*0.55),Math.min(1.1,H1*0.34));
      }
    }
    // 斗拱
    for(let i=0;i<=nb*2;i++){const x=-W/2+i*bw/2;G.bx(x,top-0.02,D/2+0.02,0.2,0.22,0.3,0x3a2d22);}
    if(f<fl-1||fr==='tavern'&&fl>1&&f===0){
      // 平座与栏杆
      const dep=1.5;G.bx(0,top+0.02,D/2+dep/2-0.2,W+0.6,0.14,dep,0x6a5038);
      for(let i=0;i<=nb*2;i++){const x=-W/2-0.2+i*(W+0.4)/(nb*2);G.bx(x,top+0.55,D/2+dep-0.3,0.07,0.9,0.07,C.wood)}
      G.bx(0,top+1.02,D/2+dep-0.3,W+0.5,0.09,0.09,C.wood);G.bx(0,top+0.62,D/2+dep-0.3,W+0.5,0.05,0.05,C.wood);G.bx(0,top+0.3,D/2+dep-0.3,W+0.5,0.05,0.05,C.wood);
      for(const sx of[-1,1]){G.bx(sx*(W/2+0.2),top+0.55,D/2+dep/2-0.3,0.07,0.9,dep,C.wood)}
      // 腰檐
      if(!thatch)shedRoof(S,top+0.05+0,-W/2-0.4,W/2+0.4,D/2+0.2,dep+0.5,0.9,o.col||0xffffff,false);
    }
  }
  // 山墙三角（歇山/悬山）
  const yt=base+fl*H1;
  const rh=(D/2+(o.ov||1.3))*(thatch?0.72:0.62);
  if(o.hip===false){for(const sx of[-1,1]){G.tri([sx*(W/2-0.1),yt,-D/2],[sx*(W/2-0.1),yt,D/2],[sx*(W/2-0.1),yt+rh*0.5,0],wallc);G.tri([sx*(W/2-0.1),yt,D/2],[sx*(W/2-0.1),yt,-D/2],[sx*(W/2-0.1),yt+rh*0.5,0],wallc)}}
  roofShape(S,yt,W,D,rh,{type:o.hip===false?'gable':'hip',thatch:thatch,o:o.ov||1.3,U:thatch?0.15:0.55,p:thatch?1.15:1.5,col:thatch?[0.95,0.93,0.85]:[1,1,1]});
  // 招牌、旗
  if(o.sign){const sy=base+H1*(fl>1?1.55:0.75);
    signBoard(S,W/2-0.6,base+1.9,D/2+0.35,o.sign,0.7,2.6,0);
    G.bx(W/2-0.6,base+3.4,D/2+0.2,0.07,0.07,0.4,C.wood);
  }
  // 摆设：桌凳
  const info={x:o.x,z:o.z,ry:o.ry||0,W,D,H1,fl,y0,base};
  S.end();
  if(o.flag){const p=hallPt(info,-W/2+0.9,D/2+0.9);flagCloth(p[0],y0+base+fl*H1+0.2,p[1],(o.ry||0)+0.4,0.7,2.6,0xb8a66a);
    const b=GB.gen.at(p[0]);b.cy(p[0],y0+base+fl*H1+1.6,p[1],0.05,0.06,3.4,5,C.wood)}
  if(o.label)LABELS.push({txt:o.label,x:o.x,y:y0+base+fl*H1+3.5,z:o.z,pri:o.pri||2});
  return info;
}
function hallPt(h,lx,lz){const c=Math.cos(h.ry),s=Math.sin(h.ry);return [h.x+lx*c+lz*s,h.z-lx*s+lz*c]}
/* 彩楼欢门 */
function huanmen(x,z,ry,w,h,label){
  const y0=groundY(x,z);const S=scope(x,y0,z,ry),G=S.g;h=h||7.5;const col=C.cloth;
  for(const sx of[-1,1]){G.cy(sx*w/2,h/2,0,0.12,0.15,h,6,0x7a6038);G.cy(sx*(w/2-0.5),h*0.4,0.0,0.07,0.08,h*0.8,5,0x7a6038)}
  const tiers=[[h*0.62,0.9],[h*0.8,0.8],[h*0.97,0.65]];
  tiers.forEach((t,i)=>{
    const yy=t[0],ww=w*t[1];G.bx(0,yy,0,ww+0.6,0.14,0.14,0x6a5030);
    // 垂幔弧
    let pa=null;const n=10;for(let k=0;k<=n;k++){const q=k/n;const px=(q-0.5)*ww,py=yy-0.25-Math.sin(q*Math.PI)*0.9;const p=[px,py,0.1];
      if(pa)G.ln(pa[0],pa[1],pa[2],p[0],p[1],p[2],0.1,0.1,col[(i+k)%col.length],4);pa=p}
    for(let k=1;k<n;k+=1){const q=k/n;const px=(q-0.5)*ww,py=yy-0.25-Math.sin(q*Math.PI)*0.9;
      const b=GB.ag.at(x);b.reset();const s=b.st;s.mode=10;s.ph=rr(6.28);s.spd=1;s.amp=0.5;s.root=[x,y0,z];s.h=ry;s.rng=0;s.flag=0;s.tp=0;s.part=0;
      b.pv(px,py,0.1);b.strip([[px,py,0.1],[px,py-0.55,0.1],[px,py-1.0,0.1]],0.12,col[(i+k+1)%col.length],[0,0.3,1]);}
  });
  G.bx(0,h+0.35,0,w*0.6,0.3,0.3,0x5a4430);G.bx(0,h+0.7,0,w*0.3,0.3,0.3,0x6a5030);
  S.end();
  if(label)LABELS.push({txt:label,x,y:y0+h+1.5,z,pri:1});
}
/* 树 */
function branch(b,p,d,len,r,depth,col){
  const q=[p[0]+d[0]*len,p[1]+d[1]*len,p[2]+d[2]*len];
  b.ln(p[0],p[1],p[2],q[0],q[1],q[2],r,r*0.66,col,depth>2?5:3);
  if(depth<=0)return;
  const n=depth>=3?2:(rnd()<0.45?3:2);
  for(let i=0;i<n;i++){
    let nd=[d[0]+rr(-0.9,0.9),d[1]+rr(-0.25,0.55),d[2]+rr(-0.9,0.9)];const l=Math.hypot(...nd);nd=[nd[0]/l,nd[1]/l,nd[2]/l];
    branch(b,q,nd,len*rr(0.62,0.82),r*0.64,depth-1,col);}
}
function bareTree(x,z,s){
  s=s||1;const y=groundY(x,z);const b=GB.gen.at(x);STAT.trees++;
  b.push().t(x,y,z).ry(rr(6.28));
  const lean=rr(-0.2,0.2),h=rr(3,4.5)*s,r=rr(0.22,0.35)*s,col=pick([0x6a5c4a,0x75664f,0x5c5040]);
  b.ln(0,-0.2,0,lean*h,h,lean*h*0.5,r*1.2,r*0.7,col,6);
  const nb=ri(3,5);
  for(let i=0;i<nb;i++){const a=i/nb*6.28+rr(-0.4,0.4);const t0=rr(0.45,1)*h;
    const p=[lean*t0,t0,lean*t0*0.5];let d=[Math.cos(a)*0.8,rr(0.7,1.3),Math.sin(a)*0.8];const l=Math.hypot(...d);d=[d[0]/l,d[1]/l,d[2]/l];
    branch(b,p,d,rr(1.5,2.4)*s,r*0.62,3,col);}
  branch(b,[lean*h,h,lean*h*0.5],[0,1,0],1.8*s,r*0.6,3,col);
  b.pop();
}
function willow(x,z,s){
  s=s||1;const y=groundY(x,z);const b=GB.gen.at(x);STAT.trees++;
  const ry=rr(6.28);b.push().t(x,y,z).ry(ry);
  const h=rr(2.4,3.8)*s,r=rr(0.5,0.8)*s,col=pick([0x5a4d3e,0x4e4234,0x66584a]);
  const lx=rr(-0.5,0.5)*s;
  // 粗矮歪斜多瘤的树干
  b.ln(0,-0.3,0,lx*0.5,h*0.55,0,r*1.25,r*0.95,col,7);b.ln(lx*0.5,h*0.55,0,lx,h,rr(-0.3,0.3),r*0.95,r*0.75,col,7);
  for(let i=0;i<6;i++){b.sp(rr(-0.25,0.25)*s,rr(0.2,1.0)*h,rr(-0.25,0.25)*s,r*rr(0.4,0.75),r*rr(0.35,0.6),r*rr(0.4,0.75),shade(col,rr(0.9,1.25)),6,4)}b.sp(lx,h,0,r*1.15,r*0.8,r*1.15,shade(col,1.05),7,5);
  // 放射枝条
  const ag=GB.ag.at(x);const st=ag.st;ag.reset();st.mode=10;st.h=0;st.spd=1;st.rng=0;st.tp=0;st.flag=0;st.part=0;st.root=[x,y,z];ag.push().ry(ry);
  const nbr=ri(16,22);
  for(let i=0;i<nbr;i++){
    const a=i/nbr*6.28+rr(-0.3,0.3);let d=[Math.cos(a)*rr(0.5,0.9),rr(0.9,1.5),Math.sin(a)*rr(0.5,0.9)];let l=Math.hypot(...d);d=[d[0]/l,d[1]/l,d[2]/l];
    let p=[lx,h*0.95,0];let rad=r*0.42;
    const segs=3;for(let k=0;k<segs;k++){
      const len=rr(1.2,1.9)*s;const q=[p[0]+d[0]*len,p[1]+d[1]*len,p[2]+d[2]*len];
      b.ln(p[0],p[1],p[2],q[0],q[1],q[2],rad,rad*0.7,col,4);
      // 小枝
      for(let m=0;m<2;m++){let sd=[d[0]+rr(-0.8,0.8),d[1]+rr(-0.3,0.4),d[2]+rr(-0.8,0.8)];const sl=Math.hypot(...sd);sd=[sd[0]/sl,sd[1]/sl,sd[2]/sl];
        const e=[q[0]+sd[0]*0.9*s,q[1]+sd[1]*0.9*s,q[2]+sd[2]*0.9*s];b.ln(q[0],q[1],q[2],e[0],e[1],e[2],rad*0.5,rad*0.25,col,3);
        // 垂条
        const ns=ri(3,5);for(let n=0;n<ns;n++){const px=e[0]+rr(-0.4,0.4),pz=e[2]+rr(-0.4,0.4),pyy=e[1];const L2=rr(2.0,4.0)*s;st.ph=rr(6.28);st.amp=rr(0,0.4);
          ag.pv(px,pyy,pz);const pts=[[px,pyy,pz],[px+rr(-0.2,0.2),pyy-L2*0.5,pz+rr(-0.2,0.2)],[px+rr(-0.3,0.3),pyy-L2,pz+rr(-0.3,0.3)]];
          ag.strip(pts,0.09,pick([0x8a8a58,0x9b9a62,0x777a50,0xa09a64]),[0,0.4,1]);}
      }
      // 继续
      d=[d[0]+rr(-0.3,0.3),d[1]-0.3,d[2]+rr(-0.3,0.3)];const dl=Math.hypot(...d);d=[d[0]/dl,d[1]/dl,d[2]/dl];p=q;rad*=0.7;
    }
  }
  ag.pop();b.pop();
}
function fence(x1,z1,x2,z2,hh){
  hh=hh||1.1;const n=Math.max(1,Math.round(Math.hypot(x2-x1,z2-z1)/1.3));const b=GB.gen.at((x1+x2)/2);
  for(let i=0;i<=n;i++){const x=lerp(x1,x2,i/n),z=lerp(z1,z2,i/n),y=groundY(x,z);b.ln(x,y,z,x+rr(-0.03,0.03),y+hh,z,0.04,0.035,0x6a5538,4)}
  for(const k of[0.35,0.8]){const y1=groundY(x1,z1),y2=groundY(x2,z2);b.ln(x1,y1+hh*k,z1,x2,y2+hh*k,z2,0.03,0.03,0x7a6644,3)}
}
function mudWall(x1,z1,x2,z2,hh){hh=hh||1.8;const b=GB.gen.at((x1+x2)/2);const l=Math.hypot(x2-x1,z2-z1);const a=Math.atan2(-(z2-z1),x2-x1);
  b.push().t((x1+x2)/2,groundY(x1,z1)+hh/2,(z1+z2)/2).ry(a).box(l,hh,0.5,0xb8aa86).pop();
  b.push().t((x1+x2)/2,groundY(x1,z1)+hh+0.06,(z1+z2)/2).ry(a).box(l+0.3,0.14,0.8,0x6a5a42).pop();}
function haystack(x,z,s){const b=GB.thatch.at(x);const y=groundY(x,z);s=s||1;b.push().t(x,y,z);b.sph(1.2*s,1.1*s,1.2*s,8,5,[1,0.98,0.85]);b.pop()}
function smoke(x,y,z){const b=GB.ag.at(x);b.reset();const s=b.st;s.mode=16;s.ph=rr(1);s.spd=1;s.rng=0;s.h=0;s.flag=0;s.amp=0;s.part=0;s.tp=0;s.root=[x,y,z];
  for(let i=0;i<6;i++){s.ph=i/6;b.sp(0,0,0,0.22,0.2,0.22,0xa9a28e,6,4)}}
function bird(x,y,z,rad){const b=GB.ag.at(x);b.reset();const s=b.st;s.mode=17;s.ph=rr(6.28);s.spd=rr(4,6);s.amp=rad;s.rng=0;s.flag=0;s.tp=0;s.part=0;s.root=[x,y,z];s.h=0;
  b.sp(0,0,0,0.22,0.07,0.07,0x2a2218,5,4);s.part=1;b.quad([0,0,0],[-0.15,0,0.1],[-0.1,0,0.7],[0.1,0,0.1],0x2a2218);s.part=2;b.quad([0,0,0],[0.1,0,-0.1],[-0.1,0,-0.7],[-0.15,0,-0.1],0x2a2218);}
