// THREE THINGS A DAY — the free app's Day page.
//
// Yusuf, 12 Sep, off the mock-ups: "Three things a day. That's the whole app.
// I fucking love that... I love the welcome. I love the evening, Yusuf...
// Headers that carry the day. That's gorgeous." And: "Once you do training
// and some steps you should get some sort of satisfaction. Same thing with
// eating. Once you've logged weight, you should get satisfaction."
//
// Free app only. Nothing new is fetched: every number on a chapter head is one
// the page already had. Coaching clients keep Workout / Food / Body untouched.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const {closure}=require('./_lift.cjs');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

console.log('\n  THE HEAD IS ONE HELPER:');
const CL=closure(['_tlChapterHead','_tlGreeting','_escHtml','_localYmd']);
t(!CL.unparsable || !CL.unparsable.length, 'the helpers lift cleanly', JSON.stringify(CL.unparsable||[]));
global.window={}; global.cl={code:'freeuser',name:'Free User'}; global.profile={};
eval(CL.code||'');
/* The lifter chases _meFreeApp into isFreeApp into TRAINER_CODES, which is not
   here. The stub goes on AFTER the eval so it is the one that answers. */
_meFreeApp=()=>true;
/* The lift declares its own `var cl` and `var profile`, which shadow the
   globals set above. Assign without `global.` so the lifted ones are set. */
cl={code:'freeuser',name:'Free User'}; profile={};
const h=_tlChapterHead('Eat','410 of 1,980 cal',true,false);
t(/class="tlMealsHead tlCh done"/.test(h), 'a chapter with something logged is marked done');
/* NO NUMBERS (Yusuf, 12 Sep: "I don't think that we should be putting in a
   numbered list on the front page. Like one train, two eat, three track."). */
t(!/tlChN/.test(h), 'it is NOT numbered');
t(!/>1<|>2<|>3</.test(h), 'and carries no chapter number in any other shape');
t(/<span class="tlChT">Eat<\/span>/.test(h), 'it is a verb');
t(/<span class="tlChS">410 of 1,980 cal<\/span>/.test(h), 'and the number rides the right side');
const h2=_tlChapterHead('Train','Push \u00b7 5 exercises',false,true);
t(/tlChS gold/.test(h2) && !/ done/.test(h2), 'a chapter with something to do is gold on the right and not done');
t(!/[\u{1F300}-\u{1FAFF}]/u.test(h+h2), 'no emoji, house law');

console.log('\n  THE GREETING:');
cl={code:'freeuser',name:'Yusuf Richardson'};
const done=new Date(); done.setHours(9,0,0,0);
profile={intake_json:JSON.stringify({done_at:done.toISOString()})};
const g=_tlGreeting('x',null,true);
t(/<b>Yusuf<\/b>/.test(g), 'first name only');
t(/Day one\./.test(g), 'day one on the day they set up');
t(/(Morning|Afternoon|Evening), /.test(g), 'and the time of day');
t(/Push day\./.test(_tlGreeting('x',{type:'Push',ex:[]},true)), 'with a program, it names the session');
t(/Rest day\./.test(_tlGreeting('x',{type:'Rest',ex:[]},true)), 'or the rest');
t(_tlGreeting('x',null,false)==='', 'and never on a past day');
_meFreeApp=()=>false;
t(_tlGreeting('x',null,true)==='', 'and never for a coaching client');
_meFreeApp=()=>true;
const eight=new Date(); eight.setDate(eight.getDate()-8); eight.setHours(20,30,0,0);
profile={intake_json:JSON.stringify({done_at:eight.toISOString()})};
t(/Day 9\./.test(_tlGreeting('x',null,true)), 'eight days after setup is day 9, counted in local days');

console.log('\n  WIRED INTO THE DAY, FREE APP ONLY:');
const sec=slice('function _tlDaySectionHtml(cur, ctx){','function _tlBuildCtx');
t(/\(\(isToday && _meFreeApp\(\)\) \? cur\.toLocaleDateString\('en-US',\{weekday:'long'\}\) : _tlDayLabel\(cur\)\)/.test(sec),
  'today is its weekday name for a free user, Today for everyone else');
t(/html\+=_tlGreeting\(ds, plan, isToday\);/.test(sec), 'the greeting sits under it');
t(/var _woDone=rows\.some\(function\(r\)\{ return r\.completed; \}\);/.test(sec), 'Train reads whether the session is completed');
t(/_tlChapterHead\('Train'/.test(sec), 'Train');
t(/\(slots\.workout\|\|\[\]\)\.length \|\| \(slots\.walk\|\|\[\]\)\.length\)\) _woDone=true;/.test(sec),
  'and cardio or a walk counts as training done - "training and some steps"');
t(/var _stp=_stepsFor\(ds\); if\(_stp>0\) _woDone=true;/.test(sec), 'and so do steps, on today');
/* IT SAYS NOTHING NOW (Yusuf, 13 Sep). "Nothing built yet" sat over a card
   that is an open log, so the head was contradicting the invitation directly
   under it -- and it is the same "you are behind" voice he had already cut out
   of Jim the day before. A person with no program is not behind; they are
   someone who logs what they do. */
t(!/'Nothing built yet'/.test(src), 'the head passes no judgement on a day with no program');
t(/: ''\);/.test(sec), 'it simply says nothing');
t(/_woDone \? 'Done'/.test(sec), 'while a day that WAS trained still says Done');
t(/_woHas \? \(_escHtml\(plan\.type\)/.test(sec), 'and a day with a program still names it');
t(/_tlChapterHead\('Eat',_eatSt,cal>0,false\)/.test(src), 'Eat, done once anything is logged');
t(/Math\.round\(cal\)\.toLocaleString\(\)\+' of '\+_tgt\.toLocaleString\(\)\+' cal'/.test(src), 'and it reads X of target');
t(/_tlChapterHead\('Track',_trSt,_todayW,false\)/.test(src), 'Track, done once they weighed today');
t(/_localYmd\(_lastAt\)===_localYmd\(_parseDs\(ds\)\|\|new Date\(\)\)/.test(src), 'today decided in local days, not UTC');
/* The coaching client's heads are the same strings they were. */
t(/<span class="tlMealsEy">Workout<\/span>/.test(src) && /<span class="tlMealsEy">Food<\/span>/.test(src) && /<span class="tlMealsEy">Body<\/span>/.test(src),
  'Workout / Food / Body still exist for coaching clients');

console.log('\n  SATISFACTION, QUIETLY:');
/* The badge the gold used to live on is gone, so the whole line carries it. */
t(!/\.tlChN\{/.test(src), 'there is no badge left to fill');
t(/\.tlCh\.done \.tlChT\{color:var\(--gold\);\}/.test(src), 'a done chapter warms its title');
t(/\.tlCh\.done \.tlChS\{color:var\(--gold\);\}/.test(src), 'and its status with it');
t(/transition:color \.18s ease/.test(slice('.tlChT{','}')), 'and it moves, briefly');

console.log('\n  ONE SCALE:');
t(/document\.body\.classList\.toggle\('free', _meFreeApp\(\)\)/.test(src), 'the body knows it is the free app');
t(/body\.free \.tlHeroName\.long\{font-size:26px/.test(src), 'the build card is 26');
t(/body\.free \.dwCard \.pgN\{font-size:26px/.test(src), 'and so is the weight number');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good (three things a day)\n');
process.exit(bad?1:0);
