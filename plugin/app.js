'use strict';
const $=id=>document.getElementById(id),M=FamilyModel,key='yevamos-bubbles-v2';
let panMode=false,spaceDown=false,panning=null;
let work={schemaVersion:2,cases:[M.empty()],active:0},history=[],future=[],selected=null,menuId=null,mode=null,pending=null,drag=null,cursor=null;
let recoveryBackup='',storageReadable=true;
try{
 recoveryBackup=localStorage.getItem(key+'-recovery')||'';
 const saved=localStorage.getItem(key)||localStorage.getItem('yevamos-family-builder-v1');
 if(saved){try{work=M.validate(JSON.parse(saved));}catch(e){recoveryBackup=saved;try{localStorage.setItem(key+'-recovery',saved);}catch{}$('message').textContent='לא ניתן לטעון את המקרים השמורים. הנתונים המקוריים זמינים בכלים ← גיבוי ושחזור.';}}
}catch(e){storageReadable=false;$('message').textContent='לא ניתן לגשת לשמירה המקומית. ניתן ליצור מקרים ולשמור גיבוי בקובץ.';$('storage-warning').hidden=false;$('storage-warning').textContent='השמירה המקומית אינה זמינה. הורידו גיבוי לפני סגירת החלון; לאחר חזרת הגישה יש לפתוח את התוסף מחדש.';}


