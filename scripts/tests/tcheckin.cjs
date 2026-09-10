// ONE BOX, FIVE PILLS (Yusuf, 10 Sep 8:15am). "check-in, that's it. That's all
// it says and then progress fitness nutrition ... when I click a pill it goes
// Fitness: inside the text box ... Also remove placeholder text."
// Replaces the four-prompt fold, which he tapped on his phone and nothing
// opened (the host stayed `hidden`).
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
let box=null;
global.window={}; global.document={getElementById:(id)=>id==='ciBox'?box:null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
global._tlDateStr=()=>'Sep 10, 2026';
const MINE=['_CI_PILLS','_ciState','_ciText','ciType','_ciPillsHtml','_ciPillsPaint','ciPill','_ciTodayHtml','_tlCheckinBlock'];
const CL=closure(MINE); eval(CL.code||''); guard(MINE, n=>eval(n));
const src=fs.readFileSync('index.html','utf8');
cl={code:'zzscratchnotaclient'};

console.log('\n  THE CARD:');
let h=_tlCheckinBlock('Sep 10, 2026', true, false);
t(/tlMealsEy">Check in</.test(h), 'headed Check in like Food and Stats');
t(/class="ciTitle">Check in</.test(h), 'and the card says Check in, that is all');
t(_CI_PILLS.join(',')==='Fitness,Nutrition,Sleep,Energy,Progress', 'five pills: Fitness, Nutrition, Sleep, Energy, Progress');
t((h.match(/class="ciPill"/g)||[]).length===5, 'all five drawn, none lit at rest');
t(/<textarea class="ciTa ciBox" id="ciBox"[^>]*><\/textarea>/.test(h), 'one blank box');
t(!/placeholder=/.test(h), 'NO placeholder text anywhere in the card');
t(!/four taps|How today went|Tell Yusuf/.test(h), 'none of the old prompt copy');
t(/id="ciSaveAll"[^>]*>Save</.test(h), 'one Save');
t(!/ciRow_all|dayCheckinHost|data-tl="ciall"/.test(h), 'the fold that did not open is gone');

console.log('\n  A PILL DROPS ITS HEADING INTO THE BOX:');
box={value:'', style:{}, scrollHeight:120, focus(){ this.focused=true; }, setSelectionRange(a,b){ this.sel=[a,b]; }};
ciPill('Fitness');
t(box.value==='Fitness:\n', 'empty box: "Fitness:" then a new line');
t(box.sel && box.sel[0]===box.value.length, 'cursor sits under the heading');
t(box.focused===true, 'and the box has focus');
box.value='Fitness:\nbench felt heavy'; ciType(box.value);
ciPill('Sleep');
t(box.value==='Fitness:\nbench felt heavy\n\nSleep:\n', 'a second pill goes under what they wrote, one blank line between');
ciPill('Fitness');
t(box.value==='Fitness:\nbench felt heavy\n\nSleep:\n', 'a pill already in the box is not added twice');
h=_ciPillsHtml();
t(/class="ciPill on"[^>]*>Fitness</.test(h) && /class="ciPill on"[^>]*>Sleep</.test(h) && /class="ciPill"[^>]*>Energy</.test(h), 'pills in the box read lit, the others not');
ciType('');
t(!/ciPill on/.test(_ciPillsHtml()), 'clearing the box unlights them');

console.log('\n  WHERE IT LIVES:');
t(_tlCheckinBlock('Sep 11, 2026', false, true)==='', 'not on a day that has not happened');
t(_tlCheckinBlock('Sep 9, 2026', false, false)==='', 'not on a past day - a check in is about today');
window._tlRO=true; t(_tlCheckinBlock('Sep 10, 2026', true, false)==='', 'never on the trainer read-only copy'); window._tlRO=false;
t(!/isTrainer\(cl\.code\)\); \}catch\(e\)\{\}\s*\n\s*if\(_isTr\) return '';/.test(src.slice(src.indexOf('function _tlCheckinBlock'), src.indexOf('async function ciSaveAll'))), 'and it draws on the trainer own day too (10 Sep)');

console.log('\n  THE SAVE:');
const save=src.slice(src.indexOf('async function ciSaveAll'), src.indexOf('function _tlLateAsks'));
t(/journal_entries/.test(save), 'writes journal_entries - the table every trainer feed reads');
t((save.match(/shared:true/g)||[]).length>=4, 'shared:true on every rung of the ladder');
t(/entry_type:'checkin'/.test(save), 'entry_type checkin');
t(/A heading with nothing under it is not an entry/.test(save) && /Say a word first/.test(save), 'a bare heading does not save');
t(/return;\s+\/\* the box keeps their words \*\//.test(save), 'a failed save keeps their words in the box');

console.log(bad?('\n'+bad+' FAILED'):'\n  all check-in assertions pass');
process.exit(bad?1:0);
