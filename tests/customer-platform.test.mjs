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
  for (const section of ["Polls", "Intelligence", "Integrity", "Team"]) {
    assert.match(admin, new RegExp(`"${section}"`));
  }
  assert.match(admin, /Design → sample → collect → verify → analyze/);
  assert.doesNotMatch(admin, /<Integrations/);
  assert.doesNotMatch(admin, /label:"Research operations"/);
});

test("SaaS control plane includes clients, teams, sample imports, reports, and audit history", async () => {
  const migration = await read("drizzle/0005_saas_distribution.sql");
  for (const table of ["platform_admins", "audience_imports", "audience_contacts", "contact_opt_ins", "integrations", "distribution_events", "saved_reports", "audit_log"]) {
    assert.match(migration, new RegExp(`CREATE TABLE \\\`?${table}\\\`?`));
  }
  const admin = await read("app/admin/AdminClient.tsx");
  assert.match(admin, /Creator accounts/);
  assert.match(admin, /Add sample records/);
  assert.match(admin, /Response trend/);
  assert.match(admin, /Team and access/);
  assert.match(admin, /FIELDWORK CONTROL/);
  assert.match(admin, /Add records/);
  assert.match(admin, /All creator polls/);
  assert.match(admin, /Every poll across every free creator account/);
});

test("contact collection is explicit and structurally separated from votes", async () => {
  const contact = await read("app/api/contact/route.ts");
  assert.match(contact, /Explicit consent/);
  assert.doesNotMatch(contact, /vote_id|question_id|voter_key/);
  const privacy = await read("app/privacy/page.tsx");
  assert.match(privacy, /separate contact vault/);
  assert.match(privacy, /stores no vote identifier, answer, question identifier, or device identifier/);
});

test("free creator product is simple while platform intelligence remains super-user only", async () => {
  const creator = await read("app/admin/CreatorClient.tsx");
  for (const section of ["home", "create", "polls", "results", "account"]) {
    assert.match(creator, new RegExp(`"${section}"`));
  }
  assert.doesNotMatch(creator, /Campaigns|Audiences|Fieldwork|Client administration/);
  assert.match(creator, /Free forever\. No response limits/);
  assert.match(creator, /Nightly results/);
  const page = await read("app/admin/page.tsx");
  assert.match(page, /query\.mode==="platform"&&platform/);
  const migration = await read("drizzle/0006_creator_product.sql");
  assert.match(migration, /creator_preferences/);
  assert.match(migration, /nightly_results/);
  const seed = await read("drizzle/0007_creator_test_account.sql");
  assert.match(seed, /smb\+creator@workrr\.ai/);
  assert.match(seed, /Creator Test Account/);
});

test("Pollrr AI upgrade tools are implemented and entitlement protected", async () => {
  const ai = await read("app/api/ai/route.ts");
  for (const action of ["create", "review", "ideas", "summary"]) {
    assert.match(ai, new RegExp(`action==="${action}"`));
  }
  assert.match(ai, /upgradeRequired:true/);
  assert.match(ai, /Never invent responses/);
  const creator = await read("app/admin/CreatorClient.tsx");
  assert.match(creator, /Build with AI/);
  assert.match(creator, /Review neutrality with AI/);
  assert.match(creator, /Ideas from my history/);
  assert.match(creator, /Generate AI report/);
  const wrangler = await read("wrangler.jsonc");
  assert.match(wrangler, /"binding": "AI"/);
});

test("membership plans meter complete AI drafts and remain billing-provider ready", async () => {
  const [plans, billing, ai, migration, creator] = await Promise.all([
    read("app/lib/plans.ts"),
    read("app/api/billing/route.ts"),
    read("app/api/ai/route.ts"),
    read("drizzle/0014_memberships_billing.sql"),
    read("app/admin/CreatorClient.tsx"),
  ]);
  assert.match(plans, /aiDaily: 10/);
  assert.match(plans, /aiMonthly: 100/);
  assert.match(plans, /aiMonthly: 300/);
  assert.match(billing, /activeStripeConfig/);
  assert.match(await read("app/lib/billing-config.ts"), /STRIPE_TEST_PRICE_PRO/);
  assert.match(billing, /setupRequired:true/);
  assert.match(ai, /creator_ai_poll_drafts/);
  assert.match(ai, /creator_ai_daily_usage/);
  assert.match(migration, /creator_memberships/);
  assert.match(creator, /Checkout is being connected/);
  assert.match(creator, /one credit/i);
  const webhook = await read("app/api/billing/webhook/route.ts");
  assert.match(webhook, /stripe-signature/);
  assert.match(webhook, /checkout\.session\.completed/);
});

test("super-user poll library supports creator, topic, tag search and sorting", async () => {
  const admin = await read("app/admin/AdminClient.tsx");
  assert.match(admin, /Search polls, creators, topics or tags/);
  assert.match(admin, /All creators/);
  assert.match(admin, /All topics/);
  assert.match(admin, /All tags/);
  assert.match(admin, /Most responses/);
  const migration = await read("drizzle/0008_poll_tags.sql");
  assert.match(migration, /ADD `tags`/);
});
