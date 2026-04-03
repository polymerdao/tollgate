import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sites } from "@tollgate/shared";
import {
  getAccountId,
  verifySiteOwnership,
  unauthorized,
  forbidden,
} from "@/lib/auth-middleware";

const updateStatusSchema = z.object({
  status: z.enum(["active", "paused"]),
});

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
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // If trying to activate, require verification
  if (parsed.data.status === "active") {
    const site = await db
      .select({ verifiedAt: sites.verifiedAt })
      .from(sites)
      .where(eq(sites.id, id))
      .get();

    if (!site?.verifiedAt) {
      return NextResponse.json(
        { error: "Site must be verified before activating" },
        { status: 400 }
      );
    }
  }

  const now = new Date().toISOString();
  await db
    .update(sites)
    .set({ status: parsed.data.status, updatedAt: now })
    .where(eq(sites.id, id));

  const updated = await db
    .select()
    .from(sites)
    .where(eq(sites.id, id))
    .get();

  return NextResponse.json(updated);
}
