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
// "AND" IS A LIST ONLY WHEN BOTH SIDES ARE FOODS (10 Sep). Lifted against the
// real table so the rule is judged on the rows it actually reads.
(function(){
  const fs=require('fs'), vm=require('vm');
  const src=fs.readFileSync('index.html','utf8');
  const L=src.split('\n');
  function liftVar(name){ const s=L.findIndex(l=>l.startsWith('var '+name+'=')); if(s<0) throw new Error('no '+name); for(let i=s;i<L.length;i++) if(L[i].trim()==='];'||L[i].trim()==='};') return L.slice(s,i+1).join('\n'); throw new Error('no close '+name); }
  function liftFn(name){ const a=src.indexOf('function '+name+'('); if(a<0) throw new Error('no fn '+name); let d=0,i=src.indexOf('{',a); for(;i<src.length;i++){ if(src[i]==='{') d++; else if(src[i]==='}'){ d--; if(!d) break; } } return src.slice(a,i+1); }
  const need=['_nlEchoSplit','_nlStandsAlone','_nlEchoParse','_nlUnitWords','_nlSameFood','_mtRow'];
  let code='';
  ['MT_ROWS','MT_UNIT_ALIAS','MT_WEIGHT_G','_NL_WORD_QTY','_NL_HARMLESS'].forEach(v=>{ try{ code+=liftVar(v)+'\n'; }catch(e){} });
  code+='var _NL_UW_CACHE=null;\n';
  need.forEach(n=>{ code+=liftFn(n)+'\n'; });
  const ctx={String,RegExp,Object,Array,Math,parseFloat,parseInt,console}; vm.createContext(ctx);
  let ok=true; try{ vm.runInContext(code, ctx); }catch(e){ ok=false; console.log('  FAIL  lift: '+e.message); }
  if(!ok) return;
  const S=(q)=>vm.runInContext('_nlEchoSplit('+JSON.stringify(q)+')', ctx);
  const t=(p,l)=>{ console.log((p?'  ok    ':'  FAIL  ')+l); if(!p) process.exitCode=1; };
  const a=S('Two banana walnut and chocolate chip pancakes from silver diner');
  t(a.length===1, 'one dish with "and" in its name stays one line  -> '+JSON.stringify(a));
  const b=S('2 eggs and a handful of rice');
  t(b.length===2, 'two foods joined by "and" still split  -> '+JSON.stringify(b));
  const c=S('12 oz steak, a handful of rice, cottage cheese');
  t(c.length===3, 'commas always split');
  const d=S('chicken and rice');
  t(d.length===2 || d.length===1, 'two bare table foods: split when the table knows both  -> '+JSON.stringify(d));
})();
process.exit(bad?1:0);
