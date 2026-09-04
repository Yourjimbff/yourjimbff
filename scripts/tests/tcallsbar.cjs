// "IT SAYS CALLS DONE FOR TODAY AND THEYRE NOT" (Yusuf, 4 Sep).
//
// He had a 4pm consult and a 6pm call on his calendar and the bar over the nav
// said the day was finished. Measured live on the served file at 2:52pm ET:
//
//   bookings table          booking id 31, gabriele1, 22:00Z, status booked
//   trainerOp bookingsAll   returns it, 25 rows
//   loadBookings()          returns 15 rows and NOT id 31
//   the calls bar           "Calls done for today"
//
// loadBookings(force) keeps a module cache and re-reads only when told. Every
// other source inside _schSources honours the force it is handed - consults and
// vip go through the door on each forced pass, which is why a consult inserted
// during the same session appeared at once and a booking never did. This one
// line asked with no argument, so the bar was reading a snapshot taken when the
// app opened, for as long as it stayed open.
//
// Same shape as the roster promise in .016: a loader that reads once, and a
// caller with no way to say "again".
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// Bounded at the next top-level function so the sweep below cannot wander into
// unrelated code and report a loadBookings() call that is not this one's.
const _ssAt=src.indexOf('async function _schSources(force){');
const _ssEnd=src.indexOf('\nasync function _schDay(', _ssAt);
const ss=src.slice(_ssAt, _ssEnd>0?_ssEnd:_ssAt+9000);

console.log('  the forced refresh reaches every source, bookings included:');
t(ss.length>500,                          '_schSources is findable and takes force');
t(/loadBookings\(!!force\)/.test(ss),      'the bookings read is handed the force');
// CODE ONLY. The ruling above this read names loadBookings() in prose twice, and
// a sweep that counts those is measuring the comment, not the call.
const ssCode=ss.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/[^\n]*/g,' ');
t(!/loadBookings\(\)/.test(ssCode),        'and no read in here asks with no argument at all',
  (ssCode.match(/loadBookings\([^)]*\)/g)||[]).join(' '));
t(/trainerOp\('consultList'|consultList/.test(ss) || /consults/.test(ss),
                                          'consults are read in the same pass');

console.log('\n  and the loader still honours it:');
const lb=src.slice(src.indexOf('async function loadBookings(force){'),
                   src.indexOf('async function loadBookings(force){')+1600);
t(lb.length>200,                          'loadBookings takes force');
t(/if\(_bookCache && !force\) return _bookCache;/.test(lb),
                                          'and only serves the cache when it is NOT forced');
t(/_bookCache = rows\.filter/.test(lb),   'a forced pass replaces the cache rather than appending');
t(/window\._bookCacheAll=_bookCache/.test(lb),
                                          'and the engagement derivation sees the same rows');

console.log('\n  the bar only claims the day is done off what it actually read:');
const bar=src.slice(src.indexOf("html='No calls today'")-900, src.indexOf("html='No calls today'")+400);
t(/today\.failed/.test(bar),              'a failed read is said out loud, never drawn as an empty day');
t(/Calls done for today/.test(bar),       'the done line exists');
t(/left\.length/.test(bar),               'and is decided by what is still ahead, not by the clock alone');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
