// TWO FEEDS, ONE TAB. Free accounts off his client board.
//
// His order, 14 Sep: "all free users who create an account that do not have a
// deal attached to them moving forward are on a separate free feed. everything
// still shows the same way that shows for clients, but it's just on a separate
// feed. It can be a part of feed. I just need to toggle over to it."
//
// It is a FILTER, not a second surface, and it leans on isFreeApp() - the same
// one every other screen already uses - so there is no second idea of who is
// free to drift from the first.
//
// The case this suite exists for is the one that would embarrass him: a tile
// counting 40 clients over a feed showing free accounts, or the other way
// round. The count and the cards answer to the same switch or neither does.
const fs=require('fs');
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

const store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addListener(){},addEventListener(){}})};
global.document={addEventListener(){},removeEventListener(){},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},classList:{add(){},remove(){},contains:()=>false},appendChild(){},setAttribute(){}}),
  body:{appendChild(){},removeChild(){},classList:{add(){},remove(){},contains:()=>false,toggle(){}}}};
global.navigator={userAgent:'node'};
const ROSTER={
  paying1:{name:'Paying One'},
  paying2:{name:'Paying Two'},
  free1:{name:'Free One', is_free_app:true},
  free2:{name:'Free Two', is_free_app:true},
  coach:{name:'Yusuf', isTrainer:true}
};
global.CLIENTS=ROSTER;
global.cl={code:'coach'};
global.FREE_APP_CODES={};
global.getHiddenClientSet=()=>({});

const lift=closure(['_feedWhoPass','setFeedWho','_feedFreeCount','_feedWho']);
eval(lift.code);
CLIENTS=ROSTER; getHiddenClientSet=function(){ return {}; };
t(typeof _feedWhoPass==='function','lifted the filter');

console.log('\n  the client side is his board, unchanged:');
setFeedWho('clients');
t(_feedWhoPass('paying1')===true,'a paying client shows');
t(_feedWhoPass('free1')===false,'a free account does not');
t(_feedWhoPass('')===true,'and a card belonging to nobody still shows (a moment)');

console.log('\n  the free side is the same cards, other people:');
setFeedWho('free');
t(_feedWhoPass('free1')===true,'a free account shows');
t(_feedWhoPass('paying1')===false,'a paying client does not');

console.log('\n  it survives a refresh:');
t(localStorage.getItem('yjb_feed_who')==='free','the choice is written down');
setFeedWho('clients');
t(localStorage.getItem('yjb_feed_who')==='clients','and changed when he changes it');

console.log('\n  the chip counts what the free side would actually show:');
t(_feedFreeCount()===2,'two free accounts',_feedFreeCount());

console.log('\n  the tiles and the cards answer the same switch:');
// Structural: _feedStatSets builds the tile sets, the feed builds the cards.
// Both have to consult it or the screen contradicts itself.
t(/_fdChipPass\(it\.code\) && _feedWhoPass\(it\.code\)/.test(src),'the cards are filtered');
t(/!CLIENTS\[c\]\.isTrainer && c!==cl\.code && _feedWhoPass\(c\)/.test(src),'and so are the tiles above them');
t(/isFreeApp\(c\)/.test(src),'and free is decided by isFreeApp, not a second list');

console.log(bad?('\n'+bad+' FAILED'):'\nall passed');
// (exit moved to the foot of the file - a second block runs below)

/* ===== THE FLAG HAS TO BE LOADED, NOT JUST READ =========================
   Yusuf, 14 Sep, an hour into the launch: "some of these free people are
   popping up on clients instead of free."

   Everything in this suite above measured the FILTER, and the filter was
   right. What was wrong sat one layer down: isFreeApp() reads
   CLIENTS[code].is_free_app and nothing else, and the roster query - the one
   the trainer's feed is built from - never selected that column. The sign-in
   read learned to fetch it on 13 Sep, but that read fetches one row, the
   person signing in. So every free account arrived with the flag undefined,
   isFreeApp answered false for all of them, and the Clients side swallowed
   eleven people.

   An undefined flag and a paying client look identical to a boolean, which is
   why nothing anywhere said so. This is the assertion that would have. */
(function(){
  const fs2=require('fs');
  const src2=fs2.readFileSync('index.html','utf8');
  const i=src2.indexOf("async function loadRosterFromDB(){");
  const body=i<0?'':src2.slice(i, i+4000);
  let b2=0;
  const t2=(pass,label,extra)=>{ if(!pass) b2++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined?('  '+extra):'')); };
  console.log('\n  AND THE ROSTER ACTUALLY LOADS THE FLAG:');
  t2(!!body, 'the roster loader is findable');
  const sel=(body.match(/select=code,name,initials[^']*/)||[''])[0];
  t2(/is_free_app/.test(sel), 'the roster asks the database for is_free_app', sel.slice(0,120));
  t2(/if\(r\.is_free_app!==undefined\) e\.is_free_app = \(r\.is_free_app===true\)/.test(body),
     'and puts it on the roster entry isFreeApp reads');
  t2(!/e\.is_free_app\s*=\s*false/.test(body),
     'an absent column is never written as false - sbSelect drops a rejected column, so absent means not asked');
  // isFreeApp itself is the only reader, and it is strict about true.
  const ifa=(src2.match(/function isFreeApp\(code\)\{[\s\S]*?\n\}/)||[''])[0];
  t2(/rec && rec\.is_free_app===true/.test(ifa), 'isFreeApp still reads exactly that field');
  if(b2){ console.log('  '+b2+' FAILED'); process.exitCode=1; }
  else console.log('  all passed');
})();

process.exit((bad||process.exitCode)?1:0);
