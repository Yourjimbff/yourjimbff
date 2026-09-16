// "on my program page it says no program set" (Yusuf, 16 Sep, with a photo).
//
// The card read: "No programme set - Yusuf has not set you a programme. Log the
// workouts you do on the Day tab and they are saved to your record." On his own
// phone, on his own account, over a four-week plan sitting in training_plans
// with all seven days written in it.
//
// THE CAUSE, and it is one line. _mwCalendarOff carried a trainer carve-out:
// the calendar is never off for him, at any width. So on a PHONE
// _mwOwnsProgramTabNow answered true - "the grid above is drawing the week,
// stand down" - and there is no grid above on a phone, because _mwOpenTab
// returns before it draws. _gpDaysInner set the week to null on the strength of
// a calendar that was not there and printed the sentence.
//
// IT IS THE 2 SEP BUG WEARING A DIFFERENT HAT. That one cost 72 of 74 active
// clients their week on their phones, and the note above _mwOwnsProgramTabNow
// still describes it. The fix landed for clients. He was carved out one line
// earlier and walked back into it.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global.window={};
const MINE=['_MW_DESKTOP_MIN','_mwIsDesktop','_mwCalendarOff','_mwOwnsProgramTabNow'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

const at=(w, code, trainer)=>{
  global.window.innerWidth=w;
  global.window.cl={code:code};
  global.cl=global.window.cl;
  global.isTrainer=function(c){ return trainer && String(c)===code; };
  return _mwCalendarOff();
};

console.log('\n  WIDTH IS THE WHOLE QUESTION:');
t(at(375,'thegoat',true)===true,  'the coach on a phone: calendar OFF', String(at(375,'thegoat',true)));
t(at(375,'benp1',false)===true,   'a client on a phone: calendar OFF');
t(at(1440,'thegoat',true)===false,'the coach on a desktop: calendar ON');
t(at(1440,'benp1',false)===false, 'a client on a desktop: calendar ON');
/* The carve-out only ever changed the narrow case, which is why nothing about
   his cockpit moves: above the threshold both answers were already the same. */
t(at(1024,'thegoat',true)===at(1024,'benp1',false), 'and the two answers agree at every width');
t(!/if\(typeof isTrainer==='function' && isTrainer\(cl\.code\)\) return false;\s*\n\s*return !_mwIsDesktop\(\);/.test(src),
  'the trainer carve-out is gone from the test');

console.log('\n  SO NOTHING CLAIMS TO BE DRAWING A GRID THAT IS NOT THERE:');
global.window.innerWidth=375; global.window.cl={code:'thegoat'}; global.cl=global.window.cl;
global.isTrainer=function(c){ return String(c)==='thegoat'; };
global.window._mwOwnsProgramTab=true;
t(_mwOwnsProgramTabNow()===false, 'the tab is not owned by the calendar on his phone');
global.window.innerWidth=1440;
t(_mwOwnsProgramTabNow()===true,  '  and still is on his desktop, where the grid is real');
global.window._mwOwnsProgramTab=false;
t(_mwOwnsProgramTabNow()===false, 'and the flag still has the final say when it is down');

console.log('\n  THE SENTENCE IT WAS PRINTING:');
/* It is allowed to exist - a client with genuinely no programme should read it.
   What it may never be is the answer to "I could not find out". */
const card=src.slice(src.indexOf("'<div style=\"font-size:15px;font-weight:800;color:var(--text);\">No programme set</div>'")-620,
                     src.indexOf("'<div style=\"font-size:15px;font-weight:800;color:var(--text);\">No programme set</div>'")+300);
t(/!week && !_hasReal && !_meFreeApp\(\) && _pgPlanKnown\(\) && window\._tpLoadFailed!==true/.test(card),
  'it still waits until the plan question has actually been answered');
t(/_pgPlanKnown\(\)/.test(card), '  so a read that never landed cannot print it');
t(/window\._tpLoadFailed!==true/.test(card), '  and neither can one that failed');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (his week is his week, on a phone too)');
process.exit(bad?1:0);
