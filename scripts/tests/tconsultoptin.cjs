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
global.openConsultBooking=()=>{ booked++; };
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

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (two doors, and he is told which one they took)');
process.exit(bad?1:0);
