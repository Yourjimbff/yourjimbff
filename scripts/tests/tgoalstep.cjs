// THE ONE QUESTION A SCALE CANNOT ANSWER (Yusuf, 14 Sep, launch night, after
// sending forty personal voice notes): "maybe it's worth adding a free type
// goal section in there. What is your goal? ... feel free to be as detailed as
// possible."
//
// "goal" was already a word in this app and it meant build or cut - a two-way
// switch. Nothing on the whole intake could hold "lose 20 before my sister's
// wedding in June", which is the only line on an account that tells you why
// somebody is here.
//
// It rides in the new-account text, so a blank one is not merely a thin file -
// it is a text with a hole in it. Required, at three characters, which is a bar
// nobody writing an essay notices and nobody skipping it can clear.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return '';
  let b=a,d=0,seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined?('  '+extra):'')); };

const steps=(function(){ const i=src.indexOf('var _OB_STEPS=['); const j=src.indexOf('\n];', i); return src.slice(i, j); })();

console.log('\n  IT IS ASKED');
t(/k:'goal_text', type:'say'/.test(steps), 'there is a goal step');
t(/q:'What is your goal\?'/.test(steps), 'in his words');
t(/ph:'lose 20 lbs/.test(steps), 'with a placeholder that shows what detail looks like');
// WHERE it sits is the whole point: straight after the two weights, while why
// is still the thing in their head. Asked after three demo screens it gets
// three words.
t(steps.indexOf("k:'weight'") < steps.indexOf("k:'goal_text'"), 'after they have given both weights');
t(steps.indexOf("k:'goal_text'") < steps.indexOf("k:'active'"), 'and before the rest of the questions');
t(steps.indexOf("k:'goal_text'") < steps.indexOf("type:'demo'"), 'well before the demo screens');

console.log('\n  IT CAN BE ANSWERED');
// The gate is _obReady(st) and it reads the answers off _ob.a in the closure,
// so the harness holds that object and the real shipped function is run.
eval(fnAt('_obReady'));
guard(['_obReady'], n=>eval(n));
const say={type:'say', k:'goal_text'};
global._ob={a:{}};
function can(v){ _ob.a={goal_text:v}; return _obReady(say); }
t(can('lose 20 lbs before the wedding')===true, 'a real answer moves on');
t(can('abc')===true, 'three characters is enough - nobody is held writing an essay');
t(!can(''), 'blank does not');
t(!can('   '), 'nor does whitespace');
t(!can('hi'), 'nor two characters');

console.log('\n  IT RENDERS AS SOMEWHERE TO TALK');
const body=fnAt('_obBody');
t(/st\.type==='say'/.test(body), 'the step type draws');
t(/textarea class="obSay"/.test(body), 'as a textarea, not a one-line box');
t(/rows="4"/.test(body), 'four lines tall from the start, so it does not read as a three-word field');
t(/oninput="obSet\(/.test(body), 'and every keystroke is kept');
t(/\.obSay\{/.test(src) && /\.obSay:focus\{/.test(src), 'with its own style');

console.log('\n  AND IT IS SAVED');
const fin=fnAt('obFinish');
t(/goal_text:\(String\(a\.goal_text\|\|''\)\.trim\(\)\|\|null\)/.test(fin),
  'onto the profile row, inside intake_json where every other setup answer lives');
t(fin.indexOf('goal_text') > fin.indexOf('intake_json'), 'inside that object, not beside it as a column that does not exist');
t(!/ALTER TABLE|add column/i.test(fin), 'so it needs no migration to work tonight');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all passed');
process.exit(bad?1:0);
