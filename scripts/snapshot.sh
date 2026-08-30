#!/usr/bin/env bash
# PRODUCTION SNAPSHOT — row counts for every client-keyed table, with receipts.
#
# WHAT THIS IS AND IS NOT. This is the half of a backup a lane can actually
# perform: a timestamped census of what exists right now, so that after any
# restore there is something to compare against. It is NOT a backup. It cannot
# restore, it holds no row data, and it cannot see the seven tables the public
# key is revoked on (those are counted through the trainer door instead — see
# the runbook).
#
# Uses PostgREST's Content-Range with Prefer: count=exact, which returns the
# count without transferring a single row. Read-only by construction: HEAD.
set -uo pipefail
SB="https://frxptalfyutukmnsvysg.supabase.co"
K="$(grep -o "var SB_KEY = '[^']*'" index.html | sed "s/.*'\(.*\)'/\1/")"
[ -z "$K" ] && { echo "snapshot: could not read SB_KEY out of index.html" >&2; exit 1; }
OUT="${1:-snapshot-$(date -u +%Y%m%dT%H%M%SZ).txt}"
TABLES=$(node -e "
const fs=require('fs');const s=fs.readFileSync('index.html','utf8');
const b=(s.match(/var JV_CLIENT_TABLES=\[[\s\S]*?\n\];/)||[''])[0]
  .split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');
console.log([...b.matchAll(/\['([a-z_]+)'/g)].map(m=>m[1]).join(' '));
")
{
  echo "PRODUCTION SNAPSHOT"
  echo "taken   $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "project frxptalfyutukmnsvysg"
  echo "method  PostgREST HEAD + Prefer: count=exact, public key, read-only"
  echo ""
  printf "%-22s %10s  %s\n" "TABLE" "ROWS" "NOTE"
  total=0; unreadable=0
  for t in $TABLES; do
    # NO SINGLE SELECT SHAPE WORKS FOR EVERY TABLE, and the first two versions of
    # this script each got a different table wrong while looking perfectly
    # healthy.
    #   select=client_code  400s on calendar_blocks, which keys on owner_code
    #   select=*            401s on client_notes, which is COLUMN-restricted:
    #                       the public key may read id/shared_note/shared_at and
    #                       not the private note, so asking for everything is
    #                       refused
    # Both failures print as "revoked", which is a lie in both directions. So it
    # tries three shapes and only reports unreadable when all three are refused.
    cr=""
    for sel in "client_code" "id" "*"; do
      cr=$(curl -s -I "$SB/rest/v1/$t?select=$sel" \
        -H "apikey: $K" -H "Authorization: Bearer $K" \
        -H "Prefer: count=exact" -H "Range-Unit: items" -H "Range: 0-0" 2>/dev/null \
        | tr -d '\r' | grep -i '^content-range:' | sed 's/.*\///')
      [ -n "$cr" ] && [ "$cr" != "*" ] && break
    done
    if [ -n "$cr" ] && [ "$cr" != "*" ]; then
      printf "%-22s %10s\n" "$t" "$cr"
      total=$((total+cr))
    else
      printf "%-22s %10s  %s\n" "$t" "-" "revoked to the public key; count via the door"
      unreadable=$((unreadable+1))
    fi
  done
  echo ""
  echo "counted     $total rows across the readable tables"
  echo "unreadable  $unreadable tables (door-only, listed above)"
} | tee "$OUT"
echo ""
echo "written to $OUT"
