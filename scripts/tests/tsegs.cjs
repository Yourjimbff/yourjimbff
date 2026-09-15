// ONE LINE IS STILL A LIST (Yusuf, 15 Sep, on Lauren Burnam's cross-training
// session): "when it shows on my feed and on their feed, it shows as nicely
// itemized. So bullet points, like different parts of what they did."
//
// Her session arrived as 249 characters on ONE line with no newlines and no
// exercises array. _bfParseDesc split on '\n', found none, and made a single
// item holding the whole session - so both feeds printed a paragraph where a
// list belonged. Confirmed by parsing her real row before a line was changed:
// parsed_items === 1.
//
// The danger in fixing it is over-splitting, and there are exactly two ways to
// do damage: cutting a number in half at its thousands separator, and cutting a
// structured "name: detail" line into fake extra exercises. Both are guarded
// and both are tested here.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0);
  if(a<0) return '';
  let b=a,d=0,seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined?('  '+x):'')); };

const segSrc=fnAt('_bfSegs');
t(!!segSrc, '_bfSegs exists');
if(!segSrc){ console.log('tsegs: FAILED'); process.exit(1); }
const _bfSegs=new Function('return ('+segSrc+')')();

// ---- her real line -------------------------------------------------------
const LAUREN='1.5km warm-up at conversational pace, 2x1km @ 10.6kph + 90s walk rest, '
 +'2x800m @ 10.7kph + 90s walk rest, 2x600m @ 11.1kph + 90s walk rest, '
 +'2x400m @ 11.4kph + 90s walk rest, 1km cool-down at conversational pace, '
 +'Boxing, cardio, and full body strength';
const got=_bfSegs(LAUREN);
t(got.length===9, "her session becomes 9 parts, not one paragraph", got.length);
t(got[0]==='1.5km warm-up at conversational pace', 'the warm-up leads', got[0]);
t(got[5]==='1km cool-down at conversational pace', 'the cool-down is its own line');
t(got.indexOf('Boxing')>=0, 'Boxing is its own part');
t(got.indexOf('Full body strength')>=0, 'the trailing "and X" drops the joining word', JSON.stringify(got.slice(-1)));
t(got.every(s=>s.indexOf(',')<0 || /\d,\d/.test(s)), 'no part still carries a list comma');
t(got.join(' ').indexOf('and full body')<0, '"and" is not left at the head of a part');

// ---- a thousands separator is not a list ---------------------------------
t(JSON.stringify(_bfSegs('1,500m row, 2,000 steps, Boxing'))==='["1,500m row","2,000 steps","Boxing"]',
  '1,500m and 2,000 steps keep their commas', JSON.stringify(_bfSegs('1,500m row, 2,000 steps, Boxing')));
t(_bfSegs('Rowed 1,500m')[0]==='Rowed 1,500m', 'a lone thousands number is never split');
t(_bfSegs('10,000 steps, 5,280 ft').length===2, 'two big numbers, two parts');

// ---- a structured line is not prose --------------------------------------
const BENCH='Bench: 145 lb x 8, 145 lb x 8, 145 lb x 8';
t(_bfSegs(BENCH).length===1, 'a colon line is left whole - three sets, not three exercises');
t(_bfSegs(BENCH)[0]===BENCH, '...byte for byte');
const SQ='Squat — 3 sets x 8, 225 lb';
t(_bfSegs(SQ).length===1, 'an em-dash line is left whole');
t(_bfSegs(SQ)[0]===SQ, '...byte for byte');

// ---- it refuses a split that is not worth making -------------------------
t(_bfSegs('Easy 30 minute walk').length===1, 'no commas: one part');
t(_bfSegs('a, b, c').length===1, 'fragments too short to mean anything are left alone');
t(_bfSegs('').length===0, 'empty in, empty out');
t(_bfSegs(null).length===0, 'null does not throw');
t(_bfSegs('   ').length===0, 'whitespace only: nothing');
t(_bfSegs('Run, ')[0]==='Run, ', 'one real part plus a trailing comma stays as it came');

// ---- each part reads like a line -----------------------------------------
t(JSON.stringify(_bfSegs('Boxing, cardio, and full body strength'))==='["Boxing","Cardio","Full body strength"]',
  'a lowercase mid-sentence part is capitalised on its own line');
t(_bfSegs('2x800m @ 10.7kph, 1km cool-down')[0]==='2x800m @ 10.7kph',
  'a part opening on a digit is untouched');
t(_bfSegs('iPhone timer, Boxing')[0]==='iPhone timer', 'an already-capital part is not re-cased');

// ---- and the parser actually uses it -------------------------------------
const pd=fnAt('_bfParseDesc');
t(/_bfSegs\(ln\)\.forEach/.test(pd), '_bfParseDesc splits every line through _bfSegs');
t(/push\(seg, '', false\);/.test(pd), '...and pushes each part as its own item');
t(!/push\(ln, '', false\);/.test(pd), 'the old whole-line push is gone');

// Both surfaces read the same parser, so both itemise. _woCard is the one
// workout form and _bfItemsFor falls back to _bfParseDesc for a row with no
// exercises array - which is exactly Lauren's row.
t(/return _bfParseDesc\(wo&&wo\.description\);/.test(fnAt('_bfItemsFor')),
  'the card falls back to this parser when there is no exercises array');

console.log(bad? ('tsegs: '+bad+' FAILED') : 'tsegs: all passed');
process.exit(bad?1:0);
