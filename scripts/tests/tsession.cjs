// A REPORTED SESSION IS A LOG — permanent, by his ruling (24 Aug).
//
// THE CARDINAL FAILURE, caught on the deployed page by a read-back: "did my
// workout at 6 this morning" wrote NOTHING. The extractor that exists for a
// described session answers with an empty list when the sentence names no
// movements, and the write was gated on that list being non-empty — so the
// plainest report of a session had no path to a row. He was asked which workout,
// answered, and told "Push at 6 AM — it's on your day" over an empty day.
//
// Two things are held here: the sentence writes, and a reply may not claim a
// record exists when none does.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

eval([
  multi('var _JIM_SESSION_DAY ='), multi('var _JIM_WO_RE=new RegExp('), multi('var _JIM_CARDIO_RE=new RegExp('),
  multi('var _JIM_DID_SESSION_RE=new RegExp('), multi('var _JIM_INTENDS_RE=new RegExp('),
  multi('var _JIM_CLAIM_EXISTS_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimLooksLikeWorkout(')),
  grab(l=>l.startsWith('function _jimSaysDidSession(')),
].join('\n'));

console.log('  a session he reports WRITES, even with no exercises named:');
[ 'did my workout at 6 this morning',        // HIS CARDINAL SENTENCE
  'finished training at 7am',
  'hit the gym at 6',
  'worked out this morning',
  'trained legs',
  'got through my session',
  'smashed leg day',
  'did cardio before work',
].forEach(s=>t(_jimSaysDidSession(s)===true, 'writes  ', s));

console.log('\n  and it stands down where a phantom session would be worse:');
[ 'I had lunch after the gym',               // a MEAL — "had" is not a completion verb
  'should I work out at 6?',
  'going to the gym later',
  'I am planning to train at 6',
  'what workout is today',
  'I need to do my session tonight',
  'put Pilates at 6am on Tuesdays',
  'I had eggs and oats',
  '8000 steps yesterday',
].forEach(s=>t(_jimSaysDidSession(s)===false, 'quiet   ', s));

console.log('\n  a reply may not claim a record that does not exist:');
t(!!_JIM_CLAIM_EXISTS_RE.exec("Push at 6 AM — it's on your day."), 'the exact line that slipped through');
t(!!_JIM_CLAIM_EXISTS_RE.exec('Push at 6 AM — it’s on your day.'), 'and with a curly apostrophe');
t(!!_JIM_CLAIM_EXISTS_RE.exec('Got it, that is in your log.'), 'in your log');
t(!!_JIM_CLAIM_EXISTS_RE.exec('They are on your week now.'), 'on your week');
t(!_JIM_CLAIM_EXISTS_RE.exec('What did you do at the gym?'), 'a question is not a claim');
t(!_JIM_CLAIM_EXISTS_RE.exec('Nice work today.'), 'praise is not a claim');
// The claim net is only ever consulted for a sentence about a session, so a
// food turn saying the same words can never be corrected by the WORKOUT net.
t(_jimLooksLikeWorkout('did my workout at 6 this morning')===true, 'his sentence is session-shaped');
t(_jimLooksLikeWorkout('I had eggs and oats')===false, 'a meal sentence is not');

console.log('\n  the wiring, structurally:');
t(/_swBare=\(!_swEx\.length && _jimSaysDidSession\(text\)\)/.test(src), 'the fallback computes a bare session');
t(/if\(_swEx\.length \|\| _swBare\)\{/.test(src), 'and writes on exercises OR a bare session');
t(/if\(_jimLooksLikeWorkout\(text\)\) _woConfirmMatch=_JIM_CLAIM_EXISTS_RE\.exec\(reply\)/.test(src),
  'the claim net consults the new pattern, session sentences only');

// ===== ONE LIST OF SESSION WORDS, NOT THREE (24 Aug) ====================
// Three lists had drifted; all three knew leg/push/pull day and none knew
// chest, back, arms or shoulders. They share one fragment now.
eval([multi('var _JIM_CLAIM_VERB ='), multi('var _JIM_CLAIM_WO_RE=new RegExp(')].join('\n'));
console.log('\n  every split he trains is a session, in all three readers:');
['chest day','back day','arm day','arms day','shoulder day','shoulders day',
 'leg day','push day','pull day','core day','abs day','glutes day',
 'upper body','lower body','full body'].forEach(function(d){
  t(_jimLooksLikeWorkout('did my '+d+' at 6')===true, 'is a session   ', d);
  t(_jimSaysDidSession('did my '+d+' at 6')===true,   'logs a session ', d);
  t(_JIM_CLAIM_WO_RE.test('Put that down for you — '+d+', 6 AM')===true, 'a claim about it', d);
});

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
