// HIS ANSWER COMPLETES THE RECORD, AND A ROW THAT LANDED IS SAID.
// Permanent (Yusuf, 24 Aug — both on camera).
//
// "did my workout at 6 this morning" logs at once and lands as "Workout",
// because he named no split and nothing here invents one. The model then asks
// WHICH workout; he answers "today's Push", and that answer used to reach
// nothing. The row kept the generic name while he had just said the real one
// out loud — which on camera reads as the app not listening.
//
// And the mirror: every net in this engine points one way, catching a reply
// that CLAIMS more than the table holds. A described session produces the other
// shape — the row lands from the extractor while the words ask a question, so
// nothing tells him a record exists and he logs it a second time.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([
  multi('var _JIM_BODY_PART ='), multi('var _JIM_SPLIT_RE=new RegExp('),
  multi('var _JIM_CLAIM_VERB ='), multi('var _JIM_CLAIM_EXISTS_RE=new RegExp('),
  multi('var _JIM_SESSION_DAY ='), multi('var _JIM_CLAIM_WO_RE=new RegExp('),
  grab(l=>l.startsWith('function _titleCap(')),
  grab(l=>l.startsWith('function _jimTitleFromWords(')),
  grab(l=>l.startsWith('function _jimOnlyNamesSplit(')),
].join('\n'));
require('./_guard.cjs')(['_JIM_BODY_PART','_JIM_SPLIT_RE','_JIM_CLAIM_EXISTS_RE','_JIM_CLAIM_WO_RE',
                         '_titleCap','_jimTitleFromWords','_jimOnlyNamesSplit'], function(n){ return eval(n); });
let bad=0;
const t=(got,want,label)=>{ const ok=JSON.stringify(got)===JSON.stringify(want); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+'  -> '+JSON.stringify(got)+(ok?'':'   (wanted '+JSON.stringify(want)+')')); };

console.log('  an answer that is ONLY a split name finishes the row:');
t(_jimOnlyNamesSplit("today's Push"),   'Push',      'his actual answer');
t(_jimOnlyNamesSplit('Push'),           'Push',      'just the word');
t(_jimOnlyNamesSplit('it was push day'),'Push Day',  'a whole short sentence');
t(_jimOnlyNamesSplit('chest day'),      'Chest Day', 'another split');
t(_jimOnlyNamesSplit('yeah, legs'),     'Legs',      'agreeing and naming it');

console.log('\n  and a sentence that is a LOG in its own right never renames:');
t(_jimOnlyNamesSplit('push day, bench press 185 for 8'), '', 'a real session log');
t(_jimOnlyNamesSplit('did my push day at 6 with bench press'), '', 'a session with detail');
t(_jimOnlyNamesSplit('I had chicken and rice'), '', 'a meal');
t(_jimOnlyNamesSplit('8000 steps yesterday'), '', 'a step count');
t(_jimOnlyNamesSplit('how was my push day'), '', 'a question about one');
t(_jimOnlyNamesSplit(''), '', 'nothing said');

console.log('\n  every part he trains names its own session:');
['push','pull','chest','back','arm','shoulder','leg','glute','tricep','bicep',
 'core','abs','hamstring','quad','trap','calves'].forEach(function(p){
  const got=_jimTitleFromWords('did my '+p+' day at 6');
  t(!!got, true, 'names '+p+' day  ('+got+')');
});
// A session he named NOTHING about stays generic — inventing a split would be
// the app guessing at his training.
t(_jimTitleFromWords('did my workout at 6 this morning'), '', 'and an unnamed one invents nothing');
t(_jimTitleFromWords('trained at 6'), '', 'nor does a bare "trained"');

console.log('\n  the rename is narrow, and reads its own write back:');
const RN=(src.match(/HIS ANSWER COMPLETES THE RECORD[\s\S]{0,4000}?follow-up rename/)||[''])[0];
t(!!RN, true, 'the rename path exists');
t(/!_woExpected && !_foodExpected/.test(RN), true, 'only when this turn wrote nothing');
t(/_generic/.test(RN) && /workout\|training\|session\|exercise/.test(RN), true, 'only over a generic title');
t(/Date\.now\(\)-\(_lw\.at\|\|0\)\) < 15\*60\*1000/.test(RN), true, 'only on a row minutes old');
t(/_sameWho/.test(RN), true, 'only on the same account');
t(/workout_logs\?id=eq\.'\+encodeURIComponent\(_lw\.id\)\+'&select=title/.test(RN), true, 'and it reads the title back');
t(/could not rename it/.test(RN), true, 'a rename that did not land says so');

console.log('\n  a row that landed is always said:');
const SD=(src.match(/A ROW THAT LANDED MUST BE SAID[\s\S]{0,1600}?landed but unsaid/)||[''])[0];
t(!!SD, true, 'the mirror exists');
t(/_woVerified > 0/.test(SD), true, 'it reads the READ-BACK count, not the parse count');
t(/_JIM_CLAIM_WO_RE\.test\(reply\)/.test(SD), true, 'it stays quiet when the reply already said so');
t(/_jimAlreadySaidFail\(reply\)/.test(SD), true, 'and never argues with a failure line');
t(!/sbInsert|sbUpsert|logWorkoutFromOffer/.test(SD), true, 'it writes nothing of its own');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
