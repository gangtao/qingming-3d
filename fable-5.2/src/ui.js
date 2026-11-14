/* ---------- 镜头与界面 ---------- */
var XMAX=560,XMIN=-562,camX=XMAX,tgtX=XMAX,dist=125,tgtDist=125,camZ=0,camY=0,auto=false,showTags=true,W=1,H=1;
var YAW=.2,EL=.5,tgtYaw=.2,tgtEL=.5,zOff=0,tgtZOff=0,ELMIN=.07,ELMAX=1.4,YAWMAX=1.3,DMIN=28,DMAX=330;
var SECS=[{x0:296,t:'一 · 郊野春色',d:'汴京城外，驴队驮着木炭进城，踏青扫墓的轿子正往回走。'},{x0:-150,t:'二 · 汴河虹桥',d:'漕船放倒桅杆要过桥，船上桥上都在喊。岸边纤夫拉纤，码头工人卸货。'},{x0:-1e9,t:'三 · 城门街市',d:'过了十字路口就是城门，驼队正往城外走。城里孙羊正店门前车水马龙，说书、看病、打水，各忙各的。'}];
var capT=document.getElementById('capT'),capD=document.getElementById('capD'),thumb=document.getElementById('thumb'),secB=[].slice.call(document.querySelectorAll('.sec')),curSec=-1;
var playB={};
function setAuto(v){auto=v;playB.textContent=v?'暂停':'自动展卷';}
setAuto(auto);
playB.onclick=function(){if(!auto&&tgtX<=XMIN+2){tgtX=camX=XMAX;}setAuto(!auto);};
var trackE=document.getElementById('track'),scrub=false;
function scrubTo(e){var r=trackE.getBoundingClientRect();tgtX=-600+1200*(e.clientX-r.left)/r.width;clampX();}
trackE.addEventListener('pointerdown',function(e){scrub=true;trackE.setPointerCapture(e.pointerId);scrubTo(e);e.preventDefault();});
trackE.addEventListener('pointermove',function(e){if(scrub){scrubTo(e);camX+=(tgtX-camX)*.5;}});
function scrubEnd(){scrub=false;}trackE.addEventListener('pointerup',scrubEnd);trackE.addEventListener('pointercancel',scrubEnd);
var ctlT=document.getElementById('ctlT'),ctlB=document.getElementById('ctlB'),hintE=document.getElementById('hint');
function setCtl(v){ctlT.setAttribute('aria-expanded',v);ctlB.hidden=!v;}
ctlT.onclick=function(){setCtl(ctlB.hidden);};if(window.innerWidth<=640)setCtl(false);
window.addEventListener('pointerdown',function(){hintE.classList.add('off');},{once:true});setTimeout(function(){hintE.classList.add('off');},12000);
document.getElementById('lab').onclick=function(){showTags=!showTags;this.setAttribute('aria-pressed',showTags);tagsEl.hidden=!showTags;};
var zoomR=document.getElementById('zoomR'),pitchR=document.getElementById('pitchR'),yawR=document.getElementById('yawR');
function clampV(){tgtDist=Math.max(DMIN,Math.min(DMAX,tgtDist));tgtEL=Math.max(ELMIN,Math.min(ELMAX,tgtEL));tgtYaw=Math.max(-YAWMAX,Math.min(YAWMAX,tgtYaw));tgtZOff=Math.max(-45,Math.min(45,tgtZOff));}
function syncR(){if(document.activeElement!==zoomR)zoomR.value=Math.round(100*(1-Math.log(tgtDist/DMIN)/Math.log(DMAX/DMIN)));if(document.activeElement!==pitchR)pitchR.value=Math.round(100*(tgtEL-ELMIN)/(ELMAX-ELMIN));if(document.activeElement!==yawR)yawR.value=Math.round(50+50*tgtYaw/YAWMAX);}
zoomR.oninput=function(){tgtDist=DMIN*Math.pow(DMAX/DMIN,1-zoomR.value/100);};
pitchR.oninput=function(){tgtEL=ELMIN+(ELMAX-ELMIN)*pitchR.value/100;};
yawR.oninput=function(){tgtYaw=YAWMAX*(yawR.value-50)/50;};
document.getElementById('reset').onclick=function(){tgtDist=125;tgtEL=.5;tgtYaw=.2;tgtZOff=0;syncR();};
function clampX(){tgtX=Math.max(XMIN,Math.min(XMAX,tgtX));}
var ptrs={},pinch=0,pang=0,pcy=0,rot=false;
canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
canvas.addEventListener('pointerdown',function(e){ptrs[e.pointerId]={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('drag');setAuto(false);pinch=0;rot=e.button===2||e.button===1||e.shiftKey||e.ctrlKey||e.altKey;});
canvas.addEventListener('pointermove',function(e){var p=ptrs[e.pointerId];if(!p)return;var ids=Object.keys(ptrs),dx=e.clientX-p.x,dy=e.clientY-p.y;
 if(ids.length===1){if(rot){tgtYaw-=dx*.005;tgtEL+=dy*.004;clampV();}
  else{var k=2*dist/Math.max(.55,Math.min(1,cam.aspect/1.2))*Math.tan(14*PI/180)/H,kz=k/Math.max(.25,sin(EL)),mx=-dx*k*cos(YAW)-dy*kz*sin(YAW),mz=dx*k*sin(YAW)-dy*kz*cos(YAW);tgtX+=mx;tgtZOff+=mz;clampX();clampV();camX=tgtX;zOff=tgtZOff;}}
 p.x=e.clientX;p.y=e.clientY;
 if(ids.length===2){var a=ptrs[ids[0]],b=ptrs[ids[1]],d=Math.hypot(a.x-b.x,a.y-b.y),ang=Math.atan2(b.y-a.y,b.x-a.x),cy=(a.y+b.y)/2;
  if(pinch){tgtDist*=pinch/d;var da=ang-pang;if(da>PI)da-=2*PI;if(da<-PI)da+=2*PI;tgtYaw+=da;tgtEL+=(cy-pcy)*.004;clampV();}pinch=d;pang=ang;pcy=cy;}});
function up(e){delete ptrs[e.pointerId];pinch=0;if(!Object.keys(ptrs).length)canvas.classList.remove('drag');}
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('wheel',function(e){e.preventDefault();if(abs(e.deltaX)>abs(e.deltaY)){tgtX+=e.deltaX*.12;clampX();setAuto(false);}else tgtDist=Math.max(DMIN,Math.min(DMAX,tgtDist*(1+e.deltaY*.0012)));},{passive:false});
window.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){tgtX-=20;clampX();setAuto(false);}else if(e.key==='ArrowRight'){tgtX+=20;clampX();setAuto(false);}else if(e.key==='ArrowUp'){tgtEL+=.08;clampV();}else if(e.key==='ArrowDown'){tgtEL-=.08;clampV();}else if(e.key==='+'||e.key==='='){tgtDist*=.85;clampV();}else if(e.key==='-'){tgtDist/=.85;clampV();}});
function resize(){var st=document.getElementById('stage');W=st.clientWidth;H=st.clientHeight;renderer.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();

var v3=new T.Vector3(),last=performance.now(),time=0;
function frame(now){var dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;time+=dt;update(dt);renderer.render(scene,cam);requestAnimationFrame(frame);}
function update(dt){
 if(auto){tgtX-=8*dt;if(tgtX<=XMIN){tgtX=XMIN;setAuto(false);}}
 camX+=(tgtX-camX)*Math.min(1,dt*4);dist+=(tgtDist-dist)*Math.min(1,dt*5);
 var asp=Math.min(1,cam.aspect/1.2),D=dist/Math.max(.55,asp);YAW+=(tgtYaw-YAW)*Math.min(1,dt*7);EL+=(tgtEL-EL)*Math.min(1,dt*7);zOff+=(tgtZOff-zOff)*Math.min(1,dt*7);syncR();
 var lx=camX,zt=roadZ(camX)+(4-roadZ(camX))*Math.max(0,Math.min(1,(dist-45)/70));if(camZ>1e8)camZ=zt;camZ+=(zt-camZ)*Math.min(1,dt*1.6);var lz=camZ+zOff;var gy=groundY(lx,lz)*Math.max(0,Math.min(1,(110-dist)/60));camY+=(gy-camY)*Math.min(1,dt*3);cam.position.set(lx+sin(YAW)*cos(EL)*D,sin(EL)*D+camY,lz+cos(YAW)*cos(EL)*D);cam.lookAt(lx,2+camY,lz);
 scene.fog.near=D+40;scene.fog.far=D+330;
 var sx=Math.round(lx/2)*2;sun.target.position.set(sx,0,0);sun.position.set(sx+70,120,70);sun.target.updateMatrixWorld();
 var R=D*(1.1+abs(sin(YAW))*.8)+55;
 for(var i in chunks){chunks[i].visible=abs(chunks[i].userData.cx-lx)<R+90;}
 for(var j=0;j<actors.length;j++){var a=actors[j];if(a.step)a.step(dt);var vis=a.always||abs(a.x-lx)<R;a.g.visible=vis;if(vis)a.pose(time);}
 for(var s=0;s<sways.length;s++){sways[s].g.rotation.z=sin(time*.8+sways[s].ph)*.04;}
 for(var f=0;f<flags.length;f++){flags[f].rotation.y=sin(time*2.2+f)*.35;}
 for(var r=0;r<ripples.length;r++){var rp=ripples[r];rp.u+=rp.v*dt;if(rp.u>.99)rp.u=.01;riverAt(rp.u,0,ro);riverAt(rp.u,rp.f*ro.hw,ro);rp.m.position.set(ro.x,.1,ro.z);rp.m.rotation.y=Math.atan2(ro.dx,ro.dz);}
 var cz=cam.position.z,cx=cam.position.x,fx=-sin(YAW),fz=-cos(YAW),near=D*cos(EL)*.8;for(var q=0;q<fronts.length;q++){var fr=fronts[q],ax=fr.x-cx,az=fr.z-cz,dd=ax*fx+az*fz;if(dist<=70&&dd<near&&abs(ax*fz-az*fx)<26)fr.g.visible=false;else if(!fr.act)fr.g.visible=true;}
 cam.updateMatrixWorld();
 if(showTags)for(var t=0;t<tags.length;t++){var g=tags[t];if(g.obj){g.p.copy(g.obj.position);g.p.y+=g.h;}v3.copy(g.p).project(cam);var X=(v3.x*.5+.5)*W,Y=(-v3.y*.5+.5)*H;var on=v3.z<1&&X>10&&X<W-10&&Y>70&&Y<H-110;
  if(on){g.e.style.transform='translate('+X.toFixed(1)+'px,'+Y.toFixed(1)+'px) translate(-50%,-100%) translateY(-14px)';}if(on!==g.on){g.e.style.opacity=on?1:0;g.on=on;}}
 var si=camX>SECS[0].x0?0:camX>SECS[1].x0?1:2;if(si!==curSec){curSec=si;capT.textContent=SECS[si].t;capD.textContent=SECS[si].d;secB.forEach(function(b,i){b.classList.toggle('on',i===si);});}
 var vw=Math.max(.02,Math.min(.6,2*D*Math.tan(14*PI/180)*cam.aspect/1200));thumb.style.left=(((camX+600)/1200-vw/2)*100).toFixed(2)+'%';thumb.style.width=(vw*100).toFixed(2)+'%';trackE.setAttribute('aria-valuenow',Math.round((600-camX)/12));
}
tags.forEach(function(g){g.e.style.opacity=0;g.e.style.transition='opacity .4s';});
document.fonts&&document.fonts.load('50px "LXGW WenKai"','酒').then(function(){signs.forEach(function(d){d();});});
window.__q={seek:function(x,d,el,yw){camX=tgtX=x;camZ=1e9;if(d)dist=tgtDist=d;if(el!=null)EL=tgtEL=el;if(yw!=null)YAW=tgtYaw=yw;setAuto(false);},n:function(){return actors.length;},calls:function(){return renderer.info.render.calls;}};
flags.forEach(function(f){f.userData.dyn=true;});sways.forEach(function(s){s.g.userData.dyn=true;});
fronts.forEach(function(f){if(!f.act)bake(f.g);});sways.forEach(function(s){bake(s.g);});
requestAnimationFrame(frame);
})();
