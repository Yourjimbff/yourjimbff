const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
function grab(p){ const a=L.findIndex(p); let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); }
function multi(sw){ const a=L.findIndex(l=>l.trim().startsWith(sw)); let b=a; while(!/;\s*$/.test(L[b])) b++; return L.slice(a,b+1).join('\n'); }
eval([ multi('var _JV_SAID_PERSON_RE=new RegExp('),
       multi('var _JV_INVENTED_PERSON_RE=new RegExp('),
       grab(l=>l.startsWith('function _jimStripInventedPerson(')) ].join('\n'));
require('./_guard.cjs')(['_JV_INVENTED_PERSON_RE','_JV_SAID_PERSON_RE','_jimStripInventedPerson'], function(n){ return eval(n); });

// HIS SENTENCE, verbatim, typo intact -- and the reply he actually got.
const HIS = "for dinner at six o'clock I had Silver Diner, Philly cheesesteak omelette with two pancakes";
const CASES = [
 // [ what he said, what the model replied, what must survive ]
 ['STRIP  his exact case', HIS,
  'Love that you took her out — that’s what it’s about. Logged your dinner — Philly cheesesteak omelette & pancakes. 1240 cal, 52g protein.',
  'Logged your dinner — Philly cheesesteak omelette & pancakes. 1240 cal, 52g protein.'],
 ['STRIP  invented wife', 'had a burger and fries',
  'Logged — burger and fries. Hope your wife enjoyed hers too.',
  'Logged — burger and fries.'],
 ['STRIP  invented kids', 'pizza tonight',
  'Logged — pizza. The kids must have been thrilled.',
  'Logged — pizza.'],
 ['STRIP  invented companion', 'steak at the diner',
  'Steak at the diner, logged. Nice that you went with him.',
  'Steak at the diner, logged.'],
 ['STRIP  invented third party did something', 'ordered the salmon',
  'Logged — salmon. She picked well.',
  'Logged — salmon.'],
 // MUST NOT STRIP -- he named the person himself, or it is Yusuf.
 ['KEEP   he said "with my wife"', 'dinner with my wife, steak and potatoes',
  'Logged — steak and potatoes. Hope your wife enjoyed hers.',
  'Logged — steak and potatoes. Hope your wife enjoyed hers.'],
 ['KEEP   he said "we"', 'we had tacos tonight',
  'Logged — tacos. Hope they went down well with them.',
  'Logged — tacos. Hope they went down well with them.'],
 ['KEEP   he named his mom', 'took my mom out for brunch, eggs benedict',
  'Love that you took her out. Logged — eggs benedict.',
  'Love that you took her out. Logged — eggs benedict.'],
 ['KEEP   Yusuf is real', 'my knee is hurting after squats',
  'Noted. That is a Yusuf call, I will make sure he sees it.',
  'Noted. That is a Yusuf call, I will make sure he sees it.'],
 ['KEEP   ordinary confirmation', 'chicken and rice',
  'Logged — chicken and rice. 620 cal, 48g protein.',
  'Logged — chicken and rice. 620 cal, 48g protein.']
];
let bad=0;
CASES.forEach(function(c){
  const got=_jimStripInventedPerson(c[2], c[1]);
  const ok=(got===c[3]);
  if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+c[0]);
  if(!ok){ console.log('          got:  '+JSON.stringify(got)); console.log('          want: '+JSON.stringify(c[3])); }
});
console.log(bad? '\n'+bad+' FAILED' : '\nall '+CASES.length+' pass');
process.exit(bad?1:0);
