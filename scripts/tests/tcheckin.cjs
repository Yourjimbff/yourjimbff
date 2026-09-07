// THE CHECK IN (Yusuf, order, 6-7 Sep): "Bring in the old check in form.
// Training - sleep - nutrition - progress. Those 4 prompts bring down the
// corresponding category for them to input data ... And they can stack."
//
// The thing this file guards above all: IT REACHES HIM. The old form died on
// 6 Aug for writing journal_entries without the shared flag every trainer feed
// filters on - clients filled it in and he never saw a word.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
global._tlDateStr=()=>'Sep 7, 2026';
const MINE=['_CI_CATS','_ciCat','_ciState','_ciRowsHtml','_ciBodyHtml','_tlCheckinBlock','_ciBody'];
const CL=closure(MINE); eval(CL.code||''); guard(MINE, n=>eval(n));
const src=fs.readFileSync('index.html','utf8');
cl={code:'zzscratchnotaclient'};

console.log('\n  FOUR PROMPTS, HIS FOUR:');
t(_CI_CATS.map(c=>c.name).join(',')==='Training,Sleep,Nutrition,Progress', 'Training, Sleep, Nutrition, Progress, in that order');
t(_CI_CATS.every(c=>['training','sleep','food','progress'].includes(c.type)), 'each maps to an entry_type the journal already uses');
let h=_ciRowsHtml('Sep 7, 2026');
t((h.match(/class="ciRow"/g)||[]).length===4, 'four rows, all closed at rest');
t(!/ciBody/.test(h), 'no body drawn until one is opened');
t(!/[\u{1F000}-\u{1FAFF}]/u.test(h), 'no emoji - the old form had them on every row, house law now');

console.log('\n  THEY DROP DOWN, AND THEY STACK:');
_ciState().open.sleep=true; _ciState().open.nutrition=true;
h=_ciRowsHtml('Sep 7, 2026');
t((h.match(/class="ciRow open"/g)||[]).length===2, 'two open at once - they stack');
t(/id="ciHoursN"/.test(h) && /ciHours\(-0\.5\)/.test(h), 'sleep carries the hours control');
t(/How was your eating\?/.test(h) && /Off<\/div>/.test(h) && /On point<\/div>/.test(h), 'nutrition carries its own question and pills');
t((h.match(/ciSave_/g)||[]).length===2, 'each open body has its own Save');
t(/id="ciTa_sleep"/.test(h) && /id="ciTa_nutrition"/.test(h), 'and its own Tell Yusuf box');
_ciState().pick.nutrition='Mostly';
h=_ciRowsHtml('Sep 7, 2026');
t(/ciPill on"[^>]*>Mostly</.test(h), 'a picked answer reads picked after a repaint - state lives on window, not in the DOM');
_ciState().note.nutrition='Skipped breakfast twice.';
h=_ciRowsHtml('Sep 7, 2026');
t(/Skipped breakfast twice\./.test(h), 'and so does what they typed');

console.log('\n  THE SENTENCE THE FEED PRINTS:');
_ciState().hours=6.5; _ciState().pick.sleep='Good'; _ciState().note.sleep='Up at 3 once.';
t(_ciBody(_ciCat('sleep'))==='Sleep: 6.5h, good. Up at 3 once.', 'self-describing: "Sleep: 6.5h, good. Up at 3 once."', _ciBody(_ciCat('sleep')));
t(_ciBody(_ciCat('nutrition'))==='Nutrition: mostly. Skipped breakfast twice.', 'nutrition the same way', _ciBody(_ciCat('nutrition')));
_ciState().pick.training=''; _ciState().note.training='Legs felt heavy';
t(_ciBody(_ciCat('training'))==='Training: Legs felt heavy', 'no pick, just words, still says which prompt it was', _ciBody(_ciCat('training')));

console.log('\n  DONE READS AS DONE:');
_ciState().today={sleep:'Sleep: 6.5h, good. Up at 3 once.'};
_ciState().open={};
h=_ciRowsHtml('Sep 7, 2026');
t(/class="ciRow done" id="ciRow_sleep"/.test(h) && /ciDot/.test(h), 'a saved prompt gets the gold dot');
t(/6\.5h, good\. Up at 3 once\./.test(h) && !/Hours and how it felt/.test(h), 'and its sub line becomes what they said, not the prompt');

console.log('\n  WHERE IT LIVES:');
window._tlRO=false; window._dayCallsHtml='<div id="dayCallsCard"></div>';
global.isTrainer=()=>false;
const blk=_tlCheckinBlock('Sep 7, 2026', true, false);
t(/tlMealsEy">Check in</.test(blk), 'a Check in block, headed like Food and Stats');
t(blk.indexOf('dayCallsCard')>0 && blk.indexOf('dayCallsCard')<blk.indexOf('dayCheckinHost'), 'the check-in call button sits at the top of it, above the four prompts');
t(_tlCheckinBlock('Sep 8, 2026', false, true)==='', 'not on a day that has not happened');
t(_tlCheckinBlock('Sep 6, 2026', false, false)==='', 'not on a past day - a check in is about today');
window._tlRO=true; t(_tlCheckinBlock('Sep 7, 2026', true, false)==='', 'never on the trainer read-only copy'); window._tlRO=false;
// the real isTrainer was lifted (it reads TRAINER_CODES), so the trainer case is made the real way
TRAINER_CODES.push('zztrainerfortest'); cl={code:'zztrainerfortest'};
t(_tlCheckinBlock('Sep 7, 2026', true, false)==='', 'and never on the trainer own day');
TRAINER_CODES.pop(); cl={code:'zzscratchnotaclient'};

console.log('\n  IT REACHES HIM:');
const save=src.slice(src.indexOf('async function ciSave('), src.indexOf('function _tlLateAsks('));
t(/journal_entries/.test(save), 'writes journal_entries - the table every trainer feed reads');
const tries=save.slice(save.indexOf('var tries=['), save.indexOf('];', save.indexOf('var tries=['))+2);
const rungs=tries.split('\n').filter(l=>/client_code|Object\.assign/.test(l));
t(rungs.length===4 && rungs.every(l=>/shared:true/.test(l)), 'shared:true on EVERY rung of the fallback ladder - the whole lesson of 6 Aug', rungs.length+' rungs');
t(/if\(!saved\)\{[\s\S]{0,300}return;/.test(save), 'a failed save keeps the body open - nothing typed is lost');
t(/showToast\('\\u2713 Sent to Yusuf'\)/.test(save), 'and a good one says where it went');
t(/_ciLoad\(true\)/.test(save), 'then re-reads today so the row reads done off the row, not off hope');
const load=src.slice(src.indexOf('async function _ciLoad('), src.indexOf('function _ciRepaint('));
t(/date_str=eq\./.test(load) && /client_code=eq\./.test(load), 'done state is read for THIS client, THIS day');
t(/if\(a==='citog'\)/.test(src), 'the head is wired through the day dispatcher');
t(/if\(document\.getElementById\('dayCheckinHost'\)\) _ciLoad\(false\);/.test(src), 'and today\'s answers load after the day paints');

// _ci is window._ci in this feature; the bare _ci elsewhere in the file is a
// for-loop counter in _jvTokBase's caller, not a global.
const holes=CL.unresolved.filter(n=>n!=='_ci').filter(n=>{
  const stripped=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').split('window.'+n).join('window.__WINPROP__');
  return new RegExp('(^|[^.A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(stripped);
});
t(holes.length===0, 'the lifted closure has no holes', holes.join(','));

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all check-in assertions pass');
process.exit(0);
