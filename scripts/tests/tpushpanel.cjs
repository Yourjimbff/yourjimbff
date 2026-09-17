// THE NOTIFICATIONS PANEL — the screen that turned "it doesn't work" into a
// sentence you can read.
//
// The push door shipped in two halves that could not see each other. The phone
// registered itself in silence, and the send lived in a Netlify function that
// nothing on any screen could call. When his handset got no notification there
// was no way to ask the app anything: not whether Apple had handed over a
// token, not what Apple said when a send was tried. An hour went into theories
// about an absence, and an absence has too many causes.
//
// So the two facts that decide whether a send can work at all are put on a
// screen, and the send is put behind a button. Wrong answers are printed whole:
// "502 BadDeviceToken" is the sentence that says the build on the phone and
// APNS_ENV disagree, and no friendlier wording carries it.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) throw new Error('stale start anchor: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor: '+b); return src.slice(i,j); }

console.log('\n  THERE IS A DOOR, AND ONLY HE HAS THE KEY:');
const row=slice('id="acctPushRow"','id="acctSettingsRow"');
t(/onclick="closeM\('mAccount'\);[\s\S]{0,80}?openPushPanel\(\)/.test(row),
  'the account sheet has a Notifications row that opens the panel');
t(/style="display:none;"/.test(row), 'drawn hidden, so nobody sees it before the gate runs');
const gate=slice("var pshr=document.getElementById('acctPushRow');", '\n    var v=');
t(/isTrainer\(cl\.code\)\) \? '' : 'none'/.test(gate),
  'and the gate that reveals it is the trainer test, not a guess about the surface');
/* push-send answers 403 to anyone whose session is not the trainer's: a client
   who could call it could put a notification on a stranger's lock screen. A row
   that opens a panel whose only button always fails is worse than no row. */
const fn=fs.readFileSync('netlify/functions/push-send.js','utf8');
t(/claims\.is_trainer !== true\) return json\(403/.test(fn),
  '  which is the same answer the server itself gives');

console.log('\n  THE PANEL SAYS WHICH HALF IS MISSING:');
const html=slice('function _pushPanelHtml(){','function _pushPanelPaint');
t(/if\(st\.token\)/.test(html), 'a token on the row is the thing it reports first');
t(/No phone registered yet/.test(html), '  and its absence is said plainly, not left blank');
t(/_pushWhen\(st\.at\)/.test(html), 'with the moment the token landed, so a stale one is visible');
t(/st\.native/.test(html), 'and it tells the app apart from the browser');
t(/sending from this screen still works/.test(html),
  '  without implying the browser cannot send — it can, the token is the account’s');
const state=slice('function _pushDeviceState(){','function _pushWhen');
t(/_capPush\(\)/.test(state), 'the native test is the same one the registration uses');
t(/profile && profile\.push_token/.test(state), 'and the token is read off the row, never invented');

console.log('\n  IT ASKS THE ROW AGAIN BEFORE IT ANSWERS:');
const open=slice('async function openPushPanel(){','async function pushSendTest');
t(/_pushPanelPaint\(\);[\s\S]{0,60}?openM\('mPush'\)/.test(open),
  'it paints from what it has and opens immediately');
t(/sbSelect\('profiles'/.test(open) && /select=push_token,push_token_at/.test(open),
  'then re-reads the row, because the phone may have registered since this tab signed in');
t(/_pushPanelPaint\(\);[\s\S]*_pushPanelPaint\(\)/.test(open), '  and repaints with what came back');
t((open.match(/catch\(e\)\{\}/g)||[]).length>=3, 'a failed read leaves the panel standing');

console.log('\n  THE BUTTON REALLY SENDS, AND REPORTS WHAT CAME BACK:');
const send=slice('async function pushSendTest(){','function skipSetup(){');
t(/fetch\('\/\.netlify\/functions\/push-send'/.test(send), 'it calls the sending half');
t(/'Authorization':'Bearer '\+tok/.test(send), 'carrying the session, which is what the server checks');
t(/sessEnsure\(window\.cl && cl\.code\)/.test(send), '  minting one first if this tab has none');
t(/code:\(cl&&cl\.code\)\|\|''/.test(send),
  'aimed at his own account — the panel never names somebody else');
t(/r\.ok && d && d\.ok===true/.test(send), 'only a true ok counts as sent');
t(/r\.status/.test(send) && /d\.reason \|\| d\.error/.test(send),
  'and anything else prints the status and the reason Apple gave');
t(/It never left the app/.test(send), 'a throw is reported as a throw, not as a silent nothing');
t(/btn\.disabled=false/.test(send), 'and the button comes back either way');

console.log('\n  THE PANEL EXISTS TO BE OPENED INTO:');
const sheet=slice('<div class="mbg" id="mPush">','<!-- ADD TO A DAY');
t(/id="pushPanelBody"/.test(sheet), 'the sheet has the host the paint writes into');
t(/class="mtitle">Notifications</.test(sheet), 'and a title that says what it is');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (he can ask the app what happened)\n');
process.exit(bad?1:0);
