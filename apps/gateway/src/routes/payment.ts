import { Hono } from "hono";
import { ulid } from "ulid";
import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { payments, balances, PAYMENT_ID_TTL_MS } from "@tollgate/shared";
import { verifyPayment } from "@tollgate/x402";
import type { Env } from "../env";
import { getSiteConfig } from "../services/site-config";
import { isPathExcluded, isBotAllowlisted } from "../middleware/bot-rules";
import { isRateLimited } from "../middleware/rate-limit";
import { fetchOriginContent } from "../services/origin";
import { resolvePrice } from "../services/price-resolver";

const payment = new Hono<{ Bindings: Env }>();

payment.all("/*", async (c) => {
  const host = c.req.header("host") ?? "";
  const domain = host.replace(/^pay\./, "");
  const path = new URL(c.req.url).pathname;
  const userAgent = c.req.header("user-agent");
  const clientIp = c.req.header("cf-connecting-ip") ?? "unknown";

  // 1. Lookup site config
  const config = await getSiteConfig(domain, c.env);
  if (!config || !config.verifiedAt) {
    return c.json({ error: "Site not found" }, 404);
  }
  if (config.status !== "active") {
    return c.json({ error: "Site not active" }, 403);
  }

  // 2. Check path exclusions
  if (isPathExcluded(path, config)) {
    return c.json({ error: "Path excluded" }, 403);
  }

  // 3. Check bot allowlist — serve free if matched
  if (isBotAllowlisted(userAgent, config)) {
    try {
      const origin = await fetchOriginContent(path, config);
      return new Response(origin.body, { status: origin.status, headers: origin.headers });
    } catch {
      return c.json({ error: "Origin fetch failed" }, 502);
    }
  }

  // 4. Rate limit
  if (await isRateLimited(clientIp, domain, c.env)) {
    return c.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  // 5. Check for payment proof
  const txHash = c.req.header("x-payment-proof");
  const paymentIdHeader = c.req.header("x-payment-id");
  const chainHeader = c.req.header("x-payment-chain");

  if (!txHash || !paymentIdHeader) {
    const price = resolvePrice(path, config);
    const paymentId = ulid();
    const expiresAt = new Date(Date.now() + PAYMENT_ID_TTL_MS).toISOString();

    await c.env.KV.put(
      `payment:${paymentId}`,
      JSON.stringify({ siteId: config.id, price, path }),
      { expirationTtl: PAYMENT_ID_TTL_MS / 1000 }
    );

    return c.json({
      price: (price / 1_000_000).toString(),
      currency: "USDC",
      network: config.network,
      recipientAddress: c.env.TOLLGATE_WALLET_ADDRESS,
      paymentId,
      expiresAt,
      contentUrl: `https://${host}${path}`,
    }, 402);
  }

  // 6. Validate payment proof
  const kvKey = `payment:${paymentIdHeader}`;
  const paymentData = await c.env.KV.get(kvKey, "json") as {
    siteId: string; price: number; path: string;
  } | null;

  if (!paymentData) {
    return c.json({ error: "Payment ID expired or invalid" }, 408);
  }

  if (paymentData.siteId !== config.id || paymentData.path !== path) {
    return c.json({ error: "Payment ID does not match this request" }, 400);
  }

  if (chainHeader && chainHeader !== "base") {
    return c.json({ error: "Unsupported chain" }, 400);
  }

  const db = drizzle(c.env.DB);
  const existingPayment = await db.select({ id: payments.id }).from(payments).where(eq(payments.txHash, txHash)).get();

  if (existingPayment) {
    return c.json({ error: "Transaction already used" }, 400);
  }

  const verification = await verifyPayment(
    txHash as `0x${string}`,
    c.env.TOLLGATE_WALLET_ADDRESS,
    paymentData.price,
    c.env.BASE_RPC_URL,
    c.env.USDC_ADDRESS
  );

  const now = new Date().toISOString();
  const recordId = ulid();

  if (!verification.valid) {
    await db.insert(payments).values({
      id: recordId, siteId: paymentData.siteId, paymentId: paymentIdHeader,
      txHash, payerAddress: verification.from || null, amount: paymentData.price,
      path: paymentData.path, status: "failed", userAgent: userAgent ?? null, createdAt: now,
    });
    return c.json({ error: verification.error ?? "Payment verification failed" }, 400);
  }

  // Consume payment ID after successful verification (so bot can retry if RPC fails)
  await c.env.KV.delete(kvKey);

  // 7. Record verified payment + increment balance
  await db.batch([
    db.insert(payments).values({
      id: recordId, siteId: paymentData.siteId, paymentId: paymentIdHeader,
      txHash, payerAddress: verification.from, amount: paymentData.price,
      path: paymentData.path, status: "verified", userAgent: userAgent ?? null,
      createdAt: now, verifiedAt: now,
    }),
    db.insert(balances).values({
      siteId: paymentData.siteId, amount: paymentData.price, updatedAt: now,
    }).onConflictDoUpdate({
      target: balances.siteId,
      set: { amount: sql`${balances.amount} + ${paymentData.price}`, updatedAt: now },
    }),
  ]);

  // 8. Fetch and return origin content
  try {
    const origin = await fetchOriginContent(paymentData.path, config);
    const headers = new Headers(origin.headers);
    headers.set("Cache-Control", "no-store, private");
    return new Response(origin.body, { status: origin.status, headers });
  } catch {
    return c.json({ error: "Origin fetch failed" }, 502);
  }
});

export { payment };