const current=()=>work.cases[work.active],person=id=>current().people.find(p=>p.id===id);
function say(t){$('message').textContent=t;}
function snapshot(){future=[];history.push(JSON.stringify(work));if(history.length>50)history.shift();}
let savedState=JSON.stringify(work);
function isDirty(){return JSON.stringify(work)!==savedState;}
function save(explicit=false){
 if(explicit){
  try{
   if(!storageReadable)throw Error('Storage was unreadable at startup');
   if(recoveryBackup&&localStorage.getItem(key+'-recovery')!==recoveryBackup)localStorage.setItem(key+'-recovery',recoveryBackup);
   localStorage.setItem(key,JSON.stringify(work));savedState=JSON.stringify(work);$('storage-warning').hidden=true;
  }catch(e){$('storage-warning').hidden=false;$('storage-warning').textContent='לא ניתן לשמור במכשיר. המקרים עדיין פתוחים כאן. גיבוי נוסף זמין בכלים ← גיבוי ושחזור.';}
 }
 $('save-status').textContent=isDirty()?'יש שינויים שלא נשמרו':'כל השינויים שמורים';
 if(explicit&&!isDirty()&&$('storage-warning').hidden)$('save-status').textContent='כל המקרים נשמרו';
 if(explicit&&!$('storage-warning').hidden)$('save-status').textContent='השמירה לא הצליחה';
 $('undo').disabled=!history.length;$('redo').disabled=!future.length;
}
$('save-work').onclick=()=>save(true);
window.addEventListener('beforeunload',e=>{if(isDirty()){e.preventDefault();e.returnValue='';}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save(true);}});
function transaction(fn){const before=JSON.stringify(work);try{fn();work=M.validate(work);if(JSON.stringify(work)===before){render();return true;}future=[];history.push(before);if(history.length>50)history.shift();save();render();return true;}catch(e){work=JSON.parse(before);say(e.message);render();return false;}}
function closePopups(){$('context-menu').hidden=true;$('gender-picker').hidden=true;pending=null;}
function cancel(){mode=null;cursor=null;closePopups();$('cancel').hidden=true;$('place-preview').hidden=true;$('instruction').textContent='לחיצה ימנית על בועה להרחבת המשפחה. לחיצה כפולה לעריכה.';draw();}
function positionPopup(el,x,y){el.hidden=false;el.style.left=Math.max(8,Math.min(innerWidth-260,x))+'px';el.style.top=Math.max(8,Math.min(innerHeight-el.offsetHeight-12,y))+'px';}
function svg(tag,attrs={}){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
function point(e){const p=$('diagram').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('diagram').getScreenCTM().inverse());}
function clamp(p){return {x:Math.max(-20000,Math.min(20000,p.x)),y:Math.max(-20000,Math.min(20000,p.y))};}
function line(a,b,cls,label){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,ox=dx/d*63,oy=dy/d*63;const blocked=current().people.some(p=>{if(p.id===a.id||p.id===b.id)return false;const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/(d*d);return t>0&&t<1&&Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy))<65;});const bend=blocked?180:0;const cx=(a.x+b.x)/2-dy/d*bend,cy=(a.y+b.y)/2+dx/d*bend;const n=blocked?svg('path',{d:`M ${a.x+ox} ${a.y+oy} Q ${cx} ${cy} ${b.x-ox} ${b.y-oy}`,class:'edge '+cls}):svg('line',{x1:a.x+ox,y1:a.y+oy,x2:b.x-ox,y2:b.y-oy,class:'edge '+cls});if(cls==='parent')n.setAttribute('marker-end','url(#arrow)');$('diagram').insertBefore(n,$('diagram').querySelector('.person,.ghost'));if(label){const t=svg('text',{x:(a.x+b.x)/2-dy/d*bend/2,y:(a.y+b.y)/2+dx/d*bend/2-8,'text-anchor':'middle',class:'edge-label'});t.textContent=label;$('diagram').insertBefore(t,$('diagram').querySelector('.person,.ghost'));}}
function draw(){const board=$('diagram');board.replaceChildren();const defs=svg('defs'),marker=svg('marker',{id:'arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'});marker.append(svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'var(--color-primary)'}));defs.append(marker);board.append(defs);
 const c=current();drawEdges();updatePreview();
 for(const p of c.people){const g=svg('g',{'data-person-id':p.id,'data-sex':p.sex,class:'person '+(selected===p.id?'selected ':'')+(p.status==='deceased'?'deceased':''),transform:`translate(${p.x},${p.y})`,tabindex:0,role:'button','aria-label':p.name+' — '+(p.sex==='male'?'זכר':'נקבה')+' — '+(p.status==='alive'?'בחיים':'נפטר/ה')});g.append(svg('circle',{r:62,class:'bubble-surface'}));g.append(svg('rect',{x:-16,y:-39,width:32,height:24,rx:12,class:'sex-badge'}));if(p.status==='deceased'){g.append(svg('path',{d:'M -43 -43 L 43 43 M 43 -43 L -43 43',class:'death-cross','aria-hidden':'true'}));}const sex=svg('text',{y:-19,'text-anchor':'middle',class:'sex'});sex.textContent=p.sex==='male'?'♂':'♀';const name=svg('text',{y:6,'text-anchor':'middle',class:'name',direction:'auto'});name.textContent=p.name.length>13?p.name.slice(0,12)+'…':p.name;const status=svg('text',{y:p.notes?48:30,'text-anchor':'middle',class:'meta'});status.textContent=p.status==='deceased'?(p.sex==='male'?'† נפטר':'† נפטרה'):'';const title=svg('title');title.textContent=p.name+(p.notes?' — '+p.notes:'');g.append(sex,name,status,title);noteLines(p.notes).forEach((text,i)=>{const n=svg('text',{y:23+i*12,'text-anchor':'middle',class:'bubble-note',direction:'rtl'});n.textContent=text;g.append(n);});
 g.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();openMenu(p.id,e.clientX,e.clientY);};g.ondblclick=e=>{e.stopPropagation();edit(p.id);};g.onpointerdown=e=>{if(e.button!==0)return;e.stopPropagation();if(!mode&&(panMode||spaceDown)){beginPan(e);return;}if(mode){finish(point(e),e.clientX,e.clientY,p.id);return;}closePopups();selected=p.id;board.querySelectorAll('.person').forEach(n=>n.classList.remove('selected'));g.classList.add('selected');const q=point(e);drag={id:p.id,dx:q.x-p.x,dy:q.y-p.y,before:JSON.stringify(work),moved:false};board.setPointerCapture(e.pointerId);};g.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();edit(p.id);}if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();const b=g.getBoundingClientRect();openMenu(p.id,b.right,b.top);}};board.append(g);}
 if(!c.people.length){const t=svg('text',{x:600,y:360,'text-anchor':'middle',class:'edge-label'});t.textContent='לחצו על התרשים כדי ליצור את הבועה הראשונה.';board.append(t);}}
