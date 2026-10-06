# Pollrr

**A self-hostable polling app for creating questions, sharing polls, collecting human responses, and explaining the results.**

[![Deploy To Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shawnbure/pollrr)

Pollrr is the poll app. The broader polling-intelligence company idea is outside this project's scope. This release contains the working app and its optional creator tools; it does not promise representative research or verified identity for every respondent.

## What You Can Do

- Create two-option polls, organize them into campaigns, and share public poll links.
- Track response totals and distribution links, with explanations and result views.
- Use creator workspaces, audience definitions, saved reports, and administrative tools.
- Create a browser-based creator identity and optionally attach a passkey for returning on another device.
- Use Workers AI for assisted drafting and analysis, with application usage limits.
- Optionally sign aggregate snapshots and verify published receipts.
- Optionally enable Stripe subscriptions, Checkout, customer portal, and signed webhooks.

AI assistance is separate from respondent votes. Open-link responses are self-selected: totals are not a scientific probability sample, and receipt integrity does not establish representative demographics or unique humans.

## Architecture And Files

| Part | Implementation | Location |
| --- | --- | --- |
| App and API | React, Next.js APIs through Cloudflare vinext | `app/` |
| Worker entry | App router and optional image optimizer | `worker/index.ts` |
| Persistent data | Cloudflare D1 / Drizzle SQL | `db/`, `drizzle/` |
| AI | Workers AI binding | `AI` |
| Public assets | Vite-generated static client | `public/`, `dist/client` |
| Separate marketing site | Optional companion site | `website/` |
| Tests | Node test runner and rendered HTML checks | `tests/` |

The app deploys to Workers; it does not require ChatGPT Sites or a Workrr account. The public build uses `vite.config.ts` and the root `wrangler.jsonc`. The marketing site is a separate optional build, not part of the app button.

## Requirements

Node.js 22.13 or later, npm, a Cloudflare account, and Git. Use the checked-in lockfile. D1 is required for app records. Workers AI is required only for AI actions. Billing and ledger signing require additional optional credentials.

## Run Locally

```sh
git clone https://github.com/shawnbure/pollrr.git
cd pollrr
npm ci
cp .dev.vars.example .dev.vars
# Put a freshly generated 32+ character CREATOR_SESSION_SECRET in .dev.vars.
npm run db:local
npm run dev
```

Use the local URL printed by Vite. `CREATOR_SESSION_SECRET` signs creator cookies; never use a published example as the value. Create a new creator from `/start`; use `/studio` to create a poll. Add a passkey from the account interface if desired. Local state is in `.wrangler`; deleting it removes your local database.

## Deploy To Cloudflare

1. Click the button, connect GitHub, and let Cloudflare create your own copy.
2. Review the Worker name and D1 binding `DB`. The template has no author account or domain routes.
3. Set the build command to `npm run build` and deploy command to `npm run deploy`.
4. Set `CREATOR_SESSION_SECRET` to a fresh random secret in the deployment flow or Worker settings. Keep it stable between releases.
5. Deploy. The deploy script applies D1 migrations through binding `DB`, then publishes the built Worker.
6. Open the returned `workers.dev` URL and run the verification checklist.

Manual setup:

```sh
npx wrangler login
npx wrangler d1 create pollrr
# Replace database_id in wrangler.jsonc with your new database ID.
npx wrangler secret put CREATOR_SESSION_SECRET
npm run build
npm run deploy
```

Wrangler may require an initial Worker upload before setting a secret on a new Worker. If so, deploy the build once, set the secret, then reload the app. Creator routes fail closed until the secret is configured. `npm run deploy` applies migrations to your selected remote database; check the account and binding before running it.

To add a domain, use Cloudflare's Worker custom-domain settings or add your own `routes` configuration. Passkeys bind to the relying-party hostname; moving domains can require registering a new passkey. Use HTTPS outside localhost.

## Accounts And Administration

Creator cookies are signed using your instance's secret. The standalone public app ignores client-supplied ChatGPT and Cloudflare identity headers. It ships no pre-authorized operator account or default administrator. Keep the cookie value private: possession grants that creator's access. This is an early account system; full account recovery and administrative lifecycle tooling are limited.

After creating your own creator identity, inspect its corresponding `guest-<creator-id>@creator.pollrr` identity in your D1 `organization_members` table. Grant platform administration only to that identity through your operator-controlled D1 console, for example:

```sql
INSERT INTO platform_admins (email, role, created_at)
VALUES ('guest-REPLACE_WITH_YOUR_CREATOR_ID@creator.pollrr', 'super_admin', 0);
```

Replace the entire placeholder with your own actual identity; this SQL does not create a login. Never grant an arbitrary user administrator status merely because they supply an email. The seeded sample organization has no operator membership.

## Optional Features And Secrets

| Setting | Purpose | Required For |
| --- | --- | --- |
| `CREATOR_SESSION_SECRET` | HMAC creator-cookie signing; 32+ random characters | Creator access |
| `CONTACT_VAULT_KEY` | Encrypt submitted contact details | Contact collection |
| `LEDGER_PRIVATE_KEY`, `LEDGER_PUBLIC_KEY` | Matching P-256 signing key pair in the formats expected by `app/lib/ledger.ts` | Signed receipts |
| `BILLING_VAULT_KEY` | Base64-encoded 32-byte AES key | Saving billing credentials through admin UI |
| `STRIPE_TEST_RESTRICTED_KEY`, `STRIPE_TEST_WEBHOOK_SECRET` | Your Stripe test API key and webhook secret | Test billing |
| `STRIPE_TEST_PRICE_PRO`, `STRIPE_TEST_PRICE_STUDIO` | Your own recurring Stripe price IDs | Test billing |
| Corresponding `STRIPE_LIVE_*` values | Your live Stripe credentials and prices | Live billing |

For billing, create your own Stripe products/prices, enable the customer portal, and register `https://YOUR_HOST/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Run test-mode Checkout and verify webhook handling before enabling live mode. The README contains no author Stripe catalog identifiers. When Stripe is not configured, paid selections can be saved without charging; that is not a completed subscription.

Ledger snapshots remain unsigned if signing keys are absent. Encryption does not make the database operator unable to access plaintext: the Worker controls the keys. AI model availability and account authorization depend on Cloudflare; no third-party LLM key is required for native Workers AI.

## Verify And Troubleshoot

```sh
npm run build
npm test
npx wrangler deploy --dry-run
```

Check the homepage, creator setup, new poll creation, public voting, results, and passkey return flow. Check that an unsigned or altered creator cookie and spoofed identity headers cannot authorize protected API actions. Verify any optional feature separately.

- `no such table`: apply all migrations to the same `DB` used by the Worker.
- Creator setup fails: configure `CREATOR_SESSION_SECRET`; old unsigned cookies require starting a new session.
- AI action fails: inspect `AI` authorization, model availability, usage limits, and Worker logs.
- Build succeeds but deployment fails: verify the generated `.wrangler/deploy/config.json` and selected Cloudflare account.
- Contact or billing storage fails: configure the feature's vault key and keep its format correct.

## License

[GNU AGPL v3](LICENSE). Modified network deployments must follow the license's source-sharing requirements. Project names and hosted domains are not an endorsement of third-party deployments.

## Secrets And Public Source

No operator passwords, API credentials, login cookies, private keys, local databases, or deployment secret files are distributed. `.dev.vars`, `.env`, `.wrangler`, and local data are ignored. Example files contain names and empty placeholders only. Create fresh secrets in your own account; never copy credentials from the original hosted service. Cloudflare account IDs and resource IDs are configuration identifiers, not API credentials, but the public templates use placeholders so your instance does not target the author's resources.

Keep secrets in Wrangler secrets or your deployment provider's secret store. Do not put them in frontend `VITE_*` values, public posts, issues, screenshots, or command arguments. A frontend variable is compiled into public JavaScript. If you accidentally commit a credential, revoke/rotate it before considering Git history cleanup. Changing a repository to public exposes its branches, tags, and commit history as well as its current files.

## Operating Your Instance

Use separate resources for development and production. Review Cloudflare billing and service limits for the features you enable; this repository does not promise a zero-cost deployment. Enable logs, monitor failed requests, and configure your own custom domain after the default deployment works. Back up persistent storage and test recovery before relying on the service. A Worker rollback does not roll back D1 data or Durable Object state. Read migrations before applying them to an existing database.

For upgrades: back up your database, pull a reviewed release, install from the lockfile, run the documented checks, apply migrations where applicable, then deploy. Keep encryption keys stable unless you also migrate the encrypted records. If you use an API token for CI, scope it to your own account and required resources and save it as a CI secret.

## Contributing

Start with the local setup and existing tests. Keep pull requests focused, describe user-visible behavior and verification, and include migration or deployment notes when those change. Do not add generated databases, private customer information, provider secrets, build output, or unrelated marketing material. Dependency upgrades should include lockfile changes and compatibility checks. This project accepts community contributions without promising a managed service, support response time, or product roadmap.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Report vulnerabilities privately through GitHub's private vulnerability reporting when enabled; public issues should omit exploit credentials and personal data.

## Cloudflare References

- [Deploy to Cloudflare button setup and supported resources](https://developers.cloudflare.com/workers/platform/deploy-buttons/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

A build or deployment dry run validates packaging; it does not validate a real account's permissions, provisioned resources, custom domain, email delivery, or external provider connections. The button uses Cloudflare's own cloning and deployment flow; review its build/deploy fields and complete the checks below after deployment.
