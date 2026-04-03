# Direct Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obul-accounts auth dependency with a self-contained Google OAuth 2.0 flow in the dashboard.

**Architecture:** Manual OAuth 2.0 authorization code flow. Four new Next.js API routes handle login, callback, session check, and logout server-side. Sessions are signed JWTs stored in HttpOnly cookies using HMAC-SHA256 via the Web Crypto API. User email becomes the account identifier stored in `sites.accountId`.

**Tech Stack:** Next.js 16 API routes, Cloudflare Workers (via OpenNextJS), Web Crypto API, Google OAuth 2.0.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/dashboard/lib/auth-jwt.ts` | Create | `signJwt()` and `verifyJwt()` using Web Crypto HMAC-SHA256 |
| `apps/dashboard/app/api/auth/login/route.ts` | Create | Generate state, redirect to Google OAuth |
| `apps/dashboard/app/api/auth/callback/route.ts` | Create | Validate state, exchange code, set session cookie |
| `apps/dashboard/app/api/auth/session/route.ts` | Create | Read & verify session cookie, return user |
| `apps/dashboard/app/api/auth/logout/route.ts` | Create | Clear session cookie |
| `apps/dashboard/lib/auth-client.ts` | Replace | `useSession()`, `startGoogleLogin()`, `signOut()` using local API routes |
| `apps/dashboard/lib/auth-middleware.ts` | Replace | `getAccountId()` reads JWT from cookie directly |
| `apps/dashboard/lib/auth-flow.ts` | Replace | Three constants only; remove all obul/device-flow code |
| `apps/dashboard/lib/env.ts` | Replace | Remove `NEXT_PUBLIC_API_BASE_URL`; no longer needed |
| `apps/dashboard/app/(public)/auth/callback/page.tsx` | Replace | Simple loading page (server route handles the real work) |
| `apps/dashboard/app/(public)/login/page.tsx` | Modify | Remove device flow, add error display, simplify imports |
| `apps/dashboard/wrangler.toml` | Modify | Add `GOOGLE_CLIENT_ID` to `[vars]` for both envs |
| `apps/dashboard/.dev.vars` | Create (gitignored) | `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` for local dev |
| `apps/dashboard/.env.local` | Modify | Remove `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_DEV_BYPASS_AUTH` |

---

## Prerequisites (manual steps before coding)

Before starting, complete these one-time setup steps:

**1. Add Tollgate URLs to the "obul" Google OAuth client:**

In Google Cloud Console (the OAuth client shown in the screenshot):

*Authorized JavaScript origins — add:*
- `https://tollgate-dashboard.operations-4bf.workers.dev`
- `http://localhost:3000`

*Authorized redirect URIs — add:*
- `https://tollgate-dashboard.operations-4bf.workers.dev/api/auth/callback`
- `http://localhost:3000/api/auth/callback`

**2. Gather credentials you'll need:**
- `GOOGLE_CLIENT_ID` — from the OAuth client page
- `GOOGLE_CLIENT_SECRET` — from the OAuth client page
- `SESSION_SECRET` — generate with: `openssl rand -hex 32`

---

## Task 1: JWT sign/verify utility

**Files:**
- Create: `apps/dashboard/lib/auth-jwt.ts`

No test framework exists in this project. Verification is by running the next task and checking the cookie manually.

- [ ] **Step 1: Create `apps/dashboard/lib/auth-jwt.ts`**

```typescript
export interface JwtPayload {
  email: string;
  name: string | null;
  picture: string | null;
  iat: number;
  exp: number;
}

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  const header = toBase64url(
    new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  );
  const body = toBase64url(
    new TextEncoder().encode(JSON.stringify(fullPayload))
  );
  const signingInput = `${header}.${body}`;

  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${toBase64url(signature)}`;
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;
    const signingInput = `${header}.${body}`;

    const key = await importHmacKey(secret);
    const signatureBytes = Uint8Array.from(fromBase64url(sig), (c) =>
      c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(signingInput)
    );
    if (!valid) return null;

    const payload = JSON.parse(fromBase64url(body)) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/dashboard && pnpm typecheck
