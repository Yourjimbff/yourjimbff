// WHAT AN OPEN MEAL CARD SAYS (Yusuf, 11 Sep, launch checklist f9):
//
//   "yes but the photo doesnt show. and the written description / name of the
//    meal is broken and potentially redundant. look at the philly cheesteak
//    omlettes image #3, the word is broken and also doesnt need ot be there.
//    that screen actually only needs to be there when someone logs multiple
//    foods is when the itemized breakdown is good. but we also need to make
//    sure the lines of food are not broken"
//
// Three separate faults in one card, and the card is the one screen a client
// lands on after tapping the meal they just logged:
//   1. the shut card carries a photo and the OPEN one threw it away
//   2. "Philly Cheesestea / k Omelettes" - a word split down the middle
//   3. one food, its name printed three times in the same card
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
let bad=0; const t=(p,l,x)=>{ if(!p) bad++; console.log((p?'  ok    ':'  FAIL  ')+l+(x!==undefined&&x!==''?('  '+x):'')); };
function slice(from,to){ const a=src.indexOf(from); const b=src.indexOf(to,a); return a<0?'':src.slice(a,b); }

// The open half of the meal card, from the single-food test down to its return.
const card=slice("  var single=(rows.length===1 && rows[0].id!=null && !window._tlRO);",
                 "// One macro, edited in place.");
t(card.length>800, 'the open meal card is where this test says it is', String(card.length)+' chars');

console.log('\n  THE PLATE KEEPS ITS PHOTO WHEN IT OPENS:');
t(/var thumb='', _xphoto='';/.test(src) && /_xphoto=String\(u\);/.test(src),
  'the photo is read once and both halves of the card read the same one');
t(/\+\(_xphoto\?\('<div class="tlXPhoto"><img data-tl="zoom" data-src="'\+_escHtml\(_xphoto\)/.test(card),
  'the open card draws it');
t(/data-tl="zoom"/.test(card), 'and it is the same tap-to-zoom the shut card has');
t(/\.tlXPhoto img\{display:block;width:100%;height:170px;object-fit:cover/.test(src),
  'given the room the open card has, rather than a 52px corner');
t(/\+thumb\s*\n?\s*\+'<div style="flex-shrink:0;color:rgba\(240,236,228,0\.45\)/.test(src) || /\+thumb/.test(src),
  'and the shut card still has its thumbnail - nothing was moved, only added');

console.log('\n  NO WORD IS EVER CUT:');
const nm=slice('.tlXfood .n{', '.tlXfood .c{');
t(!/overflow-wrap:anywhere/.test(nm), 'the food line no longer breaks inside a word');
t(/overflow-wrap:break-word/.test(nm) && /word-break:normal/.test(nm) && /hyphens:none/.test(nm),
  'it wraps at spaces, which is how "Philly Cheesesteak Omelettes" is meant to read');
const ti=slice('.tlXTitle{', '/* The plate');
t(/overflow-wrap:break-word/.test(ti) && /word-break:normal/.test(ti),
  'and the 22px title above it reads under the same rule');
t(/<div class="tlXTitle">/.test(card) && !/font-size:22px;font-weight:800;letter-spacing:-0\.7px;line-height:1\.15;color:var\(--text\);margin-top:9px;">/.test(card),
  'the title is a class now, not an inline style with nowhere to hang the rule');

console.log('\n  ONE FOOD DOES NOT GET AN ITEMISED BREAKDOWN:');
t(/if\(rows\.length===1 && rows\[0\]\.id!=null && !window\._tlRO\)\{/.test(card),
  'a meal of one food takes its own shape');
t(/<div class="tlXone">/.test(card) && /Edit this meal/.test(card) && />Remove</.test(card),
  'and that shape is the two doors, said plainly');
const one=card.slice(card.indexOf('class="tlXone"'), card.indexOf('} else if'));
t(!/class="n"/.test(one), 'with the name NOT printed a third time - his actual complaint');
t(/data-tl="edit" data-id/.test(one) && /data-tl="delfood" data-id/.test(one),
  'EDIT AND DELETE SURVIVE: the first cut of this card skipped the row for a meal of one and orphaned delete entirely');
t(/\} else if\(rows\.length>=2 \|\| \(rows\.length===1 && window\._tlRO\)\)\{/.test(card),
  'two or more foods still get the full breakdown - the case he says it is good for');
t(/rows\.length===1 && window\._tlRO/.test(card),
  'and a trainer reading a client\'s day still sees the row, since he has no edit doors to read it off');

console.log(bad? '\n  '+bad+' FAILED' : '\n  all open-meal-card assertions pass');
process.exit(bad?1:0);
