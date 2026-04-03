# Tollgate

x402 bot payment gateway. Publishers charge AI bots for content access via on-chain micropayments (USDC on Base).

## Architecture

- Monorepo: Turborepo + pnpm
- `apps/gateway` — Hono on Cloudflare Workers (gw.obul.ai)
- `apps/dashboard` — Next.js on Cloudflare Workers via OpenNextJS (tollgate.obul.ai)
- `packages/shared` — D1 schema (Drizzle), types, Zod validators
- `packages/x402` — x402 payment verification via viem

## Commands

```bash
pnpm dev:gateway     # Start gateway locally
pnpm dev:dashboard   # Start dashboard locally
pnpm build           # Build all packages
pnpm typecheck       # Type-check all packages
```

## Deployment

Cloudflare account: Polymer Labs (`4bfbcd216e0ba45b6384012c87f37584`). Two environments:

| Env | Gateway | Dashboard |
|-----|---------|-----------|
| mainnet | `tollgate-gateway` | `tollgate-dashboard` |
| testnet | `tollgate-gateway-testnet` | `tollgate-dashboard-testnet` |

```bash
# From apps/gateway or apps/dashboard:
npx wrangler deploy              # Deploy mainnet
npx wrangler deploy --env testnet # Deploy testnet

# Dashboard requires build first:
npx opennextjs-cloudflare build && npx wrangler deploy
```

- `pnpm deploy` does NOT work — it's a pnpm command, not the script. Use `npx wrangler deploy` directly.
- Mainnet RPC: QuickNode Base Mainnet. Testnet RPC: QuickNode Base Sepolia.
- D1 migrations (remote): `npx wrangler d1 execute tollgate --file=../../packages/shared/migrations/0000_initial.sql --remote`
- D1 migrations (testnet remote): use `tollgate-testnet` instead of `tollgate`

## Database

Cloudflare D1 (SQLite). Schema defined in `packages/shared/src/schema.ts`. Migrations in `packages/shared/migrations/`. Local setup: `bash scripts/setup-local.sh` (applies migration + seed to both gateway and dashboard local D1).

## Gotchas

- `NEXT_PUBLIC_*` env vars are inlined at build time by Next.js. Building the dashboard with `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` in `.env.local` bakes the auth bypass into the production bundle. Set it to `false` before building for deploy.
- IDE "Cannot find module" errors for workspace packages (`@tollgate/shared`, etc.) are false positives — `pnpm typecheck` is the source of truth.
- Gateway and dashboard have separate `.wrangler/state` dirs — local D1 migrations must be applied to both (the setup script handles this).
- Use `CREATE TABLE IF NOT EXISTS` and `INSERT OR IGNORE` in migrations for idempotency.

## Auth

Google OAuth via obul-accounts backend. Dashboard calls `/auth/session` to check session. Dev bypass: set `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` in `.env.local`.

## Design

Matches obul-dashboard theme (Space Grotesk font, HSL color system, glass morphism). Reference: `/Users/inkvi/dev/obul-dashboard`.

## Key Concepts

- **Gateway Worker**: Returns HTTP 402 with x402 payment terms. After on-chain payment verification, fetches and returns origin content (single-use).
- **Publisher Dashboard**: Onboarding wizard (domain verification via DNS TXT, Stripe Connect, origin method, CDN templates), pricing config, analytics, bot management.
- **Payments**: All payments go to Tollgate wallet. Publishers receive USD payouts via Stripe Connect when balance exceeds $10.
- **Origin Methods**: IP Allowlist (A), Secret Header (B), Backend API (C).
