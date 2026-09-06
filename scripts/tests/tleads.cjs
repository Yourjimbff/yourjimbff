// SOMEBODY ASKING TO BUY (Yusuf, 5 Sep).
//
// The board sorts by how long someone has waited, so a person asking what
// coaching costs sits in the same queue as a check-in and looks the same. Omar
// Miller asked on 29 JULY about putting the app in front of his own clients and
// it sat there for five weeks.
//
// So: their own words, matched dumbly, pulled to the top in their own band.
// A false positive costs three seconds. A miss costs a sale.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

global.window={}; global.document={getElementById:()=>null};
global._escHtml=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

const MINE=['_crmLeadHit','_crmLeadsHtml'];
eval(closure(['_LEAD_RE']).code||'');
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

global._crm={contacts:{}};
let ROSTER=[];
global._crmRoster=()=>ROSTER;
const say=(code,text,last,when)=>{ _crm.contacts[code]={text:text, last:(last||'them'), them:(when||'2026-09-05T10:00:00Z')}; };
const only=(code,text,last)=>{ _crm.contacts={}; ROSTER=[{code:code,name:'X'}]; say(code,text,last); };

// ===== THE ONE THAT COST FIVE WEEKS ====================================
console.log('\n  THE REAL ONE:');
only('omarm1','Hey man was thinking about putting the app in front of my own clients, interested in how that would work');
t(_crmLeadHit('omarm1')!=='', 'Omar Miller, 29 July: "interested in"', _crmLeadHit('omarm1'));

// ===== THE SHAPES A LEAD ACTUALLY ARRIVES IN ===========================
console.log('\n  WHAT COUNTS AS ASKING:');
[['how much is coaching','how much'],
 ['whats the cost for a month','the cost'],
 ['do you have space available','space available'],
 ['i want to sign up','sign up'],
 ['are you taking on new clients','taking on new clients'],
 ['can we schedule a call about it','schedule a call'],
 ['what are your rates','your rates'],
 ['how do i get started','get started'],
 ['would love to train me if you have room','train me']
].forEach(function(p){
  only('c1',p[0]);
  t(_crmLeadHit('c1')!=='', p[0], _crmLeadHit('c1'));
});

// ===== AND WHAT DOES NOT ===============================================
console.log('\n  WHAT IS JUST A CLIENT TEXTING:');
['logged everything today','shoulder is still sore','made it in this morning',
 'sorry been slammed at work','protein was low yesterday'].forEach(function(x){
  only('c1',x);
  t(_crmLeadHit('c1')==='', x);
});

// ===== HIS WORDS ARE NOT A LEAD ========================================
console.log('\n  ONLY THEIR WORDS, AND ONLY UNANSWERED:');
only('c1','how much do you want to spend on food','him');
t(_crmLeadHit('c1')==='', 'the same phrase in HIS OWN last text is not a lead');
only('c1','how much is coaching','them');
t(_crmLeadHit('c1')!=='', 'and it is one when they said it last');
_crm.contacts={}; ROSTER=[{code:'c1',name:'X'}];
t(_crmLeadHit('c1')==='', 'a client with no thread at all is not a lead');
say('c1','   ','them');
t(_crmLeadHit('c1')==='', 'an empty text is not a lead');
t(_crmLeadHit('nobody')==='', 'a code that is not on the board answers empty, not undefined');

// ===== THE BAND ========================================================
console.log('\n  THE BAND:');
_crm.contacts={}; ROSTER=[{code:'a1',name:'Alice'},{code:'b1',name:'Bob'}];
say('a1','logged it','them');
say('b1','hows the gym','him');
t(_crmLeadsHtml()==='', 'no leads, no band - an empty heading is worse than nothing');
say('a1','how much is coaching','them','2026-09-01T10:00:00Z');
t(/one person is asking to buy/.test(_crmLeadsHtml()), 'one reads as one person');
say('b1','can i sign up','them','2026-09-05T10:00:00Z');
const h=_crmLeadsHtml();
t(/2 people are asking to buy/.test(h), 'two reads as two');
t(h.indexOf('Bob')<h.indexOf('Alice'), 'newest first - the one who just asked is on top');
t(/covOpen\('b1'\)/.test(h) && /covOpen\('a1'\)/.test(h), 'each row opens that person');
t(!/data-crm/.test(h), 'and it does NOT use data-crm, which nothing in the file listens for');
say('a1','how much <b>is</b> it','them');
t(_crmLeadsHtml().indexOf('&lt;b&gt;')>=0, 'their words are escaped');

// ===== WHERE IT SITS ===================================================
console.log('\n  WHERE IT SITS AND WHAT IT COSTS:');
const src=fs.readFileSync('index.html','utf8');
const paint=src.slice(src.indexOf('function crmPaint(){'), src.indexOf('function _crmFit(ta){'));
t(paint.indexOf('_crmLeadsHtml()')>0, 'the band is drawn by crmPaint');
t(paint.indexOf('_crmLeadsHtml()')<paint.indexOf('crmSortRow'), 'above the board, so he never scrolls to find a sale');
t(/try\{ h\+=_crmLeadsHtml\(\); \}catch\(e\)\{\}/.test(paint), 'and it can never take the board down with it');
t(!/sbSelect|dfWrite|fetch\(/.test(src.slice(src.indexOf('function _crmLeadHit('), src.indexOf('/* ===== HOW IT ACTUALLY LANDS'))),
  'it reads the sweep already on the board - no read, no write, nothing new to be slow');
t(/\.crmLeads\{/.test(src) && /\.crmLeadsH\{/.test(src), 'styled');
['.crmLeads{','.crmLeadsH{'].forEach(sel=>{
  const i=src.indexOf(sel);
  t(i>0 && src.slice(0,i).lastIndexOf("+'")>src.slice(0,i).lastIndexOf('\n'), sel+' is one quoted line');
});

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all lead-band assertions pass');
process.exit(0);
