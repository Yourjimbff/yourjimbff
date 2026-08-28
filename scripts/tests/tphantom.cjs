// A CORRECTION IS NOT A SECOND MEAL — permanent (Yusuf, approved 27 Aug).
//
// THE PHANTOM LOG. One turn comes back carrying BOTH a [FOOD_EDIT] for a meal
// that already exists AND a [FOOD_LOG] naming that same meal, so the row is
// corrected and a duplicate of it is written in the same breath. Seen once, on
// his own account, and reproduced by reasoning rather than on demand — which is
// exactly why the fix had to be enforcement and not a fourth prompt rule.
//
// The prompt has forbidden it in three separate places for weeks. A rule the
// model can see and does not follow is not a mechanism.
//
// THIS SUITE HOLDS BOTH DIRECTIONS, and the second one is the important one.
// Dropping too little leaves a phantom row, which is the bug. Dropping too much
// throws away a meal somebody really ate, which is worse than the bug. So every
// "kept" assertion below is load-bearing: it is the reason this guard is safe
// to run against real clients.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); if(a<0) return ''; let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={};
// ONE eval AT MODULE SCOPE. Evaluating inside a callback scopes the
// declarations to that callback and every assertion below then measures
// nothing (CLAUDE.md, testing-without-a-database).
eval([grab(l=>l.startsWith('function _parseClock(')),
      grab(l=>l.startsWith('function _hhmmAny(')),
      grab(l=>l.startsWith('function _jimPhantomRelogDrops('))].join('\n'));
require('./_guard.cjs')(['_parseClock','_hhmmAny','_jimPhantomRelogDrops'],
  function(n){ return eval(n); });

