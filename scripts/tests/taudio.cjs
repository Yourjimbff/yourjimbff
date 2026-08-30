// ONE PLAYER, A STRICT QUEUE, AND NO SPURIOUS ABORT.
//
// THE TAPE OFF HIS PHONE, 29 Aug, read 2: five pieces, five play starts, five
// ABORTS at 31–274ms, four of them starting while the player was BUSY and
// cutting the previous clip 300–657ms in. Nothing ever finished. Read 1 aborted
// too — a single-piece line, with no next piece anywhere near it.
//
// THE CAUSE, which read 1 is what proves: onabort was attached BEFORE el.src
// was assigned, and assigning a src makes the browser abort whatever resource
// is currently loaded. That abort landed on the handler just attached for the
// NEW clip. On the very first clip of a session the resource being torn down
// was the silent unlock wav — hence an abort with nothing racing it.
//
// So the loop believed each piece had finished almost immediately, moved on,
// and the next src assignment cut the audio that was still playing.
//
// THIS SUITE REPRODUCES THE BROWSER, not the app's idea of it: the fake element
// below fires `abort` on the old resource exactly as a real one does. Against
// the old code it would show what his tape showed. Against the fix it must show
// every piece playing to its natural end, zero BUSY starts, zero aborts —
// which is the standard he set.
const fs=require('fs');
const guard=require('./_guard.cjs');
const {defOf}=require('./_lift.cjs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra!==undefined&&extra!==''?('  '+extra):'')); };

const store={};
global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
global.window={};
global.document={createElement:()=>({style:{},appendChild(){},select(){}}),body:{appendChild(){},removeChild(){}}};
global.APP_VERSION='v-test';

const MINE=['_JV_TAPE','_JV_TAPE_MAX','_JV_TAPE_KEY','_jvTapeRead','_jvTapeT0','_jvTape','_jvTapeSnip',
  '_jvTapeLoad','_jvTapeReport','_jvTapeClear','_JV_SPEAK_MAX','_jvSpeakChunks','_jvSpeakDesymbol',
  '_JV_CLIPS','_JV_CLIP_MAX','_jvPlayToken','_jvPlayUrl','_jvClipAhead','_jvSpeakLine','_jvAudioEl',
  '_jvSpeakFailNoted','_jvSpeakToastAt'];
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));

// ---- the browser, as it actually behaves --------------------------------
const CLIP_MS=40;
let audioLog=[];
class FakeAudio{
  constructor(){ this._src=''; this.paused=true; this.ended=false; this.currentTime=0;
    this.onended=null; this.onerror=null; this.onabort=null; this.onplaying=null; }
  get src(){ return this._src; }
  set src(v){
    const had=this._src;
    audioLog.push({ev:'src', busy:(!this.paused && this.currentTime>0), at:this.currentTime});
    this._src=v; this.ended=false; this.currentTime=0;
    // THE WHOLE POINT. A real element aborts the load of the resource that was
    // already there, and that event goes to whatever handler is attached now.
    if(had) setTimeout(()=>{ if(this.onabort) this.onabort(); }, 1);
  }
  pause(){ this.paused=true; }
  play(){
    this.paused=false;
    const my=this._src;
    setTimeout(()=>{ if(this._src!==my) return; this.currentTime=0.05; }, 4);
    setTimeout(()=>{ if(this._src!==my) return; if(this.onplaying) this.onplaying(); }, 6);
    setTimeout(()=>{
      if(this._src!==my) return;
      this.currentTime=CLIP_MS/1000; this.ended=true; this.paused=true;
      audioLog.push({ev:'ended'});
      if(this.onended) this.onended();
    }, CLIP_MS);
    return Promise.resolve();
  }
}
global.Audio=FakeAudio;
// BARE ASSIGNMENT: _jvAudioEl is a lifted `var`, so global._jvAudioEl is a
// DIFFERENT binding and the code would quietly build its own element instead.
// Same trap as `cl` in the other suites.
_jvAudioEl=null;
// AND THE GENERATION COUNTER MUST START AT A NUMBER. index.html initialises
// window._jvSpeakGen=0 at module scope; without it ++undefined is NaN, and
// NaN!==NaN, so the very first piece looks superseded and the read returns
// before playing anything. That is what the first run of this suite showed,
// and it was the fixture, not the app.
global.window._jvSpeakGen=0;
global.jvVoiceOn=()=>true;
global.showToast=()=>{};
global._jvSpeakFail=(r)=>{ audioLog.push({ev:'fail', r:r}); };
global._jvSpeakStrip=(h)=>String(h).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
let served=0;
global._jvClipFor=async function(text){ served++; return 'blob:clip-'+served; };

