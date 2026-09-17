// THE KEY, IN EVERY SHAPE IT CAN ARRIVE IN.
//
// The second real send answered "502 key error:1E08010C:DECODER
// routines::unsupported" — OpenSSL for "this is not a key I can read". The key
// was there. It was simply not in a shape crypto would take, and there are only
// a few ways a .p8 gets out of shape between a text file and an environment
// variable: a single-line paste box eats the newlines, a form escapes them to
// the two characters \n, a shell wraps the value in quotes, a Windows editor
// adds carriage returns, or someone base64s the whole file to dodge the
// newline problem entirely.
//
// None of those is the person's mistake to fix, and "paste it again" is not an
// answer when there is no way to see which shape arrived. So the body is pulled
// out and the PEM rebuilt, and this runs the real signer over every shape
// against a scratch key generated here — never his.
const crypto=require('crypto');
const { toPem }=require('../../netlify/functions/_apns.js');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+x+']'):'')); };

const key=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const good=key.privateKey.export({type:'pkcs8',format:'pem'});
const body=good.replace(/-----[^-]+-----/g,'').replace(/\s+/g,'');

function signs(raw){
  try{
    const s=crypto.createSign('SHA256'); s.update('header.payload'); s.end();
    const sig=s.sign({key:toPem(raw), dsaEncoding:'ieee-p1363'});
    // ES256 over P-256 is r||s, 32 bytes each. A DER envelope is not 64 bytes,
    // so this also proves the encoding Apple insists on.
    return sig.length===64;
  }catch(e){ return false; }
}

console.log('\n  EVERY REALISTIC PASTE SIGNS:');
t(signs(good), 'the file exactly as downloaded');
t(signs(good.replace(/\n/g,'')), 'newlines eaten by a one-line input');
t(signs(good.replace(/\n/g,'\\n')), 'newlines escaped to the two characters \\n');
t(signs(good.replace(/\n/g,'\r\n')), 'carriage returns from a Windows editor');
t(signs('"'+good+'"'), 'wrapped in quotes by a shell');
t(signs(body), 'the base64 body with the BEGIN and END lines lost');
t(signs(Buffer.from(good,'utf8').toString('base64')), 'the whole file base64d to dodge newlines');
t(signs('  \n'+good+'\n\n  '), 'padded with blank lines and spaces');

console.log('\n  AND NOTHING ELSE DOES:');
t(!signs('hello world'), 'rubbish is still refused');
t(!signs(''), 'an empty value is still refused');
t(toPem('')==='', '  and an empty value produces no PEM at all to sign with');

console.log('\n  IT REBUILDS THE PEM THE WAY OPENSSL WANTS IT:');
const out=toPem(good.replace(/\n/g,''));
t(/^-----BEGIN PRIVATE KEY-----\n/.test(out), 'BEGIN line on its own');
t(/\n-----END PRIVATE KEY-----\n$/.test(out), 'END line on its own');
const mid=out.split('\n').slice(1,-2);
t(mid.every(l=>l.length<=64) && mid.some(l=>l.length===64), 'body wrapped at 64 characters');
/* Apple's .p8 is PKCS8, but a key that arrives under a different label must
   come back out under that label rather than being silently relabelled. */
t(/BEGIN EC PRIVATE KEY/.test(toPem('-----BEGIN EC PRIVATE KEY-----\n'+body+'\n-----END EC PRIVATE KEY-----')),
  'and the label the file carried is kept, not assumed');

console.log(bad? '\n  '+bad+' FAILED\n' : '\n  all good (however he pasted it, it signs)\n');
process.exit(bad?1:0);
