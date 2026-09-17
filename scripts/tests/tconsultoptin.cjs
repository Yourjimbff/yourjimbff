// THE OFFER AT THE END OF SETUP.
//
// "A new button on the fresh sign in screen saying would you like Yusuf to reach
// out to you for a transformation consultation? Either a quick yes, like an opt
// in - great, itll be a text from me - and or schedule it." (Yusuf, 16 Sep.)
//
// 17 SEP, THE SECOND HALF OF THAT: the calendar stopped being a button that
// opened a modal. "Give them the whole day picker ... today, tomorrow, day
// after, and then you swipe or scroll horizontally to see times." So the times
// are on the screen itself now, and it is the SAME picker the Today card draws,
// from the same function - two booking surfaces is two things to keep in step
// and one of them always falls behind.
//
// And the words are his, dictated the same night: "see whether 1:1 guidance is
// right for you sounds like a medication ad", "replace he with I", "remove
// nothing to buy on the call", "don't say twenty minutes with me", "I want one
// on one help, something like that", "we should make it very clear what happens
// on the next step", "this is the fastest track to seeing progress".
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
const card=src.slice(src.indexOf("if(st.type==='consult'){"), src.indexOf("if(st.type==='home'){"));
const step=src.slice(src.indexOf("{k:'consult', type:'consult'"), src.indexOf("{k:'home'"));

console.log('\n  THE MEDICATION AD IS GONE:');
t(!/See whether 1:1 guidance is right for you/.test(src), 'the subtitle he called a medication ad is gone');
t(!/Nothing to buy on the call/.test(src), 'and so is "nothing to buy on the call"');
t(!/20 minutes with me/.test(src) && !/twenty minutes/i.test(card),
  'and no promise of a number of minutes nobody is holding to');
t(/q:'Want 1:1 help\?'/.test(step), 'the headline asks about the thing people already want');
t(!/s:'/.test(step), '  and carries no subtitle, because the card says it in full sentences');

console.log('\n  IT IS HIM TALKING, NOT ABOUT HIM:');
t(!/\bHe will look at\b/.test(card), 'the third person is gone from the card');
t(/We go deeper on where you are/.test(card), 'where you are');
t(/where you\\u2019re trying to go/.test(card), 'where you are trying to go');
t(/what you actually need help with/.test(card), 'and what you need help with');
t(/how it\s*'?\s*\+?'?\s*all fits together/.test(card.replace(/\s+/g,' ')) || /all fits together/.test(card),
  'and how it all fits together');
t(/Fastest way to see progress/.test(card), 'with his line about the fastest way to see progress');

console.log('\n  THEIR OWN SENTENCE IS ON IT:');
t(/a\.goal_text/.test(card), 'the goal they typed a few screens back is quoted');
t(/gq\.slice\(0,220\)/.test(card), '  trimmed, not retold');

console.log('\n  THE TIMES ARE ON THE SCREEN, NOT BEHIND A BUTTON:');
t(/_ctaDoors\(a\)/.test(card), 'the screen draws the shared doors');
t(!/Pick a time instead/.test(src), 'the button that used to open a modal is gone');
t(!/openBooking\(\)/.test(src.slice(src.indexOf('function _obConsultPick'), src.indexOf('function _obPledge'))),
  'and nothing on this path opens one');
t(/if\(st\.type==='consult'\)\{ try\{ _ctaEnsureDays\(\); \}catch\(e\)\{\} \}/.test(src),
  'the times are asked for the moment the screen draws');
t(/class="ctaDays"/.test(src) && /class="ctaTimes"/.test(src),
  'day pills, then times that run sideways');

console.log('\n  ONE DOOR FUNCTION, TWO SURFACES:');
const rep=src.slice(src.indexOf('function _ctaRepaint(){'), src.indexOf('function _ctaPickDay'));
t(/getElementById\('obCsWrap'\)/.test(rep) && /getElementById\('ctaOffer'\)/.test(rep),
  'a repaint finds whichever of the two is on screen');
t(/w\.innerHTML=_ctaDoors\(/.test(rep),
  '  and the setup screen repaints only its doors, not the whole step');

console.log('\n  THE ANSWER IS RECORDED WHEREVER IT IS GIVEN:');
let stashed=0, nexted=0;
global.window={};
global._escHtml=s=>String(s==null?'':s);
global._obSetupStash=()=>{ stashed++; };
global._ctaMergeIntake=async()=>true;
global._ctaSettled=()=>true;
global.obNext=()=>{ nexted++; };
global.setTimeout=(fn)=>{ try{ fn(); }catch(e){} };
global.document={getElementById:()=>null};
global._OB_STEPS=[{k:'consult',type:'consult'}];
global._ob={i:0,a:{}};
eval(defOf('_obConsultPick'));
guard(['_obConsultPick'], n=>eval(n));

t(_obConsultPick('yes')===true, 'a quick yes is taken');
t(_ob.a.consult==='yes', '  and written into the answers');
t(stashed>0, '  and stashed');
t(nexted===1, '  and it carries them off the screen by itself');
t(_obConsultPick('maybe')===false, 'anything else is refused');
t(_obConsultPick(null)===false, '  including nothing at all');

/* THE SAME BUTTON IS ON THE TODAY CARD, WHERE THERE IS NO SETUP FLOW AT ALL.
   It used to bail out on a missing _ob, which would have made the card's own
   text door do nothing. */
global._ob=null; stashed=0; nexted=0;
t(_obConsultPick('yes')===true, 'and it still works with no setup flow around it');
t(nexted===0, '  without trying to advance a flow that is not running');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (both doors, one picker)\n');
process.exit(bad?1:0);
