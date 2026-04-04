import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites } from "@tollgate/shared";
import {
  getAccountId,
  verifySiteOwnership,
  unauthorized,
  forbidden,
} from "@/lib/auth-middleware";

const GATEWAY_HOSTS = [
  "gw.obul.ai",
  "tollgate-gateway.operations-4bf.workers.dev",
  "tollgate-gateway-testnet.operations-4bf.workers.dev",
];

async function verifyCname(domain: string): Promise<{ verified: boolean; target?: string }> {
  const hostname = `pay.${domain}`;
  const url = `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=CNAME`;
  const res = await fetch(url);
  if (!res.ok) return { verified: false };

  const data = (await res.json()) as { Answer?: { type: number; data: string }[] };
  const cnameRecord = data.Answer?.find((r) => r.type === 5);
  if (!cnameRecord) return { verified: false };

  const target = cnameRecord.data.replace(/\.$/, "");
  const verified = GATEWAY_HOSTS.some(
    (h) => target === h || target.endsWith(`.${h}`)
  );
  return { verified, target };
}

// POST — verify CNAME and mark gateway configured
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

  const site = await db.select({ domain: sites.domain }).from(sites).where(eq(sites.id, id)).get();
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await verifyCname(site.domain);
  if (!result.verified) {
    return NextResponse.json(
      {
        verified: false,
        error: result.target
          ? `CNAME points to ${result.target}, expected a Tollgate gateway`
          : `No CNAME record found for pay.${site.domain}`,
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  await db
    .update(sites)
    .set({ gatewayConfigured: true, updatedAt: now })
    .where(eq(sites.id, id));

  return NextResponse.json({ verified: true, target: result.target });
}
