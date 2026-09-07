// THE THREAD KEEPS GOING (Yusuf, 7 Sep 5:17pm).
//
//   "why wouldn't the app import their replies and come up with a reply from
//    their reply and keep the thread going? ... answer their question, that's it."
//
// The real board: Andrea replied "App is definitely a lot better!!" at 5:19pm and
// the draft still asked how logging was going. Dhruva asked "are you free to..."
// and the draft said "Earth to Dhruva". Both drafts were stale and both had SEND.
const guard=require('./_guard.cjs');
const {closure, defOf}=require('./_lift.cjs');
let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };
global.window={addEventListener:()=>{}}; global.document={getElementById:()=>null, addEventListener:()=>{}, querySelectorAll:()=>[]};
global.localStorage={ getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };
global.CLIENTS={andreaa1:{name:'Andrea Arrants'}, dhruvad1:{name:'Dhruva Daripalli'}, tonyt1:{name:'Tony T'}};
const MINE=['_crmTapback','_rdClean','_crmRedraftOne','_crmRedraftStale','_crmStaleDraft','_crmOvertaken','_dfRowNote','_dfFromNote','_crmSweepTime','_crmClock','_dfHardTells','_dfTells','_dfRefuse','_dfBubbles'];
eval(closure(['_DF_HARD','_BUB_LONG','_DF_MARK','_DF_SCHEMA','_RD_SYS','_RD_SWEAR','_RD_MODEL','_dfLet']).code||'');
eval(MINE.map(defOf).join('\n'));
guard(MINE, n=>eval(n));
global._crm={contacts:{}, rows:[]};
CLIENTS={andreaa1:{name:'Andrea Arrants'}, dhruvad1:{name:'Dhruva Daripalli'}, tonyt1:{name:'Tony T'}};
_crmThreadTail=async()=>[{who:'him',text:'Whats up! Hows the app treating you',at:'2026-09-07T20:00'}];
let asked=[], answer='';
_rdAsk=async(p)=>{ asked.push(p); return answer; };
let written=[];
dfWrite=async(code,d)=>{ written.push({code,d}); return {ok:true,id:d.id}; };
_crmPeople=()=>Object.keys(_crm.contacts).map(code=>({code, draft:(_crm.rows.find(r=>r.code===code)||null)}));

console.log('\n  WHAT COUNTS AS A TURN:');
t(_crmTapback('Loved “Have a great week dude. time for the push”')===true, 'a tapback is not a turn');
t(_crmTapback('Sorry man, have been out of it mentally, are you free to talk?')===false, 'a real text is');

console.log('\n  THE ROW RIDES ITS ANSWER:');
const row=_dfFromNote(_dfRowNote({id:'a1',text:'Hell yeah',at:'2026-09-07T21:19:00Z',answers:'2026-09-07T21:19'}));
t(row.answers==='2026-09-07T21:19','answers survives the write and the read');

console.log('\n  ANDREA, THE REAL ROW:');
const AND={id:'a1',code:'andreaa1',status:'pending',at:'2026-09-07T17:00:00Z',by:'jarvis',
  text:'Whats up! How has logging been going - any easier or still fighting you?'};
