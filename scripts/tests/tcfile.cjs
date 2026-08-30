// THE CLIENT FILE (Yusuf, order, 30 Aug) — storage and ingestion.
//
// Item 1 of the post-convergence ladder. His order for the ingestion is three
// words — "verbatim, no rewording, no enrichment" — and the only honest way to
// prove that is a BYTE-EXACT ROUND TRIP: parse the paste, write it back out,
// and compare it to the original character for character. A human reading two
// long texts side by side cannot do that, and this is the check that can.
//
// THE FIXTURE CARRIES THE SHAPE, NOT A REAL PERSON. It is his real paste with
// every identifying word replaced and nothing else touched: the same ten
// headings, the same em dashes, tildes, straight apostrophes and quotes, the
// same hard wraps, and the same numbers that a careless parser mistakes for
// headings. It lives in its own file so nothing here can quietly reformat it.
//
// WHY NOT THE REAL ONE. Found the same day: netlify.toml sets no publish
// directory, so the whole repo was being served — /scripts/tests/ttotals.cjs
// answered 200 with two named clients' real logged days. A genuine Client File
// is a coaching record: red lines, personal details, what not to start. It does
// not go in the repository, and the redirects added to netlify.toml are a
// blacklist, which is exactly the kind of guard that rots. So this fixture
// carries no client's words at all and the question does not arise.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf, closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.localStorage={getItem:()=>null,setItem:()=>{}};

function varAt(n){ const a=L.findIndex(l=>l.startsWith('var '+n+'='));
  if(a<0) throw new Error('SEAM MOVED: var '+n); let b=a;
  while(b<L.length && !/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }

const MINE=['_cfKeyFor','_cfIsHeading','cfParse','cfStringify','cfRoundTrips',
  'cfChangedFields','_cfRowNote','_cfFromNote','cfLoad','cfSave'];
eval(varAt('_CF_MARK')+'\n'+varAt('_CF_SCHEMA')+'\n'+varAt('_CF_FIELDS'));
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(['_CF_MARK','_CF_SCHEMA','_CF_FIELDS']), n=>eval(n));

const FILETXT=fs.readFileSync('scripts/tests/fixtures-client-file.txt','utf8').replace(/\n$/,'');
// A REPLACE THAT MATCHED NOTHING IS A TEST THAT PROVED NOTHING. Renaming the
// fixture left one of these pointing at a sentence that no longer existed, so
// the "changed" file was byte-identical to the original and two assertions
// about detecting a change went red for the right reason. Every edit to the
// fixture goes through this and throws rather than quietly doing nothing.
function edit(from, to){
  if(FILETXT.indexOf(from)<0) throw new Error('fixture edit matched nothing: '+from);
  return FILETXT.replace(from, to);
}

console.log('\n  A FILE IN HIS SHAPE:');
const f=cfParse(FILETXT);
t(f.order.length===10, 'all ten fields land', f.order.length+'/10');
t(f.missing.length===0, 'none reported missing');
t(f.duplicates.length===0, 'none duplicated');
t(f.order.join(',')==='goal,why_words,push_points,knowledge_base,personal_details,tracked_progress,relationship_state,red_lines,wins_record,last_touch',
  'and they land in his order', f.order.join(','));

console.log('\n  VERBATIM, OR IT DID NOT HAPPEN:');
t(cfRoundTrips(FILETXT), 'the file writes back BYTE-EXACT — nothing reworded, nothing enriched');
t(cfStringify(cfParse(FILETXT))===FILETXT, 'stringify(parse(x)) === x, character for character');
// The specific things a careless parser would eat.
t(/\("Wow"\)/.test(f.fields.push_points.text), 'his quotation marks survive');
// A STRAIGHT APOSTROPHE, which this repo's own register calls a landmine —
// check.sh's string-stripper reads a lone one as an opening quote. It has to
// survive ingestion untouched, and it has to be the straight character and not
// quietly promoted to a typographic one.
t(f.fields.push_points.text.indexOf("doesn't need pushing")>=0, 'a straight apostrophe survives');
t(f.fields.push_points.text.indexOf('\u2019')<0, 'and is not silently prettified into a curly one');
t(f.fields.goal.text.split('\n').length===6, 'his six hard-wrapped lines survive as six', f.fields.goal.text.split('\n').length+' lines');
t(/KNOWN DATA FLAW/.test(f.fields.tracked_progress.text), 'the data-flaw warning is carried, not tidied away');
t(/~5oz servings/.test(f.fields.red_lines.text), 'the tilde and the ounces survive');

