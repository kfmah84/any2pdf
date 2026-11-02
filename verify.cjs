const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function pdfFromJpeg('), end=source.indexOf('function wrapText(');
vm.runInThisContext(source.slice(start,end));
(async()=>{for(const [w,h] of [[210,297],[215.9,279.4]]){
const blob=pdfFromJpeg(new Uint8Array([255,216,255,217]),100,200,w,h);
const bytes=Buffer.from(await blob.arrayBuffer()),text=bytes.toString('latin1');
assert(text.startsWith('%PDF-1.4'));assert(text.includes(`/MediaBox [0 0 ${w*72/25.4} ${h*72/25.4}]`));
const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(text.slice(xref,xref+4),'xref');
const entries=text.slice(xref).split('\n').slice(3,8);entries.forEach((entry,i)=>{const offset=Number(entry.slice(0,10));assert(text.slice(offset).startsWith(`${i+1} 0 obj`))});
assert.equal(blob.type,'application/pdf');}
assert(source.includes('reader.readAsDataURL(file)'));assert(source.includes("style.setProperty('--print-gap'"));
console.log('PASS: A4 and Letter PDF dimensions, binary xref offsets, PDF MIME, persistent image sources, print spacing.');})();
