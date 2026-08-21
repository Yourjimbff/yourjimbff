#!/usr/bin/env bash
# Git merge driver for the VERSION file.
#
# Two parallel branches both bump VERSION, so every merge would otherwise stop
# on a one-line conflict.
#
# Taking the higher version is WRONG when both sides bumped. If main is on
# v7.192.0 and a branch also picked v7.192.0, "higher" resolves to v7.192.0 —
# the number already deployed. checkForUpdate() compares the served version
# against the running one, so anyone already on that build never pulls the
# merged result. That happened on three consecutive merges before this driver
# learned to look at the base.
#
# The base (%O) is what distinguishes the two cases:
#   only one side moved  -> take that side, it's an ordinary fast-forward
#   both sides moved     -> take the higher AND bump it, because the merged
#                           tree is newer than either parent and needs a number
#                           neither of them has shipped
#
# ONE CASE THIS CANNOT FIX, AND NO FUTURE EDIT TO THIS FILE WILL EITHER.
#
# If both branches land on the SAME number, git resolves the file by itself —
# identical content is not a conflict — and this driver is NEVER INVOKED. Proven
# on 20 Aug 2026 by wrapping the driver in a logger and running all four
# collision shapes through real merges:
#
#   base 140 | ours 142 | theirs 142  -> driver NOT CALLED -> v7.980.142
#   base 140 | ours 142 | theirs 144  -> driver called     -> (see bump)
#   base 140 | ours 142 | theirs 140  -> driver NOT CALLED -> v7.980.142
#   base 140 | ours 140 | theirs 144  -> driver NOT CALLED -> v7.980.144
#
# Only the second shape ever reaches this script. The first is the dangerous one:
# the merge carries a version that is ALREADY LIVE, and checkForUpdate compares
# `live === APP_VERSION` — a plain equality — so every device already on that
# number never pulls. The work is deployed and unreachable, and the push looked
# like it succeeded.
#
# THE PUSH LOOP IS THE ONLY DEFENCE, and it lives in the person shipping, not
# here. Do not come to this file looking for a fix for it:
#   1. fetch origin and read origin/main's VERSION IMMEDIATELY before pushing
#   2. set VERSION two above that fresh number
#   3. if the push is rejected: re-fetch, re-merge, re-bump, re-run check.sh,
#      re-push, and keep looping until it lands
#   4. after deploy, confirm the SERVED version is strictly higher than what was
#      served before, AND grep the served file for your own code. Both.
#
# Register once per clone (this can't be checked in — git won't run a driver a
# repo defines for itself):
#     git config merge.maxversion.driver 'scripts/merge-version.sh %O %A %B'
# .gitattributes points VERSION at it. Unregistered, git falls back to a normal
# conflict, so a clone without the setup is never worse off than before.
#
# Args, per git's convention: %O = base, %A = ours (and the file to write), %B = theirs
set -eu

BASE="$1"
OURS="$2"
THEIRS="$3"

read_v(){ grep -v '^[[:space:]]*$' "$1" 2>/dev/null | head -1 | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || true; }
valid(){ printf '%s' "$1" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; }
# v7.980.144 -> v7.980.146. TWO ON THE PATCH, never a new minor.
#
# This used to read `printf "v%d.%d.0", $1, $2+1` — it rolled the MINOR and reset
# the patch, so a routine parallel merge of .142 and .144 resolved to v7.981.0.
# That was the script doing exactly what it was written to do, not an edge case:
# every both-sides-moved merge burned a whole minor. Measured on a staged
# collision, 20 Aug 2026 (see the harness note below).
#
# Plus TWO rather than plus one, for the same reason CLAUDE.md tells humans to
# bump by two: three lanes ship in parallel, and +1 above the higher side is the
# number the other lane is most likely to have just taken.
bump(){ printf '%s' "$1" | awk -F. '{sub(/^v/,"",$1); printf "v%d.%d.%d", $1, $2, $3+2}'; }

O="$(read_v "$BASE")"
A="$(read_v "$OURS")"
B="$(read_v "$THEIRS")"

# Anything unexpected on either side: leave ours in place and report a conflict
# so a human looks at it. Never guess.
valid "$A" || exit 1
valid "$B" || exit 1

if [ "$A" = "$B" ]; then
  OUT="$A"                                  # both landed on it; nothing to settle
elif valid "$O" && [ "$A" = "$O" ]; then
  OUT="$B"                                  # only theirs moved
elif valid "$O" && [ "$B" = "$O" ]; then
  OUT="$A"                                  # only ours moved
else
  # both moved, or there's no usable base. sort -V handles the leading v and
  # orders 7.9.0 before 7.10.0.
  HIGH="$(printf '%s\n%s\n' "$A" "$B" | sort -V | tail -1)"
  OUT="$(bump "$HIGH")"
fi

valid "$OUT" || exit 1                      # a malformed result is a conflict, not a deploy
printf '%s\n' "$OUT" > "$OURS"
exit 0
