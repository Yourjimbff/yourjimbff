#!/usr/bin/env bash
# Syntax-check the inline JavaScript in index.html.
#
# index.html is a single-file app, so `node --check index.html` can't work
# (it's HTML). This pulls out each inline <script> block (skipping external
# src= and non-JS type= blocks) and runs `node --check` on each one, mapping
# any error back to its line number in index.html.
#
# Usage: scripts/check.sh [file]   (defaults to index.html at the repo root)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="${1:-$ROOT/index.html}"

# Resolve a node binary even when PATH is bare (nvm, homebrew, etc.).
NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
  for c in "$HOME"/.nvm/versions/node/*/bin/node /opt/homebrew/bin/node /usr/local/bin/node; do
    [ -x "$c" ] && NODE="$c" && break
  done
fi
if [ -z "$NODE" ]; then
  echo "check.sh: could not find node. Install it or add it to PATH (e.g. 'nvm use')." >&2
  exit 127
fi

if [ ! -f "$FILE" ]; then
  echo "check.sh: no such file: $FILE" >&2
  exit 1
fi

"$NODE" - "$FILE" <<'NODE'
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');

// Line number of a character offset, for mapping errors back to index.html.
const lineAt = (idx) => html.slice(0, idx).split('\n').length;

const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m, blocks = [], skipped = 0;
while ((m = re.exec(html)) !== null) {
  const attrs = m[1] || '';
  const body = m[2];
  if (/\bsrc\s*=/i.test(attrs)) { skipped++; continue; }           // external
  const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
  if (type && !/^(text\/javascript|application\/javascript|module)$/i.test(type)) {
    skipped++; continue;                                            // JSON, templates, etc.
  }
  const startLine = lineAt(m.index);
  blocks.push({ body, startLine, module: /module/i.test(type || '') });
}

if (!blocks.length) {
  console.error('check.sh: found no inline JS <script> blocks in ' + file);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yjb-check-'));
let failed = 0;
blocks.forEach((b, i) => {
  // Pad with blank lines so node's reported line numbers match index.html.
  const padded = '\n'.repeat(b.startLine - 1) + b.body;
  const f = path.join(tmp, `block-${i}.${b.module ? 'mjs' : 'js'}`);
  fs.writeFileSync(f, padded);
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    failed++;
    const out = (e.stderr || e.stdout || '').toString().replace(new RegExp(f, 'g'), file);
    console.error(`\n✗ Syntax error in <script> block #${i + 1} (starts at ${file}:${b.startLine}):\n${out}`);
  }
});
fs.rmSync(tmp, { recursive: true, force: true });

if (failed) {
  console.error(`\ncheck.sh: ${failed} block(s) failed, ${blocks.length - failed} ok, ${skipped} skipped.`);
  process.exit(1);
}

// ---- ORPHANED CONSTANTS -------------------------------------------------
// node --check proves SYNTAX ONLY. It passes code that throws the moment it
// runs, which is how deleting a dead function on 16 Aug took the two lines
// under it — _MICSVG and _STOPSVG, both still used — and shipped a live
// "_MICSVG is not defined" that killed the Feed page mid-render.
//
// Deliberately narrow: only SCREAMING_SNAKE module constants, which is where
// this class of bug lives (they are defined once, at top level, next to the
// helpers that get deleted). A broad undefined-identifier check would drown
// in browser globals and be turned off within a week.
// Strings and comments are STRIPPED first (kept newline-for-newline so the
// reported line numbers still point at index.html). Without this the scan reads
// prompt text and object keys as identifiers — the first run flagged eleven
// things like FOOD_LOG, which live inside model-prompt strings, and MF.CARB_CEIL,
// which is an object property. A check with false positives gets switched off.
const strip = (s) => {
  let out = '', i = 0;
  const keepNl = (t) => t.replace(/[^\n]/g, ' ');
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (c === '/' && n === '/') { const j = s.indexOf('\n', i); const e = j < 0 ? s.length : j; out += keepNl(s.slice(i, e)); i = e; continue; }
    if (c === '/' && n === '*') { const j = s.indexOf('*/', i + 2); const e = j < 0 ? s.length : j + 2; out += keepNl(s.slice(i, e)); i = e; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      // A ' or " inside a REGEX LITERAL is not an opening quote. This scanner has
      // no lexer, so it used to swallow one - /[\u2019']/g in _jimRepeatOnly opened a
      // string that ran on for thousands of lines, blanking the three _JIM_*_RE
      // declarations and making check.sh report them as undefined on every run,
      // for everyone, since the day that regex landed. The whole file's checks
      // exit at that point, so nothing after it has run in weeks.
      // The rule that fixes it without a lexer: a ' or " string cannot contain a
      // raw newline. If we reach one before the closing quote, this was never a
      // string - emit the character and carry on. Backticks may span lines, so
      // they keep the old behaviour.
      while (j < s.length) {
        if (s[j] === '\\') { j += 2; continue; }
        if (s[j] === c) break;
        if (c !== '`' && s[j] === '\n') { j = -1; break; }
        j++;
      }
      if (j === -1) { out += c; i++; continue; }
      const e = Math.min(j + 1, s.length);
      out += c + keepNl(s.slice(i + 1, e));                  // quote kept, contents blanked
      i = e; continue;
    }
    out += c; i++;
  }
  return out;
};
// Property accesses (MF.CARB_CEIL, obj?.FOO) are not free identifiers either.
const js = strip(blocks.map(b => b.body).join('\n;\n')).replace(/\??\.\s*[A-Za-z_$][A-Za-z0-9_$]*/g, m => ' '.repeat(m.length));
const declared = new Set();
for (const d of js.matchAll(/(?:\bvar\b|\blet\b|\bconst\b)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g)) declared.add(d[1]);
for (const d of js.matchAll(/\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)/g)) declared.add(d[1]);
// Anything assigned onto window counts as declared too.
for (const d of js.matchAll(/\bwindow\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=/g)) declared.add(d[1]);
// ...and anything ASSIGNED anywhere, which covers the second and later names in
// a multi-declarator statement (`var _POST=3e6, _PRE=3e6`) that the regex above
// only sees the first of. A constant taken out by a delete has no assignment
// left anywhere, so this stays sharp for the case that matters.
for (const d of js.matchAll(/(^|[^.\w$])([A-Za-z_$][A-Za-z0-9_$]*)\s*=(?!=)/g)) declared.add(d[2]);

