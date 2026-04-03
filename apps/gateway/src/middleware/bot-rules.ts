import type { SiteConfig } from "../services/site-config";

export function isPathExcluded(path: string, config: SiteConfig): boolean {
  return config.exclusionPatterns.some((pattern) => {
    try { return new RegExp(pattern).test(path); } catch { return false; }
  });
}

export function isBotAllowlisted(userAgent: string | undefined, config: SiteConfig): boolean {
  if (!userAgent || config.allowlistPatterns.length === 0) return false;
  return config.allowlistPatterns.some((pattern) => {
    try { return new RegExp(pattern, "i").test(userAgent); } catch { return false; }
  });
}
