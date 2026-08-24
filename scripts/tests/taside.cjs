const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function one(sw){ return L[L.findIndex(l=>l.startsWith(sw))]; }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([one('var _JIM_DOW='), one('var _JIM_MONTHS='),
 multi('var _JIM_SELFTALK_RE=new RegExp('), multi('var _JIM_FOODNOTE_RE=new RegExp('),
 multi('var _JIM_FOODREMARK_RE=new RegExp('), multi('var _JIM_MEALREL_RE=new RegExp('),
 grab(l=>l.startsWith('function _titleCap(')),
 grab(l=>l.startsWith('function _jimDropAsides(')), grab(l=>l.startsWith('function _jimMealRelTitle(')),
 grab(l=>l.startsWith('function _jimEchoWords('))].join('\n'));
require('./_guard.cjs')(['_JIM_DOW','_JIM_FOODNOTE_RE','_JIM_FOODREMARK_RE','_JIM_MEALREL_RE','_JIM_MONTHS','_JIM_SELFTALK_RE','_jimDropAsides','_jimEchoWords','_jimMealRelTitle','_titleCap'], function(n){ return eval(n); });
let bad=0; const t=(lbl,got,want)=>{ const ok=got===want; if(!ok)bad++; console.log((ok?'  ok    ':'  FAIL  ')+lbl); if(!ok){console.log('          got:  '+JSON.stringify(got));console.log('          want: '+JSON.stringify(want));} };

// HIS BREAKFAST, with the aside he actually said
t('breakfast aside dropped',
  _jimDropAsides("I had a philly cheesesteak omelette at silver diner. whoa now I'm doing something that should be doing"),
  "I had a philly cheesesteak omelette at silver diner.");
// HIS WALK
t('walk aside dropped',
  _jimDropAsides("I did a post meal walk at 10:45 a.m. for 45 minutes. not much"),
  "I did a post meal walk at 10:45 a.m. for 45 minutes.");
// A REMARK ABOUT THE FOOD SURVIVES - his ruling
t('food remark kept',
  _jimDropAsides("eggs and toast. felt really good after eating this"),
  "eggs and toast. felt really good after eating this");
t('plain meal untouched', _jimDropAsides("chicken and rice"), "chicken and rice");
t('never returns nothing', _jimDropAsides("whoa"), "whoa");
// HIS NAME FOR THE MOVEMENT
t('post meal walk', _jimMealRelTitle("I did a post meal walk at 10:45 for 45 minutes"), "Post Meal Walk");
t('post breakfast walk', _jimMealRelTitle("post breakfast walk"), "Post Breakfast Walk");
t('nothing to name', _jimMealRelTitle("I walked the dog"), "");
// THE ECHO WORDS - the 10:45 must not vanish and a.m. must not be orphaned
const w=_jimEchoWords("I did a post meal walk at 10:45 a.m. for 45 minutes. not much");
const okW=!/a\.m\./i.test(w) && !/not much/i.test(w) && /walk/i.test(w);
if(!okW) bad++;
console.log((okW?'  ok    ':'  FAIL  ')+'echo words clean: '+JSON.stringify(w));
console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