const evs=(name)=>_JV_TAPE.filter(x=>x.ev===name).length;

// A SUITE THAT DIES QUIETLY MUST NOT READ AS PASSING. This one exited 0 with
// eight failures on its own mutant: node ran out of work while still inside the
// async body — an await that never settled — and left with a clean code, which
// run.sh judges by. Nothing below is reached in that case, so the guard is an
// exit hook rather than another assertion.
let reachedEnd=false;
process.on('exit', function(code){
  if(!reachedEnd && code===0){
    console.log('\n  FAIL  the suite never reached its own end — something never settled');
    process.exitCode=1;
  }
});
process.on('unhandledRejection', function(e){
  console.log('\n  FAIL  unhandled rejection: '+(e&&e.message||e));
  process.exit(1);
});

(async function(){
  // ---- 1. THE SINGLE-PIECE READ, which is what proved the cause -----------
  console.log('  A SINGLE-PIECE READ, with the unlock clip still loaded:');
  _jvTapeClear(); audioLog=[]; served=0;
  // Exactly his read 1: the element already holds the silent unlock wav.
  _jvAudioEl=new FakeAudio();
  _jvAudioEl.src='data:audio/wav;base64,UklGRiQAAABXQVZF';
  await _jvSpeakLine('Audio tape cleared. Ask something that speaks.');
  t(evs('play end')===1, 'the one piece plays to its natural end', evs('play end')+' ends');
  t(evs('play ABORT')===0, 'and is NOT aborted', evs('play ABORT')+' aborts');
  t(evs('abort ignored')===1, 'the unlock clip being torn down is seen and ignored',
    evs('abort ignored')+' ignored');
  // THE REGRESSION IN ONE NUMBER: his tape said "play ABORT after 31ms" here.
  const end1=_JV_TAPE.filter(x=>x.ev==='play end')[0];
  t(!!end1 && /played \d+ms/.test(end1.d), 'and the tape records it as played, not aborted', end1&&end1.d);

  // ---- 2. THE FIVE-PIECE DEBRIEF, his read 2 ------------------------------
  console.log('\n  THE FIVE-PIECE DEBRIEF READ:');
  _jvTapeClear(); audioLog=[]; served=0;
  _jvAudioEl=new FakeAudio();
  _jvAudioEl.src='data:audio/wav;base64,UklGRiQAAABXQVZF';
  // A script long enough to chunk into several pieces, as his debrief does.
  const script=['Alright, here is Chris McCarthy before your call.',
    'Training has been strong. Seven sessions last week, six lifts plus a yoga class, and they have averaged five a week all month.',
    'Food has been climbing. They are eating around 1,800 a day lately, up from about 1,500 earlier in the month.',
    'Protein is holding in the mid 130s. And they are consistent, so the gap between their best and worst is small.',
    'The thing to bring up on the call is what they wrote last Wednesday, and they still showed up for legs.',
    'Scale is up about a pound on the month, but they have only weighed in once in two weeks.'].join(' ');
  const pieces=_jvSpeakChunks(script);
  t(pieces.length>=3, 'it really does chunk into several pieces', pieces.length+' pieces');
  await _jvSpeakLine(script);

  t(evs('play end')===pieces.length, 'EVERY piece plays to its natural end',
    evs('play end')+' of '+pieces.length);
  t(evs('play ABORT')===0, 'ZERO aborts', evs('play ABORT')+'');
  const busy=_JV_TAPE.filter(x=>x.ev==='play start' && /BUSY/.test(x.d)).length;
  t(busy===0, 'ZERO starts while the player was busy', busy+'');
  t(evs('done')===1, 'and the read reports itself finished once');

  console.log('\n  IN ORDER, AND ONE AT A TIME:');
  // Every src assignment must land while the element is idle. A src set on a
  // playing element IS the cut he heard.
  const cuts=audioLog.filter(x=>x.ev==='src' && x.busy).length;
  t(cuts===0, 'no clip is ever replaced while it is still playing', cuts+' cuts');
  // starts and ends must alternate perfectly: start, end, start, end...
  const seq=_JV_TAPE.filter(x=>x.ev==='play start'||x.ev==='play end').map(x=>x.ev==='play start'?'S':'E').join('');
  t(/^(SE)+$/.test(seq), 'they alternate start-end-start-end with no overlap', seq);
  t(served===pieces.length, 'each piece is fetched exactly once', served+' fetches');

  console.log('\n  FETCHING AHEAD IS ALLOWED; PLAYING AHEAD IS NOT:');
  // The next clip is requested BEFORE the current one ends, so there is no
  // silence between pieces — but it is not played until the current one is done.
  const firstFetch2=_JV_TAPE.findIndex(x=>x.ev==='fetch' && /2\/|from the server/.test(x.d));
  t(_JV_TAPE.filter(x=>x.ev==='fetch').length===pieces.length, 'every piece is fetched', String(_JV_TAPE.filter(x=>x.ev==='fetch').length));
  const order=_JV_TAPE.filter(x=>['fetch','play start','play end'].indexOf(x.ev)>=0).map(x=>x.ev);
  // the second fetch must come before the first play end (ahead), and the second
  // play start must come after it (in order).
  const iFetch2=order.indexOf('fetch', order.indexOf('fetch')+1);
  const iEnd1=order.indexOf('play end');
  const iStart2=order.indexOf('play start', order.indexOf('play start')+1);
  t(iFetch2>=0 && iFetch2<iEnd1, 'piece two is already downloading while piece one speaks',
    'fetch@'+iFetch2+' end@'+iEnd1);
  t(iStart2>iEnd1, 'and does not start playing until piece one has ended',
    'start@'+iStart2+' end@'+iEnd1);

  console.log('\n  A NEWER READ STILL WINS, and his stop still works:');
  _jvTapeClear(); audioLog=[]; served=0;
  _jvAudioEl=new FakeAudio();
  global.window._jvSpeakGen=0;
  const slow=_jvSpeakLine(script);            // a long read
  await new Promise(r=>setTimeout(r,20));
  await _jvSpeakLine('Never mind.');          // a newer one arrives
  await slow;
  t(evs('SUPERSEDED')>=1, 'the older read stands down', evs('SUPERSEDED')+'');

  console.log('\n  PLAIN TEXT NO LONGER GOES THROUGH AN HTML STRIPPER:');
  // His tape: 1,186 characters in, 1,182 out, on a script with no markup at all.
  _jvTapeClear(); audioLog=[]; served=0;
  _jvAudioEl=new FakeAudio();
  const plain='He said 5 < 6 & meant it. That is the whole note.';
  await _jvSpeakLine(plain);
  const txt=_JV_TAPE.filter(x=>x.ev==='text')[0];
  t(!!txt && /5 < 6 & meant it/.test(txt.d), 'a < and an & survive to the ear', txt&&txt.d);
  const readEv=_JV_TAPE.filter(x=>x.ev==='read')[0];
  // Computed from the string, never hard-coded — a literal here is a number
  // that goes stale the moment the sentence changes.
  const want='in '+plain.length+' chars, after strip '+plain.length;
  t(!!readEv && readEv.d.indexOf(want)>=0, 'and nothing is lost on the way',
    (readEv&&readEv.d)+'   wanted "'+want+'"');

  console.log('');
  reachedEnd=true;
  if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
  console.log('  all pass');
  process.exit(0);
})();
