import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { botAllowlist, updateAllowlistSchema } from "@tollgate/shared";
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
  const parsed = updateAllowlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Delete all existing entries for this site
  await db.delete(botAllowlist).where(eq(botAllowlist.siteId, id));

  // Insert new entries
  if (parsed.data.entries.length > 0) {
    await db.insert(botAllowlist).values(
      parsed.data.entries.map((entry) => ({
        id: ulid(),
        siteId: id,
        userAgentPattern: entry.userAgentPattern,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
