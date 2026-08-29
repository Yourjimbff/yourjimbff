// SHARE DAY, THE WORKOUT SHAPE (Yusuf, order, 27 Aug, off a real paste).
// Hayden logged ONE Legs session with FIVE exercises. The message he sent
// carried two of them and an ellipsis: three exercises never reached the client.
// Three things lost them and all three were in one line of _citeDayBody —
// .slice(0,3), a comma join, and _citeClip truncating the result.
//
// So this suite asserts the shape he asked for, and asserts it on a workout
// whose exercise list is LONGER than the old cap, because a fixture with three
// exercises would pass over the exact bug this exists to prevent.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function lift(name){
  const s=L.findIndex(l=>l.startsWith('function '+name+'(')||l.startsWith('async function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name+' not found');
  let depth=0, started=false;
  for(let i=s;i<L.length;i++){
    for(const ch of L[i]){ if(ch==='{'){ depth++; started=true; } else if(ch==='}'){ depth--; } }
    if(started && depth===0) return L.slice(s,i+1).join('\n');
  }
  throw new Error('SEAM MOVED: no close found for '+name);
}
function constant(re,what){ const m=re.exec(L.join('\n')); if(!m) throw new Error('SEAM MOVED: '+what); return m[1]; }
let liftChecks=true;
try{ lift('_citeNothingLikeThis'); liftChecks=false; }catch(e){ liftChecks=/SEAM MOVED/.test(e.message); }

const CITE_MAX=+constant(/var CITE_MAX *= *(\d+)/,'CITE_MAX');
const src=[
  'var CITE_MAX='+CITE_MAX+';',
  // _setWord is an inner var of _bfItemsFor and comes with it.
  // _dayFoodTotals is the ONE tally the card and this summary both read; it has
  // to come with _citeDayBody now that the summary no longer counts its own day.
  lift('_citeClip'), lift('_bfParseDesc'), lift('_bfItemsFor'), lift('_dayFoodTotals'), lift('_citeDayBody'),
  'function _has(){ return false; }',
  'function _jvNum(n){ return String(n); }',
  'function _citeWhen(){ return " today"; }',
  'function wUnit(){ return "lb"; }',
  'module.exports={_citeDayBody,_bfItemsFor,CITE_MAX};'
].join('\n');
const m={exports:{}};
new Function('module','exports',src)(m,m.exports);
const {_citeDayBody}=m.exports;

// Hayden's day, as ordered: one Legs workout, five exercises, sets and reps on
// every one, and a note of his own underneath. Names are longer than one word so
// a naive split cannot fake a pass.
const HAYDEN_NOTE='the leg press machine was taken so I used the other one';
const wo={ kind:'wo', data:{ title:'Legs', duration:null,
  notes:HAYDEN_NOTE,
  description:'Squat, Leg Press, Leg Extension, Hamstring Curl, Calves',
  exercises:[ {name:'Squat', sets:4, reps:8, weight:225},
              {name:'Leg Press', sets:3, reps:12, weight:360},
              {name:'Leg Extension', sets:3, reps:15, weight:120},
              {name:'Hamstring Curl', sets:3, reps:12, weight:90},
              {name:'Calves', sets:4, reps:20, weight:180} ] } };
const EX=['Squat','Leg Press','Leg Extension','Hamstring Curl','Calves'];
const meal={ kind:'food', data:{ meal:'Lunch', name:'Chicken and rice', calories:620, protein:48 } };
const walk={ kind:'wo', data:{ title:'Walk', duration:'15 min', description:'Walk', exercises:null } };

const C=[]; const t=(n,f)=>{ let ok=false,err=null; try{ ok=!!f(); }catch(e){ err=e.message; } C.push([n,ok,err]); };
const out=_citeDayBody([wo]);
const lines=out.split('\n');

t('the lift really looks (fake name reports missing)', ()=>liftChecks);
t('the fixture is longer than the old cap of three', ()=>EX.length>3);

t('the workout name heads its own line, with a colon', ()=>lines.indexOf('Legs:')>=0);
t('EVERY exercise is present', ()=>EX.every(e=>out.indexOf(e)>=0));
t('each exercise is alone on its line', ()=>EX.every(e=>lines.indexOf(e)>=0));
t('they follow the name in order', ()=>{
  const at=lines.indexOf('Legs:');
  return EX.every((e,i)=>lines[at+1+i]===e); });
t('NOTHING is truncated', ()=>out.indexOf('…')<0 && out.indexOf('...')<0);
t('no sets, reps or load reach the message', ()=>!/\b\d+\s*(x|×|sets?|reps?|lb|kg)\b/i.test(out));
t('the client’s own note is NOT in his text to them', ()=>out.indexOf(HAYDEN_NOTE)<0 && out.toLowerCase().indexOf('machine')<0);
t('the summary still counts the session, unchanged', ()=>/\n1 Legs\b/.test(out));
t('a workout with no food carries no food totals line', ()=>!/cal\b/.test(out) && !/protein/.test(out));
t('blank line between items, same as the rest', ()=>/On your day today:\n\n/.test(out));

// The whole point is the shape he wrote out. Assert it verbatim.
t('the block reads exactly as ordered', ()=>{
  const at=lines.indexOf('Legs:');
  return lines.slice(at, at+6).join('\n')==='Legs:\nSquat\nLeg Press\nLeg Extension\nHamstring Curl\nCalves'; });

// Not a regression in the surrounding message.
const both=_citeDayBody([meal, wo]);
t('with food, the totals line comes back', ()=>/620 cal and 48g protein across 1 meal/.test(both));
t('and the exercises are still all there', ()=>EX.every(e=>both.split('\n').indexOf(e)>=0));
t('a meal and a workout stay separate items', ()=>/Lunch: Chicken and rice/.test(both));

// A session with no exercise list must keep the line it always had.
const w=_citeDayBody([walk]);
t('a walk still reads "Walk: 15 min"', ()=>/Walk: 15 min/.test(w));
t('...and does not grow an empty colon block', ()=>w.split('\n').indexOf('Walk:')<0);

// Degenerate rows must not produce a heading with nothing under it.
const empty=_citeDayBody([{kind:'wo', data:{title:'Legs', exercises:[]}}]);
t('an empty exercise list does not leave a dangling heading', ()=>empty.split('\n').indexOf('Legs:')<0);
const noname=_citeDayBody([{kind:'wo', data:{title:'Legs', exercises:[{name:'  '},{name:'Squat'}]}}]);
t('a nameless exercise is dropped, the rest survive', ()=>{
  const at=noname.split('\n').indexOf('Legs:');
  return at>=0 && noname.split('\n')[at+1]==='Squat'; });
// A one-word session whose description IS its title must not render a heading
// with the same word underneath it.
t('a walk does not list itself as its own exercise', ()=>!/Walk:\nWalk/.test(w));

// HIS REAL ROW'S SHAPE, which is NOT the shape the fixture above assumes.
// Read off live: Hayden's exercises column is NULL. The five exercises live in
// a multi-line description, and his own note is a trailing paragraph INSIDE that
// same description rather than in the notes column. A suite that only ever fed
// the structured column would have passed while the real path went untested —
// and the note is the part that must not reach the client.
const REAL_DESC='Squat: 135 lb \u00d7 8, 135 lb \u00d7 8, 135 lb \u00d7 8, 135 lb \u00d7 6\n'
  +'Leg Press: 180 lb \u00d7 8, 180 lb \u00d7 8, 180 lb \u00d7 10, 180 lb \u00d7 10\n'
  +'Leg Extension: 25 lb \u00d7 10, 25 lb \u00d7 10, 25 lb \u00d7 10\n'
  +'Hamstring Curl: 25 lb \u00d7 10, 25 lb \u00d7 10, 25 lb \u00d7 10\n'
  +'Calves: 135 lb \u00d7 12, 135 lb \u00d7 12, 135 lb \u00d7 12\n\n'
  +'Leg extension/Ham curls - 25 ib per leg. Machine might carry extra weight';
const real=_citeDayBody([{kind:'wo', data:{title:'Legs', duration:null, notes:null,
  exercises:null, description:REAL_DESC}}]);
const realLines=real.split('\n');
t('REAL ROW: all five exercises, from the description', ()=>EX.every(e=>realLines.indexOf(e)>=0));
t('REAL ROW: reads exactly as ordered', ()=>{
  const at=realLines.indexOf('Legs:');
  return realLines.slice(at, at+6).join('\n')==='Legs:\nSquat\nLeg Press\nLeg Extension\nHamstring Curl\nCalves'; });
t('REAL ROW: his note, buried in the description, does not reach the client', ()=>
  real.toLowerCase().indexOf('machine')<0 && real.toLowerCase().indexOf('per leg')<0);
t('REAL ROW: no loads or rep counts', ()=>!/135|180|\u00d7|\blb\b/.test(real));
t('REAL ROW: nothing truncated', ()=>real.indexOf('\u2026')<0);
t('REAL ROW: summary still 1 Legs', ()=>/\n1 Legs\b/.test(real));

let bad=0;
C.forEach(([n,ok,err])=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+n+(err?'  ['+err+']':'')); });
if(bad){ console.log('\n--- the draft it produced ---'); console.log(out); }
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
