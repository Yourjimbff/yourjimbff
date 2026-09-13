// BUILD YOUR OWN — the free user's program, in the app's own language.
//
// Yusuf, 12 Sep, after two wrong attempts at this in one night:
//   "It should just say build your program or build your own. Build, build,
//    but that's it. That's the only thing you should see on your program."
//   "Why are these all written out as rest days?"
//   "You have failed to view the markdown file which says law is glass."
//
// THE TWO WRONG ATTEMPTS, so nobody repeats them: the first opened the
// TRAINER's builder (renderTrainingBuilder, old chrome, a This week pager, a
// "set it in my goals" card) in a full-screen sheet. The second kept that sheet
// and merely emptied it. Both were new screens designed at desktop width
// without reading BACKLOG.md's standard, which forbids exactly that.
//
// WHAT THIS IS INSTEAD: nothing new. The Program tab has carried a glass
// builder for real clients since v7.981.104 - add a session, eight kinds, add
// a movement from the library, sets and reps, make a rest day - and it saves
// through _writeCalendar with a read-back. It just refused to draw for anyone
// with no saved plan, under the "nothing is invented" ruling. An EMPTY week is
// not an invented one. So the free user gets one card, and behind it, that.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }
const inner=slice('function _gpDaysInner(){','function _gpSecDays(n){');