console.log('\n  THE EMPTY FIELD IS NOT A MISSING FIELD:');
// Field 2 says "[empty — not asked this call. Get it verbatim next call.]".
// That sentence is his instruction to himself. Dropping it would be an edit,
// and calling the field absent would lose the instruction.
t(f.order.indexOf('why_words')>=0, 'WHY, IN HIS WORDS is PRESENT');
t(f.missing.indexOf('why_words')<0, 'and is not counted as missing');
t(f.fields.why_words.text==='[empty — not asked this call. Get it verbatim next call.]',
  'its words are stored exactly as written', JSON.stringify(f.fields.why_words.text));

console.log('\n  WHAT IS A HEADING, AND WHAT IS NOT:');
t(!!_cfIsHeading('1. GOAL'), 'a plain numbered heading');
t(!!_cfIsHeading('6. TRACKED PROGRESS (pointer)'), 'his parenthetical annotation is still a heading');
t(!!_cfIsHeading('2. WHY, IN HIS WORDS'), 'a comma in the heading');
t(!!_cfIsHeading('10. LAST TOUCH'), 'two digits');
// Every one of these is a real line from his file. A parser that mistook one
// for a heading would split a field in half and lose his words.
[ 'protein literature (cited 0.8g/lb himself). Already logs carbs in',
  '15,300 Wed, 8,671 Thu. Saturday: 1,940 cal, 195P/172C/50F, clean.',
  'mid-September (~2 weeks) on energy, digestion, and training performance.',
  'Wed, Fri, Sat this week. Agreed to the daily-feedback standard. Jim',
  'sweet potatoes, black beans, chickpeas, ~5oz servings. No peanut butter'
].forEach(line=>t(!_cfIsHeading(line), 'NOT a heading: '+line.slice(0,44)+'…'));
t(!_cfIsHeading('11. SOMETHING ELSE'), 'an eleventh field is refused — the schema is locked');
t(!_cfIsHeading('3. push points'), 'lower case is not one of his headings');

console.log('\n  A HALF-PASTE IS REPORTED, NEVER GUESSED AT:');
const half=cfParse('1. GOAL\nLose fat.\n\n3. PUSH POINTS\nMath.');
t(half.order.length===2, 'only what was pasted is parsed');
t(half.missing.length===8, 'the other eight are named as missing', half.missing.join(','));
t(half.missing.indexOf('why_words')>=0 && half.missing.indexOf('last_touch')>=0, 'by name');
// FIRST WINS, NEVER MERGED — his order says do not merge, in as many words.
const dup=cfParse('1. GOAL\nfirst.\n\n1. GOAL\nsecond.');
t(dup.fields.goal.text==='first.', 'a repeated field keeps the FIRST, never merged', dup.fields.goal.text);
t(dup.duplicates.length===1 && dup.duplicates[0]==='goal', 'and the duplicate is reported');

// ===== FOUND BY AN ADVERSARIAL PASS OVER THIS BLOCK ====================
// Two real defects, both demonstrated by running the shipped functions, both
// invisible to the Ben fixture because every one of his ten fields has a body.
console.log('\n  A HEADING WITH NOTHING UNDER IT YET:');
// Joining the body slice made "no lines at all" and "one blank line" the same
// empty string, so writing back always guessed the blank line and a half-filled
// skeleton gained lines it never had.
[ ['1. GOAL\n2. WHY, IN HIS WORDS\nbecause',        'a heading straight onto the next heading'],
  ['1. GOAL\nFat loss.\n10. LAST TOUCH',             'a trailing heading with no body'],
  ['1. GOAL\nFat loss.\n\n10. LAST TOUCH',           'the same, blank-line separated'],
  ['1. GOAL\n\n2. WHY, IN HIS WORDS\n\n3. PUSH POINTS','the skeleton he pastes before filling it in'],
  ['1. GOAL\n\nFat loss.',                           'a blank line before the body is kept']
].forEach(function(pair){
  t(cfRoundTrips(pair[0]), 'round-trips: '+pair[1], JSON.stringify(cfStringify(cfParse(pair[0]))));
});
t(cfParse('1. GOAL\n2. WHY, IN HIS WORDS\nx').fields.goal.raw===null,
  'nothing under a heading reads as null');
t(cfParse('1. GOAL\n\n2. WHY, IN HIS WORDS\nx').fields.goal.raw==='',
  'one blank line under a heading reads as an empty line, not as nothing');
t(cfParse('1. GOAL\n2. WHY, IN HIS WORDS\nx').fields.goal.text==='',
  'and either way its text is empty');
// The distinction has to survive storage or the fix dies on the first save.
[ '1. GOAL\n2. WHY, IN HIS WORDS\nbecause', '1. GOAL\n\n2. WHY, IN HIS WORDS\nbecause' ].forEach(function(txt,i){
  const p=cfParse(txt);
  t(cfStringify(_cfFromNote(_cfRowNote(p)))===txt,
    'and survives a save and load, shape '+(i+1), JSON.stringify(cfStringify(_cfFromNote(_cfRowNote(p)))));
});

