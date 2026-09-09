// 520 IS NOT A NUMBER, IT IS A HABIT (Chris McCarthy, 8 Sep 11pm).
// "when I log all together w photo and description it says 520 cal. When I log
// each thing individually it's 900." One meal in five on the one-line road
// carried exactly 520 calories, and its own macros did not add up to it.
// The total is now the sum of the rows, table first; with no rows, 4/4/9.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+label); };

function lift(name){
  const re=new RegExp('\\n(?:async )?function '+name+'\\(');
  const i=src.search(re); if(i<0) throw new Error('missing '+name);
  const body=src.slice(i+1);
  let depth=0, j=body.indexOf('{');
  for(let k=j;k<body.length;k++){ if(body[k]==='{') depth++; else if(body[k]==='}'){ depth--; if(!depth){ return body.slice(0,k+1); } } }
  throw new Error('unterminated '+name);
}
function constBlock(decl, end){ const i=src.indexOf(decl); const j=src.indexOf(end, i); if(i<0||j<0) throw new Error('no '+decl); return src.slice(i, j+end.length); }

const code=[
  'var MT_G_PER_OZ=28.3495; var _MT_BY=null; var MB_PALM_OZ=3.5;',
  constBlock('var MT_ROWS=[', '\n];'),
  constBlock('var MT_UNIT_ALIAS = {', '};'), constBlock('var MT_WEIGHT_G = {', '};'),
  lift('_mtIndex'), lift('_mtRow'), lift('_mtRound'), lift('_mtCal'), lift('_mtQty'), lift('_mtItem'),
  lift('_mtApplyItems'), lift('_mtSum'), lift('_mtApplyResult'), lift('_nlSettle'),
  'module.exports={_nlSettle};'
].join('\n');
const m={exports:{}};
new Function('module','exports','console',code)(m,m.exports,{warn:()=>{},error:()=>{}});
const {_nlSettle}=m.exports;

console.log('  the prompt asks for rows, and both roads settle the answer:');
t(/function _nlItemsRule\(\)/.test(src),                      'the items rule exists');
t(/sys\+_nlItemsRule\(\)\+'\\n\\nThe client says/.test(src),   'the estimate asks for rows');
t(/\+_nlItemsRule\(\)\s*\n\s*\+'\\n\\nThe client says: "'\+left/.test(src), 'the enrich asks for rows');
t(/est=_nlSettle\(await _estP\)/.test(src),                    'the estimate is settled');
t(/est=_nlSettle\(await _nlEstimate\(content, null\)\)/.test(src), 'the enrich is settled');
t(/var sys=_NL_SYS;/.test(src),                               'the old constant is untouched');

console.log('\n  a whole-plate 520 over macros that do not add up cannot survive:');
const ben=_nlSettle({name:'Eggs, Cheddar, Blueberries & Cottage Cheese', calories:520, protein:58, carbs:18, fat:20});
t(ben.calories===484,                     'no rows: 58/18/20 reads 484, not 520 ('+ben.calories+')');
const rows=_nlSettle({name:'Gyro Chicken with Pita & Hummus', calories:520, protein:38, carbs:42, fat:18,
  items:[{name:'gyro chicken',table_key:null,qty:1,unit:'each',calories:520,protein:30,carbs:2,fat:12},
         {name:'pita',table_key:null,qty:1,unit:'each',calories:170,protein:6,carbs:33,fat:1},
         {name:'hummus',table_key:null,qty:2,unit:'tbsp',calories:70,protein:2,carbs:6,fat:5}]});
t(rows.calories===(30*4+2*4+12*9)+(6*4+33*4+1*9)+(2*4+6*4+5*9), 'rows: the meal is the sum of its rows at 4/4/9 ('+rows.calories+')');
t(rows.protein===38 && rows.carbs===41 && rows.fat===18,      'and the macros are the summed rows');

console.log('\n  the table prices what it knows, by the client\'s own units:');
const tbl=_nlSettle({name:'Chicken and rice', calories:520, protein:40, carbs:40, fat:10,
  items:[{name:'2 palms chicken breast',table_key:'chicken breast',qty:2,unit:'palm'},
         {name:'1 handful rice',table_key:'white rice',qty:1,unit:'handful'}]});
t(tbl.calories>0 && tbl.calories===tbl.items.reduce((a,x)=>a+x.calories,0), 'a table-priced plate is the sum of its table rows ('+tbl.calories+')');
t(tbl.items[0].mt==='chicken breast',      'the chicken row came from the table');

console.log('\n  a whole meal name never gets priced as one food:');
const gyro=_nlSettle({name:'Gyro Chicken with Pita & Hummus', calories:520, protein:38, carbs:42, fat:18});
t(gyro.calories===38*4+42*4+18*9 && !gyro.mt, 'no rows means 4/4/9 on the macros, not one palm of chicken ('+gyro.calories+')');

console.log('\n  failures pass through untouched:');
t(_nlSettle(null)===null,                                 'null');
t(_nlSettle({error:true}).error===true,                   'error');
const z=_nlSettle({name:'x', calories:0, protein:0, carbs:0, fat:0});
t(z.calories===0,                                         'all zeros stay zero so the zero-read guard still fires');

console.log(bad?('\n'+bad+' FAILED'):'\n  all anchor assertions pass');
process.exit(bad?1:0);
