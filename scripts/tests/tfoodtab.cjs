// FOOD IS A TAB.
//
// Yusuf, 13 Sep: "the today, what is it? This is going to be a tab... they
// don't have five tabs. It's just day, Jim, program. And food, if anything,
// right now. That's fine. Let's run it."
// And: "we did a breakdown of calories upon the screen, but there's no way for
// me to find it."
// And: "you already have my food list, dude... the only thing that doesn't
// include is pork. That's literally it."
//
// THE PAGE ALREADY EXISTED. My Food - build a meal, my meals, my foods - has
// been in this file for weeks as a FULL-SCREEN OVERLAY reached from a tile
// nobody found. This promotes it. It does not build a second food page, which
// is the house disease and is what "law is glass" was written about.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

console.log('\n  ONE FOOD PAGE, PROMOTED - NOT A SECOND ONE:');
t(!/id="flibView"/.test(src), 'the full-screen overlay is gone');
t(!/function closeFoodLibrary/.test(src), 'and so is its close');
t(/<div class="tab" id="tFood">/.test(src), 'Food is a tab');
/* THE MARKUP AND THE STYLESHEET HAVE TO AGREE. Renaming the classes off the
   .fdCard collision touched the CSS and the JS and MISSED the static markup,
   so the page title painted unstyled on the served build. */
