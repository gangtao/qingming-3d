/* 01_materials.js — 程序生成贴图、材质、动画着色器 */
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function toTex(c){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
function speckle(ctx,w,h,n,a,dark){for(let i=0;i<n;i++){const v=Math.random()<0.5?0:255;ctx.fillStyle=`rgba(${v},${v},${v},${Math.random()*a})`;
  ctx.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*dark,1+Math.random()*dark)}}
const TEX={};
function makeTextures(){
  // 瓦：8 条瓦垄 × 8 排，覆盖 2m×2m
  {const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#5a4e3e';x.fillRect(0,0,256,256);
   for(let i=0;i<8;i++){const g=x.createLinearGradient(i*32,0,i*32+32,0);g.addColorStop(0,'#3a3024');g.addColorStop(.2,'#6b5c47');g.addColorStop(.5,'#867558');g.addColorStop(.8,'#65563f');g.addColorStop(1,'#3a3024');x.fillStyle=g;x.fillRect(i*32,0,32,256)}
   for(let j=0;j<8;j++){for(let i=0;i<8;i++){const y=j*32+(i%2?0:0);x.fillStyle='rgba(25,18,10,.55)';x.fillRect(i*32,y,32,3);x.fillStyle='rgba(255,240,200,.16)';x.fillRect(i*32+4,y+3,24,2);x.fillStyle='rgba(0,0,0,.14)';x.fillRect(i*32,y+5,32,8)}}
   speckle(x,256,256,3500,.12,2);TEX.roof=toTex(c);}
  // 茅草
  {const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#a08650';x.fillRect(0,0,256,256);
   for(let i=0;i<1400;i++){const px=Math.random()*256,py=Math.random()*256,l=10+Math.random()*50;x.strokeStyle=`rgba(${60+Math.random()*120|0},${50+Math.random()*100|0},${25+Math.random()*50|0},${.15+Math.random()*.35})`;x.lineWidth=.8+Math.random()*1.6;
     for(const oy of[0,-256,256]){x.beginPath();x.moveTo(px,py+oy);x.lineTo(px+(Math.random()-.5)*5,py+l+oy);x.stroke()}}
   for(const y of[40,110,180,240]){x.fillStyle='rgba(50,36,18,.38)';x.fillRect(0,y,256,3)}
   TEX.thatch=toTex(c);}
  // 通用（墙、木、土）
  {const c=mkCanvas(128,128),x=c.getContext('2d');x.fillStyle='#e8e2d2';x.fillRect(0,0,128,128);
   for(let i=0;i<220;i++){x.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()*.06})`;x.fillRect(Math.random()*128,Math.random()*128,10+Math.random()*60,1+Math.random()*2)}
   speckle(x,128,128,900,.1,2);TEX.gen=toTex(c);}
  // 砖
  {const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#bdb7a6';x.fillRect(0,0,256,256);
   for(let r=0;r<16;r++){const off=r%2?16:0;for(let k=-1;k<9;k++){const v=.82+Math.random()*.2;x.fillStyle=`rgb(${185*v|0},${180*v|0},${165*v|0})`;x.fillRect(k*32+off+1,r*16+1,30,14)}}
   speckle(x,256,256,2500,.1,2);TEX.brick=toTex(c);}
  // 地面
  {const c=mkCanvas(512,512),x=c.getContext('2d');x.fillStyle='#ece6d4';x.fillRect(0,0,512,512);
   for(let i=0;i<120;i++){const px=Math.random()*512,py=Math.random()*512,r=10+Math.random()*50;const g=x.createRadialGradient(px,py,0,px,py,r);const v=Math.random()<.5?'0,0,0':'255,255,255';g.addColorStop(0,`rgba(${v},.07)`);g.addColorStop(1,`rgba(${v},0)`);x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}
   speckle(x,512,512,9000,.16,3);
   for(let i=0;i<500;i++){x.strokeStyle=`rgba(70,60,30,${Math.random()*.2})`;x.lineWidth=1;const px=Math.random()*512,py=Math.random()*512;x.beginPath();x.moveTo(px,py);x.lineTo(px+(Math.random()-.5)*8,py-3-Math.random()*6);x.stroke()}
   TEX.ground=toTex(c);}
  // 水：鱼鳞波纹
  {const c=mkCanvas(256,256),x=c.getContext('2d');x.fillStyle='#a89a6c';x.fillRect(0,0,256,256);
   x.lineWidth=1.1;for(let r=0;r<16;r++)for(let k=0;k<8;k++){const cx=k*32+(r%2?16:0)+(Math.random()-.5)*6,cy=r*16+(Math.random()-.5)*4;x.strokeStyle=`rgba(80,62,34,${.22+Math.random()*.2})`;
     for(const ox of[-256,0,256]){x.beginPath();x.arc(cx+ox,cy,9+Math.random()*4,Math.PI*1.1,Math.PI*1.9);x.stroke()}}
   for(let i=0;i<22;i++){const px=Math.random()*256,py=Math.random()*256;x.strokeStyle='rgba(60,46,24,.22)';x.beginPath();x.ellipse(px,py,10+Math.random()*14,3,0,0,6.3);x.stroke()}
   TEX.water=toTex(c);}
}
/* 招牌图集：4 列 × 2 行，每格 128×400（竖排字） */
const SIGNS=['十千脚店','孙羊正店','赵太丞家','久住王员外家','王家纸马','刘家香铺','脚店','酒','茶','药','肉','饼','正店','香药','解库','食店'];
const SIGNIDX={};SIGNS.forEach((s,i)=>SIGNIDX[s]=i);
function makeSignAtlas(){
  const c=mkCanvas(1024,1024),x=c.getContext('2d');x.fillStyle='#d8c08a';x.fillRect(0,0,1024,1024);
  SIGNS.forEach((s,i)=>{const cx=(i%8)*128,cy=Math.floor(i/8)*512;
    x.fillStyle='#cdb27a';x.fillRect(cx,cy,128,512);x.strokeStyle='#5a3e22';x.lineWidth=5;x.strokeRect(cx+5,cy+5,118,502);
    const n=[...s].length;const fs=Math.min(88,Math.floor(470/n));x.fillStyle='#2f2216';x.font=`${fs}px WenKai, serif`;x.textAlign='center';x.textBaseline='middle';
    [...s].forEach((ch,k)=>x.fillText(ch,cx+64,cy+256+(k-(n-1)/2)*fs*1.04));});
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
}
function signUV(name){const i=SIGNIDX[name]||0;const cx=(i%8)*128/1024,cy=Math.floor(i/8)*512/1024;return [cx+0.004,1-(cy+0.5)+0.004,cx+128/1024-0.004,1-cy-0.004]}

const SUN=new THREE.Vector3(-0.45,0.8,0.42).normalize();
const LIGHT={sunCol:[0.68,0.62,0.5],sky:[0.76,0.72,0.62],gnd:[0.48,0.41,0.31],fog:0xc9b68a};
const MAT={};
const AG_VS=`
uniform float uTime; uniform vec4 uB1; uniform vec4 uB2;
attribute vec3 aRoot; attribute vec3 aPivot; attribute vec4 aA; attribute vec4 aB; attribute float aTP;
varying vec3 vCol; varying vec3 vNrm; varying vec3 vW;
#include <fog_pars_vertex>
vec3 P; vec3 N;
void rZ(vec3 pv,float a){vec3 d=P-pv;float c=cos(a),s=sin(a);P=pv+vec3(d.x*c-d.y*s,d.x*s+d.y*c,d.z);N=vec3(N.x*c-N.y*s,N.x*s+N.y*c,N.z);}
void rY(vec3 pv,float a){vec3 d=P-pv;float c=cos(a),s=sin(a);P=pv+vec3(d.x*c+d.z*s,d.y,-d.x*s+d.z*c);N=vec3(N.x*c+N.z*s,N.y,-N.x*s+N.z*c);}
void rX(vec3 pv,float a){vec3 d=P-pv;float c=cos(a),s=sin(a);P=pv+vec3(d.x,d.y*c-d.z*s,d.y*s+d.z*c);N=vec3(N.x,N.y*c-N.z*s,N.y*s+N.z*c);}
void main(){
  P=position;N=normal;vCol=color;
  float h=aA.x,mode=aA.y,ph=aA.z,spd=aA.w,rng=aB.x,part=aB.y,amp=aB.z,flag=aB.w;
  float T=uTime,bob=0.0,lean=0.0,u=0.0,dirS=1.0;
  vec3 pv=aPivot;
  if(rng>0.0){float per=4.0*rng/max(spd,0.05);float q=fract(T/per+aTP)*4.0;if(q<2.0){u=-rng+q*rng;}else{u=rng-(q-2.0)*rng;dirS=-1.0;}}
  float w=((mode>7.5&&mode<8.5)||(mode>13.5&&mode<15.5)?3.3:4.5)*spd;
  float g=T*w+ph;float sg=sin(g);
  bool isBird=false; vec3 off=vec3(0.0);
  if(mode<0.5){}
  else if(mode<1.5){ bob=abs(sg)*0.04;
    if(part==3.0)rZ(pv,sg*0.62);else if(part==4.0)rZ(pv,-sg*0.62);else if(part==1.0)rZ(pv,-sg*0.5);else if(part==2.0)rZ(pv,sg*0.5);else if(part==5.0)rY(pv,sin(g*0.3)*0.1);}
  else if(mode<2.5){ float s2=sin(T*0.7+ph*3.0); bob=0.0;
    if(part==5.0)rY(pv,sin(T*0.45+ph)*0.55);else if(part==2.0)rZ(pv,max(0.0,sin(T*0.5+ph*2.0))*1.1);else if(part==1.0)rZ(pv,s2*0.08);}
  else if(mode<3.5){ // sit
    if(part==2.0)rZ(pv,max(0.0,sin(T*0.5+ph))*1.25);else if(part==5.0)rY(pv,sin(T*0.35+ph*2.0)*0.4);else if(part==1.0)rZ(pv,sin(T*0.8+ph)*0.15);}
  else if(mode<4.5){ // carry
    float g2=T*(2.5+spd*3.0)+ph;bob=abs(sin(g2))*0.05;
    if(part==3.0)rZ(pv,sin(g2)*0.5);else if(part==4.0)rZ(pv,-sin(g2)*0.5);else if(part==6.0)rZ(pv,sin(g2*2.0)*0.05);}
  else if(mode<5.5){ // pull rope
    float g2=T*3.1+ph;float s3=sin(g2);
    if(part==3.0)rZ(pv,s3*0.5);else if(part==4.0)rZ(pv,-s3*0.5);else if(part==1.0)rZ(pv,0.5+sin(g2*0.5)*0.1);else if(part==2.0)rZ(pv,0.55);
    lean=-0.38+sin(g2)*0.04; bob=abs(s3)*0.02;}
  else if(mode<6.5){ // pole / row
    float g2=T*1.7+ph;float s3=sin(g2);
    if(part==1.0)rZ(pv,0.3+s3*0.85);else if(part==2.0)rZ(pv,0.3+s3*0.85);else if(part==3.0)rZ(pv,s3*0.1);
    lean=-0.1-s3*0.12;}
  else if(mode<7.5){ // hawker
    if(part==2.0)rZ(pv,1.2+sin(T*2.0+ph)*0.5);else if(part==5.0)rY(pv,sin(T*0.8+ph)*0.45);else if(part==1.0)rZ(pv,sin(T*1.3+ph)*0.15);bob=abs(sin(T*1.5+ph))*0.01;}
  else if(mode<8.5){ // rider
    bob=abs(sg)*0.045; if(part==1.0)rZ(pv,0.45);else if(part==2.0)rZ(pv,0.4);else if(part==5.0)rY(pv,sin(T*0.5+ph)*0.3);}
  else if(mode<9.5){ // watch
    if(part==5.0)rY(pv,sin(T*0.6+ph)*0.6);else if(part==2.0)rZ(pv,max(0.0,sin(T*0.45+ph*3.0))*1.7);else if(part==1.0)rZ(pv,0.35);}
  else if(mode<10.5){ // 摆动：旗幌、柳条
    float k=max(0.0,(pv.y-position.y));float a1=sin(T*(1.2+amp)+ph+aRoot.x*0.21+aRoot.z*0.13);
    P.x+=a1*k*0.12*(0.6+amp);P.z+=sin(T*1.7+ph*1.7+aRoot.z*0.3)*k*0.07*(0.6+amp);P.y-=abs(a1)*k*0.02;}
  else if(mode<11.5){ // 车轮
    if(rng>0.0)rZ(pv,-T*spd/max(amp,0.1));}
  else if(mode<12.5){ // 船摇晃
    float bp=ph;
    if(part==13.0)rY(pv,sin(T*1.5+ph)*0.45);else if(part==14.0)rY(pv,sin(T*0.6+ph)*0.12);else if(part==10.0){float k=max(0.0,(pv.y-position.y));P.x+=sin(T*1.4+ph)*k*0.1;P.z+=sin(T*1.1+ph*2.0)*k*0.05;}
    rX(vec3(0.0),sin(T*0.9+bp)*0.022);rZ(vec3(0.0),sin(T*0.7+bp*1.3)*0.012);bob=sin(T*1.1+bp)*0.05;}
  else if(mode<13.5){ rY(pv,sin(T*1.5+ph)*0.45);}
  else if(mode<14.5){ // 走兽
    bob=abs(sg)*0.03;
    if(part==3.0)rZ(pv,sg*0.5);else if(part==4.0)rZ(pv,-sg*0.5);else if(part==5.0)rZ(pv,sin(g*2.0)*0.05);else if(part==8.0)rZ(pv,sin(g*1.0+1.0)*0.3);}
  else if(mode<15.5){ // 立兽
    float a=sin(T*0.5+ph*2.0);
    if(part==5.0)rZ(pv,max(0.0,a)*0.45-0.05);else if(part==8.0)rZ(pv,sin(T*1.6+ph)*0.25);else if(part==3.0)rZ(pv,max(0.0,sin(T*0.3+ph))*0.06);}
  else if(mode<16.5){ // 炊烟
    float life=fract(T*0.07+ph);P*= (0.5+life*2.2);P.y+=life*7.0;P.x+=life*life*3.0+sin(T*0.5+ph*5.0)*life*0.8;vCol=mix(color,vec3(0.74,0.66,0.48),clamp(life*1.4,0.0,1.0));}
  else { // 飞鸟
    isBird=true;float rad=amp;float a=T*spd/rad+ph;
    if(part==1.0)rX(vec3(0.0),sin(T*9.0+ph*5.0)*0.75);else if(part==2.0)rX(vec3(0.0),-sin(T*9.0+ph*5.0)*0.75);
    off=vec3(cos(a)*rad,sin(T*0.6+ph*3.0)*2.0,-sin(a)*rad);h=a+1.5708;}
  if(abs(lean)>0.0001)rZ(vec3(0.0),lean);
  float hh=h+(dirS<0.0?3.14159265:0.0);
  float c=cos(hh),s=sin(hh);
  vec3 wp=vec3(P.x*c+P.z*s,P.y,-P.x*s+P.z*c);
  vec3 wn=vec3(N.x*c+N.z*s,N.y,-N.x*s+N.z*c);
  vec3 fwd=vec3(cos(h),0.0,-sin(h));
  wp+=aRoot+fwd*u+off;
  if(flag>=10.0)bob=sin(T*1.1+(flag-10.0))*0.05;
  wp.y+=bob;
  if(flag<-0.5){float dz=abs(dot(wp.xz-uB1.xy,uB1.zw));float y;if(dz<uB2.x){float q=dz/uB2.x;y=uB2.z+uB2.y*(1.0-q*q);}else{y=uB2.z*max(0.0,1.0-(dz-uB2.x)/10.0);}wp.y+=y;}
  vNrm=wn;vW=wp;
  vec4 mvPosition=viewMatrix*vec4(wp,1.0);
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const AG_FS=`
uniform vec3 uSunDir,uSunCol,uSky,uGnd;
varying vec3 vCol; varying vec3 vNrm; varying vec3 vW;
#include <fog_pars_fragment>
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec3 n=normalize(vNrm);
  vec3 hemi=mix(uGnd,uSky,n.y*0.5+0.5);
  vec3 col=vCol*(hemi+uSunCol*max(dot(n,uSunDir),0.0));
  float g=vn(vW.xz*9.0+vW.y*5.0);col*=0.9+0.2*g;
  gl_FragColor=vec4(col,1.0);
  #include <fog_fragment>
}`;
function makeMaterials(){
  makeTextures();
  const lam=(map,extra)=>new THREE.MeshLambertMaterial(Object.assign({vertexColors:THREE.VertexColors,map},extra||{}));
  MAT.gen=lam(TEX.gen);MAT.roof=lam(TEX.roof,{side:THREE.DoubleSide});MAT.thatch=lam(TEX.thatch,{side:THREE.DoubleSide});
  MAT.brick=lam(TEX.brick);MAT.ground=lam(TEX.ground);
  MAT.water=new THREE.MeshLambertMaterial({map:TEX.water,color:0xffffff});
  MAT.sign=new THREE.MeshLambertMaterial({map:makeSignAtlas(),vertexColors:THREE.VertexColors,side:THREE.DoubleSide});
  const U=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uTime:{value:0},uB1:{value:new THREE.Vector4(0,0,-0.7071,0.7071)},uB2:{value:new THREE.Vector4(20,6.5,1,10)},
    uSunDir:{value:SUN.clone()},uSunCol:{value:new THREE.Vector3(...LIGHT.sunCol)},uSky:{value:new THREE.Vector3(...LIGHT.sky)},uGnd:{value:new THREE.Vector3(...LIGHT.gnd)}}]);
  MAT.ag=new THREE.ShaderMaterial({uniforms:U,vertexShader:AG_VS,fragmentShader:AG_FS,fog:true,vertexColors:THREE.VertexColors,side:THREE.DoubleSide});
}