// SCOPED TO THE _UPPER CONVENTION this file uses for module-private constants
// — _MICSVG, _STOPSVG, _CC_VERB, _JT_ANCHOR and friends. Bare SCREAMING_SNAKE
// names are also object-literal keys (MF.CARB_CEIL) and marker names inside
// regex literals ([FOOD_LOG]), and telling those apart needs a real lexer. The
// leading underscore is the line between "a constant that can be orphaned by a
// delete" and "noise", and it catches the exact bug that shipped.
const used = new Map();
const useRe = /(^|[^.\w$])(_[A-Z][A-Z0-9_]{2,})\b(?!\s*:)/g;
let um;
while ((um = useRe.exec(js)) !== null) {
  const name = um[2];
  if (declared.has(name) || used.has(name)) continue;
  // Real line in index.html, found by looking the name up in the source rather
  // than counting into the stripped copy, whose offsets do not line up.
  const at = html.indexOf(name);
  used.set(name, at < 0 ? 0 : lineAt(at));
}
if (used.size) {
  console.error('\n✗ check.sh: constant(s) used but never defined — this passes node --check and throws at runtime:');
  for (const [n, line] of used) console.error(`    ${n}  (${file}:${line})`);
  console.error('\nIf one was just removed, it was probably taken by a neighbouring delete.');
  process.exit(1);
}

// ===== A PROMPT LINE THAT NEVER ARRIVES (23 Aug -> 24 Aug, v7.980.324) ======
// The single most expensive bug this file has had, and node --check cannot see
// it. One line inside buildCoachVoice's giant return was written ending in a
// quote instead of a quote-plus:
//
//     'CARDIO BESIDE A LIFT IS ITS OWN ENTRY ... meal slots.\n\n'      <- no +
//     'If the user describes a deliberate walk ...\n'+
//
// That ENDS the return statement. Everything below it is still perfectly valid
// JavaScript — a bare string-concatenation expression statement — so the syntax
// gate passes, nothing throws, and the app runs. It just silently stops being
// part of the prompt. Three lines had done it, and between them they amputated
// 55,000 characters: the entire food logging rule set, the [FOOD_LOG] worked
// example, the marker-is-required law, the back-dating rule, the photo rules
// and the boundaries block. The model was never taught the food marker at all.
//
// That is what "the prompt rule did not take" had been for a day. Three rules
// were written, shipped, certified against a corpus, reported as not holding,
// and rewritten — and none of them was ever sent to the model.
//
// THE RULE: inside a run of consecutive string-literal lines, every line has to
// be joined to the next one — either it ends with + or the next one starts with
// one. A run of three or more is a prompt block, never an array element list.
const RUN_MIN = 3;
// A COMMA ENDING IS AN ELEMENT, NOT A PROMPT LINE. Arrays of strings and
// object literals ('pull-up':'doing pull-ups',) are the shape this would
// otherwise fire on all day; they end in a comma and a prompt line never does.
const strLine = (s) => {
  const t = s.trim();
  if (!t.startsWith("'") && !t.startsWith("+'")) return false;
  if (t.endsWith(',')) return false;
  return /'\s*[+;]?$/.test(t);
};
const breaks = [];
{
  const lines = html.split('\n');
  let i = 0;
  while (i < lines.length) {
    if (!strLine(lines[i])) { i++; continue; }
    let j = i;
    while (j + 1 < lines.length && (strLine(lines[j + 1]) || lines[j + 1].trim() === '')) {
      // a blank line inside a run is fine, but it must not end the run on its own
      let k = j + 1;
      while (k < lines.length && lines[k].trim() === '') k++;
      if (k >= lines.length || !strLine(lines[k])) break;
      j = k;
    }
    if (j - i + 1 >= RUN_MIN) {
      for (let a = i; a < j; a++) {
        if (!strLine(lines[a])) continue;
        let b = a + 1;
        while (b <= j && lines[b].trim() === '') b++;
        if (b > j) break;
        const endsJoined = /\+$/.test(lines[a].trim());
        const nextJoins = lines[b].trim().startsWith('+');
        if (!endsJoined && !nextJoins) breaks.push({ line: a + 1, text: lines[a].trim().slice(0, 70) });
      }
    }
    i = j + 1;
  }
}
if (breaks.length) {
  console.error('\n✗ check.sh: a string block stops concatenating mid-way — this passes node --check and silently drops every line below it:');
  for (const b of breaks) console.error(`    ${file}:${b.line}  ${b.text}…`);
  console.error('\nEnd the line with a + (or start the next one with one). If the break is deliberate, the two halves belong in separate variables.');
  process.exit(1);
}

console.log(`check.sh: ok — ${blocks.length} inline JS block(s) passed, ${skipped} skipped, no orphaned constants.`);
NODE