function noteLines(text){
 const words=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
 for(const word of words){if((line+' '+word).trim().length>17&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}
 if(line)lines.push(line);return lines.slice(0,2).map((x,i)=>x.length>17?x.slice(0,16)+'…':i===1&&lines.length>2?x.slice(0,16)+'…':x);
}
function drawEdges(){
 const board=$('diagram');board.querySelectorAll('.edge,.edge-label,.parent-junction').forEach(n=>n.remove());
 const c=current(),paired=new Set(),groups=new Map();
 for(const child of c.people){const ids=M.parents(c,child.id);if(ids.length===2){const key=ids.slice().sort().join('|');if(!groups.has(key))groups.set(key,{ids,children:[]});groups.get(key).children.push(child);for(const id of ids)paired.add(id+'|'+child.id);}}
 for(const r of c.relations)if(r.kind==='marriage'||r.kind==='parent'&&!paired.has(r.from+'|'+r.to))line(person(r.from),person(r.to),r.kind,r.kind==='marriage'?'נישואין':'');
 const put=n=>board.insertBefore(n,board.querySelector('.person,.ghost'));
 for(const group of groups.values()){
  const a=person(group.ids[0]),b=person(group.ids[1]),join={x:(a.x+b.x)/2,y:Math.max(a.y,b.y)+90};
  put(svg('path',{d:`M ${a.x} ${a.y+62} V ${join.y} H ${b.x} V ${b.y+62}`,class:'edge parent shared-parents'}));
  put(svg('circle',{cx:join.x,cy:join.y,r:4,fill:'var(--color-primary)',class:'parent-junction'}));
  for(const child of group.children){const end=child.y>=join.y?child.y-63:child.y+63,mid=(join.y+end)/2;put(svg('path',{d:`M ${join.x} ${join.y} V ${mid} H ${child.x} V ${end}`,class:'edge parent shared-child','marker-end':'url(#arrow)','data-child':child.id}));}
 }
 const candidates=[];
 for(const p of c.people){const ids=M.explicitSiblings(c,p.id);if(ids.length>1)candidates.push(ids);const kids=c.relations.filter(r=>r.kind==='parent'&&r.from===p.id).map(r=>r.to);if(kids.length>1)candidates.push(kids);}
 const seen=new Set(),groupsOfSiblings=candidates.map(ids=>[...new Set(ids)].sort()).sort((a,b)=>b.length-a.length).filter(ids=>{const key=ids.join('|');if(seen.has(key))return false;seen.add(key);return true;});
 const drawn=[];for(const ids of groupsOfSiblings){if(drawn.some(group=>ids.every(id=>group.includes(id))))continue;drawn.push(ids);const people=ids.map(person).sort((a,b)=>a.x-b.x),y=Math.max(...people.map(p=>p.y))+96,x1=people[0].x,x2=people.at(-1).x;
  put(svg('path',{d:`M ${x1} ${y} H ${x2}`,class:'edge sibling sibling-rail'}));for(const p of people)put(svg('path',{d:`M ${p.x} ${p.y+62} V ${y}`,class:'edge sibling sibling-branch','data-sibling':p.id}));
  const label=svg('text',{x:(x1+x2)/2,y:y+18,'text-anchor':'middle',class:'edge-label'});const meanings=new Set(people.slice(1).map(p=>M.siblings(c,people[0].id,p.id)));label.textContent=meanings.size===1?[...meanings][0]:'אחים ואחיות';put(label);
 }

}
function updatePreview(){
 const board=$('diagram');if(!mode||!cursor){board.querySelectorAll('.ghost,.preview-line').forEach(n=>n.remove());return;}
 const a=person(mode.source),kind=M.direction(a,cursor,mode.line);let l=board.querySelector('.preview-line'),g=board.querySelector('.ghost');
 if(!l){l=svg('line',{class:'preview-line'});board.insertBefore(l,board.querySelector('.person'));}
 for(const [k,v]of Object.entries({x1:a.x,y1:a.y,x2:cursor.x,y2:cursor.y}))l.setAttribute(k,v);
 if(!g){g=svg('g',{class:'ghost'});g.append(svg('circle',{r:62}),svg('text',{'text-anchor':'middle',y:5}));board.append(g);}
 g.setAttribute('transform',`translate(${cursor.x},${cursor.y})`);g.querySelector('text').textContent=kind==='marriage'?M.name(current(),a.sex==='male'?'female':'male'):({marriage:'בן/בת זוג',sibling:'אח/אחות',parent:'הורה',child:'ילד/ה'})[kind];
}
function noteTags(){const box=$('note-tags');box.replaceChildren();const tags=$('sex').value==='male'?['ממזר','כהן','קטן','חרש','יבם']:['ממזרת','כהנת','קטנה','יבמה','צרה'];for(const tag of tags){const b=document.createElement('button');b.type='button';b.textContent=tag;b.onclick=()=>{$('notes').value=[$('notes').value.trim(),tag].filter(Boolean).join(' · ');};box.append(b);}}
$('sex').onchange=noteTags;
function render(){const tabs=$('tabs');tabs.replaceChildren();work.cases.forEach((c,i)=>{const b=document.createElement('button');b.textContent=M.title(c);b.title=M.title(c);b.className=i===work.active?'active':'';b.setAttribute('aria-current',i===work.active?'page':'false');b.onclick=()=>{cancel();work.active=i;selected=null;save();render();};tabs.append(b);});$('export-diagram').disabled=!current().people.length;$('case-title').textContent=M.title(current());$('case-title').title=M.title(current());$('case-stats').textContent=current().people.length+' דמויות · '+current().relations.length+' קשרים';$('undo').disabled=!history.length;$('redo').disabled=!future.length;draw();applyView();renderPersonSearch();}
function openMenu(id,x,y){cancel();menuId=id;selected=id;$('menu-title').textContent=person(id).name;$('toggle-death').textContent=person(id).status==='alive'?'סימון פטירה':'סימון בחיים';positionPopup($('context-menu'),x,y);draw();}
function start(lineType){panMode=false;spaceDown=false;panning=null;drag=null;$('pan-tool').setAttribute('aria-pressed','false');$('diagram').classList.remove('pan-ready','panning');const p=person(menuId);mode={source:p.id,line:lineType};cursor={x:p.x+160,y:p.y};closePopups();$('cancel').hidden=false;$('place-preview').hidden=false;$('instruction').textContent=lineType==='family'?'למעלה — הורה, למטה — ילד/ה, לצד — אח/אחות. לחצו ובחרו זכר או נקבה.':'הזיזו את הסמן ולחצו לחיצה שמאלית כדי למקם בן/בת זוג. אפשר גם ללחוץ על הוספה במיקום המסומן או על דמות קיימת.';draw();}
$('family-line').onclick=()=>start('family');$('marriage-line').onclick=()=>start('marriage');$('cancel').onclick=cancel;
function finish(p,x,y,target){const q=clamp(p),source=mode?.source,kind=source?M.direction(person(source),q,mode.line):'person';if(source&&Math.hypot(q.x-person(source).x,q.y-person(source).y)<75){say('התרחקו מעט מהבועה שממנה התחלתם.');return;}if(target){if(kind==='marriage'&&person(target).sex===person(source).sex){say('לנישואין יש לבחור דמות מן המין השני.');return;}const ok=transaction(()=>M.connect(current(),source,target,kind));if(ok){cancel();say('הקשר נוסף למשפחה.');}return;}
 pending={point:q,source,kind};if(kind==='marriage'){create(person(source).sex==='male'?'female':'male');return;}$('choose-male').hidden=kind==='marriage'&&person(source).sex==='male';$('choose-female').hidden=kind==='marriage'&&person(source).sex==='female';$('picker-title').textContent=({person:'דמות חדשה',marriage:'בן/בת זוג',parent:'הורה חדש',child:'ילד/ה',sibling:'אח/אחות'})[kind];const label=$('other-parent-label');label.hidden=kind!=='child';$('other-parent').replaceChildren();const option=document.createElement('option');option.value='';option.textContent='לא מוגדר';$('other-parent').append(option);if(kind==='child'){for(const edge of current().relations.filter(r=>r.kind==='marriage'&&(r.from===source||r.to===source))){const id=edge.from===source?edge.to:edge.from;const o=document.createElement('option');o.value=id;o.textContent=person(id).name;$('other-parent').append(o);}}
 if(kind==='child'&&$('other-parent').options.length===2)$('other-parent').selectedIndex=1;positionPopup($('gender-picker'),x,y);}
function create(sex){if(!pending)return;const p=pending;const ok=transaction(()=>{const c=current(),n=M.person(c,sex,p.point.x,p.point.y);if(p.source)M.connect(c,p.source,n.id,p.kind,$('other-parent').value||null);selected=n.id;});if(ok){cancel();say('נוספה דמות עם שם אוטומטי.');}}
$('place-preview').onclick=()=>{if(!mode||!cursor)return;const p=$('diagram').createSVGPoint();p.x=cursor.x;p.y=cursor.y;const screen=p.matrixTransform($('diagram').getScreenCTM());finish(cursor,screen.x,screen.y);};
$('choose-male').onclick=()=>create('male');$('choose-female').onclick=()=>create('female');$('cancel-picker').onclick=cancel;
$('diagram').onpointerdown=e=>{if(e.button!==0&&e.button!==1)return;if(!mode&&(panMode||spaceDown||e.button===1)){beginPan(e);return;}if(e.button===1)return;if(!$('gender-picker').hidden)return;if(!mode){beginPan(e,true);return;}closePopups();finish(point(e),e.clientX,e.clientY);};$('diagram').ondblclick=e=>{if(mode)return;const q=point(e),p=current().people.find(p=>Math.hypot(p.x-q.x,p.y-q.y)<63);if(p)edit(p.id);};$('diagram').oncontextmenu=e=>{e.preventDefault();cancel();finish(point(e),e.clientX,e.clientY);};
$('diagram').onpointermove=e=>{if(panning){const dx=e.clientX-panning.x,dy=e.clientY-panning.y;if(Math.hypot(dx,dy)>5)panning.moved=true;if(panning.moved){const v=view();v.cx=panning.cx-dx*panning.sx;v.cy=panning.cy-dy*panning.sy;applyView();}return;}if(drag){const q=clamp({x:point(e).x-drag.dx,y:point(e).y-drag.dy}),p=person(drag.id);if(Math.hypot(p.x-q.x,p.y-q.y)>3)drag.moved=true;if(drag.moved){p.x=q.x;p.y=q.y;const g=[...$('diagram').querySelectorAll('.person')].find(n=>n.dataset.personId===p.id);g.setAttribute('transform',`translate(${p.x},${p.y})`);drawEdges();}}else if(mode&&$('gender-picker').hidden){cursor=clamp(point(e));updatePreview();}};
function endDrag(e){if(panning){const pan=panning;panning=null;$('diagram').classList.remove('panning');if(pan.moved){save();}else if(pan.createOnClick&&e?.type==='pointerup'){finish(pan.point,pan.x,pan.y);}return;}if(!drag)return;if(drag.moved){future=[];history.push(drag.before);if(history.length>50)history.shift();save();}drag=null;}
$('diagram').onpointerup=endDrag;$('diagram').onpointercancel=endDrag;$('diagram').onlostpointercapture=endDrag;
$('add').onclick=()=>{cancel();const box=$('diagram').getBoundingClientRect();const n=current().people.length;finish({x:view().cx+(n%3-1)*150/view().zoom,y:view().cy},Math.min(innerWidth-260,box.left+box.width/2),Math.min(innerHeight-220,box.top+150));};
function edit(id){cancel();menuId=id;const p=person(id);for(const field of ['name','sex','status','notes'])$(field).value=p[field];$('sex').disabled=current().relations.some(r=>r.kind==='marriage'&&(r.from===id||r.to===id));parentChoices(id);noteTags();$('edit-message').textContent='';$('edit-dialog').showModal();}
$('edit-person').onclick=()=>edit(menuId);$('close-edit').onclick=()=>$('edit-dialog').close();$('edit-form').onsubmit=e=>{e.preventDefault();const ok=transaction(()=>{const p=person(menuId);for(const field of ['name','sex','status','notes'])p[field]=$(field).value.trim();const father=$('father').value,mother=$('mother').value;current().relations=current().relations.filter(r=>!(r.kind==='parent'&&r.to===p.id));for(const id of [father,mother])if(id)M.addEdge(current(),id,p.id,'parent');});if(ok)$('edit-dialog').close();else $('edit-message').textContent=$('message').textContent;};
$('toggle-death').onclick=()=>{transaction(()=>{const p=person(menuId);p.status=p.status==='alive'?'deceased':'alive';});cancel();};$('remove-person').onclick=()=>{const id=menuId;transaction(()=>{current().people=current().people.filter(p=>p.id!==id);current().relations=current().relations.filter(r=>r.from!==id&&r.to!==id);selected=null;});cancel();say('הדמות הוסרה. ביטול פעולה יחזיר אותה.');};
$('undo').onclick=()=>{if(!history.length)return;cancel();future.push(JSON.stringify(work));work=M.validate(JSON.parse(history.pop()));selected=null;save();render();say('הפעולה האחרונה בוטלה.');};
$('redo').onclick=()=>{if(!future.length)return;cancel();history.push(JSON.stringify(work));work=M.validate(JSON.parse(future.pop()));selected=null;save();render();say('הפעולה בוצעה מחדש.');};
$('duplicate-case').onclick=()=>{cancel();const ok=transaction(()=>{if(work.cases.length>=12)throw Error('אפשר לפתוח עד 12 מקרים.');const copy=M.duplicateCase(current());work.cases.splice(work.active+1,0,copy);work.active++;selected=null;});if(ok)say('נוצר עותק של המקרה. אפשר לשנותו בלי לשנות את המקור.');};
$('new-case').onclick=()=>{cancel();transaction(()=>{if(work.cases.length>=12)throw Error('אפשר לפתוח עד 12 מקרים. סגרו מקרה כדי להוסיף עוד אחד.');work.cases.push(M.empty());work.active=work.cases.length-1;selected=null;});};$('delete-case').onclick=()=>{cancel();transaction(()=>{work.cases.splice(work.active,1);if(!work.cases.length)work.cases.push(M.empty());work.active=Math.min(work.active,work.cases.length-1);selected=null;});say('המקרה נסגר. ביטול פעולה יחזיר אותו.');};
function downloadFile(content,type,name){
 const url=URL.createObjectURL(new Blob([content],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
$('download-backup').onclick=()=>downloadFile(JSON.stringify(work,null,2),'application/json','Yevamos-Family-Backup.json');
$('export-diagram').onclick=()=>{
 cancel();const source=$('diagram'),copy=source.cloneNode(true),originals=[source,...source.querySelectorAll('*')],clones=[copy,...copy.querySelectorAll('*')];
 const properties=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','text-anchor','direction','paint-order','opacity'];
 for(let i=0;i<originals.length;i++){const style=getComputedStyle(originals[i]);for(const property of properties)clones[i].style.setProperty(property,style.getPropertyValue(property));clones[i].removeAttribute('tabindex');clones[i].removeAttribute('role');clones[i].classList.remove('selected');}
 const bounds=source.getBBox(),padding=90;copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('viewBox',`${bounds.x-padding} ${bounds.y-padding} ${bounds.width+padding*2} ${bounds.height+padding*2}`);copy.setAttribute('width',Math.ceil(bounds.width+padding*2));copy.setAttribute('height',Math.ceil(bounds.height+padding*2));
 // Resolve theme references in presentation attributes as well as computed CSS.
 for(const n of clones)for(const a of [...n.attributes])if(a.value.includes('var(')){const property=a.name;n.setAttribute(property,getComputedStyle(originals[clones.indexOf(n)]).getPropertyValue(property));}
 const background=svg('rect',{x:bounds.x-padding,y:bounds.y-padding,width:bounds.width+padding*2,height:bounds.height+padding*2,fill:getComputedStyle(source.closest('.board')).backgroundColor,stroke:'none',class:'export-background'});copy.prepend(background);
 const title=svg('title');title.textContent=M.title(current());copy.prepend(title);
 downloadFile(new XMLSerializer().serializeToString(copy),'image/svg+xml;charset=utf-8','Yevamos-Family-Diagram.svg');say('התרשים הוכן להורדה כקובץ שניתן להגדיל ולהדפיס.');
};
$('backup-file').onchange=async e=>{
 const file=e.target.files[0];e.target.value='';if(!file)return;
 try{if(file.size>5*1024*1024)throw Error('קובץ הגיבוי גדול מדי. אפשר לבחור קובץ עד 5 מגה־בייט.');const text=await file.text(),next=M.validate(JSON.parse(text));$('case-json').value=JSON.stringify(next,null,2);$('backup-message').textContent='הקובץ תקין: '+next.cases.length+' מקרים. לחצו על טעינת מקרים כדי להחליף את המקרים הפתוחים.';}
 catch(error){$('backup-message').textContent=error instanceof SyntaxError?'קובץ הגיבוי אינו מכיל נתונים תקינים. המקרים הפתוחים לא השתנו.':error.message;}
};
$('download-recovery').onclick=()=>downloadFile(recoveryBackup,'text/plain;charset=utf-8','Yevamos-Recovery.txt');
$('recover-backup').onclick=()=>{$('case-json').value=recoveryBackup;$('backup-message').textContent='אלה הנתונים המקוריים שלא נטענו. אפשר להעתיקם ולשמור אותם בנפרד.';};
$('backup').onclick=()=>{cancel();$('recover-backup').hidden=!recoveryBackup;$('download-recovery').hidden=!recoveryBackup;$('case-json').value=JSON.stringify(work,null,2);$('backup-message').textContent='';$('backup-dialog').showModal();};$('select-backup').onclick=()=>{$('case-json').focus();$('case-json').select();};$('close-backup').onclick=()=>$('backup-dialog').close();$('load-backup').onclick=()=>{try{const next=M.validate(JSON.parse($('case-json').value));snapshot();work=next;selected=null;save();render();$('backup-dialog').close();}catch(e){$('backup-message').textContent=e instanceof SyntaxError?'טקסט הגיבוי אינו תקין. בדקו שהועתק במלואו.':e.message;}};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.target.closest('input,textarea,select,dialog')){const k=e.key.toLowerCase();if(k==='z'||k==='y'){e.preventDefault();if(k==='y'||e.shiftKey)$('redo').click();else $('undo').click();return;}}if(e.key==='Escape'){cancel();panMode=false;$('pan-tool').setAttribute('aria-pressed','false');}if(['ArrowUp','ArrowDown'].includes(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,textarea,select,button,summary,a,dialog,[contenteditable],.popup')){e.preventDefault();zoom(e.key==='ArrowUp'?1.25:.8);return;}if(e.code==='Space'&&!e.target.closest('input,textarea,select,button,dialog')){e.preventDefault();spaceDown=true;}});document.addEventListener('pointerdown',e=>{if(!e.target.closest('.popup')&&!e.target.closest('svg')&&!e.target.closest('#add'))closePopups();});
function normalizePerson(text){return String(text).normalize('NFKD').replace(/[\u0591-\u05c7]/g,'').toLowerCase();}
function renderPersonSearch(){
 const query=normalizePerson($('person-search').value.trim()),list=$('person-results');list.replaceChildren();list.hidden=!query;$('clear-person-search').hidden=!query;if(!query)return;
 const found=current().people.filter(p=>normalizePerson(p.name+' '+p.notes).includes(query));
 if(!found.length){list.textContent='לא נמצאה דמות במקרה זה.';return;}
 for(const p of found){const button=document.createElement('button');button.type='button';button.textContent=p.name+(p.status==='deceased'?' · נפטר/ה':'')+(p.notes?' — '+p.notes.slice(0,80):'');button.onclick=()=>{cancel();selected=p.id;const v=view();v.cx=p.x;v.cy=p.y;v.zoom=Math.max(.9,v.zoom);$('person-search').value='';renderPersonSearch();draw();applyView();save();[...$('diagram').querySelectorAll('.person')].find(n=>n.dataset.personId===p.id)?.focus({preventScroll:true});say('התרשים ממוקד בדמות '+p.name+'.');};list.append(button);}
}
$('person-search').oninput=renderPersonSearch;$('clear-person-search').onclick=()=>{$('person-search').value='';renderPersonSearch();$('person-search').focus();};
function view(){return current().view??(current().view={cx:600,cy:400,zoom:1});}
function applyView(){const v=view(),r=$('diagram').getBoundingClientRect(),w=1200/v.zoom,h=w*r.height/Math.max(1,r.width);$('diagram').setAttribute('viewBox',`${v.cx-w/2} ${v.cy-h/2} ${w} ${h}`);$('zoom-level').textContent=Math.round(v.zoom*100)+'%';$('zoom-in').disabled=v.zoom>=M.MAX_ZOOM;$('zoom-out').disabled=v.zoom<=M.MIN_ZOOM;}
function zoom(factor,event){const anchor=event?point(event):null,v=view();v.zoom=Math.max(M.MIN_ZOOM,Math.min(M.MAX_ZOOM,v.zoom*factor));applyView();if(anchor){const q=point(event);v.cx+=anchor.x-q.x;v.cy+=anchor.y-q.y;applyView();}save();}
$('zoom-in').onclick=()=>zoom(1.25);$('zoom-out').onclick=()=>zoom(.8);$('home-view').onclick=()=>{view().zoom=1;applyView();save();};
$('fit').onclick=()=>{const people=current().people;if(!people.length){current().view={cx:600,cy:400,zoom:1};}else{const xs=people.map(p=>p.x),ys=people.map(p=>p.y),r=$('diagram').getBoundingClientRect(),w=Math.max(Math.max(...xs)-Math.min(...xs)+260,(Math.max(...ys)-Math.min(...ys)+340)*r.width/r.height);current().view={cx:(Math.max(...xs)+Math.min(...xs))/2,cy:(Math.max(...ys)+Math.min(...ys))/2+30,zoom:Math.max(M.MIN_ZOOM,Math.min(1.3,1200/w))};}applyView();save();};
$('pan-tool').onclick=()=>{cancel();panMode=!panMode;$('pan-tool').setAttribute('aria-pressed',String(panMode));$('diagram').classList.toggle('pan-ready',panMode);};
function beginPan(e,createOnClick=false){e.preventDefault();closePopups();const v=view(),matrix=$('diagram').getScreenCTM().inverse();panning={x:e.clientX,y:e.clientY,cx:v.cx,cy:v.cy,sx:matrix.a,sy:matrix.d,point:point(e),createOnClick,moved:false};$('diagram').setPointerCapture(e.pointerId);$('diagram').classList.add('panning');}
$('diagram').addEventListener('wheel',e=>{
 e.preventDefault();
 const board=$('diagram'),matrix=board.getScreenCTM();if(!matrix)return;
 const rect=board.getBoundingClientRect(),inverse=matrix.inverse();
 const dx=e.deltaX*(e.deltaMode===1?16:e.deltaMode===2?rect.width:1),dy=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?rect.height:1);
 const v=view();v.cx+=inverse.a*dx+inverse.c*dy;v.cy+=inverse.b*dx+inverse.d*dy;
 applyView();save();
},{passive:false});document.addEventListener('keyup',e=>{if(e.code==='Space')spaceDown=false;});window.addEventListener('blur',()=>{spaceDown=false;panning=null;});window.addEventListener('resize',applyView);
function descendantIds(id){const seen=new Set(),todo=[id];while(todo.length){const cur=todo.pop();for(const r of current().relations)if(r.kind==='parent'&&r.from===cur&&!seen.has(r.to)){seen.add(r.to);todo.push(r.to);}}return seen;}
function parentChoices(id){const c=current(),blocked=descendantIds(id),ids=M.parents(c,id);for(const [field,sex]of [['father','male'],['mother','female']]){const select=$(field);select.replaceChildren();const blank=document.createElement('option');blank.value='';blank.textContent='לא הוגדר';select.append(blank);for(const p of c.people.filter(p=>p.id!==id&&p.sex===sex&&!blocked.has(p.id))){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o);}select.value=ids.find(pid=>person(pid).sex===sex)||'';}}
function connectionTargets(){const source=person(menuId),kind=$('connection-kind').value;const select=$('connection-target');select.replaceChildren();for(const p of current().people.filter(p=>p.id!==menuId&&(kind!=='marriage'||p.sex!==source.sex))){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o);}}
function connectionsList(){const list=$('existing-connections');list.replaceChildren();current().relations.forEach((r,i)=>{if(r.from!==menuId&&r.to!==menuId)return;const other=person(r.from===menuId?r.to:r.from);const row=document.createElement('div');row.className='connection-row';const t=document.createElement('span');t.textContent=({marriage:'נישואין עם ',sibling:'אח/אחות של ',parent:r.from===menuId?'הורה של ':'ילד/ה של '})[r.kind]+other.name;const b=document.createElement('button');b.type='button';b.textContent='הסרה';b.onclick=()=>{transaction(()=>current().relations.splice(i,1));connectionsList();};row.append(t,b);list.append(row);});if(!list.children.length)list.textContent='אין קשרים ישירים לדמות זו.';}
$('connect-existing').onclick=()=>{cancel();$('connection-source').textContent=person(menuId).name;$('connection-message').textContent='';connectionTargets();connectionsList();$('connection-dialog').showModal();};$('connection-kind').onchange=connectionTargets;$('close-connection').onclick=()=>$('connection-dialog').close();$('connection-form').onsubmit=e=>{e.preventDefault();const target=$('connection-target').value,kind=$('connection-kind').value;if(!target){$('connection-message').textContent='אין דמות מתאימה לחיבור.';return;}const ok=transaction(()=>{if(kind==='parent')M.connect(current(),target,menuId,'parent');else if(kind==='child')M.connect(current(),menuId,target,'parent');else M.connect(current(),menuId,target,kind);});$('connection-message').textContent=ok?'הקשר נוסף.':$('message').textContent;connectionsList();};
function applyTheme(p){
 const c=p?.colorScheme;if(!c)return;
 if(p.typography?.uiFontFamily)document.documentElement.style.setProperty('--font-ui',p.typography.uiFontFamily+', system-ui, sans-serif');
 const panel=c.surfaceContainerLow||c.surfaceContainerHighest||c.surface,primary=c.primary;
 const secondary=c.secondary||primary,tertiary=c.tertiary||secondary;
 const mix=(color,amount,base=panel)=>`color-mix(in srgb, ${color} ${amount}%, ${base})`;
 const colors={primary,'on-primary':c.onPrimary,surface:c.surface,ink:c.onSurface,muted:c.onSurfaceVariant||c.onSurface,border:c.outline,panel,hover:c.surfaceContainer||panel,focus:primary,grid:c.outlineVariant||c.outline,marriage:tertiary,sibling:secondary,scrim:mix(c.scrim||c.onSurface,16,'transparent'),deceased:c.error,'deceased-surface':mix(c.error,8),male:mix(primary,6),female:mix(tertiary,6),header:c.surfaceContainerHigh||c.surfaceContainerHighest||c.surface,'header-text':c.onSurface,accent:tertiary,'accent-surface':c.surfaceContainer||panel};
 for(const [name,color]of Object.entries(colors))if(color)document.documentElement.style.setProperty('--color-'+name,color);
 document.documentElement.style.colorScheme=p.mode==='dark'?'dark':'light';
}
if(window.Otzaria){Otzaria.on('theme.changed',applyTheme);Otzaria.on('plugin.boot',p=>applyTheme(p.theme));}
render();
