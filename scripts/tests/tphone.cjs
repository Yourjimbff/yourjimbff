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
// Same 2 Sep ruling as the add paths: this turn used to write, read back and
// assign CLIENTS by hand, and never touched localStorage or profiles - so a
// number saved by ASKING Jarvis was stored in fewer places than the same number
// typed on the card. It is on _phoneStore now, which is why the old greps for
// its inline shape were reporting a fault that had been deliberately removed.
t(/_phoneStore\(code, num\)/.test(turn),   'it saves through the one door, same as every add path');
t(/_phoneNorm\(num\)\|\|num/.test(turn),  'in the stored shape, so what is dialled is what got saved');
t(/_r\.ok/.test(turn),                     'and it decides what to say off that answer');

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
// REWRITTEN 4 Sep, and the nine failures it had been reporting for a week were
// all this file's own. Yusuf: "make the phone numbers actually save to the phone
// numbers this time." They already did. What was broken was the measurement.
//
// The assertions below used to demand the INLINE shape - a literal
// trainerWrite('clientPatch', ...) plus its own read-back plus its own
// localStorage write, spelled out in each add path. His 2 Sep ruling was "one
// code path for storing a number, not two", and _phoneStore is that path: it
// patches, reads the digits back off the row the door returns, sets CLIENTS,
// writes the yjb_phones cache and upserts profiles. Both add paths were moved
// onto it and this file was not, so it went on grepping for code that had been
// deliberately deleted and calling its absence a fault.
//
// A suite that cries wolf on phone numbers is worse than no suite at all: it is
// exactly where a real phone fault would have hidden. So these now assert the
// shared path, which is stronger - one place to break, and every caller covered.
// VERIFIED LIVE, not just by grep: _phoneStore('zzscratchnotaclient', ...) on
// the served file wrote the number, and the door, CLIENTS and the yjb_phones
// cache all read it back identical.
const ps=src.slice(src.indexOf('async function _phoneStore('),
                   src.indexOf('function _phoneReapply('));
console.log('  the one door every add path stores through:');
t(ps.length>400,                                       '_phoneStore is findable');
t(/trainerWrite\('clientPatch',\s*\{code:code,\s*phone:/.test(ps),
                                                       'it patches through the op that takes a phone');
t(/w\.rows\[0\]/.test(ps),                            'it reads the row the door wrote back');
t(/got\.replace\(\/\\D\/g,''\)===want\.replace\(\/\\D\/g,''\)/.test(ps),
                                                       'compared on digits, so 919-555-0100 and 9195550100 match');
t(/CLIENTS\[code\]\.phone=stored/.test(ps),           'sets it where the share sheet and the Text button read it');
t(/localStorage\.setItem\('yjb_phones'/.test(ps),      'and into the cache those two hydrate from');
t(/sbUpsert\('profiles'/.test(ps),                     'and onto the profile row as well');
t(/return \{ok:false/.test(ps) && /why/.test(ps),      'a write that did not land says so, with a reason');

// The voice path, which is the one that ran for Benjamin Plimpton.
const va=src.slice(src.indexOf('async function _jvJarvisAddClient('), src.indexOf('async function _jtNewClientTurn('));
console.log('\n  the voice add path:');
t(va.length>500,                                       'it is findable');
t(/_phoneStore\(code, _phSaid\)/.test(va),             'it stores the number it was given through that one door');
t(/if\(_pr\.ok\) _phLanded=_pr\.phone;/.test(va),      'and looks at the answer instead of discarding it');
t(/if\(_phLanded\) CLIENTS\[code\]\.phone=_phLanded/.test(va),
                                                       're-applied after the roster reload, which refills CLIENTS wholesale');
t(/number saved/.test(va),                             'the spoken line says so when it landed');
t(/I could not save that number/.test(va),             'and says so plainly when it did not');
t(va.indexOf('I could not save that number')>va.indexOf('_phoneStore'),
                                                       'the failure line is decided by the store, not guessed');

// The form path.
const fa=src.slice(src.indexOf('async function addClientToDb('), src.indexOf('async function addClientToDb(')+9000);
console.log('\n  the form add path:');
t(/_phRes=await _phoneStore\(code, _phInput\)/.test(fa), 'it stores through the same door');
t(/_phInput/.test(fa) && /acPhone/.test(fa),             'off the field value read BEFORE the dialog closes');
t(/_phRes && _phRes\.ok/.test(fa),                       'and only claims the number on a good answer');
t(/number saved/.test(fa),                               'the toast says so when it landed');
t(/_phoneReapply\(code, _phRes\.phone\)/.test(fa),      'and it survives the roster reload too');

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
