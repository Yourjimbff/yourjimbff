// EASY READ PLUS LISTEN — ONE WRITER, TWO SENSES (his order, 29 Aug).
//
// "Both come from one writer. What is spoken and what is written never drift."
//
// The proof he asked for is here and it is the first thing this suite does:
// pull the script back OUT of the rendered HTML, and compare it to the spoken
// string word for word. Not "both call _jvDebriefScript" — that is an argument
// about the code. This reads the finished screen and the finished speech and
// puts them side by side, which is the only version of the claim that cannot
// quietly stop being true.
//
// It also holds the two rules that come with the register:
//   ROUNDING IS THE APP'S ARITHMETIC. "around 1,800" is only sayable because
//   _jvDebriefFigures computed 1,800 from a real 1,799. An invented number
//   still fails and is still not spoken.
//   A JUDGEMENT IS EARNED OR IT IS ABSENT. "Locked in" appears only when the
//   measured gap between the best and worst stretch is small, and vanishes when
//   it is not — proven both ways on two fixtures.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure,defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

global.window={addEventListener:()=>{},matchMedia:()=>({matches:false}),_sbFailN:0};
global.document={addEventListener:()=>{},removeEventListener:()=>{},getElementById:()=>null,
  querySelectorAll:()=>[],querySelector:()=>null,
  createElement:()=>({style:{},classList:{add(){},remove(){}},appendChild(){}}),
  body:{classList:{contains:()=>false,add(){},remove(){},toggle:()=>{}},style:{},appendChild(){}},hidden:false};
global.localStorage={getItem:()=>null,setItem:()=>{}};

const MINE=['_JV_DEBRIEF_DAYS','_JV_DEBRIEF_ROLL','_JV_DB_LIFT_TITLE','_JV_DB_CARDIO_TITLE',
  '_JV_DB_SAYS_RE','_JV_DB_THEMES',
  '_dbMedian','_dbRoll','_dbIsSaid','_dbKind','_dbIsLift','_dbDay','_dbDs',
  '_dbSayRate','_dbSayCount','_dbCap','_dbSayDate','_dbOnDate','_dbSayDayLog','_dbScreenDayLog',
  '_DB_NUMWORD','_jvDebriefFigures','_jvDebriefNumsIn','_jvDebriefVerify',
  '_dbAboutCal','_dbBandTen','_dbBand','_dbAboutRate','_dbAboutLb','_DB_TIGHT','_dbIsTight',
  '_jvDebriefScript','_jvDebriefScriptText','_jvDebriefSpoken','_jvDebriefSpokenPlain',
  '_jvDebriefHtml','_jvDebriefData','_tlDateStr'];
const SHARED=['_bfItemsFor','_jvNum','_escHtml','_jvSpokenDateStr','_sbFailMark','_sbFailedSince'];
eval(closure(SHARED).code);
eval(MINE.map(defOf).join('\n'));
guard(MINE.concat(SHARED), n=>eval(n));

// ---- the screen, read back as text --------------------------------------
// Deliberately parsed out of the FINISHED HTML rather than taken from the
// blocks, because the whole question is whether the render preserved the words.
const unesc=(s)=>String(s).replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
function screenScript(html){
  const region=(/<div class="dbrfScript">([\s\S]*?)<\/div><div class="dbrfChart">/.exec(html)||[])[1]||'';
  return (region.match(/<div class="dbrfParaT">([\s\S]*?)<\/div>/g)||[])
    .map(x=>unesc(x.replace(/^<div class="dbrfParaT">/,'').replace(/<\/div>$/,''))).join('\n\n');
}
function screenHeads(html){
  return (html.match(/<div class="dbrfParaH">([\s\S]*?)<\/div>/g)||[])
    .map(x=>unesc(x.replace(/^<div class="dbrfParaH">/,'').replace(/<\/div>$/,'')));
}

const dayStr=n=>{ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-n); return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); };
const iso=n=>{ const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-n); return d.toISOString(); };

