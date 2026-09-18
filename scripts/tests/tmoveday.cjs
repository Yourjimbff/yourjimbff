// MOVING A SESSION TO THE DAY IT WAS ACTUALLY TRAINED.
//
// Two faults, both live for eight days, both found off Kelly Griffith-Fields'
// own words on 15 Sep: "I said it was working to switch the days and now it's
// not and Jim's gaslighting me... I can go do it because I know the program
// but can't track it correctly".
//
// 1. _tlChangeControl - the Day card's own control - early-returned on
//    window._tlSwapPillsOn, a flag read in exactly one place and set in none.
//    Covered by tcreative.cjs.
// 2. Jim's menu was _tlLegalSwapTargets, which walks FORWARD ONLY from today
//    and filters by the collision law. So a session that sat BEHIND today
//    could never be taken, and the refusal quoted a neighbour clash that
//    often was not there. That is the gaslighting. Covered here.
//
// The 31 Aug ruling: a client may move a planned session to the day they
// actually trained, themselves, on any day. tlDoSwap has had no legality gate
// since then; the menu now matches the write.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }

const m={exports:{}};
new Function('module','exports',[
  "var WEEKDAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];",
  lift('_tlSameSplit'), lift('_tlLegalSwapTargets'), lift('_tlMoveTargets'),
  'module.exports={_tlMoveTargets,_tlLegalSwapTargets};'
].join('\n'))(m,m.exports);
const {_tlMoveTargets,_tlLegalSwapTargets}=m.exports;

// Kelly's own template, read off training_plans id 374 on 18 Sep.
const KELLY={Mon:{type:'Lower'},Tue:{type:'Rest'},Wed:{type:'Push'},
             Thu:{type:'Rest'},Fri:{type:'Glutes'},Sat:{type:'Pull'},Sun:{type:'Rest'}};
const keys=l=>l.map(x=>x.key);

// --- the shape of the new list ---------------------------------------------
const thu=_tlMoveTargets(KELLY,'Thu');
t(thu.length===6, 'every other day of the week is offered, never a filtered subset');
t(!keys(thu).includes('Thu'), 'today itself is not in its own list');
t(keys(thu).join()==='Mon,Tue,Wed,Fri,Sat,Sun', 'and they come back in week order');

// --- the hole that produced the gaslighting --------------------------------
t(keys(thu).includes('Wed') && keys(thu).includes('Mon'),
  'a day EARLIER in the week can be taken - the whole of what Kelly asked for');
t(!keys(_tlLegalSwapTargets(KELLY,'Thu')).includes('Wed'),
  'the old forward-only list could not, which is why this one exists');
t(thu.find(x=>x.key==='Wed').type==='Push',
  'and each option carries what that day currently holds, so the pill can say so');

// --- the collision law is not consulted here --------------------------------
const BACKTOBACK={Mon:{type:'Push'},Tue:{type:'Push'},Wed:{type:'Push'},
                  Thu:{type:'Push'},Fri:{type:'Push'},Sat:{type:'Push'},Sun:{type:'Push'}};
t(_tlMoveTargets(BACKTOBACK,'Wed').length===6,
  'a week of identical days still offers all six (the plan is a plan, 31 Aug)');
t(_tlLegalSwapTargets(BACKTOBACK,'Wed').length===0,
  'where the old list offered nothing at all and Jim had to refuse');

// --- guards ------------------------------------------------------------------
t(_tlMoveTargets(null,'Thu').length===0 && _tlMoveTargets(KELLY,null).length===0,
  'no plan or no day gives an empty list, never a throw');
t(_tlMoveTargets(KELLY,'Funday').length===0, 'a weekday that is not one is empty too');
t(_tlMoveTargets({Mon:{type:'Lower'}},'Mon').every(x=>x.type==='Rest'),
  'a day the plan does not mention reads as Rest, not undefined');

// --- both of Jim's seams actually use it -------------------------------------
t(/var _swLegal=_tlMoveTargets\(_swEff, _swKey\);/.test(src),
  "Jim's context is built from the whole week");
t(/var _swLegal2=\(_swEff2 && _swKey2 && typeof _tlMoveTargets==='function'\)/.test(src),
  'and so is the check that validates the marker before it writes');
t(!/_tlLegalSwapTargets\(_swEff/.test(src) && !/_tlLegalSwapTargets\(_swEff2/.test(src),
  'neither seam reaches for the forward-only list any more');

// --- and it no longer tells the model to invent a reason ----------------------
t(/NEVER invent a reason a day is unavailable/.test(src),
  'the prompt forbids inventing a reason a day is unavailable');
t(/A day EARLIER in the week is exactly as movable as a later one/.test(src),
  'and says plainly that a past day is movable');
t(!/anything else would repeat yesterday.s or tomorrow.s focus/.test(src),
  'the old line that made Jim quote a clash that was not there is gone');

// --- duplicate type names resolve to the nearest day --------------------------
t(/var _swI0=WEEKDAYS\.indexOf\(_swKey2\);/.test(src) && /da-db/.test(src),
  'a type sitting on two days resolves to the one nearest today, not the first in the week');

// tlDoSwap must still be the thing that writes, and still ungated
t(/NO LEGALITY GATE \(Yusuf, 31 Aug\)/.test(src), 'tlDoSwap keeps its 31 Aug note and its open door');

console.log(bad?('\n'+bad+' FAILED'):'\n  all day-move assertions pass');
process.exit(bad?1:0);
