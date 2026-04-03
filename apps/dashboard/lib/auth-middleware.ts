import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
const DEV_ACCOUNT_ID = "dev-account-001";

export async function getAccountId(
  request: NextRequest
): Promise<string | null> {
  if (DEV_BYPASS_AUTH) return DEV_ACCOUNT_ID;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) return null;

  const cookie = request.headers.get("cookie") ?? "";

  try {
    const res = await fetch(`${apiBaseUrl}/auth/session`, {
      headers: { cookie },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.sub ?? data?.user?.sub ?? null;
  } catch {
    return null;
  }
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
