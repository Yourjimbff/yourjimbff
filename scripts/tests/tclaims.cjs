/* CLAIMS, NOT VOICE (Yusuf, 19 Sep, off five real cards).

   Harrison's Parmesan read as "a quick hit to start the day" at 5:52am his
   time. A dinner eaten after an 8pm session showed 11:47 PM and read "hours
   before sleep". Rodrigo's bowl was told "the move is brown rice" and asked
   "how much time do you have between now and dinner". Jasmine's blueberry
   bagel was "whole food, no processing" with no protein in it and nobody said
   so. And "1 handful of zucchini (broccoli, green beans)" came out as three
   broken bullets.

   Every one of these had a prompt rule against it already. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntclaims - the clock, the question, the rice, the bagel, the bracket');

const L=closure(['_jimClaimGate','_jimClockKnown','_jimClockLine','_jimPlateFlags','_nlEatTime','_mealTextSplit','_feedLogGapStr']);
/* _clockKnown and _clockSaid are property names on the row (row._clockKnown),
   and JSON is a runtime global; the lifter reports all three as holes. */
const holes=L.unresolved.filter(n=>['_clockKnown','_clockSaid','JSON'].indexOf(n)<0);
ok(holes.length===0, 'it lifts with nothing missing', holes);
const F=new Function('var window={};'+L.code+'\nreturn {_jimClaimGate,_jimClockKnown,_jimClockLine,_jimPlateFlags,_nlEatTime,_mealTextSplit,_feedLogGapStr};')();

// ================================================================= THE CLOCK
ok(F._nlEatTime({at:'11:47 PM'})===null, 'a time nobody set is not stored as a time');
ok(F._nlEatTime({at:'8:00 PM', atManual:true})==='8:00 PM', 'a time they typed is theirs');
ok(F._nlEatTime({at:'7:12 PM', atFromPhoto:true})==='7:12 PM', 'and so is one read off the photo');
ok(!F._jimClockKnown({eat_time:null, logged_at:'2026-09-18T23:47:00'}), 'a row with no stated time has an unknown clock');
ok(F._jimClockKnown({eat_time:'8:00 PM'}), 'a row with one has a known clock');
const unk=F._jimClockLine({eat_time:null, logged_at:'2026-09-18T23:47:00'});
ok(/did NOT say when they ate it/.test(unk) && /unknown/.test(unk), 'the read is told the clock is unknown, in those words', unk.slice(0,90));
const kn=F._jimClockLine({eat_time:'8:00 PM', logged_at:'2026-09-18T23:47:00'});
ok(/they ate this at 8:00 PM/.test(kn) && /Logged at 11:47 PM/.test(kn), 'and told both clocks when they differ', kn);

/* THE SENTENCE ABOUT SLEEP IS STRUCK WHEN THE CLOCK IS UNKNOWN - a claim with
   no data behind it, not a voice preference. */
const late='Dinner is chicken and rice, 640 calories and 58g of protein. That is several hours before sleep, so it lands and digests. The protein is carrying it.';
const g1=F._jimClaimGate(late, {eat_time:null, name:'Chicken and rice'});
ok(!/before sleep/.test(g1) && /carrying it/.test(g1), 'with no clock, the sleep sentence goes and the rest stays', g1);
const g2=F._jimClaimGate(late, {eat_time:'6:30 PM', name:'Chicken and rice'});
ok(/before sleep/.test(g2), 'with a stated clock the same sentence is allowed to stand');
const morn='A quick hit to start the day. 210 calories of cheese and not much else.';
ok(!/start the day/.test(F._jimClaimGate(morn, {eat_time:null, name:'Parmesan squares'})), 'Harrison\'s "start the day" over an unstated 5:52am goes too');

// ================================================================ THE QUESTION
const q='Lunch is white rice, pinto beans, double carnitas, sour cream, guacamole and lettuce. How much time do you have between now and dinner? The carnitas carry 60g of protein.';
const gq=F._jimClaimGate(q, {eat_time:'12:10 PM', name:'Burrito bowl'});
ok(!/\?/.test(gq) && /60g of protein/.test(gq), 'a question is struck from a read; the facts around it stay', gq);

