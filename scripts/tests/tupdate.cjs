// THE PHONE THAT NEVER UPDATES (Yusuf, 4 Sep: "searching within the crm still
// doesnt work").
//
// The search was fine. It was proven working on the served file the same hour,
// on the real board, with the real roster: typing "mica" took the chips to 1
// and drew Micaela's row with her send button on it. What was NOT fine is that
// his phone was not running that file, and had not been for days - he was on
// .966 while .986 was live.
//
// THE CAUSE, found in the boot path:
//   window._updateDeferred = true;
// written in exactly one place, read in ZERO. A dead flag.
//
// Boot runs Promise.race([checkForUpdate(), 1500ms]). On a slow phone the
// /VERSION fetch loses that race, boot carries on and sets _authBusy, and the
// awaited checkForUpdate resumes into the _authBusy branch, sets the dead flag
// and returns. Its own comment promised "the update is simply taken on the next
// launch". Nothing took it. The next launch lost the same race the same way.
//
// Every fix in this file is invisible to a phone that never updates, so this
// outranks whatever it was that sent me looking.
const fs = require('fs');
const SRC = fs.readFileSync('index.html', 'utf8');
let bad = 0, n = 0;
const t = (ok, msg, got) => { n++; if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+msg+(got!=null?('  '+got):'')); };

console.log('\nTHE FLAG IS READ, NOT JUST WRITTEN:');
const writes = (SRC.match(/window\._updateDeferred\s*=\s*true/g)||[]).length;
const reads  = (SRC.match(/if\(window\._updateDeferred\)/g)||[]).length;
t(writes >= 1, 'something still defers the update when a sign-in is in flight', writes+' write(s)');
t(reads  >= 1, 'and something now ACTS on that deferral', reads+' read(s)');
t(reads > 0, 'a write with no read is the whole bug — it must never come back');

console.log('\nTHE PICK-UP RUNS AFTER SIGN-IN, NOT DURING IT:');
// checkForUpdate refuses to navigate through a sign-in and is right to; that
// guard exists because it once booted the wrong person. Refusing has to mean
// later, not never.
t(/finally\{ window\._authBusy = false; \}\s*\n\s*\/\* THE PICK-UP[\s\S]{0,400}if\(window\._updateDeferred\)\{/.test(SRC),
  'the pick-up sits immediately after _authBusy is cleared');
t(/window\._updateDeferred = false;\s*\n\s*try\{ await checkForUpdate\(\); \}catch\(e\)\{\}/.test(SRC),
  'it clears the flag before re-checking, so it cannot loop');

console.log('\nAND THE GUARDS THAT EXIST FOR GOOD REASONS ARE UNTOUCHED:');
t(/if\(sessionStorage\.getItem\('yjb_just_updated'\)\)/.test(SRC),
  'the one-reload-per-session guard still stands');
t(/_hasActiveWoDraft==='function' && _hasActiveWoDraft\(\)\)\{ return; \}/.test(SRC),
  'a workout in progress still refuses to be reloaded out from under');
t(/if\(window\._authBusy\)\{ window\._updateDeferred = true; return; \}/.test(SRC),
  'and a sign-in in flight is still never navigated through');

console.log('\nTHE VERSION READ ITSELF IS STILL CHEAP AND STILL FUSSY:');
t(/fetch\('\/VERSION\?v='\+Date\.now\(\), \{cache:'no-store'/.test(SRC),
  '/VERSION is fetched with no-store, so a cache cannot answer it');
t(/if\(_VER_RE\.test\(t\)\) return t;/.test(SRC),
  'and only something shaped like a version counts, so a styled 404 cannot trigger a reload loop');

console.log('\n' + (n-bad) + '/' + n + ' passed');
console.log('tupdate: ' + (bad ? 'FAIL' : 'ok'));
process.exit(bad ? 1 : 0);
