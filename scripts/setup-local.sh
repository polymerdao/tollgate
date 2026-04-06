#!/bin/bash
# Setup local development environment for Tollgate
# Run from repo root: ./scripts/setup-local.sh

set -e

MIGRATION="../../packages/shared/migrations/0000_initial.sql"
MIGRATION_PATH_PRICING="../../packages/shared/migrations/0002_add_path_pricing.sql"
SEED="../../packages/shared/migrations/seed-local.sql"

echo "==> Applying D1 migration (gateway)..."
cd apps/gateway
npx wrangler d1 execute tollgate --file=$MIGRATION --local
npx wrangler d1 execute tollgate --file=$MIGRATION_PATH_PRICING --local
cd ../..

echo ""
echo "==> Applying D1 migration (dashboard)..."
cd apps/dashboard
npx wrangler d1 execute tollgate --file=$MIGRATION --local
npx wrangler d1 execute tollgate --file=$MIGRATION_PATH_PRICING --local
cd ../..

echo ""
echo "==> Seeding test data (gateway)..."
cd apps/gateway
npx wrangler d1 execute tollgate --file=$SEED --local
cd ../..

echo ""
echo "==> Seeding test data (dashboard)..."
cd apps/dashboard
npx wrangler d1 execute tollgate --file=$SEED --local
cd ../..

echo ""
echo "==> Done! Start dev servers with:"
echo "    pnpm dev:gateway     # Gateway at localhost:8787"
echo "    pnpm dev:dashboard   # Dashboard at localhost:3000"
