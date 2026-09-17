// THE PUSH DOOR — the first thing built for the App Store, and the reason is
// not "notifications would be nice".
//
// Apple guideline 4.2 rejects apps that are a repackaged website. The store
// shell (mobile/, Capacitor, scaffolded 10 Sep) points at the live Netlify URL,
// which is the exact shape that gets rejected. A notification on a locked
// iPhone is something a web page on iOS cannot do, so it is the cleanest answer
// to 4.2 — and it is also the thing the app most needs anyway.
//
// THIS IS HALF THE FEATURE ON PURPOSE. Registering a device and writing its
// token onto the client's row needs nothing from Apple beyond the shell.
// SENDING needs an APNs key only Yusuf can generate. The half that can ship
// alone ships alone, and a token on a row costs nothing while it waits.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i);
  if(j<0) throw new Error('stale end anchor: '+b); return src.slice(i,j); }

console.log('\n  THE PAGE CARRIES THE BRIDGE, BECAUSE THE SHELL DOES NOT:');
/* Found on his handset 17 Sep after an hour: the App Store shell opens this
   live site rather than carrying its own copy, so every ship reaches the
   installed app immediately - but the plugin JS lives in the app bundle and
   this page loaded none of it. Capacitor.Plugins.PushNotifications never
   existed, the push code found no bridge and stopped, and nothing said so. */
t(/<script src="\/capacitor\.js"><\/script>/.test(src), 'the Capacitor runtime is on the page');
t(/<script src="\/capacitor-push\.js"><\/script>/.test(src), 'and the push plugin registers against it');
t(src.indexOf('src="/capacitor.js"') < src.indexOf('src="/capacitor-push.js"'),
  '  runtime first, since the plugin registers into it');
t(fs.existsSync('capacitor.js') && fs.existsSync('capacitor-push.js'),
  'and both files are actually in the repo, not just referenced');
t(/registerPlugin\('PushNotifications'/.test(fs.readFileSync('capacitor-push.js','utf8')),
  '  the plugin file registers the right name');
t(/globalThis/.test(fs.readFileSync('capacitor.js','utf8')),
  '  and the runtime defines window.Capacitor for the page');
/* netlify.toml 404s some file types at the root; these two must not be caught. */
const tom=fs.readFileSync('netlify.toml','utf8');
t(!/from = "\/\*\.js"/.test(tom), 'and nothing in netlify.toml blocks a root .js file');

console.log('\n  EVERY SIGN-IN SAYS WHAT IT IS:');
/* Four versions went into chasing push on his handset on theories about what
   his phone had loaded, and every theory cost him a reopen and proved nothing,
   because the only evidence was the ABSENCE of a row. Absence has too many
   causes. A diagnostic that only runs on the unhappy path cannot be trusted
   when the unhappy path is silence. */
const stamp=slice('async function _appStamp(){','var _PUSH_DONE=false;');
t(/base\.app=\{ v:/.test(stamp), 'the build is written down');
t(/surface:_surfaceTag\(\)/.test(stamp), 'and where it is running');
t(/no-push-plugin/.test(stamp), 'and whether the bridge to the phone is complete');
t(/isNativePlatform\(\)\) \? 'native' : 'web-shim'/.test(stamp),
  '  telling the shell apart from a browser that merely loaded the script');
t(/sbPatchProfile\(\{intake_json:js\}\)/.test(stamp), 'onto their own row, as an update');
t(/if\(window\._obPreview===true\) return false;/.test(stamp), 'and a preview writes nothing');
t(/_appStamp\(\); \}catch\(e\)\{\} \}, 900\)/.test(src),
  'fired on every sign-in, not only when something breaks');
t(src.indexOf('_appStamp()') < src.indexOf('_pushInit()'),
  '  and before push runs, so it lands even when push gives up early');

console.log('\n  IT IS SILENT ON THE WEB:');
const det=slice('function _capPush(){','function _pushPlatform');
t(/window\.Capacitor/.test(det), 'it looks for the native shell');
t(/isNativePlatform/.test(det), 'and trusts isNativePlatform, not a user agent',
  'a user agent can be anything');
t(/return null/.test(det), 'and answers nothing at all in a browser');

console.log('\n  IT ASKS AT THE RIGHT MOMENT:');
/* iOS asks once, ever. A box thrown at somebody in their first two seconds is
   the one people refuse by reflex, and there is no second chance. */
t(/_pushInit\(\); \}catch\(e\)\{\} \}, 1200\)/.test(src),
  'not on first paint - after the server has answered and they are on their day');
const sign=slice('var _obSrv=(profiles','function skipSetup');
t(sign.indexOf('obStart(0, _obSrv)') < sign.indexOf('_pushInit()'),
  '  and after setup has had its turn, not competing with it');

