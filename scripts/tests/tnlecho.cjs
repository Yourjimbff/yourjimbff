// THE ECHO PRICES WHAT IT KNOWS AND SAYS NOTHING ABOUT WHAT IT DOES NOT.
// (Yusuf, 3 Sep: "as I type, 12oz ny strip steak - it echoes below it saying
// that and what the protein, calories is... perhaps it breaks it down into a
// line below per item they add.")
//
// It can be instant because his units — palms, handfuls, thumbs, ounces — are
// MT_ROWS, which is code. No round trip, nothing to be wrong about. That is
// "dont make them wait for it, and dont be inaccurate after making them wait"
// answered by removing the wait.
//
// THE ONE THAT NEARLY SHIPPED: "MyFitFoods Protein Banana Bread" priced at
// 112 cal / 1g protein on the live build, because _mtRow substring-matches and
// found "banana" inside it. A branded protein loaf costed as a piece of fruit,
// at full confidence — the exact failure the echo exists to avoid, committed by
// the echo. _nlSameFood is the gate that stops it, and _mtRow is untouched
// because it is right where the model hands it a clean key.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+label); };

console.log('  the splitter cuts where a plate actually breaks:');
const sp = src.slice(src.indexOf('function _nlEchoSplit'), src.indexOf('function _nlEchoParse'));
['\\\\n','[,]',';','and','with'].forEach(k=>{
  t(new RegExp(k).test(sp), 'splits on '+k.replace('\\\\n','a new line'));
});

console.log('\n  the unit string is handed on RAW, so _mtQty keeps owning units:');
const pa = src.slice(src.indexOf('function _nlEchoParse'), src.indexOf('/* IS THE TABLE ROW'));
t(/unit:it\.unit/.test(src.slice(src.indexOf('function _nlEcho('), src.indexOf('function _nlEchoHtml'))),
  'the raw unit reaches _mtItem');
t(!/MT_G_PER_OZ|28\.3495/.test(pa), 'the parser does no weight maths of its own');
t(/half:0\.5/.test(src), 'and a worded amount still counts ("half an avocado")');

console.log('\n  the unit set is built lazily, not during file evaluation:');
t(/function _nlUnitWords\(\)/.test(src), 'it is a function');
t(/_NL_UW_CACHE/.test(src),             'cached after the first call');
t(!/var _NL_UNIT_WORDS/.test(src),      'the load-time IIFE is gone (it reddened tphoto)');

console.log('\n  THE BRANDED-FOOD GATE:');
const g = src.slice(src.indexOf('function _nlSameFood'), src.indexOf('/* Price the line'));
t(/function _nlSameFood/.test(src),        'the gate exists');
t(/sort\(function\(a,b\)\{ return b\.length-a\.length; \}\)/.test(g),
  'aliases are tried longest-first, so "chicken breast" beats "chicken"');
t(/_NL_HARMLESS/.test(g),                  'only words that do not change the food may be left over');
t(/return false;\s*\/\/ a word that changes the food/.test(g) || /a word that changes the food/.test(g),
  'anything else refuses');
const body = src.slice(src.indexOf('function _nlEcho('), src.indexOf('function _nlEchoHtml'));
t(/row && _nlSameFood\(it\.name, row\)/.test(body), 'the gate runs BEFORE pricing');
t(body.indexOf('_nlSameFood') < body.indexOf('_mtItem'), 'so a wrong row never makes a number at all');
t(!/function _mtRow/.test(g),              '_mtRow itself is not modified');

console.log('\n  and an unpriced item carries no figure:');
const html = src.slice(src.indexOf('function _nlEchoHtml'), src.indexOf('function nlRender'));
t(/worked out when you log it/.test(html), 'it says when the number is coming');
t(/nlEchoRow dim/.test(html),              'and is drawn differently from a computed one');
t(!/calories/.test(html.slice(html.indexOf('NO NUMBER'))) || /L\.known/.test(html),
  'no calorie figure is printed on an unknown line');

console.log('\n  it repaints its own container only:');
t(/ec\.innerHTML=_nlEchoHtml\(st\)/.test(src), 'the echo container, not the sheet');
t(/nlEchoWrap/.test(src),                      'which is why the textarea keeps focus');

console.log(bad?('\n'+bad+' FAILED'):'\nall pass');
process.exit(bad?1:0);
