// THE WARM-UP, AND IT IS THEIRS TO WRITE.
//
// Yusuf, 12 Sep: "we are also absolutely welcome to add a warm-up section that
// the user can create on their own. No placeholder text. Just to be a small
// understated line, add warm-ups, and then it's like, you know, it could be a
// walk, and that's one thing. It could be free text. They could attach it to
// something that they could do, five-minute bike, hip mobility routine, etc.
// Bands, they're absolutely welcome to."
//
// So the test is mostly about what is NOT there: no placeholder, no example, no
// suggested warm-up, no list to pick from. One quiet line, and a plain box.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); return i<0?'':src.slice(i, src.indexOf(b,i)); }

const html=slice('function _woWarmHtml(ds, dr){','function tlWoTime(ds, v)');
t(html.length>200 && html.length<1600, 'the warm-up line is where this test says it is', String(html.length));

console.log('\n  NOTHING IS SUGGESTED TO THEM:');
t(!/placeholder/i.test(html), 'the box carries no placeholder');
t(!/(5|five)[- ]?min/i.test(html) && !/bike|mobility|bands|treadmill|stretch/i.test(html),
  'and no example warm-up is printed anywhere in it');
t(!/<select|<option|data-warm-preset/i.test(html), 'there is no list to pick from - it is free text');
t(/<textarea/.test(html), 'it is a plain box they type into');

console.log('\n  SHUT, IT IS ONE SMALL LINE:');
t(/>Add warm-up<|'Add warm-up'/.test(html), 'the line says "Add warm-up" and nothing else');
t(/style="display:none;/.test(html), 'and the box is closed until they tap it');
const css=slice('.woWarm{','.tlModePick{');
t(/\.woWarmAdd\{[^}]*font-size:12\.5px/.test(css), 'the invitation is small');
t(/\.woWarmAdd\{[^}]*color:var\(--m2\)/.test(css), 'and muted, not competing with the session');
t(!/border/.test(slice('.woWarmAdd{','.woWarmAdd:active')), 'with no box drawn around it');

console.log('\n  ONCE WRITTEN, THE LINE IS THEIR WORDS:');
t(/w\?_escHtml\(w\):'Add warm-up'/.test(html),
  'the row prints what they wrote instead of the invitation');
t(/\.woWarmSaid\{[^}]*color:var\(--text\)/.test(css), 'in normal ink, because now it is information');
t(/lbl\.textContent = d\.warm\.trim\(\) \? d\.warm\.trim\(\) : 'Add warm-up'/.test(src),
  'and the row updates the moment they save, without a repaint');

console.log('\n  IT SITS ABOVE THE FIRST EXERCISE, ON BOTH SIDES:');
t((src.match(/\+_woWarmHtml\(ds, dr\)/g)||[]).length===2,
  'both the programmed session and creative mode have it',
  String((src.match(/\+_woWarmHtml\(ds, dr\)/g)||[]).length));
const body=slice("s+='<div id=\"tlBody_'+_escHtml(ds)+'\"", '+_tpFinBlock(dayKey, ds)');
t(body.indexOf('_woWarmHtml') < body.indexOf('_bfExCard'),
  'and it is drawn BEFORE the exercises, which is where a warm-up goes');

console.log('\n  AND IT LANDS ON THE RECORD:');
const done=slice('var _wu=String(dr.warm||\'\').trim()', 'var desc=lines.join');
t(/lines\.unshift\('Warm-up: '\+_wu\)/.test(done), 'it goes on the workout as its own line');
t(done.indexOf('unshift')>0, 'at the TOP of what they did, not the bottom');
t(/if\(_wu\)/.test(done), 'and an empty one writes nothing at all');
t(/everything after the LAST blank line[\s\S]{0,60}note/.test(src),
  'the note still reads back correctly, which is why the warm-up is not put after the blank line');

console.log('\n  IT IS SAVED THE SAME WAY THE NOTE IS:');
t(/function tlWoWarm\(ds, v\)\{\s*\n\s*var d=_woDraft\(ds\); d\.warm=/.test(src),
  'one line on the day draft, no new store invented');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good\n');
process.exit(bad?1:0);
