// "I logged it morning time, i want to log it when i actually have lunch."
// (Lailee, 11 Sep). She changed the time on the meal and the card stayed under
// Breakfast, so from where she was standing nothing happened: "it did not work".
//
// _mealSlotFor puts the MEAL NAME ahead of the clock and that order is right -
// a client who says "snack" must not have the hour overrule them. What was
// missing is that a name nobody typed, filled in by the hour they logged at,
// has to move when they correct that hour.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

function slice(from,to){ const a=src.indexOf(from); const b=src.indexOf(to,a); return src.slice(a,b); }

// ---- the slot rule itself, lifted and run ----
const ctx={String,Math,Number,Date,window:{},console};
vm.createContext(ctx);
vm.runInContext('var DAY_ROLLOVER_HR=3;', ctx);
vm.runInContext('function _parseClock(s){var m=String(s||"").match(/^(\\d{1,2}):(\\d{2})\\s*([ap])m?/i); if(!m) return null; var h=+m[1]%12; if(/p/i.test(m[3])) h+=12; return {h:h,m:+m[2]};}', ctx);
vm.runInContext('function _tlMins(f){ if(f&&f.eat_time){ var t=_parseClock(f.eat_time); if(t) return t.h*60+t.m; } return 0; }', ctx);
vm.runInContext(slice('function _mealSlotFor(f){','\n\n\n'), ctx);

const slot=(o)=>vm.runInContext('_mealSlotFor('+JSON.stringify(o)+')', ctx);
t(slot({eat_time:'10:31 AM'})==='breakfast', 'a meal with no name at 10:31am is breakfast', slot({eat_time:'10:31 AM'}));
t(slot({eat_time:'2:06 PM'})==='lunch',      'and at 2:06pm it is lunch', slot({eat_time:'2:06 PM'}));
t(slot({eat_time:'7:26 PM'})==='dinner',     'and at 7:26pm it is dinner');
t(slot({meal:'Snack', eat_time:'7:26 PM'})==='snack', 'A SNACK IS A SNACK AT ANY HOUR - the name still wins, and that rule is untouched');
t(slot({meal:'Breakfast', eat_time:'2:06 PM'})==='breakfast', 'and a row that carries a name is still filed by that name');

// ---- the save, read off the source ----
const save=slice('function tlSaveFoodEdit(){','function _tlBindTaps');
t(/window\._edTime0/.test(src), 'the sheet remembers the clock the row arrived with');
t(/_t1 && _t1!==_t0/.test(save), 'nothing moves unless the time actually changed');
t(/!_tagTouched/.test(save), 'and only when she left the meal name exactly as she found it');
t(/!_wasSnack/.test(save), 'never over a snack');
t(/patch\.meal=_named/.test(save), 'then the meal name is rewritten from the new clock');
t(save.indexOf('var _tag=_edReadTag()') < save.indexOf('patch.meal=_named'),
  'and it runs AFTER her own typed meal name, so hers is the one that gets checked');
t(/eat_time:\(document\.getElementById\('editFoodTime'\)\.value\|\|''\)\.trim\(\)/.test(save),
  'the time itself still saves, which it always did');

// The order in _mealSlotFor is load-bearing: name first, clock second.
const rule=slice('function _mealSlotFor(f){','\n\n\n');
t(rule.indexOf("ml.indexOf('snack')") < rule.indexOf('_tlMins(f)'),
  'the snack test still sits ABOVE the clock fallback');

console.log(bad?('\n  '+bad+' FAILED'):'\n  the clock moves the meal with it');
process.exit(bad?1:0);
