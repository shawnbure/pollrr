import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("finished Pollrr experience replaces the disposable starter", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Vote to reveal the live split/);
  assert.match(page, /Verify this result/);
  assert.match(page, /private-map/);
  assert.match(layout, /Pollrr/);
  assert.match(css, /common-ground/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.deepEqual(await readdir(new URL("app/_sites-preview", root)), []);
});

test("build emits the voting, methodology, and verification routes", async () => {
  const worker = await readFile(new URL("../dist/server/index.js", import.meta.url), "utf8");
  assert.match(worker, /api\/poll/);
  assert.match(worker, /api\/methodology/);
  assert.match(worker, /api\/ledger/);
});

test("viral loop and installable PWA remain part of the product", async () => {
  const [page, creator, layout, manifest, worker] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/CreatorClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Challenge a friend/);
  assert.match(page, /friends answered your challenge/);
  assert.match(creator, /Now start the ripple/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(worker, /pollrr-shell/);
});
