// PROGRESS PHOTOS THROUGH JIM, AND JIM PINNED LEFT OF THE WEEK
// (Yusuf, brief + scope correction, 28 Aug.)
//
// THE SACRED PATH IS THE POINT OF THIS SUITE. A photo sent to Jim has always
// been a meal, and the whole risk of this build is that it stops being one. So
// the assertions that matter most are the ones proving _jimPhotoRoute answers
// NULL — null is what hands the turn to the untouched food path, and every
// food photo, and everything it cannot decide, has to reach it.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={addEventListener:function(){}, removeEventListener:function(){}, matchMedia:function(){ return {matches:false}; }};
// A lifted body can sit next to a top-level document.addEventListener, which
// runs the moment this eval does. Stubbed rather than trimmed: trimming means
// guessing where a declaration ends, which is the lifting trap CLAUDE.md lists.
global.document={
  addEventListener:function(){}, removeEventListener:function(){},
  getElementById:function(){ return null; }, querySelectorAll:function(){ return []; },
  createElement:function(){ return {style:{}, classList:{add:function(){},remove:function(){}}}; },
  body:{classList:{contains:function(){return false;}, add:function(){}, remove:function(){}, toggle:function(){}}, style:{}},
  hidden:false
};
global.localStorage={getItem:function(){return null;}, setItem:function(){}, removeItem:function(){}};
// saveProgramDay IS SEEDED ON PURPOSE (Calendar, 30 Aug). index.html reassigns
// it at top level — "var _originalSaveProgramDay = saveProgramDay;" and then
// "saveProgramDay = async function(){...}" — and definedIn() reads that
// reassignment as the definition, so the closure never pulls the real
// "async function saveProgramDay(){...}" and the reassignment line then throws
// on a name that does not exist yet. It only shows up when the closure happens
// to shrink and stops including the real one by another route, which is what a
// change on my side did. Seeding it puts the definition first, where it belongs.
const CL=closure(['_jimProgressPhotoAsked','_JIM_PROGRESS_RE','_jimProgressPhotoDay','_jimDataUrlToBlob',
                  '_JIM_MEAL_CTX_RE','_jimAnchorDay','_dateStrDaysAgo','_tlDateStr','saveProgramDay']);
eval(CL.code);
guard(['_JIM_PROGRESS_RE','_jimProgressPhotoAsked','_jimProgressPhotoDay','_jimAnchorDay','_dateStrDaysAgo'],
  n=>eval(n));
t(_jimAnchorDay('yesterday I ate eggs')===1, 'smoke: the day anchor answers');

console.log('\n  1. THEIR WORDS SAY PROGRESS:');
['progress photo','progress pic','here is my progress picture','physique check',
 'physique photo','progress shot','this is my progress photo from Tuesday',
 'body check','transformation photo','add this as a progress photo for Kelly'
].forEach(x=>t(_jimProgressPhotoAsked(x)===true, JSON.stringify(x)));

console.log('\n  and these are NOT progress words — every one is a meal or a person talking:');
['chicken and rice','my lunch','here is my dinner','this is what I ate',
 'protein shake','post workout meal','breakfast',
 // "check-in" already means the daily weigh-in/mood tile in this app, so a
 // client saying it means that and must never be read as a physique photo.
 'my check-in for today','check in'
].forEach(x=>t(_jimProgressPhotoAsked(x)===false, JSON.stringify(x)));

console.log('\n  2. THE DAY COMES OUT OF THEIR OWN WORDS:');
const TODAY=_tlDateStr(new Date());
t(_jimProgressPhotoDay('progress photo', null)===TODAY, 'nothing said lands on today');
const yd=_jimProgressPhotoDay('this is my progress photo from yesterday', null);
t(yd===_dateStrDaysAgo(1), 'yesterday lands on yesterday', yd);
// A weekday resolves relative to the LOCAL day, so the assertion is the
// property — it lands on a Tuesday — not a hardcoded date that is right here
// and wrong in Kiritimati, and wrong here next week.
const tu=_jimProgressPhotoDay('this is my progress photo from Tuesday', null);
t(new Date(tu).getDay()===2, 'and Tuesday lands on a Tuesday', tu);
t(_jimProgressPhotoDay('progress photo', {dateStr:'Aug 20, 2026'})==='Aug 20, 2026',
  "and a caller's own day is honoured when nothing was said");
