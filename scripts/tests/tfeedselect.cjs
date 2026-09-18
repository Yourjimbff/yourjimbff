/* THE COLUMN THE CARD READS AND THE QUERY NEVER ASKED FOR.

   Yusuf, 17 Sep, twice in one night. First: "if there is one actionable thing
   here from this entire chat ... I should be able to see Jim's feedback in my
   feed under the food logs." It was built, tested and shipped the same night.
   Then: "why is it that I can't?"

   The card was right. The feed's food query selects fourteen named columns and
   `insight` was not one of them, so every card asked a row for a field the row
   had never been given, got undefined, and honestly said Jim had not written -
   about meals Jim HAD written on. Twelve assertions passed over a renderer
   nobody could feed.

   THIS SUITE IS THE GUARD FOR THE WHOLE CLASS. Every column the feed card
   reads off a food row must arrive from somewhere: the main select, or one of
   the second-pass backfills. A renderer reading a column no query asks for is
   a silent empty state, which is the worst shape a bug can have - it looks
   like a fact about the data. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntfeedselect - every column the feed card reads is a column the feed asks for');

// ---- every food_logs select anywhere in the feed loader
const loader=(()=>{
  const i=src.indexOf('var _foodsP =');
  const j=src.indexOf('var _resAll = await Promise.all(', i);
  if(i<0||j<0) throw new Error('tfeedselect: cannot find the feed loader');
  return src.slice(i, j+400);
})();

/* EVERY select= IN THE LOADER, not just the first. The second passes build
   their query by concatenation - 'id=in.(' + ids.join(',') + ')&select=id,photo'
   - so a regex that reads one quoted string stops at the first apostrophe and
   sees none of them. Scanning for the select= clauses themselves is the only
   reading that covers both shapes. */
const selects=[...loader.matchAll(/select=([a-z_]+(?:,[a-z_]+)*)/g)].map(m=>m[1]);
ok(selects.length>=4, 'the loader has a main select and its second passes', selects.length);

const supplied=new Set();
selects.forEach(q=>{ q.split(',').forEach(c=>supplied.add(c.trim())); });

/* The columns the feed card reads off a food row. Hand-kept on purpose: a
   scan of `it.data.X` cannot tell a food row's column from a weigh-in's or a
   journal entry's, and a guard that cannot tell is a guard nobody trusts.
   Anything added to the food branch of _feedItemHtml belongs on this list. */
const FOOD_COLUMNS=[
  'id','client_code','name','calories','protein','carbs','fat','rating',
  'logged_at','date_str','meal','eat_time','photo','raw_text','insight'
];
FOOD_COLUMNS.forEach(c=>{
  ok(supplied.has(c), 'the feed actually fetches '+c, supplied.has(c)?undefined:[...supplied]);
});

/* The one that broke, named on its own so a future rewrite of the list above
   cannot quietly drop it again. */
ok(/select=id,insight\b/.test(loader), 'insight has its own second pass, like raw_text and caffeine');

// ---- and the second pass is actually awaited, in the slot the file demands
const all=/var _resAll = await Promise\.all\(\[([^\]]+)\]\)/.exec(src);
ok(!!all, 'the loader awaits its promises');
const slots=all ? all[1].split(',').map(s=>s.trim()) : [];
ok(slots.indexOf('_insBackfill')>=0, 'the insight pass is awaited', slots);
/* THE FILE'S OWN LOUD WARNING, kept honest: "_cafBackfill GOES ON THE END ...
   This array is read POSITIONALLY below - _resAll[7] is steps - so slotting a
   new promise in beside the other backfills silently handed steps the wrong
   result and emptied them off his feed." So a new promise goes LAST. */
ok(slots.indexOf('_insBackfill')===slots.length-1,
   'and it was added on the END, because this array is read by position', slots);
ok(slots.indexOf('_stepsP')===7, 'steps is still at index 7, which the reader below hard-codes', slots.indexOf('_stepsP'));

// ---- it must land before the grouping copies a row
const backfillAt=src.indexOf('var _insBackfill');
const groupAt=src.indexOf('One meal, one post. Four foods under breakfast');
const awaitAt=src.indexOf('var _resAll = await Promise.all(');
ok(backfillAt>0 && awaitAt>backfillAt && groupAt>awaitAt,
   'and it is awaited BEFORE the grouping, so a plate logged as four foods carries it too');

// ---- the cap and the chunking match the passes it sits beside
const ins=src.slice(backfillAt, backfillAt+900);
ok(/slice\(0,200\)/.test(ins), 'same 200-row cap as the raw_text pass');
ok(/\+=40/.test(ins) && /limit=40/.test(ins), 'same 40-row chunks');
ok(/catch\(e\)\{\}/.test(ins), 'and it never throws - a missing read may not take the feed down');

console.log(fails? ('\ntfeedselect: '+fails+' FAILED\n') : '\ntfeedselect: all good\n');
process.exit(fails?1:0);
