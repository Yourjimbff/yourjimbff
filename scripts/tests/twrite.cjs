// EVERY WRITE THAT CLAIMS MUST BE ABLE TO PROVE IT.
// (Endgame march, 29 Aug. The census this suite freezes was hand-read, not swept.)
//
// THE DETECTOR IS THE POINT. `await fetch(SB_URL+...)` whose result is not
// assigned to anything cannot be checked by any code written afterwards — you
// cannot test what you did not keep. fetch() only rejects on a network fault,
// so a 401, a 403, a refused row and a filter that matched nothing all RESOLVE,
// and the line after happily says "Deleted". That single shape is what this
// suite exists to stop coming back.
//
// It matters far more than it reads. coach_notes has been revoked to the public
// key for some time; cnDelete went on issuing a raw DELETE against it, threw the
// result away, and pulled the note off the screen first — so the button had
// simply stopped working and nothing anywhere said so. A revoke nobody can see
// is a revoke that breaks the app in silence, and the anon key still holds
// DELETE on 25 of the 32 client-keyed tables. Every one of those call sites has
// to fail LOUDLY before that grant can be taken away.
//
// The allowlist is by FUNCTION NAME, never line number — main moves thousands of
// lines under a single order and every number goes stale (CLAUDE.md, standing).
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const lines=src.split('\n');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

