// A SECOND FUNCTION OF THE SAME NAME SILENTLY EATS THE FIRST.
//
// Caught on 15 Sep while building the workout merge. A helper called _woKey was
// added at line ~63,972 to normalise a movement name. _woKey already existed at
// line 53,673 and built the workout DRAFT storage key. The file has one scope,
// so the later declaration wins for everything below it, and the draft key
// would have quietly started returning a movement name instead of
// "wodraft:<code>:<date>" - losing somebody's half-typed workout with nothing
// on screen to say so.
//
// It was caught by a unit test asserting case-insensitivity, which failed for a
// reason that had nothing to do with case. That is luck, not a process.
//
// CLAUDE.md already names this landmine for element ids: "Duplicate element IDs
// silently grab the wrong element. Check for collisions before adding markup."
// The same hazard has always been here for the 3,961 top-level functions in
// this file and nothing checked it. Now something does.
//
// node --check cannot help: two `function f(){}` declarations in one scope are
// perfectly legal JavaScript. That is exactly what makes this quiet.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined?('  '+extra):'')); };

const at={}, dup={};
L.forEach(function(l,i){
  // Top-level only - column 0. A nested function is in its own scope and may
  // legitimately share a name with one outside it.
  const m=/^(?:async )?function ([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/.exec(l);
  if(!m) return;
  const n=m[1];
  if(at[n]!==undefined){ (dup[n]=dup[n]||[at[n]]).push(i+1); }
  else at[n]=i+1;
});
const names=Object.keys(dup);
const total=Object.keys(at).length;

console.log('\n  ONE NAME, ONE FUNCTION:');
t(total>3000, 'the file was read and the functions found', total+' top-level functions');
names.forEach(function(n){
  t(false, '  '+n+' is declared more than once - the later one wins and the earlier is gone',
    'lines '+dup[n].join(', '));
});
t(names.length===0, 'no top-level function name is declared twice',
  names.length ? (names.length+' collisions') : 'none');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all passed');
process.exit(bad?1:0);
