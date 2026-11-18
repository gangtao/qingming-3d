function house(x,z,w,d,ang=0,upper=false,straw=false){group(x,0,z,ang,()=>{
 shade(.4,.15,w+1.9,d+1.7);let h=upper?6:3.1,roof=straw?0xaf956c:pick([0x77756a,0x807c6e,0x77786d]);
 box(0,.19,0,w+.5,.42,d+.45,0xa89a82);box(0,h/2+.25,-.25,w,h-.1,d-.65,plaster);
 for(let j=0;j<=4;j++){let a=(j/4-.5)*w;box(a,h/2+.2,d/2,.16,h,.19,timber);
 if(j<4){let cx=a+w/8;box(cx,1.85,d/2-.45,w/4-.25,1.62,.09,dark);for(let k=-2;k<=2;k++)box(cx+k*w/28,2,d/2-.38,.045,1.25,.06,reed);box(cx,2.12,d/2-.34,w/4-.18,.065,.08,reed)}}
 for(let side of [-1,1]){let run=d*.5+.7;for(let n=0;n<4;n++){let u=n/4,v=(n+1)/4,top=s=>h+.25+1.85*(1-s)**1.48,dy=top(u)-top(v),len=Math.hypot(run/4,dy),tilt=side*Math.atan2(dy,run/4),cz=side*run*(u+v)/2,cy=(top(u)+top(v))/2;box(0,cy,cz,w+1.45,.18,len+.07,roof,tilt);
 for(let a=-w/2-.55;a<w/2+.66;a+=straw?.25:.38)box(a,cy+.105,cz,.07,.075,len+.04,straw?reed:0x918d7c,tilt)}}
 box(0,h+2.17,0,w+1.65,.23,.26,dark);
 for(let s of [-1,1])stick([s*(w/2+.65),h+2.17,0],[s*(w/2+1),h+2.48,0],.19,dark);
 if(upper){box(0,3.36,d/2+.45,w+1,.25,1.7,timber);box(0,4.18,d/2+1.2,w+.9,.12,.12,timber);for(let a=-w/2;a<=w/2;a+=.47)box(a,3.8,d/2+1.2,.075,.8,.075,timber)}
})}
function tree(x,z,willow=false){group(x,0,z,rand(0,6),()=>{shade(.35,.2,2,1.2);let h=rand(2.9,4.8);stick([0,0,0],[.5,h*.63,.2],.75,timber);stick([.5,h*.63,.2],[.18,h,0],.57,timber);
 for(let j=0;j<8;j++){let a=rand(0,6.28),r=rand(1,2.8),xx=r*Math.cos(a),zz=r*Math.sin(a),yy=h+rand(.7,2.6);stick([.18,h-.6,0],[xx,yy,zz],.22,timber);for(let k=0;k<4;k++){let X=xx+rand(-1,1),Z=zz+rand(-1,1),Y=yy+rand(.4,1.45);stick([xx,yy,zz],[X,Y,Z],.085,timber);if(willow){stick([X,Y,Z],[X+.22,Y-1.6,Z+.12],.05,0x828264);oval(X+.17,Y-.9,Z+.08,.28,1.45,.31,0x969b73)}}}})}
