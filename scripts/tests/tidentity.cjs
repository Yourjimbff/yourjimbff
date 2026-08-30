// WHOSE ACCOUNT THIS IS (the identity fix, 29 Aug).
//
// On his OWN trainer thread, a fragment with nothing in it to log came back
// "I'm Jim — the logging surface", and told him to text Yusuf. He is Yusuf.
//
// The cause was ORDER. TRAINER MODE has said "NEVER TELL HIM TO MESSAGE YUSUF.
// He IS Yusuf" for weeks, but the prompt OPENED with a concrete self-description
// written for a client, stated unconditionally, above all of it. A concrete
// identity at the top beats an abstract correction in the middle.
//
// THE DANGEROUS HALF OF THIS FIX IS NOT THE TRAINER, IT IS THE 82 CLIENTS.
// buildCoachVoice is what every one of them hears. So the first and most
// important thing proved here is a NEGATIVE: the client prompt is byte for byte
// what main already serves. Not "looks the same", not "still has the rules" —
// identical, compared character by character against the deployed branch.
const fs=require('fs');
const cp=require('child_process');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

// A FROZEN CLOCK. buildCoachVoice stamps the current time into the prompt, so
// two builds a minute apart differ for a reason that has nothing to do with
// this change and would make the comparison below lie in both directions.
const REAL=Date;
class FD extends REAL{
  constructor(...a){ if(!a.length) super(2026,7,29,9,0,0); else super(...a); }
  static now(){ return new REAL(2026,7,29,9,0,0).getTime(); }
}
global.Date=FD;

