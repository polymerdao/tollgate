#!/bin/bash
# Setup local development environment for Tollgate
# Run from repo root: ./scripts/setup-local.sh

set -e

echo "==> Applying D1 migration..."
cd apps/gateway
npx wrangler d1 execute tollgate --file=../../packages/shared/migrations/0000_initial.sql --local
echo ""

echo "==> Seeding test data..."
npx wrangler d1 execute tollgate --file=../../packages/shared/migrations/seed-local.sql --local
cd ../..
echo ""

echo "==> Done! Start dev servers with:"
echo "    pnpm dev:gateway     # Gateway at localhost:8787"
echo "    pnpm dev:dashboard   # Dashboard at localhost:3000"
