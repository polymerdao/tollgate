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

interface DnsAnswer {
  data: string;
}

interface DnsResponse {
  Answer?: DnsAnswer[];
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

  const site = await db
    .select()
    .from(sites)
    .where(eq(sites.id, id))
    .get();

  if (!site) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dnsUrl = `https://cloudflare-dns.com/dns-query?name=_tollgate.${site.domain}&type=TXT`;
  const dnsRes = await fetch(dnsUrl, {
    headers: { Accept: "application/dns-json" },
  });
  const dnsData = (await dnsRes.json()) as DnsResponse;

  const expectedToken = `tollgate-verify=${site.verificationToken}`;
  const found = dnsData.Answer?.some((a) => {
    // TXT records are often wrapped in quotes
    const cleaned = a.data.replace(/"/g, "");
    return cleaned === expectedToken;
  });

  if (!found) {
    return NextResponse.json({ verified: false });
  }

  const now = new Date().toISOString();
  await db
    .update(sites)
    .set({ verifiedAt: now, status: "active", updatedAt: now })
    .where(eq(sites.id, id));

  return NextResponse.json({ verified: true });
}
