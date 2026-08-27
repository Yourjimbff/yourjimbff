// THE OUTREACH TRACKER. Lifts the real per-day marking logic out of index.html
// and holds it to the four things the ruling actually asked for:
//   the denominator is CLIENTS WHO LOGGED that day - not the in-term roster,
//   not the cards on screen, and never him;
//   a mark is per client AND per day, so yesterday's outreach is not today's;
//   an older day is NOT today, because marking one must never clear somebody
//   off today's triage board;
//   and the line says a count, nothing else.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
// BRACE-COUNTED, not "scan to the next lone }". Half the helpers in this file
// are ONE-LINERS, and scanning forward for a bare } walks straight past them and
// swallows whatever follows — the same over-reach that makes deleting a function
// here dangerous. Counting from the declaration stops in the right place for
// both shapes. Strings and comments are not parsed; nothing lifted here contains
// an unbalanced brace inside one, and the control below would catch it if it did.
function lift(name){
  const s=L.findIndex(l=>l.startsWith('function '+name+'(')||l.startsWith('async function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name+' not found');
  let depth=0, started=false;
  for(let i=s;i<L.length;i++){
    for(const ch of L[i]){ if(ch==='{'){ depth++; started=true; } else if(ch==='}'){ depth--; } }
    if(started && depth===0) return L.slice(s,i+1).join('\n');
  }
  throw new Error('SEAM MOVED: no close found for '+name);
}
// THE CONTROL ON THE LIFT. A name that cannot exist must report missing, or the
// lift is not really looking and every pass below is theatre.
let liftChecks=true;
try{ lift('_obNameThatCannotExist'); liftChecks=false; }catch(e){ liftChecks=/SEAM MOVED/.test(e.message); }

// A localStorage honest enough to fail: real round-trip through strings.
const store={};
const localStorage={ getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v);}, removeItem:k=>{delete store[k];} };
const CLIENTS={ c1:{name:'Carly Longworth'}, c2:{name:'Adriana Picarella'},
                c3:{name:'Marcus Thorneycroft'}, thegoat:{name:'Coach', isTrainer:true} };
// THE REAL CONSTANT, LIFTED — never a convenient 0. It is 3, and that is the
// whole reason _obIsToday cannot re-normalise a band key: midnight is below the
// rollover hour, so a day start fed back through _feedDayStart comes out a day
// earlier. Stubbing 0 here made the first version of this suite pass over a live
// bug, which is exactly what a fixture that does not match reality buys you.
const DAY_ROLLOVER_HR=(function(){
  const m=/var DAY_ROLLOVER_HR *= *(\d+)/.exec(L.join('\n'));
  if(!m) throw new Error('SEAM MOVED: DAY_ROLLOVER_HR not found');
  return +m[1];
})();
const src=[
  lift('_jvDayKey'), lift('_feedDayStart'),
  lift('_obKeyStr'), lift('_obDateStr'), lift('_obKey'), lift('_obMap'), lift('_obSave'),
  lift('_obTouchStr'), lift('_obTouch'), lift('obReached'), lift('_obIsToday'),
  lift('_obSafeCode'), lift('_obCodesFor'), lift('_obLineText'),
  'module.exports={_obTouch,obReached,_obIsToday,_obCodesFor,_obLineText,_obDateStr,_obSafeCode,_obMap,_feedDayStart};'
].join('\n');
const m={exports:{}};
new Function('module','exports','localStorage','CLIENTS','DAY_ROLLOVER_HR',src)(m,m.exports,localStorage,CLIENTS,DAY_ROLLOVER_HR);
const O=m.exports;

const DAY=86400000;
// NO CLOCK OF ITS OWN. A band key is whatever _feedDayStart says it is, and
// between midnight and the rollover hour that is NOT calendar-midnight-today.
// A suite that computes its own midnight passes all day and fails at 1am — this
// file has been bitten by exactly that before.
const TODAY=O._feedDayStart(Date.now()).getTime();
const dayTs=back=>TODAY-back*DAY;
const YEST=dayTs(1);
const it=(code,kind)=>({code:code, kind:kind||'food', data:{}});

