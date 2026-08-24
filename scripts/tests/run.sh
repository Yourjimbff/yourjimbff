#!/usr/bin/env bash
# THE TEST LIST. Run it before every ship that touches parsing — standing law,
# no exceptions (Yusuf, ruling, 24 Aug).
#
# Each suite pulls the real functions OUT of index.html by name and evaluates
# them against stubs, so they test the shipped code rather than a copy of it.
# That means a suite breaks when a function it lifts is renamed or deleted —
# which is the point: it is telling you the seam moved.
#
# What it proves: syntax, and that the named behaviours still hold.
# What it CANNOT prove: that the model behaves. Anything model-shaped has to be
# measured on the DEPLOYED file with a scratch client, and the rows read back.
#
# Usage: bash scripts/tests/run.sh      (from anywhere in the repo)
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1
NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
  for c in "$HOME"/.nvm/versions/node/*/bin/node /opt/homebrew/bin/node /usr/local/bin/node; do
    [ -x "$c" ] && NODE="$c" && break
  done
fi
[ -z "$NODE" ] && { echo "run.sh: no node on PATH" >&2; exit 127; }

fail=0
printf '  %-18s %s\n' "check.sh" "$(bash scripts/check.sh 2>&1 | tail -1)"
bash scripts/check.sh >/dev/null 2>&1 || fail=1
for f in "$ROOT"/scripts/tests/*.cjs; do
  name="$(basename "$f")"
  # Files starting with _ are shared helpers required BY the suites, not suites.
  case "$name" in _*) continue;; esac
  raw="$("$NODE" "$f" 2>&1)"; rc=$?
  out="$(printf '%s' "$raw" | tail -1)"
  printf '  %-18s %s\n' "$name" "$out"
  # THE EXIT CODE, never words in the output. An earlier version of this
  # grepped for "FAIL" and reported "all suites pass" over a suite that had
  # crashed on a missing argument and printed a node version banner instead.
  [ "$rc" -ne 0 ] && fail=1
done
if [ "$fail" -ne 0 ]; then
  echo
  echo "  SOMETHING FAILED — do not ship. Run the suite on its own to see which line."
  exit 1
fi
echo
echo "  all suites pass"
