/* ---------- 题签 ---------- */
function label(txt,x,y,z){var e=document.createElement('div');e.className='tag';e.textContent=txt;tagsEl.appendChild(e);tags.push({e:e,p:new T.Vector3(x,y,z),on:false});}
function labelOn(txt,obj,h){var e=document.createElement('div');e.className='tag';e.textContent=txt;tagsEl.appendChild(e);tags.push({e:e,obj:obj,h:h,p:new T.Vector3(),on:false});}
