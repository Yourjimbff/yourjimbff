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
// ===== ONE CODE PATH FOR STORING A NUMBER (Yusuf, 2 Sep - Scott, day two) =====
// Four paths could store a client's number and they stored it in different
// places: the card wrote localStorage + profiles + clients, the new-client
// dialog wrote clients ONCE and unchecked, the voice add wrote clients with a
// read-back, and this turn wrote clients with a read-back and nothing else. So
// a number typed in the dialog missed the local cache that quietly rescues the
// card path, and Scott's number was gone by the next morning.
// _phoneStore is the one door now. These assertions moved onto it; every
// guarantee they made is still made, of the one place that makes it.
const door1=asyncAt('_phoneStore');
t(!!door1, 'there is one door for storing a number');
t(/trainerWrite\('clientPatch', \{code:code, phone:\(want\|\|null\)\}\)/.test(door1),
  'it saves through the door that has always taken a phone');
t(/String\(row\.phone==null\?'':row\.phone\)/.test(door1) && /got\.replace\(\/\\D\/g,''\)===want\.replace\(\/\\D\/g,''\)/.test(door1),
  'and it reads the digits back off the row the server wrote');
t(/CLIENTS\[code\]\.phone=stored/.test(door1), 'sets it where the Text button reads it');
t(/localStorage\.setItem\('yjb_phones'/.test(door1), 'and into the local cache the card path always had');
t(/sbUpsert\('profiles'/.test(door1), 'and profiles, so all three places move together');
t(/return \{ok:false, phone:want, why:why\}/.test(door1), 'a failure comes back with its reason, never as a shrug');
// and every caller goes through it, so the four cannot drift apart again
const phoneWriters=(src.match(/trainerWrite\((?:'|\")clientPatch(?:'|\"),?\s*\{[^}]*phone:/g)||[]);
t(phoneWriters.length===1, 'and it is the ONLY place a phone is patched', phoneWriters.length+' found');
t(/_phoneStore\(code, num\)/.test(turn), 'the Jarvis turn goes through it');
t(/if\(!_r\.ok\) return \{ok:false/.test(turn) && /_r\.why/.test(turn),
  'and says so plainly, carrying the door\'s own reason, when they do not match');

console.log('\n  ONE SENTENCE SAVES ONCE AND SAYS SO ONCE:');
// Both halves can now see the whole sentence, so both resolve the same client
// and the same digits. Without a guard his one request confirms twice, which is
// the app looking like it did not understand him — the whole complaint.
// ===== AND IT IS CONSUMED, NOT DROPPED (his ruling, 27 Aug) ============
// This returned null for one hour. null in that ladder means NOT HANDLED, so
// the deduped half carried on down and the model answered his one sentence a
// second time, in a different voice. He got a correct confirmation followed by
// a stranger introducing itself. A handled instruction is consumed.
t(/window\._jtPhoneDone\[_pk\]\) return \{ok:true, line:''\};/.test(turn),
  'the deduped half ENDS the item instead of falling through to the model');
t(!/_jtPhoneDone\[_pk\]\) return null/.test(turn), 'it no longer returns null, which meant not-handled');
// The ladder consumes any truthy result, and an empty line is filtered out of
// both the screen and the spoken answer — so this is silent, not blank.
t(/if\(_pn\) return \{status:\(_pn\.wait\?'wait':\(_pn\.ok\?'done':'lost'\)\)/.test(src),
  'and the ladder consumes anything truthy it hands back');
t(/\.map\(function\(x\)\{ return x\.line; \}\)\.filter\(Boolean\)/.test(src),
  'an empty line renders nothing on screen');
t(/\.filter\(Boolean\)\.join\(' '\)/.test(src), 'and says nothing out loud');
t(/var _pk=code\+':'\+String\(num\)\.replace/.test(turn), 'keyed on the client AND the digits, so a real second number still goes through');
t(/window\._jtPhoneDone=\{\};/.test(src), 'the per-turn record is opened where the whole message is');
t(/window\._jtWholeMsg=null; window\._jtPhoneDone=null;/.test(src), 'and cleared with it, so it can never leak into a later turn');

// ===== A NUMBER GIVEN AT ADD TIME (Benjamin Plimpton, 27 Aug) ==========
// He added a client by voice WITH his number and the next day the share
// feature said no number was on file.
//
// clientInsert TAKES NO PHONE. There is no phone key in its body in
// trainer.js, so every add path has to follow the insert with a clientPatch.
// The form did that and checked the answer. The voice path did it and threw
// the answer away: no read-back, CLIENTS[code].phone never set, and a spoken
// confirmation that listed the code, the tier and the term and said nothing
// about the number either way. A number that saved and a number that did not
// produced the identical sentence — the cardinal lie in its quietest form, an
// ABSENT claim over a field he had just dictated.
console.log('\n  THE DOOR ITSELF — an insert cannot carry a number:');
const door=fs.readFileSync('netlify/functions/trainer.js','utf8');
const ins=door.slice(door.indexOf('clientInsert:'), door.indexOf('clientDelete:'));
t(ins.length>100, 'clientInsert is findable in the door');
t(!/\bphone\b/.test(ins), 'and it has no phone field at all, so a follow-up patch is mandatory');
t(/if \(a\.phone !== undefined\) body\.phone = nullableStr\(a\.phone, 40\);/.test(door),
  'clientPatch is the one op that does take it');
t(/roster: \(\) => 'clients\?select=code,name,initials,phone/.test(door),
  'and the roster read hands phone back, so the write and the read share one field');

console.log('\n  EVERY ADD PATH VERIFIES THE NUMBER IT WAS GIVEN:');
// The voice path, which is the one that ran for Benjamin.
const va=src.slice(src.indexOf('async function _jvJarvisAddClient('), src.indexOf('async function _jtNewClientTurn('));
t(va.length>500, 'the voice add path is findable');
t(/_phoneStore\(code, _phSaid\)/.test(va), 'it patches the number it was given, through the one door');
t(/if\(_pr\.ok\) _phLanded=_pr\.phone;/.test(va), 'and looks at the answer instead of discarding it');
t(/CLIENTS\[code\]\.phone=_phLanded/.test(va), 'sets it where the share sheet and the Text button read it');
t(/number saved/.test(va), 'the spoken line says so when it landed');
t(/I could not save that number/.test(va), 'and says so plainly when it did not');
t(va.indexOf('I could not save that number')>va.indexOf('_pwRow'), 'the failure line is decided by the read-back, not guessed');

// The form path, which was already correct — asserted so it stays that way.
const fa=src.slice(src.indexOf('async function addClientToDb('), src.indexOf('async function addClientToDb(')+9000);
t(/_phoneStore\(code, _phInput\)/.test(fa), 'the form patches its number too, through the same door');
t(/_phRes && _phRes\.ok/.test(fa), 'and only claims it on a good answer');
t(/NUMBER DID NOT SAVE/.test(fa), 'and tells him when it did not');
// ===== AND IT TELLS HIM IN THE TOAST HE IS ALREADY READING ==============
// The failure used to arrive as a SECOND toast 1.8 seconds later, underneath
// the success tick, which is why "it looked like it saved".
t(fa.indexOf('_phoneStore(code, _phInput)') < fa.indexOf("showToast('\\u2713 '"),
  'the number is verified BEFORE the tick, not after it');
t(!/}, 1800\)/.test(fa), 'and there is no 1.8-second afterthought toast left');
t(/_phWord/.test(fa), 'the one toast carries the number\'s fate');
// ===== AND SURVIVES THE ROSTER RELOAD ===================================
// loadRosterFromDB refills CLIENTS wholesale, one line after the number was
// set. That is what erased it in memory with nothing left to see.
t(fa.indexOf('_phoneReapply(code, _phRes.phone)') > fa.indexOf('await loadRosterFromDB()'),
  'and it is put back AFTER the roster reload that used to wipe it');

// The quick-add path CANNOT carry one, and must not pretend to.
console.log('\n  and the bare quick-add cannot silently swallow a number:');
const qa=varAt('_JV_ADD_CLIENT_RE');
t(qa.length>50, 'the quick-add recogniser is findable');
eval(qa);
t(_JV_ADD_CLIENT_RE.test('add a new client Benjamin Plimpton')===true, 'it claims a bare two-word add');
[['add a new client Benjamin Plimpton his number is 919-555-0100'],
 ['add a new client Benjamin Plimpton, 919-555-0100'],
 ['create a new client called Benjamin Plimpton phone 919-555-0100']
].forEach(([x])=>t(_JV_ADD_CLIENT_RE.test(x)===false,
  'and refuses one carrying a number, so it falls to the path that can save it'));

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
