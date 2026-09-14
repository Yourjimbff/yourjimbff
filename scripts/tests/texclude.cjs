// AN EXCLUDED FOOD IS GONE, NOT DEPRIORITISED.
//
// Yusuf, 13 Sep: "this should be food omissions if thats the proper term, or
// food exclusions -- pork, seafood, dairy, nuts, ect" and then, a minute later,
// the part that changes the shape of it: "when someone actually does write a
// food exclusion or omission, then they should never see those foods on the
// app at all."
//
// It was called "Not for me" and promised only that Jim would not suggest
// them. Two undersells in one card: the name sounds like a preference, and the
// promise was about one surface out of five.
//
// THE THREE TRAPS A SUBSTRING MATCH WALKS INTO, and the reason this is a table
// and not an indexOf:
//   TURKEY BACON IS NOT PORK. It is one of four breakfast proteins on his
//     shelf, and "pork" containing "bacon" would strike it off.
//   PEANUT BUTTER IS NOT DAIRY. "dairy" has to reach butter and cream.
//   AN EGGPLANT IS NOT AN EGG.
// Each category therefore carries what it means AND what it unmeans, and the
// unmeaning is checked first.
const {closure}=require('./_lift.cjs');
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

/* fdExcluded reads fdAvoid(), which reaches localStorage and the profile, so
   the chase drags those in. Lift the matcher and stub the one thing it asks
   for -- the list -- which is exactly the seam this suite wants to drive. */
const lift=closure(['fdExclMatch','_fdExNorm']);
const HOLES=(lift.unresolved||[]).filter(n=>n!=='JSON'&&n!=='_mbBuild');
if(HOLES.length){ console.log('  FAIL  the matcher has holes: '+HOLES.join(', ')); process.exit(1); }
global.window={};
eval(lift.code);
let LIST=[];
/* ASSIGNED AFTER THE EVAL, NEVER DECLARED BEFORE IT. The chase reaches fdAvoid
   through fdExclMatch's neighbourhood and lifts the real one, which reads
   localStorage; a `function fdAvoid(){}` up here hoists and is then overwritten
   by the eval's own declaration, and the stub silently does nothing. CLAUDE.md
   names this trap; it caught this suite anyway. */
fdAvoid = function(){ return LIST; };
/* fdExcluded is three lines over fdExclMatch and reaching for it through the
   lifter pulls in the whole storage chain, so it is re-declared here EXACTLY as
   index.html declares it and pinned below, character for character. */
function fdExcluded(name){
  if(!name) return false;
  var list=[]; try{ list=fdAvoid()||[]; }catch(e){ return false; }
  for(var i=0;i<list.length;i++){ if(fdExclMatch(list[i], name)) return true; }
  return false;
}
{
  const real=src.slice(src.indexOf('function fdExcluded(name){'), src.indexOf('\n}', src.indexOf('function fdExcluded(name){'))+2);
  const mine=fdExcluded.toString().replace(/\r/g,'');
  const norm=t=>t.replace(/\s+/g,' ').trim();
  t(norm(real)===norm(mine), 'the copy of fdExcluded under test is the one in index.html', norm(real));
}

const m=(word,name)=>fdExclMatch(word,name);

console.log('\n  THE FOUR HE NAMED:');
t(m('pork','Bacon'),            'pork strikes bacon');
t(m('pork','Ham'),              'and ham');
t(m('pork','Chorizo'),          'and chorizo');
t(m('seafood','Salmon'),        'seafood strikes salmon');
t(m('seafood','Shrimp'),        'and shrimp');
t(m('seafood','Sardines'),      'and sardines');
t(m('dairy','Greek Yogurt'),    'dairy strikes greek yogurt');
t(m('dairy','Cheese'),          'and cheese');
t(m('dairy','Milk'),            'and milk');
t(m('dairy','Cottage Cheese'),  'and cottage cheese');
t(m('nuts','Almonds'),          'nuts strikes almonds');
t(m('nuts','Peanut Butter'),    'and peanut butter');

console.log('\n  AND WHAT THEY MUST NOT STRIKE:');
/* The whole reason this is a table. */
t(!m('pork','Turkey Bacon'),    'TURKEY BACON IS NOT PORK');
t(!m('pork','Chicken Sausage'), 'nor is chicken sausage');
t(!m('dairy','Peanut Butter'),  'PEANUT BUTTER IS NOT DAIRY');
t(!m('dairy','Almond Butter'),  'nor is almond butter');
t(!m('dairy','Almond Milk'),    'nor is almond milk');
t(!m('nuts','Nutmeg'),          'NUTMEG IS NOT A NUT');
t(!m('nuts','Coconut'),         'nor is a coconut');
t(!m('eggs','Eggplant'),        'AN EGGPLANT IS NOT AN EGG');
t(m('eggs','Eggs'),             'but eggs are');
t(!m('beef','Turkey Bacon'),    'beef does not reach turkey');
t(!m('seafood','Chicken Breast'),'and seafood does not reach chicken');

