// THE TOP OF A CLIENT'S SHEET IS WHO THEY ARE.
//
// Yusuf, 16 Sep, after scrolling his own app on a real client: "the first page
// is really not that useful ... what would be important here is if we have the
// person's age height, weight, and their goal in writing ... I see the
// nutrition goal that got set up for them and then I see like what their goal
// is ... I want like their personal information at the top and like a summary
// or digest ... notice how it's based with the third scroll that I finally see
// the thing that's actually like remotely interesting which is their whole day."
//
// Three scrolls to reach the only thing on the sheet that said what the person
// was actually doing. The old first card was two cells: height and weight.
//
// WHAT THIS GUARDS: the order, the facts, and the two ways this could quietly
// come undone - the old strip repainting itself back over the new card, and a
// read op being put through the write guard.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };
const between=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); return (i<0||j<0||j<i)?'':src.slice(i,j); };

console.log('\n  HIS ORDER: WHO THEY ARE, THEIR DAY, THEN THE PAPERWORK:');
const shell=between('function _covShellHtml(code){','function covClose(){');
t(shell.indexOf('covPerson') < shell.indexOf('covDay'), 'the person comes first');
t(shell.indexOf('covDay') < shell.indexOf('covAdmin'), 'their day comes SECOND, not third');
t(/<div class="covAdmin">/.test(shell), 'and the paperwork is its own block');
const person=between('function _covPersonHtml(code, open){','function _covAdminHtml(code){');
t(/_covWhoHtml\(code, undefined\)/.test(person), 'the first card on the sheet is Who they are');
t(!/_jvSalesBlock/.test(person) && !/covProgCard/.test(person),
  '  the programme and the sale are no longer above their day');
const admin=between('function _covAdminHtml(code){','// TWO CHARTS WERE SHOWING AT ONCE');
t(/covProgCard/.test(admin) && /_jvSalesBlock\(code\)/.test(admin),
  'they moved, they were not deleted');
t(/Move to inactive/.test(admin) && /Talk to Jarvis about/.test(admin),
  '  and so did every control that was with them');

console.log('\n  AND THE CARD CARRIES WHAT HE ASKED FOR:');
const who=between('function _covWhoHtml(code, prof){','function _covWhoPaint(code, prof){');
[['age','Age'],['sex','Sex'],['height','Height'],['weight','Weight']].forEach(function(r){
  t(who.indexOf("_jvProfCell(code,'"+r[0]+"','"+r[1]+"'")>=0, '  '+r[1]);
});
t(/Goal '\+Math\.round\(gw\)/.test(who), 'where they are headed');
t(/_cwGoalText\(prof\)/.test(who) && /their words, at sign-up/.test(who),
  'their goal in their OWN words, marked as theirs');
t(/_cwFuel\(prof\)/.test(who) && /cal a day/.test(who), 'the nutrition goal built for them');
t(/_cwHabit\(code\)/.test(who), 'and one line on where they are in the habit');
t(/They have not written a goal yet\./.test(who) && /No nutrition goal set for them yet\./.test(who),
  'a missing one says so rather than drawing a blank');
t(/if\(loading\) rows \+= /.test(who), 'and "reading" is not the same as "nothing"');

console.log('\n  THE HABIT LINE IS HIS WORDING, AND IT NEVER OVERCLAIMS:');
const hab=between('function _cwHabit(code){','function _covWhoHtml(code, prof){');
t(/'Just started'/.test(hab) && /'Building up'/.test(hab),
  'his buckets: first few logs is just started, then building up');
t(/in the last 7 days/.test(hab),
  'and it says SEVEN DAYS, because seven days is all the store holds');
t(!/lifetime|ever/i.test(hab), '  it never claims a lifetime it cannot see');
t(/jvTriage\.per/.test(hab), 'read from the board store already in memory, so it costs no request');

console.log('\n  THE TWO WAYS THIS COULD QUIETLY COME UNDONE:');
/* ONE. The old two-cell strip and the new card both wanted id jvProfLine_CODE,
   and _jvProfileRepaint has eight callers. Left alone, the first saved age
   would have swapped the new card back for the old strip. */
t(!/function _jvProfileLine\(code\)\{/.test(src), 'the old strip is deleted, not left to repaint over the new card');
t(/_jvProfileLine IS GONE/.test(src), '  and the file says why');
const rp=between('function _jvProfileRepaint(code){','// The weigh-in history as the centrepiece');
t(/_covWhoPaint\(code, p\|\|null\)/.test(rp), 'the repaint redraws the card that took its job');
t(/_CW_CACHE\[code\]/.test(rp), '  from the cache, so a repaint is never a request');
t(/id="cwProfLine_'\+code\+'"/.test(who), 'and the new grid has an id of its own');
/* TWO. trainerOp puts anything off the read list through the session-flip
   guard, which exists for WRITES. A refused read blanks his screen. */
const ops=between("var _TRAINER_READ_OPS=[","async function trainerOp(op, args, _retried){");
t(/'clientProfile'/.test(ops), 'clientProfile is on the read list');
t(/'clientFood','clientWorkouts'/.test(ops), '  and so are the other two reads beside it');

console.log('\n  AND IT IS ONE CALL, CACHED, THAT FAILS HONESTLY:');
const load=between('async function _covWhoLoad(code){','function _cwNum(v){');
t(/trainerOp\('clientProfile',\{code:code\}\)/.test(load), 'one door call for the whole card');
t(/if\(prof\) _CW_CACHE\[code\]=/.test(load),
  'and a failed read is never cached as an empty profile');
t(/_CW_TTL=120000/.test(src), 'the cache is short enough that an edit shows up');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (what he opens a client to find is the first thing on it)');
process.exit(bad?1:0);