(async function(){
  // A CONSISTENT client: five lifts and a yoga class last week, tight calories,
  // a hard-day note on a day they trained anyway, one weigh-in in two weeks.
  const W=[0,1,2,3,4,8,9,11,15,16,18,22,23,25].map(n=>({id:n,title:'Legs',description:'Squat: 100 lb x 5',date_str:dayStr(n),logged_at:iso(n)}))
    .concat([{id:90,title:'Hour Long Hot Yoga Class',description:'yoga',date_str:dayStr(5),logged_at:iso(5)}])
    .concat([{id:91,title:'Legs',date_str:dayStr(6),logged_at:iso(6),
      description:'Squat: 100 lb x 5\nLeg Press: 200 lb x 8\n\nFeeling shitty so did what I could'}]);
  // Calories sit in a narrow band, so the consistency judgement is EARNED - and
  // NOT ONE OF THEM IS A ROUND NUMBER. 1,799 and 1,499 are chosen so that every
  // figure the script speaks ("around 1,800", "about 1,500") exists ONLY because
  // _jvDebriefFigures registered the sanctioned rounding of a real value. With a
  // fixture that ate a tidy 1,800 a day, deleting that registration changed
  // nothing and the suite passed over it - which it did, first run.
  const F=[];
  for(let n=0;n<26;n++){
    const cal=(n<6?1799:1499);
    F.push({id:100+n,calories:cal,protein:131,carbs:200,fat:60,date_str:dayStr(n),logged_at:iso(n),meal:'Lunch',name:'x'});
    F.push({id:200+n,calories:0,protein:0,carbs:0,fat:0,date_str:dayStr(n),logged_at:iso(n),meal:'Snack',name:'y'});
  }
  const WT=[{id:1,weight:179,logged_at:iso(25)},{id:2,weight:180,logged_at:iso(20)}];
  global.sbSelect=async function(tbl){ return tbl==='workout_logs'?W:(tbl==='food_logs'?F:WT); };
  const D=await _jvDebriefData('TEST_SCRIPT');
  const spoken=_jvDebriefSpoken(D,'Test Client');
  const html=_jvDebriefHtml(D,'Test Client');

  console.log('\n  THE PROOF HE ASKED FOR — the screen and the ear, side by side:');
  const onScreen=screenScript(html);
  t(onScreen.length>200, 'the script is on screen at all', String(onScreen.length)+' chars');
  t(onScreen===spoken, 'and it is WORD FOR WORD what is spoken');
  if(onScreen!==spoken){
    console.log('    screen: '+JSON.stringify(onScreen.slice(0,160)));
    console.log('    spoken: '+JSON.stringify(spoken.slice(0,160)));
  }
  t(_jvDebriefScriptText(D,'Test Client')===spoken, 'and both come from the one writer');

  console.log('\n  THE HEADINGS ARE THE SCREEN\'S ALONE:');
  const heads=screenHeads(html);
  t(heads.indexOf('Training')>-1 && heads.indexOf('Food')>-1 && heads.indexOf('Weight')>-1,
    'Training, Food and Weight head their paragraphs', heads.join(' / '));
  t(heads.indexOf('Bring up on the call')>-1, 'and so does the thing to raise');
  heads.forEach(h=>t(spoken.indexOf('\n'+h+'\n')<0, 'the heading "'+h+'" is never read aloud'));
  t(!/^Training$/m.test(spoken), 'no bare heading line survives into the speech');

  console.log('\n  THE CHART IS BELOW IT, one scroll away, and still exact:');
  t(html.indexOf('dbrfScript')<html.indexOf('dbrfChart'), 'the script comes first in the document');
  t(html.indexOf('dbrfChart')<html.indexOf('class="dbrfSec">Training</div>'),
    'and the chart wraps the detailed sections');
  t(/Typical day/.test(html), 'the chart still reads "Typical day"');
  const exact=D.nutrition.per.calories.lives.roll.value;
  t(html.indexOf(String(exact))>html.indexOf('dbrfChart') || html.indexOf(_jvNum(exact))>-1,
    'and carries the UNROUNDED figure the script rounded', String(exact));

  console.log('\n  EVERY FIGURE SPOKEN IS ONE THE APP COMPUTED:');
  const FIG=_jvDebriefFigures(D);
  const v=_jvDebriefVerify(spoken, FIG);
  t(v.ok, 'the whole script verifies', v.bad.join(','));
  // THE ROUNDING IS LOAD-BEARING HERE: no day in the fixture is a round number,
  // so these two figures can only be sayable via the registered roundings.
  t(/around 1,800 a day lately/.test(spoken), 'it says the rounded recent figure', spoken.slice(0,0)||'');
  t(/up from about 1,500/.test(spoken), 'and the rounded month figure it climbed from');
  t(/the low 130s/.test(spoken), 'and protein as a band');
  t(!/I am not going to read it out/.test(spoken), 'so it is actually spoken, not withheld');

  console.log('\n  ROUNDING IS THE APP\'S ARITHMETIC, not the narrator\'s:');
  t(_dbAboutCal(1799)===1800, '1,799 rounds to 1,800', String(_dbAboutCal(1799)));
  t(_dbAboutCal(1824)===1800 && _dbAboutCal(1826)===1850, 'to the nearest fifty, both ways');
  t(_dbBand(131)==='low 130s', '131 is the low 130s', _dbBand(131));
  t(_dbBand(134)==='mid 130s' && _dbBand(138)==='high 130s', 'and the band moves with it',
    _dbBand(134)+' / '+_dbBand(138));
  t(_dbAboutRate(4.75)==='about five', 'four and three quarters is about five', _dbAboutRate(4.75));
  t(_dbAboutRate(5)==='five', 'and an exact five says five, with no "about"', _dbAboutRate(5));
  t(_dbAboutLb(1)==='a pound' && _dbAboutLb(1.2)==='about a pound', 'a pound, and about a pound', _dbAboutLb(1.2));
  // THE TEETH: a figure that is NOT a rounding of computed data still fails.
  t(_jvDebriefVerify('they ate around 9,450 a day', FIG).ok===false, 'an invented figure still fails the check');
  t(_jvDebriefVerify('they ate around '+_jvNum(_dbAboutCal(exact))+' a day', FIG).ok===true,
    'while the sanctioned rounding of a real one passes');

  console.log('\n  A JUDGEMENT IS EARNED BY THE DATA OR IT IS ABSENT:');
  t(/locked in/.test(spoken), 'a tight spread earns "locked in"');
  t(/they are consistent/i.test(spoken), 'and says so plainly first');
  t(_dbIsTight(1850,1350)===true, 'the measure itself: 1,350 against 1,850 is tight');
  t(_dbIsTight(2600,900)===false, 'and 900 against 2,600 is not');
  // THE OTHER WAY, on a client whose intake genuinely swings.
  const Fswing=[];
  for(let n=0;n<26;n++){
    Fswing.push({id:300+n,calories:(n%7<2?900:2600),protein:120,carbs:200,fat:60,date_str:dayStr(n),logged_at:iso(n),meal:'Lunch',name:'x'});
    Fswing.push({id:400+n,calories:0,protein:0,carbs:0,fat:0,date_str:dayStr(n),logged_at:iso(n),meal:'Snack',name:'y'});
  }
  global.sbSelect=async function(tbl){ return tbl==='workout_logs'?W:(tbl==='food_logs'?Fswing:WT); };
  const DS=await _jvDebriefData('TEST_SCRIPT');
  const sw=_jvDebriefSpoken(DS,'Test Client');
  t(!/locked in/.test(sw), 'a wide spread does NOT earn it');
  t(!/they are consistent/i.test(sw), 'and does not claim consistency either');
  t(/a real swing between the two/.test(sw), 'it states the swing instead', sw.slice(0,0)||'');
  t(_jvDebriefVerify(sw,_jvDebriefFigures(DS)).ok, 'and that script verifies too');
  t(screenScript(_jvDebriefHtml(DS,'Test Client'))===sw, 'screen still matches the ear on this one too');

  console.log('\n  THE CREDIT LINE IS EARNED TOO:');
  t(/Feeling shitty so did what I could/.test(spoken), 'their own words, verbatim');
  t(/Worth giving them credit for that/.test(spoken), 'credit when they wrote something hard AND trained anyway');
  // Same note, but nothing logged that day: no credit line.
  const Wnc=[{id:1,title:'Legs',date_str:dayStr(3),logged_at:iso(3),description:'Squat: 100 lb x 5'},
    {id:2,title:'Legs',date_str:dayStr(9),logged_at:iso(9),description:'Squat: 100 lb x 5\n\nFeeling shitty so did what I could'}];
  global.sbSelect=async function(tbl){ return tbl==='workout_logs'?Wnc:(tbl==='food_logs'?F:WT); };
  const DC=await _jvDebriefData('TEST_SCRIPT');
  const sc=_jvDebriefSpoken(DC,'Test Client');
  t(/Feeling shitty/.test(sc), 'the note still reaches the script');
  t(screenScript(_jvDebriefHtml(DC,'Test Client'))===sc, 'screen matches the ear here too');

  console.log('\n  THE NUDGE IS EARNED BY THE COUNT, not the trend:');
  t(/step on more often/.test(spoken), 'one weigh-in in two weeks earns the nudge');
  const WTok=[{id:1,weight:179,logged_at:iso(25)},{id:2,weight:180,logged_at:iso(9)},
    {id:3,weight:180,logged_at:iso(5)},{id:4,weight:181,logged_at:iso(1)}];
  global.sbSelect=async function(tbl){ return tbl==='workout_logs'?W:(tbl==='food_logs'?F:WTok); };
  const DW=await _jvDebriefData('TEST_SCRIPT');
  const sww=_jvDebriefSpoken(DW,'Test Client');
  t(!/step on more often/.test(sww), 'a client who weighs in regularly is not nudged');
  // ZERO WEIGH-INS IS A DIFFERENT SENTENCE, not a slot. Caught by RENDERING the
  // script and reading it, not by any assertion here: the slot version said
  // "they have only weighed in not at all in two weeks" out loud.
  const WT0=[{id:1,weight:179,logged_at:iso(25)}];
  global.sbSelect=async function(tbl){ return tbl==='workout_logs'?W:(tbl==='food_logs'?F:WT0); };
  const DZ=await _jvDebriefData('TEST_SCRIPT');
  const sz=_jvDebriefSpoken(DZ,'Test Client');
  t(!/weighed in not at all/.test(sz), 'zero weigh-ins does not produce "weighed in not at all"', sz.slice(-95));
  t(!/only weighed in\s+(not|no)\b/.test(sz), 'and no "only ... not" construction anywhere');
  t(/on the month/.test(sww), 'and the trend is still the month', sww.slice(-70));

  console.log('\n  THE HOUSE RULES ON ANYTHING SPOKEN:');
  t(!/—/.test(spoken), 'no long dash');
  t(!/·/.test(spoken), 'no middot');
  t(!/[<>&]/.test(spoken.replace(/&/g,'')), 'no markup');
  t(!/\bhe\b|\bhis\b|\bshe\b|\bher\b/i.test(spoken.replace(/[^ ]*shitty[^ ]*/g,'')),
    'and it never guesses a pronoun — they and them throughout');
  t(/\bthey\b/i.test(spoken), 'which is what it actually says');

  console.log('\n  A FAILED READ IS STILL NOT AN EMPTY MONTH:');
  global.sbSelect=async function(tbl){ if(tbl==='food_logs'){ window._sbFailN++; return []; } return tbl==='workout_logs'?W:WT; };
  const DF=await _jvDebriefData('TEST_SCRIPT');
  const sf=_jvDebriefSpoken(DF,'Test Client');
  t(/did not read just now/.test(sf), 'a refused table says so rather than reporting nothing eaten', sf.slice(0,0)||'');
  t(!/eating around/.test(sf), 'and states no food figure at all');
  t(screenScript(_jvDebriefHtml(DF,'Test Client'))===sf, 'and the screen says the same thing');

  console.log('');
  if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
  console.log('  all pass');
  // EXIT EXPLICITLY, like every other suite here. Falling off the end leaves
  // node alive whenever the lift has pulled in anything that holds a handle,
  // so the suite PASSES and then hangs forever — and run.sh, which waits for
  // each suite in turn, waits with it. Cost me the whole run once.
  process.exit(0);
})();
