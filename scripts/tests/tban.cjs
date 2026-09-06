// A BAN THAT MARKS IS NOT A BAN (Yusuf, 6 Sep).
//
//   "why is its not x its x even allowed at all? what is the point of even
//    having the standard there if were not going to enforce it?"
//
// Right. The linter named a construction he had banned and then handed him a
// working Send button under it. This file is the enforcement, and the thing it
// really guards is that the enforcement cannot fail QUIETLY - a batch run that
// counted a refused send as sent and moved on would be worse than no ban.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

let DOM={};
global.window={};
global.document={ getElementById:id=>(DOM[id]||null), querySelector:()=>null };
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
global.showToast=()=>{};

const MINE=['_dfTells','_dfTellsHtml','_dfHardTells','_dfBlockedNow','_dfBlockHtml','_dfReadDraft','dfLetThrough'];
eval(closure(['_DF_HARD','_dfLet']).code||'');
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

const BANNED="1,352 average, thats a real cut not a crash one";
const CLEAN="1,352 average. thats a real cut";

// ===== HARD VS SOFT =====================================================
console.log('\n  WHAT STOPS A SEND AND WHAT ONLY MARKS IT:');
t(_dfHardTells(BANNED).indexOf('x-is-not-y')>=0, 'x-is-not-y stops it - the one he asked about');
t(_dfHardTells("Locked — sunday 11am").length>0, 'an em dash stops it');
t(_dfHardTells('Trained: Pull “the delt flies were so much harder than j thought”').length>0, 'quoting them back stops it');
t(_dfHardTells("keep it up man").length>0, 'a phrase he has never used stops it');
t(_dfHardTells("So you had a rough week").length>0, 'repeating them back stops it');
t(_dfHardTells("Hows the gym? Whats today? Free friday?").length===0,
  'a question stack does NOT stop it - he writes those himself, it only marks');
t(_dfHardTells(Array(50).fill('word').join(' ')).length===0, 'and a long block only marks');
t(_dfHardTells(CLEAN).length===0, 'a clean draft stops nothing');
t(_dfHardTells('').length===0, 'an empty draft is not a ban');

// ===== IT READS THE SCREEN, NOT THE ROW =================================
console.log('\n  HE FIXES IT, IT UNLOCKS:');
DOM={'dfEd_d1':{id:'dfEd_d1', querySelectorAll:()=>[{value:BANNED}]}};
t(_dfBlockedNow('d1','')  .length===1, 'the banned line on screen blocks');
DOM={'dfEd_d1':{id:'dfEd_d1', querySelectorAll:()=>[{value:CLEAN}]}};
t(_dfBlockedNow('d1','').length===0, 'he deletes the negated half and it clears, with no save needed');
DOM={};
t(_dfBlockedNow('d1',BANNED).length===1, 'with nothing on screen it falls back to the stored row');

// ===== THE WAY THROUGH ==================================================
console.log('\n  AND HE IS NEVER TRAPPED:');
t(_dfBlockHtml('d1',BANNED).indexOf('send it as written')>0, 'the block carries its own override');
dfLetThrough('d1');
t(_dfBlockedNow('d1',BANNED).length===0, 'one deliberate tap and that draft goes as written');
t(_dfBlockedNow('d2',BANNED).length===1, 'and it is that draft ONLY, not the ban switched off');
t(_dfBlockHtml('d1',BANNED)==='', 'a forced draft stops showing the red line');
t(/dfTells forced/.test(_dfTellsHtml(BANNED,'d1')), 'but the tell is still named on it, dimmed');
t(_dfBlockHtml('',BANNED)==='' , 'no id, no block - it can never guess which draft it is on');
const src=fs.readFileSync('index.html','utf8');
t(/var _dfLet=\{\};/.test(src) && !/localStorage[^;]*_dfLet|_dfLet[^;]*localStorage/.test(src),
  'the override is never written down, so tomorrow it is checked again');

// ===== IT CANNOT FAIL QUIETLY ===========================================
console.log('\n  THE ENFORCEMENT ITSELF:');
const grab=(a,b)=>src.slice(src.indexOf(a), src.indexOf(b));
const send=grab('function crmSend(id){','function crmSkip(id){');
t(/_dfBlockedNow\(id, text\)/.test(send), 'crmSend asks before it sends');
t(/if\(_blk\.length\)\{[\s\S]{0,400}?return false;/.test(send), 'and returns FALSE rather than sending');
t(send.indexOf('_dfBlockedNow')<send.indexOf('textClient('), 'the check happens BEFORE the handoff, not after');
const bsend=grab('function crmBatchSend(){','function crmBatchSkip(');
t(/crmSend\(it\.id\)!==false/.test(bsend), 'the batch run reads that answer');
t(/if\(!went\)\{[^}]*return; \}/.test(bsend), 'and stops on the card instead of counting it sent');
t(bsend.indexOf('if(!went)')<bsend.indexOf('b.sent++'), 'nothing is counted as sent before the refusal is checked');
const q=grab('function _crmBatchQueue(){','function crmBatchOpen(){');
t(/_dfHardTells\(p\.draft\.text\)\.length\) return false/.test(q),
  'and a banned draft never enters a run at all - going fast is exactly when it would slip past');

// ===== IT SAYS SO ON THE SCREEN =========================================
console.log('\n  AND HE CAN SEE IT BEFORE HE TAPS:');
t(/_dfHeld\?'HELD'/.test(src), 'the board button reads HELD, not SEND');
t(/_cbHeld\?' held'/.test(src), 'and the batch card button too');
t(/function _dfBlockLive\(/.test(src), 'and it updates live while he types');
const live=grab('function _dfBlockLive(','function _dfEdHead(');
t(!/innerHTML/.test(live), 'without a repaint, so the caret stays in the box he is typing in');
t(/_dfBlockLive\(row\.parentNode\)/.test(src.slice(src.indexOf('function _dfEdIn('), src.indexOf('function _dfBlockLive('))),
  'called on every keystroke in a bubble');
t(/\.dfTells span\.hard\{/.test(src) && /\.dfBlock\{/.test(src), 'styled, and the hard ones are a different colour from the notes');
['.dfBlock{','.dfTells span.hard{','.crmSend.held,.cbBig.held{'].forEach(sel=>{
  const i=src.indexOf(sel);
  t(i>0 && src.slice(0,i).lastIndexOf("+'")>src.slice(0,i).lastIndexOf('\n'), sel+' is one quoted line');
});

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all ban-enforcement assertions pass');
process.exit(0);
