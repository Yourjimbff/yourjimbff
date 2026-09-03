// AN OLD MEAL CAN BE LOGGED AGAIN TODAY (Micaela, 3 Sep).
//
// Her words, relayed: "could look up the meal, it wouldnt log for the day.
// save edit or cancel were the only options. NO Option to add for the day."
//
// She was exactly right. mEditFood was built to edit ONE existing row and both
// of its buttons act on that row: Save rewrites it, and the date picker MOVES
// it, which takes the meal off the day she actually ate it. Neither of those is
// "I ate this again today," so finding an old meal was a dead end.
//
// It matters more than a missing button usually would: her last food log was
// 13 August, three weeks before she reported this. She has 10 saved foods and a
// dense July history. She was starting again and the door was shut.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(ok,label)=>{ if(!ok) bad++; console.log((ok?'  ok    ':'  FAIL  ')+label); };

console.log('  the button exists, on that sheet, above Save:');
t(/id="edLogTodayBtn"[^>]*onclick="logEditedFoodToday\(\)"/.test(src), 'the button is wired to the handler');
t(src.indexOf('edLogTodayBtn') < src.indexOf('onclick="saveEditedFood()"'), 'it sits above Save');
t(/Log this for today/.test(src), 'and it says what it does in plain words');

const fn = src.slice(src.indexOf('async function logEditedFoodToday'),
                     src.indexOf('async function saveEditedFood'));
console.log('\n  it writes a NEW row and never touches the original:');
t(/date_str: todayDateStr/.test(fn),        'the new row is dated today');
t(!/sbWrite\('PATCH'/.test(fn),             'no PATCH — the original is not edited');
t(!/food_logs\?id=eq/.test(fn),             'and it is never addressed by the old id');
t(/await insertFoodLog\(row, photo\)/.test(fn), 'it goes through the one insert door');

console.log('\n  every refusal says which refusal it was:');
t(/ins\.duplicate/.test(fn),   'already on today is not called a failure');
t(/ins\.zeroMacros/.test(fn),  'a zero-macro refusal names itself');
t(/ins\.unconfirmed/.test(fn), 'an unverified write says saved, not lost');
t(/Do not log it twice/.test(fn), 'and tells her not to double up');

console.log('\n  the slot and clock come from the meal, not from the tap:');
t(/window\._edMeal/.test(fn),        'the slot is the one it was eaten in');
t(/gv\('editFoodTime'\)/.test(fn),   'the time is the one on the row');
t(fn.indexOf('_mealSlotNow') > fn.indexOf('window._edMeal'), 'now is only the fallback');

console.log('\n  and it lands on screen without a reload:');
t(/todayFood\.push/.test(fn),  'pushed into today');
t(/rendTodayFood\(\)/.test(fn),'the day re-renders');
t(/_tlInvalidate\(\)/.test(fn),'the timeline cache is dropped');
t(/_edLogBusy/.test(fn),       'and a double tap cannot fire it twice');

console.log(bad?('\n'+bad+' FAILED'):'\nall pass');
process.exit(bad?1:0);
