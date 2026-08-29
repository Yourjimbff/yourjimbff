// THE AUDIO FLIGHT RECORDER (his order, 29 Aug).
//
// His ear failed on a read my payload test had already passed. That is the
// whole reason this exists: the payload proved what was HANDED to the player,
// and the fault lives past that handoff, where no node suite can listen.
//
// So this suite does not try to prove the audio is right. It proves the WITNESS
// is trustworthy, which is a different and much smaller claim:
//   1. it records the things that would identify each named suspect
//   2. it cannot change what the audio does
//   3. he can actually reach it, by the real ladder, with the real gates
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure,defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

const store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.window={addEventListener:()=>{},matchMedia:()=>({matches:false})};
global.document={addEventListener:()=>{},getElementById:()=>null,querySelectorAll:()=>[],
  querySelector:()=>null,body:{classList:{contains:()=>false}}};
global.APP_VERSION='v-test';

const MINE=['_JV_TAPE','_JV_TAPE_MAX','_JV_TAPE_KEY','_jvTapeRead','_jvTapeT0',
  '_jvTape','_jvTapeSnip','_jvTapeLoad','_jvTapeReport','_jvTapeClear',
  '_JV_TAPE_RE','_JV_TAPE_CLEAR_RE','_JV_SPEAK_MAX','_jvSpeakChunks'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('  THE TAPE RECORDS, AND SURVIVES A RELOAD:');
_jvTapeClear();
t(_jvTapeReport().indexOf('Nothing on the tape')>=0, 'an empty tape says so plainly');
_jvTape('say','SCRIPT speak=412 html=498 | Chris had a strong week');
_jvTape('read','gen 5 | in 412 chars, after strip 409');
_jvTape('chunks','2 pieces [300, 109 chars]');
t(_JV_TAPE.length===3, 'three events on the tape', String(_JV_TAPE.length));
t(!!store['yjb_audio_tape'], 'and written to his device, so a reload does not lose it');
const reloaded=JSON.parse(store['yjb_audio_tape']);
t(reloaded.length===3 && reloaded[0].ev==='say', 'exactly as recorded', reloaded[0].ev);

console.log('\n  IT IS BOUNDED, so a long drive cannot fill his storage:');
for(let i=0;i<900;i++) _jvTape('filler','x');
t(_JV_TAPE.length===_JV_TAPE_MAX, 'the tape caps itself', _JV_TAPE.length+' of '+_JV_TAPE_MAX);
t(_JV_TAPE[_JV_TAPE.length-1].d==='x', 'and it is the NEWEST events that survive');

console.log('\n  THE REPORT IS PASTEABLE, and shows the last reads:');
_jvTapeClear();
[['say','SCRIPT speak=412 html=498'],['read','gen 1'],['chunks','2 pieces'],['play start','player was idle'],['play end','played 8000ms']]
  .forEach(([e,d])=>_jvTape(e,d));
const rep=_jvTapeReport();
t(/^AUDIO REPORT/.test(rep), 'it starts with a title he can recognise');
t(/v-test/.test(rep), 'and names the app version the tape came from');
t(/play start/.test(rep) && /player was idle/.test(rep), 'the events are in it');
t(rep.indexOf('<')<0, 'plain text, no markup — it survives a paste', rep.indexOf('<')<0?'':rep.slice(rep.indexOf('<'),40));
t(/\+\d+ms/.test(rep), 'with a relative timestamp on every line');

console.log('\n  EVERY NAMED SUSPECT HAS A PROBE ON THE PATH:');
// Named in his order. Each one has to leave a mark, or the tape cannot rule it
// in or out and the reproduction is wasted.
[['clips restarting (the stutter)', "player was BUSY, cut at "],
 ['pieces racing or replaying',     "_jvTape('SUPERSEDED'"],
 ['something read afterwards',      "_jvTape('say'"],
 ['a second reader beside the first',"gen '+gen+' lost to gen '"],
 ['the Eleven Labs chunking',       "_jvTape('piece '+(ci+1)+'/'+chunks.length"],
 ['the panel being read instead',   "'PANEL FALLBACK '"],
 ['a clip that never came back',    "_jvTape('fetch FAILED'"],
 ['the player refusing outright',   "_jvTape('play BLOCKED'"],
 ['an error mid-clip',              "_jvTape('play ERROR'"]
].forEach(([label,needle])=>t(src.indexOf(needle)>=0, label));

console.log('\n  IT IS READ-ONLY — the recorder cannot change the sound:');
// EVERY probe is wrapped. A throw inside the witness must never become a fault
// in the thing it is watching, which is the one way a recorder can do harm.
const probes=src.split('_jvTape(').length-1;
t(probes>=14, 'the probes are all there', probes+' call sites');
// BLOCK-AWARE, not line-based. Two of these probes are multi-line, so their
// try{ sits on an earlier line - a same-line check called them unwrapped when
// they are not. Walks back up to eight lines for an OPEN try.
const LN=src.split('\n');
let unwrapped=[];
LN.forEach((l,i)=>{
  if(l.indexOf('_jvTape(')<0) return;
  if(/function _jvTape|_jvTapeReport|_jvTapeClear|_jvTapeLoad|_jvTapeSnip|_jvTapeRead\+\+|var _JV_TAPE/.test(l)) return;
  if(l.indexOf('try{')>=0) return;
  let wrapped=false;
  for(let k=i-1;k>=Math.max(0,i-8);k--){
    if(LN[k].indexOf('}catch')>=0) break;      // the nearest block already closed
    if(LN[k].indexOf('try{')>=0){ wrapped=true; break; }
  }
  if(!wrapped) unwrapped.push((i+1)+': '+l.trim().slice(0,60));
});
t(unwrapped.length===0, 'and every one is inside its own try', unwrapped.join(' | '));
// The body itself swallows everything, belt and braces.
const body=(src.match(/function _jvTape\(ev, d\)\{[\s\S]*?\n\}/)||[''])[0];
t(/try\{/.test(body) && /catch\(e\)\{\}/.test(body), 'the recorder body swallows its own faults');
t(!/return /.test(body.replace(/\/\/[^\n]*/g,'')), 'and returns nothing that a caller could branch on');

console.log('\n  THE REPORT IS NEVER SPOKEN:');
// Reading a flight recorder out loud, on the audio path being investigated,
// would also write fresh events onto the tape he is trying to read.
const doorBlock=src.slice(src.indexOf('if(_JV_TAPE_CLEAR_RE.test(t)){'), src.indexOf('if(_JV_TAPE_CLEAR_RE.test(t)){')+900);
t(/speak:''/.test(doorBlock), "both answers carry speak:'' so nothing is read aloud");
t((doorBlock.match(/speak:''/g)||[]).length===2, 'on the clear AND on the report', String((doorBlock.match(/speak:''/g)||[]).length));

console.log('\n  HE CAN REACH IT — the routing proof:');
// The real gates above it, in the real order. A diagnostic that cannot be
// reached while things are misbehaving is not a diagnostic.
eval([defOf('_JV_HELP_RE'), defOf('_JV_DEBRIEF_RE'), defOf('_JV_DEBRIEF_SOFT_RE'),
      defOf('_JV_DEBRIEF_PAST_RE'), defOf('_JV_RQ_DAY')].join('\n'));
function land(s){
  if(_JV_HELP_RE.test(s)) return 'help';
  if(_JV_TAPE_CLEAR_RE.test(s)) return 'tape:clear';
  if(_JV_TAPE_RE.test(s)) return 'tape:report';
  const strong=_JV_DEBRIEF_RE.test(s);
  const soft=!strong && _JV_DEBRIEF_SOFT_RE.test(s) && !_JV_DEBRIEF_PAST_RE.test(s);
  if(strong||soft) return 'debrief';
  if(_JV_RQ_DAY.test(s)) return 'day board';
  return 'falls through';
}
[['audio report','tape:report'],
 ['show me the audio report','tape:report'],
 ['audio log','tape:report'],
 ['voice report','tape:report'],
 ['clear the audio tape','tape:clear'],
 ['reset audio report','tape:clear'],
 // AND IT MUST NOT STEAL ANYTHING. These are other people's sentences.
 ["how's Chris McCarthy",'falls through'],
 ['give me the debrief for Chris McCarthy','debrief'],
 ['what can you do','help'],
 ['report on Kelly','falls through']
].forEach(([s,want])=>t(land(s)===want, JSON.stringify(s)+' -> '+want, land(s)));

console.log('\n  THE DOOR SITS HIGH, above everything that could claim it:');
const at=(n)=>src.indexOf(n);
t(at('if(_JV_TAPE_RE.test(t)){') > 0, 'the door is in the ladder');
t(at('if(_JV_TAPE_RE.test(t)){') < at('var _db=await _jvDebriefTurn(t);'), 'above the debrief');
t(at('if(_JV_TAPE_RE.test(t)){') < at('var _rd=await _jvDayReadout(t);'), 'above the day board');
t(at('if(_JV_TAPE_RE.test(t)){') < at('if(_jtCalendarClaims(t)){'), 'above the calendar');
t(at('_JV_TAPE_CLEAR_RE.test(t)') < at('if(_JV_TAPE_RE.test(t)){'),
  'and CLEAR is tested before REPORT, or "clear the audio report" would only ever print it');

console.log('\n  THE TAP IS TRAINER-ONLY, and never lies about copying:');
const copyFn=(src.match(/async function jvTapeCopy\(\)\{[\s\S]*?\n\}/)||[''])[0];
t(copyFn.length>200, 'the tap handler exists', String(copyFn.length));
t(/navigator\.clipboard/.test(copyFn) && /execCommand\('copy'\)/.test(copyFn),
  'it tries the clipboard, then a fallback');
t(/ok \? 'Audio report copied/.test(copyFn), 'and only claims a copy when one happened');
t(/Could not copy/.test(copyFn), 'saying so plainly when it did not');
t(/isTrainer\(cl\.code\)/.test(src.slice(src.indexOf('function _feedVersionHtml(){'), src.indexOf('function _feedVersionHtml(){')+700)),
  'the control is gated to the trainer');

console.log('\n  CHUNKING, since it is one of the suspects:');
const long='Chris had a strong week. '.repeat(30);
const ch=_jvSpeakChunks(long);
t(ch.every(c=>c.length<=_JV_SPEAK_MAX), 'no piece exceeds the server ceiling',
  Math.max.apply(null, ch.map(c=>c.length))+' max of '+_JV_SPEAK_MAX);
t(ch.join(' ').replace(/\s+/g,' ').trim()===long.replace(/\s+/g,' ').trim(),
  'and every word survives the split, in order');
t(!ch.some(c=>/\s$/.test(c)), 'no piece ends mid-space');

console.log('');
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all pass');
// EXIT EXPLICITLY, like every other suite here. Falling off the end leaves node
// alive whenever the lift has pulled in anything that holds a handle, so the
// suite PASSES and then hangs forever — and run.sh waits with it.
process.exit(0);
