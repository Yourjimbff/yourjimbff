// How a date SOUNDS. Today = Monday 24 Aug 2026.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
const REAL=Date;
class FD extends REAL{ constructor(...a){ if(!a.length) super(2026,7,24,9,0,0); else super(...a);} static now(){return new REAL(2026,7,24,9,0,0).getTime();} }
global.Date=FD;
eval([grab(l=>l.startsWith('function _jvSpokenDay(')), grab(l=>l.startsWith('function _jvSpokenDateStr(')), grab(l=>l.startsWith('function _jvSpokenOn('))].join('\n'));
const ds=(y,m,d)=>new REAL(y,m,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const C=[
  [ds(2026,7,24),'today'],
  [ds(2026,7,25),'tomorrow'],           // the exact date he heard read as "Aug 25, 2026"
  [ds(2026,7,23),'yesterday'],
  [ds(2026,7,27),'Thursday'],
  [ds(2026,7,31),'next Monday'],
  [ds(2026,8,15),'Tuesday, September 15th'],
  ['2026-08-25','tomorrow'],            // ISO still works
  ['',''],
];
let bad=0;
C.forEach(function(c){ const g=_jvSpokenDateStr(c[0]); const ok=(g===c[1]); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(c[0]).padEnd(18)+'-> '+JSON.stringify(g)+(ok?'':'  (wanted '+JSON.stringify(c[1])+')')); });
console.log('\n  and "on" only where English wants it:');
[[ds(2026,7,23),'yesterday'],[ds(2026,7,24),'today'],[ds(2026,7,25),'tomorrow'],
 [ds(2026,7,27),'on Thursday'],[ds(2026,8,15),'on Tuesday, September 15th']].forEach(function(c){
  const g=_jvSpokenOn(c[0]); const ok=(g===c[1]); if(!ok) bad++;
  console.log('   '+(ok?'ok    ':'FAIL  ')+JSON.stringify(c[0]).padEnd(18)+'-> '+JSON.stringify(g)+(ok?'':'  (wanted '+JSON.stringify(c[1])+')'));
});
console.log('\n  a voice must never be handed a symbol:');
const src=fs.readFileSync('index.html','utf8');
const calLines=src.split('\n').filter(l=>/ok:true, line:/.test(l) && /_cbSpokenTime|Moved |Marked /.test(l));
calLines.forEach(function(l){ const sym=/[✓✅]/.test(l); if(sym) bad++;
  console.log('   '+(sym?'FAIL  ':'ok    ')+l.trim().slice(0,72)+'…'); });
console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
