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
  const cfEnv = env as unknown as Record<string, string>;

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
