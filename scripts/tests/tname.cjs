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

// ===== THE DEMOGRAPHIC LINE IS RETIRED ==================================
// Switching sharing ON overwrites the roster's own name field. It used to write
// "Female · 23 · 5'2 · 115.8 lbs" there — which every downstream name reader
// then took as the person's NAME, so the initials helper reduced it to a first
// word and a last initial and produced "Female L." for everyone. Initials are
// written instead, computed while the real name is still standing.
console.log('\n  sharing mode writes initials into the roster, not a body:');
t(/info\.name=_jvShareName\(code, info\.name\)/.test(src), 'the switch writes initials');
t(!/info\.name=_jvShareDemoLine\(/.test(src), 'and never the demographic line');
window._jvShareMode=true;   // the helper only redacts on camera; ask it there
t(_jvShareName('sarahj1','Sarah Johnson')==='Sarah J.', 'the helper gives initials');
t(_jvShareName('sarahj1','Sarah J.')==='Sarah J.', 'and is stable if applied twice');

// ===== A NAME INSIDE A TYPED TITLE ======================================
// A typed title is his own words and stays — but a client's NAME inside one is
// still a name being rendered. The scrubber read the roster's name field, which
// the switch above had already overwritten, so it hunted for the redacted
// string and the real name walked onto the screen.
eval(grab(l=>l.startsWith('function _wkShareTitle(')));
console.log('\n  a real name inside a typed title is scrubbed on camera:');
window._jvShareMode=true;
window._jvShareBackup={ sarahj1:{name:'Sarah Johnson'} };
global.CLIENTS={ sarahj1:{name:'Sarah J.'} };   // the roster as the switch leaves it
t(!/Johnson/.test(_wkShareTitle('Session — Sarah Johnson')), 'the surname goes',
  JSON.stringify(_wkShareTitle('Session — Sarah Johnson')));
t(!/Sarah/.test(_wkShareTitle('Session — Sarah Johnson')), 'and the first name too');
t(/Session/.test(_wkShareTitle('Session — Sarah Johnson')), 'his own word is kept');
t(_wkShareTitle('Dentist')==='Dentist', 'a title naming nobody is untouched');
window._jvShareMode=false;
t(_wkShareTitle('Session — Sarah Johnson')==='Session — Sarah Johnson', 'off camera, untouched');
t(/_jvShareBackup && Object\.keys\(window\._jvShareBackup\)\.length/.test(src),
  'the scrubber searches the real names, not the redacted ones');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