_crm.rows=[AND];
_crm.contacts={andreaa1:{him:'2026-09-07T15:00',them:'2026-09-07T21:19',last:'them',text:'App is definitely a lot better!! Smooth the past couple uses'}};
t(_crmStaleDraft('andreaa1',AND)===true,'her 5:19pm text is newer than the draft, so it is stale');
answer='Thats what I want to hear - whats been the easiest part';
(async()=>{
  let r=await _crmRedraftOne('andreaa1',AND);
  t(r.ok===true,'the draft is rewritten from her text', r.reason);
  t(written.length===1 && written[0].d.id==='a1','same id, in place');
  t(written[0].d.answers==='2026-09-07T21:19','and it records which text it answers');
  t(/answers their .* text/.test(written[0].d.re),'re says so: '+written[0].d.re);
  t(asked[0].indexOf('App is definitely a lot better')>0,'the model was shown her text');
  t(asked[0].indexOf('THE THREAD')>0,'and the thread tail');

  console.log('\n  NEVER TWICE, NEVER HIS, NEVER A TAPBACK:');
  const done=Object.assign({},AND,{answers:'2026-09-07T21:19'});
  r=await _crmRedraftOne('andreaa1',done);
  t(r.ok===false && /already/.test(r.reason),'the same text is not answered twice');
  const his=Object.assign({},AND,{by:'yusuf'});
  r=await _crmRedraftOne('andreaa1',his);
  t(r.ok===false && /his own/.test(r.reason),'a draft he wrote himself is left alone');
  _crm.contacts.tonyt1={him:'2026-09-07T14:00',them:'2026-09-07T20:00',last:'them',text:'Loved “Have a great week dude. time for the push”'};
  r=await _crmRedraftOne('tonyt1',{id:'t1',status:'pending',at:'2026-09-07T17:00:00Z',by:'jarvis',text:'x'});
  t(r.ok===false && /tapback/.test(r.reason),'a tapback gets no reply');

  console.log('\n  THE GATE STILL STANDS:');
  written=[]; asked=[];
  answer='hey — not bad, its good';
  r=await _crmRedraftOne('andreaa1',AND);
  t(r.ok===false && /voice/.test(r.reason),'a rewrite with an em dash and a lowercase start is refused, twice asked', r.reason);
  t(asked.length===2 && /failed these checks/.test(asked[1]),'the second ask names the tells');
  t(written.length===0,'nothing bad reaches the board');

  console.log('\n  SWEARING IS PER PERSON:');
  written=[]; asked=[]; answer='Holy shit thats incredible - congratulations';
  r=await _crmRedraftOne('andreaa1',AND);
  t(r.ok===false && /swearing/.test(r.reason),'Andrea gets none, even when she swore first (the real 5:19pm row)', r.reason);
  _crm.contacts.dhruvad1={him:'2026-09-07T15:00',them:'2026-09-07T21:06',last:'them',text:'are you free tomorrow?'};
  written=[]; asked=[]; answer='Hell yeah - what time works for you';
  r=await _crmRedraftOne('dhruvad1',{id:'d0',code:'dhruvad1',status:'pending',at:'2026-09-07T17:00:00Z',by:'jarvis',text:'x'});
  t(r.ok===true,'Dhruva can get a hell yeah', r.reason);
  console.log('\n  THE SWEEP OF THE BOARD:');
  written=[]; asked=[]; answer='Sure - what time works for you';
  const DH={id:'d1',code:'dhruvad1',status:'pending',at:'2026-09-07T17:00:00Z',by:'jarvis',text:'Earth to Dhruva - accountability check point. Locked in this week? Hows it going'};
  _crm.rows=[AND,DH];
  _crm.contacts.dhruvad1={him:'2026-09-07T15:00',them:'2026-09-07T21:06',last:'them',text:'Sorry man, have been out of it mentally , are you free to talk this week?'};
  const n=await _crmRedraftStale();
  t(n===2,'both stale rows rewritten, Tony left alone: '+n);
  t(written.map(w=>w.code).sort().join()==='andreaa1,dhruvad1','Andrea and Dhruva');
  console.log('    prompts: '+asked.map(p=>(p.match(/CLIENT: [^\n]*/)||[''])[0]).join(' | '));
  t(/occasional damn/.test(asked.find(p=>/CLIENT: Dhruva/.test(p))||''),'Dhruva gets his swearing rule');
  t(/no swearing/.test(asked.find(p=>/CLIENT: Andrea/.test(p))||''),'Andrea gets none');

  console.log('\n  CLEAN:');
  t(_rdClean('"Sure - what time works for you."')==='Sure - what time works for you','quotes and the end stop come off');
  t(_rdClean('HIM: Hell yeah\n\n\nLets go\nthird line')==='Hell yeah\nLets go','prefix off, two lines at most');
  console.log(bad?('\n  '+bad+' FAILED'):'\n  all passed');
  process.exit(bad?1:0);
})();
