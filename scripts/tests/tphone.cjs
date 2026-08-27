// A NAME AND A NUMBER IN ONE SENTENCE SAVES (Yusuf, live, 27 Aug).
//
// He said: "Can you add this phone number to Carly Long? 530-210-7123."
// He was answered "Say that again with their name and I will save it", then
// "What is the number?" — the app asking back for both things it had just been
// given. That is the refusal pattern this whole build exists to kill.
//
// Neither the capability nor the digit parser was at fault. _jtPhoneTurn saves
// with a read-back, and _jtPhoneDigits finds 530-210-7123 in that sentence
// first time. THE SPLITTER cut it: _JT_TERM is /[.!?;\n]+/ and his question
// mark sits exactly between the name and the number, so it became two items —
// one with the name and no digits, one with digits and no name — and each half
// asked for what the other half had. A polite question mark broke it.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){ const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function varAt(n){ const a=L.findIndex(l=>l.indexOf('var '+n+'=')===0); if(a<0) return '';
  let b=a; while(b<L.length && !/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
// _JT_PHONE_RE is an OBJECT with a method, so the first line ending in ';' is a
// statement INSIDE it. Scanning to that truncates the declaration mid-function
// and the suite dies on a syntax error instead of measuring anything.
function objAt(n){ const a=L.findIndex(l=>l.indexOf('var '+n+'=')===0); if(a<0) return '';
  let b=a; while(b<L.length && !/^\}\};\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={};
global.CLIENTS={carlyl1:{name:'Carly Long'}, carlym1:{name:'Carly Mendes'}, samv1:{name:'Samantha Vale'}};
global._jvFindClientIn=function(s){
  var hits=Object.keys(CLIENTS).filter(function(c){
    return new RegExp('\\b'+CLIENTS[c].name.replace(/\s+/g,'\\s+')+'\\b','i').test(String(s||''));
  });
  return {hits:hits};
};
eval([varAt('_JT_TERM'), fnAt('_jtPhoneDigits'), fnAt('_jtWholeOf'), objAt('_JT_PHONE_RE')].join('\n'));
guard(['_JT_TERM','_jtPhoneDigits','_jtWholeOf','_JT_PHONE_RE'], n=>eval(n));

const SAID='Can you add this phone number to Carly Long? 530-210-7123.';
// what the splitter does to it, using the real terminator
const halves=SAID.split(_JT_TERM).map(x=>x.trim()).filter(Boolean);

console.log('\n  THE SPLIT IS REAL — his sentence really does become two pieces:');
t(halves.length===2, 'the question mark cuts it in two', JSON.stringify(halves));
t(_jtPhoneDigits(halves[0])==='', 'the first piece has the name and NO number');
t(_jtPhoneDigits(halves[1])==='530-210-7123', 'the second has the number and no name');

console.log('\n  BUT THE NUMBER WAS ALWAYS THERE IN THE SENTENCE:');
t(_jtPhoneDigits(SAID)==='530-210-7123', 'the digit parser reads it straight out of the whole sentence');

console.log('\n  AND EACH FRAGMENT NOW SEES THE SENTENCE IT CAME FROM:');
window._jtWholeMsg=SAID;
t(_jtWholeOf(halves[0])===SAID, 'the name half resolves to the whole sentence');
t(_jtWholeOf(halves[1])===SAID, 'and so does the number half');
t(_JT_PHONE_RE.test(halves[0])===true, 'so the name half routes to the phone command');
t(_JT_PHONE_RE.test(halves[1])===true, 'and so does the number half');
t(_jtPhoneDigits(_jtWholeOf(halves[0]))==='530-210-7123', 'and the name half can now see the number');
t(_jvFindClientIn(_jtWholeOf(halves[1])).hits.length===1, 'and the number half can now see exactly one name');

console.log('\n  A LATER TURN IS NEVER JUDGED AGAINST AN OLDER MESSAGE:');
window._jtWholeMsg=null;
t(_jtWholeOf('530-210-7123')==='530-210-7123', 'with nothing set, a fragment is only itself');
window._jtWholeMsg='something else entirely';
t(_jtWholeOf('530-210-7123')==='530-210-7123', 'and a fragment that did not come from it is left alone');

console.log('\n  EXACT-NAME DISCIPLINE, AS EVERYWHERE:');
window._jtWholeMsg='add a number for Carly 530-210-7123';
t(_jvFindClientIn('add a number for Carly 530-210-7123').hits.length===0,
  'a partial name matches nobody, so it asks rather than guessing between two Carlys');
window._jtWholeMsg='Carly Long 530-210-7123';
t(_jvFindClientIn('Carly Long 530-210-7123').hits.length===1, 'an exact full name resolves to one client');
window._jtWholeMsg=null;

console.log('\n  THE SHAPES HE MIGHT SAY IT IN ALL CARRY THE NUMBER:');
[ 'Can you add this phone number to Carly Long? 530-210-7123.',
  'add this phone number to Carly Long 530-210-7123',
  'save 530-210-7123 to Carly Long',
  'Carly Long 530-210-7123',
  'add 530 210 7123 to Carly Long',
  'her number is 5302107123'
].forEach(function(s){ t(_jtPhoneDigits(s)!=='', 'reads the number out of: '+JSON.stringify(s), _jtPhoneDigits(s)); });

console.log('\n  AND THE CAPABILITY IT ROUTES TO IS THE REAL ONE:');
// _jtPhoneTurn is async, so its line starts "async function".
function asyncAt(n){ const a=L.findIndex(l=>l.indexOf('async function '+n+'(')===0); if(a<0) return '';
  let b=a; while(b<L.length && L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
const turn=asyncAt('_jtPhoneTurn');
t(!!turn, 'the phone command still exists');
t(/trainerWrite\('clientPatch',\{code:code, phone:num\}\)/.test(turn), 'it saves through the door that has always taken a phone');
t(/String\(w\.rows\[0\]\.phone\|\|''\)\.replace\(\/\\D\/g,''\)===num\.replace\(\/\\D\/g,''\)/.test(turn),
  'and it reads the digits back off the row the server wrote');
t(/didn.t read back correctly/.test(turn), 'and says so plainly when they do not match');

console.log('\n  ONE SENTENCE SAVES ONCE AND SAYS SO ONCE:');
// Both halves can now see the whole sentence, so both resolve the same client
// and the same digits. Without a guard his one request confirms twice, which is
// the app looking like it did not understand him — the whole complaint.
t(/window\._jtPhoneDone\[_pk\]\) return null;/.test(turn), 'a second half that resolves the same save is dropped');
t(/var _pk=code\+':'\+String\(num\)\.replace/.test(turn), 'keyed on the client AND the digits, so a real second number still goes through');
t(/window\._jtPhoneDone=\{\};/.test(src), 'the per-turn record is opened where the whole message is');
t(/window\._jtWholeMsg=null; window\._jtPhoneDone=null;/.test(src), 'and cleared with it, so it can never leak into a later turn');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
