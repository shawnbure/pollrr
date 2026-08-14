import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Pollrr marketing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Pollrr — Public opinion, in motion\.<\/title>/i);
  assert.match(html, /What people think\./);
  assert.match(html, /href="\/journal"/);
});

test("server-renders the journal and first essay", async () => {
  const journal = await render("/journal");
  const article = await render("/journal/better-receipts");
  assert.equal(journal.status, 200);
  assert.equal(article.status, 200);
  assert.match(await journal.text(), /Better questions need/);
  assert.match(await article.text(), /AI should interpret, not impersonate/);
});
