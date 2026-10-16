const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,executablePath}=require('./browser_support.cjs');
const base='/workspace/scratch/8761b9094c3a';
const server=http.createServer((req,res)=>{const parts=req.url.split('/').filter(Boolean),version=parts.shift();const root=version==='old'?path.join(__dirname,'fixtures/v042'):path.join(__dirname,'plugin');const file=path.join(root,parts.join('/')||'index.html');try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(8780,'127.0.0.1',r));const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
async function run(version,pan,fallback,sex='male'){
 const ctx=await browser.newContext({viewport:{width:1300,height:1000}}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8780/'+version+'/');await page.click('#add');await page.click('#choose-'+sex);
 if(pan)await page.click('#pan-tool');await page.locator('.person').first().click({button:'right'});await page.click('#marriage-line');
 assert.equal(await page.locator('.ghost').count(),1);
 if(fallback)await page.click('#place-preview');else{
  const q=await page.locator('#diagram').evaluate(e=>{const g=e.querySelector('.person'),matrix=g.transform.baseVal.consolidate().matrix,p=e.createSVGPoint();p.x=matrix.e+260;p.y=matrix.f;const r=p.matrixTransform(e.getScreenCTM());return {x:r.x,y:r.y};});await page.mouse.move(q.x,q.y);await page.mouse.click(q.x,q.y);
 }
 const count=await page.locator('.person').count(),picker=await page.locator('#gender-picker').isVisible();
 if(version==='old'&&pan){assert.equal(count,1);assert.equal(picker,false);console.log('REPRODUCED OLD BUG: active pan consumes spouse placement; dashed preview remains.');}
 else if(version==='old'){assert.equal(picker,true);await page.click('#choose-'+(sex==='male'?'female':'male'));assert.equal(await page.locator('.person').count(),2);console.log('PASS: old normal flow works when pan is off.');}
 else{assert.equal(count,2);assert.equal(picker,false);assert.equal(await page.locator('#pan-tool').getAttribute('aria-pressed'),'false');assert.equal(await page.locator('.edge.marriage').count(),1);assert.equal(await page.locator('.ghost').count(),0);const data=await page.evaluate(()=>structuredClone(work));assert.notEqual(data.cases[0].people[0].sex,data.cases[0].people[1].sex);console.log('PASS: new '+(fallback?'explicit button':'canvas click')+' placement, pan reset, and opposite-sex spouse ('+sex+' source).');}
 assert.deepEqual(errors,[]);await ctx.close();
}
await run('old',true,false);await run('old',false,false);await run('new',true,false);await run('new',true,true);await run('new',false,true,'female');await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
