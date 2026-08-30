// NUMBERS ARE NEVER CUT (Yusuf, order, 30 Aug) — the macro line, run against
// the shipped builder rather than a copy of it.
//
// The order's rule has two halves and this file only tests the half that is
// arithmetic: a macro line may break BETWEEN its values and never inside one.
// The other half — that the line then takes its own row under the title rather
// than running off the card — is layout, and layout is proved in a browser at
// a real width, not here.
//
// The trap this guards is that the fix is invisible: a non-breaking space and a
// normal space look identical in a report and render identically in this font.
// So every assertion below is about CODE POINTS, and the last one re-derives the
// original string from the bound one to prove nothing was added or dropped.
const {closure}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const NB=' ', DOT='·', SEP=' '+DOT+' ';

// ===== LIFTED FROM index.html ==========================================
const {code, names, unresolved} = closure(['_feedNumBind','_mealMacLine']);
eval(code);
t(names.indexOf('_feedNumBind')>=0, 'lifted _feedNumBind', names.join(','));
t(names.indexOf('_mealMacLine')>=0, 'lifted _mealMacLine');
t(unresolved.length===0, 'no unresolved names in the lifted closure', unresolved.join(','));

// THE DELIBERATELY-FAKE CONTROL. If the lifter quietly returned '' for a real
// name the suite would still pass on stubs, so a name that CANNOT exist has to
// come back empty — that is what makes the two lifts above mean anything.
const ctl = closure(['_feedNumBindNotAThing']);
t(ctl.code==='', 'control: a name that does not exist lifts to nothing', JSON.stringify(ctl.code.slice(0,40)));

// ===== THE LIVE CASE FROM THE ORDER ====================================
// Ali Mohammed, 30 Aug, Snack — the row he reported.
const BAR={calories:200, protein:20, carbs:5, fat:9};
const raw = _mealMacLine(BAR,'short',{time:false});
const bound = _feedNumBind(raw);

t(raw==='200 cal '+DOT+' 20g P '+DOT+' 5g C '+DOT+' 9g F', 'the builder still prints the same line', JSON.stringify(raw));
t(bound==='200'+NB+'cal '+DOT+' 20g'+NB+'P '+DOT+' 5g'+NB+'C '+DOT+' 9g'+NB+'F',
  'every value is bound, every separator is not', JSON.stringify(bound));

// ===== THE TWO PROPERTIES THAT MATTER ==================================
// 1. No plain space survives inside a value, so no value can be split.
const segs = bound.split(SEP);
t(segs.length===4, 'four values', String(segs.length));
t(segs.every(s=>s.indexOf(' ')<0), 'no value contains a breakable space');
t(segs.every(s=>s.indexOf(NB)>=0), 'every value here binds its unit');

// 2. Exactly the separators stay breakable: two plain spaces per separator.
const plain = (bound.match(/ /g)||[]).length;
t(plain === 2*(segs.length-1), 'breakable spaces == 2 per separator, no more', String(plain));

// 3. NOTHING WAS ADDED OR DROPPED. Undo the binding and the original returns
//    character for character — the fix cannot silently rewrite a figure.
t(bound.split(NB).join(' ')===raw, 'reversible: NBSP back to space rebuilds the source exactly');
t(bound.length===raw.length, 'same length, so nothing was inserted', bound.length+' vs '+raw.length);

// ===== THE OTHER SHAPES THE SAME LINE TAKES ============================
// Long units, on the client-facing style.
const lraw=_mealMacLine(BAR,'long',{time:false}), lb=_feedNumBind(lraw);
t(lb==='200'+NB+'cal '+DOT+' 20g'+NB+'protein '+DOT+' 5g'+NB+'carbs '+DOT+' 9g'+NB+'fat',
  'long units bind too', JSON.stringify(lb));

// A time token is a value like any other and must not break across lines.
const traw=_mealMacLine({calories:200, protein:20, eat_time:'3:30 PM'},'short',{});
const tb=_feedNumBind(traw);
t(tb==='200'+NB+'cal '+DOT+' 20g'+NB+'P '+DOT+' 3:30'+NB+'PM', 'a clock binds as one value', JSON.stringify(tb));

// The weigh-in row: a figure and its unit, no separator at all.
t(_feedNumBind('192.4 lb')==='192.4'+NB+'lb', 'a weight binds its unit', JSON.stringify(_feedNumBind('192.4 lb')));
t(_feedNumBind('192.4 lb').indexOf(' ')<0, 'a weight has nowhere to break');

// A day total runs to four figures and is grouped — same law, same shape.
const graw=_mealMacLine({calories:2625, protein:203, carbs:132, fat:84},'short',{time:false, group:true});
t(_feedNumBind(graw).split(SEP).every(s=>s.indexOf(' ')<0), 'a grouped four-figure total binds', JSON.stringify(_feedNumBind(graw)));

// ===== THE EMPTY AND BROKEN CASES ======================================
// _mealMacLine returns '' for a meal with nothing recorded, and the row then
// prints no meta at all. The binder must not turn that into a space or a "null".
t(_feedNumBind('')==='', 'empty stays empty');
t(_feedNumBind(null)==='', 'null is not the word null', JSON.stringify(_feedNumBind(null)));
t(_feedNumBind(undefined)==='', 'undefined is not the word undefined', JSON.stringify(_feedNumBind(undefined)));
t(_feedNumBind(_mealMacLine({},'short',{time:false}))==='', 'a meal with no macros prints nothing');

// A single value with no separator, and a value with no unit.
t(_feedNumBind('200 cal')==='200'+NB+'cal', 'one value alone');
t(_feedNumBind('front')==='front', 'a one-word string is untouched');

// A three-word value binds both of its spaces — nothing may break inside a value
// however many words it has.
t(_feedNumBind('1 large egg')==='1'+NB+'large'+NB+'egg', 'a three-word value binds throughout');

// ===== THE CALL SITES ==================================================
// The two feed surfaces must BOTH go through the binder — shipping to one is the
// mistake this codebase repeats. Read from the file, not from the closure.
const src=require('fs').readFileSync('index.html','utf8');
t(src.indexOf("meta = _feedNumBind(_mealMacLine(d,'short',{time:false}));")>=0,
  'cockpit row (_pfDayRow) binds its macro line');
t(src.indexOf("_feedNumBind(_mealMacLine(f,'short',{time:false}))")>=0,
  'phone tile (_feedItemHtml) binds its macro line');
t(!/body\.jv-on \.pfDayMeta\{[^}]*white-space:nowrap/.test(src),
  'the cockpit macro line is no longer unwrappable');
t(/body\.jv-on \.pfDayMeta\{[^}]*font-variant-numeric:tabular-nums/.test(src),
  'and it kept its tabular figures');

console.log(bad? ('\nFAILED '+bad) : '\nall passed');
process.exit(bad?1:0);
