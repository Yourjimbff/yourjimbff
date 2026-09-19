/* THE TABLE IN THE PHOTO IS THE PLATE (Dustin Fultz, 19 Sep).

   He photographed a chat screenshot: three rows - Oko vanilla protein shake
   170/30/8/3.5, homemade coffee with 300ml milk 155/18/10/6, filet mignon
   122g cooked 266/34/0/13.5 - and a TOTAL line, 591/82/18/23. The app read
   the total as one product, named it "Meal", drew no bullets, and Jim
   guessed "eggs" at a plate that had none. The rows were printed in the
   picture. Yusuf: "the meal items should still be broken down, bullet
   pointed and written inside the app." */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntlabeltable - a list of foods in a photo comes out as a list of foods');

const L=closure(['_labelItems','_labelItemsName','_labelName','_mbLabelPrompt']);
/* _labelTitleCase keeps a list of acronyms it must not lowercase (BBQ, PB, OZ,
   ...); the lifter reads the entries as identifiers. */
const holes=L.unresolved.filter(n=>!/^[A-Z]{2,5}$/.test(n));
ok(holes.length===0, 'it lifts with nothing missing', holes);
const F=new Function(L.code+'\nreturn {_labelItems,_labelItemsName,_labelName,_mbLabelPrompt};')();

const dustin={seen:'Total 591 82g 18g 23g', name:'', brand:'', calories:591, protein:82, carbs:18, fat:23,
  items:[{name:'Oko Vanilla protein shake',calories:170,protein:30,carbs:8,fat:3.5},
         {name:'Homemade coffee (300ml milk)',calories:155,protein:18,carbs:10,fat:6},
         {name:'Filet mignon, 122g cooked',calories:266,protein:34,carbs:0,fat:13.5}]};
const its=F._labelItems(dustin);
ok(its && its.length===3, 'three printed rows are three items', its&&its.map(i=>i.n));
ok(its[0].cal===170 && its[0].p===30 && its[2].f===14, 'each with its own printed numbers, whole grams', its&&its[0]);
ok(F._labelItemsName(dustin)==='Oko Vanilla protein shake, Homemade coffee & Filet mignon', 'and a list with no title is named by its rows', F._labelItemsName(dustin));
ok(/Oko Vanilla Protein Shake, Homemade Coffee & Filet Mignon/i.test(F._labelName(dustin)), 'so the card never says "Meal" or "Packaged food" over three named foods', F._labelName(dustin));
ok(F._labelItems({name:'Sweet & Sour Chicken', calories:570, items:[]})===null, 'a single sleeve has no rows, and nothing is invented');
ok(F._labelItems({items:[{name:'one thing',calories:100}]})===null, 'one row is not a list');
ok(/"items":\[\]/.test(F._mbLabelPrompt()) && /ONLY when the photo is a LIST or TABLE of several foods/.test(F._mbLabelPrompt()) && /Leave out any TOTAL row/.test(F._mbLabelPrompt()),
   'the reader is asked for the rows, and told the total is not one of them');

// ------------------------------------------------------------ IT IS WIRED
ok(/items:_lit,/.test(src) && /_lit=\(n===1\)\?_labelItems\(raw\):null/.test(src), 'the plate box carries the rows into the row, at one serving');
ok(/date_str:logDs,items:\(_lbl\.items\|\|null\)\}/.test(src), 'and hands them to the one door');
ok(/var _li=_labelItems\(lab\);/.test(src) && /lab\.name=_labelTitleCase\(_labelItemsName\(lab\)\)/.test(src), 'the chat sheet does the same, and names the plate by its rows');
ok(/if\(lab\.items\) _patch\.items=lab\.items;/.test(src) && /'felt','items'\]/.test(src), 'a label that lands after the row was written patches the rows onto it');

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
