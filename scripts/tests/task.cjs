/* THE PICTURE SAYS ONE THING, THE WORDS SAY ANOTHER (Yusuf, 18 Sep).

   Dustin Fultz photographed a Chobani drink label and typed "homemade coffee".
   The app put the label's numbers on a row and NAMED that row Homemade Coffee -
   so a yogurt drink was logged under the name of a coffee, and the coffee
   itself was never logged at all.

   "It is like me taking a picture of the Nutrition Solutions food and then
   saying two slices of pizza ... just to confirm, and then it goes, you had the
   Nutrition Solutions meal plus pizza."

   The app cannot know which it is. It asks. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntask - a photo of one food and words naming another is a question, not a guess');

const lifted=closure(['_nlMismatch','_nlSaidWords','_nlMismatchHtml']);
const holes=lifted.unresolved.filter(n=>!/^_?(escHtml)$/.test(n));
ok(holes.length===0, 'it lifts with nothing missing', holes);
const F=new Function('function _escHtml(s){return String(s);}\n'+lifted.code
  +'\nreturn {_nlMismatch,_nlSaidWords,_nlMismatchHtml};')();

const withPhoto=(peekName, line, extra)=>Object.assign({photo:'data:x', peek:{name:peekName, calories:170}, line:line}, extra||{});

// ------------------------------------------------------------ HIS TWO CASES
const d=F._nlMismatch(withPhoto('Chobani Drink','homemade coffee'), null);
ok(!!d, 'Dustin’s Chobani label beside "homemade coffee" is a question');
ok(d && d.label==='Chobani Drink' && d.said==='homemade coffee', 'and it carries both sides', d);

const p=F._nlMismatch(withPhoto('Nutrition Solutions Cilantro Lime Filet Mignon','two slices of pizza'), null);
ok(!!p, 'his own pizza example is a question too');

// ------------------------------------------------ WHEN THERE IS NOTHING TO ASK
[
  ['Chobani Drink','chobani drink',                 'the words name the label exactly'],
  ['Chobani Drink','a chobani with some granola',   'the words mention the label food'],
  ['Cilantro Lime Filet Mignon','filet mignon, ate half of it', 'a portion note about the same food'],
  ['Sourdough Bread','49g sourdough bread',         'a weight stated for the same food'],
].forEach(([lab,said,msg])=>{
  ok(F._nlMismatch(withPhoto(lab,said), null)===null, 'no question when '+msg);
});
ok(F._nlMismatch(withPhoto('Chobani Drink',''), null)===null, 'no words, no question');
ok(F._nlMismatch(withPhoto('Chobani Drink','ok'), null)===null, 'and two characters is not a food');
ok(F._nlMismatch({photo:null, peek:{name:'X'}, line:'coffee'}, null)===null, 'no photo, no question');
ok(F._nlMismatch({photo:'x', peek:null, line:'coffee'}, null)===null, 'no label read, no question');
ok(F._nlMismatch(null,null)===null, 'and nothing at all does not throw');

/* The filler words in what somebody types must never count as a match, or every
   sentence would look like it named the label. */
ok(F._nlSaidWords('and the with plus from some homemade').length===0,
   'joining words are not food words');

// ------------------------------------------------------------------ THE BAND
const h=F._nlMismatchHtml(withPhoto('Chobani Drink','homemade coffee'));
ok(/class="nlAsk"/.test(h), 'the question is drawn');
ok(/Chobani Drink/.test(h) && /homemade coffee/.test(h), 'showing both sides in his own words');
ok(/170 cal/.test(h), 'and what the label is worth, so the choice has a number on it');
ok(/nlAskPick\('both'\)/.test(h) && /nlAskPick\('same'\)/.test(h), 'two choices, no more');
ok(/class="nlAskB on"[^>]*both/.test(h), 'Both is lit from the start, because that is the default');
ok(F._nlMismatchHtml(withPhoto('Chobani Drink','homemade coffee',{mismatch:'same'}))==='',
   'and it disappears once answered');

// --------------------------------------------------- IT NEVER BLOCKS THE LOG
const sub=(()=>{ const i=src.indexOf('async function nlSubmit(){');
  return src.slice(i, i+2600); })();
ok(/_nlMismatch\(st, line\)/.test(sub), 'submit checks it');
ok(/st\.mismatch!=='same'/.test(sub), 'and takes BOTH unless they said otherwise');
ok(/line = _mm\.said \+ ' and ' \+ _mm\.label/.test(sub),
   'widening what is READ, so two foods are logged instead of one wearing the other’s name');
ok(!/return;[\s\S]{0,40}_nlMismatch/.test(sub), 'it never stops the log to demand an answer');
/* st.line is the client's own words and is the record. The widening must not
   touch it - that column is what they actually typed. */
ok(sub.indexOf('st.line=line;') < sub.indexOf('_nlMismatch(st, line)'),
   'and their own words are recorded before anything is added to the read');

// a new photo forgets the answer
ok(/st\.mismatch=null;/.test(src), 'a new photo clears a previous answer');

console.log(fails? ('\ntask: '+fails+' FAILED\n') : '\ntask: all good\n');
process.exit(fails?1:0);
