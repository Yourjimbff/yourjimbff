// THE FIVE LAWS OF THE INVITE PARSE — permanent, by his ruling (30 Aug).
//
// The invite is the one act in this file that puts HIS WORDS on a client's
// screen unaltered. Everything else states something back in the app's voice;
// this hands three sentences he typed to a real person and asks her to answer
// them. So the parse is held to the five laws literally, and this suite is the
// thing that keeps it there:
//
//   1. The client is the @tag and nothing else. No tag, no action.
//   2. Questions verbatim. Never reworded, merged, or invented.
//   3. The remind-form is valid with zero questions.
//   4. Uncertain means one question back and zero execution. Never a partial.
//   5. Talking about a call, asking whether one is booked, cancel or
//      reschedule: none of these create anything.
//
// The function is lifted OUT of index.html by name, so this tests the shipped
// code rather than a copy of it, and breaks the day the seam moves.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); if(a<0) throw new Error('not found'); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); if(a<0) throw new Error('not found: '+sw); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }

// The roster this parse is run against. A STUB, deliberately: the hardcoded
// CLIENTS map in index.html is stale by its own admission, and a law about
// which tag resolves must be tested against a roster this file controls.
var CLIENTS={
  adrianap1:{name:'Adriana P'},
  blakeb1:{name:'Blake B'},
  yusuf1:{name:'Yusuf', isTrainer:true}
};

eval([
  multi('var _JV_INV_TAG_RE='),
  multi('var _JV_INV_ASK_RE='),
  multi('var _JV_INV_NOTHING_RE='),
  multi('var _JV_INV_ASKING_RE='),
  multi('var _JV_INV_POLITE_RE='),
  multi('var _JV_INV_VERB_RE='),
  multi('var _JV_INV_Q_MAX='),
  grab(l=>l.startsWith('function _jvParseInvite('))
].join('\n'));
require('./_guard.cjs')(['_JV_INV_TAG_RE','_JV_INV_ASK_RE','_JV_INV_NOTHING_RE','_JV_INV_ASKING_RE',
  '_JV_INV_POLITE_RE','_JV_INV_VERB_RE','_JV_INV_Q_MAX','_jvParseInvite'], function(n){ return eval(n); });

let fails=0, ran=0;
function ok(label, cond, got){
  ran++;
  if(!cond){ fails++; console.log('FAIL  '+label+(got===undefined?'':('\n      got: '+JSON.stringify(got)))); }
}

// ===== HIS COMMAND, CANONICAL, WORD FOR WORD ===============================
// The three questions are Yusuf's own, his punctuation, and they are the
// reason this suite exists. If this block ever goes red, a real client is
// about to be asked something he did not write.
const CANON = [
  'schedule a check in call with @adrianap1',
  'ask her:',
  'How was your trip?',
  "What would you like to focus on for the first few weeks that you're back?",
  'How do you feel about it?'
].join('\n');
const QS = [
  'How was your trip?',
  "What would you like to focus on for the first few weeks that you're back?",
  'How do you feel about it?'
];

{
  const r=_jvParseInvite(CANON);
  ok('CANON  resolves the tagged client', r && r.code==='adrianap1', r);
  ok('CANON  asks nothing back', r && !r.ask, r);
  ok('CANON  exactly three questions', r && r.questions && r.questions.length===3, r&&r.questions);
  QS.forEach(function(q,i){
    ok('CANON  question '+(i+1)+' is verbatim', r && r.questions && r.questions[i]===q, r&&r.questions&&r.questions[i]);
  });
  // LAW 2, stated as the thing it forbids: no rewording, no merging, no
  // splitting on anything but a newline. Three question marks, three fields.
  ok('LAW 2  the second question is NOT split on its internal punctuation',
     r && r.questions[1].indexOf('first few weeks')>0 && r.questions.length===3, r&&r.questions);
  ok('LAW 2  the apostrophe survives',
     r && r.questions[1].indexOf("you're back") > 0, r&&r.questions&&r.questions[1]);
}

