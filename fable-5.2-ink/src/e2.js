/* ---------- 路径 ---------- */
function mkPath(pts,closed){if(closed)pts=pts.concat([pts[0]]);var cum=[0];for(var i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return{pts:pts,cum:cum,len:cum[cum.length-1],closed:!!closed};}
function pathPos(P,s,o){var c=P.cum,lo=0,hi=c.length-1;while(hi-lo>1){var m=(lo+hi)>>1;if(c[m]<=s)lo=m;else hi=m;}var a=P.pts[lo],b=P.pts[hi],L=c[hi]-c[lo]||1,f=(s-c[lo])/L;o.x=a[0]+(b[0]-a[0])*f;o.z=a[1]+(b[1]-a[1])*f;o.dx=(b[0]-a[0])/L;o.dz=(b[1]-a[1])/L;return o;}
function bump(x,c,w){return Math.max(0,1-abs(x-c)/w);}
/* ---------- 人 ---------- */
var PS=1.3,SKIN=0xd8a87a,HAIR=0x1e1915;
var ROBES=[0xefe6cf,0xe8dcc0,0xe2d6b8,0xd9ceb0,0xd6ceb8,0xcfc3a3,0xe8dcc0,0xc8b995,0xb7a074,0xa9b0a2,0x8d9a8a,0x7f8d94,0xa9785a,0xc2a98a,0x9c6a52,0xefe6cf];
var CLOTH=[0x7a8a94,0x9c5a48,0xd6ceb8,0x6f7f5c,0x8a6a8a];
function person(o){o=o||{};var g=new T.Group(),P={g:g,ph:rnd()*6.28,o:o};var robe=o.robe||pick(ROBES),leg=o.leg||pick([0x4a3b2c,0x5b4a38,0x3c3a38,0x6b5a45]),trim=dark(robe,.68),kid=(o.s||1)<.7,c=o.carry,work=!o.long&&(c==='pole'||c==='sack'||c==='pole2'||c==='hoe'||rnd()<.25);
 var hat=o.hat||pick(['cap','cap','cap','bun','straw','bun']);
 [-1,1].forEach(function(sd){var L=pivot(g,sd*.11,.8,0);cyl(L,leg,.078,.74,0,-.37,0);box(L,0x2b2018,.12,.07,.24,0,-.77,.05);if(!o.long)cyl(L,0xd6ceb8,.082,.16,0,-.6,0);if(sd<0)P.legL=L;else P.legR=L;});
 P.torso=pivot(g,0,.8,0);mk(GBody,robe,P.torso,1,1,1,0,.34,0);
 [-1,1].forEach(function(sd){var cl=box(P.torso,o.long?0xe8e0c8:trim,.045,.34,.03,sd*.045,.5,.15);cl.rotation.z=sd*.32;cl.rotation.x=-.12;});
 mk(GC,trim,P.torso,.218,.06,.218,0,.19,0);if(o.long&&hat==='cap')box(P.torso,trim,.05,.3,.03,.08,.03,.2);
 if(o.long){mk(GSkirt,robe,g,1,1.32,1,0,.47,0);mk(GC,trim,g,.3,.035,.3,0,.125,0);}else mk(GSkirt,robe,g,.94,.52,.94,0,.72,0);
 [-1,1].forEach(function(sd){var A=pivot(P.torso,sd*.25,.6,0);if(work){mk(GT,robe,A,.085,.26,.085,0,-.13,0);cyl(A,SKIN,.045,.28,0,-.39,0);}else mk(GT,robe,A,o.long?.1:.085,.5,o.long?.1:.085,0,-.25,0);sph(A,SKIN,.05,.06,.05,0,-.55,0);if(sd<0)P.armL=A;else P.armR=A;});
 cyl(P.torso,SKIN,.06,.1,0,.72,0);P.head=sph(P.torso,SKIN,.162,.178,.166,0,.86,0);
 box(P.torso,0xc4946a,.034,.05,.04,0,.85,.163);box(P.torso,0x2b2018,.03,.02,.02,-.062,.895,.148);box(P.torso,0x2b2018,.03,.02,.02,.062,.895,.148);
 if(!kid&&hat==='cap'&&rnd()<.3)box(P.torso,HAIR,.1,.1,.04,0,.745,.13);
 if(kid){sph(P.torso,HAIR,.165,.1,.165,0,.975,-.02);sph(P.torso,HAIR,.06,.06,.06,-.13,1.03,0);sph(P.torso,HAIR,.06,.06,.06,.13,1.03,0);}
 else if(hat==='cap'){sph(P.torso,HAIR,.178,.125,.178,0,.955,-.012);box(P.torso,HAIR,.13,.12,.1,0,1.04,-.075);[-1,1].forEach(function(sd){var t=box(P.torso,HAIR,.04,.17,.02,sd*.06,.9,-.19);t.rotation.x=.3;});}
 else if(hat==='straw'){mk(GC,0xc7a559,P.torso,.46,.02,.46,0,1.0,0);mk(GK,0xb8964c,P.torso,.27,.2,.27,0,1.1,0);sph(P.torso,HAIR,.165,.08,.165,0,.96,-.02);}
 else if(hat==='bun'){sph(P.torso,HAIR,.168,.1,.168,0,.975,-.02);sph(P.torso,HAIR,.075,.075,.075,0,1.095,-.03);cyl(P.torso,pick(CLOTH),.055,.04,0,1.05,-.03);}
 else if(hat==='lady'){sph(P.torso,HAIR,.178,.13,.178,0,.965,-.03);sph(P.torso,HAIR,.1,.14,.1,0,1.13,-.05);box(P.torso,0xd6b24a,.24,.02,.02,0,1.13,-.05);box(P.torso,pick(CLOTH),.52,.05,.3,0,.63,-.02);}
 if(c==='pole'){box(P.torso,0x5a4028,.05,.05,2,.12,.7,0);P.bk=[];[-.95,.95].forEach(function(z){var b=pivot(P.torso,.12,.7,z);[-1,1].forEach(function(q){var r=box(b,0x3a2e22,.015,.56,.015,q*.08,-.28,0);r.rotation.z=q*.25;});var lc=o.load||pick([0xb8985a,0x8a7a5a,0x4a4038]);mk(GT2,0x9a7a4a,b,.21,.24,.21,0,-.66,0);cyl(b,0x5a4028,.22,.03,0,-.54,0);sph(b,lc,.17,.1,.17,0,-.54,0);P.bk.push(b);});P.lock=1;P.armR.rotation.x=-2.3;P.armL.rotation.x=.2;}
 else if(c==='sack'){sph(P.torso,0xd9cfae,.32,.2,.22,.05,.86,-.12);box(P.torso,0x8a7a5a,.03,.2,.24,.05,.86,-.12);P.lock=1;P.armR.rotation.x=-2.6;P.armL.rotation.x=-2.6;}
 else if(c==='back'){box(P.torso,0x7a5a3a,.34,.5,.2,0,.4,-.25);box(P.torso,0xb8985a,.3,.2,.18,0,.75,-.25);box(P.torso,0x3a2e22,.36,.03,.22,0,.5,-.25);box(P.torso,0x5a4028,.03,.7,.03,-.16,.45,-.14);box(P.torso,0x5a4028,.03,.7,.03,.16,.45,-.14);}
 else if(c==='staff'){box(P.armR,0x4a3626,.04,1.5,.04,0,-.3,.12);}
 else if(c==='hoe'){var h=pivot(P.armR,0,-.5,0);h.rotation.x=1.2;box(h,0x5a4028,.04,1.5,.04,0,.4,0);box(h,0x3a3632,.2,.05,.26,0,1.15,.1);}
 else if(c==='pole2'){var q=pivot(P.armR,0,-.5,0);q.rotation.x=.9;box(q,0x5a4028,.05,4.2,.05,0,-.6,0);P.tool=q;}
 else if(c==='fan'){mk(GC,0xe8dcc0,P.armR,.15,.015,.15,0,-.7,.05).rotation.x=PI/2;box(P.armR,0x5a4028,.02,.14,.02,0,-.6,.05);}
 else if(c==='willow'){var w=pivot(P.armR,0,-.5,0);w.rotation.x=-1.2;box(w,0x5a4028,.03,.9,.03,0,.4,0);sph(w,0x7d8a4e,.18,.3,.18,0,.9,0);}
 g.traverse(function(m){if(m.isMesh&&m.geometry!==GBody&&m.geometry!==GSkirt)m.castShadow=false;});
 bakeParts(g,[P.legL,P.legR,P.torso,P.armL,P.armR].concat(P.bk||[]));
 if(!o.raw)g.scale.setScalar(PS*(o.s||1));
 return P;}
function walk(P,p,amp){amp=amp||1;var s=sin(p);P.legL.rotation.x=s*.6*amp;P.legR.rotation.x=-s*.6*amp;if(!P.lock){P.armL.rotation.x=-s*.45*amp;P.armR.rotation.x=s*.45*amp;}if(P.bk){P.bk[0].rotation.x=sin(p*2)*.12;P.bk[1].rotation.x=-sin(p*2)*.12;P.torso.position.y=.8+abs(s)*.03;}}
function sit(P){P.legL.rotation.x=-1.5;P.legR.rotation.x=-1.5;P.g.position.y-=.5*PS;}
var ANIM={
 idle:function(P,t){P.torso.rotation.y=sin(t*.6+P.ph)*.25;P.torso.rotation.z=sin(t*.9+P.ph)*.03;},
 wave:function(P,t){P.armR.rotation.x=-2.5+sin(t*4+P.ph)*.45;P.armR.rotation.z=sin(t*4+P.ph)*.3;P.torso.rotation.x=.12;P.torso.rotation.y=sin(t*.8+P.ph)*.2;},
 point:function(P,t){P.armR.rotation.x=-1.5+sin(t*2+P.ph)*.12;P.torso.rotation.x=.22+sin(t*1.3+P.ph)*.06;P.armL.rotation.x=-.5+sin(t*3+P.ph)*.3;},
 shout:function(P,t){var s=sin(t*3.2+P.ph);P.armR.rotation.x=-2.6+s*.4;P.armL.rotation.x=-2.6-s*.4;P.torso.rotation.x=.15;P.g.position.y=P.y0+Math.max(0,s)*.12;},
 hoe:function(P,t){var s=sin(t*2.2+P.ph);P.armR.rotation.x=P.armL.rotation.x=-1.5+s*.8;P.torso.rotation.x=.35-s*.2;},
 drink:function(P,t){P.armR.rotation.x=-1.1-Math.max(0,sin(t*.8+P.ph))*1.1;P.torso.rotation.y=sin(t*.5+P.ph)*.2;},
 talk:function(P,t){P.torso.rotation.y=sin(t*.7+P.ph)*.3;P.armL.rotation.x=-.8+sin(t*2.3+P.ph)*.4;P.armR.rotation.x=-.4+sin(t*1.7+P.ph)*.3;P.head.position.y=.86+sin(t*2+P.ph)*.01;},
 bow:function(P,t){var b=Math.max(0,sin(t*.9+P.ph));P.torso.rotation.x=b*.75;P.armL.rotation.x=P.armR.rotation.x=-1.1;},
 hammer:function(P,t){P.armR.rotation.x=-2.2+abs(sin(t*4+P.ph))*1.4;P.torso.rotation.x=.35;P.armL.rotation.x=-.9;},
 scull:function(P,t){var s=sin(t*1.7+P.ph);P.torso.rotation.y=s*.4;P.torso.rotation.x=.25+s*.1;P.armL.rotation.x=P.armR.rotation.x=-1.3+s*.3;},
 pole:function(P,t){var s=sin(t*1.3+P.ph);P.torso.rotation.x=.3+s*.25;P.armL.rotation.x=-1.2+s*.5;P.armR.rotation.x=-.9+s*.6;},
 well:function(P,t){var s=sin(t*3+P.ph);P.armL.rotation.x=-2+s*.7;P.armR.rotation.x=-2-s*.7;P.torso.rotation.x=.2;},
 tell:function(P,t){P.armL.rotation.x=-1.6+sin(t*2.6)*.9;P.armR.rotation.x=-1.6+sin(t*2.1+1)*.9;P.torso.rotation.y=sin(t*.9)*.5;},
 vend:function(P,t){P.armR.rotation.x=-1.4+sin(t*2.4+P.ph)*.5;P.armL.rotation.x=-.9+sin(t*1.9+P.ph)*.3;P.torso.rotation.y=sin(t*.6+P.ph)*.4;},
 cook:function(P,t){P.armR.rotation.x=-1.2+sin(t*6+P.ph)*.25;P.armL.rotation.x=-1;P.torso.rotation.x=.2;},
 fish:function(P,t){P.armR.rotation.x=-1.15+sin(t*.7+P.ph)*.08+Math.max(0,sin(t*.23+P.ph)-.93)*6;P.armL.rotation.x=-.6;P.torso.rotation.x=.15;},
 wash:function(P,t){var s=sin(t*5+P.ph);P.torso.rotation.x=.8+s*.06;P.armL.rotation.x=-1.2+s*.35;P.armR.rotation.x=-1.2-s*.35;},
 saw:function(P,t){var s=sin(t*5+(P.sw||0));P.armL.rotation.x=P.armR.rotation.x=-1.3+s*.4;P.torso.rotation.x=.3+s*.12;},
 lean:function(P,t){P.torso.rotation.x=.4+sin(t+P.ph)*.05;P.armL.rotation.x=P.armR.rotation.x=-1;P.torso.rotation.y=sin(t*.5+P.ph)*.25;}
};
var actors=[];
function still(P,x,z,ry,anim,y){P.g.position.set(x,(y||0)+P.g.position.y,z);P.g.rotation.y=ry||0;P.y0=P.g.position.y;scene.add(P.g);fronts.push({g:P.g,x:x,z:z,act:1});var a={g:P.g,x:x,pose:function(t){anim(P,t);}};actors.push(a);return P;}
var tmp={x:0,z:0,dx:0,dz:1};
function lerpAng(a,b,k){var d=((b-a+PI)%(2*PI)+2*PI)%(2*PI)-PI;return a+d*k;}
function mover(g,path,o){var a={g:g,path:path,s:o.s!=null?o.s:rnd()*path.len,v:o.v||1.6,dir:o.dir||1,loop:path.closed||o.loop,dist:rnd()*10,poseFn:o.pose,x:0,y:o.y||0,first:true};
 a.step=function(dt){a.s+=a.v*a.dir*dt;var L=path.len;if(a.loop){a.s=((a.s%L)+L)%L;}else if(a.s>L){a.s=L;a.dir=-1;}else if(a.s<0){a.s=0;a.dir=1;}
  pathPos(path,a.s,tmp);a.x=tmp.x;g.position.set(tmp.x,groundY(tmp.x,tmp.z)+a.y,tmp.z);var h=Math.atan2(tmp.dx*a.dir,tmp.dz*a.dir);g.rotation.y=a.first?h:lerpAng(g.rotation.y,h,Math.min(1,dt*5));a.first=false;a.dist+=a.v*dt;};
 a.pose=function(t){a.poseFn(a.dist,t);};scene.add(g);actors.push(a);a.step(0);return a;}
function walker(path,o){o=o||{};var P=person(o);var k=3.1/(o.s||1);return mover(P.g,path,{s:o.at,v:o.v||rr(1.2,2.1),dir:o.dir||(rnd()<.5?1:-1),pose:function(d){walk(P,d*k);}});}
function rndPerson(extra){var r=rnd(),o;if(r<.3)o={carry:'pole',hat:pick(['straw','bun','cap'])};else if(r<.38)o={carry:'back'};else if(r<.5)o={long:1,hat:'cap',carry:pick(['fan',null,'staff'])};else if(r<.58)o={long:1,hat:'lady',robe:pick([0xc98f7a,0xd6b98c,0x9fb0a0,0xe3d3b0])};else if(r<.64)o={s:.62,hat:'bun'};else o={};if(extra)for(var i in extra)o[i]=extra[i];return o;}

/* ---------- 牲口 ---------- */
var QK={donkey:{c:0x7d6b58,l:1.45,h:.6,w:.48,leg:.72,neck:.55,ear:.32},horse:{c:0x6a4a33,l:1.8,h:.72,w:.54,leg:1.0,neck:.8,ear:.14},white:{c:0xe6dfd0,l:1.8,h:.72,w:.54,leg:1.0,neck:.8,ear:.14},
 ox:{c:0x57463a,l:2.0,h:.9,w:.85,leg:.72,neck:.45,horn:1,low:1},camel:{c:0xb38e58,l:2.2,h:.85,w:.66,leg:1.45,neck:1.25,hump:1,ear:.1},pig:{c:0x2e2724,l:1.0,h:.5,w:.46,leg:.28,neck:.12,low:1,ear:.12},dog:{c:0x9a7a52,l:.75,h:.28,w:.24,leg:.36,neck:.26,ear:.1},goat:{c:0xe6dfd0,l:.85,h:.38,w:.3,leg:.42,neck:.3,ear:.12}};
function quad(kind,o){o=o||{};var k=QK[kind],g=new T.Group(),Q={g:g,k:k,legs:[],ph:rnd()*6},top=k.leg+k.h,dk=dark(k.c,.6),eq=kind==='donkey'||kind==='horse'||kind==='white';
 sph(g,k.c,k.w*.56,k.h*.6,k.l*.56,0,k.leg+k.h/2,0);sph(g,k.c,k.w*.5,k.h*.55,k.l*.3,0,k.leg+k.h*.52,k.l*.28);sph(g,k.c,k.w*.52,k.h*.56,k.l*.3,0,k.leg+k.h*.54,-k.l*.28);
 [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(function(s){var p=pivot(g,s[0]*k.w*.3,k.leg+.06,s[1]*k.l*.37);mk(GT2,k.c,p,.1,k.leg*.55,.1,0,-k.leg*.27,0);cyl(p,k.c,.05,k.leg*.42,0,-k.leg*.74,0);cyl(p,kind==='pig'?k.c:0x2b2420,.062,.08,0,-k.leg-.02,0);Q.legs.push(p);});
 Q.neck=pivot(g,0,top-.15,k.l/2-.08);Q.neck.rotation.x=k.low?1.35:.75;mk(GT,k.c,Q.neck,.16,k.neck,.15,0,k.neck/2,0);if(eq)box(Q.neck,kind==='white'?0xcfc8b8:0x2e2622,.05,k.neck*.9,.1,0,k.neck*.5,-.15);
 var hd=pivot(Q.neck,0,k.neck,0);hd.rotation.x=k.low?.1:.55;box(hd,k.c,.22,.3,.26,0,.08,0);mk(GT,k.c,hd,.11,.26,.12,0,.34,0);box(hd,dk,.12,.05,.1,0,.46,0);box(hd,0x1e1915,.24,.03,.03,0,.14,.1);
 if(k.ear){[-1,1].forEach(function(s){var e=box(hd,k.c,.07,k.ear,.05,s*.1,-.02,-.2);e.rotation.x=-.9;e.rotation.z=s*.3;});}
 if(k.horn){[-1,1].forEach(function(s){var h=box(hd,0xd8cfb8,.06,.3,.06,s*.18,.0,-.2);h.rotation.z=-s*1.0;h.rotation.x=-.5;});sph(g,k.c,k.w*.4,k.h*.3,k.l*.2,0,top+.02,k.l*.3);}
 if(kind==='pig'){cyl(hd,0xc9a08a,.07,.05,0,.49,0);}
 Q.tail=pivot(g,0,top-.1,-k.l/2);mk(GT,kind==='pig'||kind==='white'?dark(k.c,.85):0x2e2622,Q.tail,.045,k.leg*.7,.045,0,-k.leg*.35,-.04);
 if(k.hump){sph(g,k.c,.3,.36,.36,0,top+.12,.38);sph(g,k.c,.3,.36,.36,0,top+.12,-.38);sph(g,dk,.2,.3,.3,0,top-.35,k.l*.42);}
 if(o.pack||o.rider){box(g,pick(CLOTH),k.w+.06,.05,k.l*.5,0,top-.02,0);box(g,0x3a2e22,k.w+.08,.04,.06,0,top-.25,.15);}
 if(o.pack==='charcoal'){[-1,1].forEach(function(s){mk(GT2,0x7a6a4a,g,.27,.66,.27,s*.44,top-.12,0);cyl(g,0x2b2623,.25,.1,s*.44,top+.22,0);});box(g,0x5a4028,1.0,.05,.08,0,top+.06,0);}
 if(o.pack==='goods'){box(g,0x8a6a44,.95,.5,1.0,0,top+.3,0);box(g,0xb9a26a,.8,.3,.8,0,top+.7,0);box(g,0x3a2e22,.97,.03,.06,0,top+.3,.3);box(g,0x3a2e22,.97,.03,.06,0,top+.3,-.3);box(g,0x3a2e22,.06,.84,.03,0,top+.44,.5);}
 if(o.pack==='bales'){[-1,1].forEach(function(s){box(g,0xc9b88a,.36,.6,.9,s*.5,top-.1,0);box(g,0x8a7a5a,.38,.04,.92,s*.5,top-.1,0);box(g,0x8a7a5a,.38,.62,.04,s*.5,top-.1,.2);});}
 if(o.rider){var R=person(Object.assign({raw:1},o.rider));R.g.position.set(0,top-.72,-.05);R.legL.rotation.x=R.legR.rotation.x=-.9;R.legL.rotation.z=-.5;R.legR.rotation.z=.5;R.armL.rotation.x=R.armR.rotation.x=-.9;g.add(R.g);Q.rider=R;if(eq){box(Q.neck,0x3a2e22,.02,.02,k.neck*1.1,0,k.neck*.8,.3).castShadow=false;}}
 bakeParts(g,Q.legs.concat([Q.neck,Q.tail]));
 g.scale.setScalar(o.raw?1:PS);return Q;}
function trot(Q,p){var s=sin(p)*.5;Q.legs[0].rotation.x=s;Q.legs[3].rotation.x=s;Q.legs[1].rotation.x=-s;Q.legs[2].rotation.x=-s;Q.neck.rotation.x=(Q.k.low?1.35:.75)+sin(p*2)*.05;Q.tail.rotation.x=.2+sin(p*.7)*.25;if(Q.rider)Q.rider.torso.rotation.x=sin(p*2)*.04;}
function beast(kind,path,o){o=o||{};var Q=quad(kind,o),k=2.6/Math.sqrt(Q.k.leg/.72);return{Q:Q,a:mover(Q.g,path,{s:o.at,v:o.v||1.5,dir:o.dir||1,pose:function(d){trot(Q,d*k);}})};}

/* ---------- 轿子、车 ---------- */
function sedanBody(g,y,willow){/* 轿子：四柱、格子窗、起翘的顶 */
 box(g,0x7a5a3a,1.0,.08,1.1,0,y,0);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(s){box(g,0x5e3d2a,.07,1.25,.07,s[0]*.46,y+.62,s[1]*.5);});
 box(g,0x8a5a3a,.94,.5,1.02,0,y+.27,0);[-1,1].forEach(function(s){box(g,MT(0xffffff,'lattice'),.03,.6,.9,s*.47,y+.86,0).castShadow=false;});box(g,0x8a5a3a,.92,.66,.04,0,y+.86,-.5);
 box(g,0x9c5a48,.86,.64,.03,0,y+.86,.5);box(g,0x33251b,.4,.62,.035,0,y+.86,.505);
 box(g,0x5d6263,1.2,.06,1.3,0,y+1.27,0);mk(GK4,0x5d6263,g,.82,.36,.88,0,y+1.47,0);sph(g,0xd6b24a,.07,.09,.07,0,y+1.7,0);
 [-1,1].forEach(function(s){box(g,0x4a3626,.06,.06,3.5,s*.52,y+.32,0);});
 if(willow)for(var i=0;i<7;i++)sph(g,0x7d8a4e,.14,.34,.14,rr(-.5,.5),y+1.5,rr(-.55,.55));}
function sedan(path,o){var g=new T.Group(),A=person({raw:1,hat:'cap',robe:0x6f7f8c}),B=person({raw:1,hat:'cap',robe:0x6f7f8c});A.g.position.z=1.5;B.g.position.z=-1.5;g.add(A.g);g.add(B.g);
 A.lock=B.lock=1;A.armL.rotation.x=A.armR.rotation.x=.25;B.armL.rotation.x=B.armR.rotation.x=-.25;sedanBody(g,.42,o.willow);bakeParts(g,[]);
 g.scale.setScalar(PS);return mover(g,path,{s:o.at,v:o.v||1.5,dir:o.dir||1,pose:function(d){walk(A,d*3.1);walk(B,d*3.1+PI);}});}
function wheel(g,r,x,y,z){var w=pivot(g,x,y,z);var rim=mk(GTor,0x4a3626,w,r*.94,r*.94,1.6,0,0,0);rim.rotation.y=PI/2;for(var i=0;i<6;i++){var b=box(w,0x8a6a44,.06,r*1.84,.07,0,0,0);b.rotation.x=i*PI/6;}var hub=mk(GC,0x4a3626,w,r*.16,.3,r*.16,0,0,0);hub.rotation.z=PI/2;bakeParts(w,[]);return w;}
function cartBody(g,r){/* 棕盖车：车厢、拱形的席篷、两只大轮 */r=r||.92;var y=r+.12;
 box(g,0x7a5a3a,1.5,.12,2.9,0,y,0);[-1,1].forEach(function(s){box(g,0x6a4a33,.08,.5,2.9,s*.74,y+.3,0);for(var i=0;i<5;i++)box(g,0x4a3626,.09,.56,.07,s*.75,y+.3,-1.3+i*.65).castShadow=false;box(g,0x4a3626,.08,.08,2.8,s*.62,y-.05,2.6);});
 var cv=mk(GC,MT(0xb39a5c,'mat'),g,.8,2.9,1.05,0,y+.5,0);cv.rotation.x=PI/2;for(var k=0;k<5;k++){var rb=mk(GC,0x6a5238,g,.82,.07,1.08,0,y+.5,-1.3+k*.65);rb.rotation.x=PI/2;rb.castShadow=false;}
 box(g,0x8f7a45,1.7,.07,.5,0,y+1.5,1.5).rotation.x=.25;box(g,0x8f7a45,1.7,.07,.5,0,y+1.5,-1.5).rotation.x=-.25;box(g,0x4a3626,1.5,.07,.07,0,y-.05,3.85);
 return[wheel(g,r,-.98,r,-.15),wheel(g,r,.98,r,-.15)];}
function oxcart(path,o){var g=new T.Group(),Q=quad(o.kind||'ox',{raw:1}),Q2=null;Q.g.position.set(o.kind?0:-.42,0,3.1);g.add(Q.g);if(!o.kind){Q2=quad('ox',{raw:1});Q2.g.position.set(.5,0,3.2);g.add(Q2.g);}
 var ws=cartBody(g),D=person({raw:1,hat:'straw',carry:'staff'});D.g.position.set(1.6,0,3.2);g.add(D.g);bakeParts(g,[]);
 g.scale.setScalar(PS);return mover(g,path,{s:o.at,v:o.v||1.0,dir:o.dir||1,pose:function(d){trot(Q,d*2.4);if(Q2)trot(Q2,d*2.4+1);walk(D,d*3.1);ws[0].rotation.x=ws[1].rotation.x=d/(.92*PS);}});}
function barrow(path,o){/* 串车：中间一只大轮，两边搭货，后面的人扶着车把推 */var g=new T.Group(),D=person({raw:1,hat:'bun'});D.g.position.z=-1.25;D.lock=1;D.armL.rotation.x=D.armR.rotation.x=-1.0;D.torso.rotation.x=.3;g.add(D.g);
 var w=wheel(g,.62,0,.62,.3);box(g,0x7a5a3a,1.1,.08,1.7,0,1.0,.3);[-1,1].forEach(function(s){box(g,0x4a3626,.06,.06,2.9,s*.42,.98,-.1);box(g,0x5a4028,.06,.5,.06,s*.3,.75,.3).castShadow=false;mk(GT2,0x9a7a4a,g,.34,.5,.34,s*.56,1.05,.4);sph(g,pick([0xd9cfae,0xb8985a,0x8a7a5a]),.3,.2,.3,s*.56,1.34,.4);});
 box(g,0xc9b88a,.6,.4,1.2,0,1.3,.3);box(g,0x3a2e22,.62,.03,.06,0,1.3,.6);box(g,0x8f7a45,.9,.05,1.5,0,1.56,.3);
 var Q=null;if(o.donkey){Q=quad('donkey',{raw:1});Q.g.position.z=3.1;g.add(Q.g);box(g,0x3a2e22,.03,.03,1.5,-.2,1.0,2.1);box(g,0x3a2e22,.03,.03,1.5,.2,1.0,2.1);}
 bakeParts(g,[]);
 g.scale.setScalar(PS);return mover(g,path,{s:o.at,v:o.v||1.1,dir:o.dir||1,pose:function(d){walk(D,d*3.1);w.rotation.x=d/(.62*PS);if(Q)trot(Q,d*2.6);}});}

/* ---------- 房屋、树、摊子 ---------- */
var TILE=[0x6f685e,0x777063,0x676057],THATCH=[0xb39a5c,0xa98f55,0xbfa468],WALLS=[0xd9c9a3,0xcdb98f,0xc4ad84,0x9a7650];
var slopeC={};
function slopeGeo(W,H,rhT,ex){var k=[W.toFixed(1),H.toFixed(1),rhT.toFixed(2)].join('|');if(slopeC[k])return slopeC[k];var n=5,P=[],U=[],I=[];for(var i=0;i<=n;i++){var s=i/n,z=H*s,y=rhT*Math.pow(1-s,ex);P.push(-W/2,y,z,W/2,y,z);U.push(0,z/1.1,W/.62,z/1.1);if(i<n){var a=i*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}}
 var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();return slopeC[k]=g;}
/* 屋顶：两坡微微下凹的瓦面（有瓦垄）、屋脊两头起翘、山墙、檐口 */
function roof(g,w,d,y,rh,c,over){over=over||1.6;var th=THATCH.indexOf(c)>=0,W=w+over*.7,H=d/2+over/2,ex=th?1.05:1.22,s0=(d/2)/H,drop0=Math.pow(1-s0,ex),rhT=rh/(1-drop0),drop=rhT*drop0,R=pivot(g,0,y-drop,0);
 var mt=MT(c,th?'thatch':'tile',1),geo=slopeGeo(W,H,rhT,ex);
 [0,PI].forEach(function(ry){var m=new T.Mesh(geo,mt);m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;R.add(m);});
 [-1,1].forEach(function(sx){var gb=mk(GR,th?0xc4ad84:0xd9c9a3,g,d*.9,rh*.84,.12,sx*(w/2+.02),y,0);gb.rotation.y=PI/2;gb.castShadow=false;
  if(!th){[-1,1].forEach(function(sz){var bb=box(g,0x4a3626,.1,.16,Math.hypot(H,rhT)*.96,sx*(W/2-.04),y-drop+rhT*.42,sz*H*.5);bb.rotation.x=sz*Math.atan2(rhT*.84,H);bb.castShadow=false;});}});
 if(th){var rd=mk(GC,0x8f7a45,g,.3,W+.2,.3,0,y+rh+.05,0);rd.rotation.z=PI/2;[-1,1].forEach(function(sz){box(g,0x8f7a45,W,.22,.3,0,y-drop+.06,sz*(H-.1)).castShadow=false;});}
 else{box(g,0x3d3a38,W-.2,.3,.34,0,y+rh+.08,0);[-1,1].forEach(function(sx){var e=box(g,0x3d3a38,.3,.62,.3,sx*(W/2-.12),y+rh+.3,0);e.rotation.z=-sx*.45;e.castShadow=false;});
  [-1,1].forEach(function(sz){box(g,0x4a3626,W,.1,.14,0,y-drop-.02,sz*(H-.06)).castShadow=false;});}
 return R;}
/* 收分的方台：下大上小，城台、土墙都用它 */
var frC={};function frust(p,c,wb,db,wt,dt,h,x,y,z){var k=(wt/wb).toFixed(3)+'|'+(dt/db).toFixed(3),g=frC[k];if(!g){g=new T.BoxGeometry(1,1,1);var a=g.attributes.position;for(var i=0;i<a.count;i++)if(a.getY(i)>0){a.setX(i,a.getX(i)*wt/wb);a.setZ(i,a.getZ(i)*dt/db);}g.computeVertexNormals();frC[k]=g;}return mk(g,c,p,wb,h,db,x,y+h/2,z);}
/* 庑殿顶：四面坡，坡面微凹，一条正脊四条垂脊，脊端鸱吻，檐角起翘 */
function hipRoof(p,w,d,y,rh,c){var a=w/2,b=d/2,r=a-b*.8,n=6,P=[],U=[],I=[],R=pivot(p,0,y,0);
 function patch(e0,e1,r0,r1){var base=P.length/3,W0=Math.hypot(e1[0]-e0[0],e1[1]-e0[1]),SL=Math.hypot(b,rh)*1.05;for(var i=0;i<=n;i++){var s=i/n,yy=rh*Math.pow(s,1.3)+(1-s)*(1-s)*.0;[[e0,r0,0],[e1,r1,1]].forEach(function(q){var x=q[0][0]+(q[1][0]-q[0][0])*s,z=q[0][1]+(q[1][1]-q[0][1])*s;P.push(x,yy,z);U.push(q[2]*W0/.62*(1-s*.0)+(q[2]?0:0),s*SL/1.1);});if(i<n){var k=base+i*2;I.push(k,k+1,k+2,k+1,k+3,k+2);}}}
 patch([-a,b],[a,b],[-r,0],[r,0]);patch([a,-b],[-a,-b],[r,0],[-r,0]);patch([a,b],[a,-b],[r,0],[r,0]);patch([-a,-b],[-a,b],[-r,0],[-r,0]);
 var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();var m=new T.Mesh(g,MT(c,'tile',1));m.castShadow=true;m.receiveShadow=true;R.add(m);
 box(R,0x3d3a38,r*2+.5,.5,.5,0,rh+.15,0);
 [-1,1].forEach(function(sx){box(R,0x2f2c2a,.6,1.3,.7,sx*(r+.1),rh+.75,0);box(R,0x2f2c2a,.45,.6,.45,sx*(r-.25),rh+1.5,0);
  [-1,1].forEach(function(sz){var dx=sx*(a-r),dz=sz*b,L=Math.hypot(dx,dz,rh),h=pivot(R,sx*r+dx/2,rh*.46,dz/2);h.rotation.order='YXZ';h.rotation.y=Math.atan2(dx,dz);h.rotation.x=Math.atan2(rh,Math.hypot(dx,dz));box(h,0x3d3a38,.36,.36,L*.98,0,0,0).castShadow=false;
   var t=pivot(R,sx*a,0,sz*b);t.rotation.y=Math.atan2(sx,sz);var up=box(t,0x3d3a38,.3,.3,1.6,0,.3,.5);up.rotation.x=-.5;up.castShadow=false;});});
 [-1,1].forEach(function(s){box(R,0x4a3626,w,.16,.2,0,-.06,s*b).castShadow=false;box(R,0x4a3626,.2,.16,d,s*a,-.06,0).castShadow=false;});
 return R;}
var FRAME=0x5e3d2a;
function house(g,w,d,h,o){o=o||{};var th=!!o.thatch,tile=th?pick(THATCH):pick(TILE),wall=o.wall||pick(WALLS),n=Math.max(2,Math.round(w/2.7)),bw=w/n,i;
 box(g,MT(wall,'wash'),w,h,d,0,h/2,0);
 if(!th){box(g,0x9a927e,w+.9,.26,d+.9,0,.13,0).castShadow=false;
  for(i=0;i<=n;i++){var cx=-w/2+i*bw;box(g,MT(FRAME,'wood'),.2,h,.2,cx,h/2,d/2+.03).castShadow=false;box(g,MT(FRAME,'wood'),.2,h,.2,cx,h/2,-d/2-.03).castShadow=false;}
  [-1,1].forEach(function(s){box(g,MT(FRAME,'wood'),.18,h,.2,s*(w/2+.02),h/2,0).castShadow=false;box(g,MT(FRAME,'wood'),.14,.2,d,s*(w/2+.02),h-.12,0).castShadow=false;box(g,MT(FRAME,'wood'),.12,.16,d,s*(w/2+.02),h*.42,0).castShadow=false;box(g,MT(FRAME,'wood'),w+.1,.22,.14,0,h-.12,s*(d/2+.04)).castShadow=false;});}
 if(o.open){box(g,0x33251b,w-.5,h*.76,.2,0,h*.4,d/2-.06);box(g,MT(0xffffff,'lattice'),w-.5,h*.16,.08,0,h*.86,d/2+.05).castShadow=false;
  box(g,0x8a6a44,w*.5,.8,.6,-w*.15,.4,d/2+.9);box(g,0x7a5a3a,bw*.7,.08,.5,w*.28,.82,d/2-.6);}
 else if(th){if(o.door!==0){box(g,0x4a3626,1.0,h*.66,.1,o.dx||0,h*.33,d/2+.03);box(g,0x33251b,.7,.5,.08,(o.dx||0)+w*.28,h*.6,d/2+.03);}}
 else{var db=o.door===0?-1:Math.floor(n/2);for(i=0;i<n;i++){var x=-w/2+(i+.5)*bw;
   if(i===db){box(g,0x3b2b1f,bw-.5,h*.7,.08,x,h*.35,d/2+.04).castShadow=false;box(g,MT(FRAME,'wood'),.06,h*.7,.1,x,h*.35,d/2+.06).castShadow=false;}
   else{box(g,MT(0xffffff,'lattice'),bw-.34,h*.4,.06,x,h*.63,d/2+.04).castShadow=false;box(g,0x8a6a48,bw-.3,h*.36,.06,x,h*.2,d/2+.04).castShadow=false;box(g,MT(FRAME,'wood'),bw,.14,.12,x,h*.41,d/2+.05).castShadow=false;}}}
 if(!o.noRoof)roof(g,w,d,h,o.rh||(th?2.2:1.9),tile,1.8);
 if(o.awn){var a=box(g,o.awnC||0xcdbb8c,w*.9,.1,2.2,0,h*.82,d/2+1.0);a.rotation.x=.3;box(g,0x5a4028,.1,h*.7,.1,-w*.4,h*.35,d/2+1.9);box(g,0x5a4028,.1,h*.7,.1,w*.4,h*.35,d/2+1.9);}
 return g;}
/* 两层的酒楼：腰檐、平坐栏杆、楼上一排格子窗 */
function house2(g,w,d,o){o=o||{};house(g,w,d,3.6,{open:1,wall:o.wall,noRoof:1});roof(g,w+.6,d+.6,3.6,.8,pick(TILE),2.6);
 var u=pivot(g,0,3.9,0),uw=w-1.6,ud=d-1.6,n=Math.max(3,Math.round(uw/2.6)),i;
 box(u,0x7a4a34,w-.6,.5,d-.6,0,.45,0);[-1,1].forEach(function(s){box(u,0x9c4a34,w-.6,.1,.1,0,1.25,s*(d/2-.32)).castShadow=false;box(u,0x9c4a34,.1,.1,d-.6,s*(w/2-.32),1.25,0).castShadow=false;for(var k=0;k<=n*2;k++)box(u,0x9c4a34,.08,.6,.08,-w/2+.32+k*(w-.64)/(n*2),.98,s*(d/2-.32)).castShadow=false;});
 box(u,MT(0xd9c9a3,'wash'),uw,2.6,ud,0,2.0,0);
 for(i=0;i<=n;i++){var cx=-uw/2+i*uw/n;[-1,1].forEach(function(s){box(u,MT(FRAME,'wood'),.18,2.6,.18,cx,2.0,s*(ud/2+.02)).castShadow=false;});if(i<n)[-1,1].forEach(function(s){box(u,MT(0xffffff,'lattice'),uw/n-.3,1.3,.06,cx+uw/n/2,2.2,s*(ud/2+.03)).castShadow=false;});}
 [-1,1].forEach(function(s){box(u,MT(FRAME,'wood'),uw+.1,.2,.14,0,3.2,s*(ud/2+.03)).castShadow=false;});
 roof(u,uw,ud,3.3,2.3,pick(TILE),2.6);return u;}
var flags=[],sways=[];
function flag(g,x,z,h,c,txt){cyl(g,0x4a3626,.07,h,x,h/2,z);var f=pivot(g,x,h-.9,z);box(f,c||0xe8e0c8,.06,1.5,.9,0,0,.5);flags.push(f);return f;}
function huanmen(g,x,z,w){/* 彩楼欢门 */var c=0x9c4a34;for(var i=0;i<4;i++){var px=x-w/2+i*w/3;cyl(g,c,.1,6.5,px,3.25,z);}for(var j=0;j<4;j++)box(g,c,w+.6,.12,.12,x,2.6+j*1.2,z);
 for(var k=0;k<3;k++){var d1=box(g,c,.1,4.4,.1,x-w/3+k*w/3,4.4,z);d1.rotation.z=.6;var d2=box(g,c,.1,4.4,.1,x-w/3+k*w/3,4.4,z);d2.rotation.z=-.6;}
 mk(GK4,0x9c4a34,g,1.2,1.4,1.2,x,7.2,z);for(var m=0;m<5;m++)sph(g,pick([0xb8483a,0xd6b24a,0x5f7f8c]),.22,.22,.22,x-w/2+m*w/4,6.3,z+.1);}
function parasol(g,x,z,c){c=c||pick([0xe6dcc0,0xc9d0c4,0xd8c08a]);cyl(g,0x4a3626,.05,2.7,x,1.35,z);var p=mk(GK,c,g,1.75,.42,1.75,x,2.82,z);mk(GC,dark(c,.8),g,1.76,.03,1.76,x,2.61,z).castShadow=false;for(var i=0;i<5;i++){var r=box(g,0x5a4028,3.4,.025,.03,x,2.6,z);r.rotation.y=i*PI/5;r.castShadow=false;}sph(g,0x4a3626,.06,.08,.06,x,3.06,z);return p;}
function stall(x,z,ry,o){o=o||{};var g=at(x,z,ry);box(g,0x8a6a44,2.1,.08,1.05,0,.86,0);[-1,1].forEach(function(s){var l1=box(g,0x5a4028,.07,.95,.07,s*.85,.42,0);l1.rotation.x=.45;var l2=box(g,0x5a4028,.07,.95,.07,s*.85,.42,0);l2.rotation.x=-.45;});box(g,pick(CLOTH),2.0,.03,.5,0,.91,.2).castShadow=false;
 for(var i=0;i<7;i++){var px=rr(-.85,.85),pz=rr(-.35,.35),t=rnd();if(t<.35){cyl(g,0x9a7a4a,.14,.1,px,.95,pz);sph(g,pick([0xb8483a,0xd6b24a,0x7c8a66]),.11,.07,.11,px,1.02,pz);}else if(t<.6)mk(GT2,pick([0x8a5a3a,0x4a4038,0xe8dcc0]),g,.09,.2,.09,px,1.0,pz);else mk(pick([GB,GS]),pick([0xb8483a,0xd6b24a,0x7c8a66,0xe8dcc0]),g,.12,.1,.12,px,.97,pz);}
 if(o.par!==0)parasol(g,0,-.5);var a=ry||0;still(person({hat:pick(['cap','bun'])}),x-sin(a)*1.1,z-cos(a)*1.1,a,o.anim||ANIM.vend);return g;}
var BARK=0x66543c,TWIG=0x57543a;
var TWM=new T.LineBasicMaterial({color:0x3a2e1e,transparent:true,opacity:.78,depthWrite:false}),TWM2=new T.LineBasicMaterial({color:0x56553a,transparent:true,opacity:.8,depthWrite:false});
/* 一丛柳条：每根先斜着向上挑出去，随后越来越软，末梢几乎垂直挂下来；全丛合成一个线段网格，像毛笔一根根勾的 */
function spray(p,n,len,droop,spread,mat){var P=[],a=new T.Vector3(),d=new T.Vector3(),NS=9;for(var k=0;k<n;k++){var az=rnd()*6.283,el=rr(.2,1.2)*(spread||1),L=len*rr(.65,1.2),st=L/NS,bend=rr(-.06,.06);a.set(rr(-.15,.15),rr(-.05,.1),rr(-.15,.15));d.set(cos(az)*sin(el),cos(el),sin(az)*sin(el));
  for(var q=0;q<NS;q++){P.push(a.x,a.y,a.z);d.y-=droop*(.25+q*q*.085);d.x+=rr(-.07,.07)+bend*d.z;d.z+=rr(-.07,.07)-bend*d.x;d.normalize();a.addScaledVector(d,st*(q<3?1.15:.92));P.push(a.x,a.y,a.z);}}
 var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));var l=new T.LineSegments(g,mat||TWM);p.add(l);return l;}
