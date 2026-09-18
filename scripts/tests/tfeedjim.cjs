/* WHAT JIM SAID, ON THE FEED (Yusuf, 17 Sep, midnight, reading his own board).

   "If there is one thing you implement from this ... I do not see if Jim wrote
    feedback on the food log. I need to be able to see it."

   Angela Walker had logged two bad days running and written "food was shit" in
   her journal. Jim had graded both meals and written a read on each. Neither
   read had any route to the surface he actually reads.

   This suite RUNS the builder on real row shapes. A test that only checks the
   string appears in the file would pass on a builder that returns '' for every
   input, which is precisely the failure being fixed. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntfeedjim - Jim’s read reaches the feed, and so does its absence');

const lifted=closure(['_feedJimHtml','_feedJimText']);
/* _groupRows is a PROPERTY of a feed row, not a function in the file, and the
   lifter's report keeps every _-prefixed name it cannot resolve. Named here so
   the exception is deliberate rather than a hole nobody looked at. */
const holes=lifted.unresolved.filter(n=>n!=='_groupRows');
ok(holes.length===0, 'the builder lifts with nothing missing', holes);
const F=new Function(
  "var _JIM_SPARK='<svg class=\"jimSpark\"></svg>';\n"+
  lifted.code+'\nreturn {_feedJimHtml,_feedJimText};')();

const ANGELA='Two days of processed food in a row is what the low energy is telling you — anchor tomorrow on protein.';

// ---- A READ IS SHOWN, ON THE CARD, NOT BEHIND A TAP
const withRead={kind:'food', data:{id:1, name:'Taco Bell', insight:ANGELA}};
const h=F._feedJimHtml(withRead);
ok(h.indexOf(ANGELA)>=0, 'the read Jim actually wrote is on the card');
ok(/class="fcJim"/.test(h), 'in its own block');
ok(!/display:none/.test(h), 'and it is NOT hidden behind a tap', h.slice(0,80));
ok(!/onclick/.test(h), 'nothing has to be clicked to read it');
ok(/Jim’s read/.test(h), 'it says whose read it is');

// his house law, stated in this same file: no emoji anywhere
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(h), 'and carries no emoji');

// ---- THE ABSENCE IS VISIBLE TOO. Half of what he asked for is knowing WHETHER.
const noRead={kind:'food', data:{id:2, name:'Chicken and rice', insight:null}};
const h2=F._feedJimHtml(noRead);
ok(h2.indexOf('did not read')>=0, 'a meal Jim never read SAYS so', h2);
ok(/class="fcJimNo"/.test(h2), 'quietly, in its own class');

// the three ways a column comes back empty all read as empty
['', '   ', 'null', 'NULL', 'undefined'].forEach(v=>{
  ok(F._feedJimText({kind:'food', data:{insight:v}})==='',
     'an insight of '+JSON.stringify(v)+' is no read at all');
});

// ---- A CARD THAT IS SEVERAL FOODS LOGGED AT ONCE
const grouped={kind:'food', data:{id:3, _groupCount:3, insight:null,
  _groupRows:[{id:31,insight:null},{id:32,insight:ANGELA},{id:33,insight:'later one'}]}};
ok(F._feedJimText(grouped)===ANGELA, 'a grouped meal speaks with its first real read');
ok(F._feedJimHtml(grouped).indexOf(ANGELA)>=0, 'and it reaches the card');
ok(F._feedJimText({kind:'food', data:{_groupRows:[{insight:null},{insight:''}]}})==='',
   'a group where nobody was read is still no read');

// ---- IT IS ONLY FOR FOOD
['wo','weight','photo','journal','moment','steps','conn'].forEach(k=>{
  ok(F._feedJimHtml({kind:k, data:{insight:ANGELA}})==='', 'nothing is drawn on a '+k+' card');
});
ok(F._feedJimHtml(null)==='', 'and a missing item does not throw');
ok(F._feedJimHtml({kind:'food'})==='', 'nor a food card with no row');

// ---- IT IS ACTUALLY ON THE CARD, AND OUTSIDE THE CLIPPED BOX
const card=(()=>{ const i=src.indexOf('function _feedItemHtml(it){');
  return src.slice(i, src.indexOf('\n}\n\n// ===== JOURNAL ENTRIES', i)); })();
ok(/_feedJimHtml\(it\)/.test(card), 'the card calls it');
const jimAt=card.indexOf('_feedJimHtml(it)');
const extraAt=card.indexOf("'<div class=\"fcExtra\">'");
ok(jimAt>extraAt, 'and NOT inside .fcExtra, which board mode clips to 34px');
ok(card.indexOf('_pfTouchLine')>jimAt, 'it sits above the trailing line, with the meal');

// the clip rule the read has to stay out of really is still there
ok(/body\.jv-on \.feedCard \.fcExtra\{height:34px/.test(src),
   'board mode still clips .fcExtra, which is why this lives outside it');
ok(/\.fcJim\{/.test(src) && /\.fcJimNo\{/.test(src), 'both blocks are styled');

console.log(fails? ('\ntfeedjim: '+fails+' FAILED\n') : '\ntfeedjim: all good\n');
process.exit(fails?1:0);
