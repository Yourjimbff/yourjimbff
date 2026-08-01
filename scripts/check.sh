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
console.log(`check.sh: ok — ${blocks.length} inline JS block(s) passed, ${skipped} skipped.`);
NODE
