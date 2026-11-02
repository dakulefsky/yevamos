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
  await page.evaluate(()=>{
   window.__touchTrace=[];
   for(const type of ['pointerdown','pointermove','pointerup','touchstart','touchmove','touchend']){
    document.addEventListener(type,e=>window.__touchTrace.push({type,pointerType:e.pointerType||null,pointerId:e.pointerId??null,touches:e.touches?.length??null}),true);
   }
  });
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
  const x1=box.x+box.width*.25,y1=box.y+box.height*.48;
  const x2=box.x+box.width*.45,y2=box.y+box.height*.48;
  const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(p=>({id:p.id,x:p.x,y:p.y,radiusX:2,radiusY:2,force:1}))});
  const before=await page.evaluate(()=>({...view()}));
  await touch('touchStart',[{id:1,x:x1,y:y1}]);
  await touch('touchStart',[{id:1,x:x1,y:y1},{id:2,x:x2,y:y2}]);
  await touch('touchMove',[{id:1,x:box.x+box.width*.10,y:y1},{id:2,x:box.x+box.width*.80,y:y2}]);
  await page.waitForTimeout(50);
  const zoomed=await page.evaluate(()=>({...view()}));
  const trace=await page.evaluate(()=>window.__touchTrace);
  assert(trace.some(e=>e.type==='pointerdown'&&e.pointerType==='touch'),'Chromium must deliver real touch-generated Pointer Events');
  assert(trace.some(e=>e.type==='pointermove'&&e.pointerType==='touch'),'Chromium must deliver touch-generated pointer movement');
  assert(zoomed.zoom>before.zoom*2,'two-finger spread must zoom in using browser-generated touch input');
  assert(zoomed.cx!==before.cx||zoomed.cy!==before.cy,'zoom should remain anchored to the fingers');
  await touch('touchCancel',[]);
  assert.deepEqual(errors,[]);
  console.log('PASS: browser-generated multi-touch input reaches the canvas and pinches to zoom.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});