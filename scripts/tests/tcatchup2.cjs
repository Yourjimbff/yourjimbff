// "notice its a little odd and too clunky" (Yusuf, 4 Sep, on a real catch up to
// Ben Plimpton). Three separate faults in one message, and the third one was a
// wrong number about to reach a client.
//
// WHAT CAME OUT:
//   Whats up handsome - im still holding that portions answer for you
//   Your food stops Aug 31st on my end, thats all ive got to read
//   ...
//   Good evening!
//   On your last 2 days:
//   ... Eggs, Sausage & Blueberries · Yogurt... · Eggs, Sausage & Blueberries · Yogurt...
//   1,608 cal · 162g protein
//   Feedback: You logged food on 1 of the 2 days, averaging 1,608 cal...
//
// 1. TWO MESSAGES STAPLED. He had a staged draft and tapped Catch up. textClient
//    does what it is told with a pending draft - puts it on top - so the thing
//    opened twice, and his own "your food stops Aug 31st, thats all ive got to
//    read" sat directly above a list of today's food.
// 2. A REPORT HEADER IN A TEXT. A bolded Feedback: label, and "averaging 1,608
//    cal on those days" about a single day.
// 3. THE NUMBER WAS WRONG. MEASURED on the served file: benp1 Sep 4 held FIVE
//    food rows, but Eggs+Sausage+Blueberries and Yogurt+Blueberries+Strawberries
//    were each in there twice, same meal, same calories, logged 17 SECONDS apart.
//    He ate one breakfast. Real day 1,014 cal and 116g protein, not 1,608.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('  a double tap is not two meals:');
const loop=src.slice(src.indexOf('var _seen={};'), src.indexOf('var _seen={};')+900);
t(loop.length>200,                          'the food loop de-dupes on the read');
t(/Math\.abs\(_t-_seen\[_k\]\)<=120000/.test(loop),
                                            'inside a two minute window only');
t(/String\(f\.meal\|\|''\)/.test(loop) && /\+f\.calories/.test(loop),
                                            'keyed on day, meal, name AND calories');
t(!/<=\s*(3600000|86400000)/.test(loop),    'not a whole hour or a whole day - the same meal hours later is real');

console.log('\n  no report header in a text message:');
t(/var _CU_FEEDBACK_LABEL='';/.test(src),   'the bolded Feedback: label is gone');
t(!/uD835/.test(src),                       'and no bold-unicode is left anywhere in the file');
t(/\(fb\?\('\\n\\n'\+fb\):''\)/.test(src),   'the paragraph still goes last, it just stops announcing itself');

console.log('\n  an average of one day is not an average:');
const fbFn=src.slice(src.indexOf('if(fed.length===1){'), src.indexOf('if(fed.length===1){')+700);
t(fbFn.length>100,                          'one logged day is worded on its own');
t(/One day logged out of/.test(fbFn),       'said as that day, not as a mean');
t(/averaging/.test(src),                    'and several days still average, because then it means something');

console.log('\n  two whole messages are never stapled:');
const tail=src.slice(src.indexOf('var _staged='), src.indexOf('var _staged=')+900);
t(/_dfPending/.test(tail),                  'it checks whether a draft is already staged');
t(/_cuDaysOnly\(D\)/.test(tail),            'and then sends the DAYS ONLY');
t(/_jvGreet\(body\)/.test(tail),            'the greeting is only added when nothing is staged');
t(tail.indexOf('_jvGreet')>tail.indexOf('_cuDaysOnly'),
                                            'in the else branch, after the staged case');
const daysOnly=src.slice(src.indexOf('function _cuDaysOnly(D){'), src.indexOf('function _cuDaysOnly(D){')+420);
t(!/On your last/.test(daysOnly),           'the days-only build carries no opener');
t(!/_cuFeedback/.test(daysOnly),            'and no closing paragraph');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
