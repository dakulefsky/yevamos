const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,executablePath}=require('./browser_support.cjs');
(async()=>{const server=http.createServer((req,res)=>{try{const p=path.join(__dirname,'plugin',req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath,args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:'+server.address().port);
 let dialogs=0,downloads=0;page.on('dialog',d=>{dialogs++;d.dismiss()});page.on('download',()=>downloads++);
 await page.click('#add');await page.click('#choose-male');assert.equal(await page.evaluate(()=>localStorage.getItem('yevamos-bubbles-v2')),null);assert((await page.locator('#save-status').innerText()).includes('לא נשמרו'));
 await page.click('#save-work');assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(downloads,0);assert.equal(dialogs,0);
 const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('yevamos-bubbles-v2')));assert.equal(first.cases[0].people[0].name,'ראובן');
 await page.click('#new-case');await page.click('#add');await page.click('#choose-female');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('yevamos-bubbles-v2')).cases.length),1);
 await page.keyboard.press('Control+s');const both=await page.evaluate(()=>JSON.parse(localStorage.getItem('yevamos-bubbles-v2')));assert.equal(both.cases.length,2);assert.equal(both.cases[1].people[0].name,'שרה');
 await page.reload();assert.equal(await page.locator('#tabs button').count(),2);assert.equal(await page.locator('.person').count(),1);assert.equal(dialogs,0);
 assert(await page.locator('#undo').isDisabled());
 assert(await page.locator('#backup').isHidden());assert.deepEqual(errors,[]);console.log('PASS: edits wait for manual save, one click saves all cases with no dialog/name/download, Ctrl+S saves, reload restores, advanced backup is tucked away.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
