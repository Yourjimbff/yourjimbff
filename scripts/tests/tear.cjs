// READ THEM TO ME (Yusuf, 5 Sep) — the batch send reads each draft out loud.
//
//   "how can i play the drafts, like litrally just listen, approve, and go."
//
// Fifty three drafts is fifty three things to read, and the reading is the
// chore. This tests the speech layer against the shipped code: what it says,
// what it does NOT say, when it shuts up, and that it can never take a send
// down with it.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ===== THE PAGE THIS RUNS IN ===========================================
const STORE={};
global.localStorage={ getItem:k=>(k in STORE?STORE[k]:null), setItem:(k,v)=>{STORE[k]=String(v);}, removeItem:k=>{delete STORE[k];} };
let SPOKEN=[], CANCELS=0, VOICES=[];
class Utt{ constructor(txt){ this.text=txt; } }
global.window={
  SpeechSynthesisUtterance:Utt,
  speechSynthesis:{ cancel(){ CANCELS++; }, speak(u){ SPOKEN.push(u); }, getVoices(){ return VOICES; } }
};
global.SpeechSynthesisUtterance=Utt;
global.navigator={ language:'en-US' };
const EL={};
global.document={ getElementById:id=>EL[id]||null };

const MINE=['_dfReadDraft','_CB_EAR_KEY','_cbEarAble','_cbEarOn','_cbEarSet','_cbStop','_cbSpeakText','_cbSay','_cbSayCurrent','cbEarToggle','cbEarReplay','_cbEarBar'];
eval(closure([]).code || '');
eval(require('./_lift.cjs').defOf ? MINE.map(require('./_lift.cjs').defOf).join('\n') : '');
guard(MINE, n=>eval(n));

// The two doors the voice layer reaches into. Replaced AFTER the lift so the
// eval cannot overwrite them.
let CUR=null;
global._crmBatch=null;
global._crmFind=id=>(CUR&&CUR.id===id)?CUR:null;
global._crmBatchPaint=function(){};

// ===== OFF UNTIL HE TURNS IT ON ========================================
console.log('\n  IT IS OFF UNTIL HE ASKS:');
t(_cbEarAble()===true, 'the browser can speak, so the toggle is offered');
t(_cbEarOn()===false, 'and it is OFF with nothing stored — nothing speaks unasked');
_cbEarSet(true);
t(_cbEarOn()===true, 'his choice is remembered on this device', STORE[_CB_EAR_KEY]);
_cbEarSet(false);
t(_cbEarOn()===false, 'and turning it off is remembered too');

// A browser with no speech never shows the button and never throws.
const realWin=global.window;
global.window={};
t(_cbEarAble()===false, 'a browser with no speech says so');
t(_cbEarOn()===false, 'and can never be on');
t(_cbEarBar()==='', 'so the row is not drawn at all');
let threw=false; try{ _cbStop(); _cbSay('A','b'); }catch(e){ threw=true; }
t(!threw, 'and speaking on it is a no-op, never an exception');
global.window=realWin;

// ===== WHAT IT SAYS IS NOT WHAT IT SENDS ===============================
// The message that goes to the client is never touched; this is the ear only.
console.log('\n  READ FOR THE EAR, NOT FOR THE WIRE:');
const raw="Nine days straight\n\n1,230 cal and 80g protein\n\nEggs · Toast\nhttps://yourjimbff.netlify.app/";
const said=_cbSpeakText(raw);
console.log('    | '+said);
t(/80 grams protein/.test(said), 'grams is said as grams, not "gee"', said);
t(/1,230 calories/.test(said), 'and cal is said as calories');
t(/Eggs, Toast/.test(said), 'the dot separator becomes a breath');
t(!/https?:/.test(said) && /link/.test(said), 'a URL is not spelled out character by character');
t(said.indexOf('\n')<0, 'no newline survives into speech');
t(raw.indexOf('80g protein')>=0, 'AND THE ORIGINAL IS UNTOUCHED — this rewrites a copy');

// ===== IT SAYS THE NAME FIRST ==========================================
console.log('\n  THE NAME LEADS IT:');
_cbEarSet(true); SPOKEN=[]; CANCELS=0;
_cbSay('Kelly G','Nine days straight of food');
t(SPOKEN.length===1, 'one utterance', String(SPOKEN.length));
t(/^Kelly G\. /.test(SPOKEN[0].text), 'the client is named before their message', SPOKEN[0].text.slice(0,30));
t(CANCELS===1, 'and anything already talking is cancelled first, never stacked');

