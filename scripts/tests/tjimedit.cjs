// "When they edit it, the feedback should change, and it should change
// conversationally in the feedback. It should go, oh, that's different in this
// way than when we logged. And then it goes into what the facts are on that
// thing." (Yusuf, 16 Sep.)
//
// curResult.insight was written once by the model and then frozen. Fix the
// protein from 3 to 21 and the card still described the pastry. Jordan R's donut
// was exactly that: saved at 248 cal with 3g of protein against a label that
// read 254 and 21.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const MINE=['_jimSnap','_jimDiff'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  THE CHANGE IS COMPUTED, NOT ASKED FOR:');
/* The model is told what moved. It is never trusted to diff two sets of numbers
   it half remembers, so the opening sentence is true even when the rest is a
   judgement call. */
const donutWas =_jimSnap({calories:248, protein:3,  carbs:32, fat:12, name:'Cheat Treat Donut'});
const donutNow =_jimSnap({calories:254, protein:21, carbs:28, fat:10, name:'Cheat Treat Donut'});
const d=_jimDiff(donutWas, donutNow);
t(!!d, 'Jordan’s donut correction registers as a change');
t(d.big==='protein', '  and protein is the biggest move, which is the story', d&&d.big);
t(/protein 3g to 21g/.test(d.line), '  named in grams, both ends', d&&d.line);
t(/carbs 32g to 28g/.test(d.line), '  carbs too');
t(!/calories/.test(d.line), 'six calories is not a change worth mentioning');

console.log('\n  PUTTING IT BACK IS NOT A CHANGE:');
t(_jimDiff(donutWas, _jimSnap({calories:248,protein:3,carbs:32,fat:12}))===null,
  'identical numbers produce no diff at all');
t(_jimDiff(null, donutNow)===null, 'and a missing baseline never invents one');
t(_jimDiff(donutWas, null)===null, '  in either direction');

console.log('\n  ADDING AND REMOVING A FOOD COUNTS:');
const three=_jimSnap({calories:600,protein:40,carbs:50,fat:20,items:[1,2,3]});
const four =_jimSnap({calories:600,protein:40,carbs:50,fat:20,items:[1,2,3,4]});
t(/they added a food/.test(_jimDiff(three,four).line), 'a food added is a change even with the same totals');
t(/they took a food off/.test(_jimDiff(four,three).line), '  and so is one removed');

console.log('\n  THE OPENING IS AN INSTRUCTION, IN HIS TERMS:');
t(/OPEN BY NAMING WHAT CHANGED/.test(src), 'the prompt says to open on the change');
t(/turns this from a pastry into an actual breakfast/.test(src),
  '  with the example of what "in their terms" means');
t(/beats\s*\n?\s*'\+'"\+18g protein"/.test(src) || /\+18g protein/.test(src),
  '  and what it does not mean');
t(/WHAT MOVED: '\+d\.line/.test(src), 'the computed change is what the model is handed');

console.log('\n  IT DOES NOT FIRE ON EVERY KEYSTROKE:');
t(/var _JIM_RESCORE_MS=1400;/.test(src), 'there is a debounce');
t(/clearTimeout\(_jimRescoreTimer\)/.test(src), '  and each edit cancels the last one');
t(/_jimRescoreSoon\(\); \}catch\(e\)\{\}/.test(src), 'it hangs off the one funnel every edit passes through');
t(/function _foodRecalcTotals\(\)\{\n  \/\/ Every edit to a number/.test(src),
  '  which is _foodRecalcTotals');

console.log('\n  A STALE ANSWER CANNOT LAND ON A NEWER EDIT:');
t(/var seq=\+\+_jimRescoreSeq;/.test(src), 'each read takes a ticket');
t(/if\(seq!==_jimRescoreSeq\) return false;/.test(src), '  and drops itself if it came back late');
t(/_jimRescoreSeq\+\+;\s*\/\/ any read still in flight is stale/.test(src),
  'and a brand new meal invalidates anything in flight');

console.log('\n  A FAILED READ DOES NOT LOOK LIKE A READ:');
t(/could not read it again just now/.test(src), 'it says so plainly');
t(/What is above is about the first version/.test(src),
  '  and warns that the words describe the old numbers');
t(/jimThinking .jimCardBody\{opacity/.test(src), 'and it shows it is thinking while it waits');

console.log('\n  THE BASELINE IS THE MODEL’S OWN FIRST ANSWER:');
t(/window\._jimBase=_jimSnap\(curResult\);/.test(src), 'taken the moment the model answers');
t(/window\._jimFirstRead=/.test(src), '  along with the words, so undoing an edit restores them');
t(/if\(window\._jimFirstRead\) _jimCardPaint\(window\._jimFirstRead, false\);/.test(src),
  '  which is exactly what putting the numbers back does');

console.log('\n  AND THE CLIENT SEES IT UNDER THEIR OWN MEAL AFTERWARDS:');
t(/\+'<\/div>'\+_jimCardHtml\(f&&f\.insight\)\+'<\/div>';/.test(src),
  'the journal row renders the full card');
t(/_jimReadHtml/.test(src), 'and the collapsed version still exists for the coach');
const jr=src.slice(src.indexOf('function _journalMealRow'), src.indexOf('function _woEmoji'));
t(!/_jimReadHtml/.test(jr), '  but is no longer what the person reading their own meal gets');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (it answers again when they correct it)');
process.exit(bad?1:0);
