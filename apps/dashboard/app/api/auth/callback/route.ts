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
  const cfEnv = env as unknown as Record<string, string>;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const origin = new URL(request.url).origin;
  const loginErrorUrl = `${origin}/login?error=auth_failed`;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const stateCookie = parseCookie(cookieHeader, "tollgate_oauth_state");

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return NextResponse.redirect(loginErrorUrl, {
      headers: { "Set-Cookie": clearStateCookie() },
    });
  }

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