function limb(p,len,rad,depth,max){mk(GT,BARK,p,rad,len,rad,0,len/2,0);if(depth>=max){spray(pivot(p,0,len,0),10,len*1.35,.035,.8);return;}var n=depth?2:3;for(var i=0;i<n;i++){var c=pivot(p,0,len*rr(.62,1),0);c.rotation.set(rr(-.8,.8),rnd()*6.28,rr(-.8,.8));limb(c,len*rr(.62,.76),rad*.55,depth+1,max);}}
function tree(x,z,kind,s,force){if(!force&&(inRiver(x,z,1)||nearRoad(x,z)<7))return new T.Group();var g=at(x,z,rnd()*6);s=s||rr(1.6,2.3);g.scale.setScalar(s);
 if(kind==='bare'){var t0=pivot(g,0,0,0);t0.rotation.set(rr(-.1,.1),0,rr(-.14,.14));limb(t0,rr(2.6,3.4),.15,0,3);}
 else{/* 老柳：粗矮歪扭、长满树瘤的干，砍过头的枝顶上喷出一丛丛细长的柳条 */
  var tk=pivot(g,0,0,0),lean=rr(-.3,.3),th=0,seg=tk,r=.42;tk.rotation.set(rr(-.12,.12),0,lean);
  mk(GC,BARK,tk,.56,.24,.56,0,.12,0);
  for(var q=0;q<3;q++){var h=rr(.7,1);mk(GT,BARK,seg,r,h,r,0,h/2,0);sph(seg,BARK,r*.72,r*.6,r*.72,rr(-.5,.5)*r,rr(.2,h-.1),rr(-.5,.5)*r);sph(seg,BARK,r*.5,r*.45,r*.5,rr(-.6,.6)*r,rr(.1,h),rr(-.6,.6)*r);seg=pivot(seg,0,h,0);seg.rotation.set(rr(-.3,.3),0,rr(-.34,.34)-lean*.4);r*=.82;}
  sph(seg,BARK,r*1.25,r*1.05,r*1.25,0,0,0);
  var cr=seg,nl=3+Math.floor(rnd()*3);
  spray(cr,30,rr(2.8,3.6),.11,.85);
  for(var i=0;i<nl;i++){var lp=pivot(cr,0,0,0);lp.rotation.set(rr(-.95,.95),rnd()*6.28,rr(-.95,.95));var ll=rr(.7,1.4);mk(GT,BARK,lp,r*.62,ll,r*.62,0,ll/2,0);sph(lp,BARK,r*.8,r*.7,r*.8,0,ll,0);spray(pivot(lp,0,ll,0),30,rr(2.6,3.5),.12,.9,rnd()<.5?TWM2:TWM);}
  var fm=M(0x8f9a6a,{transparent:true,opacity:.11,depthWrite:false});mk(GS,fm,cr,rr(2.4,3),rr(1.5,1.9),rr(2.4,3),0,rr(.9,1.4),0,true);
  sways.push({g:cr,ph:rnd()*6});}
 return g;}
