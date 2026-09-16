// THE AGREEMENT, AND THE DOOR OUT.
//
// Yusuf, 15 Sep: "have everyone whos signed in sign a privacy agreement or
// whatever you call it upon their next sign in which they need to acknowledge
// ... as well as notify them that they have the ability to delete all their
// user data and information (for them only, obviously) in a place they can
// easily find it under their user settings at the bottom."
//
// WHAT THIS FILE IS GUARDING, and why each one is worth a line:
//
//  * A GATE THAT CAN BE TAPPED PAST IS NOT A GATE. No close control, no back,
//    no tap-outside, and the button is disabled until the box is ticked.
//  * A GATE THAT CAN LOCK SOMEBODY OUT IS WORSE THAN NO GATE. A failed read
//    lets them through; a failed WRITE lets them through AND never asks again,
//    because the tap was the agreement and our save failing is not their
//    problem. Both are asserted, because both are the kind of thing a later
//    tidy-up deletes for looking redundant.
//  * IT MUST NOT FIRE WHILE A COACH IS VIEWING AS SOMEBODY ELSE. The person
//    holding the phone is not the person whose row would get signed.
//  * ERASE TAKES ITS CODE FROM THE TOKEN. "For them only, obviously" is not a
//    UI promise - it is the fact that there is no parameter to tamper with.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };
const has=(re)=>re.test(src);
const cut=(start,len)=>{ const i=src.indexOf(start); return i<0?'':src.slice(i,i+len); };
// BETWEEN TWO ANCHORS, not a guessed character count. The first draft of this
// file cut _legalPaint at 3400 characters, overshot into legalAccept, found its
// legalClose() and reported that the agreement screen had a way out of it.
const between=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); return (i<0||j<0||j<i)?'':src.slice(i,j); };

