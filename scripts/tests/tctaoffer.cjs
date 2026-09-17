// THE OFFER, ADDRESSED TO THEM.
//
// Yusuf, 17 Sep, minutes after finding out Harold Pacheco was never shown the
// consultation screen at all: "pop up a consultation suggestion on his screen
// ... make it a smart suggestion based on him. dont give him a pg message."
// Then, on the first draft: "you would reset not an automated message, and it
// looks like the most fucking automated message possible."
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i);
  if(j<0) throw new Error('stale end anchor: '+b); return src.slice(i,j); }

console.log('\n  IT HAS A PLACE ON THE PAGE THEY OPEN:');
t(/<div id="ctaOffer"><\/div>/.test(src), 'a host of its own on the Today page');
t(/if\(t==='Today'\)\{[\s\S]{0,120}?_ctaPaint\(\)/.test(src), 'painted when that tab is opened');

console.log('\n  IT DOES NOT ANNOUNCE ITSELF:');
/* Everything that made the first draft read as a mailshot. His words: the
   "not an automated message" label "looks like the most fucking automated
   message possible". */
const card=slice('function _ctaHtml(','\nfunction _ctaPickDay');
t(!/automated/i.test(card), 'no line insisting it is not automated');
t(!/From Yusuf/i.test(card), 'no FROM chip');
t(!/ctaAv|avatar/i.test(card), 'no avatar');

console.log('\n  IT SAYS WHAT HE DICTATED:');
t(/thanks for signing up/.test(card), 'it thanks them for signing up');
t(/You said you want to /.test(slice('function _ctaSay(','\n/* The picker reads')),
  'then quotes what they said they want');
t(/Schedule a time with me and I\u2019ll see how I can help you/.test(card),
  'then asks for the time, in his words');
t(/_ctaFirstName\(\)/.test(card), 'addressed by their first name');

console.log('\n  THE WORDS ARE THEIRS, NOT A TEMPLATE:');
const sh=slice('async function _ctaGoalShort(){','\nfunction _ctaSay');
t(/it\.goal_short/.test(sh), 'the shortened line is kept, so it is made once');
t(/Use THEIR words wherever/.test(sh), 'the shortening is told to keep their wording');
t(/Invent nothing/.test(sh), 'and told to invent nothing');
t(/txt\.length<raw\.length/.test(sh), 'a "shortening" longer than the original is refused');
t(/txt\.length>=8/.test(sh), 'and so is a one-word answer');
const say=slice('function _ctaSay(','\n/* The picker reads');
t(/goal_text/.test(say) && /\u201c/.test(say),
  'and if it cannot be shortened, their own sentence is quoted verbatim');

console.log('\n  WHO SEES IT:');
const el=slice('function _ctaEligible(){','\nfunction _ctaFirstName');
t(/isTrainer\(cl\.code\)\) return false/.test(el), 'never the trainer');
t(/!isFreeApp\(cl\.code\)\) return false/.test(el), 'only free signups');
t(/!profile\.setup_done\) return false/.test(el), 'only after they finished setup');
t(/it\.consult==='yes' \|\| it\.consult==='booked'\) return false/.test(el),
  'never somebody who already took it');
t(/_ctaWavedOff\(\)\) return false/.test(el), 'never somebody who waved it off');
t(/g\.length>=12/.test(el), 'and never without a goal worth quoting back');
/* A ROSTER FACT NOTHING CAN WORK OUT FOR ITSELF (Yusuf, 17 Sep: "mark arrants
   is a clients husband, not needed"). One list, one line per name, and the
   people on it keep every other thing the app does. */
t(/CTA_NOT_A_LEAD\[String\(cl\.code\|\|''\)\.trim\(\)\.toLowerCase\(\)\]\) return false/.test(el),
  'and never somebody he has said is not a lead');
t(/var CTA_NOT_A_LEAD = \{/.test(src), 'which is one named list, in one place');
t(/ujn3g4666bz/.test(src), '  with the name he gave on it');
t(/client\\u2019s husband/.test(src), '  and why, so the next person can read it');

console.log('\n  THE TIMES ARE REAL TIMES:');
const ld=slice('async function _ctaLoadDays(){','\nfunction _ctaDayLabel');
['loadAvailability','loadBookings','_loadPickerSafetyBusy','buildOpenSlots'].forEach(function(fn){
  t(new RegExp(fn.replace(/[_$]/g,'\\$&')+'\\(').test(ld), '  reads '+fn+', same as the booking modal');
});
t(/if\(safety && !safety\.ok\) return null/.test(ld),
  'fails closed when availability cannot be confirmed');
t(/days\.slice\(0,3\)/.test(ld), 'three days, the ones that actually have times in them');
t(/if\(days===null\) return ''/.test(slice('function _ctaPickerHtml(','\nfunction _ctaHtml')),
  'and offers nothing at all when it could not confirm');
t(/overflow-x:auto/.test(src) && /\.ctaTimes\{/.test(src), 'the times run sideways rather than wrapping');

console.log('\n  A MIS-TAP CANNOT BOOK HIM:');
const pick=slice('function _ctaPickerHtml(','\nfunction _ctaHtml');
t(/_ctaPickTime\(/.test(pick) && !/_ctaBook\(\)"/.test(pick.split('window._ctaSlot')[0]),
  'tapping a time only selects it');
t(/if\(window\._ctaSlot\)\{[\s\S]*?_ctaBook\(\)/.test(pick), 'the booking is a second, separate button');

console.log('\n  THE WRITE IS THE SAME ONE THE MODAL MAKES:');
const bk=slice('async function _ctaBook(){','\nasync function _ctaPaint');
t(/window\._bkConsult=true/.test(bk), 'flagged as a consult, so no plan is charged for it');
t(/createBooking\(iso\)/.test(bk), 'and booked through the one function that writes bookings');
t(/window\._bkConsult=false/.test(bk), 'and the flag is always cleared afterwards');
t(/res&&res\.taken\)\?'Someone just took that one'/.test(bk), 'a slot taken mid-decision says so');

console.log('\n  IT CANNOT CLOBBER THE REST OF THEIR SETUP:');
const mg=slice('async function _ctaMergeIntake(','\nfunction _ctaEligible');
t(/var base=_ctaIntake\(\);/.test(mg), 'it reads what is already in the row');
t(/Object\.keys\(patch\)\.forEach/.test(mg), 'and changes only the keys it was handed');
/* 17 Sep: it was an upsert, and an upsert proposes a whole new row first, so
   Postgres refused it for a missing name every single time. It never wrote a
   thing. A PATCH has no INSERT arm - see tprofilepatch. */
t(/sbPatchProfile\(\{intake_json:js\}\)/.test(mg), 'onto the row that already exists, as an update');
t(!/sbUpsert/.test(mg), '  and never as an upsert, which silently wrote nothing');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (the offer reaches him)\n');
process.exit(bad?1:0);
