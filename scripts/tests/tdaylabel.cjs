// EVERY DAY JIM NAMES MUST ARRIVE ALREADY NAMED (Harrison, 19 Sep 2026).
//
// He asked the app for his totals at 9:57am ET on Saturday the 19th. It called
// that day "Today (Sep 20)" and Friday "Yesterday (Sep 19)" — both one day
// ahead — while every number beside them was right. The numbers came from the
// context; the day names did not. The context handed the model a list of bare
// dates ("Sep 18, 2026:") and one line saying what today was, and left it to do
// the subtraction. It got it wrong by one.
//
// So this suite holds the shape of the cure: _jimDayLabel names the day itself,
// and it is the thing every day heading in buildDayContext goes through.
const fs=require('fs');
const src=fs.readFileSync(process.argv[2]||'index.html','utf8');
const L=src.split('\n');

function liftFn(name){
  const i=L.findIndex(l=>l.startsWith('function '+name+'('));
  if(i<0) fail(name+' not found — the day-label seam moved');
  let d=0, started=false;
  for(let j=i;j<L.length;j++){
    for(const c of L[j]){ if(c==='{'){d++;started=true;} else if(c==='}'){d--;} }
    if(started && d===0) return L.slice(i,j+1).join('\n');
  }
  fail('no close for '+name);
}
let bad=0;
function fail(m){ console.log('FAIL: '+m); bad++; }
function ok(m){ console.log('  ok  '+m); }

// ---- the clock is pinned: Saturday 19 September 2026, 9:57am, Harrison's hour.
const REAL=Date;
class FakeDate extends REAL {
  constructor(...a){ if(!a.length) super(2026,8,19,9,57,0); else super(...a); }
  static now(){ return new REAL(2026,8,19,9,57,0).getTime(); }
}
global.Date=FakeDate;
eval(liftFn('_jimDayLabel'));

// ---- 1. the day Harrison actually asked about
const cases=[
  ['Sep 19, 2026', /^TODAY, /,        'today is named TODAY'],
  ['Sep 18, 2026', /^YESTERDAY, /,    'the day before is named YESTERDAY'],
  ['Sep 17, 2026', /^2 days ago, /,   'two back counts, it does not guess'],
  ['Sep 12, 2026', /^7 days ago, /,   'a week back counts'],
];
cases.forEach(function(c){
  const out=_jimDayLabel(c[0]);
  if(c[1].test(out)) ok(c[2]+'  ->  '+out);
  else fail(c[2]+' — got "'+out+'"');
});

// ---- 2. THE BUG ITSELF. Every label must carry the date it was given, never
// the next one. This is the assertion that would have caught Harrison's.
[['Sep 19, 2026','Sep 19'],['Sep 18, 2026','Sep 18'],['Sep 17, 2026','Sep 17']].forEach(function(p){
  const out=_jimDayLabel(p[0]);
  if(out.indexOf(p[1])<0) fail('label for '+p[0]+' lost its own date: "'+out+'"');
  else if(/Sep 20/.test(out)) fail('label for '+p[0]+' is a day ahead: "'+out+'"');
  else ok(p[0]+' keeps its own date');
});

// ---- 3. a Date object works as well as a date_str (RECENT WEIGHTS passes one)
if(/^TODAY, /.test(_jimDayLabel(new REAL(2026,8,19,14,0,0)))) ok('a Date object is labelled like a date_str');
else fail('a Date object is not labelled: "'+_jimDayLabel(new REAL(2026,8,19,14,0,0))+'"');

// ---- 4. rubbish in never invents a day
if(_jimDayLabel('')==='') ok('empty stays empty');
else fail('empty invented something: "'+_jimDayLabel('')+'"');
if(_jimDayLabel('unknown')==='unknown') ok('an unparseable key is passed through untouched');
else fail('an unparseable key was mangled: "'+_jimDayLabel('unknown')+'"');

// ---- 5. late in the evening, when UTC has already rolled over and the client
// has not. This is branch B of the discriminating test and it must stay right.
global.Date=class extends REAL {
  constructor(...a){ if(!a.length) super(2026,8,19,22,30,0); else super(...a); }
  static now(){ return new REAL(2026,8,19,22,30,0).getTime(); }
};
eval(liftFn('_jimDayLabel'));
if(/^TODAY, .*Sep 19/.test(_jimDayLabel('Sep 19, 2026'))) ok('10:30pm local is still TODAY, Sep 19 — not tomorrow');
else fail('the evening rolled the label forward: "'+_jimDayLabel('Sep 19, 2026')+'"');
global.Date=FakeDate;

// ---- 6. THE WIRING. A correct helper nothing calls is worth nothing, so every
// day heading that reaches the model is checked for it by source.
const wiring=[
  ["var tBits=['=== TODAY\\'S FOOD ('+_jimDayLabel(todayDateStr)+') ==='];", "today's food header"],
  ["rfBits.push(_jimDayLabel(ds)+':');",                                      "recent food day headings"],
  ["lBits.push(_jimDayLabel(k)+': '",                                          "last 7 days (food)"],
  ["ckBits.push(_jimDayLabel(k)+': '+summary);",                               "last 7 days (energy/mood)"],
  ["var dt=w.logged_at?_jimDayLabel(new Date(w.logged_at)):'';",               "recent weights"],
  ["var dayLabel = _jimDayLabel(w.date_str || d);",                            "recent workouts"],
];
wiring.forEach(function(w){
  if(src.indexOf(w[0])>=0) ok('wired: '+w[1]);
  else fail('NOT wired — '+w[1]+' still prints a bare date');
});

// ---- 7. the model is told, in the prompt, not to count days itself
if(/NEVER COUNT DAYS YOURSELF/.test(src)) ok('the context forbids the arithmetic');
else fail('the CURRENT DATE & TIME block no longer forbids date arithmetic');
if(/NEVER DO DATE ARITHMETIC/.test(src)) ok('the boundaries forbid the arithmetic');
else fail('the BOUNDARIES rule against date arithmetic is gone');
if(/"Yesterday" always means/.test(src)) ok('yesterday is named outright, not left to be derived');
else fail('the context no longer names yesterday');

console.log(bad ? ('\nFAIL — '+bad+' problem'+(bad===1?'':'s')) : '\nPASS — tdaylabel');
process.exit(bad?1:0);
