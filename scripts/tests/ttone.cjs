// A ROUTINE OPERATION GETS NO APPLAUSE (Yusuf, direct order, 27 Aug).
//
// He asked Jarvis by voice to move a meal, and was answered:
//   "Unbelievable work, my fit friend. Blueberry pancakes, a meal corrected.
//    I've logged it. Let me know if you wish to change anything."
//
// The compliment came from a rotating pool written to keep warmth from going
// canned. It went canned anyway: a stock line arriving after an ADMIN
// OPERATION is not warmth, it is noise on top of the one thing he needed,
// which was where the meal landed. Moving a meal is not an achievement.
//
// This asserts the pool is gone, that no hype survives in CODE anywhere, that
// the confirmation is a statement of fact rather than an invitation, and that
// the rule reached the charter so every stage carries it. And it checks BOTH
// SIDES, because the same tone was being taught to Jim.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
// CODE ONLY. The scar is written up in comments right beside the fix, so a raw
// search matches the explanation of why it went and the suite passes itself.
const code=src.split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('\n  THE PHRASE AND ITS POOL ARE GONE FROM THE CODE:');
t(code.indexOf('Unbelievable work')<0, 'the exact phrase he was given is gone');
t(code.indexOf('my fit friend')<0, 'and so is the address it came with');
t(code.indexOf('_JV_BUTLER')<0, 'the pool constant is gone');
t(code.indexOf('_jvButlerLine')<0, 'and the picker that rotated it is gone');
t(code.indexOf('_jvButlerLast')<0, 'and the no-repeat state it kept');
['Splendid.','Most certainly.','Incredible, sir.'].forEach(p=>
  t(code.indexOf(p)<0, 'the rest of the pool is gone too: '+JSON.stringify(p)));

console.log('\n  NOTHING CALLS THE PICKER ANY MORE:');
t(!/_jvButlerLine\s*\(/.test(code), 'no call site survives');
t(!/o\.butler/.test(code), 'and the flag that switched it on is renamed, not left lying');

console.log('\n  THE CONFIRMATION IS A FACT, NOT AN INVITATION:');
const tail=(src.match(/var _JV_CONFIRM_TAIL='([^']*)'/)||[])[1]||'';
t(!!tail, 'there is one confirmation tail, in one place', JSON.stringify(tail));
t(/read back/i.test(tail), 'it states the write was read back');
t(!/let me know|if you wish|anything else|want me to/i.test(tail), 'and it asks him for nothing');
t(code.indexOf('_JV_BUTLER_TAIL')<0, 'the old tail name is gone');

console.log('\n  THE THREE CONFIRM BUILDERS OPEN WITH THE FACT:');
const grab=n=>{ const L=src.split('\n'); const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0);
  if(a<0) return ''; let b=a; while(L[b]!=='}') b++; return L.slice(a,b+1).join('\n'); };
['_jvWorkoutConfirmLine','_jvSelfLandedLine','_jvConfirmLine'].forEach(function(n){
  const f=grab(n);
  t(!!f, n+' still exists');
  t(f.indexOf('_jvButlerLine')<0, n+' opens with no compliment');
  t(f.indexOf('_JV_BUTLER_TAIL')<0, n+' closes with no canned invitation');
});

console.log('\n  THE RULE REACHED THE CHARTER, so every stage carries it:');
const law9=(src.match(/'9\. CONFIRM LIKE A HOST[^']*(?:\\'[^']*)*'/)||[''])[0];
t(!!law9, 'law 9 is still there');
t(/ROUTINE OPERATION GETS NO APPLAUSE/.test(law9), 'and it now says a routine operation gets no applause');
t(/PLAIN AND FACTUAL/.test(law9), 'and that admin is confirmed plain and factual');
t(/READ BACK/.test(law9), 'and that it says the write was read back');
t(/NOT EVERYTHING IS POSITIVE/.test(law9), 'and that not everything is positive');

console.log('\n  BOTH SIDES OF THE ONE BRAIN — Jim was being taught it too:');
t(code.indexOf('Describe it, hype them for it')<0, 'the client prompt no longer tells it to hype them');
t(!/(?<!Do not )hype them for it/.test(code.replace(/Do not hype them for it/g,'')), 'and no other instruction to hype survives');
t(/Do not hype them for it/.test(src), 'and says plainly not to');
t(/applause in front of the work/.test(src), 'with the reason, so it is not re-added');

console.log('\n'+(bad?(bad+' FAILED'):'all pass'));
process.exit(bad?1:0);
