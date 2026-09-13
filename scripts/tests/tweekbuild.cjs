// BUILD YOUR WEEK — the free app's planner.
//
// Yusuf, 12 Sep, asked where the build-a-program page was. There wasn't one:
// the Program tab told a free user "No program set up yet" and offered nothing
// that could change that. Asked whether to hold the line off screen one until
// a builder existed, he answered: "Build the fucking workout planner, bro."
//
// THE POINT OF THIS FILE. The seven-day builder is MONTHS old and was already
// written to be client-safe — renderPlanTab set `window._tpCanEdit = true` with
// the comment "clients manage their own plan". It went unreachable when
// CALENDAR_FOR_ALL went true and the Feed tab started drawing the day timeline
// instead. So what these assertions protect is that this stayed a DOOR and
// never became a second builder, and that the door cannot swing open for the
// people the "nothing is invented" ruling protects.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

console.log('\n  IT IS A DOOR, NOT A SECOND BUILDER:');
const op=slice('async function mwpOpen(){','function mwpClose(){');
t(/renderTrainingBuilder\('tpBody'\)/.test(op), 'it renders the builder that already existed');
t(!/_tpDayCard|tpSetType|tpAddEx/.test(op), 'and writes no day card, type pill or exercise row of its own');
const sv=slice('async function mwpSave(){','function renderTrainingBuilder(hostId){');
t(/await saveTrainingPlan\(\)/.test(sv), 'and saves through the save that already existed');
t(!/fetch\(/.test(op+sv), 'neither half opens a write path of its own');
/* The host is deliberately named tpBody: _saveTrainingPlanQuiet REFUSES to
   write unless an element by that name is on screen. Renaming it would route
   around a guard rather than satisfy it. */
t(/id="tpBody"/.test(op), 'the host keeps the name every existing guard checks for');
t(/document\.getElementById\('tpBody'\)/.test(slice('async function _saveTrainingPlanQuiet(){','function _finRepaint')),
  'and that guard is still the one standing in front of the quiet write');

console.log('\n  A COACHING CLIENT CANNOT REACH IT:');
const can=slice('function mwpCanBuild(){','async function mwpOpen(){');
t(/return _meFreeApp\(\);/.test(can), 'only the free app gets the builder');
t(/isTrainer\(cl\.code\)\) return false;/.test(can), 'never a trainer');
t(/if\(window\._tlRO\) return false;/.test(can), 'and never somebody being looked at read-only');
t(/if\(!mwpCanBuild\(\)\) return;/.test(op), 'the door itself asks before it opens');
t(/if\(mwpCanBuild\(\)\)\{/.test(slice('function renderProgramTab(){','function _pnDaysSettle')),
  'and the card is not even drawn for anyone else');

console.log('\n  IT OPENS EMPTY:');
/* Yusuf, 12 Sep, looking at the first build of this: "why is there a program
   on there anyway? Why are there exercises written on there?"
   I got this wrong twice in one night - once by letting a quiet save write a
   test week onto his live account, once by seeding this builder from his sex
   and day count and writing "nothing is yours until you save it" underneath.
   A sentence does not make invented content stop being invented. */
t(/_tpPlan=_mwpBlankWeek\(\);/.test(op), 'a fresh builder is seven empty days');
t(!/_tpDefaultPlan\(\)/.test(op), 'and never _tpDefaultPlan, which guesses a week from a sex and a day count');
const bw=slice('function _mwpBlankWeek(){','function mwpCanBuild');
t(/WEEKDAYS\.forEach\(function\(d\)\{ p\[d\]=\{type:'Rest', ex:\[\]\}; \}\);/.test(bw),
  'every day starts as Rest with nothing on it');
t(/_tpDefaultPlan/.test(src), 'the guess-a-week helper still exists for the trainer side');
t(/Seven empty days/.test(op), 'and the sheet says so plainly');

console.log('\n  THE STARTER WEEK NEVER BECOMES A CLAIM:');
/* The standing ruling: a client with no programme must not be shown a week
   composed from their sex and a day count as though Yusuf assigned it. A
   starter INSIDE an editor they opened on purpose is a different thing from a
   week that appears on their feed. The flag below is what keeps them apart. */
t(/var fresh=\(window\._tpFromServer!==true\);/.test(op),
  'it knows whether a real saved row came back');
const pfd=slice('function _tlPlanForDate(d){','function _tlPlanKeyFor');
t(/if\(!_tpPlan \|\| window\._tpFromServer!==true\) return null;/.test(pfd),
  'the Day feed still refuses to draw a plan that did not come from the server');
t(/window\._tpFromServer=true;/.test(sv),
  'so the flag is only raised AFTER the row is actually written');
t(sv.indexOf('if(!ok){') < sv.indexOf('window._tpFromServer=true;'),
  'and never on a save that failed');

console.log('\n  A FAILED SAVE KEEPS THE WORK:');
t(/if\(b\)\{ b\.textContent='Save'; b\.style\.opacity=''; \}\s*\n\s*return;/.test(sv),
  'the sheet stays open when the write fails');
t(sv.indexOf('return;') < sv.indexOf('mwpClose();'),
  'it returns before it can reach the close');

console.log('\n  EVERY CONTROL IN THE SHEET ACTUALLY REPAINTS:');
/* _finRepaint looks for #tlScroll first and repaints the day timeline when it
   finds one - and the Day tab is still in the DOM behind this sheet. Without
   the line below, every pill and every exercise row would change _tpPlan and
   then appear to do nothing at all. */
const rp=slice('function _tpRepaint(){','function renderTrainingBuilder(hostId){');
t(/if\(window\._mwpOpen && document\.getElementById\('mwpOv'\)\)\{ renderTrainingBuilder\('tpBody'\); return; \}/.test(rp),
  'an open sheet is repainted before anything else is considered');
/* Comment text names _finRepaint while explaining WHY this line comes first,
   so the order is checked against code lines only. */
const rpCode=rp.split('\n').filter(l=>!/^\s*(\/\*|\*|\/\/)/.test(l)).join('\n');
t(rpCode.indexOf('_mwpOpen') < rpCode.indexOf('_finRepaint'),
  'and before _finRepaint can steal it for the day timeline');
t(!/try\{ _tpRepaint\(\); \}catch\(e\)\{\}/.test(rp),
  'and the old last line that called itself forever is gone');
t(/try\{ renderTrainingBuilder\(\); \}catch\(e\)\{\}/.test(rp), 'it falls back to the builder instead');
/* FOUND BY DRIVING IT, NOT BY READING IT. _tpAfterType and tpUndoType each
   carried their OWN copy of the repaint chain and never called _tpRepaint, so
   with the sheet open over the Day tab, changing Monday from Lower to Push
   repainted the timeline BEHIND the sheet and the sheet sat there still saying
   Lower. One door, or the next surface breaks the same way. */
t(!/if\(window\._plEditing\) _plRender\(\); else if\(typeof _finRepaint==='function'\) _finRepaint\(\); else renderTrainingBuilder\(\);/.test(src),
  'no inlined copy of the repaint chain survives anywhere in the file');
t(/try\{ _tpRepaint\(\); \}catch\(e\)\{ try\{ renderTrainingBuilder\(\); \}catch\(_e\)\{\} \}/.test(slice('function _tpAfterType(day, msg){','function tpUndoType(day){')),
  'changing a day type repaints through the one door');
t(/try\{ _tpRepaint\(\); \}catch\(e\)\{\}/.test(slice('function tpUndoType(day){','function tpSet(day,i,k,v){')),
  'and so does undoing it');

console.log('\n  AND NOTHING IS WRITTEN UNTIL THEY PRESS SAVE:');
/* _tpAfterType fires _saveTrainingPlanQuiet on EVERY type change, and the
   sheet's host is called tpBody, so it sailed through that function's guard
   and wrote a week to the server on the first tap of a pill. The sheet says
   "Nothing is yours until you save it" in those words, and a row on the server
   is a week the Day feed draws on the next load. */
const qs=slice('async function _saveTrainingPlanQuiet(){','function _finRepaint');
t(/if\(window\._mwpOpen\) return;/.test(qs), 'the quiet write stands down while the sheet is open');
t(qs.indexOf('if(window._mwpOpen) return;') < qs.indexOf("getElementById('tpBody')"),
  'before the tpBody check the sheet would otherwise satisfy');
t(/_saveTrainingPlanQuiet\(\)/.test(slice('function _tpAfterType(day, msg){','function tpUndoType(day){')),
  'the quiet write is still wired up for the trainer builder, which is whose it is');

console.log('\n  WHAT IT SAVES IS WHAT THE APP ALREADY READS:');
const st=slice('async function saveTrainingPlan(){','// ---- set logging state ----');
t(/training_plans\?on_conflict=client_code/.test(st), 'one row per client, upserted');
t(/plan:_tpPlan/.test(st), 'and the plan column is the same object the builder edits');
t(/var day=ov \|\| _tpPlan\[key\];/.test(pfd),
  'which is what the Day feed reads, week overrides first');

console.log('\n  AND THE SHEET FITS A PHONE:');
t(/\.mwpOv\{position:fixed;inset:0/.test(src), 'it is the whole screen');
t(/\.mwpScroll\{flex:1;overflow-y:auto/.test(src), 'the body scrolls, the header does not');
t(/env\(safe-area-inset-top,0px\)/.test(slice('.mwpTop{','.mwpT{')), 'the header clears the notch');
t(/env\(safe-area-inset-bottom,0px\)/.test(slice('.mwpScroll{','.mwpNote{')), 'and the last day clears the home bar');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (a door, not a second builder)\n');
process.exit(bad?1:0);
