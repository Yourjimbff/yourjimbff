// THE CHECK-IN DEBRIEF (Yusuf, order, 29 Aug).
//
// THE LAW THIS SUITE EXISTS FOR: every number is computed by the app before any
// model speaks. So the arithmetic is exercised directly, on a fixture whose
// answers can be worked out by hand, and the door is checked to be sure no
// model sits between the rows and the figure.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={addEventListener:()=>{},matchMedia:()=>({matches:false}),_sbFailN:0};
global.document={addEventListener:()=>{},removeEventListener:()=>{},getElementById:()=>null,
  querySelectorAll:()=>[],querySelector:()=>null,
  createElement:()=>({style:{},classList:{add(){},remove(){}},appendChild(){}}),
  body:{classList:{contains:()=>false,add(){},remove(){},toggle:()=>{}},style:{},appendChild(){}},hidden:false};
global.localStorage={getItem:()=>null,setItem:()=>{}};
const CL=closure(['_sbFailMark','_sbFailedSince','_jvDebriefData','_jvDebriefSpoken','_jvDebriefHtml',
                  '_dbMedian','_dbRoll','_dbIsSaid','_bfItemsFor','_jvNum','_jvSpokenDateStr','_escHtml','_JV_DEBRIEF_RE']);
eval(CL.code);
guard(['_jvDebriefData','_jvDebriefSpoken','_jvDebriefHtml','_dbMedian','_dbRoll','_dbIsSaid','_JV_DEBRIEF_RE'], n=>eval(n));
t(_bfItemsFor({description:'Squat: 100 lb x 5'}).items.length===1, 'smoke: the exercise parser answers');

console.log('\n  THE MIDDLE, NOT THE AVERAGE — one freak day may not move it:');
t(_dbMedian([1,2,3])===2, 'odd count');
t(_dbMedian([1,2,3,4])===2.5, 'even count');
t(_dbMedian([])===null, 'nothing to average is null, never zero');
// The whole reason his ruling asks for a middle: a party day.
t(_dbMedian([1500,1550,1600,9000])===1575, 'a 9,000 calorie day does not move it', String(_dbMedian([1500,1550,1600,9000])));

console.log('\n  A STRETCH IS DAYS IN A ROW, or it is not a stretch:');
const mk=(ds,cal,meals)=>({ds:ds, d:new Date(ds), calories:cal, meals:(meals==null?3:meals)});
const run=[mk('Aug 1, 2026',1000),mk('Aug 2, 2026',1000),mk('Aug 3, 2026',1000),mk('Aug 4, 2026',1000)];
t(_dbRoll(run,'calories',4).length===1, 'four days in a row is one stretch');
const gap=[mk('Aug 1, 2026',1000),mk('Aug 2, 2026',1000),mk('Aug 4, 2026',1000),mk('Aug 5, 2026',1000)];
t(_dbRoll(gap,'calories',4).length===0, 'and a day missing in the middle is NOT a stretch');
// The exact fault caught on Chris's rows: a window that stepped over the 12th
// printed "Aug 10 to Aug 14" for a four-day stretch, and averaged in a day with
// a single meal on it.
t(_dbRoll(gap,'calories',4).every(r=>r.from!=='Aug 1, 2026'), 'so no stretch can print dates it did not cover');
const thin=[mk('Aug 1, 2026',1000,3),mk('Aug 2, 2026',1000,3),mk('Aug 3, 2026',280,1),mk('Aug 4, 2026',1000,3)];
t(_dbRoll(thin,'calories',4)[0].minMeals===1, 'and a stretch carries the thinnest day in it, so it can be flagged');

console.log('\n  A LINE HE WROTE vs A MOVEMENT HE DID:');
[['Feeling shitty so did what I could',true],
 ['Lowered squat weight to work on form and go deeper',true],
 ['Switched from low row machine to rear delt row',true],
 ['Hanging leg raises',false],
 ['Cross-body sit-ups',false],
 ['Forearm barbell curls',false],
 ['Rear delt fly on machine',false],
 ['Cycling · 30 min',false]
].forEach(([s,want])=>t(_dbIsSaid(s)===want, JSON.stringify(s)+' -> '+(want?'his words':'a movement')));

