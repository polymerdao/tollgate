# Tollgate MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Tollgate x402 bot payment gateway MVP — a gateway worker that charges bots for content access, and a publisher dashboard for configuration and analytics.

**Architecture:** Two Cloudflare Workers (gateway on Hono, dashboard on Next.js/OpenNextJS) sharing a D1 database and KV namespace. Shared packages for schema and x402 protocol logic. Auth delegates to existing obul-accounts backend (Google OAuth).

**Tech Stack:** Turborepo + pnpm, Hono, Next.js 16, Cloudflare D1/KV, Drizzle ORM, viem, Radix UI, Tailwind CSS, TanStack Query, Recharts, Stripe Connect, Zod.

**Spec:** `docs/superpowers/specs/2026-04-03-tollgate-mvp-design.md`

**Reference project:** `/Users/inkvi/dev/obul-dashboard` — match its design system, auth patterns, and component structure.

---

## File Structure

```
tollgate/
├── package.json                          # Root: pnpm workspace + turborepo scripts
├── pnpm-workspace.yaml                   # Workspace config
├── turbo.json                            # Turborepo pipeline
├── .gitignore
├── .npmrc
├── packages/
│   ├── shared/
│   │   ├── package.json                  # @tollgate/shared
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                  # Public exports
│   │   │   ├── schema.ts                 # Drizzle D1 schema (all tables)
│   │   │   ├── types.ts                  # Shared TypeScript types
│   │   │   ├── validators.ts             # Zod validators for API input
│   │   │   └── constants.ts              # Shared constants (USDC decimals, chain IDs, etc.)
│   │   └── migrations/
│   │       └── 0000_initial.sql          # D1 migration
│   ├── x402/
│   │   ├── package.json                  # @tollgate/x402
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Public exports
│   │       ├── verify.ts                 # On-chain payment verification via viem
│   │       ├── types.ts                  # x402 protocol types (402 response, payment proof)
│   │       └── usdc.ts                   # USDC contract ABI + addresses per chain
├── apps/
│   ├── gateway/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── wrangler.toml                 # D1 + KV bindings
│   │   └── src/
│   │       ├── index.ts                  # Hono app entry point
│   │       ├── env.ts                    # Cloudflare bindings type
│   │       ├── routes/
│   │       │   ├── health.ts             # GET /health
│   │       │   └── payment.ts            # Main request handler (402 + proof)
│   │       ├── services/
│   │       │   ├── origin.ts             # Origin content fetching (Methods A, B, C)
│   │       │   └── site-config.ts        # Site config lookup (KV cache → D1)
│   │       └── middleware/
│   │           ├── rate-limit.ts         # KV-based rate limiting
│   │           └── bot-rules.ts          # Allowlist + path exclusion checks
│   └── dashboard/
│       ├── package.json
│       ├── tsconfig.json
│       ├── wrangler.toml                 # D1 binding + Cron Trigger
│       ├── next.config.ts
│       ├── open-next.config.ts
│       ├── tailwind.config.ts            # Matching obul-dashboard theme
│       ├── postcss.config.mjs
│       ├── .env.local.example
│       ├── app/
│       │   ├── layout.tsx                # Root layout (fonts, providers, grain overlay)
│       │   ├── providers.tsx             # QueryClient + Theme + Tooltip + Toaster
│       │   ├── globals.css               # Obul theme (HSL vars, custom classes)
│       │   ├── (public)/
│       │   │   ├── layout.tsx            # Public layout
│       │   │   ├── page.tsx              # Landing page
│       │   │   ├── login/
│       │   │   │   └── page.tsx          # Google OAuth login
│       │   │   └── auth/
│       │   │       └── callback/
│       │   │           └── page.tsx       # OAuth callback
│       │   └── (authed)/
│       │       └── dashboard/
│       │           ├── layout.tsx         # SessionGate + DashboardShell
│       │           ├── page.tsx           # Overview (revenue summary)
│       │           └── sites/
│       │               ├── page.tsx       # Site list
│       │               ├── new/
│       │               │   └── page.tsx   # Onboarding wizard
│       │               └── [id]/
│       │                   ├── page.tsx   # Site detail (redirect to pricing)
│       │                   ├── layout.tsx # Site tabs layout
│       │                   ├── pricing/
│       │                   │   └── page.tsx
│       │                   ├── bots/
│       │                   │   └── page.tsx
│       │                   ├── payouts/
│       │                   │   └── page.tsx
│       │                   ├── analytics/
│       │                   │   └── page.tsx
│       │                   └── settings/
│       │                       └── page.tsx
│       ├── api/
│       │   └── v1/
│       │       └── sites/
│       │           ├── route.ts           # GET (list) + POST (create)
│       │           └── [id]/
│       │               ├── route.ts       # GET + DELETE
│       │               ├── verify/
│       │               │   └── route.ts   # POST verify domain
│       │               ├── pricing/
│       │               │   └── route.ts   # PUT
│       │               ├── origin/
│       │               │   └── route.ts   # PUT
│       │               ├── analytics/
│       │               │   └── route.ts   # GET
│       │               ├── secrets/
│       │               │   └── rotate/
│       │               │       └── route.ts # POST
│       │               ├── allowlist/
│       │               │   └── route.ts   # PUT
│       │               ├── exclusions/
│       │               │   └── route.ts   # PUT
│       │               ├── stripe/
│       │               │   └── connect/
│       │               │       └── route.ts # POST
│       │               └── payouts/
│       │                   └── route.ts   # GET
│       ├── components/
│       │   ├── ui/                        # Radix-based primitives (copy from obul-dashboard)
│       │   │   ├── button.tsx
│       │   │   ├── button-variants.ts
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── input.tsx
│       │   │   ├── select.tsx
│       │   │   ├── tabs.tsx
│       │   │   ├── tooltip.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── skeleton.tsx
│       │   │   ├── table.tsx
│       │   │   ├── toaster.tsx
│       │   │   └── use-toast.ts
│       │   ├── dashboard/
│       │   │   ├── shell.tsx              # Sidebar + topbar + main area
│       │   │   ├── sidebar.tsx            # Navigation sidebar
│       │   │   ├── topbar.tsx             # Top bar with title
│       │   │   ├── metric-card.tsx        # KPI display card
│       │   │   └── empty-state.tsx        # Empty state placeholder
│       │   ├── session-gate.tsx           # Auth guard
│       │   ├── sign-in-button.tsx         # Google sign-in button
│       │   └── sign-out-button.tsx        # Sign-out button
│       └── lib/
│           ├── auth-client.ts             # useSession, startGoogleLogin, signOut
│           ├── auth-flow.ts               # URL builders, callback logic
│           ├── env.ts                     # Environment variable getters
│           ├── types.ts                   # Dashboard TypeScript types
│           ├── utils.ts                   # cn() helper
│           ├── format.ts                  # formatUSDC, formatDate helpers
│           ├── constants.ts               # QUERY_STALE_TIME, etc.
│           ├── theme.tsx                  # Theme context (light/dark)
│           ├── api.ts                     # API client functions
│           └── hooks/
│               ├── use-sites.ts           # Site list query
│               ├── use-site.ts            # Single site query
│               ├── use-analytics.ts       # Analytics query
│               └── use-payouts.ts         # Payouts query
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.npmrc`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/inkvi/dev/tollgate
git init
```

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "tollgate",
  "private": true,
  "type": "module",
  "scripts": {
    "dev:gateway": "turbo run dev --filter=@tollgate/gateway",
    "dev:dashboard": "turbo run dev --filter=@tollgate/dashboard",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.6.3"
  },
  "packageManager": "pnpm@10.11.0"
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 4: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", ".open-next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.next/
.open-next/
dist/
.turbo/
.wrangler/
.env.local
.dev.vars
*.tsbuildinfo
```

- [ ] **Step 6: Create .npmrc**

```
auto-install-peers=true
```

- [ ] **Step 7: Install dependencies**

```bash
pnpm install
```

- [ ] **Step 8: Provision Cloudflare D1 and KV**

```bash
npx wrangler d1 create tollgate
npx wrangler kv namespace create TOLLGATE_KV
```