console.log('\n  THE VERBATIM GATE IS WIRED, NOT JUST WRITTEN:');
// _cfIsHeading judges a line on its own, so a numbered upper-case list inside a
// field reads as a heading: text is deleted and the prose after it is filed
// under another field. That is both of his ingestion laws broken at once, and
// nothing caught it because cfRoundTrips had no caller.
const NESTED='1. GOAL\nLose fat.\n\n4. KNOWLEDGE BASE\nRules he follows:\n1. NO DAIRY\n2. PROTEIN FIRST\nand he sticks to them.';
const nest=cfParse(NESTED);
t(nest.verbatim===false, 'a numbered upper-case list inside a field is caught');
t(!cfRoundTrips(NESTED), 'it does not round-trip');
t(cfParse(FILETXT).verbatim===true, 'and a whole well-formed file passes the same gate');
// NO REAL CLIENT IN THE REPOSITORY. The whole repo has been publicly served;
// this is the assertion that stops a real Client File being pasted in here as a
// fixture the next time somebody wants a realistic one.
t(!/Plimpton|McCarthy|Hauser|Carly|Kelly G|Adriana/.test(FILETXT),
  'and the fixture names no real client');
t(cfParse('1. GOAL\nLose fat.').verbatim===true, 'as does an ordinary partial paste');

console.log('\n  ANY FIELD CHANGE PRODUCES A FRESH DRAFT (his law):');
const a=cfParse(FILETXT);
const b=cfParse(edit('Fat loss, get dialed in.','Fat loss, and hold the strength.'));
t(cfChangedFields(a,a).length===0, 'a file compared with itself has moved nothing');
const moved=cfChangedFields(a,b);
t(moved.length===1 && moved[0]==='goal', 'one word in GOAL is one changed field', moved.join(','));
t(cfChangedFields(a,cfParse(FILETXT+'\n')).length===0, 'a trailing newline is not a change of mind');
// Every one of the ten is watched, not just the first.
_CF_FIELDS.forEach(fd=>{
  const orig=a.fields[fd.k].raw;
  const c=JSON.parse(JSON.stringify(a));
  c.fields[fd.k]={raw:orig+'\nMOVED', text:(orig+'\nMOVED').replace(/^\n+/,'').replace(/\s+$/,'')};
  const ch=cfChangedFields(a,c);
  t(ch.length===1 && ch[0]===fd.k, 'a change in '+fd.k+' is seen');
});

console.log('\n  THE ROW IT IS STORED AS:');
const note=_cfRowNote(f);
t(note.indexOf(_CF_MARK)===0, 'it carries the [FILE] marker, which is what every other reader keys off');
const round=_cfFromNote(note);
t(!!round, 'and it reads back');
t(cfChangedFields(f, round).length===0, 'with all ten fields intact through JSON', cfChangedFields(f,round).join(','));
t(cfStringify(round)===FILETXT, 'and the stored row still writes back BYTE-EXACT to his paste');
t(_cfFromNote('[MEMORY] a dossier')===null, 'a [MEMORY] row is not mistaken for a file');
t(_cfFromNote('[PRIVATE] my read on him')===null, 'nor a private note');
t(_cfFromNote(_CF_MARK+'not json')===null, 'and a corrupt payload answers null rather than half a file');

console.log('\n  A FILE IS NEVER SHOWN AS ONE OF HIS NOTES:');
// client_notes is a shared table. Without these three, a JSON payload renders
// into his private notes list, into the cockpit log, and into the prompt that
// builds the memory dossier.
t(/if\(s\.indexOf\(_CF_MARK\)===0\) return false;/.test(src),
  '_cnIsPrivateNote excludes it');
const memBuild=src.slice(src.indexOf('async function jvBuildClientMemory'), src.indexOf('async function jvBuildClientMemory')+2200);
t(/indexOf\(_CF_MARK\)!==0/.test(memBuild), 'the memory builder is not fed it');
const notesLog=src.slice(src.indexOf('async function _jvLoadClientNotes'), src.indexOf('async function _jvLoadClientNotes')+1600);
t(/indexOf\(_CF_MARK\)!==0/.test(notesLog), 'the cockpit log does not render it');

