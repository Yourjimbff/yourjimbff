// "You know how all these apps have a sparkle next to the AI? ... As long as we
// can make it feel like a premium good feature, that's what matters."
// (Yusuf, 16 Sep.)
//
// It was 12.5px grey text at the foot of the totals box. The thing he intends to
// charge thirty five dollars a month for was set smaller than the macros above it
// and dimmer than the portion note below it.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global._escHtml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
/* THE CARD IS GATED ON OPTING IN (Yusuf, 16 Sep: "the only people who get Jims
   feedback are those who opt in"). Everything below is about somebody who said
   yes; the gate itself gets its own section at the foot. */
let optedIn=true;
global._jimOptedIn=()=>optedIn;
eval(src.match(/var _JIM_SPARK='[\s\S]*?';\n/)[0]);
/* THE CARD RUNS EVERY READ THROUGH THE VOICE FILTER NOW (18 Sep), so the
   filter has to be in the sandbox with it - _guard names it otherwise and
   every assertion below fails on a card that never got built. */
eval(defOf('_jimVoiceFix'));
eval(defOf('_jimCardHtml'));
guard(['_jimCardHtml'], n=>eval(n));

console.log('\n  THE CARD IS A CARD, NOT A FOOTNOTE:');
const card=_jimCardHtml('Breakfast. That is a solid plate.');
t(/class="jimCard"/.test(card), 'it has its own surface');
t(/class="jimCardBody"/.test(card), '  with the coaching as the body');
t(/Jim’s read/.test(card), '  under his own name');
/* The sample read above says "a solid plate" on purpose: Yusuf banned that word
   three times and it kept coming back, so the card is the place to see it gone. */
t(!/\bsolid\b/i.test(card), '  and the word he banned does not reach the card', card.slice(0,70));
t(/jimCardBody\{font-size:14px/.test(src), 'and the body is 14px');
t(!/font-size:12\.5px;color:rgba\(240,236,228,0\.78\);line-height:1\.55;margin-top:12px/.test(src),
  'the old 12.5px grey line is gone');

console.log('\n  THE SPARKLE IS DRAWN, NOT TYPED:');
t(/<svg class="jimSpark"/.test(card), 'it is an inline SVG');
t(!/[✨⭐🌟]/.test(card), '  and not an emoji, which is a standing law');
t((card.match(/<path/g)||[]).length===2, 'two sparkles, one large one small');
t(/fill="currentColor"/.test(card), '  taking their colour from the card');
t(/prefers-reduced-motion:reduce\)\{\.jimSpark\{animation:none/.test(src),
  'and the twinkle stops for anyone who asked motion to stop');

console.log('\n  IT SITS BELOW THE NUMBERS, NOT INSIDE THEM:');
const i=src.indexOf('var insight = _jimCardHtml(r.insight);');
t(i>0, 'the log screen builds it through the one builder');
t(!/\+ insight \+ noteHtml/.test(src), 'it is no longer the last line of the totals box');
t(/\+ noteHtml\n      \+'<\/div>'/.test(src), '  the portion note stays with the numbers, which is where it belongs');

console.log('\n  TIER ONE IS ALLOWED TO SAY NOTHING:');
t(_jimCardHtml('')==='', 'no text means no card at all, not an empty one');
t(_jimCardHtml(null)==='', '  and neither does null');
t(_jimCardHtml('   ')==='', '  nor whitespace');

console.log('\n  IT CANNOT BE USED TO INJECT MARKUP:');
const nasty=_jimCardHtml('<img src=x onerror=alert(1)>', '<b>note</b>');
t(!/<img/.test(nasty), 'the body is escaped');
t(!/<b>note<\/b>/.test(nasty), '  and so is the note');
t(/&lt;img/.test(nasty), '  and it still shows what was written');

console.log('\n  THE PORTION NOTE IS OPTIONAL AND SEPARATE:');
t(!/jimCardNote/.test(_jimCardHtml('hi')), 'no note means no note row');
t(/class="jimCardNote"/.test(_jimCardHtml('hi','only ate half')), 'a note gets its own row');


console.log('\n  AND NOBODY WHO DID NOT ASK FOR IT SEES ONE:');
optedIn=false;
t(_jimCardHtml('Breakfast. Solid plate.')==='', 'opted out, no card, whatever the words were');
t(_jimCardHtml('anything','and a note')==='', '  not even with a note attached');
optedIn=true;
t(_jimCardHtml('Breakfast. Solid plate.')!=='', 'and it comes straight back when they opt in');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (it reads like the part worth paying for)');
process.exit(bad?1:0);
