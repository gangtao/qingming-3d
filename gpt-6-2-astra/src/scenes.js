const signs=[];
function sign(name,x,y,z){let el=document.createElement('span');el.textContent=name;document.querySelector('#labels').append(el);signs.push({el,p:vec(x,y,z)})}
function stall(x,z){group(x,0,z,0,()=>{part('cone',0,2.96,0,3.3,1.05,3.3,pick([0xb69972,0xac8568,0xc2aa7c]));box(0,1.37,0,.1,2.74,.1,timber);box(0,.91,0,2.4,.17,1.03,timber);for(let s of [-1,1])box(s*.92,.44,0,.13,.84,.66,timber);for(let k=0;k<9;k++)oval(rand(-.95,.95),1.12,rand(-.38,.38),.29,.28,.28,pick([reed,0x916e51,0xa19e7a]))});person(x,.01,z-.85,0,'watch')}
const deck=u=>.12+3.45*(1-u*u), point=(u,h,side)=>[7*u+side,h,-12*u+side*.53];
for(let i=0;i<48;i++){let u=(i+.5)/24-1;box(...point(u,deck(u),0),6.45,.22,.64,0xa88a65,0,-.53);for(let s of [-1,1]){if(i%3===0)stick(point(u,deck(u),s*2.74),point(u,deck(u)+.88,s*2.74),.15,timber);stick(point(u,deck(u)+.91,s*2.74),point(u+1/24,deck(u+1/24)+.91,s*2.74),.135,timber);if(i%6===0){for(let k of [-2,-1,0,1,2])stick(point(u,deck(u)-.7,k),point(u+.25,deck(u+.25)-.25,k),.34,timber)}}}
for(let i=0;i<37;i++){let u=rand(-.98,.98),p=point(u,deck(u)+.14,rand(-2.25,2.25));person(...p,rand(0,6),i%3?'watch':'walk')}
for(let x of [-28,-15,-2,16,32,48,63,79])boat(x,river(x)+(x%3)*1.4,rand(8,13),rand(-.24,.24));
for(let x=-143;x<145;){let country=x>68,w=rand(4.6,8.4),d=rand(3.6,5.9);for(let side of [-1,1]){let z=road(x)+side*(6.6+d/2);if(Math.abs(z-river(x))<width(x)+d/2+1||Math.abs(x)<9||Math.abs(x+79)<5||country&&rand()<.63)continue;house(x,z,w,d,side>0?pi:0,x<0&&rand()<.36,country);if(!country&&rand()<.55)stall(x+2,road(x)+side*3.7)}x+=w+rand(1.4,4.4)}
for(let i=0;i<350;i++){let x=rand(-144,140);if(Math.abs(x)<10||x>72&&i%3)continue;person(x,.02,road(x)+rand(-2.8,2.8),pick([1.43,-1.65]),pick(['walk','walk','porter','watch']))}
for(let i=0;i<135;i++){let x=rand(-145,147),z=rand(-40,29);if(Math.abs(z-river(x))<width(x)+1||Math.abs(z-road(x))<(x>76?5:13))continue;tree(x,z,i%3===0)}
for(let k=0;k<5;k++)beast(-85+k*2.1,road(-85)+2,pi/2,'camel');cart(97,road(97));cart(-47,road(-47));
const gateX=-79,gateZ=road(gateX);
for(let s of [-1,1]){box(gateX,3.4,gateZ+s*9,5.6,6.8,12.2,0x9e927a);for(let j=0;j<16;j++){let z=gateZ+s*(3.2+j*.77);box(gateX,7.02,z,5.7,.5,.48,0xb0a38a);for(let k=0;k<10;k++)box(gateX+2.81,k*.64+.22,z+(k%2)*.33,.035,.035,.73,0x857e6b)}}
group(gateX,6.87,gateZ,pi/2,()=>house(0,0,12.7,5.6,0));box(gateX,6.54,gateZ,5.65,.76,6.2,0x9e927a);
for(const [name,x] of [['十千脚店',-11],['孙羊正店',-101],['赵太丞家',-120],['久住王员外家',-136]])sign(name,x,5,road(x)+(x===-11?6:-6));
sign('虹桥',0,5.1,0);sign('城门',gateX,11,gateZ);
// Quayside piles, mooring posts and the workers hauling from the towpath.
for(let x=13;x<73;x+=2.3){let z=river(x)-width(x)-.32;stick([x,-.1,z],[x,.52,z],.25,timber);box(x,.16,z-.49,2.4,.24,.97,reed)}
for(let i=0;i<6;i++){let x=38+i*1.4,z=river(x)-width(x)-1.2;person(x,0,z,1.2,'porter');stick([x,1.2,z],[33,1.25,river(32)],.033,timber)}
// Latticed sedan, with the bearers positioned along its poles.
group(78,0,road(78),0,()=>{for(let s of [-1,1]){box(0,1.33,s*.53,4.7,.1,.1,timber);box(0,1.64,s*.55,1.65,.59,.09,reed);for(let i=0;i<8;i++)box(-.71+i*.2,2.17,s*.55,.075,.65,.09,timber)}box(0,2.56,0,1.94,.24,1.49,0x786957);box(0,1.31,0,1.64,.15,1.1,timber)});
for(let s of [-1,1])person(78+s*2,0,road(78),pi/2,'watch');
for(let [x,k] of [[123,'donkey'],[127,'horse'],[106,'ox'],[-45,'dog'],[117,'pig']]){let z=road(x)+1.7;beast(x,z,pi/2,k);if(k==='horse'||k==='donkey')person(x,1.28,z,pi/2,'watch')}
// Field furrows and clumps of reeds along the opening stretch.
for(let x=81;x<146;x+=9){let z=road(x)-rand(14,21);for(let j=0;j<9;j++)box(x,-.004,z+j*.45,7.8,.038,.075,0xab9b75)}
for(let i=0;i<330;i++){let x=rand(9,147),z=river(x)+pick([-1,1])*(width(x)+rand(.8,1.8));for(let k=0;k<3;k++)stick([x,0,z],[x+rand(-.27,.27),rand(.32,.81),z+rand(-.18,.18)],.052,0x939372)}
// Ceremonial timber frontispiece, with projecting brackets and hanging signs.
group(-101,0,road(-101)-3.9,0,()=>{for(let s of [-1,1]){box(s*2.15,2.36,0,.28,4.72,.3,0x905943);box(s*2.15,4.52,0,1.39,.2,.57,timber);box(s*2.15,3.89,0,.88,.16,.39,timber);box(s*2.7,2.84,0,.48,1.68,.11,0x996e51)}
 for(let y of [4.06,4.56,5.06])box(0,y,0,5.9,.17,.39,timber);box(0,5.48,0,5.87,.2,1.24,0x727266);box(0,4.81,.22,2.35,.53,.14,reed)});
