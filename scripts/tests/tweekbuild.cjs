// BUILD YOUR WEEK — retired, and rewritten to guard what actually shipped.
//
// WHAT THIS FILE USED TO BE. On 12 Sep it was written against a planned sheet
// called mwpOpen/mwpSave: a door on the Program tab that would render the
// seven-day builder renderTrainingBuilder already provided. The test was
// committed on its own (d751311 touches nothing but this file) and the sheet
// was never written. It has therefore been RED since the hour it landed —
// twenty-two failing assertions against functions that have never existed in
// index.html, on any commit.
//
// A test that has always failed protects nothing. What it does is train
// everybody running the suite to expect one red file, which is precisely how a
// real failure gets waved through. Found on 16 Sep while shipping the privacy
// gate; retired the moment it was understood rather than left for the next
// person to rediscover.
//
// WHAT REPLACED THE SHEET. On 15 Sep Yusuf watched the served build and said:
// "when i hit the program page: all it says is Your program / Build your
// program / it should go right into their strength and weakness
// questionnaire". So the door stopped being a button on the Program tab and
// became the Program tab itself — _pgAutoBuild opens the questionnaire when
// there is nothing there yet. tbuilder.cjs guards what that questionnaire
// prescribes, movement by movement.
//
// WHAT IS LEFT HERE is the promise the original file was reaching for, tested
// against the thing that exists: a free user with no programme is taken to a
// builder, and nobody else is dragged into one.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

console.log('\n  THE SHEET THAT WAS NEVER BUILT IS NOT PRETENDED TO EXIST:');
t(!/function mwpOpen\(/.test(src), 'there is no mwpOpen, and this file no longer claims there is');
t(!/function mwpSave\(/.test(src), 'nor an mwpSave');

console.log('\n  THE PROGRAM TAB TAKES AN EMPTY WEEK TO THE BUILDER:');
const auto=slice('function _pgAutoBuild(){','function pgBuildStart(');
t(auto.length>0, '_pgAutoBuild exists');
t(/if\(!window\._pgFreeEmpty\) return;/.test(auto),
  'it fires off the same test the empty card was drawn from, not a second opinion');
t(/if\(window\._pgBuilding\) return;/.test(auto), 'and never on top of a builder already open');
t(/if\(now-_pgAutoAt < 60000\) return;/.test(auto),
  'at most once a minute, so it cannot reopen under somebody’s thumb');
t(/if\(document\.getElementById\('msOv'\)\|\|document\.getElementById\('pbOv'\)\) return;/.test(auto),
  'and never over another overlay');
t(/try\{ _pgAutoBuild\(\); \}catch\(e\)\{\}/.test(src), 'renderProgramTab is what calls it');

console.log('\n  AND THE BUILDER IT OPENS IS THE ONE THAT ALREADY EXISTED:');
t(/function renderTrainingBuilder\(hostId\)\{/.test(src), 'renderTrainingBuilder is still the one renderer');
t(/async function saveTrainingPlan\(\)/.test(src), 'and saveTrainingPlan is still the one save');
t(/id="tpBody"/.test(src), 'the host is still named tpBody, which the quiet write checks for');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (retired honestly, and pointed at what shipped)');
process.exit(bad?1:0);
