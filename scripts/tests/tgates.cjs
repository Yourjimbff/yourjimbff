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
  one('var _JT_PROG_RE='), one('var _JT_CLIENT_RE='), one('var _JT_LOG_INTENT_RE='),
  one('var _JT_OWN_DAY_RE='), one('var _JT_OWN_SUBJ_RE='),
  grabFn('_jtMealMove'), grabFn('_jtCalendarClaims'), grabFn('_jtWantsMarker'),
  grabFn('_jtIsQuestion'), grabFn('_jtOwnDayQuestion')].join('\n'));

guard(['_JT_MEAL_NOUN_RE','_JT_DAY_TARGET_RE','_JT_CAL_ONLY_RE','_JT_LOG_INTENT_RE',
  '_JT_OWN_DAY_RE','_JT_OWN_SUBJ_RE','_jtMealMove','_jtCalendarClaims','_jtWantsMarker',
  '_jtIsQuestion','_jtOwnDayQuestion'], n=>eval(n));

console.log('\n  GATE 1 — his meal sentences reach the logging engine:');
[['move my breakfast to yesterday',false],
 ['move my lunch to today',false],
 ['move my dinner to Saturday',false],
 ['move his breakfast to Monday',false],
 ['move her snack to yesterday',false],
 ['move my breakfast to the 22nd',false]
].forEach(([s,claim])=>t(_jtCalendarClaims(s)===claim,'"'+s+'" reaches logging'));

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

console.log('\n  GATE 3 — a question about his own day reaches the engine that holds it:');
const reaches=s=>(!_jtIsQuestion(s) || _jtOwnDayQuestion(s));
[['what did I eat today',true],
 ['did my lunch save?',true],
 ['show me my breakfast',true],
 ['how many calories have I had',true],
 ['is my breakfast on the right day?',true],
 ['log my breakfast, three eggs',true]
].forEach(([s,ok])=>t(reaches(s)===ok,'"'+s+'" reaches the engine'));

console.log('\n  and a question that is not about his own food still does not:');
[['who are all my calls for the next two days?',false],
 ['who needs me today?',false],
 ['what does her week look like?',false]
].forEach(([s,ok])=>t(reaches(s)===ok,'"'+s+'" stays with the board'));

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
t(_jtCalendarClaims('move my breakfast to yesterday')===false,
  'and the trainer side can now reach the same engine to do it');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
