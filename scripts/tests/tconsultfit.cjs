// WHO THE FREE CALL IS FOR (Yusuf, 16 Sep).
//
// Seventy people came in off one poll in three days. Every one of them was
// shown the same "Want a hand with that?" screen at the end of setup, and the
// screen is a one-shot: one tap of Next and it never comes back.
//
// His filter, in his own words: "Age 23+ anyone who seems qualified some more
// than like a 15 lb weight loss goal." He does not want seventy calls. He wants
// the fifteen that could turn into something, and he is short this month, so an
// hour spent on somebody who wants to lose eight pounds is an hour he cannot
// afford to give away.
//
// TWO THINGS THIS PROVES. That the filter is his two numbers and that an
// UNKNOWN never passes it - a missing birthday or a missing goal weight is not
// a qualification, and treating it as one would put the offer right back in
// front of everybody, which is the thing being fixed.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global.window={}; global.document={getElementById:()=>null};
const MINE=['CONSULT_MIN_AGE','CONSULT_MIN_GAP','_consultFits','_ageFromBday','_obConsultFits','_obApplies','_obSkip'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  HIS TWO NUMBERS:');
t(CONSULT_MIN_AGE===23, '23 and over', String(CONSULT_MIN_AGE));
t(CONSULT_MIN_GAP===15, 'and more than a 15 lb goal', String(CONSULT_MIN_GAP));

console.log('\n  WHO GETS THE OFFER:');
t(_consultFits(30, 230, 190)===true,  '30, wants to lose 40');
t(_consultFits(23, 200, 184)===true,  '23 exactly, 16 lbs - both edges, just inside');
/* He said fifteen pounds of weight LOSS because that is the client he pictures.
   Somebody twenty pounds under where they want to be is the same size of goal
   and the same conversation, so the gap is absolute. */
t(_consultFits(28, 150, 175)===true,  'and 25 lbs the other way is the same size of goal');

console.log('\n  AND WHO DOES NOT:');
t(_consultFits(22, 230, 190)===false, '22 is under his line', '22/40lb');
t(_consultFits(40, 200, 190)===false, 'a 10 lb goal is not the call he means');
t(_consultFits(40, 200, 185)===false, 'and exactly 15 is not MORE than 15');
t(_consultFits(23, 200, 185)===false, '  both edges, just outside');

console.log('\n  AN UNKNOWN IS NOT A YES:');
/* This is the half that matters. Treating a blank as a pass puts the offer back
   in front of all seventy, which is the thing being fixed. */
[[0,230,190,'no age at all'],
 [null,230,190,'a null age'],
 [30,null,190,'no current weight'],
 [30,230,null,'no goal weight'],
 [30,0,0,'neither weight'],
 [undefined,undefined,undefined,'nothing known at all']].forEach(([a,w,g,why])=>{
  t(_consultFits(a,w,g)===false, why);
});
t(_consultFits('nonsense','nonsense','nonsense')===false, 'and nonsense is not a yes either');

console.log('\n  THE AGE IS COMPUTED, NEVER A STORED FIELD:');
/* A stored age is right for one year and then quietly wrong. */
const yrs=n=>{ const d=new Date(); d.setFullYear(d.getFullYear()-n); return d.toISOString().slice(0,10); };
t(_obConsultFits({birthday:yrs(30), weight:230, goal_weight:190})===true, 'born 30 years ago, 40 to lose');
t(_obConsultFits({birthday:yrs(19), weight:230, goal_weight:190})===false, 'born 19 years ago, same goal, no offer');
t(_obConsultFits({weight:230, goal_weight:190})===false, 'no birthday is not 23');
t(_obConsultFits({})===false && _obConsultFits(null)===false, 'and an empty answer set is not either');
t(/_ageFromBday\(a\.birthday\)/.test(defOf('_obConsultFits')), 'setup reads the birthday they just typed');
t(/_ageFromBday\(p\.birthday\)/.test(src), 'and the card does too');

console.log('\n  THE SCREEN IS SKIPPED, NOT GREYED OUT:');
global._OB_STEPS=[{k:'intro'},{k:'gender'},{k:'consult',type:'consult'},{k:'home'}];
global._ob={a:{birthday:yrs(19), weight:200, goal_weight:190}};
t(_obApplies({k:'gender'})===true, 'every other step applies to everybody');
t(_obApplies({k:'consult',type:'consult'})===false, 'the offer does not apply to somebody outside the filter');
t(_obSkip(2, 1)===3, 'going forward it lands past it', String(_obSkip(2,1)));
t(_obSkip(2,-1)===1, 'and going back it lands before it', String(_obSkip(2,-1)));
global._ob={a:{birthday:yrs(30), weight:230, goal_weight:190}};
t(_obApplies({k:'consult',type:'consult'})===true, 'and somebody inside the filter still gets it');
t(_obSkip(2, 1)===2, '  where it stops the walk', String(_obSkip(2,1)));
/* The first and last screens always apply, so the walk can never run off an end
   however many steps in the middle are hidden. */
global._ob={a:{}};
global._OB_STEPS=[{k:'intro'},{k:'consult',type:'consult'},{k:'consult',type:'consult'},{k:'home'}];
t(_obSkip(1,-1)===0, 'walking back off the front stops at the first screen', String(_obSkip(1,-1)));
t(_obSkip(1, 1)===3, 'and forward off the end stops at the last', String(_obSkip(1,1)));

console.log('\n  IT IS WIRED IN BOTH DIRECTIONS:');
t(/_ob\.i=_obSkip\(_ob\.i\+1, 1\); obRender\(\);/.test(src), 'Next skips');
t(/function obBack\(\)\{ if\(!_ob\) return; if\(_ob\.i>0\)\{ _ob\.i=_obSkip\(_ob\.i-1, -1\);/.test(src), 'Back skips');
t(/setTimeout\(function\(\)\{ if\(_ob && _ob\.i<_OB_STEPS\.length-1\)\{ _ob\.i=_obSkip\(_ob\.i\+1, 1\);/.test(src),
  'and so does the screen that advances itself');
t(!/\{ _ob\.i\+\+; obRender\(\); \}/.test(src), 'nothing steps by one any more');
t(/if\(!_obApplies\(_OB_STEPS\[i\]\)\) continue;/.test(src),
  'and the dots count the screens they will actually see');

console.log('\n  AND THE OFFER COMES BACK:');
/* One tap of Next at the end of setup and the old one was gone forever - which
   is the worst moment to ask somebody to book a call, four minutes into an app
   they have not used yet. */
const card=src.slice(src.indexOf('function _pgConsultCard(){'), src.indexOf('function renderProgramTab(){'));
t(/_meFreeApp\(\)/.test(card), 'it is a free-app card only - a paying client is not sold to');
t(/_consultFits\(age, p\.weight, \(p\.goal_weight\|\|p\.goalWeight\)\)/.test(card),
  'the same filter, not a second copy of his numbers');
t(/openConsultBooking\(\)/.test(card), 'and it opens the booking page the offer screen opens');
t(/CONSULT_BOOK_URL\|\|''\)\.trim\(\)/.test(card), 'with no card at all when there is no link to open');
t(/\+ _pgConsultCard\(\)/.test(src), 'and the Program tab hosts it');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the call is offered to the people he meant, more than once)');
process.exit(bad?1:0);
