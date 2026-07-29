import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../drizzle/0003_trust_ledger.sql", import.meta.url), "utf8");
const voteRoute = await readFile(new URL("../app/api/poll/route.ts", import.meta.url), "utf8");
const ledgerRoute = await readFile(new URL("../app/api/ledger/[questionId]/route.ts", import.meta.url), "utf8");
const methodology = await readFile(new URL("../app/api/methodology/route.ts", import.meta.url), "utf8");

test("trust ledger is append-only and separates public proofs from raw votes", () => {
  assert.match(migration, /CREATE TABLE `vote_events`/);
  assert.match(migration, /CREATE TABLE `aggregate_snapshots`/);
  assert.doesNotMatch(ledgerRoute, /SELECT\s+(voter_key|choice|explanation)/i);
  assert.match(ledgerRoute, /leafHashes/);
  assert.match(ledgerRoute, /modelEstimates: null/);
});

test("human votes are counted before optional qualitative context", () => {
  assert.match(voteRoute, /INSERT OR IGNORE INTO votes/);
  assert.match(voteRoute, /INSERT INTO vote_events/);
  assert.match(voteRoute, /integrityStatus/);
  assert.match(voteRoute, /publishSnapshot/);
});

test("methodology explicitly excludes synthetic opinions", () => {
  assert.match(methodology, /syntheticEstimate/);
  assert.match(migration, /No synthetic respondent or AI-generated vote is included/);
});
