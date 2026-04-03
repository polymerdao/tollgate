import { RATE_LIMIT_WINDOW_S, RATE_LIMIT_MAX_REQUESTS } from "@tollgate/shared";
import type { Env } from "../env";

export async function isRateLimited(ip: string, domain: string, env: Env): Promise<boolean> {
  const key = `ratelimit:${ip}:${domain}`;
  const current = await env.KV.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= RATE_LIMIT_MAX_REQUESTS) return true;

  // Only set TTL on first write so the window doesn't slide forward
  const options = count === 0 ? { expirationTtl: RATE_LIMIT_WINDOW_S } : undefined;
  await env.KV.put(key, String(count + 1), options ?? {});
  return false;
}
