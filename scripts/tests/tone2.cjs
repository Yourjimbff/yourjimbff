// THE CONVERSATION STAYS ON ONE CLIENT — permanent (Yusuf, ruling, 25 Aug).
//
// He asked for Chris McCarthy's daily calories, got them, and then asked in the
// same breath what Chris's calorie goal should be for a recomposition. Back came
// a card headed "Leandra M · sent you this", his own words restated as an
// inbound message from a client with nothing to do with it, and a text drafted
// for him to send her.
//
// TWO INDEPENDENT FAULTS, and neither was where it looked:
//
//   1. "I think he would weigh 145-148 very LEAN" named a client, because
//      "lean" is a PREFIX of Leandra. The shared resolver counts a full-name
//      prefix as a hit — right when he types a name on purpose, wrong when
//      every word of a sentence is scanned against the roster. On the real
//      roster "may" lands on Maya, "sam" on Samantha V, "jon" on Jonathan V
//      and "vic" on Victoria A the same way.
//
//   2. His message ran to 232 characters, and LENGTH ALONE was enough to send
//      it toward the pasted-client-message path. The file had said since 23
//      August that length and line count cannot tell QUOTED from DETAILED; the
//      fix then was a narrow veto and the signals stayed, so the class came
//      back wearing a coaching question.
//
// His law: a NEW CLIENT'S NAME is the only thing that changes who is being
// discussed. Saying "he" is still that client. Nothing else — not a message
// shape, not a topic, not a guess — may substitute or introduce a person.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); if(a<0) return ''; let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function line(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); return a<0?'':L[a]; }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); if(a<0) return ''; let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
function iife(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); if(a<0) return ''; let b=a; while(L[b]!=='})();') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// The real collisions, from his real roster.
global.window={};
global.CLIENTS={
  thegoat:{name:'Yusuf', isTrainer:true},
  chrism1:{name:'Chris McCarthy'}, christiana1:{name:'Christian A'},
  leandram1:{name:'Leandra M'},   maya1:{name:'Maya'},
  samanthav1:{name:'Samantha V'}, tonia1:{name:'Toni A'},
  anthonyd1:{name:'Anthony Delgado'}, anthonyp1:{name:'Anthony P'}
};
global.cl={code:'thegoat'}; global.window.cl=global.cl;
global.getHiddenClientSet=()=>({});
eval([
  line('var _JV_FIRST_PERSON_RE='),
  grab(l=>l.startsWith('function _jvDepossess(')), grab(l=>l.startsWith('function _jvSelfCode(')),
  grab(l=>l.startsWith('function _jvSelfNames(')), grab(l=>l.startsWith('function _jvNamesSelf(')),
  grab(l=>l.startsWith('function _jvResolveOne(')), grab(l=>l.startsWith('function _jvResolveClient(')),
  iife('var _JV_NAME_STOP='), grab(l=>l.startsWith('function _jvWhoAsked(')),
  grab(l=>l.startsWith('function _jvNameOf(')),
  grab(l=>l.startsWith('function _jvLockOn(')), grab(l=>l.startsWith('function _jvLockedClient(')),
  multi('var _JV_THIRD_RE=new RegExp('), multi('var _JV_MANY_RE=new RegExp('),
  grab(l=>l.startsWith('function _jvStillAboutLocked(')),
  line('var _JT_SIG_WRAP='), line('var _JT_SIG_ADDR='), line('var _JT_SIG_ADDR2='), line('var _JT_SIG_ATTR='),
  line('var _JT_FP_WHO='), line('var _JT_FP_WHAT='),
  line('var _JT_SELF_ORDER_RE='), line('var _JT_SELF_MINE_RE='),
  multi('var _JT_TO_JARVIS_RE=new RegExp('), grab(l=>l.startsWith('function _jtAddressedToJarvis(')),
  grab(l=>l.startsWith('function _jtQuoteSignals(')), grab(l=>l.startsWith('function _jtWeakSignals(')),
  grab(l=>l.startsWith('function _jtFirstPersonWrite(')), grab(l=>l.startsWith('function _jtSaysForSelf(')),
  grab(l=>l.startsWith('function _jtNormQ(')), grab(l=>l.startsWith('function _jtDictatedIn(')),
  grab(l=>l.startsWith('function _jtPastedIn(')), grab(l=>l.startsWith('function _jtQuoteVerdict(')),
].join('\n'));
require('./_guard.cjs')(['_jvWhoAsked','_jvLockOn','_jvLockedClient','_jvStillAboutLocked',
  '_jtQuoteVerdict','_jtQuoteSignals','_jtWeakSignals','_jtAddressedToJarvis','_JT_TO_JARVIS_RE',
  '_JV_THIRD_RE','_JV_MANY_RE'], function(n){ return eval(n); });

