import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { sites, botAllowlist, pathExclusions, SITE_CACHE_TTL_S } from "@tollgate/shared";
import type { Env } from "../env";

export interface SiteConfig {
  id: string;
  domain: string;
  status: string;
  verifiedAt: string | null;
  defaultPrice: number;
  originMethod: string;
  originUrl: string | null;
  originSecret: string | null;
  originSecretPrev: string | null;
  originSecretPrevExpiresAt: string | null;
  network: string;
  allowlistPatterns: string[];
  exclusionPatterns: string[];
}

export async function getSiteConfig(
  domain: string,
  env: Env
): Promise<SiteConfig | null> {
  const cacheKey = `site:${domain}`;
  const cached = await env.KV.get(cacheKey, "json");
  if (cached) return cached as SiteConfig;

  const db = drizzle(env.DB);
  const site = await db.select().from(sites).where(eq(sites.domain, domain)).get();
  if (!site) return null;

  const allowlist = await db.select().from(botAllowlist).where(eq(botAllowlist.siteId, site.id)).all();
  const exclusions = await db.select().from(pathExclusions).where(eq(pathExclusions.siteId, site.id)).all();

  const config: SiteConfig = {
    id: site.id,
    domain: site.domain,
    status: site.status,
    verifiedAt: site.verifiedAt,
    defaultPrice: site.defaultPrice,
    originMethod: site.originMethod,
    originUrl: site.originUrl,
    originSecret: site.originSecret,
    originSecretPrev: site.originSecretPrev,
    originSecretPrevExpiresAt: site.originSecretPrevExpiresAt,
    network: site.network,
    allowlistPatterns: allowlist.map((a) => a.userAgentPattern),
    exclusionPatterns: exclusions.map((e) => e.pattern),
  };

  await env.KV.put(cacheKey, JSON.stringify(config), { expirationTtl: SITE_CACHE_TTL_S });
  return config;
}
