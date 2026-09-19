/* JIM REMEMBERS WHAT HE SAID, AND LOOKS THROUGH A DIFFERENT LENS (Yusuf, 18 Sep).

   "If the user can predict what Jim says, we have done a terrible job."
   "It should be, like, within eighty uses."
   "It's been three days since the hash browns, and we call it out in the
    food log. Dude, that's invaluable coaching."
   "Understanding is first, second is the feedback and advice, and then the
    third is the unique tailoring to them."

   MEASURED BEFORE THIS WAS BUILT: "solid" was banned in the prompt twice and
   stayed in 59% of reads. Filtered at the door, it died at 2pm on the 18th.
   By 9pm that night 6 of the next 11 reads shared "carrying this meal" /
   "lands clean for a fat loss day" / "textbook". A rule cannot stop
   repetition and a word filter only moves it.

   These are the four parts and the two real reads that proved the need. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntjimmemory - the ledger, the lens, the recall, and the gate');

const lifted=closure(['_jimVoicePhrases','_jimLedger','_jimLedgerAdd','_jimLedgerSeed','_jimRepeatHits',
  '_jimRepeatCount','_jimSaidBlock','_jimAngles','_jimAngleNext','_jimLensBlock','_jimRecallLines',
  '_jimRecallBlock','_jimPersonBlock']);
/* window properties (_jimLedgers, _jimRecent, _jimLastRepeat, _mealSlot) and
   JSON are runtime, not file-level declarations, so the lifter reports them. */
const holes=lifted.unresolved.filter(n=>['JSON','_jimLedgers','_jimRecent','_jimLastRepeat','_mealSlot'].indexOf(n)<0);
ok(holes.length===0, 'it all lifts with nothing missing', holes);

/* A browser in a box: window, a localStorage that remembers, and todayFood. */
function box(){
  const store={};
  const ls={getItem:k=>(k in store)?store[k]:null, setItem:(k,v)=>{ store[k]=String(v); }, removeItem:k=>{ delete store[k]; }};
  const F=new Function('var window={}; var localStorage=arguments[0]; var todayFood=arguments[1]; var console={warn:function(){}};'
    +lifted.code
    +'\nreturn {window:window, _jimVoicePhrases:_jimVoicePhrases,_jimLedger:_jimLedger,_jimLedgerAdd:_jimLedgerAdd,_jimLedgerSeed:_jimLedgerSeed,'
    +'_jimRepeatHits:_jimRepeatHits,_jimSaidBlock:_jimSaidBlock,_jimAngles:_jimAngles,_jimAngleNext:_jimAngleNext,'
    +'_jimLensBlock:_jimLensBlock,_jimRecallLines:_jimRecallLines,_jimRecallBlock:_jimRecallBlock,_jimPersonBlock:_jimPersonBlock,'
    +'setToday:function(t){ todayFood=t; }, store:localStorage};');
  return F(ls, []);
}

// ======================================================= THE VOICE, NOT THE FOOD
const READ1='Salmon and asparagus at dinner is a textbook fat loss plate. 250 calories, 27g protein, 14g fat, 4g carbs. The protein is carrying this meal and the fat is coming from the fish itself, which is exactly where you want it. This is the move.';
const READ2='Dinner is honest. Chicken breast, rice, red beans, vegetables and Greek yogurt land clean for a fat loss day. 58g of protein is carrying this meal and the carbs sit at 37g, which reads textbook.';
const READ3='Hashbrowns and sausage with cafe con leche is 510 calories, 20g protein, 31g carbs, 34g fat. The hashbrowns are refined starch fried in oil doing nothing for you here, just carbs and fat with no protein. Swap those hashbrowns for eggs and you have a breakfast.';
{
  const B=box();
  const p1=B._jimVoicePhrases(READ1, {name:'Salmon & Asparagus'});
  ok(p1.indexOf('carrying this meal')>-1, 'the phrase he can screenshot is a phrase', p1);
  ok(!p1.some(x=>/salmon|asparagus/.test(x)), 'the foods they ate are not voice - people eat the same fish twice');
  ok(!p1.some(x=>/\d/.test(x)), 'and numbers are not voice either');
  ok(!p1.some(x=>/protein|fat|carb/.test(x)), 'nor are the words that name the job - protein, fat, carbs');
  const p3=B._jimVoicePhrases(READ3, {name:'Hashbrowns, sausage & cafe con leche', items:[{n:'hashbrowns'},{n:'sausage'}]});
  ok(!p3.some(x=>/hashbrown|sausage/.test(x)), 'items on the row are food words too', p3);
  ok(p3.some(x=>/doing nothing/.test(x)), 'and the coaching phrase survives', p3);
}

