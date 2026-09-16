// "when i like someones activity on the desktop feed, it opens up the desktop
// calendar" (Yusuf, 16 Sep).
//
// This is the 23 Aug bug back again - "a like on the feed put the calendar week
// grid in the main pane while the nav still read Feed" - through the one door
// that fix did not close. It guarded on whether the calendar's REGISTERED HOST
// was visible. jvLoadSchedule registers #jvWall, and #jvWall is the cockpit's
// shared main pane, so once he has opened the Calendar tab even once the guard
// is asking "is the main pane on screen", and the answer is always yes.
//
// The mode is the only thing that answers the real question.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

let calls={};
function stub(n){ return function(){ calls[n]=(calls[n]||0)+1; }; }

function run(opts){
  calls={};
  global.window={ _schDayTs:opts.dayTs, _schHostId:opts.hostId, cl:null };
  global.jvMode=opts.mode;
  // Every host id resolves to a node that IS on screen - that is the whole
  // point: on the desktop the calendar's host is the pane the feed sits in.
  global.document={ getElementById:function(id){
    if(id==='mwOverlay') return { classList:{ contains:function(){ return !!opts.overlayOn; } } };
    return { id:id, offsetParent:{} };
  }};
  global.schRefresh=stub('schRefresh');
  global.callsBarRender=stub('callsBarRender');
  ['renderDayTimeline','loadBookings','loadConsults','jvPaneRender','admRenderNeeds',
   'renderMobFrontDesk','jtRenderAll'].forEach(n=>{ global[n]=stub(n); });
  _jvRefreshAllSurfaces();
  return calls;
}
// Lifted ONCE, at module scope, so the guard below and run() are looking at the
// same function. Evalled inside run() it would be a local the guard cannot see,
// and the suite would pass while measuring nothing.
eval(defOf('_jvRefreshAllSurfaces'));
run({mode:'feed',dayTs:1,hostId:'jvWall'});
guard(['_jvRefreshAllSurfaces'], n=>eval(n));

console.log('\n  A LIKE ON THE FEED DOES NOT NAVIGATE:');
let c=run({mode:'feed', dayTs:1, hostId:'jvWall'});
t(!c.schRefresh, 'the calendar is not refreshed while he is reading the feed',
  'schRefresh x'+(c.schRefresh||0));
t(c.callsBarRender===1, '  but the calls bar still updates, since it is not the calendar',
  'callsBarRender x'+(c.callsBarRender||0));

console.log('\n  AND IT STILL REFRESHES WHERE IT SHOULD:');
c=run({mode:'schedule', dayTs:1, hostId:'jvWall'});
t(c.schRefresh===1, 'standing IN the calendar, a like refreshes it');
c=run({mode:'feed', dayTs:1, hostId:'jvWall', overlayOn:true});
t(c.schRefresh===1, 'and the phone overlay counts as showing it');

console.log('\n  NOTHING TO REFRESH IS NOT A REFRESH:');
c=run({mode:'schedule', dayTs:null, hostId:'jvWall'});
t(!c.schRefresh, 'no day has ever been loaded, so there is nothing to repaint');

console.log('\n  THE REST OF THE SURFACES ARE UNTOUCHED BY THIS:');
c=run({mode:'feed', dayTs:1, hostId:'jvWall'});
['loadBookings','loadConsults','jvPaneRender','admRenderNeeds','renderMobFrontDesk','jtRenderAll']
  .forEach(n=>t(c[n]===1, '  '+n+' still runs'));

console.log('\n  IT ASKS THE MODE, NOT THE NODE:');
const src=defOf('_jvRefreshAllSurfaces');
t(/jvMode==='schedule'/.test(src), 'the guard reads the mode');
t(!/offsetParent/.test(src), 'and the offsetParent test that could never work is gone');
t(!/\bvar _[A-Za-z]/.test(src), 'no underscore-prefixed locals left in the lifted body');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (a like stays on the page he is reading)');
process.exit(bad?1:0);
