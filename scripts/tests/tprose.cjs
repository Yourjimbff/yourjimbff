// A LONG ANSWER IS PARAGRAPHED, AND SPOKEN FROM ITS OWN TEXT.
//
// From his phone, live, 29 Aug: he asked "how's Chris McCarthy" and got a good
// answer in the wrong clothes. It painted as one solid wall, and the voice
// leapt from one sentence to somewhere far away.
//
// ONE CAUSE FOR BOTH. That answer returns from the model door as
//   {status:'talk', line:_escHtml(mo.reply).replace(/\n/g,'<br>')}
// with NO speak field. _jtBatch prefers x.speak and falls back to the STRIPPED
// PANEL when there is none — which is precisely the fault the debrief fix cured
// at the queue, on a door nobody thought of as a panel. So the ear was given
// escaped HTML run back through a stripper: lost breaks, and &#39; where an
// apostrophe used to be. That is what "jumped" sounds like.
//
// The queue was already right. The door was not feeding it.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure,defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

global.window={addEventListener:()=>{},matchMedia:()=>({matches:false})};
global.document={addEventListener:()=>{},getElementById:()=>null,querySelectorAll:()=>[],
  querySelector:()=>null,body:{classList:{contains:()=>false}}};
global.localStorage={getItem:()=>null,setItem:()=>{}};
const MINE=['_jvProseParas','_jvProse'];
eval(closure(['_escHtml']).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(['_escHtml']), n=>eval(n));

// The screen, read back as plain text — the same trick the debrief suite uses,
// because the question is whether the render preserved the words.
const unesc=(s)=>String(s).replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
function onScreen(html){
  return (String(html).match(/<div class="jvPara">([\s\S]*?)<\/div>/g)||[])
    .map(x=>unesc(x.replace(/^<div class="jvPara">/,'').replace(/<\/div>$/,''))).join('\n\n');
}

// His real answer's shape: five topics, one unbroken block, which is what he saw.
const WALL="Chris had a strong week overall and he's tracking well against what you set him. "
 +"Training was five sessions, four lifts and a conditioning day, and he hit every one of them. "
 +"Weight is up about a pound on the month which is the direction you wanted. "
 +"Food quality has been good, protein is holding and he's stopped skipping breakfast. "
 +"He did drop the squat weight himself to work on depth, worth asking him about on the call.";

console.log('  A WALL OF TEXT IS BROKEN UP:');
const P=_jvProseParas(WALL);
t(P.length>1, 'a five-topic block becomes more than one paragraph', P.length+' paragraphs');
t(P.every(x=>x.length<=260), 'and none of them is still a wall', P.map(x=>x.length).join('/'));
t(P.join(' ').replace(/\s+/g,' ')===WALL.replace(/\s+/g,' '), 'with every word preserved and none added');

console.log('\n  HIS OWN BREAKS WIN, and are never second-guessed:');
const BLANKS="Training was strong.\n\nFood is holding.\n\nWeight is up a pound.";
t(_jvProseParas(BLANKS).length===3, 'blank lines are the grouping', String(_jvProseParas(BLANKS).length));
t(_jvProseParas(BLANKS)[1]==='Food is holding.', 'exactly as written');
const LINES="Training was strong.\nFood is holding.\nWeight is up a pound.";
t(_jvProseParas(LINES).length===3, 'single newlines are a grouping too');

console.log('\n  A SHORT ANSWER IS LEFT ALONE:');
t(_jvProseParas('Booked. Tuesday at 9.').length===1, 'a one-liner is not cut in half');
t(_jvProseParas('').length===0, 'and nothing in is nothing out');
t(_jvProse('').line==='' && _jvProse('').speak==='', 'with no empty markup either');

