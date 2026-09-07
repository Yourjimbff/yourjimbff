// EXERCISE HISTORY (Yusuf, order, 7 Sep): "I love the idea of tracking progress
// on an exercise. That's an absolute must-have feature."
//
// Two sources, because the app has two: set_logs (the session logger, one row a
// set) and workout_logs.description lines (Jim, "Barbell Row: 45 lb x 8, ...").
// Chris has 457 set_logs rows; LeAndra has none and all her sets are in lines.
// A history that read one source would tell half the roster they never trained.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
global._parseDs=(ds)=>{ const d=new Date(ds); return isNaN(d)?null:d; };
const MINE=['_exhKey','_exhParseLine','_exhSessions','_exhFelt','_exhSetsLabel','_exhShortDate','_exhHtml'];
const CL=closure(MINE); eval(CL.code||''); guard(MINE, n=>eval(n));
const src=fs.readFileSync('index.html','utf8');

console.log('\n  READING A JIM LINE:');
let p=_exhParseLine('Pull Downs / Pull Ups: 70 lb × 8, 90 lb × 8, 130 lb × 8, 150 lb × 8');
t(p && p.name==='Pull Downs / Pull Ups' && p.sets.length===4 && p.sets[3].wt===150 && p.sets[3].reps===8, 'name, four sets, weight and reps off the line');
p=_exhParseLine('Chest Press · machine: 140 lb × 8, 90 lb × 9');
t(p && p.name==='Chest Press' && p.sets[0].wt===140, 'the " · machine" variant is dropped from the name so it matches the plan');
t(_exhParseLine('4.97 km, 32:50 activity time')===null, 'a run line is not an exercise');
t(_exhParseLine('Lateral Raises:')===null, 'a line with no sets is nothing');
p=_exhParseLine('Squat: 135 lb x 8, 135 lb x 8');
t(p && p.sets.length===2 && p.sets[0].reps===8, 'a plain x works as well as the multiplication sign');

console.log('\n  TWO SOURCES, ONE STORY:');
const setRows=[
  {exercise:'Leg Press', weight:'275', reps:'8', date_str:'Aug 17, 2026', logged_at:'2026-08-17T20:00:00Z'},
  {exercise:'Leg Press', weight:'275', reps:'8', date_str:'Aug 17, 2026', logged_at:'2026-08-17T20:01:00Z'},
  {exercise:'leg press', weight:'295', reps:null, date_str:'Aug 24, 2026', logged_at:'2026-08-24T20:00:00Z'},
  {exercise:'Squat',     weight:'135', reps:'8', date_str:'Aug 24, 2026', logged_at:'2026-08-24T20:10:00Z'},
];
const woRows=[
  {date_str:'Sep 3, 2026', logged_at:'2026-09-03T20:00:00Z', description:'Leg Press: 305 lb × 8, 305 lb × 8, 305 lb × 8, 305 lb × 8\nSquat: 135 lb × 8'},
  {date_str:'Aug 24, 2026', logged_at:'2026-08-24T21:00:00Z', description:'Leg Press: 100 lb × 8'},   /* same day as set_logs -> ignored */
];
const S=_exhSessions('Leg Press', setRows, woRows);
t(S.length===3, 'three sessions: two from set_logs, one from a Jim line', String(S.length));
t(S[0].ds==='Aug 17, 2026' && S[2].ds==='Sep 3, 2026', 'oldest first');
t(S[1].top.wt===295, 'a day with both sources takes set_logs and ignores the line - never double counts');
t(S[2].top.wt===305 && S[2].sets.length===4, 'the Jim day has its four sets');
t(S[0].top.reps===8, 'the top set carries its reps');
t(_exhSessions('Squat', setRows, woRows).length===2, 'and a different movement gets only its own rows');
t(_exhSessions('Hack Squat', setRows, woRows).length===0, 'a movement never logged has no sessions - never a made-up one');
// Found on the trainer's own Cable Bicep Curls: six rows, weight null, reps 10.
const repsOnly=[{exercise:'Cable Bicep Curls', weight:null, reps:'10', date_str:'Aug 8, 2026', logged_at:'2026-08-08T22:26:00Z'},
                {exercise:'Cable Bicep Curls', weight:null, reps:'10', date_str:'Aug 8, 2026', logged_at:'2026-08-08T22:27:00Z'}];
