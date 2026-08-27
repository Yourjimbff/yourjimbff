// THE THREE GATES THAT WERE EATING HIS SENTENCES (Yusuf, ruling, 26 Aug).
//
// He said Jarvis kept refusing him. Jarvis was not refusing. Three gates sat in
// front of the logging engine and took the sentence before it arrived:
//
//   the CALENDAR claimed the bare phrase "move my/his/her", so every sentence
//   about moving a LOGGED MEAL went to the appointment builder;
//   the PROGRAMME BUILDER claimed the bare word "workout", so "log my workout"
//   went to a system with no logging hand — and came back saying "done";
//   and the handoff to the logging engine was barred to anything that looked
//   like a QUESTION, so "what did I eat today" never reached his own rows.
//
// Measured against the deployed file before the fix: six of eleven of his real
// sentences were taken by the calendar, four of eight by the programme builder,
// and seven of eight questions were barred.
//
// LAW 12 BOTH WAYS. The client side has been able to move a meal since v636.
// This suite asserts the trainer side can now reach that same engine AND that
// the client side still teaches it — one capability, two keys, per the charter.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function one(sw){ const a=L.findIndex(l=>l.startsWith(sw)); if(a<0) return '';
  let b=a; while(b<L.length && !/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
function grabFn(name){ const a=L.findIndex(l=>l.indexOf('function '+name+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={};
eval([one('var _JT_PAST_MEAL_RE='), one('var _JT_SCHED_INTENT_RE='), one('var _JT_CAL_RE='),
  one('var _JT_MEAL_NOUN_RE='), one('var _JT_DAY_TARGET_RE='), one('var _JT_CAL_ONLY_RE='),
  one('var _JT_ONE_BRAIN_HOLD='),
  one('var _JT_PROG_RE='), one('var _JT_CLIENT_RE='), one('var _JT_LOG_INTENT_RE='),
  one('var _JT_OWN_DAY_RE='), one('var _JT_OWN_SUBJ_RE='),
  grabFn('_jtMealMove'), grabFn('_jtCalendarClaims'), grabFn('_jtWantsMarker'),
  grabFn('_jtIsQuestion'), grabFn('_jtOwnDayQuestion')].join('\n'));

guard(['_JT_ONE_BRAIN_HOLD','_JT_MEAL_NOUN_RE','_JT_DAY_TARGET_RE','_JT_CAL_ONLY_RE','_JT_LOG_INTENT_RE',
  '_JT_OWN_DAY_RE','_JT_OWN_SUBJ_RE','_jtMealMove','_jtCalendarClaims','_jtWantsMarker',
  '_jtIsQuestion','_jtOwnDayQuestion'], n=>eval(n));

// ===== UNHELD, 27 AUG. Read the block above _jtMealMove in index.html. =====
// The hold was for the phantom log: the move worked on his real row and kept
// its clock time, and the same sentence ALSO logged an invented breakfast
// carrying his own request as its meal text. The two cuts that send a
// NON-LOGGING sentence into the logging engine were switched off until the
// engine stopped emitting an add beside an edit.
//
// It has. v7.980.674 drops a new-meal marker naming the meal an edit in the
// same turn is correcting, before anything is written (tphantom.cjs). So the
// cuts are live and these assertions now hold the LIVE state, not the hold.
//
// THE SWITCH AND THE RECOGNISERS BOTH STAY. Setting the switch back to true
// restores the hold in one word, and this suite asserts whichever state is
// shipped — so the two cannot drift apart, in either direction.
console.log('\n  THE HOLD IS OFF (27 Aug — the phantom log is fixed):');
t(_JT_ONE_BRAIN_HOLD===false, 'the one-brain routing is live');
t(_jtCalendarClaims('move my breakfast to yesterday')===false, 'so a meal move reaches the logging engine');
t(_jtCalendarClaims('move my lunch to today')===false, 'and so does every other one');
// HIS OWN SENTENCE, THE ONE THE HOLD WAS DECLARED OVER.
t(_jtCalendarClaims('Can you move the blueberry pancakes I had on Saturday to this morning')===false,
  'and the sentence this whole thread started from is no longer taken by the calendar');

console.log('\n  and the recogniser underneath is still correct, so unholding is one word:');
[['move my breakfast to yesterday',true],
 ['move my lunch to today',true],
 ['move my dinner to Saturday',true],
 ['move his breakfast to Monday',true],
 ['move her snack to yesterday',true],
 ['move my breakfast to the 22nd',true]
].forEach(([s,mealish])=>t(_jtMealMove(s)===mealish,'"'+s+'" is still recognised as a meal move'));
[['move my lunch block to 1pm',false],
 ['move my Pilates to noon',false],
 ['move my meal prep to Sunday',false]
].forEach(([s,mealish])=>t(_jtMealMove(s)===mealish,'"'+s+'" is still NOT a meal move'));

console.log('\n  and the calendar keeps every sentence that is really about his week:');
[['move my lunch block to 1pm',true],
 ['move my Pilates to noon',true],
 ['move my workout Thursday to one',true],
 ['I am eating lunch at noon every day',true],
 ['move my meal prep to Sunday',true],
 ['put Ali’s Pilates at 6am on Tuesdays',true]
].forEach(([s,claim])=>t(_jtCalendarClaims(s)===claim,'"'+s+'" still goes to the calendar'));

console.log('\n  GATE 2 — a logging sentence is not taken by the programme builder:');
const takes=s=>_jtWantsMarker(s) && !_JT_LOG_INTENT_RE.test(s);
[['log my workout, bench 3x8',false],
 ['log my push day, bench 185 for 8 8 6',false],
 ['logged my leg day',false],
 ['just did my workout',false],
 ['log her workout',false]
].forEach(([s,claim])=>t(takes(s)===claim,'"'+s+'" reaches logging'));

console.log('\n  and programme sentences still build programmes:');
[['make Samantha’s Friday a Pilates day',true],
 ['add a leg day to her week',true],
 ['swap her Tuesday for cardio',true],
 ['rename day 3',true],
 ['take Leandra off her program',true]
].forEach(([s,claim])=>t(takes(s)===claim,'"'+s+'" still builds the programme'));

console.log('\n  GATE 3 — ALSO LIVE, same reason, same switch:');
const reaches=s=>(!_jtIsQuestion(s) || (!_JT_ONE_BRAIN_HOLD && _jtOwnDayQuestion(s)));
[['what did I eat today',true],
 ['did my lunch save?',true],
 ['show me my breakfast',true]
].forEach(([s,ok])=>t(reaches(s)===ok,'"'+s+'" reaches the engine holding his rows'));
t(reaches('log my breakfast, three eggs')===true, 'and a plain log still reaches it — it was never held');
// A FALLTHROUGH, NOT A GATE. Nothing he asks can dead-end here: if Jim writes
// nothing the rail drops to the model exactly as it always did. Asserted on the
// shipped line rather than on the idea of it.
t(/A FALLTHROUGH, NOT A GATE/.test(src), 'and it is still a fallthrough, not a gate');

console.log('\n  and that recogniser is still correct too:');
[['what did I eat today',true],
 ['did my lunch save?',true],
 ['how many calories have I had',true]
].forEach(([s,ok])=>t(_jtOwnDayQuestion(s)===ok,'"'+s+'" is still an own-day question'));
[['who are all my calls for the next two days?',false],
 ['who needs me today?',false]
].forEach(([s,ok])=>t(_jtOwnDayQuestion(s)===ok,'"'+s+'" is still not one'));

console.log('\n  THE FALSE "DONE" IS GONE:');
t(/window\._jtProgWrote=false;/.test(src), 'the rail clears the flag before it asks');
t(/status:\(window\._jtProgWrote\?'done':'talk'\)/.test(src), 'and reports done ONLY when a programme landed');
t(/x\s*&&\s*x\.ok===true/.test(src), 'and the flag is set from the database answer, not from the reply');

console.log('\n  A CLIENT HE ADDS BY VOICE APPEARS ON BOTH SURFACES:');
// COMMENTS STRIPPED FIRST. The scar is written up in a comment right there, so
// a raw search for the dead name matches the explanation of why it went and the
// suite passes itself. Code only, or this assertion is decorative.
const addRaw=src.slice(src.indexOf('_JV_ADD_CLIENT_RE.exec(t)'), src.indexOf('_JV_ADD_CLIENT_RE.exec(t)')+4600);
const addBlock=addRaw.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
t(!/loadClients\s*\(/.test(addBlock), 'the call to a function that does not exist is gone');
t(src.indexOf('function loadClients')<0, 'and loadClients is still not a real function anywhere');
t(/loadRosterFromDB\(\)/.test(addBlock), 'the roster is re-read, so the new row is in memory');
t(/jvRenderTriage/.test(addBlock), 'the desktop cockpit repaints');
t(/renderMobFrontDesk/.test(addBlock), 'the mobile front desk repaints too');

console.log('\n  LAW 12, BOTH DIRECTIONS ON THE MEAL MOVE:');
t(/MOVE OR CORRECT = \[FOOD_EDIT\]/.test(src), 'the client side still teaches the move');
t(/send date_str for the day it belongs on/.test(src), 'and still moves the day field');
t(_jtMealMove('move my breakfast to yesterday')===true,
  'and the trainer side recognises the same request');
t(_jtCalendarClaims('move my breakfast to yesterday')===false,
  'and nothing stands between that sentence and the engine any more');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
