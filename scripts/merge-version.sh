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
# ONE CASE THIS CANNOT FIX: if both branches bump to the SAME number, git
# resolves the file itself and never calls the driver at all (verified — zero
# invocations). The merge then carries an already-shipped version. Nothing in
# the driver can see that, so if two people are bumping in parallel, bump by
# two on one side or check VERSION before merging.
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
# v7.192.0 -> v7.193.0. A ship counter moves on the minor; the patch resets.
bump(){ printf '%s' "$1" | awk -F. '{sub(/^v/,"",$1); printf "v%d.%d.0", $1, $2+1}'; }

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
