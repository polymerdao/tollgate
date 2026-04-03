import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { payouts } from "@tollgate/shared";
import {
  getAccountId,
  verifySiteOwnership,
  unauthorized,
  forbidden,
} from "@/lib/auth-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, id, db))) return forbidden();

  const rows = await db
    .select()
    .from(payouts)
    .where(eq(payouts.siteId, id))
    .all();

  return NextResponse.json(rows);
}
