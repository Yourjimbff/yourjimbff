// YOU CAN SEE WHO YOU ARE TALKING TO.
//
// Yusuf, 13 Sep: "when i hit the jim chat bubble i dont see that im typing to
// jim, there should be a jim header of sorts" and "jim chat nav tab header
// should say your AI logging assistant".
//
// The bubble opened a sheet headed "Log anything / Say what you ate, trained,
// or did" -- which describes the BOX and never names the person on the other
// end of it. The Jim tab had his name but called him a "smart logger", which
// is a description of a feature rather than of a thing you talk to.
//
// Two surfaces, one identity: the same gold name, the same one-line role. A
// client who meets Jim in the bubble and again in the tab should not have to
// work out that they are the same.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };
function slice(a,b){ const i=src.indexOf(a); if(i<0) return ''; const j=src.indexOf(b,i); if(j<0) throw new Error('stale end anchor, this suite was reading the rest of the file: '+b); return src.slice(i,j); }

console.log('\n  THE ROLE IS ONE SENTENCE, AND IT IS HIS:');
t(/Your AI logging assistant/.test(src), 'the words he gave are in the file');
t(!/Your smart logger/.test(src), 'and "smart logger" is gone');
t((src.match(/Your AI logging assistant/g)||[]).length===2,
  'it appears exactly twice - once on each surface',
  (src.match(/Your AI logging assistant/g)||[]).length);

console.log('\n  THE JIM TAB:');
const tab=slice('<div class="chat-header jimHd" id="askChatHeader">','<div class="chat-scroll"');
t(/<div class="jimHdT">Jim<\/div>/.test(tab), 'still says Jim, in gold, at the top');
// 15 Sep: the second sentence now NAMES THE INPUTS. Lauren Burnam did not know
// a screenshot was something he could read, so she pasted a whole training plan
// by hand to get one run logged. "Tell me your day" was true and told her
// nothing. His phrase - "Your AI logging assistant" - is untouched.
/* v558 took the em dashes out of the display strings, house law, and left these
   two lines asserting the dash. The copy they guard is unchanged in every word. */
/* 19 Sep: the line now names the five things he takes and invites the question. */
t(/Your AI logging assistant\. Food, training, weight, steps, a photo or a screenshot\. Ask me how I work\./.test(tab),
  'and now says what he is underneath, naming what he can take');

console.log('\n  THE CHAT BUBBLE:');
const sheet=slice('<div id="slogPanel"','<div id="slogBody"');
t(/>Jim<\/div>/.test(sheet), 'the sheet names him');
t(/color:var\(--gold\)/.test(sheet), 'in the same gold the tab uses');
t(/font-family:'Plus Jakarta Sans'/.test(sheet), 'and the same face');
t(/Your AI logging assistant\. Say what you ate or trained, or send a photo or a screenshot\./.test(sheet),
  'with the same role underneath, in this surface’s own words, inputs named');
t(!/>Log anything<\/div>/.test(sheet), '"Log anything" is gone - it named the box, not the person');
t(/onclick="closeSmartLog\(\)"/.test(sheet), 'and the way out is still the first thing in the row');

console.log('\n  NEITHER ONE IS A DECORATION:');
/* Gold means action, never decoration -- but a name in gold is the app's own
   convention for Jim specifically (.jimHdT), and this is the same name. */
t(/\.jimHdT\{[^}]*color:var\(--gold\)/.test(src), 'the gold name is the rule the tab already set');
t(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(sheet), 'no emoji in the header, house law');

console.log(bad? ('\n  '+bad+' FAILED\n') : '\n  all good\n');
process.exit(bad?1:0);
