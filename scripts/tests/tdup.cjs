// NO TWO FUNCTIONS MAY SHARE A NAME AT THE TOP LEVEL — permanent (25 Aug).
//
// Found the hard way. A new helper here was called _jvDayKey and returned an
// ISO day; a helper twelve thousand lines further up was ALSO called _jvDayKey
// and returned "Aug 19, 2026". Function declarations hoist, so the later one
// wins for the whole file — the new one silently replaced the old one and every
// existing caller started getting a different string. Nothing threw. check.sh
// passed. It surfaced only because a test happened to assert a real date.
//
// This is the duplicate-element-ID landmine CLAUDE.md already warns about,
// wearing a function's clothes, and it is worse here: five lanes ship into one
// file, so two lanes can each add a plausible helper name and neither diff
// shows the collision. There is no way to notice by reading.
//
// TOP LEVEL ONLY (column zero). A `function row(){}` nested inside another
// function is correctly scoped and there are dozens of those — flagging them
// would make this test noise, and noise gets ignored.
const fs=require('fs');
const raw=fs.readFileSync('index.html','utf8');
const a=raw.indexOf('<script>'), b=raw.lastIndexOf('</script>');
const js=(a>=0 && b>a) ? raw.slice(a,b) : raw;
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const fn={}, va={};
js.split('\n').forEach(function(l,i){
  var m=/^(?:async )?function ([A-Za-z_$][\w$]*)\s*\(/.exec(l);
  if(m){ (fn[m[1]]=fn[m[1]]||[]).push(i+1); return; }
  // A top-level `var X = ...` that shadows a function name is the same fault
  // from the other direction, so the two namespaces are checked together.
  var v=/^var ([A-Za-z_$][\w$]*)\s*=/.exec(l);
  if(v) (va[v[1]]=va[v[1]]||[]).push(i+1);
});

const dupFn=Object.keys(fn).filter(k=>fn[k].length>1);
console.log('  '+Object.keys(fn).length+' top-level functions, '+Object.keys(va).length+' top-level vars:');
t(dupFn.length===0, 'no function name is declared twice',
  dupFn.length?('\n'+dupFn.map(k=>'          '+k+' at lines '+fn[k].join(', ')).join('\n')):'');

// ONE NAMED EXCEPTION, DELIBERATELY VISIBLE RATHER THAN SWALLOWED.
// J_PROMPTS is declared twice and has been for some time: once as an ARRAY of
// three "Placeholder prompt" stubs, and once, further down, as an OBJECT of
// real journal prompts keyed by type. The later assignment wins, so J_PROMPTS
// is the object at runtime and the array is unreachable.
//
// It is NOT currently breaking anything: the array's only consumer, _promptRow,
// is declared and never called from anywhere in the file, and the only
// reference to jUsePrompt is inside the HTML that function would have built. So
// it is latent — the day someone calls _promptRow it does J_PROMPTS.map on an
// object and throws.
//
// Left alone because it belongs to another lane, not because it is fine. Listed
// here by name so the guard can protect everything else from today instead of
// being switched off by whoever hits it next. Delete this entry when the
// duplicate goes; the test will tell you immediately if you deleted it early.
const KNOWN=['J_PROMPTS'];
const dupVa=Object.keys(va).filter(k=>va[k].length>1 && KNOWN.indexOf(k)<0);
t(dupVa.length===0, 'no top-level var is declared twice (bar the one known, named above)',
  dupVa.length?('\n'+dupVa.map(k=>'          '+k+' at lines '+va[k].join(', ')).join('\n')):'');
// And the exception must stay HONEST: if the duplicate is ever fixed, this
// list is stale and says so, rather than quietly excusing a name that is fine.
KNOWN.forEach(function(k){
  t((va[k]||[]).length>1, 'the known duplicate '+k+' is still there — remove it from KNOWN when it goes');
});

const clash=Object.keys(fn).filter(k=>va[k]);
t(clash.length===0, 'and no name is both a function and a var',
  clash.length?('\n'+clash.map(k=>'          '+k+': function at '+fn[k].join(',')+' / var at '+va[k].join(',')).join('\n')):'');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
