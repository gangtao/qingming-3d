/* 07_ui.js — 镜头控制、全卷导航条、视角面板、标题与题签 */
const SEGS=[
  {t0:0,t1:0.26,name:'郊野春色',desc:'汴京城外，早春的郊野。枯树疏柳，驮队缓缓而行，一池春水边泊着小舟。'},
  {t0:0.26,t1:0.66,name:'汴河虹桥',desc:'汴河上漕船往来，纤夫挽绳，舟子摇橹；虹桥横跨两岸，桥上桥下人声鼎沸。'},
  {t0:0.66,t1:1.0001,name:'城门街市',desc:'过桥便是城门街市。彩楼欢门，店铺林立，车马驼队行人络绎不绝。'}
];
const CAM={tx:TX(0.06),tz:36,dist:120,pitch:0.62,yaw:0,gtx:0,gtz:0,gdist:120,gpitch:0.62,gyaw:0};
const DMIN=5,DMAX=700,HOME={x:TX(0.052),z:52,dist:88,pitch:0.56,yaw:0};
function initCamera(renderer,camera,dom){
  let moved=false;const ptr=new Map();let lastPinch=null;
  const set=(k,v)=>{CAM[k]=v};
  const home=()=>{CAM.gtx=HOME.x;CAM.gtz=HOME.z;CAM.gdist=HOME.dist;CAM.gpitch=HOME.pitch;CAM.gyaw=HOME.yaw};
  CAM.reset=home;
  CAM.gtx=HOME.x;CAM.gtz=HOME.z;CAM.gdist=HOME.dist;CAM.gpitch=HOME.pitch;CAM.gyaw=0;
  CAM.tx=CAM.gtx;CAM.tz=CAM.gtz;CAM.dist=CAM.gdist*1.6;CAM.pitch=CAM.gpitch;CAM.yaw=0;
  const clampG=()=>{CAM.gtx=clamp(CAM.gtx,-L/2-30,L/2+30);CAM.gtz=clamp(CAM.gtz,-170,160);CAM.gdist=clamp(CAM.gdist,DMIN,DMAX);CAM.gpitch=clamp(CAM.gpitch,0.1,1.5);};
  const interacted=()=>{if(!moved){moved=true;document.getElementById('hint').classList.add('off')}};
  const pan=(dx,dy)=>{const wpp=2*CAM.gdist*Math.tan(0.4)/dom.clientHeight;const c=Math.cos(CAM.gyaw),s=Math.sin(CAM.gyaw);
    const fy=1/Math.max(Math.sin(CAM.gpitch),0.35);
    CAM.gtx+=-c*dx*wpp+(-s)*dy*wpp*fy;CAM.gtz+=s*dx*wpp+(-c)*dy*wpp*fy;clampG()};
  dom.addEventListener('contextmenu',e=>e.preventDefault());
  dom.addEventListener('pointerdown',e=>{dom.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY,b:e.button,sh:e.shiftKey});interacted();lastPinch=null});
  dom.addEventListener('pointerup',e=>{ptr.delete(e.pointerId);lastPinch=null});
  dom.addEventListener('pointercancel',e=>{ptr.delete(e.pointerId);lastPinch=null});
  dom.addEventListener('pointermove',e=>{
    const p=ptr.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(ptr.size===1){
      if(e.pointerType==='mouse'&&(p.b===2||p.sh||e.shiftKey||(e.buttons&2))){CAM.gyaw-=dx*0.006;CAM.gpitch=clamp(CAM.gpitch+dy*0.005,0.1,1.5)}
      else pan(dx,dy);
      p.x=e.clientX;p.y=e.clientY;
    }else if(ptr.size===2){
      p.x=e.clientX;p.y=e.clientY;const a=[...ptr.values()];
      const d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),ang=Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),my=(a[0].y+a[1].y)/2;
      if(lastPinch){CAM.gdist=clamp(CAM.gdist*lastPinch.d/d,DMIN,DMAX);let da=ang-lastPinch.a;if(da>Math.PI)da-=2*Math.PI;if(da<-Math.PI)da+=2*Math.PI;CAM.gyaw-=da;CAM.gpitch=clamp(CAM.gpitch+(my-lastPinch.my)*0.004,0.1,1.5)}
      lastPinch={d,a:ang,my};
    }
  });
  dom.addEventListener('wheel',e=>{e.preventDefault();interacted();CAM.gdist=clamp(CAM.gdist*Math.exp(e.deltaY*0.0012),DMIN,DMAX)},{passive:false});
  const keys={};
  addEventListener('keydown',e=>{keys[e.key]=true;interacted()});addEventListener('keyup',e=>{keys[e.key]=false});
  CAM.tick=(dt)=>{
    const sp=CAM.gdist*0.9*dt;const c=Math.cos(CAM.gyaw),s=Math.sin(CAM.gyaw);
    if(keys.ArrowLeft){CAM.gtx-=c*sp;CAM.gtz+=s*sp}if(keys.ArrowRight){CAM.gtx+=c*sp;CAM.gtz-=s*sp}
    if(keys.ArrowUp){CAM.gtx+=-s*sp;CAM.gtz+=-c*sp}if(keys.ArrowDown){CAM.gtx-=-s*sp;CAM.gtz-=-c*sp}
    if(keys['+']||keys['=']||keys['PageUp'])CAM.gdist*=Math.exp(-dt*1.2);if(keys['-']||keys['_']||keys['PageDown'])CAM.gdist*=Math.exp(dt*1.2);
    clampG();const k=1-Math.exp(-dt*9);
    CAM.tx+=(CAM.gtx-CAM.tx)*k;CAM.tz+=(CAM.gtz-CAM.tz)*k;CAM.dist*=Math.exp(Math.log(CAM.gdist/CAM.dist)*k);CAM.pitch+=(CAM.gpitch-CAM.pitch)*k;CAM.yaw+=(CAM.gyaw-CAM.yaw)*k;
    const ty=clamp(CAM.dist*0.012,0.8,3);
    const minP=Math.asin(clamp((1.4-ty)/CAM.dist,0,0.9));const pitch=Math.max(CAM.pitch,minP);
    const cp=Math.cos(pitch);camera.position.set(CAM.tx+CAM.dist*Math.sin(CAM.yaw)*cp,ty+CAM.dist*Math.sin(pitch),CAM.tz+CAM.dist*Math.cos(CAM.yaw)*cp);
    camera.lookAt(CAM.tx,ty,CAM.tz);
  };
}
function initUI(camera,renderer){
  const $=id=>document.getElementById(id);
  const nav=$('nav'),box=$('navbox');
  const titleEl=$('segName'),descEl=$('segDesc');let curSeg=-1;
  function navSet(clientX){const r=nav.getBoundingClientRect();const f=clamp((clientX-r.left)/r.width,0,1);CAM.gtx=f*L-L/2;}
  let dragging=false;
  nav.addEventListener('pointerdown',e=>{dragging=true;nav.setPointerCapture(e.pointerId);navSet(e.clientX);$('hint').classList.add('off')});
  nav.addEventListener('pointermove',e=>{if(dragging)navSet(e.clientX)});
  nav.addEventListener('pointerup',()=>dragging=false);nav.addEventListener('pointercancel',()=>dragging=false);
  // 面板
  const panel=$('panel');$('panelHead').onclick=()=>panel.classList.toggle('closed');
  if(innerWidth<700)panel.classList.add('closed');
  const sz=$('sZoom'),sp=$('sPitch'),sy=$('sYaw');let active=null;
  [sz,sp,sy].forEach(s=>{s.addEventListener('pointerdown',()=>active=s);s.addEventListener('pointerup',()=>active=null);});
  sz.oninput=()=>{CAM.gdist=DMIN*Math.pow(DMAX/DMIN,1-sz.value/1000)};
  sp.oninput=()=>{CAM.gpitch=sp.value/100};sy.oninput=()=>{CAM.gyaw=sy.value/100};
  let tags=true;$('btnTag').onclick=()=>{tags=!tags;$('btnTag').classList.toggle('on',tags)};$('btnTag').classList.add('on');
  $('btnReset').onclick=()=>CAM.reset();
  // 题签
  const tagEls=LABELS.map(l=>{const d=document.createElement('div');d.className='tag';d.textContent=l.txt;$('tags').appendChild(d);return d});
  const v=new THREE.Vector3();const rc=new THREE.Raycaster();
  return function update(){
    const t=XT(CAM.tx);let si=SEGS.findIndex(s=>t>=s.t0&&t<s.t1);if(si<0)si=t<0?0:2;
    if(si!==curSeg){curSeg=si;const el=$('segBox');el.classList.add('swap');setTimeout(()=>{titleEl.textContent=SEGS[si].name;descEl.textContent=SEGS[si].desc;el.classList.remove('swap')},180);
      document.querySelectorAll('.navseg').forEach((e,i)=>e.classList.toggle('cur',2-i===si))}
    // 视野框：视锥在地面上的左右范围
    {const g=[];for(const nx of[-1,1])for(const ny of[-0.9,0.1]){rc.setFromCamera({x:nx,y:ny},camera);const d=rc.ray.direction,o=rc.ray.origin;let tt=d.y<-0.02?-o.y/d.y:1500;tt=Math.min(tt,2500);g.push(o.x+d.x*tt)}
     let x0=Math.min(...g),x1=Math.max(...g);x0=clamp(x0,-L/2,L/2);x1=clamp(x1,-L/2,L/2);
     const w=Math.max((x1-x0)/L,0.008);const cx=(x0+x1)/(2*L)+0.5;box.style.left=((cx-w/2)*100)+'%';box.style.width=(w*100)+'%'}
    if(!active||active!==sz)sz.value=Math.round((1-Math.log(CAM.gdist/DMIN)/Math.log(DMAX/DMIN))*1000);
    if(active!==sp)sp.value=Math.round(CAM.gpitch*100);if(active!==sy)sy.value=Math.round(CAM.gyaw*100);
    // 题签
    const cw=innerWidth,ch=innerHeight;
    LABELS.forEach((l,i)=>{const e=tagEls[i];let show=tags&&(l.pri===0?CAM.dist<520:l.pri===1?CAM.dist<260:CAM.dist<120);
      if(show){v.set(l.x,l.y,l.z).project(camera);if(v.z>1||v.z<-1||Math.abs(v.x)>1.02||v.y>1||v.y<-1)show=false;
        else{e.style.transform=`translate(${(v.x*0.5+0.5)*cw}px,${(-v.y*0.5+0.5)*ch}px) translate(-50%,-100%)`}}
      if(show!==e._s){e.style.opacity=show?1:0;e.style.visibility=show?'visible':'hidden';e._s=show}});
  };
}
