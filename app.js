'use strict';
const $ = id => document.getElementById(id);
let columns=1, rows=2, items=[], target=0;
const dimensions=()=> $('paper').value==='a4'?[210,297]:[215.9,279.4];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function number(id,min,max,fallback){const v=Number($(id).value);return clamp(Number.isFinite(v)?v:fallback,min,max)}
function settings(){return {margin:number('margin',0,50,12),gap:number('gap',0,20,6),dpi:number('dpi',72,600,300),quality:number('quality',10,100,90)/100}}
function status(message){$('status').textContent=message}
function layout(){
 const [w,h]=dimensions(),s=settings();
 $('sheet').style.aspectRatio=`${w}/${h}`;
 $('sheet').style.setProperty('--paper-width',w+'mm');$('sheet').style.setProperty('--paper-height',h+'mm');
 $('grid').style.cssText=`--cols:${columns};--rows:${rows};--margin:${s.margin/w*100}%;--gap:${s.gap/w*100}cqw`;
 // Percentage vertical margins need the paper height, while grid gaps use the live page width.
 $('grid').style.inset=`${s.margin/h*100}% ${s.margin/w*100}%`;
 $('grid').style.gap=($('sheet').clientWidth*s.gap/w)+'px';
 $('grid').style.setProperty('--print-gap',s.gap+'mm');$('gapLabel').textContent=s.gap+' mm';$('qualityLabel').textContent=Math.round(s.quality*100)+'%';
 $('pageInfo').textContent=$('paper').value.toUpperCase()+' · PORTRAIT';
 $('count').textContent=`${items.slice(0,columns*rows).filter(i=>i?.image).length} / ${columns*rows} images`;
}
function render(){
 while(items.length<columns*rows)items.push({caption:'',scale:1});
 $('grid').replaceChildren();
 items.slice(0,columns*rows).forEach((item,index)=>{
 const cell=document.createElement('div');cell.className='cell';
 const box=document.createElement('div');box.className='image-box'+(item.image?' has-image':'');box.tabIndex=0;box.role='button';box.setAttribute('aria-label',`Choose image for box ${index+1}`);
 if(item.image){const img=document.createElement('img');img.src=item.image.src;img.alt=item.name;box.append(img);const remove=document.createElement('button');remove.className='remove';remove.textContent='×';remove.title='Remove image';remove.onclick=e=>{e.stopPropagation();items[index]={caption:item.caption,scale:1};render()};box.append(remove)}
 else{const plus=document.createElement('strong');plus.textContent='+';const label=document.createElement('span');label.textContent='Add an image';const hint=document.createElement('small');hint.textContent='or drop a file here';box.append(plus,label,hint)}
 const choose=()=>{target=index;$('file').click()};box.onclick=choose;box.onkeydown=e=>{if(e.target===box&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choose()}};
 box.ondragover=e=>{e.preventDefault()};box.ondrop=e=>{e.preventDefault();loadFiles(e.dataTransfer.files,index)};
 const caption=document.createElement('input');caption.className='caption';caption.placeholder='Add a caption…';caption.value=item.caption;caption.maxLength=500;caption.setAttribute('aria-label',`Caption for box ${index+1}`);caption.oninput=()=>item.caption=caption.value;
 const handle=document.createElement('button');handle.className='resize';handle.title='Drag to resize; arrow keys adjust size';handle.setAttribute('aria-label',`Resize box ${index+1}`);
 function size(){box.style.flex='none';box.style.width=item.scale*100+'%';box.style.height=`calc(${item.scale*100}% - ${32*item.scale}px)`}
 size();
 handle.onclick=e=>e.stopPropagation();handle.onkeydown=e=>{if(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(e.key)){e.preventDefault();e.stopPropagation();item.scale=clamp(item.scale+(['ArrowUp','ArrowRight'].includes(e.key)?.03:-.03),.15,1);size()}};
 handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();handle.setPointerCapture(e.pointerId);const x=e.clientX,y=e.clientY,initial=item.scale,rect=cell.getBoundingClientRect();handle.onpointermove=p=>{item.scale=clamp(initial+Math.max((p.clientX-x)/rect.width,(p.clientY-y)/(rect.height-32)),.15,1);size()};handle.onpointerup=handle.onpointercancel=()=>{handle.onpointermove=null}};
 box.append(handle);cell.append(box,caption);$('grid').append(cell);
 });layout();
}
async function decode(file){
 if(/\.tiff?$/i.test(file.name)||/tiff/.test(file.type)){
  if(!window.UTIF)throw Error('TIFF decoder could not load.');
  const buffer=await file.arrayBuffer(), pages=UTIF.decode(buffer);if(!pages.length)throw Error('No TIFF image found.');UTIF.decodeImage(buffer,pages[0]);
  const p=pages[0];if(p.width*p.height>80000000)throw Error('TIFF image is too large.');const canvas=document.createElement('canvas');canvas.width=p.width;canvas.height=p.height;canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(UTIF.toRGBA8(p)),p.width,p.height),0,0);return await imageFrom(canvas.toDataURL());
 }
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read this file.'));reader.readAsDataURL(file)});return await imageFrom(data)
}
function imageFrom(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Unsupported or damaged image.'));image.src=src})}
async function loadFiles(files,start){let loaded=0,errors=[];for(const file of Array.from(files).slice(0,columns*rows-start)){try{const image=await decode(file);items[start+loaded]={...items[start+loaded],image,name:file.name,scale:1};loaded++}catch(e){errors.push(`${file.name}: ${e.message}`)}}render();status(errors.length?errors.join(' '):`${loaded} image${loaded===1?'':'s'} added. Select an image to replace it.`)}
$('file').onchange=async e=>{await loadFiles(e.target.files,target);e.target.value=''};
document.querySelectorAll('[data-grid]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-grid]').forEach(b=>b.classList.toggle('selected',b===button));const custom=button.dataset.grid==='custom';$('custom').hidden=!custom;if(custom){columns=number('columns',1,8,1);rows=number('rows',1,8,2)}else{[columns,rows]=button.dataset.grid.split(',').map(Number);$('columns').value=columns;$('rows').value=rows}render()});
for(const id of ['columns','rows'])$(id).onchange=()=>{columns=number('columns',1,8,1);rows=number('rows',1,8,2);$('columns').value=columns;$('rows').value=rows;render()};
for(const id of ['paper','margin','gap','quality','dpi'])$(id).addEventListener('input',layout);
$('limit').onchange=()=>{const enabled=$('limit').checked;$('limitOptions').hidden=!enabled;$('manual').classList.toggle('disabled',enabled);$('quality').disabled=enabled;$('dpi').disabled=enabled};
$('reset').onclick=()=>{items=[];render();status('Page cleared.')};
new ResizeObserver(layout).observe($('sheet'));
// A tiny binary PDF writer: one JPEG page embedded at the exact paper dimensions.
function pdfFromJpeg(jpeg,width,height,paperWidth,paperHeight){
 const encode=s=>new TextEncoder().encode(s),parts=[],offsets=[0];let offset=0;
 const push=data=>{const bytes=typeof data==='string'?encode(data):data;parts.push(bytes);offset+=bytes.length};
 const object=(id,body)=>{offsets[id]=offset;push(`${id} 0 obj\n`);push(body);push('\nendobj\n')};
 const w=paperWidth*72/25.4,h=paperHeight*72/25.4;
 push('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');object(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 offsets[4]=offset;push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);push(jpeg);push('\nendstream\nendobj\n');
 const stream=`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;object(5,`<< /Length ${encode(stream).length} >>\nstream\n${stream}endstream`);
 const xref=offset;push('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(parts,{type:'application/pdf'});
}
function wrapText(ctx,text,maxWidth){const lines=[];for(const paragraph of text.split('\n')){let line='';for(const char of Array.from(paragraph)){if(ctx.measureText(line+char).width>maxWidth&&line){lines.push(line);line=char}else line+=char}lines.push(line)}return lines}
async function makePdf(dpi,quality){
 const [pw,ph]=dimensions(),s=settings(),px=dpi/25.4,canvas=document.createElement('canvas');canvas.width=Math.round(pw*px);canvas.height=Math.round(ph*px);
 const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingQuality='high';
 const cw=(pw-2*s.margin-(columns-1)*s.gap)/columns,ch=(ph-2*s.margin-(rows-1)*s.gap)/rows;
 if(cw<=0||ch<=0)throw Error('Reduce the margin or spacing to fit this grid.');
 items.slice(0,columns*rows).forEach((item,index)=>{
  const x=(s.margin+(index%columns)*(cw+s.gap))*px,y=(s.margin+Math.floor(index/columns)*(ch+s.gap))*px;
  const caption=item.caption.trim();ctx.font=`${3.3*px}px Arial`;const lines=caption?wrapText(ctx,caption,cw*px-2*px):[];const lineHeight=4.3*px,captionH=lines.length?lines.length*lineHeight+2*px:0;
  if(captionH>ch*px*.65)throw Error(`Caption ${index+1} is too long for this grid. Shorten the caption or use fewer rows.`);
  if(item.image){const bw=cw*px*item.scale,bh=(ch*px-captionH)*item.scale;const ratio=Math.min(bw/item.image.width,bh/item.image.height);const iw=item.image.width*ratio,ih=item.image.height*ratio;ctx.drawImage(item.image,x+(cw*px-iw)/2,y+(ch*px-captionH-ih)/2,iw,ih)}
  if(lines.length){ctx.fillStyle='#233b35';ctx.textAlign='center';ctx.textBaseline='top';lines.forEach((line,n)=>ctx.fillText(line,x+cw*px/2,y+ch*px-captionH+2*px+n*lineHeight))}
 });
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));if(!blob)throw Error('Could not render this page. Try a lower DPI.');const bytes=new Uint8Array(await blob.arrayBuffer());const pdf=pdfFromJpeg(bytes,canvas.width,canvas.height,pw,ph);canvas.width=canvas.height=1;return pdf;
}
$('export').onclick=async()=>{
 if(!items.slice(0,columns*rows).some(i=>i.image)){status('Add at least one image before exporting.');return}
 $('export').disabled=true;status('Preparing your PDF…');
 try{await new Promise(r=>setTimeout(r,30));let blob;const s=settings();
 if($('limit').checked){const maximum=number('maxSize',.01,100,2)*1000000;const attempts=[[300,.92],[250,.85],[200,.75],[150,.65],[120,.5],[96,.4],[72,.3],[50,.2],[36,.1],[24,.08]];for(const [dpi,q]of attempts){status(`Finding a fit… ${dpi} DPI`);await new Promise(r=>setTimeout(r,0));blob=await makePdf(dpi,q);if(blob.size<=maximum)break}if(blob.size>maximum)throw Error('This size limit cannot be met. Increase the maximum file size.');}
 else blob=await makePdf(s.dpi,s.quality);
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='any2pdf-'+$('paper').value+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status(`PDF downloaded · ${(blob.size/1000000).toFixed(2)} MB`);
 }catch(e){status(e.message)}finally{$('export').disabled=false}
};
$('print').onclick=()=>{const [w,h]=dimensions();let style=$('printSize');if(!style){style=document.createElement('style');style.id='printSize';document.head.append(style)}style.textContent=`@page{size:${w}mm ${h}mm;margin:0}`;status('Use “Save as PDF” in the print dialog. Download PDF applies quality and size controls.');window.print()};
render();