console.log('\n  ONE WRITER — what is printed IS what is spoken:');
[WALL, BLANKS, LINES, 'Booked. Tuesday at 9.',
 "He said \"it's fine\" & moved on <today>"].forEach((txt,i)=>{
  const r=_jvProse(txt);
  t(onScreen(r.line)===r.speak, 'case '+(i+1)+': the screen and the ear carry the same words');
});
const esc=_jvProse("He said \"it's fine\" & moved on <today>");
t(/&amp;/.test(esc.line) && /&lt;today&gt;/.test(esc.line), 'the screen escapes markup');
t(!/&amp;|&lt;|&#39;/.test(esc.speak), 'and the SPOKEN copy carries no entities at all', esc.speak);
t(/&/.test(esc.speak) && /</.test(esc.speak), 'it is the real characters, not escapes');

console.log('\n  THE DOOR HE ACTUALLY HIT NOW WRITES BOTH HALVES:');
const runItem=src.slice(src.indexOf('async function _jtRunItem(t, capture, ctx){'),
                        src.indexOf('// ===== THE SELF-DESCRIPTION IS THE WIRED CAPABILITY LIST'));
t(runItem.length>2000, 'the ladder is findable', String(runItem.length));
t(/if\(mo\.reply\)\{\s*\n\s*var _pr=_jvProse\(mo\.reply\);/.test(runItem),
  'the model prose answer goes through _jvProse');
t(/return \{status:'talk', modelled:true, line:_pr\.line, speak:_pr\.speak/.test(runItem),
  'and returns a spoken copy beside the printed one');
// THE REGRESSION ITSELF: the old shape must be gone everywhere.
t(!/line:_escHtml\(mo\.reply\)\.replace\(\/\\n\/g,'<br>'\)/.test(runItem),
  'the old panel-only return is gone');

console.log('\n  AND SO DOES EVERY OTHER PROSE DOOR IN THAT LADDER:');
// Any return built from a MODEL or from Jim's own words must carry speak. The
// short deterministic one-liners are fine on the strip fallback and are not
// swept up here; these five are the ones that answer in prose.
[['the model reply','line:_pr.line, speak:_pr.speak'],
 ['the offer + reply','line:_dp.line, speak:_dp.speak'],
 ['Jim\'s conversational reply','line:_jr.line, speak:_jr.speak'],
 ['Jim\'s failure line','line:_fp.line, speak:_fp.speak'],
 ['Jim\'s logged confirmation','speak:(_head+(_rp.speak?']
].forEach(([label,needle])=>t(runItem.indexOf(needle)>=0, label+' carries a spoken copy'));

console.log('\n  THE QUEUE WAS ALREADY RIGHT, and still is:');
t(/if\(x && x\.speak!=null && String\(x\.speak\)\.trim\(\)\) return String\(x\.speak\)\.trim\(\);/.test(src),
  '_jtBatch prefers the written script over the panel');
t(/return _jvSpeakStrip\?_jvSpeakStrip\(x\.line\):x\.line;/.test(src),
  'and still falls back for items that wrote none');

console.log('\n  THE PROMPT ASKS FOR THE BREAKS TOO, so the grouping is usually his:');
t(/LONG ANSWERS BREATHE/.test(src), 'the trainer prompt asks for a blank line between topics');
t(/put a BLANK LINE between the topics/.test(src), 'in those words');

console.log('\n  THE STYLE EXISTS, or the paragraphs are invisible:');
t(/\.jvPara\{[^}]*margin[^}]*\}/.test(src), '.jvPara has spacing');
t(/\.jvPara:last-child\{margin-bottom:0;\}/.test(src), 'and the last one does not trail');

console.log('\n  THE PAYLOAD — his real answer, through the real queue:');
// Not "the door sets speak" (that is the code) but "what reaches the ear is the
// script". _jtBatch's own mapper is lifted and run over the item the door
// actually returns.
const _stripFn=(src.match(/function _jvSpeakStrip\([\s\S]*?\n\}/)||[''])[0];
eval(_stripFn);
function queueSpoken(items){
  return items.map(function(x){
    if(x && x.speak!=null && String(x.speak).trim()) return String(x.speak).trim();
    return (typeof _jvSpeakStrip==='function') ? _jvSpeakStrip(x.line) : x.line;
  }).filter(Boolean).join(' ');
}
const pr=_jvProse(WALL);
const item={status:'talk', modelled:true, line:pr.line, speak:pr.speak, html:true};
const heard=queueSpoken([item]);
t(heard===pr.speak, 'the ear gets the script the door wrote, not the panel');
t(!/<div|<br|&#39;|&amp;|&lt;/.test(heard), 'no markup and no entities reach the ear', heard.slice(0,0)||'');
t(heard.replace(/\s+/g,' ')===WALL.replace(/\s+/g,' '), 'and it is his answer, word for word, in order');
// NOT ASSERTED HERE: what the OLD panel-read sounded like. _jvSpeakStrip needs
// a real DOM (createElement/textContent) and this harness has a stub, so it
// returns '' for any input - an assertion against it would be measuring the
// stub, not the app. The regression is held by the two facts above instead:
// the door now writes speak, and the queue prefers it.
t(typeof _jvSpeakStrip==='function', 'the fallback stripper is still present for doors that write no script');

console.log('');
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all pass');
// EXIT EXPLICITLY, like every other suite here. Falling off the end leaves node
// alive whenever the lift has pulled in anything that holds a handle, so the
// suite PASSES and then hangs forever — and run.sh waits with it.
process.exit(0);
