// ONE BOX, TYPE THE TIME (Yusuf, 10 Sep). No native clock, no pills: a sheet
// at the top of the screen, one field that reads the time any way it is
// written, and a hidden field with the id the Save handlers already read.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const nl=src.slice(src.indexOf('function nlTimeOpen(ev){'), src.indexOf('function nlTimeClose(){'));
const sl=src.slice(src.indexOf('function openSlotTime(key){'), src.indexOf('function closeSlotTime(){'));
t(!/type="time"/.test(nl) && /span\.replaceWith\(inp\)/.test(nl) && /querySelector\('#nlOv \.nlTimeTap'\)/.test(nl), 'the meal time edits IN PLACE: the gold time in the header becomes the field, no second sheet');
t(/inp\.focus\(\); inp\.select\(\)/.test(nl) && /_tpkParse\(inp\.value\)/.test(nl) && /st\.at=_tpkFmt\(mins\)/.test(nl), 'focused and selected on tap; return or tap-away saves what was typed');
t(/nlTimeOpen\(event\)/.test(src) && !/nlTimeOpen\(\)"/.test(src), 'both headers (before and after the read) open it');
t(!/type="time"/.test(sl) && /_tpkHtml\('slotTimeIn'/.test(sl) && /_tpkFocus\('slotTimeIn'\)/.test(sl), 'the slot time sheet is one typed field, focused on open');
t(/align-items:flex-end/.test(sl) && /_tpkAboveKeyboard\(o\)/.test(sl) && !/align-items:flex-start/.test(sl), 'and it comes up from the bottom like everything else, riding above the keyboard');
t(!/tpkP\b/.test(src) && !/tpkGrid/.test(src), 'the pills are gone');
const block=src.slice(src.indexOf('var _tpk={};'), src.indexOf('function _tpkHtml(id, hhmm){'));
const ctx={String, Date:class extends Date{ getHours(){ return 17; } }, Math}; vm.createContext(ctx); vm.runInContext(block, ctx);
const P=(v)=>vm.runInContext('_tpkParse('+JSON.stringify(v)+')', ctx);
const F=(m)=>vm.runInContext('_tpkFmt('+m+')', ctx);
console.log('\n  written any way, at 5pm:');
[['5:44 PM',17*60+44],['5:44pm',17*60+44],['544',17*60+44],['5.44',17*60+44],['5 44 pm',17*60+44],['17:44',17*60+44],['5:44 am',5*60+44],['5',17*60],['12',12*60],['12 am',0],['noon',12*60],['1744',17*60+44],['5:44 p',17*60+44]].forEach(([v,w])=>{ t(P(v)===w, JSON.stringify(v)+'  ->  '+(P(v)==null?'null':F(P(v)))); });
t(P('abc')===null && P('25:00')===null && P('')===null, 'nonsense is refused, not guessed');
const th=src.slice(src.indexOf('function _tpkHtml(id, hhmm){'), src.indexOf('function _tpkType(id, el){'));
t(/type="hidden" id="'\+id\+'"/.test(th) && /id="'\+id\+'Txt"/.test(th) && /font-size:22px/.test(th), 'a hidden HH:MM for Save, a big typed field for the person');
console.log(bad?'\n  '+bad+' FAILED':'\n  all time-box assertions pass');
process.exit(bad?1:0);
