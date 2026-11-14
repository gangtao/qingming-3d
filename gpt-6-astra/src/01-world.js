/* 散点透视到平面坐标的人工转译。x 与原卷左右一致，z 正值为画面下方。 */
Q.world={length:1000,depth:148,bridge:{x:512,z:-5,angle:-.49,length:93,width:10.4},gate:{x:184,z:17}};
Q.landmarks=[
 {name:'郊野春色',x:903,z:0,tile:'01—04'},
 {name:'汴河漕运',x:675,z:-7,tile:'05—07'},
 {name:'虹桥',x:512,z:-5,tile:'08—09'},
 {name:'十千脚店',x:461,z:43,tile:'09'},
 {name:'城外街衢',x:318,z:26,tile:'10—12'},
 {name:'城门',x:184,z:17,tile:'13—14'},
 {name:'孙羊正店',x:132,z:-13,tile:'14—15'},
 {name:'久住王员外家',x:89,z:46,tile:'15'},
 {name:'赵太丞家',x:29,z:-22,tile:'16'}
];
// 各节点均按本地原卷图块顺序记录；不是等距生成的街道。
Q.riverNodes=[ [350,-112,22],[380,-84,26],[410,-54,29],[445,-31,33],[490,-13,36],[535,-5,34],[585,4,34],[635,12,32],[685,24,30],[735,38,29],[780,57,25],[810,87,21] ];
Q.riverAt=x=>{let a=Q.riverNodes[0],b=Q.riverNodes[1];for(let i=1;i<Q.riverNodes.length;i++){b=Q.riverNodes[i];if(x<=b[0])break;a=b;}const t=Q.clamp((x-a[0])/(b[0]-a[0]),0,1);return {z:a[1]+(b[1]-a[1])*t,w:a[2]+(b[2]-a[2])*t};};
Q.roadNodes=[[10,20],[100,16],[180,17],[230,20],[290,29],[345,32],[405,43],[461,45],[490,38]];
Q.northRoad=[[535,-51],[580,-43],[630,-34],[680,-23],[730,-10],[770,-14],[810,-8],[860,6],[920,8],[985,1]];
Q.samplePath=(nodes,t)=>{let lens=[],sum=0;for(let i=1;i<nodes.length;i++){sum+=Math.hypot(nodes[i][0]-nodes[i-1][0],nodes[i][1]-nodes[i-1][1]);lens.push(sum);}let d=Q.clamp(t,0,1)*sum,i=0;while(i<lens.length-1&&d>lens[i])i++;const a=nodes[i],b=nodes[i+1],u=(d-(lens[i-1]||0))/(lens[i]-(lens[i-1]||0));return {x:a[0]+(b[0]-a[0])*u,z:a[1]+(b[1]-a[1])*u,angle:Math.atan2(b[0]-a[0],b[1]-a[1])};};
Q.ribbon=(nodes,width,color,y=.02)=>{const pts=[],idx=[];for(let i=0;i<nodes.length;i++){const a=nodes[Math.max(0,i-1)],b=nodes[Math.min(nodes.length-1,i+1)],d=Q.v(b[0]-a[0],0,b[1]-a[1]).normalize();pts.push(nodes[i][0]-d.z*width/2,y,nodes[i][1]+d.x*width/2,nodes[i][0]+d.z*width/2,y,nodes[i][1]-d.x*width/2);if(i<nodes.length-1){let k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setIndex(idx);g.computeVertexNormals();const m=new T.Mesh(g,Q.material(color));Q.bake(m);};
Q.buildTerrain=()=>{
 const g=Q.group();Q.box(g,0xe0d1ae,500,-1.25,0,1055,2.4,190,'earth');Q.bake(g);
 // 河面带不规则河岸；抬高陆地边缘，船底位于水下。
 const pos=[],uv=[],indices=[];const bank=Q.group();
 for(let x=350,i=0;x<=810;x+=2,i++){let r=Q.riverAt(x);const wiggle=Math.sin(x*.13)*.65+Math.sin(x*.37)*.28;
  pos.push(x,-.04,r.z-r.w+wiggle,x,-.04,r.z+r.w+wiggle);uv.push(x/20,0,x/20,1);
  if(i){let k=2*i;indices.push(k-2,k-1,k,k-1,k+1,k);}
  if(i%2===0){for(const side of [-1,1]){const z=r.z+side*r.w+wiggle;Q.ball(bank,0xb7a782,x,-.25,z,2.8,.75,1.25);if(i%4===0)Q.beam(bank,[x,-.02,z],[x+3.9,-.02,z+.2],.065,0x8d8164);}}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 Q.waterMaterial=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec3 p; void main(){p=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'precision highp float; varying vec3 p; uniform float time; void main(){float a=sin(p.x*3.2+p.z*15.0+sin(p.x*.47)+time*.65);float b=sin(p.x*.12+p.z*.41);float line=smoothstep(.94,1.,a)*.035;vec3 c=vec3(.62,.62,.51)+b*.016+line;gl_FragColor=vec4(c,1.);}',side:T.DoubleSide});
 const water=new T.Mesh(geo,Q.waterMaterial);water.receiveShadow=false;Q.scene.add(water);Q.bake(bank);
 Q.ribbon(Q.roadNodes,13,0xd7c7a4,.025);Q.ribbon(Q.northRoad,11,0xd5c5a1,.025);
 Q.ribbon([[89,-64],[92,-28],[100,15],[99,65]],11,0xd9c9a6,.028);
 Q.ribbon([[315,-65],[317,-14],[319,30],[312,73]],8,0xd4c39e,.028);
 // 卷首田畦、阡陌、浅沟；不把汴河延伸成贯穿全卷的直线。
 const fields=Q.group();
 for(let i=0;i<19;i++){let x=795+i*10;Q.beam(fields,[x,.05,-64],[x+4,.05,-30],.09,0xada07c);}
 for(const z of [-62,-49,-35])Q.beam(fields,[792,.045,z],[982,.045,z],.09,0xada07c);
 for(let i=0;i<550;i++){const x=Q.rand(7,993),z=Q.rand(-83,83);if(x>350&&x<810){const r=Q.riverAt(x);if(Math.abs(z-r.z)<r.w+2)continue;}
  if(Q.rand()<.5)Q.beam(fields,[x,.04,z],[x+Q.rand(.25,1.8),.04,z+.05],.018,0xa49572);
  else Q.ball(fields,0xb4a37f,x,.09,z,Q.rand(.09,.35),.09,Q.rand(.1,.3));
 }
 Q.bake(fields);
};
Q.bridgeHeight=t=>.7+7.2*Math.sin(PI*Q.clamp(t,0,1));
Q.bridgePoint=(t,offset=0)=>{const b=Q.world.bridge,u=(t-.5)*b.length;return {x:b.x+u*Math.sin(b.angle)+offset*Math.cos(b.angle),z:b.z+u*Math.cos(b.angle)-offset*Math.sin(b.angle),y:Q.bridgeHeight(t)};};
Q.buildBridge=()=>{
 const b=Q.world.bridge,g=Q.group(null,b.x,0,b.z,b.angle),L=b.length,W=b.width;
 // 无桥墩的叠梁木拱，三组相贯梁，不以石拱替代原画虹桥。
 for(let side of [-1,0,1]){const x=side*(W/2-.3);for(let i=0;i<14;i++){let a=i/14,c=(i+1)/14;Q.beam(g,[x,Q.bridgeHeight(a)-.65,(a-.5)*L],[x,Q.bridgeHeight(c)-.65,(c-.5)*L],.32,0x806b4b,'wood');}
  for(let i=0;i<7;i++){let a=i/7,c=(i+1.5)/7;c=Math.min(c,1);Q.beam(g,[x,Q.bridgeHeight(a)-1.25,(a-.5)*L],[x,Q.bridgeHeight(c)-1.25,(c-.5)*L],.29,0x6c5b42,'wood');}
 }
 for(let i=0;i<=100;i++){const t=i/100,y=Q.bridgeHeight(t);const m=Q.box(g,i%3?0xb5a27c:0xa8936d,0,y-.12,(t-.5)*L,W,.25,L/100-.04,'wood');m.rotation.x=Math.atan(7.2*PI/L*Math.cos(PI*t));}
 for(let i=0;i<=34;i++){const t=i/34,z=(t-.5)*L,y=Q.bridgeHeight(t);
  Q.beam(g,[-W/2-.3,y-.4,z],[W/2+.3,y-.4,z],.16,0x5f513d);
  for(let side of [-1,1]){const x=side*W/2;Q.beam(g,[x,y,z],[x,y+1.3,z],.105,0x6b5940);Q.ball(g,0x756247,x,y+1.34,z,.15);if(i<34){const t2=(i+1)/34,y2=Q.bridgeHeight(t2),z2=(t2-.5)*L;for(let h of [.42,1.15])Q.beam(g,[x,y+h,z],[x,y2+h,z2],.075,0x79664b);}}
 }
 Q.bake(g);Q.label('虹桥',b.x,12,b.z,'main');
};
