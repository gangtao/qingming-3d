const river=x=> 2-65/(1+Math.exp((x+33)/9))+3*Math.sin(x*.065);
const width=x=>(8.5+2*Math.cos(x*.043))/(1+2.8/(1+Math.exp(-(x-84)/6)));
const road=x=>x>13?river(x)-width(x)-5:x< -13?9+3*Math.sin(x*.065):x*-.94;
box(0,-1.2,-5,340,2,165,0xcabb96);
function ribbon(fn,half,color,y){let pos=[],idx=[];for(let x=-159;x<=159;x++){let z=fn(x),w=half(x);pos.push(x,y,z-w,x,y,z+w);let i=pos.length/3-2;if(i && (fn!==road || Math.abs(z-river(x))>=width(x)))idx.push(i-2,i-1,i,i,i-1,i+1)}let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();scene.add(new T.Mesh(g,new T.MeshLambertMaterial({color,side:T.DoubleSide})))}
ribbon(river,x=>width(x)+.85,0xa29270,-.12);ribbon(river,width,0x899e95,-.075);ribbon(road,()=>3.4,0xdac9a5,-.04);
for(let i=0;i<2800;i++){let x=rand(-156,156),z=river(x)+rand(-1,1)*width(x);box(x,-.052,z,rand(.22,2.3),.012,.034,pick([0xb9bfaa,0x909e8e]))}
for(let i=0;i<3600;i++){let x=rand(-150,150),z=rand(-55,38);if(Math.abs(z-river(x))<width(x)+1)continue;box(x,-.025,z,rand(.08,.55),.012,.04,0xb6a682)}
