#!/usr/bin/env bash
# Git merge driver for the VERSION file: keep the higher version.
#
# Two parallel branches both bump VERSION, so every merge would otherwise stop on
# a one-line conflict. The highest version always wins — that's the right answer
# for a monotonic ship counter.
#
# Register once per clone (this can't be checked in — git won't run a driver the
# repo defines for itself):
#     git config merge.maxversion.driver 'scripts/merge-version.sh %O %A %B'
# .gitattributes points VERSION at it. Unregistered, git just falls back to a
# normal conflict, so a clone without the setup is never worse off than before.
#
# Args, per git's convention: %O = base, %A = ours (and the file to write), %B = theirs
set -eu

BASE="$1"
OURS="$2"
THEIRS="$3"

read_v(){ grep -v '^[[:space:]]*$' "$1" 2>/dev/null | head -1 | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || true; }
valid(){ printf '%s' "$1" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; }

A="$(read_v "$OURS")"
B="$(read_v "$THEIRS")"

# Anything unexpected on either side: leave ours in place and report a conflict so
# a human looks at it. Never guess.
valid "$A" || exit 1
valid "$B" || exit 1

# sort -V handles the leading v and orders 7.9.0 before 7.10.0.
HIGH="$(printf '%s\n%s\n' "$A" "$B" | sort -V | tail -1)"
printf '%s\n' "$HIGH" > "$OURS"
exit 0
