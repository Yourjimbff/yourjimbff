// THE ROUTING PROOF — STANDING LAW (Yusuf, 29 Aug).
//
// "Can you give me the debrief for Chris McCarthy" came back as his front-desk
// board. The debrief was built right and parked behind the wrong door: the gate
// on that board, _JV_RQ_DAY, ends with |\bdebrief\b and sat thirty lines above
// it. Nobody found it because the debrief was proved by CALLING it, never by
// walking the ladder a sentence really falls down.
//
// THE LAW: no capability ships without a routing proof. Its natural phrasings,
// run through the REAL gates in the REAL order, arriving at the right door. A
// feature nothing can reach is not done however well it works once reached.
const fs=require('fs');
const {closure,defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={addEventListener:()=>{},matchMedia:()=>({matches:false})};
global.document={addEventListener:()=>{},getElementById:()=>null,querySelectorAll:()=>[],
  body:{classList:{contains:()=>false}}};
global.localStorage={getItem:()=>null,setItem:()=>{}};
eval(closure(['_jvNameMatch','_jvFindClientIn']).code);
eval(['_JV_DEBRIEF_RE','_JV_DEBRIEF_SOFT_RE','_JV_DEBRIEF_PAST_RE','_JV_RQ_DAY','_JV_RQ_QUIET',
      '_JV_RQ_TERM','_JV_RQ_TODAY','_JV_HELP_RE','_JT_NEWCLIENT_RE','_JV_ADD_CLIENT_RE',
      '_JT_CAL_RE','_JT_PROG_RE'].map(defOf).join('\n'));

// THE REAL ROSTER SHAPE, with the two Chrises that genuinely exist on it.
CLIENTS={ chrism1:{name:'Chris McCarthy'}, christiana1:{name:'Christiana Ruiz'},
          kellyg1:{name:'Kelly G'}, spencerr1:{name:'Spencer R'}, thegoat:{name:'Yusuf'} };
cl={code:'thegoat', name:'Yusuf'};
isTrainer=c=>c==='thegoat';

// ===== THE LADDER, IN THE ORDER _jtTurn RUNS IT =========================
// Read off the file rather than remembered, so a reorder shows up here.
const ORDER=[
  ['contact statement', "var cc=await _ccHandleStatement(t);"],
  ['feed command',      "fc=await _jvFeedCommand(t);"],
  ['help',              "if(_JV_HELP_RE.test(t))"],
  ['DEBRIEF',           "var _db=await _jvDebriefTurn(t);"],
  ['roster answer',     "var _rq=_jvRosterAnswer(t);"],
  ['client day answer', "var _rc=await _jvClientDayAnswer(t);"],
  ['day board',         "var _rd=await _jvDayReadout(t);"],
  ['new client',        "var _nc=await _jtNewClientTurn(t);"],
];
console.log('  THE LADDER, TOP TO BOTTOM:');
let last=-1, order=[];
ORDER.forEach(([name,needle])=>{
  const i=src.indexOf(needle);
  order.push(name+'@'+i);
  t(i>0, name+' is in the ladder');
  t(i>last, '  ...and sits below '+(last<0?'the top':'the one above'));
  last=i;
});

console.log('\n  THE THEFT THAT HAPPENED, held so it cannot happen again:');
t(/\\bdebrief\\b/.test(defOf('_JV_RQ_DAY')), 'the day board really does claim the bare word "debrief"');
t(src.indexOf("var _db=await _jvDebriefTurn(t);") < src.indexOf("var _rd=await _jvDayReadout(t);"),
  'so the debrief door MUST sit above it, and does');

// ===== THE ROUTING PROOF ================================================
// Where a sentence actually lands, decided by the real gates in the real order.
function land(s){
  if(_JV_HELP_RE.test(s)) return 'help';
  const strong=_JV_DEBRIEF_RE.test(s);
  const soft=!strong && _JV_DEBRIEF_SOFT_RE.test(s) && !_JV_DEBRIEF_PAST_RE.test(s);
  if(strong||soft){
    let hits=[]; try{ const f=_jvFindClientIn(s); hits=(f&&f.hits)||[]; }catch(e){}
    if(!hits.length && /\b(his|her|their|them|this client)\b/i.test(s)){
      if(window._jvDeepCode && CLIENTS[window._jvDeepCode]) hits=[window._jvDeepCode];
    }
    if(hits.length===1) return 'debrief:'+hits[0];
    if(hits.length>1) return 'debrief:ask-which';
  }
  if(_JV_RQ_DAY.test(s)) return 'day board';
  if(_JT_NEWCLIENT_RE.test(s)) return 'new client';
  return 'falls through';
}
console.log('\n  HIS EXACT SENTENCE, THE ONE THAT FAILED:');
t(land('Can you give me the debrief for Chris McCarthy')==='debrief:chrism1',
  '"Can you give me the debrief for Chris McCarthy" reaches the debrief',
  land('Can you give me the debrief for Chris McCarthy'));

console.log('\n  EVERY PHRASING HE NAMED:');
[["give me Chris McCarthy's debrief",'debrief:chrism1'],
 ["can you give me the debrief for Chris McCarthy",'debrief:chrism1'],
 ["Chris McCarthy's check-in summary",'debrief:chrism1'],
 ["debrief Chris McCarthy",'debrief:chrism1'],
 ["Chris McCarthy check-in",'debrief:chrism1'],
 ["check-in summary for Chris McCarthy",'debrief:chrism1'],
 ["run Kelly G's check-in",'debrief:kellyg1'],
 ["prep me for Spencer R",'debrief:spencerr1'],
 ["call prep for Kelly G",'debrief:kellyg1']
].forEach(([s,want])=>t(land(s)===want, JSON.stringify(s), land(s)));

console.log('\n  TWO CHRISES — it asks, it never picks one:');
[["give me Chris's debrief",'debrief:ask-which'],
 ["debrief Chris",'debrief:ask-which'],
 ["Chris's check-in",'debrief:ask-which']
].forEach(([s,want])=>t(land(s)===want, JSON.stringify(s), land(s)));

console.log('\n  A PRONOUN LEANS ON THE CARD HE HAS OPEN, and on nothing else:');
window._jvDeepCode='chrism1';
t(land('run his check-in')==='debrief:chrism1', 'with Chris open, "run his check-in" is his', land('run his check-in'));
t(land('give me his debrief')==='debrief:chrism1', 'and so is "give me his debrief"');
window._jvDeepCode=null;
t(land('run his check-in')!=='debrief:chrism1', 'with nothing open it resolves nobody rather than guessing', land('run his check-in'));

console.log('\n  AND HIS OWN DAY IS STILL HIS OWN DAY:');
[["debrief",'day board'],
 ["brief me",'day board'],
 ["what's my day",'day board'],
 ["run my day",'day board']
].forEach(([s,want])=>t(land(s)===want, JSON.stringify(s)+' still reaches his board', land(s)));

console.log('\n  AND THE CONTACT VERBS ARE NOT TOUCHED:');
// "checked in with" and "checked in on" are how he says he CONTACTED somebody,
// and _CC_VERB owns them. The contact door also runs first in the ladder.
[["checked in with Chris McCarthy"],["checked in on Kelly G"],
 ["check in with Chris McCarthy"],["check in on Kelly G"]
].forEach(([s])=>t(!/^debrief/.test(land(s)), JSON.stringify(s)+' is not a debrief', land(s)));
t(/checked in with\|checked in on/.test(defOf('_CC_VERB')||src), 'and the contact verbs still list both forms');
t(src.indexOf("var cc=await _ccHandleStatement(t);") < src.indexOf("var _db=await _jvDebriefTurn(t);"),
  'with the contact door above the debrief, so a statement is claimed first');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