// HIS EXACT MESSAGE, this morning, on his real account.
const HIS = "He's 6' and 38 years old. Based on his weight (157ish), and his goal to have recomposition — what do you think his calorie goal should be? I think he would weigh 145-148 very lean... the sweet spot is gaining muscle and burning fat.";

// ===== FAULT 1: A PREFIX IS A GUESS, NOT A NAME =========================
console.log('  an ordinary word that starts a client’s name is not that client:');
const W=q=>{ const r=_jvWhoAsked(q); return r.kind==='one'?('one:'+r.name)
  :(r.kind==='ambiguous'?((r.maybeOnly?'ask?:':'ask:')+r.hits.map(h=>h.name).join('/')):r.kind); };
t(W('I think he would weigh 145-148 very lean')==='self', '"very lean" is not Leandra M', W('I think he would weigh 145-148 very lean'));
t(W(HIS)==='self', 'and his whole message names nobody', W(HIS));
// "he" is third person, so nobody is named and there is no first person
// either — 'none'. Both take the same action; what matters is that it is
// not Maya, which is what the word "may" used to make it.
t(W('he may need more protein')==='none', '"may" is not Maya', W('he may need more protein'));

console.log('\n  but a name he actually said still lands:');
t(W('how is Leandra M doing')==='one:Leandra M', 'the full name');
t(W('what did Maya eat')==='one:Maya', 'an exact first name');
t(W('how is Toni A doing')==='one:Toni A', 'another');
t(W('what did chrism1 log')==='one:Chris McCarthy', 'a code');
// One exact + one prefix is a real ambiguity and still asks.
t(W('how is Chris doing')==='ask:Chris McCarthy/Christian A', 'Chris stays ambiguous with Christian');
t(W('how did Anthony do')==='ask:Anthony Delgado/Anthony P', 'and three Anthonys still ask');
// A prefix-only word that is NOT ordinary English asks rather than assuming.
t(W('what is Sam eating')==='ask?:Samantha V', '"Sam" asks whether Samantha is meant', W('what is Sam eating'));

// ===== THE ISOLATION LAW, BOTH HALVES ===================================
console.log('\n  the conversation stays on one client until he names another:');
const step=(txt)=>{
  let who=_jvWhoAsked(txt);
  if(who.kind==='one') _jvLockOn(who.code);
  else if(who.kind!=='ambiguous'){ const lk=_jvStillAboutLocked(txt); if(lk) who={kind:'one',code:lk,name:_jvNameOf(lk),carried:true}; }
  return who.kind==='one'?who.name:who.kind;
};
window._jvClientLock=null;
t(step("what are Chris McCarthy's daily calories since he started logging")==='Chris McCarthy', 'he names Chris');
t(step(HIS)==='Chris McCarthy', 'the recomposition question STAYS on Chris');
t(step('and what about his protein')==='Chris McCarthy', 'and so does the follow-up');
t(step('ok now what should Toni A be eating')==='Toni A', 'naming Toni switches to Toni');
t(step('what do you think her target is')==='Toni A', 'and "her" stays on Toni');
// His own account is never carried onto a client.
t(step('what did I eat today')==='self', '"what did I eat" is him, lock or no lock');
// A roster-wide question is not one client either.
window._jvClientLock={code:'tonia1',at:Date.now()};
t(_jvStillAboutLocked('how is everyone doing')==='', 'a roster question does not inherit the lock');
t(_jvStillAboutLocked('who has not trained this week')==='', 'nor does a who-question');
t(_jvStillAboutLocked('and what about her steps')==='tonia1', 'but a third-person follow-up does');

