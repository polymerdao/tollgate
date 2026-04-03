import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAccountId, unauthorized, forbidden, verifySiteOwnership } from "@/lib/auth-middleware";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  if (!(await verifySiteOwnership(accountId, id, db))) return forbidden();

  const site = await db.select().from(sites).where(eq(sites.id, id)).get();
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stripe = getStripe();

  let stripeAccountId = site.stripeAccountId;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: { tollgate_site_id: id },
    });
    stripeAccountId = account.id;

    await db
      .update(sites)
      .set({ stripeAccountId, updatedAt: new Date().toISOString() })
      .where(eq(sites.id, id));
  }

  const origin = request.headers.get("origin") ?? "https://tollgate.obul.ai";
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/dashboard/sites/${id}/payouts?stripe=refresh`,
    return_url: `${origin}/dashboard/sites/${id}/payouts?stripe=complete`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
