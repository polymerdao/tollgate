# Tollgate MVP Design Spec

**x402 Bot Payment Gateway — Phase 1 MVP**

|            |                                         |
| ---------- | --------------------------------------- |
| **Date**   | 2026-04-03                              |
| **Status** | Draft                                   |
| **PRD**    | `/Users/inkvi/Downloads/obul_ai_prd.md` |

---

## 1. Overview

Tollgate is an x402 bot payment gateway that lets publishers charge AI bots for content access. Bots receive HTTP 402 responses with on-chain payment terms. After paying (USDC on Base), bots get single-use access to the content. Publishers configure pricing and view analytics through a dashboard — they never touch crypto. Tollgate collects payments into its own wallet and pays publishers out via Stripe.

### 1.1 Design Decisions Departing from PRD

**Tollgate-owned wallet (not per-publisher wallets):** The PRD specifies that each publisher connects their own wallet and receives payments directly on-chain. This spec instead has all payments go to a single Tollgate-controlled wallet, with publishers receiving fiat payouts via Stripe. Rationale: publishers should not need to understand crypto. This dramatically simplifies onboarding and broadens the addressable market beyond crypto-native publishers.

**Method A in MVP:** The PRD defers Method A (IP Allowlist) to Phase 2. This spec includes it in MVP scope. Cloudflare Workers lack static egress IPs natively — this requires egress via Cloudflare WARP or a fixed-IP proxy service. This dependency must be resolved during implementation.

## 2. Architecture

Two Cloudflare Workers sharing a D1 database:

- **Gateway Worker** (`gw.obul.ai`) — Hono. Serves bots. Returns 402s, verifies on-chain payments, fetches origin content.
- **Dashboard Worker** (`tollgate.obul.ai`) — Next.js via OpenNextJS. Serves publishers. Onboarding, pricing config, analytics, Stripe payouts.

### 2.1 Monorepo Structure

