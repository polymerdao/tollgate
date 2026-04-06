import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { pathPricing, updatePathPricingSchema } from "@tollgate/shared";
import {
  getAccountId,
  verifySiteOwnership,
  unauthorized,
  forbidden,
} from "@/lib/auth-middleware";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, id, db))) return forbidden();

  const body = await request.json();
  const parsed = updatePathPricingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await db.delete(pathPricing).where(eq(pathPricing.siteId, id));

  if (parsed.data.entries.length > 0) {
    const now = new Date().toISOString();
    await db.insert(pathPricing).values(
      parsed.data.entries.map((entry) => ({
        id: ulid(),
        siteId: id,
        pattern: entry.pattern,
        price: entry.price,
        createdAt: now,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
