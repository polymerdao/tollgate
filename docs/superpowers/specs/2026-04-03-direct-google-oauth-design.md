# Direct Google OAuth — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the obul-accounts auth dependency with direct Google OAuth, making the dashboard fully self-contained.

**Architecture:** Manual OAuth 2.0 authorization code flow with Google. Sessions stored as signed JWT cookies (HMAC-SHA256 via Web Crypto API). No external auth service dependency. No new database tables.

**Tech Stack:** Next.js API routes on Cloudflare Workers (OpenNextJS), Web Crypto API for JWT signing, Google OAuth 2.0.

---

## Context

The Tollgate dashboard currently delegates authentication to the obul-accounts backend (`api.obul.ai`). This creates a runtime dependency, requires allowlisting every new Tollgate domain in the obul backend, and is heavyweight for what Tollgate actually uses (Google login only). This design replaces that with a self-contained OAuth flow.

## Decisions

- **User identifier:** Google email address, stored in `sites.accountId`.
- **Google OAuth client:** Reuse the existing "obul" client in Google Cloud. Add Tollgate dashboard URLs to authorized redirect URIs and JavaScript origins.
- **Session storage:** Signed JWT cookie (no database session table). Sessions cannot be revoked server-side until expiry. Acceptable for MVP.
- **Existing DB data:** Test data only, can be orphaned by the accountId change.

## Auth Flow

### Login

1. User clicks "Sign in with Google" on `/login` page.
2. Client redirects to `GET /api/auth/login`.
3. Server generates a random 32-byte hex `state` parameter.
4. Server sets a `tollgate_oauth_state` cookie (HttpOnly, Secure, SameSite=Lax, 10-minute TTL) containing the state.
5. Server redirects to Google's authorization endpoint:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=GOOGLE_CLIENT_ID&
     redirect_uri={origin}/api/auth/callback&
     response_type=code&
     scope=openid email profile&
     state={state}
   ```

### Callback

1. Google redirects to `GET /api/auth/callback?code=...&state=...`.
2. Server reads `tollgate_oauth_state` cookie, validates it matches the `state` query param. Clears the state cookie.
3. Server exchanges `code` for tokens via POST to `https://oauth2.googleapis.com/token` with `client_id`, `client_secret`, `code`, `redirect_uri`, `grant_type=authorization_code`.
4. Server decodes the `id_token` JWT from Google's response (no signature verification needed — it came directly from Google over HTTPS). Validates that `aud` matches `GOOGLE_CLIENT_ID` and `iss` is `https://accounts.google.com` or `accounts.google.com`.
5. Extracts `email`, `name`, `picture` from the ID token payload.
6. On any error (state mismatch, token exchange failure, missing fields), redirects to `/login?error=auth_failed`.
6. Creates a signed session JWT:
   - Payload: `{ email, name, picture, iat, exp }`
   - Signed with HMAC-SHA256 using `SESSION_SECRET`
   - Expiry: 7 days
7. Sets `tollgate_session` cookie (HttpOnly, Secure, SameSite=Lax, Path=/, 7-day max-age).
8. Redirects to `/dashboard`.

### Session Check

- `GET /api/auth/session` reads the `tollgate_session` cookie, verifies the JWT signature, and returns `{ user: { email, name, picture } }` or 401.
- Client-side: `useSession()` hook calls `/api/auth/session` on mount (same pattern as today).
- Server-side API routes: `getAccountId()` reads the cookie from the request, verifies the JWT directly (no external API call), returns the email.

### Logout

- `POST /api/auth/logout` clears the `tollgate_session` cookie (set max-age=0).
- Client redirects to `/login`.

## Session & Security

| Property | Value |
|----------|-------|
| Cookie name | `tollgate_session` |
| Algorithm | HMAC-SHA256 (Web Crypto API) |
| HttpOnly | Yes |
| Secure | Yes (omit on `http://localhost` for local dev) |
| SameSite | Lax |
| Path | `/` |
| Expiry | 7 days |
| Payload | `{ email, name, picture, iat, exp }` |

**CSRF protection:** The `state` parameter (random 32-byte hex) is stored in `tollgate_oauth_state` cookie (HttpOnly, 10-minute TTL) and validated on callback.

**Client secret:** Stored as a Cloudflare Workers secret via `wrangler secret put GOOGLE_CLIENT_SECRET`. Never exposed to the client.

