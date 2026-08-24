// A NAME ON CAMERA — this lane's own renderings. Named tredact rather than tname
// so it cannot collide with another lane's tname.cjs, which holds Jarvis's
// confirmations to the same ruling. Lifts the ONE redaction helper out of
// index.html and holds it to both halves of that ruling, because it has failed
// on each half once:
//   SAFE    — no surname ever reaches the screen.
//   USEFUL  — the shortened name must actually DIFFER per client. "Female L." on
//             every woman leaked nothing and was still a live defect: he could
//             not tell his own clients apart while talking about them on camera.
// The trap it walks into: entering sharing mode REWRITES CLIENTS[code].name in
// place into the demographic line and parks the real name in _jvShareBackup. A
// helper that initials the LIVE field initials the demo line — first word
// "Female", last word "lbs". So the fixture below is armed exactly that way,
// with the demo line already in CLIENTS and the real name only in the backup.
// Fixture surnames are deliberately NOT of the form the redaction produces, or
// the output would contain them as substrings and the leak check would fire on
// its own answer.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function lift(name){
  const s=L.findIndex(l=>l.startsWith('function '+name+'(')||l.startsWith('async function '+name+'('));
  if(s<0) throw new Error('SEAM MOVED: function '+name+' not found');
  let e=s+1; while(e<L.length && L[e]!=='}') e++;
  if(e>=L.length) throw new Error('SEAM MOVED: no close found for '+name);
  return L.slice(s,e+1).join('\n');
}
// THE CONTROL ON THE LIFT ITSELF. If a name that cannot exist does not report
// missing, the lift is not really looking and every pass below is theatre.
let liftChecks=true;
try{ lift('_jvShareNameThatCannotExist'); liftChecks=false; }catch(e){ liftChecks=/SEAM MOVED/.test(e.message); }

const g={CLIENTS:{}, window:{}};
g.window._jvShareMode=false;
const src=[lift('_jvShareHash'),lift('_jvShareCode'),lift('_jvShareInitials'),lift('_jvShareName'),lift('_jvSafeName'),
  'module.exports={_jvShareName:_jvShareName,_jvSafeName:_jvSafeName,_jvShareCode:_jvShareCode,_jvShareInitials:_jvShareInitials};'].join('\n');
const m={exports:{}};
new Function('module','exports','window','CLIENTS',src)(m,m.exports,g.window,g.CLIENTS);
const {_jvShareName,_jvSafeName,_jvShareCode,_jvShareInitials}=m.exports;

const REAL={c1:'Carly Longworth', c2:'Adriana Picarella', c3:'Marcus Thorneycroft', c4:'Priya Raghunathan'};
const DEMOF='Female · 31 yo · 5\'4 · 162.8 lbs';
const DEMOM='Male · 34 yo · 5\'11 · 185 lbs';
function sharingOff(){ g.window._jvShareMode=false; g.window._jvShareBackup=null;
  Object.keys(REAL).forEach(c=>{ g.CLIENTS[c]={name:REAL[c]}; }); }
function sharingOn(demo){ // exactly what the app's own switch leaves behind
  sharingOff(); const backup={};
  Object.keys(REAL).forEach(c=>{ backup[c]={name:REAL[c]};
    g.CLIENTS[c].name = demo===undefined ? (c==='c3'?DEMOM:DEMOF) : demo; });
  g.window._jvShareBackup=backup; g.window._jvShareMode=true; }

const C=[]; const t=(n,f)=>{ let ok=false,err=null; try{ ok=!!f(); }catch(e){ err=e.message; } C.push([n,ok,err]); };

t('the lift really looks (fake name reports missing)', ()=>liftChecks);
t('CONTROL — sharing off returns the full name', ()=>{ sharingOff(); return _jvSafeName('c1')==='Carly Longworth'; });
t('CONTROL — the fixture surname is really there', ()=>{ sharingOff(); return _jvSafeName('c1').includes('Longworth'); });
t('sharing on gives first name + last initial', ()=>{ sharingOn(); return _jvShareName('c1')==='Carly L.'; });
// The live defect, exactly as it happened: the demo line is sitting in CLIENTS.
t('NEVER "Female L." — the demo line is not a name', ()=>{ sharingOn(); return _jvShareName('c1')!=='Female L.'; });
t('...nor "Male L." for the men',        ()=>{ sharingOn(); return _jvShareName('c3')==='Marcus T.'; });
t('every client differs from every other',()=>{ sharingOn();
  const v=Object.keys(REAL).map(c=>_jvShareName(c)); return new Set(v).size===4; });
