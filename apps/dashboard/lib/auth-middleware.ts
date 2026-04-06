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
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return "dev-account-001";
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = parseCookie(cookieHeader, "tollgate_session");
  if (!token) return null;

  const { env } = await getCloudflareContext();
  const sessionSecret = (env as unknown as Record<string, string>).SESSION_SECRET;
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
