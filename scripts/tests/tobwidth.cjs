// NOTHING RUNS OFF THE RIGHT EDGE OF A PHONE.
//
// Yusuf, 12 Sep, on his own phone, mid-setup: "When were you born? The text box
// is literally off the screen on the mobile version. Why didn't you check this
// stuff?... I don't like the date picker that iOS is giving. It's fucking
// awful. We need a much more intuitive, just a free text... have the numeric
// keyboard... and by the way while we're here check all of the text boxes to
// make sure they don't go off the fucking screen."
//
// THE MECHANISM, named once so it is never re-learned: a native
// <input type="date"> or <input type="time"> carries an intrinsic MINIMUM width
// set by the browser itself. width:100% cannot shrink it below that floor. Put
// one inside a half-width column on a 375px screen and it hangs over the edge,
// and nothing about the CSS you wrote looks wrong. min-width:0 lets it shrink;
// -webkit-appearance:none removes the native chrome that sets the floor.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }
/* Comments in this file explain the very things they must not be mistaken for -
   the date input that was REMOVED is named in the note saying why. So every
   scan below reads only lines that actually build markup. */
function markup(s){ return s.split('\n').filter(l=>/\+'</.test(l)).join('\n'); }

console.log('\n  THE BIRTHDAY IS TYPED, NOT SPUN:');
const dt=slice("if(st.type==='date'){", "if(st.type==='height'){");
t(!/type="date"/.test(markup(dt)), 'there is no native date input left on the screen');
t((dt.match(/inputmode="numeric"/g)||[]).length===3, 'three boxes, every one of them a number pad',
  String((dt.match(/inputmode="numeric"/g)||[]).length));
t((markup(dt).match(/type="text"/g)||[]).length===3,
  'and every one is plain text, so nothing native sizes itself',
  String((markup(dt).match(/type="text"/g)||[]).length));
['month','day','year'].forEach(function(w){
  t(new RegExp('>'+w+'<').test(dt), '  the '+w+' box says which one it is');
});
/* The labels are what settle the order argument. Nobody has to know whether
   this app wants day-month or month-day: the box says. */
t(/maxlength="2"/.test(dt) && /maxlength="4"/.test(dt), 'two digits, two digits, four digits');
t(/placeholder="MM"/.test(dt) && /placeholder="DD"/.test(dt) && /placeholder="YYYY"/.test(dt),
  'and each box shows its own shape before anything is typed');

console.log('\n  AND IT TYPES ITSELF FORWARD:');
const od=slice('function obDate(k, el){','function _obDateJoin(a){');
t(/replace\(\/\\D\/g,''\)/.test(od), 'a letter never reaches the value');
t(/if\(v!==el\.value\) el\.value=v;/.test(od), 'and never stays on the screen either');
t(/if\(v\.length===max\)/.test(od), 'a full box hands the keyboard to the next one');
t(/all\[i\+1\]\.focus\(\)/.test(od), 'which is the next box, not the next screen');

console.log('\n  AN IMPOSSIBLE DATE IS NOT A BIRTHDAY:');
const dj=slice('function _obDateJoin(a){','var _OB_MONTHS=');
t(/if\(m<1 \|\| m>12 \|\| d<1 \|\| d>31\) return '';/.test(dj), 'month 13 and day 40 are refused');
/* new Date(1997,1,31) silently answers 3 March. A birthday that quietly moved
   is worse than no birthday, so the round trip is checked. */
t(/t\.getFullYear\(\)!==y \|\| t\.getMonth\(\)!==\(m-1\) \|\| t\.getDate\(\)!==d/.test(dj),
  'and Feb 31 is refused rather than silently becoming March 3');
t(/if\(t\.getTime\(\) > Date\.now\(\)\) return '';/.test(dj), 'nobody was born tomorrow');
t(/if\(y<1900 \|\| y>now\) return '';/.test(dj), 'and nobody in the year 12');
t(/return y\+'-'\+\('0'\+m\)\.slice\(-2\)\+'-'\+\('0'\+d\)\.slice\(-2\);/.test(dj),
  'what it hands back is the same YYYY-MM-DD the profiles column always took');
const ds=slice('function _obDateSay(a){','function obPick');
t(/_OB_MONTHS\[parseInt\(p\[1\],10\)-1\]/.test(ds), 'and it reads the date back in words');
t(/return 'That is not a date yet\.';/.test(ds), 'or says plainly that it is not one yet');

console.log('\n  AND NEITHER IS THE SLEEP SCREEN SPUN:');
/* Same shape of bug as the birthday, caught before he reached the screen: two
   native <input type="time"> in half-width columns on a 375px phone. Gone. */
const sl=slice("if(st.type==='sleep'){", "if(st.type==='plan')");
t(!/type="time"/.test(markup(sl)), 'no native time input left either');
t((markup(sl).match(/inputmode="numeric"/g)||[]).length===2, 'both boxes are number pads');
const ot=slice('function obTime(k, el){','function obTimeFlip(k){');
t(/replace\(\/\\D\/g,''\)/.test(ot), 'letters never reach the value');
t(/_ob\.a\[k\+'Pm'\]=\(k==='bed'\?1:0\);/.test(ot),
  'asleep-by guesses night and up-at guesses morning, which is right nearly every time');
const tf=slice('function obTimeFlip(k){','function _obTimeParts');
t(/_ob\.a\[k\+'Pm'\]=_ob\.a\[k\+'Pm'\]\?0:1;/.test(tf), 'and one tap overturns the guess');
const tp=slice('function _obTimeParts(k, a){','function _obTimeJoin(k){');
t(/if\(v\.length<=2\)\{ h=parseInt\(v,10\); m=0; \}/.test(tp), '"10" means ten o\'clock');
t(/h=parseInt\(v\.slice\(0,v\.length-2\),10\); m=parseInt\(v\.slice\(-2\),10\);/.test(tp),
  'and "1030" means ten thirty, with no colon to type');
t(/if\(!\(h>=1 && h<=12\) \|\| !\(m>=0 && m<=59\)\) return null;/.test(tp), '25:70 is not a time');
const tj=slice('function _obTimeJoin(k){','function _obTimeSay(k, a){');
t(/var h24=p\.h%12 \+ \(p\.pm\?12:0\);/.test(tj),
  'and what lands in the column is the same 24-hour HH:MM it always took');
const ts=slice('function _obTimeSay(k, a){','var _OB_MONTHS=');
t(/tap to flip/.test(ts), 'the guess is shown, never hidden');

console.log('\n  NO BOX CAN RUN OFF THE EDGE:');
const css=slice('.obField{','.obRow{');
t(/min-width:0/.test(css), 'min-width:0 - the one that actually lets a native input shrink');
t(/max-width:100%/.test(css), 'and it can never be wider than what holds it');
t(/\.obField\[type="time"\],\.obField\[type="date"\]\{-webkit-appearance:none;appearance:none;\}/.test(src),
  'the native chrome that sets the width floor is off on both picker types');
t(/\.obRow\{margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;\}/.test(src),
  'and a row wraps to a second line rather than overflowing');
t(/\.obHalf\{flex:1 1 128px;min-width:0;\}/.test(src), 'each half can shrink, and knows when to wrap');
t(/\.obRow3 \.obHalf\{flex:1 1 68px;\}/.test(src), 'three-box rows get their own narrower floor');
/* The global reset already makes everything border-box, which is why 22px of
   card padding does not push the card itself off screen. Worth pinning: if that
   ever goes, every screen in this flow breaks at once. */
t(/\*\{margin:0;padding:0;box-sizing:border-box/.test(src),
  'and the global border-box reset is still there, which is what keeps the card itself in');

console.log('\n  EVERY INPUT IN THE FLOW IS ONE OF THE SAFE KINDS:');
const body=markup(slice('function _obBody(st){','// THE PLAN.'));
const types=(body.match(/type="[a-z]+"/g)||[]).map(x=>x.slice(6,-1));
const seen={}; types.forEach(x=>seen[x]=(seen[x]||0)+1);
t(!types.some(x=>x==='date'), 'no date input anywhere in the flow');
Object.keys(seen).forEach(function(x){
  t(['text','number','time'].indexOf(x)>=0, '  '+x+' ('+seen[x]+')');
});
/* Every input is either obField (the boxed ones) or obNum (the single big
   number on the weight-style screens, which carries its own max-width). There
   is no third kind, and a new one would land here. */
const guarded=(body.match(/class="obField"/g)||[]).length+(body.match(/class="obNum"/g)||[]).length;
t(guarded===(body.match(/<input/g)||[]).length,
  'every single input carries obField or obNum, so a width guard reaches all of them',
  guarded+' of '+(body.match(/<input/g)||[]).length);
t(/\.obNum\{width:auto;max-width:200px/.test(src), 'and obNum has its own ceiling');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (nothing hangs off the edge)\n');
process.exit(bad?1:0);