console.log('\n  THE WORDS PEOPLE ACTUALLY TYPE:');
t(m('fish','Cod'),              '"fish" means seafood');
t(m('Dairy','Milk'),            'case does not matter');
t(m('  pork  ','Ham'),          'nor does whitespace');
t(m('lactose','Cheese'),        '"lactose" means dairy');
t(m('peanuts','Almonds'),       '"peanuts" means nuts');
t(m('red meat','Ribeye'),       '"red meat" reaches a ribeye');
t(!m('red meat','Chicken Breast'), 'and not a chicken breast');
t(m('gluten','Sourdough Bread'),'"gluten" reaches bread');
t(!m('gluten','Rice'),          'and not rice');

console.log('\n  A WORD IT HAS NEVER MET IS STILL THEIR WORD:');
/* No table entry, so it matches the name as written. Nobody has to teach it
   sauerkraut. */
t(m('sauerkraut','Sauerkraut'), 'sauerkraut strikes sauerkraut');
t(m('tilapia','Tilapia'),       'and tilapia, tilapia');
t(m('berries','Mixed Berries'), 'and a part of a name is enough');
t(!m('kiwi','Banana'),          'and it strikes nothing else');
t(!m('','Banana'),              'an empty word strikes nothing');
t(!m('pork',''),                'and nothing has no name to strike');

console.log('\n  THE LIST, NOT JUST ONE WORD:');
LIST=['pork','dairy'];
t(fdExcluded('Bacon'),          'anything on the list strikes');
t(fdExcluded('Milk'),           'any of them, not just the first');
t(!fdExcluded('Turkey Bacon'),  'and the exceptions hold through the list');
t(!fdExcluded('Chicken Breast'),'and everything else is untouched');
LIST=[];
t(!fdExcluded('Bacon'),         'an empty list strikes nothing');

console.log('\n  ONE GATE, SO EVERY SHELF OBEYS IT:');
/* mbComponents() is what the picker, mbFind, every step of every door and
   every suggestion read. _mbAllowed is its filter. Putting the check anywhere
   else would mean five screens each remembering to ask. */
const gate=src.slice(src.indexOf('function _mbAllowed(c, kind){'), src.indexOf('function mbComponents(kind){'));
t(/try\{ if\(fdExcluded\(c\.name\)\) return false; \}catch\(e\)\{\}/.test(gate),
  'the gate every builder list passes through asks');
t(/_mbAllowed\(c, kind\)/.test(src.slice(src.indexOf('function mbComponents(kind){'), src.indexOf('function mbById'))),
  'and mbComponents is what calls it');
t(/var pool=mbComponents\(kind\);/.test(src), 'so mbFind cannot resolve one either');

console.log('\n  THE CARD SAYS WHAT IT DOES:');
t(/<span class="fdxSecT">Food exclusions<\/span>/.test(src), 'it is called Food exclusions');
t(!/Not for me<\/span>/.test(src), 'and "Not for me" is gone');
t(/Never shown anywhere \\u2039/.test(src),
  'the line under it no longer promises only that Jim will not suggest them');
t(/function _fdExOpen\(\)/.test(src) && /fdExToggle\(\)/.test(src),
  'and the whole section folds away, because it was eating the page');
const shut=src.slice(src.indexOf('  if(!_fdExOpen()){'), src.indexOf('  var h=', src.indexOf('  if(!_fdExOpen()){')));
t(/_n\?\(_n\+\(_n===1\?' food':' foods'\)\):'none'/.test(shut),
  'shut, it still says how many are set - a fold that hides its own state is worse than no fold');
t(/localStorage\.setItem\(_fdExOpenKey\(\)/.test(src),
  'and being open survives a repaint, so nobody loses it mid-type');
t(!/Jim never suggests these/.test(src), 'that sentence is gone with it');

console.log('\n  AND IT IS A TAP, NOT A SPELLING TEST:');
t(/var FD_EXCL_SUGGEST=\['Pork','Seafood','Dairy','Nuts'/.test(src), 'his four lead the chips');
t(/function fdAvoidPick\(name\)\{/.test(src), 'a chip goes through one door');
t(/function _fdExclRepaint\(\)\{/.test(src), 'and every open shelf redraws when the list changes');
['fdAvoidAdd','fdAvoidDrop','fdAvoidPick'].forEach(fn=>{
  const b=src.slice(src.indexOf('function '+fn), src.indexOf('function '+fn)+900);
  t(/_fdExclRepaint\(\)/.test(b), fn+' repaints, so a change is never half-applied');
});

console.log('\n  AND IT IS EDITABLE IN SETTINGS TOO:');
/* Yusuf, 13 Sep: "they can further edit that in settings as well" */
t(/function _gpSecFood\(\)\{/.test(src), 'settings carries the section');
t(/try\{ html\+=_gpSecFood\(\); \}catch\(e\)\{\}/.test(src), 'and renders it with the rest of the closet');
t(/var h=''; try\{ h=fdPrefHtml\(\); \}catch\(e\)\{ return ''; \}/.test(src),
  'from the SAME renderer as the Food tab, so the two can never disagree');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
