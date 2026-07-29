import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("customer workspace migration separates organizations, campaigns, audiences, and distribution", async () => {
  const migration = await read("drizzle/0004_customer_platform.sql");
  for (const table of ["organizations", "organization_members", "campaigns", "audiences", "distribution_links"]) {
    assert.match(migration, new RegExp(`CREATE TABLE \\\`?${table}\\\`?`));
  }
  assert.match(migration, /ADD `organization_id`/);
  assert.match(migration, /ADD `campaign_id`/);
});

test("public poll supports direct and tracked distribution links", async () => {
  const route = await read("app/api/poll/route.ts");
  assert.match(route, /searchParams\.get\("p"\)/);
  assert.match(route, /searchParams\.get\("src"\)/);
  assert.match(route, /UPDATE distribution_links SET clicks/);
});

test("admin exposes the complete customer operating workflow", async () => {
  const admin = await read("app/admin/AdminClient.tsx");
  for (const section of ["Campaigns", "Polls", "Audiences", "Distribution", "Results", "Integrity", "Reports", "Team"]) {
    assert.match(admin, new RegExp(`"${section}"`));
  }
  assert.match(admin, /Campaign → poll → audience → tracked link/);
});
