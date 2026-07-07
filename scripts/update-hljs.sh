#!/usr/bin/env bash
# Re-vendor highlight.js at a given version.
#
# Downloads the core library, all language packs, and all theme CSS files
# used by the app into static/vendor/highlight.js/<version>/, updates the
# version referenced by index.html and app.js, and removes old versions.
#
# Usage: scripts/update-hljs.sh <version>   e.g. scripts/update-hljs.sh 11.11.1
set -euo pipefail

VERSION="${1:?usage: scripts/update-hljs.sh <version>  (e.g. 11.11.1)}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_ROOT="$REPO_ROOT/static/vendor/highlight.js"
DEST="$VENDOR_ROOT/$VERSION"
CDN="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/$VERSION"

# Keep in sync with the <script> tags in static/index.html and the
# language <select> options.
LANGUAGES=(
  bash c cpp csharp css dart dockerfile elixir erlang go graphql groovy
  haskell java javascript json kotlin latex lua makefile markdown nginx
  objectivec perl php plaintext powershell python r ruby rust scala scss
  shell sql swift typescript vbnet xml yaml
)

# Keep in sync with THEME_PATH in static/app.js.
THEMES=(
  default github github-dark monokai vs vs2015 atom-one-dark atom-one-light
  base16/dracula nord tokyo-night-dark stackoverflow-light stackoverflow-dark
)

fetch() {
  curl -fsSL --proto '=https' --tlsv1.2 "$1" -o "$2" \
    || { echo "FAILED: $1" >&2; exit 1; }
}

sed_inplace() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@" # BSD sed (macOS)
  fi
}

echo "Vendoring highlight.js $VERSION into ${DEST#"$REPO_ROOT"/} ..."
mkdir -p "$DEST/languages" "$DEST/styles/base16"

fetch "$CDN/highlight.min.js" "$DEST/highlight.min.js"

for lang in "${LANGUAGES[@]}"; do
  fetch "$CDN/languages/$lang.min.js" "$DEST/languages/$lang.min.js"
done

for theme in "${THEMES[@]}"; do
  fetch "$CDN/styles/$theme.min.css" "$DEST/styles/$theme.min.css"
done

# highlight.js is BSD-3-Clause; ship the license with the vendored files.
fetch "https://raw.githubusercontent.com/highlightjs/highlight.js/$VERSION/LICENSE" "$DEST/LICENSE"

echo "Updating version references in index.html and app.js ..."
sed_inplace -E "s|vendor/highlight\.js/[0-9][0-9A-Za-z.-]*/|vendor/highlight.js/$VERSION/|g" \
  "$REPO_ROOT/static/index.html" "$REPO_ROOT/static/app.js"

for dir in "$VENDOR_ROOT"/*/; do
  base="$(basename "$dir")"
  if [ "$base" != "$VERSION" ]; then
    echo "Removing old version $base ..."
    rm -rf "$dir"
  fi
done

echo "Done. Old service-worker caches keep orphaned entries until CACHE_NAME"
echo "in static/sw.js is bumped; bump it when you want them cleaned up."
