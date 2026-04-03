# Tollgate

x402 bot payment gateway. Publishers charge AI bots for content access via on-chain micropayments (USDC on Base).

## Architecture

Monorepo powered by Turborepo + pnpm.

| Package | Description |
|---------|-------------|
| `apps/gateway` | Hono API on Cloudflare Workers — returns HTTP 402 with x402 payment terms, verifies on-chain payments, proxies origin content |
| `apps/dashboard` | Next.js on Cloudflare Workers (via OpenNextJS) — publisher onboarding, pricing config, analytics, bot management |
| `packages/shared` | D1 schema (Drizzle), shared types, Zod validators |
| `packages/x402` | x402 payment verification via viem |

## Deployed Services

### Mainnet (Base)

| Service | URL |
|---------|-----|
| Gateway | https://tollgate-gateway.operations-4bf.workers.dev |
| Dashboard | https://tollgate-dashboard.operations-4bf.workers.dev |

### Testnet (Base Sepolia)

| Service | URL |
|---------|-----|
| Gateway | https://tollgate-gateway-testnet.operations-4bf.workers.dev |
| Dashboard | https://tollgate-dashboard-testnet.operations-4bf.workers.dev |

## Development

```bash
pnpm install           # Install dependencies
pnpm dev:gateway       # Start gateway locally (port 8787)
pnpm dev:dashboard     # Start dashboard locally (port 3000)
pnpm build             # Build all packages
pnpm typecheck         # Type-check all packages
```

## Deployment

```bash
# Gateway
cd apps/gateway
npx wrangler deploy                # Deploy mainnet
npx wrangler deploy --env testnet  # Deploy testnet

# Dashboard (requires build first)
cd apps/dashboard
npx opennextjs-cloudflare build && npx wrangler deploy                # Deploy mainnet
npx opennextjs-cloudflare build && npx wrangler deploy --env testnet  # Deploy testnet
```

## Database

Cloudflare D1 (SQLite). Local setup:

```bash
bash scripts/setup-local.sh
```

Remote migrations:

```bash
# Mainnet
npx wrangler d1 execute tollgate --file=../../packages/shared/migrations/0000_initial.sql --remote

# Testnet
npx wrangler d1 execute tollgate-testnet --file=../../packages/shared/migrations/0000_initial.sql --remote
```