function enclosing(n){
  for(let i=n;i>=0;i--){
    const m=/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(lines[i]);
    if(m) return m[1];
  }
  return '(top level)';
}
// A supabase WRITE whose reply is thrown away.
function discarded(){
  const out=[];
  for(let i=0;i<lines.length;i++){
    const L=lines[i];
    if(/^\s*\/\//.test(L)) continue;
    const m=/(^|[^=\w.])await\s+fetch\s*\(\s*SB_URL/.exec(L);
    if(!m) continue;
    const before=L.slice(0, m.index+m[1].length);
    if(/[=]\s*$|return\s*$|\(\s*$|,\s*$/.test(before)) continue;  // kept, so it can be checked
    const win=lines.slice(i,i+6).join(' ');
    const mm=/method\s*:\s*'([A-Z]+)'/.exec(win);
    if(!mm) continue;                                             // a read is not the concern
    out.push({line:i+1, method:mm[1], fn:enclosing(i)});
  }
  return out;
}

// THE FROZEN CENSUS. 44 discarded writes, every one read by hand on 29 Aug.
// changeAccessCode was the 45th and is gone — the ratchet named it the moment it
// stopped being an offender, which is exactly what the "must still be a real
// offender" assertion below is for. Nothing may be ADDED to this list to make a build pass: the
// list only ever shrinks. Each of these still lies to somebody and each is
// scheduled — they are recorded here so the number cannot quietly grow while
// they are being worked through.
const KNOWN={
  _saveThread:1, jDeleteEntry:1, jRenameSave:1, _entryReflect:1, deleteEntry:1,
  createProgram:1, deleteProgram:1, deleteProgramDay:1, openTemplateDayEditor:1,
  wkPanelSave:1, wkPanelDelete:1, wkUndoDelete:1, _cbSaveException:1, _cbDragEnd:1,
  _jvJarvisCalendarAct:1, _mwPanelSave:1, _jvResolveOwnedProgram:2, parseEx:2,
  _jvApplyProgramRemove:2, _jvApplyPrograms:2, _jvApplyProgramEdits:1, _clearReacts:1,
  _mlibEstimateMacros:1, _gradePlateMeal:1, _rememberFood:1, _backfillFoodLibrary:1,
  hubEditDone:1, hubDelete:1, hubTogglePlan:1, tpPersistSets:1, tpSaveSessNote:1,
  tpLogSteps:1, trackMealForMenu:1, toggleShareItem:1, toggleCoachPublish:1,
  removeFromMenu:1, borrowCoachMeal:1,
  _jvJarvisCalendarActClient:1, tbRemove:1, _saveTrainingPlanQuiet:1
};
const found=discarded();
const counts={};
found.forEach(f=>{ counts[f.fn]=(counts[f.fn]||0)+1; });

console.log('\n  1. NO NEW UNCHECKED WRITE:');
let novel=[];
Object.keys(counts).forEach(fn=>{
  if(!KNOWN[fn]) novel.push(fn+' ('+counts[fn]+')');
  else if(counts[fn]>KNOWN[fn]) novel.push(fn+' grew to '+counts[fn]+', was '+KNOWN[fn]);
});
t(novel.length===0, 'no function discards a write that did not already',
  novel.length?novel.join('; '):'');
// The list only shrinks. A function that has been fixed must be removed from
// KNOWN, so a later change cannot silently reintroduce the same lie.
let stale=Object.keys(KNOWN).filter(fn=>!counts[fn]);
t(stale.length===0, 'and every name in the census is still a real offender',
  stale.length?('fixed - delete from KNOWN: '+stale.join(', ')):'');
t(found.length<=44, 'the total never grows', 'now '+found.length);

console.log('\n  2. THE FIVE CLOSED THIS SHIP, EACH READ BACK:');
function body(name){
  const i=lines.findIndex(l=>new RegExp('^\\s*(?:async\\s+)?function\\s+'+name+'\\s*\\(').test(l));
  if(i<0) return '';
  return lines.slice(i, i+46).join('\n');
}
const dew=body('deleteEditedWorkout');
t(/sbWrite\('DELETE','workout_logs\?id=eq\.'/.test(dew), 'deleteEditedWorkout goes through sbWrite');
t(/if\(!r\.ok\)/.test(dew), 'and checks the reply');
t(/sbSelect\('workout_logs','select=id&id=eq\./.test(dew), 'and reads the row back');
t(dew.indexOf("showToast('Deleted')")>dew.indexOf('sbSelect'), 'and only says Deleted after that read');

const dpp=body('deleteProgressPhoto');
t(/sbWrite\('DELETE','progress_photos\?id=eq\./.test(dpp), 'deleteProgressPhoto goes through sbWrite');
t(/if\(!r\.ok\)/.test(dpp) && /sbSelect\('progress_photos'/.test(dpp), 'checks and reads back');
t(dpp.indexOf('progressPhotos = progressPhotos.filter')>dpp.indexOf('sbSelect'),
  'and the photo leaves the screen only after the row is confirmed gone');

const tha=body('tpHistAppend');
t(/sbWrite\('PATCH','workout_logs\?id=eq\./.test(tha), 'tpHistAppend goes through sbWrite');
t(/indexOf\(line\)<0/.test(tha), 'and proves the line is actually in the row it read back');
// TWO SEPARATE PROPERTIES, and the first version of this only tested one. The
// SAFETY property is that no paint happens before the row is confirmed; the
// CORRECTNESS property is that the paint happens after the line is put into the
// object it renders from. A mutant that moved the repaint above w.description
// but left it below the read-back survived the single ordering check, because
// that mutant breaks the second property and not the first.
t(tha.indexOf('_tpRepaint()')>tha.indexOf("sbWrite('PATCH'"),
  'nothing is painted before the write');
t(tha.indexOf('_tpRepaint()')>tha.indexOf('indexOf(line)<0'),
  'and nothing is painted before the row is confirmed to hold the line');
t(tha.indexOf('w.description=_next')<tha.indexOf('_tpRepaint()'),
  'and the line is in the object before the repaint reads it');

const cnd=body('cnDelete');
t(cnd.indexOf('SB_URL')<0, 'cnDelete no longer touches the public key at all');
t(/trainerWrite\('noteDelete'/.test(cnd), 'it asks the door, the same op deleteClientNote uses');
t(/window\._cnCache\[code\] = _prev;/.test(cnd), 'and puts the note back when the door refuses');

console.log('\n  3. HIS AVAILABILITY CANNOT BE LOST:');
const sav=body('saveAvailabilityRows');
t(/sbWrite\('POST','availability'/.test(sav), 'the new rows are written through sbWrite');
t(/sbWrite\('DELETE','availability\?id=in\./.test(sav), 'and only the OLD ids are cleared, by id');
t(sav.indexOf("sbWrite('POST'")<sav.indexOf("sbWrite('DELETE'"),
  'THE ORDER: nothing is removed until its replacement has landed');
t(/if\(!_ins\.ok\) return false/.test(sav), 'a refused insert removes nothing and says so');
t(/return _after\.length===rows\.length/.test(sav), 'and the answer is a read-back count, not a 2xx');
// The mutant that matters: if the delete ran first, a refused insert would wipe
// the week. Assert the two calls cannot be reordered without this failing.
const iPost=sav.indexOf("sbWrite('POST'"), iDel=sav.indexOf("sbWrite('DELETE'");
t(iPost>-1 && iDel>-1 && iPost<iDel, 'both calls present and in that order', 'post@'+iPost+' del@'+iDel);
// Match the live toast expression, not the surrounding prose — the comment
// explaining the change quotes the old wording, and an earlier version of this
// assertion found its own explanation and failed. (The same collision troute2
// hit: never let a suite's needle appear in a comment near its haystack.)
const savCaller=body('saveAvailability').split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
t(/showToast\(ok\?'Availability saved':/.test(savCaller), 'the caller still branches on the answer');
t(!/'Saved on this device only'/.test(savCaller),
  'and no longer calls a server failure a local save');
t(/check your availability before trusting it/.test(savCaller),
  'it says the server copy may be wrong, which is what clients book against');

console.log('\n  4. coach_notes IS WRITE-ONLY TO THE PUBLIC KEY:');
// PROBED LIVE, 29 Aug, not read off migrations/ (which is stale about the real
// grants). The anon key gets 42501 on SELECT, UPDATE and DELETE, and 201 on
// INSERT. That asymmetry is deliberate and load-bearing: a CLIENT has to be able
// to raise a flag about themselves, and the trainer door would refuse them for
// having no trainer session. So an INSERT on the public key is correct here and
// a read, an update or a delete on it is dead code that can only lie.
const rawNote=[];
lines.forEach((l,i)=>{
  if(/^\s*\/\//.test(l)) return;
  if(!/rest\/v1\/coach_notes/.test(l)) return;
  const win=lines.slice(Math.max(0,i-3), i+5).join(' ');
  const m=/method\s*:\s*'([A-Z]+)'/.exec(win);
  const method=m?m[1]:'GET';
  if(method!=='POST') rawNote.push((i+1)+':'+enclosing(i)+':'+method);
});
t(rawNote.length===0, 'no public-key read, update or delete against coach_notes',
  rawNote.join(' '));
const cnp=body('cnPost');
t(cnp.indexOf('SB_URL')<0 && /trainerWrite\('noteSend'/.test(cnp),
  'cnPost leaves a note through the door');
// The one that must NOT move. A client raises this and has no trainer session.
const nbt=lines.slice(lines.findIndex(l=>/function noteBodyTalk/.test(l))).slice(0,60).join('\n');
t(/rest\/v1\/coach_notes/.test(nbt) && /DO NOT MOVE THIS TO THE DOOR/.test(nbt),
  'and the client-raised flag stays on the public key, with the reason written down');

console.log('\n  5. THE ACCESS-CODE ROUTINE STAYS BURIED (his word, 29 Aug):');
// It PATCHed ten tables unchecked, never wrote to `clients` (anon UPDATE there is
// revoked), and registered the new code in this device's localStorage only — so it
// moved his record to a code that could sign in on one browser and nowhere else.
// It had no button and no inputs; a console was the only way to reach it.
t(!/function\s+changeAccessCode\s*\(/.test(src), 'the function is gone');
t(!/getElementById\('acNew'\)/.test(src) && !/getElementById\('acConfirm'\)/.test(src),
  'and nothing reads its inputs');
t(!/id=["\']ac(New|Confirm)["\']/.test(src), 'and the inputs do not exist to be read');
// Only the WRITER went. A device holding an entry from before still signs in.
t(/localStorage\.getItem\('yjb_custom_trainer_codes'/.test(src),
  'the custom-code readers stay, so an old device is not locked out');
t(!/localStorage\.setItem\('yjb_custom_trainer_codes'/.test(src),
  'but nothing writes that map any more');
// The rebuild is ordered, and it goes through the door or not at all.
t(/rebuilt behind the trainer door/.test(src), 'and the tombstone records that it is coming back through the door');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
