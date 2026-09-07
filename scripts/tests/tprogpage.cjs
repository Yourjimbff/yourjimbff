// THE PROGRAM PAGE IS A WORKOUT PAGE AND NOTHING ELSE (Yusuf, 7 Sep).
//
// "remove the check and call put the check in called to be a really nice sleek
// looking button along with the progress check-in information on the front
// page. This page now should be a fully sleek workout page design ... I'll get
// rid of food in this section."
const fs=require('fs');
let bad=0;
const t=(pass,label)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label); };
const src=fs.readFileSync('index.html','utf8');

console.log('\n  WHAT CAME OFF THE PROGRAM TAB:');
const tab=src.slice(src.indexOf('<div id="pgPageHead"'), src.indexOf('<div class="tab" id="tProgress">'));
t(!/id="pgCallsCard"/.test(tab), 'the calls card is gone from the Program tab');
t(!/id="pgSegs"/.test(tab) && !/pgSetPane\(\'food\'\)/.test(tab), 'the Training / Food switch is gone');
t(/id="pgPaneFood" style="display:none;"/.test(tab), 'the food pane stays in the markup, hidden - nothing else was asked to move yet');
t(/\['pgPageS',\s*off\?'' :/.test(src), 'the subtitle that listed food and calls is empty on a phone');

console.log('\n  THE WEEK AS SEVEN CELLS:');
t(/class="pgWk">/.test(src) && /pgWkCell/.test(src) && /pgWkD/.test(src) && /pgWkT/.test(src), 'seven cells: day letter, split under it');
t(!/class="pgHero">/.test(src.slice(src.indexOf('function _gpDaysInner'), src.indexOf('function _gpSecDays'))), 'the sentence-plate that spelled the week out is gone');
t(/var _todayI=\(new Date\(\)\.getDay\(\)\+6\)%7;/.test(src), 'today is worked out Monday-first, the way WEEKDAYS is');
t(/\.pgWkCell\.on\{border-color:var\(--gold\);\}/.test(src), 'today is gold');
t(/\.pgWkCell\.rest \.pgWkT\{color:rgba\(240,236,228,0\.25\);\}/.test(src), 'rest is dim');
t(/onclick="pgToggleDay\('\+i\+'\)"/.test(src.slice(src.indexOf('var _cells=_pw.map'), src.indexOf('var _cells=_pw.map')+600)), 'tapping a cell opens that day, same as its row');

console.log('\n  TODAY OPEN, WITH A START:');
t(/function _pgDefaultOpen\(\)\{[\s\S]{0,120}if\(_pgDayOpen===null\) _pgDayOpen=\(new Date\(\)\.getDay\(\)\+6\)%7;/.test(src), 'today opens by default, only when nothing has been chosen');
t(/\(\(_isTodayRow && ex\.length\) \? '<div class="pgStart" onclick="pgStartToday\(\)"/.test(src), 'Start on today only, and only when the day has something in it');
t(/function pgStartToday\(\)\{[\s\S]{0,200}switchTab\('Day'\)[\s\S]{0,200}tlToggleWorkout\(ds\)/.test(src), 'Start goes to the Day page and opens the session - the same door as the Day page Start');

console.log('\n  THE CALL ON THE FRONT PAGE:');
t(/return \['pgCallsCard','ciCallsCard','dayCallsCard'\]/.test(src), 'the Day page is a third host for the SAME calls card - one card, one read, no second system');
t(/id="dayCallsCard" data-tl="callscard"/.test(src), 'drawn inside the Stats block on today');
t(/window\._pcLast\.html=v;/.test(src) && /window\._pcLast\.onclick=f;/.test(src), 'the shim remembers the last markup and tap, so a repaint of the day does not blank it or refetch');
t(/if\(h\.id!=='dayCallsCard'\) h\.onclick=f;/.test(src), 'the day host takes no onclick of its own - the dispatcher routes it, so a tap cannot fire twice');
t(/if\(a==='callscard'\)\{[\s\S]{0,260}_pcLast&&window\._pcLast\.onclick[\s\S]{0,120}else _pgCallsCard\(\);/.test(src), 'a tap runs the remembered handler, or refreshes the card if there is none yet');
t(/\(_now-window\._pcDayAt\)>180000/.test(src), 'the server is asked at most every three minutes, not on every repaint');
t(/#dayCallsCard\{[^}]*border:1px solid rgba\(245,197,24,0\.35\)/.test(src), 'gold edge - the one action in the block with him in it');
t(/#dayCallsCard:empty\{display:none;\}/.test(src), 'and it takes no room until it has something to say');
const sb=src.slice(src.indexOf('function _tlStatsBlock('), src.indexOf('function _tlLateAsks('));
t(/isTrainer\(cl\.code\)/.test(sb) && /if\(!_isTr\)/.test(sb), 'the trainer never sees a Book-a-call on his own day');

console.log('\n  THE BUILDER EXTRAS (Yusuf, 7 Sep: "they can edit create their own exercise program"):');
t(/id="pgSetsMove"/.test(src) && /pgMove\(-1\)/.test(src) && /pgMove\(1\)/.test(src), 'Move up / Move down live in the sets sheet - the row you are already editing');
const mv=src.slice(src.indexOf('async function pgMove('), src.indexOf('var _pgRestAsk'));
t(/if\(j<0 \|\| j>=ex\.length\) return;/.test(mv), 'a move off either end does nothing');
t(/await pgSavePlan\('Moving that exercise'/.test(mv), 'and it saves through the same verified path as a swap');
t(/pgRestStart\(\\''\+dk\+'\\'\)">Make this a rest day/.test(src), 'an open training day offers Make this a rest day');
t(/Make '\+PG_WEEKDAY_FULL\[i\]\+' a rest day\? Its exercises come off\./.test(src), 'asked once, inline, saying what it costs');
t(/_tpPlan\[dk\]=\{type:'Rest', ex:\[\]\};/.test(src), 'a rest day is type Rest with nothing in it');
t(/pgWakeStart\(\\''\+dk\+'\\'\)">Add a session/.test(src), 'a rest day offers Add a session');
t(/var _PG_WAKE=\['Push','Pull','Legs','Upper','Lower','Full body','Arms','Cardio'\];/.test(src), 'and asks what kind, from eight');
t(/_pgDayOpen=WEEKDAYS\.indexOf\(dk\);/.test(src), 'the woken day opens so they can put movements in it');
t(/\(rest && !_ro\)/.test(src) && /_ro \? '' : \(_pgRestAsk===dk/.test(src), 'none of it on a programme Yusuf built - his call stays his');
t(/id="pgJimIn"/.test(src) && /window\._pgProgPlan \? '' : \('<div class="pgJim">/.test(src), 'a Tell Jim box at the foot of the program, not on a programme he built');
const tj=src.slice(src.indexOf('function pgTellJim('), src.indexOf('function pgSetsNudge('));
t(/switchTab\('Jim'\)/.test(tj) && /ci\.value='Change my program: '\+txt/.test(tj) && !/sendChatMessage|jimSend/.test(tj), 'it carries the sentence to Jim and the SEND stays theirs - they see what they are asking before it goes');

console.log('\n  CALLS OFF THE TRAINER DAY (Yusuf, 7 Sep):');
t(/var _mineOnly=false;[\s\S]{0,200}isTrainer\(cl\.code\) && !window\._tlRO/.test(src), 'his own day draws no call cards - they live in the band and its sheet');
t(/if\(!_mineOnly\) \(\(window\._bookByDay&&window\._bookByDay\[ds\]\)\|\|\[\]\)\.forEach/.test(src), 'a client day, and a view-as of one, still draws the client call');
t(/function openCallsView\(\)/.test(src) && /Nothing booked for the rest of the week either/.test(src), 'the sheet behind the band already shows today then the week - the place exists');

console.log();
if(bad){ console.log('  '+bad+' FAILED'); process.exit(1); }
console.log('  all program-page assertions pass');
process.exit(0);
