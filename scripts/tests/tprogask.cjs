// "JIM'S GASLIGHTING ME" (Kelly G, 15 Sep).
//
// She typed: "I need you to switch today's workout from active rest to push
// day". Jim wrote her a workout log — title "Push Day", one exercise called
// "Push Day", her own sentence stored as the note, marked COMPLETE at 10:45am
// — for a session she had not done, and told her it was working. Read off the
// database before a line changed: row 1416, description "Push Day", exercises
// null, while her real sessions carry full loads and reps. Her plan still says
// Tuesday = Rest, so the switch never happened either.
//
// WHY. Every program marker — PROGRAM, PROGRAM_EDIT, PROGRAM_PATCH,
// PROGRAM_REMOVE — is taught only inside the TRAINER's chat, written entirely
// in terms of Yusuf. A client has no program-editing path at all, so her
// sentence fell through to the one hand Jim does have: logging.
//
// A system with no way to do a thing must SAY SO, not do a different thing and
// call it done.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function constAt(n){ const a=L.findIndex(l=>l.indexOf('var '+n+'=')===0); if(a<0) return '';
  let b=a; while(b<L.length && !/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
function fnAt(n){ const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return ''; let b=a,d=0,s=false;
  for(;b<L.length;b++){ for(const c of L[b]){ if(c==='{'){d++;s=true;} else if(c==='}')d--; } if(s&&d===0) break; }
  return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined?('  '+x):'')); };

const world=constAt('_JIM_PROGRAM_ASK_RE')+'\n'+constAt('_JIM_LOGGING_VERB_RE')+'\n'+fnAt('_jimProgramAsk');
t(!!world.trim(), 'the detector is liftable');
const ask=new Function(world+'; return _jimProgramAsk;')();

// ---- HER SENTENCE ---------------------------------------------------------
t(ask("I need you to switch today's workout from active rest to push day")===true,
  'HER EXACT SENTENCE is caught as a program request');

// ---- other ways people ask for the same thing -----------------------------
t(ask('can you swap my wednesday and tuesday')===true, 'swap two weekdays');
t(ask('change my program please')===true, 'change my program');
t(ask('move today to push day')===true, 'move today');
t(ask('reschedule my week')===true, 'reschedule my week');

// ---- AN IMPERATIVE BEATS THE NOUN -----------------------------------------
// This file already documents this exact trap costing a real write: "log my
// workout, bench 3x8" was once handed to the programme builder, which has no
// logging hand, and it reported back with nothing written. A LOG MUST STAY A LOG.
t(ask('log my push day')===false, 'LOG my push day is a log, not a program request');
t(ask('log my workout, bench 3x8')===false, '...the exact sentence the file warns about');
t(ask('I did push day today')===false, '"did" is a log');
t(ask('just did my leg day')===false, '"just did" is a log');
t(ask('finished push day')===false, '"finished" is a log');
t(ask('add my workout')===false, '"add my workout" is a log');
t(ask('tracked my push day')===false, '"tracked" is a log');
t(/if\(_JIM_LOGGING_VERB_RE\.test\(s\)\) return false;/.test(world),
  'the logging verb stands the detector down, in the shipped code');

// ---- and it keeps its hands off everything else ---------------------------
t(ask('chicken and rice for lunch')===false, 'a meal is not a program request');
t(ask('my knee is sore')===false, 'a complaint is not a program request');
t(ask('')===false, 'empty');
t(ask(null)===false, 'null does not throw');

// ---- what Jim says now ----------------------------------------------------
t(/I cannot move the days in your programme/.test(src), 'Jim says plainly that he cannot');
t(/not going to change them behind his back/.test(src), '...and why, which is that it is Yusuf’s call');
t(/it does not have to match what the plan says for today/.test(src),
  '...and tells her the thing she actually needed to hear: log what you really do');
t(/Message Yusuf and he can move the day itself/.test(src), '...and where the real door is');

// ---- it must never reach the trainer's own chat ---------------------------
// Yusuf HAS the program hands. Standing between him and them would be the worse
// bug in the other direction.
const turn=src.slice(src.indexOf('_jimProgramAsk(text)')-700, src.indexOf('_jimProgramAsk(text)')+200);
t(/isTrainer\(cl\.code\)/.test(turn), 'the guard is scoped to CLIENTS only');
t(/!_isTr && \(!photos \|\| !photos\.length\) && _jimProgramAsk\(text\)/.test(turn),
  '...and only on a text turn with no photo in it');

console.log(bad? ('tprogask: '+bad+' FAILED') : 'tprogask: all passed');
process.exit(bad?1:0);
