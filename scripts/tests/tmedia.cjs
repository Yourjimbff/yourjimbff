// A PRIVATE BUCKET STILL HAS TO BE LOOKABLE-AT.
//
// WHAT THIS IS GUARDING AGAINST IS A MISTAKE I ALREADY MADE. Closing the two
// storage buckets on 15 Sep was right and stays. What went unnoticed for a day
// is that the app builds exactly one shape of image URL —
//     /storage/v1/object/public/<bucket>/<path>
// — and a private bucket answers 400 to every one of them. Every progress
// photo and every meal-library thumbnail in the database pointed at a 400.
// A lock that silently deletes the thing it was protecting is a loss, not a
// lock, and the read path had to ship in the same hour as the lock.
//
// So this file asserts BOTH halves stay true at once: the buckets stay shut,
// and there is a signed way in for the person the photo belongs to.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const door=fs.readFileSync('netlify/functions/media.js','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };
const between=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); return (i<0||j<0||j<i)?'':src.slice(i,j); };

console.log('\n  THE DOOR DECIDES, AND IT DECIDES ON THE PATH:');
t(/const { verify } = require\('\.\/session\.js'\)/.test(door), 'it requires a signed session');
t(/if \(!claims\) return json\(401/.test(door), '  no session, no signature');
t(/if \(!claims\.client_code\) return json\(401/.test(door), '  and a session with nobody in it is not a session');
t(/if \(first === String\(claims\.client_code \|\| ''\)\) return true;/.test(door),
  'your own folder is yours');
t(/if \(claims\.is_trainer === true\) return true;/.test(door), 'a trainer may see the people he coaches');
t(/bucket === 'meal-photos' && first === 'coach'/.test(door), 'and the shared meal library belongs to nobody');
t(/return false;\n\}/.test(door), 'everything else is refused');
t(/const BUCKETS = \['progress-photos', 'meal-photos'\]/.test(door), 'only the two real buckets');
t(/if \(path\.indexOf\('\.\.'\) >= 0\) return false;/.test(door), 'and a path cannot climb out of its folder');
t(/const SAFE = \/\^\[A-Za-z0-9\]/.test(door), '  the path is treated as hostile input even from our own database');

console.log('\n  AND IT CAN ONLY EVER SHOW, NEVER WRITE:');
t(/String\(body\.op \|\| 'sign'\) !== 'sign'/.test(door), 'sign is the only op it answers to');
t(!/method: 'DELETE'|method: 'PUT'/.test(door), 'it has no delete and no write');
t(!/\/object\/list\//.test(door), 'and it cannot list a folder');
t(/event\.httpMethod !== 'POST'/.test(door), 'POST only, so nothing is signed by a link');
t(/'Cache-Control': 'no-store'/.test(door), 'and a signature is never cached by anything in between');

console.log('\n  THE PAGE HEALS EVERY IMAGE, NOT TWENTY NAMED ONES:');
t(/document\.addEventListener\('error', function\(e\)\{/.test(src), 'it listens for images that fail');
t(/\}, true\);/.test(between("document.addEventListener('error'", 'function mediaWarm(')),
  '  in the CAPTURE phase, because an image error does not bubble');
const heal=between('function _mediaHeal(el){','try{\n  document.addEventListener');
t(/if\(el\.getAttribute\('data-msgn'\)\) return;/.test(heal), 'one attempt per image, so a missing file fails once');
t(/var p=_mediaParse\(src\); if\(!p\) return;/.test(heal), 'and anything that is not one of ours is left alone');
const parse=between('function _mediaParse(u){','async function _mediaSign(list){');
t(/\/storage\/v1\/object\/public\//.test(parse), 'it recognises the URL shape already in the database');
t(/decodeURI\(path\)/.test(parse), '  and undoes the encoding uploadProgressImage put on');

console.log('\n  THE ONE PHOTO THAT IS NOT AN <img> IS HANDLED BY NAME:');
const card=between('function renderPhotoCard(){','// THE PROGRESS TAB. It owns no rendering of its own');
t(/background-image:url/.test(card), 'the progress card still draws CSS backgrounds');
t(/_mediaCached\(u\)/.test(card), '  so it asks for a signature before it draws');
t(/_mediaSign\(needSign\)\.then/.test(card), '  and redraws when the signatures land');
t(/!window\._ppWarmKey/.test(card), '  once, not on a loop');

console.log('\n  NOTHING HERE REOPENS A BUCKET:');
t(!/public=true|public: true/.test(door+src), 'no code anywhere sets a bucket public');
t(/expiresIn/.test(door), 'the URLs it hands out expire');
t(/Math\.min\(Math\.max\(parseInt\(body\.expires, 10\) \|\| 3600, 60\), 86400\)/.test(door),
  '  and the caller cannot ask for one that never does');
t(/_MEDIA_TTL_MS=50\*60\*1000/.test(src), 'the page throws its copy away before the signature lapses');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (shut to everyone, open to you)');
process.exit(bad?1:0);
