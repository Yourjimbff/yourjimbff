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
const MINE=['CONSULT_MIN_AGE','CONSULT_MIN_GAP','_consultFits','_ageFromBday','_obApplies','_obSkip'];
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
t(_consultFits(_ageFromBday(yrs(30)), 230, 190)===true, 'born 30 years ago, 40 to lose');
t(_consultFits(_ageFromBday(yrs(19)), 230, 190)===false, 'born 19 years ago, same goal, no offer');
t(_consultFits(_ageFromBday(null), 230, 190)===false, 'no birthday is not 23');
t(/_ageFromBday\(p\.birthday\)/.test(src), 'and the surface that uses it reads the birthday, not an age column');

console.log('\n  AND IT IS OFF THE SETUP OFFER ALTOGETHER NOW:');
/* Yusuf, 17 Sep, looking at the filtered and unfiltered versions of that screen
   side by side: "wouldn't it be either or? why both? just do 06, and then go to
   flow 07." Two versions of one screen was one too many. Everybody who finishes
   setup sees the same screen and the same times, so the wrapper that asked the
   filter during setup is gone rather than left behind unused. */
t(!/_obConsultFits/.test(src), 'no setup-time wrapper around the filter is left in the file');
const doors=src.slice(src.indexOf('function _ctaDoors(a){'), src.indexOf('function _ctaHtml('));
t(!/_consultFits|_ctaFits/.test(doors), 'and the offer screen does not ask it');
t(/h\+=_ctaPickerHtml\(\);/.test(doors), 'the times are drawn for everybody');
/* The one screen without them is the one where his calendar has none. */
const picker=src.slice(src.indexOf('function _ctaPickerHtml(){'), src.indexOf('function _ctaDoors(a){'));
t(/if\(days===null\) return ''/.test(picker), 'unless availability could not be confirmed');
t(/if\(!days \|\| !days\.length\) return ''/.test(picker), 'or there is genuinely nothing open');

console.log('\n  THE FILTER STILL GUARDS THE SURFACE THAT GOES LOOKING:');
/* The Program page offers a call to somebody who never asked for one. That is
   the surface his two numbers are for, and it keeps them. */
t(/if\(!_consultFits\(age, w, gw\)\) return '';/.test(src),
  'the Program card still asks before it offers anything');

console.log('\n  THE SCREEN NO LONGER DISAPPEARS:');
/* CHANGED 16 Sep, on his report: "i never saw the opt in for a call or text from
   me dude. i signed into this new profile and nothing for the opt in."

   The whole screen used to be skipped for anyone outside his filter - and also
   for anyone whose numbers were simply MISSING, which is what happens when
   somebody taps past the weight screens. An offer that silently is not there is
   an offer nobody can decline, and he could not find his own.

   Split by COST now. A text from him is cheap, so everybody who finishes is
   offered one. An hour of his time is scarce, so the CALENDAR inside the screen
   is what the 23-and-over, eight-pound filter governs. His ruling that he does
   not want seventy calls stands; what changed is that the screen is reachable. */
global._OB_STEPS=[{k:'intro'},{k:'gender'},{k:'consult',type:'consult'},{k:'home'}];
global._ob={a:{birthday:yrs(19), weight:200, goal_weight:190}};
t(_obApplies({k:'gender'})===true, 'every other step applies to everybody');
t(_obApplies({k:'consult',type:'consult'})===true,
  'and so does the offer now, even well outside the filter');
t(_obSkip(2, 1)===2, '  so the walk stops on it going forward', String(_obSkip(2,1)));
t(_obSkip(2,-1)===2, '  and going back', String(_obSkip(2,-1)));
global._ob={a:{}};
t(_obApplies({k:'consult',type:'consult'})===true,
  'somebody who never typed a weight gets it too, which is the case he hit');

console.log('\n  BOTH DOORS, AND ONE OF THEM ALWAYS LEADS:');
const dr=src.slice(src.indexOf('/* NO FILTER ON THIS SCREEN ANY MORE'), src.indexOf('function _ctaHtml('));
t(/_obConsultPick\(\\?'yes\\?'\)/.test(dr), 'the text door is on the screen whatever else is');
t(/alone\?'ctaGo':'ctaGo2'/.test(dr),
  'and it becomes the main button on the days his calendar has nothing in it');
t(/wouldn't it be either or\? why both\?/.test(dr), 'with his reason written down');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the call is offered to the people he meant, more than once)');
process.exit(bad?1:0);
