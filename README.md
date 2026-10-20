# Pollrr

**[https://pollrr.ai](https://pollrr.ai)** — pollrr.ai is an open-source, self-hostable polling app on Cloudflare: ask one question, share one link, see the split, with verifiable result receipts.

The hosted app runs on Cloudflare Workers, with D1 for records and Workers AI for drafting help. Production is Worker `pollrr-production`, the `production` environment in the root `wrangler.jsonc`.

## Stack

| Part | Implementation | Location |
| --- | --- | --- |
| App and API | React and Next.js route handlers through vinext | `app/` |
| Worker bundle | Built app router published by Wrangler | `dist/server/index.js` |
| Records | Cloudflare D1 and Drizzle SQL | `db/`, `drizzle/` |
| Drafting help | Workers AI binding `AI` | `wrangler.jsonc` |
| Local preview | Vite Cloudflare plugin with a local binding config | `vite.config.ts` |

Deploys use `wrangler.jsonc`, including the `production` and `development` environments, custom domains, and D1 bindings. `npm run dev` does not read that file: `vite.config.ts` passes a separate local binding config to the Cloudflare plugin.

## Commands

Node.js 22.13 or later. From the repository root, use the checked-in lockfile:

```sh
npm ci
npm run dev
npm run build
npm test
```

`npm test` builds the app, then runs `tests/rendered-html.test.mjs`.

## Production deploy

From the repository root, after the change is merged:

```sh
npm ci && npm run build && npx wrangler deploy --env production
```

`--env production` publishes Worker `pollrr-production` with that environment's routes and D1 database. Deploying without `--env production` publishes the top-level Worker `pollrr` instead, which has no production routes or database. This command does not apply D1 migrations: the production database binding has no `migrations_dir`.
