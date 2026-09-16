#!/usr/bin/env node
// STRIP THE DEVELOPER NOTES OUT OF THE FILE THAT IS SERVED, and only that file.
//
// Yusuf, 15 Sep, quoting the report he was sent: "remove developer notes from
// HTML ... Your role level security logic is right within your developer notes
// also exposed within your html."
//
// He is right, and it is worse than it sounds: this file carries about 25,000
// lines of commentary, including a written account of every place the app has
// been soft, why each lock is where it is, and which guards are load-bearing.
// That is a map, handed to anybody who views source.
//
// THE COMMENTS ARE NOT THE PROBLEM. They are the most valuable thing in this
// repository — every one of them is a bug that was paid for once. So they stay
// in git, in full, and this runs at DEPLOY TIME against the copy Netlify is
// about to publish. Source keeps its memory; the public gets the program.
//
// WHAT IT WILL AND WILL NOT TOUCH, and the line between them is a proof rather
// than a judgement call.
//
//   A line whose first non-whitespace characters are // or /* is a comment.
//   Always. It cannot be anything else:
//     - a regex literal cannot contain a raw newline, so no regex ever reaches
//       the start of a line it did not begin on;
//     - // as a regex is the empty pattern, which is not legal syntax;
//     - /* as a regex is a quantifier with nothing to quantify, also illegal;
//     - and // outside a string, template, regex or comment is ALWAYS a line
//       comment — the lexical grammar matches Comment before DivPunctuator in
//       both goal symbols, so there is no "divide by a regex" reading.
//   The only way that rule can be wrong is if the line start is inside a
//   template literal or an already-open comment, and the scanner below tracks
//   exactly those.
//
//   A // that is NOT at the start of a line is LEFT ALONE. There are 749 of
//   those in this file and the overwhelming majority are the // in an https://
//   URL. Stripping them would need the full regex-or-divide decision on every
//   slash in six megabytes, to remove about three percent of the notes. That is
//   the whole risk of this script for almost none of its value, so it is not
//   attempted. This is a deploy step on a live app, not a minifier.
//
// IT FAILS LOUDLY OR NOT AT ALL. Every gate below exits non-zero, which makes
// stamp-version.sh fail, which makes the Netlify build fail — and a failed
// build keeps the previous deploy serving. That is the only acceptable failure
// mode for something that rewrites the app on its way out of the door.
const fs = require('fs');
const vm = require('vm');

const file = process.argv[2] || 'index.html';
/* AND NOTHING ELSE. This rewrites its input IN PLACE, and the only other thing
   it takes is `--dry <to>`. Somebody who reads that as an output path and runs
   `strip-notes.cjs index.html out.html` — I did, 16 Sep — gets the second
   argument ignored and the real file stripped underneath them. The tests pass
   afterwards, because they assert on code rather than comments, so the first
   thing that notices is this script refusing to run on its own output at the
   next deploy. A silently ignored argument is the one thing a script this
   careful cannot afford. Say no instead. */
{
  const extra = process.argv.slice(3).filter(a => a !== '--dry');
  const dry = process.argv.indexOf('--dry');
  const dryTo = dry >= 0 ? process.argv[dry + 1] : null;
  const stray = extra.filter(a => a !== dryTo);
  if (stray.length) {
    console.error('strip-notes: I do not know what to do with: ' + stray.join(' '));
    console.error('strip-notes: this rewrites its input IN PLACE. To write somewhere');
    console.error('  else without touching the original, use:  --dry <output-path>');
    process.exit(2);
  }
}
const src = fs.readFileSync(file, 'utf8');