// ===== LAW 1 — THE CLIENT IS THE @TAG AND NOTHING ELSE =====================
{
  // A name with no tag is not an invite. It falls through to the booking route
  // that has always owned it, which is what null means here.
  ok('LAW 1  no tag, no action (plain name)',
     _jvParseInvite('schedule a check in call with Adriana')===null);
  ok('LAW 1  no tag, no action (bare code)',
     _jvParseInvite('schedule a check in call with adrianap1')===null);
  // And the tag is never widened into a roster search.
  const r=_jvParseInvite('schedule a check in call with @adrianna');
  ok('LAW 1  an unknown tag asks rather than matching something near it',
     r && r.ask && /@adrianna/.test(r.ask), r);
  ok('LAW 1  an unknown tag creates nothing', r && !r.code, r);
  // His own tag is not a client.
  const t=_jvParseInvite('schedule a check in call with @yusuf1');
  ok('LAW 1  his own tag is refused', t && t.ask && !t.code, t);
  // The tag is read off the COMMAND, never off his questions.
  const q=_jvParseInvite('schedule a check in call with @adrianap1\nask her:\nHow is @blakeb1 getting on?');
  ok('LAW 1  a tag inside a question does not name a second person',
     q && q.code==='adrianap1' && !q.ask, q);
  ok('LAW 1  ...and that question is still stored verbatim',
     q && q.questions.length===1 && q.questions[0]==='How is @blakeb1 getting on?', q&&q.questions);
}

// ===== LAW 3 — THE REMIND-FORM IS VALID WITH ZERO QUESTIONS ================
{
  const r=_jvParseInvite('schedule a check in call with @adrianap1');
  ok('LAW 3  no ask block is a complete invite', r && r.code==='adrianap1' && !r.ask, r);
  ok('LAW 3  ...with zero questions', r && r.questions.length===0, r&&r.questions);
  const i=_jvParseInvite('invite @blakeb1 to book a call');
  ok('LAW 3  "invite" alone is enough of a verb', i && i.code==='blakeb1' && !i.ask, i);
  ok('LAW 3  ...and still zero questions', i && i.questions.length===0, i&&i.questions);
}

// ===== LAW 4 — UNCERTAIN MEANS ONE QUESTION BACK AND ZERO EXECUTION ========
{
  const two=_jvParseInvite('schedule a check in call with @adrianap1 and @blakeb1');
  ok('LAW 4  two tags stop', two && two.ask && !two.code, two);
  ok('LAW 4  two tags name both back', two && /@adrianap1/.test(two.ask) && /@blakeb1/.test(two.ask), two);

  const empty=_jvParseInvite('schedule a check in call with @adrianap1\nask her:');
  ok('LAW 4  an ask block with nothing under it stops', empty && empty.ask && !empty.code, empty);
  // NEVER A PARTIAL: not the invite without the questions.
  ok('LAW 4  ...and does not fall back to a zero-question invite',
     empty && empty.questions===undefined, empty);

  const long=_jvParseInvite('schedule a check in call with @adrianap1\nask her:\n'+('x'.repeat(_JV_INV_Q_MAX+1)));
  ok('LAW 4  a question too long to store without cutting stops',
     long && long.ask && !long.code, long);
  ok('LAW 4  ...and says which one', long && /Question 1/.test(long.ask), long);
  // One question BACK, singular — every stop above returns one sentence to say,
  // never a list of what went wrong.
  [two, empty, long].forEach(function(r,i){
    ok('LAW 4  stop '+(i+1)+' is a single answerable line',
       r && typeof r.ask==='string' && r.ask.length>0 && r.ask.split('\n').length===1, r&&r.ask);
  });
}

// ===== LAW 5 — TALKING ABOUT A CALL CREATES NOTHING ========================
{
  const NOTHING=[
    'cancel the call with @adrianap1',
    'reschedule @adrianap1',
    'move @adrianap1 to 3pm',
    'push @blakeb1 back an hour',
    'skip @blakeb1 tomorrow',
    'is a call booked with @adrianap1?',
    'does @adrianap1 have a call this week',
    'did you book @blakeb1',
    'when is @adrianap1 booked',
    'what did @adrianap1 say about her call',
    'who is @blakeb1 booked with',
    '@adrianap1 wants to reschedule her call',
    'had a good call with @adrianap1'
  ];
  NOTHING.forEach(function(s){
    ok('LAW 5  creates nothing: "'+s+'"', _jvParseInvite(s)===null, _jvParseInvite(s));
  });
  // The other side of the same law: a real instruction still goes through, and
  // politeness on the front of it is not a question.
  const GOES=[
    'can you schedule a check in call with @adrianap1',
    'please book a check in call with @adrianap1',
    'hey jarvis, set up a call with @adrianap1',
    'invite @adrianap1 to book a check in call'
  ];
  GOES.forEach(function(s){
    const r=_jvParseInvite(s);
    ok('LAW 5  still an invite: "'+s+'"', r && r.code==='adrianap1' && !r.ask, r);
  });
}

