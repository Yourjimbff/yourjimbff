/* THE WORD HE HAS BANNED THREE TIMES (Yusuf, 18 Sep).

   "Stop relying on the word solid in the responses. Count how many times you
    said solid in feedback logs and fucking kill it. Enhance your vocabulary
    dude, you're making me fucking look bad."

   COUNTED IN THE SOURCE, WHICH IS WHERE THE CAUSE WAS. The prompts told the
   model twice not to open with it - and then handed it, in the same prompts,
   as the worked example of what to say:
     "First acknowledge it works - \"Solid in a pinch.\""
     "INTENSITY 7-8 (heavy): Solid carb refeed warranted."
   A model copies the example and skims the instruction.

   Both examples are rewritten, and this suite keeps them rewritten. The filter
   is the guard, because the ban has been asked for three times and come back
   three times. */
const fs=require('fs'), path=require('path');
const root=path.join(__dirname,'..','..');
process.chdir(root);
const {closure}=require('./_lift.cjs');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
let fails=0;
const ok=(c,m,x)=>{ console.log((c?'  ok   ':'  FAIL ')+m+(x!==undefined?('  '+JSON.stringify(x)):'')); if(!c) fails++; };

console.log('\ntsolid - the word is gone from the reads and from what teaches them');

const lifted=closure(['_jimVoiceFix']);
ok(lifted.unresolved.length===0, 'the filter lifts with nothing missing', lifted.unresolved);
const F=new Function(lifted.code+'\nreturn {_jimVoiceFix};')();

// ------------------------------------------------- THE WORD DOES NOT SURVIVE
const REAL=[
  'Solid choice. The protein is doing the work here.',
  'Solid protein anchor at 52g, and the carbs are timed right.',
  'Lunch is solid for your goal.',
  'That is a solid plate - lean protein, smart carb.',
  'Solid. Keep that going tomorrow.',
  'Nice build. Solid fats from the avocado.'
];
REAL.forEach(t=>{
  const out=F._jimVoiceFix(t);
  ok(!/\bsolid\b/i.test(out), 'no "solid" survives: '+t.slice(0,38)+'...', out);
  ok(out.length>10, 'and the sentence is still a sentence', out);
});

// the opener he named by name
const op=F._jimVoiceFix('Solid choice. Good protein.');
ok(/^[A-Z]/.test(op), 'a replaced opener still starts with a capital', op);
ok(!/^Solid/.test(op), 'and is not Solid');

// capitalisation is carried across
ok(/^[A-Z]/.test(F._jimVoiceFix('Solid work today.')), 'a capital Solid is replaced with a capital word');
const mid=F._jimVoiceFix('The protein is solid here.');
ok(/ [a-z]+ here/.test(mid) && !/\bSolid\b/.test(mid), 'a lower-case solid stays lower case', mid);

// ------------------------------------------------- IT IS STABLE AND IT VARIES
const a='Solid protein anchor at 52g.';
ok(F._jimVoiceFix(a)===F._jimVoiceFix(a), 'the same read always renders the same way');
const outs=new Set(REAL.map(t=>F._jimVoiceFix(t).split(/[ ,.]/)[0]));
ok(outs.size>=3, 'and different reads do not all land on the same word', [...outs]);

// -------------------------------------------- WHAT IT MUST NOT TOUCH
ok(F._jimVoiceFix('Move to solid food when you can.')==='Move to solid food when you can.',
   '"solid food" is the real term and is left alone');
ok(F._jimVoiceFix('Solid foods only after noon.')==='Solid foods only after noon.',
   'and so is "solid foods"');
const clean='Clean plate - lean protein, smart carb, easy win.';
ok(F._jimVoiceFix(clean)===clean, 'a read without the word is returned untouched');
ok(F._jimVoiceFix('')==='' && F._jimVoiceFix(null)==='', 'and an empty read does not throw');