// ===== FAULT 2: LENGTH IS NOT EVIDENCE OF ANYTHING ======================
console.log('\n  a long message of his own is not a client’s message:');
t(_jtQuoteVerdict(HIS).v==='his', 'his 232-character question is HIS', JSON.stringify(_jtQuoteVerdict(HIS).sig));
t(_jtQuoteSignals(HIS).length===0, 'it fires no real signal at all');
t(_jtWeakSignals(HIS).indexOf('length')>=0, 'length is still measured — it just decides nothing');
t(_jtAddressedToJarvis(HIS)===true, 'and it is plainly addressed to Jarvis');
// Length and lines alone, in any amount, can never reach the card.
const LONG='x'.repeat(400), LINES='a\nb\nc\nd\ne';
t(_jtQuoteVerdict(LONG).v==='his', '400 characters alone is still his');
t(_jtQuoteVerdict(LINES).v==='his', 'five lines alone is still his');
t(_jtQuoteVerdict(LONG+'\n'+LINES).v==='his', 'and both together is still his');

console.log('\n  a real inbound client message still routes:');
const PASTED="Hey Yusuf, I've been struggling this week with the late night snacking and haven't meal prepped once. Can we talk about adjusting the plan?";
t(_jtQuoteVerdict(PASTED).v==='quoted', 'a greeting addressed to him');
t(_jtQuoteVerdict('"'+'I have been really struggling with the plan this week honestly'+'"').v==='quoted', 'the whole thing in quotes');
t(_jtQuoteVerdict('Chris said: I am struggling with the late nights').v==='quoted', 'an explicit attribution');
// But a question put to Jarvis is his, even wearing one of those.
t(_jtQuoteVerdict('Hey Yusuf, what do you think his target should be').v==='his',
  'a question to Jarvis beats even an addressed greeting');

console.log('\n  and the card cannot name a client he never wrote:');
// WINDOW WIDENED 30 Aug. The three assertions below all went red at once
// because the comment explaining the fix grew past the 1200-character window —
// the guard was intact and the suite could no longer see it. A length-bounded
// window around prose is a fuse on the comment, not a test of the code.
const QT=(src.match(/THE MODEL['’]S `who` IS ONLY A POINTER INTO THE TEXT[\s\S]{0,4000}?\}catch\(e\)\{\}/)||[''])[0];
t(!!QT, 'the guard exists');
t(/new RegExp\('\\\\b'\+_w\.replace/.test(QT), 'the model’s name must appear in the quoted words');
// AND THE HOLE IT USED TO FALL INTO. When the guard REJECTED the model's name
// it set _wIn empty and the next line scanned the whole message for anybody at
// all — the same unguarded resolve the guard exists to prevent. That is how
// "has this guy Dante logged anything" produced a card for Hayden Hauser.
t(/_jvFindClientIn\(_wIn\)/.test(QT) && !/_jvFindClientIn\(_wIn\|\|quoted\)/.test(QT),
  'and a REJECTED name resolves nobody, never the whole message');
t(/var f=_wIn \? _jvFindClientIn\(_wIn\) : \{hits:\[\]\}/.test(QT),
  'no name in his words means no name on the card');

// ===== THE CAPABILITY ===================================================
console.log('\n  he can talk body composition with it, from the logs:');
const RB=(src.match(/=== TALKING BODY COMPOSITION AND TARGETS WITH HIM ===[\s\S]{0,2600}?return out\.join/)||[''])[0];
t(!!RB, 'the coaching block reaches the model');
t(/ANSWER HIM/.test(RB), 'it answers a target question rather than deflecting');
t(/NEVER ASK HIM FOR DATA THAT IS IN THIS BLOCK/.test(RB), 'and never asks for logs it was just handed');
t(/send me a week of logs/.test(RB), 'the exact sentence it produced is named and forbidden');
t(/ask for THAT one thing in a sentence/.test(RB), 'something genuinely missing is still asked for, once');
t(/he IS the professional here/.test(RB), 'and it does not send him elsewhere');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
