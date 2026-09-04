// THE FLIP BANNER STOPS COVERING THE PAGE (Yusuf, 4 Sep).
//
// "remove the bottom alarm / banner" ... "i know im signed in as him im saying
// remove the banner when im signed in as a client because it obstructs my view.
// im signed in as a client because im viewing it from their pov"
//
// It is position:fixed above the nav, so on his phone it sat across the Log here
// box with no way past it. A warning that covers the thing it is warning you
// about has stopped being a warning.
//
// WHAT IT WAS FOR IS NOT REMOVED. The guard underneath is untouched - writes are
// still refused, still counted, still reported - so nothing he does while looking
// through a client's eyes lands on that client's record. And the account he is on
// is already named in 24px at the top of every screen; it was sitting there in
// his own screenshot, above the banner saying the same thing.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label,extra)=>{ if(!ok) bad++;
  console.log((ok?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

const fn=src.slice(src.indexOf('function _flipToKnownClient(){'),
                   src.indexOf('function _flipRestore(){'));

console.log('  it only stands down for a client he actually has:');
t(fn.length>200,                          '_flipToKnownClient exists');
t(/yjb_owner_code/.test(fn),              'a device with no owner code still gets the banner');
t(/isTrainer\(owner\)/.test(fn),          'and a device whose owner is not the trainer still gets it');
t(/CLIENTS\[now\]/.test(fn),              'the account has to be a real row on his roster');
t(/now===owner/.test(fn),                 'his own account is not a flip at all');

console.log('\n  and the painter checks it before drawing anything:');
const mark=src.slice(src.indexOf('function _flipPaint(f){'), src.indexOf('function _flipToKnownClient(){'));
t(/if\(_flipToKnownClient\(\)\) return;/.test(mark),
                                          'the banner returns before it is built');

console.log('\n  THE GUARD ITSELF IS UNTOUCHED — this is the half that matters:');
t(/_flipRefuse\('POST '\+table\)/.test(src),        'writes are still refused at the door');
t(/window\._flipRefused/.test(src),                 'and still counted');
t(/status:423/.test(src) || /_fe\.status=423/.test(src),
                                                    'a refused write still answers 423, never a quiet ok');
t(/function _flipRestore\(\)/.test(src),            'the way back to his own account still exists');
t(/jvSignOut\(\)/.test(src),                        'and Sign out is still on the menu, so nothing strands him');

console.log(bad? ('\n'+bad+' FAILED') : '\n  all pass');
process.exit(bad?1:0);
