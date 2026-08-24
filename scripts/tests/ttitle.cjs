const fs=require('fs');
const src=fs.readFileSync('index.html','utf8').split('\n');
const a=src.findIndex(l=>l.startsWith('function _titleCap(s){'));
let b=a; while(src[b]!=='}') b++;
eval(src.slice(a,b+1).join('\n'));
const C=[
  ['morning walk','Morning Walk'],                       // HIS SENTENCE -> his grid
  ['Morning walk','Morning Walk'],                       // what Jarvis produced
  ['Morning Walk','Morning Walk'],                       // what he typed: unchanged
  ['silver diner dinner','Silver Diner Dinner'],
  ['leg day','Leg Day'],
  ['dentist','Dentist'],
  ['StairMaster','StairMaster'],                          // inner capital survives
  ['MyFitnessPal full day','MyFitnessPal Full Day'],
  ['AMRAP','AMRAP'],
  ['chicken, rice & broccoli','Chicken, Rice & Broccoli'],
  ['Philly Cheesesteak Omelet with Pancakes','Philly Cheesesteak Omelet with Pancakes'],
  ['yusuf’s walk','Yusuf’s Walk'],              // apostrophe is not a word break
  ['check-in call','Check-in Call'],
  ['3 mile run','3 Mile Run'],
  ['push and pull','Push and Pull'],
  ['',''],
  [null,'']
];
let bad=0;
C.forEach(function(c){ const g=_titleCap(c[0]); const ok=(g===c[1]); if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+JSON.stringify(c[0])+' -> '+JSON.stringify(g)+(ok?'':'  (wanted '+JSON.stringify(c[1])+')')); });
console.log(bad? '\n'+bad+' FAILED' : '\nall '+C.length+' pass');
process.exit(bad?1:0);
