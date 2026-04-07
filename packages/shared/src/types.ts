import type { InferSelectModel } from "drizzle-orm";
import type { sites, botAllowlist, pathExclusions, pathPricing, payments, balances, payouts } from "./schema";

export type Site = InferSelectModel<typeof sites>;
export type BotAllowlistEntry = InferSelectModel<typeof botAllowlist>;
export type PathExclusion = InferSelectModel<typeof pathExclusions>;
export type PathPricingRule = InferSelectModel<typeof pathPricing>;
export type Payment = InferSelectModel<typeof payments>;
export type Balance = InferSelectModel<typeof balances>;
export type Payout = InferSelectModel<typeof payouts>;

export type SiteStatus = "active" | "paused" | "suspended";
export type OriginMethod = "direct" | "ip_allowlist" | "secret_header" | "backend_api";
export type PaymentStatus = "pending" | "verified" | "expired" | "failed";
export type PayoutStatus = "pending" | "completed" | "failed";
