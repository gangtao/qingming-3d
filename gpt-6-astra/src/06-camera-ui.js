/* 手动镜头。没有巡游、自动旋转或镜头时间线；场景中的生活动作独立运行。 */
Q.cam={x:512,z:8,distance:133,tilt:48,yaw:.11};Q.defaultCam={...Q.cam};
Q.initView=()=>{
 const stage=document.getElementById('stage');Q.camera=new T.PerspectiveCamera(42,1,.12,1600);
 Q.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
 Q.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,innerWidth<700?1.4:1.65));Q.renderer.outputEncoding=T.sRGBEncoding;Q.renderer.toneMapping=T.ACESFilmicToneMapping;Q.renderer.toneMappingExposure=1.13;Q.renderer.shadowMap.enabled=true;Q.renderer.shadowMap.type=T.PCFSoftShadowMap;stage.append(Q.renderer.domElement);
 Q.scene.add(new T.HemisphereLight(0xfff3d6,0x8a836c,.95));Q.sun=new T.DirectionalLight(0xffefd0,1.6);Q.sun.position.set(470,130,80);Q.sun.castShadow=true;Q.sun.shadow.mapSize.set(innerWidth<700?1024:2048,innerWidth<700?1024:2048);Q.sun.shadow.camera.left=Q.sun.shadow.camera.bottom=-100;Q.sun.shadow.camera.right=Q.sun.shadow.camera.top=100;Q.sun.shadow.camera.near=10;Q.sun.shadow.camera.far=360;Q.sun.shadow.bias=-.00045;Q.sun.shadow.normalBias=.03;Q.sun.shadow.radius=3;Q.scene.add(Q.sun,Q.sun.target);
 Q.resize=()=>{let w=stage.clientWidth,h=stage.clientHeight;Q.renderer.setSize(w,h);Q.camera.aspect=w/h;Q.camera.updateProjectionMatrix();};Q.resize();window.addEventListener('resize',Q.resize);
 const panel=document.getElementById('view-panel');if(innerWidth<700)panel.open=false;
 Q.userAct=()=>{document.getElementById('hint').classList.add('faded');};
 const sync=()=>{const s=Q.cam;document.getElementById('zoom').value=100*(1-Math.log(s.distance/4.5)/Math.log(350/4.5));document.getElementById('zoom-value').textContent=s.distance<22?'街面':s.distance<80?'近景':s.distance<190?'中景':'远眺';document.getElementById('tilt').value=s.tilt;document.getElementById('tilt-value').textContent=Math.round(s.tilt)+'°';let deg=s.yaw*180/PI;deg=((deg+180)%360+360)%360-180;document.getElementById('rotation').value=deg;document.getElementById('rotation-value').textContent=Math.round(deg)+'°';};Q.syncUI=sync;
 const zoom=(factor)=>{Q.cam.distance=Q.clamp(Q.cam.distance*factor,4.5,350);Q.userAct();sync();};Q.zoomBy=zoom;
 document.getElementById('zoom').addEventListener('input',e=>{Q.cam.distance=4.5*Math.pow(350/4.5,1-e.target.value/100);Q.userAct();sync();});
 document.getElementById('tilt').addEventListener('input',e=>{Q.cam.tilt=+e.target.value;Q.userAct();sync();});
 document.getElementById('rotation').addEventListener('input',e=>{Q.cam.yaw=+e.target.value*PI/180;Q.userAct();sync();});
 document.getElementById('toggle-labels').addEventListener('click',e=>{const off=document.body.classList.toggle('labels-off');e.target.textContent=off?'题签 · 隐':'题签 · 显';e.target.setAttribute('aria-pressed',!off);Q.userAct();});
 document.getElementById('reset').addEventListener('click',()=>{Object.assign(Q.cam,Q.defaultCam);Q.userAct();sync();});
 stage.addEventListener('contextmenu',e=>e.preventDefault());
 stage.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(Q.clamp(e.deltaY,-150,150)*.0018));},{passive:false});
 const pointers=new Map();let lastGesture=null;
 const gesture=()=>{const a=[...pointers.values()];if(a.length<2)return null;return {x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),a:Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x)};};
 const pan=(dx,dy)=>{const s=Q.cam,f=s.distance*.00165; s.x+=(-dx*Math.cos(s.yaw)+dy*Math.sin(s.yaw))*f;s.z+=(dx*Math.sin(s.yaw)+dy*Math.cos(s.yaw))*f;Q.constrain();};
 stage.addEventListener('pointerdown',e=>{stage.focus({preventScroll:true});stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:e.button});lastGesture=gesture();stage.classList.add('dragging');Q.userAct();});
 stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId),dx=e.clientX-old.x,dy=e.clientY-old.y;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:old.button});
  if(pointers.size>=2){const now=gesture();if(lastGesture){zoom(lastGesture.d/Math.max(1,now.d));let da=now.a-lastGesture.a;da=Math.atan2(Math.sin(da),Math.cos(da));Q.cam.yaw-=da;Q.cam.tilt=Q.clamp(Q.cam.tilt+(now.y-lastGesture.y)*.18,12,80);pan((now.x-lastGesture.x)*.5,0);}lastGesture=now;}
  else if(old.button===2||e.shiftKey){Q.cam.yaw-=dx*.006;Q.cam.tilt=Q.clamp(Q.cam.tilt+dy*.22,12,80);}
  else pan(dx,dy);sync();
 });
 const release=e=>{pointers.delete(e.pointerId);lastGesture=gesture();if(!pointers.size)stage.classList.remove('dragging');};stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);
 window.addEventListener('keydown',e=>{if(['INPUT','BUTTON','SUMMARY'].includes(e.target.tagName)||e.target.id==='timeline')return;let handled=true;
  switch(e.key){case 'ArrowLeft':pan(27,0);break;case 'ArrowRight':pan(-27,0);break;case 'ArrowUp':pan(0,-27);break;case 'ArrowDown':pan(0,27);break;case '+':case '=':zoom(.87);break;case '-':case '_':zoom(1.15);break;case 'Home':Object.assign(Q.cam,Q.defaultCam);break;default:handled=false;}
  if(handled){e.preventDefault();Q.userAct();sync();}
 });
 const nav=document.getElementById('timeline');let dragging=false;
 const jump=e=>{const r=nav.getBoundingClientRect();Q.jump(Q.clamp((e.clientX-r.left)/r.width,0,1)*1000);};
 nav.addEventListener('pointerdown',e=>{nav.setPointerCapture(e.pointerId);dragging=true;jump(e);Q.userAct();});nav.addEventListener('pointermove',e=>{if(dragging)jump(e);});nav.addEventListener('pointerup',()=>dragging=false);nav.addEventListener('pointercancel',()=>dragging=false);
 nav.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){Q.jump(Q.cam.x+(e.key==='ArrowLeft'?-15:15));e.preventDefault();Q.userAct();}else if(e.key==='Home'){Q.jump(985);e.preventDefault();}else if(e.key==='End'){Q.jump(20);e.preventDefault();}});
 document.querySelectorAll('[data-x]').forEach(b=>b.addEventListener('click',()=>{Q.jump(+b.dataset.x);Q.userAct();}));
 sync();
};
Q.constrain=()=>{Q.cam.x=Q.clamp(Q.cam.x,5,995);Q.cam.z=Q.clamp(Q.cam.z,-74,81);};
Q.jump=x=>{Q.cam.x=Q.clamp(x,8,992);Q.cam.z=x>780?0:x>450?8:20;Q.syncUI();};
Q.updateCamera=()=>{
 const s=Q.cam,phi=s.tilt*PI/180,target=Q.v(s.x,1.1,s.z);
 Q.camera.position.set(s.x+s.distance*Math.cos(phi)*Math.sin(s.yaw),1.1+s.distance*Math.sin(phi),s.z+s.distance*Math.cos(phi)*Math.cos(s.yaw));Q.camera.lookAt(target);Q.camera.updateMatrixWorld();
 Q.sun.position.set(s.x-65,120,s.z+70);Q.sun.target.position.set(s.x,0,s.z);
 // 将视锥四个角投向地面，得到导航框真实横向覆盖范围。
 const xs=[],o=Q.camera.position;for(let xx of [-1,1])for(let yy of [-.85,.7]){const p=Q.v(xx,yy,.5).unproject(Q.camera),d=p.sub(o).normalize();if(d.y<-.01)xs.push(o.x+d.x*(-o.y/d.y));}
 const half=s.distance*Math.tan(Q.camera.fov*PI/360)*Q.camera.aspect;let left=xs.length?Math.min(...xs):s.x-half,right=xs.length?Math.max(...xs):s.x+half;
 left=Q.clamp(left/1000,0,1);right=Q.clamp(right/1000,0,1);if(right-left<.008){left=Math.max(0,s.x/1000-.004);right=Math.min(1,s.x/1000+.004);}
 const frame=document.getElementById('view-range');frame.style.left=left*100+'%';frame.style.width=(right-left)*100+'%';document.querySelector('.nav-shade.left').style.width=left*100+'%';document.querySelector('.nav-shade.right').style.width=(1-right)*100+'%';document.getElementById('timeline').setAttribute('aria-valuenow',Math.round(s.x/10));
 const section=s.x>780?0:s.x>400?1:2;
 const titles=['郊野春色','汴河虹桥','城门街市'],desc=['疏柳掩茅舍，阡陌见归人。<br>沿郊野小径，渐入汴河人家。','舟楫衔尾，百工相逢。<br>移步虹桥，看一河烟火。','车马穿城，酒旗招客。<br>由城门入街巷，访百业千家。'];
 if(Q.lastSection!==section){document.getElementById('chapter-title').textContent=titles[section];document.getElementById('chapter-text').innerHTML=desc[section];document.getElementById('chapter-number').textContent=['壹','贰','叁'][section];Q.lastSection=section;}
 const closest=Q.landmarks.reduce((a,b)=>Math.abs(b.x-s.x)<Math.abs(a.x-s.x)?b:a);document.getElementById('view-status').textContent=(s.x>780?'卷首':s.x<200?'卷尾':'卷中')+' · '+closest.name;
 const w=document.getElementById('stage').clientWidth,h=document.getElementById('stage').clientHeight,occupied=[];
 for(const l of Q.labels){const p=l.pos.clone().project(Q.camera),dist=l.pos.distanceTo(Q.camera.position);let visible=p.z>-1&&p.z<1&&Math.abs(p.x)<.92&&Math.abs(p.y)<.88&&dist<Math.max(140,s.distance*1.6);
  const px=(p.x*.5+.5)*w,py=(-p.y*.5+.5)*h;if(px<315&&py<220||px>w-90&&py<320)visible=false;
  if(visible&&occupied.some(q=>Math.abs(px-q[0])<110&&Math.abs(py-q[1])<42))visible=false;
  if(visible)occupied.push([px,py]);l.el.style.display=visible?'block':'none';if(visible){l.el.style.left=px+'px';l.el.style.top=py+'px';}
 }
};
