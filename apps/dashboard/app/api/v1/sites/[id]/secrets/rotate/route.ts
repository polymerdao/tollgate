import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";
import { SECRET_ROTATION_TTL_MS } from "@tollgate/shared";
import {
  getAccountId,
  verifySiteOwnership,
  unauthorized,
  forbidden,
} from "@/lib/auth-middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, id, db))) return forbidden();

  const site = await db
    .select()
    .from(sites)
    .where(eq(sites.id, id))
    .get();

  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newSecret = crypto.randomUUID();
  const now = new Date().toISOString();
  const prevExpiresAt = new Date(
    Date.now() + SECRET_ROTATION_TTL_MS
  ).toISOString();

  await db
    .update(sites)
    .set({
      originSecret: newSecret,
      originSecretPrev: site.originSecret,
      originSecretPrevExpiresAt: prevExpiresAt,
      updatedAt: now,
    })
    .where(eq(sites.id, id));

  return NextResponse.json({ secret: newSecret });
}
