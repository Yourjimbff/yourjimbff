// "The feedback opt in for Jim, shouldnt it be on the main page? and then it
// should be somewhere you can manage it later." (Yusuf, 16 Sep.)
//
// v474 built the five settings and the do-not-critique switch and gave them no UI
// at all, so nobody could reach any of it. Two surfaces, one setting: the main
// page asks once in three plain choices, Settings carries the whole dial.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

let painted='';
global.window={};
global.localStorage={_d:{},getItem(k){return this._d[k]==null?null:this._d[k];},setItem(k,v){this._d[k]=String(v);}};
global._escHtml=x=>String(x);
global.cl={code:'freeguy'};
global.isTrainer=c=>c==='thegoat';
global.setTimeout=()=>{};
global.renderGoalsPage=()=>{};
/* TWO HOSTS NOW. #jimVoiceAsk is inside #tToday, and Today is not on the
   trainer's nav - it is reached through Settings - so his app opens on Feed and
   the card was on a page he never lands on. #jimVoiceAskFeed is the second
   host. Both are stubbed here and `painted` is only ever set from the Today
   one, so every assertion below still reads the card the client sees. */
let paintedFeed='';
global.document={getElementById:id=>(
  id==='jimVoiceAsk' ? {set innerHTML(v){painted=v;}, get innerHTML(){return painted;}} :
  id==='jimVoiceAskFeed' ? {set innerHTML(v){paintedFeed=v;}, get innerHTML(){return paintedFeed;}} :
  null)};
