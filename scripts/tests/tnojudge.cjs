// AN 8-CALORIE DRINK IS NOT "HEAVY" (Yusuf, 15 Sep). Dalton White logged a
// Gorilla Mind energy drink - 8 cal, 2g carbs - and the app put HEAVY on it, on
// the feed AND on Dalton's own journal page. His ruling: "That is not heavy,
// it's fine."
//
// THE MODEL WAS FOLLOWING ORDERS. The prompt says bad = "junk, highly
// processed, fast food, or alcohol"; a canned energy drink is genuinely highly
// processed, so "bad" was an honest answer to a wrong question. The rating
// grades how a MEAL feeds somebody, and a sugar-free drink is not a meal.
//
// AND THE WORD WAS ONLY EVER SAID IN TWO PLACES. Nine other screens called the
// same rating "Off-plan"; the feed and the client's journal said "Heavy" - and
// the journal is the one the CLIENT reads.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0);
  if(a<0) return '';
  let b=a,d=0,seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined?('  '+x):'')); };

const floorSrc=fnAt('_drinkFloor');
const chipSrc =fnAt('_ratingChipWorth');
t(!!floorSrc && !!chipSrc, 'both helpers exist');
if(!floorSrc||!chipSrc){ console.log('tnojudge: FAILED'); process.exit(1); }

const NO_JUDGE_CAL = 25;
global.NO_JUDGE_CAL = NO_JUDGE_CAL;
const _drinkFloor      = new Function('NO_JUDGE_CAL','return ('+floorSrc+')')(NO_JUDGE_CAL);
const _ratingChipWorth = new Function('NO_JUDGE_CAL','return ('+chipSrc +')')(NO_JUDGE_CAL);

// Dalton's actual row.
t(_drinkFloor('bad', 8)==='unknown', "Dalton's 8-cal energy drink is not judged");
t(_ratingChipWorth({calories:8, rating:'bad'})===false, '...and no chip is drawn on it at all');

// The neighbours that were wrong for the same reason.
t(_drinkFloor('bad', 5)==='unknown',  'a diet soda is not judged');
t(_drinkFloor('okay', 2)==='unknown', 'black coffee is not judged');
t(_drinkFloor('bad', 25)==='unknown', '25 cal is inside the line');

// Real food keeps its rating - this must not become a way to launder a meal.
t(_drinkFloor('bad', 26)==='bad',        '26 cal is outside the line');
t(_drinkFloor('bad', 1200)==='bad',      'a 1200-cal fast food meal is still off-plan');
t(_drinkFloor('nutrient_dense', 400)==='nutrient_dense', 'a real meal keeps nutrient_dense');
t(_ratingChipWorth({calories:1200, rating:'bad'})===true, 'the chip still draws on real food');
t(_ratingChipWorth({calories:400, rating:'nutrient_dense'})===true, 'and on a good meal');

// ZERO IS AMBIGUOUS - it is also what an unread label looks like - so a row
// with no calories at all keeps whatever it was given rather than being
// silently cleared.
t(_drinkFloor('bad', 0)==='bad', '0 cal is an unread label, not a drink - rating kept');
t(_drinkFloor('bad', null)==='bad', 'null calories: rating kept');

// Nothing to say beats saying "unknown".
t(_ratingChipWorth({calories:500, rating:'unknown'})===false, 'an unknown rating draws no chip');
t(_ratingChipWorth({calories:500, rating:''})===false, 'a missing rating draws no chip');
t(_ratingChipWorth(null)===false, 'a null row does not throw');

// ---- the word, on the two surfaces that said it -------------------------
t(!/'#f5c518','Heavy'/.test(src), '"Heavy" is gone from the file entirely');
t((src.match(/'#f5c518','Off-plan'/g)||[]).length>=2,
  'both surfaces now say Off-plan, like the other nine');
const journal=fnAt('_journalMealRow');
t(/_ratingChipWorth\(f\)/.test(journal), "the CLIENT's own journal row asks before drawing a chip");
t(/unknown:\['#888',''\]/.test(journal), '...and an unjudged row shows nothing, not a dash');

// The grading pass has to apply it too, or the row is re-rated 'bad' later.
t(/rating=_drinkFloor\(rating, entry\.calories\);/.test(src),
  'the grading pass applies the floor, so it cannot come back as bad afterwards');
/* 18 Sep: this used to pin the call as _wholeFoodFloor((typeof name!=='undefined'
   ?name:''), rating) - which read the BROWSER WINDOW's name, not the meal's, so
   the floor returned on its first line every time it ran here. The order this
   assertion exists to protect is unchanged and now has three links: whole-food
   floor, then the junk ceiling, then the drink floor last. */
t(/_wholeFoodFloor\(_gpName, rating\);[\s\S]{0,200}_drinkFloor/.test(src),
  '...right after the whole-food floor, not instead of it');
t(/_junkCeiling\(_gpName, rating\);[\s\S]{0,120}_drinkFloor\(rating, entry\.calories\)/.test(src),
  '...and the 25-calorie drink floor still runs AFTER the junk ceiling, so a 4-calorie coffee is still unjudged');

console.log(bad? ('tnojudge: '+bad+' FAILED') : 'tnojudge: all passed');
process.exit(bad?1:0);
