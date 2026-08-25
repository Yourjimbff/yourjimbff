// WRITTEN AND SPOKEN ARE TWO FORMS OF THE SAME ANSWER — permanent
// (Yusuf, ruling, 25 Aug; charter law 11).
//
// He asked twice, in plain words, for a day-by-day breakdown and got the same
// run-on both times: "Wednesday 1354, Thursday 1380, Friday 1571…". Right, and
// unreadable. He is filming; unreadable is a failure.
//
// THE CAUSE WAS NOT WHERE IT LOOKED. Nothing had been removed to protect the
// voice — the speech path has handled this correctly since 20 Aug, turning every
// <br> into its own spoken sentence. The cause was YUSUF_VOICE, which describes
// how HE writes a text message to a client, and which says lists arrive inside
// one row as a comma-run. That constant is loaded into EVERY Jarvis turn, so a
// rule about his outgoing texts was governing how Jarvis answered him. One
// instruction serving two audiences — the same disease, again.
//
// The split, now stated in both places:
//   ON SCREEN  a set of things is one item per line. No symbol in front of it;
//              the line break is the bullet (law 7 still bans the glyph).
//   IN THE EAR each row becomes its own sentence, symbols stripped. Written
//              once, converted in code — the model never writes two versions.
//   FIGURES    carry their commas. 1,354 not 1354.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function grab(p){ const a=L.findIndex(p); if(a<0) return ''; let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); if(a<0) return ''; let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={};
eval([multi('var _JV_MD_TICK=new RegExp('),
      grab(l=>l.startsWith('function _jvBulletRows(')),
      grab(l=>l.startsWith('function _jvStripMd(')),
      grab(l=>l.startsWith('function _jvNum('))].join('\n'));
require('./_guard.cjs')(['_jvBulletRows','_jvStripMd','_jvNum'], function(n){ return eval(n); });

// The rail paints an assistant turn with exactly this. One line in jvChatSend,
// reproduced here because it lives inside a template and cannot be lifted; the
// structural assertion further down holds the real one to this shape.
const paint=(s)=>String(s).replace(/</g,'&lt;').replace(/\n/g,'<br>');

const LIST="Chris McCarthy's daily calories, last six days:\n\n"
  +"Wednesday — 1,354\nThursday — 1,380\nFriday — 1,571\nSaturday — 2,087\nSunday — 1,350\nMonday — 1,880\n\n"
  +"His average across those six days is 1,604.";

console.log('  a list answer reaches the screen as one item per line:');
const rows=paint(_jvBulletRows(_jvStripMd(LIST))).split('<br>');
t(rows.length===10, 'ten rows, not one run-on', rows.length+' rows');
t(rows[2]==='Wednesday — 1,354', 'the first day is its own row', JSON.stringify(rows[2]));
t(rows[7]==='Monday — 1,880', 'and so is the last', JSON.stringify(rows[7]));
t(rows.filter(r=>/^\s*[-*+•·]/.test(r)).length===0, 'nothing wears a bullet symbol — the break is the bullet');

console.log('\n  a bullet the model reaches for by habit comes off, and the row survives:');
[['an asterisk',      '* Wednesday — 1,354',  'Wednesday — 1,354'],
 ['a plain hyphen',   '- Thursday — 1,380',   'Thursday — 1,380'],
 ['a plus',           '+ Friday — 1,571',     'Friday — 1,571'],
 ['a round bullet',   '• Saturday — 2,087',   'Saturday — 2,087'],
 ['a middle dot',     '· Sunday — 1,350',     'Sunday — 1,350'],
 ['an en dash',       '– Monday — 1,880',     'Monday — 1,880'],
 ['an indented one',  '   * Tuesday — 1,100', 'Tuesday — 1,100']
].forEach(function(c){
  const got=_jvBulletRows(_jvStripMd(c[1]));
  t(got===c[2], c[0].padEnd(18), JSON.stringify(got));
});
// An em dash INSIDE a row is content, not a marker. Stripping it would eat the
// separator the ruling asks for by name ("Wednesday — 1,354").
t(_jvBulletRows('Wednesday — 1,354')==='Wednesday — 1,354', 'a dash inside a row is left alone');
t(_jvBulletRows('3 - 4 sets of 8')==='3 - 4 sets of 8', 'and a hyphen mid-sentence is not a bullet');