function die(msg) {
  console.error('strip-notes: ' + msg);
  console.error('strip-notes: REFUSING to write. The build fails and the previous deploy keeps serving.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Where the script and style blocks are. Everything else is HTML text.
// ---------------------------------------------------------------------------
function regions(s) {
  const out = [];
  const re = /<(script|style)\b([^>]*)>/gi;
  let m, at = 0;
  while ((m = re.exec(s))) {
    const tag = m[1].toLowerCase();
    const attrs = m[2] || '';
    const bodyFrom = m.index + m[0].length;
    const close = s.toLowerCase().indexOf('</' + tag + '>', bodyFrom);
    if (close < 0) die('unclosed <' + tag + '> at ' + m.index);
    if (m.index > at) out.push({ kind: 'html', a: at, b: m.index });
    // A src= script has no body worth touching, and a non-JS type (JSON-LD,
    // a template) is not JavaScript and is left exactly as it is.
    const type = (attrs.match(/type\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '';
    const isJs = tag === 'script' && !/\ssrc\s*=/i.test(attrs)
      && (!type || /^(text\/javascript|application\/javascript|module)$/i.test(type));
    out.push({ kind: isJs ? 'js' : (tag === 'style' ? 'css' : 'opaque'), a: bodyFrom, b: close });
    at = close;
    re.lastIndex = close;
  }
  if (at < s.length) out.push({ kind: 'html', a: at, b: s.length });
  return out;
}

// ---------------------------------------------------------------------------
// The JavaScript scanner. It walks every character so that it knows, at each
// point, whether it is in code, a string, a template, a regex or a comment. It
// returns the spans of the comments that START A LINE, and nothing else.
// ---------------------------------------------------------------------------
const REGEX_WORDS = new Set(['return','typeof','instanceof','in','of','new','delete',
  'void','throw','case','do','else','yield','await']);

function jsComments(s, base, lits) {
  const spans = [];
  let i = 0;
  const n = s.length;
  let prev = '';        // last significant character
  let prevWord = '';    // last identifier, for `return /re/`
  const tmpl = [];      // brace depth at which each open template resumes
  let depth = 0;

  function atLineStart(k) {
    for (let j = k - 1; j >= 0; j--) {
      const c = s[j];
      if (c === '\n') return true;
      if (c !== ' ' && c !== '\t' && c !== '\r') return false;
    }
    return base === 0 ? true : true;   // start of a block counts as a line start
  }
  function lineOf(k) { let ln = 1; for (let j = 0; j < k; j++) if (s[j] === '\n') ln++; return ln; }

  while (i < n) {
    const c = s[i];
    // --- template literal ---------------------------------------------------
    if (tmpl.length && tmpl[tmpl.length - 1] === depth && c === '`') { tmpl.pop(); i++; prev = '`'; if (lits) lits.push('`end'); continue; }
    if (c === '`') { tmpl.push(depth); i++; prev = '`'; if (lits) lits.push('`start'); continue; }
    if (tmpl.length && tmpl[tmpl.length - 1] === depth) {
      // inside the text of a template: only \ and ${ matter
      if (c === '\\') { if (lits) lits.push('T' + s.substr(i, 2)); i += 2; continue; }
      if (c === '$' && s[i + 1] === '{') { depth++; i += 2; prev = '{'; prevWord = ''; if (lits) lits.push('T${'); continue; }
      if (lits) lits.push('T' + c);
      i++; continue;
    }
    // --- strings ------------------------------------------------------------
    if (c === '"' || c === "'") {
      const q = c; const start = i; i++;
      while (i < n) {
        if (s[i] === '\\') { i += 2; continue; }
        if (s[i] === q) { i++; break; }
        if (s[i] === '\n') die('unterminated ' + q + ' string at line ' + lineOf(i));
        i++;
      }
      if (lits) lits.push(s.slice(start, i));
      prev = q; prevWord = ''; continue;
    }
    // --- comments -----------------------------------------------------------
    if (c === '/' && s[i + 1] === '/') {
      let j = i; while (j < n && s[j] !== '\n') j++;
      if (atLineStart(i)) spans.push([base + i, base + j]);
      i = j; continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      const end = s.indexOf('*/', i + 2);
      if (end < 0) die('unterminated block comment at line ' + lineOf(i));
      if (atLineStart(i)) spans.push([base + i, base + end + 2]);
      i = end + 2; prev = ' '; continue;
    }
    // --- regex literal ------------------------------------------------------
    if (c === '/') {
      let isRe;
      if (prevWord && REGEX_WORDS.has(prevWord)) isRe = true;
      else if (prev === '' || '(,=:[!&|?{};+-*%~^<>'.indexOf(prev) >= 0) isRe = true;
      else isRe = false;                       // after ) ] } a name or a number: divide
      if (isRe) {
        const reStart = i;
        i++;
        let cls = false;
        while (i < n) {
          if (s[i] === '\\') { i += 2; continue; }
          if (s[i] === '[') cls = true;
          else if (s[i] === ']') cls = false;
          else if (s[i] === '/' && !cls) { i++; break; }
          else if (s[i] === '\n') die('newline inside what was read as a regex, line ' + lineOf(i));
          i++;
        }
        while (i < n && /[a-z]/i.test(s[i])) i++;   // flags
        if (lits) lits.push(s.slice(reStart, i));
        prev = '/'; prevWord = ''; continue;
      }
      i++; prev = '/'; prevWord = ''; continue;
    }
    // --- braces, words, everything else -------------------------------------
    if (c === '{') { depth++; i++; prev = '{'; prevWord = ''; continue; }
    if (c === '}') {
      if (tmpl.length && tmpl[tmpl.length - 1] === depth - 1) { depth--; i++; prev = '}'; prevWord = ''; continue; }
      depth--; i++; prev = '}'; prevWord = ''; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < n && /[A-Za-z0-9_$]/.test(s[j])) j++;
      prevWord = s.slice(i, j); prev = s[j - 1]; i = j; continue;
    }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { i++; continue; }
    prev = c; prevWord = ''; i++;
  }
  if (tmpl.length) die('a template literal was left open');
  return spans;
}

// CSS has no regex and no multi-line strings, so a line-starting /* is a comment
// and nothing else needs tracking.
function cssComments(s, base) {
  const spans = [];
  let i = 0;
  while (i < s.length) {
    const k = s.indexOf('/*', i);
    if (k < 0) break;
    const end = s.indexOf('*/', k + 2);
    if (end < 0) die('unterminated CSS comment');
    let ls = true;
    for (let j = k - 1; j >= 0; j--) { const c = s[j]; if (c === '\n') break; if (c !== ' ' && c !== '\t' && c !== '\r') { ls = false; break; } }
    if (ls) spans.push([base + k, base + end + 2]);
    i = end + 2;
  }
  return spans;
}

// HTML comments, outside script and style. <!DOCTYPE is not a comment and a
// conditional comment is markup, so both are left alone.
function htmlComments(s, base) {
  const spans = [];
  let i = 0;
  while (i < s.length) {
    const k = s.indexOf('<!--', i);
    if (k < 0) break;
    if (s.slice(k, k + 6) === '<!--[') { i = k + 4; continue; }
    const end = s.indexOf('-->', k + 4);
    if (end < 0) die('unterminated HTML comment');
    spans.push([base + k, base + end + 3]);
    i = end + 3;
  }
  return spans;
}

// ---------------------------------------------------------------------------
let spans = [];
const litsIn = [];
const regs = regions(src);
for (const r of regs) {
  const body = src.slice(r.a, r.b);
  if (r.kind === 'js') spans = spans.concat(jsComments(body, r.a, litsIn));
  else if (r.kind === 'css') spans = spans.concat(cssComments(body, r.a));
  else if (r.kind === 'html') spans = spans.concat(htmlComments(body, r.a));
}
spans.sort((x, y) => x[0] - y[0]);
for (let k = 1; k < spans.length; k++) if (spans[k][0] < spans[k - 1][1]) die('overlapping comment spans');

// Cut them out, keeping the newline that ended each line comment so nothing
// joins onto the line below it.
let out = '';
let at = 0;
for (const [a, b] of spans) { out += src.slice(at, a); at = b; }
out += src.slice(at);
/* THE BLANK LINES THE COMMENTS LEFT BEHIND STAY, and this is the second thing
   this script taught me tonight. Collapsing runs of them looked free — nothing
   in JS or CSS cares about vertical whitespace — and it saved a further couple
   of hundred kilobytes. It also reached INSIDE a multi-line template literal
   and squashed two blank lines out of a prompt, because a regex over the whole
   file has no idea what it is standing in.
   Caught by the literal gate below, which is exactly what that gate is for, and
   then deleted rather than made cleverer: the saving was cosmetic and the risk
   was somebody's prompt quietly changing shape on the way to the server. */

// ---------------------------------------------------------------------------
// THE GATES. Nothing is written until every one of these passes.
// ---------------------------------------------------------------------------
function jsBodies(s) {
  return regions(s).filter(r => r.kind === 'js').map(r => s.slice(r.a, r.b));
}
const inBodies = jsBodies(src);
const outBodies = jsBodies(out);

if (outBodies.length !== inBodies.length) die('the number of script blocks changed');
inBodies.forEach((b, k) => {
  try { new vm.Script(b); } catch (e) { die('the SOURCE script block ' + k + ' does not parse: ' + e.message); }
});
outBodies.forEach((b, k) => {
  try { new vm.Script(b); } catch (e) { die('stripped script block ' + k + ' does not parse: ' + e.message); }
});

// Things that must survive, chosen because each one would be silently fatal.
const MUST_KEEP = [
  "var APP_VERSION = '__APP_VERSION__'",
  'function legalGate(',
  'var LEGAL_VERSION=',
  '/.netlify/functions/erase',
  'function sbHeaders(',
  'function isTrainer(',
  'async function doLogin(',
  'async function launchApp(',
];
for (const k of MUST_KEEP) if (out.indexOf(k) < 0) die('"' + k + '" did not survive the strip');

// And things that must NOT. If these are still here the strip did nothing.
/* Each of these must be IN the source and OUT of the result. Checking only the
   second half would pass a script that did nothing at all on a file that never
   contained the phrase — which is how a dead gate looks from the outside. */
const MUST_GO = [
  'THE AGREEMENT, AND THE DOOR OUT',
  'A CORRECT CODE IS NEVER TOLD IT IS WRONG',
  'THE SILENT EXCHANGE',
];
for (const k of MUST_GO) {
  if (src.indexOf(k) < 0) die('"' + k + '" is not in the source, so this gate proves nothing');
  if (out.indexOf(k) >= 0) die('"' + k + '" is still in the served file');
}

const ratio = out.length / src.length;
if (!(ratio > 0.35 && ratio < 0.99)) die('suspicious size change: ' + (ratio * 100).toFixed(1) + '% of the original');

// Idempotent: a second pass must find nothing left to take.
let second = [];
const litsOut = [];
for (const r of regions(out)) {
  const body = out.slice(r.a, r.b);
  if (r.kind === 'js') second = second.concat(jsComments(body, r.a, litsOut));
  else if (r.kind === 'css') second = second.concat(cssComments(body, r.a));
  else if (r.kind === 'html') second = second.concat(htmlComments(body, r.a));
}
if (second.length) die('a second pass still found ' + second.length + ' comments');

/* THE GATE THAT ACTUALLY MATTERS, and the reason for all the bookkeeping above.
   A line-anchored strip cannot damage a normal string — one cannot span a line,
   and the scanner dies on an unterminated one. The single silent failure left is
   a TEMPLATE literal: those can span lines, so if the scanner ever lost track of
   being inside one it would happily cut a line of somebody's text out of it and
   the result would still parse. A regex is the same class of accident.
   So every string, template character and regex literal the scanner met on the
   way through is recorded, for the input and again for the output, and the two
   lists must be identical. If template tracking slipped, the slip lands in a
   different place in each file — the comment that caused it is gone from one of
   them — and the lists diverge. Nothing silent survives this. */
for (let k = 0; k < Math.max(litsIn.length, litsOut.length); k++) {
  if (litsIn[k] !== litsOut[k]) {
    const ctxA = litsIn.slice(Math.max(0, k - 12), k + 2).join('');
    const ctxB = litsOut.slice(Math.max(0, k - 12), k + 2).join('');
    die('literal #' + k + ' of ' + litsIn.length + '/' + litsOut.length + ' changed:'
        + '\n   before: ' + JSON.stringify(litsIn[k]).slice(0, 200)
        + '\n   after:  ' + JSON.stringify(litsOut[k]).slice(0, 200)
        + '\n   context before: ' + JSON.stringify(ctxA).slice(0, 400)
        + '\n   context after:  ' + JSON.stringify(ctxB).slice(0, 400));
  }
}
console.log('strip-notes: ' + litsIn.length + ' strings, template characters and regex literals verified byte-identical.');

if (process.argv.indexOf('--dry') >= 0) {
  console.log('strip-notes: DRY RUN — would remove ' + spans.length + ' comments, '
    + ((src.length - out.length) / 1024).toFixed(0) + 'KB, leaving '
    + (ratio * 100).toFixed(1) + '%.');
  const to = process.argv[process.argv.indexOf('--dry') + 1];
  if (to) { fs.writeFileSync(to, out); console.log('strip-notes: wrote ' + to); }
  process.exit(0);
}
fs.writeFileSync(file, out);
console.log('strip-notes: removed ' + spans.length + ' developer notes ('
  + ((src.length - out.length) / 1024).toFixed(0) + 'KB) from ' + file
  + '; ' + (ratio * 100).toFixed(1) + '% of the original remains.');
