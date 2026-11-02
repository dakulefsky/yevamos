const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium,executablePath}=require('./browser_support.cjs');
(async()=>{
 const server=http.createServer((req,res)=>{try{const p=path.join(__dirname,'plugin',req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:900,height:900},hasTouch:true,isMobile:true});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:'+server.address().port);
  const board=page.locator('#diagram'),box=await board.boundingBox();
  const dispatch=(type,id,x,y)=>board.evaluate((el,p)=>el.dispatchEvent(new PointerEvent(p.type,{bubbles:true,cancelable:true,pointerId:p.id,pointerType:'touch',isPrimary:p.id===1,clientX:p.x,clientY:p.y,button:0,buttons:p.type==='pointerup'?0:1})),{type,id,x,y});
  const before=await page.evaluate(()=>({...view()}));
  await dispatch('pointerdown',1,box.x+box.width*.35,box.y+box.height*.5);
  await dispatch('pointerdown',2,box.x+box.width*.55,box.y+box.height*.5);
  await dispatch('pointermove',1,box.x+box.width*.15,box.y+box.height*.5);
  await dispatch('pointermove',2,box.x+box.width*.8,box.y+box.height*.5);
  const zoomed=await page.evaluate(()=>({...view()}));
  assert(zoomed.zoom>before.zoom*1.8,'two-finger spread must zoom in');
  assert(zoomed.cx!==before.cx||zoomed.cy!==before.cy,'zoom should remain anchored to the fingers');
  await dispatch('pointerup',1,box.x+box.width*.3,box.y+box.height*.5);
  const afterLift=await page.evaluate(()=>({...view()}));
  await dispatch('pointermove',2,box.x+box.width*.9,box.y+box.height*.5);
  const oneFingerMove=await page.evaluate(()=>({...view()}));
  assert.equal(oneFingerMove.zoom,afterLift.zoom,'remaining finger must not resume panning or zooming');
  assert.equal(oneFingerMove.cx,afterLift.cx,'remaining finger must not pan the diagram');
  assert.equal(oneFingerMove.cy,afterLift.cy,'remaining finger must not pan the diagram');
  await dispatch('pointerup',2,box.x+box.width*.85,box.y+box.height*.5);
  assert.deepEqual(errors,[]);
  console.log('PASS: two-finger pointer pinch zooms; one-finger continuation after pinch does not pan.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