console.log('\n  IT CANNOT MISS ITS OWN TOKEN:');
const init=slice('async function _pushInit(){','function skipSetup');
t(init.indexOf("addListener('registration'") < init.indexOf('requestPermissions'),
  'the listener goes on BEFORE the ask, because registration can answer first');
t(/registrationError/.test(init), 'a failure to register is said out loud');
t(/console\.warn\('\[push\] registration failed'/.test(init),
  '  rather than swallowed, because silence looks exactly like no notifications');
t(/_PUSH_DONE/.test(init), 'and it only ever runs once');

console.log('\n  ONE ASK, AND ONLY IF iOS WILL ANSWER:');
t(/checkPermissions\(\)/.test(init), 'it checks what iOS already decided');
t(/val==='prompt' \|\| val==='prompt-with-rationale'/.test(init),
  'and only asks when iOS has not been asked yet');
t(/if\(val!=='granted'\)\{[\s\S]{0,90}?return false; \}/.test(init), 'a refusal is taken as a refusal');
t(init.indexOf('register()') > init.indexOf("val!=='granted'"),
  '  and nothing registers without permission');

console.log('\n  A TAP HAS TO LAND SOMEWHERE:');
t(/pushNotificationActionPerformed/.test(init), 'tapping a notification is handled');
t(/switchTab\(t\)/.test(init), '  it opens the tab the notification names');
t(/switchTab\('Today'\)/.test(init), '  and Today when it names none');

console.log('\n  THE TOKEN IS WRITTEN WHERE EVERY OTHER FACT IS:');
const save=slice('async function _pushSaveToken(','var _PUSH_DONE');
t(/sbPatchProfile\(row\)/.test(save), 'onto their own profile row, as an update');
t(/push_token:String\(tok\)/.test(save) && /push_platform:/.test(save) && /push_token_at:/.test(save),
  'with the token, the platform and when it was taken');
t(/var ok=await sbPatchProfile\(row\);/.test(save) && /return ok;/.test(save),
  'and a failure is returned, never thrown at somebody opening their day');
t(/if\(!tok \|\| !cl \|\| !cl\.code\) return false;/.test(save), 'no token and no client means no write');

console.log('\n  AND WHICH SURFACE IS EVEN RUNNING:');
/* An hour went into proving push on his handset with no way to tell, from
   anything on screen, whether he was looking at the App Store shell or the
   Safari bookmark. Same name, same version number, and the answer decides
   whether push is even possible. */
const surf=slice('function _surfaceTag(){','function rendVersion(){');
t(/isNativePlatform\(\)\) return 'store'/.test(surf), 'the native shell says store');
t(/display-mode: standalone/.test(surf), 'the home-screen bookmark says home');
t(/navigator\.standalone===true\) return 'home'/.test(surf), '  including on older iOS');
t(/return 'web'/.test(surf), 'and a browser tab says web');
const rv=slice('function rendVersion(){','function _verTagTap');
t((rv.match(/sfx/g)||[]).length>=5, 'and every place the version is shown carries it',
  String((rv.match(/sfx/g)||[]).length));

console.log('\n  THE BRANCH THAT STAYED SILENT NOW SPEAKS:');
const guard=slice('    var P=_capPush();','    _PUSH_DONE=true;');
t(/_pushNote\('no_plugin'/.test(guard),
  'a native shell that cannot see the plugin is a fault, and says so');
t(/isNativePlatform\(\)\)\{/.test(guard),
  '  while an ordinary browser still writes nothing at all',
  'a write on every page load for every client is not diagnostics');

console.log('\n  AND IT SAYS WHICH HALF FAILED:');
/* Proved on his own handset the hour it shipped: the permission box appeared,
   he allowed it, and no token reached his row - and nothing anywhere said which
   half had failed. A push feature that fails quietly is indistinguishable from
   a phone that never gets notifications, which is the exact thing this was
   supposed to make impossible. */
const note=slice('async function _pushNote(','async function _pushSaveToken');
t(/base\.push=\{ state:/.test(note), 'every run records its own outcome on the row');
t(/intake_json/.test(note), '  in intake_json, so it needs no new column');
t(/detail:String\(detail==null\?'':detail\)\.slice\(0,200\)/.test(note),
  '  with the error text, trimmed');
t(/if\(window\._obPreview===true\) return false;/.test(note), '  and a preview still writes nothing');
const init2=slice('async function _pushInit(){','function skipSetup');
[['not_granted','a refusal'],['granted','permission given'],
 ['registered','asked Apple and waiting'],['register_failed','Apple refused'],
 ['register_threw','the call itself threw'],['token','the token arriving']].forEach(function(p){
  t(new RegExp("_pushNote\\('"+p[0]+"'").test(init2+src), '  '+p[1]+' is written down');
});
t((src.match(/_pushNote\(/g)||[]).length>=7, 'every branch reports, none of them silently',
  String((src.match(/_pushNote\(/g)||[]).length));

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (the phone can be reached)\n');
process.exit(bad?1:0);
