bake();
const $=s=>document.querySelector(s),canvas=renderer.domElement,focus=vec(0,1,0),clamp=(x,l,h)=>Math.min(h,Math.max(l,x));
let distance=44,tilt=.69,heading=.26,show=true;
$('details').open=innerWidth>650;
const sections=[['城门街市','城楼临街，商旅与驼队穿行其间。',-82],['汴河虹桥','木拱横跨汴河，舟人俯身摇橹。',0],['郊野春色','柳枝初绿，车马沿着田间小路入城。',100]];
const buttons=[...document.querySelectorAll('.zones button')];
function update(){distance=clamp(distance,5,118);tilt=clamp(tilt,.17,1.42);heading=Math.atan2(Math.sin(heading),Math.cos(heading));focus.x=clamp(focus.x,-145,145);focus.z=clamp(focus.z,-47,32);
 camera.position.copy(focus).add(vec(Math.sin(heading)*Math.cos(tilt),Math.sin(tilt),Math.cos(heading)*Math.cos(tilt)).multiplyScalar(distance));camera.lookAt(focus);camera.updateMatrixWorld();
 $('#zoom').value=123-distance;$('#pitch').value=tilt;$('#yaw').value=heading;
 let n=focus.x>67?2:focus.x< -37?0:1;$('#chapter').textContent='北宋 · 张择端　／　'+['卷末','卷中','卷首'][n];$('h2').textContent=sections[n][0];$('#desc').textContent=sections[n][1];buttons.forEach((b,i)=>b.classList.toggle('active',i===n));
 let w=clamp(distance*.69*camera.aspect/300, .025,1);$('#frame').style.width=w*100+'%';$('#frame').style.left=clamp(.5+focus.x/300-w/2,0,1-w)*100+'%';
 for(let {el,p} of signs){let v=p.clone().project(camera);el.hidden=!show||Math.abs(v.x)>.94||Math.abs(v.y)>.87||Math.abs(v.z)>1;el.style.left=(v.x+1)*50+'%';el.style.top=(1-v.y)*50+'%'}}
function jump(x){focus.set(x,1,Math.abs(x)<9?0:road(x));update()}
buttons.forEach((b,i)=>b.onclick=()=>jump(sections[i][2]));
$('#zoom').oninput=e=>{distance=123-e.target.value;update()};$('#pitch').oninput=e=>{tilt=+e.target.value;update()};$('#yaw').oninput=e=>{heading=+e.target.value;update()};$('#reset').onclick=()=>{distance=44;tilt=.69;heading=.26;jump(0)};$('#tags').onclick=()=>{$('#tags').setAttribute('aria-pressed',show=!show);update()};
function resize(){let w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();update()}onresize=resize;resize();
function pan(dx,dy){let k=distance*.75/canvas.clientHeight;focus.x-=k*(dx*Math.cos(heading)+dy*Math.sin(heading));focus.z+=k*(dx*Math.sin(heading)-dy*Math.cos(heading))}
const pointers=new Map();function gesture(){let [a,b]=pointers.values();return b?[ (a.x+b.x)/2,(a.y+b.y)/2,Math.hypot(b.x-a.x,b.y-a.y),Math.atan2(b.y-a.y,b.x-a.x)]:[a.x,a.y]}
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})};canvas.onpointermove=e=>{if(!pointers.has(e.pointerId))return;let old=gesture();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});let v=gesture(),dx=v[0]-old[0],dy=v[1]-old[1];if(v.length===4){distance*=old[2]/Math.max(v[2],1);heading-=v[3]-old[3];tilt+=dy*.006}else if(e.shiftKey||e.buttons===2){heading-=dx*.007;tilt+=dy*.006}else pan(dx,dy);update()};canvas.onpointerup=canvas.onpointercancel=e=>pointers.delete(e.pointerId);canvas.oncontextmenu=e=>e.preventDefault();canvas.onwheel=e=>{e.preventDefault();distance*=Math.exp(clamp(e.deltaY,-180,180)*.0017);update()};
const nav=$('nav');function seek(e){let r=nav.getBoundingClientRect();jump(((e.clientX-r.left)/r.width-.5)*300)}nav.onpointerdown=e=>{nav.setPointerCapture(e.pointerId);seek(e)};nav.onpointermove=e=>{if(nav.hasPointerCapture(e.pointerId))seek(e)};
onkeydown=e=>{if(e.target.tagName==='INPUT')return;switch(e.key){case 'ArrowLeft':pan(35,0);break;case 'ArrowRight':pan(-35,0);break;case 'ArrowUp':pan(0,35);break;case 'ArrowDown':pan(0,-35);break;case '+':case '=':distance/=1.15;break;case '-':distance*=1.15;break;default:return}e.preventDefault();update()};
for(let evt of ['pointerdown','wheel','keydown'])addEventListener(evt,()=>$('#hint').style.opacity=0,{once:true});
let last=0;function render(ms){requestAnimationFrame(render);if(ms-last<33)return;last=ms;tick(ms*.001);renderer.render(scene,camera)}requestAnimationFrame(render)
