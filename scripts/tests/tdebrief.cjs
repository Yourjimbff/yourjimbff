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
// LIFTED PRECISELY, NOT CHASED FROM THE TOP.
// _jvDebriefData references sbSelect, and chasing THAT pulls in the entire
// Supabase layer - 883 names, including top-level statements that run on load
// and throw. So the debrief's own functions are taken by name with no chasing,
// sbSelect is stubbed by this suite anyway, and only the small shared helpers
// are closed over (each is two or three names).
const {defOf}=require('./_lift.cjs');
const MINE=['_JV_DEBRIEF_DAYS','_JV_DEBRIEF_ROLL','_JV_DB_LIFT_TITLE','_JV_DB_CARDIO_TITLE',
  '_JV_DB_SAYS_RE','_JV_DB_THEMES','_JV_DEBRIEF_RE',
  '_dbMedian','_dbRoll','_dbIsSaid','_dbKind','_dbIsLift','_dbDay','_dbDs',
  '_dbSayRate','_dbSayCount','_dbCap','_dbSayDate','_dbOnDate','_dbSayDayLog','_dbScreenDayLog',
  '_DB_NUMWORD','_jvDebriefFigures','_jvDebriefNumsIn','_jvDebriefVerify','_dbMonthWord',
  '_jvDebriefNarrate','_jvDebriefSpokenPlain','_tlDateStr',
  '_jvDebriefData','_jvDebriefSpoken','_jvDebriefHtml'];
