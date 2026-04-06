import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { payouts, balances, sites, PAYOUT_THRESHOLD_MINOR } from "@tollgate/shared";
import {
  getAccountId,
  verifySiteOwnership,
  unauthorized,
  forbidden,
} from "@/lib/auth-middleware";
import { getStripe } from "@/lib/stripe";

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

  const site = await db.select().from(sites).where(eq(sites.id, id)).get();
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!site.stripeAccountId) {
    return NextResponse.json({ error: "Stripe not connected" }, { status: 400 });
  }

  const balance = await db.select().from(balances).where(eq(balances.siteId, id)).get();
  const amount = balance?.amount ?? 0;

  if (amount <= PAYOUT_THRESHOLD_MINOR) {
    return NextResponse.json(
      { error: `Balance must exceed $10 to request a payout` },
      { status: 400 }
    );
  }

  const amountCents = Math.floor(amount / 10000);
  const deductMinor = amountCents * 10000;
  const payoutId = ulid();
  const now = new Date().toISOString();

  const stripe = getStripe();

  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: "usd",
      destination: site.stripeAccountId,
      metadata: { tollgate_site_id: id, tollgate_payout_id: payoutId },
    });

    await db.batch([
      db.insert(payouts).values({
        id: payoutId,
        siteId: id,
        amount: amountCents,
        stripePayoutId: transfer.id,
        status: "completed",
        createdAt: now,
      }),
      db
        .update(balances)
        .set({ amount: sql`${balances.amount} - ${deductMinor}`, updatedAt: now })
        .where(eq(balances.siteId, id)),
    ]);

    return NextResponse.json({ success: true, payoutId, amount: amountCents });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    await db.insert(payouts).values({
      id: payoutId,
      siteId: id,
      amount: amountCents,
      stripePayoutId: "failed",
      status: "failed",
      createdAt: now,
    });
    return NextResponse.json({ error }, { status: 500 });
  }
}