for(let x of [-127,-102,-52,-17,22,46]){let z=road(x)-3.6;stick([x,0,z],[x,5,z],.12,timber);stick([x,4.92,z],[x+1.15,4.92,z],.085,timber);
 let flag=group(x+.59,4.85,z,0,()=>{box(0,-.83,0,.87,1.66,.045,0xa5815d);box(0,-.19,.028,.7,.08,.035,dark)});moving.push({g:flag,x,animate(t){flag.rotation.x=.21*Math.sin(1.3*t+x)}})}
for(let k=0;k<12;k++){let x=rand(-132,132),z=river(x)-6,bird=group(x,rand(7,10),z,0,()=>{for(let s of [-1,1])stick([0,0,0],[s*.58,.19,-.12],.097,dark)});moving.push({g:bird,x,animate(t){bird.position.x=x+4*Math.sin(t*.27+k);bird.position.y=8+.49*Math.cos(t+k);bird.rotation.z=.23*Math.sin(t*3+k)}})}
for(let k=0;k<15;k++){let x=42+k*.06,y=4+k*.26,z=road(42)-8,g=group(x,y,z,0,()=>oval(0,0,0,.25+k*.033,.38,.3,0xc8c0ac));moving.push({g,x,animate(t){g.position.x=x+.23*Math.sin(t*.74+k*.36);g.position.y=y+.18*Math.sin(t*.65+k*.37)}})}