console.log('\n  THE DOCUMENTS EXIST AND SAY THE THINGS THEY HAVE TO SAY:');
t(has(/var LEGAL_VERSION='/), 'there is a version, so a rewrite can re-ask');
t(has(/var _LEGAL_DOCS=\{/), 'and the two documents live in the page');
t(/privacy:\{title:'Privacy Policy'/.test(src), '  a Privacy Policy');
t(/terms:\{title:'Terms of Use'/.test(src), '  and Terms of Use');
const docs=between('var _LEGAL_DOCS={','function _legalDocHtml(key){');
t(/Nothing in this app is medical advice, diagnosis or treatment/.test(docs), 'the medical disclaimer is in the Terms');
t(/Yusuf is a coach, not a doctor/.test(docs), '  under a heading nobody can miss');
t(/call 911/.test(docs), '  and it says what to do in an emergency');
t(/Anthropic/.test(docs), 'the AI processor is NAMED');
t(/Supabase/.test(docs) && /Netlify/.test(docs) && /Stripe/.test(docs),
  '  so are the database, the host and the payments');
t(/USDA/.test(docs) && /Apple Health/.test(docs), '  and the two that see the least');
t(/never sold/i.test(docs) && /advertising/i.test(docs), 'it says the data is never sold or advertised against');
t(/health information/i.test(docs), 'it calls health data what it is');
t(/under 13/.test(docs), 'and it has a children line');
t(/estimates/.test(docs), 'the Terms admit the calorie numbers are estimates');

console.log('\n  THE GATE CANNOT BE TAPPED PAST:');
const paint=between('function _legalPaint(){','async function legalAccept(){');
t(paint.length>0, '_legalPaint exists');
const gateHalf=paint.slice(paint.indexOf('Before you carry on')-400);
t(!/legalClose\(\)/.test(gateHalf), 'the agreement screen has no close control');
t(/id="lgGoBtn" disabled/.test(paint), 'the button starts disabled');
t(/onclick="legalTick\(\)"/.test(paint), 'and only the tick row can enable it');
const acc=between('async function legalAccept(){','/* ---- SETTINGS, AT THE BOTTOM');
t(/if\(!window\._lgOk\) return;/.test(acc), 'legalAccept refuses to run untickled');
const tick=between('function legalTick(){','function _legalPaint(){');
t(/b\.disabled = !window\._lgOk/.test(tick), 'the tick drives the button both ways');

console.log('\n  IT CAN NEVER LOCK SOMEBODY OUT:');
const gate=between('async function legalGate(){','function _legalHost(){');
t(/if\(window\.VIEWAS\) return;/.test(gate), 'it stands down while a coach is viewing as someone');
t(/if\(!got \|\| !got\.ok\) return;/.test(gate), 'a failed read lets them through rather than blocking');
t(/if\(_legalLocalOk\(code\)\)\{ try\{ await _legalRecord\(code\); \}catch\(e\)\{\} return; \}/.test(gate),
  'somebody who already agreed is never asked twice — the write is retried instead');
t(acc.indexOf('_legalMark(code);') < acc.indexOf('_legalRecord(code)'),
  'the tap is marked BEFORE the save, so a failed save cannot re-ask');
t(/legalClose\(\);/.test(acc), 'and the overlay comes down either way');

console.log('\n  IT IS RECORDED SOMEWHERE REAL:');
const rec=between('async function _legalRecord(code){','async function legalGate(){');
t(/_yfProfile\(code, true\)/.test(rec), 'it reads the row fresh first');
t(/j\.legal=\{v:LEGAL_VERSION, at:new Date\(\)\.toISOString\(\)\}/.test(rec), 'it records the version and the moment');
t(/_yfSave\(code, \{intake_json:j\}\)/.test(rec), 'into profiles.intake_json — a column that already exists');
t(/_PROF_NEVER_CACHED=\['birthday','phone','intake_json'\]/.test(src),
  'and intake_json is still never written to this device');

console.log('\n  THE GATE RUNS ON EVERY WAY IN:');
const launch=between('async function launchApp(){','async function _launchAppInner(){');
t(/legalGate\(\)/.test(launch), 'launchApp fires it');
t(/setTimeout\(function\(\)\{ try\{ legalGate\(\); \}catch\(e\)\{\} \}, 600\)/.test(launch),
  '  un-awaited, so a slow read never holds the app up');
t((src.match(/\blaunchApp\(\);/g)||[]).length===3,
  'and all three ways in still funnel through launchApp');
t(/\.lgOv\{[^}]*z-index:100001/.test(src) && /\.obOv\{[^}]*z-index:100000/.test(src),
  'the agreement paints ABOVE the setup flow, so it is answered first');

console.log('\n  THE DELETE IS WHERE HE ASKED FOR IT:');
t(/try\{ html\+=_gpSecPrivacy\(\); \}catch\(e\)\{\}/.test(src), 'the card is in Settings');
const asm=cut('try{ html+=_gpSecFood(); }catch(e){}', 700);
t(asm.lastIndexOf('_gpSecPrivacy()') > asm.lastIndexOf('_gpSecAccount()'),
  '  and it is the LAST card on the page — "at the bottom"');
const card=between('function _gpSecPrivacy(){','function legalDeleteOpen(){');
t(/Delete my account and all my data/.test(card), 'it says exactly what it does');
t(/cannot be undone/.test(card), '  and that it cannot be undone');
t(/only ever touches your own data/.test(card), '  and that it is theirs alone');
t(/legalRead\(\\'privacy\\'\)/.test(card) && /legalRead\(\\'terms\\'\)/.test(card),
  'both documents are readable from Settings too');

console.log('\n  AND IT IS A DELIBERATE, TYPED ACT:');
const del=between('async function legalDeleteGo(){','function legalGoodbye(){');
t(/if\(typed!=='DELETE'\)/.test(del), 'it refuses until DELETE is typed');
t(/JSON\.stringify\(\{confirm:'DELETE'\}\)/.test(del), 'and the function is told so as well');
t(/'Authorization':'Bearer '\+tok/.test(del), 'it sends the signed session');
t(/await sessEnsure\(window\.cl && cl\.code\)/.test(del), '  minting one first if the device has none');
t(/if\(!tok\)\{/.test(del), 'and stops honestly when there is no session rather than guessing');
t(/Nothing was deleted/.test(del), 'a refusal says nothing was deleted');
t(del.indexOf('_wipePersonal()') > del.indexOf("if(!ok){"),
  'the device is only wiped AFTER the server confirms');

console.log('\n  THE SERVER IS THE ONE THAT DECIDES WHOSE DATA IT IS:');
const er=fs.readFileSync('netlify/functions/erase.js','utf8');
t(/const code = String\(claims\.client_code \|\| ''\)\.trim\(\);/.test(er),
  'erase.js takes the code from the SIGNED token');
t(!/body\.client_code|body\.code/.test(er), '  and never from the request body');
t(/if \(!claims\) return json\(401/.test(er), 'no session, no erase');
t(/confirm \|\| ''\)\.trim\(\)\.toUpperCase\(\) !== 'DELETE'/.test(er), 'the typed word is checked server-side too');
t(/SUPABASE_SERVICE_KEY/.test(er), 'it holds the service key, which the page never sees');
t(!/service/i.test(del),
  '  and no part of the delete UI goes near one');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (they agree once, and they can leave whenever they want)');
process.exit(bad?1:0);