// ================================================================ THE LEDGER
{
  const B=box();
  B._jimLedgerAdd('abc1', READ1, {name:'Salmon'});
  B._jimLedgerAdd('abc1', READ1, {name:'Salmon'});
  ok(B._jimLedger('abc1').reads.length===1, 'the same read through the door twice spends one slot, not two');
  const hits=B._jimRepeatHits('abc1', READ2, {name:'Chicken, rice, beans'});
  ok(hits.indexOf('carrying this meal')>-1, 'the second read repeats the first, and the ledger says which phrase', hits);
  ok(B._jimRepeatHits('abc1', READ3, {name:'Hashbrowns'}).length===0, 'a read in a different voice repeats nothing', B._jimRepeatHits('abc1', READ3, {name:'Hashbrowns'}));
  ok(B._jimRepeatHits('zzz9', READ2, {}).length===0, 'and another client has their own ledger - nothing crosses');
  /* THE EIGHTY. His number. */
  for(let i=0;i<100;i++) B._jimLedgerAdd('cap1', 'Unique sentence number '+i+' with some words nobody else uses '+i+' today ok fine right.', {});
  ok(B._jimLedger('cap1').reads.length===80, 'the window is eighty reads, exactly', B._jimLedger('cap1').reads.length);
  /* It survives a reload: the box's localStorage is the memory. */
  const raw=JSON.parse(B.store.getItem('jim_said_abc1'));
  ok(raw && raw.reads && raw.reads.length===1, 'and it is written down, so a reload does not forget');
  const blk=B._jimSaidBlock('abc1');
  ok(/NOT AGAIN/.test(blk) && /carrying this meal/.test(blk), 'the ban list names the phrase to the model', blk.slice(0,120));
}

// ================================================================== THE SEED
{
  const B=box();
  const rows=[{insight:READ1, name:'Salmon', logged_at:'2026-09-18T20:00:00Z'},
              {insight:'',    name:'Eggs',   logged_at:'2026-09-18T19:00:00Z'},
              {insight:READ3, name:'Hashbrowns', logged_at:'2026-09-18T08:00:00Z'}];
  B._jimLedgerSeed('seed1', rows);
  ok(B._jimLedger('seed1').reads.length===2, 'the boot rows seed the ledger and an empty read is skipped', B._jimLedger('seed1').reads.length);
  B._jimLedgerSeed('seed1', [{insight:READ2, name:'x', logged_at:'2026-09-18T21:00:00Z'}]);
  ok(B._jimLedger('seed1').reads.length===2, 'seeding is once per session');
}

// =================================================================== THE LENS
{
  const B=box();
  const A=B._jimAngles();
  ok(A.length===12, 'twelve lenses', A.map(a=>a.k));
  const picks=[]; for(let i=0;i<24;i++) picks.push(B._jimAngleNext('lens1').k);
  let repeatInside3=false;
  for(let i=3;i<picks.length;i++){ if(picks.slice(i-3,i).indexOf(picks[i])>-1) repeatInside3=true; }
  ok(!repeatInside3, 'never one of the last three again, across twenty-four reads', picks.join(' '));
  ok(new Set(picks).size>=6, 'and it actually moves around', new Set(picks).size);
  /* Lenses the data cannot support are not offered. Nothing logged today,
     nothing in the recent rows: no build, no gap, no streak, no pattern. */
  const none=[]; for(let i=0;i<40;i++) none.push(B._jimAngleNext('empty1').k);
  ok(!none.some(k=>k==='build'||k==='gap'||k==='streak'||k==='pattern'),
     'with nothing logged the lenses that need data are never handed out', none.filter(k=>k==='build'||k==='gap'||k==='streak'||k==='pattern'));
  B.setToday([{name:'eggs'}]);
  const some=[]; for(let i=0;i<40;i++) some.push(B._jimAngleNext('today1').k);
  ok(some.some(k=>k==='build'||k==='gap'), 'and once something is logged today, build and gap come into play');
  ok(/THE LENS FOR THIS READ/.test(B._jimLensBlock('lens2')), 'the lens is handed to the model as the lens');
}

