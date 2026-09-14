// SPEAK THE PLATE, AND STOP WHEN THEY ARE DONE (Yusuf, 14 Sep, the hour the
// app went live: "there needs to be a microphone icon here that WORKS ... just
// like this microphone icon in this chat. the simple icon. NO emoji ... people
// need to be able to speak into it. make sure it stops recording once they hit
// submit or finish their log.")
//
// The second sentence is the one with teeth. A recogniser nobody stopped keeps
// the red recording dot on somebody's phone after they have put the app down,
// and Chrome restarts its own session on every pause - so onend does NOT mean
// finished and cannot be the stop. There are three ways out of that screen and
// every one of them has to close the microphone:
//   Log it            -> nlSubmit
//   the X, or a tap outside -> nlClose
//   anything that moves off the capture stage -> nlRender
// A test that only checked the button appeared would go green over an app that
// listens to somebody's kitchen for the rest of the evening.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const L=src.split('\n');
function slice(a,b){
  const i=src.indexOf(a), j=src.indexOf(b, i+1);
  return (i<0||j<0)?'':src.slice(i,j);
}
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

console.log('\n  THE ICON HE ASKED FOR:');
const cap=slice("if(st.stage==='cap'){", "else if(st.stage==='busy')");
t(/id="nlMic"/.test(cap), 'the capture screen has a microphone key');
t(/onclick="nlVoice\(\)"/.test(cap), 'and tapping it starts the voice');
t(/_NL_MIC/.test(cap), 'drawn from one glyph, not pasted per call site');
const glyph=slice("var _NL_MIC=", "var _nlRec=null");
t(/<svg/.test(glyph) && /<rect x="9" y="2"/.test(glyph), 'which is a stroked SVG mic');
// NO EMOJI, said twice and in capitals. An emoji renders at a different size
// and colour on every phone and cannot take a recording state.
t(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(glyph), 'and carries no emoji');
t(!/[\u{1F300}-\u{1FAFF}]/u.test(cap), 'nor does the screen around it');
t(/aria-label="/.test(cap), 'it says what it is for a screen reader');

console.log('\n  IT ACTUALLY LISTENS:');
const v=slice('function nlVoice(){','function nlStopVoice(){');
t(/SpeechRecognition\|\|window\.webkitSpeechRecognition/.test(v), 'it uses the browser’s own recogniser');
t(/continuous=true/.test(v), 'and keeps listening through the pauses in a sentence');
t(/interimResults=true/.test(v), 'with the words showing up as they are said');
t(/_nlRecBase=String\(ta\.value\|\|''\)/.test(v), 'anything already typed is kept, not overwritten');
t(/dispatchEvent\(new Event\('input'/.test(v),
  'the breakdown underneath hears it too - setting .value fires no input event');
t(/error==='no-speech'\) return/.test(v), 'a silence is not treated as a fault');
t(/not-allowed/.test(v), 'and a blocked microphone says so instead of failing silently');

console.log('\n  AND IT STOPS. ALL THREE WAYS OUT:');
const stop=slice('function nlStopVoice(){','function nlRender(){');
t(/_nlRecOn=false;/.test(stop), 'the flag goes down first');
t(/onend=null/.test(stop), 'onend is unhooked, so the restart cannot fire behind the stop');
t(/\.stop\(\)/.test(stop), 'and the recogniser is actually stopped');
t(/_nlRec=null/.test(stop), 'with nothing left pointing at it');

// nlSubmitFast is defined ABOVE nlSubmit in the file, so it cannot be the end
// marker - slicing to it returns nothing and the assertion passes on an empty
// string. Cut to whatever function comes next instead.
function after(a){
  const i=src.indexOf(a); if(i<0) return '';
  const m=/\n(?:async )?function /.exec(src.slice(i+a.length));
  return m ? src.slice(i, i+a.length+m.index) : src.slice(i);
}
const sub=after('async function nlSubmit(){');
t(/nlStopVoice\(\)/.test(sub), 'Log it stops it');
t(sub.indexOf('nlStopVoice()') < sub.indexOf("getElementById('nlLine')"),
  'and stops it BEFORE reading the line, so everything said is logged');

const close=slice('function nlClose(){','/* ===== THE ECHO');
t(/nlStopVoice\(\)/.test(close), 'closing the sheet stops it');

const rend=slice('  sh.innerHTML=h;',"    var ln=document.getElementById('nlLine');");
t(/st\.stage!=='cap'/.test(rend) && /nlStopVoice\(\)/.test(rend),
  'and any repaint that leaves the capture stage stops it');

console.log('\n  THE STATE SURVIVES A REPAINT:');
// nlRender replaces the whole sheet, so the button is a new element every time.
t(/_nlRecOn\?' on':''/.test(cap), 'a redraw mid-sentence comes back still recording');
t(/function _nlMicPaint\(\)/.test(src), 'and one painter owns how it looks');

console.log(bad? ('\n  '+bad+' FAILED') : '\n  all passed');
process.exit(bad?1:0);
