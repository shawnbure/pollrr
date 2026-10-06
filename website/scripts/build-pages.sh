#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$PROJECT_DIR/pages-dist"
PORT=3011

cd "$PROJECT_DIR"
npm run build

# vinext writes a Worker deploy pointer for `vinext deploy`. This project uses
# the root Pages configuration for the static marketing site, so remove the
# generated pointer before invoking `wrangler pages deploy`.
rm -f "$PROJECT_DIR/.wrangler/deploy/config.json"
rm -f "$PROJECT_DIR/../.wrangler/deploy/config.json"

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
mkdir -p "$OUTPUT_DIR/journal/ai-is-not-a-voter"
mkdir -p "$OUTPUT_DIR/journal/a-question-worth-sharing"
mkdir -p "$OUTPUT_DIR/journal/write-down-what-the-answer-will-change"
mkdir -p "$OUTPUT_DIR/journal/a-poll-result-needs-a-return-path"
mkdir -p "$OUTPUT_DIR/journal/publish-the-denominator-before-the-percentage"
mkdir -p "$OUTPUT_DIR/journal/close-the-poll-before-the-decision"
mkdir -p "$OUTPUT_DIR/creator-pilot"
curl -fsS "http://127.0.0.1:$PORT/journal" -o "$OUTPUT_DIR/journal/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/better-receipts" -o "$OUTPUT_DIR/journal/better-receipts/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/ai-is-not-a-voter" -o "$OUTPUT_DIR/journal/ai-is-not-a-voter/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/a-question-worth-sharing" -o "$OUTPUT_DIR/journal/a-question-worth-sharing/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/write-down-what-the-answer-will-change" -o "$OUTPUT_DIR/journal/write-down-what-the-answer-will-change/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/a-poll-result-needs-a-return-path" -o "$OUTPUT_DIR/journal/a-poll-result-needs-a-return-path/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/publish-the-denominator-before-the-percentage" -o "$OUTPUT_DIR/journal/publish-the-denominator-before-the-percentage/index.html"
curl -fsS "http://127.0.0.1:$PORT/journal/close-the-poll-before-the-decision" -o "$OUTPUT_DIR/journal/close-the-poll-before-the-decision/index.html"
curl -fsS "http://127.0.0.1:$PORT/creator-pilot" -o "$OUTPUT_DIR/creator-pilot/index.html"

# The marketing page is intentionally static. Removing vinext hydration and RSC
# payloads prevents client navigation code from intercepting wheel/touch scroll.
find "$OUTPUT_DIR" -name index.html -exec perl -0pi -e 's#<script\b[^>]*>.*?</script>##gs' {} +

grep -q '<title>Pollrr — Public opinion, in motion.</title>' "$OUTPUT_DIR/index.html"
grep -q 'href="/assets/' "$OUTPUT_DIR/index.html"
grep -q 'Better questions need' "$OUTPUT_DIR/journal/index.html"
grep -q 'AI should interpret, not impersonate' "$OUTPUT_DIR/journal/better-receipts/index.html"
grep -q 'AI may help us understand the room' "$OUTPUT_DIR/journal/ai-is-not-a-voter/index.html"
grep -q 'A good audience question is a distribution asset' "$OUTPUT_DIR/journal/a-question-worth-sharing/index.html"
grep -q 'Before you ask your audience' "$OUTPUT_DIR/journal/write-down-what-the-answer-will-change/index.html"
grep -q 'A poll result needs' "$OUTPUT_DIR/journal/a-poll-result-needs-a-return-path/index.html"
grep -q 'Publish the denominator' "$OUTPUT_DIR/journal/publish-the-denominator-before-the-percentage/index.html"
grep -q 'Close the poll' "$OUTPUT_DIR/journal/close-the-poll-before-the-decision/index.html"
grep -q 'Bring one real audience question' "$OUTPUT_DIR/creator-pilot/index.html"