Note the IDs returned. Update both `apps/gateway/wrangler.toml` and `apps/dashboard/wrangler.toml` with the actual D1 `database_id` and KV `id` values when those files are created later.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .gitignore .npmrc
git commit -m "chore: scaffold turborepo monorepo"
```

---

## Task 2: Shared Package — Schema & Types

**Files:**
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `packages/shared/src/schema.ts`, `packages/shared/src/types.ts`, `packages/shared/src/validators.ts`, `packages/shared/src/constants.ts`, `packages/shared/migrations/0000_initial.sql`

- [ ] **Step 1: Create packages/shared/package.json**

```json
{
  "name": "@tollgate/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.44.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Create packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create packages/shared/src/constants.ts**

```typescript
export const USDC_DECIMALS = 6;
export const USDC_MINOR_UNIT = 10 ** USDC_DECIMALS; // 1_000_000
export const BASE_CHAIN_ID = 8453;
export const PAYMENT_ID_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const SITE_CACHE_TTL_S = 60;
export const RATE_LIMIT_WINDOW_S = 60;
export const RATE_LIMIT_MAX_REQUESTS = 60;
export const PAYOUT_THRESHOLD_MINOR = 10 * USDC_MINOR_UNIT; // $10
export const SECRET_ROTATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
```

- [ ] **Step 4: Create packages/shared/src/schema.ts**

Drizzle schema for all D1 tables. Reference: spec section 3.

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  domain: text("domain").notNull().unique(),
  status: text("status", { enum: ["active", "paused", "suspended"] }).notNull().default("active"),
  verificationToken: text("verification_token").notNull(),
  verifiedAt: text("verified_at"),
  stripeAccountId: text("stripe_account_id"),
  defaultPrice: integer("default_price").notNull(),
  originMethod: text("origin_method", {
    enum: ["ip_allowlist", "secret_header", "backend_api"],
  }).notNull(),
  originUrl: text("origin_url"),
  originSecret: text("origin_secret"),
  originSecretPrev: text("origin_secret_prev"),
  originSecretPrevExpiresAt: text("origin_secret_prev_expires_at"),
  network: text("network").notNull().default("base"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const botAllowlist = sqliteTable("bot_allowlist", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  userAgentPattern: text("user_agent_pattern").notNull(),
});

export const pathExclusions = sqliteTable("path_exclusions", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  pattern: text("pattern").notNull(),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  paymentId: text("payment_id").notNull().unique(),
  txHash: text("tx_hash").unique(),
  payerAddress: text("payer_address"),
  amount: integer("amount").notNull(),
  path: text("path").notNull(),
  status: text("status", {
    enum: ["pending", "verified", "expired", "failed"],
  }).notNull().default("pending"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull(),
  verifiedAt: text("verified_at"),
});

export const balances = sqliteTable("balances", {
  siteId: text("site_id").primaryKey().references(() => sites.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  amount: integer("amount").notNull(),
  stripePayoutId: text("stripe_payout_id").notNull(),
  status: text("status", {
    enum: ["pending", "completed", "failed"],
  }).notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});
```

- [ ] **Step 5: Create packages/shared/src/types.ts**

```typescript
import type { InferSelectModel } from "drizzle-orm";
import type { sites, botAllowlist, pathExclusions, payments, balances, payouts } from "./schema";

export type Site = InferSelectModel<typeof sites>;
export type BotAllowlistEntry = InferSelectModel<typeof botAllowlist>;
export type PathExclusion = InferSelectModel<typeof pathExclusions>;
export type Payment = InferSelectModel<typeof payments>;
export type Balance = InferSelectModel<typeof balances>;
export type Payout = InferSelectModel<typeof payouts>;

export type SiteStatus = "active" | "paused" | "suspended";
export type OriginMethod = "ip_allowlist" | "secret_header" | "backend_api";
export type PaymentStatus = "pending" | "verified" | "expired" | "failed";
export type PayoutStatus = "pending" | "completed" | "failed";
```

- [ ] **Step 6: Create packages/shared/src/validators.ts**

Zod validators for API input. The gateway and dashboard both use these.

```typescript
import { z } from "zod";

const safeRegex = (val: string) => {
  try {
    new RegExp(val);
    // Reject patterns that could cause ReDoS
    if (/(\.\*){3,}/.test(val) || /(\([^)]*\+\)){2,}/.test(val)) return false;
    return true;
  } catch {
    return false;
  }
};

export const createSiteSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i, "Invalid domain"),
});

export const updatePricingSchema = z.object({
  defaultPrice: z.number().int().min(1, "Price must be at least 1 minor unit"),
});

export const updateOriginSchema = z.object({
  originMethod: z.enum(["ip_allowlist", "secret_header", "backend_api"]),
  originUrl: z.string().url().optional(),
  originSecret: z.string().min(16).max(256).optional(),
});

export const updateAllowlistSchema = z.object({
  entries: z.array(
    z.object({
      userAgentPattern: z.string().min(1).max(256).refine(safeRegex, "Invalid or unsafe regex"),
    })
  ),
});

export const updateExclusionsSchema = z.object({
  entries: z.array(
    z.object({
      pattern: z.string().min(1).max(256).refine(safeRegex, "Invalid or unsafe regex"),
    })
  ),
});
```

- [ ] **Step 7: Create packages/shared/src/index.ts**

```typescript
export * from "./schema";
export * from "./types";
export * from "./validators";
export * from "./constants";
```

- [ ] **Step 8: Create packages/shared/migrations/0000_initial.sql**

```sql
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  verification_token TEXT NOT NULL,
  verified_at TEXT,
  stripe_account_id TEXT,
  default_price INTEGER NOT NULL,
  origin_method TEXT NOT NULL,
  origin_url TEXT,
  origin_secret TEXT,
  origin_secret_prev TEXT,
  origin_secret_prev_expires_at TEXT,
  network TEXT NOT NULL DEFAULT 'base',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE bot_allowlist (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  user_agent_pattern TEXT NOT NULL
);

CREATE TABLE path_exclusions (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  payment_id TEXT NOT NULL UNIQUE,
  tx_hash TEXT UNIQUE,
  payer_address TEXT,
  amount INTEGER NOT NULL,
  path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user_agent TEXT,
  created_at TEXT NOT NULL,
  verified_at TEXT
);

