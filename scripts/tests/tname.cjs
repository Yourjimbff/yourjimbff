// WHO A CONFIRMATION NAMES, ON CAMERA — permanent (24 Aug settled ruling:
// initials everywhere with sharing on).
//
// Every confirmation Jarvis holds behind a yes printed a real client's name
// straight out of the roster, and three also printed the raw client CODE —
// codes here are built from people's names, so a code is the surname again in
// another hat. The booking and consult lines carry the server's real name, so a
// full surname stood on screen with sharing ON while he films.
//
// Behavioural, not structural: the summary builder is lifted out and RUN, with
// sharing on and off, and its actual output inspected — the way this was found
// in the first place was by reading the lines, not the pattern.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={};
global.CLIENTS={ sarahj1:{name:'Sarah Johnson'} };
eval([
  grab(l=>l.startsWith('function _jvShareCode(')),
  grab(l=>l.startsWith('function _jvShareName(')),
  grab(l=>l.startsWith('function _jvSafeName(')),
  grab(l=>l.startsWith('function _jvPendWho(')),
  grab(l=>l.startsWith('function _jvPendWhoCode(')),
  grab(l=>l.startsWith('function _jvPendingSummary(')),
  grab(l=>l.startsWith('function _jvSpokenDateStr(')),
  grab(l=>l.startsWith('function _jvSpokenHhmm(')),
  grab(l=>l.startsWith('function _schDateStr(')),
].join('\n'));

// One of each confirmation this builder can produce, all about the same person.
const WHO={code:'sarahj1', name:'Sarah Johnson'};
const CASES=[
  ['jimlog',       Object.assign({kind:'jimlog', said:'chicken and rice'}, WHO)],
  ['workingon',    Object.assign({kind:'workingon', text:'her sleep'}, WHO)],
  ['removeclient', Object.assign({kind:'removeclient'}, WHO)],
  ['consult',      Object.assign({kind:'consult', when:'Tuesday at 9'}, WHO)],
  ['booking',      Object.assign({kind:'booking', when:'Tuesday at 9'}, WHO)],
  ['textprop',     Object.assign({kind:'textprop', body:'see you Tuesday'}, WHO)],
  ['deeper',       Object.assign({kind:'deeper', topic:'sleep'}, WHO)],
  ['vipmove',      Object.assign({kind:'vipmove', date:'2026-08-25', time:'09:00'}, WHO)],
  ['log',          Object.assign({kind:'log', parts:['breakfast'], dayTs:null}, WHO)],
];

console.log('  with sharing ON — no surname, no raw code, anywhere:');
window._jvShareMode=true;
CASES.forEach(([k,p])=>{
  let line=''; try{ line=_jvPendingSummary(p); }catch(e){ line='THREW: '+e.message; }
  const leaksSurname=/Johnson/.test(line);
  const leaksCode=/sarahj1/.test(line);
  const hasInitials=/Sarah J\./.test(line);
  t(!leaksSurname && !leaksCode && hasInitials, k.padEnd(13), JSON.stringify(line.slice(0,64)));
});

console.log('\n  with sharing OFF — every line reads as it always did:');
window._jvShareMode=false;
CASES.forEach(([k,p])=>{
  let line=''; try{ line=_jvPendingSummary(p); }catch(e){ line='THREW: '+e.message; }
  t(/Sarah Johnson/.test(line), k.padEnd(13)+' keeps the full name');
});
// The code still disambiguates off camera, on the three lines that carried it.
['workingon','removeclient','log'].forEach(k=>{
  const p=CASES.filter(c=>c[0]===k)[0][1];
  t(/sarahj1/.test(_jvPendingSummary(p)), k.padEnd(13)+' still shows the code off camera');
});

console.log('\n  one helper, not a second copy:');
t(/function _jvPendWho\(p\)\{[\s\S]{0,200}_jvSafeName\(/.test(src), 'the confirmations consume Feed’s helper');
t(!/_jvPendingSummary[\s\S]{0,2600}?\+p\.name\+/.test(src), 'no confirmation prints a raw roster name');
t(!/_jvPendingSummary[\s\S]{0,2600}?\+p\.code\+/.test(src), 'no confirmation prints a raw client code');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
