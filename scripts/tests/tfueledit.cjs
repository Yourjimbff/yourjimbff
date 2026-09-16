// EDITING A MACRO MOVES THE CALORIES (Yusuf, 15 Sep).
//
// A client asked him, with a screenshot of her own numbers:
//   "A good feature or maybe feature I haven't found, ability to edit macros?
//    Like this example, moving carbs down a touch. Is there an easy way to
//    modify in the app?"
// His answer:
//   "there should be an edit field under your macros / nutrition goal. it
//    should also automatically and cleanly adjust your total calories upon
//    doing so, and save it."
//
// THE FIELDS WERE ALREADY THERE and had been for weeks. What was missing is the
// arithmetic. Setting carb_manual pinned carbs and left the calorie number
// exactly where it was, so somebody who took fifty grams of carbs off their day
// saw four numbers that no longer added up - two hundred calories short - and
// the app went on asking them to hit the old total. Every bar, every
// remaining-for-today line and every judgement about the day then ran off a
// figure their own macros contradicted.
//
// So this suite is arithmetic, and it runs the real function.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global.window={addEventListener:()=>{}, matchMedia:()=>({matches:false})};
global.document={getElementById:()=>null, addEventListener:()=>{}, querySelector:()=>null,
                 body:{classList:{contains:()=>false}, getAttribute:()=>''}};
global.localStorage={getItem:()=>null, setItem:()=>{}};
global.renderPhaseUI=()=>{};
global.profile={};
/* Lift the engine and the setter only. The wider closure drags in page-level
   wiring that expects a browser; this suite is arithmetic and wants neither. */
const MINE=['PHASES','_curPhase','_pGender','_clientGender',
            '_actLevel','_actShare','_actStep',
            /* the engine applies the activity carb ceiling now, so its three
               pieces are part of the engine and not optional here */
            'CARB_CAP','FAT_MAX_PCT','_carbCapFor','_carbCapNow','_carbCap',
            '_fuelTargets','pSetFuel','pResetFuel','FUEL_MAX'];
/* MS_ACT_LO/HI/SHARE share one var statement, so they lift as that whole line
   rather than by name. */
eval(src.split('\n').find(l=>l.startsWith('var MS_ACT_LO=')));
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(['MS_ACT_SHARE']), n=>eval(n));

const set=o=>{ global.profile=Object.assign({weight:170, goal_weight:170, gender:'male', phase:'comp'}, o); };
const now=()=>{ const T=_fuelTargets(); return {cal:T.cal, prot:T.prot, carb:T.carb, fat:T.fat}; };
const adds=o=>o.prot*4+o.carb*4+o.fat*9;

console.log('\n  WHAT SHE WAS LOOKING AT:');
set({});
const before=now();
t(before.cal>0 && before.carb>0, 'a computed plate exists', JSON.stringify(before));
t(Math.abs(adds(before)-before.cal)<=9, '  and the computed one adds up',
  adds(before)+' vs '+before.cal);

console.log('\n  MOVING CARBS DOWN A TOUCH:');
pSetFuel('carb', before.carb-50);
const after=now();
t(after.carb===before.carb-50, 'carbs land where she put them', String(after.carb));
/* THE NEW TOTAL IS THE TRUE SUM, not the old total minus 200. The computed
   plate never summed exactly: _fuelTargets rounds calories to the nearest ten
   and each macro to a whole gram, so the engine's own four numbers sit a few
   calories apart from their sum. Taking fifty grams off and then asking what
   the plate actually comes to is the honest answer, and it is the one that
   makes the card add up afterwards - which the line below is the real point. */
t(after.cal===adds({prot:before.prot, carb:before.carb-50, fat:before.fat}),
  'and the calorie total follows what the plate now comes to',
  before.cal+' -> '+after.cal);
t(Math.abs((before.cal-after.cal)-200)<=9, '  which is 50x4 lower, give or take the rounding',
  String(before.cal-after.cal));
t(Math.abs(adds(after)-after.cal)<=9, 'the four numbers still add up',
  after.prot+'p '+after.carb+'c '+after.fat+'f = '+adds(after)+' vs '+after.cal);
