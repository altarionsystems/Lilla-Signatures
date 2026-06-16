#!/usr/bin/env bash
# Stamp cache-busting versions onto the CSS/JS links in every HTML file.
#
# The version is a short content hash of each asset, so the ?v= query only
# changes when the file actually changes — browsers/CDN re-fetch exactly when
# they should, and keep using the cache when nothing changed.
#
# Run automatically by .github/workflows/pages.yml on every push.
# You can also run it locally: `bash scripts/stamp-version.sh`
set -euo pipefail

cd "$(dirname "$0")/.."

hash_of() {
  if command -v sha1sum >/dev/null 2>&1; then
    sha1sum "$1" | cut -c1-10
  else
    shasum -a 1 "$1" | cut -c1-10
  fi
}

CSS_V="$(hash_of assets/css/styles.css)"
JS_V="$(hash_of assets/js/main.js)"

echo "styles.css -> v=$CSS_V"
echo "main.js    -> v=$JS_V"

count=0
for f in *.html; do
  [ -e "$f" ] || continue
  perl -0pi -e "
    s{assets/css/styles\.css(\?v=[^\"']*)?}{assets/css/styles.css?v=$CSS_V}g;
    s{assets/js/main\.js(\?v=[^\"']*)?}{assets/js/main.js?v=$JS_V}g;
  " "$f"
  count=$((count + 1))
done

echo "Stamped $count HTML files."