const DAY='Aug 27, 2026', PREV='Aug 26, 2026';
// The row the turn is editing: his real shape — an id, a name, a slot, a clock.
const TGT=[{id:482, name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM', day:DAY}];
const add=(o)=>Object.assign({i:0, name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM', day:DAY}, o||{});
const run=(a,g)=>_jimPhantomRelogDrops(a, g===undefined?TGT:g);
const dropped=(o)=>run([add(o)]).dropped.length===1;
const kept=(o,g)=>{ const r=run([add(o)],g); return r.keep.length===1 && r.dropped.length===0; };

// ===== 1. THE PHANTOM IS REFUSED =======================================
console.log('  the re-log of a meal this turn is editing does not reach the database:');
t(dropped(), 'same name, same day, same slot, same clock');
t(dropped({eat_time:''}), 'and with no clock on the marker at all');
t(dropped({meal:''}), 'and with no slot on the marker (a blank cannot contradict)');
t(dropped({eat_time:'', meal:''}), 'and with neither');
t(run([add()]).dropped[0].id===482, 'the refusal names the row it collided with');

console.log('\n  the name is matched as a name, not as a string:');
t(dropped({name:'  PANCAKES  '}), 'case and surrounding space');
t(dropped({name:'Pan­cakes'.replace('­','')}), 'plain equality still holds');
t(dropped({name:'Pancakes.'}), 'a trailing full stop');
t(dropped({name:'Pancakes'}), 'exactly');

console.log('\n  and the day is compared as a DATE, never as text:');
t(dropped({day:'2026-08-27T12:00:00'}), 'a timestamp and "Aug 27, 2026" are the same Tuesday');
t(dropped({eat_time:'08:00'}), 'and 08:00 is 8:00 AM');

// ===== 2. WHAT MUST SURVIVE — THE HALF THAT COSTS A REAL MEAL ==========
// HIS SAME-EAT-TIME DUPE LAW (ruling, 27 Aug): two servings of one dish are two
// real meals when the eat times genuinely differ, and one meal logged twice when
// they match. The gap between the logs proves nothing; that discriminator was
// tried and it was wrong.
console.log('\n  a genuine second serving is written, not swallowed:');
t(kept({eat_time:'3:00 PM'}), 'same dish, same day, a clock that genuinely differs');
t(kept({eat_time:'3:00 PM', meal:'Snack'}), 'and again as its own slot');
t(kept({meal:'Dinner'}), 'a different slot, both stated');
t(kept({day:PREV}), 'the same dish on another day');
t(kept({name:'Pancakes & Syrup'}), 'a near miss is a different meal — exact names only');
t(kept({name:'Waffles'}), 'a different dish entirely');

console.log('\n  and nothing is ever refused on less than certainty:');
t(kept({day:''}), 'the add lands on a day nothing could resolve');
t(kept({day:'not a date'}), 'or on a day that will not parse');
t(kept({}, []), 'no edit in this turn at all');
t(run([add()], [{id:9, name:'', meal:'Breakfast', eat_time:'8:00 AM', day:DAY}]).keep.length===1,
  'an id that resolved to no name judges nothing');
t(run([add()], [{id:9, name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM', day:''}]).keep.length===1,
  'an edited row whose own day is unknown judges nothing');
t(run([add({name:''})]).keep.length===1, 'an add with no name is left alone');
t(run([add({name:null})]).keep.length===1, 'and one with no name field at all');

// ===== 3. THE SURVIVORS COME BACK IN ORDER, POINTING AT THEIR OWN ROWS ==
// keep carries the ORIGINAL index, because the caller rebuilds foodAdds.items
// from it. An off-by-one here writes the wrong meal, which is its own cardinal
// lie — a row that landed under a name nobody said.
console.log('\n  the survivors keep their identity:');
const THREE=[{i:0,name:'Eggs',meal:'Breakfast',eat_time:'7:00 AM',day:DAY},
             {i:1,name:'Pancakes',meal:'Breakfast',eat_time:'8:00 AM',day:DAY},
             {i:2,name:'Chicken Salad',meal:'Lunch',eat_time:'1:00 PM',day:DAY}];
const r3=run(THREE);
t(r3.dropped.length===1 && r3.dropped[0].name==='Pancakes', 'the middle one is the phantom');
t(r3.keep.length===2, 'the other two survive');
t(r3.keep[0].i===0 && r3.keep[1].i===2, 'and each still points at its own marker', JSON.stringify(r3.keep.map(k=>k.i)));
t(run([]).keep.length===0 && run([]).dropped.length===0, 'no adds is not an error');

// ===== 4. THE GUARD IS ACTUALLY WIRED, IN THE RIGHT PLACE ==============
// NOT A LIST OF NAMES — the file itself. Today's other lesson: four renderers
// were changed, one of them was called "the feed card", and the real feed row
// was a fifth that nobody had listed. So this reads the shipped call site and
// asserts the ORDER, which is the whole safety property: the drop has to happen
// after the edits are known and before anything is written.
console.log('\n  and it is wired into the turn, before any write:');
const iEdit=src.indexOf("var foodEdits = extractAllMarkers(reply, 'FOOD_EDIT')");
const iCall=src.indexOf('_jimPhantomRelogDrops(_ptAdds, _ptTargets)');
const iWrite=src.indexOf('var aOk = await logFoodFromChat(');
const iApply=src.indexOf('var eOk = await applyFoodEdit(');
t(iEdit>0, 'the FOOD_EDIT markers are extracted');
t(iCall>0, 'the guard is called on the real markers');
t(iCall>iEdit, 'after the edits for this turn are known');
t(iWrite>0 && iCall<iWrite, 'and before a single meal is written');
t(iApply>0 && iApply<iWrite, 'edits still apply before adds, which is what lets a rename be seen');

// THE PIN CHAIN, ASSERTED BY NAME. Judging the raw marker instead of the
// pinned copy is wrong in the one direction that costs a real meal:
// _pinStatedTime fills eat_time and meal OUT OF HIS WORDS when the model left
// them blank, so "fix my 7:30 oatmeal, and I had another bowl at 3" arrives
// here carrying no clock. Read raw it looks like the same sitting and is
// refused; read through the chain it carries 3:00 PM and is written.
const BLOCK=src.slice(iEdit, iWrite);
t(/_pinStatedTime\(_c, _cl\)/.test(BLOCK), 'his stated clock is resolved before the comparison');
t(/_pinDay\(_c\)/.test(BLOCK), 'and his stated day');
t(/_pinClock\(_c\)/.test(BLOCK), "and a caller's own clock");
t(/foodAdds\.items=_ptRes\.keep\.map/.test(BLOCK), 'and only the survivors go on to be written');
t(/catch\(e\)\{ console\.error\('phantom re-log guard'/.test(BLOCK), 'and the guard fails OPEN — a throw keeps every add');

// ===== 5. THE SHIPPED BLOCK, RUN =======================================
// Everything above tests the DECISION. This runs the actual guard: the block
// sliced out of index.html, inside jimTurn's own locals, against the WHOLE pin
// chain resolved statically.
//
// It is here because the first version of this walk was worthless and looked
// fine. _JIM_ANCHOR_SLOTS was not lifted, _jimAnchorSlot threw, _pinStatedTime
// swallowed the throw, and eight assertions passed over a chain with a hole in
// it. _lift.cjs closes the chain from the text for exactly that reason, and the
// smoke checks below exist so a future hole turns this RED instead of green.
const {closure}=require('./_lift.cjs');
const CL=closure(['_pinStatedTime','_jimAnchorDay','_JIM_DAY_MAX','_dateStrDaysAgo','_jimFoodRowById']);
eval(CL.code);
console.log('\n  the whole pin chain arrived (' + CL.names.length + ' names) and WORKS:');
// Every name the chain references that is NOT a top-level definition has to be
// accounted for BY NAME. A hole shows up here as an unexpected entry rather
// than as a null quietly returned from inside a try/catch.
const KNOWN_GLOBALS=['__jimFoodCtxRows'];   // a window property, set by the context builder
const holes=CL.unresolved.filter(n=>KNOWN_GLOBALS.indexOf(n)<0);
t(holes.length===0, 'every name it references is defined, or is a named global', holes.join(', '));
t(_jimAnchorSlot('steak for dinner')==='Dinner', 'the slot anchor answers');
t(_jimStatedMins('I ate at 3pm')===900, 'the clock reader answers');
t(_jimAnchorDay('yesterday I ate eggs')===1, 'the day anchor answers');

const TODAY=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const iEdLine=src.indexOf("  var foodEdits = extractAllMarkers(reply, 'FOOD_EDIT')");
const iDel=src.indexOf("  var foodDeletes = extractAllMarkers(reply, 'FOOD_DELETE')");
const GBLOCK=src.slice(src.indexOf('\n',iEdLine)+1, iDel);
t(/_jimPhantomRelogDrops\(_ptAdds, _ptTargets\)/.test(GBLOCK), 'the shipped block was sliced whole');

let warned=[];
console.warn=function(){ warned.push(Array.prototype.join.call(arguments,' ')); };
const realErr=console.error; console.error=function(){};
function runTurn(text, adds, edits, rows, opts){
  opts=opts||{};
  global.todayFood=rows||[]; global.allFood=rows||[]; global.todayDateStr=TODAY;
  const foodAdds={items:adds.slice()}, foodEdits={items:edits.slice()};
  const _dayPin=(function(){ try{ return _jimAnchorDay(text); }catch(e){ return null; } })();
  function _pinDay(o){
    if(!o) return o;
    if(_dayPin!=null && _dayPin>0){ o.daysAgo=_dayPin; delete o.dateStr; return o; }
    if(!opts.dateStr) return o;
    var _back=Math.max(0, Math.min(_JIM_DAY_MAX, parseInt(o.daysAgo||o.days_ago||0,10)||0));
    if(_back>0) return o;
    o.dateStr=opts.dateStr; return o;
  }
  function _pinClock(o){ if(!o) return o; if(opts.timeLocal){ o.time=opts.timeLocal; o.eat_time=opts.timeLocal; } return o; }
  warned=[];
  eval(GBLOCK);
  return {kept:foodAdds.items, warned:warned.slice()};
}
const ROW={id:482, name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM', date_str:TODAY};
let r;

console.log('\n  his shape -- a correction that also re-logged the meal:');
r=runTurn('the syrup was sugar free so that was more like 450',
  [{name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM', calories:450}], [{id:482, calories:450}], [ROW]);
t(r.kept.length===0, 'the duplicate row is never written');
t(/dropped 1 \[FOOD_LOG\] re-log/.test(r.warned.join(' ')), 'and the console names the row it collided with');

console.log('\n  and the half that would cost a real meal:');
r=runTurn('another stack at 3', [{name:'Pancakes', meal:'Snack', eat_time:'3:00 PM'}], [{id:482, calories:450}], [ROW]);
t(r.kept.length===1, 'a clock that genuinely differs is written');
// THE ONE THAT ONLY SURVIVES BECAUSE THE GUARD RUNS THE PIN CHAIN.
// This add carries NO eat_time. Judged on the raw marker it looks like the same
// sitting and is refused. Judged through _pinStatedTime on its OWN clause it
// carries 3:00 PM, differs from the row, and is written as the second serving
// it is. Removing _pinStatedTime from the guard fails THIS line and no other.
r=runTurn('pancakes were 450, and I had another stack at 3pm',
  [{name:'Pancakes', meal:'Breakfast', words:'I had another stack at 3pm'},
   {name:'Chicken Salad', meal:'Lunch', words:'and a chicken salad'}],
  [{id:482, calories:450}], [ROW]);
t(r.kept.length===2, 'a clock living only in his words still saves the meal', JSON.stringify(r.kept.map(k=>k.name)));

console.log('\n  a correction beside a genuinely different meal:');
r=runTurn('pancakes were 450, and I just had a chicken salad',
  [{name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM'}, {name:'Chicken Salad', meal:'Lunch', eat_time:'1:00 PM'}],
  [{id:482, calories:450}], [ROW]);
t(r.kept.length===1 && r.kept[0].name==='Chicken Salad', 'the salad is written, the phantom is not');

console.log('\n  never refused on a guess, on the real path:');
r=runTurn('fix that one', [{name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM'}], [{id:99999, calories:450}], [ROW]);
t(r.kept.length===1, 'an id that resolves to nothing keeps the add');
r=runTurn('that was 450', [{name:'Pancakes & Syrup', meal:'Breakfast', eat_time:'8:00 AM'}], [{id:482, calories:450}], [ROW]);
t(r.kept.length===1, 'a near-miss name keeps the add');
r=runTurn('yesterday I had pancakes too', [{name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM'}], [{id:482, calories:450}], [ROW]);
t(r.kept.length===1, 'his stated "yesterday" moves the add off the row day and keeps it');

console.log('\n  a rename inside the same edit, and an older row from the stash:');
r=runTurn('call it protein pancakes, 450', [{name:'Protein Pancakes', meal:'Breakfast', eat_time:'8:00 AM'}],
  [{id:482, name:'Protein Pancakes', calories:450}], [ROW]);
t(r.kept.length===0, 'the re-log under the NEW name is refused too');
global.window.__jimFoodCtxRows={'700':{id:700, name:'Chili', meal:'Dinner', eat_time:'7:00 PM', date_str:'Aug 25, 2026'}};
r=runTurn('the chili was 800', [{name:'Chili', meal:'Dinner', eat_time:'7:00 PM', dateStr:'Aug 25, 2026'}], [{id:700, calories:800}], []);
t(r.kept.length===0, 'a correction to a meal from days ago refuses its re-log');
global.window.__jimFoodCtxRows={};

console.log('\n  and it fails OPEN:');
const savedById=_jimFoodRowById;
_jimFoodRowById=function(){ throw new Error('boom'); };
r=runTurn('that was 450', [{name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM'}], [{id:482, calories:450}], [ROW]);
t(r.kept.length===1, 'a throw inside the guard keeps every add, exactly as before it existed');
_jimFoodRowById=savedById; console.error=realErr;

// ===== 6. HIS ACTUAL INCIDENT, END TO END ==============================
// "Can you move the blueberry pancakes I had on Saturday to this morning."
//
// The first cut of this guard did NOT catch this, and it was written to. Two
// things were wrong and both are asserted here so neither can come back.
//
// ONE: the phantom did not come from the model at all. The model behaved
// correctly and emitted a [FOOD_EDIT] with no [FOOD_LOG]. That is precisely the
// shape the NAMED-DAY FALLBACK exists to rescue, so the fallback read "he
// reported eating on a named day and nothing was logged", invented a meal out
// of his REQUEST, and wrote it. _jimExtractMeal returns rating:'unknown' and no
// emoji, which is exactly what the stray row carried.
//
// TWO: it landed on AUG 22 — the day the pancakes had just LEFT — while the
// edit moved the row to Aug 27. Judged against the destination day alone, that
// phantom looks like a different day and survives.
console.log('\n  his own sentence, the one the hold was declared over:');
const SENT='Can you move the blueberry pancakes I had on Saturday to this morning';
// DERIVED, NEVER HARD-CODED. "Saturday" resolves relative to the LOCAL day, so
// it is 5 days back here and 6 in Pacific/Kiritimati, where it is already
// Friday — and it changes again every day this suite runs. An "Aug 22, 2026"
// fixture is green today, red in Kiritimati, and red everywhere next week.
// Assert the PROPERTY: his words point back to a Saturday, and the row sits on
// whichever Saturday that is.
const SATBACK=_jimAnchorDay(SENT);
// AND IT SURVIVES BEING RUN ON A SATURDAY. In Pacific/Kiritimati it is already
// Aug 29 — a Saturday — so his words resolve to 0 days back, not 5. That is
// correct: "the pancakes I had on Saturday" IS today there. The property that
// actually matters is that they land on a SATURDAY, whichever one; the fixture
// then puts the row on an earlier Saturday so the move is still a move.
t(SATBACK!=null && new Date(_dateStrDaysAgo(SATBACK)).getDay()===6,
  'his words anchor to a Saturday, which is what pinned the stray row there',
  SATBACK+' days -> '+_dateStrDaysAgo(SATBACK));
const OLDDAY=_dateStrDaysAgo(SATBACK>0?SATBACK:7);
const PANCAKES={id:900, name:'Blueberry Pancakes', meal:'Breakfast', eat_time:'2:50 PM', date_str:OLDDAY};
const MOVE=[{id:900, date_str:TODAY}];
t(new Date(OLDDAY).getDay()===6 && OLDDAY!==TODAY, 'and the row sits on an earlier Saturday, so the move is a move', OLDDAY);
r=runTurn(SENT, [{name:'Blueberry Pancakes', meal:'Breakfast', calories:450, dateStr:OLDDAY}], MOVE, [PANCAKES]);
t(r.kept.length===0, 'a re-log on the day the meal LEFT is refused');
r=runTurn(SENT, [{name:'Blueberry Pancakes', meal:'Breakfast', calories:450, dateStr:TODAY}], MOVE, [PANCAKES]);
t(r.kept.length===0, 'and so is one on the day it went to');

// THE COUNTERPART. Judging both days widens what this refuses, so it has to be
// shown NOT to swallow a real meal that genuinely belongs on the old day.
console.log('\n  and a real meal on that same old day is still written:');
r=runTurn(SENT, [{name:'Chicken Salad', meal:'Lunch', eat_time:'1:00 PM', dateStr:OLDDAY}], MOVE, [PANCAKES]);
t(r.kept.length===1, 'a different dish on the day it left');
// NOT a Snack fixture on his bare sentence: "this morning" anchors the slot to
// Breakfast and deletes the clock, so the writer would file it as a breakfast on
// that day whatever the marker said, and refusing it is his same-eat-time law.
// The shape where a second helping really does survive is the multi-entry one,
// each marker judged on its own clause.
r=runTurn(SENT+' and I also had pancakes again that night',
  [{name:'Blueberry Pancakes', meal:'Breakfast', words:'move the blueberry pancakes I had on Saturday to this morning'},
   {name:'Blueberry Pancakes', meal:'Snack', eat_time:'9:00 PM', words:'I also had pancakes again that night'}],
  MOVE, [PANCAKES]);
t(r.kept.length===1 && r.kept[0].meal==='Snack',
  'and the same dish there at a clock that genuinely differs', JSON.stringify(r.kept.map(k=>k.meal+'@'+(k.eat_time||'-'))));
// An edit that is NOT a move must still be judged on ONE day, not two.
r=runTurn('that was 450', [{name:'Pancakes', meal:'Breakfast', eat_time:'8:00 AM'}], [{id:482, calories:450}], [ROW]);
t(r.kept.length===0, 'a plain correction still refuses its own re-log');

// ===== 7. THE FALLBACK THAT INVENTED IT IS SHUT ON A CORRECTION =========
// The guard above is the second line of defence. The first is that the meal is
// never invented in the first place: a turn that edited a meal has already been
// handled, and the fallback's own charter is the case where the model filed
// NOTHING. An edit is not nothing.
console.log('\n  and the fallback never invents a meal on a turn that corrected one:');
t(/var _rawReplyHadEditTag = \/\\\[FOOD_EDIT\\\]\/\.test\(_rawReply\);/.test(src),
  'the turn knows whether it carried a correction');
// SEARCHED FORWARD FROM THE START INDEX. 'ONE SITTING = ONE MEAL' also appears
// in the prompt text far earlier in the file, so a bare indexOf ran the slice
// backwards and handed back an empty string that passed nothing.
const iFb=src.indexOf('var _fbFired=false');
const FB=src.slice(iFb, src.indexOf('ONE SITTING = ONE MEAL, ENFORCED', iFb));
t(iFb>0 && FB.length>200 && FB.length<4000, 'the fallback block was sliced, forwards', 'len='+FB.length);
t(/!_rawReplyHadEditTag/.test(FB), 'and the named-day fallback is shut when it did');
t(/!foodAdds\.items\.length && !_rawReplyHadFoodTag && !_rawReplyHadEditTag && !hasPhoto/.test(FB),
  'on the same condition line as its other three guards');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