t(after.prot===before.prot && after.fat===before.fat,
  'and nothing she did not touch moved', JSON.stringify(after));

console.log('\n  IT IS SAVED, NOT JUST DRAWN:');
/* All four are written on purpose. A plate that is half theirs and half
   computed is the same disagreement in a different place - the computed half
   re-derives on the next paint and pulls the total off again. */
t(profile.carb_manual===after.carb, 'carbs are on the profile', String(profile.carb_manual));
t(profile.cal_manual===after.cal, 'so is the new total', String(profile.cal_manual));
t(profile.pro_manual>0 && profile.fat_manual>0,
  'and so are the two she did not touch, so nothing re-derives underneath her');
/* The columns _gpSave ships. A number that never leaves the phone is not saved. */
const SAVED=src.slice(src.indexOf('cal_manual:(profile.cal_manual||null)'), src.indexOf('cal_manual:(profile.cal_manual||null)')+220);
t(/pro_manual:\(profile\.pro_manual\|\|null\)/.test(SAVED)
  && /carb_manual:\(profile\.carb_manual\|\|null\)/.test(SAVED)
  && /fat_manual:\(profile\.fat_manual\|\|null\)/.test(SAVED),
  'and all four ride out to the server on the same write');
t(/function gpSetFuel\(k,v\)\{ pSetFuel\(k,v\); _gpSave\(\); renderGoalsPage\(\); \}/.test(src),
  'which is what the box on the card actually calls');

console.log('\n  THE OTHER THREE DIRECTIONS:');
set({}); const b2=now();
pSetFuel('prot', b2.prot+20);
t(now().cal===adds({prot:b2.prot+20, carb:b2.carb, fat:b2.fat})
  && Math.abs((now().cal-b2.cal)-80)<=9,
  'protein up 20 is 80 more calories', b2.cal+' -> '+now().cal);
set({}); const b3=now();
pSetFuel('fat', b3.fat+10);
t(now().cal===adds({prot:b3.prot, carb:b3.carb, fat:b3.fat+10})
  && Math.abs((now().cal-b3.cal)-90)<=9,
  'fat up 10 is 90 more', b3.cal+' -> '+now().cal);
/* CALORIES ARE STILL THEIR OWN EDIT, and the opposite direction: typing a total
   means "this is what I want to eat" and the macros re-derive under it. That
   was already the behaviour and it stays. */
set({}); pSetFuel('cal', 2000);
const c=now();
t(c.cal===2000, 'typing a calorie total pins the total', String(c.cal));
t(Math.abs(adds(c)-2000)<=9, '  and the macros re-derive to match it',
  c.prot+'p '+c.carb+'c '+c.fat+'f = '+adds(c));
t(!(profile.carb_manual>0), '  without pinning the macros as well');

console.log('\n  A TYPO IS NOT AN INSTRUCTION:');
set({}); const b4=now();
pSetFuel('carb','');
t(JSON.stringify(now())===JSON.stringify(b4), 'an empty box changes nothing', JSON.stringify(now()));
pSetFuel('carb','abc');
t(JSON.stringify(now())===JSON.stringify(b4), 'and neither does nonsense');
pSetFuel('carb', 99999);
t(JSON.stringify(now())===JSON.stringify(b4), 'and neither does a fat-fingered 99999');
t(FUEL_MAX.carb===800 && FUEL_MAX.prot===500 && FUEL_MAX.fat===400,
  'each macro has a ceiling a human could plausibly reach');
pSetFuel('carb', 0);
t(JSON.stringify(now())===JSON.stringify(b4), 'and zero is a mistake, not a diet');

console.log('\n  AND THERE IS ONE WAY BACK:');
set({}); const b5=now();
pSetFuel('carb', 120);
t(now().cal!==b5.cal, 'after an edit the plate is theirs');
pResetFuel();
t(JSON.stringify(now())===JSON.stringify(b5), 'Reset to calculated hands all four back to the engine',
  JSON.stringify(now()));
t(/onclick="gpResetFuel\(\)"/.test(src), 'and that link is on the card');
t(/Change any number and your calories follow/.test(src),
  'the card says what it does, rather than describing a box');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (move one, the total follows, and it is saved)');
process.exit(bad?1:0);