// ===== IT READS THE BOX, NOT THE ROW ===================================
// So an edit he just typed is what he hears back.
console.log('\n  IT READS WHAT IS ON SCREEN:');
CUR={id:'d1', text:'the stored row'};
global._crmBatch={q:[{id:'d1', code:'kellyg1', name:'Kelly G'}], i:0, awaiting:false};
// The box is the bubbles now, so this is what a bubble editor looks like to it.
EL['dfEd_d1']={querySelectorAll:()=>[{value:'the edited box'}]};
SPOKEN=[];
_cbSayCurrent();
t(SPOKEN.length===1 && /the edited box/.test(SPOKEN[0].text),
  'his edit is what gets read back, not the row it came from', SPOKEN[0]&&SPOKEN[0].text);
delete EL['dfEd_d1'];
SPOKEN=[];
_cbSayCurrent();
t(SPOKEN.length===1 && /the stored row/.test(SPOKEN[0].text), 'and with no box on screen it falls back to the row');

// ===== IT SHUTS UP AT THE HANDOFF ======================================
console.log('\n  WHEN IT MUST BE SILENT:');
global._crmBatch={q:[{id:'d1', code:'kellyg1', name:'Kelly G'}], i:0, awaiting:true};
SPOKEN=[];
_cbSayCurrent();
t(SPOKEN.length===0, 'the handed-off screen is silent — Messages is about to come up over it');
global._crmBatch={q:[{id:'d1',code:'kellyg1',name:'Kelly G'}], i:1, awaiting:false};
SPOKEN=[];
_cbSayCurrent();
t(SPOKEN.length===0, 'and the end of the run says nothing');
global._crmBatch=null;
SPOKEN=[];
_cbSayCurrent();
t(SPOKEN.length===0, 'and with no run at all it does not reach into a null');

// ===== THE TOGGLE IS THE GESTURE =======================================
// iOS will not speak from anything a tap did not start, so turning it ON has to
// be the thing that starts talking.
console.log('\n  THE TOGGLE IS THE TAP:');
_cbEarSet(false);
CUR={id:'d1', text:'a body'};
global._crmBatch={q:[{id:'d1', code:'kellyg1', name:'Kelly G'}], i:0, awaiting:false};
SPOKEN=[]; CANCELS=0;
cbEarToggle();
t(_cbEarOn()===true, 'the tap turns it on');
t(SPOKEN.length===1, 'and speaks the card it is looking at, in the same gesture', String(SPOKEN.length));
SPOKEN=[]; CANCELS=0;
cbEarToggle();
t(_cbEarOn()===false, 'the second tap turns it off');
t(SPOKEN.length===0 && CANCELS>0, 'and stops it mid-sentence rather than finishing');

// ===== THE ROW ITSELF ==================================================
console.log('\n  THE ROW:');
_cbEarSet(false);
t(/Read aloud/.test(_cbEarBar()) && !/Again/.test(_cbEarBar()), 'off: one button, and no Again to press');
_cbEarSet(true);
const bar=_cbEarBar();
t(/cbEarB on/.test(bar) && /Reading/.test(bar), 'on: it says it is reading');
t(/onclick="cbEarReplay\(\)"/.test(bar), 'and Again is there for the one he missed');
t(/id="cbSpk"/.test(bar), 'with the live dot the utterance drives');

// ===== SPEECH IS NEVER LOAD BEARING ====================================
// The whole point: a broken voice must never cost him a send.
console.log('\n  IT CAN NEVER COST HIM A SEND:');
const src=fs.readFileSync('index.html','utf8');
t(/function crmBatchSend\(\)\{[\s\S]{0,400}?_cbStop\(\);/.test(src), 'the send silences it first');
t(/function crmBatchSkip\(\)\{[\s\S]{0,200}?_cbStop\(\);/.test(src),  'so does the skip');
t(/function crmBatchNext\(\)\{[\s\S]{0,200}?_cbStop\(\);/.test(src),  'so does the advance');
t(/function crmBatchClose\(\)\{\n  _cbStop\(\);/.test(src),           'and closing the run');
t(/if\(_cbEarOn\(\)\) setTimeout\(function\(\)\{ try\{ _cbSayCurrent\(\); \}catch\(e\)\{\} \}, 40\);/.test(src),
  'the card speaks itself only when he has turned it on, inside a try');
// Every entry point wrapped, so a throw in the speech engine cannot escape.
const layer=src.slice(src.indexOf('var _CB_EAR_KEY='), src.indexOf('var _crmBatch=null;'));
t(layer.length>1500, 'the layer is in the file', String(layer.length));
t((layer.match(/catch\(e\)/g)||[]).length>=8, 'and every door through it is wrapped',
  String((layer.match(/catch\(e\)/g)||[]).length));
t(/\.cbEarB\{/.test(src) && /\.cbSpk\{/.test(src), 'the styles shipped with it');
// One quoted line per CSS rule — the landmine CLAUDE.md names.
t(!/\+'\.cbEarB\{[^']*\n/.test(src), 'and no CSS rule runs across a line inside a JS string');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all read-aloud assertions pass');
process.exit(0);
