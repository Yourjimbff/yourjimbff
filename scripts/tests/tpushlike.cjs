// "YUSUF LIKED YOUR BREAKFAST" — his order, 17 Sep, in his words.
//
// A like has always been the cheapest thing he does and the one clients never
// see. It writes a row, paints a heart on HIS screen, and the person who cooked
// the meal finds out the next time they happen to open the app — which for most
// people is not the day it happened. The toast even said "she will see it",
// which meant "eventually". Now it arrives.
//
// The two things that would quietly ruin it: a notification that names the
// wrong meal, and a like that feels broken because Apple was slow.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) throw new Error('stale start anchor: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor: '+b); return src.slice(i,j); }

console.log('\n  IT RIDES THE LIKE AND NEVER LEADS IT:');
const react=slice('async function quickReact(','async function _loadWhoLikedMyFood');
t(/if\(isLike\)\{ try\{ _pushLike\(kind, refId, code\); \}catch\(e\)\{\} \}/.test(react),
  'the notice goes out from the one funnel every like already passes through');
t(!/await _pushLike/.test(react),
  '  and is not awaited, so a slow Apple cannot make a like feel broken',
  'the heart is already gold by this point');
/* Both names also exist elsewhere in the file - _pushLike is DEFINED forty
   thousand lines above this - so the comparison has to be made inside the
   function, not across the whole document. */
t(react.indexOf('reaction=eq.like&limit=1') >= 0
  && react.indexOf('reaction=eq.like&limit=1') < react.indexOf('_pushLike(kind, refId, code)'),
  'it fires only after the row has been read back — a like that failed never happened');

console.log('\n  IT NAMES THE MEAL, NOT "FOOD":');
const words=slice('async function _likeWords(','/* One door to a client');
t(/_feedMealGroupKey\(r\)/.test(words),
  'the slot comes off the row through the same rule the feed groups by',
  'two rules is how a card and a notification end up naming different meals');
t(/slot==='breakfast'\|\|slot==='lunch'\|\|slot==='dinner'\|\|slot==='snack'/.test(words),
  'breakfast, lunch, dinner and snack are all said by name');
t(/noun='food'/.test(words), 'and anything it cannot place falls back to "food"');
t(/noun:'workout'/.test(words), 'a workout is a workout');
t(/noun:'progress photo'/.test(words) && /noun:'journal'/.test(words),
  '  and the other two things a heart lands on are named too',
  'they come through the same funnel; leaving them silent would be arbitrary');
t(/if\(k==='wo'\) k='workout'/.test(words),
  'the feed’s own spelling of a workout is understood',
  'cards pass "wo", the river passes "workout"');
t(/select=name,meal/.test(words) && /select=title/.test(words),
  'and the detail line is what they actually logged');

console.log('\n  IT IS ONE PERSON TALKING, NOT A BRAND:');
const nm=slice('function _likeFirstName(){','/* WHAT THEY GET TOLD');
t(/cl && cl\.name/.test(nm), 'the name comes off the signed-in trainer, not a constant',
  'other trainers get this app; "Yusuf" hardcoded would greet their clients');
t(/split\(\/\\s\+\/\)\[0\]/.test(nm), '  first name only');
t(/'Your coach'/.test(nm) && !/'YOURJIMBFF'/.test(nm),
  'and with no name it is still a person, never the brand');
const send=slice('async function _pushLike(','\nfunction skipSetup');
t(/_likeFirstName\(\)\+' liked your '\+w\.noun/.test(send), 'the sentence is his, exactly');

console.log('\n  AND IT CANNOT GO TO THE WRONG PERSON, OR TWICE:');
t(/String\(code\)===String\(cl\.code\)\) return false/.test(send), 'never to himself');
t(/!isTrainer\(cl\.code\)\) return false/.test(send),
  'only the trainer sends one — a client liking something never even makes the call');
t(/_PUSHED_LIKES\[key\]\) return false/.test(send),
  'like, unlike, like again is one person changing their mind, not two notifications');
t(/refId==null \|\| refId===''\) return false/.test(send), 'and nothing is sent about nothing');
const door=slice('async function _pushToClient(','async function _pushLike');
t(/'Authorization':'Bearer '\+tok/.test(door), 'the send carries his session');
t(/console\.warn\('\[push\] like notice not sent'/.test(door),
  'a refusal is logged, not shown',
  'the only person who could act on "no phone registered" is him, and not in that second');
t(!/showToast/.test(door), '  nothing about a failed notification reaches the screen');

console.log('\n  THE SERVER LETS A ONE-LINE NOTIFICATION THROUGH:');
const fn=fs.readFileSync('netlify/functions/push-send.js','utf8');
t(/if \(!text && !title\) return json\(400, \{ error: 'no_body' \}\);/.test(fn),
  'a title on its own is a whole notification',
  '"Yusuf liked your breakfast" needs no second line under it');
t(/if \(!code\) return json\(400, \{ error: 'no_code' \}\);/.test(fn),
  '  but an empty notification is still refused');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (the like arrives)\n');
process.exit(bad?1:0);
