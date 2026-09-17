// "A new button on the fresh sign in screen saying would you like Yusuf to reach
// out to you for a transformation consultation? Either a quick yes, like an opt
// in - great, itll be a text from me - and or schedule it." (Yusuf, 16 Sep.)
//
// The screen already existed and had ONE door: a calendar. A calendar is a
// commitment at the exact moment somebody has just finished typing their weight
// into an app they downloaded ten minutes ago. The quick yes is the same intent
// at a tenth of the cost and it puts the next move on him.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

let booked=0, stashed=0;
global.window={};
global.openBooking=()=>{ booked++; };
global.openConsultBooking=()=>{ throw new Error('the marketing site must not be opened from here'); };
global._obSetupStash=()=>{ stashed++; };
global.setTimeout=(fn)=>{ try{ fn(); }catch(e){} };
global.document={getElementById:id=>(id==='obCsWrap'?{innerHTML:''}:null)};
global._ob={i:0,a:{}};
eval(defOf('_obConsultPick'));
guard(['_obConsultPick'], n=>eval(n));

console.log('\n  BOTH DOORS ARE ON THE SCREEN:');
t(/Yes, text me/.test(src), 'the quick yes is there');
t(/Pick a time instead/.test(src), '  and the calendar under it');
const card=src.slice(src.indexOf("if(st.type==='consult'){"), src.indexOf("if(st.type==='home'){"));
t(card.indexOf('Yes, text me') < card.indexOf('Pick a time instead'),
  'the quick yes leads, because it is the one most people should take');
t(/\.obGo2\{background:transparent/.test(src), 'and the calendar is the quieter of the two');

console.log('\n  THE ANSWER IS RECORDED, AND ALL THREE STATES ARE REAL:');
_ob={i:0,a:{}}; stashed=0; booked=0;
t(_obConsultPick('yes')===true, 'a quick yes is taken');
t(_ob.a.consult==='yes', '  and stored as yes', String(_ob.a.consult));
t(stashed===1, '  and written down straight away, not at the end');
t(booked===0, '  without opening a calendar at them');
_ob={i:0,a:{}}; booked=0;
t(_obConsultPick('booked')===true, 'picking a time is taken too');
t(_ob.a.consult==='booked', '  and stored as booked');
t(booked===1, '  and it actually opens the calendar');
_ob={i:0,a:{}};
t(_obConsultPick('maybe')===false, 'anything else is refused rather than stored');
t(_ob.a.consult===undefined, '  and leaves the answer untouched');

console.log('\n  IT REACHES THE ROW THEY ARE SAVED ON:');
t(/consult:\(a\.consult==='yes'\|\|a\.consult==='booked'\)\?a\.consult:null,/.test(src),
  'obFinish writes it into intake_json');
t(/no migration/.test(src) || /needs no column/.test(src),
  '  beside goal_text, so it needs no new column');

console.log('\n  IT IS STILL NOT A GATE:');
t(/this screen has never been a gate and is not becoming one/.test(src),
  'skipping is still one tap on the ordinary Next');
t(/passed the screen/.test(src), 'and passing it is recorded as its own answer, not as nothing');

console.log('\n  IT ANSWERS WHERE THEY TAPPED:');
t(/Done\. He will text you himself\./.test(src), 'the yes confirms in place');
t(/Repainting the whole step would/.test(src),
  '  rather than repainting the screen and scrolling them back to the top');

console.log('\n  AND IT SURVIVES A MISSING SCREEN:');
global.document={getElementById:()=>null};
_ob={i:0,a:{}};
t(_obConsultPick('yes')===true, 'no wrapper on screen and it still records the answer');
t(_ob.a.consult==='yes', '  which is the half that matters');
global._ob=null;
t(_obConsultPick('yes')===false, 'and with no onboarding running at all it refuses cleanly');


// "All someone has to do when they see the consult screen is fill out a time, we
// already have their info." (Yusuf, 16 Sep.)
//
// Picking a time opened the marketing site in a NEW TAB, where a person who had
// just spent four minutes typing their height, weight, goal and phone number into
// this app was asked for all of it again by a stranger's form.
console.log('\n  IT BOOKS IN THE APP, NOT ON A FORM THEY ALREADY FILLED IN:');
t(/window\._bkConsult=true;/.test(src), 'the consult screen flags the picker');
t(/try\{ openBooking\(\); \}catch\(e\)\{\} \}, 180\);/.test(src), '  and opens the app’s own picker');
const pick=src.slice(src.indexOf('function _obConsultPick'), src.indexOf('function _obConsultBooked'));
t(!/openConsultBooking/.test(pick), 'the marketing site is not opened from this screen any more');
t(/reads his real availability, his real\n       bookings and his blocked time/.test(src),
  '  because the picker already knows his real week');

console.log('\n  A CONSULT IS NOT PAID FOR OUT OF ANYONE’S PLAN:');
t(/var isConsult=false; try\{ isConsult=\(window\._bkConsult===true\); \}catch\(e\)\{\}/.test(src),
  'confirmBooking reads the flag');
t(/if\(!isConsult && weeklyCallsFor\(cl\.code\)/.test(src), 'the weekly-call gate steps aside for it');
t(/if\(!isConsult && callsAreCreditOnly\(cl\.code\)/.test(src), '  and so does the credit gate');
t(/if\(isConsult\)\{ \/\* nothing to spend/.test(src), 'and nothing is deducted for one');
t(/no calls left on your plan right now/i.test(src),
  'the sentence a new signup would otherwise have met is still in the file, on the paid path');

console.log('\n  THE EXEMPTION CANNOT LEAK INTO A LATER BOOKING:');
t(/window\._bkConsult=false; _obConsultBooked\(\);/.test(src), 'the flag is cleared when the booking lands');
t(/Cleared here and not on the way in/.test(src),
  '  and not on the way in, so losing the slot mid-decision does not lose the exemption');

console.log('\n  AND THE CARD UNDERNEATH IS TOLD:');
global.document={getElementById:id=>(id==='obCsWrap'?{innerHTML:''}:null)};
eval(defOf('_obConsultBooked'));
t(_obConsultBooked()===true, 'the onboarding card updates after the modal closes');
t(/Booked\. You will get a reminder\./.test(src), '  and says it landed');
global.document={getElementById:()=>null};
t(_obConsultBooked()===false, 'and it says so plainly when the card is no longer on screen');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (two doors, and he is told which one they took)');
process.exit(bad?1:0);
