// EVERY HELPER THIS FILE CALLS ACTUALLY EXISTS — permanent (24 Aug).
//
// A client hit this live, twice: a failed turn called _jimIsTimeout to decide
// what to say, and that function had NEVER EXISTED anywhere in the file. The
// handler threw a ReferenceError of its own, after the typing dots had already
// been cleared, so nothing at all replaced them. No reply, no error, no sign
// anything had failed.
//
// Nothing else could have caught it. node --check parses; it does not resolve
// names. The suites lift only what they are told about. And the call sits in a
// catch block, which is exactly where a name never gets exercised until the day
// it matters most.
//
// So this walks every call to one of this file's OWN helper prefixes and
// asserts the name is declared somewhere. A helper that is called and never
// defined turns the list red.
const fs=require('fs');
const raw=fs.readFileSync('index.html','utf8');
// ONLY THE JAVASCRIPT. Three of this check's first four "findings" were words
// inside a CSS comment and an @container rule — a checker that cries wolf gets
// switched off, which is worse than not having it.
const _a=raw.indexOf('<script>'), _b=raw.lastIndexOf('</script>');
const src=(_a>=0 && _b>_a) ? raw.slice(_a, _b) : raw;

// The file's own naming conventions. Deliberately not every identifier: a bare
// name could be a browser global, a library, or a local. These prefixes are
// ours, so a missing one is always a bug and never a false alarm.
const CALL=/\b(_jim|_jv|_jt|_wk|_pw|_cb|_sch|_bf|_tl|_tp|_ml|_rs|_mst|_mw|_cev|_fw|jim|jv)[A-Za-z0-9_]*\s*\(/g;
// A NAME IS DECLARED FOUR WAYS HERE, and the first version of this check knew
// only two — so it cried wolf on _mstOff, which is the SECOND declarator in a
// `var _mst={}, _mstOff=function(){}` pair. Verified by reading the line rather
// than trusting the tool, which is the only reason nothing was "fixed" that was
// never broken.
const DECL=new RegExp(
  '(?:^|[^A-Za-z0-9_.])(?:async\\s+)?function\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\('
  +'|(?:^|[^A-Za-z0-9_.])(?:var|let|const)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*='
  +'|,\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=' 
  +'|([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*function\\s*\\('
  +'|window\\.([A-Za-z_][A-Za-z0-9_]*)\\s*=', 'g');

const declared=new Set();
let d; while((d=DECL.exec(src))!==null){ declared.add(d[1]||d[2]||d[3]||d[4]||d[5]); }
// Names introduced as function parameters or object keys are not declarations,
// but the prefixes above are only ever used for top-level helpers in this file,
// so anything genuinely missing shows up here and nothing else does.

const called=new Set();
let c; while((c=CALL.exec(src))!==null){
  const nm=c[0].replace(/\s*\($/,'');
  // A method call (`x._jimThing(`) belongs to an object, not to this file.
  const before=src[c.index-1];
  if(before==='.') continue;
  called.add(nm);
}

const missing=[...called].filter(n=>!declared.has(n)).sort();
let bad=0;
console.log('  '+called.size+' helper calls checked against '+declared.size+' declarations');
if(missing.length){
  bad=missing.length;
  missing.forEach(n=>console.log('  FAIL  called but never defined: '+n));
  console.log('        this is what left a client staring at their own message.');
}else{
  console.log('  ok    every helper called in this file is defined somewhere in it');
}
// The one that actually happened, pinned by name so it can never come back.
if(!declared.has('_jimIsTimeout')){ bad++; console.log('  FAIL  _jimIsTimeout is missing again'); }
else console.log('  ok    _jimIsTimeout is defined');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