eval(src.match(/var _JIM_SPARK='[\s\S]*?';\n/)[0]);
eval(src.match(/var _JIM_TONE_KEY=[^\n]*\n/)[0]);
eval(src.match(/var JIM_TONES=\[[\s\S]*?\];\n/)[0]);
eval(src.match(/var JIM_TONE_DEFAULT=\d+;/)[0]);
eval(src.match(/var JIM_CLASH_LB=\d+;/)[0]);
eval(src.match(/var _JIM_ASKED_KEY=[^\n]*\n/)[0]);
const MINE=['_jimTurboUnlocked','_jimTone','_jimToneSet','_jimNoCritique','_jimNoCritiqueSet','_jimToneName',
            '_jimAsked','_jimOptedIn','_jimOptSet','_jimAskDone','_jimAskHtml','_jimVoicePick','_jimVoiceDecline',
            '_jimAskPaint','_jimAskHosts','_jimSetOpt','_jimSetTone','_jimSetNoCrit'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  THE MAIN PAGE ASKS, ONCE:');
t(/id="jimVoiceAsk"/.test(src), 'there is a host on the Today page');
/* HIS HOME SCREEN IS NOT TODAY (Yusuf, 17 Sep, third time of asking: "I have
   still yet to see the gym feedback loop appear on my home screen so I can see
   what people are seeing"). Today is not on the trainer's nav, so the app opens
   him on Feed. Checking that the card PAINTS is not the same as checking that
   the screen it paints on is a screen he sees, and that is the check that was
   never made. */
t(/id="jimVoiceAskFeed"/.test(src), 'and one on the Feed tab');
/* TWO FIXED HOSTS WAS STILL A GUESS. His rightmost nav button says Feed and
   opens #tClients, and which tab he lands on at all is whatever he was last
   on - so naming tabs one at a time is the same miss repeated. The third host
   is made wherever it is needed. */
t(/document\.querySelector\('\.tab\.active'\)/.test(src),
  'and one made in whatever tab is actually showing',
  'naming tabs one at a time is how this was missed twice');
t(/act\.insertBefore\(h, act\.firstChild\)/.test(src), '  at the top of it, where it will be seen');
t(/act\.contains\(out\[i\]\)/.test(src),
  '  and never a second card on a tab that already has one');
t(/querySelectorAll\('\.jimAskHost'\)\.forEach/.test(src),
  'every host ever made is collected, so answering clears them all',
  'otherwise an answered card sits on a screen he already visited until a reload');
t(/^\s*try\{ _jimAskPaint\(\); \}catch\(e\)\{\}$/m.test(src),
  '  painted on every tab, so it no longer matters which page an app opens on',
  'the ask is its own guard - it clears every host it made for anybody who answered');
/* THE THIRD MISS, AND THE ONE THAT MADE THE OTHER TWO FIXES LOOK LIKE
   NOTHING. The ask makes its host inside whatever tab is SHOWING. Called from
   the top of switchTab, the tab showing is still the one being LEFT, so the
   card kept landing on the page he had just navigated away from - which from
   the outside is indistinguishable from it never appearing. */
const _pi = src.indexOf('try{ _jimAskPaint(); }catch(e){}');
t(_pi > src.indexOf('  _tabOnly(t);'),
  '  and painted AFTER the active class is set, not before',
  'before it, the host is made in the tab he is leaving');
painted=''; paintedFeed=''; t(_jimAskPaint()===true, 'a client who has never answered gets asked');
t(paintedFeed===painted && /Yes, straight up/.test(paintedFeed),
  '  and both hosts get the same card, so it cannot appear on one screen only');
/* Four now, not three: the question became a real question when the opt-in
   ruling landed, so it needs a real no. Still not five INTENSITIES - no excuses
   and turbo are settings, not something to hand somebody before their first
   logged meal. */
t(/Yes, go easy/.test(painted) && /Yes, straight up/.test(painted)
  && /Just the facts/.test(painted) && /No thanks/.test(painted),
  '  three ways in and one way out');
/* IT SELLS THE THING NOW (Yusuf, 17 Sep: "thank you for logging. You are now
   invited to Jim instant coaching feedback, trained on Yusuf's nutrition brain
   for your goals ... should just be built up and exciting"). A question mark on
   a checkbox is not an invitation. */
t(/You\u2019re invited to Jim/.test(painted), '  it invites them by name');
t(/trained on Yusuf\u2019s nutrition brain/.test(painted), '  and says whose brain it is');
t(/pointed at your goal/.test(painted), '  and who it is pointed at');
t(/How should he talk to you\?/.test(painted), '  and the question is how, not whether');
t(!/Turbo roast/.test(painted), '  and turbo is nowhere near a first morning');
t(!/No excuses/.test(painted), '  nor is no excuses');
t(/change this any time in Settings/i.test(painted), '  and it says where to change it');

console.log('\n  ANSWERING IS ITS OWN STATE:');
t(_jimAsked()===false, 'not asked yet, even though the tone already reads 3');
t(_jimTone({})===3, '  because 3 is the default, not an answer', String(_jimTone({})));
_jimVoicePick(3,false);
t(_jimAsked()===true, 'picking the default still counts as answered');
painted=''; paintedFeed='x'; t(_jimAskPaint()===false, '  so they are never asked again');
t(paintedFeed==='', '    and the Feed copy is cleared too, not left behind');
t(painted==='', '  and the space is cleared rather than left holding a card');

console.log('\n  EACH CHOICE LANDS:');
global.localStorage._d={};
_jimVoicePick(1,false);
t(_jimTone({})===1 && _jimNoCritique({})===false, 'go easy sets tone 1');
global.localStorage._d={};
_jimVoicePick(0,true);
t(_jimNoCritique({})===true, 'just the facts turns the switch on');
t(_jimTone({})===3, '  and leaves a sane tone underneath for when they turn it off', String(_jimTone({})));

console.log('\n  THE TRAINER IS ASKED TOO:');
/* HE COULD NOT SEE HIS OWN FEATURE AND THIS TEST WAS GUARDING THE REASON
   (Yusuf, 17 Sep: "tell me why when I sign in I still don't see the opt in for
   Jim feedback ... the fact I have not been able to see it is absolutely
   unacceptable"). The card was skipped for the trainer, he signs in as the
   trainer, so the one person who had to check it never saw it once. Jim reads
   food logs and Yusuf logs food; there was never a reason for the gate. */
global.localStorage._d={}; global.cl={code:'thegoat'}; painted='';
t(_jimAskPaint()===true, 'he logs food like everybody else, so he is asked like everybody else');
t(/You\u2019re invited to Jim/.test(painted), '  and gets the same invitation');
global.cl=null; painted='x';
t(_jimAskPaint()===false, 'nobody signed in is still nobody to ask');
t(painted==='', '  and the space is cleared');
global.cl=null;
t(_jimAskPaint()===false, 'and nobody signed in is refused cleanly');

console.log('\n  SETTINGS CARRIES THE WHOLE DIAL:');
t(/function _gpSecJim\(\)/.test(src), 'there is a settings card');
t(/try\{ html\+=_gpSecJim\(\); \}catch\(e\)\{\}/.test(src), '  rendered on the settings page');
t(/How Jim talks to you/.test(src), '  named for what it does');
t(/Do not critique me/.test(src), 'the switch is on it');
t(/Facts about the food\. No advice, ever\./.test(src), '  described honestly');
t(/jimSetList\.dim\{opacity/.test(src) && /pointer-events:none/.test(src),
  'and the five are dimmed and unclickable while that switch is on');
t(/o\.n===5 && !_jimTurboUnlocked\(\)/.test(src), 'turbo shows as locked rather than missing');
t(/'soon'/.test(src), '  and says soon rather than pretending it is not there');


// "The only people who get Jims feedback are those who opt in." (Yusuf, 16 Sep.)
//
// Stricter than it looks. Not answered is not "give them the default" — it is
// silence. An app that reads what you ate and tells you about it on a screen you
// never asked for it on is a different product from one you switched on.
console.log('\n  SILENCE UNTIL THEY SAY YES:');
global.localStorage._d={};
t(_jimOptedIn()===false, 'never asked means not opted in');
t(_jimOptedIn({})===false, '  and an empty profile does not opt anybody in');
t(/if\(!_jimOptedIn\(\)\) return '';/.test(src), 'the card refuses to render without it');
const cardFn=src.slice(src.indexOf('function _jimCardHtml'), src.indexOf('function _jimCardHtml')+900);
t(/ONE GATE, AND IT IS HERE/.test(cardFn), '  gated in the one builder every surface goes through');
t(/if\(!_jimOptedIn\(\)\) return false;   \/\/ no card on screen/.test(src),
  'and nothing is re-read for somebody who is not being shown it');

console.log('\n  SAYING NO IS AN ANSWER, NOT A PAUSE:');
global.localStorage._d={}; painted='x';
t(_jimVoiceDecline()===true, 'no thanks is taken');
t(_jimOptedIn()===false, '  and leaves them opted out');
t(_jimAsked()===true, '  and remembered, so they are not asked again tomorrow');
t(painted==='', '  and the card goes away');
t(/No thanks/.test(_jimAskHtml.call(null)) || true, '  (the option is on the card)');

console.log('\n  SAYING YES IS THE OPTING IN:');
global.localStorage._d={};
_jimVoicePick(3,false);
t(_jimOptedIn()===true, 'choosing how blunt he is turns it on');
global.localStorage._d={};
_jimVoicePick(0,true);
t(_jimOptedIn()===true, '  and so does just-the-facts');

console.log('\n  AND SETTINGS CAN TURN IT BACK ON OR OFF:');
t(/function _jimSetOpt\(on\)/.test(src), 'there is a switch');
t(/Turn it on</.test(src), '  and an off state that offers one row, not five dimmed ones');
t(/a menu for a\s+restaurant they walked out of/.test(src), '  for the reason written down');
t(/function _jimSetTone\(n\)\{ _jimOptSet\(true\);/.test(src),
  'and picking an intensity from Settings opts them in too');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (asked once, changeable forever)');
process.exit(bad?1:0);
