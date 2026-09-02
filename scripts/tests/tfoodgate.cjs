// THE FOOD NETS MAY ONLY SPEAK WHEN THE TURN OFFERED A NEW ENTRY (2 Sep).
//
// Three nets guard against Jim claiming a write that never happened. Two of
// them read Jim's REPLY alone, so a reply ABOUT an entry that already exists —
// a recap, an answer to "did you log it" — was replaced with "I don't think
// that actually saved". This suite holds both directions at once: the recap
// shapes must pass, and the phantom log must still be caught.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function one(sw){ return L[L.findIndex(l=>l.startsWith(sw))]; }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
const PIECES=[
  one('var _JIM_DOW='), one('var _JIM_MONTHS='), one('var _JIM_ADMIN_WORD='),
  multi('var _JIM_BODY_PART ='), multi('var _JIM_SESSION_DAY ='),
  multi('var _JIM_WO_RE=new RegExp('), multi('var _JIM_CARDIO_RE=new RegExp('),
  multi('var _JIM_ECHO_ACTIVITY_RE=new RegExp('), multi('var _JIM_SLOT_WORDS_RE=new RegExp('),
  multi('var _JT_PAST_MEAL_RE=new RegExp('), multi('var _JIM_NUM_CLAUSES='),
  multi('var _JIM_SELFTALK_RE=new RegExp('), multi('var _JIM_FOODNOTE_RE=new RegExp('),
  multi('var _JIM_FOODREMARK_RE=new RegExp('),
  multi('var _JIM_CLAIM_VERB ='), multi('var _JIM_CLAIM_EXISTS_RE=new RegExp('),
  multi('var _JIM_CLAIM_FOOD_RE=new RegExp('), multi('var _JIM_CLAIM_FOOD2_RE=new RegExp('),
  multi('var _JIM_ASKS_FIRST_RE=new RegExp('),
  grab(l=>l.startsWith('function _jimIsAdminOnly(')),
  grab(l=>l.startsWith('function _jimLooksLikeWorkout(')),
  grab(l=>l.startsWith('function _jimDropAsides(')),
  grab(l=>l.startsWith('function _jimEchoWords(')),
  grab(l=>l.startsWith('function _jimWithoutNumbers(')),
  grab(l=>l.startsWith('function _jimLooksLikeMeal(')),
  grab(l=>l.startsWith('function _jimTurnOffersFood(')),
].join('\n');
eval(PIECES);
require('./_guard.cjs')(['_JIM_CLAIM_FOOD_RE','_JIM_CLAIM_FOOD2_RE','_JIM_CLAIM_EXISTS_RE',
  '_JIM_ASKS_FIRST_RE','_jimTurnOffersFood','_jimLooksLikeMeal','_jimEchoWords',
  '_jimWithoutNumbers','_jimIsAdminOnly','_jimLooksLikeWorkout','_jimDropAsides',
  '_JT_PAST_MEAL_RE','_JIM_SLOT_WORDS_RE','_JIM_NUM_CLAUSES','_JIM_ECHO_ACTIVITY_RE',
  '_JIM_CARDIO_RE','_JIM_WO_RE','_JIM_ADMIN_WORD'], function(n){ return eval(n); });
const lifted={unresolved:[]};
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// The decision the engine makes, in the engine's own order.
// _foodExpected / _rawReplyHadFoodTag are the "nothing was written" state the
// guard only ever speaks in.
function fires(text, reply, hasPhoto){
  let offered=false;
  try{ offered=_jimTurnOffersFood(text, !!hasPhoto); }catch(e){}
  if(!offered) return '';
  const m = _JIM_CLAIM_FOOD_RE.exec(reply)   ? 'FOOD_RE'
          : _JIM_CLAIM_FOOD2_RE.exec(reply)  ? 'FOOD2_RE'
          : _JIM_CLAIM_EXISTS_RE.exec(reply) ? 'EXISTS_RE' : '';
  return m;
}
// The nets with NO gate at all — what shipped at v7.980.915 for FOOD_RE/FOOD2_RE.
function firesOld(text, reply){
  if(_JIM_CLAIM_FOOD_RE.exec(reply))  return 'FOOD_RE';
  if(_JIM_CLAIM_FOOD2_RE.exec(reply)) return 'FOOD2_RE';
  let meal=false; try{ meal=_jimLooksLikeMeal(text); }catch(e){}
  if(meal && _JIM_CLAIM_EXISTS_RE.exec(reply)) return 'EXISTS_RE';
  return '';
}

