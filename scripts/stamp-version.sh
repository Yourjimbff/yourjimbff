#!/usr/bin/env bash
# Stamp the version from VERSION into index.html's __APP_VERSION__ placeholder.
#
# index.html ships with a placeholder so no feature branch ever edits the version
# line. That line used to be the one guaranteed merge conflict between any two
# parallel branches — every commit bumped it. VERSION is now the source of truth.
#
# Netlify runs this as its build command. If it fails, the build fails and Netlify
# keeps serving the previous deploy — a safe failure mode. What must NEVER happen
# is a successful deploy carrying an unstamped or empty version: checkForUpdate()
# in index.html regexes the served file for
#     var APP_VERSION = '...'
# and a broken value there silently stops every client from auto-updating. So this
# script validates before it writes and verifies after.
#
# Usage: scripts/stamp-version.sh [file]   (defaults to index.html at the repo root)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="${1:-$ROOT/index.html}"
VERSION_FILE="$ROOT/VERSION"

[ -f "$VERSION_FILE" ] || { echo "stamp-version.sh: no VERSION file at $VERSION_FILE" >&2; exit 1; }
[ -f "$FILE" ] || { echo "stamp-version.sh: no such file: $FILE" >&2; exit 1; }

# Drop blank lines and surrounding whitespace. An unresolved merge (conflict
# markers, or two version lines) has to fail here rather than ship something odd.
VERSION="$(grep -v '^[[:space:]]*$' "$VERSION_FILE" | tr -d '\r' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || true)"

if [ "$(printf '%s\n' "$VERSION" | wc -l | tr -d ' ')" != "1" ]; then
  echo "stamp-version.sh: VERSION must hold exactly one version line. Got:" >&2
  printf '%s\n' "$VERSION" >&2
  exit 1
fi

if ! printf '%s' "$VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "stamp-version.sh: VERSION must look like v7.176.0. Got: '$VERSION'" >&2
  exit 1
fi

if ! grep -q '__APP_VERSION__' "$FILE"; then
  # Either a rerun on an already-stamped file, or the placeholder was lost. Only
  # let it through if what's sitting there is already a real version.
  if grep -qE "^var APP_VERSION = 'v[0-9]+\.[0-9]+\.[0-9]+';" "$FILE"; then
    echo "stamp-version.sh: already stamped, nothing to do."
    exit 0
  fi
  echo "stamp-version.sh: no __APP_VERSION__ placeholder in $FILE and no valid version line." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# THE DEVELOPER NOTES COME OUT OF THE COPY BEING PUBLISHED, and only that copy.
#
# Yusuf, 15 Sep, from the report he was sent: "remove developer notes from HTML
# ... Your role level security logic is right within your developer notes also
# exposed within your html." About 25,000 comments in that file, including a
# written account of where the app has been soft and why every lock is where it
# is. In git they are the most valuable thing here; served to the public they
# are a map.
#
# This runs against the working copy Netlify is about to deploy. The repository
# keeps its comments. strip-notes.cjs refuses to write unless every script block
# still parses and every string, template character and regex literal in the
# file is byte-identical to the source — and a refusal exits non-zero, which
# fails this script, which fails the build, which leaves the previous deploy
# serving. That is the only acceptable way for something that rewrites the app
# on its way out of the door to go wrong.
# ---------------------------------------------------------------------------
if [ "${SKIP_STRIP_NOTES:-}" = "1" ]; then
  echo "stamp-version.sh: SKIP_STRIP_NOTES=1 — leaving the developer notes in."
else
  command -v node >/dev/null 2>&1 || {
    echo "stamp-version.sh: node is not on PATH, so the developer notes cannot be" >&2
    echo "  stripped. Refusing to publish the file with them in it." >&2
    exit 1
  }
  node "$ROOT/scripts/strip-notes.cjs" "$FILE"
fi

# VERSION is validated above, so it carries no sed metacharacters.
TMP="$FILE.stamp.tmp"
sed "s/__APP_VERSION__/$VERSION/g" "$FILE" > "$TMP"
mv "$TMP" "$FILE"

# Verify the served file will satisfy checkForUpdate()'s regex.
if ! grep -q "var APP_VERSION = '$VERSION';" "$FILE"; then
  echo "stamp-version.sh: substitution did not take — refusing to deploy." >&2
  exit 1
fi
if grep -q '__APP_VERSION__' "$FILE"; then
  echo "stamp-version.sh: placeholder still present after stamping — refusing to deploy." >&2
  exit 1
fi

echo "stamp-version.sh: stamped $VERSION into $(basename "$FILE")."
