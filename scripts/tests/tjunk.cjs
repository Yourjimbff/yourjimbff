/* WHAT JIM SAYS TO A DOUBLE CHEESEBURGER AND A TWINKIE (Yusuf, 18 Sep).

   Logan Gamero logged exactly that and Jim told him "Lunch is solid for your
   goal." Yusuf, on what he would actually have said:

     "my god man, what are you, a trash can? ... these things will disrupt your
      stomach, which then disrupts your energy and your skin. While you are
      young you can put it away ... if you want the punch and the sweetness,
      have some honey, nuts and some bougie ass fruit, not garbage Twinkies.
      That is just fibrous bread and sugar."

   Two faults produced that card. The meal was RATED okay, so it never reached
   the bad-food branch at all - the prompt says "be generous and affirming" and
   "when torn, choose the kinder rating", and the model was torn about a
   drive-through burger. And the bad-food branch it should have reached said
   only "Direct but not cruel", which is not a voice, it is an absence of one.

   This suite guards both. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntjunk - junk food gets told what it is, and is never rounded up');

// ---------------------------------------------- THE RATING CANNOT ROUND UP
const rate=(()=>{ const i=src.indexOf('Rating (be generous and affirming with whole foods)');
  return src.slice(i, i+2200); })();
ok(rate.length>100, 'the rating rules are where they were');
ok(/STOPS DEAD AT THE DOOR OF JUNK/.test(rate), 'the generosity is scoped to whole food');
ok(/NEVER rounded up out of bad/.test(rate), 'and junk is never rounded up out of bad');
['not for being small','not for carrying protein','after a workout'].forEach(x=>{
  ok(rate.indexOf(x)>=0, 'the excuse "'+x+'" is named and refused');
});
ok(/drive-through window or a wrapper with a shelf life/.test(rate),
   'and the test is where the food came from, which a model can actually apply');
ok(/Being torn is not a reason to be kind here/.test(rate),
   'being torn stops meaning be generous, which is what produced the card');

// ------------------------------------------------------- THE FOUR BEATS
const junk=(()=>{ const i=src.indexOf('- Genuinely bad food');
  return src.slice(i, i+2600); })();
ok(junk.length>100, 'the bad-food branch is where it was');
ok(/SHARP ABOUT THE FOOD, never about the person/.test(junk), 'the branch leads with the boundary');
ok(/NAME WHAT IT ACTUALLY IS, in ingredients/.test(junk), 'beat 1: say what the food is');
ok(/THE CHAIN, not the sermon/.test(junk), 'beat 2: the mechanism, not a lecture');
ok(/gut first, then energy, then skin/.test(junk), 'and the chain is his, in his order', 'gut > energy > skin');
ok(/THE HONEST ALLOWANCE/.test(junk), 'beat 3: one meal ruins nothing');
ok(/THE BETTER VERSION OF THE SAME CRAVING/.test(junk), 'beat 4: what to have instead');
ok(/must never be dropped/.test(junk), 'and beat 4 is the one marked as never droppable');
ok(/honey and nuts and real fruit/.test(junk), 'with his own swap named', 'honey, nuts, real fruit');

// ------------------------------------------------- HARD ON FOOD, NOT ON PEOPLE
ok(/Their body, their discipline, their character and their worth\s*are never the subject/.test(junk.replace(/\s+/g,' ').replace(/ /g,' ')) ||
   /never the subject/.test(junk),
   'the client, their body and their discipline are explicitly out of bounds');
ok(/No praise words anywhere in this branch/.test(junk), 'and no praise word may appear in this branch');
ok(/never that it works for their goal/.test(junk),
   'including the exact sentence Logan got - that it works for his goal');

// ------------------------------------------- THE QUANTITY RULE IS UNTOUCHED
/* This is the line that protects his clients and it is NOT what changed. Jim
   gets sharp about what a food IS, never about how much of it somebody ate -
   that stays the coach's own call, which is what this rule has always said. */
ok(/NEVER tell a client a meal or a day is too heavy, too much, or more than they should have/.test(src),
   'the rule against calling a meal too much is still there, word for word');
ok(/Quantity concerns are the coach's call, never an automated message/.test(src),
   'and quantity is still the coach’s call, not an automated one');
ok(/NEVER grill, roast, scold, or express concern about a meal being LOW in calories/.test(src),
   'and the rule protecting a small meal is untouched');

/* THE TRAP THAT BROKE THIS EDIT ONCE. These prompts live inside SINGLE-quoted
   JavaScript strings, which is why the authors before me wrote round them. A
   bare apostrophe in "somebody's day" took the whole file out of syntax. */
const apos=(junk.match(/(?<!\\)'/g)||[]).length;
ok(apos<=2, 'no stray apostrophe was written into a single-quoted prompt string', apos);

console.log(fails? ('\ntjunk: '+fails+' FAILED\n') : '\ntjunk: all good\n');
process.exit(fails?1:0);
