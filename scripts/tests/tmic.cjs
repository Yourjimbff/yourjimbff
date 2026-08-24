// THE MIC LAW, APP-WIDE — permanent, by his ruling (24 Aug, the strip, ship 3).
//
// "Any action that tells the app to act — submit, Organize, closing or leaving
// anything — ends listening that instant."
//
// This suite exists because the invariant was SILENTLY FALSE. The one stopper
// carried a comment saying every mic in the file was represented in it. Five
// were not, and four of those five restart themselves on the browser's end
// event — so even reaching in and aborting them would have started them back
// up while looking like it worked. Nothing on screen says a mic is still live,
// so only a test can hold this.
//
// Structural on purpose: a recogniser is added by writing `x = new SR()`, and
// this fails the moment one is added without being covered.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ---- what the one stopper covers ---------------------------------------
const stopFn=(src.match(/function _micStopAll\(flush\)\{[\s\S]*?\n\}/)||[''])[0];
t(!!stopFn, 'the one stopper is findable');
const ownerList=(stopFn.match(/\[((?:'[A-Za-z_][A-Za-z0-9_]*',?)+)\]\.forEach\(function\(fn\)/)||['',''])[1];
const abortList=(stopFn.match(/\[((?:'[A-Za-z_][A-Za-z0-9_]*',?\s*)+)\]\.forEach\(function\(k\)/)||['',''])[1];
const owners=(ownerList.match(/'([A-Za-z_][A-Za-z0-9_]*)'/g)||[]).map(s=>s.slice(1,-1));
const aborts=(abortList.match(/'([A-Za-z_][A-Za-z0-9_]*)'/g)||[]).map(s=>s.slice(1,-1));
t(owners.length>0, 'it calls the surfaces that own their own stop', owners.length+' of them');
t(aborts.length>0, 'it aborts the rest by name', aborts.length+' of them');

// ---- every recogniser in the file must be covered ------------------------
// Each mic is built as `name = new SR()`. Two surfaces delegate to a mic that
// is already covered and build none of their own, so they never appear here.
const built=[...new Set((src.match(/\b([_A-Za-z][A-Za-z0-9_]*)\s*=\s*new SR\(\)/g)||[])
  .map(m=>m.replace(/\s*=\s*new SR\(\)/,'').trim()))];
t(built.length>=15, 'every mic in the file is found', built.length+' recognisers');
console.log('\n  every mic is stopped by something:');
built.forEach(v=>{
  const aborted=aborts.includes(v);
  // Otherwise its own stop must null it, and that stop must be in the list.
  // A fixed window, not a brace match: several of these stops are one-liners,
  // and the shortest brace match stops inside their own `if(){}` — which is the
  // over-delete landmine this repo already knows about, wearing a test's face.
  const ownedBy=owners.filter(fn=>{
    const at=src.search(new RegExp('function '+fn+'\\('));
    return at>=0 && src.slice(at, at+700).includes(v+'=null');
  });
  t(aborted||ownedBy.length>0, (aborted?'aborted   ':'own stop  ')+v, ownedBy[0]||'');
});

// ---- a self-restarting mic may NEVER be merely aborted -------------------
// `onend` calling start() again is what makes abort() a lie. Any recogniser
// written that way has to be stopped by its owner, never by the abort sweep.
console.log('\n  a mic that restarts itself is never merely aborted:');
built.forEach(v=>{
  const restarts=new RegExp('if\\('+'[_A-Za-z0-9]*'+'\\)\\{\\s*try\\{\\s*'+v+'\\.start\\(\\)').test(src)
    || new RegExp(v+'\\.onend=function\\(\\)\\{\\s*if\\([_A-Za-z0-9]+\\)\\{\\s*try\\{\\s*'+v+'\\.start').test(src);
  if(!restarts) return;
  t(!aborts.includes(v), 'restarts itself, so owner-stopped: '+v);
});

// ---- every action that tells the app to act ends listening ---------------
// Submit, save, Organize, and the one funnel every sheet dismissal goes through.
const ACTS=['slogSend','jConvoSend','jPageSave','sendChatMessage','jimSend','jvChatSend',
            'cevSave','wkPanelSave','_mwPanelSave','organizeWorkout','closeM'];
console.log('\n  every act ends listening:');
ACTS.forEach(fn=>{
  const at=src.search(new RegExp('(async )?function '+fn+'\\('));
  if(at<0){ t(false, 'missing entirely: '+fn); return; }
  t(src.slice(at, at+1400).includes('_micStopAll'), fn);
});

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