CREATE TABLE balances (
  site_id TEXT PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE payouts (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  amount INTEGER NOT NULL,
  stripe_payout_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);

CREATE INDEX idx_sites_account_id ON sites(account_id);
CREATE INDEX idx_sites_domain ON sites(domain);
CREATE INDEX idx_payments_site_id ON payments(site_id);
CREATE INDEX idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX idx_balances_amount ON balances(amount);
CREATE INDEX idx_bot_allowlist_site_id ON bot_allowlist(site_id);
CREATE INDEX idx_path_exclusions_site_id ON path_exclusions(site_id);
CREATE INDEX idx_payouts_site_id ON payouts(site_id);
```

- [ ] **Step 9: Install shared package dependencies**

```bash
cd /Users/inkvi/dev/tollgate && pnpm install
```

- [ ] **Step 10: Apply D1 migration**

```bash
npx wrangler d1 execute tollgate --file=./packages/shared/migrations/0000_initial.sql
```

For local dev, also apply to the local D1:
```bash
npx wrangler d1 execute tollgate --file=./packages/shared/migrations/0000_initial.sql --local
```

- [ ] **Step 11: Run typecheck**

```bash
pnpm --filter @tollgate/shared typecheck
```
Expected: passes with no errors.

- [ ] **Step 12: Commit**

```bash
git add packages/shared/
git commit -m "feat: add @tollgate/shared — D1 schema, types, validators"
```

---

## Task 3: x402 Package — Payment Verification

**Files:**
- Create: `packages/x402/package.json`, `packages/x402/tsconfig.json`, `packages/x402/src/index.ts`, `packages/x402/src/types.ts`, `packages/x402/src/usdc.ts`, `packages/x402/src/verify.ts`

- [ ] **Step 1: Create packages/x402/package.json**

```json
{
  "name": "@tollgate/x402",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "viem": "^2.31.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Create packages/x402/tsconfig.json**

Same as shared package tsconfig.

- [ ] **Step 3: Create packages/x402/src/types.ts**

```typescript
/** x402 response body returned with HTTP 402 */
export interface X402PaymentRequired {
  price: string;
  currency: "USDC";
  network: "base";
  recipientAddress: string;
  paymentId: string;
  expiresAt: string;
  contentUrl: string;
}

/** Headers submitted by bot after payment */
export interface PaymentProofHeaders {
  "x-payment-proof": string; // tx hash
  "x-payment-id": string;
  "x-payment-chain": string;
}

/** Result of verifying a payment on-chain */
export interface VerificationResult {
  valid: boolean;
  error?: string;
  txHash: string;
  from: string;
  to: string;
  amount: bigint;
}
```

- [ ] **Step 4: Create packages/x402/src/usdc.ts**

```typescript
export const USDC_ADDRESS_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

export const USDC_TRANSFER_EVENT_ABI = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;
```

- [ ] **Step 5: Create packages/x402/src/verify.ts**

```typescript
import { createPublicClient, http, decodeEventLog, type Hex } from "viem";
import { base } from "viem/chains";
import { USDC_ADDRESS_BASE, USDC_TRANSFER_EVENT_ABI } from "./usdc";
import type { VerificationResult } from "./types";

const MIN_CONFIRMATIONS = 1;

export async function verifyPayment(
  txHash: Hex,
  expectedRecipient: string,
  expectedAmountMinor: number,
  rpcUrl?: string
): Promise<VerificationResult> {
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "RPC error";
    return { valid: false, error: `Failed to fetch receipt: ${msg}`, txHash, from: "", to: "", amount: 0n };
  }

  if (receipt.status !== "success") {
    return { valid: false, error: "Transaction failed", txHash, from: "", to: "", amount: 0n };
  }

  // Check confirmations
  const currentBlock = await client.getBlockNumber();
  const confirmations = currentBlock - receipt.blockNumber;
  if (confirmations < MIN_CONFIRMATIONS) {
    return { valid: false, error: "Insufficient confirmations", txHash, from: "", to: "", amount: 0n };
  }

  // Find USDC Transfer event to the expected recipient
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== USDC_ADDRESS_BASE.toLowerCase()) continue;

    try {
      const decoded = decodeEventLog({
        abi: USDC_TRANSFER_EVENT_ABI,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName !== "Transfer") continue;

      const { from, to, value } = decoded.args;

      if (to.toLowerCase() !== expectedRecipient.toLowerCase()) continue;

      if (value < BigInt(expectedAmountMinor)) {
        return { valid: false, error: "Amount too low", txHash, from, to, amount: value };
      }

      return { valid: true, txHash, from, to, amount: value };
    } catch {
      continue;
    }
  }

  return { valid: false, error: "No matching USDC transfer found", txHash, from: "", to: "", amount: 0n };
}
```

- [ ] **Step 6: Create packages/x402/src/index.ts**

```typescript
export { verifyPayment } from "./verify";
export type { X402PaymentRequired, PaymentProofHeaders, VerificationResult } from "./types";
export { USDC_ADDRESS_BASE, USDC_TRANSFER_EVENT_ABI } from "./usdc";
```

- [ ] **Step 7: Install and typecheck**

```bash
cd /Users/inkvi/dev/tollgate && pnpm install && pnpm --filter @tollgate/x402 typecheck
```

- [ ] **Step 8: Commit**

```bash
git add packages/x402/
git commit -m "feat: add @tollgate/x402 — payment verification via viem"
```

---

## Task 4: Gateway Worker — Scaffold & Health

**Files:**
- Create: `apps/gateway/package.json`, `apps/gateway/tsconfig.json`, `apps/gateway/wrangler.toml`, `apps/gateway/src/env.ts`, `apps/gateway/src/index.ts`, `apps/gateway/src/routes/health.ts`

- [ ] **Step 1: Create apps/gateway/package.json**

```json
{
  "name": "@tollgate/gateway",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tollgate/shared": "workspace:*",
    "@tollgate/x402": "workspace:*",
    "drizzle-orm": "^0.44.0",
    "hono": "^4.7.0",
    "ulid": "^2.3.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20250620.0",
    "typescript": "^5.6.3",
    "wrangler": "^4.72.0"
  }
}
```

- [ ] **Step 2: Create apps/gateway/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "types": ["@cloudflare/workers-types"],
    "paths": {
      "@tollgate/shared": ["../../packages/shared/src"],
      "@tollgate/x402": ["../../packages/x402/src"]
    }
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Create apps/gateway/wrangler.toml**

```toml
name = "tollgate-gateway"
main = "src/index.ts"
compatibility_date = "2025-12-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "tollgate"
database_id = "TODO_REPLACE_WITH_ACTUAL_ID"

[[kv_namespaces]]
binding = "KV"
id = "TODO_REPLACE_WITH_ACTUAL_ID"

[vars]
TOLLGATE_WALLET_ADDRESS = "0xTODO_REPLACE"
BASE_RPC_URL = "https://mainnet.base.org"
```

- [ ] **Step 4: Create apps/gateway/src/env.ts**

```typescript
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  TOLLGATE_WALLET_ADDRESS: string;
  BASE_RPC_URL: string;
}
```

- [ ] **Step 5: Create apps/gateway/src/routes/health.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "../env";

const health = new Hono<{ Bindings: Env }>();

health.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export { health };
```

- [ ] **Step 6: Create apps/gateway/src/index.ts**

```typescript
import { Hono } from "hono";
import type { Env } from "./env";
import { health } from "./routes/health";

const app = new Hono<{ Bindings: Env }>();

app.route("/", health);

export default app;
```

- [ ] **Step 7: Install and typecheck**

```bash
cd /Users/inkvi/dev/tollgate && pnpm install && pnpm --filter @tollgate/gateway typecheck
```

- [ ] **Step 8: Commit**

```bash
git add apps/gateway/
git commit -m "feat: scaffold gateway worker with health endpoint"
```

---

## Task 5: Gateway — Site Lookup & Bot Rules

**Files:**
- Create: `apps/gateway/src/services/site-config.ts`, `apps/gateway/src/middleware/bot-rules.ts`, `apps/gateway/src/middleware/rate-limit.ts`

- [ ] **Step 1: Create apps/gateway/src/services/site-config.ts**

KV-cached site config lookup. Falls back to D1 on cache miss.

```typescript
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites, botAllowlist, pathExclusions, SITE_CACHE_TTL_S } from "@tollgate/shared";
import type { Env } from "../env";

export interface SiteConfig {
  id: string;
  domain: string;
  status: string;
  verifiedAt: string | null;
  defaultPrice: number;
  originMethod: string;
  originUrl: string | null;
  originSecret: string | null;
  originSecretPrev: string | null;
  originSecretPrevExpiresAt: string | null;
  network: string;
  allowlistPatterns: string[];
  exclusionPatterns: string[];
}

export async function getSiteConfig(
  domain: string,
  env: Env
): Promise<SiteConfig | null> {
  // Try KV cache first
  const cacheKey = `site:${domain}`;
  const cached = await env.KV.get(cacheKey, "json");
  if (cached) return cached as SiteConfig;

  // Fallback to D1
  const db = drizzle(env.DB);
  const site = await db
    .select()
    .from(sites)
    .where(eq(sites.domain, domain))
    .get();

  if (!site) return null;

  const allowlist = await db
    .select()
    .from(botAllowlist)
    .where(eq(botAllowlist.siteId, site.id))
    .all();

  const exclusions = await db
    .select()
    .from(pathExclusions)
    .where(eq(pathExclusions.siteId, site.id))
    .all();

  const config: SiteConfig = {
    id: site.id,
    domain: site.domain,
    status: site.status,
    verifiedAt: site.verifiedAt,
    defaultPrice: site.defaultPrice,
    originMethod: site.originMethod,
    originUrl: site.originUrl,
    originSecret: site.originSecret,
    originSecretPrev: site.originSecretPrev,
    originSecretPrevExpiresAt: site.originSecretPrevExpiresAt,
    network: site.network,
    allowlistPatterns: allowlist.map((a) => a.userAgentPattern),
    exclusionPatterns: exclusions.map((e) => e.pattern),
  };

  // Cache in KV
  await env.KV.put(cacheKey, JSON.stringify(config), {
    expirationTtl: SITE_CACHE_TTL_S,
  });

  return config;
}
```

- [ ] **Step 2: Create apps/gateway/src/middleware/bot-rules.ts**

```typescript
import type { SiteConfig } from "../services/site-config";

export function isPathExcluded(path: string, config: SiteConfig): boolean {
  return config.exclusionPatterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(path);
    } catch {
      return false;
    }
  });
}

