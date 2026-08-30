// A CLIENT'S DAY IS ONE BOUNDED GROUP ON THE PHONE (Yusuf, order, 30 Aug).
//
// From his own phone: the day total and the share row rendered on the naked band
// background between cards, attached to nothing. They were siblings of the tiles.
//
// WHAT THIS FILE CAN AND CANNOT PROVE. The grouping lives inside
// _loadTrainerFeedRun — an async function that reads nine tables and paints a
// string. Lifting it would mean stubbing the whole feed, and a suite that stubs
// the thing under test proves the stub. So this file proves the SHAPE of the
// emitter — that the container opens before the run and closes after the buttons,
// on the phone branch only, guarded by the same flag at both ends — and the RENDER
// is proved in a browser at a real 375 against his own roster. Both, or neither.
//
// The pair law (Calendar's outage, now house law): this moves layout containers
// around elements other features key off, so the checks that depended on the OLD
// structure are re-run here too — the tick's host lookup, the desktop-only cell
// rules, and the fact that the wall never sees this container at all.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');

let bad=0;
const t=(pass,label,extra)=>{ if(!pass) bad++; console.log((pass?'  ok    ':'  FAIL  ')+label+(extra?('  '+extra):'')); };

// ===== THE PHONE BRANCH, CUT OUT BY ITS OWN MARKERS ====================
// Cited by TEXT, never by line number — main moved 2,707 lines under one order.
const openMark = "        _mOrder.forEach(function(c){";
const closeMark = "          if(_grp) html+='</div>';\n        });";
const a = src.indexOf(openMark);
const b = src.indexOf(closeMark);
t(a>0, 'found the phone branch per-client loop');
t(b>a, 'found its close');
const block = src.slice(a, b+closeMark.length);

// ===== THE CONTAINER OPENS AND CLOSES EXACTLY ONCE, ON THE SAME GUARD ==
t((block.match(/if\(_grp\) html\+='<div class="fdGroup">';/g)||[]).length===1,
  'the group opens exactly once');
t((block.match(/if\(_grp\) html\+='<\/div>';/g)||[]).length===1,
  'and closes exactly once');
t(/var _grp = !!c;/.test(block), 'the guard is the client code itself');
const iOpen=block.indexOf('<div class="fdGroup">');
const iTiles=block.indexOf('_feedItemHtml(it)');
const iTot=block.indexOf('_pfTotalsHtml(_mBy[c])');
const iRow=block.indexOf('fdShareRow');
const iClose=block.indexOf("if(_grp) html+='</div>';");
t(iOpen<iTiles, 'the container opens BEFORE the first tile');
t(iTiles<iTot, 'tiles come before the day total');
t(iTot<iRow, 'the day total comes before the share row');
t(iRow<iClose, 'the share row is inside the container');
// THE ORDER IS THE COCKPIT'S ORDER — read off _pfCard's RETURN TEMPLATE, not off
// the function body. `acts` is BUILT near the top of _pfCard and INSERTED at the
// bottom, so searching the whole body finds it first and reports the order
// backwards; the first version of this assertion did exactly that and failed on
// code that was right. The template is the only place render order is stated.
const retAt=src.indexOf("return '<div class=\"pfCard'");
const tmpl=src.slice(retAt, src.indexOf('\n}', retAt));
const cRows=tmpl.indexOf('_pfDayList(evs)'), cTot=tmpl.indexOf('_pfTotalsHtml(evs)'),
      cTouch=tmpl.indexOf('_pfTouchLine(b.code, evs)'), cActs=tmpl.indexOf('+ acts');
t(retAt>0 && cRows>=0, 'found _pfCard’s return template');
t(cRows<cTot && cTot<cTouch && cTouch<cActs,
  'the cockpit card renders rows, then totals, then the touch line, then its actions',
  'rows@'+cRows+' tot@'+cTot+' touch@'+cTouch+' acts@'+cActs);
