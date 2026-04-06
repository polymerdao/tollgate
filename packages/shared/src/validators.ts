import { z } from "zod";

const safeRegex = (val: string) => {
  try {
    new RegExp(val);
    if (/(\.\*){3,}/.test(val) || /(\([^)]*\+\)){2,}/.test(val)) return false;
    return true;
  } catch {
    return false;
  }
};

export const createSiteSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i, "Invalid domain"),
});

export const updatePricingSchema = z.object({
  defaultPrice: z.number().int().min(1, "Price must be at least 1 minor unit"),
});

export const updateOriginSchema = z.object({
  originMethod: z.enum(["ip_allowlist", "secret_header", "backend_api"]),
  originUrl: z.string().url().optional(),
  originSecret: z.string().min(16).max(256).optional(),
});

export const updateAllowlistSchema = z.object({
  entries: z.array(
    z.object({
      userAgentPattern: z.string().min(1).max(256).refine(safeRegex, "Invalid or unsafe regex"),
    })
  ),
});

export const updateExclusionsSchema = z.object({
  entries: z.array(
    z.object({
      pattern: z.string().min(1).max(256).refine(safeRegex, "Invalid or unsafe regex"),
    })
  ),
});

const safeGlobPattern = (val: string) => {
  if (!val.startsWith("/")) return false;
  return /^[a-zA-Z0-9/_.*-]+$/.test(val);
};

export const updatePathPricingSchema = z.object({
  entries: z.array(
    z.object({
      pattern: z.string().min(1).max(256).refine(safeGlobPattern, "Pattern must start with / and use * for wildcards"),
      price: z.number().int().min(1, "Price must be at least 1 minor unit"),
    })
  ).max(50, "Maximum 50 path pricing rules"),
});
