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
