// "THE APP IS DOING THE THING AGAIN" (Lailee, 11 Sep, third report).
//
// Her dinner, typed exactly as she typed it, with a PHOTO of the plate attached:
//   "7 ounces of salmon, 2 handfuls veggies (zucchini, broccoli, green beans,
//    and 1 handful of sweet potatos"
// The echo showed 401 cal in bold on the salmon line. The meal landed at 613.
//
// THE CAUSE WAS NOT THE ECHO. nlSubmit only sent a photo-ONLY capture down the
// road that reads pictures. Attach a photo AND type what it is - which is what
// she does every time - and the FAST road took it: priced the words off the
// table, committed the row on that, and handed the photograph straight to
// storage without one thing ever looking at it. The leftovers were then
// re-priced from the same words, with the plate sitting right there unread.
//
// Three of her five foods had no row at all: green beans and zucchini were not
// in the table, and "sweet potatos" missed by one letter.
const fs=require('fs'), vm=require('vm');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&x!==''?('  '+x):'')); };

const SAID='7 ounces of salmon, 2 handfuls veggies (zucchini, broccoli, green beans, and 1 handful of sweet potatos';

console.log('  A PHOTO IS NOT DECORATION:');
const sub=src.slice(src.indexOf('async function nlSubmit(){'), src.indexOf('async function nlSubmit(){')+2600);
t(/if\(line && \(_nlStated\(line\) \|\| \(!st\.photo && _nlFastOn\(\)\)\)\)\{/.test(sub),
  'a photo with words on it takes the road that reads the picture');
t(/!st\.photo && _nlFastOn\(\)/.test(sub),
  'the fast road is for words alone now, not for words standing next to an unread photograph');
t(/_nlStated\(line\) \|\|/.test(sub),
  "but her OWN stated numbers still skip the model, photo or not - her figures are her figures");
t(/content\.push\(\{type:'image'/.test(src) && /st\.photo\)\{[\s\S]{0,200}?type:'image'/.test(src),
  'and that road sends the image up with her words');

console.log('\n  THE FOODS ON HER PLATE HAVE ROWS NOW:');
const ctx={String,Math,Number,Array,Object,JSON,RegExp,isFinite,parseFloat,parseInt,window:{},console,document:{}};
vm.createContext(ctx);
vm.runInContext(closure(['_nlEcho','_nlSaidFoods','_mtRow','_nlSameFood','_qtyParse']).code, ctx);
const row=(n)=>vm.runInContext('(function(){var r=_mtRow('+JSON.stringify(n)+'); return r&&_nlSameFood('+JSON.stringify(n)+',r)?r.k:null;})()', ctx);
t(row('green beans')==='green beans', 'green beans', String(row('green beans')));
t(row('zucchini')==='zucchini', 'zucchini', String(row('zucchini')));
t(row('asparagus')==='asparagus', 'asparagus');
t(row('cauliflower')==='cauliflower', 'cauliflower');

console.log('\n  AND ONE LETTER NO LONGER SENDS A FOOD TO THE MODEL:');
t(row('sweet potatos')==='sweet potato', 'her spelling of sweet potato is accepted', String(row('sweet potatos')));
t(row('sweet potatoes')==='sweet potato', 'and so is the right one');
t(row('chicken breasts')==='chicken breast', 'the plural rule did not break anything that already worked');
t(row('protein banana bread')===null,
  'AND THE GATE STILL REFUSES A FOOD THAT ONLY CONTAINS ANOTHER FOOD S NAME - the whole reason it exists');

console.log('\n  A LIST S LAST ITEM OPENS WITH "AND":');
const e=vm.runInContext('_nlEcho('+JSON.stringify(SAID)+')', ctx);
const byName={}; e.lines.forEach(L=>byName[L.said]=L);
t(!!byName['and 1 handful of sweet potatos'] && byName['and 1 handful of sweet potatos'].known,
  'the sweet potato prices with the "and" still on the front of it');
t(Math.round(byName['and 1 handful of sweet potatos'].calories)===124,
  'as ONE handful, not one of something else', String(Math.round(byName['and 1 handful of sweet potatos'].calories))+' cal');

console.log('\n  HER PLATE, END TO END:');
t(e.lines.length===5, 'five foods out of her sentence', String(e.lines.length));
t(e.unpriced===1, 'four of them priced off the table - it was two before', String(5-e.unpriced)+' priced');
t(byName['2 handfuls veggies (zucchini'] && !byName['2 handfuls veggies (zucchini'].known,
  'the unclosed bracket is the one left, and it SHOULD be: "2 handfuls veggies (zucchini, broccoli, green beans" names the same vegetables twice, so guessing it would double-count her plate');
t(Math.round(e.total.calories)===593,
  'the table now accounts for 593 of the 613 that landed', Math.round(e.total.calories)+' cal');
t(e.lines.filter(L=>L.known&&!L.est).length!==e.lines.length,
  'and the echo still prints no total, because one item is still unpriced');

console.log(bad? '\n  '+bad+' FAILED' : '\n  her plate reads the way she typed it');
process.exit(bad?1:0);