console.log('\n  THE OLD BUILDER IS GONE FROM THE FREE APP:');
t(!/function mwpOpen/.test(src), 'the full-screen sheet is deleted');
t(!/_mwpBlankWeek|mwpCanBuild|mwpSave|mwpClose/.test(src), 'and every helper it had');
t(!/\.mwpOv\{/.test(src), 'and its CSS');
t(!/_mwpOpen/.test(src), 'and the flag every guard was checking');
t(!/renderTrainingBuilder\('tpBody'\)/.test(src), 'nothing renders the trainer builder for a client any more');
t(/function renderTrainingBuilder\(hostId\)\{/.test(src), 'the trainer builder itself is untouched, for the trainer');
/* The one real fix that came out of the wrong attempt stays: those two
   controls had their own copies of the repaint chain. */
t(/try\{ _tpRepaint\(\); \}catch\(e\)\{ try\{ renderTrainingBuilder\(\); \}catch\(_e\)\{\} \}/.test(slice('function _tpAfterType(day, msg){','function tpUndoType(day){')),
  'and the repaint-through-one-door fix from that night is kept');

console.log('\n  ONE CARD, THREE WORDS:');
t(/var _freeEmpty=\(!_ownsTab && !_hasReal && \(!_saved \|\| _savedEmpty\) && _meFreeApp\(\) && _pgPlanKnown\(\) && window\._tpLoadFailed!==true\);/.test(inner),
  'a free user with no saved plan OR a saved plan with nothing in it, once the read has settled');
/* HIS PHONE, 10:46pm: he added a session and took it back, which saved seven
   Rest days. "A row exists" was read as "has a program": the strip drew seven
   Rest cells, 0 days a week, Rest on every row, and the Day page said Active
   rest under a Creative mode switch. */
t(/_savedEmpty=!WEEKDAYS\.some\(function\(d\)\{ var x=_saved\[d\]; return x && x\.type && x\.type!=='Rest'; \}\);/.test(inner),
  'empty is decided by what is IN the week, not by whether a row is there');
t(/if\(_saved && _savedEmpty\)\{ _tpPlan=_saved; window\._pgBlankRef=_tpPlan; \}/.test(inner),
  'and an empty saved row is edited in place, so the next session lands on it');
const pfd2=slice('function _tlPlanForDate(d){','function _tlPlanKeyFor');
t(/if\(_meFreeApp\(\) && !WEEKDAYS\.some\(function\(k\)\{ var x=_tpPlan\[k\]; return x && x\.type && x\.type!=='Rest'; \}\)\) return null;/.test(pfd2),
  'and the Day page agrees: seven Rest days is no week, so it offers Build your program, not Active rest');
t(/if\(!window\._pgBuilding\)\{/.test(inner), 'until they tap, the tab is one card');
const card=slice("if(!window._pgBuilding){","range:range, week:null");
t(/class="tlHero tlHeroGo"/.test(card), 'and the card is the house glass - the Day hero recipe');
t(/tlHeroEy">Your program</.test(card), 'eyebrow: Your program');
t(/tlHeroName long">Build your program</.test(card), 'name: Build your program');
t(!/tlHeroMeta/.test(card), 'and NO third line under it');
t(/onclick="pgBuildStart\(\)"/.test(card), 'tap opens the builder');
t(/return \{inner:'<div class="tlHero tlHeroGo"/.test(inner), 'and it RETURNS - nothing else on the tab can draw beside it');

console.log('\n  BEHIND IT, SEVEN EMPTY DAYS:');
t(/_tpPlan=\{\}; WEEKDAYS\.forEach\(function\(d\)\{ _tpPlan\[d\]=\{type:'Rest', ex:\[\]\}; \}\);/.test(inner),
  'the week starts as seven days with nothing on them');
/* CAUGHT ON THE SERVED BUILD: _tpPlan already held a Push/Pull/Legs template
   the Day tab had composed, and a "does it have a Monday" test kept it - seven
   invented days drawn as the user's own. The blank is trusted by REFERENCE. */
t(/if\(_tpPlan!==window\._pgBlankRef\)\{/.test(inner), 'only the blank this code made is trusted, by reference');
t(/window\._pgBlankRef=_tpPlan;/.test(inner), 'and it is remembered so an unsaved edit survives a repaint');
t(!/if\(!\(_tpPlan && _tpPlan\.Mon\)\)/.test(inner), 'the shape test that let a template through is gone');
t(!/_tpDefaultPlan\(\)/.test(slice("var _freeEmpty=","var _plate='';")),
  'and never from _tpDefaultPlan, which guesses a week from a sex and a day count');
t(/_pgPlan=_tpPlan;/.test(inner), 'and it is the object the existing controls edit');
/* The strip of seven cells would be seven greyed "Rest" cells over seven rows
   saying the same thing. Not on an empty week. */
t(/if\(_pw && !_freeEmpty\)\{/.test(inner), 'no week strip over an empty week');
t(/\(rest\?\(_freeEmpty\?'':'<span class="pgDayRestTag"> \\u00b7 Rest<\/span>'\)/.test(inner),
  'an empty day is its name and nothing else - Rest means rest FROM something');
t(/Add a session/.test(inner), 'and every empty day offers Add a session');
/* 12 Sep: "the program page before I click any session at all, it should be
   glass, not grey." .pgDay.rest is the quiet line for a rest day inside a
   program; an unset day on an empty week wears the full card. */
t(/\(rest\?\(_freeEmpty\?' unset':' rest'\):''\)/.test(inner), 'an empty-week row is unset, not rest');
t(/\.pgDay\.unset\{[^}]*radial-gradient\(120% 140% at 0% 0%,#232323 0%,#171717 46%,#121212 100%\)/.test(src),
  'and unset is the .pgCard recipe');
t(/\.pgDay\.unset::after\{[^}]*rgba\(245,197,24,0\.10\)/.test(src), 'gold corner glow included');
t(/\.pgDay\.rest\{background:rgba\(255,255,255,0\.035\)/.test(src), 'while a real rest day stays quiet');
t(/var _PG_WAKE=\['Push','Pull','Legs','Upper','Lower','Full body','Arms','Cardio'\];/.test(src),
  'which is the same eight kinds real clients pick from');
const wake=slice('async function pgWakeDo(dk, type){','function pgTellJim(){');
t(/_tpPlan\[dk\]=\{type:String\(type\|\|'Workout'\), ex:\[\]\};/.test(wake),
  'and picking one makes the day that kind with NOTHING in it - they add the movements');

console.log('\n  ADD A SESSION IS A LIST, IN GLASS, AND IT CLOSES:');
/* Yusuf, 12 Sep: "I don't really like this current drop down menu, it doesn't
   look very organized... these boxes are not glass... when I open and expand
   Monday, there's no way to close it." */
t(/<div class="pgKinds">/.test(inner), 'the kinds are a stacked list');
t(/class="pgKind" onclick="pgWakeDo/.test(inner), 'one full-width row per kind');
t(!/class="pgWakeP"/.test(inner), 'the chip cloud is gone');
t(/\.pgKind\{[^}]*radial-gradient\(120% 140% at 0% 0%,#232323 0%,#171717 46%,#121212 100%\)/.test(src),
  'and each row is the house glass - the .pgCard recipe');
t(/\.pgKind\{[^}]*min-height:52px/.test(src), '52px tall');
t(/pgKindOff" onclick="pgWakeCancel\(\)"/.test(inner), 'the last row closes the list');
t(/function pgWakeStart\(dk\)\{ _pgWakeAsk=\(_pgWakeAsk===dk\)\?null:dk;/.test(src), 'and tapping the day again closes it too');
t(/\(rest\?\(\(_ro\)\?'':\(' onclick="pgWakeStart\(\\''\+dk\+'\\'\)"'\)\)/.test(inner),
  'because a rest row head now toggles its own list');
t(/var _PG_WAKE_FREE=\['Push','Pull','Legs','Upper','Full body','Arms','Cardio'\];/.test(src),
  'the free list has one word for legs - Legs and Lower name the same muscles');
t(/\(_meFreeApp\(\)\?_PG_WAKE_FREE:_PG_WAKE\)/.test(inner), 'and coaching clients keep both, because his female split is written in those words');

console.log('\n  NO CREATIVE MODE FOR A FREE USER, ON ANY DAY:');
t(/showHint && isToday && !window\._tlRO && !_meFreeApp\(\)\)\?\('<div class="tlSwitchRow" data-tl="creative"/.test(src),
  'the switch is gated on the rest-day card as well as the empty one');

console.log('\n  THE WEIGHT THEY GAVE AT SETUP IS ON THE GRAPH:');
const wj=slice('async function renderWeightJourney(){','syncWeightUnitUI();');
t(/if\(_meFreeApp\(\) && !weights\.length && !window\._wtSeeded && Array\.isArray\(weights\)\)/.test(wj),
  'a free user with no weigh-ins is healed where the empty list is first known');
t(/parseFloat\(profile && \(profile\.start_weight\|\|profile\.weight\)\)/.test(wj), 'from the weight they typed');
t(/window\._wtSeeded=true;/.test(wj), 'once per load');
t(/insertWeightLog\(\{client_code:cl\.code, weight:_pw0, notes:'', logged_at:_at\}\)/.test(wj), 'through the verified write path');
t(/profile\.intake_date/.test(wj), 'dated to the day they set up');

console.log('\n  FEWER WORDS FOR A FREE USER:');
t(/\(_meFreeApp\(\) \? '' : '<div class="pgLibCard" onclick="pgOpenLib\(\)">'/.test(src),
  'no Exercise library card on their Program tab');
t(/_meFreeApp\(\)\?'Add your first movement\.'/.test(inner), '"Add your first movement." inside an empty day');
t(/\(\(window\._pgProgPlan \|\| _meFreeApp\(\)\) \? '' : \('<div class="pgJim">/.test(inner), 'no Or tell Jim box');
t(/\(\(moved && !_meFreeApp\(\)\)\?/.test(inner), 'no Back to the standard week - there is no standard week');
t(/!_hasReal && !_meFreeApp\(\) && _pgPlanKnown\(\)/.test(inner), 'and never the No programme set card');
t(!/Tap a day to see what.s in it\. Swaps you make here become your program\.'\)\s*\+'<\/div>'\)\)\s*$/m.test(inner) || /_meFreeApp\(\) \? \(_freeEmpty \?/.test(inner),
  'and the week note is off for them');

console.log('\n  NOTHING ELSE INVENTS A WEEK FOR THEM EITHER:');
/* _gpSyncWeek composes a week from a sex and a day count and WRITES IT to
   training_plans whenever settings save with no plan on file - and the save
   banner's Try again calls it. That is how a split nobody built appeared on
   his phone. */
const sync=slice('async function _gpSyncWeek(){','function _gpCard(');
t(/if\(_meFreeApp\(\)\) return;/.test(sync), '_gpSyncWeek stands down for a free user');
t(sync.indexOf('if(_meFreeApp()) return;') < sync.indexOf('var plan=_tpPlanForClient()'),
  'before it composes anything');
t(/_gpSyncWeek\(\)/.test(slice('async function gpRetrySave(){','\n}')), 'and Try again still calls it, so the gate is where it matters');

console.log('\n  THE FIRST SAVE IS A REAL SAVE:');
const sv=slice('async function pgSavePlan(what, note){','var PG_WEEKDAY_FULL=');
t(/window\._tpFromServer=true;/.test(sv), 'a verified write raises _tpFromServer');
t(sv.indexOf('if(r && r.ok){') < sv.indexOf('window._tpFromServer=true;'), 'only after the read-back matched');
t(/return \{ok:true, plan:plan, sig:sig\};/.test(slice('async function _writeCalendar(plan){','// ===== PROFILE SETUP PAGE')),
  'and _writeCalendar only says ok when the stored row matches what was sent');
/* Without that flag the builder they were standing in vanished after the first
   save, because _pgSavedPlan answered null until a reload. */
t(/\(window\._tpFromServer && _tpPlan && _tpPlan\.Mon\)/.test(slice('function _pgSavedPlan(){','function _pgPlanFromProgramme')),
  'which is what _pgSavedPlan reads to decide the week is theirs');

console.log('\n  THE DAY PAGE POINTS THE SAME WAY:');
const rest=slice('function _tlRestCard(ds, isToday, isAhead, slots, kind){','function _tlMoveRow');
t(/var _canBuild=false; try\{ _canBuild=\(none && _meFreeApp\(\) && !window\._tlRO\); \}catch\(e\)\{\}/.test(rest),
  'a free user with no program gets the card');
t(/tlHeroName long">Build your program</.test(rest), 'it says Build your program');
t(!/tlHeroMeta/.test(slice("if(_canBuild){","return '<div class=\"tlHero\">")), 'with no third line');
t(/if\(a==='buildweek'\)\{ ev\.stopPropagation\(\); try\{ pgBuildStart\(\); \}catch\(e\)\{\} return; \}/.test(src),
  'and tapping it opens the same builder on the Program tab');
const bs=slice('function pgBuildStart(){','async function pgSavePlan');
t(/window\._pgBuilding=true;/.test(bs) && /switchTab\('Program'\)/.test(bs), 'pgBuildStart switches tab and opens the rows');

console.log('\n  THE LIBRARY OPENS ON MUSCLES:');
t(/function _pgCatChips\(cur, fnName\)/.test(src), 'one chip row');
t(/var cats=Object\.keys\(EX_LIB\|\|\{\}\);/.test(src), 'from the library\'s own groups, so a new group appears by itself');
t(/var html=_pgCatChips\(_pgCat,'pgLibCat'\), shown=0;/.test(src), 'on the read-only library');
t(/var html=_pgCatChips\(_pgCat,'pgAddCat'\), shown=0;/.test(src), 'and on the add-to-day picker');
t((src.match(/if\(_pgCat && cat!==_pgCat\) continue;/g)||[]).length===2, 'both filter by it');
t(/_pgAddDay=dayKey; _pgCat='';/.test(src) && /function pgOpenLib\(\)\{ _pgCat='';/.test(src),
  'and both open on All, never on whatever was tapped last time');
t(/\.pgCats\{display:flex;gap:7px;overflow-x:auto/.test(src), 'the row scrolls sideways on a phone rather than stacking');
t(/\.pgCat\{flex:none;height:38px/.test(src), 'and a chip is 38px tall - a thumb lands on it');
t(/\.pgCat\.on\{background:var\(--gold\)/.test(src), 'gold only on the one that is on');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (build your own, in the house glass)\n');
process.exit(bad?1:0);