export function isBotAllowlisted(
  userAgent: string | undefined,
  config: SiteConfig
): boolean {
  if (!userAgent || config.allowlistPatterns.length === 0) return false;
  return config.allowlistPatterns.some((pattern) => {
    try {
      return new RegExp(pattern, "i").test(userAgent);
    } catch {
      return false;
    }
  });
}
```

- [ ] **Step 3: Create apps/gateway/src/middleware/rate-limit.ts**

```typescript
import { RATE_LIMIT_WINDOW_S, RATE_LIMIT_MAX_REQUESTS } from "@tollgate/shared";
import type { Env } from "../env";

export async function isRateLimited(
  ip: string,
  domain: string,
  env: Env
): Promise<boolean> {
  const key = `ratelimit:${ip}:${domain}`;
  const current = await env.KV.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= RATE_LIMIT_MAX_REQUESTS) return true;

  await env.KV.put(key, String(count + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_S,
  });

  return false;
}
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm --filter @tollgate/gateway typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/gateway/src/services/ apps/gateway/src/middleware/
git commit -m "feat: gateway site lookup, bot rules, rate limiting"
```

---

## Task 6: Gateway — 402 Response & Payment Proof Flow

**Files:**
- Create: `apps/gateway/src/services/origin.ts`, `apps/gateway/src/routes/payment.ts`
- Modify: `apps/gateway/src/index.ts`

- [ ] **Step 1: Create apps/gateway/src/services/origin.ts**

```typescript
import type { SiteConfig } from "./site-config";

export async function fetchOriginContent(
  path: string,
  config: SiteConfig
): Promise<Response> {
  const url = buildOriginUrl(path, config);

  const headers: Record<string, string> = {};

  if (config.originMethod === "secret_header" && config.originSecret) {
    headers["X-Obul-Secret"] = config.originSecret;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    // Try previous secret during rotation window
    if (
      config.originMethod === "secret_header" &&
      config.originSecretPrev &&
      config.originSecretPrevExpiresAt &&
      new Date(config.originSecretPrevExpiresAt) > new Date()
    ) {
      const retryHeaders: Record<string, string> = {
        "X-Obul-Secret": config.originSecretPrev,
      };
      const retry = await fetch(url, { headers: retryHeaders });
      if (retry.ok) return retry;
    }

    throw new Error(`Origin returned ${response.status}`);
  }

  return response;
}

function buildOriginUrl(path: string, config: SiteConfig): string {
  if (config.originMethod === "backend_api" && config.originUrl) {
    // Method C: use the configured backend URL
    const base = config.originUrl.replace(/\/$/, "");
    return `${base}${path}`;
  }

  // Method A (IP Allowlist) and B (Secret Header): fetch from the publisher's public domain
  // NOTE: Method A requires static egress IPs. Cloudflare Workers egress from random IPs.
  // For MVP, Method A will work only if the publisher's WAF does not enforce IP allowlisting
  // (i.e., the request happens to come from an allowed IP). Full Method A support requires
  // Cloudflare WARP or a fixed-IP proxy — to be resolved in a follow-up task.
  return `https://${config.domain}${path}`;
}
```

- [ ] **Step 2: Create apps/gateway/src/routes/payment.ts**

This is the main request handler. Implements the full flow from the spec section 4.2.

```typescript
import { Hono } from "hono";
import { ulid } from "ulid";
import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { payments, balances, PAYMENT_ID_TTL_MS } from "@tollgate/shared";
import { verifyPayment } from "@tollgate/x402";
import type { Env } from "../env";
import { getSiteConfig } from "../services/site-config";
import { isPathExcluded, isBotAllowlisted } from "../middleware/bot-rules";
import { isRateLimited } from "../middleware/rate-limit";
import { fetchOriginContent } from "../services/origin";
import type { Hex } from "viem";

const payment = new Hono<{ Bindings: Env }>();

payment.all("/*", async (c) => {
  const host = c.req.header("host") ?? "";
  // Extract the publisher domain: pay.example.com → example.com
  const domain = host.replace(/^pay\./, "");
  const path = new URL(c.req.url).pathname;
  const userAgent = c.req.header("user-agent");
  const clientIp = c.req.header("cf-connecting-ip") ?? "unknown";

  // 1. Lookup site config
  const config = await getSiteConfig(domain, c.env);
  if (!config || !config.verifiedAt) {
    return c.json({ error: "Site not found" }, 404);
  }
  if (config.status !== "active") {
    return c.json({ error: "Site not active" }, 403);
  }

  // 2. Check path exclusions
  if (isPathExcluded(path, config)) {
    return c.json({ error: "Path excluded" }, 403);
  }

  // 3. Check bot allowlist — serve free if matched
  if (isBotAllowlisted(userAgent, config)) {
    try {
      const origin = await fetchOriginContent(path, config);
      return new Response(origin.body, {
        status: origin.status,
        headers: origin.headers,
      });
    } catch {
      return c.json({ error: "Origin fetch failed" }, 502);
    }
  }

  // 4. Rate limit
  if (await isRateLimited(clientIp, domain, c.env)) {
    return c.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  // 5. Check for payment proof
  const txHash = c.req.header("x-payment-proof");
  const paymentIdHeader = c.req.header("x-payment-id");
  const chainHeader = c.req.header("x-payment-chain");

  if (!txHash || !paymentIdHeader) {
    // No payment — return 402
    const paymentId = ulid();
    const expiresAt = new Date(Date.now() + PAYMENT_ID_TTL_MS).toISOString();

    // Store payment ID in KV
    await c.env.KV.put(
      `payment:${paymentId}`,
      JSON.stringify({
        siteId: config.id,
        price: config.defaultPrice,
        path,
      }),
      { expirationTtl: PAYMENT_ID_TTL_MS / 1000 }
    );

    return c.json(
      {
        price: (config.defaultPrice / 1_000_000).toString(),
        currency: "USDC",
        network: config.network,
        recipientAddress: c.env.TOLLGATE_WALLET_ADDRESS,
        paymentId,
        expiresAt,
        contentUrl: `https://${host}${path}`,
      },
      402
    );
  }

  // 6. Validate payment proof
  // Lookup payment ID in KV
  const kvKey = `payment:${paymentIdHeader}`;
  const paymentData = await c.env.KV.get(kvKey, "json") as {
    siteId: string;
    price: number;
    path: string;
  } | null;

  if (!paymentData) {
    return c.json({ error: "Payment ID expired or invalid" }, 408);
  }

  // Verify payment was issued for this site and path
  if (paymentData.siteId !== config.id || paymentData.path !== path) {
    return c.json({ error: "Payment ID does not match this request" }, 400);
  }

  // Validate chain header
  if (chainHeader && chainHeader !== "base") {
    return c.json({ error: "Unsupported chain" }, 400);
  }

  // Consume payment ID (single-use)
  await c.env.KV.delete(kvKey);

  // Check tx_hash uniqueness in D1
  const db = drizzle(c.env.DB);
  const existingPayment = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.txHash, txHash))
    .get();

  if (existingPayment) {
    return c.json({ error: "Transaction already used" }, 400);
  }

  // Verify on-chain
  const verification = await verifyPayment(
    txHash as Hex,
    c.env.TOLLGATE_WALLET_ADDRESS,
    paymentData.price,
    c.env.BASE_RPC_URL
  );

  const now = new Date().toISOString();
  const recordId = ulid();

  if (!verification.valid) {
    // Record failed payment
    await db.insert(payments).values({
      id: recordId,
      siteId: paymentData.siteId,
      paymentId: paymentIdHeader,
      txHash,
      payerAddress: verification.from || null,
      amount: paymentData.price,
      path: paymentData.path,
      status: "failed",
      userAgent: userAgent ?? null,
      createdAt: now,
    });

    return c.json({ error: verification.error ?? "Payment verification failed" }, 400);
  }

  // 7. Record verified payment + increment balance
  await db.batch([
    db.insert(payments).values({
      id: recordId,
      siteId: paymentData.siteId,
      paymentId: paymentIdHeader,
      txHash,
      payerAddress: verification.from,
      amount: paymentData.price,
      path: paymentData.path,
      status: "verified",
      userAgent: userAgent ?? null,
      createdAt: now,
      verifiedAt: now,
    }),
    db
      .insert(balances)
      .values({
        siteId: paymentData.siteId,
        amount: paymentData.price,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: balances.siteId,
        set: {
          amount: sql`${balances.amount} + ${paymentData.price}`,
          updatedAt: now,
        },
      }),
  ]);

  // 8. Fetch and return origin content
  try {
    const origin = await fetchOriginContent(paymentData.path, config);
    const headers = new Headers(origin.headers);
    headers.set("Cache-Control", "no-store, private");
    return new Response(origin.body, {
      status: origin.status,
      headers,
    });
  } catch {
    return c.json({ error: "Origin fetch failed" }, 502);
  }
});

