/* 00_base.js — 基础零件：随机数、颜色、网格合并器(Builder)、分块图层 */
const L = 1800;                         // 全卷长度(米)；x 向左为卷尾
const TX = t => (0.5 - t) * L;          // 画卷进度 t(0=卷首,1=卷尾) -> 世界 x
const XT = x => 0.5 - x / L;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd = mulberry32(20260314);
const rr=(a,b)=>b===undefined?rnd()*a:a+rnd()*(b-a);
const ri=(a,b)=>Math.floor(rr(a,b+1));
const pick=a=>a[Math.floor(rnd()*a.length)];
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const hex=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
const cc=c=>typeof c==='number'?hex(c):c;
const shade=(c,k)=>{c=cc(c);return [c[0]*k,c[1]*k,c[2]*k]};
const mixc=(a,b,t)=>{a=cc(a);b=cc(b);return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]};
function hash2(x,y){let h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h)}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  return lerp(lerp(hash2(xi,yi),hash2(xi+1,yi),u),lerp(hash2(xi,yi+1),hash2(xi+1,yi+1),u),v)}
function fbm(x,y){return vnoise(x,y)*0.55+vnoise(x*2.1,y*2.1)*0.28+vnoise(x*4.3,y*4.3)*0.17}
const STAT={people:0,animals:0,boats:0,buildings:0,trees:0};
const LABELS=[];                        // 题签 {txt,x,y,z,pri}

