import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq, gt, and, isNotNull, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { sites, balances, payouts, PAYOUT_THRESHOLD_MINOR } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getStripe } from "@/lib/stripe";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);
  const stripe = getStripe();

  const eligible = await db
    .select({
      siteId: balances.siteId,
      amount: balances.amount,
      stripeAccountId: sites.stripeAccountId,
    })
    .from(balances)
    .innerJoin(sites, eq(sites.id, balances.siteId))
    .where(
      and(
        gt(balances.amount, PAYOUT_THRESHOLD_MINOR),
        isNotNull(sites.stripeAccountId)
      )
    )
    .all();

  const results: { siteId: string; status: string; error?: string }[] = [];

  for (const entry of eligible) {
    const now = new Date().toISOString();
    const payoutId = ulid();
    const amountCents = Math.floor(entry.amount / 10000);
    const deductMinor = amountCents * 10000;

    try {
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: "usd",
        destination: entry.stripeAccountId!,
        metadata: { tollgate_site_id: entry.siteId, tollgate_payout_id: payoutId },
      });

      await db.batch([
        db.insert(payouts).values({
          id: payoutId,
          siteId: entry.siteId,
          amount: amountCents,
          stripePayoutId: transfer.id,
          status: "completed",
          createdAt: now,
        }),
        db
          .update(balances)
          .set({
            amount: sql`${balances.amount} - ${deductMinor}`,
            updatedAt: now,
          })
          .where(eq(balances.siteId, entry.siteId)),
      ]);

      results.push({ siteId: entry.siteId, status: "completed" });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      await db.insert(payouts).values({
        id: payoutId,
        siteId: entry.siteId,
        amount: amountCents,
        stripePayoutId: "failed",
        status: "failed",
        createdAt: now,
      });
      results.push({ siteId: entry.siteId, status: "failed", error });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