const RO=_exhSessions('Cable Bicep Curls', repsOnly, []);
t(RO.length===1 && RO[0].sets.length===2 && RO[0].top===null, 'a set with reps and no weight is still a session - it just has no top set');
const roH=_exhHtml('Cable Bicep Curls', RO, {felt:0,rated:0}, '');
t(/1 session logged, no weight on any of them yet/.test(roH) && !/Nothing logged/.test(roH), 'and the sheet says THAT, not "nothing logged"');
t(!/exhBest/.test(roH) && !/<polyline/.test(roH), 'no best and no line without a weight - never a made-up number');
t(/exhRowW">—</.test(roH), 'the session row shows a dash where the weight would be');

console.log('\n  FELT IT, FROM THE CONNECTION CHECK-INS THAT ALREADY EXIST:');
const mi=[
  {ratings:{Back:{r:'partial',by:{'Pull Downs / Pull Ups':'partial','Barbell Row':'felt'}}}},
  {ratings:{Back:{r:'felt',by:{'Pull Downs / Pull Ups':'felt'}}}},
  {ratings:{Legs:{r:'felt',by:{'Squat':'felt'}}}},
];
const f=_exhFelt('pull downs / pull ups', mi);
t(f.felt===1 && f.rated===2, 'felt 1 of 2 - counts only the check-ins that rated THIS movement', JSON.stringify(f));
t(_exhFelt('Leg Press', mi).rated===0, 'never rated reads as zero of zero, not as zero felt');

console.log('\n  THE SHEET:');
const h=_exhHtml('Leg Press', S, {felt:6,rated:8}, 'Wednesday and Sunday');
t(/exhBest">305<u> lb × 8<\/u>/.test(h), 'best is the heaviest set with its reps');
t(/up 30 in \d+ weeks?/.test(h), 'the delta names the span in weeks so it cannot read as one week of work');
t(/<polyline points=/.test(h), 'the gold line');
t(/exhCellV">3<\/div>/.test(h), 'sessions counted');
t(/6 <i>of 8<\/i>/.test(h), 'felt it, as a fraction');
t(/exhRowD">Sep 3</.test(h) && h.indexOf('Sep 3')<h.indexOf('Aug 24'), 'the last five, newest first');
t(/4×8/.test(h), 'sets × reps for a session');
const none=_exhHtml('Hack Squat', [], {felt:0,rated:0}, '');
t(/Nothing logged on this one yet/.test(none) && !/exhBest/.test(none), 'a movement with no sessions says so, and shows no number');
const zero=_exhHtml('Leg Press', S, {felt:0,rated:0}, '');
t(/not rated yet/.test(zero), 'and an unrated one says not rated, never 0 of 0');

console.log('\n  WIRED, READ-ONLY:');
t(/class="pgExName exh" data-exh=/.test(src), 'every exercise name on the program page is a door');
t(/id="mExHist"/.test(src) && /id="exhBody"/.test(src), 'the sheet exists');
const fn=src.slice(src.indexOf('async function exHistOpen('), src.indexOf('function _pgLastWeight('));
t(!/sbInsert|sbUpsert|sbWrite|method:\s*'POST'|PATCH/.test(fn), 'exHistOpen never writes - it is a page you read');
t(/set_logs/.test(fn) && /workout_logs/.test(fn) && /mi_checkins/.test(fn), 'it reads all three tables');
t(/kind=eq\.connection/.test(fn), 'and only connection check-ins, not strength checks');
const holes=CL.unresolved.filter(function(n){
  const stripped=src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'').split('window.'+n).join('window.__WINPROP__');
  return new RegExp('(^|[^.A-Za-z0-9_$])'+n+'(?![A-Za-z0-9_$])').test(stripped);
});
t(holes.length===0, 'the lifted closure has no holes', holes.join(','));

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all exercise-history assertions pass');
process.exit(0);
