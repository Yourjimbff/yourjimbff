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
t(/filter:'all', sort:'recent'\}/.test(src), 'everyone, newest conversation first');
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
t(/slice\(0,89\)/.test(cl),                'and truncated rather than wrapped');
t((src.match(/_crmConvLine\(p\.code\)/g)||[]).length===3,
  'it is on the drafted row, the bare row and the already-spoken row',
  (src.match(/_crmConvLine\(p\.code\)/g)||[]).length+' call sites');

console.log('\n  the stylesheet is a JAVASCRIPT STRING and stays one rule per line:');
const css=src.slice(src.indexOf(".crmConv{display:flex")-40, src.indexOf(".crmRowTop{display:flex")+120);
const lines=css.split('\n').filter(l=>/crmConv|crmRowTop/.test(l));
t(lines.every(l=>/^\s*\+'/.test(l) && /'$/.test(l.trim())),
  'every rule opens and closes its own quotes', lines.length+' rule line(s)');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
