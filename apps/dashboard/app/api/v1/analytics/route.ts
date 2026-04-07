import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, sql, gte, inArray } from "drizzle-orm";
import { payments, sites } from "@tollgate/shared";
import { getAccountId, unauthorized } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  const accountSites = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.accountId, accountId))
    .all();

  if (accountSites.length === 0) {
    return NextResponse.json({
      totalRevenue: 0,
      totalPayments: 0,
      totalAttempts: 0,
      successRate: 0,
      revenueByDay: [],
      topBots: [],
    });
  }

  const siteIds = accountSites.map((s) => s.id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totals, allAttempts, revenueByDay, topBots] = await Promise.all([
    db
      .select({
        totalRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
        totalPayments: sql<number>`count(*)`,
      })
      .from(payments)
      .where(and(inArray(payments.siteId, siteIds), eq(payments.status, "verified")))
      .get(),

    db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(inArray(payments.siteId, siteIds))
      .get(),

    db
      .select({
        date: sql<string>`date(${payments.createdAt})`,
        amount: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          inArray(payments.siteId, siteIds),
          eq(payments.status, "verified"),
          gte(payments.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`date(${payments.createdAt})`)
      .orderBy(sql`date(${payments.createdAt})`)
      .all(),

    db
      .select({
        userAgent: sql<string>`coalesce(${payments.userAgent}, 'Unknown')`,
        count: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(and(inArray(payments.siteId, siteIds), eq(payments.status, "verified")))
      .groupBy(payments.userAgent)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  ]);

  const totalAttempts = allAttempts?.count ?? 0;
  const verifiedCount = totals?.totalPayments ?? 0;

  return NextResponse.json({
    totalRevenue: totals?.totalRevenue ?? 0,
    totalPayments: verifiedCount,
    totalAttempts,
    successRate: totalAttempts > 0 ? verifiedCount / totalAttempts : 0,
    revenueByDay,
    topBots,
  });
}