```

Expected: No errors in `lib/auth-jwt.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/lib/auth-jwt.ts
git commit -m "feat: add JWT sign/verify utility using Web Crypto HMAC-SHA256"
```

---

## Task 2: Auth API routes

**Files:**
- Create: `apps/dashboard/app/api/auth/login/route.ts`
- Create: `apps/dashboard/app/api/auth/callback/route.ts`
- Create: `apps/dashboard/app/api/auth/session/route.ts`
- Create: `apps/dashboard/app/api/auth/logout/route.ts`

- [ ] **Step 1: Create `apps/dashboard/app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const clientId = (env as Record<string, string>).GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  const state = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);

  const isSecure = origin.startsWith("https://");
  const stateCookie = [
    `tollgate_oauth_state=${state}`,
    "HttpOnly",
    isSecure ? "Secure" : "",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=600",
  ]
    .filter(Boolean)
    .join("; ");

  return NextResponse.redirect(url.toString(), {
    headers: { "Set-Cookie": stateCookie },
  });
}
```

- [ ] **Step 2: Create `apps/dashboard/app/api/auth/callback/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { signJwt } from "@/lib/auth-jwt";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function parseCookie(header: string, name: string): string | null {
  return (
    header
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

function clearStateCookie(): string {
  return "tollgate_oauth_state=; HttpOnly; Path=/; Max-Age=0";
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const cfEnv = env as Record<string, string>;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const origin = new URL(request.url).origin;
  const loginErrorUrl = `${origin}/login?error=auth_failed`;

  // Validate state to prevent CSRF
  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateCookie = parseCookie(cookieHeader, "tollgate_oauth_state");

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(loginErrorUrl, {
      headers: { "Set-Cookie": clearStateCookie() },
    });
  }

  // Exchange authorization code for tokens
  let idToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: cfEnv.GOOGLE_CLIENT_ID,
        client_secret: cfEnv.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokenData = (await tokenRes.json()) as { id_token?: string };
    if (!tokenData.id_token) throw new Error("Missing id_token");
    idToken = tokenData.id_token;
  } catch {
    return NextResponse.redirect(loginErrorUrl, {
      headers: { "Set-Cookie": clearStateCookie() },
    });
  }

  // Decode and validate the Google ID token
  let email: string;
  let name: string | null;
  let picture: string | null;
  try {
    const payloadJson = atob(
      idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    );
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    const validIssuers = ["https://accounts.google.com", "accounts.google.com"];
    if (typeof payload.iss !== "string" || !validIssuers.includes(payload.iss))
      throw new Error("Invalid issuer");
    if (payload.aud !== cfEnv.GOOGLE_CLIENT_ID)
      throw new Error("Invalid audience");
    if (typeof payload.email !== "string" || !payload.email)
      throw new Error("Missing email");

    email = payload.email;
    name = typeof payload.name === "string" ? payload.name : null;
    picture = typeof payload.picture === "string" ? payload.picture : null;
  } catch {
    return NextResponse.redirect(loginErrorUrl, {
      headers: { "Set-Cookie": clearStateCookie() },
    });
  }

  // Create signed session JWT
  const sessionToken = await signJwt(
    { email, name, picture },
    cfEnv.SESSION_SECRET
  );

  const isSecure = origin.startsWith("https://");
  const sessionCookie = [
    `tollgate_session=${sessionToken}`,
    "HttpOnly",
    isSecure ? "Secure" : "",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ]
    .filter(Boolean)
    .join("; ");

  const response = NextResponse.redirect(`${origin}/dashboard`);
  response.headers.append("Set-Cookie", clearStateCookie());
  response.headers.append("Set-Cookie", sessionCookie);
  return response;
}
```

- [ ] **Step 3: Create `apps/dashboard/app/api/auth/session/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyJwt } from "@/lib/auth-jwt";

function parseCookie(header: string, name: string): string | null {
  return (
    header
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const cfEnv = env as Record<string, string>;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = parseCookie(cookieHeader, "tollgate_session");

  if (!token) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const payload = await verifyJwt(token, cfEnv.SESSION_SECRET);
  if (!payload) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    },
  });
}
```

- [ ] **Step 4: Create `apps/dashboard/app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    "tollgate_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  );
  return response;
}
```

- [ ] **Step 5: Typecheck**

```bash
cd apps/dashboard && pnpm typecheck
```

Expected: No errors in the new route files.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/app/api/auth/
git commit -m "feat: add Google OAuth API routes (login, callback, session, logout)"
```

---

## Task 3: Update auth-client.ts

**Files:**
- Replace: `apps/dashboard/lib/auth-client.ts`

- [ ] **Step 1: Replace `apps/dashboard/lib/auth-client.ts` with simplified version**

```typescript
"use client";

import { useEffect, useState } from "react";
import type { SessionState, User } from "./types";

export function startGoogleLogin(): void {
  window.location.href = "/api/auth/login";
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    data: null,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          if (active) setState({ data: null, isPending: false, error: null });
          return;
        }
        const payload = (await res.json()) as {
          user: { email: string; name: string | null; picture: string | null };
        };
        const user: User = {
          email: payload.user.email,
          name: payload.user.name,
          image: payload.user.picture,
        };
        if (active) {
          setState({ data: { user, raw: payload as Record<string, unknown> }, isPending: false, error: null });
        }
      } catch (error) {
        if (active) {
          setState({
            data: null,
            isPending: false,
            error: error instanceof Error ? error : new Error("Session error"),
          });
        }
      }
    };

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/dashboard && pnpm typecheck
```