// EVERY WEEKDAY, not just the one his example happens to name, and asserted as
// a PROPERTY so it survives being run on any day in any zone.
['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].forEach(function(n,i){
  var got=_jimProgressPhotoDay('progress photo from '+n, null);
  t(new Date(got).getDay()===i, '"from '+n+'" lands on a '+n, got);
});
t(new Date(_jimProgressPhotoDay('progress photo taken Friday', null)).getDay()===5, '"taken Friday" too');
// AND THE SHARED ANCHOR IS NOT WIDENED. "leftovers from Tuesday" is food eaten
// today, and the day resolver every meal runs through must keep answering that.
t(_jimAnchorDay('the leftovers from Tuesday')===null,
  'and the meal-side day anchor still refuses "from Tuesday" — it was NOT widened');

// ===== MEAL CONTEXT, CAUGHT ON THE DEPLOYED SCREEN =====================
// A photo captioned "my lunch" was asked "Meal or progress photo?" instead of
// going to the meal path. _jimLooksLikeMeal answers a different question - is
// there a meal to PARSE here - and a bare slot noun has no food in it. The
// question this route asks is only "is this photo about food at all".
console.log('\n  2b. A PHOTO ABOUT FOOD IS ABOUT FOOD, even with nothing to parse:');
[['my lunch',true],['here is my dinner',true],['breakfast',true],['ate this at 3',true],
 ['post workout meal',true],['320 calories',true],['my plate',true],
 ['progress photo',false],['physique check',false],['',false],['nice weather',false]
].forEach(([x,want])=>t(_JIM_MEAL_CTX_RE.test(x)===want, JSON.stringify(x)+' -> meal context '+want));
// And the order matters: progress words are checked BEFORE meal context, so a
// progress photo taken after lunch is still a progress photo.
t(_jimProgressPhotoAsked('progress photo after lunch')===true && _JIM_MEAL_CTX_RE.test('progress photo after lunch')===true,
  'both match "progress photo after lunch" — the route checks progress first');
const ORD=src.slice(src.indexOf('async function _jimPhotoRoute('), src.indexOf('async function _jimProgressPhotoReply('));
t(ORD.indexOf('_jimProgressPhotoAsked(t)')<ORD.indexOf('_JIM_MEAL_CTX_RE'), 'and the shipped order proves it');
// The shared recogniser is NOT widened: it decides whether to invent a meal
// record out of a sentence, and "my lunch" must go on meaning nothing to parse.
// Asserted by its CONTENT, not by a brittle window after the signature: the
// shared recogniser still knows nothing about progress photos or meal context.
const LLM=src.slice(src.indexOf('function _jimLooksLikeMeal(raw){'), src.indexOf('function _jimLooksLikeMeal(raw){')+2000);
t(LLM.length>200 && /_jimWithoutNumbers/.test(LLM), '_jimLooksLikeMeal is findable and unchanged in shape');
t(!/_JIM_MEAL_CTX_RE/.test(LLM) && !/_JIM_PROGRESS_RE/.test(LLM),
  'and it was NOT widened — it still answers "is there a meal to parse here"');

