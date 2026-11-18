/* ---------- 画风：白描淡彩。先把场景画到离屏，再勾墨线、罩绢色、叠绢纹 ---------- */
var INK=(function(){
 var rt=null,quad,qscene=new T.Scene(),qcam=new T.OrthographicCamera(-1,1,1,-1,0,1),on=true;
 var mat=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{tC:{value:null},tD:{value:null},px:{value:new T.Vector2(1,1)},nf:{value:new T.Vector2(2,1100)},lw:{value:1},ek:{value:1},pmI:{value:new T.Matrix4()},cmW:{value:new T.Matrix4()},seed:{value:0}},
  vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:[
  'precision highp float;varying vec2 v;uniform sampler2D tC,tD;uniform vec2 px,nf;uniform float lw,ek;uniform mat4 pmI,cmW;',
  'float lin(vec2 u){float d=texture2D(tD,u).x;float z=d*2.-1.;return 2.*nf.x*nf.y/(nf.y+nf.x-z*(nf.y-nf.x));}',
  'float lum(vec2 u){return dot(texture2D(tC,u).rgb,vec3(.3,.59,.11));}',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
  'void main(){',
  /* 画绢的质地要“长”在画上：从每个像素的视线求出它落在地面上的位置 G，斑驳、绢纹、墨线的抖动都按 G 取噪声，
     镜头平移、缩放、转动时它们跟着画面一起走，不会像一层贴在屏幕上的膜 */
  ' vec4 a4=pmI*vec4(v*2.-1.,-1.,1.);a4/=a4.w;vec4 b4=pmI*vec4(v*2.-1.,1.,1.);b4/=b4.w;',
  ' vec3 A=(cmW*a4).xyz,dir=normalize((cmW*b4).xyz-A);float tg=dir.y<-.02?min(-A.y/dir.y,5000.):5000.;vec2 G=A.xz+dir.xz*tg;',
  /* 手抖：取样位置挪一点，直线就不再像尺子画的；线的粗细也跟着变 */
  ' vec2 w=v+(vec2(vn(G*2.3),vn(G*2.3+9.))-.5)*px*3.4;',
  ' float lv=.62+.85*vn(G*.85+2.);vec2 o=px*lw*lv;',
  ' float d=lin(w),dl=lin(w-vec2(o.x,0.)),dr=lin(w+vec2(o.x,0.)),du=lin(w+vec2(0.,o.y)),dd=lin(w-vec2(0.,o.y));',
  /* 深度的二阶差分：物体轮廓和折线处大，平坦斜面上为零 */
  ' float e1=(abs(dl+dr-2.*d)+abs(du+dd-2.*d))/d;float eD=smoothstep(.006,.022,e1);',
  ' float l=lum(w),gx=lum(w+vec2(o.x,0.))-lum(w-vec2(o.x,0.)),gy=lum(w+vec2(0.,o.y))-lum(w-vec2(0.,o.y));',
  ' float eC=smoothstep(.07,.26,length(vec2(gx,gy)));',
  /* 飞白：墨线时浓时淡，偶尔断一下 */
  ' float dry=.55+.6*vn(G*3.6+5.);',
  ' float far=smoothstep(600.,220.,d*ek);float edge=clamp(eD*.9+eC*.5,0.,1.)*mix(.35,1.,far)*ek*dry;',
  /* 积墨：轮廓外侧一圈淡淡的晕 */
  ' vec2 o3=o*3.2;float e3=(abs(lin(w-vec2(o3.x,0.))+lin(w+vec2(o3.x,0.))-2.*d)+abs(lin(w+vec2(0.,o3.y))+lin(w-vec2(0.,o3.y))-2.*d))/d;float pool=smoothstep(.02,.12,e3)*ek;',
  ' vec3 c=texture2D(tC,w).rgb;float g=dot(c,vec3(.3,.59,.11));',
  ' vec3 silk=vec3(.76,.635,.42);',
  /* 淡彩：压低彩度，再整体罩一层绢色 */
  ' c=mix(vec3(g),c,.56);c=mix(c,silk*(.38+g*.86),.5);',
  /* 细处（颗粒、经纬）拉远后比一个像素还小，会闪，按距离淡出 */
  /* 贴近地平线的地方视线几乎擦着地面，纹理会被压成横条，按视线的俯角淡出 */
  ' float gz=clamp(-dir.y*3.2-.12,0.,1.);',
  ' float fine=clamp((ek-.4)/.6,0.,1.);',
  ' c*=1.+((vn(G*.028+11.)-.5)*.085+(vn(G*1.7)-.5)*.07*fine)*gz;',
  ' c*=1.-pool*.13;',
  ' c=mix(c,vec3(.17,.12,.08),edge*.82);',
  /* 绢的经纬和年久的斑驳 */
  ' float weave=.5+.25*sin(G.x*34.)+.25*sin(G.y*34.);',
  ' float st=vn(G*vec2(.011,.02)+3.)*.6+vn(G*vec2(.04,.07))*.4;',
  ' c*=mix(1.,mix(.98,1.012,weave),fine*gz)*mix(.965,mix(.87,1.06,st),gz);',
  ' c*=.975;',
  ' gl_FragColor=vec4(c,1.);}'].join('\n')});
 quad=new T.Mesh(new T.PlaneGeometry(2,2),mat);quad.frustumCulled=false;qscene.add(quad);
 function size(w,h,dpr){var s=Math.max(1.5,Math.min(2,dpr)),W=Math.round(w*s),H=Math.round(h*s);
  if(rt)rt.dispose();rt=new T.WebGLRenderTarget(W,H,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat});
  rt.depthTexture=new T.DepthTexture(W,H);rt.depthTexture.type=T.UnsignedIntType;
  mat.uniforms.tC.value=rt.texture;mat.uniforms.tD.value=rt.depthTexture;mat.uniforms.px.value.set(1/W,1/H);mat.uniforms.lw.value=s*.75;}
 function render(scene,cam){if(!on||!rt){renderer.setRenderTarget(null);renderer.render(scene,cam);return;}
  mat.uniforms.nf.value.set(cam.near,cam.far);mat.uniforms.pmI.value.copy(cam.projectionMatrixInverse);mat.uniforms.cmW.value.copy(cam.matrixWorld);renderer.setRenderTarget(rt);renderer.render(scene,cam);renderer.setRenderTarget(null);renderer.render(qscene,qcam);}
 return{k:function(v){mat.uniforms.ek.value=v;},size:size,render:render,set:function(v){on=v;},get:function(){return on;}};
})();
