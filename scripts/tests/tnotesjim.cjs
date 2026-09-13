// NOTES, A FULL BOX, AND FOUR LINES OF JIM.
//
// Yusuf, 12 Sep, off three screenshots of the free app:
//   "check-in for the free user should be just notes in general, or it's like
//    progress notes, progress journal."
//   "I feel like that entire box, like you should see the bottom end of it. It
//    looks like it's stuck to the bottom, but it would be more satisfying if it
//    was like a full box... that also goes for it while it's down collapsed
//    keyboard as well."
//   "when I click the Jim conversation box on the main page, the keyboard
//    doesn't automatically open."
//   "we shouldn't automatically assume that the user is behind."
//   "when it says best ways to use Jim, this should be simplified by a long
//    shot... This simplification fix should be gated to ALL users."
//
// Four of the five are free-app gated. The last one deliberately is NOT: his
// paying roster reads that card too, which is why it gets its own section here.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

console.log('\n  A FREE USER HAS NOBODY TO CHECK IN WITH:');
const CL=closure(['_ciWord','_ciWordT','_ciWordAdd']);
t(!CL.unparsable || !CL.unparsable.length, 'the words lift cleanly', JSON.stringify(CL.unparsable||[]));
global.window={};
eval(CL.code||'');
_meFreeApp=()=>true;
t(_ciWord()==='Notes', 'the free app calls the box Notes');
t(_ciWordT()==='Notes', 'and so does its tab');
t(_ciWordAdd(false)==='Write a note', 'an empty day offers to write one');
t(_ciWordAdd(true)==='Add another note', 'and a day with one offers another');
_meFreeApp=()=>false;
t(_ciWord()==='Check in', 'a coaching client still checks in');
t(_ciWordT()==='Check-in', 'and their tab still says Check-in');
t(_ciWordAdd(false)==='Check in' && /Add to today’s check in/.test(_ciWordAdd(true)),
  'in the words they have always had');
/* One helper, or two surfaces disagree about what the thing is called. */
t(!/textContent\s*=\s*'Check-in'/.test(src), 'nothing hard-codes the label any more');
t((src.match(/textContent=_ciWordT\(\);/g)||[]).length===4, 'every place that names it reads the helper',
  (src.match(/textContent=_ciWordT\(\);/g)||[]).length);
