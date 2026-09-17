/* THE PACKET READS ITSELF THE MOMENT THE PHOTO LANDS (17 Sep).
   His screenshot: a Nutrition Solutions sleeve attached, "CARIBBEAN PINEAPPLE
   CHICKEN TENDERS" and 527/43/55/15 printed plainly on it, and the box under it
   still reading "Describe or estimate how much you ate, and list everything in
   it". The reader that can read that sleeve already existed - it just sat
   behind the Log it button, so the one moment a person is deciding whether this
   app is any good, it asked them to type what the packet already said. */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };
function slice(a,b){
  const i=src.indexOf(a); if(i<0) throw new Error('tpeek: start anchor missing: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('tpeek: end anchor missing after start: '+b);
  return src.slice(i,j);
}
console.log('\ntpeek - the packet reads itself on attach');

// ---- it fires on ATTACH, not on submit
const pick=slice('function nlPhotoPicked(input){','// LIVE-FILTERED CHIPS');
ok(/_nlLabelPeek\(st\)/.test(pick), 'the read starts the moment the photo is in');
ok((pick.match(/_nlLabelPeek\(st\)/g)||[]).length===2,
   'and also when only the small copy survived, so a bad compress still gets read');
ok(/_nlPeekClear\(st\)/.test(pick), 'a NEW photo clears the old reading first');
ok(pick.indexOf('_nlPeekClear(st)') < pick.indexOf('_nlLabelPeek(st)'),
   'in that order, or the new photo would show the old packet');

// ---- the card has a home, above what they type
const rend=slice("if(st.stage==='cap'){","else if(st.stage==='busy'){");
ok(/id="nlPeek"/.test(rend), 'the card has its own container');
ok(rend.indexOf('id="nlPeek"') < rend.indexOf('class="nlSay"'),
   'and it sits between the photo and the box, where they are already looking');

// ---- the read itself
const peek=slice('async function _nlLabelPeek(st){','function _nlPeekPaint(st){');
ok(/if\(seq!==_nlPeekSeq \|\| window\._nl!==st \|\| st\.logged\) return false;/.test(peek),
   'a stale read never paints over a newer photo or a closed sheet');
ok(/st\.peekMiss=true/.test(peek), 'a plate with no label is recorded as a miss, not an error');
ok(/st\.peekRaw=lab/.test(peek), 'the RAW label is kept, because one place converts and only one');
ok(/ingredients/.test(peek), 'the ingredient line is carried through');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(peek), 'no emoji (house law)');

// ---- Log it must not pay for the same read twice
const sub=slice('var _peeked =','var _estP =');
ok(/st\.peekRaw && st\.peek/.test(sub), 'Log it reuses what attach already read');
ok(/Promise\.resolve\(_peeked\)/.test(sub), 'and resolves it immediately instead of re-reading');
ok(/!st\.peekMiss/.test(sub), 'a photo already judged label-less is not read a second time');
ok(!/_nlFromLabel/.test(sub), 'the conversion is left to the one place that does it');
/* DOUBLE CONVERSION IS THE FAULT THIS ORDER EXISTS TO PREVENT. _labelLate is
   the single place that turns a raw label into a row, and its servings-per-
   container arithmetic run twice over its own answer would double a meal. */
const late=slice('var _labelLate=_labelP.then','try{\n    est=await Promise.race');
ok((late.match(/_nlFromLabel\(/g)||[]).length===1,
   'the raw label is converted exactly once, in the one place that does it',
   (late.match(/_nlFromLabel\(/g)||[]).length);

// ---- the card
const html=slice('function _nlPeekHtml(st){','function _nlFastName(echo, line){');
ok(/_foodNameClean\(p\.name/.test(html), 'the title goes through the same name rule as every log');
ok(/nlPkT/.test(html) && /nlPkM/.test(html) && /nlPkI/.test(html),
   'title, macros and ingredients all have a place');
ok(/Nutrition info/.test(html), 'and it says where the numbers came from, in his words');
/* HE HAD TO SAY THIS TWICE AND THE SECOND TIME HE WAS ANGRY. "change read off
   the packet to nutrition info" - I changed the finished card's eyebrow, left
   the WAITING pill still saying "Reading the packet", and then told him his
   phone was stale. His phone was fine. Both strings are asserted now. */
ok(!/the packet<\/div>/.test(src) && !/Reading the packet/.test(src),
   'and so does the waiting line - there is no "packet" wording left anywhere');
ok(/Reading the nutrition info/.test(src), 'the waiting line is his wording too');
// The ready line said what the Log it button under it already said, and cost a
// block of height doing it on a screen where that button was hitting the edge.
ok(!/Ready to log/.test(src), 'the redundant ready line is gone');
const wait=slice('.nlPkWait{','.nlPkDot{');
ok(/min-height:\d+px/.test(wait),
   'the waiting state holds the height the answer will take, so nothing jumps when it lands');

// ---- HIS NOTE, 17 Sep, looking at it on his own phone: "the spacing needs to
// be improved". Inconsistent spacing is the tell that reads as unfinished, so
// every gap on this card comes off one declared scale and nothing else.
const css=slice('.nlPk{','@media (prefers-reduced-motion:reduce)');
const scale=css.match(/--pk1:(\d+)px;\s*--pk2:(\d+)px;\s*--pk3:(\d+)px/);
ok(!!scale, 'the card declares one spacing scale');
const strays=(css.match(/(?:margin-top|padding-top|gap):\s*\d+px/g)||[])
  .filter(d=>!/:\s*(?:0|1|2)px/.test(d));
ok(strays.length===0, 'and every gap is taken from it, not typed by hand', strays);
ok(/animation:nlPkIn/.test(css) && /animation:nlPkUp/.test(css),
   'the card and its numbers arrive, rather than appearing');
ok(/prefers-reduced-motion:reduce\)\{\s*\.nlPk,\.nlPkC\{animation:none/.test(src),
   'and anybody who asked for less motion gets none');
ok(/font-variant-numeric:tabular-nums/.test(css), 'the numbers line up in their columns');

// ---- the brand belongs on its own line, not eating the title's 55 characters
const brandcut=slice('var rawT=String(p.name','var title=_foodNameClean(rawT)');
ok(/p\.brand/.test(brandcut), 'the brand is taken off the title before it is clipped');

// ---- glass, per house law, and the title is the biggest thing on it
ok(/\.nlPk\{[^]*?backdrop|\.nlPk\{[^]*?radial-gradient/.test(src), 'the card is glass, not flat grey');
const t=src.match(/\.nlPkT\{[^}]*font-size:(\d+)px/);
const c=src.match(/\.nlPkC b\{[^}]*font-size:(\d+)px/);
ok(t && c && (+t[1]) > (+c[1]),
   'the meal NAME is larger than the numbers - it is what a person checks first',
   t&&c?{name:+t[1],macro:+c[1]}:null);

console.log(fails?('\n  '+fails+' FAILED\n'):'\n  all passed\n');
process.exit(fails?1:0);
