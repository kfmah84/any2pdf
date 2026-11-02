// All OCR dependencies are bundled; no fetch or upload leaves the OCR worker.
'use strict';
window.OfflineOCR = (() => {
 const cache=new WeakMap();
 let assetsPromise;
 function loadScript(path){return new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=new URL(path,document.baseURI).href;
  script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('Missing offline OCR files. Keep the vendor/ocr folder with this app.'))};document.head.append(script);
 })}
 function assets(){
  if(!assetsPromise)assetsPromise=Promise.all(['vendor/ocr/tesseract.min.js','vendor/ocr/worker-source.js','vendor/ocr/eng-data.js'].map(loadScript)).catch(e=>{assetsPromise=null;throw e});
  return assetsPromise;
 }
 function timeout(promise,ms){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Offline OCR timed out. Try a smaller, clearer image.')),ms)})]).finally(()=>clearTimeout(timer))}
 async function recognize(images,progress=()=>{}){
  const missing=[...new Set(images)].filter(image=>!cache.has(image));
  if(!missing.length)return images.map(image=>cache.get(image));
  await assets();
  // A blob worker and script-wrapped assets allow file:// use without CORS exceptions.
  // Its only fetch response is the bundled English data; all other fetches fail closed.
  const bootstrap=`const english=${JSON.stringify(window.OfflineOCREnglish)};
self.fetch=async function(url){
 if(String(url)!==${JSON.stringify(new URL('offline-ocr/eng.traineddata.gz',document.baseURI).href)})throw Error('OCR network access is disabled');
 return new Response(Uint8Array.from(atob(english),c=>c.charCodeAt(0)));
};
self.importScripts=()=>{throw Error('OCR external script loading is disabled')};\n`;
  const url=URL.createObjectURL(new Blob([bootstrap,window.OfflineOCRWorkerSource],{type:'text/javascript'}));
  let worker,cancelled=false,active=0,rejectError;
  const failure=new Promise((_,reject)=>rejectError=reject);
  const creation=Tesseract.createWorker('eng',1,{
   workerPath:url,workerBlobURL:false,corePath:'offline-core.js',langPath:'offline-ocr',cacheMethod:'none',
   errorHandler:error=>rejectError(Error(String(error))),logger:m=>{if(m.status==='recognizing text')progress(active,missing.length,m.progress)}
  }).then(async result=>{if(cancelled){await result.terminate();throw Error('OCR initialization cancelled')}return result});
  try{
   worker=await timeout(Promise.race([creation,failure]),60000);
   await worker.setParameters({tessedit_pageseg_mode:'3'});
   for(const image of missing){
    active++;progress(active,missing.length,0);
    const canvas=document.createElement('canvas'),scale=Math.min(1,4000/Math.max(image.naturalWidth,image.naturalHeight));
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    try{
     const {data}=await timeout(worker.recognize(canvas.toDataURL('image/png'),{}, {text:true,blocks:true}),120000);
     const words=[];
     for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[])for(const word of line.words||[]){
      const text=word.text.trim(),b=word.bbox;
      if(text&&b&&b.x1>b.x0&&b.y1>b.y0)words.push({text,x:b.x0/canvas.width,y:b.y0/canvas.height,width:(b.x1-b.x0)/canvas.width,height:(b.y1-b.y0)/canvas.height});
     }
     cache.set(image,words);
    }finally{canvas.width=canvas.height=1}
   }
   return images.map(image=>cache.get(image));
  }finally{cancelled=true;if(worker)await worker.terminate();URL.revokeObjectURL(url)}
 }
 return {recognize};
})();
