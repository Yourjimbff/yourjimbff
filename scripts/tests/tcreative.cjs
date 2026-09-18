// CREATIVE MODE (Yusuf, 10 Sep 9:34am): the day-trading pills are gone from
// the session card; one link opens a blank sheet where they say what they did.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
const m={exports:{}}; new Function('module','exports',[lift('_cdCreativeTitle'),'module.exports={_cdCreativeTitle};'].join('\n'))(m,m.exports);
const {_cdCreativeTitle}=m.exports;
const ctl=src.slice(src.indexOf('function _tlChangeControl'), src.indexOf('function _tlSlot('));
/* THIS ASSERTION USED TO TEST THE BUG (fixed in v532, re-written here 17 Sep).
   The 10 Sep ruling is "not on the card FACE... it should be somewhere else,
   on the drop down". This line tested for `if(!window._tlSwapPillsOn) return
   '';` instead - an IMPLEMENTATION of that ruling, and a broken one: nothing
   in the file ever set the flag, so the control returned '' for every client
   on every day for eight days and Kelly Griffith-Fields could not move a
   session she had really done. v532 deleted the flag and moved the guard to
   the CALL SITE, which is where the ruling actually lives. So the test now
   asks what Yusuf asked for: the control exists, and it is drawn only inside
   the open card, under the Today's session | Creative mode picker. */
t(!/data-tl="creative"/.test(ctl), 'no creative link on the session card face (10 Sep 9:44)');
const _mvCall=src.slice(src.indexOf('data-want="0">Creative mode'), src.indexOf('id="tlBody_'));
t(/_tlChangeControl\(ds, _effWeek, dayKey\)/.test(_mvCall),
  'and the day move is drawn inside the OPEN card, under that picker, not on the face');
t(/class="tlMoveDay"/.test(_mvCall), 'wrapped in its own drop-down row');
// the GUARD, not the word: v532's own comment names the flag when explaining it
t(!/if\(!window\._tlSwapPillsOn\)/.test(src),
  'and the guard on the flag nothing ever set is gone - it silenced the door for eight days');
t(/data-want="0">Creative mode<\/div>/.test(src), 'the picker inside the open card says Creative mode');
t(/\.tlModePick\.p2 \.tlModeThumb\{[^}]*#b8ff3a/.test(src), 'and its thumb is lime when Creative is on');
t(/a==='creative'\)\{ ev\.stopPropagation\(\);[^\n]*creativeOpen\(/.test(src), 'the tap lights the switch and opens the sheet');
t(/function creativeOpen\(ds\)\{ _cdMode='creative'; cardioOpen\(ds\); \}/.test(src), 'it is the cardio sheet with the name off');
t(!/placeholder="30 minutes on the stairmaster"/.test(src) && !/creative?'':'30 minutes/.test(src), 'no placeholder in either mode (the box carries none since .246)');
t(/title: creative \? _cdCreativeTitle\(said\) : 'Cardio'/.test(src), 'the row is titled from their words');
t(_cdCreativeTitle('Push\nbench 3x8 135')==='Push', 'first line "Push" names it');
t(_cdCreativeTitle('Upper body:\nrows')==='Upper body', 'a trailing colon is dropped');
t(_cdCreativeTitle('bench 3x8 at 135, incline db 3x10')==='Workout', 'a line with numbers is not a name');
t(_cdCreativeTitle('did some stuff at the gym today with my brother')==='Workout', 'a sentence is not a name');
const hero=src.slice(src.indexOf('function _tlRestCard'), src.indexOf('// MOVEMENT REMINDERS'));
/* 12 Sep: and never for a free app user - "what even is creative mode in
   this format?" Their off-plan logging is Jim's tab. */
t(/showHint && isToday && !window\._tlRO && !_meFreeApp\(\)\)\?\('<div class="tlSwitchRow" data-tl="creative"/.test(hero), 'a day with no program gets a lime switch row under the hero, today only, and never for a free user');
t(/\.tlSwitchRow\.on \.tlSwitch\{background:#b8ff3a/.test(src), 'the switch lights lime');
console.log(bad?('\n'+bad+' FAILED'):'\n  all creative assertions pass'); process.exit(bad?1:0);
