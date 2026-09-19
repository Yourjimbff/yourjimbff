/* THE PLATE ON THE BUBBLE, AND EVERY PHOTO'S CLOCK (Yusuf, 19 Sep).

   "I'm gonna say, hey, yesterday I had these two for dinner, and I'm gonna
   upload two photos. It should take the time from the photos, and that's my
   dinner ... Jim, as far as feedback, should also bullet point itemize the
   foods that I said I had and the quantities that I said I had."

   What already stood: four photos a message, a sitting is one meal, one row
   per food in the marker, [FOOD_EDIT] for a correction in the same thread.
   What did not: only the FIRST photo's clock was kept, and the chat showed
   Jim's words with the rows sent to another tab. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntchatplate - what landed, drawn where they are looking; every photo keeps its clock');

const L=closure(['_jimLoggedBlock','_jimLoggedParse','_jimLoggedHtml','_jimSay']);
/* JSON is a runtime global, __jimFoodLanded a window property, and the lifter
   reads the regex literal /\[LOGGED\]/ as the two identifiers "__" and "LOGGED". */
const holes=L.unresolved.filter(n=>['JSON','__jimFoodLanded','__','LOGGED'].indexOf(n)<0);
ok(holes.length===0, 'it lifts with nothing missing', holes);
const F=new Function('var window={};'+L.code+'\nreturn {window:window,_jimLoggedBlock,_jimLoggedParse,_jimLoggedHtml,_jimSay};')();

// ------------------------------------------------------------ THE BLOCK
F.window.__jimFoodLanded=[{id:9101, name:'Two Nutrition Solutions trays', meal:'Dinner', eat_time:'7:42 PM', date_str:'Sep 18, 2026',
  calories:1180, protein:118, carbs:96, fat:34,
  items:[{n:'Chicken and rice tray', q:1, u:'each', cal:590},{n:'Steak and potato tray', q:1, u:'each', cal:590}]}];
const blk=F._jimLoggedBlock();
ok(/^\[LOGGED\]/.test(blk) && /\[\/LOGGED\]$/.test(blk), 'what landed is one compact block', blk.slice(0,60));
const plates=F._jimLoggedParse('Logged your dinner. Two trays, 1,180 calories.\n'+blk);
ok(plates && plates.length===1 && plates[0].items.length===2, 'and it parses back to the plate with both trays', plates&&plates[0].items.map(i=>i.n));
ok(plates[0].id===9101, 'carrying the row id, which is what a correction in the next message needs');
ok(F._jimLoggedBlock.call(null)===blk, 'the same turn gives the same block');
F.window.__jimFoodLanded=[];
ok(F._jimLoggedBlock()==='', 'a turn that wrote nothing adds nothing');

// -------------------------------------------------------------- THE WORDS
const said=F._jimSay('Logged your dinner. Two trays, 1,180 calories.\n'+blk);
ok(said==='Logged your dinner. Two trays, 1,180 calories.', 'the words never show the block', said);

// --------------------------------------------------------------- THE CARD
const html=F._jimLoggedHtml(plates);
ok(/Two Nutrition Solutions trays/.test(html) && /Dinner/.test(html) && /7:42 PM/.test(html), 'the card names the meal, the slot and the time they ate');
ok((html.match(/<li>/g)||[]).length===2 && /Chicken and rice tray/.test(html) && /Steak and potato tray/.test(html), 'one bullet per food');
ok(/1180 cal/.test(html) && /118g P/.test(html), 'and the total under them');
const q=F._jimLoggedHtml([{n:'Breakfast', meal:'Breakfast', at:'8:10 AM', cal:420, p:36, c:30, f:16,
  items:[{n:'eggs', q:3, u:'each', cal:215},{n:'sourdough', q:2, u:'slice', cal:180},{n:'butter', q:1, u:'tbsp', cal:100}]}]);
ok(/3 eggs/.test(q) && /2 slice sourdough/.test(q) && /1 tbsp butter/.test(q), 'the amounts they said ride on each line, as they said them', q.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,120));
ok(/<span class="clC">215<\/span>/.test(q), 'with the calories the table put on each');

// ------------------------------------------------------------ IT IS WIRED
ok(/items:\(foodRow\.items\|\|r\.items_shaped\|\|r\.items\|\|null\)/.test(src), 'the rows the app priced ride on what landed');
ok(/var _lb=_jimLoggedBlock\(\); if\(_lb\) reply=\(reply\|\|''\)\+'\\n'\+_lb;/.test(src), 'the block is added at the end of the one door, after every scrub');
ok(/_jimLoggedParse\(m\.content\)/.test(src) && (src.match(/_jimLoggedHtml\(_[a-z]+\)/g)||[]).length>=2, 'both surfaces draw the card: the chat bubble and the Jim tab');
ok(/\.replace\(\/\\\[LOGGED\\\]\[\\s\\S\]\*\?\\\[\\\/LOGGED\\\]\/g,''\)/.test(src), 'a model that copies the block is scrubbed before ours is added');

// ------------------------------------------------------- EVERY PHOTO'S CLOCK
ok(/window\._chatPhotoTakenAll=window\._chatPhotoTakenAll\|\|\[\]; window\._chatPhotoTakenAll\.push\(d\)/.test(src), 'every photo\'s moment is kept, in order, not the first one\'s');
ok(/window\._chatPhotoTaken=null; window\._chatPhotoTakenAll=\[\];/.test(src), 'and cleared with the send');
ok(/Photo times, read off the photos themselves/.test(src) && /one sitting, one \[FOOD_LOG\]/.test(src) && /separate meals, each with its own eat_time/.test(src),
   'the model is told each photo\'s time and the rule for one sitting versus two meals');
ok(/or several plates of food\. Read them all\. Plates eaten at one sitting are ONE meal/.test(src), 'and the several-photos note no longer assumes a workout');

console.log(fails? ('\n  '+fails+' FAILED\n') : '\n  all good\n');
process.exit(fails?1:0);