// THE PHONE'S TOUCH LINE IS NOT MOVED. It is rendered per TILE by _feedItemHtml
// (its scope is that one event), and the order says tile contents are untouched.
// Moving it to the group foot would take a fact off every tile — a re-render, not
// a grouping. It is inside the container either way, because the tiles are.
t(src.indexOf("_pfTouchLine(code, [it], (_rk?(_rk+':'+_rid):null))")>0,
  'the phone still renders its touch line inside each tile, unmoved');

// ===== A MOMENT IS NOBODY'S DAY =======================================
// Items with no code group under '' and must get no container: a client box
// drawn around something with no client is a worse lie than a loose tile.
t(/var _grp = !!c;/.test(block) && !/var _grp = true/.test(block),
  'a code-less run gets no container');

// ===== THE DESKTOP PATH IS UNTOUCHED ==================================
// The wall's cards are already .pfCard. If fdGroup ever appears in the _dtk
// branch it is a second container inside a card.
const elseAt = src.indexOf('      } else {\n      dayMap[k].forEach(function(it){');
t(elseAt>b, 'found the desktop branch after the phone branch');
const gridClose = src.indexOf("      if(_dtk) html+='</div>';", elseAt);
const deskBlock = src.slice(elseAt, gridClose);
t(deskBlock.indexOf('fdGroup')<0, 'the desktop branch emits no group container');
t(deskBlock.indexOf('_obMarkHtml(it.code, k)')>0, 'and still marks every cell, as it always did');

// ===== THE CSS =========================================================
const css = /\n(\.fdGroup\{[^}]*\})/.exec(src);
t(!!css, 'the .fdGroup rule exists');
t(css && src.indexOf('body.jv-on .fdGroup')<0,
  'and is NOT scoped to body.jv-on — that class is stripped below 1024 and this is the phone rule');
t(css && !/gold|f5c518|245,197,24/i.test(css[1]),
  'no gold on the container: gold is action on this surface, a container is not one', css?css[1]:'');
t(/\.fdGroup \.fdShareRow\{/.test(src), 'the share row is re-spaced inside the container');

// ===== THE PAIR LAW: what keyed off the OLD structure =================
// 1. _obRepaint walks up from a tick to dim its host. On the phone the tick sits
//    in the share row, whose closest(.pfCard,.jvFeedCell) was null and MUST stay
//    null — adding .fdGroup to that selector would start dimming whole groups,
//    which is a behaviour change nobody ordered.
t(/el\.closest\('\.pfCard, \.jvFeedCell'\)/.test(src),
  'the tick host lookup is unchanged and does not name .fdGroup');
t(src.indexOf(".closest('.pfCard, .jvFeedCell, .fdGroup')")<0,
  'nothing widened that selector');
// 2. The desktop-only cell rules key on a DIRECT tick child of a cell.
t(/\.jvFeedCell:has\(>\.fdReachMark\)\{/.test(src), 'the direct-child cell rule survives');
t(/\.jvFeedCell>\.fdReachMark\{/.test(src), 'and its alignment rule');
// 3. The tick's right-alignment inside the share row.
t(/\.fdShareRow \.fdReachMark\{margin-left:auto/.test(src), 'the tick still right-aligns in the row');
// 4. The dimming rule still names only cards and cells.
t(/\.pfCard\.obDone,\.jvFeedCell\.obDone\{/.test(src), 'the obDone rule is untouched');
// 5. citeFeedDay is still handed the client's own item indexes, unchanged.
t(/citeFeedDay\(\\'\'\+c\+\'\\',\\''\+_mIdx\+'\\'\)/.test(src) || src.indexOf("citeFeedDay(\\''+c+'\\',\\''+_mIdx+'\\')")>0,
  'Share day still calls citeFeedDay with this client and their own _idx list');
t(src.indexOf("jvCatchUp(\\''+c+'\\')")>0, 'Catch up still calls jvCatchUp with this client');

console.log(bad? ('\nFAILED '+bad) : '\nall passed');
process.exit(bad?1:0);
