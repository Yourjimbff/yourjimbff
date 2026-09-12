// A BOOKED CONSULT'S PHONE NUMBER, AND WHERE THE CARD LIVES ON HIS PHONE.
//
// Yusuf, 12 Sep, on a 1:11am booking that landed with the name "Test":
//
//   "I also don't know why would that number appear that way. Do you realize
//    that that's a malfunction? If we were going to put in a test, why would
//    we put in the digit short?"
//   "Well, shouldn't there be a way for me to view it um, on mobile as well?
//    I know it's under the sales tab, but I haven't opened up the computer
//    view in like several days."
//
// What was actually stored on that row: "4692580 66" - nine digits with a
// space in the middle. The offer page took it. Then the card drew it as an
// sms: link with a Text button and a Confirmation button beside it, three
// separate invitations to text a number that can never send.
//
// And booked consults WERE on mobile - inside the account sheet, then Back
// office, then Money, under the revenue card. Three taps and a card deep,
// which is why he had never seen one there.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

// ---------------------------------------------------------------- the test itself
const CL=closure(['_cqPhone','_cqRowHtml','_cqActsDefaultHtml']);
t(!CL.unparsable || !CL.unparsable.length, 'every function this test needs lifted cleanly',
  JSON.stringify(CL.unparsable||[]));
global.window={};
eval(CL.code||'');
t(typeof _cqPhone==='function', 'there is one phone test, in one place');

console.log('\n  WHAT COUNTS AS A NUMBER YOU CAN TEXT:');
t(_cqPhone('4692580 66').digits===9, 'the row that started this reads as nine digits',
  JSON.stringify(_cqPhone('4692580 66')));
t(_cqPhone('4692580 66').ok===false, 'and nine digits is not textable');
t(_cqPhone('4692580066').ok===true, 'ten is');
t(_cqPhone('+17034009376').ok===true, 'so is a number written the long way');
t(_cqPhone('(469) 258-0066').ok===true, 'brackets and dashes are not digits and are not counted');
t(_cqPhone('').has===false && _cqPhone(null).has===false,
  'no number at all is its own case, not a short one');

console.log('\n  A SHORT NUMBER SAYS SO, INSTEAD OF PRETENDING:');
const short={id:99, name:'Test', phone:'4692580 66', requested_at:'2026-09-13T18:30:00+00:00',
             status:'accepted', age:34, height:'5ft9', weight:'200lbs', main_problem:'', goal:''};
const good=Object.assign({}, short, {id:98, phone:'4692580066'});
const shortHtml=_cqRowHtml(short), goodHtml=_cqRowHtml(good);
t(!/sms:/.test(shortHtml), 'the short number is not a tap-to-text link');
t(/Only 9 digits/.test(shortHtml), 'the card says how short it is, in words');
/* Yusuf, 12 Sep: "If I can't fucking text him, what makes you think I can call
   him" - the consult IS a phone call to this number, so there is no call on
   which to ask for a better one. The line must not send him anywhere. */
t(!/on the call/.test(shortHtml) && !/Ask them/.test(shortHtml),
  'and does not tell him to ask for it on a call that cannot happen');
t(/no way to reach them/.test(shortHtml), 'it says the whole truth instead');
t(/4692580 66/.test(shortHtml), 'and still shows exactly what they typed - nothing is hidden');
t(/sms:4692580066/.test(goodHtml), 'a real number is still one tap to text');
t(!/cannot be texted/.test(goodHtml), 'and says nothing about digits');

console.log('\n  AND THE BUTTONS MATCH WHAT THE NUMBER CAN DO:');
const sa=_cqActsDefaultHtml(short), ga=_cqActsDefaultHtml(good);
t(!/Confirmation/.test(sa), 'no Confirmation button on a number that cannot receive one');
t(!/>Text</.test(sa), 'no Text button either');
t(/Cancel/.test(sa), 'Cancel is still there - the booking is real even if the number is not');
t(/Confirmation/.test(ga) && />Text</.test(ga) && /Cancel/.test(ga),
  'all three on a number that works');

// ------------------------------------------------------- where it lives on mobile
console.log('\n  BOOKED CONSULTS ARE AT THE TOP OF THE CRM TAB NOW:');
const paint=slice('function crmPaint(){', 'function _crmFit(ta){');
t(/<div id="crmConsultsHost"><\/div>/.test(paint), 'the CRM tab has a slot for the card');
t(paint.indexOf('crmConsultsHost') < paint.indexOf('_crmBoardRows()'),
  'and the slot is above the board, not under it');
t(/try\{ _cqBorrowIntoCrm\(\); \}catch\(e\)\{\}/.test(paint), 'the card is moved into it after the paint');
t(/function _cqBorrowIntoCrm\(\)\{/.test(src) && /function _cqParkConsults\(\)\{/.test(src),
  'one mover in, one mover out');

console.log('\n  ONE CARD, NOT A SECOND COPY OF IT:');
t(src.split('id="consultsCard"').length-1===1, 'there is still exactly one consults card in the markup');
t(src.split('id="consultsList"').length-1===1, 'and one list inside it');
t(/if\(card\.parentNode!==slot\) slot\.appendChild\(card\);/.test(src),
  'the CRM borrows that node rather than rendering its own');

console.log('\n  AND IT SURVIVES A REPAINT, WHICH IS THE WHOLE RISK:');
const split=slice('function _crmPaintSplit(host, h, nPeople){', 'function crmQuery(');
t(split.indexOf('_cqParkConsults') >= 0 && split.indexOf('_cqParkConsults') < split.indexOf('a.innerHTML=parts[0]'),
  'the card is handed back before anything writes innerHTML over it');
t(/try\{ _cqParkConsults\(\); \}catch\(e\)\{\}\n    host\.innerHTML=h; return;/.test(src),
  'including on the error path, which replaces the whole tab');
t(/_consultRows===null && !window\._cqCrmAsked/.test(src),
  'and the board is read once, not on every keystroke in the search box');

console.log('\n  IT LEFT MONEY, SO IT IS NOT IN TWO PLACES:');
t(!/\['consultsCard','salesCard'\]/.test(src), 'the back office no longer borrows it');
t(/sub:'revenue, and what is still owed'/.test(src), 'and no longer promises it');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good\n');
process.exit(bad?1:0);