console.log('\n  3. THE ROUTE — read off the shipped source, since it awaits the network:');
const RT=src.slice(src.indexOf('async function _jimPhotoRoute('), src.indexOf('async function _jimProgressPhotoReply('));
t(RT.length>500, 'the route is findable');
t(/if\(!has\) return null;/.test(RT), 'no photo in the turn is not its business');
t(/if\(t && mealish\) return null;/.test(RT), 'A FOOD PHOTO IS HANDED STRAIGHT BACK — the sacred path');
t(/_jimLooksLikeMeal/.test(RT), 'and it uses the meal recogniser this file already has');
t(/window\._mealSlot/.test(RT), 'a door opened for a meal slot counts as meal context too');
t(/return 'Meal or progress photo\?';/.test(RT), 'ambiguous asks ONE question, in those words');
t((RT.match(/return '[^']*\?'/g)||[]).length===1, 'and exactly one question is ever asked', String((RT.match(/return '[^']*\?'/g)||[]).length));
t(/_jimPhotoPend=\{photo:photos\[0\], at:Date\.now\(\)\}/.test(RT), 'the photo is parked while it asks');
t(/jimTurn\(t, \[mp\.photo\], opts\)/.test(RT), 'and answering "meal" hands the parked photo to the untouched path');

console.log('\n  4. THE WRITE IS READ BACK, NEVER TRUSTED:');
const FL=src.slice(src.indexOf('async function _jimFileProgressPhoto('), src.indexOf('function _jimProgressPhotoDay('));
t(/Prefer.*return=representation/.test(FL), 'the insert asks for the row back');
t(/if\(rows && rows\.length\) return rows\[0\];/.test(FL), 'and only a row counts as saved');
t(/\}\s*\n\s*return null;\s*\n\}/.test(FL), 'and everything else answers null, after the last attempt');
const RP=src.slice(src.indexOf('async function _jimProgressPhotoReply('), src.indexOf('async function _jimProgressPhotoReply(')+2200);
t(/if\(!row\) return 'That did not save/.test(RP), 'a failure says so, and says nothing landed');
t(/Progress photo added for/.test(RP), 'and the confirmation is plain and factual');
t(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}✓]/u.test(RP), 'no icon, no tick, no hype');
t(RP.indexOf('_jimFileProgressPhoto')<RP.indexOf('Progress photo added'),
  'the line is only ever said AFTER the row came back');

console.log('\n  5. PARITY — ONE ENGINE, TWO DOORS (charter 12):');
const JV=src.slice(src.indexOf('// ===== PARITY: A PROGRESS PHOTO FOR A NAMED CLIENT'),
                   src.indexOf('// ===== PARITY: A PROGRESS PHOTO FOR A NAMED CLIENT')+3400);