```
tollgate/
├── apps/
│   ├── gateway/            # Hono — gw.obul.ai
│   │   ├── src/
│   │   └── wrangler.toml
│   └── dashboard/          # Next.js — tollgate.obul.ai
│       ├── src/
│       └── wrangler.toml
├── packages/
│   ├── shared/             # @tollgate/shared — D1 schema, types, Zod validators
│   └── x402/               # @tollgate/x402 — x402 protocol types, payment verification
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 2.2 Tech Stack

| Layer             | Choice                                              |
| ----------------- | --------------------------------------------------- |
| Monorepo          | Turborepo + pnpm                                    |
| Gateway           | Hono on Cloudflare Workers                          |
| Dashboard         | Next.js on Cloudflare Workers (OpenNextJS)          |
| Database          | Cloudflare D1                                       |
| Cache/State       | Cloudflare KV                                       |
| Auth              | Google OAuth via obul-accounts backend              |
| Blockchain        | viem (gateway payment verification)                 |
| UI                | Radix UI + Tailwind CSS + TanStack Query + Recharts |
| ORM               | Drizzle (D1 driver)                                 |
| Validation        | Zod                                                 |
| Analytics         | PostHog (dashboard user behavior tracking)          |
| Publisher payouts | Stripe Connect Express                              |

### 2.3 Design Theme

Match obul-dashboard's design system: colors, typography, component patterns, and layout structure. Tollgate should feel like part of the same product family.

## 3. Data Model (D1)

All monetary amounts are stored as **integer minor units** (1 USDC = 1000000, i.e. 6 decimal places). This avoids floating-point precision issues. Display conversion to human-readable format happens at the UI layer.

### 3.1 `sites`

| Column                          | Type                 | Description                                                                 |
| ------------------------------- | -------------------- | --------------------------------------------------------------------------- |
| `id`                            | text (ULID)          | Primary key                                                                 |
| `account_id`                    | text                 | obul-accounts user ID                                                       |
| `domain`                        | text (unique)        | Publisher domain (e.g. `example.com`)                                       |
| `status`                        | text                 | "active", "paused", "suspended"                                             |
| `verification_token`            | text                 | Generated token for DNS TXT verification                                    |
| `verified_at`                   | text (ISO, nullable) | When DNS verification succeeded. Null = unverified.                         |
| `stripe_account_id`             | text (nullable)      | Stripe Connect account for payouts                                          |
| `default_price`                 | integer              | Default price per page in USDC minor units (e.g. 10000 = $0.01)             |
| `origin_method`                 | text                 | "ip_allowlist", "secret_header", or "backend_api"                           |
| `origin_url`                    | text (nullable)      | Method C backend URL                                                        |
| `origin_secret`                 | text (nullable)      | Method B secret token                                                       |
| `origin_secret_prev`            | text (nullable)      | Previous secret during rotation                                             |
| `origin_secret_prev_expires_at` | text (ISO, nullable) | When the previous secret stops being accepted (default: 24h after rotation) |
| `network`                       | text                 | Chain: "base" for MVP                                                       |
| `created_at`                    | text (ISO)           |                                                                             |
| `updated_at`                    | text (ISO)           |                                                                             |

### 3.2 `bot_allowlist`

| Column               | Type        | Description                                                                          |
| -------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `id`                 | text (ULID) | Primary key                                                                          |
| `site_id`            | text (FK)   |                                                                                      |
| `user_agent_pattern` | text        | Regex pattern (e.g. `Googlebot`). Validated on save to reject pathological patterns. |

### 3.3 `path_exclusions`

| Column    | Type        | Description                                                                         |
| --------- | ----------- | ----------------------------------------------------------------------------------- |
| `id`      | text (ULID) | Primary key                                                                         |
| `site_id` | text (FK)   |                                                                                     |
| `pattern` | text        | Regex pattern (e.g. `/admin.*`). Validated on save to reject pathological patterns. |

### 3.4 `payments`

| Column          | Type                    | Description                                                   |
| --------------- | ----------------------- | ------------------------------------------------------------- |
| `id`            | text (ULID)             | Primary key                                                   |
| `site_id`       | text (FK)               |                                                               |
| `payment_id`    | text (unique)           | x402 payment ID                                               |
| `tx_hash`       | text (unique, nullable) | On-chain transaction hash — unique constraint prevents replay |
| `payer_address` | text (nullable)         | Bot's wallet                                                  |
| `amount`        | integer                 | USDC minor units                                              |
| `path`          | text                    | Requested URL path                                            |
| `status`        | text                    | "pending", "verified", "expired", "failed"                    |
| `user_agent`    | text (nullable)         | Bot's user-agent                                              |
| `created_at`    | text (ISO)              |                                                               |
| `verified_at`   | text (ISO, nullable)    |                                                               |

### 3.5 `balances`

| Column       | Type              | Description                             |
| ------------ | ----------------- | --------------------------------------- |
| `site_id`    | text (FK, unique) | One balance per site                    |
| `amount`     | integer           | Accumulated USDC revenue in minor units |
| `updated_at` | text (ISO)        |                                         |

Balance increments use atomic SQL: `UPDATE balances SET amount = amount + ? WHERE site_id = ?`

### 3.6 `payouts`

| Column             | Type        | Description                      |
| ------------------ | ----------- | -------------------------------- |
| `id`               | text (ULID) | Primary key                      |
| `site_id`          | text (FK)   |                                  |
| `amount`           | integer     | Payout amount in USD cents       |
| `stripe_payout_id` | text        | Stripe reference                 |
| `status`           | text        | "pending", "completed", "failed" |
| `created_at`       | text (ISO)  |                                  |

### 3.7 KV Keys

| Key pattern           | Value                  | TTL   | Purpose                     |
| --------------------- | ---------------------- | ----- | --------------------------- |
| `payment:{paymentId}` | site_id + price + path | 5 min | Single-use payment IDs      |
| `site:{domain}`       | Cached site config     | 60s   | Avoid D1 reads on hot path  |
| `ratelimit:{ip}`      | Counter                | 60s   | Rate limiting 402 responses |

### 3.8 Known Limitations

**D1 single-writer:** D1 is SQLite-based with a single-writer model. Under high concurrent bot traffic, payment record writes could queue. Acceptable for MVP scale (< 10k concurrent). If this becomes a bottleneck, migrate writes to a Durable Object or queue.

**KV eventual consistency:** KV is eventually consistent across edge locations. A payment ID stored at one edge may not be immediately visible at another. For MVP, this is an acceptable risk — the 5-minute TTL and D1 tx_hash uniqueness constraint provide a safety net. If a valid payment is rejected due to edge lag, the bot can retry.

## 4. Gateway Worker

### 4.1 Source Structure

```
apps/gateway/src/
├── index.ts                  # Hono app, top-level routing
├── routes/payment.ts         # 402 generation + payment proof handling
├── routes/health.ts          # GET /health — liveness check
├── services/verify.ts        # On-chain payment verification via viem
├── services/origin.ts        # Origin content fetching (Methods A, B, C)
├── middleware/rate-limit.ts   # Rate limiting via KV
├── middleware/allowlist.ts    # Bot allowlist + path exclusion checks
└── middleware/site-lookup.ts  # Domain → site config resolution
```

### 4.2 Request Flow

```
Bot → pay.example.com (CNAME → gw.obul.ai)
  │
  ├─ Extract publisher domain from Host header
  ├─ Lookup site config (KV cache → D1 fallback)
  ├─ 404 if site not registered
  ├─ 404 if site not verified (verified_at is null)
  ├─ 403 if site status is not "active"
  │
  ├─ Check path exclusions → 403 if matched
  ├─ Check bot allowlist → serve content free if matched
  ├─ Rate limit check (KV) → 429 if exceeded
  │
  ├─ Has X-Payment-Proof header?
  │   │
  │   NO → Generate paymentId, store in KV (5min TTL)
  │   │    Return 402:
  │   │    { price, currency, network, recipientAddress (Tollgate wallet),
  │   │      paymentId, expiresAt, contentUrl }
  │   │
  │   YES → Read X-Payment-Id and X-Payment-Chain headers
  │         ├─ Lookup paymentId in KV → 408 if expired/missing
  │         ├─ Delete paymentId from KV (consumed, single-use)
  │         ├─ Check tx_hash not already used in D1 → 400 if duplicate
  │         ├─ Verify on-chain via viem:
  │         │   - tx exists on Base
  │         │   - recipient matches Tollgate wallet
  │         │   - amount >= price
  │         │   - sufficient finality
  │         ├─ 400 if verification fails
  │         │
  │         ├─ Write payment record to D1 (audit log)
  │         ├─ Increment site balance in D1
  │         ├─ Fetch origin content:
  │         │   Method A: GET origin (from Tollgate static egress IPs)
  │         │   Method B: GET origin + X-Obul-Secret header
  │         │   Method C: GET backend API URL
  │         ├─ 502 if origin fails
  │         │
  │         └─ Return 200 with content (single-use, no caching)
