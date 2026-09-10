// CREATIVE MODE, 10 Sep: a smart title he can edit, a box that grows, and a
// connection pill on every read line - none of it required.
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l); };
const a=src.indexOf('var _WO_TITLE_WORDS=['), b=src.indexOf('function _woApplyTitle(ds, d, fromModel){');
const ctx={String,RegExp}; vm.createContext(ctx); vm.runInContext(src.slice(a,b), ctx);
const T=(rows,text)=>vm.runInContext('_woSmartTitle', ctx)(rows,text);
console.log('\n  the title:');
const rows=[{n:'Smith Machine Chest Press',d:'4 sets'},{n:'Incline Chest Press',d:'1 set'},{n:'Forearm Curls',d:'4 sets'},{n:'Machine Lateral Raises',d:'4 sets'},{n:'Machine Calf Raises',d:'3 sets'},{n:'Hip Mobility and Foam Rolling',d:'15 min'}];
t(T(rows,'')==='Chest, Forearms, Shoulders, Calves, Mobility', 'his session reads as "'+T(rows,'')+'"');
t(T([], 'I did four sets of smith machine chest press one set of incline chest press four sets of forearm curls four sets of machine lateral raises three sets of machine calf raises and 15 minutes of hip mobility and foam rolling')==='Chest, Forearms, Shoulders, Calves, Mobility', 'and from the spoken words alone, before Organize');
t(T([{n:'Barbell Squat'},{n:'Hip Thrust'},{n:'Plank'}],'')==='Legs, Glutes, Core', 'legs day names itself');
t(T([{n:'Reformer Pilates',d:'45 min'}],'')==='Pilates', 'a class is its own name');
t(T([],'')==='', 'nothing said, nothing invented');
// apply: theirs wins, auto is replaced
const c2={String,RegExp}; vm.createContext(c2); vm.runInContext(src.slice(a, src.indexOf('function woDictate(ds) {')), c2);
const apply=(d,m)=>{ vm.runInContext('globalThis.__d='+JSON.stringify(d), c2); vm.runInContext('_woApplyTitle("x", __d, '+JSON.stringify(m)+')', c2); return vm.runInContext('__d', c2); };
t(apply({freeRows:rows}, 'Chest, Shoulders, Forearms, Mobility').ownTitle==='Chest, Shoulders, Forearms, Mobility', 'the organizer\'s title lands in the Title field');
t(apply({freeRows:rows}, 'Workout').ownTitle==='Chest, Forearms, Shoulders, Calves, Mobility', '"Workout" is not a title - the local read replaces it');
t(apply({freeRows:rows, ownTitle:'Push day', ownTitleAuto:false}, 'Chest, Shoulders').ownTitle==='Push day', 'a title they typed is never touched');
t(apply({freeRows:rows, ownTitle:'Chest', ownTitleAuto:true}, 'Chest, Shoulders').ownTitle==='Chest, Shoulders', 'a title this wrote is replaced on the next read');
t(/d\.ownTitleAuto=false;/.test(src.slice(src.indexOf('function ownTitleSet(ds, v){'), src.indexOf('function ownTitleSet(ds, v){')+300)), 'typing in the Title field makes it theirs');
console.log('\n  the organizer and Complete:');
const org=src.slice(src.indexOf('async function woOrganize(ds) {'), src.indexOf('async function woOrganize(ds) {')+3000);
t(/"title": string, "rows"/.test(org) && /Array\.isArray\(parsedOut\) \? parsedOut : \(parsedOut && parsedOut\.rows\)/.test(org), 'the organizer asks for a title and still reads the old array shape');
t(/prev\[String\(r\.n\|\|''\)\.toLowerCase\(\)\]/.test(org), 'a connection tapped on a line survives a re-read');
const done=src.slice(src.indexOf('function tlLogInlineWorkout(ds, opts){'), src.indexOf('function tlMoveMeal('));
t(/oTitle=_woSmartTitle\(dr\.freeRows, dr\.freeText\)/.test(done), 'Complete with no title names the session itself');
t(/_bfWriteConnection\(_ff, ds\)/.test(done) && /_bfWriteConnection\(_fmap, ds\)/.test(done), 'both roads write the connection through one door');
console.log('\n  the read lines and the box:');
const fh=src.slice(src.indexOf('function _woFreeHtml(ds, dr) {'), src.indexOf('function woFreeSet(ds, v) {'));
t(/data-tl="freefeel"/.test(fh) && /\[\['not','Low'\],\['ok','Moderate'\],\['tore','High'\]\]/.test(fh), 'Low / Moderate / High on every read line');
t(/if\(a==='freefeel'\)\{ ev\.stopPropagation\(\); tlFreeFeel\(/.test(src), 'and the Day page hears the tap');
t(/_woGrow\(this\)/.test(fh) && /resize:none;overflow:hidden/.test(fh) && /requestAnimationFrame\(function\(\)\{ _woGrow\(/.test(fh), 'the box grows on every keystroke and opens at full height');
t(/_woGrow\(box\); \}/.test(src.slice(src.indexOf('function woDictate(ds) {'), src.indexOf('async function woOrganize(ds) {'))), 'and on every word the mic writes');
console.log(bad?'\n  '+bad+' FAILED':'\n  all creative-mode assertions pass');
process.exit(bad?1:0);
