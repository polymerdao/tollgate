import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  domain: text("domain").notNull().unique(),
  status: text("status", { enum: ["active", "paused", "suspended"] }).notNull().default("active"),
  verificationToken: text("verification_token").notNull(),
  verifiedAt: text("verified_at"),
  stripeAccountId: text("stripe_account_id"),
  payoutWalletAddress: text("payout_wallet_address"),
  defaultPrice: integer("default_price").notNull(),
  originMethod: text("origin_method", {
    enum: ["ip_allowlist", "secret_header", "backend_api"],
  }).notNull(),
  originUrl: text("origin_url"),
  originSecret: text("origin_secret"),
  originSecretPrev: text("origin_secret_prev"),
  originSecretPrevExpiresAt: text("origin_secret_prev_expires_at"),
  gatewayConfigured: integer("gateway_configured", { mode: "boolean" }).notNull().default(false),
  network: text("network").notNull().default("base"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const botAllowlist = sqliteTable("bot_allowlist", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  userAgentPattern: text("user_agent_pattern").notNull(),
});

export const pathExclusions = sqliteTable("path_exclusions", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  pattern: text("pattern").notNull(),
});

export const pathPricing = sqliteTable("path_pricing", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  pattern: text("pattern").notNull(),
  price: integer("price").notNull(),
  createdAt: text("created_at").notNull(),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  paymentId: text("payment_id").notNull().unique(),
  txHash: text("tx_hash").unique(),
  payerAddress: text("payer_address"),
  amount: integer("amount").notNull(),
  path: text("path").notNull(),
  status: text("status", {
    enum: ["pending", "verified", "expired", "failed"],
  }).notNull().default("pending"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull(),
  verifiedAt: text("verified_at"),
});

export const balances = sqliteTable("balances", {
  siteId: text("site_id").primaryKey().references(() => sites.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const payouts = sqliteTable("payouts", {
  id: text("id").primaryKey(),
  siteId: text("site_id").notNull().references(() => sites.id),
  amount: integer("amount").notNull(),
  stripePayoutId: text("stripe_payout_id").notNull(),
  status: text("status", {
    enum: ["pending", "completed", "failed"],
  }).notNull().default("pending"),
  createdAt: text("created_at").notNull(),
});
