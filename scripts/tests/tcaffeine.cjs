// THE ONE NUMBER A DRINK ACTUALLY HAS (Yusuf, 15 Sep).
//
// Dalton logged a Gorilla Mind and his feed said "8 cal · 2g C · HEAVY".
//   "That is not heavy, it's fine. Just have it track caffeine in there
//    instead of anything. 200mg of caffeine. Does the client see 'heavy'? I
//    don't think so."
//
// The first half shipped that night as the no-judge rule: a drink under 25
// calories is not graded and the chip that would have graded it is not drawn.
// This is the second half. The space where the verdict was is not empty - it is
// where the interesting number goes, and on an energy drink the interesting
// number is the caffeine, not the eight calories.
//
// THE RISK THIS SUITE REALLY GUARDS is not the chip. It is that food_logs has
// no caffeine column until he runs one line of SQL, and this app has two ways
// to get that wrong catastrophically: naming the column in a select that lists
// its columns (PostgREST refuses the whole request, sbSelect answers [], and
// his entire feed goes blank), or sending it on every insert (two round trips
// on the highest-traffic write in the app, forever, for a chicken breast).
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const MINE=['_cafMg','_cafChipText','NO_JUDGE_CAL','_ratingChipWorth','_drinkFloor'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  DALTON’S CAN:');
const can={calories:8, carbs:2, rating:'bad', caffeine:200};
t(_drinkFloor(can.rating, can.calories)==='unknown', 'eight calories is not a verdict', _drinkFloor(can.rating,can.calories));
t(_ratingChipWorth(can)===false, 'so no chip grades it');
t(_cafChipText(can)==='200mg caffeine', 'and this is what goes there instead', _cafChipText(can));

console.log('\n  NOTHING IS INVENTED:');
t(_cafChipText({calories:500, protein:40})==='', 'a chicken breast has no caffeine line');
t(_cafChipText({calories:8, caffeine:0})==='', 'and neither does a drink the model said nothing about');
t(_cafChipText({calories:8, caffeine:null})==='', 'nor a null');
t(_cafChipText({calories:8, caffeine:'200'})==='200mg caffeine', 'a string number still reads', _cafChipText({caffeine:'200'}));
t(_cafMg({caffeine:-50})===0, 'a negative is not a number of milligrams');
t(_cafMg({caffeine:99999})===0, 'and a misread label is refused rather than printed',
  String(_cafMg({caffeine:99999})));
t(_cafMg({caffeine:1200})===1200 && _cafMg({caffeine:1201})===0,
  'the ceiling is 1200mg - about a dozen energy drinks');

console.log('\n  IT NEVER DISPLACES A REAL VERDICT:');
/* A 600-calorie frappuccino is both a judgeable meal AND caffeinated, and both
   are true about it - so the verdict keeps the chip and the caffeine rides on
   the macro line with the other numbers. */
t(_ratingChipWorth({calories:600, rating:'bad'})===true, 'a real meal still gets graded');
t(/if\(_caf && !rr\[1\]\)\{ rr=\['#f5c518', _caf\]; _caf=''; \}/.test(src),
  'the chip is only taken over when there was no verdict to show');
t(/if\(_cafTxt && !_r\)\{ _r=\['#f5c518', _cafTxt\]; _cafTxt=''; \}/.test(src),
  'and the same rule on his feed, not a second one');
t(/\(_caf\?\(' \\u00b7 '\+_caf\):''\)/.test(src), 'otherwise it joins the macro line on the journal');
t(/\(_cafTxt\?\(' \\u00b7 '\+_cafTxt\):''\)/.test(src), 'and the macro line on the feed');

console.log('\n  AND THE MIGRATION CANNOT TAKE ANYTHING DOWN WITH IT:');
/* food_logs has no caffeine column until one line of SQL is run. Two ways to
   get that catastrophically wrong, both refused here. */
const feedSel=(src.match(/sbSelect\('food_logs','select=id,client_code,name,emoji[^']*'/)||[''])[0];
t(feedSel.length>0, '  (the feed read is still where it was)');
t(feedSel.indexOf('caffeine')<0,
  'the feed read does NOT name the column - one premature name empties his whole feed',
  feedSel.slice(0,90));
t(/select=id,caffeine&limit=40/.test(src),
  'it comes back on its own query instead, which fails to [] and takes nothing with it');
t(/var _cafBackfill = \(async function\(\)/.test(src), 'the same shape as the photo and raw_text backfills');
/* AND IT GOES ON THE END OF THAT ARRAY. _resAll is read positionally - [7] is
   steps - so slotting a promise in beside the other backfills silently hands
   steps the wrong result and empties them off his feed with nothing to show it. */
const all=(src.match(/var _resAll = await Promise\.all\(\[[^\]]*\]\)/)||[''])[0];
/* THE REAL INVARIANT IS THE INDEX, NOT THE LAST SLOT (re-written 17 Sep, when
   _insBackfill was correctly appended after this one and turned this line red).
   "Caffeine is last" was a true fact about the array on the day it was written,
   not the rule. The rule is that nothing may be inserted BEFORE a slot that is
   read by position - _resAll[7] is steps, and every reader below counts from
   there. Appending is always safe; inserting never is. So the test now asserts
   what actually protects his steps: caffeine still sits after steps, and steps
   is still index 7. */
const _slots=all.replace(/^[^\[]*\[|\]\)$/g,'').split(',').map(x=>x.trim());
t(_slots.indexOf('_stepsP')===7, 'steps is still index 7, which the reader below hard-codes', _slots.indexOf('_stepsP'));
t(_slots.indexOf('_cafBackfill')>_slots.indexOf('_stepsP'),
  'and caffeine was APPENDED after it, never inserted before it', _slots);
t(/var steps=\(_resAll\[7\]\|\|\[\]\)/.test(src), '  which is what _resAll[7] still being steps depends on');

console.log('\n  AND AN INSERT ONLY CARRIES IT WHEN THERE IS SOME:');
t(/if\(_cafN>0 && _cafN<=1200\) payload\.caffeine=_cafN; else delete payload\.caffeine;/.test(src),
  'no caffeine, no column on the row - so no meal pays a retry for a number it does not have');
t(/var mcol = \/column\\s\+/.test(src),
  'and the existing ladder drops it anyway if the table has not been migrated');
t((src.match(/caffeine:Math\.round\(r\.caffeine\|\|0\)/g)||[]).length===2,
  'both writers hand it to that one door', String((src.match(/caffeine:Math\.round\(r\.caffeine\|\|0\)/g)||[]).length));

console.log('\n  THE MODEL IS TOLD WHAT IT IS FOR:');
t(/"caffeine":number/.test(src), 'the photo flow asks for the field');
t(/caffeine: MILLIGRAMS of caffeine/.test(src), 'Jim asks for it in milligrams');
t(/never guess a number onto a food/.test(src), 'and is told not to guess one onto a food');
t(/caffeine:num\('caffeine'\)\|\|0/.test(src), 'the salvage parser reads it too, so a broken JSON still keeps it');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (a drink says the one thing it has to say)');
process.exit(bad?1:0);
