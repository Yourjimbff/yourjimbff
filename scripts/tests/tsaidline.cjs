// WHAT THE CLIENT ACTUALLY WROTE HAS TO REACH HIS EYES (Yusuf, 15 Sep):
// "I want to see what people are saying when they're logging because I'm gonna
// need to do a post on that ... If we can just include it somewhere, that'd be
// good. because that way I can see what consumers are logging. Word for Word."
//
// The sentence was never missing from the data. meal_text is written the moment
// the client types it and the feed query has always selected it; both renderers
// simply threw it away and drew the tidy name the app invented instead. So this
// suite does not test that the words are STORED - it tests that they are DRAWN,
// which is the part that was broken.
//
// THREE THINGS THAT MUST HOLD:
//   1. the words appear verbatim, not summarised, not re-cased, not truncated
//      short of 500 chars;
//   2. they are suppressed when they only repeat the card's own title, because
//      printing "Sardines and eggs" under a card headed "Sardines and eggs" is
//      noise that would train him to stop reading the line;
//   3. BOTH surfaces use the one rule - the feed card and the day peek are
//      separate functions that have drifted apart before.
const fs=require('fs');
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

// ---- the rule itself -------------------------------------------------------
const body=fnAt('_feedSaidLine');
t(!!body, '_feedSaidLine exists');
if(!body){ console.log('tsaidline: 1 FAILED'); process.exit(1); }
const _feedSaidLine=new Function('return ('+body+')')();

// George's real row: what he typed against what the app named it.
const GEORGE_SAID='Hello I had a can of sardines season brand with skin and bones and the olive oil mixed with 2 eggs scrambled cooked in olive oil';
t(_feedSaidLine({meal_text:GEORGE_SAID, name:'Sardines, Eggs & Olive Oil'})===GEORGE_SAID,
  'the sentence survives word for word');
t(_feedSaidLine({meal_text:GEORGE_SAID, name:'Sardines, Eggs & Olive Oil'}).indexOf('season brand')>0,
  'no summarising - his exact words, brand and all');

// Suppressed when it only repeats the title, through any tidy-up.
t(_feedSaidLine({meal_text:'Sardines and eggs', name:'Sardines and eggs'})==='',
  'identical to the title: nothing drawn');
t(_feedSaidLine({meal_text:'sardines and eggs', name:'Sardines & Eggs'})==='',
  're-cased and re-punctuated title: still nothing drawn');
t(_feedSaidLine({meal_text:'  Chicken   and rice  ', name:'Chicken and Rice'})==='',
  'whitespace tidy-up: still nothing drawn');
t(_feedSaidLine({meal_text:'chicken and rice with a little bit of olive oil', name:'Chicken and Rice'})
    ==='chicken and rice with a little bit of olive oil',
  'title is a PREFIX of what they said: the rest is theirs, so it draws');

// Empty / missing / photo-only rows say nothing rather than drawing quote marks
// around an empty string.
t(_feedSaidLine({name:'a meal'})==='', 'no meal_text: empty');
t(_feedSaidLine({meal_text:'', name:'a meal'})==='', 'blank meal_text: empty');
t(_feedSaidLine({meal_text:'   ', name:'a meal'})==='', 'whitespace-only meal_text: empty');
t(_feedSaidLine(null)==='', 'null row does not throw');
t(_feedSaidLine({meal_text:'eggs'})==='eggs', 'no name on the row: still shows what they said');

// Long logs are clipped, not dropped - a 900-character log is exactly the kind
// he wants to read, so it must not fall off the card entirely.
const LONG='a'.repeat(900);
t(_feedSaidLine({meal_text:LONG, name:'x'}).length===500, 'a 900-char log clips to 500', _feedSaidLine({meal_text:LONG,name:'x'}).length);

// Newlines collapse rather than breaking the card's one-line quote.
t(_feedSaidLine({meal_text:'eggs\nand\ntoast', name:'x'})==='eggs and toast', 'newlines collapse to spaces');

// ---- both surfaces use it --------------------------------------------------
const feed=fnAt('_feedItemHtml');
const day=fnAt('_pfDayRow');
t(/_feedSaidLine\(/.test(feed), 'the FEED card calls _feedSaidLine');
t(/_feedSaidLine\(/.test(day),  'the DAY peek calls _feedSaidLine');

// Neither surface may keep a private copy of the rule - that is the drift this
// helper exists to prevent.
t(!/meal_text\|\|''\)\.replace\(\/\\s\+\//.test(feed.replace(/\s/g,'')) , 'feed keeps no private copy of the rule');

// ---- it is escaped ---------------------------------------------------------
// A client can type anything into that box. The feed card builds raw HTML, so
// the quote has to go through the escaper the rest of the card uses; the day
// peek's pfDayNote slot already does.
const feedSaid=/var _sd=_feedSaidLine\(f\);[\s\S]{0,400}?_sdHtml=/.exec(feed);
t(!!feedSaid, 'feed builds its quote from the helper');
t(/_pfEsc\(_sd\)/.test(feed), 'feed escapes the client sentence through _pfEsc');
t(/_sdHtml/.test(feed) && /\+_sdHtml\+_chip/.test(feed), 'the quote sits under the macros, above the rating chip');

// ---- the placeholder -------------------------------------------------------
// He asked for the meal box to say describe-or-estimate and list the
// ingredients. It is a real HTML placeholder, so it clears the instant anybody
// types - the behaviour he asked for is the one an empty textarea already has.
const ph=/id="nlLine"[^>]*placeholder="([^"]*)"/.exec(src);
t(!!ph, 'the meal box has a placeholder');
if(ph){
  t(/describe/i.test(ph[1]), 'placeholder says describe', JSON.stringify(ph[1]));
  t(/estimate/i.test(ph[1]), 'placeholder says estimate');
  t(!/12 oz steak/.test(ph[1]), 'the old worked-example placeholder is gone');
  t(ph[1].length<=70, 'placeholder fits the box', ph[1].length);
}
// A placeholder is not a value: nothing is prefilled, so there is nothing to
// clear by hand.
t(!/id="nlLine"[^>]*>\s*(?:Describe|12 oz)/.test(src), 'the box is empty, not prefilled');

console.log(bad? ('tsaidline: '+bad+' FAILED') : 'tsaidline: all passed');
process.exit(bad?1:0);