console.log('\n  THE ARITHMETIC, ON A FIXTURE WITH KNOWN ANSWERS:');
// Windows are counted back from TODAY, so the fixture is built from today.
const dayStr=n=>{ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-n); return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); };
const iso=n=>{ const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-n); return d.toISOString(); };
const W=[0,2,4,8,10,20].map(n=>({id:n,title:'Push',description:'Bench: 100 lb x 5',date_str:dayStr(n),logged_at:iso(n)}));
const F=[0,1,2,3].map(n=>({id:n,calories:2000,protein:150,carbs:200,fat:60,date_str:dayStr(n),logged_at:iso(n),meal:'Lunch',name:'x'}));
const WT=[{id:1,weight:180,logged_at:iso(20)},{id:2,weight:178,logged_at:iso(1)}];
sbSelect=async function(tbl){ return tbl==='workout_logs'?W:(tbl==='food_logs'?F:WT); };
let D=null;
(async()=>{
  D=await _jvDebriefData('TEST_DEBRIEF');
  t(D.training.last7.sessions===3, 'three lifting sessions inside 7 days', String(D.training.last7.sessions));
  t(D.training.last14.sessions===5 && D.training.last14.perWeek===2.5, 'five inside 14 days is 2.5 a week', D.training.last14.perWeek+'');
  t(D.training.last28.sessions===6 && D.training.last28.perWeek===1.5, 'six inside 28 days is 1.5 a week', D.training.last28.perWeek+'');
  const c=D.nutrition.per.calories;
  t(c.lives.w4.value===2000, 'four identical days put the middle at 2,000', String(c.lives.w4.value));
  t(c.high && c.high.value===2000, 'and the heaviest stretch is 2,000 a day');
  t(D.weight.w4.ok && D.weight.w4.delta===-2 && D.weight.w4.dir==='down', 'weight down 2 over four weeks', JSON.stringify(D.weight.w4.delta));
  t(D.weight.w2.ok===false && D.weight.w2.count===1, 'and two weeks holds ONE weigh-in, so it states no trend');
  const sp=_jvDebriefSpoken(D,'Test Client');
  t(/no two week trend to read/.test(sp), 'the spoken line says so rather than inventing one');

  console.log('\n  A FAILED READ IS NOT AN EMPTY MONTH:');
  // sbSelect returns [] when it fails (CLAUDE.md landmine). Without the witness
  // this produced a complete, confident debrief saying a real client had
  // trained nothing, eaten nothing and never weighed in. Every word false.
  sbSelect=async function(){ window._sbFailN=(window._sbFailN||0)+1; return []; };
  const bad2=await _jvDebriefData('TEST_DEBRIEF');
  t(bad2.failed.workouts && bad2.failed.food && bad2.failed.weight, 'every failed read is recorded as failed');
  const bsp=_jvDebriefSpoken(bad2,'Test Client'), bh=_jvDebriefHtml(bad2,'Test Client');
  t(/did not read just now/.test(bsp), 'the spoken debrief says the read failed');
  t(!/No weigh-ins in this period/.test(bsp) && !/Nothing logged to eat/.test(bsp),
    'and never states a gap it cannot know about');
  t((bh.match(/dbrfFail/g)||[]).length===4, 'every section on screen says it too', String((bh.match(/dbrfFail/g)||[]).length));

  console.log('\n  NO MODEL DOES THE ARITHMETIC:');
  const DATA=src.slice(src.indexOf('async function _jvDebriefData('), src.indexOf('// ===== THE SPOKEN DEBRIEF'));
  t(DATA.length>2000, 'the computing half is findable');
  t(!/analyze|_jtModel|messages:\[/.test(DATA), 'it calls no model at all');
  const DOOR=src.slice(src.indexOf('async function _jvDebriefTurn('), src.indexOf('async function _jvDebriefTurn(')+1800);
  t(!/analyze|_jtModel/.test(DOOR), 'and neither does the door');
  t(/isTrainer\(cl\.code\)\)\) return null;/.test(DOOR), 'TRAINER ONLY — a client can never reach it');
  t(/f\.hits\.length===1/.test(DOOR), 'exact-name discipline: one hit, or it asks');
  t(/Which client is the debrief for\?/.test(DOOR), 'and it asks rather than guessing');
  // Voice rules on the spoken half.
  const SPK=src.slice(src.indexOf('function _jvDebriefSpoken('), src.indexOf('// ===== THE DEBRIEF ON SCREEN'));
  t(!/·/.test(SPK), 'the spoken half carries no middot');
  t(!/—/.test(SPK.replace(/\/\/[^\n]*/g,'')), 'and no long dash in anything it says');
  t(/_dbOnDate|_dbSayDate/.test(SPK), 'and dates are spoken, never printed');

  console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
  process.exit(bad?1:0);
})();
