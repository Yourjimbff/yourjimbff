/* TURBO ROAST, AND THE LEVER UNDER IT (18 Sep).

   The sternness dial has existed for a while: five settings, stored on the
   profile, rendered into six prompt sites by _jimToneBlock. Turbo was built,
   named, gated - and its text was one line, "blunt, funny, no comfort
   offered", which is a name for a voice rather than a voice.

   Yusuf asked for the real thing. He took the brief to a second model, which
   agreed on where the line sits and returned better language than either of us
   had. This suite guards what came back.

   THE LINE, because every assertion here is about it: as hard as you like at
   the FOOD and the CHOICE, never at the person. His own line to a client -
   "what are you, a trash can" - works from him, in a text, to somebody he has
   coached for a year. As automated text at eleven at night to a stranger it is
   contempt from a machine, and what a person does about that is stop logging. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntturbo - the hardest setting is hard about the food and silent about the person');

const lifted=closure(['_jimToneBlock']);
/* _jimTurboOn is a window flag, not a file-level declaration, so the lifter
   reports it. Named here so the exception is deliberate - and it is worth
   knowing on its own: NOTHING IN THE FILE EVER SETS IT, which is why setting 5
   still reads as 4 for everybody. Turbo is written and unreachable, and opening
   that gate is Yusuf's call, not a lane's. */
const holes=lifted.unresolved.filter(n=>!/^_?(profile|jimTone|jimNoCritique|jimTurboOn)$/.test(n));
ok(!/window\._jimTurboOn\s*=[^=]/.test(src),   // an assignment, not the === that reads it
   'and nothing in the file turns Turbo on, so it stays unreachable until he says');
ok(holes.length===0, 'the tone block lifts with nothing missing', holes);
const F=new Function(
  'var profile=null;'+lifted.code+'\nreturn {_jimToneBlock, _jimTone, _jimNoCritique};')();

const at=n=>F._jimToneBlock({jim_tone:n, jim_no_critique:false});

// ---------------------------------------------- EVERY SETTING SAYS SOMETHING
[1,2,3,4].forEach(n=>{
  const t=at(n);
  ok(t.length>120, 'setting '+n+' renders a real instruction', t.length);
});
ok(/DELIVERY: EASY/.test(at(1)), '1 is Easy');
ok(/DELIVERY: LIGHT TOUCH/.test(at(2)), '2 is Light touch');
ok(/DELIVERY: STRAIGHT UP/.test(at(3)), '3 is Straight up, the default');
ok(/DELIVERY: NO EXCUSES/.test(at(4)), '4 is No excuses');

/* 5 READS AS 4 UNTIL TURBO IS UNLOCKED, which nothing sets yet. So the text is
   read off the function directly as well, to prove it exists behind the gate. */
const turbo=(()=>{ const i=src.indexOf("DELIVERY: TURBO ROAST");
  return src.slice(i, src.indexOf("';", src.indexOf("Turbo is louder about a Twinkie"))); })();
ok(turbo.length>900, 'Turbo is a specification now, not a one-line name', turbo.length);

// ------------------------------------------------------- WHAT TURBO MUST SAY
[
  ['SHORT. Sharp.',                    'it is short and sharp'],
  ['Swearing is',                      'swearing is allowed at this setting'],
  ['NAME THE ENGINEERING',             'it names what the food actually is'],
  ['industrial sweet paste',           'in the language that came back from the second model'],
  ['ASSUME THEY KNOW',                 'it assumes they already know, which is the lever he asked for'],
  ['The knowledge is not the problem', 'and puts it on the using rather than the knowing'],
  ['THE SWAP IS NOT OPTIONAL',         'the swap is mandatory'],
  ['FIRST THING TO GO WRONG',          'and is named as the beat most likely to be dropped'],
  ['what is good is still good',       'a decent plate is still recognised'],
].forEach(([needle,msg])=>{
  ok(turbo.toLowerCase().indexOf(needle.toLowerCase())>=0, msg);
});

// ------------------------------------------------- WHAT TURBO MAY NEVER DO
ok(/THE TARGET IS THE FOOD AND THE CHOICE/.test(turbo), 'the target is stated explicitly');
['their discipline','their character','their self respect','their body'].forEach(x=>{
  ok(turbo.indexOf(x)>=0, 'and "'+x+'" is named as out of bounds');
});
ok(/trash can/.test(turbo) && /is not, and the difference/.test(turbo),
   'his own line is quoted as the example of what NOT to do, so the boundary is concrete');

/* THE TWO FLOORS. These protect clients on a loss goal and anyone with a
   disordered history, and a louder setting is exactly where they would be
   quietly lost. Turbo has to restate them itself. */
ok(/not one word about how much they ate/i.test(turbo), 'quantity is still forbidden at Turbo');
ok(/their weight, their body/i.test(turbo), 'weight and body are still forbidden at Turbo');
ok(/It is not a different subject/.test(turbo),
   'and Turbo is stated to be a louder voice, never a wider remit');

// and the global rules are still in the file, untouched by any of this
ok(/NEVER tell a client a meal or a day is too heavy, too much, or more than they should have/.test(src),
   'the app-wide rule against calling a meal too much still stands');
ok(/NEVER grill, roast, scold, or express concern about a meal being LOW in calories/.test(src),
   'and the rule protecting a small meal still stands');

// ------------------------------------------------------ LEVEL 4 GOT THE LEVER
const four=at(4);
ok(/ASSUME THEY ALREADY KNOW/.test(four), 'No excuses assumes the knowledge too');
ok(/NAME A PATTERN WHEN THERE IS ONE/.test(four), 'and calls a pattern when the logs show one');
ok(/NEVER count or total anything they ate/.test(four),
   'without ever totalling what they ate, which would be the quantity rule by the back door');

// -------------------------------------------------- THE OPT-OUT STILL WINS
const noCrit=F._jimToneBlock({jim_tone:5, jim_no_critique:true});
ok(/FACTS ONLY/.test(noCrit), 'somebody who asked not to be critiqued gets facts only');
ok(!/TURBO/.test(noCrit), 'and their setting outranks Turbo entirely');

// -------------------------------------------------------- IT REACHES PROMPTS
ok((src.match(/_jimToneBlock\(\)/g)||[]).length>=5,
   'the block is wired into every prompt that writes a read', (src.match(/_jimToneBlock\(\)/g)||[]).length);

console.log(fails? ('\ntturbo: '+fails+' FAILED\n') : '\ntturbo: all good\n');
process.exit(fails?1:0);
