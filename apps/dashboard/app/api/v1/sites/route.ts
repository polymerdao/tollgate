import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { sites, balances, createSiteSchema } from "@tollgate/shared";
import {
  getAccountId,
  unauthorized,
} from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  const rows = await db
    .select()
    .from(sites)
    .leftJoin(balances, eq(sites.id, balances.siteId))
    .where(eq(sites.accountId, accountId))
    .all();

  const result = rows.map((r) => ({
    ...r.sites,
    balance: r.balances?.amount ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const accountId = await getAccountId(request);
  if (!accountId) return unauthorized();

  const body = await request.json();
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  // Check domain uniqueness
  const existing = await db
    .select({ id: sites.id })
    .from(sites)
    .where(eq(sites.domain, parsed.data.domain))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Domain already registered" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const id = ulid();
  const verificationToken = crypto.randomUUID();

  const site = {
    id,
    accountId,
    domain: parsed.data.domain,
    status: "paused" as const,
    verificationToken,
    verifiedAt: null,
    stripeAccountId: null,
    defaultPrice: 1000, // $0.001 default
    originMethod: "secret_header" as const,
    originUrl: null,
    originSecret: null,
    originSecretPrev: null,
    originSecretPrevExpiresAt: null,
    gatewayConfigured: false,
    network: "base",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(sites).values(site);
  await db
    .insert(balances)
    .values({ siteId: id, amount: 0, updatedAt: now });

  return NextResponse.json(site, { status: 201 });
}
