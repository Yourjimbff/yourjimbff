// The scrubber line, lifted out of jimTurn by its own comment anchor.
const fs=require('fs');
const L=fs.readFileSync('index.html','utf8').split('\n');
const i=L.findIndex(l=>l.includes('daysAgo|days_ago|eat_time|date_str'));
const rule=L[i].trim().replace(/^\.replace\(/,'').replace(/\)$/,'');
const f=new Function('s','return s.replace('+rule+');');
const C=[
 ['logging it for yesterday (daysAgo: 1) at 6:00 PM','logging it for yesterday at 6:00 PM'],
 ['Logged (daysAgo:1) — pancakes','Logged — pancakes'],
 ['Logged for yesterday at 6 PM.','Logged for yesterday at 6 PM.'],
 // A REAL SENTENCE ABOUT MACROS MUST SURVIVE - the guard only strips a
 // PARENTHESISED field, never prose that happens to say "protein: 48".
 ['roughly 950 cal, 48g protein, 72g carbs, 38g fat','roughly 950 cal, 48g protein, 72g carbs, 38g fat'],
 ['Protein: 48g for the day','Protein: 48g for the day'],
 ['Logged — chicken and rice. 620 cal, 48g protein.','Logged — chicken and rice. 620 cal, 48g protein.']
];
let bad=0;
C.forEach(function(c){ const g=f(c[0]).replace(/\s{2,}/g,' ').trim(); const w=c[1].trim(); const ok=(g===w); if(!ok) bad++;
 console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(c[0])); if(!ok){console.log('          got:  '+JSON.stringify(g));console.log('          want: '+JSON.stringify(w));} });
console.log(bad? '\n'+bad+' FAILED':'\nall '+C.length+' pass');
process.exit(bad?1:0);
