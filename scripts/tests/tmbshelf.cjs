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

console.log('\n  LAW IS GLASS:');
/* Yusuf, 13 Sep, off a screenshot of the empty builder: "this format is
   outdated and needs to be glass. The dotted border is not a good design." */
const glass=/radial-gradient\(120% 140% at 0% 0%,#242424 0%,#171717 46%,#111 100%\)/;
t(glass.test(slice('.mbFood{','.mbFood::after')), 'a meal slot is the house glass, the exact recipe');
t(/\.mbFood::after\{content:'';position:absolute;inset:0/.test(src), 'with the gold wash in the corner');
t(/\.mbFood>\*\{position:relative;z-index:1;\}/.test(src), 'and its content sits above that wash');
t(!/\.mbFood\.mbBlank\{background:rgba\(255,255,255,0\.04\);border:1px dashed/.test(src),
  'an empty slot is no longer a dashed box');
t(/\.mbFood\.mbBlank\{box-shadow:none;border-color:#242424;/.test(src),
  'it is the same glass, quieter - solid edge, no lift');
t(/\.mbFood\.mbBlank::after\{opacity:0;\}/.test(src),
  'and no gold, because gold is what arrives when food does');
t(glass.test(slice('.mbSent{','.mbSent::after')), 'the shape of the meal above it is glass too');
t(/\.mbSent>\*\{position:relative;z-index:1;\}/.test(src), 'same treatment');
/* The three sheets this screen opens were flat #222 panels. */
const sheets=(src.match(/background:radial-gradient\(120% 140% at 0% 0%,#232323 0%,#171717 46%,#121212 100%\);border:1px solid #2e2e2e;border-bottom:0;/g)||[]).length;
t(sheets>=3, 'the picker, the item editor and the add form are glass sheets', String(sheets));
t(!/border:1\.5px dashed rgba\(255,255,255,0\.22\)/.test(src), 'and the last dashed border on the screen is gone');

console.log('\n  ADOPT IS NOT A WORD ANYBODY USES ABOUT FOOD:');
t(!/'Adopt'/.test(src), 'the label is gone');
t(/_flibMealRow\(t, trainer\?'Log':'Save'\)/.test(src), 'a client sees Save on one of his meals');
t((src.match(/chip==='Save'/g)||[]).length===4, 'and every branch that tested for it tests for Save',
  (src.match(/chip==='Save'/g)||[]).length);
t(/function mlibAdopt/.test(src), 'the function keeps its name - only the word the client reads changed');

console.log('\n  OUNCES IS TO PALMS IS TO GRAMS OF PROTEIN:');
/* Yusuf, 13 Sep: "no one ever buys a steak or meat source in palm sizes in the
   grocery store. But people do buy it in ounces... have it be ounces equates to
   palm sizes equates to grams of protein. This should be a very handy user
   guide coincidentally. This should go for all protein sources." */
t(/var MB_PROTEIN_OZ=\[4,6,8,10,12\];/.test(src), 'the amounts are ounces - the numbers on a packet');
const step=slice('function _mbPalmStep(){','function mbPickPalms');
t(/MB_PROTEIN_OZ\.map\(function\(oz\)\{/.test(step), 'a palm-measured protein lists them');
t(/\+oz\+' oz<\/div>'/.test(step), 'ounces lead the row');
t(/about '\+_mbPalmsAbout\(oz\)/.test(step), 'the palm sits under them as the estimate it is');
t(/mbFormatExact\(c,q\)/.test(step), 'and the protein is the answer on the right');
const about=slice('function _mbPalmsAbout(oz){','function _mbPalmStep');
t(/Math\.round\(\(oz\/MB_PALM_OZ\)\*2\)\/2/.test(about), 'palms round to the nearest half, the way the rest of the screen speaks');
t(/Around '\+mbFormatQty\(R\.minOz\)\+' to '\+mbFormatQty\(R\.maxOz\)\+' oz suits most people/.test(step),
  'and the hint above them is in ounces too');
t(!/palms suits most people/.test(src), 'never "1½ to 2½ palms suits most people" again');
/* ALL protein sources means the ones measured in palms; an egg has no ounces
   anybody thinks in, so eggs, slices, scoops and cups keep their own unit. */
t(/\} else \{\s*\n\s*rows=mbAmountOptions\(c\)\.map/.test(step), 'eggs and slices keep their own unit');
/* Asked in ounces, answered in ounces. */
const pick=slice('function mbPickOz(oz){','function mbClosePick');
t(/_mbPlace\(\{component:_mbPickComp, qty:_mbOzPalms\(oz\), pinned:true, showOz:true\}\)/.test(pick),
  'picking an ounce amount pins it and marks it as ounces');
t(/if\(part\.showOz\) return mbOzOf\(part\)\+' oz '\+nm\.toLowerCase\(\);/.test(src),
  'so the slot reads back "8 oz steak", not "2¼ palms steak"');
/* The item editor said the same thing twice, in two different languages. */
t(!/>OR IN OUNCES<\/div>/.test(src), 'the duplicate OR IN OUNCES block is gone');
t(/One palm is about '\+MB_PALM_OZ\+' oz, and gives you /.test(src), 'and one palm is defined in ounces where it is explained');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (the shelf is on)\n');
process.exit(bad?1:0);
