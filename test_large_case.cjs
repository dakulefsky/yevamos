const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,executablePath}=require('./browser_support.cjs'),M=require('./plugin/model.js');
(async()=>{
 const family=M.empty(),father=M.person(family,'male',600,180),mother=M.person(family,'female',950,180);
 M.connect(family,father.id,mother.id,'marriage');
 for(let i=0;i<98;i++){const child=M.person(family,i%2?'female':'male',200+(i%14)*240,600+Math.floor(i/14)*230);child.notes='הערת מקרה '.repeat(80).slice(0,1000);M.connect(family,father.id,child.id,'child',mother.id);}
 const seed={schemaVersion:2,cases:[family,...Array.from({length:11},()=>M.duplicateCase(family))],active:0};
 const server=http.createServer((req,res)=>{const file=path.join(__dirname,'plugin',req.url==='/'?'index.html':req.url);try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.locator('#file-tools').evaluate(n=>n.open=true);await page.click('#backup');await page.setInputFiles('#backup-file',{name:'twelve-cases.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(seed))});await page.waitForFunction(()=>document.getElementById('backup-message').textContent.includes('הקובץ תקין'));await page.click('#load-backup');
  assert.equal(await page.locator('#tabs button').count(),12);assert.equal(await page.locator('.person').count(),100);assert.equal(await page.locator('.shared-child').count(),98);assert(await page.locator('#storage-warning').isHidden());
  const heading=await page.locator('#case-title').evaluate(n=>({height:n.getBoundingClientRect().height,line:parseFloat(getComputedStyle(n).lineHeight),title:n.title,text:n.textContent}));assert(heading.height<=heading.line*2+1);assert.equal(heading.title,heading.text);
  await page.click('#fit');await page.evaluate(()=>window.__bubble=document.querySelector('.person'));
  const rect=await page.locator('.person').first().boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+25,rect.y+rect.height/2+30,{steps:8});
  assert(await page.evaluate(()=>window.__bubble===document.querySelector('.person')));await page.mouse.up();
  await page.locator('#tabs button').last().click();assert.equal(await page.locator('.person').count(),100);await page.click('#save-work');await page.reload();assert.equal(await page.locator('#tabs button').count(),12);assert.equal(await page.locator('.person').count(),100);
  await page.locator('#file-tools').evaluate(n=>n.open=true);await page.click('#backup');const saved=JSON.parse(await page.locator('#case-json').inputValue());assert.equal(saved.cases.length,12);assert(saved.cases.every(c=>c.people.length===100));assert.equal(saved.cases[0].people[2].notes,family.people[2].notes);assert.deepEqual(errors,[]);
  console.log('PASS: 12 cases × 100 people, 98 shared-parent branches, long notes, bounded title, stable drag nodes, file import and persistent reload');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
