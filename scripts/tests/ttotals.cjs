// DAY TOTALS AND DAY ORDER (Yusuf, ruling, 29 Aug).
// Two things, both proved against the shape of REAL days rather than invented
// ones — Chris McCarthy's Aug 28 and Ben Plimpton's Aug 29, read off live:
//   · ONE TALLY. The card's totals line and Share day's summary must never
//     disagree, so neither adds its own day up; both read _dayFoodTotals.
//   · MORNING TO NIGHT BY EAT TIME. Both men write the whole day up in one
//     sitting, so logged_at is clustered in the evening and says nothing about
//     when anything happened. Chris ate breakfast at 9:14 and logged it at
//     20:52, after a workout logged at 19:53. Sorting on the log stamp put the
//     workout before the breakfast — which is the card he reported.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function lift(name){
  const s=L.findIndex(l=>l.startsWith('function '+name+'(')||l.startsWith('async function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name+' not found');
  let d=0,st=false;
  for(let i=s;i<L.length;i++){ for(const c of L[i]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return L.slice(s,i+1).join('\n'); }
  throw new Error('SEAM MOVED: no close found for '+name);
}
let liftChecks=true;
try{ lift('_pfNothingLikeThis'); liftChecks=false; }catch(e){ liftChecks=/SEAM MOVED/.test(e.message); }

const src=[
  lift('_jvNum'), lift('_feedHasTz'), lift('_feedTs'), lift('_foodMins'),
  lift('_mealMins'), lift('_dayFoodTotals'), lift('_mealMacLine'),
  lift('_pfWhenMins'), lift('_pfTotalsHtml'),
  'module.exports={_dayFoodTotals,_mealMacLine,_pfWhenMins,_pfTotalsHtml,_mealMins,_feedTs};'
].join('\n');
const m={exports:{}};
new Function('module','exports',src)(m,m.exports);
const O=m.exports;

// Chris McCarthy, Aug 28 2026, exactly as the rows read on live.
// BUILT THE WAY THE FEED BUILDS ITEMS: every item carries ts=_feedTs(row). The
// first version of this fixture left ts off, so every non-food item fell to the
// 99999 tail and the ordering assertions passed for the wrong reason — a fixture
// that does not match the real object proves nothing about the real path.
const item=(kind,data)=>({kind:kind, data:data, ts:O._feedTs(data)});
const food=(meal,eat,logged,cal,p,c,f)=>item('food',{meal:meal,eat_time:eat,
  logged_at:logged,calories:cal,protein:p,carbs:c,fat:f,name:meal});
const D='2026-08-28T', N='2026-08-29T';
const CHRIS=[
  food('Breakfast','9:14 AM',D+'14:14:08+00:00',430,32,44,12),
  food('Lunch','1:40 PM',    D+'18:40:55+00:00',560,44,52,14),
  item('wo',{title:'Pull', logged_at:D+'19:53:00+00:00'}),
  food('Breakfast','9:14am', D+'20:52:46+00:00',180,12,26,4),
  food('Dinner','7:20 PM',   N+'00:20:10+00:00',620,36,64,12),
  food('Lunch','1:40pm',     N+'01:56:42+00:00',250,20,46,6),
];
const order=a=>a.slice().sort((x,y)=>{ const d=O._pfWhenMins(x)-O._pfWhenMins(y); return d||((x.ts||0)-(y.ts||0)); })
  .map(it=>it.kind==='food'?it.data.meal:it.data.title);

const C=[]; const t=(n,f)=>{ let ok=false,err=null; try{ ok=!!f(); }catch(e){ err=e.message; } C.push([n,ok,err]); };

t('the lift really looks (fake name reports missing)', ()=>liftChecks);

// ---- ONE TALLY -------------------------------------------------------------
const T=O._dayFoodTotals(CHRIS);
t('food only — the workout contributes nothing', ()=>T.meals===5);
t('calories add up', ()=>T.cal===430+560+180+620+250);
t('protein adds up',  ()=>T.protein===32+44+12+36+20);
t('carbs add up',     ()=>T.carbs===44+52+26+64+46);
t('fat adds up',      ()=>T.fat===12+14+4+12+6);
t('a meal missing a macro contributes what it HAS', ()=>{
  const x=O._dayFoodTotals([food('Lunch','1 PM','12:00:00',400,30,null,undefined)]);
  return x.cal===400 && x.protein===30 && x.carbs===0 && x.fat===0 && x.meals===1; });
t('a day with no food at all totals nothing', ()=>{
  const x=O._dayFoodTotals([{kind:'wo',data:{title:'Pull'}}]);
  return x.meals===0 && x.cal===0; });

// ---- THE LINE --------------------------------------------------------------
const line=O._pfTotalsHtml(CHRIS);
t('the line is in the ordered shape', ()=>/>2,040 cal · 144g P · 232g C · 48g F</.test(line));
t('four figures are grouped, as he wrote it', ()=>/2,040/.test(line));
t('a workout-only day grows NO line at all', ()=>O._pfTotalsHtml([{kind:'wo',data:{title:'Pull'}}])==='');
t('a day of meals with no macros recorded grows no line',
  ()=>O._pfTotalsHtml([food('Lunch','1 PM','12:00:00',0,0,0,0)])==='');
// The card must not print a second tally in a different dialect from the rows.
t('the totals line uses the meal rows own builder', ()=>{
  const one=O._mealMacLine({calories:2040,protein:144,carbs:232,fat:48},'short',{time:false,group:true});
  return line.indexOf(one)>=0; });
t('and a MEAL row keeps its ungrouped number', ()=>
  O._mealMacLine({calories:2040,protein:10,carbs:0,fat:0},'short',{time:false})==='2040 cal · 10g P');

// ---- MORNING TO NIGHT ------------------------------------------------------
t('eat time wins over the log stamp', ()=>O._pfWhenMins(CHRIS[0])===9*60+14);
t('a lowercase "9:14am" reads the same as "9:14 AM"', ()=>O._pfWhenMins(CHRIS[3])===9*60+14);
t('a workout has only its log time, and uses it', ()=>O._pfWhenMins(CHRIS[2])===19*60+53);
t('a meal with no eat time falls back to its log time',
  ()=>O._pfWhenMins(food('Lunch',null,D+'13:05:00+00:00',1,1,1,1))===13*60+5);
t('nothing answerable sorts to the END of the day, never the top',
  ()=>O._pfWhenMins({kind:'wo',data:{}})===99999);
// The card he actually reported.
// Dinner was EATEN at 19:20; the workout was LOGGED at 19:53 and has no clock of
// its own. So dinner comes first — my first expectation had these the wrong way
// round and the fixture bug was hiding it.
t('CHRIS AUG 28 reads morning to night', ()=>
  order(CHRIS).join(' > ')==='Breakfast > Breakfast > Lunch > Lunch > Dinner > Pull');
t('...and NOT the log order he was shown', ()=>
  order(CHRIS).join(' > ')!=='Breakfast > Lunch > Pull > Breakfast > Dinner > Lunch');
// Ben Plimpton, Aug 29: logged 18:31-18:33, eaten across the day.
const B='2026-08-29T';
const BEN=[
  food('Breakfast','9:00 AM', B+'18:31:05+00:00',420,28,48,18),
  food('Snack','3:30 PM',     B+'18:31:35+00:00',150,20,8,2),
  food('Lunch','12:32 PM',    B+'18:32:57+00:00',350,35,35,8),
  food('Lunch','12:33 PM',    B+'18:33:48+00:00',350,35,28,8),
];
t('BEN AUG 29 reads morning to night', ()=>
  order(BEN).join(' > ')==='Breakfast > Lunch > Lunch > Snack');
t('...where the log order would have read Breakfast, Snack, Lunch, Lunch', ()=>
  BEN.map(x=>x.data.meal).join(' > ')==='Breakfast > Snack > Lunch > Lunch');
t('BEN AUG 29 totals', ()=>{ const b=O._dayFoodTotals(BEN);
  return b.cal===1270 && b.protein===118 && b.carbs===119 && b.fat===36 && b.meals===4; });

let bad=0;
C.forEach(([n,ok,err])=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+n+(err?'  ['+err+']':'')); });
if(bad) console.log('\n  chris order: '+order(CHRIS).join(' > ')+'\n  line: '+line);
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
