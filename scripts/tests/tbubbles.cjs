// HOW IT ACTUALLY LANDS (Yusuf, 5 Sep).
//
// Re-measured across 10,138 of his real outgoing texts: median SEVEN words,
// 63% under ten, 89% under twenty, 1% past forty. One text on 69% of turns,
// two or more on the other 31%.
//
// Every draft on the board was going out as one block with blank lines inside
// it, and he could not SEE that, because in a textarea a paragraph and four
// short texts look the same. This is the preview that makes it visible.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const MINE=['_BUB_LONG','_dfBubbles','_dfBubblesHtml'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

// ===== A BLANK LINE IS A SEPARATE TEXT =================================
console.log('\n  ONE BUBBLE PER BLOCK:');
const REAL="179.7. I logged it in the app for you\n\nFirst weight on your record. Same time every morning from here and that line starts telling us something";
t(_dfBubbles(REAL).length===2, 'the Andrew message is TWO texts, not one', String(_dfBubbles(REAL).length));
t(_dfBubbles("Weigh in\n\nMake me a sticker and you get a pass").length===2, 'so is the Blake one');
t(_dfBubbles("Thats what im talking about").length===1, 'and a single line is one');
t(_dfBubbles("a\n\n\n\nb").length===2, 'several blank lines are still one break');
t(_dfBubbles("  \n\n  a  \n\n ").length===1 && _dfBubbles("  \n\n  a  \n\n ")[0]==='a',
  'whitespace-only blocks are dropped and the rest is trimmed');
t(_dfBubbles('').length===0 && _dfBubbles(null).length===0, 'nothing in, nothing out');
t(_dfBubbles("line one\nline two").length===1,
  'a SINGLE newline is not a break - it stays inside one text, same as typing it');

// ===== THE COUNT IS ON EVERY BUBBLE ====================================
console.log('\n  IT SHOWS THE LENGTH, WHICH IS THE WHOLE POINT:');
const h=_dfBubblesHtml(REAL);
t(/<i>9<\/i>/.test(h),  'the first is 9 words');
t(/<i>18<\/i>/.test(h), 'the second is 18 - both well inside how he writes');
t(/2 texts · how it lands/.test(h), 'and the header says how many will arrive', h.slice(0,80));
t(/1 text · how it lands/.test(_dfBubblesHtml("Weigh in")), 'singular for one');

// ===== TOO LONG IS MARKED, MEASURED OFF HIS OWN NUMBERS ================
console.log('\n  OVER 25 WORDS IS OUTSIDE HOW HE WRITES:');
t(_BUB_LONG===25, 'the line is 25 words - his p95 is 26 and 89% of his texts are under 20', String(_BUB_LONG));
const LONG=new Array(31).join('word ');
t(/dfBub long/.test(_dfBubblesHtml(LONG)), 'a 30 word block is marked');
t(/1 too long/.test(_dfBubblesHtml(LONG)), 'and counted in the header');
t(!/dfBub long/.test(_dfBubblesHtml(REAL)), 'and his real 18 word block is not flagged');
const TWO=LONG+"\n\n"+LONG;
t(/2 too long/.test(_dfBubblesHtml(TWO)), 'two long blocks say two');

// ===== HIS OWN SENT MESSAGES, WHICH MUST LOOK RIGHT ====================
console.log('\n  MESSAGES HE ACTUALLY SENT TODAY:');
[["Howve you been?\n\nProgress been looking good? Or has it not",2],
 ["You cant do both, pick building\n\n130 did its job. The butt only comes back on more food\n\nIll set your number today",3],
 ["Consistency in eating great food - thats what it sounds like?\n\nCan you confirm\n\n168 - I logged it in the app for you. First one on your record",3]
].forEach(function(p){
  const n=_dfBubbles(p[0]).length;
  t(n===p[1], p[1]+' texts: '+p[0].split('\n')[0].slice(0,40), 'got '+n);
  t(!/dfBub long/.test(_dfBubblesHtml(p[0])), '  and none of them runs long');
});

// ===== IT IS A PREVIEW, NOT AN EDITOR ==================================
console.log('\n  IT PREVIEWS, IT NEVER CHANGES THE MESSAGE:');
const src=fs.readFileSync('index.html','utf8');
t((src.match(/\+ _dfBubblesHtml\(d\.text\)/g)||[]).length===2, 'drawn on both surfaces',
  String((src.match(/\+ _dfBubblesHtml\(d\.text\)/g)||[]).length));
t(/<\/textarea>'\n\s*\+ _dfBubblesHtml\(d\.text\)/.test(src), 'and UNDER the box, not replacing it');
const q=src.slice(src.indexOf('function _crmBatchQueue(){'), src.indexOf('function crmBatchOpen('));
t(!/_dfBubbles/.test(q), 'the queue does not use it - nothing is dropped for being long');
t(!/_dfBubbles[^;]*\.value\s*=/.test(src), 'and it never writes back into the textarea');
t(/\.dfBub\{/.test(src) && !/\+'\.dfBub\{[^']*\n/.test(src), 'styled, one quoted line per rule');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all bubble assertions pass');
process.exit(0);
