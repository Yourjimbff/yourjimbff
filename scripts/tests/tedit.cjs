// THE BOX IS THE BUBBLES (Yusuf, 6 Sep).
//   "why cant we just have the imessage box? get rid of the rest"
//
// The card used to carry a plain textarea AND a read-only preview of the same
// words under it. He read every draft twice and edited the copy that looked
// least like what the client actually gets. Now the bubbles ARE the editor.
//
// The thing this file is really guarding is the READ. Every path that sends,
// skips or reads a draft aloud used to reach for `crmTa_<id>.value`. If any of
// them still does after this change, it sends the stored row instead of the
// words he just typed - silently, and to a real client.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// --- the smallest DOM that these functions actually touch -----------------
function mkTa(v){ return {value:v, style:{}, tagName:'TEXTAREA'}; }
function mkEd(vals){
  const tas=vals.map(mkTa);
  return { querySelectorAll:sel=>(sel.indexOf('textarea')>=0?tas:[]), _tas:tas };
}
let DOM={};
global.window={};
global.document={ getElementById:id=>(DOM[id]||null) };
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const MINE=['_dfBubbles','_dfEdHtml','_dfReadDraft'];
eval(closure(['_BUB_LONG']).code||'');
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

const src=fs.readFileSync('index.html','utf8');

// ===== THE READ, WHICH IS THE WHOLE POINT ==============================
console.log('\n  WHAT ACTUALLY GETS SENT:');
DOM={'dfEd_7':mkEd(['Seven days out of seven','1,352 average','Whats one thing youd change'])};
t(_dfReadDraft('7')==='Seven days out of seven\n\n1,352 average\n\nWhats one thing youd change',
  'three bubbles come back as three texts, blank line between');
DOM={'dfEd_7':mkEd(['  padded  '])};
t(_dfReadDraft('7')==='padded', 'each bubble is trimmed');
DOM={'dfEd_7':mkEd(['first','   ','third'])};
t(_dfReadDraft('7')==='first\n\nthird', 'an emptied bubble is dropped, not sent as a blank text');
DOM={'dfEd_7':mkEd(['',''])};
t(_dfReadDraft('7')==='', 'all of them emptied reads as empty, and the caller refuses to send that');
DOM={'crmTa_7':{value:'the old plain box'}};
t(_dfReadDraft('7')==='the old plain box', 'the old textarea still reads, so no surface is stranded mid-deploy');
DOM={};
t(_dfReadDraft('7')===null, 'nothing on screen answers null - the signal to use the stored row');

// ===== AND NOTHING STILL REACHES PAST IT ===============================
console.log('\n  NO SEND PATH READS THE SCREEN ANY OTHER WAY:');
const grab=(from,to)=>src.slice(src.indexOf(from), src.indexOf(to));
const send=grab('function crmSend(id){','function crmSkip(id){');
t(/_dfReadDraft\(id\)/.test(send) && !/getElementById\('crmTa_/.test(send), 'crmSend reads the bubbles');
const skip=grab('function crmSkip(id){','/* ---------- THE TESTIMONIAL BELT');
t(/_dfReadDraft\(id\)/.test(skip) && !/getElementById\('crmTa_/.test(skip), 'crmSkip reads the bubbles');
const say=grab('function _cbSayCurrent(){','function cbEarToggle(){');
t(/_dfReadDraft\(it\.id\)/.test(say) && !/getElementById\('crmTa_/.test(say), 'the voice reads the bubbles, so he hears his own edit');
t((src.match(/getElementById\('crmTa_/g)||[]).length===1,
  'exactly one place in the file touches crmTa_ at all, and it is the fallback inside _dfReadDraft',
  String((src.match(/getElementById\('crmTa_/g)||[]).length));

// ===== THE PLAIN BOX IS GONE FROM BOTH SURFACES ========================
console.log('\n  ONE BOX, NOT TWO:');
t(!/<textarea class="crmTa"/.test(src), 'the board row has no plain textarea');
t(!/<textarea class="cbTa"/.test(src), 'the batch card has no plain textarea');
t((src.match(/\+ _dfEdHtml\(d\.id, d\.text\)/g)||[]).length===2, 'the bubble editor is on both surfaces',
  String((src.match(/\+ _dfEdHtml\(d\.id, d\.text\)/g)||[]).length));
t(!/\+ _dfBubblesHtml\(/.test(src), 'and the read-only preview is not drawn under it any more');

// ===== THE MARKUP =======================================================
console.log('\n  THE BUBBLES THEMSELVES:');
const h3=_dfEdHtml('7','one two three\n\nfour five');
t((h3.match(/<textarea/g)||[]).length===2, 'one textarea per block');
t(/id="dfEd_7"/.test(h3), 'the editor carries the draft id, which is how the read finds it');
t(/>3<\/span>/.test(h3) && /">2<\/span>/.test(h3), 'each bubble carries its own word count', h3.match(/dfEdN">\d+/g).join(' '));
t(/2 texts · how it lands/.test(h3), 'the header counts them');
const long=_dfEdHtml('7', Array(30).fill('word').join(' '));
t(/class="dfEdR long"/.test(long), 'over 25 words the bubble goes red');
t(/1 too long/.test(long), 'and the header says how many');
t(!/ too long/.test(h3), 'a short draft says nothing about length');
const one=_dfEdHtml('7','just one');
t(!/dfEdX/.test(one), 'a single bubble has no delete on it - he can never end up with none');
t(/dfEdX/.test(h3), 'two or more, and each one can be dropped');
t(/1 text ·/.test(one) && /2 texts ·/.test(h3), 'text vs texts');
const empty=_dfEdHtml('7','');
t((empty.match(/<textarea/g)||[]).length===1, 'an empty draft still gives him one box to type in');
t(/dfEdAdd/.test(h3) && /_dfEdAdd\('7'\)/.test(h3), 'and a way to add another text');
t(_dfEdHtml('7','<b>hi</b>').indexOf('&lt;b&gt;')>=0, 'their words are escaped');

// ===== THE STYLES =======================================================
console.log('\n  STYLE:');
t(/\.dfEdR textarea\{/.test(src), 'the bubble is the textarea, styled');
t(/resize:none/.test(src.slice(src.indexOf('.dfEdR textarea{'), src.indexOf('.dfEdR textarea{')+400)), 'no drag handle on a message bubble');
['.dfEd{','.dfEdH{','.dfEdR{','.dfEdN{','.dfEdAdd{'].forEach(sel=>{
  const i=src.indexOf(sel);
  t(i>0 && src.slice(0,i).lastIndexOf("+'")>src.slice(0,i).lastIndexOf('\n'), sel+' is one quoted line');
});

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all bubble-editor assertions pass');
process.exit(0);
