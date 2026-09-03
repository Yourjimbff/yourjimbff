// THE WEEK STRIP BELONGS TO WHOEVER IS LOOKING AT THE DAY PAGE.
// (Yusuf, 3 Sep: "why the fuck do i have a different view on the main day page
// than clients? theres a section header up top that shows the days of the week
// theyve logged and i dont ... theres also quite a bit of dead space for me at
// the top.")
//
// It had been gated to non-trainers, with no comment saying why. Two costs, and
// he found both in one glance: his own week was invisible to him, and the 70px
// the strip occupies sat empty on his page instead.
//
// This pins the gate open. The strip is built from _tlNavCtx, which is assigned
// BEFORE the gate and never asks who the viewer is -- so there was never a data
// reason for the split, only the line.
const fs = require('fs');
const src = fs.readFileSync('index.html', 'utf8');
let bad = 0, n = 0;
const t = (ok, msg, got) => { n++; if (!ok) bad++; console.log((ok ? '  ok    ' : '  FAIL  ') + msg + (got != null ? ('  ' + got) : '')); };

console.log('\nTHE GATE IS OPEN TO BOTH:');
const m = /var _navOn=false;\s*\n\s*try\{ _navOn = ([^;]+); \}catch\(e\)\{ _navOn=false; \}/.exec(src);
t(!!m, 'the _navOn gate is still where it was (seam intact)');
if (m) {
  t(!/isTrainer/.test(m[1]), 'it does NOT ask whether the viewer is the trainer', m[1].trim());
  t(/\bcl\b/.test(m[1]), 'it still requires somebody to be signed in', m[1].trim());
}

console.log('\nAND THE PAGE STILL GIVES UP THE STRIP’S OWN HEIGHT, so no dead space either way:');
t(/document\.body\.classList\.toggle\('tlwnav', _navOn\)/.test(src),
  'the body class follows the same flag the strip does');
t(/body\.tlwnav #tlScroll\{height:calc\(100vh - 220px\)/.test(src),
  'and the scroller shortens by exactly the strip’s height when it is on');

console.log('\nTHE STRIP ITSELF IS UNCHANGED -- this commit moved a gate, not a design:');
t(/function _tlWeekNavHtml\(\)\{/.test(src), '_tlWeekNavHtml still exists');
t(/var ctx=window\._tlNavCtx; if\(!ctx \|\| !ctx\.today\) return '';/.test(src),
  'it still refuses to draw without a context, rather than drawing an empty week');
t(/window\._tlNavCtx=\{today:today, fByDay:fByDay, wByDay:wByDay, gByDay:gByDay\};/.test(src),
  'the context is built from the render’s own maps, for whoever is signed in');
const ctxAt = src.indexOf('window._tlNavCtx={today:today'), gateAt = src.indexOf('var _navOn=false;');
t(ctxAt > 0 && gateAt > ctxAt, 'and it is built BEFORE the gate, which is why the gate was never load-bearing');
t(/aria-current="date"/.test(src), 'today is still announced to a screen reader');

console.log('\n' + (n - bad) + '/' + n + ' passed');
console.log('tweeknav: ' + (bad ? 'FAIL' : 'ok'));
process.exit(bad ? 1 : 0);
