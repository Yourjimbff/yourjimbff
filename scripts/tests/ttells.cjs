// THE TELLS (Yusuf, 5 Sep). A rule nobody checks is a rule that gets broken.
//
// Three of his voice rules failed in ONE batch of five drafts today, and he
// caught every one of them rather than the machine:
//   "not more dicipline... is dead ai giveaway"
//   "stop quoting them... its the EFFORT of trying to make the human feel
//    heard thats the dead giveaway of AI"
//   a draft that described his own client's screen back at him, wrongly
//
// Every fixture below is a REAL draft that went on the board today, or a real
// line from his own outgoing texts that must never be flagged.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const MINE=['_dfTells','_dfTellsHtml'];
eval(closure([]).code||'');
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

const has=(txt,tag)=>(_dfTells(txt)||[]).some(x=>x.indexOf(tag)>=0);

// ===== THE THREE THAT GOT THROUGH TODAY ================================
console.log('\n  THE ONES HE HAD TO CATCH HIMSELF:');
t(has("Feet before legs. Thats a walkers problem, not a lifters one",'x-is-not-y'),
  'Blake: "thats a walkers problem, not a lifters one"');
t(has("a sugar craving is your body asking for the calories you took out. Its not a willpower problem",'x-is-not-y'),
  'Maisha: "its not a willpower problem"');
t(has('Trained: Pull — “The delt flies were so much harder than j thought”','quotes them back'),
  'the catch up quoting a client back at themselves');

// ===== THE ONE THAT GOT THROUGH ON 6 SEP ===============================
// Chris McCarthy's card, drawn by the batch screen with the linter running on
// it, and the linter said nothing. He did: "chris mcarthy has an ai dead
// giveaway and its not mentioned in the thing."
console.log('\n  THE BARE X-NOT-Y, NO COMMA AND NO "ITS":');
t(has("1,352 and 114g average, thats a real cut not a crash one",'x-is-not-y'),
  'Chris: "a real cut not a crash one"');
t(has("i want the honest version not the polite one",'x-is-not-y'),
  'Chris: "the honest version not the polite one"');
t(has("thats a food thing not a math thing",'x-is-not-y'), 'a food thing not a math thing');
t(has("thats the whole job not just a number",'x-is-not-y'), '"not just" counts too');
// AND THE GUARD. Ordinary negation is not the tell, and flagging it would
// teach him to ignore the flags.
t(!has("the answer is not a big deal",'x-is-not-y'), 'HOLDS: "the answer is not a big deal" is ordinary speech');
t(!has("hows the week been? the gym was not a priority i guess",'x-is-not-y'), 'HOLDS: "was not a priority"');
t(!has("your protein has not been a problem lately",'x-is-not-y'), 'HOLDS: "has not been"');
t(!has("thats the plan",'x-is-not-y'), 'HOLDS: no negation at all');
t(!has("nice work this week",'x-is-not-y'), 'HOLDS: a clean short text');

// ===== AND THE REST OF HIS RULES =======================================
console.log('\n  THE REST OF THE RULES:');
t(has("Locked — sunday 11am",'em dash'), 'an em dash, which appears zero times in 1,545 of his texts');
t(has("Hows the gym been? Whats today looking like? Free friday?",'question stack'), 'three questions is a stack');
t(has("Hows the gym been? Whats today looking like?",'question stack'), 'and two in ONE line is a stack too');
t(!has("Howve you been?\n\nProgress been looking good? Or has it not",'question stack'),
  'but two across two lines is how he actually writes, and he sent that one');
t(has("Nine days straight, keep it up",'phrase he never uses'), 'a phrase he has never once used');
t(has("So you had a rough week then",'repeats them back'), 'the repeat-back opener');
t(has(new Array(50).join('word ')+'end','one block too long'), 'a paragraph, when his median text is seven words');

// ===== WHAT MUST NEVER BE FLAGGED ======================================
// Every line here is his own, out of the thread export or a draft he approved.
console.log('\n  HIS ACTUAL VOICE, WHICH MUST COME BACK CLEAN:');
const CLEAN=[
  "179.7. I logged it in the app for you\n\nFirst weight on your record. Same time every morning from here and that line starts telling us something",
  "Weigh in\n\nMake me a sticker and you get a pass",
  "Howve you been?\n\nProgress been looking good? Or has it not",
  "You cant do both, pick building\n\n130 did its job. The butt only comes back on more food\n\nIll set your number today",
  "Thats what im talking about",
  "Dusty how you living ripped man, still looking like my twin?",
  "Ok imma whoop the apps ass. I fell asleep working on it",
  "Rest the feet\n\nWeigh in for me when youre home. Hows the body feeling overall?"
];
CLEAN.forEach(function(c){
  const f=_dfTells(c);
  t(f.length===0, 'clean: '+c.split('\n')[0].slice(0,46), f.join(', '));
});

// A SHORT QUOTE IS FINE. Three words is his ceiling, so three stays.
console.log('\n  THE QUOTE CEILING:');
t(!has('you said “locked in” and i believed you','quotes them back'), 'two quoted words is allowed');
t(has('your words were “get my act together”','quotes them back'), 'four quoted words is over his three word ceiling');
t(has('you told me “i really need to get my act together this month”','quotes them back'),
  'but a whole sentence of theirs is the tell');

// ===== IT MARKS, IT NEVER BLOCKS =======================================
console.log('\n  IT MARKS, IT NEVER BLOCKS:');
const src=fs.readFileSync('index.html','utf8');
t(!/_dfTells\([^)]*\)[^;]*return false/.test(src), 'nothing gates a send on it');
const q=src.slice(src.indexOf('function _crmBatchQueue(){'), src.indexOf('function crmBatchOpen('));
t(!/_dfTells/.test(q), 'the batch queue does not drop a flagged draft - his thumb is still the decision');
t((src.match(/\+ _dfTellsHtml\(d\.text\)/g)||[]).length===2, 'and it is drawn on BOTH surfaces',
  String((src.match(/\+ _dfTellsHtml\(d\.text\)/g)||[]).length));
t(_dfTellsHtml('')==='' && _dfTellsHtml("Thats what im talking about")==='', 'a clean draft draws nothing at all');
t(/dfTells span\{/.test(src) && !/\+'\.dfTells span\{[^']*\n/.test(src), 'styled, one quoted line per rule');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all tells assertions pass');
process.exit(0);
