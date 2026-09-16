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
// AND IT IS NOT A SETUP RULE (Yusuf, 16 Sep): "Please make sure that the new
// carb goals are also implemented in general." It shipped inside _obTargets -
// the preview on the setup screen - so it reached the people signing up and
// nobody else. Not the hundred and fifty clients already on the app, and not
// anybody whose answer to that question changed afterwards.
//
// SO THIS SUITE RUNS THE REAL ENGINE, not just the trimming function. Three
// things have to be true and the third is the one that bites: the caps are his
// three numbers; the plate still ADDS UP afterwards (protein x4 plus carbs x4
// plus fat x9 landing on the calorie total, because four numbers on a screen
// that disagree are four numbers nobody can eat by); and _fuelTargets - the one
// engine behind the Food tab, the Program fuel card, Settings, Jim's context
// and the stored carb_target - lands on those numbers for a client who never
// saw a setup screen.
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
global.profile={};
/* MS_ACT_LO/HI/SHARE share one var statement, so they lift as that whole line. */
eval(src.split('\n').find(l=>l.startsWith('var MS_ACT_LO=')));
const MINE=['CARB_CAP','FAT_MAX_PCT','_carbCapFor','_carbCapNow','_carbCap','_obServeHtml',
            'PHASES','_curPhase','_pGender','_clientGender','_actLevel','_actShare','_actStep',
            '_fuelTargets','_fuelRanges','_cwNum','_cwActive','_cwFuel'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  HIS THREE NUMBERS:');
t(CARB_CAP.none===150,   'not active yet -> 150', String(CARB_CAP.none));
t(CARB_CAP.some===175,   'semi consistent -> 175', String(CARB_CAP.some));
t(CARB_CAP.weekly===210, 'very active -> 210, the middle of 200-220', String(CARB_CAP.weekly));
/* The rule it replaced was about height, and height has nothing to do with it. */
t(!/var _carbCap=_tall\?300:250;/.test(src), 'the height cap is gone');
t(!/_tall=\(_ft>6\)\|\|\(_ft===6&&_in>=1\)/.test(src), 'and the height test it needed with it');
/* One resolver, so the target, the band under it and the trainer's copy of it
   can never disagree about where the ceiling is. */
t(_carbCapFor('none')===150 && _carbCapFor('some')===175 && _carbCapFor('weekly')===210,
  'one function turns an answer into a number');
t(_carbCapFor('')===150 && _carbCapFor(null)===150 && _carbCapFor('nonsense')===150,
  '  and anything it does not recognise is the safe end');

console.log('\n  THE SCREEN HE SENT, PUT THROUGH IT:');
// 2,130 cal / 160p / 224c / 66f, somebody who said they are not active yet.
const A={cal:2130, prot:160, carb:224, fat:66};
t(A.prot*4+A.carb*4+A.fat*9===A.cal, '  (his numbers do add up before we touch them)');
_carbCap(A,'none');
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
const sN=servings(CARB_CAP.none), sS=servings(CARB_CAP.some), sW=servings(CARB_CAP.weekly);
t(sN && sN.n===4, 'not active: 4 servings - "three or four at the most"', JSON.stringify(sN));
t(sS && sS.n===5, 'semi: 5 servings - "4 to 5"', JSON.stringify(sS));
t(sW && sW.n===6, 'very active: 6 servings - "someone who is very active can have 6"', JSON.stringify(sW));

console.log('\n  IT ONLY EVER TRIMS:');
const under={cal:2000, prot:150, carb:120, fat:78};
const before=JSON.stringify(under);
_carbCap(under,'none');
t(JSON.stringify(under)===before, 'somebody already under the cap is left alone', JSON.stringify(under));
const semi={cal:2400, prot:170, carb:250, fat:80};
_carbCap(semi,'some');
t(semi.carb===175, 'a semi-active person is capped at their own number', String(semi.carb));
t(Math.abs(semi.prot*4+semi.carb*4+semi.fat*9-semi.cal)<=9, '  and still adds up',
  semi.prot+'p '+semi.carb+'c '+semi.fat+'f');
const active={cal:2900, prot:190, carb:300, fat:96};
_carbCap(active,'weekly');
t(active.carb===210, 'and a very active one at theirs', String(active.carb));

console.log('\n  THE RAIL, WHICH IS NOT A THIRD RULE:');
/* Fat stops at half the calories - a plate more than half oil is the one thing
   worse than carbs being over, and handing carbs back beats losing calories off
   the bottom of the plate.
   IT WAS 45% AND THAT WAS TOO TIGHT. A 170lb goal, comp phase, not active lands
   on 2,380 and 170g protein; holding carbs at 150 needs 122g fat, which is 46%,
   so the rail fired and gave carbs back until they reached 157. His number is
   150. A rail of mine overriding a ceiling of his in the commonest case on the
   app is the rail being wrong. */
t(FAT_MAX_PCT===0.50, 'fat stops at half the calories', String(FAT_MAX_PCT));
const fatPct=o=>Math.round(o.fat*9/o.cal*100);
t(fatPct(A)<=50, '  his own case never reaches it', fatPct(A)+'%');
/* The case it IS for, and a real one: somebody not active who types a 3,000
   calorie total. Uncapped that plate is 243c/150f; a hard 150 would need 191g
   of fat, which is 57% of the day. */
const typed={cal:3000, prot:170, carb:243, fat:150};
_carbCap(typed,'none');
t(fatPct(typed)<=50, 'a case that would have gone past it does not', fatPct(typed)+'%');
t(typed.carb>150, '  carbs keep what fat could not take', String(typed.carb));
t(Math.abs(typed.prot*4+typed.carb*4+typed.fat*9-typed.cal)<=9, '  and it still adds up',
  typed.prot+'p '+typed.carb+'c '+typed.fat+'f = '+(typed.prot*4+typed.carb*4+typed.fat*9)+' vs '+typed.cal);

console.log('\n  AND IT IS WIRED TO THE ANSWER THEY GAVE:');
t(/if\(T\) _carbCap\(T, a\.active\);/.test(src), 'off the active answer on the screen, not the profile');
t(/\{v:'none',/.test(src) && /\{v:'some',/.test(src) && /\{v:'weekly',/.test(src),
  'and those are the three values that question can hold');
const unknown={cal:2000, prot:150, carb:300, fat:60};
_carbCap(unknown,'');
t(unknown.carb===150, 'an unanswered question is treated as not active, the safe end', String(unknown.carb));

// =====================================================================
// "ALSO IMPLEMENTED IN GENERAL" (16 Sep) - the engine, not the setup screen.
// =====================================================================
const set=o=>{ global.profile=Object.assign({weight:185, goal_weight:170, gender:'male', phase:'comp'}, o); };
const act=v=>({intake_json:JSON.stringify({active:v})});
const adds=T=>T.prot*4+T.carb*4+T.fat*9;

console.log('\n  THE ENGINE EVERY OTHER SURFACE READS:');
t(/if\(_carbCapNow\(\)>0\) _carbCap\(T, _actLevel\(\)\);/.test(src),
  '_fuelTargets applies the ceiling itself');
/* Last, on the finished numbers, and after the manual block - so the engine
   does all of its own arithmetic first and a hand-set plate passes untouched. */
const eng=src.slice(src.indexOf('function _fuelTargets()'), src.indexOf('function _fuelRanges()'));
t(eng.indexOf('manual overrides win') < eng.indexOf('_carbCapNow()'),
  '  after the manual block, not before it');
t(eng.indexOf('_carbCapNow()') < eng.indexOf('return T;'),
  '  and last, so it only trims the tail');

console.log('\n  A CLIENT WHO NEVER SAW A SETUP SCREEN:');
[['none',150],['some',175],['weekly',210]].forEach(([lvl,cap])=>{
  set(act(lvl));
  const T=_fuelTargets();
  t(T.carb===cap, lvl+' lands exactly on '+cap, String(T.carb));
  t(Math.abs(adds(T)-T.cal)<=9, '  and the plate adds up',
    T.cal+'cal '+T.prot+'p '+T.carb+'c '+T.fat+'f = '+adds(T));
});
/* Nobody on the app before 15 Sep answered that question, because it did not
   exist. An absent answer is the safe end, not an absent cap. */
set({});
t(_fuelTargets().carb<=150, 'an existing client with no answer gets the 150',
  String(_fuelTargets().carb));

console.log('\n  AND WHEN THEY HAVE TAKEN THE WHEEL, IT STOPS:');
/* A hand-typed carb figure is their answer. A hand-typed fat figure pins the
   macro the cap moves energy INTO, so trimming carbs against it would leave
   four numbers that no longer add up. */
set(Object.assign(act('none'),{carb_manual:260, fat_manual:70, pro_manual:170, cal_manual:2350}));
t(_carbCapNow()===0, 'a hand-set carb figure turns it off');
t(_fuelTargets().carb===260, '  and their number is the number', String(_fuelTargets().carb));
set(Object.assign(act('none'),{fat_manual:70}));
t(_carbCapNow()===0, 'so does a hand-set fat figure, which the cap would overwrite');
set(Object.assign(act('none'),{cal_manual:3000}));
t(_carbCapNow()>0, 'but a typed calorie TOTAL does not - the composition is still ours');
const typedT=_fuelTargets();
t(typedT.cal===3000, '  the total is theirs', String(typedT.cal));
t(typedT.carb<243, '  and the extra goes to fat, which is the whole argument',
  typedT.carb+'c '+typedT.fat+'f');
t(Math.abs(adds(typedT)-typedT.cal)<=9, '  and it still adds up', String(adds(typedT)));

console.log('\n  THE BAND PRINTED UNDER THE NUMBER:');
/* Both ends of the carb band come out of the FAT band - low fat leaves more
   carbs, high fat leaves fewer - so for a capped person the whole band sits
   above the cap: 215-276 under a number reading 150. */
set(act('none'));
const R=_fuelRanges(), T0=_fuelTargets();
t(R.cHi===150, 'the ceiling is the top of the band', String(R.cHi));
t(R.cLo<R.cHi, '  and it is still a band, not a point', R.cLo+'-'+R.cHi);
t(R.cLo>=50, '  with a floor a human could eat to', String(R.cLo));
/* Capping carbs pushes energy into fat, and fat's band is a percentage of
   calories that knows nothing about that - so the card was about to print 122g
   over a band reading 66-85. */
t(T0.fat>=R.fLo && T0.fat<=R.fHi, 'the fat band contains the fat number',
  T0.fat+' vs '+R.fLo+'-'+R.fHi);
t(T0.prot>=R.pLo && T0.prot<=R.pHi, 'the protein band contains the protein number',
  T0.prot+' vs '+R.pLo+'-'+R.pHi);
t(T0.carb>=R.cLo && T0.carb<=R.cHi, 'the carb band contains the carb number',
  T0.carb+' vs '+R.cLo+'-'+R.cHi);
/* Same gate as the target, so a hand-set plate keeps the full band it has
   always had rather than being squeezed by a rule that is not applying to it. */
set(Object.assign(act('none'),{carb_manual:260, fat_manual:70, pro_manual:170, cal_manual:2350}));
t(_fuelRanges().cHi>150, 'a hand-set plate keeps its full band', String(_fuelRanges().cHi));

console.log('\n  AND THE COPY THE TRAINER READS:');
/* _cwFuel reads the row stored the last time that client's app saved, and for
   somebody who has not touched a setting since the cap shipped that row still
   holds a pre-cap carb figure. Their own Food tab computes it live. Reading the
   row raw would have this card and their phone disagreeing about what they were
   told, which is the one thing the whole rule exists to avoid. */
t(_cwActive({intake_json:JSON.stringify({active:'weekly'})})==='weekly', '_cwActive reads their answer off the row');
t(_cwActive({intake_json:{active:'some'}})==='some', '  parsed or already an object');
t(_cwActive({})==='none' && _cwActive(null)==='none', '  and no answer is the safe end');
const stale=_cwFuel({cal_target:2380, protein_target:170, carb_target:268, fat_target:70,
                     intake_json:JSON.stringify({active:'none'})});
t(stale && stale.c===150, 'a pre-cap stored row is capped on the way out', JSON.stringify(stale));
t(stale && Math.abs(stale.p*4+stale.c*4+stale.f*9-stale.cal)<=9, '  and the card still adds up',
  stale?(stale.p*4+stale.c*4+stale.f*9)+' vs '+stale.cal:'');
const own=_cwFuel({cal_target:2350, carb_manual:260, fat_manual:70, pro_manual:170, cal_manual:2350,
                   intake_json:JSON.stringify({active:'none'})});
t(own && own.c===260, 'and a client who set their own carbs keeps them', JSON.stringify(own));

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (carbs follow the work, everywhere, and the plate adds up)');
process.exit(bad?1:0);
