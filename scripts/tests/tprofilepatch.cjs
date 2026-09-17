// A PARTIAL SAVE TO A PROFILE IS AN UPDATE, NOT AN UPSERT.
//
// Found 17 Sep on the served site, with the server's own words, after an
// afternoon spent on theories about a phone that was fine:
//
//   400 {"code":"23502","message":"null value in column \"name\" of relation
//        \"profiles\" violates not-null constraint"}
//
// An upsert is an INSERT that falls back to an UPDATE. PostgREST builds the
// INSERT row FIRST, and Postgres checks NOT NULL on it before the conflict is
// ever reached. So a save of two columns proposes a row with no name and is
// refused - even though the row exists and only needed updating.
//
// FOUR THINGS SHIPPED THAT DAY WROTE NOTHING: the brutally honest critique, the
// pledge, the consultation answer from the setup screen, the same answer from
// the Today card, and the push token. Every one failed quietly, and quiet read
// as "the feature never ran".
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i);
  if(j<0) throw new Error('stale end anchor: '+b); return src.slice(i,j); }

console.log('\n  THERE IS ONE WAY TO SAVE PART OF A PROFILE:');
const fn=slice('async function sbPatchProfile(fields){','async function sbUpsert(');
t(/method:'PATCH'/.test(fn), 'it is a PATCH, which has no INSERT arm');
t(/profiles\?client_code=eq\.'\+encodeURIComponent\(cl\.code\)/.test(fn), 'aimed at their own row');
t(/if\(!cl \|\| !cl\.code\) return false;/.test(fn), 'and nothing is sent without a client');
t(/!Object\.keys\(fields\)\.length\) return false/.test(fn), 'or with nothing to say');
t(/console\.error\('patch to profiles failed'/.test(fn),
  'a refusal is printed with the server’s own words');
t(/String\(b\|\|''\)\.slice\(0,300\)/.test(fn), '  including the body, which is where the reason lives');
t(/console\.error\('patch to profiles threw'/.test(fn), 'and a throw is printed too');

console.log('\n  AND EVERY PARTIAL WRITER USES IT:');
[['_appStamp','the build stamp'],
 ['_pushNote','what push did'],
 ['_pushSaveToken','the push token'],
 ['_obPatchIntake','the critique and the pledge'],
 ['_ctaMergeIntake','the consultation answer']].forEach(function(p){
  const body=slice('function '+p[0]+'(', '\n}\n');
  t(/sbPatchProfile\(/.test(body), '  '+p[1]);
  t(!/sbUpsert\('profiles'/.test(body), '    and no longer upserts', p[0]);
});

console.log('\n  AND jsonb IS SENT AS jsonb:');
/* intake_json is a jsonb column. Hand it text and it stores a jsonb STRING, so
   the row reads back as one quoted blob and every query that looks inside it
   finds nothing - which is how a working write got read as a failed one. */
t(!/sbPatchProfile\(\{intake_json:js\}\)/.test(src), 'no writer stringifies it first');
t((src.match(/sbPatchProfile\(\{intake_json:base\}\)/g)||[]).length===4,
  'all four hand over the object itself',
  String((src.match(/sbPatchProfile\(\{intake_json:base\}\)/g)||[]).length));
/* Older rows are already double-wrapped, so every reader still copes. */
t(/if\(typeof cur==='string'\) base=JSON\.parse\(cur\)\|\|\{\};/.test(src),
  'and readers still cope with the rows that are already wrapped');

console.log('\n  THE WRITERS THAT ALWAYS WORKED STILL CARRY A NAME:');
/* Two upserts in this file pass name and have never failed. They are the proof
   of the diagnosis, so they are asserted rather than converted. */
const named=(src.match(/var row=\{client_code:cl\.code, name:/g)||[]).length;
t(named>=2, 'the full-row upserts still send a name', String(named));

console.log('\n  NOTHING PARTIAL UPSERTS A PROFILE ANY MORE:');
const bare=(src.match(/\{client_code:cl\.code, (?!name:)[a-z_]+:[^}]*\}[\s\S]{0,120}?sbUpsert\('profiles'/g)||[]);
t(bare.length===0, 'no partial row is sent to an upsert', String(bare.length));

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (a partial save is an update)\n');
process.exit(bad?1:0);