// ---------------------------------------- THE EXAMPLES THAT TAUGHT IT ARE GONE
/* COUNTED IN LIVE CODE ONLY. Comments in this file quote the old examples in
   order to explain why they were removed - including the block above the
   filter itself - so a raw grep reports the explanation as the offence. The
   comments are stripped first, and what is left is what actually ships to a
   client. */
function stripComments(t){
  let out='', i=0, n=t.length;
  while(i<n){
    const two=t.slice(i,i+2);
    if(two==='/*'){ const j=t.indexOf('*/', i+2); i = j<0 ? n : j+2; out+=' '; continue; }
    if(two==='//'){ const j=t.indexOf('\n', i);   i = j<0 ? n : j;   out+=' '; continue; }
    out+=t[i++];
  }
  return out;
}
const live=stripComments(src);
ok(live.indexOf('Solid in a pinch')<0,
   'the prompt no longer answers a convenience food with "Solid in a pinch."');
ok(live.indexOf('Solid carb refeed')<0,
   'and no longer opens the heavy-training line with "Solid carb refeed"');

/* Every remaining "Solid" in LIVE code must be one of: the two lines that
   forbid the word, a workout-intensity label (not a read), a CSS note, or the
   filter's own pattern. None may be an example of a read. */
const offenders=[];
live.split('\n').forEach((ln,i)=>{
  if(!/Solid/.test(ln)) return;
  const ok2=/do not lean on|avoid starting reads with/.test(ln);   // the bans themselves
  const ok3=/woIntensity|Workout logged/.test(ln);                 // an intensity label
  const ok4=/Solid underline|Solid gold/.test(ln);                 // CSS notes
  const ok5=/Solid\\s\+choice|_jimVoiceFix/.test(ln);               // the filter's own pattern
  if(!(ok2||ok3||ok4||ok5)) offenders.push((i+1)+': '+ln.replace(/^\s+/,'').slice(0,90));
});
ok(offenders.length===0, 'no "Solid" is left in live code as an example of a read', offenders);

/* AND IT RUNS ON THE WAY IN, NOT ONLY ON THE WAY OUT (18 Sep, measured on his
   own rows). v540 filtered at display, which cleaned his feed and left every
   stored read carrying the word into every other surface and every export.
   The numbers that settled it: 1,791 of 3,049 stored reads contain "solid",
   690 OPEN with it, and on the day after the prompt was changed it was still
   4 of 7 - the prompt moved nothing, because a prompt is a request. */
const WRITES=[
  ['_insightMacroSafe', /function _insightMacroSafe\(insight, row\)\{[^]{0,900}?_jimVoiceFix\(insight\)/],
  ['the chat read',      /r\.insight=out; window\._jimFirstRead/],
  ['the photo result',   /curResult\.insight=_jimVoiceFix\(out\)/],
  ['the log sheet',      /st\.est\.insight=_jimVoiceFix\(out\)/],
  ['the re-score',       /e\.insight=_jimVoiceFix\(newInsight\)/],
];
WRITES.forEach(([what,re])=>{ ok(re.test(src), 'the word is taken out before '+what+' stores it'); });
ok(/out=_jimVoiceFix\(out\); r\.insight=out/.test(src),
   'and the chat read is filtered before BOTH the row and the first-read cache');

// ------------------------------------------------- IT IS WIRED IN
ok(/_jimVoiceFix\(v\)/.test(src) && /_jimVoiceFix\(ins\)/.test(src),
   'the feed runs every read through it, so his own board is clean too');
const card=(()=>{ const i=src.indexOf('function _jimCardHtml(text, note){');
  return src.slice(i, src.indexOf('\n}\n', i)); })();
ok(/_jimVoiceFix\(/.test(card),
   'and so does the client gate, which the file calls the one door every read goes through');

console.log(fails? ('\ntsolid: '+fails+' FAILED\n') : '\ntsolid: all good\n');
process.exit(fails?1:0);