export { payment };
```

- [ ] **Step 3: Update apps/gateway/src/index.ts to mount payment route**

```typescript
import { Hono } from "hono";
import type { Env } from "./env";
import { health } from "./routes/health";
import { payment } from "./routes/payment";

const app = new Hono<{ Bindings: Env }>();

app.route("/", health);
app.route("/", payment);

export default app;
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm --filter @tollgate/gateway typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/gateway/
git commit -m "feat: gateway 402 response, payment verification, origin fetch"
```

---

## Task 7: Dashboard — Scaffold & Theme

**Files:**
- Create: `apps/dashboard/package.json`, `apps/dashboard/tsconfig.json`, `apps/dashboard/wrangler.toml`, `apps/dashboard/next.config.ts`, `apps/dashboard/open-next.config.ts`, `apps/dashboard/tailwind.config.ts`, `apps/dashboard/postcss.config.mjs`, `apps/dashboard/.env.local.example`, `apps/dashboard/app/globals.css`, `apps/dashboard/app/layout.tsx`, `apps/dashboard/app/providers.tsx`, `apps/dashboard/lib/utils.ts`, `apps/dashboard/lib/theme.tsx`, `apps/dashboard/lib/constants.ts`

- [ ] **Step 1: Create apps/dashboard/package.json**

Match obul-dashboard dependency versions exactly.

```json
{
  "name": "@tollgate/dashboard",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:worker": "opennextjs-cloudflare build",
    "start": "wrangler dev",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tollgate/shared": "workspace:*",
    "@radix-ui/react-alert-dialog": "^1.1.5",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.5",
    "@radix-ui/react-select": "^2.1.5",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@stripe/react-stripe-js": "^3.1.1",
    "@stripe/stripe-js": "^3.4.0",
    "@tanstack/react-query": "^5.59.20",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.44.0",
    "lucide-react": "^0.468.0",
    "next": "^16.1.6",
    "posthog-js": "^1.357.2",
    "stripe": "^17.7.0",
    "ulid": "^2.3.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@opennextjs/cloudflare": "^1.17.3",
    "@types/node": "^20.14.12",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "wrangler": "^4.72.0"
  }
}
```

- [ ] **Step 2: Create config files**

Create `tsconfig.json`, `next.config.ts`, `open-next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.env.local.example` — all matching obul-dashboard patterns.

Key files:

**apps/dashboard/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@tollgate/shared": ["../../packages/shared/src"]
    },
    "plugins": [{ "name": "next" }]
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "functions"]
}
```

**apps/dashboard/next.config.ts:**
```typescript
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  typedRoutes: false,
  allowedDevOrigins: ["127.0.0.1"],
};

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

export default nextConfig;
```

**apps/dashboard/open-next.config.ts:**
```typescript
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {};
export default config;
```

**apps/dashboard/tailwind.config.ts** — copy from obul-dashboard exactly (same HSL color system, fonts, animations).

**apps/dashboard/postcss.config.mjs:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**apps/dashboard/.env.local.example:**
```
NEXT_PUBLIC_API_BASE_URL=https://api.obul.ai
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_DEV_BYPASS_AUTH=true
NEXT_PUBLIC_AUTH_PROVIDERS=google
NEXT_PUBLIC_POSTHOG_KEY=
```

- [ ] **Step 3: Create apps/dashboard/app/globals.css**

Copy from `/Users/inkvi/dev/obul-dashboard/app/globals.css` — the full theme including HSL color variables (light/dark), custom classes (glass, glow-orange, card-bracket, sidebar-glass, etc.).

- [ ] **Step 4: Create apps/dashboard/lib/utils.ts**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Create apps/dashboard/lib/constants.ts**

```typescript
export const QUERY_STALE_TIME = 30_000; // 30 seconds
```

- [ ] **Step 6: Create apps/dashboard/lib/theme.tsx**

Copy theme provider pattern from obul-dashboard — dark/light toggle with localStorage persistence.

- [ ] **Step 7: Create apps/dashboard/app/providers.tsx**

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { QUERY_STALE_TIME } from "@/lib/constants";
import { ThemeProvider } from "@/lib/theme";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: QUERY_STALE_TIME,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 8: Create apps/dashboard/app/layout.tsx**

Match obul-dashboard: Space Grotesk + JetBrains Mono fonts, grain overlay, theme flash prevention script.

```typescript
import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tollgate — x402 Bot Payment Gateway",
  description: "Charge AI bots for content access using the x402 payment protocol.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){localStorage.setItem('theme','light');t='light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <div className="grain-overlay" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 9: Create apps/dashboard/wrangler.toml**

```toml
name = "tollgate-dashboard"
main = ".open-next/worker.js"
compatibility_date = "2025-12-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "tollgate"
database_id = "TODO_REPLACE_WITH_ACTUAL_ID"

[triggers]
crons = ["0 6 * * *"]
```

- [ ] **Step 10: Install and verify**

```bash
cd /Users/inkvi/dev/tollgate && pnpm install
```

- [ ] **Step 11: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: scaffold dashboard with obul theme, providers, root layout"
```

---

## Task 8: Dashboard — Auth & UI Components

**Files:**
- Create: `apps/dashboard/lib/auth-client.ts`, `apps/dashboard/lib/auth-flow.ts`, `apps/dashboard/lib/env.ts`, `apps/dashboard/lib/types.ts`, `apps/dashboard/components/session-gate.tsx`, `apps/dashboard/components/sign-in-button.tsx`, `apps/dashboard/components/sign-out-button.tsx`, `apps/dashboard/components/ui/*` (button, card, input, tabs, table, dialog, select, badge, skeleton, tooltip, toaster, use-toast), `apps/dashboard/components/dashboard/shell.tsx`, `apps/dashboard/components/dashboard/sidebar.tsx`, `apps/dashboard/components/dashboard/topbar.tsx`, `apps/dashboard/components/dashboard/metric-card.tsx`, `apps/dashboard/components/dashboard/empty-state.tsx`

- [ ] **Step 1: Create auth files**

Adapt from obul-dashboard auth-client.ts and auth-flow.ts. Key changes:
- Replace `PRIMARY_DASHBOARD_ORIGIN = "https://my.obul.ai"` with `"https://tollgate.obul.ai"`
- Remove GitHub login (tollgate only uses Google)
- Keep `DEV_BYPASS_AUTH` pattern
- Keep `useSession()` hook pattern

**apps/dashboard/lib/env.ts:**
```typescript
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  return url;
}

export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
}

export function getPostLoginOrigin(): string {
  return process.env.NEXT_PUBLIC_POST_LOGIN_ORIGIN ?? "";
}
```

**apps/dashboard/lib/types.ts:**
```typescript
export interface User {
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface SessionData {
  user: User;
  raw: Record<string, unknown> | null;
}

export interface SessionState {
  data: SessionData | null;
  isPending: boolean;
  error: Error | null;
}

export function getUserFromSession(state: SessionState): User | null {
  return state.data?.user ?? null;
}
```

