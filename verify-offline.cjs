const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert');
const {pathToFileURL}=require('url');
const tools=path.join(os.tmpdir(),'any2pdf-test-tools','node_modules');
const {chromium}=require(path.join(tools,'playwright'));
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.newContext({offline:true,acceptDownloads:true});
  const page=await context.newPage(),errors=[],remote=[];let workers=0;page.on('worker',()=>workers++);
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message)});
  context.on('request',request=>{if(/^https?:/.test(request.url()))remote.push(request.url())});
  await page.goto(pathToFileURL(path.resolve('index.html')).href);
  const image=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=400;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,1200,400);x.fillStyle='black';x.font='bold 64px Arial';x.fillText('OFFLINE TEXT 12345',50,120);x.fillText('Private document stays here',50,240);return c.toDataURL().split(',')[1]});
  await page.locator('#file').setInputFiles({name:'offline-test.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});
  await page.locator('.caption').first().fill('Selectable caption');
  const downloaded=page.waitForEvent('download',{timeout:150000});
  await page.locator('#export').click();
  const download=await downloaded;
  assert(/^\d{8}_\d{6}\.pdf$/.test(download.suggestedFilename()));
  const bytes=fs.readFileSync(await download.path());
  const pdfjs=await import(pathToFileURL(path.join(tools,'pdfjs-dist/legacy/build/pdf.mjs')).href);
  const pdf=await pdfjs.getDocument({data:new Uint8Array(bytes),useSystemFonts:true}).promise;
  const pdfPage=await pdf.getPage(1),content=await pdfPage.getTextContent();
  const text=content.items.map(item=>item.str).join(' ');console.log('EXTRACTED:',text);
  const firstWord=content.items.find(item=>item.str==='OFFLINE');
  assert(text.includes('OFFLINE'));assert(text.includes('12345'));assert(text.includes('Private'));assert(text.includes('Selectable caption'));

  assert.equal(workers,1);
  // Compression and layout changes reuse original-image OCR and remap its coordinates.
  await page.locator('[data-grid="2,2"]').click();
  await page.locator('#margin').fill('20');
  await page.locator('.resize').first().press('ArrowDown');
  await page.locator('#limit').check();await page.locator('#maxSize').fill('0.03');
  async function exportText(){
   const ready=page.waitForEvent('download',{timeout:150000});await page.locator('#export').click();
   const file=await ready,bytes=fs.readFileSync(await file.path());
   const doc=await pdfjs.getDocument({data:new Uint8Array(bytes),useSystemFonts:true}).promise;
   const content=await (await doc.getPage(1)).getTextContent();
   return {bytes,content,text:content.items.map(item=>item.str).join(' ')};
  }
  const compressed=await exportText();assert(compressed.bytes.length<=30000);assert(compressed.text.includes('OFFLINE'));
  assert(compressed.content.items.find(item=>item.str==='OFFLINE').height<firstWord.height);
  assert.equal(workers,1,'Repeat export should reuse cached recognition');
  await page.locator('#ocr').uncheck();
  const withoutOCR=await exportText();assert(!withoutOCR.text.includes('OFFLINE'));assert(withoutOCR.text.includes('Selectable caption'));assert.equal(workers,1);
  const blank=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=600;c.height=200;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,600,200);return await OfflineOCR.recognize([await imageFrom(c.toDataURL())])});
  assert.deepEqual(blank,[[]]);
  // OCR failures must not silently download an image-only PDF; controls recover.
  await page.locator('#ocr').check();
  await page.evaluate(()=>{OfflineOCR.recognize=async()=>{throw Error('OCR failure test')}});
  await page.locator('#export').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('OCR failure test'));
  assert(await page.locator('#export').isEnabled());assert.equal(await page.locator('main').evaluate(main=>main.inert),false);

  assert.equal(remote.length,0,'Unexpected external requests: '+remote.join(', '));assert.deepEqual(errors,[]);
  console.log('PASS: cold file:// OCR with browser offline, no external requests, extracted image text and captions, timestamp filename, cached recognition, compressed/resized layout, OCR toggle, blank images, failure recovery.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
