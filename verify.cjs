const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function pdfText('), end=source.indexOf('function wrapText(');
vm.runInThisContext(source.slice(start,end));
(async()=>{for(const [w,h] of [[210,297],[215.9,279.4]]){
const blob=pdfFromJpeg(new Uint8Array([255,216,255,217]),100,200,w,h,[{text:'Caption (test) \\ caf\u00e9 \u4e2d\u6587 \ud83d\ude00',x:12,y:20,size:3.3,scale:100}]);
const bytes=Buffer.from(await blob.arrayBuffer()),text=bytes.toString('latin1');
assert(text.startsWith('%PDF-1.4'));assert(text.includes(`/MediaBox [0 0 ${w*72/25.4} ${h*72/25.4}]`));
const xref=Number(text.match(/startxref\n(\d+)/)[1]);assert.equal(text.slice(xref,xref+4),'xref');
const entries=text.slice(xref).split('\n').slice(3,9);entries.forEach((entry,i)=>{const offset=Number(entry.slice(0,10));assert(text.slice(offset).startsWith(`${i+1} 0 obj`))});
assert.equal(blob.type,'application/pdf');
assert(text.includes('/Font << /F1 6 0 R >>'));
assert(text.includes('3 Tr 100 Tz'));
assert(text.includes('/ActualText <'+pdfUnicode('Caption (test) \\ caf\u00e9 \u4e2d\u6587 \ud83d\ude00')+'>'));
assert(text.includes(pdfText('Caption (test) \\ caf\u00e9 \u4e2d\u6587 \ud83d\ude00')));
const content=text.match(/5 0 obj\n<< \/Length (\d+) >>\nstream\n([\s\S]*?)endstream/);
assert.equal(Buffer.byteLength(content[2],'latin1'),Number(content[1]));}
assert.equal(pdfFilename(new Date(2026,0,2,3,4,5)), '20260102_030405.pdf');
assert.equal(pdfFilename(new Date(2026,10,12,13,14,15)), '20261112_131415.pdf');
assert.equal(pdfUnicode('\ud83d\ude00'),'FEFFD83DDE00');
assert(source.includes('a.download=pdfFilename()'));
assert(source.includes('reader.readAsDataURL(file)'));assert(source.includes("style.setProperty('--print-gap'"));
console.log('PASS: A4 and Letter PDF dimensions, binary xref offsets, PDF MIME, Unicode caption layer, caption escaping, stream length, timestamp filenames, persistent image sources, print spacing.');})();
