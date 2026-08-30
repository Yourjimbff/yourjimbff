// CLIENT-PLANNED EVENTS ON THE FEED (Yusuf, order, 30 Aug).
// "An event a client planned shows on that client's feed card only on the
//  calendar day it lands. Nothing from the future ever shows."
//
// GROUND TRUTH, read off live before any of this was written. calendar_blocks
// holds SIX rows in total. Two are Ali Mohammed's (alim1) — "Run 4.99KM" and
// "Legs", both one-off, both dated Aug 26 2026, and BOTH active:false, which is
// this table's soft delete. So Ali's live planned week is empty, and the shapes
// below are his own two rows with `active` flipped, plus a repeat and an
// exception in the shape the calendar's own layer writes them. A fixture that
// only passes on one day of one client tests the fixture: every day here is
// derived from "today" at run time, never a literal date.
//
// THE HAZARD THIS EXISTS FOR. A block carries NO TIMESTAMP. It has start_local
// (a time) and then either a one-off date_str or a days[] array — so _feedTs,
// which every other feed item is banded by, has nothing to read on a repeating
// block at all. It is proved below that it returns 0, because the whole design
// (expand first, band second) only makes sense if that is true.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function lift(name){
  const s=L.findIndex(l=>l.startsWith('function '+name+'(')||l.startsWith('async function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name+' not found');
  let d=0,st=false;
  for(let i=s;i<L.length;i++){ for(const c of L[i]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return L.slice(s,i+1).join('\n'); }
  throw new Error('SEAM MOVED: no close found for '+name);
}
// A var whose value runs to the matching close bracket — _CB_KINDS is an array
// literal over several lines and a one-line grab would cut it in half.
function liftVar(name){
  const s=L.findIndex(l=>l.startsWith('var '+name+'=')||l.startsWith('var '+name+' ='));
  if(s<0) throw new Error('SEAM MOVED: var '+name+' not found');
  let d=0,st=false;
  for(let i=s;i<L.length;i++){
    for(const c of L[i]){ if(c==='['||c==='{'){d++;st=true;} else if(c===']'||c==='}'){d--;} }
    if(/;\s*(\/\/.*)?$/.test(L[i]) && (!st || d===0)) return L.slice(s,i+1).join('\n');
  }
  throw new Error('SEAM MOVED: no end found for var '+name);
}
// THE LIFT MUST ACTUALLY LOOK. A deliberately fake name has to report missing,
// or every "all pass" below is a suite grading an empty string.
let liftChecks=true;
try{ lift('_fpNoSuchFunctionAnywhere'); liftChecks=false; }catch(e){ liftChecks=/SEAM MOVED/.test(e.message); }
let liftVarChecks=true;
try{ liftVar('_FP_NO_SUCH_CONSTANT'); liftVarChecks=false; }catch(e){ liftVarChecks=/SEAM MOVED/.test(e.message); }

const src=[
  'var window=this; window.CLIENTS={};',
  liftVar('DAY_ROLLOVER_HR'), liftVar('FEED_DAYS_SHOWN'), liftVar('_CB_KINDS'),
  'var CLIENTS=window.CLIENTS;',
  lift('_feedHasTz'), lift('_feedTs'), lift('_feedDayStart'), lift('_feedTimeStr'),
  lift('_feedAgoStr'), lift('_feedItemMs'), lift('_parseClock'), lift('_hhmmAny'),
  lift('_mealTimeStr'), lift('_feedWhenStr'), lift('_citeDayMins'),
  lift('_feedWindowFloorK'), lift('_pfEsc'),
  lift('_tlDateStr'), lift('_cbWeekday'), lift('_cbTimeToMinutes'), lift('_cbExpand'),
  lift('_jvShareInitials'), lift('_jvShareName'),
  lift('_fpDayKey'), lift('_fpKindLabel'), lift('_fpBuildPlanMap'),
  lift('_fpPlannedFor'), lift('_fpWithPlanned'), lift('_fpPlanTag'),
  lift('_fpPlanTileHtml'),
  lift('_dayFoodTotals'),
  'module.exports={window,CLIENTS,_feedTs,_feedDayStart,_feedWindowFloorK,_citeDayMins,'
  +'_cbExpand,_cbTimeToMinutes,_tlDateStr,_fpDayKey,_fpKindLabel,_fpBuildPlanMap,'
  +'_fpPlannedFor,_fpWithPlanned,_fpPlanTag,_fpPlanTileHtml,_dayFoodTotals,_feedWhenStr};'
].join('\n');
const m={exports:{}};
new Function('module','exports',src)(m,m.exports);
const O=m.exports;

const C=[]; const t=(n,f)=>{ let ok=false,err=null; try{ ok=!!f(); }catch(e){ err=e.message; } C.push([n,ok,err]); };
t('the lift really looks (fake function reports missing)', ()=>liftChecks);
t('the var lift really looks (fake constant reports missing)', ()=>liftVarChecks);

// ---- the days, derived, never written down --------------------------------
const DAY=86400000;
const todayK=O._feedDayStart(Date.now()).getTime();
const floorK=O._feedWindowFloorK();
const dayBack=n=>{ const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-n); d.setHours(0,0,0,0); return d.getTime(); };
const dsBack =n=>O._tlDateStr(new Date(dayBack(n)));
const dsFwd  =n=>O._tlDateStr(new Date(dayBack(-n)));

// Ali's own two rows, shapes verbatim off live (active flipped — see the header).
const RUN ={id:17, owner_code:'alim1', kind:'training', title:'Run 4.99KM',
            start_local:'06:00:00', duration_minutes:60, days:[], date_str:dsBack(2), recurring:false};
const LEGS={id:18, owner_code:'alim1', kind:'training', title:'Legs',
            start_local:'19:00:00', duration_minutes:60, days:[], date_str:dsBack(2), recurring:false};
const cb=(blocks,ex)=>({blocks:blocks, exByBlock:(ex||{}), failed:false});

// ---- THE HAZARD IS REAL ----------------------------------------------------
// If a block DID carry a usable day, none of the expansion below would be needed.
t('a repeating block has no timestamp the feed could band it by', ()=>{
  const rep={id:99, owner_code:'alim1', kind:'walk', title:'Morning walk',
             start_local:'06:00:00', days:[1,3], date_str:null, recurring:true};
  return O._feedTs(rep)===0; });
t('a block carries a TIME, not an instant', ()=>O._cbTimeToMinutes(LEGS.start_local)===19*60);

// ---- DAY-OF ROUTING --------------------------------------------------------
O._fpBuildPlanMap(cb([RUN,LEGS]));
const two=O._fpPlannedFor('alim1', dayBack(2));
t('both of his one-offs land on the one day they name', ()=>two.length===2);
t('and nowhere else in the seven days', ()=>{
  let other=0;
  for(let i=0;i<7;i++){ if(dayBack(i)!==dayBack(2)) other+=O._fpPlannedFor('alim1', dayBack(i)).length; }
  return other===0; });
t('the titles are his, unaltered', ()=>two.map(p=>p.data.title).sort().join('|')==='Legs|Run 4.99KM');
t('each carries its own clock', ()=>{
  const by={}; two.forEach(p=>by[p.data.title]=p.ts-dayBack(2));
  return by['Run 4.99KM']===6*3600000 && by['Legs']===19*3600000; });
t('nobody else is given his plans', ()=>O._fpPlannedFor('chrism1', dayBack(2)).length===0);

// ---- NOTHING FROM THE FUTURE ----------------------------------------------
O._fpBuildPlanMap(cb([Object.assign({},LEGS,{date_str:dsFwd(1)})]));
t('tomorrow never lands on any day of the feed', ()=>{
  let n=0; for(let i=0;i<9;i++) n+=O._fpPlannedFor('alim1', dayBack(i)).length;
  return n===0 && Object.keys(O.window._pfPlanByKey).length===0; });
O._fpBuildPlanMap(cb([Object.assign({},LEGS,{date_str:dsFwd(6)})]));
t('a week ahead never lands either', ()=>Object.keys(O.window._pfPlanByKey).length===0);
// TODAY IS NOT THE FUTURE. The order's unit is the calendar day — a 7pm session
// on today's card at 4pm is today's, and holding it back would hide the one
// thing he opens today to see.
O._fpBuildPlanMap(cb([Object.assign({},LEGS,{date_str:O._tlDateStr(new Date(todayK))})]));
t('a later hour of TODAY still shows', ()=>O._fpPlannedFor('alim1', todayK).length===1);

// ---- THE WINDOW ------------------------------------------------------------
O._fpBuildPlanMap(cb([Object.assign({},RUN,{date_str:dsBack(20)})]));
t('older than the seven days shows nowhere', ()=>Object.keys(O.window._pfPlanByKey).length===0);
O._fpBuildPlanMap(cb([Object.assign({},RUN,{date_str:O._tlDateStr(new Date(floorK))})]));
t('the oldest day the feed draws still shows', ()=>O._fpPlannedFor('alim1', floorK).length===1);

// ---- A REPEAT --------------------------------------------------------------
const WALK={id:12, owner_code:'alim1', kind:'walk', title:'Morning walk',
            start_local:'06:00:00', duration_minutes:60, days:[], date_str:null, recurring:true};
const dowOf=k=>{ const d=new Date(k).getDay(); return d===0?7:d; };
const repDays=[dowOf(dayBack(1)), dowOf(dayBack(4))];
O._fpBuildPlanMap(cb([Object.assign({},WALK,{days:repDays})]));
t('a repeat lands on every matching weekday in the window and no other', ()=>{
  let hit=0, miss=0;
  for(let i=0;i<7;i++){
    const n=O._fpPlannedFor('alim1', dayBack(i)).length;
    if(repDays.indexOf(dowOf(dayBack(i)))>-1) hit+=n; else miss+=n;
  }
  return hit===repDays.length && miss===0; });
t('a repeat never runs past today', ()=>{
  const every=[1,2,3,4,5,6,7];
  O._fpBuildPlanMap(cb([Object.assign({},WALK,{days:every})]));
  const keys=Object.keys(O.window._pfPlanByKey).map(k=>+k.split('|')[1]);
  return keys.length===7 && Math.max.apply(null,keys)===todayK && Math.min.apply(null,keys)===floorK; });

// ---- THE EXCEPTION LAYER ---------------------------------------------------
// A cancelled occurrence drawn as planned is a lie about someone's day.
O._fpBuildPlanMap(cb([RUN], {17:{[dsBack(2)]:{block_id:17, date_str:dsBack(2), skip:true}}}));
t('a skipped occurrence never shows', ()=>O._fpPlannedFor('alim1', dayBack(2)).length===0);
O._fpBuildPlanMap(cb([RUN], {17:{[dsBack(2)]:{block_id:17, date_str:dsBack(2), start_local:'17:30:00'}}}));
t('a moved occurrence shows at the time it was moved to',
  ()=>O._fpPlannedFor('alim1', dayBack(2))[0].ts-dayBack(2)===17.5*3600000);
t('the done flag rides along for whoever wants it later', ()=>{
  O._fpBuildPlanMap(cb([RUN], {17:{[dsBack(2)]:{block_id:17, date_str:dsBack(2), done:true, note:'45 minutes'}}}));
  return O._fpPlannedFor('alim1', dayBack(2))[0].data.done===true; });

// ---- READS THAT FAILED -----------------------------------------------------
t('nothing read draws nothing, never an assertion of an empty week', ()=>{
  O._fpBuildPlanMap(null);      const a=Object.keys(O.window._pfPlanByKey).length;
  O._fpBuildPlanMap(cb([]));    const b=Object.keys(O.window._pfPlanByKey).length;
  return a===0 && b===0; });
t('a rebuild clears the last one — a deleted block cannot linger', ()=>{
  O._fpBuildPlanMap(cb([RUN]));
  const had=O._fpPlannedFor('alim1', dayBack(2)).length;
  O._fpBuildPlanMap(cb([]));
  return had===1 && O._fpPlannedFor('alim1', dayBack(2)).length===0; });

// ---- THE MERGE TOUCHES NOTHING IT WAS TOLD NOT TO --------------------------
const item=(kind,data)=>({kind:kind, data:data, ts:O._feedTs(data)});
const D=new Date(dayBack(2)); const iso=h=>{ const d=new Date(dayBack(2)+h*3600000); return d.toISOString(); };
const LOGGED=[
  item('food',{name:'Breakfast', meal:'Breakfast', eat_time:'9:14 AM', logged_at:iso(9),
               calories:430, protein:32, carbs:44, fat:12, date_str:dsBack(2)}),
  item('wo',  {title:'Pull', logged_at:iso(20), date_str:dsBack(2)}),
];
LOGGED.forEach((e,i)=>e._idx=i);
O._fpBuildPlanMap(cb([RUN,LEGS]));
const merged=O._fpWithPlanned(LOGGED,'alim1',dayBack(2),false);
t('the plans are drawn alongside what was logged', ()=>merged.length===LOGGED.length+2);
t('the caller’s own array is never mutated', ()=>LOGGED.length===2);
t('morning to night, plans in their own clock’s place', ()=>
  merged.map(e=>e.kind==='plan'?e.data.title:(e.data.title||e.data.name)).join(' > ')
  === 'Run 4.99KM > Breakfast > Legs > Pull');
t('no plan ever carries a feed index — so Share day cannot pick one up',
  ()=>merged.filter(e=>e.kind==='plan').every(e=>e._idx==null));
t('the day total is the same number with the plans as without',
  ()=>JSON.stringify(O._dayFoodTotals(merged))===JSON.stringify(O._dayFoodTotals(LOGGED)));
t('a day with nothing planned gets the very same array back, untouched',
  ()=>O._fpWithPlanned(LOGGED,'alim1',dayBack(5),false)===LOGGED);
t('a client with nothing planned gets the very same array back',
  ()=>O._fpWithPlanned(LOGGED,'chrism1',dayBack(2),false)===LOGGED);
// The phone hands this a run that is ALREADY newest-first, which is what its
// own band sorts to — so the fixture is reversed here rather than reusing the
// card's ascending list and calling the result "the phone".
const LOGGED_DESC=LOGGED.slice().reverse();
t('the phone reads the same day newest first', ()=>
  O._fpWithPlanned(LOGGED_DESC,'alim1',dayBack(2),true)
   .map(e=>e.kind==='plan'?e.data.title:(e.data.title||e.data.name)).join(' > ')
  === 'Pull > Legs > Breakfast > Run 4.99KM');
// THE ONE PROPERTY THAT MATTERS MORE THAN WHERE A PLAN LANDS. Ali's real Aug 26
// caught the first version of this doing exactly what this now forbids: a plan
// on the card swapped his 9:06pm meal and his 10pm walk on the PHONE, because
// the merge re-sorted everything on a key the phone's band does not use.
const relOrder=(a)=>a.filter(e=>e.kind!=='plan').map(e=>e.data.title||e.data.name).join('>');
t('no logged item EVER moves relative to another — ascending', ()=>
  relOrder(O._fpWithPlanned(LOGGED,'alim1',dayBack(2),false))===relOrder(LOGGED));
t('no logged item EVER moves relative to another — newest first', ()=>
  relOrder(O._fpWithPlanned(LOGGED_DESC,'alim1',dayBack(2),true))===relOrder(LOGGED_DESC));
t('not even when the caller’s list is not in clock order at all', ()=>{
  const jumbled=[LOGGED[1], LOGGED[0]];
  return relOrder(O._fpWithPlanned(jumbled,'alim1',dayBack(2),false))===relOrder(jumbled)
      && relOrder(O._fpWithPlanned(jumbled,'alim1',dayBack(2),true))===relOrder(jumbled); });
t('and every plan still comes back, wherever it landed', ()=>{
  const jumbled=[LOGGED[1], LOGGED[0]];
  return O._fpWithPlanned(jumbled,'alim1',dayBack(2),false).filter(e=>e.kind==='plan').length===2; });

// ---- THE MARKER ------------------------------------------------------------
const tag=O._fpPlanTag();
t('one word, and it is the word', ()=>/^<span class="pfPlanTag">Planned<\/span>$/.test(tag));
t('the marker is a word, not a glyph', ()=>/^[A-Za-z]+$/.test(tag.replace(/<[^>]*>/g,'')));
t('no emoji anywhere in it (house law)', ()=>!/[‼-㊙\uD83C-􏰀-\uDFFF☀-➿]/.test(tag));
t('the kind is named from the calendar’s own list, never invented', ()=>
  O._fpKindLabel('training')==='Training' && O._fpKindLabel('walk')==='Walk'
  && O._fpKindLabel('meal')==='Meal' && O._fpKindLabel('nonsense')===''
  && O._fpKindLabel(null)==='');

// ---- WHAT THE ROW SAYS ABOUT TIME -----------------------------------------
// A plan on today must never read as a distance: "10h ago" is a claim that it
// happened. _feedWhenStr's own isToday=false is what the row passes.
O._fpBuildPlanMap(cb([Object.assign({},RUN,{date_str:O._tlDateStr(new Date(todayK))})]));
const todayPlan=O._fpPlannedFor('alim1', todayK)[0];
t('a plan earlier today prints a clock, not a distance',
  ()=>!/ago|just now/.test(O._feedWhenStr(todayPlan,false)) && /\d/.test(O._feedWhenStr(todayPlan,false)));
t('and the unguarded call is what it would have said instead — the hazard is real',
  ()=>/ago|just now/.test(O._feedWhenStr(todayPlan)));

// ---- THE PHONE TILE --------------------------------------------------------
O.CLIENTS['alim1']={name:'Ali Mohammed', phone:'+15550000'};
O.window.CLIENTS=O.CLIENTS;
O._fpBuildPlanMap(cb([LEGS]));
const tile=O._fpPlanTileHtml(O._fpPlannedFor('alim1', dayBack(2))[0]);
t('the phone says the same one word', ()=>/class="pfPlanTag">Planned</.test(tile));
t('the phone names the same thing', ()=>/Legs/.test(tile));
t('the phone names the kind too', ()=>/Training/.test(tile));
t('the phone tile carries NO action doors at all',
  ()=>!/citeFeedItem|quickReact|jvUnlike|jvCatchUp|citeFeedDay|openClientDay/.test(tile));
t('the phone tile is marked out as a different class of thing', ()=>/fdPlanTile/.test(tile));
t('the client’s name goes through the one redaction door', ()=>{
  O.window._jvShareMode=true;
  O.window._jvShareBackup={alim1:{name:'Ali Mohammed'}};
  const red=O._fpPlanTileHtml(O._fpPlannedFor('alim1', dayBack(2))[0]);
  O.window._jvShareMode=false; O.window._jvShareBackup=null;
  return /Ali M\./.test(red) && !/Mohammed/.test(red); });

// ---- THE KEY ---------------------------------------------------------------
t('the band key is built from a local noon, so an hour cannot move a day', ()=>{
  const k=O._fpDayKey(dayBack(3)+3600000*23);
  return k===dayBack(3) && new Date(k).getHours()===0; });
t('a day start and any hour inside it key to the same band',
  ()=>O._fpDayKey(dayBack(1))===O._fpDayKey(dayBack(1)+3600000*13));

const bad=C.filter(c=>!c[1]);
C.forEach(c=>{ if(!c[1]) console.log('  FAIL  '+c[0]+(c[2]?('  ['+c[2]+']'):'')); });
if(bad.length){ console.log('tplan.cjs: '+bad.length+' of '+C.length+' FAILED'); process.exit(1); }
console.log('tplan.cjs: all '+C.length+' pass');