t('the two women differ from each other', ()=>{ sharingOn(); return _jvShareName('c1')!==_jvShareName('c2'); });
t('no surname survives',                  ()=>{ sharingOn();
  return Object.keys(REAL).every(c=>!_jvShareName(c).includes(REAL[c].split(' ')[1])); });
// The other direction the ruling came at us from: a demo line that degrades to
// one sentence puts the SAME words in every row.
t('a degraded demo line still yields distinct names', ()=>{ sharingOn('No details on file');
  const v=Object.keys(REAL).map(c=>_jvShareName(c)); return new Set(v).size===4 && v[0]==='Carly L.'; });
t('_jvSafeName agrees with _jvShareName when armed', ()=>{ sharingOn(); return _jvSafeName('c1')===_jvShareName('c1'); });
t('no backup falls to a share code, never the raw code', ()=>{ sharingOn(); g.window._jvShareBackup={};
  const out=_jvShareName('carlyl'); return out===_jvShareCode('carlyl') && out!=='carlyl' && !/carly/i.test(out); });
t('no backup never falls back to the demo line', ()=>{ sharingOn(); g.window._jvShareBackup={};
  g.CLIENTS.c1={name:DEMOF}; const out=_jvShareName('c1'); return !/Female|lbs/.test(out); });
// Named and accepted, not a bug: one word has no surname to hide and shows
// exactly as much as "Chris M." does.
t('a single-word name comes back whole', ()=>{ sharingOn(); g.window._jvShareBackup={c9:{name:'Madonna'}};
  return _jvShareName('c9')==='Madonna'; });
t('sharing off again returns the full name', ()=>{ sharingOff(); return _jvSafeName('c2')==='Adriana Picarella'; });

// THE ROSTER FIELD ITSELF. jvSetShareMode rewrites CLIENTS[].name in place, and
// it has to do that BEFORE the flag is armed — so the rule it applies there must
// not consult the flag. Asking _jvShareName from inside that loop returned the
// live name and the rewrite did nothing at all: the field that is meant to be
// the safety net under sharing kept every client's real name. Caught on the
// merged file by re-rendering after a merge, which is the only reason it is here.
t('the initials rule ignores the flag entirely', ()=>{
  g.window._jvShareMode=false; const off=_jvShareInitials('Carly Longworth');
  g.window._jvShareMode=true;  const on =_jvShareInitials('Carly Longworth');
  return off==='Carly L.' && on==='Carly L.'; });
t('...and it never invents a name from nothing', ()=>_jvShareInitials('')==='' && _jvShareInitials(null)==='');
t('...one word stays one word',      ()=>_jvShareInitials('Madonna')==='Madonna');
t('_jvShareName applies the SAME rule', ()=>{ sharingOn(); return _jvShareName('c1')===_jvShareInitials(REAL.c1); });
t('the switch redacts with the flag-free rule, not the flag-gated one', ()=>{
  const body=lift('jvSetShareMode');
  const live=body.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
  const rewrite=/info\.name\s*=\s*([^;]+);/.exec(live);
  return /_jvShareInitials/.test(live) && !/info\.name\s*=\s*_jvShareName\(/.test(live)
      && !/info\.name\s*=\s*_jvShareDemoLine\(/.test(live) && !!rewrite; });

// THE SURFACES. Source-level, because these three renderers need half the cockpit
// to run: what matters is that each ASKS the helper rather than reading the
// rewritten field. Reading CLIENTS[code].name for display is the defect itself.
function body(name){ return lift(name); }
[['_covShellHtml','the day sheet header'],['_covMoreHtml','the "Talk to Jarvis about ..." button'],['_covNotesHtml','the "Shared. X can read..." line'],
 ['_fwCardHtml','the week grid card'],['_fwRenderInto','the week grid silent banner'],['_fwDayPopHtml','the week grid day popover']]
  .forEach(([fn,what])=>{
    t(what+' asks _jvSafeName', ()=>body(fn).includes('_jvSafeName('));
    t(what+' no longer displays the rewritten field', ()=>{
      const src=body(fn).split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
      return !/_escHtml\(\s*info\.name/.test(src) && !/_escHtml\(String\(\(CLIENTS\[code\]/.test(src)
          && !/name\|\|code\)\.split\(' '\)\[0\]/.test(src);
    });
    // ONE REDACTION LANGUAGE (Yusuf, ruling): the demographic line is retired as
    // a redaction, so no surface of this lane's may still reach for it.
    t(what+' does not speak the demographic line', ()=>{
      const src=body(fn).split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
      return !/_jvShareDemoLine\(/.test(src);
    });
  });

let bad=0;
C.forEach(([n,ok,err])=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+n+(err?'  ['+err+']':'')); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
