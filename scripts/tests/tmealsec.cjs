// THE MEAL SECTION (Yusuf, 3 Sep: "creating the meal section of the app
// encouraging to log food", after "MIght be worth it to add a meal header /
// section on the day page").
//
// The thing this suite mostly guards is a NEGATIVE. This page used to draw an
// empty box for every slot that had not happened yet -- walk, breakfast, lunch,
// workout, dinner -- and that was torn out on purpose: "Five things you hadn't
// done, before you'd done anything." A meal section is the obvious place to put
// them straight back. It must not.
const fs = require('fs');
const L = fs.readFileSync('index.html', 'utf8').split('\n');
const SRC = L.join('\n');
function lift(name){ const s=L.findIndex(l=>l.startsWith('function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name);
  let d=0,st=false;
  for(let i=s;i<L.length;i++){ for(const c of L[i]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return L.slice(s,i+1).join('\n'); }
  throw new Error('SEAM MOVED: close of '+name); }
function one(sw){ const l=L.find(x=>x.startsWith(sw)); if(l==null) throw new Error('SEAM MOVED: '+sw); return l; }

// _tlMealSection reads window._tlRO, and in a browser `window` is always there.
// Without this the whole function threw ReferenceError into its own catch and
// returned '' for every case -- which reads exactly like "an empty day draws
// nothing" and would have let this suite pass its negatives while proving
// nothing at all about its positives. Set before anything else, on purpose.
global.window = {};
global._escHtml = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let DUE = null;
global._duePrompt = () => DUE;
eval(one('var _TL_MEAL_ORDER=') + '\n' + lift('_tlMealSection'));

let bad = 0, n = 0;
const t = (ok, msg, got) => { n++; if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+msg+(got!=null?('  '+got):'')); };
const meal = (name,c,p) => ({name:name, calories:c, protein:p});
const S = o => Object.assign({breakfast:[],lunch:[],dinner:[],snack:[]}, o||{});
const sec = (slots, isToday, isAhead) => _tlMealSection('Sep 3, 2026', S(slots), !!isToday, !!isAhead);

console.log('\nAN EMPTY DAY DRAWS NOTHING AT ALL — this is the whole point:');
DUE = null;
t(sec({}, true) === '', 'today with nothing logged and nothing due is empty');
t(sec({}, false) === '', 'a past day with nothing logged is empty');
t(sec({}, false, true) === '', 'a day still ahead is empty');
t(!/Breakfast/.test(sec({dinner:[meal('steak',900,90)]}, true)),
  'and a day with only dinner does NOT draw an empty Breakfast box');
t(!/Lunch/.test(sec({dinner:[meal('steak',900,90)]}, true)), '...nor an empty Lunch');
t(!/Snack/.test(sec({dinner:[meal('steak',900,90)]}, true)), '...nor an empty Snack');

// SUPERSEDED 4 Sep, by him, off his own screen: "if hes logged breakfast, which
// he has, we can remove that under the meals category below. its redundant. just
// have it say lunch & dinner next." A logged meal already has its own card at the
// top of the day carrying the food, the clock and the macros. This printed it a
// second time in smaller type. These assertions guarded the duplication.
console.log('\nWHAT WAS EATEN IS NOT PRINTED TWICE — its card is already above:');
const three = sec({breakfast:[meal('eggs',300,25)], dinner:[meal('ny strip',978,96), meal('rice',152,3)]}, true);
t(!/tlMealRow/.test(three), 'a logged meal grows no row down here');
t(!/eggs/.test(three), 'and its food is not repeated either');
t(!/ny strip/.test(three), '...nor the second meal');

console.log('\nTHE HEADER CARRIES THE DAY, and it is the sum of the rows under it:');
t(/tlMealsEy">Meals</.test(three), 'the section is headed "Meals"');
const tot = /tlMealsTot"><b>([\d,]+)<\/b> cal · <b>(\d+)<\/b>P/.exec(three);
t(!!tot, 'the header carries the day total');
if (tot) {
  t(tot[1] === '1,430', 'calories are 300 + 978 + 152', tot[1]);
  t(tot[2] === '124', 'protein is 25 + 96 + 3', tot[2]);
}

console.log('\nA MEAL SAID WITHOUT NUMBERS IS NOT A ZERO — read-only, where rows live:');
// _tlTotLine directly above already refuses to count these as zero. This must
// not disagree with the line it sits under. Read-only is where the rows are now,
// so that is where this is measured.
global.window = { _tlRO: true };
const bare = sec({lunch:[meal('leftovers',0,0)]}, true);
t(/no numbers yet/.test(bare), 'it says so in words rather than printing 0 cal');
t(/tlMealRow bare/.test(bare), 'and it is marked so the styling can hold it back');
t(!/0 cal/.test(bare), 'the string "0 cal" never appears');
t(!/tlMealsTot/.test(bare), 'and a day whose only meal has no numbers grows no total');
global.window = {};

// SUPERSEDED 4 Sep: "just have it say lunch & dinner next". _duePrompt still
// decides WHETHER the section opens - that gate is untouched and the walk case
// below still proves it - but once it is open it lists everything still to come
// rather than the single slot whose hour it happens to be.
console.log('\nIT ASKS FOR EVERY MEAL STILL TO COME:');
DUE = 'lunch';
const ask = sec({breakfast:[meal('eggs',300,25)]}, true);
t((ask.match(/tlMealAsk"/g)||[]).length === 2, 'lunch and dinner, both',
  (ask.match(/data-key="([a-z]+)"/g)||[]).join(' '));
t(/data-key="lunch"/.test(ask) && /data-key="dinner"/.test(ask), 'named as themselves');
t(!/data-key="breakfast"/.test(ask), 'and breakfast is not asked for again, he ate it');
t(!/data-key="snack"/.test(ask), 'snack is never listed unasked');
t(/Add lunch/.test(ask), 'worded as an addition when the day has already started');
t(ask.indexOf('data-key="lunch"') < ask.indexOf('data-key="dinner"'), 'in the order they are eaten');
DUE = 'breakfast';
t(/Breakfast<\/span>/.test(sec({}, true)), 'and named plainly when nothing is logged yet');
t(sec({}, true) !== '', 'a due meal is reason enough to draw the section on an empty day');

console.log('\nAND IT NEVER ASKS SOMEONE WHO CANNOT ANSWER:');
DUE = 'lunch';
t(!/tlMealAsk/.test(sec({breakfast:[meal('eggs',300,25)]}, true, true)),
  'a day still ahead is not prompted');
global.window = { _tlRO: true };
t(!/tlMealAsk/.test(sec({breakfast:[meal('eggs',300,25)]}, true)),
  'and the trainer reading a client\'s day is never invited to log into it');
t(/Breakfast/.test(sec({breakfast:[meal('eggs',300,25)]}, true)),
  '...but he still sees what they ate');
global.window = {};

console.log('\nTHE WALK IS NOT A MEAL:');
// _duePrompt's ladder starts with 'walk', which shares the hour with breakfast.
DUE = 'walk';
t(sec({}, true) === '', 'a due walk does not open a meal section');
t(!/tlMealAsk/.test(sec({dinner:[meal('steak',900,90)]}, true)), '...nor add a meal ask');

console.log('\n' + (n-bad) + '/' + n + ' passed');
console.log('tmealsec: ' + (bad ? 'FAIL' : 'ok'));
process.exit(bad ? 1 : 0);
