// "We should get a feed notification anytime someone finishes a workout
// assessment." (Yusuf, 16 Sep.)
//
// The assessment is the Strength Check, and it writes mi_checkins kind
// 'connection'. Read off the live table the same day: 144 connection rows
// across 30 clients, the newest finished that morning. So people have been
// doing these for weeks.
//
// THE FEED WAS ALREADY READING THEM AND THROWING THE ROW AWAY. loadTrainerFeed
// fetched every connection row, collapsed each into one token, and hung that
// token on a WORKOUT card as a badge. Finish a check on a day with no workout
// and nothing appeared anywhere. It was never a missing read; it was a row that
// never became an item.
//
// AND THE PHONE NEEDS ITS OWN BRANCH. The steps row three screens up is a
// monument to exactly that: a kind with a branch only in the cockpit chain
// falls through to the ELSE, which is the food case, and renders as "logged
// something" with "a meal" under it.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

global.window={};
eval(src.split('\n').filter(l=>l.startsWith('var _TL_CONN_PHRASE=')).join('\n'));
const MINE=['_tlBestConn','_pfConnLine','_feedTs','_feedHasTz'];
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(['_TL_CONN_PHRASE']), n=>eval(n));

console.log('\n  A REAL ROW, THE SHAPE THE TABLE ACTUALLY HOLDS:');
/* Copied from the newest connection row on 16 Sep. */
const REAL={"Legs":{"r":"felt","by":{"Calves":"felt","Leg Press":"felt","Romanian Deadlift":"felt"}}};
t(_pfConnLine(REAL)==='Legs · great connection', 'one line out of a real row', _pfConnLine(REAL));
t(_pfConnLine(JSON.stringify(REAL))===_pfConnLine(REAL), 'and the same whether it arrives parsed or as text');

console.log('\n  HIS OWN WORDS FOR THE VERDICT, NOT A SECOND SET:');
/* _TL_CONN_PHRASE is what the Day card has printed for weeks. A second
   vocabulary for the same three values is how one session gets described two
   ways on two screens. */
t(/_TL_CONN_PHRASE\[best\]/.test(defOf('_pfConnLine')), 'the line borrows the phrases rather than inventing them');
t(_pfConnLine({Chest:{r:'nothing'}}).indexOf(_TL_CONN_PHRASE.nothing)>=0, 'quiet reads as his quiet');
t(_pfConnLine({Chest:{r:'partial'}}).indexOf(_TL_CONN_PHRASE.partial)>=0, 'partial reads as his partial');
t(_pfConnLine({Chest:{r:'felt'}}).indexOf(_TL_CONN_PHRASE.felt)>=0, 'felt reads as his felt');

console.log('\n  SEVERAL GROUPS, AND THE ONES RATED ON THEIR OWN:');
t(_pfConnLine({Back:{r:'felt'},Biceps:{r:'partial'}}).indexOf('Back, Biceps')===0, 'groups are named in order',
  _pfConnLine({Back:{r:'felt'},Biceps:{r:'partial'}}));
const many={Back:{r:'felt'},Biceps:{r:'felt'},Chest:{r:'felt'},Core:{r:'felt'},Legs:{r:'felt'}};
t(/\+2/.test(_pfConnLine(many)), 'and a long list is counted rather than run on', _pfConnLine(many));
/* "ex:Stairmaster" is one movement rated on its own. It counts toward the
   verdict and is not a heading. */
const solo={'ex:Stairmaster':{r:'partial'}};
t(_pfConnLine(solo).indexOf('ex:')<0, 'a standalone movement is not printed as a muscle group', _pfConnLine(solo));
t(_pfConnLine(solo).indexOf(_TL_CONN_PHRASE.partial)>=0, '  but it still sets the verdict');
t(_pfConnLine({Legs:{r:'felt'},'ex:Pilates':{r:'nothing'}}).indexOf('Legs')===0, 'and a mix names only the group');

console.log('\n  AND NOTHING IS NOT A CHECK:');
[[null,'null'],[undefined,'undefined'],[{},'an empty object'],['','an empty string'],
 ['not json','junk text'],[42,'a number']].forEach(([v,why])=>{
  t(_pfConnLine(v)==='', why+' makes no line');
});

console.log('\n  IT LANDS AT THE TIME THEY FINISHED:');
/* mi_checkins stamps checked_at and has no logged_at. Without that column the
   row fell through to date_str and landed at midnight - the bottom of its own
   day, on a feed whose only ordering key is time. */
const noon=_feedTs({checked_at:'2026-09-16T11:48:27.093+00:00', date_str:'Sep 16, 2026'});
const mid =_feedTs({date_str:'Sep 16, 2026'});
t(noon>0 && noon>mid, 'checked_at beats the bare day', noon+' vs '+mid);
t(_feedTs({logged_at:'2026-09-16T20:00:00Z', checked_at:'2026-09-16T01:00:00Z'})
  ===_feedTs({logged_at:'2026-09-16T20:00:00Z'}), 'and logged_at still wins where a row has one');

console.log('\n  WIRED ON BOTH SURFACES:');
t(/kind:'conn',code:c,data:r/.test(src), 'the row becomes an item');
t(/window\._pfConnItems=\[\]; var _connSeen=\{\};/.test(src), 'deduped per client per day, on its own seen-set');
t(/\} else if\(it\.kind==='conn'\)\{\s*\n\s*what='Strength check';/.test(src), 'the cockpit row has a branch');
t(/else if\(it\.kind==='conn'\)\{[\s\S]{0,200}Strength check<\/div>/.test(src), 'and so does the phone tile');
t(/it\.kind==='conn'\?'finished a strength check'/.test(src), 'and the verb says what they did');
t(/window\._pfConnByKey=\{\}; window\._pfConnRawByKey=\{\}; window\._pfConnItems=\[\]; \}/.test(src),
  'a failed read clears the items with the maps, so a stale card cannot survive it');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (finishing one shows up where he is already looking)');
process.exit(bad?1:0);
