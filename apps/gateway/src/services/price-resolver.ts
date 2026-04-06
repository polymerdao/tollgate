import type { SiteConfig } from "./site-config";

function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const withWildcards = escaped.replace(/\*/g, "[^/]*");
  return new RegExp(`^${withWildcards}$`);
}

function patternSpecificity(pattern: string): number {
  const segments = pattern.split("/").filter(Boolean);
  const wildcardCount = (pattern.match(/\*/g) || []).length;
  return segments.length * 10 - wildcardCount;
}

export function resolvePrice(path: string, config: SiteConfig): number {
  let bestPrice = config.defaultPrice;
  let bestScore = -1;

  for (const rule of config.pathPricingRules) {
    try {
      if (globToRegex(rule.pattern).test(path)) {
        const score = patternSpecificity(rule.pattern);
        if (score > bestScore) {
          bestScore = score;
          bestPrice = rule.price;
        }
      }
    } catch {
      // Skip invalid patterns
    }
  }

  return bestPrice;
}