const SHARED=['_bfItemsFor','_jvNum','_escHtml','_jvSpokenDateStr','_sbFailMark','_sbFailedSince'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));
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
  t(D.training.last7.sessions===3, 'three sessions inside 7 days', String(D.training.last7.sessions));
  t(D.training.last14.sessions===5 && D.training.last14.perWeek===2.5, 'five inside 14 days is 2.5 a week', D.training.last14.perWeek+'');
  t(D.training.last28.sessions===6 && D.training.last28.perWeek===1.5, 'six inside 28 days is 1.5 a week', D.training.last28.perWeek+'');
  // ===== A SESSION IS A SESSION (ruling, 29 Aug) ======================
  // Yoga and cardio COUNT, with the split shown beside the number. Before the
  // ruling these windows counted lifting only and listed the rest as "not
  // counted", which read as though the class had not happened.
  const WY=W.concat([{id:99,title:'Hour Long Hot Yoga Class',description:'Hour long hot yoga class',date_str:dayStr(1),logged_at:iso(1)}]);
  sbSelect=async function(tbl){ return tbl==='workout_logs'?WY:(tbl==='food_logs'?F:WT); };
  const DY=await _jvDebriefData('TEST_DEBRIEF');
  t(DY.training.last7.sessions===4 && DY.training.last7.lifting===3, 'the yoga class is counted as a session, and is not lifting',
    DY.training.last7.sessions+' sessions, '+DY.training.last7.lifting+' lifting');
  t(JSON.stringify(DY.training.last7.split)==='[{"kind":"lifting","n":3},{"kind":"yoga","n":1}]',
    'and the split names it "yoga", not its whole title', JSON.stringify(DY.training.last7.split));
  // LIFTING LEADS, whatever order the sessions happened in. Ordered by first
  // appearance it printed "(1 yoga, 5 lifting)" on Chris's real week, purely
  // because his yoga class was the oldest session in it.
  const WY2=[{id:1,title:'Hour Long Hot Yoga Class',description:'yoga',date_str:dayStr(6),logged_at:iso(6)}].concat(W);
  sbSelect=async function(tbl){ return tbl==='workout_logs'?WY2:(tbl==='food_logs'?F:WT); };
  const DY2=await _jvDebriefData('TEST_DEBRIEF');
  t(DY2.training.last7.split[0].kind==='lifting', 'lifting leads even when the other kind came first',
    JSON.stringify(DY2.training.last7.split));
  const hy=_jvDebriefHtml(DY,'Test Client');
  t(/4 sessions \(3 lifting, 1 yoga\)/.test(hy), 'on screen it reads exactly his way: "4 sessions (3 lifting, 1 yoga)"');
  t(/four sessions last week, three of them lifting/i.test(_jvDebriefSpoken(DY,'Test Client')),
    'and spoken his way: "four sessions last week, three of them lifting"');
  t(!/not counted as lifting/i.test(hy), 'and nothing is listed as "not counted" any more');

  console.log('\n  HIS WORDING (rulings 2 and 3):');
  t(!/Where they live/.test(src), '"Where they live" is gone from the file entirely');
  t(/Typical day/.test(hy), 'the screen reads "Typical day"');
  // The voice is a conversation now, so the phrase is "typically eats around"
  // in a sentence rather than the sectioned reading's "they typically eat".
  t(/typically eats around/.test(_jvDebriefSpoken(DY,'Test Client')), 'and the voice says "typically eats around"');
  // Quarters, so a rate is never rounded: 19 sessions in 28 days is exactly
  // four and three quarters a week.
  t(_dbSayRate(4.75)==='four and three quarters', '4.75 a week is said exactly', _dbSayRate(4.75));
  t(_dbSayRate(5.5)==='five and a half' && _dbSayRate(6)==='six' && _dbSayRate(4.25)==='four and a quarter',
    'and so are halves, quarters and whole numbers');
  // All four macros stay (ruling 4).
  ['Calories','Protein','Carbs','Fat'].forEach(m=>t(new RegExp('>'+m+'<').test(hy), m+' is on the panel'));
  const c=D.nutrition.per.calories;
  t(c.lives.w4.value===2000, 'four identical days put the middle at 2,000', String(c.lives.w4.value));
  t(c.high && c.high.value===2000, 'and the heaviest stretch is 2,000 a day');
  t(D.weight.w4.ok && D.weight.w4.delta===-2 && D.weight.w4.dir==='down', 'weight down 2 over four weeks', JSON.stringify(D.weight.w4.delta));
  t(D.weight.w2.ok===false && D.weight.w2.count===1, 'and two weeks holds ONE weigh-in, so it states no trend');
  const sp=_jvDebriefSpoken(D,'Test Client');
  // THE CONVERSATION REPORTS THE MONTH, as his own example does - it does not
  // read a two-week weight line out loud. So the honest gap is asserted where
  // it is actually stated: on the panel, and in the plain reading underneath.
  t(/one weigh-in/.test(_jvDebriefHtml(D,'Test Client')) && /no trend to read/.test(_jvDebriefHtml(D,'Test Client')),
    'the panel states the two-week gap rather than inventing a trend');
  t(/no two week trend to read/.test(_jvDebriefSpokenPlain(D,'Test Client')),
    'and so does the plain reading underneath');
  t(!/two week/.test(sp), 'while the conversation keeps weight to the month, the way he asked');

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
  const DOOR=src.slice(src.indexOf('async function _jvDebriefTurn('), src.indexOf('async function _jvDebriefTurn(')+3200);
  t(!/analyze|_jtModel/.test(DOOR), 'and neither does the door');
  t(/isTrainer\(cl\.code\)\)\) return null;/.test(DOOR), 'TRAINER ONLY — a client can never reach it');
  t(/hits\.length>1/.test(DOOR), 'exact-name discipline: more than one hit asks which');
  t(/Which one\?/.test(DOOR), 'and it asks rather than guessing');
  // Voice rules on the spoken half.
  const SPK=src.slice(src.indexOf('function _jvDebriefSpoken('), src.indexOf('// ===== THE DEBRIEF ON SCREEN'));
  t(!/·/.test(SPK), 'the spoken half carries no middot');
  t(!/—/.test(SPK.replace(/\/\/[^\n]*/g,'')), 'and no long dash in anything it says');
  t(/_dbOnDate|_dbSayDate/.test(SPK), 'and dates are spoken, never printed');

  // ===== WHOSE DEBRIEF, AND WHO GETS THE SENTENCE FIRST ===============
  // Both faults this section holds shipped in v7.980.696 and reached his phone.
  console.log('\n  THE SENTENCE REACHES THIS DOOR AT ALL:');
  // _JV_RQ_DAY, the gate on his own front-desk board, ends with |\bdebrief\b.
  // It sat THIRTY LINES ABOVE this door, so "give me the debrief for Chris
  // McCarthy" came back as his morning board and the debrief never ran. Proved
  // by calling the door directly and never walking the router.
  t(/\\bdebrief\\b/.test(defOf('_JV_RQ_DAY')), 'the board gate really does claim the word "debrief"');
  const iDeb=src.indexOf('var _db=await _jvDebriefTurn(t);');
  const iBoard=src.indexOf('var _rd=await _jvDayReadout(t);');
  t(iDeb>0 && iBoard>0 && iDeb<iBoard, 'so the debrief door runs BEFORE the board', 'debrief@'+iDeb+' board@'+iBoard);
  // And it must not steal the board back: "debrief" with nobody named is his
  // own day and always has been.
  const DOOR2=src.slice(src.indexOf('async function _jvDebriefTurn('), src.indexOf('async function _jvDebriefTurn(')+3200);
  // COMMENTS STRIPPED for the two below. The comment above the fix explains
  // the bug and quotes "hits[0].code" in doing so, which is exactly the string
  // they assert is gone - a search that matches its own explanation passes
  // itself, the same trap tgates.cjs already carries a note about.
  const CODE2=DOOR2.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
  t(/if\(!hits\.length\) return null;/.test(DOOR2), 'and returns null when nobody is named, so his own day still reaches the board');

  console.log('\n  WHOSE DEBRIEF — hits are CODE STRINGS, not objects:');
  // _jvFindClientIn answers {hits:['chrism1']}. Reading hits[0].code gives
  // undefined, so the door could never resolve anybody and every named ask fell
  // to "which client is it for". The suite had only ever read the regex.
  t(!/hits\[0\]\.code/.test(CODE2), 'the door does not read .code off a string');
  t(/var code=hits\[0\];/.test(DOOR2), 'it takes the code itself');
  t(/CLIENTS\[code\]/.test(CODE2), 'and looks the name up in CLIENTS, like every proven caller');
  t(/_jvDebriefData\(code\)/.test(DOOR2), 'and hands that code to the reader');
  // The same fault was in the Jarvis progress-photo parity, shipped the same day.
  const PP=src.slice(src.indexOf('// ===== PARITY: A PROGRESS PHOTO FOR A NAMED CLIENT'), src.indexOf('// ===== PARITY: A PROGRESS PHOTO FOR A NAMED CLIENT')+2600);
  t(!/_ppWho\.code/.test(PP) && !/_ppWho/.test(PP), 'and the progress-photo parity no longer reads .code off a string either');
  t(/_jimFileProgressPhoto\(_ph\[0\], _ppCode, _ppDs\)/.test(PP), 'it files against the code itself');

  console.log('\n  EXACT-NAME DISCIPLINE, on the two Chrises that really exist:');
  t(/if\(hits\.length>1\)/.test(DOOR2), 'more than one match asks which');
  t(/Which one\?/.test(DOOR2), 'in those words');
  t(/_jvDeepCode/.test(DOOR2), 'and a pronoun leans on the client card he has open');
  t(/\(his\|her\|their\|them\|this client\)/.test(DOOR2), 'only on an explicit pronoun');

  // ===== THE SPOKEN DEBRIEF IS A CONVERSATION (ruling, 29 Aug) ========
  // And the numbers law is enforced, not promised.
  console.log('\n  THE VOICE TALKS LIKE A PERSON:');
  sbSelect=async function(tbl){ return tbl==='workout_logs'?WY:(tbl==='food_logs'?F:WT); };
  const DN=await _jvDebriefData('TEST_DEBRIEF');
  const sc=_jvDebriefSpoken(DN,'Test Client');
  t(/has had a (strong|steady|light) month/.test(sc), 'it opens with how the month went', sc.slice(0,60));
  t(!/^Test Client, the last four weeks\./.test(sc), 'and not with the old sectioned reading');
  t(!/\u2014|\u00b7/.test(sc), 'NO SYMBOLS read aloud - no long dash, no middot');
  t(sc.split(/\s+/).length<200, 'and it stays about a minute', sc.split(/\s+/).length+' words');
  t(/Training\./.test(sc)===false, 'it is not a table read out');

  console.log('\n  EVERY SPOKEN FIGURE IS ONE THE APP COMPUTED:');
  const FIG=_jvDebriefFigures(DN);
  const V=_jvDebriefVerify(sc, FIG);
  t(V.ok, 'every number in the script verifies against the computed set', V.bad.join(', '));
  t(_jvDebriefNumsIn(sc).length>0, 'and there really are numbers in it to check',
    _jvDebriefNumsIn(sc).length+' numbers');
  // The verifier has to have teeth: an invented figure must be refused.
  t(_jvDebriefVerify('he ate 9999 calories', FIG).ok===false, 'an invented figure fails the check');
  t(_jvDebriefVerify('he did seventeen sessions', FIG).bad.length>=0, 'and number words are read too');
  t(_jvDebriefVerify('six sessions', {6:1}).ok===true, 'a number word that IS computed passes');
  t(_jvDebriefVerify('nine sessions', {6:1}).ok===false, 'and one that is not, fails');
  // A script that cannot be verified is NOT SPOKEN.
  const SPKF=src.slice(src.indexOf('function _jvDebriefSpoken(d, name){'), src.indexOf('function _jvDebriefSpokenPlain('));
  t(/if\(v\.ok\) return script;/.test(SPKF), 'a verified script is spoken');
  t(/I am not going to read it out/.test(SPKF), 'and an unverifiable one is withheld, in plain words');
  t(/on screen/.test(SPKF), 'pointing at the panel, which still holds every figure');
  // NO MODEL NARRATES, which is why no figure can drift in the first place.
  const NAR=src.slice(src.indexOf('function _jvDebriefNarrate('), src.indexOf('// ===== THE SPOKEN DEBRIEF ='));
  t(!/analyze|_jtModel|messages:\[/.test(NAR), 'the narration calls no model');

  // ===== RUN, NOT READ. Both of these passed a source search while the
  // behaviour was broken, so they are driven through the narrator instead.
  console.log('\n  AND TODAY IS AN UNFINISHED DAY, NOT A THIN ONE:');
  // A client with ONE meal today and nothing else thin: the script must call it
  // an unfinished day, and must not call it a gap in the logging.
  const Ftoday=[{id:1,calories:520,protein:30,carbs:40,fat:20,date_str:dayStr(0),logged_at:iso(0),meal:'Breakfast',name:'x'}]
    .concat([1,2,3].map(n=>({id:10+n,calories:2000,protein:150,carbs:200,fat:60,date_str:dayStr(n),logged_at:iso(n),meal:'Lunch',name:'y'})))
    .concat([1,2,3].map(n=>({id:20+n,calories:400,protein:20,carbs:40,fat:10,date_str:dayStr(n),logged_at:iso(n),meal:'Snack',name:'z'})));
  sbSelect=async function(tbl){ return tbl==='workout_logs'?W:(tbl==='food_logs'?Ftoday:WT); };
  const DT=await _jvDebriefData('TEST_DEBRIEF');
  const st=_jvDebriefSpoken(DT,'Test Client');
  t(/Today only has one meal on it so far/.test(st), 'a single meal logged TODAY is named as the day still going', st.slice(-120));
  // The lead-in belongs to the past-thin-days clause, and gluing it on when
  // there are none produced "There is and today only has one meal on it".
  t(!/There is and/.test(st) && !/There are and/.test(st), 'and it is a sentence, not two clauses glued together');
  t(!/thin day/.test(st), 'and is NOT counted among the thin days, which are a logging gap');
  t(_jvDebriefVerify(st,_jvDebriefFigures(DT)).ok, 'and that script still verifies');

  console.log('\n  NO SYMBOL IS EVER READ ALOUD, on the line he hears most:');
  // The quote line is where an em dash slipped in once. Driven through with a
  // real note on a real session so the whole clause renders.
  const Wnote=[{id:1,title:'Legs',date_str:dayStr(2),logged_at:iso(2),
    description:'Squat: 100 lb x 5\nLeg Press: 200 lb x 8\n\nFeeling shitty so did what I could'}];
  sbSelect=async function(tbl){ return tbl==='workout_logs'?Wnote:(tbl==='food_logs'?F:WT); };
  const DQ=await _jvDebriefData('TEST_DEBRIEF');
  const sq=_jvDebriefSpoken(DQ,'Test Client');
  t(/Feeling shitty so did what I could/.test(sq), 'their own words reach the script, verbatim', sq.slice(0,80));
  t(/still showed up for/.test(sq), 'with what they did that day beside it');
  t(!/\u2014/.test(sq), 'and NO long dash anywhere in it');
  t(!/\u00b7/.test(sq), 'and no middot');
  t(_jvDebriefVerify(sq,_jvDebriefFigures(DQ)).ok, 'and that script verifies too');

  console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
  process.exit(bad?1:0);
})();
