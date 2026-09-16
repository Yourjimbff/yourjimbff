// WHO THE FREE CALL IS FOR (Yusuf, 16 Sep).
//
// Seventy people came in off one poll in three days. Every one of them was
// shown the same "Want a hand with that?" screen at the end of setup, and the
// screen is a one-shot: one tap of Next and it never comes back.
//
// His filter, in his own words: "Age 23+ anyone who seems qualified some more
// than like a 15 lb weight loss goal."
//
// THEN HE MOVED IT, same day, once he saw what fifteen cost him: "broaden the
// goal to be 10, if it's 10 or greater that's better, or 8 or greater than
// that, that's fine, I can still sell something." Measured on the real
// seventy-two: over 15 was nineteen people, 10 or more is thirty-nine, 8 or
// more is forty-three. He named 8 as sellable, so 8 is the bar, and it is
// greater-or-EQUAL, because somebody sitting exactly on 8 is the person he
// described.
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
t(CONSULT_MIN_GAP===8, 'and 8 lb or more to move', String(CONSULT_MIN_GAP));

console.log('\n  WHO GETS THE OFFER:');
t(_consultFits(30, 230, 190)===true,  '30, wants to lose 40');
t(_consultFits(23, 200, 192)===true,  '23 exactly, 8 lbs - both edges, exactly on the line');
t(_consultFits(40, 200, 190)===true,  'a 10 lb goal, which he called the better one');
t(_consultFits(40, 200, 185)===true,  'and 15, which used to be the bar');
/* He said fifteen pounds of weight LOSS because that is the client he pictures.
   Somebody twenty pounds under where they want to be is the same size of goal
   and the same conversation, so the gap is absolute. */
t(_consultFits(28, 150, 175)===true,  'and 25 lbs the other way is the same size of goal');

console.log('\n  AND WHO DOES NOT:');
t(_consultFits(22, 230, 190)===false, '22 is under his line', '22/40lb');
t(_consultFits(40, 200, 193)===false, 'a 7 lb goal is under the bar');
t(_consultFits(22, 200, 192)===false, '  and a qualifying goal does not carry an under-age');
/* The old bar, kept as a test so nobody quietly walks it back up. */
t(_consultFits(30, 200, 188)===true,  '12 lb would have been refused at the old 15 and is not now');

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
/* NOTHING ABOUT A WRITTEN GOAL (Yusuf, 16 Sep): "remove having to have written
   a goal to qualify, because people signed in before they were able to create
   a goal." It was never a gate here and this keeps it that way. */
t(_obConsultFits({birthday:yrs(30), weight:230, goal_weight:190, goal_text:null})===true,
  'and no written goal is not a disqualification');
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
/* "i like B" - their own two numbers and their own name, which is the version
   that can be written for every single person it is shown to. */
t(/var gap=Math\.round\(Math\.abs\(w-gw\)\);/.test(card), 'it leads with the distance they typed');
t(/cl&&cl\.name/.test(card) && /split\(\/\\s\+\/\)\[0\]/.test(card), 'and their first name');
t(/' to go\.'/.test(card), '  with a version that still reads if there is no name on the account');
t(/You put in '\+Math\.round\(w\)\+', and '\+Math\.round\(gw\)/.test(card), 'then both numbers back to them');
t(/1:1 guidance is right for you/.test(card), 'and it asks whether 1:1 guidance is right for them');
/* His words: "I would remove free call". Free is what you call a thing you are
   trying to get rid of. */
/* The COPY, not the word wherever it appears in a note explaining why the copy
   changed. Each of these is a string a client could read off a screen. */
[["'A free call with Yusuf'", 'the card title'],
 ["A free call with Yusuf. No charge, no catch.", 'the setup screen subtitle'],
 [">Book a free call<", 'the setup screen button'],
 ["Book a free consultation", 'the link in Settings'],
 ["Schedule a free call to discuss your fitness goals.", 'the Settings subtitle']
].forEach(([lit,where])=>{ t(src.indexOf(lit)<0, 'gone: '+where, lit); });
t(/if\(!_consultFits\(age, w, gw\)\) return '';/.test(card),
  'the same filter, not a second copy of his numbers');
t(!/>=\s*8|CONSULT_MIN_GAP\s*[=<>]/.test(card.replace(/_consultFits/g,'')),
  '  and the card never re-states the bar itself');
t(/openConsultBooking\(\)/.test(card), 'and it opens the booking page the offer screen opens');
t(/CONSULT_BOOK_URL\|\|''\)\.trim\(\)/.test(card), 'with no card at all when there is no link to open');
t(/\+ _pgConsultCard\(\)/.test(src), 'and the Program tab hosts it');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the call is offered to the people he meant, more than once)');
process.exit(bad?1:0);
