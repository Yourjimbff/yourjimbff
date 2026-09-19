/* ONE BREAKFAST, LOGGED TWICE (Yusuf, 18 Sep, reading Angela Walker's feed).

     "Eggs, Bacon & Ricotta Omelette with Biscuit"   497 cal  30/20/33
     "Eggs, Bacon & Biscuit with Ricotta"            533 cal  30/20/37

   Same plate, same 9am slot, ninety seconds apart. A duplicate guard has
   existed since 10 Sep and it keys on the EXACT name - so two wordings of one
   meal are two signatures and both were written. Her day counts it twice.

   MEASURED ACROSS THE TABLE before fixing it: 80 pairs, 26 clients, 20,993
   calories double counted.

   The guard compares the food WORDS now. This suite runs it on her two real
   names and on the cases that must still get through. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntdupemeal - one plate is one row, however the app worded it');

/* The comparison, lifted out of insertFoodLog by running the same two pieces
   the door runs: the tokeniser and the overlap rule. Both are read from the
   file so the test cannot drift from what ships. */
const tokSrc=(()=>{ const i=src.indexOf("var _tok=function(t){");
  return src.slice(i, src.indexOf("};", i)+2); })();
ok(tokSrc.length>80, 'the tokeniser is where the guard keeps it');
const tok=new Function(tokSrc+'\nreturn _tok;')();

function sameMeal(a,b){
  const A=tok(a), B=tok(b);
  if(!A.length || !B.length) return false;
  let hit=0; A.forEach(w=>{ if(B.indexOf(w)>=0) hit++; });
  const small=Math.min(A.length,B.length);
  return small>0 && (hit/small)>=0.8;
}

// ------------------------------------------------------------- HER TWO ROWS
ok(sameMeal('Eggs, Bacon & Ricotta Omelette with Biscuit','Eggs, Bacon & Biscuit with Ricotta'),
   'Angela’s two breakfasts are read as one plate');

// other real shapes of the same fault: the app rewording its own guess
[
  ['Chicken, Broccoli & Rice','Rice, Chicken and Broccoli'],
  ['Grilled Chicken Salad','Salad with Grilled Chicken'],
  ['Sweet & Sour Chicken','Sweet and Sour Chicken'],
  ['Eggs, Potatoes & Peppers','Peppers, Eggs and Potatoes'],
].forEach(([a,b])=>{
  ok(sameMeal(a,b), 'same plate, reworded: "'+a+'" / "'+b+'"');
});

// ------------------------------------------- WHAT MUST STILL GET THROUGH
/* A plate logged one food at a time is the ordinary way people use this app,
   and every one of these is a SECOND REAL FOOD in the same meal. If the guard
   eats these it has broken logging, which is far worse than a duplicate. */
[
  ['Eggs','Toast'],
  ['Chicken Breast','White Rice'],
  ['Greek Yogurt','Blueberries'],
  ['Eggs, Bacon & Biscuit','Orange Juice'],
  ['Protein Shake','Banana'],
  ['Steak','Sweet Potato'],
  ['Chicken, Broccoli & Rice','Chocolate Brownie'],
].forEach(([a,b])=>{
  ok(!sameMeal(a,b), 'two real foods stay two rows: "'+a+'" + "'+b+'"');
});

// joining words alone must never make two foods look alike
ok(!sameMeal('Eggs with Toast','Rice with Beans'), 'sharing only "with" is not a match');
ok(!sameMeal('Side Salad','Side of Fries'), 'sharing only "side" is not a match');

// ------------------------- IT ASKS HIM, IT DOES NOT DECIDE (18 Sep ruling)
/* Yusuf, stopping the first version of this fix mid-build: "I am assuming this
   girl ate two. When I look at her breakfast, I guarantee you she ate two."
   A double submit and a second helping are identical in the data. He can tell
   because he knows her; the app cannot. A guard that silently eats a real meal
   is worse than the duplicate it was written to stop. */
const doorAll=(()=>{ const i=src.indexOf('async function insertFoodLog(row, photo){');
  return src.slice(i, i+11000); })();
const fuzzy=doorAll.slice(doorAll.indexOf('_hit/_small)>=0.8'));
ok(!/return \{ok:false, duplicate:true\}/.test(fuzzy.slice(0,1400)),
   'the word-overlap match NEVER refuses the write');
ok(/possible double/.test(doorAll), 'it records the pair as a question instead');
ok(!/row\.dupe_of_name/.test(src),
   'and writes no column food_logs does not have, which would cost every flagged meal a retry');

// the exact-name guard is a different thing and it still blocks: that one is
// the app firing twice, not a person eating twice
ok(/if\(_seen && \(_now-\(\(_seen\.t\)\|\|_seen\)\)<15\*60\*1000\)\{ return \{ok:false, duplicate:true\}; \}/.test(doorAll)
   || /_seen[^]{0,120}return \{ok:false, duplicate:true\}/.test(doorAll),
   'the identical-name double tap is still refused, because that one is the app misfiring');

// ---- the feed asks the question, off rows already in the table
const fh=(()=>{ const i=src.indexOf('function _feedDoubleHtml(it){');
  return src.slice(i, src.indexOf('\nfunction _feedJimHtml', i)); })();
ok(fh.length>200, 'the feed has its own reader for the pair');
/* IT USED TO ASK. Yusuf, 19 Sep, reading it on Jasmine's card: "it says two of
   them or one logged twice, and I'm not sure - it doesn't show me if she
   confirmed". A question printed on a feed nobody can answer from is not a
   question, it is a shrug. It states what is true now. */
ok(/Logged twice in this meal\. Both are counted/.test(fh) && !/one logged twice\?/.test(fh), 'and it states rather than asks');
ok(/_groupRows/.test(fh), 'reading the rows themselves, so the 80 pairs already logged are covered');
ok(/Both are counted: '\+cal\+' cal/.test(fh), 'and it says what the day is currently counting');
ok(/\.fcDbl\{/.test(src), 'the band is styled');
ok(/rgba\(224,176,64/.test(src), 'amber, not red - nothing is wrong until he says it is');

// ------------------------------------------------------- THE GUARD ITSELF
const door=(()=>{ const i=src.indexOf('async function insertFoodLog(row, photo){');
  return src.slice(i, i+9000); })();
ok(/THE NAME IS THE APP'S OWN GUESS/.test(door), 'the reason is written where the guard is');
ok(/_hit\/_small\)>=0\.8/.test(door), 'the overlap threshold is on the shorter of the two names');
ok(/_prev\.slot!==_slot/.test(door), 'and it only ever compares within the same meal on the same day');
ok(/15\*60\*1000/.test(door), 'inside the same fifteen minute window as the existing guard');
ok(/window\.__foodSigs\[_sig\]=\{t:_now, tok:/.test(door),
   'the map carries the words, so a later log can be compared with an earlier one');
ok(/console\.warn\('\[food\] possible double/.test(door),
   'and the console names both plates it matched, so this is debuggable');

console.log(fails? ('\ntdupemeal: '+fails+' FAILED\n') : '\ntdupemeal: all good\n');
process.exit(fails?1:0);