```

### 4.3 Rate Limiting

- **Scope:** Per IP, per site
- **Threshold:** 60 requests per minute for 402 responses (prevents payment term enumeration)
- **Storage:** KV key `ratelimit:{ip}:{domain}`, integer counter, 60s TTL
- **Response:** 429 with `Retry-After: 60` header

### 4.4 Payment Verification (`@tollgate/x402`)

Uses viem to verify USDC transfers on Base:

1. Create public client for Base chain
2. `getTransactionReceipt(txHash)` — confirm tx exists and succeeded
3. Decode USDC Transfer event log — validate `to` matches Tollgate wallet, `value` >= price
4. Check block confirmations for finality

### 4.5 Origin Fetching

Three methods, configured per site:

- **Method A (IP Allowlist):** Fetch from publisher's public URL using Tollgate's static egress IPs. Publisher allowlists these IPs in their CDN/WAF. Note: Cloudflare Workers lack static egress IPs natively — requires egress via Cloudflare WARP or a fixed-IP proxy service. This dependency must be resolved during implementation.
- **Method B (Secret Header):** Fetch from publisher's public URL with `X-Obul-Secret` header. Publisher's CDN rule skips bot detection when header matches. During secret rotation, both current and previous secrets are accepted until `origin_secret_prev_expires_at` (default 24h).
- **Method C (Backend API):** Fetch from a private endpoint provided by the publisher. Bypasses CDN entirely.

### 4.6 Error Codes

| Code | Meaning                                          |
| ---- | ------------------------------------------------ |
| 400  | Malformed request or payment verification failed |
| 402  | Payment required — x402 payload returned         |
| 403  | Path excluded or site not active                 |
| 404  | Site not registered                              |
| 408  | Payment ID expired                               |
| 429  | Rate limited                                     |
| 502  | Origin fetch failed                              |

## 5. Dashboard Worker

### 5.1 Auth Flow

Delegates to obul-accounts backend (Google OAuth):

```
User clicks "Sign in with Google"
  → Redirect to {API_BASE_URL}/auth/google/login
  → Google OAuth consent
  → obul-accounts sets session cookie
  → Redirect to tollgate.obul.ai/dashboard
  → Dashboard calls /auth/session for user info
