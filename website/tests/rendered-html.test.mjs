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
  const aiArticle = await render("/journal/ai-is-not-a-voter");
  const creatorPlaybook = await render("/journal/a-question-worth-sharing");
  assert.equal(journal.status, 200);
  assert.equal(article.status, 200);
  assert.equal(aiArticle.status, 200);
  assert.equal(creatorPlaybook.status, 200);
  assert.match(await journal.text(), /Better questions need/);
  assert.match(await article.text(), /AI should interpret, not impersonate/);
  assert.match(await aiArticle.text(), /AI may help us understand the room/);
  assert.match(await creatorPlaybook.text(), /A good audience question is a distribution asset/);
});

test("server-renders the creator pilot acquisition path", async () => {
  const pilot = await render("/creator-pilot");
  assert.equal(pilot.status, 200);
  const html = await pilot.text();
  assert.match(html, /Bring one real audience question/);
  assert.match(html, /creator_pilot_sep2026/);
  assert.match(html, /An open-link convenience sample represents/);
});

test("server-renders the current creator field note", async () => {
  const response = await render("/journal/write-down-what-the-answer-will-change");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Before you ask your audience/);
  assert.match(html, /what the answer will change/);
  assert.match(html, /POLLRR CREATOR PILOT/);
});

test("server-renders the return-path creator field note", async () => {
  const response = await render("/journal/a-poll-result-needs-a-return-path");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /A poll result needs/);
  assert.match(html, /return path/);
  assert.match(html, /Build the return path/);
});

test("server-renders the denominator creator field note", async () => {
  const response = await render("/journal/publish-the-denominator-before-the-percentage");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Publish the denominator/);
  assert.match(html, /convenience sample represents participants/);
  assert.match(html, /Build the first question/);
});

test("server-renders the decision-deadline creator field note", async () => {
  const response = await render("/journal/close-the-poll-before-the-decision");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Close the poll/);
  assert.match(html, /decision sets the deadline/);
  assert.match(html, /Build the first question/);
});
