const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium,executablePath}=require('./browser_support.cjs');
(async()=>{const server=http.createServer((req,res)=>{try{const p=path.join(__dirname,'plugin',req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath,args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.goto('http://127.0.0.1:'+server.address().port);
 const state=()=>p.evaluate(()=>structuredClone(view()));const start=await state();const box=await p.locator('#diagram').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.wheel(80,140);await p.waitForFunction(cy=>view().cy!==cy,start.cy);const moved=await state();assert.equal(moved.zoom,start.zoom);assert(moved.cy>start.cy);assert(moved.cx>start.cx);
 // Wheel travel uses screen pixels regardless of magnification and delta mode.
 await p.locator('#diagram').focus();await p.keyboard.press('ArrowUp');assert.equal((await state()).zoom,1.25);await p.keyboard.press('ArrowDown');assert.equal((await state()).zoom,1);
 for(const mode of [0,1,2]){const before=await state();const expected=await p.locator('#diagram').evaluate((n,mode)=>{const r=n.getBoundingClientRect(),m=n.getScreenCTM().inverse();return {x:m.a*2*(mode===1?16:mode===2?r.width:1),y:m.d*3*(mode===1?16:mode===2?r.height:1)}},mode);await p.locator('#diagram').dispatchEvent('wheel',{deltaX:2,deltaY:3,deltaMode:mode,ctrlKey:true});const after=await state();assert.equal(after.zoom,before.zoom);assert(Math.abs(after.cx-before.cx-expected.x)<.001);assert(Math.abs(after.cy-before.cy-expected.y)<.001);}
 // Ordinary left-button dragging on empty canvas pans; a click still adds.
 const area=await p.locator('#diagram').boundingBox(),beforePan=await state();
 await p.mouse.move(area.x+80,area.y+100);await p.mouse.down();await p.mouse.move(area.x+180,area.y+155,{steps:8});await p.mouse.up();
 const afterPan=await state();assert(afterPan.cx<beforePan.cx);assert(afterPan.cy<beforePan.cy);assert.equal(afterPan.zoom,beforePan.zoom);assert(await p.locator('#gender-picker').isHidden());
 // Cancellation cannot open the person picker or leave dragging stuck.
 await p.mouse.move(area.x+60,area.y+80);await p.mouse.down();
 await p.locator('#diagram').dispatchEvent('pointercancel',{pointerId:1});await p.mouse.up();assert(await p.locator('#gender-picker').isHidden());
 await p.mouse.click(area.x+70,area.y+90);assert(await p.locator('#gender-picker').isVisible());await p.click('#cancel-picker');
 await p.fill('#person-search','ראובן');await p.keyboard.press('ArrowDown');assert.equal((await state()).zoom,1);await p.locator('#diagram').focus();await p.keyboard.press('Control+ArrowUp');assert.equal((await state()).zoom,1);
 await p.click('#add');await p.click('#choose-male');await p.locator('.person').first().dblclick();await p.locator('#name').focus();await p.keyboard.press('ArrowUp');assert.equal((await state()).zoom,1);await p.click('#close-edit');
 await p.locator('#diagram').focus();await p.keyboard.press('ArrowUp');assert.equal((await state()).zoom,1.25);const saved=await state();await p.click('#save-work');await p.reload();assert.deepEqual(await state(),saved);
 assert.deepEqual(errors,[]);console.log('PASS: left-button drag and click distinction, cancellation, two-axis wheel panning without zoom, all wheel delta modes and Ctrl-wheel, arrow-key zoom, edit/control exclusion and manually saved viewport.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
