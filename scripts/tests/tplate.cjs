/* READ ALL OF THE PLATE (Yusuf, 18 Sep, off Brandon Injety's breakfast).

   He logged a medium Dunkin coffee with almond milk AND a Dunkin hash brown.
   The card totalled 139 cal. The read said:

     "Clean start - caffeine, basically no calories."

   It addressed the coffee and behaved as though the hash brown was not there.
   Yusuf: "where is the hash brown? The hash brown is definitely calories ...
   what is the point of eating the hash brown, what does it do? It is just carbs
   and fat."

   And: "put what their current weight is and what their goal weight is next to
   their name" - because a hash brown is a different conversation for somebody
   at maintenance and somebody with forty pounds to lose, and the card gave him
   the meal with no idea which he was looking at. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntplate - every food on the plate is read, and the goal is on the card');

// ---------------------------------------------- THE RULES REACH EVERY WRITER
const ten=(()=>{ const i=src.indexOf('function _jimTenLogs(){');
  return src.slice(i, src.indexOf('\n}\n', i)); })();
ok(ten.length>2000, 'the shared block is where it was');
ok(/NEVER DESCRIBE A MEAL BY ITS LIGHTEST ITEM/.test(ten),
   'a meal may not be described by its lightest item');
ok(/basically no calories/.test(ten), 'and the sentence that produced the rule is quoted');
ok(/THE FOOD THAT DOES NOTHING IS THE READ/.test(ten),
   'the item that is only there out of habit is the read');
ok(/what is it\s+actually doing for you/.test(ten), 'in his own frame');
ok(/NAME EVERY FOOD YOU WERE GIVEN/.test(ten), 'and no food may be silently dropped');
ok(/scratches the same itch/.test(ten), 'the swap survives into this rule too');

/* It has to reach every prompt that writes a read, not one of them. _jimTenLogs
   is the shared block precisely because a rule one writer obeys is not a rule -
   this file learned that on 17 Sep when the whole voice lived inside the photo
   path and the chat path, which all 82 clients use, saw none of it. */
ok((src.match(/_jimTenLogs\(\)/g)||[]).length>=5,
   'and the block is handed to every writer', (src.match(/_jimTenLogs\(\)/g)||[]).length);

// ------------------------------------------------- WEIGHT AND GOAL ON THE CARD
const lifted=closure(['_jvWeightChip']);
/* _jvWeightMap is a window property, not a file-level declaration, so the
   lifter reports it. Seeded below like the runtime does. */
const holes=lifted.unresolved.filter(n=>n!=='_jvWeightMap');
ok(holes.length===0, 'the chip lifts with nothing missing', holes);
const F=new Function('var window={};'+lifted.code+'\nreturn {_jvWeightChip, setMap:function(m){ window._jvWeightMap=m; }};')();

F.setMap({bran:{w:212,g:185}, hold:{w:185,g:185}, wonly:{w:174,g:null}, gonly:{w:null,g:150}});
ok(/212/.test(F._jvWeightChip('bran')) && /185/.test(F._jvWeightChip('bran')),
   'a client on the way somewhere shows both numbers', F._jvWeightChip('bran'));
ok(/→/.test(F._jvWeightChip('bran')), 'with an arrow between them');
ok(!/→/.test(F._jvWeightChip('hold')), 'somebody already at their number gets one figure, not "185 to 185"');
ok(/174/.test(F._jvWeightChip('wonly')), 'a weight with no goal still shows');
ok(/goal 150/.test(F._jvWeightChip('gonly')), 'a goal with no weight says so');
ok(F._jvWeightChip('nobody')==='', 'and a client with neither gets NO chip, not an empty one');

// it is actually on the card, and it never blocks the feed
ok(/_jvWeightChip\(code\)/.test(src), 'the feed card draws it beside the name');
ok(/if\(!window\._jvWeightMap\) _jvLoadWeights\(\)\.then/.test(src),
   'loaded once per session and never waited on, so a slow read cannot hold the feed');
ok(/select=client_code,weight,goal_weight/.test(src), 'off one read for every client');
ok(/\.fcGoal\{/.test(src), 'and it is styled');

console.log(fails? ('\ntplate: '+fails+' FAILED\n') : '\ntplate: all good\n');
process.exit(fails?1:0);
