// THE LOG COMMITS ON THE WORDS (Yusuf, 3 Sep).
//
// "the old meal logging flow was: photo, then describe what it was. which is
// and was the best. once you log it based on photo and describing what it was,
// that constitutes a log. then best next step is calculate calories and macros
// for them based on their description, but dont make them wait for it, and dont
// be inaccurate after making them wait."
//
// The old order was type → Log it → WAIT for a model → look at numbers → Log it
// AGAIN. Two taps and a wait, and the row did not exist until the end, so a
// client who pocketed their phone mid-wait logged nothing at all.
//
// GATED to him. 89 clients do not get a re-ordered logging flow because one
// window thought it was better.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+label); };

console.log('  it is gated, and the gate can be flipped without a deploy:');
const g = src.slice(src.indexOf('function _nlFastOn'), src.indexOf('/* A name off their own words'));
t(/isTrainer\(cl\.code\)/.test(g),           'on for the trainer');
t(/yjb_fastlog'\)==='on'/.test(g),           'and for anyone he switches on');
t(/yjb_fastlog'\)==='off'/.test(g),          'off wins, so he can kill it instantly');
t(/return false;\s*\}/.test(g.slice(g.lastIndexOf('catch'))), 'and it defaults to OFF');

console.log('\n  the row is written before any model is asked:');
const f = src.slice(src.indexOf('async function nlSubmitFast'), src.indexOf('/* Fills in what the table'));
t(f.indexOf('logFoodFromChat') < f.indexOf('_nlEnrich'), 'the write happens before the enrich');
t(/meal_text:\(line\|\|''\)/.test(f),        'their own sentence is stored as the log');
t(/st\.logged=true/.test(f),                 'and the sheet says logged, once it is');
t(/_tlRefreshDay\(st\.ds\)/.test(f),         'the day refreshes under it');
t(/Could not save — it is NOT logged/.test(f), 'a failed write says so and keeps their line');

console.log('\n  a photo with no words still takes the old road:');
t(/if\(line && _nlFastOn\(\)\)/.test(src),   'the fast path needs a line');
t(/nothing to commit on until something has\s*\n\s*read the picture/.test(src) || /photo-only capture still/.test(src),
  'and the reason is written down');

console.log('\n  nothing the table knows means nothing to commit on:');
t(/if\(!echo \|\| !echo\.lines\.length\) return false/.test(f), 'no items, old road');
t(/if\(!priced\.length\) return false/.test(f),                 'nothing priced, old road');

console.log('\n  the enrich prices ONLY the leftovers and ADDS them:');
const e = src.slice(src.indexOf('/* Fills in ONLY what the table'), src.indexOf('async function nlSubmit(){'));
t(/filter\(function\(L\)\{ return !L\.known; \}\)/.test(e), 'only the items the table could not price are sent');
t(/Price ONLY these items, nothing else/.test(e),   'and the prompt says so');
t(/base\.calories \+ addCal/.test(e),               'the answer is ADDED to the table total');
t(/base\.protein  \+ Math\.round/.test(e),          'macros too');
t(!/cal <= Math\.round\(\+\(\(st\.est/.test(e),      'the whole-meal comparison is gone');
t(/THE FIRST VERSION OF THIS WAS WRONG AND THE SCRATCH CLIENT CAUGHT IT/.test(e),
  'and why it changed is written down');
t(/_NL_ENRICH_MAX_CAL/.test(e),                     'absurd leftovers are refused');
t(/applyFoodEdit\(rowId, fields\)/.test(e),         'it patches the existing row, not a new one');
t(/if\(!est \|\| est\.error\) return;/.test(e),     'a failed estimate costs nothing');
t(/if\(!ok\) return;/.test(e),                      'and a failed patch costs nothing either');
t(/if\(!left\.length\) return;/.test(e),            'nothing left over means no call at all');

console.log('\n  both roads ask the model the SAME question:');
t(/var _NL_SYS=/.test(src),      'the prompt is one constant');
t(/var sys=_NL_SYS;/.test(src),  'the old path uses it');
t(/_NL_SYS/.test(e),             'the enrich builds on the same prompt');
t((src.match(/You are reading one meal for a fitness coach whose clients measure in ounces for meat and handfuls/g)||[]).length===1,
  'and there is exactly one copy of it');

console.log(bad?('\n'+bad+' FAILED'):'\nall pass');
process.exit(bad?1:0);
