// CREATIVE MODE (Yusuf, 10 Sep 9:34am): the day-trading pills are gone from
// the session card FACE; one link opens a blank sheet where they say what they did.
//
// 18 Sep: this file used to assert the literal line `if(!window._tlSwapPillsOn)
// return '';`. That asserted the MECHANISM, not the behaviour, and the mechanism
// was a kill switch nothing ever turned on - so _tlChangeControl returned '' for
// every client on every day and the 31 Aug ruling (a client may move a planned
// session to the day they actually trained) was enforced nowhere. Kelly
// Griffith-Fields reported it on 15 Sep. The guard now asserts what 10 Sep 9:44
// actually asked for - "it should be somewhere else, on the drop down" - which
// is: NOT on the card face, and present inside the open card.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
const m={exports:{}}; new Function('module','exports',[lift('_cdCreativeTitle'),'module.exports={_cdCreativeTitle};'].join('\n'))(m,m.exports);
const {_cdCreativeTitle}=m.exports;
const ctl=src.slice(src.indexOf('function _tlChangeControl'), src.indexOf('function _tlSlot('));
const slot=src.slice(src.indexOf('function _tlSlot('));
const slotBody=slot.slice(0, slot.indexOf('\n    var _lm='));
const heroPart=slotBody.slice(0, slotBody.indexOf('if(open){'));
const openPart=slotBody.slice(slotBody.indexOf('if(open){'));
t(!/data-tl="creative"/.test(ctl), 'no creative link buried inside the change control (10 Sep 9:34)');
t(!/_tlChangeControl\(/.test(heroPart), 'nothing on the session card face: the day-move control is not rendered in the hero (10 Sep 9:44)');
t(/_tlChangeControl\(/.test(openPart) && /tlMoveDay/.test(openPart), 'the day-move control lives in the OPEN card instead, under the mode picker (18 Sep, Kelly G)');
t(!/if\(!window\._tlSwapPillsOn\)/.test(src), 'and the kill switch nothing ever set is gone as a gate, not merely unread (18 Sep)');
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
