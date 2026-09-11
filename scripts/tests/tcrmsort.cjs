// THE BOARD READS LIKE A THREAD LIST NOW (Yusuf, 4 Sep).
//
// "Most recent conversations should be in there ... Most recently had
// conversations should remain at the top ... And i should choose to be able to
// look at whos been waiting the longest."
//
// It had three sorts and none of them was "the conversation I was just having".
// `msg` came closest and reads only THEIR last message, so a thread he had
// replied to five minutes earlier sorted as though nothing had happened in it.
// _crm.contacts has carried both sides the whole time - {them, him, last, text} -
// and nothing read the pair.
//
// AND THE ROWS NEVER SHOWED THE CONVERSATION. The board named people. He could
// not tell a live thread from a dead one without opening it.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  it opens on the conversations:');
t(/filter:'waiting', sort:'recent'\}/.test(src), 'opens on the queue, newest conversation first (7 Sep: simple is better)');
const sorts=src.slice(src.indexOf('var _CRM_SORTS=['), src.indexOf('var _CRM_SORTS=[')+320);
t(/\{k:'recent'/.test(sorts),        'Recent is a sort');
t(sorts.indexOf("'recent'")<sorts.indexOf("'wait'"), 'and it leads the row');
t(/\{k:'wait',\s+label:'Longest waiting'\}/.test(sorts),
                                     'longest waiting is still there, one tap away');

console.log('\n  recent means the newest message either side sent:');
const lp=src.slice(src.indexOf('function _crmLastPair(code){'), src.indexOf('function _crmRecentKey(p){'));
t(/c\.them/.test(lp) && /c\.him/.test(lp), 'it reads both halves of the thread');
t(/String\(them\)>String\(him\)/.test(lp), 'and takes whichever is later');
t(/who *=/.test(lp),                       'and remembers who that was');

const rk=src.slice(src.indexOf('function _crmRecentKey(p){'), src.indexOf('function _crmAgoShort(iso){'));
t(/p\.theirLast/.test(rk),                 'a person the sweep has not seen falls back to their last message');
t(/p\.draftAt/.test(rk),                   'then to the draft, rather than to nothing');

const sf=src.slice(src.indexOf("var by=String(k||'recent');"), src.indexOf("var by=String(k||'recent');")+700);
t(/by==='recent'/.test(sf),                'the sorter handles it');
t(/!!ra !== !!rb/.test(sf),                'and a person with no thread sorts to the BOTTOM, not the top');

console.log('\n  every row says who spoke last, when, and what they said:');
const cl=src.slice(src.indexOf('function _crmConvLine(code){'), src.indexOf('var _CRM_SORTS=['));
t(/crmConvWho/.test(cl) && /crmConvAgo/.test(cl) && /crmConvTxt/.test(cl), 'all three parts');
t(/_escHtml\(txt\)/.test(cl),              'their words are escaped, never rewritten');
t(/slice\(0,109\)/.test(cl),                'and truncated rather than wrapped');
t((src.match(/_crmConvLine\(p\.code\)/g)||[]).length===1 && /line=_crmConvLine\(code\)/.test(src) && (src.match(/_crmMore\(p, (d|null)\)/g)||[]).length>=2,
  'it is on the drafted row and the bare row (as the one line that opens, 7 Sep) and the already-spoken row',
  (src.match(/_crmConvLine\(p\.code\)/g)||[]).length+' call sites');

console.log('\n  the stylesheet is a JAVASCRIPT STRING and stays one rule per line:');
const css=src.slice(src.indexOf(".crmConv{display:flex")-40, src.indexOf(".crmRowTop{display:flex")+120);
const lines=css.split('\n').filter(l=>/crmConv|crmRowTop/.test(l));
t(lines.every(l=>/^\s*\+'/.test(l) && /'$/.test(l.trim())),
  'every rule opens and closes its own quotes', lines.length+' rule line(s)');

// ONE LINE, NOT FOUR TILES (Yusuf, 7 Sep: "find a way to clean this up")
const paint=src.slice(src.indexOf('function crmPaint(){'), src.indexOf('function crmPaint(){')+9000);
t(!/crmScore/.test(paint) && !/earned today/.test(paint) && !/days the board ended clear/.test(paint), 'the four score tiles, the money and the streak are gone from the board head');
/* The copy was cut down on 8 Sep so the line stopped wrapping to two on his
   phone: "N to go - N done - longest 3d Carly". The line still says the same
   three things, in fewer words. */
t(/<div class="crmLine">/.test(paint) && / to go<\/b>'/.test(paint) && /' done'/.test(paint) && /'longest <b>'/.test(paint),
  'one line says to go, done today, longest wait');
t(/Board.s empty/.test(paint) && /Nobody.s waiting/.test(paint) && /Board.s clear/.test(paint),
  'and an empty board says which kind of empty it is');

/* THE SUMMARY GOES LAST. It used to sit above these two, so a suite with a red
   line down here still printed "all pass" as its final line and the runner's
   tail showed green while its exit code said otherwise. */
t(!/one at a time, your thumb still sends/.test(paint), 'and the hint under the buttons is gone');
console.log(bad? ('\n  '+bad+' FAILED') : '\n  all pass');



process.exit(bad?1:0);