**SESSION_SECRET:** Stored as a Cloudflare Workers secret via `wrangler secret put SESSION_SECRET`. Used for HMAC-SHA256 JWT signing.

**Accessing secrets in API routes:** All server-side secrets (`GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`) and vars (`GOOGLE_CLIENT_ID`) must be accessed via `(await getCloudflareContext()).env`, not `process.env`. This is how OpenNextJS exposes Cloudflare bindings to Next.js API routes.

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `lib/auth-jwt.ts` | `signJwt(payload, secret): Promise<string>` and `verifyJwt(token, secret): Promise<JwtPayload \| null>` using Web Crypto API. Secret passed as parameter (caller provides it from Cloudflare context or env). Returns `null` on verification failure (expired, invalid signature, malformed). ~60 lines. |
| `app/api/auth/login/route.ts` | Redirect to Google OAuth |
| `app/api/auth/callback/route.ts` | Exchange code, set session cookie |
| `app/api/auth/session/route.ts` | Return current user from JWT |
| `app/api/auth/logout/route.ts` | Clear session cookie |

### Modified Files

| File | Change |
|------|--------|
| `lib/auth-client.ts` | `useSession()` calls local `/api/auth/session`. `startGoogleLogin()` redirects to `/api/auth/login`. `signOut()` calls `/api/auth/logout`. Remove obul-accounts URL building. Remove dev bypass (use proper local flow instead). |
| `lib/auth-middleware.ts` | `getAccountId()` reads `tollgate_session` cookie, gets `SESSION_SECRET` from `getCloudflareContext().env`, verifies JWT via `verifyJwt()`, returns email. No external API call. |
| `lib/env.ts` | Remove `NEXT_PUBLIC_API_BASE_URL` validation. Add `GOOGLE_CLIENT_ID` getter. |
| `lib/auth-flow.ts` | Simplify to just path constants (`AUTH_SUCCESS_PATH`, `AUTH_CALLBACK_PATH`). Remove obul URL builders, device flow, sessionStorage return-to. |
| `wrangler.toml` | Add `GOOGLE_CLIENT_ID` to `[vars]` and `[env.testnet.vars]`. |

### Unchanged Files

| File | Why |
|------|-----|
| `components/session-gate.tsx` | Still uses `useSession()` — interface unchanged. |
| `components/dashboard/topbar.tsx` | Still calls `signOut()` — interface unchanged. |
| `components/dashboard/sidebar.tsx` | Still calls `signOut()` — interface unchanged. |
| `app/(public)/login/page.tsx` | Still calls `startGoogleLogin()` — interface unchanged. |
| All API route handlers (`app/api/v1/...`) | `getAccountId()` interface unchanged, just returns email now. |

### Removed/Simplified

| File | Change |
|------|--------|
| `app/(public)/auth/callback/page.tsx` | No longer needed as a client page. The server-side `/api/auth/callback` route handles everything and redirects. Replace with a simple redirect or loading page. |

## Configuration

### wrangler.toml vars (public)

```toml
[vars]
GOOGLE_CLIENT_ID = "<client-id-from-google-cloud>"

[env.testnet.vars]
GOOGLE_CLIENT_ID = "<same-client-id>"
```

### Wrangler secrets (via CLI)

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
# Repeat with --env testnet for testnet
```

### Google Cloud Console

Add to the "obul" OAuth client:

**Authorized JavaScript origins:**
- `https://tollgate-dashboard.operations-4bf.workers.dev`

**Authorized redirect URIs:**
- `https://tollgate-dashboard.operations-4bf.workers.dev/api/auth/callback`

(Add custom domains like `https://tollgate.obul.ai` later when configured.)

## Dev Mode

For local development, the same flow works with `http://localhost:3000`. Add to Google OAuth client:

**Authorized JavaScript origins:**
- `http://localhost:3000`

**Authorized redirect URIs:**
- `http://localhost:3000/api/auth/callback`

The `GOOGLE_CLIENT_ID` is set in `.env.local`. `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` are also set in `.env.local` for local dev:

```
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
SESSION_SECRET=<random-hex-string>
```

The `NEXT_PUBLIC_DEV_BYPASS_AUTH` flag can be retained for cases where Google OAuth is inconvenient locally, but defaults to `false`.
