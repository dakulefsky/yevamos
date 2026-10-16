(function(root){'use strict';
const male=["ראובן", "שמעון", "לוי", "יהודה", "דן", "נפתלי", "גד", "אשר", "יששכר", "זבולון", "יוסף", "בנימין", "אברהם", "יצחק", "יעקב", "משה", "אהרן", "דוד", "שלמה", "יהושע", "אליעזר"];
const female=["שרה", "רבקה", "רחל", "לאה", "מרים", "דבורה", "חנה", "אסתר", "רות", "תמר", "אביגיל", "בת שבע", "יוכבד", "נעמי", "דינה", "יעל"];
const MIN_ZOOM=.01,MAX_ZOOM=2.5;
const oldNames={"Abraham": "אברהם", "Isaac": "יצחק", "Jacob": "יעקב", "Reuven": "ראובן", "Shimon": "שמעון", "Levi": "לוי", "Judah": "יהודה", "Yosef": "יוסף", "Binyamin": "בנימין", "Moshe": "משה", "Aharon": "אהרן", "David": "דוד", "Shlomo": "שלמה", "Yehoshua": "יהושע", "Eliezer": "אליעזר", "Yitzchak": "יצחק", "Sarah": "שרה", "Rivkah": "רבקה", "Rachel": "רחל", "Leah": "לאה", "Miriam": "מרים", "Devorah": "דבורה", "Channah": "חנה", "Esther": "אסתר", "Ruth": "רות", "Tamar": "תמר", "Avigail": "אביגיל", "Batsheva": "בת שבע", "Yocheved": "יוכבד", "Naomi": "נעמי", "Dinah": "דינה", "Yael": "יעל", "Avraham": "אברהם"};
function id(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function empty(){return {id:id(),people:[],relations:[]};}
function name(c,sex){const pool=sex==='male'?male:female;for(const n of pool)if(!c.people.some(p=>p.name===n))return n;let n=2;while(c.people.some(p=>p.name===pool[0]+' '+n))n++;return pool[0]+' '+n;}
function person(c,sex,x,y){if(!['male','female'].includes(sex)||!Number.isFinite(x)||!Number.isFinite(y))throw Error('נתוני הדמות אינם תקינים.');if(c.people.length>=100)throw Error('אפשר להוסיף עד 100 דמויות בכל מקרה.');const p={id:id(),name:name(c,sex),sex,status:'alive',notes:'',x,y};c.people.push(p);return p;}
function parents(c,id){return c.relations.filter(r=>r.kind==='parent'&&r.to===id).map(r=>r.from);}
function explicitSiblings(c,id){const seen=new Set([id]),todo=[id];while(todo.length){const p=todo.pop();for(const r of c.relations)if(r.kind==='sibling'){const n=r.from===p?r.to:r.to===p?r.from:null;if(n&&!seen.has(n)){seen.add(n);todo.push(n);}}}return [...seen];}
function siblings(c,a,b){const ap=parents(c,a),bp=parents(c,b),shared=ap.filter(p=>bp.includes(p));if(shared.length===2)return 'אותם הורים';if(shared.length===1){const p=c.people.find(p=>p.id===shared[0]);const otherA=ap.filter(p=>!shared.includes(p)),otherB=bp.filter(p=>!shared.includes(p));const half=otherA.length&&otherB.length&&otherA[0]!==otherB[0];return half?(p.sex==='male'?'אחים מן האב':'אחים מן האם'):(p.sex==='male'?'אותו אב':'אותה אם');}return explicitSiblings(c,a).includes(b)?'אחים/אחיות':null;}
function addEdge(c,from,to,kind){
 if(!['parent','sibling','marriage'].includes(kind))throw Error('סוג קשר לא מוכר.');
 if(from===to)throw Error('אי אפשר לחבר דמות לעצמה.');
 const a=c.people.find(p=>p.id===from),b=c.people.find(p=>p.id===to);if(!a||!b)throw Error('הדמות אינה קיימת.');
 if(c.relations.some(r=>r.kind===kind&&((r.from===from&&r.to===to)||(kind!=='parent'&&r.from===to&&r.to===from))))return;
 if(kind==='marriage'&&a.sex===b.sex)throw Error('קו נישואין מחבר איש ואישה בלבד.');
 if(kind==='parent'){
  if(parents(c,to).some(id=>c.people.find(p=>p.id===id).sex===a.sex))throw Error('כבר הוגדר לדמות זו '+(a.sex==='male'?'אב':'אם')+'.');
  const todo=[to],seen=new Set();while(todo.length){const p=todo.pop();if(p===from)throw Error('אדם אינו יכול להיות אב קדמון של עצמו.');if(seen.has(p))continue;seen.add(p);for(const r of c.relations)if(r.kind==='parent'&&r.from===p)todo.push(r.to);}
 }
 if(c.relations.length>=1000)throw Error('יש יותר מדי קשרים במקרה הזה.');c.relations.push({from,to,kind});
}
function direction(a,b,line){if(line==='marriage')return 'marriage';const dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dy)>=Math.abs(dx))return dy<0?'parent':'child';return 'sibling';}
function connectUnsafe(c,source,target,kind,otherParent){
 if(kind==='parent'){for(const child of explicitSiblings(c,source))addEdge(c,target,child,'parent');}
 else if(kind==='child'){addEdge(c,source,target,'parent');if(otherParent)addEdge(c,otherParent,target,'parent');}
 else if(kind==='sibling'){addEdge(c,source,target,'sibling');for(const parent of parents(c,source))addEdge(c,parent,target,'parent');}
 else if(kind==='marriage')addEdge(c,source,target,'marriage');
 else throw Error('סוג קשר לא מוכר.');
}
function connect(c,source,target,kind,otherParent){
 const draft={...c,relations:c.relations.slice()};
 connectUnsafe(draft,source,target,kind,otherParent);
 c.relations.splice(0,c.relations.length,...draft.relations);
}
function duplicateCase(c){
 const copy=validateCase(JSON.parse(JSON.stringify(c))),mapping=new Map(copy.people.map(p=>[p.id,id()]));
 copy.id=id();copy.people.forEach(p=>p.id=mapping.get(p.id));
 copy.relations.forEach(r=>{r.from=mapping.get(r.from);r.to=mapping.get(r.to);});
 return copy;
}
function title(c){if(!c.people.length)return 'מקרה חדש';const get=id=>c.people.find(p=>p.id===id);const facts=[];for(const r of c.relations)if(r.kind==='marriage'){const a=get(r.from),b=get(r.to);facts.push(a.name+(a.sex==='male'?' נשוי ל':' נשואה ל')+b.name);}const parent=c.people.find(p=>c.relations.some(r=>r.kind==='parent'&&r.from===p.id));if(parent){const children=c.relations.filter(r=>r.kind==='parent'&&r.from===parent.id).map(r=>get(r.to).name);facts.push('ילדי '+parent.name+': '+children.join(', '));}if(!facts.length){if(c.people.length===2&&siblings(c,c.people[0].id,c.people[1].id))facts.push(c.people[0].name+' ו'+c.people[1].name+' — אחים/אחיות');else facts.push(c.people.map(p=>p.name).join(', '));}for(const p of c.people)if(p.status==='deceased')facts.push(p.name+(p.sex==='male'?' נפטר':' נפטרה'));return facts.join(' · ');}
function validateCase(raw){if(!raw||!Array.isArray(raw.people)||!Array.isArray(raw.relations)||raw.people.length>100||raw.relations.length>1000)throw Error('נתוני המקרה אינם תקינים.');const c={id:typeof raw.id==='string'?raw.id:id(),people:[],relations:[],view:{cx:Number.isFinite(raw.view?.cx)?raw.view.cx:600,cy:Number.isFinite(raw.view?.cy)?raw.view.cy:400,zoom:Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,Number.isFinite(raw.view?.zoom)?raw.view.zoom:1))}};const ids=new Set();for(const p of raw.people){if(!p||typeof p.id!=='string'||p.id.length>100||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>60||!['male','female'].includes(p.sex)||!['alive','deceased'].includes(p.status)||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error('נתוני הבועה אינם תקינים.');ids.add(p.id);c.people.push({id:p.id,name:oldNames[p.name]||p.name,sex:p.sex,status:p.status,notes:String(p.notes??'').slice(0,1000),x:Math.max(-20000,Math.min(20000,p.x)),y:Math.max(-20000,Math.min(20000,p.y))});}for(const r of raw.relations){if(!r||!['parent','marriage','sibling'].includes(r.kind))throw Error('נתוני הקו אינם תקינים.');addEdge(c,r.from,r.to,r.kind);}return c;}
function validate(raw){if(raw?.schemaVersion===1&&Array.isArray(raw.people)){raw={schemaVersion:2,cases:[{id:id(),people:raw.people.map(p=>({...p,x:p.x+80,y:p.y+34})),relations:raw.relations.map(r=>({...r,kind:['full','paternal','maternal'].includes(r.kind)?'sibling':r.kind}))}],active:0};}if(raw?.schemaVersion!==2||!Array.isArray(raw.cases)||!raw.cases.length||raw.cases.length>12)throw Error('יש לטעון גיבוי תקין הכולל 1–12 מקרים.');const cases=raw.cases.map(validateCase);if(new Set(cases.map(c=>c.id)).size!==cases.length)throw Error('יש מזהים כפולים למקרים.');return {schemaVersion:2,cases,active:Number.isInteger(raw.active)&&raw.active>=0&&raw.active<cases.length?raw.active:0};}
const api={MIN_ZOOM,MAX_ZOOM,id,empty,name,person,parents,explicitSiblings,siblings,addEdge,direction,connect,duplicateCase,title,validateCase,validate};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FamilyModel=api;
})(typeof window==='undefined'?globalThis:window);
