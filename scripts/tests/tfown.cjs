// THE FEED'S OWNERSHIP MARK. Lifts _feedPaint/_feedOwns out of index.html and
// asks the only two questions that matter:
//   · a REPAINT of the feed must be recognised as the feed's own  (or every
//     repaint flashes "Loading…" — the bug the old guard existed to cure)
//   · ARRIVING from another cockpit mode must NOT be              (or the
//     previous screen stays painted for the whole read burst, which is what
//     held the calendar on screen while the nav already said Feed)
// Both directions, because passing one and failing the other is a live defect
// either way round.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');

function lift(name){
  const s=L.findIndex(l=>l.startsWith('function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name+' not found in index.html');
  // to the next line that is exactly "}" — these are multi-line declarations at
  // column 0. Brace-matching over this file over-deletes on its one-liners.
  let e=s+1; while(e<L.length && L[e]!=='}') e++;
  if(e>=L.length) throw new Error('SEAM MOVED: no close found for '+name);
  return L.slice(s,e+1).join('\n');
}

// A holder honest enough to fail: innerHTML really replaces the child, and the
// child's class list really starts empty, so a stamp that is never written
// cannot pass by accident.
function makeHolder(){
  const h={_child:null};
  Object.defineProperty(h,'innerHTML',{
    get(){ return h._child?('<'+h._child.tag+' class="'+h._child.cls.join(' ')+'">'):''; },
    set(v){ const m=/^\s*<([a-z][a-z0-9]*)/i.exec(String(v));
      h._child = m ? {tag:m[1], cls:[], classList:null} : null;
      if(h._child){ const c=h._child;
        c.classList={ add:x=>{ if(c.cls.indexOf(x)<0) c.cls.push(x); },
                      contains:x=>c.cls.indexOf(x)>=0 }; } }
  });
  Object.defineProperty(h,'firstElementChild',{ get(){ return h._child; } });
  h.innerHTML='';
  return h;
}

const src = lift('_feedPaint')+'\n'+lift('_feedOwns')+'\nmodule.exports={_feedPaint:_feedPaint,_feedOwns:_feedOwns};';
const m={exports:{}};
new Function('module','exports',src)(m,m.exports);
const {_feedPaint,_feedOwns}=m.exports;

const C=[];
function t(name, fn){ let ok=false, err=null; try{ ok=!!fn(); }catch(e){ err=e.message; } C.push([name,ok,err]); }

t('an untouched holder is not the feed\'s', ()=>{ const h=makeHolder(); return _feedOwns(h)===false; });
t('what the feed paints, the feed owns',   ()=>{ const h=makeHolder(); _feedPaint(h,'<div class="jvFeedCtrl">feed</div>'); return _feedOwns(h)===true; });
t('a repaint stays owned (no flash)',      ()=>{ const h=makeHolder(); _feedPaint(h,'<div>a</div>'); _feedPaint(h,'<div>b</div>'); return _feedOwns(h)===true; });
t('another mode\'s markup is NOT owned',   ()=>{ const h=makeHolder(); _feedPaint(h,'<div>feed</div>');
                                                 h.innerHTML='<div class="wkWrap">the calendar</div>';   // arrival
                                                 return _feedOwns(h)===false; });
t('back from that arrival, owned again',   ()=>{ const h=makeHolder(); h.innerHTML='<div class="wkWrap">cal</div>';
                                                 _feedPaint(h,'<div>feed</div>'); return _feedOwns(h)===true; });
t('boot markup is NOT owned',              ()=>{ const h=makeHolder(); h.innerHTML='<div class="jvLoading">Loading clients…</div>';
                                                 return _feedOwns(h)===false; });
t('a null holder answers false, no throw', ()=>_feedOwns(null)===false);
t('_feedPaint(null) does not throw',       ()=>{ _feedPaint(null,'<div>x</div>'); return true; });
t('empty html leaves it unowned',          ()=>{ const h=makeHolder(); _feedPaint(h,''); return _feedOwns(h)===false; });
// The control: a stamp the code never writes must NOT read as present, or none
// of the above is testing anything.
t('CONTROL — an unwritten mark reads absent',()=>{ const h=makeHolder(); _feedPaint(h,'<div>feed</div>');
                                                 return h.firstElementChild.classList.contains('notAMarkAnyoneWrites')===false; });

// THREE STATES, IN THE LOADER ITSELF (standing law). sbSelect answers [] for a
// refusal and for a genuinely quiet week alike, and every read in the feed's
// burst is .catch(-> []), so a whole failed burst arrives looking exactly like
// an empty one. Painting that wipes the feed and replaces it with a sentence
// saying nobody logged anything — a claim about his clients, made off a network
// error. Asserted on the source because the loader needs the whole cockpit to
// run; the behaviour itself is proven in the browser.
const RUN=(function(){
  const s=L.findIndex(l=>l.startsWith('async function _loadTrainerFeedRun('));
  if(s<0) throw new Error('SEAM MOVED: _loadTrainerFeedRun not found');
  let d=0,st=false;
  for(let i=s;i<L.length;i++){ for(const c of L[i]){ if(c==='{'){d++;st=true;} else if(c==='}'){d--;} } if(st&&d===0) return L.slice(s,i+1).join('\n'); }
  throw new Error('SEAM MOVED: no close for _loadTrainerFeedRun');
})();
t('the loader asks whether the reads FAILED before painting an empty feed',
  ()=>/!items\.length\s*&&\s*_sbFailedSince\(/.test(RUN));
t('...and only keeps the screen when what is on it is really ours',
  ()=>/_hadFeed\s*=\s*_feedOwns\(holder\)/.test(RUN));
t('...and a first mount still says it could not read',
  ()=>/Could not load the feed/.test(RUN));
t('a failed REFRESH says so rather than going silent',
  ()=>/Could not refresh/.test(RUN));

let bad=0;
C.forEach(([n,ok,err])=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+n+(err?'  ['+err+']':'')); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
