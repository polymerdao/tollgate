import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, sql, gte } from "drizzle-orm";
import { payments } from "@tollgate/shared";
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

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Total revenue and payments (verified only)
  const totals = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      totalPayments: sql<number>`count(*)`,
    })
    .from(payments)
    .where(and(eq(payments.siteId, id), eq(payments.status, "verified")))
    .get();

  // Total attempts for success rate
  const allPayments = await db
    .select({ count: sql<number>`count(*)` })
    .from(payments)
    .where(eq(payments.siteId, id))
    .get();

  const totalAttempts = allPayments?.count ?? 0;
  const verifiedCount = totals?.totalPayments ?? 0;
  const successRate = totalAttempts > 0 ? verifiedCount / totalAttempts : 0;

  // Revenue by day (last 30 days, verified only)
  const revenueByDay = await db
    .select({
      date: sql<string>`date(${payments.createdAt})`,
      amount: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.siteId, id),
        eq(payments.status, "verified"),
        gte(payments.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`date(${payments.createdAt})`)
    .orderBy(sql`date(${payments.createdAt})`)
    .all();

  // Top pages by count (verified only)
  const topPages = await db
    .select({
      path: payments.path,
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(and(eq(payments.siteId, id), eq(payments.status, "verified")))
    .groupBy(payments.path)
    .orderBy(sql`count(*) desc`)
    .limit(10)
    .all();

  // Payments by bot user-agent (verified only)
  const paymentsByBot = await db
    .select({
      userAgent: sql<string>`coalesce(${payments.userAgent}, 'Unknown')`,
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${payments.amount}), 0)`,
    })
    .from(payments)
    .where(and(eq(payments.siteId, id), eq(payments.status, "verified")))
    .groupBy(payments.userAgent)
    .orderBy(sql`count(*) desc`)
    .limit(10)
    .all();

  return NextResponse.json({
    totalRevenue: totals?.totalRevenue ?? 0,
    totalPayments: verifiedCount,
    successRate,
    revenueByDay,
    topPages,
    paymentsByBot,
  });
}