```

- `useSession()` hook on every protected page
- Unauthenticated users redirected to `/login`
- Dev bypass via `NEXT_PUBLIC_DEV_BYPASS_AUTH` for local development

### 5.2 Authorization

All site API endpoints verify that the authenticated user's `account_id` matches the site's `account_id`. A middleware function extracts the session, looks up the site, and rejects with 403 if the IDs don't match.

### 5.3 Pages

| Route                             | Purpose                                           |
| --------------------------------- | ------------------------------------------------- |
| `/`                               | Landing page                                      |
| `/login`                          | Google OAuth sign-in                              |
| `/auth/callback`                  | OAuth callback handler                            |
| `/dashboard`                      | Overview: revenue summary, recent transactions    |
| `/dashboard/sites`                | List of registered sites                          |
| `/dashboard/sites/new`            | Onboarding wizard (4 steps)                       |
| `/dashboard/sites/[id]`           | Site detail with tabs                             |
| `/dashboard/sites/[id]/pricing`   | Default price config                              |
| `/dashboard/sites/[id]/bots`      | Allowlist + path exclusions                       |
| `/dashboard/sites/[id]/payouts`   | Balance, payout history, Stripe account           |
| `/dashboard/sites/[id]/analytics` | Revenue over time, top pages, payments by bot     |
| `/dashboard/sites/[id]/settings`  | Origin config, secret rotation, pause/delete site |

### 5.4 Domain Verification

Ownership is verified via DNS TXT record before a site can be activated.

**Flow:**

1. Publisher enters `example.com` in onboarding wizard
2. Backend checks domain is not already registered by another account → reject if taken
3. Backend generates a unique verification token and creates the site with `verified_at = null`
4. Dashboard shows: "Add this DNS TXT record to verify ownership"
   ```
   Type: TXT
   Name: _tollgate.example.com
   Value: tollgate-verify=tg_<token>
   ```
5. Publisher adds the record in their DNS provider
6. Publisher clicks "Verify Domain"
7. Backend performs DNS TXT lookup on `_tollgate.example.com`, checks for matching token
8. If found → set `verified_at`, proceed to next step
9. If not found → show "Record not found yet. DNS propagation can take up to 48 hours." with retry button

**Rules:**
- Unverified sites are ignored by the gateway (no 402 responses served)
- Verification token does not expire (publisher may take days to set up DNS)
- Once verified, remains verified even if TXT record is later removed (no continuous re-checking)
- A domain can only belong to one account. To transfer: current owner deletes site, new owner registers and re-verifies.

### 5.5 Onboarding Wizard

1. **Domain:** Enter domain → verify ownership via DNS TXT record
2. **Stripe:** Connect Stripe account (Stripe Connect Express)
3. **Origin method:** Choose A, B, or C. Configure credentials.
4. **CDN template:** Copy-paste redirect rules for Cloudflare or Vercel. Add CNAME `pay.example.com → gw.obul.ai`. Verify DNS resolution.

### 5.6 API Routes

All protected by obul-accounts session auth + site ownership verification.

| Method | Endpoint                            | Description                         |
| ------ | ----------------------------------- | ----------------------------------- |
| GET    | `/api/v1/sites`                     | List authenticated user's sites     |
| POST   | `/api/v1/sites`                     | Register a new site (unverified)    |
| GET    | `/api/v1/sites/[id]`                | Get site details                    |
| DELETE | `/api/v1/sites/[id]`                | Delete a site                       |
| POST   | `/api/v1/sites/[id]/verify`         | Check DNS TXT and verify domain     |
| PUT    | `/api/v1/sites/[id]/pricing`        | Update pricing                  |
| PUT    | `/api/v1/sites/[id]/origin`         | Configure origin method         |
| GET    | `/api/v1/sites/[id]/analytics`      | Revenue and traffic data        |
| POST   | `/api/v1/sites/[id]/secrets/rotate` | Rotate Method B secret          |
| PUT    | `/api/v1/sites/[id]/allowlist`      | Bot allowlist                   |
| PUT    | `/api/v1/sites/[id]/exclusions`     | Path exclusions                 |
| POST   | `/api/v1/sites/[id]/stripe/connect` | Initiate Stripe Connect         |
| GET    | `/api/v1/sites/[id]/payouts`        | Payout history                  |

## 6. CDN Templates

### 6.1 Cloudflare

**Redirect rule (WAF):** Bot score > threshold → 302 redirect to `pay.{domain}/{path}`

**Origin bypass (Method B):** WAF exception: if `X-Obul-Secret` header matches → allow request

Dashboard renders pre-filled code blocks with the publisher's domain and secret values.

### 6.2 Vercel

**Redirect:** `vercel.json` redirect rule for bot traffic → `pay.{domain}/{path}`

**Origin:** Use Method C (direct `*.vercel.app` URL). No bypass needed.

### 6.3 DNS (both platforms)

Publisher adds CNAME: `pay.example.com` → `gw.obul.ai`

Dashboard shows this as step 1 with a "Verify DNS" button.

## 7. Payout Flow

### 7.1 Payment Collection

All x402 payments from bots go to a single Tollgate-controlled wallet on Base.

**Wallet management (MVP):** Single EOA. Private key stored as a Cloudflare Worker secret (not used by the Worker directly — only needed for the off-chain conversion step). For Phase 2: migrate to multisig or MPC wallet.

### 7.2 USDC-to-USD Conversion

For MVP, conversion is a **manual operational process**, not in-product automation:

1. Tollgate operator batch-converts accumulated USDC to USD via Coinbase (or equivalent exchange)
2. Exchange rate at time of conversion applies
3. Converted USD is deposited to the Stripe balance for disbursement

Automated conversion (swap via DEX or Circle redemption) is deferred to Phase 2.

### 7.3 Publisher Payouts

Triggered by a **Cloudflare Cron Trigger** (scheduled Worker) running daily:

1. Query all sites with `balances.amount` > $10 equivalent (10000000 minor units)
2. For each eligible site with a connected Stripe account:
   - Create Stripe transfer to publisher's connected account
   - Write payout record to D1
   - Deduct payout amount from balance
3. Publisher sees balance and payout history in dashboard

### 7.4 Dashboard Binding for Cron

The payout Cron Trigger runs as a scheduled event on the Dashboard Worker, which already has the D1 binding and Stripe SDK.

## 8. Cloudflare Bindings

### 8.1 Gateway Worker

| Binding | Type         | Purpose                              |
| ------- | ------------ | ------------------------------------ |
| `DB`    | D1           | Site config, payments, balances      |
| `KV`    | KV Namespace | Payment IDs, site cache, rate limits |

### 8.2 Dashboard Worker

| Binding | Type         | Purpose             |
| ------- | ------------ | ------------------- |
| `DB`    | D1           | All CRUD operations |
| `CRON`  | Cron Trigger | Daily payout cycle  |

## 9. Scope

### 9.1 In Scope (Phase 1 MVP)

- Gateway: 402 responses, payment verification on Base (USDC), origin fetch (Methods A, B, C), single-use + tx hash uniqueness enforcement, rate limiting, health endpoint
- Dashboard: Google OAuth via obul-accounts, onboarding wizard, flat-rate pricing, Stripe Connect payouts, analytics, bot allowlist, path exclusions, secret rotation, site pause/delete
- CDN templates: Cloudflare + Vercel
- Shared packages: D1 schema (Drizzle), x402 protocol logic (viem)
- Deployment: Cloudflare Workers, D1, KV, Cron Triggers
- Payout: Cron-triggered Stripe payouts, manual USDC-to-USD conversion

### 9.2 Out of Scope (Phase 2+)

- Bot SDKs (Python, TypeScript)
- Multi-chain (Arbitrum, Optimism, Polygon)
- URL-pattern pricing rules
- Per-bot custom pricing
- HTML-to-markdown content transformation
- CDN templates: Fastly, AWS, GCP, Azure
- Discovery protocol (`/.well-known/x402`)
- Hybrid API key auth
- Multi-region deployment
- Advanced analytics (behavior patterns, heatmaps, forecasting)
- Automated USDC-to-USD conversion
- Multisig/MPC wallet
