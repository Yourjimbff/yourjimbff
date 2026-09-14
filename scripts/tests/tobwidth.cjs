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
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }
/* Comments in this file explain the very things they must not be mistaken for -
   the date input that was REMOVED is named in the note saying why. So every
   scan below reads only lines that actually build markup. */
function markup(s){ return s.split('\n').filter(l=>/(\+|return)\s*'</.test(l)).join('\n'); }

console.log('\n  THE BIRTHDAY IS ONE FIELD THAT PUNCTUATES ITSELF:');
/* Yusuf, 12 Sep: "when were you born should just be one continuous field
   separated by forward slashes automatically... just don't make it three
   separate boxes because the user might think, oh, this is three separate
   boxes." Three boxes was the first pass; this is the second. What has NOT
   changed is that no native date input is coming back - that is the one with
   the intrinsic minimum width iOS will not shrink, and the spinning wheel. */
const dt=slice("if(st.type==='date'){", "if(st.type==='height'){");
t(!/type="date"/.test(markup(dt)), 'there is no native date input on the screen');
t((markup(dt).match(/<input/g)||[]).length===1, 'it is one field, not three',
  String((markup(dt).match(/<input/g)||[]).length));
t(/inputmode="numeric"/.test(dt), 'on a number pad');
t(/type="text"/.test(markup(dt)), 'and plain text, so nothing native sizes itself');
t(/placeholder="MM \/ DD \/ YYYY"/.test(dt), 'the shape is shown before anything is typed');
t(/maxlength="10"/.test(dt), 'ten characters - eight digits and two slashes');
t(/>month, day, year</.test(dt), 'and the order is named underneath, so nobody has to guess');

console.log('\n  AND THE SLASHES ARE NEVER TYPED BY A PERSON:');
const od=slice('function obDate(el){','/* Only a date that actually exists');
t(/replace\(\/\\D\/g,''\)\.slice\(0,8\)/.test(od), 'only digits are kept, at most eight');
t(/if\(d\.length>2\) shown\+=' \/ '\+d\.slice\(2,4\);/.test(od), 'a slash appears after the month');
t(/if\(d\.length>4\) shown\+=' \/ '\+d\.slice\(4,8\);/.test(od), 'and after the day');
t(/el\.setSelectionRange\(shown\.length, shown\.length\)/.test(od),
  'and the cursor stays at the end, so the punctuation never swallows a keystroke');
t(/_ob\.a\.bmm=d\.slice\(0,2\); _ob\.a\.bdd=d\.slice\(2,4\); _ob\.a\.byy=d\.slice\(4,8\);/.test(od),
  'the three parts are still what the date is built from');

console.log('\n  AN IMPOSSIBLE DATE IS NOT A BIRTHDAY:');
const dj=slice('function _obDateJoin(a){','var _OB_MONTHS=');
t(/if\(m<1 \|\| m>12 \|\| d<1 \|\| d>31\) return '';/.test(dj), 'month 13 and day 40 are refused');
t(/t\.getFullYear\(\)!==y \|\| t\.getMonth\(\)!==\(m-1\) \|\| t\.getDate\(\)!==d/.test(dj),
  'and Feb 31 is refused rather than silently becoming March 3');
t(/if\(t\.getTime\(\) > Date\.now\(\)\) return '';/.test(dj), 'nobody was born tomorrow');
t(/if\(y<1900 \|\| y>now\) return '';/.test(dj), 'and nobody in the year 12');
t(/return y\+'-'\+\('0'\+m\)\.slice\(-2\)\+'-'\+\('0'\+d\)\.slice\(-2\);/.test(dj),
  'what it hands back is the same YYYY-MM-DD the profiles column always took');
const ds=slice('function _obDateSay(a){','function obMulti');
t(/_OB_MONTHS\[parseInt\(p\[1\],10\)-1\]/.test(ds), 'and it reads the date back in words');
t(/return 'That is not a date yet\.';/.test(ds), 'or says plainly that it is not one yet');

console.log('\n  AND THE SLEEP SCREEN TOOK ITS PICKERS WITH IT:');
/* It was the last place in the flow with a native control on it - two
   <input type="time"> in half-width columns, the same shape that broke the
   birthday screen. Yusuf cut the question; the pickers went with it. */
t(!/type="time"/.test(markup(slice('function _obBody(st){','/* ===== THE DEMOS ====='))),
  'no native time input anywhere in the setup flow');
t(/profiles\.bed_time \/ wake_time are still there waiting/.test(src),
  'and the columns are still there for when the question comes back');

console.log('\n  NO BOX CAN RUN OFF THE EDGE:');
const css=slice('.obField{','.obRow{');
t(/min-width:0/.test(css), 'min-width:0 - the one that actually lets a native input shrink');
t(/max-width:100%/.test(css), 'and it can never be wider than what holds it');
t(/\.obField\[type="time"\],\.obField\[type="date"\]\{-webkit-appearance:none;appearance:none;\}/.test(src),
  'the native chrome that sets the width floor is off on both picker types');
t(/\.obRow\{margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;\}/.test(src),
  'and a row wraps to a second line rather than overflowing');
t(/\.obHalf\{flex:1 1 128px;min-width:0;\}/.test(src), 'each half can shrink, and knows when to wrap');
t(/\.obDate1\{letter-spacing:1px;\}/.test(src), 'and the date field spaces its own digits out');
/* The global reset already makes everything border-box, which is why 22px of
   card padding does not push the card itself off screen. Worth pinning: if that
   ever goes, every screen in this flow breaks at once. */
t(/\*\{margin:0;padding:0;box-sizing:border-box/.test(src),
  'and the global border-box reset is still there, which is what keeps the card itself in');

console.log('\n  EVERY INPUT IN THE FLOW IS ONE OF THE SAFE KINDS:');
const body=markup(slice('function _obBody(st){','/* ===== THE DEMOS ====='));
const types=(body.match(/type="[a-z]+"/g)||[]).map(x=>x.slice(6,-1));
const seen={}; types.forEach(x=>seen[x]=(seen[x]||0)+1);
t(!types.some(x=>x==='date'), 'no date input anywhere in the flow');
Object.keys(seen).forEach(function(x){
  t(['text','number','time'].indexOf(x)>=0, '  '+x+' ('+seen[x]+')');
});
/* Every input is either obField (the boxed ones) or obNum (the single big
   number on the weight-style screens, which carries its own max-width). There
   is no third kind, and a new one would land here. */
const guarded=(body.match(/class="obField[ "]/g)||[]).length+(body.match(/class="obNum"/g)||[]).length;
t(guarded===(body.match(/<input/g)||[]).length,
  'every single input carries obField or obNum, so a width guard reaches all of them',
  guarded+' of '+(body.match(/<input/g)||[]).length);
t(/\.obNum\{width:auto;max-width:200px/.test(src), 'and obNum has its own ceiling');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (nothing hangs off the edge)\n');
process.exit(bad?1:0);
