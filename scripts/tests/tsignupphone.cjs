// THE NUMBER HAS TO SURVIVE THE WHOLE TRIP (Yusuf, 14 Sep, the hour the app
// went live: "just actually collect the emails and phone numbers for this sign
// in and keep them").
//
// The email was already being kept - signup.js writes clients.email off the
// verified Supabase user. The NUMBER was never asked for at any point, and
// that single omission is why most of the roster has no way to be texted: the
// reply queue, the check-ins and the booking confirmations all read
// clients.phone and skip anybody whose is empty.
//
// So this measures the two places the number can be lost, and they are
// deliberately different code in two different files:
//   1. the page - a half-typed number must not create an account at all
//   2. the server - whatever arrives over the wire is re-normalised here,
//      because clients.phone is read by _phoneOf and a shape that function
//      does not recognise is the same as no number.
// A test that only checked one of them would go green over an account that
// signed up fine and can never be reached.
const fs=require('fs');
const guard=require('./_guard.cjs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function fnAt(n){
  const a=L.findIndex(l=>l.indexOf('function '+n+'(')===0 || l.indexOf('async function '+n+'(')===0);
  if(a<0) return '';
  let b=a, d=0, seen=false;
  for(; b<L.length; b++){
    for(const ch of L[b]){ if(ch==='{'){ d++; seen=true; } else if(ch==='}'){ d--; } }
    if(seen && d===0) break;
  }
  return L.slice(a,b+1).join('\n');
}
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ---- 1. THE PAGE ----------------------------------------------------------
// doSignup is lifted whole and run against a fake form, so what is measured is
// the shipped order of checks, not a paraphrase of it.
global.window={};
let ERR='', SENT=null;
global._looksEmail=s=>/^[^@\s]+@[^@\s]+$/.test(String(s||''));
global._suErr=m=>{ ERR=String(m); };
global.showLoading=()=>{};
global._sbAuth=async()=>({ok:true, body:{access_token:'a.b.c', refresh_token:'r'}});
global._authSave=()=>{};
global._flipClaimDevice=()=>{};
global.doLogin=async()=>'LOGGED_IN';
global._authMsg=()=>'auth';
global._authToCode=async(tok,name,phone)=>{ SENT={tok,name,phone}; return {ok:true, body:{code:'utest'}}; };

const FORM={};
global.document={ getElementById:id=>(id in FORM)?{value:FORM[id], focus(){}}:null };

eval([fnAt('_phoneNorm'), fnAt('doSignup')].join('\n'));
guard(['_phoneNorm','doSignup'], n=>eval(n));

async function trySignup(phone){
  ERR=''; SENT=null;
  FORM.suName='Test Person'; FORM.suEmail='t@example.com';
  FORM.suPhone=phone; FORM.suPass='abcd1234'; FORM.suPass2='abcd1234';
  global._suBusy=false;
  await doSignup();
  return {err:ERR, sent:SENT};
}

(async ()=>{
  let r;

  r=await trySignup('');
  t(!r.sent && /phone/i.test(r.err), 'empty number never creates an account', JSON.stringify(r.err));

  r=await trySignup('555-123');
  t(!r.sent && /phone/i.test(r.err), 'half-typed number is refused', JSON.stringify(r.err));

  r=await trySignup('530-210-7123');
  t(!!r.sent && r.sent.phone==='+15302107123', 'a dashed US number reaches the server as +1', r.sent&&r.sent.phone);

  r=await trySignup('(530) 210 7123');
  t(!!r.sent && r.sent.phone==='+15302107123', 'brackets and spaces normalise the same', r.sent&&r.sent.phone);

  r=await trySignup('+44 7911 123456');
  t(!!r.sent && r.sent.phone==='+447911123456', 'a country code is believed, not rewritten', r.sent&&r.sent.phone);

  // THE SHAPE HAS TO MATCH WHAT THE TEXTING SIDE LOOKS UP. _phoneOf runs the
  // stored value back through _phoneNorm, so a stored number must be a fixed
  // point of it - otherwise every text path quietly misses this person.
  ['+15302107123','+447911123456'].forEach(p=>{
    t(_phoneNorm(p)===p, 'stored shape is stable through _phoneNorm: '+p, _phoneNorm(p));
  });

  // ---- 2. THE SERVER ------------------------------------------------------
  // Loaded as a real module, not re-read as text: cleanPhone is what actually
  // decides the column value.
  const fnsrc=fs.readFileSync('netlify/functions/signup.js','utf8');
  const m=fnsrc.match(/function cleanPhone\(v\)[\s\S]*?\n\}/);
  t(!!m, 'signup.js still has cleanPhone');
  if(m){
    const cp=eval('('+m[0].replace('function cleanPhone','function')+')');
    t(cp('530-210-7123')==='+15302107123', 'server turns a bare US number into +1', cp('530-210-7123'));
    t(cp('+15302107123')==='+15302107123', 'server leaves an already-normalised number alone', cp('+15302107123'));
    t(cp('+44 7911 123456')==='+447911123456', 'server keeps a real country code', cp('+44 7911 123456'));
    t(cp('555')==='' , 'server refuses a number too short to dial', JSON.stringify(cp('555')));
    t(cp('')==='' , 'server turns nothing into nothing');
    t(cp('1'.repeat(20))==='' , 'server refuses a number too long to be real');
    // The page and the server must agree, or a number that passed the form is
    // stored in a shape the app cannot find.
    ['530-210-7123','(530) 210 7123','+44 7911 123456'].forEach(raw=>{
      t(cp(_phoneNorm(raw))===_phoneNorm(raw), 'page and server agree on '+raw, cp(_phoneNorm(raw)));
    });
  }

  // ---- 3. THE WIRING ------------------------------------------------------
  t(/phone:\s*phone\s*\|\|\s*''/.test(src) || /phone:phone\|\|''/.test(src.replace(/\s/g,'')),
    '_authToCode puts the number in the request body');
  t(/id="suPhone"/.test(src), 'the form has a phone box');
  t(/code, name, email, phone: phone \|\| null, auth_uid: uid,/.test(fnsrc),
    'the client row is written with the number');
  t(/select=code,name,active,phone/.test(fnsrc),
    'the existing-account lookup reads the number back so it can be back-filled');

  console.log(bad? ('  '+bad+' FAILED') : '  all passed');
  process.exit(bad?1:0);
})();
