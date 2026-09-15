// THE CARB CEILING IS AN ACTIVITY QUESTION (Yusuf, 15 Sep).
//
//   "NOT ACTIVE YET should have a carb goal no higher than 150, semi active
//    175, very active 200-220. I only say that because someone who's not
//    active shouldn't be eating six servings they should be eating like three
//    or four of the most. Someone who is moderately active can have 4 to 5.
//    Someone who's very active can have 6."
//
// The cap it replaced was 250, or 300 for anybody 6'1" and over - a rule about
// how big somebody is, applied to a macro that is about how much work they do.
// It meant the one question on that screen could not change the number under
// it, which is the opposite of what the screen is for.
//
// TWO THINGS THIS PROVES. That the three caps are his three numbers, and that
// the plate still ADDS UP afterwards - protein x4 plus carbs x4 plus fat x9
// landing on the calorie total. A cap that trims one macro and leaves the
// total alone produces four numbers on a screen that do not agree, and the
// person reading them is being asked to eat by arithmetic that is wrong.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global.window={}; global.document={getElementById:()=>null};
const MINE=['_OB_CARB_CAP','OB_FAT_MAX_PCT','_obCarbCap','_obServeHtml'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  HIS THREE NUMBERS:');
t(_OB_CARB_CAP.none===150,   'not active yet -> 150', String(_OB_CARB_CAP.none));
t(_OB_CARB_CAP.some===175,   'semi consistent -> 175', String(_OB_CARB_CAP.some));
t(_OB_CARB_CAP.weekly===210, 'very active -> 210, the middle of 200-220', String(_OB_CARB_CAP.weekly));
/* The rule it replaced was about height, and height has nothing to do with it. */
t(!/var _carbCap=_tall\?300:250;/.test(src), 'the height cap is gone');
t(!/_tall=\(_ft>6\)\|\|\(_ft===6&&_in>=1\)/.test(src), 'and the height test it needed with it');

console.log('\n  THE SCREEN HE SENT, PUT THROUGH IT:');
// 2,130 cal / 160p / 224c / 66f, somebody who said they are not active yet.
const A={cal:2130, prot:160, carb:224, fat:66};
t(A.prot*4+A.carb*4+A.fat*9===A.cal, '  (his numbers do add up before we touch them)');
_obCarbCap(A,'none');
t(A.carb===150, 'carbs come down to 150', String(A.carb));
t(A.cal===2130, 'and the calorie total does not move', String(A.cal));
const sumA=A.prot*4+A.carb*4+A.fat*9;
t(Math.abs(sumA-A.cal)<=9, 'the four numbers still add up', A.prot+'p '+A.carb+'c '+A.fat+'f = '+sumA+' vs '+A.cal);
t(A.fat===99, '  what came off carbs went to fat', String(A.fat));

console.log('\n  AND EACH LEVEL LANDS ON THE SERVINGS HE ASKED FOR:');
/* His own sentences: three or four at the most, four to five, six. The servings
   line is not a second rule kept in step by hand - _obServeHtml sizes a serving
   so none passes forty grams, and the caps fall on 4, 5 and 6 by themselves. */
const servings=(c)=>{
  const h=_obServeHtml({prot:0, carb:c});
  const m=h.match(/carbs<\/b> is (\d+) servings of about (\d+)g/);
  return m?{n:+m[1], each:+m[2]}:null;
};
const sN=servings(_OB_CARB_CAP.none), sS=servings(_OB_CARB_CAP.some), sW=servings(_OB_CARB_CAP.weekly);
t(sN && sN.n===4, 'not active: 4 servings - "three or four at the most"', JSON.stringify(sN));
t(sS && sS.n===5, 'semi: 5 servings - "4 to 5"', JSON.stringify(sS));
t(sW && sW.n===6, 'very active: 6 servings - "someone who is very active can have 6"', JSON.stringify(sW));

console.log('\n  IT ONLY EVER TRIMS:');
const under={cal:2000, prot:150, carb:120, fat:78};
const before=JSON.stringify(under);
_obCarbCap(under,'none');
t(JSON.stringify(under)===before, 'somebody already under the cap is left alone', JSON.stringify(under));
const semi={cal:2400, prot:170, carb:250, fat:80};
_obCarbCap(semi,'some');
t(semi.carb===175, 'a semi-active person is capped at their own number', String(semi.carb));
t(Math.abs(semi.prot*4+semi.carb*4+semi.fat*9-semi.cal)<=9, '  and still adds up',
  semi.prot+'p '+semi.carb+'c '+semi.fat+'f');
const active={cal:2900, prot:190, carb:300, fat:96};
_obCarbCap(active,'weekly');
t(active.carb===210, 'and a very active one at theirs', String(active.carb));

console.log('\n  THE RAIL, WHICH IS NOT A THIRD RULE:');
/* Fat stops at 45% of calories. It never fires in a normal case - the ones
   above land at 42% - but a low calorie target with a hard cap could otherwise
   produce a plate that is mostly oil. Carbs keeping what will not fit is
   better than that, and better than silently losing calories off the bottom. */
t(OB_FAT_MAX_PCT===0.45, 'fat stops at 45% of calories');
const fatPct=o=>Math.round(o.fat*9/o.cal*100);
t(fatPct(A)<=45, '  his own case never reaches it', fatPct(A)+'%');
const tight={cal:1400, prot:130, carb:210, fat:5};
_obCarbCap(tight,'none');
t(fatPct(tight)<=46, 'a case that would have gone past it does not', fatPct(tight)+'%');
t(tight.carb>=150, '  carbs keep what fat could not take', String(tight.carb));
t(Math.abs(tight.prot*4+tight.carb*4+tight.fat*9-tight.cal)<=9, '  and it still adds up',
  tight.prot+'p '+tight.carb+'c '+tight.fat+'f = '+(tight.prot*4+tight.carb*4+tight.fat*9)+' vs '+tight.cal);

console.log('\n  AND IT IS WIRED TO THE ANSWER THEY GAVE:');
t(/if\(T\) _obCarbCap\(T, a\.active\);/.test(src), 'off the active answer on the screen, not the profile');
t(/\{v:'none',/.test(src) && /\{v:'some',/.test(src) && /\{v:'weekly',/.test(src),
  'and those are the three values that question can hold');
const unknown={cal:2000, prot:150, carb:300, fat:60};
_obCarbCap(unknown,'');
t(unknown.carb===150, 'an unanswered question is treated as not active, the safe end', String(unknown.carb));

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (carbs follow the work, and the plate adds up)');
process.exit(bad?1:0);
