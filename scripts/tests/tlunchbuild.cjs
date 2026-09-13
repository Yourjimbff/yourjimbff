// THE CARB WAS SANDWICHED BETWEEN TWO VEGETABLES.
//
// Yusuf, 13 Sep, building lunch: "it says at the top of my builder / ground
// beef + bell peppers + carb + onions / I selected bell peppers + onions - but
// carb is sandwiched between the two of them."
//
// The shape line filled ONE slot per kind -- protein, vegetable, carbohydrate --
// and swept anything left over onto the end. So the second vegetable landed
// after the carbohydrate's placeholder, and the line described a plate nobody
// was building.
//
// He named three more things in the same breath:
//   "selecting a protein automatically goes to the next step / on vegetables,
//    it does not" -- a pick-as-many screen ends in a button, and with ten
//    vegetables that button was below the fold.
//   "include beets ... also add peas to vegetables"
//   "an option to add a vegetable that i missed"
//   and the carb list, written out: rice, potatoes, sweet potatoes, whole
//   wheat pasta, sourdough bread, beans, chickpeas.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

// ---- run the shape line for real ----
const sent=slice('function _mbSentence(){','function _mbTotalsBlock');
const F=new Function('MB_FRAMEWORKS','MB_SHAPE_ORDER','MB_PART_SHORT','_escHtml','parts','framework',
  'var _mbFramework=framework, _mbParts=parts;'+sent+'return _mbSentence();');
const FR={lunch_plate:{parts:['protein','veg','carb']}};
const ORDER=['protein','veg','carb','fruit','fat',''];
const SHORT={protein:'protein', veg:'vegetable', carb:'carb', fruit:'fruit', fat:'fat'};
const esc=x=>String(x);
const C=(name,kind)=>({component:{name:name,kind:kind}});
/* The separator between two foods is its own span holding a "+", so stripping
   tags leaves that "+" as a token of its own. Drop it: this suite is about the
   ORDER of the foods, not the punctuation between them. */
const line=(parts)=>F(FR,ORDER,SHORT,esc,parts,'lunch_plate')
  .replace(/<[^>]+>/g,'|').split('|')
  .map(x=>x.trim()).filter(x=>x && x!=='+');

console.log('\n  THE LINE HE SAW, AND THE LINE IT DRAWS NOW:');
const his=line([C('Ground Beef','protein'), C('Bell Peppers','veg'), C('Onions','veg')]);
t(his.join(' + ')==='ground beef + bell peppers + onions + carb',
  'both vegetables sit together and the carb waits at the end', his.join(' + '));
t(his.indexOf('carb')>his.indexOf('onions'),
  'the placeholder is never sandwiched between two of the same kind', his.join(' + '));

console.log('\n  AND NOTHING ELSE MOVED:');
t(line([C('Ground Beef','protein')]).join(' + ')==='ground beef + vegetable + carb',
  'an empty plate still shows the shape it is waiting for',
  line([C('Ground Beef','protein')]).join(' + '));
t(line([C('Ribeye','protein'), C('Salad Mix','veg'), C('Potatoes','carb')]).join(' + ')
   ==='ribeye + salad mix + potatoes', 'a full plate reads straight through');
t(line([C('Ribeye','protein'), C('Salad Mix','veg'), C('Potatoes','carb'), C('Blueberries','fruit')]).join(' + ')
   ==='ribeye + salad mix + potatoes + blueberries',
  'and a kind the shape has no slot for still lands at the end, where it belongs',
  line([C('Ribeye','protein'), C('Salad Mix','veg'), C('Potatoes','carb'), C('Blueberries','fruit')]).join(' + '));
t(line([C('Eggs','protein'), C('Turkey Bacon','protein')]).join(' + ')==='eggs + turkey bacon + vegetable + carb',
  'two proteins group too, not just two vegetables',
  line([C('Eggs','protein'), C('Turkey Bacon','protein')]).join(' + '));

