// A POSSESSIVE IS STILL THE NAME — and a reply is still not a write.
//
// TWO FAILURES, BOTH MEASURED ON THE LIVE APP ON 14 SEP while putting one
// client on a five-day split through Jarvis.
//
// ONE. _jvWhoAsked keeps the apostrophe on purpose (_keep is built to preserve
// it) so a possessive survives to the resolver — and then `bare` stripped the
// apostrophe and LEFT the s. exactOf compared "georges" against the roster,
// matched nobody, and one plainly-named client came back
// {kind:'ambiguous', maybeOnly:true} carrying a SINGLE hit. jvChatSend treats
// any 'ambiguous' as a hard stop, so "bump George's squats to 4 sets" was
// answered with "which one did you mean? George Tremoulis" and no program edit
// could ever reach the model. Every possessive on the live roster failed.
//
// TWO. Asked to change one client's Friday, the model answered "Lailee's Friday
// is locked in", emitted no marker, wrote nothing — and the screen said nothing
// about it. The existing guard only covers a marker that was CUT OFF; a reply
// with no marker at all had no guard, and window._jtProgWrote, computed forty
// lines above and already holding false, was read by nobody on that path.
//
// The first half is behavioural: _jvWhoAsked is lifted and RUN against a roster
// shaped like the real one, because the pattern is not the thing — the answer
// is. The 25 Aug prefix ruling is asserted alongside it, since the easy way to
// "fix" this is to stop asking, and asking is the ruling.
const fs=require('fs');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

// A roster with the four shapes that matter: a lone first name, a duplicated
// full name, two people one prefix reaches, and a prefix-only near-miss.
const ROSTER={
  george1:    {name:'George Tremoulis'},
  blakeb1:    {name:'Blake Bennett'},
  chrism1:    {name:'Chris McCarthy'},
  christiana1:{name:'Christian A'},
  samanthav1: {name:'Samantha V'},
  laileek1:   {name:'Lailee Khan'},
  yusuf1:     {name:'Yusuf Richardson', isTrainer:true}
};
global.CLIENTS=ROSTER;
global.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addListener(){},addEventListener(){}})};
global.document={addEventListener(){},removeEventListener(){},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},classList:{add(){},remove(){},contains:()=>false},appendChild(){},setAttribute(){}}),
  body:{appendChild(){},removeChild(){},classList:{add(){},remove(){}}}};
global.navigator={userAgent:'node'};
global.getHiddenClientSet=()=>({});
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};

const lift=closure(['_jvWhoAsked']);
eval(lift.code);
// The closure lifts getHiddenClientSet too, and the real one wants a browser.
// Overridden AFTER the eval so the lifted declaration cannot shadow the stub —
// take() swallows a throw from the resolver into [], so a live one here reads
// as “nobody is named” for every sentence and the suite passes over a hole.
getHiddenClientSet=function(){ return {}; };
// Same reason: index.html declares its own CLIENTS, and the lifted declaration
// shadows the roster this suite is built on. Pointed back at ROSTER by hand.
CLIENTS=ROSTER;
t(typeof _jvWhoAsked==='function', 'lifted _jvWhoAsked');
t(Object.keys(getHiddenClientSet()).length===0, 'and the hidden set is empty, not throwing');
t(JSON.stringify(_jvResolveClient('george'))==='["george1"]', 'the resolver under it answers', JSON.stringify(_jvResolveClient('george')));

const who=m=>{ try{ return _jvWhoAsked(m); }catch(e){ return {kind:'THREW:'+e.message}; } };

console.log('\n  a possessive names the same person the bare name does:');
[
  ["bump George's squats to 4 sets",        'george1'],
  ['bump George squats to 4 sets',          'george1'],
  ["what are Blake's numbers",              'blakeb1'],
  ['what are Blake numbers',                'blakeb1'],
  ["change Lailee's Friday",                'laileek1'],
  ["put laileek1's Friday back",            'laileek1']
].forEach(([m,code])=>{
  const r=who(m);
  t(r.kind==='one' && r.code===code, JSON.stringify(m.slice(0,34)), r.kind+(r.code?(' '+r.code):''));
});

console.log('\n  the 25 Aug prefix ruling is untouched — a real ambiguity still ASKS:');
// Two people, one named exactly and one reached by prefix. Both go in the list.
const chris=who("swap Chris's Wednesday");
t(chris.kind==='ambiguous', 'two Chrises stay ambiguous', chris.kind);
t((chris.hits||[]).length===2, 'and both are offered', JSON.stringify((chris.hits||[]).map(h=>h.code)));
// Prefix ONLY. Never taken silently, with or without the apostrophe.
['give Sam a rest day', "give Sam's week a rest day"].forEach(m=>{
  const r=who(m);
  t(r.kind==='ambiguous' && r.maybeOnly===true, 'prefix-only still asks: '+JSON.stringify(m.slice(0,30)), r.kind);
});

console.log('\n  and a sentence naming nobody still names nobody:');
[['how did today go',''],['what should I do first','']].forEach(([m])=>{
  const r=who(m);
  t(r.kind!=='one', JSON.stringify(m), r.kind);
});

// ---- TWO: a reply is not a write ---------------------------------------
console.log('\n  the false-claim guard:');
// Structural, because the thing under test is a branch inside a 200-line async
// network turn — but it asserts the three facts it must read, by name, so a
// guard that stops consulting the database cannot pass.
const m=/else if\((!_hadMarker[^\n]*)\)\{\n[^\n]*did not write anything/.exec(src);
t(!!m, 'the guard exists and says nothing was written');
const cond=(m&&m[1])||'';
t(/window\._jtProgWrote!==true/.test(cond), 'gated on the DATABASE answer, not the model');
t(/_JT_PROG_RE\.test\(msg\)/.test(cond),    'only on a turn that was about a program');
t(/_JV_CLAIMED_RE\.test\(txt\)/.test(cond), 'only when the reply CLAIMED the change');
// The cut-off guard it chains off must still be there — this is an else-if.
t(/if\(_hadMarker && !_applied\)\{/.test(src), 'the cut-off guard it chains from is intact');

// And the claim detector itself, run against the sentence that caused this.
const claimed=closure(['_JV_CLAIMED_RE']);
eval(claimed.code);
console.log('\n  what counts as claiming it:');
[
  ['Lailee’s Friday is locked in — squat 3x5 at the top.', true],
  ['Built her a 5-day split, live in her app now.',                  true],
  ['Updated Wednesday for you.',                                     true],
  ['Her program is now set.',                                        true],
  ['She is on a 5-day split — Lower, Push, Pull, Lower, Full Body.', false],
  ['Want me to make Friday heavier, or leave it?',                   false],
  ['That would be four days a week instead of five.',                false]
].forEach(([line,want])=>{
  const got=_JV_CLAIMED_RE.test(line);
  t(got===want, (want?'claims:     ':'does not:   ')+JSON.stringify(line.slice(0,42)), got?'matched':'no match');
});

console.log(bad? ('\n'+bad+' FAILED') : '\nall passed');
process.exit(bad?1:0);
