/* THE REMINDER LIBRARY, BOTH HALVES (17 Sep).
   The first thing he named this session: "a library of push notifications for
   the app ... optional reminders for the user to set. To log their food. Log
   your training. Hit 10,000 steps. Wind down before bed. And this one is a
   definite one - of the journal entry and the prompt of the day."
   A screen where somebody sets a reminder and nothing ever sends it is a form,
   not a feature, so this suite covers the sender too. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
const snd=fs.readFileSync(path.join(root,'netlify','functions','reminders.js'),'utf8');
const mig=fs.readFileSync(path.join(root,'migrations','2026-09-17-reminders-COLUMN.sql'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };
function slice(a,b){
  const i=src.indexOf(a); if(i<0) throw new Error('tremind: start anchor missing: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('tremind: end anchor missing after start: '+b);
  return src.slice(i,j);
}
console.log('\ntremind - reminders, and something that actually sends them');

// ---- ALL SEVEN HE NAMED, AND NOTHING HE DID NOT
const kinds=slice('var RM_KINDS=[','function _rmDefaultFor(k){');
['breakfast','lunch','dinner','training','steps','winddown','journal'].forEach(k=>{
  ok(kinds.indexOf("k:'"+k+"'")>=0, 'his list includes '+k);
});
ok(/10,000 steps/.test(kinds), 'and the steps one says ten thousand, his number');
ok(/prompt of the day/i.test(kinds), 'the journal one carries the prompt of the day, which he called a definite');

// ---- OPTIONAL MEANS OFF. Apple's own rule bans requiring notifications, and
// a pre-ticked switch is a suggestion nobody asked for.
const list=slice('function _rmList(prof){','function _rmGet(k){');
ok(/return Array\.isArray\(v\) \? v : \[\];/.test(list), 'nothing is on until somebody turns it on');
const html=slice('function _rmHtml(){','function _rmPaint(){');
ok(/off until you turn them on/.test(html), 'and the screen says so in plain words');
ok(/works exactly the same\s*\n?\s*.*if you never turn one on/.test(html) || /if you never turn one on/.test(html),
   'and says the app is unaffected if they never do');

// ---- SAVED TO THE ROW, NOT THE BROWSER. Eight days of that mistake in this
// same table cost 178 profiles their answers.
const save=slice('async function _rmSave(){','function _rmSet(k, on, at){');
ok(/sbPatchProfile/.test(save), 'it saves to the profile row');
ok(/reminders:list/.test(save) && /reminder_tz:_rmTz\(\)/.test(save),
   'with the timezone, because 08:30 means nothing on a server');
ok(/localStorage/.test(save), 'and keeps a local copy as the instant read');
ok(!/sbUpsert/.test(save), 'as a PATCH, never an upsert - a partial upsert to profiles dies on the NOT NULL on name');

// ---- the permission ask happens where it makes sense
const tog=slice('function rmToggle(k){','function rmTime(k, v){');
ok(/if\(!was\)\{[^]*?_pushInit/.test(tog),
   'the phone is only asked for permission when somebody switches their first one on');

// ---- THE SENDER
ok(/exports\.config = \{ schedule: '\*\/15 \* \* \* \*' \}/.test(snd), 'it runs every fifteen minutes');
ok(/reminder_last/.test(snd) && /last\[item\.k\] === now\.date/.test(snd),
   'and never sends the same reminder twice in a day');
ok(/last\[item\.k\] = now\.date;\s*\/\/ stamped only on a real send/.test(snd),
   'the stamp goes on only when it actually sent');
ok(/DAY_START = 6 \* 60/.test(snd) && /DAY_END = 23 \* 60/.test(snd),
   'nothing lands in the middle of the night');
ok(/Intl\.DateTimeFormat\(/.test(snd) && /timeZone: tz/.test(snd),
   'it works in the person’s own clock, not the server’s');
ok(/return null;[\s\S]{0,200}An unknown or missing zone/.test(snd) || /An unknown or missing zone is not a reason/.test(snd),
   'a missing timezone skips rather than guesses');
ok(/if \(res && res\.ok\)/.test(snd), 'pushOne is read as the object it returns, not as a boolean');
ok(/isDeadToken\(res\)/.test(snd), 'and only a token Apple retired is cleared');
ok(!/\bok = await pushOne/.test(snd), 'the boolean misread is gone');

// ---- the prompt of the day is stable for a whole day and is a real question
const pr=snd.slice(snd.indexOf('const PROMPTS = ['), snd.indexOf('function promptFor'));
const n=(pr.match(/^\s*'/gm)||[]).length;
ok(n>=10, 'there are enough prompts to not repeat within a fortnight', n);
ok(pr.split('\n').filter(l=>/^\s*'/.test(l)).every(l=>/\?',?\s*$/.test(l)),
   'every one of them is a question, not an affirmation');
ok(/promptFor\(dateStr\)/.test(snd) && /h % PROMPTS\.length/.test(snd),
   'and the same date always gives the same prompt, so nobody gets two');

// ---- the migration, both halves of it
ok(/add column if not exists reminders jsonb/.test(mig), 'the column exists in a migration');
ok(/grant select \(reminders, reminder_tz\) on public\.profiles to anon/.test(mig),
   'and it is GRANTED to anon in the same file - a new column on this table is not readable otherwise, and the read that fails is sign in');
ok(/reminder_last/.test(mig) && !/grant[^\n]*reminder_last/.test(mig),
   'reminder_last is written only by the sender and is not handed to anon');

// ---- house law
const all=slice('var RM_KINDS=[','function _pushDeviceState(){');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(all+snd), 'no emoji anywhere in it');
ok(/--pk1:8px; --pk2:14px; --pk3:20px; --pk4:26px/.test(src.slice(src.indexOf('.rmSheet{'), src.indexOf('.rmGrab{'))),
   'the sheet uses the same spacing scale as the packet card, not a second rhythm');
ok(/\.rmSheet\{[^]*?backdrop-filter:blur/.test(src), 'and it is glass, per house law');

console.log(fails?('\n  '+fails+' FAILED\n'):'\n  all passed\n');
process.exit(fails?1:0);
