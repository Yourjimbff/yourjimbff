// THE FREE APP TIER — what comes OFF the screen when nobody is coaching you.
//
// Yusuf, 12 Sep, reading a free user's own screen: "it says Yusuf needs your
// number and he does not. And the Jim's back sharper does not need to be there
// anymore at all on anyone's screen whatsoever. They also don't need calls with
// Yusuf... And then there's the progress screen. Progress screen is a bunch of
// questions that I don't think that they need right now."
//
// THE SHAPE OF THE MISTAKE, named once: every one of those surfaces asked "is
// this a client" when the question it meant was "does this person have a coach".
// Those were the same question for two years, because everybody in the app was
// one of his clients. A free app user is the first person for whom they differ.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

console.log('\n  ONE LIST DECIDES WHO IS ON THE FREE APP:');
t(/var FREE_APP_CODES=\{freeuser:1\};/.test(src), 'the list exists and freeuser is on it');
t(/function isFreeApp\(code\)\{/.test(src), 'and one test reads it');
const ifa=slice('function isFreeApp(code)','function _meFreeApp()');
t(/if\(isTrainer\(c\)\) return false;/.test(ifa), 'a trainer is never on the free app, whatever the list says');
t(/if\(!c\) return false;/.test(ifa), 'and an empty code is nobody');
t(/function _meFreeApp\(\)\{/.test(src), 'and a shorthand for "the person signed in right now"');
/* The list is named where it is defined and nowhere else — every surface goes
   through isFreeApp. Adding the next free code must be one edit, not six.
   Three mentions: the comment that tells the next person where to add a code,
   the definition, and the one read inside isFreeApp. */
t((src.match(/FREE_APP_CODES/g)||[]).length===3,
  'the list is named in exactly three places - the note, the definition, one reader',
  String((src.match(/FREE_APP_CODES/g)||[]).length));
t(/Add the next free code to FREE_APP_CODES and nowhere else/.test(src),
  'and the file says so out loud where somebody adding one will read it');

console.log('\n  THE PHONE NUMBER ASK IS OFF:');
const ph=slice('function _phAskIsClient()','async function _phAskLoad()');
t(/if\(_meFreeApp\(\)\) return false;/.test(ph), 'a free user is never asked for their number');
t(/isTrainer\(cl\.code\)\) return false;/.test(ph), 'and the trainer still is not either');
/* One gate, at the top: _phAskCard and _phAskLoad both call _phAskIsClient, so
   the card cannot draw AND the door is never knocked on. */
t(/if\(!_phAskIsClient\(\)\) return '';/.test(slice('function _phAskCard(ds)','function _phAskSay')),
  'the card itself checks it');
t(/if\(!_phAskIsClient\(\)\) return;/.test(slice('async function _phAskLoad()','function _phAskCard(ds)')),
  'and the read that feeds it never even runs');

console.log('\n  CALLS WITH YUSUF IS OFF:');
const pc=slice('async function _pgCallsCard(_retried)','var now=new Date();');
t(/if\(_meFreeApp\(\)\)\{ hosts\.forEach/.test(pc), 'the card comes off the page for a free user');
t(/h\.style\.display='none'; h\.innerHTML='';/.test(pc), 'hidden AND emptied, so nothing is left behind it');
t(pc.indexOf('_meFreeApp') < pc.indexOf('sessEnsure'),
  'and it turns back before it spends a session check on somebody with no calls');
/* The 'closed' state stays: it is the right answer for a PAYING client whose
   plan has no calls in it. It is only wrong for someone who downloaded an app. */
t(/_pcCardHtml\(null,'closed'\)/.test(src), "the 'closed' state is untouched for real clients");

console.log('\n  THE PROGRESS PAGE QUESTIONS ARE OFF:');
const yf=slice('function _yfIsClient()','/* THE ROW.');
t(/if\(_meFreeApp\(\)\) return false;/.test(yf), 'Your file does not draw for a free user');
t(/if\(!_yfIsClient\(\)\)\{ host\.innerHTML=''; host\.style\.display='none'; return; \}/.test(src),
  'and the host is blanked and hidden, not just left empty');
/* Everything it says is addressed to somebody with a coach. If any of these
   sentences can reach a free user's screen, the gate above is not doing its job. */
t(/I read this before every call we have/.test(src),
  'the wording that gives it away is still in the file (it is right for real clients)');

console.log('\n  THE JIM CARD IS OFF FOR EVERYONE:');
const wn=slice('function _tlWnCard(ds){','/* ===== ASK THEM FOR THEIR NUMBER');
t(/^\s*function _tlWnCard\(ds\)\{[\s\S]{0,600}?return '';/.test(wn),
  'it returns nothing before it reads anything');
t(wn.indexOf("return '';") < wn.indexOf('localStorage.getItem(_tlWnKey())'),
  'the early return comes before the dismissal check, so a fresh phone gets it too');
t(/Jim’s back, and sharper\./.test(src),
  'the card is still in the file - turning a future announcement on is one line');
t(/_tlWnCard\(ds\)/.test(src), 'and its call site is untouched');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (the free app is not a coaching app)\n');
process.exit(bad?1:0);
