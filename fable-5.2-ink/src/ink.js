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
  'void main(){',
  /* 手抖：取样位置按低频噪声挪一点，直线就不再像尺子画的；线的粗细也跟着变 */
  ' vec2 w=v+(vec2(vn(v*vec2(140.,80.)),vn(v*vec2(140.,80.)+9.))-.5)*px*1.8;',
  ' float lv=.62+.85*vn(v*vec2(52.,30.)+2.);vec2 o=px*lw*lv;',
  ' float d=lin(w),dl=lin(w-vec2(o.x,0.)),dr=lin(w+vec2(o.x,0.)),du=lin(w+vec2(0.,o.y)),dd=lin(w-vec2(0.,o.y));',
  /* 深度的二阶差分：物体轮廓和折线处大，平坦斜面上为零 */
  ' float e1=(abs(dl+dr-2.*d)+abs(du+dd-2.*d))/d;float eD=smoothstep(.006,.022,e1);',
  ' float l=lum(w),gx=lum(w+vec2(o.x,0.))-lum(w-vec2(o.x,0.)),gy=lum(w+vec2(0.,o.y))-lum(w-vec2(0.,o.y));',
  ' float eC=smoothstep(.07,.26,length(vec2(gx,gy)));',
  /* 飞白：墨线时浓时淡，偶尔断一下 */
  ' float dry=.7+.4*vn(v*vec2(230.,130.)+5.);',
  ' float far=smoothstep(600.,220.,d*ek);float edge=clamp(eD*.9+eC*.5,0.,1.)*mix(.35,1.,far)*ek*dry;',
  /* 积墨：轮廓外侧一圈淡淡的晕，像颜料在线边沉下来 */
  ' vec2 o3=o*3.2;float e3=(abs(lin(w-vec2(o3.x,0.))+lin(w+vec2(o3.x,0.))-2.*d)+abs(lin(w+vec2(0.,o3.y))+lin(w-vec2(0.,o3.y))-2.*d))/d;float pool=smoothstep(.02,.12,e3)*ek;',
  ' vec3 c=texture2D(tC,w).rgb;float g=dot(c,vec3(.3,.59,.11));',
  ' vec3 silk=vec3(.76,.635,.42);',
  /* 淡彩：压低彩度，再整体罩一层绢色 */
  ' c=mix(vec3(g),c,.56);c=mix(c,silk*(.38+g*.86),.5);',
    ' c*=1.-pool*.13;',
  ' c=mix(c,vec3(.17,.12,.08),edge*.82);',
  ' c*=.975;',
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