// Build the prompt the way the app builds it, out of a given copy of the file.
function promptFrom(text, asTrainer){
  const src=text.split('\n');
  let start=-1;
  for(let i=0;i<src.length;i++){ if(src[i].startsWith('function buildCoachVoice(')){ start=i; break; } }
  if(start<0) return null;
  let end=-1;
  for(let i=start+1;i<src.length;i++){ if(src[i]==='}'){ end=i; break; } }
  const body=src.slice(start,end+1).join('\n');
  const cl={code:(asTrainer?'thegoat':'testday1'), name:(asTrainer?'Yusuf':'Test Day')};
  function isTrainer(c){ return c==='thegoat'; }
  var YOURJIMBFF_NUTRITION_FORMULA='<<nutrition formula>>';
  var JIM_ASK_RULES='<<ask rules>>';
  // THE MACRO TABLE, LIFTED FROM WHICHEVER COPY IS BEING READ (Calendar,
  // 30 Aug). buildCoachVoice now calls _mtPromptBlock(), so evaluating it
  // needs the table — and it has to come from the SAME source string, or
  // main's prompt would be built with this branch's table and the comparison
  // below would compare the wrong two things. A copy that has no table (main,
  // before this ships) simply does not define it and is evaluated as it was.
  function _lf(re, endTest){
    const i=src.findIndex(l=>re.test(l));
    if(i<0) return '';
    if(endTest){ for(let j=i;j<src.length;j++) if(endTest(src[j])) return src.slice(i,j+1).join('\n'); return ''; }
    return src[i];
  }
  const _tbl=[
    _lf(/^var MB_PALM_OZ/),
    _lf(/^var MT_ROWS=\[/, l=>l.trim()===');'||l.trim()==='];'),
    /^var MT_ROWS=\[/.test(src.find(l=>/^var MT_ROWS=\[/.test(l))||'')?'var _MT_BY=null;':'',
    (function(){ const i=src.findIndex(l=>l.startsWith('function _mtIndex(')); if(i<0) return '';
      let d=0,st=false; for(let j=i;j<src.length;j++){ for(const c of src[j]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return src.slice(i,j+1).join('\n'); } return ''; })(),
    (function(){ const i=src.findIndex(l=>l.startsWith('function _mtPromptBlock(')); if(i<0) return '';
      let d=0,st=false; for(let j=i;j<src.length;j++){ for(const c of src[j]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return src.slice(i,j+1).join('\n'); } return ''; })()
  ].filter(Boolean).join('\n');
  let out;
  eval(_tbl+'\n'+body+'\nout=buildCoachVoice();');
  return out;
}

const HERE=fs.readFileSync('index.html','utf8');
let MAIN=null;
try{ MAIN=cp.execSync('git show origin/main:index.html',{maxBuffer:64*1024*1024}).toString(); }catch(e){ MAIN=null; }

console.log('  THE 82 CLIENTS HEAR EXACTLY WHAT THEY HEARD:');
t(!!MAIN, 'main\'s copy of the file is readable, so there is something to compare against');
if(MAIN){
  const a=promptFrom(MAIN,false), b=promptFrom(HERE,false);
  t(!!a && a.length>2000, 'main builds a client prompt', a?String(a.length)+' chars':'');
  t(!!b && b.length>2000, 'and so does this branch', b?String(b.length)+' chars':'');
  const same=(a===b);
  t(same, 'AND THEY ARE IDENTICAL, byte for byte');
  if(!same && a && b){
    // Say WHERE, not just that. A diff nobody can locate gets argued with.
    let i=0; while(i<a.length && i<b.length && a[i]===b[i]) i++;
    console.log('        first difference at char '+i);
    console.log('        main: '+JSON.stringify(a.slice(Math.max(0,i-60), i+60)));
    console.log('        here: '+JSON.stringify(b.slice(Math.max(0,i-60), i+60)));
    console.log('        lengths: main '+a.length+', here '+b.length);
  }
}

const C=promptFrom(HERE,false);
const T=promptFrom(HERE,true);
t(!!C && !!T, 'both prompts build on this branch');

console.log('\n  A CLIENT IS STILL TOLD WHAT JIM IS:');
t(/^YOU ARE: JIM — the logging surface inside YOURJIMBFF/.test(C),
  'the client prompt still opens exactly as it did', C.slice(0,46));
t(/they dump their day/.test(C), 'and still says whose day it is for');
t(/that’s a Yusuf call|that's a Yusuf call/.test(C), 'and still routes the heavy stuff to Yusuf');

console.log('\n  HIS OWN ACCOUNT IS NAMED FIRST, AND CONCRETELY:');
t(/^YOU ARE: JIM\. On THIS account you are YUSUF/.test(T),
  'the trainer prompt opens by naming whose account it is', T.slice(0,52));
t(!/the logging surface inside YOURJIMBFF/.test(T),
  'and NEVER describes itself to him as the client logging surface');
t(!/they dump their day/.test(T), 'nor as the place a client dumps their day');
t(/He is NOT a client/.test(T) && /nobody to hand him on to/.test(T),
  'it says plainly that he has no coach above him');
t(/never route him anywhere/.test(T), 'and that he is never routed');

console.log('\n  ORDER IS THE FIX, so order is what is asserted:');
const idAt=T.indexOf('On THIS account you are YUSUF');
const behaveAt=T.indexOf('HOW YOU BEHAVE');
const trainerModeAt=T.indexOf('TRAINER MODE');
t(idAt>=0 && behaveAt>idAt, 'the identity comes BEFORE the behaviour rules written for a client',
  'identity@'+idAt+' behaviour@'+behaveAt);
t(trainerModeAt>behaveAt, 'and TRAINER MODE still sits below them, where it always did',
  'trainerMode@'+trainerModeAt);
t(/NEVER TELL HIM TO MESSAGE YUSUF/.test(T),
  'TRAINER MODE is untouched, so the account is now named at BOTH ends');

console.log('\n  AND HE CAN STILL LOG:');
// The fix must not cost him the thing the prompt is for.
[['the FOOD_LOG marker','[FOOD_LOG]'],['the marker rules','MARKER RULES:'],
 ['the roster instructions','TRAINER ROSTER CONTEXT'],['the quantity rule','QUANTITY MULTIPLIES']
].forEach(([label,needle])=>t(T.indexOf(needle)>=0, label+' still reaches him'));

console.log('\n  THE TWO SELVES ARE ONE OR THE OTHER, NEVER BOTH:');
t(!(/the logging surface inside YOURJIMBFF/.test(T) && /On THIS account you are YUSUF/.test(T)),
  'the trainer never gets both identities');
t(!/On THIS account you are YUSUF/.test(C), 'and a client never gets his');

console.log('');
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all pass');