// ===== THE ROUTE IT MUST NOT STEAL =========================================
// The tag is what keeps this layer off everything that was already working. A
// sentence with no @ in it must reach _jvParseInvite and be handed straight
// back, whatever else it says.
{
  const UNTOUCHED=[
    'book Blake for 9am tomorrow',
    'schedule a check-in call with me and blakeb1 for 3pm today',
    'pencil in a call with Adriana Friday at 2',
    'schedule a morning walk for me tomorrow at 7am',
    'block off Tuesday at 2pm',
    'dentist at 2 Thursday',
    'log my steps for today at 7,250',
    'she had a burger and fries for dinner'
  ];
  UNTOUCHED.forEach(function(s){
    ok('ROUTE  hands back: "'+s+'"', _jvParseInvite(s)===null, _jvParseInvite(s));
  });
}

// ===== SHAPES HE ACTUALLY TYPES ============================================
{
  // The whole thing on one line, ask marker included.
  const one=_jvParseInvite('schedule a check in call with @adrianap1 ask her: How was your trip?');
  ok('SHAPE  one line, inline ask marker', one && one.code==='adrianap1' && !one.ask, one);
  ok('SHAPE  ...one question, verbatim',
     one && one.questions.length===1 && one.questions[0]==='How was your trip?', one&&one.questions);

  // Inline first question plus more underneath.
  const mix=_jvParseInvite('schedule a call with @adrianap1 ask her: How was your trip?\nHow do you feel about it?');
  ok('SHAPE  inline first question plus a line under it',
     mix && mix.questions.length===2 && mix.questions[0]==='How was your trip?'
       && mix.questions[1]==='How do you feel about it?', mix&&mix.questions);

  // Blank lines between questions are the keyboard, not a fourth question.
  const gap=_jvParseInvite('schedule a call with @adrianap1\nask her:\n\nHow was your trip?\n\nHow do you feel about it?\n');
  ok('SHAPE  blank lines are not questions',
     gap && gap.questions.length===2, gap&&gap.questions);

  // Indentation is the keyboard's, not his words — the one normalisation.
  const ind=_jvParseInvite('schedule a call with @adrianap1\nask her:\n   How was your trip?   ');
  ok('SHAPE  surrounding whitespace is stripped and nothing else',
     ind && ind.questions.length===1 && ind.questions[0]==='How was your trip?', ind&&ind.questions);

  // "ask him" and "ask them" are the same marker.
  const him=_jvParseInvite('schedule a call with @blakeb1\nask him:\nHow was the week?');
  ok('SHAPE  ask him', him && him.questions.length===1 && him.questions[0]==='How was the week?', him&&him.questions);
  const them=_jvParseInvite('schedule a call with @blakeb1\nask them:\nHow was the week?');
  ok('SHAPE  ask them', them && them.questions.length===1, them&&them.questions);

  // A trailing period after the tag must not be eaten into the code.
  const dot=_jvParseInvite('schedule a check in call with @adrianap1.');
  ok('SHAPE  a full stop after the tag is punctuation, not part of the code',
     dot && dot.code==='adrianap1', dot);
}

// ===== NOTHING AT ALL ======================================================
{
  ok('EMPTY  empty string', _jvParseInvite('')===null);
  ok('EMPTY  whitespace', _jvParseInvite('   \n  ')===null);
  ok('EMPTY  null', _jvParseInvite(null)===null);
  ok('EMPTY  a bare tag with no verb', _jvParseInvite('@adrianap1')===null);
}

if(fails) { console.log('tinvite: '+fails+' of '+ran+' FAILED'); process.exit(1); }
console.log('all '+ran+' pass');
