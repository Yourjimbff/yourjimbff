// THE PHOTO KNOWS WHEN (Yusuf, 10 Sep): the moment a photo was taken, read
// off the file itself, becomes the meal's clock - unless the person typed a
// time or the sentence names one.
const fs=require('fs'), vm=require('vm'), os=require('os'), path=require('path');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const a=src.indexOf('function _exifTakenFromBuffer(buf){'), b=src.indexOf('/* What a taken-at stamp means for a log');
const ctx={DataView, String, Date, isNaN, Number, parseInt}; vm.createContext(ctx); vm.runInContext(src.slice(a,b), ctx);
function toAB(buf){ return buf.buffer.slice(buf.byteOffset, buf.byteOffset+buf.byteLength); }
// a minimal JPEG (SOI, one APP0, SOS) with and without an APP1 Exif block carrying DateTimeOriginal
function jpeg(withStamp){
  const soi=Buffer.from([0xFF,0xD8]);
  const app0=Buffer.concat([Buffer.from([0xFF,0xE0,0x00,0x10]), Buffer.from('JFIF\0'), Buffer.from([1,1,0,0,1,0,1,0,0])]);
  const sos=Buffer.from([0xFF,0xDA,0x00,0x08,1,1,0,0,0x3F,0x00,0xFF,0xD9]);
  if(!withStamp) return Buffer.concat([soi,app0,sos]);
  const stamp=Buffer.from('2026:09:08 12:41:07\0');
  const u16=(n)=>{ const b=Buffer.alloc(2); b.writeUInt16LE(n); return b; };
  const u32=(n)=>{ const b=Buffer.alloc(4); b.writeUInt32LE(n); return b; };
  const tiff=Buffer.concat([Buffer.from('II*\0'), u32(8)]);
  const exifOff=8+2+12+4, dataOff=exifOff+2+12+4;
  const ifd0=Buffer.concat([u16(1), u16(0x8769), u16(4), u32(1), u32(exifOff), u32(0)]);
  const exif=Buffer.concat([u16(1), u16(0x9003), u16(2), u32(stamp.length), u32(dataOff), u32(0), stamp]);
  const body=Buffer.concat([Buffer.from('Exif\0\0'), tiff, ifd0, exif]);
  const len=Buffer.alloc(2); len.writeUInt16BE(body.length+2);
  return Buffer.concat([soi, Buffer.from([0xFF,0xE1]), len, body, app0, sos]);
}
ctx.ab1=toAB(jpeg(true)); ctx.ab2=toAB(jpeg(false));
const d=vm.runInContext('_exifTakenFromBuffer(ab1)', ctx);
t(d && d.getFullYear()===2026 && d.getMonth()===8 && d.getDate()===8 && d.getHours()===12 && d.getMinutes()===41, 'a photo taken Sep 8 at 12:41 reads as Sep 8 12:41 local  -> '+(d&&d.toString().slice(0,24)));
t(vm.runInContext('_exifTakenFromBuffer(ab2)', ctx)===null, 'a photo with no stamp answers null, and null changes nothing');
ctx.ab3=new ArrayBuffer(4); t(vm.runInContext('_exifTakenFromBuffer(ab3)', ctx)===null, 'a non-JPEG answers null');
console.log('\n  where it lands:');
const nl=src.slice(src.indexOf('function nlPhotoPicked(input){'), src.indexOf('function nlPhotoPicked(input){')+1400);
t(/_exifTaken\(input\.files\[0\]\)/.test(nl) && /_stP\.atManual\) return;/.test(nl) && /_stP\.at=tp\.at;/.test(nl) && /if\(moved\) _stP\.ds=tp\.ds;/.test(nl), 'the meal sheet takes the photo\'s clock and day, unless a time was typed');
const tm=src.slice(src.indexOf('function nlTimeOpen(ev){'), src.indexOf('function nlTimeClose(){'));
t(/st\.atManual=true;/.test(tm), 'a typed time is marked as theirs');
const door=src.slice(src.indexOf('async function jimDoor(text, photos, opts){'), src.indexOf('async function jimDoor(text, photos, opts){')+900);
t(/window\._chatPhotoTaken/.test(door) && /!_jimSaysWhen\(text\)/.test(door) && /opts\.timeLocal=_tp\.at;/.test(door), 'a Jim chat photo sets the clock too, unless the sentence names one');
const says=src.slice(src.indexOf('function _jimSaysWhen(t){'), src.indexOf('async function jimDoor('));
const c3={String,RegExp}; vm.createContext(c3); vm.runInContext(says, c3);
const S=(q)=>vm.runInContext('_jimSaysWhen('+JSON.stringify(q)+')', c3);
t(S('had this at 8am') && S('last night dinner') && S('this at noon') && !S('chicken and rice') && !S('12 oz steak'), 'the sentence wins only when it actually names a time or a day');
t(/window\._chatPhotoTaken=null; \}catch/.test(src.slice(src.indexOf('function clearChatPhoto(){'), src.indexOf('function clearChatPhoto(){')+200)), 'clearing the photos clears the stamp');
console.log(bad?'\n  '+bad+' FAILED':'\n  all photo-time assertions pass');
process.exit(bad?1:0);
