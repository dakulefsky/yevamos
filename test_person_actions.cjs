const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium,executablePath}=require('./browser_support.cjs');
(async()=>{
 const server=http.createServer((req,res)=>{try{const p=path.join(__dirname,'plugin',req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port);
  const ids=await page.evaluate(()=>{
   const c=current(),a=FamilyModel.person(c,'male',400,400),b=FamilyModel.person(c,'female',700,400);
   FamilyModel.connect(c,a.id,b.id,'marriage');render();return {a:a.id,b:b.id};
  });
  await page.locator('#diagram .person').first().click();
  assert.equal(await page.locator('#edit-selected').isEnabled(),true,'selecting a person enables explicit edit');
  assert.equal(await page.locator('#remove-selected').isEnabled(),true,'selecting a person enables explicit delete');
  assert.match(await page.locator('#selection-status').textContent(),/נבחרה:/,'selected person is named in the toolbar');
  assert.match(await page.locator('#instruction').textContent(),/בחרו דמות/,'toolbar explains the select-then-act workflow');
  await page.locator('#edit-selected').click();
  await page.locator('#name').fill('דמות שנערכה');
  await page.locator('#notes').fill('הערה מעודכנת');
  await page.locator('#edit-form button[type=submit]').click();
  assert.deepEqual(await page.evaluate(id=>{const p=person(id);return {name:p.name,notes:p.notes};},ids.a),{name:'דמות שנערכה',notes:'הערה מעודכנת'},'explicit edit saves changes');
  await page.locator('#diagram .person').nth(1).click({button:'right'});
  assert.equal(await page.locator('#context-menu').isVisible(),true,'right-click opens the person menu');
  await page.locator('#edit-person').click();
  await page.locator('#name').fill('עריכה מתפריט');
  await page.locator('#edit-form button[type=submit]').click();
  assert.equal(await page.evaluate(id=>person(id).name,ids.b),'עריכה מתפריט','context-menu edit still works');
  await page.locator('#diagram .person').nth(1).click({button:'right'});
  await page.locator('#remove-person').click();
  assert.equal(await page.locator('#delete-person-dialog').isVisible(),true,'context-menu delete asks for confirmation');
  await page.locator('#cancel-remove-person').click();
  assert.equal(await page.evaluate(id=>Boolean(person(id)),ids.b),true,'canceling confirmation keeps the person');
  await page.locator('#diagram .person').nth(1).click({button:'right'});
  await page.locator('#remove-person').click();
  await page.locator('#confirm-remove-person').click();
  assert.equal(await page.evaluate(id=>Boolean(person(id)),ids.b),false,'confirmed context-menu delete removes the person');
  assert.equal(await page.evaluate(id=>current().relations.some(r=>r.from===id||r.to===id),ids.b),false,'deleting a person removes connected relations');
  await page.locator('#diagram .person').first().click();
  await page.locator('#remove-selected').click();
  assert.equal(await page.locator('#delete-person-dialog').isVisible(),true,'toolbar delete asks for confirmation');
  await page.locator('#confirm-remove-person').click();
  assert.equal(await page.evaluate(id=>Boolean(person(id)),ids.a),false,'confirmed toolbar delete removes the person');
  assert.deepEqual(errors,[],'no browser runtime errors');
  console.log('PASS: explicit and context-menu edit/delete actions work; deleting a person also removes connected relations.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
