// A CLAIM IS A CLAIM, WHATEVER WORDS IT USES — permanent (24 Aug ruling).
//
// Three false-success nets — food, weight, workout — each tested the SAME three
// words: logged, added, saved. "Push at 6 AM — it's on your day" says none of
// them and asserts a record exists just as hard. It went out over an empty day
// and was caught on the live app by reading the row back, not by this list.
//
// So this suite measures the net against REPLIES, the way the food and weight
// nets were built: it prints what the widening catches that the old three-word
// net missed, and holds the line on what must never be corrected.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

eval([
  multi('var _JIM_SESSION_DAY ='), multi('var _JIM_WO_RE=new RegExp('), multi('var _JIM_CARDIO_RE=new RegExp('),
  multi('var _JIM_CLAIM_VERB ='),
  multi('var _JIM_CLAIM_EXISTS_RE=new RegExp('),
  multi('var _JIM_CLAIM_WO_RE=new RegExp('), multi('var _JIM_CLAIM_WT_RE=new RegExp('),
  multi('var _JIM_CLAIM_FOOD_RE=new RegExp('), multi('var _JIM_CLAIM_FOOD2_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimLooksLikeWorkout(')),
].join('\n'));

// The net as it stood before the widening — kept here as the BASELINE so the
// gain is measured rather than asserted.
const OLD_WO=/\b(logged|added|saved)\b[^.!\n]{0,50}\b(walk|workout|session|run|lift|training|cardio)\b/i;
const OLD_WT=/\b(logged|added|saved)\b[^.!\n]{0,50}\b(?:weight(?!\s*(?:training|session|lifting|room|class|workout))|weigh-?in|weighed)\b/i;
const OLD_FOOD=/\b(logged|added|saved)\b[^.!\n]{0,60}\b(meal|breakfast|lunch|dinner|snack)\b/i;

// Replies that ASSERT a record exists. Every one must be caught.
// `sub` is which net sees it: the verb nets always, the verb-free form only
// when the client's own sentence was about that thing.
const CLAIMS=[
  ['Push at 6 AM — it’s on your day.',            'wo'],   // THE ONE THAT GOT THROUGH
  ["Push at 6 AM — it's on your day.",                 'wo'],
  ['Got it — that’s in your log.',                'wo'],
  ['They are on your week now.',                       'wo'],
  ['That is all in your record.',                      'wo'],
  ['Put that down for you — leg day, 6 AM.',           'wo'],
  ['Got that down: 45 minute walk.',                   'wo'],
  ['Tracked your session.',                            'wo'],
  ['Recorded your cardio for today.',                  'wo'],
  ['Captured the workout.',                            'wo'],
  ['Logged your workout.',                             'wo'],  // the old net caught this one
  ['Recorded your weigh-in at 195.',                   'wt'],
  ['Put that down — weight 195.',                      'wt'],
  ['Tracked your weight for today.',                   'wt'],
  ['Captured your breakfast.',                         'food'],
  ['Put down your lunch for you.',                     'food'],
  ['Recorded 620 cal.',                                'food'],
];
// Replies that must NEVER be corrected — Jim talking, not claiming.
const SAFE=[
  'Noted. That’s a Yusuf call, I’ll make sure he sees it.',
  'Noted — I’ll flag your knee to Yusuf before your next session.',
  'Marked done.',
  'You’re at 2040 cal for the day.',
  'Nice work today.',
  'What did you do at the gym?',
  'Which workout was it — Push or Pull?',
  'That’s a solid week of training.',
  'Your last session was Tuesday.',
];
const anyNew=(r,sub)=>{
  if(sub==='wo'   && (_JIM_CLAIM_WO_RE.test(r)   || _JIM_CLAIM_EXISTS_RE.test(r))) return true;
  if(sub==='wt'   && (_JIM_CLAIM_WT_RE.test(r)   || _JIM_CLAIM_EXISTS_RE.test(r))) return true;
  if(sub==='food' && (_JIM_CLAIM_FOOD_RE.test(r) || _JIM_CLAIM_FOOD2_RE.test(r) || _JIM_CLAIM_EXISTS_RE.test(r))) return true;
  return false;
};
const anyOld=(r)=>OLD_WO.test(r)||OLD_WT.test(r)||OLD_FOOD.test(r);

console.log('  every reply that asserts a record exists is caught:');
let gained=0;
CLAIMS.forEach(([r,sub])=>{
  const now=anyNew(r,sub), before=anyOld(r);
  if(now && !before) gained++;
  t(now, (before?'caught before too  ':'NEWLY CAUGHT       ')+JSON.stringify(r.slice(0,52)));
});
console.log('\n  what the widening adds: '+gained+' of '+CLAIMS.length+' were missed by the old three-word net');
t(gained>=12, 'the widening is the point, and it is measurable', gained+' newly caught');

console.log('\n  and Jim talking is never corrected:');
SAFE.forEach(r=>{
  const hit=_JIM_CLAIM_WO_RE.test(r)||_JIM_CLAIM_WT_RE.test(r)||_JIM_CLAIM_FOOD_RE.test(r)
    ||_JIM_CLAIM_FOOD2_RE.test(r)||_JIM_CLAIM_EXISTS_RE.test(r);
  t(!hit, 'quiet   '+JSON.stringify(r.slice(0,52)));
});

console.log('\n  one vocabulary, not three copies:');
t(/var _JIM_CLAIM_VERB =/.test(src), 'the claim verbs are declared once');
['_JIM_CLAIM_WO_RE','_JIM_CLAIM_WT_RE','_JIM_CLAIM_FOOD_RE','_JIM_CLAIM_FOOD2_RE'].forEach(n=>{
  t(new RegExp('var '+n+'=new RegExp\\("\\\\\\\\b"\\+_JIM_CLAIM_VERB').test(src), n+' consumes them');
});
// No net may go back to hard-coding the three words.
t(!/\\b\(logged\|added\|saved\)\\b/.test(src), 'no net hard-codes logged/added/saved any more');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