// ================================================================= THE RECALL
{
  const B=box();
  const D=n=>new Date(Date.now()-n*86400000).toISOString();
  const rows=[
    {name:'Dunkin hash brown', rating:'bad',  protein:2,  logged_at:D(3), date_str:D(3).slice(0,10), meal:'Breakfast'},
    {name:'Eggs and toast',    rating:'good', protein:20, logged_at:D(2), date_str:D(2).slice(0,10), meal:'Breakfast'},
    {name:'Eggs and toast',    rating:'good', protein:20, logged_at:D(1), date_str:D(1).slice(0,10), meal:'Breakfast'},
    {name:'Chicken and rice',  rating:'good', protein:50, logged_at:D(1), date_str:D(1).slice(0,10), meal:'Lunch'},
    {name:'Eggs and toast',    rating:'good', protein:20, logged_at:D(5), date_str:D(5).slice(0,10), meal:'Breakfast'}
  ];
  B.window._jimRecent={rec1:rows};
  const lines=B._jimRecallLines('rec1');
  ok(lines.some(l=>/hash brown/i.test(l) && /NOT been logged since/.test(l)),
     'the hash brown he flagged three days ago has not come back, and Jim is told so', lines);
  B.window._mealSlot='Breakfast';
  const lines2=B._jimRecallLines('rec1');
  ok(lines2.some(l=>/eggs and toast/.test(l) && /most often/.test(l)), 'what they usually eat at this slot is a fact on the table', lines2);
  /* the flagged food comes back */
  B.window._jimRecent={rec2:rows.concat([{name:'Hash brown and coffee', rating:'okay', protein:3, logged_at:D(0), date_str:D(0).slice(0,10), meal:'Breakfast'}])};
  const lines3=B._jimRecallLines('rec2');
  ok(lines3.some(l=>/hash brown/i.test(l) && /back/.test(l)), 'and when it comes back, that is the fact instead', lines3);
  ok(lines3.length<=3, 'three facts at most - a wall of facts is noise');
  ok(/Computed, not guessed/.test(B._jimRecallBlock('rec2')), 'and the block says what it is');
}

// ================================================================== THE SPEND
/* "It should never be that somebody works their tail off and undereats." */
{
  const O=closure(['_jimOutputBlock']);
  const mk=(wo,steps)=>new Function('var todayWo=arguments[0]; var stepsVal=arguments[1];'+O.code+'\nreturn _jimOutputBlock();')(wo,steps);
  ok(mk([],0)==='', 'a rest day with no steps says nothing');
  const easy=mk([{title:'Walk', dur:'30 min', intensity:3}], 4000);
  ok(/WHAT THEY SPENT TODAY/.test(easy) && /Walk/.test(easy) && !/HIGH-SPEND/.test(easy), 'a light day is listed and nothing more', easy.slice(0,80));
  const hard=mk([{title:'Legs', dur:'55 min', intensity:9}], 6000);
  ok(/HIGH-SPEND DAY/.test(hard) && /20 to 40g more protein/.test(hard) && /not a lapse/.test(hard),
     'a heavy session turns the plate into fuel: more protein, more carbs, a doubled meal is right');
  ok(/HIGH-SPEND DAY/.test(mk([], 14000)), 'and so does a fourteen-thousand-step day on its own');
  ok(/HIGH-SPEND DAY/.test(mk([{title:'Push', feel:'brutal'}], 0)), 'or a session they called brutal with no number on it');
  ok(/_jimRecallBlock\(code\)\+_jimOutputBlock\(\)/.test(src), 'and it rides with the person into every writer');
  ok(!/'SOLID \(' \+ w\.intensity/.test(src), 'the intensity tag no longer teaches the banned word by example');
}

// ============================================================ THE WHOLE PERSON
{
  const B=box();
  ok(B._jimPersonBlock()==='', 'nobody signed in, nothing said - which is what a hand-lifted prompt test sees');
  B.window.cl={code:'per1'};
  B._jimLedgerSeed('per1', [{insight:READ1, name:'Salmon', logged_at:'2026-09-18T20:00:00Z'}]);
  const pb=B._jimPersonBlock();
  ok(/NOT AGAIN/.test(pb) && /THE LENS FOR THIS READ/.test(pb), 'signed in, the ban list and the lens are both there');
}

// ============================================== IT REACHES EVERY WRITER, GUARDED
ok(/THE SHAPE OF EVERY READ/.test(src) && /1\. WHAT IT IS/.test(src) && /2\. FOR YOUR GOAL/.test(src) && /3\. FOR YOU/.test(src),
   'the three-move shape is in the shared block: understand, for your goal, for you');
ok(/VARIETY IS A RESULT, NOT A GOAL/.test(src), 'and it says where variety comes from');
ok(/typeof _jimPersonBlock==='function'\)\?_jimPersonBlock\(\):''/.test(src),
   'the person rides on _jimTenLogs, guarded, so every writer gets it and a hand-lifter does not throw');
ok(/_jimLedgerSeed\(cl\.code, _launch\[0\]\|\|\[\]\)/.test(src), 'the ledger is seeded at boot off the eighty rows already fetched');
ok(/_jimRepeatHits\(_lc, ins, row\)/.test(src) && /_jimLedgerAdd\(_lc, ins, row\)/.test(src),
   'the door counts a repeat and records the read - the one door every stored read passes');
ok((src.match(/await _jimReask\(ask, out, _rh/g)||[]).length===2,
   'and the two writers that produce most reads ask once more with the phrases named',
   (src.match(/await _jimReask\(ask, out, _rh/g)||[]).length);
ok(/temperature:0\.9/.test(src.slice(src.indexOf('async function _jimReask'), src.indexOf('async function _jimReask')+1500)),
   'the second ask runs hotter than the first, because the first answer is the one to get away from');

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
