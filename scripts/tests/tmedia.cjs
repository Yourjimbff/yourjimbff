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
t(!/method: 'DELETE'/.test(door), 'it can never delete anything');
t(!/\/object\/list\//.test(door), 'and it cannot list a folder');
t(!/method: 'PUT'/.test(door), '  it does not write the bytes itself either');
t(/event\.httpMethod !== 'POST'/.test(door), 'POST only, so nothing is signed by a link');
t(/'Cache-Control': 'no-store'/.test(door), 'and a signature is never cached by anything in between');

console.log('\n  THE PAGE HEALS EVERY IMAGE, NOT TWENTY NAMED ONES:');
t(/document\.addEventListener\('error', function\(e\)\{/.test(src), 'it listens for images that fail');
t(/\}, true\);/.test(between("document.addEventListener('error'", 'function mediaWarm(')),
  '  in the CAPTURE phase, because an image error does not bubble');
const heal=between('function _mediaHeal(el){','/* AND THE VIEWER DOES NOT WAIT TO FAIL FIRST.');
/* THE GUARD IS PER PICTURE, NOT PER ELEMENT, and that distinction was a real
   bug: the photo viewer's <img> is created once and reused for every photo
   anybody opens, so a flag meaning "this element already tried" refused every
   photo after the first one. Yusuf, 16 Sep: "expanding on someone's photo seems
   to have the image not render." */
t(/if\(el\.getAttribute\('data-msgn'\)===src\) return;/.test(heal),
  'one attempt per PICTURE, so a reused element still heals the next one');
t(/el\.setAttribute\('data-msgn',src\);/.test(heal), '  and it records which picture it spent the attempt on');
t(!/data-msgn','1'/.test(src), '  the per-element flag is gone, not left beside it');
const vf=between('function _mediaSrcFor(src, done){','var SB_BUCKET');
t(/_mediaCached\(src\)/.test(vf) && /_mediaSign\(\[src\]\)/.test(vf),
  'and the viewer signs up front rather than failing first');
t(/_mediaSrcFor\(src, function\(u\)\{ try\{ _lbImg\.src=u; \}catch\(e\)\{\} \}\);/.test(src),
  '  which is what openPhotoLightbox uses');
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

console.log('\n  AND PUTTING ONE IN GOES THROUGH THE SAME DOOR:');
t(/op !== 'sign' && op !== 'upload'/.test(door), 'there are exactly two ops');
t(/const folder = wantCoach \? 'coach' : String\(claims\.client_code\);/.test(door),
  'the FOLDER is the client code out of the token, never a parameter');
t(/const name = Date\.now\(\) \+ '-' \+ Math\.random\(\)/.test(door), 'and the door names the file itself');
t(/if \(wantCoach && \(bucket !== 'meal-photos' \|\| claims\.is_trainer !== true\)\)/.test(door),
  'only a trainer may write to the shared library');
t(/upload\/sign\//.test(door), 'it hands back a signed upload URL');
t(!/body: blob|body: bytes|Buffer\.from\(/.test(door), '  so the bytes never come through the function');
const up=between('async function _mediaUpload(blob, bucket, coach){','// Upload a full-res image blob');
t(/if\(!tok\)\{/.test(up), 'the page will not even try without a session');
t(/method:'PUT'/.test(up), 'and PUTs the bytes straight at storage');
t(!/SB_KEY/.test(up), '  with no public key anywhere in it');
const prog=between('async function uploadProgressImage(blob, clientCode){','/* The two callers pass');
t(/_mediaUpload\(blob, SB_BUCKET, false\)/.test(prog), 'progress photos go through it');
const meal=between('async function uploadMealPhoto(blob, clientCode){','// Both write helpers return a BOOLEAN');
t(/_mediaUpload\(blob, MEAL_BUCKET/.test(meal), 'and so do meal photos');
/* The public key is allowed exactly three homes now: the apikey header Supabase
   requires beside a session, the bearer fallback for a device with no session
   yet, and the auth endpoint, which is what it is for. Storage is not on that
   list any more. */
const keyUses=(src.match(/SB_KEY/g)||[]).length;
t(keyUses<=5, 'the public key is down to a handful of uses', keyUses);
t(!/storage\/v1\/object\/[^p][^\s']*'[^)]*SB_KEY/.test(src), 'and none of them is a storage write');

console.log('\n  NOTHING HERE REOPENS A BUCKET:');
t(!/public=true|public: true/.test(door+src), 'no code anywhere sets a bucket public');
t(/expiresIn/.test(door), 'the URLs it hands out expire');
t(/Math\.min\(Math\.max\(parseInt\(body\.expires, 10\) \|\| 3600, 60\), 86400\)/.test(door),
  '  and the caller cannot ask for one that never does');
t(/_MEDIA_TTL_MS=50\*60\*1000/.test(src), 'the page throws its copy away before the signature lapses');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (shut to everyone, open to you)');
process.exit(bad?1:0);
