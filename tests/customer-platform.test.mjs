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
  for (const section of ["Campaigns", "Polls", "Samples", "Fieldwork", "Intelligence", "Integrity", "Team"]) {
    assert.match(admin, new RegExp(`"${section}"`));
  }
  assert.match(admin, /Design → sample → collect → verify → analyze/);
  assert.doesNotMatch(admin, /<Integrations/);
});

test("SaaS control plane includes clients, teams, sample imports, reports, and audit history", async () => {
  const migration = await read("drizzle/0005_saas_distribution.sql");
  for (const table of ["platform_admins", "audience_imports", "audience_contacts", "contact_opt_ins", "integrations", "distribution_events", "saved_reports", "audit_log"]) {
    assert.match(migration, new RegExp(`CREATE TABLE \\\`?${table}\\\`?`));
  }
  const admin = await read("app/admin/AdminClient.tsx");
  assert.match(admin, /Client administration/);
  assert.match(admin, /Add sample records/);
  assert.match(admin, /Response trend/);
  assert.match(admin, /Team and access/);
  assert.match(admin, /FIELDWORK CONTROL/);
  assert.match(admin, /Add records/);
  assert.match(admin, /campaign-polls/);
});

test("contact collection is explicit and structurally separated from votes", async () => {
  const contact = await read("app/api/contact/route.ts");
  assert.match(contact, /Explicit consent/);
  assert.doesNotMatch(contact, /vote_id|question_id|voter_key/);
  const privacy = await read("app/privacy/page.tsx");
  assert.match(privacy, /separate contact vault/);
  assert.match(privacy, /stores no vote identifier, answer, question identifier, or device identifier/);
});
