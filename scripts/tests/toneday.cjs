// ONE DAY ON THE SCREEN, AND THE DIAL TURNS BETWEEN THEM.
// (Yusuf, 3 Sep: "if we have that dial up top, that rotary, we might as well
// get rid of the scroll.")
//
// He is right, and the corridor was always a compromise: nineteen day sections
// stacked in one scroller, each min-height:100% with scroll-snap, so scrolling
// LANDED on a day rather than drifting between two. That is a scrollbar
// imitating a tab bar. The strip is a real one.
//
// The load-bearing risks this pins:
//   · the sections stay in the DOM (hiding is free, re-rendering a day is not)
//   · scrolling WITHIN a day survives — a day is taller than a phone
//   · the dial cannot reach a day the page never rendered
const fs = require('fs');
const SRC = fs.readFileSync('index.html', 'utf8');
let bad = 0, n = 0;
const t = (ok, msg, got) => { n++; if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+msg+(got!=null?('  '+got):'')); };

console.log('\nONE DAY IS SHOWN, AND THE REST ARE HIDDEN RATHER THAN DESTROYED:');
t(/body\.tlone \.tlDaySec\{display:none;\}/.test(SRC), 'every day section is hidden in one-day mode');
t(/body\.tlone \.tlDaySec\.sel\{display:flex;\}/.test(SRC), '...except the selected one');
t(/function _tlShowOnly\(ds\)\{/.test(SRC), 'the selector exists');
t(/secs\[i\]\.classList\.toggle\('sel', on\);/.test(SRC), 'and it works by class, not by removing nodes');
t(!/\.tlDaySec[^{]*\)\.remove\(\)/.test(SRC), 'nothing tears a day section out of the DOM');

console.log('\nTHE CORRIDOR IS GONE BUT THE DAY STILL SCROLLS:');
t(/body\.tlone \.tlDaySec\{min-height:0;scroll-snap-align:none;\}/.test(SRC),
  'min-height:100% and snap are off — both existed only to land the corridor');
t(/body\.tlone #tlScroll\{scroll-snap-type:none;\}/.test(SRC), 'and the scroller stops snapping');
t(!/body\.tlone #tlScroll\{[^}]*overflow:\s*hidden/.test(SRC),
  'but #tlScroll is NOT made unscrollable — a day is taller than a phone');

console.log('\nTHE DIAL CANNOT REACH A DAY THAT WAS NEVER RENDERED:');
// The render window is _tlDaysBack back and _tlDaysFwd forward. An arrow that
// lands outside it is a blank screen with no explanation.
t(/function _tlWeekMin\(\)\{ try\{ return -Math\.floor\(_tlDaysBack\/7\); \}/.test(SRC),
  'the back stop is derived from _tlDaysBack, not typed in');
t(/function _tlWeekMax\(\)\{ try\{ return Math\.floor\(_tlDaysFwd\/7\); \}/.test(SRC),
  'and the forward stop from _tlDaysFwd');
t(/if\(off<_tlWeekMin\(\) \|\| off>_tlWeekMax\(\)\) return;/.test(SRC),
  'tlWeekShift refuses to go past either');
const m = /var _tlDaysBack=(\d+), _tlDaysFwd=(\d+);/.exec(SRC);
t(!!m, 'the window itself is still declared where the stops read it');
if (m) {
  t(Math.floor(+m[1]/7) >= 1, 'and it is at least a week back, so an arrow has somewhere to go',
    m[1]+' days back = '+Math.floor(+m[1]/7)+' weeks');
}

console.log('\nA STOP IS SHOWN, NOT HIDDEN:');
t(/\.tlwArr\.off\{opacity:0\.2;cursor:default;\}/.test(SRC),
  'the disabled arrow dims rather than disappearing');
t(/dis\?'disabled aria-disabled="true" '/.test(SRC), 'and it is really disabled, not just grey');
t(!/\.tlwArr\.off\{[^}]*display:none/.test(SRC),
  'it never vanishes — the row would jump width and the tap would go nowhere');

console.log('\nTURNING THE DIAL NEVER OPENS A DAY THAT HAS NOT HAPPENED:');
t(/if\(!cols\[i\]\.classList\.contains\('ahead'\)\)/.test(SRC),
  'a week that ended mid-week lands on its last real day, not its Saturday');

console.log('\nLANDING AND THE TODAY BUTTON ARE SELECTIONS NOW, NOT SCROLLS:');
t(/if\(_tlOneDay\(\)\)\{\s*var _td='';[\s\S]{0,220}_tlShowOnly\(_td\)/.test(SRC),
  'the opening render selects today instead of computing a scrollTop');
t(/if\(\(window\._tlWeekOff\|0\)!==0\)\{ window\._tlWeekOff=0;/.test(SRC),
  'and the Today button brings the dial back to this week first');
t(/document\.body\.classList\.toggle\('tlone', _navOn\);/.test(SRC),
  'one-day mode and the strip are the same decision, so they cannot disagree');

console.log('\nA DAY IS ALWAYS SELECTED — hiding by default made this load-bearing:');
// This shipped broken for four minutes: 22 day sections in the DOM, 0 visible, a
// blank page under a working strip. The only thing that set the selection was
// _tlLand, which returns EARLY whenever a render is restoring a scroll position
// (`if(_keepScroll!=null){ ... return; }`) — the ordinary path on a tab switch.
// The selection was made on the path I tested and skipped on the path he takes.
t(/function _tlEnsureSel\(\)\{/.test(SRC), 'there is a floor that puts a day on the screen');
t(/if\(sc\.querySelector\('\.tlDaySec\.sel'\)\) return;/.test(SRC),
  'it does nothing when a day is already selected');
t(/try\{ _tlEnsureSel\(\); \}catch\(e\)\{\}\n  _tlLand\(\);/.test(SRC),
  'it runs BEFORE _tlLand, which is the function with the early return');
t(/try\{ _tlEnsureSel\(\); \}catch\(e\)\{\}\n      if\(_keepScroll!=null\)/.test(SRC),
  '...and again inside _tlLand, ahead of the return that caused this');
t((SRC.match(/_tlEnsureSel\(\);/g)||[]).length >= 3,
  'called from more than one place on purpose — a floor that can be branched around is not a floor',
  (SRC.match(/_tlEnsureSel\(\);/g)||[]).length + ' call sites');
t(/for\(var i=secs\.length-1;i>=0;i--\)\{\s*\n\s*if\(secs\[i\]\.classList\.contains\('ahead'\)\) continue;/.test(SRC),
  'and if today is somehow missing it falls back to a real day rather than showing nothing');

console.log('\nAND THE OLD DOOR CLOSES, because the dial replaced it:');
t(/body\.tlone \.tlEarlier\{display:none;\}/.test(SRC), 'the "Earlier" door is hidden in one-day mode');

console.log('\n' + (n-bad) + '/' + n + ' passed');
console.log('toneday: ' + (bad ? 'FAIL' : 'ok'));
process.exit(bad ? 1 : 0);