const _m=new THREE.Matrix4();
class Builder{
  constructor(agent){
    this.agent=agent;this.P=[];this.N=[];this.K=[];this.U=[];this.I=[];this.n=0;
    if(agent){this.A=[];this.B=[];this.V=[];this.O=[];this.T=[];}
    this.m=new THREE.Matrix4();this.stk=[];this.jit=0.03;
    this.st={h:0,mode:0,ph:0,spd:1,rng:0,part:0,amp:0,flag:0,tp:0,pv:[0,0,0],root:[0,0,0]};
  }
  push(){this.stk.push(this.m.clone());return this}
  pop(){this.m=this.stk.pop();return this}
  reset(){this.m.identity();this.stk.length=0;return this}
  t(x,y,z){this.m.multiply(_m.makeTranslation(x,y,z));return this}
  ry(a){this.m.multiply(_m.makeRotationY(a));return this}
  rx(a){this.m.multiply(_m.makeRotationX(a));return this}
  rz(a){this.m.multiply(_m.makeRotationZ(a));return this}
  s(x,y,z){this.m.multiply(_m.makeScale(x,y===undefined?x:y,z===undefined?x:z));return this}
  pv(x,y,z){const e=this.m.elements;this.st.pv=[e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]];return this}
  part(p,pv){this.st.part=p;if(pv)this.pv(pv[0],pv[1],pv[2]);return this}
  col(c){c=cc(c);const k=1+(rnd()-0.5)*2*this.jit;return [c[0]*k,c[1]*k,c[2]*k]}
  vert(x,y,z,nx,ny,nz,c,u,v){
    const e=this.m.elements;
    this.P.push(e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]);
    this.N.push(e[0]*nx+e[4]*ny+e[8]*nz,e[1]*nx+e[5]*ny+e[9]*nz,e[2]*nx+e[6]*ny+e[10]*nz);
    this.K.push(c[0],c[1],c[2]);this.U.push(u||0,v||0);
    if(this.agent){const s=this.st;this.A.push(s.h,s.mode,s.ph,s.spd);this.B.push(s.rng,s.part,s.amp,s.flag);
      this.V.push(s.pv[0],s.pv[1],s.pv[2]);this.O.push(s.root[0],s.root[1],s.root[2]);this.T.push(s.tp);}
    return this.n++;
  }
  quadN(a,b,c,d,nx,ny,nz,col,uv){ // uv=[u0,v0,u1,v1]
    uv=uv||[0,0,1,1];
    const i=this.vert(a[0],a[1],a[2],nx,ny,nz,col,uv[0],uv[1]);
    this.vert(b[0],b[1],b[2],nx,ny,nz,col,uv[2],uv[1]);
    this.vert(c[0],c[1],c[2],nx,ny,nz,col,uv[2],uv[3]);
    this.vert(d[0],d[1],d[2],nx,ny,nz,col,uv[0],uv[3]);
    this.I.push(i,i+1,i+2,i,i+2,i+3);
  }
  quad(a,b,c,d,col,uv,flip){ // 自动法线；点按逆时针(从正面看)
    let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=d[0]-a[0],vy=d[1]-a[1],vz=d[2]-a[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    if(flip){nx=-nx;ny=-ny;nz=-nz}
    this.quadN(a,b,c,d,nx,ny,nz,this.col(col),uv);
  }
  tri(a,b,c,col){
    let ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    col=this.col(col);const i=this.vert(a[0],a[1],a[2],nx,ny,nz,col,0,0);
    this.vert(b[0],b[1],b[2],nx,ny,nz,col,1,0);this.vert(c[0],c[1],c[2],nx,ny,nz,col,0.5,1);this.I.push(i,i+1,i+2);
  }
  box(w,h,d,c,tile){ // 居中长方体；tile=纹理每米重复
    const x=w/2,y=h/2,z=d/2;c=this.col(c);const k=tile===undefined?0.5:tile;
    const F=[[1,0,0,0,1,0,d,h,x],[-1,0,0,0,1,0,d,h,x],[0,1,0,0,0,-1,w,d,y],[0,-1,0,0,0,1,w,d,y],[0,0,1,0,1,0,w,h,z],[0,0,-1,0,1,0,w,h,z]];
    for(const f of F){
      const n=[f[0],f[1],f[2]],up=[f[3],f[4],f[5]];
      const r=[up[1]*n[2]-up[2]*n[1],up[2]*n[0]-up[0]*n[2],up[0]*n[1]-up[1]*n[0]];
      const hw=f[6]/2,hh=f[7]/2,hn=f[8];
      const P=(sr,su)=>[n[0]*hn+r[0]*hw*sr+up[0]*hh*su,n[1]*hn+r[1]*hw*sr+up[1]*hh*su,n[2]*hn+r[2]*hw*sr+up[2]*hh*su];
      this.quadN(P(-1,-1),P(1,-1),P(1,1),P(-1,1),n[0],n[1],n[2],c,[0,0,f[6]*k,f[7]*k]);
    }
    return this;
  }
  bx(x,y,z,w,h,d,c,tile){this.push().t(x,y,z).box(w,h,d,c,tile).pop();return this}
  cyl(rt,rb,h,seg,c,caps,c2){ // 沿 y 轴居中
    seg=seg||8;c=this.col(c);c2=c2?this.col(c2):c;const sl=(rb-rt)/h;let i0=this.n;
    for(let j=0;j<=seg;j++){const a=j/seg*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);const nl=Math.hypot(1,sl);
      this.vert(ca*rt,h/2,sa*rt,ca/nl,sl/nl,sa/nl,c,j/seg*rt*3,1);
      this.vert(ca*rb,-h/2,sa*rb,ca/nl,sl/nl,sa/nl,c2,j/seg*rb*3,0);}
    for(let j=0;j<seg;j++){const a=i0+j*2;this.I.push(a,a+2,a+1,a+1,a+2,a+3);}
    if(caps!==false){
      if(rt>0.001){const ci=this.vert(0,h/2,0,0,1,0,c,0.5,0.5);const s=this.n;
        for(let j=0;j<=seg;j++){const a=j/seg*Math.PI*2;this.vert(Math.cos(a)*rt,h/2,Math.sin(a)*rt,0,1,0,c,0.5,0.5)}
        for(let j=0;j<seg;j++)this.I.push(ci,s+j+1,s+j);}
      if(rb>0.001){const ci=this.vert(0,-h/2,0,0,-1,0,c2,0.5,0.5);const s=this.n;
        for(let j=0;j<=seg;j++){const a=j/seg*Math.PI*2;this.vert(Math.cos(a)*rb,-h/2,Math.sin(a)*rb,0,-1,0,c2,0.5,0.5)}
        for(let j=0;j<seg;j++)this.I.push(ci,s+j,s+j+1);}
    }
    return this;
  }
  cy(x,y,z,rt,rb,h,seg,c,caps,c2){this.push().t(x,y,z).cyl(rt,rb,h,seg,c,caps,c2).pop();return this}
  sph(rx,ry,rz,ws,hs,c){
    ws=ws||8;hs=hs||6;c=this.col(c);const i0=this.n;
    for(let i=0;i<=hs;i++){const p=i/hs*Math.PI,sp=Math.sin(p),cp=Math.cos(p);
      for(let j=0;j<=ws;j++){const a=j/ws*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
        this.vert(ca*sp*rx,cp*ry,sa*sp*rz,ca*sp,cp,sa*sp,c,j/ws,i/hs);}}
    for(let i=0;i<hs;i++)for(let j=0;j<ws;j++){const a=i0+i*(ws+1)+j,b=a+ws+1;this.I.push(a,a+1,b,a+1,b+1,b);}
    return this;
  }
  sp(x,y,z,rx,ry,rz,c,ws,hs){this.push().t(x,y,z).sph(rx,ry,rz,ws,hs,c).pop();return this}
  ln(ax,ay,az,bx,by,bz,r0,r1,c,sides){ // 渐细管
    sides=sides||4;c=this.col(c);let dx=bx-ax,dy=by-ay,dz=bz-az;const l=Math.hypot(dx,dy,dz);if(l<1e-6)return;dx/=l;dy/=l;dz/=l;
    let ux,uy,uz;if(Math.abs(dy)<0.9){ux=-dz;uy=0;uz=dx}else{ux=0;uy=dz;uz=-dy}
    let ul=Math.hypot(ux,uy,uz);ux/=ul;uy/=ul;uz/=ul;
    const vx=dy*uz-dz*uy,vy=dz*ux-dx*uz,vz=dx*uy-dy*ux;const i0=this.n;
    for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
      const nx=ux*ca+vx*sa,ny=uy*ca+vy*sa,nz=uz*ca+vz*sa;
      this.vert(ax+nx*r0,ay+ny*r0,az+nz*r0,nx,ny,nz,c,j/sides,0);
      this.vert(bx+nx*r1,by+ny*r1,bz+nz*r1,nx,ny,nz,c,j/sides,l*0.5);}
    for(let j=0;j<sides;j++){const a=i0+j*2;this.I.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  strip(pts,w,c,nrm){ // 带状飘带：沿折线、宽度沿 z 方向
    c=this.col(c);nrm=nrm||[0,0.5,0.85];const l=Math.hypot(...nrm);const i0=this.n;
    for(let i=0;i<pts.length;i++){const p=pts[i];const k=1-i/(pts.length-1)*0.5;
      this.vert(p[0],p[1],p[2]-w*k/2,nrm[0]/l,nrm[1]/l,nrm[2]/l,c,0,i);this.vert(p[0],p[1],p[2]+w*k/2,nrm[0]/l,nrm[1]/l,nrm[2]/l,c,1,i);}
    for(let i=0;i<pts.length-1;i++){const a=i0+i*2;this.I.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  toMesh(mat,margin){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(this.P,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(this.N,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(this.K,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(this.U,2));
    if(this.agent){
      g.setAttribute('aA',new THREE.Float32BufferAttribute(this.A,4));
      g.setAttribute('aB',new THREE.Float32BufferAttribute(this.B,4));
      g.setAttribute('aPivot',new THREE.Float32BufferAttribute(this.V,3));
      g.setAttribute('aRoot',new THREE.Float32BufferAttribute(this.O,3));
      g.setAttribute('aTP',new THREE.Float32BufferAttribute(this.T,1));
    }
    g.setIndex(new THREE.Uint32BufferAttribute(this.I,1));
    if(this.agent){ // 包围球按根点计算，再加行走范围余量
      const bb=new THREE.Box3();const v=new THREE.Vector3();
      for(let i=0;i<this.n;i+=1){v.set(this.O[i*3],this.O[i*3+1],this.O[i*3+2]);bb.expandByPoint(v);}
      bb.expandByScalar(margin||40);g.boundingBox=bb;g.boundingSphere=bb.getBoundingSphere(new THREE.Sphere());
    } else {g.computeBoundingSphere();g.boundingSphere.radius+=2;}
    const m=new THREE.Mesh(g,mat);return m;
  }
}
const CH=100;
class Layer{
  constructor(agent){this.agent=agent;this.map=new Map()}
  at(x){const k=Math.floor((x+L/2+50)/CH);let b=this.map.get(k);if(!b){b=new Builder(this.agent);this.map.set(k,b)}return b}
  meshes(mat,margin){const o=[];for(const[k,b]of this.map)if(b.n)o.push(b.toMesh(mat,margin));return o}
  count(){let n=0;for(const[k,b]of this.map)n+=b.n;return n}
}
const GB={gen:new Layer(),roof:new Layer(),thatch:new Layer(),brick:new Layer(),sign:new Layer(),ag:new Layer(true),terr:null};
/* 在世界坐标 (x,y,z) 朝向 ry 处，同时开启通用/瓦顶/茅顶/砖/招牌 图层的局部坐标系 */
function scope(x,y,z,ry){
  const bs=[GB.gen.at(x),GB.roof.at(x),GB.thatch.at(x),GB.brick.at(x),GB.sign.at(x)];
  bs.forEach(b=>b.push().t(x,y,z).ry(ry||0));
  return {g:bs[0],r:bs[1],h:bs[2],k:bs[3],s:bs[4],end(){bs.forEach(b=>b.pop())}};
}
