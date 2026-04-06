import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites, balances, botAllowlist, pathExclusions, pathPricing } from "@tollgate/shared";
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
    .from(sites)
    .leftJoin(balances, eq(sites.id, balances.siteId))
    .where(eq(sites.id, id))
    .all();

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const row = rows[0];

  const allowlist = await db
    .select()
    .from(botAllowlist)
    .where(eq(botAllowlist.siteId, id))
    .all();

  const exclusions = await db
    .select()
    .from(pathExclusions)
    .where(eq(pathExclusions.siteId, id))
    .all();

  const pricingRules = await db
    .select()
    .from(pathPricing)
    .where(eq(pathPricing.siteId, id))
    .all();

  return NextResponse.json({
    ...row.sites,
    balance: row.balances?.amount ?? 0,
    allowlist: allowlist.map((a) => a.userAgentPattern),
    exclusions: exclusions.map((e) => e.pattern),
    pathPricing: pricingRules.map((r) => ({ pattern: r.pattern, price: r.price })),
  });
}

export async function PATCH(
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
  const { payoutWalletAddress } = body;

  await db
    .update(sites)
    .set({ payoutWalletAddress: payoutWalletAddress ?? null, updatedAt: new Date().toISOString() })
    .where(eq(sites.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { id } = await params;
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, id, db))) return forbidden();

  await db.delete(sites).where(eq(sites.id, id));

  return NextResponse.json({ ok: true });
}
