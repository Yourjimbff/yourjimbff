// "The feedback opt in for Jim, shouldnt it be on the main page? and then it
// should be somewhere you can manage it later." (Yusuf, 16 Sep.)
//
// v474 built the five settings and the do-not-critique switch and gave them no UI
// at all, so nobody could reach any of it. Two surfaces, one setting: the main
// page asks once in three plain choices, Settings carries the whole dial.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

let painted='';
global.window={};
global.localStorage={_d:{},getItem(k){return this._d[k]==null?null:this._d[k];},setItem(k,v){this._d[k]=String(v);}};
global._escHtml=x=>String(x);
global.cl={code:'freeguy'};
global.isTrainer=c=>c==='thegoat';
global.setTimeout=()=>{};
global.renderGoalsPage=()=>{};
global.document={getElementById:id=>(id==='jimVoiceAsk'?{set innerHTML(v){painted=v;},get innerHTML(){return painted;}}:null)};
eval(src.match(/var _JIM_SPARK='[\s\S]*?';\n/)[0]);
eval(src.match(/var _JIM_TONE_KEY=[^\n]*\n/)[0]);
eval(src.match(/var JIM_TONES=\[[\s\S]*?\];\n/)[0]);
eval(src.match(/var JIM_TONE_DEFAULT=\d+;/)[0]);
eval(src.match(/var JIM_CLASH_LB=\d+;/)[0]);
eval(src.match(/var _JIM_ASKED_KEY=[^\n]*\n/)[0]);
const MINE=['_jimTurboUnlocked','_jimTone','_jimToneSet','_jimNoCritique','_jimNoCritiqueSet','_jimToneName',
            '_jimAsked','_jimAskDone','_jimAskHtml','_jimVoicePick','_jimAskPaint','_jimSetTone','_jimSetNoCrit'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

console.log('\n  THE MAIN PAGE ASKS, ONCE:');
t(/id="jimVoiceAsk"/.test(src), 'there is a host on the Today page');
t(/if\(t==='Today'\)\{ try\{ _jimAskPaint\(\); \}catch\(e\)\{\} \}/.test(src), '  painted when they open it');
painted=''; t(_jimAskPaint()===true, 'a client who has never answered gets asked');
t(/Go easy/.test(painted) && /Straight up/.test(painted) && /Just the facts/.test(painted),
  '  three choices, not five');
t(!/Turbo roast/.test(painted), '  and turbo is nowhere near a first morning');
t(!/No excuses/.test(painted), '  nor is no excuses');
t(/change this any time in Settings/i.test(painted), '  and it says where to change it');

console.log('\n  ANSWERING IS ITS OWN STATE:');
t(_jimAsked()===false, 'not asked yet, even though the tone already reads 3');
t(_jimTone({})===3, '  because 3 is the default, not an answer', String(_jimTone({})));
_jimVoicePick(3,false);
t(_jimAsked()===true, 'picking the default still counts as answered');
painted=''; t(_jimAskPaint()===false, '  so they are never asked again');
t(painted==='', '  and the space is cleared rather than left holding a card');

console.log('\n  EACH CHOICE LANDS:');
global.localStorage._d={};
_jimVoicePick(1,false);
t(_jimTone({})===1 && _jimNoCritique({})===false, 'go easy sets tone 1');
global.localStorage._d={};
_jimVoicePick(0,true);
t(_jimNoCritique({})===true, 'just the facts turns the switch on');
t(_jimTone({})===3, '  and leaves a sane tone underneath for when they turn it off', String(_jimTone({})));

console.log('\n  THE TRAINER IS NOT ASKED:');
global.localStorage._d={}; global.cl={code:'thegoat'}; painted='x';
t(_jimAskPaint()===false, 'he reads every client’s meals, not his own tone');
t(painted==='', '  and the space is cleared');
global.cl=null;
t(_jimAskPaint()===false, 'and nobody signed in is refused cleanly');

console.log('\n  SETTINGS CARRIES THE WHOLE DIAL:');
t(/function _gpSecJim\(\)/.test(src), 'there is a settings card');
t(/try\{ html\+=_gpSecJim\(\); \}catch\(e\)\{\}/.test(src), '  rendered on the settings page');
t(/How Jim talks to you/.test(src), '  named for what it does');
t(/Do not critique me/.test(src), 'the switch is on it');
t(/Facts about the food\. No advice, ever\./.test(src), '  described honestly');
t(/jimSetList\.dim\{opacity/.test(src) && /pointer-events:none/.test(src),
  'and the five are dimmed and unclickable while that switch is on');
t(/o\.n===5 && !_jimTurboUnlocked\(\)/.test(src), 'turbo shows as locked rather than missing');
t(/'soon'/.test(src), '  and says soon rather than pretending it is not there');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (asked once, changeable forever)');
process.exit(bad?1:0);