console.log('\n  HIS CARB LIST, IN HIS ORDER:');
const carb=slice("var _MB_CARB={q:'Carbohydrate","var _MB_BURGER_CARB");
const labels=(carb.match(/\{label:'([^']+)'/g)||[]).map(x=>x.slice(8,-1));
t(labels.join(', ')==='Rice, Potatoes, Sweet potatoes, Whole wheat pasta, Sourdough bread, Beans, Chickpeas, None today',
  'rice, potatoes, sweet potatoes, whole wheat pasta, sourdough bread, beans, chickpeas', labels.join(', '));
t(/name:'Whole Wheat Pasta'/.test(carb), 'and it asks the shelf for Whole Wheat Pasta');
t(!/\{label:'Pasta',/.test(carb), 'plain "Pasta" is gone from the list');
t(/name:'Sourdough Bread'/.test(carb), 'and for Sourdough Bread');
t(/\{label:'None today',\s*picks:\[\]\}/.test(carb), 'and you can still have none');

console.log('\n  BEETS, PEAS, AND ONE HE IS MISSING:');
const veg=slice('var _MB_VEG=function(next){','var _MB_GRILL_VEG');
t(/name:'Beets'/.test(veg), 'beets are on the vegetable screen');
t(/name:'Peas'/.test(veg),  'and peas');
t(/\{label:'Something else', add:'veg'\}/.test(veg), 'and a way to add one it does not have');
const bfveg=slice('var _MB_BF_VEG={','var _MB_BF_PROTEIN');
t(/\{label:'Something else', add:'veg'\}/.test(bfveg), 'breakfast gets the same door, not a different one');

console.log('\n  A DOOR IS NOT A FOOD:');
const opts=slice('function mbManyOptions(step){','function mbManyCount');
t(/if\(p\.add\) return \{i:i, label:p\.label, add:p\.add\};/.test(opts), 'the list knows an add entry from a food');
const cont=slice('function mbManyContinue(){','function mbSetBuild');
t(/if\(x\.add\) return;\s+\/\/ a door, not a food/.test(cont), 'and Continue never turns one into a part');
const start=slice('function _mbManyStart(step){','function mbManyContinue');
t(/if\(x\.on && !x\.add\)/.test(start), 'nor does it ever arrive already ticked');
t(/onclick="mbOpenAdd\('\+JSON\.stringify\(x\.add\)\+'\)"/.test(src),
  'it opens the same add-your-own screen the picker uses, not a second one');

console.log('\n  THE WAY ON IS ON SCREEN:');
t(/<div class="mbManyBar">/.test(src), 'the button has its own bar');
t(/\.mbManyBar\{position:sticky;/.test(src), 'stuck to the floor of the sheet');
t(/background:linear-gradient\(to bottom,rgba\(17,17,17,0\) 0%,#111 26%,#111 100%\);/.test(src),
  'with the list fading under it rather than cut off');
t(/\(mbManyCount\(\)\?\('Continue'\+\(mbManyCount\(\)>1\?\(' \\u00b7 '\+mbManyCount\(\)\):''\)\):'Skip'\)/.test(src),
  'and it says how many you have picked once there is more than one');

console.log('\n  AND THE ADD ROW IS NOT DRAWN WITH A DOTTED LINE:');
/* Yusuf, 13 Sep, earlier the same day: "the dotted border is not a good design." */
t(/\.mbPickAdd\{background:transparent;border-color:rgba\(255,255,255,0\.085\);\}/.test(src),
  'it reads as secondary by being dimmer, not by being dashed');
t(!/\.mbPickAdd\{[^}]*dashed/.test(src), 'no dashes');
t(/\.mbPickAdd \.mbPickA\{color:var\(--gold\)/.test(src), 'and the gold is on the word "add", which is the action');

console.log('\n  THE VEGETABLE SCREEN SAYS VEGETABLES:');
t(/\{q:'Vegetables\. Help yourself\.', many:\[\s*\{kind:'veg',name:'Broccoli'\}/.test(src),
  'not "Greens", which is not what broccoli and beets are');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