Expected: No errors. If anything imports `buildGoogleLoginUrl`, `buildDashboardUrl`, `getPostLoginOrigin`, `AUTH_FLOW_DEVICE`, or `AUTH_FLOW_QUERY_PARAM` from auth-client, it will fail — fix those imports now (they'll also be cleaned up in Task 5).

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/lib/auth-client.ts
git commit -m "feat: simplify auth-client to use local API routes"
```

---

## Task 4: Update auth-middleware.ts

**Files:**
- Replace: `apps/dashboard/lib/auth-middleware.ts`

- [ ] **Step 1: Replace `apps/dashboard/lib/auth-middleware.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";
import { verifyJwt } from "@/lib/auth-jwt";

function parseCookie(header: string, name: string): string | null {
  return (
    header
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

export async function getAccountId(
  request: NextRequest
): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = parseCookie(cookieHeader, "tollgate_session");
  if (!token) return null;

  const { env } = await getCloudflareContext();
  const sessionSecret = (env as Record<string, string>).SESSION_SECRET;
  if (!sessionSecret) return null;

  const payload = await verifyJwt(token, sessionSecret);
  return payload?.email ?? null;
}

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

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

- [ ] **Step 2: Typecheck**

```bash
cd apps/dashboard && pnpm typecheck
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/lib/auth-middleware.ts
git commit -m "feat: update auth-middleware to verify JWT directly from cookie"
```

---

## Task 5: Simplify auth-flow.ts, env.ts, and callback page

**Files:**
- Replace: `apps/dashboard/lib/auth-flow.ts`
- Replace: `apps/dashboard/lib/env.ts`
- Replace: `apps/dashboard/app/(public)/auth/callback/page.tsx`
- Modify: `apps/dashboard/app/(public)/login/page.tsx`

- [ ] **Step 1: Replace `apps/dashboard/lib/auth-flow.ts`**

```typescript
export const AUTH_CALLBACK_PATH = "/api/auth/callback";
export const AUTH_SUCCESS_PATH = "/dashboard";
export const AUTH_RETRY_PATH = "/login";
```

- [ ] **Step 2: Replace `apps/dashboard/lib/env.ts`**

```typescript
// No required public env vars remain after removing obul-accounts dependency.
// Server-side config (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET)
// is accessed via getCloudflareContext().env in API routes.
```

- [ ] **Step 3: Replace `apps/dashboard/app/(public)/auth/callback/page.tsx`**

The server route at `/api/auth/callback` now handles everything and redirects to `/dashboard` or `/login?error=auth_failed`. This client page is only reachable if someone navigates to `/auth/callback` directly. Make it a simple redirect.

```typescript
import { redirect } from "next/navigation";

export default function AuthCallbackPage() {
  redirect("/dashboard");
}
```

- [ ] **Step 4: Update `apps/dashboard/app/(public)/login/page.tsx`**

Remove: `AUTH_FLOW_DEVICE`, `AUTH_FLOW_QUERY_PARAM`, `buildDashboardUrl`, `getPostLoginOrigin`, device flow logic, `authFlow` state.
Add: error display when `?error=auth_failed` is in the URL.

Replace the file content with:

```typescript
"use client";

import { Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSession, startGoogleLogin } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const buttonClass =
  "group relative flex w-full items-center justify-center gap-3 overflow-hidden border border-[#d4c19a] bg-transparent px-12 py-4 text-xl font-semibold uppercase tracking-widest text-[#d4c19a] transition-all duration-500 hover:bg-[#d4c19a] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4c19a]" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);
  const hasError = searchParams.get("error") === "auth_failed";

  useEffect(() => {
    if (!isPending && session?.user) {
      window.location.replace("/dashboard");
    }
  }, [isPending, session]);

  const handleSignIn = () => {
    setLoading(true);
    startGoogleLogin();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute right-6 top-6 z-[200]">
        <ThemeToggle />
      </div>

      <div className="card-bracket w-full max-w-md bg-card/90 p-8 backdrop-blur-sm">
        <div className="bracket-bl" />
        <div className="bracket-br" />

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">LOGIN</h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Access your dashboard
          </p>
        </div>

        {hasError && (
          <p className="mt-6 text-center text-sm text-red-500">
            Sign-in failed. Please try again.
          </p>
        )}

        <div className="mt-10 space-y-4">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className={buttonClass}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-[#d4c19a] blur-xl opacity-50" />
            </div>
            <span className="relative z-10 flex items-center gap-3">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon className="h-5 w-5" />
              )}
              Sign in with Google
            </span>
            <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#d4c19a] group-hover:border-black transition-colors duration-300" />
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to Tollgate&apos;s usage policies and billing terms.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

```bash
cd apps/dashboard && pnpm typecheck
```

Expected: No errors. If any file still imports removed symbols from `auth-flow.ts` or `env.ts`, fix those imports now.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/lib/auth-flow.ts apps/dashboard/lib/env.ts
git add "apps/dashboard/app/(public)/auth/callback/page.tsx"
git add "apps/dashboard/app/(public)/login/page.tsx"
git commit -m "feat: remove obul-accounts URL builders, simplify login page"
```

---

## Task 6: Configuration

**Files:**
- Modify: `apps/dashboard/wrangler.toml`
- Create: `apps/dashboard/.dev.vars` (gitignored)
- Modify: `apps/dashboard/.env.local`

- [ ] **Step 1: Add `GOOGLE_CLIENT_ID` to `apps/dashboard/wrangler.toml`**

In the `[vars]` block (mainnet), add:
```toml
GOOGLE_CLIENT_ID = "<your-google-client-id>"
```

In the `[env.testnet.vars]` block, add the same:
```toml
GOOGLE_CLIENT_ID = "<your-google-client-id>"
```

The Client ID is public (it appears in the OAuth redirect URL), so it's safe in `wrangler.toml`.

- [ ] **Step 2: Check whether `apps/dashboard/.dev.vars` is gitignored**

```bash
cat apps/dashboard/.gitignore 2>/dev/null || cat .gitignore | grep dev.vars
```

If `.dev.vars` is not gitignored, add it:
```bash
echo ".dev.vars" >> apps/dashboard/.gitignore
```

- [ ] **Step 3: Create `apps/dashboard/.dev.vars`**

This file is loaded by `@opennextjs/cloudflare` in local dev (same as `wrangler dev --local`). Do NOT commit it.

```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
SESSION_SECRET=<your-session-secret-hex>
```

Generate `SESSION_SECRET` if needed: `openssl rand -hex 32`

- [ ] **Step 4: Update `apps/dashboard/.env.local`**

Remove `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_DEV_BYPASS_AUTH` (no longer used).

Final `.env.local` should contain only what's still used:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_AUTH_PROVIDERS=google
NEXT_PUBLIC_POSTHOG_KEY=
```

- [ ] **Step 5: Deploy Cloudflare secrets to mainnet**

```bash
cd apps/dashboard
npx wrangler secret put GOOGLE_CLIENT_SECRET
# Paste the client secret when prompted

npx wrangler secret put SESSION_SECRET
# Paste the generated hex when prompted
```

- [ ] **Step 6: Deploy Cloudflare secrets to testnet**

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET --env testnet
npx wrangler secret put SESSION_SECRET --env testnet
```

- [ ] **Step 7: Commit config changes**

```bash
git add apps/dashboard/wrangler.toml apps/dashboard/.env.local
git commit -m "feat: add GOOGLE_CLIENT_ID to wrangler config"
```

---

## Task 7: Build and deploy

- [ ] **Step 1: Build and deploy mainnet**

```bash
cd apps/dashboard
npx opennextjs-cloudflare build && npx wrangler deploy
```

Expected: Build completes without errors. Deployment URL printed.

- [ ] **Step 2: Build and deploy testnet**

```bash
npx opennextjs-cloudflare build && npx wrangler deploy --env testnet
```

- [ ] **Step 3: Verify login flow on production URL**

Open https://tollgate-dashboard.operations-4bf.workers.dev in an incognito window.

1. Visiting `/dashboard` should redirect to `/login` ✓
2. Click "Sign in with Google"
3. Should redirect to Google's OAuth consent screen ✓
4. After approving, should land on `/dashboard` ✓
5. Session persists on refresh ✓
6. Sidebar "Logout" clears session and redirects to `/login` ✓

- [ ] **Step 4: Verify error handling**

Visit `/login?error=auth_failed` directly — should show "Sign-in failed. Please try again." message.

- [ ] **Step 5: Commit any final tweaks**

```bash
git add -p  # stage only intentional changes
git commit -m "fix: <description of any tweaks>"
```

---

## Task 8: Local dev verification (optional)

Only needed if you want to test locally with real Google OAuth. If the dev bypass is sufficient for local work, skip this.

- [ ] **Step 1: Verify `.dev.vars` is in place**

```bash
cat apps/dashboard/.dev.vars
```

Should show `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`.

- [ ] **Step 2: Start local dev server**

```bash
pnpm dev:dashboard
```

- [ ] **Step 3: Test login at localhost:3000**

1. Visit http://localhost:3000/dashboard — should redirect to `/login`
2. Click "Sign in with Google"
3. Should redirect to Google (localhost must be in authorized JavaScript origins and redirect URIs in Google Cloud Console)
4. After approving, should land on http://localhost:3000/dashboard
