// THE MEAL BUILDER WAS STARVED, NOT BROKEN.
//
// Yusuf, 13 Sep, working through it himself: "there's nothing under proteins.
// Why would there be nothing under proteins? Do you already know the list of
// meats? It's basically beef, chicken, turkey. Someone can choose bacon...
// why is this empty?" And on the only door left: "that's terrible. You're
// supposed to be the food database. Why would I be the food database?"
//
// THE CAUSE, FOUND BY QUERYING THE LIVE TABLE RATHER THAN READING THE CODE:
// meal_components holds 92 rows. 80 of them are his - 30 proteins, 30
// vegetables, the carbs, the fruit - and every one is owned by 'yusuf1', an
// older code of his. TRAINER_CODES on a client's device is ['thegoat']. The
// owner filter therefore asked for rows nobody owns and returned zero, for
// every client, every time.
//
// EVERY SYMPTOM HE LISTED IS DOWNSTREAM OF THAT. An empty protein list. The
// omelette step offering nothing but Skip - mbStepAnswers prunes any answer
// whose picks mbFind cannot resolve, which is all of them when the shelf is
// empty. The three blank slots after Skip. And "add your own", which is the
// last door standing when there is nothing on the shelf.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

console.log('\n  THE SHELF HAS A NAMED OWNER:');
t(/var MB_SHELF_OWNERS=\['thegoat','yusuf1'\];/.test(src), 'both codes are written down, not inferred');
const f=slice('function _mbOwnerFilter(){','async function mbLoadComponents');
t(/var T=MB_SHELF_OWNERS\.slice\(\);/.test(f), 'the filter starts from the shelf, not from the trainer list');
t(/if\(typeof TRAINER_CODES!=='undefined'\) TRAINER_CODES\.forEach/.test(f),
  'and still folds in whatever else counts as a trainer today');
t(/if\(T\.indexOf\(c\)<0\) T\.push\(c\)/.test(f), 'without duplicating a code that is on both');
t(!/if\(!T\.length\) return 'owner_code=eq\.'/.test(f),
  'and the empty-list branch is gone - the shelf is never empty now');
t(/'or=\(owner_code\.in\.\('\+tcsv\+'\),owner_code\.eq\.'\+encodeURIComponent\(mine\)\+'\)'/.test(f),
  'a client still sees their own rows alongside his');

console.log('\n  ADOPT IS NOT A WORD ANYBODY USES ABOUT FOOD:');
t(!/'Adopt'/.test(src), 'the label is gone');
t(/_flibMealRow\(t, trainer\?'Log':'Save'\)/.test(src), 'a client sees Save on one of his meals');
t((src.match(/chip==='Save'/g)||[]).length===4, 'and every branch that tested for it tests for Save',
  (src.match(/chip==='Save'/g)||[]).length);
t(/function mlibAdopt/.test(src), 'the function keeps its name - only the word the client reads changed');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (the shelf is on)\n');
process.exit(bad?1:0);
