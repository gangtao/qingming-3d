function boat(x,z,length,a){let g=group(x,0,z,a,()=>{let beam=length*.24;
 for(let j=0;j<22;j++){let u=(j+.5)/22*2-1,w=beam*(1-Math.pow(Math.abs(u),2.6))+.12,h=.46+.8*u**4;box(u*length/2,h*.5,0,length/22+.02,h,w,timber);box(u*length/2,h+.02,0,length/22,.07,w*.95,reed);for(let s of [-1,1])box(u*length/2,h+.12,s*w*.49,length/22+.05,.21,.09,dark)}
 for(let j=0;j<12;j++){let ang=(j+.5)*pi/12;box(-.15*length,.62+Math.sin(ang)*beam*.51,Math.cos(ang)*beam*.46,length*.45,beam*.14,.1,0xb7a17a,-ang);}
 for(let i=0;i<5;i++){let xx=length*(-.37+i*.108);for(let j=0;j<8;j++)stick([xx,.62+Math.sin(j*pi/8)*beam*.53,Math.cos(j*pi/8)*beam*.48],[xx,.62+Math.sin((j+1)*pi/8)*beam*.53,Math.cos((j+1)*pi/8)*beam*.48],.07,timber)}
 stick([length*.38,.65,0],[length*.58,-.42,1.48],.16,timber);stick([-length*.42,1.13,0],[length*.37,1.58,0],.12,timber);
 });moving.push({g,x,animate(t){g.rotation.x=.025*Math.sin(t+x);g.position.y=.039*Math.sin(t+x)}});person(x+Math.cos(a)*length*.33,.60,z-Math.sin(a)*length*.33,0,'oar')}
