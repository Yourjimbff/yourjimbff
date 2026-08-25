// NO STATUS HEADERS. HE TALKS. — permanent (Yusuf, ruling, 25 Aug).
//
// His answer came back with labelled sections stamped across it: "WAITING ON
// YOU" in gold above one part, "COULD NOT PLACE" in red above another, results
// as bullets underneath. That is the engine's own bookkeeping printed on his
// screen. He does not need to know which part of his question was classified as
// pending and which as failed — it reads like a system log, not like a person
// answering, and it is the same disease as a version number in a report.
//
// The rule is absolute and it covers the voice too: no headers, no section
// labels, no stamped categories, no count recital. Results are plain lines in
// one voice, and anything that did not work is said last in its own sentence.
//
// This is structural because the failure is a RENDERING, and a rendering has no
// return value to assert. What can be held is that nothing builds one.
const fs=require('fs');
const raw=fs.readFileSync('index.html','utf8');
const _a=raw.indexOf('<script>'), _b=raw.lastIndexOf('</script>');
const js=(_a>=0 && _b>_a) ? raw.slice(_a,_b) : raw;
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  nothing builds a status heading:');
t(!/_jtHeadHtml/.test(raw), 'the heading builder is gone');
t(!/jtSumH/.test(raw), 'its class is gone, markup and stylesheet both');
t(!/jtNone/.test(raw), 'and the empty-group class with it');
t(!/_useLedger/.test(js), 'the ledger branch is gone');

console.log('\n  the labels themselves are not emitted anywhere:');
// Each of these is the LABEL as it was rendered — a quoted string handed to a
// heading. The words may appear in prose or in a comment; what may never come
// back is one being emitted as a category of its own.
[["'Waiting on you'", /'Waiting on you'/],
 ["'Could not place'", /'Could not place'/],
 ["'Done', done", /'Done'\s*,\s*done/]
].forEach(function(c){ t(!c[1].test(js), 'never emitted: '+c[0]); });

console.log('\n  and the voice does not read a ledger out loud:');
t(!/\+' waiting on you'/.test(js), 'no spoken "N waiting on you"');
t(!/\+' I could not place'/.test(js), 'no spoken "N I could not place"');
t(!/_sp\.push\(done\.length/.test(js), 'no spoken count recital at all');

console.log('\n  what replaced it — one voice, failures last:');
const B=(js.match(/NO STATUS HEADERS\. HE TALKS\.[\s\S]{0,3000}?return \{html:html, speak:spoken\};/)||[''])[0];
t(!!B, 'the batch answer is findable');
t(/var _say=done\.concat\(wait\)\.concat\(lost\)/.test(B), 'screen: landed first, could-not-place last');
t(/join\('<br><br>'\)/.test(B), 'plain lines, no list markup');
t(/var spoken=done\.concat\(wait\)\.concat\(lost\)/.test(B), 'the voice reads the same lines in the same order');
t(!/jtSum/.test(B), 'and nothing in it wears a summary class');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
