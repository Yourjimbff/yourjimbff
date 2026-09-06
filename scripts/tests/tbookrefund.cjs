// GIVE THE CREDIT BACK (6 Sep, off a real client being locked out of her own app).
//
// Leandra is on the weekly check-in tier. She booked Sunday, then tried to MOVE
// it. Moving is cancel-then-rebook. Cancelling never refunded the week's credit,
// so the rebook was refused with "your next check-in call opens Sunday" and she
// ended up with NO booking at all and had to text Yusuf to sort it out. The app
// held 16 bookings that morning and not one of them was hers.
//
// This file guards the fix and, more importantly, guards the invariant the fix
// must never break: AT MOST ONE WEEKLY CREDIT PER WEEK. A refund that could mint
// a second one would be worse than the bug.
const fs=require('fs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const srv=fs.readFileSync('netlify/functions/trainer.js','utf8');
const app=fs.readFileSync('index.html','utf8');

// ===== THE REFUND IS TIED TO A REAL CANCELLATION ========================
console.log('\n  WHERE THE REFUND LIVES:');
const cancel=srv.slice(srv.indexOf('async function handleMyBookingCancel('), srv.indexOf('async function maybeRefundWeeklyCall('));
t(/maybeRefundWeeklyCall\(URL, SERVICE, code, rows\[0\]\.starts_at\)/.test(cancel),
  'the cancel handler is what calls it, with the session\'s own code');
t(cancel.indexOf('maybeRefundWeeklyCall')>cancel.indexOf("status !== 'cancelled'"),
  'and only AFTER the cancellation is confirmed, never before');
t(!/op === 'refund|refundWeeklyCall'/.test(srv),
  'there is no standalone refund op a session could call on its own');
t(/weekly_refunded: refunded/.test(cancel), 'and the answer comes back so the screen can say so');

// ===== THE INVARIANT: ONE CREDIT PER WEEK, NEVER TWO ====================
console.log('\n  IT CAN NEVER MINT A SECOND CREDIT:');
const fn=srv.slice(srv.indexOf('async function maybeRefundWeeklyCall('), srv.indexOf('// ---- logPhoto'));
t(/if \(hasWeeklyCreditNow\(row\.weekly_call_spent_at, now\)\) return false/.test(fn),
  'REFUSES when they already have a credit - the whole guard against farming');
t(/if \(!row\.weekly_call_spent_at\) return false/.test(fn), 'refuses when nothing was ever spent');
t(/row\.weekly_calls !== true.*return false/.test(fn), 'refuses on any tier that is not weekly');
t(/when\.getTime\(\) <= Date\.now\(\).*return false/.test(fn.replace(/\n/g,' ')),
  'refuses for a booking that already started - the call was had, nothing is owed');
t(/weekly_call_spent_at=eq\.\$\{encodeURIComponent\(row\.weekly_call_spent_at\)\}/.test(fn),
  'the write is conditioned on the exact stamp it read, so two cancels racing cannot both win');
t(/weekly_call_spent_at: null/.test(fn), 'and it clears the stamp rather than inventing a date');
t(/return back\.length > 0/.test(fn), 'answers true only when a row actually changed');

// ===== THE SCREEN AGREES WITH THE SERVER ================================
console.log('\n  THE PICKER UPDATES WITHOUT A RELOAD:');
const cb=app.slice(app.indexOf('async function cancelBooking(id){'), app.indexOf('// ---- the client picker'));
t(/weekly_refunded===true/.test(cb), 'the client reads the flag the door sends');
t(/cl\.weekly_call_spent_at=null/.test(cb), 'and clears its own copy, so the next slot is bookable immediately');
t(!/weekly_call_spent_at\s*=\s*new Date/.test(cb), 'it never writes a spend time of its own');
const oc=app.slice(app.indexOf('async function onCancelBooking(id){'), app.indexOf('// ===== FOLLOW:'));
t(/your call is back/.test(oc), 'and it says so out loud, so moving a call reads as moving it');
t(/_hadCredit/.test(oc) && oc.indexOf('_hadCredit')<oc.indexOf('await cancelBooking'),
  'measured before the cancel, so the message is only shown when something really came back');

// ===== THE DISCLOSURE ===================================================
console.log('\n  WHAT THE CLIENT IS TOLD, WHERE THEY BOOK:');
const rb=app.slice(app.indexOf('function renderBookingSlots('), app.indexOf('function renderBookingSlots(')+4000);
t(/How check ins work now/.test(rb), 'the recording notice is on the booking screen itself');
t(/We meet on Riverside/.test(rb), 'names the platform');
t(/camera off is fine/i.test(rb), 'tells them their camera is theirs');
t(/you get the recording/i.test(rb), 'gives them the thing that makes it a service and not a demand');
t(/never without your ok first/.test(rb), 'and states the consent promise in plain words');
t(rb.indexOf('How check ins work now')<rb.indexOf('var mine') || /html='<div style="background:rgba\(245,197,24/.test(rb),
  'drawn above the slots, so it is read before anything is picked');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all booking-refund assertions pass');
process.exit(0);