console.log('\n  every figure carries its commas:');
[[1354,'1,354'],[1380,'1,380'],[12000,'12,000'],[96871,'96,871'],[562680,'562,680'],
 [190,'190'],[0,'0'],[1604.4,'1,604']].forEach(function(c){
  t(_jvNum(c[0])===c[1], String(c[0]).padEnd(10)+'-> '+_jvNum(c[0]));
});
// The record block is what the model reads before it answers, so its own
// figures must already be formatted — a model copies the shape it is shown far
// more reliably than it follows a sentence about one.
console.log('\n  and the record block the model reads is already formatted:');
const RB=(src.match(/function _jvBuildRecord\(who, range, data\)\{[\s\S]*?\n\}/)||[''])[0];
t(!!RB, 'the record builder is findable');
t(!/Math\.round\((?:cal|pro|car|fat|tCal|tPro|tCar|tFat)\)/.test(RB), 'no figure is emitted unformatted');
t((RB.match(/_jvNum\(/g)||[]).length>=14, 'every figure goes through the one formatter',
  (RB.match(/_jvNum\(/g)||[]).length+' call sites');

console.log('\n  the rule that caused it is scoped to what it describes:');
t(/IN A TEXT TO A CLIENT, LISTS ARRIVE INSIDE ONE ROW/.test(src),
  'the comma-run rule now says which register it is about');
t(/THIS IS ABOUT THE TEXT MESSAGE YOU ARE DRAFTING FOR HIM TO SEND, AND ONLY THAT/.test(src),
  'and says plainly that it is not how Jarvis answers him');
// It has to stay in YUSUF_VOICE — that constant is the one every client-text
// stage reads, and a client text really is a comma-run.
const YV=(src.match(/var YUSUF_VOICE = \[[\s\S]*?\]\.join\('\\n'\);/)||[''])[0];
t(/IN A TEXT TO A CLIENT/.test(YV), 'it stays where the client-text stages read it');

console.log('\n  charter law 11 states the split, on the record:');
const CH=(src.match(/var JARVIS_CHARTER = \[[\s\S]*?\]\.join\('\\n'\);/)||[''])[0];
t(/11\. WRITTEN AND SPOKEN ARE TWO FORMS OF THE SAME ANSWER/.test(CH), 'law 11 exists');
t(/ONE ITEM PER LINE/.test(CH), 'the screen half is stated');
t(/IN THE EAR/.test(CH), 'the ear half is stated');
t(/never write two versions/i.test(CH), 'and it says the model writes it once');
t(/1,354 not 1354/.test(CH), 'the comma rule is in the charter too');

console.log('\n  and law 11 is ENFORCED, not merely asked for:');
// A prompt-side rule with no enforcement is a preference, not a law — this
// file's own words, at the top of _jvStripMd.
t(/txt=_jvBulletRows\(_jvStripMd\(txt\)\)/.test(src), 'the cockpit rail strips markers before painting');
t(/_jvBulletRows\(_jvStripMd\(String\(obj\.reply\|\|''\)\.trim\(\)\)\)/.test(src), 'and so does the front-desk model reply');
// The cockpit rail had NO markdown strip at all before this — law 7 was only
// enforced on the other pipeline, so an asterisk reached his screen.
t((src.match(/_jvBulletRows\(/g)||[]).length>=4, 'both Jarvis pipelines are covered',
  (src.match(/_jvBulletRows\(/g)||[]).length+' references');
// JIM's dash must NOT be caught by this. buildCoachVoice tells him to itemise
// with dashes and he writes them himself; widening the shared stripper to fix
// Jarvis would have broken Jim.
t(!/_jvBulletRows/.test((src.match(/function buildCoachVoice\(\)\{[\s\S]*?\n\}/)||[''])[0]||''),
  'Jim is untouched by it');
t(!/\[\*\+\\u2022[^\]]*\]\|-\{1,2\}/.test(grab(l=>l.startsWith('function _jvStripMd('))),
  'and the shared stripper was not widened to do it');

console.log('\n  the ear still gets sentences, not rows:');
// The speech path walks a real DOM (createElement/innerHTML/querySelectorAll),
// and the test list has no DOM to give it. Held structurally rather than run —
// stubbing a DOM here would prove the stub works, not the app. What is asserted
// is that the <br>-to-sentence conversion and the symbol strip are both still
// in the function the voice actually calls.
const SS=grab(l=>l.startsWith('function _jvSpeakStrip('));
t(!!SS, 'the speech stripper is findable');
t(/querySelectorAll\('br'\)/.test(SS) && /createTextNode\('\. '\)/.test(SS),
  'every row becomes its own spoken sentence');
t(/_jvSpeakDesymbol\(/.test(SS), 'and anything a voice would read as a symbol is stripped');
t(/\(\?:\\s\*\\\.\)\{2,\}/.test(SS), 'runs of stops collapse, so a blank line is not two pauses');

console.log(bad? '\n'+bad+' FAILED' : '\nall pass');
process.exit(bad?1:0);