const C=[]; const t=(n,f)=>{ let ok=false,err=null; try{ ok=!!f(); }catch(e){ err=e.message; } C.push([n,ok,err]); };

t('the lift really looks (fake name reports missing)', ()=>liftChecks);

// --- the denominator ---------------------------------------------------------
t('counts each client who logged, once', ()=>{
  const codes=O._obCodesFor([it('c1'),it('c1','wo'),it('c2'),it('c3')],{});
  return codes.length===3; });
t('a client hidden from the feed is not counted', ()=>
  O._obCodesFor([it('c1'),it('c2')],{c2:true}).length===1);
t('HIS OWN rows never count - he is not someone he reaches out to', ()=>
  O._obCodesFor([it('c1'),it('thegoat')],{}).length===1);
t('a moment is not a log', ()=>O._obCodesFor([it('c1'),{code:'c2',kind:'moment',data:{}}],{}).length===1);
t('nothing logged is a count of zero, not a crash', ()=>O._obCodesFor([],{}).length===0);
t('a row with no code cannot be counted', ()=>O._obCodesFor([{kind:'food',data:{}}],{}).length===0);

// --- the line ----------------------------------------------------------------
t('the line reads "Reached out to 0 of 3" before anything', ()=>
  O._obLineText(YEST,['c1','c2','c3'])==='Reached out to 0 of 3');
t('and counts up as he goes', ()=>{
  O._obTouch('c1',YEST,true); O._obTouch('c3',YEST,true);
  return O._obLineText(YEST,['c1','c2','c3'])==='Reached out to 2 of 3'; });
t('the line states a count and grades nobody', ()=>
  !/[%!]|good|great|behind|missed/i.test(O._obLineText(YEST,['c1','c2','c3'])));

// --- per client AND per day --------------------------------------------------
t('a mark is per client', ()=>O.obReached('c1',YEST) && !O.obReached('c2',YEST));
t('a mark is per DAY - yesterday is not today', ()=>O.obReached('c1',YEST) && !O.obReached('c1',TODAY));
t('unmarking removes it', ()=>{ O._obTouch('c1',YEST,false); return !O.obReached('c1',YEST); });
t('unmarking one leaves the others', ()=>O.obReached('c3',YEST));
t('marks survive a reload (they are in the store, not in memory)', ()=>{
  const raw=localStorage.getItem('yjb_jv_handled_days');
  return typeof raw==='string' && raw.indexOf('c3')>=0; });

// --- the boundary that protects the triage board -----------------------------
t('the rollover hour is the real one, not a convenient zero', ()=>DAY_ROLLOVER_HR===3);
t('today IS today', ()=>O._obIsToday(TODAY)===true);
// THE REGRESSION ITSELF. A band key is a day START, and midnight sits below the
// rollover hour — so putting it back through _feedDayStart lands on YESTERDAY.
// First prove the hazard is real, then prove _obIsToday does not fall into it.
t('re-normalising a band key really does lose a day', ()=>
  O._feedDayStart(TODAY).getTime() !== TODAY);
t('...and _obIsToday does not do that', ()=>O._obIsToday(TODAY)===true);
t('YESTERDAY IS NOT TODAY - marking it must never clear the board', ()=>O._obIsToday(YEST)===false);
t('a week back is not today either', ()=>O._obIsToday(dayTs(7))===false);

// --- the key shape has to match what the server stores -----------------------
t('the day key is the date_str the trainer door writes', ()=>
  O._obDateStr(YEST)===new Date(YEST).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}));
t('two different days give two different keys', ()=>O._obDateStr(YEST)!==O._obDateStr(TODAY));

// --- codes reach an onclick, so they are constrained -------------------------
t('a code is stripped to a code', ()=>O._obSafeCode("c1');alert(1)//")==='c1alert1');
t('a legitimate code is untouched', ()=>O._obSafeCode('carly_m-1')==='carly_m-1');

let bad=0;
C.forEach(([n,ok,err])=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+n+(err?'  ['+err+']':'')); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