- [ ] **Step 2: Create UI components**

Copy from obul-dashboard `/components/ui/` — all Radix-based primitives. These are the foundation for the entire dashboard:
- `button.tsx` + `button-variants.ts`
- `card.tsx`
- `input.tsx`
- `dialog.tsx`
- `select.tsx`
- `tabs.tsx`
- `tooltip.tsx`
- `badge.tsx`
- `skeleton.tsx`
- `table.tsx`
- `toaster.tsx` + `use-toast.ts`

- [ ] **Step 3: Create dashboard shell components**

Adapt from obul-dashboard. Key changes to sidebar:
- Navigation items: Overview, Sites (not API Keys, Billing, etc.)
- Replace "Obul" branding with "Tollgate"

**apps/dashboard/components/dashboard/sidebar.tsx** — nav items:
```typescript
const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sites", label: "Sites", icon: Globe },
];
```

**apps/dashboard/components/dashboard/shell.tsx** — same DashboardShell pattern with sidebar + topbar + atmospheric overlays.

**apps/dashboard/components/dashboard/topbar.tsx** — title bar with mobile nav toggle.

**apps/dashboard/components/dashboard/metric-card.tsx** — KPI display card.

**apps/dashboard/components/dashboard/empty-state.tsx** — placeholder for empty lists.

- [ ] **Step 4: Create session-gate.tsx**

Copy from obul-dashboard — redirects to `/login` if unauthenticated, shows skeleton while loading.

- [ ] **Step 5: Create sign-in-button.tsx and sign-out-button.tsx**

Simple button components that call `startGoogleLogin()` and `signOut()`.

- [ ] **Step 6: Create public pages**

**apps/dashboard/app/(public)/layout.tsx** — public layout wrapper.

**apps/dashboard/app/(public)/page.tsx** — landing page (simple for MVP).

**apps/dashboard/app/(public)/login/page.tsx** — Google sign-in page.

**apps/dashboard/app/(public)/auth/callback/page.tsx** — OAuth callback handler.

- [ ] **Step 7: Create dashboard layout**

**apps/dashboard/app/(authed)/dashboard/layout.tsx:**
```typescript
import type { ReactNode } from "react";
import { SessionGate } from "@/components/session-gate";
import { DashboardShell } from "@/components/dashboard/shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <DashboardShell>{children}</DashboardShell>
    </SessionGate>
  );
}
```

- [ ] **Step 8: Create dashboard overview page**

**apps/dashboard/app/(authed)/dashboard/page.tsx** — shows total revenue, total sites, recent payments using metric cards. Data from API via TanStack Query hooks.

- [ ] **Step 9: Run typecheck**

```bash
pnpm --filter @tollgate/dashboard typecheck
```

- [ ] **Step 10: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: dashboard auth, UI components, shell, public pages"
```

---

## Task 9: Dashboard — API Routes & Data Hooks

**Files:**
- Create: `apps/dashboard/lib/api.ts`, `apps/dashboard/lib/format.ts`, `apps/dashboard/lib/hooks/use-sites.ts`, `apps/dashboard/lib/hooks/use-site.ts`, `apps/dashboard/lib/hooks/use-analytics.ts`, `apps/dashboard/lib/hooks/use-payouts.ts`, all API route files under `apps/dashboard/app/api/v1/sites/`

- [ ] **Step 1: Create apps/dashboard/lib/format.ts**

```typescript
import { USDC_MINOR_UNIT } from "@tollgate/shared";

export function formatUSDC(minorUnits: number): string {
  return `$${(minorUnits / USDC_MINOR_UNIT).toFixed(2)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
```

- [ ] **Step 2: Create apps/dashboard/lib/api.ts**

API client functions. All calls go to Next.js API routes (same origin), which then query D1.

```typescript
import type { Site, Payment, Payout } from "@tollgate/shared";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `API error: ${res.status}`);
  }
  return res.json();
}

export function getSites() {
  return apiFetch<Site[]>("/api/v1/sites");
}

export function getSite(id: string) {
  return apiFetch<Site>(`/api/v1/sites/${id}`);
}

export function createSite(data: { domain: string }) {
  return apiFetch<Site>("/api/v1/sites", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteSite(id: string) {
  return apiFetch<void>(`/api/v1/sites/${id}`, { method: "DELETE" });
}

export function verifySiteDomain(id: string) {
  return apiFetch<{ verified: boolean; message?: string }>(
    `/api/v1/sites/${id}/verify`,
    { method: "POST" }
  );
}

export function updatePricing(id: string, data: { defaultPrice: number }) {
  return apiFetch<Site>(`/api/v1/sites/${id}/pricing`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateOrigin(
  id: string,
  data: { originMethod: string; originUrl?: string; originSecret?: string }
) {
  return apiFetch<Site>(`/api/v1/sites/${id}/origin`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function rotateSecret(id: string) {
  return apiFetch<{ secret: string }>(`/api/v1/sites/${id}/secrets/rotate`, {
    method: "POST",
  });
}

export function updateAllowlist(
  id: string,
  entries: { userAgentPattern: string }[]
) {
  return apiFetch<void>(`/api/v1/sites/${id}/allowlist`, {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}

export function updateExclusions(id: string, entries: { pattern: string }[]) {
  return apiFetch<void>(`/api/v1/sites/${id}/exclusions`, {
    method: "PUT",
    body: JSON.stringify({ entries }),
  });
}

export interface AnalyticsData {
  totalRevenue: number;
  totalPayments: number;
  successRate: number;
  revenueByDay: { date: string; amount: number }[];
  topPages: { path: string; count: number; revenue: number }[];
  paymentsByBot: { userAgent: string; count: number; revenue: number }[];
}

export function getAnalytics(id: string) {
  return apiFetch<AnalyticsData>(`/api/v1/sites/${id}/analytics`);
}

export function getPayouts(id: string) {
  return apiFetch<Payout[]>(`/api/v1/sites/${id}/payouts`);
}

export function initiateStripeConnect(id: string) {
  return apiFetch<{ url: string }>(`/api/v1/sites/${id}/stripe/connect`, {
    method: "POST",
  });
}
```

- [ ] **Step 3: Create TanStack Query hooks**

**apps/dashboard/lib/hooks/use-sites.ts:**
```typescript
import { useQuery } from "@tanstack/react-query";
import { getSites } from "@/lib/api";

export function useSites() {
  return useQuery({ queryKey: ["sites"], queryFn: getSites });
}
```

Same pattern for `use-site.ts`, `use-analytics.ts`, `use-payouts.ts`.

- [ ] **Step 4: Create auth middleware for API routes**

**apps/dashboard/lib/auth-middleware.ts** — extracts account_id from obul-accounts session cookie. All API routes use this.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/env";

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
const DEV_ACCOUNT_ID = "dev-account-001";

export async function getAccountId(request: NextRequest): Promise<string | null> {
  if (DEV_BYPASS_AUTH) return DEV_ACCOUNT_ID;

  const baseUrl = getApiBaseUrl();
  const cookie = request.headers.get("cookie") ?? "";

  const res = await fetch(`${baseUrl}/auth/session`, {
    headers: { cookie },
  });

  if (!res.ok) return null;

  const data = await res.json();
  // obul-accounts returns { sub: "account-id", ... } or { user: { ... }, sub: ... }
  return data?.sub ?? data?.user?.sub ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**apps/dashboard/lib/auth-middleware.ts** also includes site ownership check:

```typescript
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";

export async function verifySiteOwnership(
  accountId: string,
  siteId: string,
  db: ReturnType<typeof drizzle>
): Promise<boolean> {
  const site = await db
    .select({ accountId: sites.accountId })
    .from(sites)
    .where(eq(sites.id, siteId))
    .get();
  return site?.accountId === accountId;
}
```

- [ ] **Step 5: Create API route — list/create sites**

**apps/dashboard/app/api/v1/sites/route.ts:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { sites, balances, createSiteSchema } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAccountId, unauthorized } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  const userSites = await db
    .select()
    .from(sites)
    .where(eq(sites.accountId, accountId))
    .all();

  return NextResponse.json(userSites);
}