// ==================================================================== THE RICE
const rice='Two starches on one plate. For a fat loss day this needs to come down, and the move is carnitas with brown rice or cilantro lime rice. The carnitas are doing the work.';
const gr=F._jimClaimGate(rice, {eat_time:'12:10 PM', name:'Burrito bowl white rice pinto beans double carnitas'});
ok(!/brown rice/.test(gr) && /doing the work/.test(gr), 'the brown-rice swap he has never made is struck', gr);
const fl=F._jimPlateFlags({name:'Burrito bowl', meal_text:'white rice, pinto beans, double carnitas', calories:980, protein:62});
ok(/never brown rice/.test(fl) && /quarter or half/.test(fl) && /60g of carbohydrate/.test(fl), 'and the model is handed the real move: a smaller scoop, with the numbers', fl.slice(0,120));

// =================================================================== THE BAGEL
const bagel='Sweet finish, whole food, no processing. The bagel brings the carbohydrate and the cracker a little dark chocolate.';
const gb=F._jimClaimGate(bagel, {eat_time:'9:00 PM', name:'Blueberry bagel with a dark chocolate charcoal cracker'});
ok(!/whole food/.test(gb) && !/no processing/.test(gb) && /bagel brings/.test(gb), '"whole food, no processing" over a bagel is struck', gb);
const fb=F._jimPlateFlags({name:'Blueberry bagel with a dark chocolate charcoal cracker', calories:420, protein:9});
ok(/9g OF PROTEIN IN 420 CALORIES/.test(fb) && /whole-food protein/.test(fb), 'the missing protein is handed over as THE finding', fb.slice(0,100));
ok(/"bagel" IS A PACKAGED OR REFINED FOOD/.test(fb), 'and so is the bagel being a bagel');
ok(F._jimPlateFlags({name:'Salmon and asparagus', calories:250, protein:27})==='', 'a real plate raises no flags at all');
ok(F._jimPlateFlags({name:'Greek yogurt', calories:120, protein:3})==='', 'and a tiny plate is not flagged for protein - 150 calories is the floor');

// ================================================================= THE BRACKET
const bl=F._mealTextSplit({meal_text:'7 ounces of chicken breast, 1 handful of zucchini (broccoli, green beans), 1 cup rice'});
ok(bl && bl.length===3, 'a comma inside brackets is not a list', bl&&bl.map(x=>x.name));
ok(bl && bl[1].name==='1 handful of zucchini (broccoli, green beans)', 'the bracketed run stays with its item, brackets intact', bl&&bl[1].name);
const bl2=F._mealTextSplit({meal_text:'eggs, bacon (, toast, coffee'});
ok(bl2 && !bl2.some(x=>/[()]/.test(x.name)), 'a bracket left on its own is dropped, not carried', bl2&&bl2.map(x=>x.name));

// ================================================================ THE CARD
const it=(eat,logged)=>({kind:'food', ts:new Date(logged).getTime(), data:{eat_time:eat}});
ok(F._feedLogGapStr(it('8:00 PM','2026-09-18T23:47:00'))!=='' , 'eaten at 8, logged at 11:47: the card says so', F._feedLogGapStr(it('8:00 PM','2026-09-18T23:47:00')));
ok(F._feedLogGapStr(it('11:40 PM','2026-09-18T23:47:00'))==='', 'seven minutes apart is the same time');
ok(F._feedLogGapStr({kind:'food', ts:Date.now(), data:{eat_time:null}})==='', 'no stated time, no second clock to show');

// ============================================================== IT IS WIRED
ok(/_jimClaimGate\(insight, row\)/.test(src), 'the claim gate runs at the one door every stored read passes');
ok((src.match(/ask\+=_jimClockLine\(/g)||[]).length===2 && (src.match(/ask\+=_jimPlateFlags\(/g)||[]).length===2,
   'the clock line and the plate findings reach both main writers');
ok((src.match(/eat_time:_nlEatTime\(st\)/g)||[]).length===3, 'every write off the sheet stores the honest eat time', (src.match(/eat_time:_nlEatTime\(st\)/g)||[]).length);
ok(!/eat_time:\(st\.at\|\|_tlNowClock\(\)\)/.test(src), 'and none of them writes "now" as the time they ate any more');
ok(/NEVER BROWN RICE OVER WHITE/.test(src) && /NO QUESTIONS\./.test(src) && /A PLATE WITH NO PROTEIN IS TOLD SO/.test(src),
   'and the rulings are in the shared block, in his words, for every writer');

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