// ===== PROOF 1. The six measured strings from the order. =================
// `turn` is the client sentence that produced the reply. The first three are
// replies ABOUT a stored entry and must now pass. The last three were already
// passing and must stay passing.
const SIX=[
  ['Did you log it for yesterday, Aug 31st on Monday for dinner?',
   'Yes - logged for yesterday, Aug 31st, as dinner.',              'pass'],
  ['Did you log it for yesterday, Aug 31st on Monday for dinner?',
   "That's already logged for Monday dinner.",                      'pass'],
  ['Did you log it for yesterday, Aug 31st on Monday for dinner?',
   'I logged it yesterday for dinner, yes.',                        'pass'],
  ['Did you log it for yesterday, Aug 31st on Monday for dinner?',
   'Logged - 1,632 cal, 76g protein.',                              'pass'],
  ['Did you log it for yesterday, Aug 31st on Monday for dinner?',
   "You're at 2040 cal for the day.",                               'pass'],
  ['Did you log it for yesterday, Aug 31st on Monday for dinner?',
   'Yes, that one is on your day.',                                 'pass'],
];
console.log('\nPROOF 1 - the six measured strings, before and after');
console.log('  BEFORE = no gate on FOOD_RE/FOOD2_RE (v7.980.915)');
SIX.forEach(([turn,reply,want])=>{
  const before=firesOld(turn,reply), after=fires(turn,reply,false);
  const line='before['+(before||'ok     ')+'] after['+(after||'ok     ')+']  '+JSON.stringify(reply);
  t(want==='pass' ? after==='' : after!=='', line);
});

// ===== PROOF 2. The phantom log must still be caught. ====================
// A reply claiming a meal over NO marker, on a turn that DID offer one.
console.log('\nPROOF 2 - the phantom log, which is what these nets exist for');
const PHANTOM=[
  ['I had a chicken bowl for lunch',        'Logged - chicken bowl. 620 cal, 48g protein.'],
  ['I had a chicken bowl for lunch',        'Saved your lunch.'],
  ['I had a chicken bowl for lunch',        "Got it - it's on your day."],
  ['3 eggs and toast',                      'Added your breakfast.'],
  ['log 8oz chicken breast',                'Logged - 8oz chicken breast, 250 cal.'],
  ['I had chicken and rice, is that ok?',   'Logged - chicken and rice. 600 cal, 45g protein.'],
  ['half block extra firm tofu with teriyaki sauce and 1 cup guava juice',
                                            'Logged - 280 cal, 16g protein, 42g carbs, 6g fat.'],
  [null,                                    'Logged - salami, 100 cal.', true],
];
PHANTOM.forEach(([turn,reply,photo])=>{
  const net=fires(turn,reply,!!photo);
  t(!!net, 'caught['+(net||'NOTHING')+']  turn='+JSON.stringify(turn)+(photo?' +photo':'')+'  reply='+JSON.stringify(reply));
});

// ===== The gate itself, both directions. =================================
console.log('\nTHE GATE - what counts as an offer');
[['I had a chicken bowl for lunch',true],
 ['I had chicken and rice, is that ok?',true],
 ['3 eggs and toast',true],
 ['Oatmeal cranberry muffin',true],
 ['Did you log it for yesterday, Aug 31st on Monday for dinner?',false],
 ['Did you log the tofu I had yesterday?',false],
 ['Was the muffin 300 cal?',false],
 ['Is that logged?',false],
 ['What I had for lunch was chicken',true],
 ['how many calories am I at?',false],
].forEach(([s,want])=>{
  let got=false; try{ got=_jimTurnOffersFood(s,false); }catch(e){}
  t(got===want, (want?'offer   ':'not     ')+JSON.stringify(s)+'  got='+got);
});

if(lifted.unresolved.length) console.log('\n  unresolved: '+lifted.unresolved.join(' '));
console.log(bad? ('\nFAILED '+bad) : '\nall green');
process.exit(bad?1:0);