t(/_bnt\.textContent = isTrainer\(cl\.code\)\?'Activity':_ciWordT\(\);/.test(src), 'the nav reads the helper');
t(/titleEl\.textContent=_ciWordT\(\);/.test(src), 'the journal page reads the helper');
t(/<span class="tlMealsEy">'\+_escHtml\(_ciWord\(\)\)\+'<\/span>/.test(src), 'the Day section reads the helper');
t(/_tlAskRow\('checkin', ds, _ciWordAdd\(/.test(src), 'and so does the row inside it');

console.log('\n  THE BOX FLOATS, AND THE KEYBOARD DOES NOT SIT ON IT:');
t(/_fdShow\(h, _ciWord\(\), 'ciSheet mid'\)/.test(src), 'the sheet opens floating, not stuck to the floor');
t(/\.fdOv\.mid\{align-items:center/.test(src), 'and mid is the house rule he already gave the weight overlay');
const fit=slice('function _fdFit(){','function _fdClose(){');
t(/ov\.classList\.contains\('mid'\)/.test(fit), 'only a floating sheet tracks the viewport');
t(/var vv=window\.visualViewport;/.test(fit), 'it measures the VISIBLE viewport, not the layout one');
/* SHRINKING THE OVERLAY LEFT A BAND (Yusuf, 13 Sep: "write a note still has a
   tiny section of the screen underneath visible"). Between where the overlay
   stopped and where the keyboard began, the page showed through undimmed - on
   iOS that band is the form accessory bar. The dim is full-screen again and it
   is the PADDING that moves. */
t(/ov\.style\.height=''; ov\.style\.top='';/.test(fit), 'the overlay is never shrunk');
t(/var kb=Math\.max\(0, Math\.round\(\(window\.innerHeight\|\|0\) - vv\.height - \(vv\.offsetTop\|\|0\)\)\);/.test(fit),
  'the keyboard is measured');
t(/ov\.style\.paddingBottom=kb\+'px';/.test(fit), 'and added to the bottom, so the box centres in what is left');
t(/p\.style\.maxHeight=Math\.max\(160, Math\.round\(vv\.height-28\)\)\+'px';/.test(fit),
  'and the box can never be taller than that, so both its edges stay in sight');
t(/ov\.style\.height=''; ov\.style\.top=''; ov\.style\.paddingBottom='';/.test(src),
  'closing clears every one of those');
t(/function _fdUnfit\(\)\{/.test(src) && /function _fdClose\(\)\{ try\{ _fdUnfit\(\); \}catch\(e\)\{\}/.test(src),
  'closing puts the overlay back and drops the listeners');
const show=slice('function _fdShow(html, label, cls){','function _fdFit(){');
t(/if\(ov\.classList\.contains\('mid'\) && window\.visualViewport\)\{/.test(show), 'bound on open, for a floating sheet only');
t(/_fdUnfit\(\);/.test(show), 'and never bound twice');
/* A floating sheet has no grab handle - .fdPanel.mid hides it - so a box you
   open to type in needs a way out that is not "tap the dark". */
t(/class="ciBack" onclick="_fdClose\(\)"/.test(src), 'and it has a way out that is a word');
t(/\.ciBack\{/.test(src), 'which is styled as one');
t(/\.ciSheet \.ciTa\.ciBox\{max-height:42vh;overflow-y:auto;\}/.test(src), 'the box grows, but never past the sheet');

console.log('\n  THE KEYBOARD COMES UP WITH THE JIM BOX:');
const sl=slice('function openSmartLog(){','async function _openSmartLogAsync(){');
t(/var v=document\.getElementById\('slogView'\); if\(v\) v\.style\.display='flex';/.test(sl), 'the overlay is shown first');
t(/try\{ if\(v\) void v\.offsetHeight; \}catch\(e\)\{\}/.test(sl),
  'then the layout is forced NOW, so the textarea is a real box before it is focused');
t(sl.indexOf('void v.offsetHeight') < sl.indexOf('ta.focus('), 'in that order, or iOS ignores the focus');
t(/ta\.focus\(\{preventScroll:true\}\)/.test(sl), 'focused without throwing the page around');
t(!/setTimeout\([^)]*ta\.focus/.test(sl), 'and never on a timer - that leaves the tap gesture and iOS refuses');

console.log('\n  THE JIM CHAT IS A CARD, NOT A SECOND SCREEN:');
/* Yusuf, 13 Sep: "when the keyboard collapsed there's no bottom to it of that
   Jim chat. It should be like a slightly overlay screen in someway. We should
   be able to see the bottom." */
const ov=slice('<div id="slogView"','<div id="slogBody"');
t(/position:fixed;inset:0/.test(ov), 'the overlay is the dim, edge to edge');
t(/background:rgba\(8,8,8,0\.72\)/.test(ov), 'and it is see-through, so the day is still behind it');
t(/backdrop-filter:blur\(14px\)/.test(ov), 'blurred, the house recipe');
t(/align-items:center;justify-content:center/.test(ov), 'with the card centred in it');
t(!/height:100vh/.test(ov), 'nothing in here is full-screen any more');
t(/<div id="slogPanel"/.test(ov), 'the chat itself is a panel');
t(/border:1px solid #2e2e2e;border-radius:22px/.test(ov), 'with a border and corners on all four sides');
t(/max-width:440px;height:100%;min-height:0/.test(ov), 'filling the overlay it sits inside, and no more');
t(/overflow:hidden/.test(ov), 'so the thread cannot paint over its own rounded corners');
/* The panel no longer touches the screen, so the safe area is paid ONCE, by the
   overlay's padding - not again by the header and the input row inside it. */
t(/padding:calc\(env\(safe-area-inset-top,0px\) \+ 12px\) 10px calc\(env\(safe-area-inset-bottom,0px\) \+ 12px\)/.test(ov),
  'the overlay pays the safe area');
const head=slice('<div id="slogPanel"','<div id="slogBody"');
t(/padding:15px 16px 12px/.test(head), 'the header does not pay it again');
const row=slice('<div id="slogBody"','id="jConvoView"');
t(/padding:11px 12px 12px/.test(row), 'and neither does the input row');
t(/<\/div>\n   <\/div>\n  <\/div>/.test(src), 'and the panel is closed inside the overlay');
/* Same way out as every other sheet on the page. */
t(/id="slogView" onclick="slogBackdrop\(event\)"/.test(src), 'tapping the dim is a way out');
const bd=slice('function slogBackdrop(ev){','function openSmartLog(){');
t(/ev\.target\.id==='slogView'/.test(bd), 'and only the dim - a tap on the card must not close it');
/* _slogFit already tracked the visible viewport; with the card inset it is what
   keeps the bottom edge on screen when the keyboard is up. */
const fitS=slice('function _slogFit(){','function openSmartLog(){');
t(/v\.style\.height = window\.visualViewport\.height/.test(fitS), 'and the card still follows the keyboard');

console.log('\n  JIM DOES NOT SPEAK IN ASTERISKS:');
/* Found 13 Sep in a screenshot of his own chat: a reply printed literally as
   "**What's your day look like this week?**". Three surfaces, all textContent,
   no markdown anywhere in this app. */
const SAY=closure(['_jimSay','_jvStripMd']);
t(!SAY.unparsable || !SAY.unparsable.length, 'the helper lifts cleanly', JSON.stringify(SAY.unparsable||[]));
eval(SAY.code||'');
t(_jimSay('**Whats your day look like?** You are on a 5-lift schedule')==='Whats your day look like? You are on a 5-lift schedule',
  'the asterisks go');
t(_jimSay('- 4 sets squats\n- 4 sets leg press')==='- 4 sets squats\n- 4 sets leg press',
  'and a dash list is left EXACTLY as Jim writes it');
t(_jimSay(null)==='' && _jimSay(undefined)==='', 'nothing in, nothing out');
t(/function _jimSay\(s\)\{/.test(src), 'one seam');
t(/return _jvStripMd\(/.test(slice('function _jimSay(s){','function buildBubble(m){')),
  'and it reuses the stripper that already exists rather than a second one');
t(!/_jvBulletRows/.test(slice('function _jimSay(s){','function buildBubble(m){')),
  'never _jvBulletRows, which eats the dashes - its own comment says so');
/* All three surfaces, so rows already saved in chat_messages come out clean. */
t(/txt\.textContent=\(m\.role==='assistant'\) \? _jimSay\(m\.content\) : \(m\.content\|\|''\);/.test(src),
  'the thread bubble runs it, and only on what Jim said');
t(/\+_escHtml\(_jimSay\(m\.content\)\)\+'<\/div>'/.test(src), 'the Log-anything thread runs it');
t(/_typeInto\(function\(\)\{ return document\.getElementById\('slogMsg'\+ix\); \}, _jimSay\(reply\),/.test(src),
  'and so does the typing animation, or it would type them and then swap');

console.log('\n  NOBODY IS BEHIND:');
t(!/Behind\?/.test(src), 'the word does not appear anywhere Jim speaks');
t(/A whole day at once is fine/.test(src), 'the day version is an offer');
t(/A whole week at once is fine/.test(src), 'so is the week version');
t(/v:'Log any day',/.test(src), 'and the card row is a thing Jim can do, not a diagnosis');
t(src.indexOf('Describe several days at once and I')>=0
  && src.indexOf('ll put each one where it belongs.')>=0, 'said plainly');
t(!/Catch up/.test(slice("function _jimCanCard(){","var JIM_WAIT")), 'and "Catch up" is gone with it');

console.log('\n  SAY IT LIKE THIS - EVERY USER, NOT JUST THE FREE APP:');
t(/var _JIM_HOWTO=\[/.test(src), 'one source for the words');
const how=slice('var _JIM_HOWTO=[','];');
t((how.match(/\{h:'/g)||[]).length===4, 'four lines, down from twelve', (how.match(/\{h:'/g)||[]).length);
t(/\{h:'Food',/.test(how) && /\{h:'Training',/.test(how) && /\{h:'Cardio',/.test(how) && /\{h:'Any day',/.test(how),
  'food, training, cardio, any day');
/* The portion language is the part that WORKED - a client read it and logged
   in palms and handfuls. It stays, carried by the example instead of taught
   above it. */
t(/palms of chicken/.test(how) && /handfuls of potatoes/.test(how) && /handfuls of salad/.test(how),
  'palms and handfuls survive, inside the example');
t(/Lunch yesterday/.test(how), 'and so does logging a day you missed');
const pin=slice('function _jimPinnedHtml(){','function _jimPin(){');
t(/Say it like this/.test(pin), 'the pinned card says what to do in four words');
t(/_JIM_HOWTO\.map/.test(pin), 'and reads the one source');
t(!/Log meals with rough portions|Log training the same way/.test(src), 'the old headings are gone');
t(!/2 palms of chicken breast/.test(slice('function _jimPinnedHtml(){','function _jimPin(){')),
  'and the worked-example wall with them (the input placeholder rotator is a different thing and keeps its own)');
const inf=slice('function _jimInfoHtml(){','function _jimInfoClose(){');
t(/_JIM_HOWTO\.map/.test(inf), 'the desktop popover reads the SAME source');
t(!/clJimPopH'\+\(mt\?/.test(inf), 'and no longer keeps a second hand-typed copy');
t((src.match(/2 palms of chicken, 1\.5 handfuls of potatoes/g)||[]).length===1,
  'so the words exist in exactly one place in the file');
/* Nothing here is gated. His roster reads this card. */
t(!/_meFreeApp\(\)/.test(pin+inf+how), 'and none of it is gated to the free app');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (notes, a full box, four lines of Jim)\n');
process.exit(bad?1:0);
