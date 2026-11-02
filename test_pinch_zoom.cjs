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
  const box=await page.locator('#diagram').boundingBox();
  const result=await page.evaluate(({x,y,w})=>{
   const board=document.getElementById('diagram');
   const makeTouches=points=>points.map(p=>new Touch({identifier:p.id,target:board,clientX:p.x,clientY:p.y,pageX:p.x,pageY:p.y,screenX:p.x,screenY:p.y}));
   const emit=(type,active,changed=active)=>{
    const touches=makeTouches(active),changedTouches=makeTouches(changed);
    return board.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches}));
   };
   const before={...view()},y=y;
   const first={id:1,x:x+w*.25,y},second={id:2,x:x+w*.45,y};
   emit('touchstart',[first,second]);
   emit('touchmove',[{...first,x:x+w*.10},{...second,x:x+w*.80}]);
   const zoomed={...view()};
   emit('touchend',[second],[first]);
   const afterLift={...view()};
   emit('touchmove',[{...second,x:x+w*.95}],[{...second,x:x+w*.95}]);
   const afterOneFinger={...view()};
   emit('touchend',[],[second]);
   return {before,zoomed,afterLift,afterOneFinger};
  },{x:box.x,y:box.y,w:box.width});
  assert(result.zoomed.zoom>result.before.zoom*2,'two-finger spread must zoom in; '+JSON.stringify(result));
  assert(result.zoomed.cx!==result.before.cx||result.zoomed.cy!==result.before.cy,'zoom should remain anchored to the fingers');
  assert.equal(result.afterOneFinger.zoom,result.afterLift.zoom,'remaining finger must not continue zooming');
  assert.equal(result.afterOneFinger.cx,result.afterLift.cx,'remaining finger must not pan the diagram');
  assert.equal(result.afterOneFinger.cy,result.afterLift.cy,'remaining finger must not pan the diagram');
  assert.deepEqual(errors,[]);
  console.log('PASS: two-touch TouchEvents zoom the canvas and the remaining finger cannot resume movement.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});