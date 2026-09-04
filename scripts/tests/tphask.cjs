// "IT SAVES IT NO WHERE USEFUL" (Yusuf, 4 Sep).
//
// "please pop up a message on their screen upon opening asking them to input
// their phone number. and then please actually save it where its supposed to be
// saved ... make it actually save where i can text them directly."
//
// THE CAUSE, named rather than apologised for: there was no client-side path
// into clients.phone AT ALL. clientPatch sits behind the is_trainer gate, so
// anything a client typed could only ever reach profiles - while the Text
// button, the share sheet, the roster and the board all read clients.phone. The
// number really was being saved. It was saved where nothing reads.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const door=fs.readFileSync('netlify/functions/trainer.js','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  the door now has a client-side way in, and it writes the right column:');
const set=door.slice(door.indexOf('async function handleMyPhoneSet('),
                     door.indexOf('async function handleCallNoteAdd('));
t(set.length>400,                                 'handleMyPhoneSet exists');
t(/rest\/v1\/clients\?code=eq\.\$\{enc\(myCode\)\}/.test(set),
                                                  'it PATCHes clients, the table the Text button reads');
t(/JSON\.stringify\(\{ phone: want \}\)/.test(set),'and only the phone column');
t(/if \(!myCode\) return json\(403/.test(set),     'no session, no write');
t(!/args\.client_code|args\.code/.test(set),       'the code comes from the SESSION, never from an argument');
t(/Prefer: 'return=representation'/.test(set),     'the row comes back');
t(/got\.replace\(\/\\D\/g, ''\) !== String\(want\)\.replace\(\/\\D\/g, ''\)/.test(set),
                                                  'and the digits are compared before it says saved');
t(/unconfirmed/.test(set),                        'a mismatch is reported, not answered ok');
t(/digits\.length < 10/.test(set),                'a half-typed number is refused');

console.log('\n  it is dispatched ABOVE the trainer gate, or a client could never call it:');
const gate=door.indexOf("if (claims.is_trainer !== true) {");
t(door.indexOf("op === 'myPhoneSet'")>0 && door.indexOf("op === 'myPhoneSet'")<gate,
                                                  'myPhoneSet is reachable by a client session');
t(door.indexOf("op === 'myPhoneHas'")>0 && door.indexOf("op === 'myPhoneHas'")<gate,
                                                  'and so is myPhoneHas');

console.log('\n  the card knows whether to ask, without any number leaving the door:');
const has=door.slice(door.indexOf('async function handleMyPhoneHas('),
                     door.indexOf('async function handleMyPhoneSet('));
t(/has_phone: !!/.test(has),                      'it answers one bit');
t(!/phone: p\b/.test(has),                        'and hands back no number');
t(/if \(!rows\.length\) return json\(200, \[\{ known: false/.test(has),
                                                  'a record it could not read is NOT reported as "no phone"');

console.log('\n  and the card only ever appears for the right person, once:');
const card=src.slice(src.indexOf('function _phAskCard(ds){'), src.indexOf('function _phAskSay('));
t(/_phAskState!==false/.test(card),               'unknown state draws nothing');
t(/ds!==td/.test(card),                           'today only');
const isC=src.slice(src.indexOf('function _phAskIsClient(){'), src.indexOf('async function _phAskLoad(){'));
t(/window\.VIEWAS/.test(isC),                     'never inside a read-only view');
t(/isTrainer\(cl\.code\)/.test(isC),              'and never on the trainer');

console.log('\n  a save that did not land says so and stays put:');
const save=src.slice(src.indexOf('async function phAskSave(){'), src.indexOf('async function phAskSave(){')+2600);
t(/if\(!landed\)/.test(save),                     'it checks the read-back');
t(/did not save/.test(save),                      'and says so plainly');
t(/CLIENTS\[cl\.code\]\.phone=landed/.test(save), 'a landed number goes into memory');
t(/yjb_phones/.test(save),                        'the cache the Text button hydrates from');
t(/yjb_self_client/.test(save),                   'and their own saved record');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
