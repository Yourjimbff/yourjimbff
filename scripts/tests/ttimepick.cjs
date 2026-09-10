// OUR OWN CLOCK (Yusuf, 10 Sep: "the time is just off the screen"). The meal
// and slot time sheets carry no native <input type="time"> any more - pills
// for hour, minute and AM/PM, a hidden field with the id the Save handlers
// already read, and a readout in the header's own shape.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const nl=src.slice(src.indexOf('function nlTimeOpen(){'), src.indexOf('function nlTimeClose(){'));
const sl=src.slice(src.indexOf('function openSlotTime(key){'), src.indexOf('function closeSlotTime(){'));
t(!/type="time"/.test(nl) && /_tpkHtml\('nlTimeIn'/.test(nl) && /_tpkBind\(o\)/.test(nl), 'the meal time sheet is pills, not the native clock');
t(!/type="time"/.test(sl) && /_tpkHtml\('slotTimeIn'/.test(sl) && /_tpkBind\(o\)/.test(sl), 'the slot time sheet too');
t(/class="tpkSheet"/.test(nl) && /\.tpkSheet\{[^}]*radial-gradient/.test(src), 'on glass');
// lift the picker and drive it against a fake document
const block=src.slice(src.indexOf('var _tpk={};'), src.indexOf('function nlTimeOpen(){'));
const els={};
function mk(id){ return {value:'',textContent:''}; }
const ctx={ document:{ getElementById(id){ return els[id]||(els[id]=mk(id)); } }, String, parseInt, Math, Array,
  _hhmmAny(v){ const m=/^(\d{1,2}):(\d{2})/.exec(String(v||'')); return m?(+m[1]*60+ +m[2]):null; }, _tlNowClock(){ return '5:28 PM'; } };
vm.createContext(ctx); vm.runInContext(block, ctx);
const html=vm.runInContext("_tpkHtml('nlTimeIn','17:29')", ctx);
t(/tpkRead[^>]*>5:29 PM</.test(html) && /id="nlTimeIn" value="17:29"/.test(html), 'opens on the time it was handed, in the header\'s shape');
t((html.match(/data-part="h"/g)||[]).length===12 && (html.match(/data-part="m"/g)||[]).length===12 && (html.match(/data-part="ap"/g)||[]).length===2, 'twelve hours, twelve minutes, AM and PM');
t(/data-part="h" data-v="5">5<\/div>/.test(html) && /class="tpkP on" data-tpk="nlTimeIn" data-part="h" data-v="5"/.test(html), 'the current hour is lit');
function fake(part,v){ const kids=[]; const el={ a:{'data-tpk':'nlTimeIn','data-part':part,'data-v':String(v)}, getAttribute(k){ return this.a[k]; }, classList:{ add(){ el.on=true; }, remove(){ el.on=false; } }, parentNode:{children:kids} }; return el; }
vm.runInContext('globalThis.__tap=_tpkTap', ctx);
ctx.__tap(fake('h',8)); ctx.__tap(fake('m',15)); ctx.__tap(fake('ap','am'));
t(els.nlTimeIn.value==='08:15' && els.nlTimeInRead.textContent==='8:15 AM', 'tapping 8, :15, AM writes 08:15 to the hidden field and 8:15 AM to the readout');
ctx.__tap(fake('ap','pm'));
t(els.nlTimeIn.value==='20:15', 'PM keeps the hour and moves it to the afternoon');
ctx.__tap(fake('h',12)); t(els.nlTimeIn.value==='12:15', '12 PM is noon');
ctx.__tap(fake('ap','am')); t(els.nlTimeIn.value==='00:15', '12 AM is midnight');
console.log(bad?'\n  '+bad+' FAILED':'\n  all time picker assertions pass');
process.exit(bad?1:0);
