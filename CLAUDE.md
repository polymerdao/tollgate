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

## Database

Cloudflare D1 (SQLite). Schema defined in `packages/shared/src/schema.ts`. Migrations in `packages/shared/migrations/`.

## Auth

Google OAuth via obul-accounts backend. Dashboard calls `/auth/session` to check session. Dev bypass: set `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` in `.env.local`.

## Design

Matches obul-dashboard theme (Space Grotesk font, HSL color system, glass morphism). Reference: `/Users/inkvi/dev/obul-dashboard`.

## Key Concepts

- **Gateway Worker**: Returns HTTP 402 with x402 payment terms. After on-chain payment verification, fetches and returns origin content (single-use).
- **Publisher Dashboard**: Onboarding wizard (domain verification via DNS TXT, Stripe Connect, origin method, CDN templates), pricing config, analytics, bot management.
- **Payments**: All payments go to Tollgate wallet. Publishers receive USD payouts via Stripe Connect when balance exceeds $10.
- **Origin Methods**: IP Allowlist (A), Secret Header (B), Backend API (C).
