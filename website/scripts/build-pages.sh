#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/pages-dist"
PORT=3011

cd "$PROJECT_DIR"
npm run build

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp -R dist/client/. "$OUTPUT_DIR/"

npm run start -- --port "$PORT" >/tmp/pollrr-pages-build.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in {1..30}; do
  if curl -fsS "http://127.0.0.1:$PORT/" -o "$OUTPUT_DIR/index.html"; then
    break
  fi
  sleep 1
done

test -s "$OUTPUT_DIR/index.html"

mkdir -p "$OUTPUT_DIR/journal/better-receipts"
curl -fsS "http://127.0.0.1:$PORT/journal" -o "$OUTPUT_DIR/journal/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/better-receipts" -o "$OUTPUT_DIR/journal/better-receipts/index.html"

# The marketing page is intentionally static. Removing vinext hydration and RSC
# payloads prevents client navigation code from intercepting wheel/touch scroll.
find "$OUTPUT_DIR" -name index.html -exec perl -0pi -e 's#<script\b[^>]*>.*?</script>##gs' {} +

grep -q '<title>Pollrr — Public opinion, in motion.</title>' "$OUTPUT_DIR/index.html"
grep -q 'href="/assets/' "$OUTPUT_DIR/index.html"
grep -q 'Better questions need' "$OUTPUT_DIR/journal/index.html"
grep -q 'AI should interpret, not impersonate' "$OUTPUT_DIR/journal/better-receipts/index.html"
