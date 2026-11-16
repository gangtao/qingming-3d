/* ---------- 画风：白描淡彩。先把场景画到离屏，再勾墨线、罩绢色、叠绢纹 ---------- */
var INK=(function(){
 var rt=null,quad,qscene=new T.Scene(),qcam=new T.OrthographicCamera(-1,1,1,-1,0,1),on=true;
 var mat=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tC:{value:null},tD:{value:null},px:{value:new T.Vector2(1,1)},nf:{value:new T.Vector2(2,1100)},lw:{value:1},ek:{value:1},seed:{value:0}},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:[
  'precision highp float;varying vec2 v;uniform sampler2D tC,tD;uniform vec2 px,nf;uniform float lw,ek;',
  'float lin(vec2 u){float d=texture2D(tD,u).x;float z=d*2.-1.;return 2.*nf.x*nf.y/(nf.y+nf.x-z*(nf.y-nf.x));}',
  'float lum(vec2 u){return dot(texture2D(tC,u).rgb,vec3(.3,.59,.11));}',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
  'void main(){vec2 o=px*lw;',
  ' float d=lin(v),dl=lin(v-vec2(o.x,0.)),dr=lin(v+vec2(o.x,0.)),du=lin(v+vec2(0.,o.y)),dd=lin(v-vec2(0.,o.y));',
  /* 深度的二阶差分：物体轮廓和折线处大，平坦斜面上为零 */
  ' float e1=(abs(dl+dr-2.*d)+abs(du+dd-2.*d))/d;float eD=smoothstep(.006,.022,e1);',
  ' float l=lum(v),gx=lum(v+vec2(o.x,0.))-lum(v-vec2(o.x,0.)),gy=lum(v+vec2(0.,o.y))-lum(v-vec2(0.,o.y));',
  ' float eC=smoothstep(.07,.26,length(vec2(gx,gy)));',
  ' float far=smoothstep(600.,220.,d*ek);float edge=clamp(eD*.9+eC*.5,0.,1.)*mix(.35,1.,far)*ek;',
  ' vec3 c=texture2D(tC,v).rgb;float g=dot(c,vec3(.3,.59,.11));',
  ' vec3 silk=vec3(.76,.635,.42);',
  /* 淡彩：压低彩度，再整体罩一层绢色 */
  ' c=mix(vec3(g),c,.56);c=mix(c,silk*(.38+g*.86),.5);',
  ' c=mix(c,vec3(.17,.12,.08),edge*.82);',
  /* 绢的经纬和年久的斑驳 */
  ' vec2 fp=gl_FragCoord.xy;float weave=.5+.25*sin(fp.x*1.9)+.25*sin(fp.y*1.9);',
  ' float st=vn(v*vec2(5.,2.4)+3.)*.6+vn(v*vec2(17.,9.))*.4;',
  ' c*=mix(.98,1.012,weave)*mix(.87,1.06,st);',
  ' vec2 q=v-.5;c*=1.-dot(q,q)*.28;',
  ' gl_FragColor=vec4(c,1.);}'].join('\n')});
 quad=new T.Mesh(new T.PlaneGeometry(2,2),mat);quad.frustumCulled=false;qscene.add(quad);
 function size(w,h,dpr){var s=Math.max(1.5,Math.min(2,dpr)),W=Math.round(w*s),H=Math.round(h*s);
  if(rt)rt.dispose();rt=new T.WebGLRenderTarget(W,H,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat});
  rt.depthTexture=new T.DepthTexture(W,H);rt.depthTexture.type=T.UnsignedIntType;
  mat.uniforms.tC.value=rt.texture;mat.uniforms.tD.value=rt.depthTexture;mat.uniforms.px.value.set(1/W,1/H);mat.uniforms.lw.value=s*.75;}
 function render(scene,cam){if(!on||!rt){renderer.setRenderTarget(null);renderer.render(scene,cam);return;}
  mat.uniforms.nf.value.set(cam.near,cam.far);renderer.setRenderTarget(rt);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.render(qscene,qcam);}
 return{k:function(v){mat.uniforms.ek.value=v;},size:size,render:render,set:function(v){on=v;},get:function(){return on;}};
})();
