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
  assert.match(page, /Ask one question/);
  assert.match(page, /Create a poll/);
  assert.match(page, /Verify this result/);
  assert.match(page, /private-map/);
  assert.match(layout, /Pollrr/);
  assert.match(css, /common-ground/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.deepEqual(await readdir(new URL("app/_sites-preview", root)).catch(error => error.code === "ENOENT" ? [] : Promise.reject(error)), []);
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
  assert.match(creator, /Share your poll/);
  assert.match(creator, /WhatsApp/);
  assert.match(creator, /Instagram/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.equal(JSON.parse(manifest).display, "standalone");
  assert.match(worker, /pollrr-shell/);
});

test("creator entry has a standalone frictionless session route", async () => {
  const [auth, route] = await Promise.all([
    readFile(new URL("../app/chatgpt-auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/start/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(auth, /pollrr_creator/);
  assert.match(route, /await creatorCookie/);
  assert.match(await readFile(new URL("../app/lib/creator-cookie.ts", import.meta.url), "utf8"), /HttpOnly; Secure; SameSite=Lax/);
  assert.match(route, /\/studio\?start=create/);
  assert.match(auth, /const SIGN_IN_PATH = "\/start"/);
});