export async function POST(request: NextRequest) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const body = await request.json();
  const parsed = createSiteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  // Check domain uniqueness
  const existing = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.domain, parsed.data.domain))
    .get();

  if (existing) {
    return NextResponse.json({ error: "Domain already registered" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const id = ulid();
  const verificationToken = `tg_${ulid()}`;

  const site = {
    id,
    accountId,
    domain: parsed.data.domain,
    status: "paused" as const, // Starts paused; activated after domain verification
    verificationToken,
    verifiedAt: null,
    stripeAccountId: null,
    defaultPrice: 10000, // $0.01 default
    originMethod: "secret_header" as const,
    originUrl: null,
    originSecret: null,
    originSecretPrev: null,
    originSecretPrevExpiresAt: null,
    network: "base",
    createdAt: now,
    updatedAt: now,
  };

  await db.batch([
    db.insert(sites).values(site),
    db.insert(balances).values({ siteId: id, amount: 0, updatedAt: now }),
  ]);

  return NextResponse.json(site, { status: 201 });
}
```

- [ ] **Step 5: Create site detail + delete routes**

**apps/dashboard/app/api/v1/sites/[id]/route.ts:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites, balances, botAllowlist, pathExclusions, payments } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAccountId, unauthorized, forbidden, verifySiteOwnership } from "@/lib/auth-middleware";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, params.id, db))) return forbidden();

  const site = await db.select().from(sites).where(eq(sites.id, params.id)).get();
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const balance = await db.select().from(balances).where(eq(balances.siteId, params.id)).get();

  return NextResponse.json({ ...site, balance: balance?.amount ?? 0 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, params.id, db))) return forbidden();

  await db.delete(sites).where(eq(sites.id, params.id));
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 6: Create DNS TXT domain verification route**

**apps/dashboard/app/api/v1/sites/[id]/verify/route.ts:**

Cloudflare Workers cannot use Node's `dns` module. Use DNS-over-HTTPS via Cloudflare's `1.1.1.1` API.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAccountId, unauthorized, forbidden, verifySiteOwnership } from "@/lib/auth-middleware";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, params.id, db))) return forbidden();

  const site = await db.select().from(sites).where(eq(sites.id, params.id)).get();
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (site.verifiedAt) {
    return NextResponse.json({ verified: true, message: "Already verified" });
  }

  // Query DNS TXT records via DNS-over-HTTPS (Cloudflare 1.1.1.1)
  const dnsName = `_tollgate.${site.domain}`;
  const dnsUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dnsName)}&type=TXT`;

  const dnsRes = await fetch(dnsUrl, {
    headers: { Accept: "application/dns-json" },
  });

  if (!dnsRes.ok) {
    return NextResponse.json({ verified: false, message: "DNS lookup failed" }, { status: 502 });
  }

  const dnsData = await dnsRes.json() as {
    Answer?: { type: number; data: string }[];
  };

  const expectedValue = `tollgate-verify=${site.verificationToken}`;
  const found = dnsData.Answer?.some((record) => {
    // TXT records may be quoted
    const value = record.data.replace(/^"|"$/g, "");
    return value === expectedValue;
  });

  if (!found) {
    return NextResponse.json({
      verified: false,
      message: "TXT record not found. DNS propagation can take up to 48 hours.",
    });
  }

  // Mark as verified
  await db
    .update(sites)
    .set({ verifiedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    .where(eq(sites.id, params.id));

  return NextResponse.json({ verified: true, message: "Domain verified" });
}
```

- [ ] **Step 7: Create secret rotation route**

**apps/dashboard/app/api/v1/sites/[id]/secrets/rotate/route.ts:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites, SECRET_ROTATION_TTL_MS } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAccountId, unauthorized, forbidden, verifySiteOwnership } from "@/lib/auth-middleware";

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, params.id, db))) return forbidden();

  const site = await db.select().from(sites).where(eq(sites.id, params.id)).get();
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newSecret = generateSecret();
  const now = new Date();

  await db
    .update(sites)
    .set({
      originSecretPrev: site.originSecret,
      originSecretPrevExpiresAt: new Date(now.getTime() + SECRET_ROTATION_TTL_MS).toISOString(),
      originSecret: newSecret,
      updatedAt: now.toISOString(),
    })
    .where(eq(sites.id, params.id));

  // Invalidate KV cache for this site
  // (Gateway's KV cache will expire within 60s anyway)

  return NextResponse.json({ secret: newSecret });
}
```

- [ ] **Step 8: Create pricing, origin, allowlist, exclusions, analytics, payouts routes**

All follow the same auth + ownership pattern. Key specifics:

**pricing/route.ts:** Validate with `updatePricingSchema`. Update `sites.default_price`.

**status/route.ts** (new, not in file structure — add `apps/dashboard/app/api/v1/sites/[id]/status/route.ts`): PUT to update `sites.status` between "active" and "paused". Validate that site must be verified before activating. Invalidate gateway KV cache by deleting `site:{domain}` key (requires KV binding on dashboard worker, or accept 60s TTL cache lag).

**origin/route.ts:** Validate with `updateOriginSchema`. Update `origin_method`, `origin_url`, `origin_secret`.

**allowlist/route.ts:** Validate with `updateAllowlistSchema`. Delete all existing entries for the site, insert new ones. Use `db.batch()`.

**exclusions/route.ts:** Validate with `updateExclusionsSchema`. Same delete-all + insert pattern.

**analytics/route.ts:** Aggregate from `payments` table:
```sql
-- Revenue by day
SELECT date(created_at) as date, SUM(amount) as amount
FROM payments WHERE site_id = ? AND status = 'verified'
GROUP BY date(created_at) ORDER BY date DESC LIMIT 30

-- Top pages
SELECT path, COUNT(*) as count, SUM(amount) as revenue
FROM payments WHERE site_id = ? AND status = 'verified'
GROUP BY path ORDER BY count DESC LIMIT 20

-- Payments by bot
SELECT user_agent, COUNT(*) as count, SUM(amount) as revenue
FROM payments WHERE site_id = ? AND status = 'verified'
GROUP BY user_agent ORDER BY count DESC LIMIT 20

-- Success rate
SELECT
  COUNT(CASE WHEN status = 'verified' THEN 1 END) * 100.0 / COUNT(*) as success_rate
FROM payments WHERE site_id = ?
```

**payouts/route.ts:** Simple `SELECT * FROM payouts WHERE site_id = ? ORDER BY created_at DESC`.

**stripe/connect/route.ts:** See Task 11 for Stripe Connect implementation details.

- [ ] **Step 6: Run typecheck**

```bash
pnpm --filter @tollgate/dashboard typecheck
```

- [ ] **Step 7: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: dashboard API routes, data hooks, api client"
```

---

## Task 10: Dashboard — Site Pages (Onboarding, Management, Analytics)

**Files:**
- Create: all page files under `apps/dashboard/app/(authed)/dashboard/sites/`

- [ ] **Step 1: Create site list page**

**apps/dashboard/app/(authed)/dashboard/sites/page.tsx** — table of sites with domain, status, verified badge, revenue. "Add Site" button links to `/dashboard/sites/new`.

- [ ] **Step 2: Create onboarding wizard**

**apps/dashboard/app/(authed)/dashboard/sites/new/page.tsx** — 4-step wizard:
1. Enter domain → call `POST /api/v1/sites` → show DNS TXT instructions → "Verify Domain" button calls `POST /api/v1/sites/[id]/verify`
2. Stripe Connect → calls `POST /api/v1/sites/[id]/stripe/connect` → redirect to Stripe
3. Origin method selector → call `PUT /api/v1/sites/[id]/origin`
4. CDN template display (pre-filled code blocks for Cloudflare or Vercel) + CNAME instructions

Use React state to track current step. Each step persists to the API before advancing.

- [ ] **Step 3: Create site detail layout with tabs**

**apps/dashboard/app/(authed)/dashboard/sites/[id]/layout.tsx:**
```typescript
"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = [
  { value: "pricing", label: "Pricing" },
  { value: "bots", label: "Bots" },
  { value: "payouts", label: "Payouts" },
  { value: "analytics", label: "Analytics" },
  { value: "settings", label: "Settings" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const activeTab = pathname.split("/").pop() ?? "pricing";

  return (
    <div className="space-y-6">
      <Tabs value={activeTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} asChild>
              <Link href={`/dashboard/sites/${id}/${tab.value}`}>{tab.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create pricing page**

Shows current default price, form to update it. Calls `PUT /api/v1/sites/[id]/pricing`.

- [ ] **Step 5: Create bots page**

Two sections: Bot Allowlist and Path Exclusions. Each is a table with add/remove. Calls `PUT /api/v1/sites/[id]/allowlist` and `PUT /api/v1/sites/[id]/exclusions`.

- [ ] **Step 6: Create payouts page**

Shows current balance (from site.balance), Stripe connection status, payout history table. "Connect Stripe" button if not connected.

- [ ] **Step 7: Create analytics page**

Revenue over time (Recharts line chart), top pages table, payments by bot table. All data from `GET /api/v1/sites/[id]/analytics`.

- [ ] **Step 8: Create settings page**

Origin method config, secret rotation button (Method B), pause/resume site toggle, delete site button with confirmation dialog.

- [ ] **Step 9: Create site detail redirect**

**apps/dashboard/app/(authed)/dashboard/sites/[id]/page.tsx** — redirect to pricing tab:
```typescript
import { redirect } from "next/navigation";

export default function SitePage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/sites/${params.id}/pricing`);
}
```

- [ ] **Step 10: Run typecheck and verify**

```bash
pnpm --filter @tollgate/dashboard typecheck
```

- [ ] **Step 11: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: dashboard site pages — onboarding, management, analytics"
```

---

## Task 11: Dashboard — Stripe Connect & Payout Cron

**Files:**
- Create: `apps/dashboard/lib/stripe.ts`, `apps/dashboard/app/api/v1/sites/[id]/stripe/connect/route.ts`, `apps/dashboard/app/api/v1/sites/[id]/stripe/callback/route.ts`, `apps/dashboard/app/api/v1/cron/payouts/route.ts`

- [ ] **Step 1: Create Stripe helper**

**apps/dashboard/lib/stripe.ts:**

```typescript
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}
```

Add `STRIPE_SECRET_KEY` to `wrangler.toml` secrets (set via `wrangler secret put STRIPE_SECRET_KEY`).

- [ ] **Step 2: Implement Stripe Connect onboarding route**

**apps/dashboard/app/api/v1/sites/[id]/stripe/connect/route.ts:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAccountId, unauthorized, forbidden, verifySiteOwnership } from "@/lib/auth-middleware";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, params.id, db))) return forbidden();

  const site = await db.select().from(sites).where(eq(sites.id, params.id)).get();
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stripe = getStripe();

  // Create or retrieve Stripe Connect Express account
  let stripeAccountId = site.stripeAccountId;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { tollgate_site_id: params.id },
    });
    stripeAccountId = account.id;

    await db
      .update(sites)
      .set({ stripeAccountId, updatedAt: new Date().toISOString() })
      .where(eq(sites.id, params.id));
  }

  // Generate account link for onboarding UI
  const origin = request.headers.get("origin") ?? "https://tollgate.obul.ai";
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/dashboard/sites/${params.id}/payouts?stripe=refresh`,
    return_url: `${origin}/dashboard/sites/${params.id}/payouts?stripe=complete`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
```

