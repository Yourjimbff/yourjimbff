// "There's a weird toggle between clients and free clients. The button doesn't
// work the first time you hit it ... or there's a real delay. And then when I'm
// under free clients, I can't see how many active clients ... what we could do
// is paid versus free." (Yusuf, 16 Sep.)
//
// THE BUTTON WAS NEVER BROKEN. These chips are built inside the feed's own
// HTML, which is written at the END of a load that awaits eleven reads. So a
// tap set the value instantly and the chip then sat un-lit until every one of
// those reads came back - and if a load was already in flight, the tap queued
// behind it and waited for TWO of them. For two or three seconds it was a dead
// button, and the second tap only "worked" because by then the first load had
// landed.
//
// The filter itself runs in the browser, on rows already in hand, so the chip
// never needed the network to light up at all.
//
// AND ONLY ONE SIDE CARRIED A NUMBER, so standing in Free told him how many
// free accounts there were and nothing about the roster he earns from.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

let painted=0;
global.window={};
global.CLIENTS={paid1:{},paid2:{},paid3:{},free1:{},free2:{},hid1:{},me:{},coach:{isTrainer:true}};
global.cl={code:'me'};
global.isFreeApp=c=>String(c).indexOf('free')===0;
global.getHiddenClientSet=()=>({hid1:1});
global._feedWho=()=>window._feedWhoV||'clients';
global._feedFreeToday=()=>0;
global.document={getElementById:function(id){ return id==='fdWhoSegs' ? {set innerHTML(v){ painted++; }} : null; }};
global.localStorage={setItem:()=>{},getItem:()=>null};
global._FEED_WHO_KEY='k';
global._feedRepaint=function(){ window._repainted=(window._repainted||0)+1; };

const MINE=['_feedPaidCount','_feedFreeCount','_feedWhoInner','_feedWhoSegs','_feedWhoPaint','setFeedWho'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  BOTH SIDES CARRY A NUMBER NOW:');
/* Same rules line for line, so the two can be read against each other: no
   trainer, no hidden row, never himself. */
t(_feedPaidCount()===3, 'paid counts the paying roster', String(_feedPaidCount()));
t(_feedFreeCount()===2, 'free counts the free accounts', String(_feedFreeCount()));
t(_feedWhoInner().indexOf('Paid 3')>=0, 'and the chip says Paid 3', _feedWhoInner().slice(0,80));
t(_feedWhoInner().indexOf('Free 2')>=0, 'beside Free 2');
t(_feedWhoInner().indexOf('Clients')<0, 'nothing still says "Clients"');
/* The count rules have to match or the two numbers mean different things. */
const paidSrc=defOf('_feedPaidCount'), freeSrc=defOf('_feedFreeCount');
t(/r\.isTrainer \|\| hid\[c\] \|\| \(cl && c===cl\.code\)/.test(paidSrc)
  && /r\.isTrainer \|\| hid\[c\] \|\| \(cl && c===cl\.code\)/.test(freeSrc),
  'and both exclude the same people, line for line');

console.log('\n  THE CHIP ANSWERS THE TAP, NOT THE NETWORK:');
painted=0; window._repainted=0;
setFeedWho('free');
t(window._feedWhoV==='free', 'the tap sets the value');
t(painted===1, 'and repaints the chip immediately, on its own', 'painted '+painted);
t(window._repainted===1, '  then asks for the rows separately', 'repaints '+window._repainted);
const setSrc=defOf('setFeedWho');
t(setSrc.indexOf('_feedWhoPaint')<setSrc.indexOf('_feedRepaint'),
  'and the light comes BEFORE the load, which is the whole fix');

console.log('\n  THE REPAINT CANNOT NEST THE CONTAINER INSIDE ITSELF:');
/* The builder used to return the wrapper AND the hairline, so repainting from
   it meant slicing a string back apart. Split instead: the container is one
   function, its contents another, and the repaint writes the contents. */
t((_feedWhoSegs().match(/id="fdWhoSegs"/g)||[]).length===1, 'one container in the built row');
t(_feedWhoInner().indexOf('fdWhoSegs')<0, 'and the contents carry no container of their own');
t(/el\.innerHTML=_feedWhoInner\(\);/.test(defOf('_feedWhoPaint')), 'so the repaint is one assignment');
t(!/outerHTML/.test(defOf('_feedWhoPaint')), '  with no string surgery left in it');

console.log('\n  AND IT SURVIVES NOT BEING ON SCREEN:');
global.document={getElementById:()=>null};
t(_feedWhoPaint()===false, 'no container means it says so rather than throwing');
window._repainted=0;
setFeedWho('clients');
t(window._feedWhoV==='clients' && window._repainted===1,
  'and the tap still sets the value and asks for the rows');

console.log('\n  THE STORED VALUE IS UNCHANGED:');
/* Only the label moves. A stored 'clients' in somebody's browser still means
   the paid side, so nothing has to be migrated. */
t(/window\._feedWhoV=\(v==='free'\)\?'free':'clients';/.test(src), "'clients' is still what gets stored");

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (it lights when he taps it, and both sides count)');
process.exit(bad?1:0);
