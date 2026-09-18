/* THE READ WAS ABOUT A DIFFERENT MEAL (Yusuf, 17 Sep, Logan Gamero's lunch).

   What his feed showed him, and his whole reply was "What the fuck?":

     Logan Gamero logged 2 foods
     Double Cheeseburger, Twinkie - Twinkie
     827 cal - 62g P - 48g C - 43g F
     JIM'S READ
     "...43g protein and 18g fat... at 682 calories total..."

   Three things wrong on one card. The name printed Twinkie twice. The card's
   figures were the sum of two foods and the read's were one food's. And the
   read went on quoting 682 after the row had moved to 827.

   This suite RUNS the pickers on that exact card. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntlogan - a read may only sit beside numbers it agrees with');

const lifted=closure(['_feedJimPick','_feedJimText','_feedReadFits','_feedReadCals','_feedJimClean']);
const holes=lifted.unresolved.filter(n=>n!=='_groupRows');
ok(holes.length===0, 'the pickers lift with nothing missing', holes);
const F=new Function(lifted.code+'\nreturn {_feedJimPick,_feedJimText,_feedReadFits,_feedReadCals};')();

const BURGER_READ="Lunch is solid for your goal. You've got 43g protein and 18g fat from real meat and cheese, the carbs are there to fuel you, and at 682 calories total this is the right weight for gaining.";

// ---------------------------------------------------- HIS CARD, EXACTLY
const rows=[
  {id:1, name:'Double Cheeseburger, Twinkie', calories:682, protein:43, carbs:23, fat:18, insight:BURGER_READ},
  {id:2, name:'Twinkie', calories:145, protein:19, carbs:25, fat:25, insight:null}
];
const card={kind:'food', code:'logan', data:{
  id:1, name:'Double Cheeseburger, Twinkie · Twinkie',
  calories:827, protein:62, carbs:48, fat:43,
  insight:BURGER_READ,                 // Object.assign copied row zero's read onto the plate
  _groupCount:2, _groupRows:rows
}};

const got=F._feedJimPick(card);
ok(got.text===BURGER_READ, 'the read is still shown - it is real and it is about a real food');
ok(got.from==='Double Cheeseburger, Twinkie',
   'and it is NAMED with the food it was written about, so 682 is not a contradiction', got.from);

// ------------------------------------------- THE PLATE IS NOT ONE OF ITS FOODS
/* it.data.insight on a grouped card is row zero's read sitting beside the
   SUMMED macros. Reading it there is what produced 682 under 827. */
const sneaky={kind:'food', data:{calories:827, insight:BURGER_READ, _groupCount:2,
  _groupRows:[{name:'A', calories:682, insight:BURGER_READ},{name:'B', calories:145, insight:null}]}};
ok(F._feedJimPick(sneaky).from==='A', 'a grouped read always comes from a ROW, never from the merged plate');

// ------------------------------------------------------- THE STALE READ
/* Jim writes the read when the meal is first priced. An item edit, the macro
   table or the adjust bar can move the numbers afterwards and nothing rewrites
   it. A read quoting calories the row no longer holds is not shown. */
ok(F._feedReadFits(BURGER_READ, {calories:682})===true, 'the read fits the row it was written about');
ok(F._feedReadFits(BURGER_READ, {calories:827})===false, 'and does NOT fit the row after the numbers moved');
const stale={kind:'food', data:{calories:827, insight:BURGER_READ}};
ok(F._feedJimPick(stale).text==='', 'so a single-food card with a stale read shows no read');

// tolerance: rounding and "about 800" must not be called stale
ok(F._feedReadFits('That plate is about 800 calories.', {calories:827})===true, '800 against 827 is not a disagreement');
ok(F._feedReadFits('Roughly 500 calories here.', {calories:512})===true, '500 against 512 is fine');
ok(F._feedReadFits('Around 300 calories.', {calories:640})===false, '300 against 640 is');
ok(F._feedReadFits('A clean 1,200 calorie dinner.', {calories:1200})===true, 'a comma in the figure still matches');

// CALORIES ONLY, on purpose: a protein target is not a claim about this meal
ok(F._feedReadFits('Get 40g of protein in at dinner.', {calories:300, protein:12})===true,
   'a protein TARGET in a read is never treated as a wrong number');
ok(F._feedReadFits('Nice plate, real food, good balance.', {calories:900})===true,
   'a read that names no figure is never judged');
ok(F._feedReadFits(BURGER_READ, {calories:0})===true, 'and nothing is judged against a row with no calories');

ok(F._feedReadCals('at 682 calories total').length===1, 'the calorie figure is found');
ok(F._feedReadCals('43g protein and 18g fat').length===0, 'and grams are not mistaken for calories');

// ------------------------------------------------ THE NAME PRINTED TWICE
/* From the dedupe itself, not from the line above it: that line builds `names`
   off `g`, the group's rows, which this harness does not have and does not need
   - the filter takes a list of names and returns a list of names. */
const grp=(()=>{ const i=src.indexOf("var _nk=function(x){ return String(x).toLowerCase()");
  return src.slice(i, src.indexOf('var merged=Object.assign', i)); })();
ok(/_srcNames/.test(grp) && /b\.indexOf\(a\)>=0/.test(grp), 'the group label drops a name another name already contains');

// run the real filter on his own two names
const dedupe=new Function('names', grp.replace(/var label[^]*$/,'') + '\nreturn names;');
const out=dedupe(['Double Cheeseburger, Twinkie','Twinkie']);
ok(out.length===1 && out[0]==='Double Cheeseburger, Twinkie',
   'so his lunch is "Double Cheeseburger, Twinkie", not that plus Twinkie again', out);
ok(dedupe(['Eggs','Eggs']).length===1, 'two identical names collapse to one');
ok(dedupe(['Chicken','Rice','Broccoli']).length===3, 'three different foods all survive');
ok(dedupe(['Chicken and Rice','Chicken']).join('|')==='Chicken and Rice', 'the fuller name is the one kept');
ok(dedupe(['','Rice']).join('|')==='Rice', 'an empty name is dropped');

// ------------------------------------------------------ THE ATTRIBUTION SHOWS
const html=(()=>{ const i=src.indexOf('function _feedJimHtml(it){');
  return src.slice(i, src.indexOf('\n}\n', i)); })();
ok(/_feedJimPick\(it\)/.test(html), 'the card asks the picker, not the bare text');
ok(/fcJimOn/.test(html) && /\.fcJimOn\{/.test(src), 'and the "on <food>" label is drawn and styled');

console.log(fails? ('\ntlogan: '+fails+' FAILED\n') : '\ntlogan: all good\n');
process.exit(fails?1:0);
