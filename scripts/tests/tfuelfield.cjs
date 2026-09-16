// THE EDIT FIELD UNDER YOUR MACROS, ON THE CARD THAT ACTUALLY SAYS "YOUR
// NUTRITION GOALS".
//
// Yusuf, 15 Sep, off a client's screenshot asking whether macros could be
// edited at all: "there should be an edit field under your macros / nutrition
// goal / it should also automatically and cleanly adjust your total calories
// upon doing so, and save it."
//
// It shipped in v432 — on the Program card and in Settings. It did NOT ship on
// the Food tab, which is the surface headed "Your nutrition goals" and the one
// the client who asked was looking at. Four numbers, read-only, two tabs away
// from the boxes that change them. Fixed 16 Sep.
//
// WHAT THIS GUARDS: that the field exists here, that it goes through the ONE
// place the maths lives, that it saves, and that a typo cannot become a day
// nobody could eat.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0;
const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&!p?('   ['+JSON.stringify(x)+']'):'')); };
const between=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); return (i<0||j<0||j<i)?'':src.slice(i,j); };

console.log('\n  THE BOX IS UNDER THE NUMBER, WHICH IS WHAT HE ASKED FOR:');
const cell=between('function _fdFuelCell(k, raw, shown, label){','function _fdFuelManual(){');
t(cell.length>0, '_fdFuelCell exists');
t(cell.indexOf("'<div><b>'+shown+'</b><i>'+label+'</i>'") < cell.indexOf('<input'),
  'the big number is still first and the input sits under it');
t(/value="'\+raw\+'"/.test(cell), 'the box holds the bare figure');
t(/inputmode="numeric"/.test(cell), '  and asks a phone for the number pad');
t(/onfocus="this\.select\(\)"/.test(cell), '  and selects on tap, so it is one gesture to replace');
/* 2,130 and 160g are for READING. parseInt would take the 2 out of the first. */
const html=between('function fdGoalHtml(){','/* FOOD EXCLUSIONS');
t(/_fdFuelCell\('cal',  Math\.round\(T\.cal\),  Math\.round\(T\.cal\)\.toLocaleString\(\)/.test(html),
  'calories show with the comma and edit without it');
t(/_fdFuelCell\('prot', Math\.round\(T\.prot\), Math\.round\(T\.prot\)\+'g'/.test(html),
  'and the macros show the g and edit without it');

console.log('\n  ALL FOUR ARE EDITABLE:');
['cal','prot','carb','fat'].forEach(function(k){
  t(html.indexOf("_fdFuelCell('"+k) >= 0 || html.indexOf("_fdFuelCell('"+k+"',") >= 0, '  '+k);
});

console.log('\n  CHANGING ONE MOVES THE CALORIES, AND IT SAVES:');
const set=between('function fdSetFuel(k,v){','function fdResetFuel(){');
t(/pSetFuel\(k,v\)/.test(set), 'it goes through pSetFuel, the one place the maths lives');
t(/_gpSave\(\)/.test(set), 'and saves');
t(set.indexOf('pSetFuel') < set.indexOf('_gpSave'), '  in that order');
t(/fdGoalPaint\(\)/.test(set) && /fdTodayPaint\(\)/.test(set),
  'then repaints the card and the day it is measured against');
t(/try\{ pSetFuel\(k,v\); \}catch\(e\)\{\}/.test(set),
  'and a throw from the Program repaint cannot cost the save');
/* The maths itself is pSetFuel's and is tested in tfueledit.cjs; these two
   lines are the ones that make the promise on THIS card true. */
const ps=between('function pSetFuel(k,v){','function pResetFuel()');
t(/profile\.cal_manual=Math\.round\(prot\*4 \+ carb\*4 \+ fat\*9\)/.test(ps),
  'the total is rebuilt from all three macros, not nudged');
t(/if\(!\(n>0\) \|\| n>FUEL_MAX\[k\]\)\{ renderPhaseUI\(\); return; \}/.test(ps),
  'and a blank or a nonsense number snaps back instead of being written');

console.log('\n  AND THE CARD SAYS WHAT THE BOX DOES:');
t(/Change any number and your calories follow\./.test(html), 'in his own words from the Program card');
t(/_fdFuelManual\(\) \? ' <u onclick="fdResetFuel\(\)">Reset to calculated<\/u>' : ''/.test(html),
  'with a way back, offered only once something has been changed');
const man=between('function _fdFuelManual(){','/* pSetFuel is the ONE place');
t(/cal_manual>0/.test(man) && /pro_manual>0/.test(man) && /carb_manual>0/.test(man) && /fat_manual>0/.test(man),
  '  which is any of the four being set by hand');
const reset=between('function fdResetFuel(){','function fdGoalHtml(){');
t(/pResetFuel\(\)/.test(reset) && /_gpSave\(\)/.test(reset), 'and the reset saves too');

console.log('\n  THE READ-ONLY VERSION IS GONE, NOT LEFT BESIDE IT:');
t(!/\+'<div><b>'\+Math\.round\(T\.prot\)\+'g<\/b><i>protein<\/i><\/div>'/.test(src),
  'nothing still draws the four numbers with no way to change them');
t(/\.fdgNums div input\.fdgIn\{/.test(src), 'the box has its own style rather than borrowing one');
t(/\.fdgNums div input\.fdgIn:focus\{border-color:var\(--gold/.test(src), '  and says when it has focus');

console.log(bad?('\n  '+bad+' FAILED'):'\n  all good (the number you read, and under it the box you change)');
process.exit(bad?1:0);
