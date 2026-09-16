// "it is hard open on my leg day. It's not even letting me shut it."
// (Yusuf, 16 Sep, on the Program tab, on a Tuesday.)
//
// ONE VARIABLE, TWO MEANINGS, AND THEY FOUGHT. _pgDayOpen===null meant "nobody
// has picked a day yet, so open today" to _pgDefaultOpen. pgToggleDay ALSO set
// it to null, to mean "they just closed the one that was open". So closing
// today wrote null, the repaint on the very next statement read that null as
// nobody-has-picked, and opened today straight back up. Today's card could be
// tapped shut and could never stay shut.
//
// It only ever hit TODAY's row, which is why everything else on the page looked
// fine and why it took a Tuesday to notice it on a leg day.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global.window={}; global.renderProgramTab=function(){};
eval(src.split('\n').filter(l=>l.startsWith('var _pgDayOpen=null;')||l.startsWith('var _pgDayTouched=false;')).join('\n'));
eval([defOf('_pgDefaultOpen'), defOf('pgToggleDay')].join('\n'));
guard(['_pgDefaultOpen','pgToggleDay'], n=>eval(n));

const todayIx=(new Date().getDay()+6)%7;
const reset=()=>{ _pgDayOpen=null; _pgDayTouched=false; };

console.log('\n  TODAY STILL OPENS ON ARRIVAL (his 7 Sep ruling):');
reset();
_pgDefaultOpen();
t(_pgDayOpen===todayIx, 'arriving with nothing chosen opens today', String(_pgDayOpen));
_pgDefaultOpen();
t(_pgDayOpen===todayIx, '  and a second repaint leaves it where it is');

console.log('\n  AND IT CAN BE SHUT:');
reset(); _pgDefaultOpen();
pgToggleDay(todayIx);
t(_pgDayOpen===null, 'tapping the open day closes it', String(_pgDayOpen));
_pgDefaultOpen();
t(_pgDayOpen===null, '  and the repaint does NOT reopen it', String(_pgDayOpen));
_pgDefaultOpen(); _pgDefaultOpen();
t(_pgDayOpen===null, '  still closed after three more repaints', String(_pgDayOpen));

console.log('\n  EVERY OTHER DAY BEHAVES THE WAY IT ALWAYS DID:');
const other=(todayIx+3)%7;
reset(); _pgDefaultOpen();
pgToggleDay(other);
t(_pgDayOpen===other, 'tapping another day opens that one', String(_pgDayOpen));
_pgDefaultOpen();
t(_pgDayOpen===other, '  and it stays open across repaints');
pgToggleDay(other);
t(_pgDayOpen===null, 'tapping it again closes it');
_pgDefaultOpen();
t(_pgDayOpen===null, '  and that stays shut too');
/* One at a time was always the rule - seven open at once is the wall. */
reset(); _pgDefaultOpen();
pgToggleDay(other);
t(_pgDayOpen===other, 'opening one closes whatever was open', String(_pgDayOpen));

console.log('\n  AND A DIFFERENT PERSON STARTS CLEAN:');
/* The sign-out reset has to clear the flag with the day it guards, or the next
   client arrives with today already shut because he shut his. */
t(/_pgPlan=null; _pgDayOpen=null; _pgDayTouched=false;/.test(src),
  'the reset clears the flag alongside the day');
t(/function pgToggleDay\(i\)\{ _pgDayTouched=true;/.test(src), 'and a tap is what sets it');
t(/if\(!_pgDayTouched && _pgDayOpen===null\)/.test(src), 'while the default only fires before any tap');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (today opens itself once, and shuts when he says so)');
process.exit(bad?1:0);
