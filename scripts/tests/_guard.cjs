// EVERY SUITE ASSERTS WHAT IT LIFTED ACTUALLY ARRIVED (his ruling, 24 Aug).
//
// These suites pull functions and constants OUT of index.html by name and run
// them, which is what makes them test the shipped code rather than a copy. The
// cost is a silent failure mode: when the file grows a dependency a suite was
// never told about, the lifted code hits a guarded call site, falls back, and
// the suite goes GREEN while measuring a path that does not ship.
//
// That happened twice in one day. The first time it hid a real regression — a
// preview line that had disappeared — and only comparing against the deployed
// file caught it. A green list that cannot see the failure is the same disease
// as a confident reply over an empty row.
//
// So nothing runs until every name the suite asked for is actually defined.
// A missing one turns the list RED and says which, instead of lying.
module.exports = function guard(names, resolve){
  var missing = [];
  (names || []).forEach(function(n){
    var v;
    try { v = resolve(n); } catch (e) { missing.push(n); return; }
    if (v === undefined) missing.push(n);
  });
  if (missing.length){
    console.log('  FAIL  lifted from index.html but never arrived: ' + missing.join(', '));
    console.log('        this suite would measure a fallback, not the shipped path.');
    console.log('        Add it to the eval list — do not delete the assertion.');
    process.exit(1);
  }
};
