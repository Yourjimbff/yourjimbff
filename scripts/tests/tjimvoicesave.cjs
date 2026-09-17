// JIM'S VOICE HAD NOWHERE TO LIVE.
//
// Yusuf, 17 Sep: "is it me or has no one opted into jim feedback? what the fuck
// gives?" It was not him. 178 profiles, zero with an opt-in saved, zero with a
// tone, zero with anything — because every setter wrote to localStorage and
// stopped there. The file admitted it in a comment: "those columns are not
// added yet — a schema change is waiting on Yusuf's word." It waited eight days
// while the app went on asking people the question and throwing the answer away.
//
// What it cost, none of it visible: he could not see or count a single choice;
// anyone who cleared their data or opened the app on a second device was asked
// again; and Jim's voice on a phone had nothing to do with Jim's voice anywhere
// else.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) throw new Error('stale start anchor: '+a);
  const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor: '+b); return src.slice(i,j); }

console.log('\n  EVERY SETTER TELLS THE ROW:');
[['function _jimOptSet(','  the opt-in'],
 ['function _jimToneSet(','  the tone'],
 ['function _jimNoCritiqueSet(','  facts-only'],
 ['function _jimAskDone(','  and having been asked at all']].forEach(function(pair){
  const body=src.slice(src.indexOf(pair[0]), src.indexOf(pair[0])+520);
  t(/_jimSaveVoice\(\)/.test(body), pair[1]+' is saved to the profile, not just the browser');
});

console.log('\n  ONE DECISION IS ONE WRITE:');
const save=slice('function _jimSaveVoice(){','/* EVERYONE WHO ALREADY ANSWERED');
t(/clearTimeout\(_JIM_SAVE_T\)/.test(save) && /setTimeout\(/.test(save),
  'debounced, because choosing a voice calls three setters in a row',
  'three writes for one decision is three chances to half-save it');
t(/row\.jim_optin=_jimOptedIn\(\)/.test(save) && /row\.jim_tone=String\(_jimTone\(\)\)/.test(save)
  && /row\.jim_no_critique=_jimNoCritique\(\)/.test(save),
  'and it carries the whole state, read back through the same readers the app uses');
t(/String\(_jimTone\(\)\)/.test(save),
  '  the tone goes up as text, which is what the column is',
  'every reader already runs it through parseInt');
t(/if\(!had && _jimAsked\(\)\)/.test(save),
  'the asked-at stamp is written once, not moved on every later change');
t(/sbPatchProfile\(row\)/.test(save),
  'written as an update, so it cannot be refused for the columns it leaves out',
  'a partial upsert on this table fails the NOT NULL on name - 17 Sep, v507');
t(/window\._obPreview===true\) return false/.test(save), 'and a preview writes nothing');
t(/!cl \|\| !cl\.code\) return false/.test(save), '  nor does a page with nobody signed in');

console.log('\n  AND EVERYONE WHO ALREADY ANSWERED IS CARRIED UP:');
const bf=slice('function _jimVoiceBackfill(){','\nfunction _jimAskHtml');
t(/profile\.jim_optin!=null\) return false/.test(bf),
  'a row that already knows is left alone — the browser never overwrites the record');
t(/asked!=='1' && opt==null\) return false/.test(bf),
  'and somebody who never answered here is not invented an answer for');
t(/_jimSaveVoice\(\)/.test(bf), 'what this browser holds goes up through the one writer');
t(/_jimVoiceBackfill\(\); \}catch\(e\)\{\} \}, 1600\)/.test(src),
  'fired once a sign-in has settled, beside the other things written down then');

console.log('\n  THE READERS ALREADY PREFERRED THE ROW, AND STILL DO:');
const rd=slice('function _jimOptedIn(prof){','function _jimOptSet');
t(/pr\.jim_optin!=null\) return pr\.jim_optin===true/.test(rd),
  'the row wins over the browser wherever both have an answer');
const tone=slice('function _jimTone(prof){','function _jimTurboUnlocked');
t(/p\.jim_tone!=null \? p\.jim_tone/.test(tone), '  same for the tone');
t(!/a schema change is waiting on Yusuf/.test(src),
  'and the comment promising a schema change some day is gone',
  'it sat in the file for eight days while the question kept being asked');

console.log('\n  THE MIGRATION IS IN THE REPO:');
const mig=fs.readFileSync('migrations/2026-09-17-jim-voice-COLUMNS.sql','utf8');
['jim_optin','jim_tone','jim_no_critique','jim_asked_at'].forEach(function(c){
  t(new RegExp('add column if not exists '+c).test(mig), '  '+c);
});
t(/APPLIED 17 Sep/.test(mig), 'and it is marked as applied, not as a plan');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (an answer now survives the browser it was given in)\n');
process.exit(bad?1:0);