t(JV.length>800, 'the Jarvis branch is findable');
t(/_jimFileProgressPhoto\(_ph\[0\], _ppCode, _ppDs\)/.test(JV), 'it calls THE SAME filing engine, for that client');
// _jvFindClientIn answers CODE STRINGS. Reading .code off one is undefined,
// so this branch never fired for a named client at all - it shipped that way
// and the same mistake was in the debrief door.
t(!/_ppWho/.test(JV.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n')), 'and does not read .code off a code string');
t(/_jimProgressPhotoDay\(String\(t\|\|''\), null\)/.test(JV), 'with the same dating rule');
t(/_ppCode=\(_f && _f\.hits && _f\.hits\.length===1\)/.test(JV), 'and only on an EXACT single match — a guess files onto a stranger');
t(/_jvSaysSelf/.test(JV), '"my progress photo" on his own account is himself, not a question');
t(/I have not saved that/.test(JV), 'and when it names nobody it says nothing was written');
t(/if\(!_ppRow\)/.test(JV), 'a refused write is reported, never claimed');

console.log('\n  6. JIM PINNED LEFT OF THE WEEK — the corrected scope:');
// IT FILLS THE SLOT THE CALENDAR LANE RESERVED, and builds no panel of its own.
// That lane sized #clJimSlot at left:232px and wired --clJim into the three-pane
// margins specifically for this, and said so: "the assistant lane owns moving
// their chat in ... fills this and turns it on". A second panel squeezed the
// week to 326px on the deployed screen.
t(/id="clJimSlot"/.test(src), 'the reserved slot exists');
t(!/pgJimDock/.test(src), 'and this lane did NOT build a second panel beside it');
// THE CONTRACT MOVED, THE ASSERTION DID NOT (Calendar, 30 Aug). The one-screen
// ruling took the rail out, so the slot starts at the edge, is wider, and lays
// its borrowed thread and bar out as a column — display:flex, not block. What
// these two lines are actually for is that the ASSISTANT lane's switch is what
// reveals the panel and the CALENDAR lane's variable is what moves the week
// over. Both are still exactly true; only the literals changed. Pinned loosely
// enough to survive a width ruling and tightly enough to still fail if either
// side stops using the other's seam.
t(/body\.cl-desk\.cl-jimOn \.clJimSlot\{display:(block|flex);\}/.test(src), 'their switch is the one that shows it');
t(/body\.cl-jimOn\{--clJim:\d+px;\}/.test(src), 'and their variable is what moves the calendar over');
t(!/#tProgram\.active\{[^}]*grid-template-columns/.test(src.replace(/\n/g,'')), 'the calendar page keeps its own layout');
const MOUNT=src.slice(src.indexOf('function _pgJimDeskOn('), src.indexOf('function _pgJimSync('));
t(/_clPaneMode\(\)==='cl3'/.test(MOUNT), 'gated on THEIR pane mode, not a second idea of desktop');
t(/isTrainer\(cl\.code\)\) return false/.test(MOUNT), 'and never him — he keeps Jarvis');
t(/classList\.add\('cl-jimOn'\)/.test(MOUNT), 'mounting turns their class on');
t(/classList\.remove\('cl-jimOn'\)/.test(MOUNT), 'and unmounting takes it off, or the week keeps a margin for nothing');
// Was pinned as two adjacent lines. The pinned message and the rotating
// placeholder now sit between them, so it asks the real question instead: are
// both calls inside _clPaneApply, which is the function that already runs on
// resize and on entering the calendar.
const _ai=src.indexOf('function _clPaneApply(');
const APPLY=src.slice(_ai, src.indexOf('\nfunction ', _ai+10));
t(/_pgJimSync\(\)/.test(APPLY) && /_clRightArrange\(\)/.test(APPLY),
  'and it rides _clPaneApply, which already runs on resize and on entering the calendar');

console.log('\n  IT BORROWS THE REAL CHAT, IT DOES NOT BUILD A SECOND ONE:');
t(/host\.appendChild\(sc\); host\.appendChild\(inp\);/.test(MOUNT), 'the real #chatScroll and #askChatInput are moved in');
t(/if\(!_jimOvlHome\)\{ _jimOvlHome=/.test(MOUNT), 'sharing the overlay’s own home record, so both give them back to one place');
t(!/jimBarHtml/.test(MOUNT), 'and it never builds a second bar — that would duplicate jimIn_<day>');
t(/try\{ _pgJimSync\(\); \}catch\(e\)\{\}\n\}/.test(src), 'closing the sheet hands them back to the dock');
t(/try\{ _pgJimSync\(\); \}catch\(e\)\{\}\s*\n\s*if\(t==='Foodlog'\)/.test(src)
  || /classList\.add\('active'\);\s*\n\s*\/\/ JIM'S PINNED DOCK FOLLOWS THE TAB/.test(src),
  'and switching tabs re-syncs it');

console.log('\n  NOTHING WAS CHANGED NEAR LOGGING:');
t(/var foodAdds = extractAllMarkers\(reply, 'FOOD_LOG'\); reply = foodAdds\.cleanText;/.test(src),
  'the FOOD_LOG extraction is untouched');
t(/var aOk = await logFoodFromChat\(/.test(src), 'the meal write is untouched');
t(/return await jimTurn\(text, photos, opts\);/.test(src), 'and jimDoor still ends in the same call it always did');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
