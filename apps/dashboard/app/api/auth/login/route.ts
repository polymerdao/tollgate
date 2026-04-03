import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const clientId = (env as unknown as Record<string, string>).GOOGLE_CLIENT_ID;

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
