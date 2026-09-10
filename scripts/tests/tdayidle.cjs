// A SESSION IS A SESSION (Yusuf, 10 Sep). Once a real session is logged today
// the planned hero stands down, one small "+ Another workout" line stands in
// its place, and a row titled with the bare word Workout reads as what it did.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const day=src.slice(src.indexOf('var _plannedWo=null;'), src.indexOf('var _plannedWo=null;')+2600);
t(/if\(!_plannedWo\)\{\s*_plannedWo=_woList\.filter\(function\(x\)\{ return !_tlIsRecord\(x\); \}\)\[0\]\|\|null;/.test(day), 'any real session logged takes the monument, plan or no plan');
t(/_woMatchesPlan\(_plannedWo, plan\)\) \? plan\.type : _woDisplayTitle\(_plannedWo\)/.test(src), 'the monument is titled by the plan only when the session matched it');
t(/_tlAskRow\('creative', ds, 'Another workout'\)/.test(src), '+ Another workout is the small line that replaces the Start card');
const fn=src.slice(src.indexOf('function _woDisplayTitle(w){'), src.indexOf('function _woMatchesPlan(w, plan){'));
const wt=src.slice(src.indexOf('var _WO_TITLE_WORDS=['), src.indexOf('function _woApplyTitle(ds, d, fromModel){'));
const ctx={String,RegExp,Array}; vm.createContext(ctx); vm.runInContext(wt+'\n'+fn, ctx);
const D=(w)=>vm.runInContext('_woDisplayTitle('+JSON.stringify(w)+')', ctx);
t(D({title:'Workout', description:'Smith Machine Chest Press · 4 sets\nIncline Chest Press · 1 set\nForearm Curls · 4 sets\nMachine Lateral Raises · 4 sets\nMachine Calf Raises · 3 sets\nHip Mobility and Foam Rolling · 15 min\n\nI did four sets'})==='Chest, Forearms, Shoulders, Calves, Mobility', 'his Workout row reads as "'+D({title:'Workout', description:'Smith Machine Chest Press · 4 sets\nForearm Curls · 4 sets'})+'"');
t(D({title:'Push', description:'Chest Press: 3 × 8'})==='Push', 'a real title is left alone');
t(D({title:'Workout', description:''})==='Workout', 'nothing to read from stays Workout');
t(/slotName = _woDisplayTitle\(it\);/.test(src) && /var title=_woDisplayTitle\(wo\)/.test(src), 'the row card and the monument both print it');
const st=src.slice(src.indexOf('async function saveSteps(ds, clear){'), src.indexOf('// ===== PROGRAM ON / OFF'));
t(/_doneFlash\(document\.querySelector\('#stepsOv \.stSheet'\)/.test(st) && /closeSteps\)/.test(st) && !/the close is theirs/.test(st), 'the steps sheet draws the check and closes itself after a save');
console.log(bad?'\n  '+bad+' FAILED':'\n  all day-idle assertions pass');
process.exit(bad?1:0);
