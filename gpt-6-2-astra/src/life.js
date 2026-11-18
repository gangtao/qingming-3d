const robes=[0x667b79,0x9e7260,0xb19c78,0x636b66,0xaaa48d,0x877465,0xc1af8e];
function person(x,y,z,a,role='walk'){let color=pick(robes),phase=rand(0,6),skin=0xba9977;
 let g=group(x,y,z,a,()=>{part('cone',0,.82,0,.63,1.02,.56,color);oval(0,1.14,0,.56,.67,.4,color);box(0,.99,.01,.49,.09,.37,timber);
 stick([-.16,1.41,.14],[.12,1.14,.21],.075,0xdbccaa);oval(0,1.62,0,.34,.43,.32,skin);oval(0,1.78,-.025,.37,.21,.34,dark);oval(0,1.91,-.08,.16,.18,.16,dark);
 for(let s of [-1,1]){oval(s*.075,1.65,.148,.032,.024,.022,dark);let ey=role==='watch'?1.5:1.01;stick([s*.2,1.34,0],[s*.29,ey,.23],.196,color);oval(s*.29,ey,.24,.13,.14,.14,skin);box(s*.115,.31,0,.17,.48,.19,color);oval(s*.115,.09,.07,.19,.15,.35,dark)}
 if(role==='porter'){stick([-1,1.43,.02],[1,1.43,.02],.065,timber);for(let s of [-1,1]){stick([s*.93,1.43,0],[s*.93,.74,0],.034,timber);part('pole',s*.93,.61,0,.39,.35,.39,reed)}}
 if(role==='porter'||role==='oar')part('cone',0,1.87,0,.66,.27,.66,reed);
 if(role==='oar')stick([-.35,1.3,.17],[1.1,-.6,.56],.085,timber);
 });
 g.matrix.decompose(g.position,g.quaternion,g.scale);let start=g.position.clone();
 moving.push({g,x:start.x,animate(t){let p=t*.76+phase;g.position.copy(start);g.rotation.z=.037*Math.sin(p*2);if(role==='walk'||role==='porter'){g.position.x+=Math.sin(a)*Math.sin(p*.36)*1.6;g.position.z+=Math.cos(a)*Math.sin(p*.36)*1.6;g.position.y+=Math.abs(Math.sin(p*2))*.074}else g.rotation.x=.09*Math.sin(p)}})}
function beast(x,z,a,kind){let c=kind==='camel'?0xab895f:pick([0x786450,0x978571]);let g=group(x,0,z,a,()=>{oval(0,1.08,0,.81,.88,1.8,c);stick([0,1.18,.52],[0,1.79,.94],.42,c);oval(0,1.75,1.06,.43,.48,.66,c);for(let s of [-1,1]){oval(s*.15,2.01,.95,.13,.34,.16,c);for(let k of [-1,1]){stick([s*.24,1,k*.52],[s*.26,.16,k*.65],.16,c);oval(s*.26,.1,k*.65,.19,.2,.27,dark)}}
 if(kind==='ox')for(let s of [-1,1])stick([s*.14,1.91,1.04],[s*.4,2.13,.98],.09,plaster);
 if(kind==='pig'){oval(0,1.65,1.36,.36,.29,.27,c)}
 if(kind==='camel')for(let k of [-1,1])oval(0,1.52,k*.38,.54,.59,.54,c);box(0,1.48,0,.9,.15,.64,0x866550);});
 if(kind==='dog')g.scale.set(.49,.47,.54);if(kind==='pig')g.scale.set(.72,.49,.65);
 moving.push({g,x,animate(t){g.position.y=.06*Math.abs(Math.sin(t*2+x));g.position.z=z+.34*Math.sin(t*.5+x)}})}
function cart(x,z){group(x,0,z,0,()=>{box(0,.78,0,1.5,.18,2.9,timber);oval(0,1.45,-.2,1.65,1.5,2.24,reed);for(let s of [-1,1]){stick([s*.58,.83,0],[s*.58,.65,3.3],.1,timber);let g=group(s*.86,.62,0,0,()=>{part('ring',0,0,0,1.24,1.24,1.24,dark,0,pi/2);for(let i=0;i<6;i++)box(0,0,0,.09,1.16,.06,timber,i*pi/6)});g.matrix.decompose(g.position,g.quaternion,g.scale);moving.push({g,x,animate(t){g.rotation.x=t*.3}})}});beast(x,z+3,0,'ox')}