t(/<div class="fdxPageT">Food<\/div>/.test(src), 'and its title wears a class the stylesheet knows');
t(!/class="fdPage/.test(src), 'nothing is left on the old names');
t((src.match(/id="flibBody"/g)||[]).length===1, 'and #flibBody exists exactly once - no duplicate id',
  (src.match(/id="flibBody"/g)||[]).length);
t((src.match(/id="flibSearch"/g)||[]).length===1, 'and so does the search box',
  (src.match(/id="flibSearch"/g)||[]).length);
t(/function flibRender\(\)\{/.test(src), 'the renderer is untouched');
t(/_flibIsOpen\(\)\{ var v=document\.getElementById\('tFood'\); return !!\(v && v\.classList\.contains\('active'\)\); \}/.test(src),
  '"open" now means the tab is showing');
t(/async function openFoodLibrary\(\)\{ try\{ switchTab\('Food'\); \}catch\(e\)\{\} \}/.test(src),
  'and every old door into it lands on the tab');
t((src.match(/openFoodLibrary\(\)/g)||[]).length>=3, 'so the tile and the program cards still work',
  (src.match(/openFoodLibrary\(\)/g)||[]).length);

console.log('\n  IT IS IN THE BAR, AND THE BAR IS FIVE:');
t(/_TAB_IDS=\[[^\]]*'Food'\]/.test(src), 'the tab is in the one list that hides the others');
t(/<div class="bni" id="bnFood" onclick="switchTab\('Food'\)">/.test(src), 'there is a Food button');
t(/<div class="bni-lb">Food<\/div>/.test(src), 'labelled Food');
t(!/[\u{1F300}-\u{1FAFF}]/u.test(slice('id="bnFood"','id="bnTraining"')), 'drawn as a line icon, no emoji, house law');
const nav=slice("var _bpr=document.getElementById('bnProgress');","try{ _clDeskSync(); }catch(e){}");
t(/var _bfd=document\.getElementById\('bnFood'\); if\(_bfd\) _bfd\.style\.display='';/.test(nav), 'a client sees it');
t(/_nav\.style\.gridTemplateColumns='repeat\(5,1fr\)';/.test(nav), 'and the bar is sized for five');
/* THE BAR IS FLEX WITH AN EXPLICIT ORDER PER ITEM, not a grid - a new button
   dropped into the markup lands at the far LEFT until it is given one. Found by
   looking at the served page, not by reading the HTML. */
/* His words, 13 Sep, given as the whole bar: "day, Jim, program, food,
   progress". */
t(/\.bnav:not\(\.trainer-mode\) #bnFeed\{order:1;\}/.test(src), 'Day');
t(/\.bnav:not\(\.trainer-mode\) #bnAsk\{order:2;\}/.test(src), 'Jim');
t(/\.bnav:not\(\.trainer-mode\) #bnProgram\{order:3;\}/.test(src), 'Program');
t(/\.bnav:not\(\.trainer-mode\) #bnFood\{order:4;\}/.test(src), 'Food');
t(/\.bnav:not\(\.trainer-mode\) #bnProgress\{order:5;\}/.test(src), 'Progress');
/* IT IS ON THE TRAINER BAR NOW, in the slot CRM used to hold (Yusuf, 16 Sep:
   "my CRM page is really not that useful... we can put the food in place there
   right now, that food tab so I can see my nutrition goals"). Asked whether CRM
   should move to the More menu or go, he said gone entirely.
   ONE SWAP, NOT AN ADDITION. The same number of buttons are visible before and
   after, so the bar's geometry cannot change - which is the only part of this
   that could not be proved off a desktop. */
t(/\.bnav\.trainer-mode #bnCRM\{display:none !important;\}/.test(src), 'CRM is off the trainer bar');
t(/\.bnav\.trainer-mode #bnFood\{order:3;\}/.test(src), '  and Food holds the slot it had');
t(!/\.bnav\.trainer-mode #bnFood\{display:none/.test(src), '  with nothing left over to hide it again');
t(/if\(t==='CRM'\) t='Feed';/.test(src), 'and every route into the board lands on the Day page instead');
/* AND THE LIST THAT ACTUALLY DECIDES. The CSS above is not what puts a button
   on the trainer bar - this does, with an inline display, and inline beats a
   stylesheet. The first attempt changed only the CSS and the bar came back with
   three buttons instead of four. Caught by looking at the served page. */
const gate=src.slice(src.indexOf("['bnProgram','bnFollow','bnToday']"), src.indexOf("['bnProgram','bnFollow','bnToday']")+700);
t(gate.length>0, 'the trainer hide list no longer carries bnFood');
t(/var _bfdT=document\.getElementById\('bnFood'\); if\(_bfdT\) _bfdT\.style\.display='';/.test(gate),
  '  it is shown on purpose instead');
t(/var _bcrm=document\.getElementById\('bnCRM'\); if\(_bcrm\) _bcrm\.style\.display='none';/.test(gate),
  '  and CRM is hidden in the same place, not only in CSS');
t(/_nav\.style\.gridTemplateColumns='repeat\(4,1fr\)'/.test(gate),
  '  with four columns for the four buttons, set beside the list that names them');
t(!/\['bnProgram','bnFollow','bnToday','bnFood'\]/.test(src), '  and nothing hides it again');
t(/if\(t==='Food'\)\{ try\{ renderFoodTab\(\); \}catch\(e\)\{\} \}/.test(src), 'and switching to it renders it');

console.log('\n  TODAY HAS A FRONT DOOR AT LAST:');
/* fdOpenToday is NOT lifted on purpose: it reaches switchTab, and switchTab
   drags half the app in behind it. It is checked by reading the source below. */
const CL=closure(['fdTodayHtml','_tlDateStr','_jimCalRange','_calTargetSet']);
t(!CL.unparsable || !CL.unparsable.length, 'the card lifts cleanly', JSON.stringify(CL.unparsable||[]));
global.window={addEventListener:function(){}}; global.cl={code:'freeuser'};
eval(CL.code||'');
const ds=_tlDateStr(new Date());
profile={cal_target:1980};
/* NEVER-ASSERT. An empty allFood means "nothing eaten" only AFTER the read. */
allFood=[]; window._fdFoodLoaded=false;
let h=fdTodayHtml();
t(/Reading your day/.test(h), 'before the read it says it is reading, never zero');
t(!/Nothing yet/.test(h), 'and never claims an untouched day it has not established');
window._fdFoodLoaded=true;
h=fdTodayHtml();
t(/Nothing yet/.test(h), 'after the read, an empty day says so');
/* Yusuf, 13 Sep: "cut this AI language. Just 1,900-2,100 calorie goal is
   fine." */
t(/1,900-2,100 calorie goal/.test(h), 'with their own range, in four words');
t(!/Room for about/.test(src), 'and nothing is written at them');
allFood=[{date_str:ds, calories:620, protein:48, carbs:52, fat:22},
         {date_str:ds, calories:410, protein:30, carbs:38, fat:12},
         {date_str:'Jan 1, 2020', calories:9999, protein:999, carbs:999, fat:999}];
h=fdTodayHtml();
t(/>1,030<u>of 1,900-2,100<\/u>/.test(h), 'a day with food shows the total against the range');
t(/Protein<b>78g<\/b>/.test(h) && /Carbs<b>90g<\/b>/.test(h) && /Fat<b>34g<\/b>/.test(h), 'and the macros under it');
t(!/9,999|999g/.test(h), 'another day’s rows are not in it');
t(/onclick="fdOpenToday\(\)"/.test(h), 'and the card is the door');
t(/_fdOpen\(_tlDateStr\(new Date\(\)\)\)/.test(slice('function fdOpenToday(){','function fdTodayPaint')),
  'which opens the sheet that already existed - the one hiding behind the calorie line');

console.log('\n  WHAT THEY DO NOT EAT:');
const AV=closure(['fdAvoid','_fdAvoidLocal','_fdAvoidWriteLocal','_fdKey']);
t(!AV.unparsable || !AV.unparsable.length, 'the list lifts cleanly', JSON.stringify(AV.unparsable||[]));
let _store={};
global.localStorage={ getItem:(k)=>(_store[k]===undefined?null:_store[k]), setItem:(k,v)=>{_store[k]=String(v);} };
eval(AV.code||'');
cl={code:'freeuser'}; profile={};
t(fdAvoid().length===0, 'nothing on it to begin with');
_fdAvoidWriteLocal(['Pork']);
t(fdAvoid()[0]==='Pork', 'the local mirror carries it before the column exists');
profile={food_avoid:['Pork','Shellfish']};
t(fdAvoid().length===2, 'and the column is the truth once it does');
profile={food_avoid:'["Pork"]'};
t(fdAvoid()[0]==='Pork', 'stored as json text, it still reads');
/* The same shape meal usuals already use - see migrations/meal_usuals.sql. */
t(fs.existsSync('migrations/food_avoid.sql'), 'the migration is written');
const mig=fs.readFileSync('migrations/food_avoid.sql','utf8');
t(/add column if not exists food_avoid jsonb/.test(mig), 'one nullable column, idempotent');
t(/notify pgrst/.test(mig), 'and the schema reload the others all carry');
t(/window\._fdAvoidCol=false/.test(slice('async function _fdAvoidPersist','function fdAvoidAdd')),
  'a write before the migration falls back quietly rather than erroring at a client');

console.log('\n  AND JIM READS IT:');
const mp=slice('function _jimMealPlanBlock(){','function extractWorkoutLog');
t(/var _av=\[\]; try\{ _av=fdAvoid\(\)\|\|\[\]; \}catch\(e\)\{ _av=\[\]; \}/.test(mp), 'the block reads their list');
t(/THIS PERSON DOES NOT EAT: /.test(mp), 'and names it to him');
t(/not once, not as an alternative, not in brackets, not "or"/.test(mp), 'in words that close the loopholes');
t(/_avLine\+\n\s*'THE FOUR SLOTS/.test(src), 'placed immediately above the slots it governs');
t(/catch\(e\)\{ _av=\[\]; \}/.test(mp), 'and an account with no list is simply a block without that line');

console.log('\n  THE GLASS:');
/* .fdCard WAS ALREADY TAKEN - min-height:224px, display:flex - and the Today
   card inherited it and stood there two-thirds empty. Named off it. */
t(!/class="fdCard"/.test(src), 'the Today card does not wear a class that already belongs to something else');
t(/\.fdxCard\{position:relative;overflow:hidden;border-radius:19px/.test(src), 'the Today card is the house glass');
t(/radial-gradient\(120% 140% at 0% 0%,#242424 0%,#171717 46%,#111 100%\)/.test(slice('.fdxCard{','.fdxCard::after')),
  'the exact recipe, not a lookalike');
t(/\.fdxCard::after\{content:'';position:absolute;inset:0/.test(src), 'with the gold wash in the corner');
t(/\.fdxAddBtn\{[^}]*background:var\(--gold\)/.test(src), 'and gold is on the one control that does something');
t(!/\.fdxSecT\{[^}]*var\(--gold\)/.test(src), 'never on a section heading');

console.log('\n  THE MY FOODS EDITOR IS GLASS:');
/* Yusuf, 13 Sep, off a screenshot: "this editor box is also outdated. Fix and
   modernise." */
const ed=slice('function _flibFoodRow(f){','function flibRender(){');
t(/class="fleCard"/.test(ed), 'the editor is one named card');
t(!/background:var\(--surface\);border:1px solid rgba\(245,197,24,0\.4\)/.test(src),
  'and not a flat surface with a gold hairline round it');
t(/\.fleCard\{position:relative;overflow:hidden;border-radius:19px/.test(src), 'it is the house glass');
t(/radial-gradient\(120% 140% at 0% 0%,#242424 0%,#171717 46%,#111 100%\)/.test(slice('.fleCard{','.fleCard::after')),
  'the exact recipe, not a lookalike');
t(/\.fleCard::after\{content:'';position:absolute;inset:0/.test(src), 'with the gold wash in the corner');
/* Calories are computed from the three macros on every keystroke, so they are
   a RESULT, not a fourth box to fill in. */
t(/el\.value=Math\.round\(4\*g\('flibEPro'\)\+4\*g\('flibECarb'\)\+9\*g\('flibEFat'\)\)/.test(src),
  'calories are still derived from the macros');
t(/class="fleCal"/.test(ed) && /\.fleCal input\{[^}]*font-size:34px/.test(src),
  'so they sit at the top at 34px, reading as the result they are');
t(/Calories work themselves out from these three\./.test(ed), 'said in one line');
t(/class="fleMacs"/.test(ed) && /<span>'\+lbl\+'<\/span>/.test(ed),
  'and the three macros are named in words under their own numbers');
t(!/PRO \(G\)|CARB \(G\)|FAT \(G\)/.test(src), 'never PRO (G) in shouty caps over a cramped box');
/* Gold means action. One action. */
t(/\.fleSave\{[^}]*background:var\(--gold\)/.test(src), 'Save is the gold control');
t(/\.fleFoot span\{font-size:12\.5px;font-weight:700;color:rgba\(240,236,228,0\.45\)/.test(src),
  'Cancel and Delete are quiet text under it');
t(/\.fleFoot span\.del\{color:rgba\(255,98,112,0\.62\)\}|\.fleFoot span\.del\{color:rgba\(255,98,112,0\.62\);\}/.test(src),
  'Delete is dimmed, not a red button beside Save');
t(/-webkit-appearance:none/.test(slice('.fleCal input::-webkit-outer-spin-button','body.free')),
  'and the number spinners are off - they are noise on a phone');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (food is a tab)\n');
process.exit(bad?1:0);
