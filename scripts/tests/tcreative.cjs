// CREATIVE MODE (Yusuf, 10 Sep 9:34am): the day-trading pills are gone from
// the session card; one link opens a blank sheet where they say what they did.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
const m={exports:{}}; new Function('module','exports',[lift('_cdCreativeTitle'),'module.exports={_cdCreativeTitle};'].join('\n'))(m,m.exports);
const {_cdCreativeTitle}=m.exports;
const ctl=src.slice(src.indexOf('function _tlChangeControl'), src.indexOf('function _tlSlot('));
t(/data-tl="creative"[^>]*>Creative mode/.test(ctl), 'the session card offers Creative mode');
t(/if\(!window\._tlSwapPillsOn\)\{\s*return /.test(ctl), 'and the trade pills are not drawn unless a flag says so');
t(/a==='creative'\)\{ ev\.stopPropagation\(\); creativeOpen\(/.test(src), 'the tap opens the sheet');
t(/function creativeOpen\(ds\)\{ _cdMode='creative'; cardioOpen\(ds\); \}/.test(src), 'it is the cardio sheet with the name off');
t(/creative\?'':'30 minutes on the stairmaster'/.test(src), 'no placeholder in creative mode');
t(/title: creative \? _cdCreativeTitle\(said\) : 'Cardio'/.test(src), 'the row is titled from their words');
t(_cdCreativeTitle('Push\nbench 3x8 135')==='Push', 'first line "Push" names it');
t(_cdCreativeTitle('Upper body:\nrows')==='Upper body', 'a trailing colon is dropped');
t(_cdCreativeTitle('bench 3x8 at 135, incline db 3x10')==='Workout', 'a line with numbers is not a name');
t(_cdCreativeTitle('did some stuff at the gym today with my brother')==='Workout', 'a sentence is not a name');
const hero=src.slice(src.indexOf('function _tlRestCard'), src.indexOf('// MOVEMENT REMINDERS'));
t(/showHint && isToday && !window\._tlRO\)\?\('<span class="tlChangeLink" data-tl="creative"/.test(hero), 'a day with no program gets the same door, today only');
console.log(bad?('\n'+bad+' FAILED'):'\n  all creative assertions pass'); process.exit(bad?1:0);