function seatGroup(x,z,n){var g=at(x,z,0);box(g,0x7a5a3a,1.5,.1,1.5,0,.75,0);box(g,0x5a4028,.15,.75,.15,0,.37,0);for(var i=0;i<n;i++){var a=i/n*6.28+.4;var px=x+cos(a)*1.3,pz=z+sin(a)*1.3;box(g,0x6a4a33,.5,.45,.5,cos(a)*1.3,.22,sin(a)*1.3);var P=person(rndPerson({carry:null}));sit(P);P.g.position.y+=.25;still(P,px,pz,Math.atan2(-cos(a),-sin(a)),pick([ANIM.drink,ANIM.talk,ANIM.drink]));}}

function lane(off,s0,s1){var pts=[];if(s0>s1){var t=s0;s0=s1;s1=t;}for(var s=s0;s<=s1;s+=2){roadAt(s,0,ro2);var k=off*squeeze(ro2.x,ro2.z);pts.push([ro2.x-ro2.dz*k,ro2.z+ro2.dx*k]);}return mkPath(pts);}
function quadStill(kind,x,z,ry,o){var Q=quad(kind,o);Q.g.position.set(x,(o&&o.y)||0,z);Q.g.rotation.y=ry||0;scene.add(Q.g);fronts.push({g:Q.g,x:x,z:z,act:1});var base=Q.neck.rotation.x;if(o&&o.lie){Q.legs.forEach(function(l){l.rotation.x=1.4;});Q.g.position.y=-Q.k.leg*PS*.75;}
 actors.push({g:Q.g,x:x,pose:function(t){Q.neck.rotation.x=base+sin(t*.8+Q.ph)*.14+(o&&o.bray?Math.max(0,sin(t*1.3))*-.5:0);Q.tail.rotation.x=.2+sin(t*2.2+Q.ph)*.35;}});return Q;}
