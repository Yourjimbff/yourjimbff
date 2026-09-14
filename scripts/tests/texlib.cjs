// EVERY MOVEMENT JARVIS IS TOLD TO USE IS ONE THE APP CAN PLACE.
//
// This app decides which muscle a logged exercise worked by matching its NAME
// against EX_LIB (_bfGroupOf). Jarvis, building programs, named its exercises
// freehand — and on the five-day split built on 14 Sep, 8 of 17 movements
// matched nothing at all, including both of the main ones. The library writes
// "Squat" and "Barbell Hip Thrust"; the model wrote "Barbell Back Squat" and
// "Hip Thrust". Others missed by a plural or a hyphen alone. Nothing anywhere
// said so: the client sees the movement, logs it, and it counts towards
// nothing.
//
// The fix hands the model the library. This suite does not check that the
// prompt SAYS so — it closes the loop: every name _jvExLibLine hands over is
// fed to _bfGroupOf, the same function the app uses, and must come back with a
// group. A list that drifts from the matcher fails here, which is the only
// failure that matters.
const fs=require('fs');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

global.window={};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};

const lift=closure(['_jvExLibLine','_bfGroupOf']);
eval(lift.code);
t(typeof _jvExLibLine==='function', 'lifted _jvExLibLine');
t(typeof _bfGroupOf==='function',   'lifted _bfGroupOf');

const line=_jvExLibLine();
t(line.length>0, 'the library renders', line.length+' chars');
// Small enough to ride in every program turn's prompt without crowding it out.
t(line.length<4000, 'and stays small enough to send every turn', line.length+' chars');

const names=[];
line.split('\n').forEach(row=>{
  const i=row.indexOf(': '); if(i<0) return;
  row.slice(i+2).split(', ').forEach(n=>{ n=n.trim(); if(n) names.push(n); });
});
t(names.length>40, 'and carries the whole library', names.length+' movements');

console.log('\n  every name it hands over, fed back through the matcher:');
const orphans=names.filter(n=>!_bfGroupOf(n));
t(orphans.length===0, 'all '+names.length+' place to a muscle group',
  orphans.length?('ORPHANED: '+orphans.join(' | ')):'');

// And the ones that caused this — still orphans, so the suite is measuring
// something. If these ever start passing the matcher got looser, not the list.
console.log('\n  the names that caused this are still the wrong names:');
[['Barbell Back Squat','Squat'],['Face Pull','Face Pulls'],['Assisted Pull Ups','Assisted Pull-Ups']].forEach(([wrong,right])=>{
  t(!_bfGroupOf(wrong) && !!_bfGroupOf(right),
    JSON.stringify(wrong)+' misses, '+JSON.stringify(right)+' lands',
    String(_bfGroupOf(wrong))+' / '+String(_bfGroupOf(right)));
});

// The prompt has to actually be handed the list, inside the program branch.
console.log('\n  and the model is actually given it:');
t(/var _exlib=''; try\{ _exlib=_jvExLibLine\(\); \}catch\(e\)\{\}/.test(src), 'the prompt builds it from EX_LIB');
t(/if\(_exlib\) sys \+= '=== THE MOVEMENTS THIS APP KNOWS ===/.test(src), 'and appends it to the system prompt');
const branch=src.slice(src.indexOf("if(_JT_PROG_RE.test(msg)) sys +="), src.indexOf("var msgs=[{role:'user',content:sys}]"));
t(branch.indexOf('_jvExLibLine()')>-1, 'inside the program branch, not on every turn');

console.log(bad? ('\n'+bad+' FAILED') : '\nall passed');
process.exit(bad?1:0);
