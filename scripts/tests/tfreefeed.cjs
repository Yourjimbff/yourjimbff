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
process.exit(bad?1:0);