// ===== READS AND WRITES ==================================================
(async()=>{
  console.log('\n  A READ THAT FAILED IS NOT A CLIENT WITH NO FILE:');
  // The landmine this repo keeps re-learning. If a failed read answered
  // "no file", an ingestion would overwrite a file that already exists.
  global.trainerOpChecked=async()=>({ok:false, rows:[]});
  let r=await cfLoad('benp1');
  t(r.ok===false && r.file===null, 'a refused read says so');
  t(r.reason==='read failed', 'and says which', r.reason);

  global.trainerOpChecked=async()=>({ok:true, rows:[]});
  r=await cfLoad('benp1');
  t(r.ok===true && r.file===null && r.reason==='no file yet',
    'a client who genuinely has none reads differently from a failure');

  console.log('\n  THE NEWEST FILE WINS, AND THE REST ARE HISTORY:');
  const older=_cfRowNote(cfParse('1. GOAL\nold goal.'));
  global.trainerOpChecked=async()=>({ok:true, rows:[
    {id:9, note:_cfRowNote(f),        logged_at:'2026-08-30T18:00:00Z'},
    {id:8, note:'[Jarvis] he trained',logged_at:'2026-08-30T12:00:00Z'},
    {id:7, note:older,                logged_at:'2026-08-29T18:00:00Z'},
  ]});
  r=await cfLoad('benp1');
  t(r.ok && r.file && r.id===9, 'the newest [FILE] row is the file', 'id '+(r.id));
  t(r.file.fields.goal.text.indexOf('Fat loss')===0, 'and it is the new goal, not the old one');
  t(r.history===2, 'the older one is kept as history', String(r.history));

  console.log('\n  A SAVE LANDS ON A REAL PERSON, OR NOT AT ALL:');
  // An INSERT with a wrong code SUCCEEDS and reads back cleanly, so without this
  // the file would be reported saved and belong to nobody.
  let written=null, roster=[{code:'benp1'},{code:'chrism1'}];
  const door=(op)=> op==='roster'
    ? {ok:true, rows:roster}
    : {ok:true, rows:(written?[{id:42, note:written.row.note, logged_at:'x'}]:[])};
  global.sbInsertReturning=async(tbl,row)=>{ written={tbl,row}; return {id:42}; };
  global.trainerOpChecked=async(op)=>door(op);
  written=null;
  let bad1=await cfSave('nosuchcode', f);
  t(bad1.ok===false && bad1.reason==='no such client', 'a code nobody holds is refused', bad1.reason);
  t(written===null, 'and nothing is written for it');
  written=null;
  global.trainerOpChecked=async(op)=> op==='roster' ? {ok:false, rows:[]} : door(op);
  let bad2=await cfSave('benp1', f);
  t(bad2.ok===false && bad2.reason==='could not confirm the client',
    'and a roster read that failed refuses too — fail closed', bad2.reason);
  t(written===null, 'nothing written on an unconfirmed client either');

  console.log('\n  A SAVE IS NOT SAVED UNTIL IT READS BACK:');
  written=null;
  global.trainerOpChecked=async(op)=>door(op);
  let s=await cfSave('benp1', f);
  t(s.ok===true && s.id===42, 'a good save reports the row it made');
  t(written.tbl==='client_notes' && written.row.client_code==='benp1', 'into client_notes, keyed on the client');
  t(String(written.row.note).indexOf(_CF_MARK)===0, 'marked [FILE]');

  global.sbInsertReturning=async()=>null;
  s=await cfSave('benp1', f);
  t(s.ok===false && s.reason==='write refused', 'a refused write NEVER reports a save', s.reason);

  // The one that matters most: the row landed, but not carrying what was sent.
  global.sbInsertReturning=async(tbl,row)=>{ written={tbl,row}; return {id:43}; };
  global.trainerOpChecked=async(op)=>{
    if(op==='roster') return {ok:true, rows:roster};
    const wrong=cfParse(edit('Fat loss, get dialed in.','something else entirely.'));
    return {ok:true, rows:[{id:43, note:_cfRowNote(wrong), logged_at:'x'}]};
  };
  s=await cfSave('benp1', f);
  t(s.ok===false, 'a row that came back DIFFERENT is not a save');
  t(s.reason==='read back different' && (s.fields||[]).indexOf('goal')>=0,
    'and it names the field that did not land', (s.fields||[]).join(','));

  global.trainerOpChecked=async(op)=> op==='roster' ? {ok:true, rows:roster} : {ok:false, rows:[]};
  s=await cfSave('benp1', f);
  t(s.ok===false && /could not read it back/.test(s.reason||''),
    'and a write it cannot verify is not claimed either', s.reason);

  // THE GATE, AT THE DOOR IT GUARDS.
  let touched=false;
  global.sbInsertReturning=async()=>{ touched=true; return {id:99}; };
  global.trainerOpChecked=async(op)=> op==='roster' ? {ok:true, rows:roster} : {ok:true, rows:[]};
  s=await cfSave('benp1', cfParse(NESTED));
  t(s.ok===false && s.reason==='not verbatim', 'a file that did not survive ingestion is REFUSED', s.reason);
  t(touched===false, 'and nothing is written at all — it does not reach the table');

  console.log();
  if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
  console.log('  all client file assertions pass');
  process.exit(0);
})().catch(e=>{ console.log('  FAIL  the suite threw: '+(e&&e.stack||e)); process.exit(1); });
