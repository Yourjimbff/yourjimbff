/* THE RECAP BEFORE IT LANDS - the sheet the bar shows before anything is written.
   Yusuf, 17 Sep: he opted into Jim's feedback, logged Nutrition Solutions protein
   pancakes through the bar, and got back a row with rating unknown and all four
   macros null - so there was nothing to total and nothing for Jim to read. He
   asked for a recap before submission and for a way to write back to Jim ("I
   wanted to say I had two of these").

   Every assertion here is scoped to a slice with BOTH ends guarded. A missing end
   anchor is a broken test, not an empty result - the whole-file read that costs a
   day is the one that silently ran to EOF. */
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
let fails=0;
const ok =(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c) fails++; };
function slice(a,b){
  const i=src.indexOf(a);
  if(i<0) throw new Error('trecap: start anchor not found: '+a);
  const j=src.indexOf(b,i);
  if(j<0) throw new Error('trecap: end anchor not found after start: '+b);
  return src.slice(i,j);
}
console.log('\ntrecap - the recap sheet');

// ---- 1. the bar queues instead of writing, and there is still ONE writer
const bar=slice('async function smartLogFromText(q){','async function addMacrosToEntry(');
ok(/var _mrQ = _mrReviewOn\(\) \? \[\] : null;/.test(bar), 'the bar opens a review queue');
ok(/if\(_mrQ\)\{ _mrQ\.push\(\{row:row, entry:entry, remember:remember\}\); return; \}/.test(bar),
   '_push queues instead of writing while the queue is open');
ok(/_okr = await _mrReview\(/.test(bar), 'the sheet is awaited before anything writes');
ok(/if\(!_okr\)\{[^\n]*return false; \}/.test(bar), 'Back writes nothing and says so');
ok(/await _push\(_row, _ent, !!_base\.remember\);/.test(bar), 'commit replays through the same _push');
ok(bar.indexOf('_mrQ=null;')>0, 'the queue is closed before the replay, or the replay would queue itself');

// ---- 2. a food nobody priced stays unknown, and its macros stay NULL not 0
// Zero is a claim about the food. Null is the truth: nobody said.
ok(/var _blank=!\(\(\+_x\.calories>0\)\|\|\(\+_x\.protein>0\)\|\|\(\+_x\.carbs>0\)\|\|\(\+_x\.fat>0\)\);/.test(bar),
   'a row with nothing on it is recognised');
ok(/_t\.rating=_blank\?'unknown':_keep;/.test(bar), 'an unpriced food is still unknown after the sheet');
ok(/_t\.calories=_blank\?null:/.test(bar), 'an unpriced food saves null calories, never 0');

// ---- 3. the unattended door must never wait for a tap
const bulk=slice('try { window._mrSkip = true; } catch (e) {}','else if (a.type === ');
ok(/await smartLogFromText\(line\)/.test(bulk) && /window\._mrSkip = false/.test(bulk),
   'the bulk door turns the sheet off around its own call and back on after');

// ---- 4. the sheet itself
const sheet=slice('function _mrReview(queue, ctx){','function _jimAsked(prof){');
ok(/ov\.className='fdOv open mrOv'/.test(sheet), 'the sheet is the house glass overlay, not a flat panel');
ok(/\.mrSheet\{[^]*?backdrop-filter:blur/.test(src), 'and the glass is real: the panel actually blurs what is behind it');
ok(/id="mrGo"/.test(sheet) && /_mrCancel\(\)/.test(sheet), 'it has both answers');
ok(/_jimOptedIn\(\)/.test(sheet), 'Jim’s read and the Tell Jim row are gated on the opt-in');
ok(/placeholder="Tell Jim/.test(sheet), 'the write-back row is on the sheet');
ok(/resolve\(true\); return;/.test(sheet), 'an empty queue resolves rather than showing an empty sheet');

// ---- 5. HOUSE LAW: no emoji, anywhere in any of it
const all=slice('/* ===== THE RECAP BEFORE IT LANDS =','/* ===== HOW JIM TALKS TO YOU =')+bar;
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(all), 'no emoji in the recap (house law)');

// ---- 6. the pure helpers, RUN rather than read. A clamp that reads fine can
// still answer 4.67 handfuls; arithmetic is only proved by arithmetic.
const lift=n=>{ const m=src.match(new RegExp('\\nfunction '+n+'\\([^]*?\\n\\}\\n')); if(!m) throw new Error('trecap: cannot lift '+n); return m[0]; };
let _mrState=null;
eval(lift('_mrItems')+lift('_mrUnknown')+lift('_mrTotals'));
ok(_mrUnknown({calories:0,protein:0,carbs:0,fat:0})===true,  'all zeros reads as unpriced');
ok(_mrUnknown({calories:null,protein:null,carbs:null,fat:null})===true, 'all nulls reads as unpriced');
ok(_mrUnknown({calories:0,protein:21,carbs:0,fat:0})===false, 'protein alone is a priced food');
ok(_mrUnknown({calories:250,protein:0,carbs:0,fat:0})===false,'calories alone is a priced food');
_mrState={items:[{calories:250,protein:21,carbs:30,fat:5},{calories:100,protein:2,carbs:20,fat:1}]};
const t=_mrTotals();
ok(t.calories===350 && t.protein===23 && t.carbs===50 && t.fat===6, 'totals add the plate up ('+JSON.stringify(t)+')');
// The case his pancakes actually hit: one row, nothing known.
_mrState={items:[{name:'Nutrition Solutions Protein Pancakes',calories:0,protein:0,carbs:0,fat:0}]};
ok(_mrTotals().calories===0, 'a plate of one unpriced food totals 0 rather than inventing a number');
ok(_mrItems().length===1 && _mrUnknown(_mrItems()[0])===true, 'and that row is the one the sheet asks about');

console.log(fails?('\n  '+fails+' FAILED\n'):'\n  all passed\n');
process.exit(fails?1:0);