The `return_url` brings the publisher back to the payouts page after completing Stripe onboarding. The `stripeAccountId` was already saved when the account was created, so no callback route is needed — Stripe sets up the account asynchronously.

- [ ] **Step 3: Implement payout cron route**

OpenNextJS Workers support a `scheduled` event via custom Worker configuration. For simplicity in MVP, implement as an API route that can be called by a Cron Trigger or manually.

**apps/dashboard/app/api/v1/cron/payouts/route.ts:**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq, gt, and, isNotNull, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { sites, balances, payouts, PAYOUT_THRESHOLD_MINOR } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStripe } from "@/lib/stripe";

// Secure with a secret token to prevent unauthorized cron calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);
  const stripe = getStripe();

  // Find all sites with balance > threshold and Stripe connected
  const eligible = await db
    .select({
      siteId: balances.siteId,
      amount: balances.amount,
      stripeAccountId: sites.stripeAccountId,
    })
    .from(balances)
    .innerJoin(sites, eq(sites.id, balances.siteId))
    .where(
      and(
        gt(balances.amount, PAYOUT_THRESHOLD_MINOR),
        isNotNull(sites.stripeAccountId)
      )
    )
    .all();

  const results: { siteId: string; status: string; error?: string }[] = [];

  for (const entry of eligible) {
    const now = new Date().toISOString();
    const payoutId = ulid();
    // Convert USDC minor units to USD cents (1:1 for USDC)
    const amountCents = Math.floor(entry.amount / 10000); // USDC minor (6 dec) to cents (2 dec)

    try {
      // Create Stripe transfer to connected account
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: "usd",
        destination: entry.stripeAccountId!,
        metadata: { tollgate_site_id: entry.siteId, tollgate_payout_id: payoutId },
      });

      // Convert cents back to USDC minor units for exact deduction
      const deductMinor = amountCents * 10000; // cents (2 dec) back to USDC minor (6 dec)

      // Record payout and deduct exact transferred amount (preserve remainder)
      await db.batch([
        db.insert(payouts).values({
          id: payoutId,
          siteId: entry.siteId,
          amount: amountCents,
          stripePayoutId: transfer.id,
          status: "completed",
          createdAt: now,
        }),
        db
          .update(balances)
          .set({
            amount: sql`${balances.amount} - ${deductMinor}`,
            updatedAt: now,
          })
          .where(eq(balances.siteId, entry.siteId)),
      ]);

      results.push({ siteId: entry.siteId, status: "completed" });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      // Record failed payout attempt
      await db.insert(payouts).values({
        id: payoutId,
        siteId: entry.siteId,
        amount: amountCents,
        stripePayoutId: "failed",
        status: "failed",
        createdAt: now,
      });

      results.push({ siteId: entry.siteId, status: "failed", error });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
```

**Cron trigger approach:** OpenNextJS does not directly expose a `scheduled()` handler. Two options:

1. **External cron** (recommended for MVP): Use Cloudflare Workers Cron Trigger on a tiny separate Worker that calls `POST https://tollgate.obul.ai/api/v1/cron/payouts` with the `CRON_SECRET` bearer token. This decouples the cron from OpenNextJS limitations.
2. **Alternative:** Use a third-party cron service (e.g., cron-job.org) to hit the endpoint daily.

Create a minimal cron Worker if using option 1:

```toml
# apps/dashboard/cron-worker.toml (separate from dashboard)
name = "tollgate-cron"
main = "cron-worker.ts"
compatibility_date = "2025-12-01"

[triggers]
crons = ["0 6 * * *"]

[vars]
DASHBOARD_URL = "https://tollgate.obul.ai"
CRON_SECRET = "" # set via wrangler secret put
```

```typescript
// apps/dashboard/cron-worker.ts
export default {
  async scheduled(event, env, ctx) {
    await fetch(`${env.DASHBOARD_URL}/api/v1/cron/payouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
  },
};
```

- [ ] **Step 4: Add secrets to wrangler config**

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put CRON_SECRET
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm --filter @tollgate/dashboard typecheck
```

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/
git commit -m "feat: Stripe Connect integration and payout cron"
```

---

## Task 12: CLAUDE.md & Final Cleanup

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create CLAUDE.md**

```markdown
# Tollgate

x402 bot payment gateway. Publishers charge AI bots for content access via on-chain micropayments.

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

Cloudflare D1 (SQLite). Migrations in `packages/shared/migrations/`.

## Auth

Google OAuth via obul-accounts backend. Dashboard calls `/auth/session` to check session. Dev bypass: `NEXT_PUBLIC_DEV_BYPASS_AUTH=true`.

## Design

Match obul-dashboard theme. See `/Users/inkvi/dev/obul-dashboard` for reference.
```

- [ ] **Step 2: Verify full build**

```bash
cd /Users/inkvi/dev/tollgate && pnpm install && pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md"
```
