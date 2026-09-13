// A BLANK LOG, NOT A HOMEWORK ASSIGNMENT.
//
// Yusuf, 13 Sep, on his own Day page as a free user with no program:
//   "Before a user has a program, there should just be a blank log for their
//    workout space. It should just be an invitation to log the easiest workout
//    ever ... Say or type what you did & I'll log and organize it."
//   "It's basically the creative mode meets the Jim Gold Bar logger - where
//    it's just a space for someone to log their workout they did by talking,
//    typing, and optionally logging a photo. This is where the workout logger /
//    input should go."
//   "Someone could and should have the ability to not create a program, and
//    just simply log what they do if they don't want to follow a program."
//   "They can even plan it ahead of time ... This aspect should be understated."
//
// What was there: a hero reading "START HERE / Build your program", over a
// chapter head reading "Nothing built yet". Two sentences telling somebody who
// wants to write down the workout they already did that there is a thing they
// have to make first.
//
// THE LAW THIS HAD TO NOT BREAK, and it is his own, on this exact screen:
// "There were two doors on this one screen - a full-width gold mic bar and a
// text field under it, near-duplicates with different feels ... One input, one
// conversation, one behaviour." So this box is not a fourth textarea. It looks
// like the input and it OPENS the input.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

const card=slice('  var _canBuild=false;','function _tlAskRow');

console.log('\n  THE INVITATION, IN HIS WORDS:');
t(/Say or type what you did and I\\u2019ll log and organise it\./.test(card),
  '"Say or type what you did and I’ll log and organise it."');
t(/class="tlLogEy">Log your workout</.test(card), 'headed Log your workout');
t(!/Build your program<\/div>/.test(card), 'and "Build your program" is no longer the hero HERE');
/* It is still the hero on the PROGRAM tab, where building a program is the
   whole point of the screen. What he objected to is meeting it on the Day page
   when all he wanted was to write down the workout he had just done. */
t((src.match(/Build your program<\/div>/g)||[]).length===1,
  'it survives in exactly one place, the Program tab, where it belongs',
  (src.match(/Build your program<\/div>/g)||[]).length);
t(/'<div class="tlHero tlHeroGo" onclick="pgBuildStart\(\)"/.test(src), 'and that one is untouched');
t(!/Start here<\/div>/.test(card), 'nor "START HERE", which was the instruction on top of it');

console.log('\n  TALKING, TYPING, AND OPTIONALLY A PHOTO:');
const box=slice('<div class="tlLogBox"','tlLogPlan');
t(/data-tl="wolog" data-mode="type"/.test(box), 'the box itself types');
t(/data-mode="voice"/.test(box), 'the mic talks');
t(/data-mode="photo"/.test(box), 'and the camera is there, optional, on the same row');
t(/_CD_MIC_SVG/.test(box) && /_CD_CAM_SVG/.test(box),
  'drawn with the icons the cardio sheet already uses, not a second pair');
t(/class="tlLogPh">What did you train\?</.test(box), 'and it reads like a field, because it opens one');

console.log('\n  IT IS NOT A FOURTH INPUT:');
/* His ruling: one input, one conversation, one behaviour. */
t(!/<textarea[^>]*tlLog/.test(src), 'the card carries no textarea of its own');
const handler=slice("    if(a==='wolog'){","    if(a==='progphoto')");
t(/openSmartLog\(\);/.test(handler), 'every door opens the one that already exists');
t(/slogVoice\(\)/.test(handler), 'the mic starts listening in it');
t(/slogPhotoPick\(\)/.test(handler), 'the camera opens the picker on it');
t(!/await/.test(handler),
  'and nothing is awaited before it opens - iOS only raises the keyboard from inside the gesture');

console.log('\n  THE PLAN IS UNDERSTATED, WHICH IS THE WORD HE USED:');
t(/class="tlLogPlan" data-tl="buildweek"/.test(card), 'it is still reachable');
t(/Rather plan it\? Build a program/.test(card), 'in one line');
const planCss=slice('.tlLogPlan{','.tlHeroGo{');
t(/font-size:12\.5px/.test(planCss), 'set smaller than everything above it', planCss.slice(0,60));
t(/color:rgba\(240,236,228,0\.42\)/.test(planCss), 'and dimmer');
t(!/var\(--gold\)/.test(planCss), 'with no gold on it - gold means action, and this is the quiet option');
t(/\.tlLogIco\{[^}]*color:var\(--gold\)/.test(src), 'while the mic and camera, which DO something, carry it');

console.log('\n  AND THE HEAD NO LONGER PASSES JUDGEMENT:');
/* "Nothing built yet" over an open log is the app disagreeing with its own
   invitation, and it is the same voice he cut from Jim on 12 Sep. */
t(!/'Nothing built yet'/.test(src), '"Nothing built yet" is gone');
t(/: ''\);/.test(slice("      var _woSt=_woDone ? 'Done'","      _WO_OPEN=")),
  'a day with no program says nothing about it');

console.log('\n  A PHOTO IS A MESSAGE:');
/* The card had no camera at all, and its send refused an empty text box - so a
   photo of the whiteboard with nothing typed beside it would have gone nowhere. */
const send=slice('async function slogSend(){','// voice');
t(/if\(!text && !_ph\.length\) return;/.test(send), 'a photo on its own is enough to send');
t(/reply=await jimDoor\(text, _ph\);/.test(send), 'and it actually reaches Jim');
t(/has_image:_ph\.length>0/.test(send), 'the saved row knows it had one');
t(/content:\(text\|\|'\(photo\)'\)/.test(send), 'and the thread shows something rather than a blank bubble');
t(/id="slogCam"/.test(src), 'the card has the camera the tab always had');

console.log('\n  ONE PENDING LIST, NOT TWO:');
/* Two arrays of pending photos would not stay in step, and the one that was
   wrong would be the one that sent. */
t(/var i=document\.getElementById\('chatPhotoInput'\);/.test(slice('function slogPhotoPick(){','function renderSlogThumbs')),
  'the card borrows the file input the tab already owns');
t(/try\{ renderSlogThumbs\(\); \}catch\(e\)\{\}/.test(slice('function renderChatPhotos(){','function removeChatPhoto')),
  'one paint draws both strips');
t(/removeChatPhoto\('\+i\+'\)/.test(slice('function renderSlogThumbs(){','// voice')),
  'and removing one removes it from the one array');
t(/try\{ clearChatPhoto\(\); \}catch\(e\)\{\}/.test(send), 'sending empties it once, for both');
t(/var _pb=document\.getElementById\('chatPbtn'\); if\(_pb\)/.test(src),
  'and clearing from the card cannot throw on an element that belongs to the tab');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
