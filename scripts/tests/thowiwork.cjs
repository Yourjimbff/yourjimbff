/* ASK JIM HOW HE WORKS (Yusuf, 19 Sep).

   "We should be able to ask Jim how he works in the chat logger, and he
   should be able to have a comprehensive list of what he does. Just say,
   how do you log my food? How do you log my training?"

   Every line of the answer is something the chat does today - a marker it
   emits, a photo it reads, a write it makes - and it says plainly what it
   does not do yet. And rack pulls, his pull-day compound, in every place a
   movement lives. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\nthowiwork - the list is true, the question is caught, rack pulls exist');

const L=closure(['_jimHowIWorkText','_jimHowIWorkAsk']);
ok(L.unresolved.length===0, 'it lifts with nothing missing', L.unresolved);
const F=new Function(L.code+'\nreturn {_jimHowIWorkText,_jimHowIWorkAsk};')();
const T=F._jimHowIWorkText();

// ---------------------------------------------- EVERY CLAIM HAS A MECHANISM
[['FOOD',          /\[FOOD_LOG\]/],
 ['fix it',        /\[FOOD_EDIT\]/],
 ['wipe that',     /\[FOOD_DELETE\]/],
 ['TRAINING',      /\[WORKOUT_LOG\]/],
 ['how it felt',   /\[WORKOUT_NOTE\]/],
 ['WEIGHT',        /\[WEIGHT_LOG\]/],
 ['STEPS',         /\[STEPS_LOG\]/],
 ['PROGRESS PHOTOS', /progress photo route/],
 ['swap two days', /tlDoSwap\(/],
 ['nutrition label photo', /mbReadLabel\(/],
 ['active calories, heart rate', /"active_cal"/]
].forEach(([claim, mech])=>{
  ok(new RegExp(claim.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(T) && mech.test(src), 'says "'+claim+'" and the app has the mechanism');
});
ok(/Not through this chat yet: journal entries and sleep/.test(T), 'and says plainly what it does not do');
ok(!/[*#_`]/.test(T), 'no markdown - it is read on a phone, in a bubble');

// ---------------------------------------------------- THE QUESTION IS CAUGHT
['how do you work','How do you work?','what can you do','how do you log my food?','How do you log my training',
 'what do you do','help','hey jim, what can you do','how does this work'].forEach(q=>{
  ok(F._jimHowIWorkAsk(q), 'caught: '+q);
});
['I had eggs and toast','how do you log a 12 oz steak with rice and broccoli and a side salad, roughly 900 cal',
 'what can you do about my knee pain','how do you feel','work out'].forEach(q=>{
  ok(!F._jimHowIWorkAsk(q), 'not caught: '+q);
});
ok(/if\(\(!photos \|\| !photos\.length\) && _jimHowIWorkAsk\(text\)\) return _jimHowIWorkText\(\);/.test(src),
   'the direct question is answered at the door, exactly, with no model in the way');
ok(/WHEN THEY ASK HOW YOU WORK OR WHAT YOU CAN DO, in any wording: answer from THIS list/.test(src),
   'and the model carries the same list for every other wording');
ok(/Ask me how I work\.<\/div>/.test(src) && /"Not sure what I can do\? Ask me how I work\."/.test(src),
   'the overlay invites the question, in the header and in the openers');

// ------------------------------------------------------------- RACK PULLS
const lib=src.slice(src.indexOf('var EX_LIB = {'), src.indexOf('var EX_LIB = {')+12000);
ok(/\{n:'Rack Pull', s:4, r:'5-6', c:1,/.test(lib), 'Rack Pull is in the library as a compound');
ok(lib.indexOf("n:'Rack Pull'")>lib.indexOf('Back: [') && lib.indexOf("n:'Rack Pull'")<lib.indexOf("n:'Barbell Row'"), 'on the Back list, beside the deadlift');
ok(/\{n:'Rack Pull',\s+m:'centre_back'\}/.test(src), 'and on the pull day map');
ok(/'Rack Pull':'upper back, traps and erectors'/.test(src), 'with what it works');
ok(/'rack pulls':'Rack Pull','rack pull':'Rack Pull'/.test(src), 'and every way he says it resolves to it');

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
