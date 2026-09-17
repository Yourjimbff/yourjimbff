/* THE BOX BECOMES A CONVERSATION ONCE THE PACKET IS READ (17 Sep).
   His order, and the second half of it is the whole feature:
     "i ate half of this should automatically adjust the macros. i didnt eat the
      plantains - should remove the carbohydrates from it (NOT ENTIRELY, BUT
      PROPORTIONALLY). Consider how for instance its breaded chicken, so there
      are some carbs in that. so it shouldnt take off all of it."
   Taking the plantains off a breaded chicken meal does not remove 55g of
   carbohydrate. That cannot be arithmetic - it needs something that knows what
   those words are made of, and the packet has already printed them. */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };
function slice(a,b){
  const i=src.indexOf(a); if(i<0) throw new Error('tadjust: start anchor missing: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('tadjust: end anchor missing after start: '+b);
  return src.slice(i,j);
}
console.log('\ntadjust - the box takes instructions');

const adj=slice('async function _nlAdjust(st){','function _nlPeekPaint(st){');

// ---- THE RULE HE ACTUALLY ASKED FOR
ok(/ITS OWN SHARE and not/.test(adj), 'a component they left is worth its own share, not the whole macro');
ok(/breading carries carbs/.test(adj), 'and the breading is named, because that is the case he gave');
ok(/ingredients/i.test(adj), 'the packet’s own ingredient list goes up with the question');

// ---- measured from the PACKET, never from the last answer
ok(/st\.peekBase/.test(adj), 'every adjustment is measured from the printed numbers');
const peek=slice('st.peekBase={calories:','try{ _nlAdjFor');
ok(/out\.calories/.test(peek), 'which are captured once, when the packet is read');
ok(!/peekBase=\{calories:st\.peek\.calories/.test(src), 'and never overwritten by an adjustment');

// ---- an empty box means the packet as printed
const reset=slice('function _nlAdjReset(st){','async function _nlAdjust(st){');
ok(/st\.peek\.calories=b\.calories/.test(reset), 'deleting the sentence puts the numbers back');
ok(/adjNote=''/.test(reset), 'and takes the note off with them');

// ---- the guards
ok(/if\(seq!==_nlAdjSeq \|\| window\._nl!==st\) return false;/.test(adj),
   'a stale answer never lands on a newer sentence');
ok(/if\(said===_nlAdjFor\) return false;/.test(adj), 'the same sentence is not asked twice');
ok(/if\(said\.length<4\) return false;/.test(adj), 'and somebody mid-word is not asked at all');
ok(/1100\)/.test(slice('function _nlAdjSoon(st){','function _nlAdjReset(st){')),
   'it waits for them to stop typing, not a request per keystroke');

// ---- a failed read puts the packet back rather than leaving a wrong number up
ok(/if\(!o \|\| !isFinite\(\+o\.calories\)\)\{[^]*?st\.peek\.calories=b\.calories/.test(adj),
   'a failed read restores the printed numbers');
ok(/function cap\(v, hi\)/.test(adj) && /if\(n<0\) n=0;/.test(adj),
   'nothing goes below zero or runs away above the packet');

// ---- and the box says what it now does
const ph=slice('function _nlAdjPlaceholder(st){','function _nlAdjSoon(st){');
ok(/Ate half\?/.test(ph), 'the placeholder changes once a packet has been read');
ok(/Describe or estimate/.test(ph), 'and changes back when there is no packet');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(adj+ph), 'no emoji (house law)');

// ---- one footer, never two
const html=slice('function _nlPeekHtml(st){','function _nlFastName(echo, line){');
ok(/p\.adjNote\s*\n?\s*\?/.test(html) || /p\.adjNote/.test(html), 'the card shows what it worked out');
/* The ready line is gone entirely (v526) - it said what the Log it button
   directly under it already said, and cost a block of height on a screen where
   that button was already touching the bottom edge. So the worked-out line is
   the only thing that can appear below the ingredients, and it appears only
   when there is something to say. */
ok(/nlPkA/.test(html) && !/nlPkF/.test(html),
   'the worked-out line is the only thing under the ingredients, and only when earned');
ok(/p\.adjNote \? \(/.test(html), 'nothing is drawn there when there is nothing to say');

console.log(fails?('\n  '+fails+' FAILED\n'):'\n  all passed\n');
process.exit(fails?1:0);
