// EACH SET GETS ITS OWN REP GOAL, and the connection ratings raise it
// (Yusuf, 10 Sep 9:50am). "8, 6, 8" is set 1 = 8, set 2 = 6, set 3 = 8.
const fs=require('fs'); const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(ok,l)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+l); };
function lift(name){ const re=new RegExp('\\n(?:async )?function '+name+'\\('); const i=src.search(re); if(i<0) throw new Error('missing '+name); const b=src.slice(i+1); let d=0; for(let k=b.indexOf('{');k<b.length;k++){ if(b[k]==='{') d++; else if(b[k]==='}'){ d--; if(!d) return b.slice(0,k+1); } } throw new Error('unterminated '+name); }
const code=[
  'var window={}; var cl={code:"zz"}; var _BF_CONN_LOOK=4, _BF_CONN_BUMP=4, _BF_CONN_CAP=20;',
  'function _exCanonical(n){ return String(n||"").trim().toLowerCase(); }',
  lift('_bfRepList'), lift('_bfConnFlags'), lift('_bfConnFlagFor'), lift('_bfRepBump'), lift('_bfRepAt'), lift('_bfRepShow'),
  'module.exports={_bfRepList,_bfRepAt,_bfRepShow,_bfRepBump,setFlag:function(ex){ window._bfConnFlag={code:"zz",ex:ex,at:Date.now()}; }};'
].join('\n');
const m={exports:{}}; new Function('module','exports',code)(m,m.exports);
const {_bfRepList,_bfRepAt,_bfRepShow,_bfRepBump,setFlag}=m.exports;

console.log('  a list is per set:');
const e={n:'Shoulder Press', s:3, r:'8, 6, 8'};
t(_bfRepAt(e,0)==='8' && _bfRepAt(e,1)==='6' && _bfRepAt(e,2)==='8', '"8, 6, 8": set 1 is 8, set 2 is 6, set 3 is 8');
t(_bfRepAt(e,3)==='8', 'a fourth set repeats the last number');
t(_bfRepAt({r:'8/12/15/20'},2)==='15', 'slashes work');
t(_bfRepAt({r:'8 12 15 20'},3)==='20', 'spaces work');
t(_bfRepAt({r:'10'},2)==='10', 'one number is every set');
t(_bfRepAt({r:'8-12'},1)==='8-12', 'a range is one thing, not two sets');
t(_bfRepAt({r:'8 to 12'},0)==='8 to 12', 'so is "8 to 12"');
t(_bfRepAt({r:'AMRAP'},0)==='AMRAP', 'a word stays a word');
t(_bfRepAt({r:''},0)==='', 'nothing stays nothing');

console.log('\n  a row already carrying the whole list reads as its own set:');
t(_bfRepShow(e,{r:'8, 6, 8'},1)==='6', 'an old draft row "8, 6, 8" on set 2 shows 6');
t(_bfRepShow(e,{r:'7'},1)==='7', 'what they actually did wins');
t(_bfRepShow(e,{r:''},2)==='8', 'an empty row falls back to its set goal');

console.log('\n  the connection flag raises the goal:');
setFlag({'shoulder press':{of:4,felt:0}});
t(_bfRepAt(e,1)==='10', 'flagged: 6 becomes 10');
t(_bfRepBump('8-12')==='12-16', 'a range moves up together');
t(_bfRepBump('18')==='20' && _bfRepBump('20')==='20', 'capped at twenty');
t(_bfRepAt({n:'Bench', r:'8'},0)==='8', 'an unflagged movement is untouched');
setFlag({});
t(_bfRepAt(e,1)==='6', 'no flag, no bump');

console.log('\n  the rule as written:');
const load=src.slice(src.indexOf('async function _bfConnLoad'), src.indexOf('function _bfConnFlagFor'));
t(/if\(last\.length<_BF_CONN_LOOK\) return;/.test(load), 'needs four rated sessions before it says anything');
t(/if\(felt<2\) ex\[key\]=/.test(load), 'fewer than two "felt" in the last four flags it');
t(/window\.VIEWAS\) return;/.test(load), 'never inside a view-as');
t(/class="bfFeedback"><span class="bfFeedbackK">Feedback<\/span>/.test(src), 'the card says Feedback under the exercise');
console.log(bad?('\n'+bad+' FAILED'):'\n  all rep assertions pass'); process.exit(bad?1:0);
