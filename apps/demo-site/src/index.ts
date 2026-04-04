import { Hono } from "hono";

type Bindings = {
  ORIGIN_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Verify secret header on /api/* routes
app.use("/api/*", async (c, next) => {
  const secret = c.req.header("X-Obul-Secret");
  if (secret !== c.env.ORIGIN_SECRET) {
    return c.json({ error: "Unauthorized" }, 403);
  }
  return next();
});

// Landing page
app.get("/", (c) => {
  return c.html(landingPage());
});

// Premium article endpoint (what bots would pay for)
app.get("/api/article", (c) => {
  return c.json({
    title: "The Future of AI Agent Payments",
    author: "Tollgate Research",
    published: "2026-04-03",
    summary:
      "How x402 micropayments are enabling AI agents to autonomously access premium content across the web.",
    content: `
AI agents are increasingly capable of browsing the web, gathering information, and completing tasks autonomously. But they hit a wall when they encounter paywalled content — until now.

The x402 payment protocol introduces a machine-readable way for servers to request payment. When an AI agent receives an HTTP 402 response, it can read the payment terms, execute an on-chain USDC micropayment, and retry the request — all without human intervention.

This creates a new economic layer for the web:

1. **Publishers** can monetize AI traffic without friction. No API keys, no subscriptions — just set a price per request and let the protocol handle the rest.

2. **AI Agents** gain access to premium data sources that were previously locked behind human-oriented paywalls. A research agent can pay $0.01 to read a market report, synthesize it, and move on.

3. **The Web** evolves from a human-only economy to one where machines participate as paying consumers, creating new revenue streams for content creators.

Tollgate is the infrastructure layer that makes this possible. Publishers install a gateway in front of their content, configure pricing, and start earning from AI traffic immediately.

The future of the web isn't free — it's fairly priced, and machines can pay.
    `.trim(),
    tags: ["ai", "payments", "x402", "web3"],
    wordCount: 183,
  });
});

// Premium data endpoint
app.get("/api/market-data", (c) => {
  return c.json({
    report: "AI Infrastructure Market Q1 2026",
    generated: new Date().toISOString(),
    data: {
      totalMarketSize: "$847B",
      growthRate: "34.2% YoY",
      topSegments: [
        { name: "Cloud AI Services", share: "38%", growth: "+41%" },
        { name: "AI Chips & Hardware", share: "27%", growth: "+29%" },
        { name: "AI Agent Platforms", share: "18%", growth: "+67%" },
        { name: "AI Data & Training", share: "12%", growth: "+23%" },
        { name: "AI Payment Infrastructure", share: "5%", growth: "+112%" },
      ],
      keyInsight:
        "AI payment infrastructure is the fastest-growing segment, driven by the adoption of x402 and autonomous agent commerce.",
    },
  });
});

// Simple health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "tollgate-demo-site" });
});

function landingPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Research API — Tollgate Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Space Grotesk', system-ui, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
    .container {
      max-width: 640px;
      padding: 3rem 2rem;
      text-align: center;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #d4c19a;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #888;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 2.5rem;
    }
    .endpoints {
      text-align: left;
      margin: 2rem 0;
    }
    .endpoint {
      border: 1px solid #222;
      padding: 1.25rem;
      margin-bottom: 1rem;
      position: relative;
    }
    .endpoint::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 8px; height: 8px;
      border-top: 1px solid #d4c19a;
      border-left: 1px solid #d4c19a;
    }
    .endpoint::after {
      content: '';
      position: absolute;
      bottom: 0; right: 0;
      width: 8px; height: 8px;
      border-bottom: 1px solid #d4c19a;
      border-right: 1px solid #d4c19a;
    }
    .method {
      display: inline-block;
      background: #d4c19a;
      color: #0a0a0a;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      letter-spacing: 0.05em;
      margin-right: 0.5rem;
    }
    .path {
      font-family: monospace;
      color: #d4c19a;
      font-size: 0.95rem;
    }
    .desc {
      color: #888;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }
    .badge {
      display: inline-block;
      border: 1px solid #d4c19a;
      color: #d4c19a;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.1rem 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0.5rem;
    }
    .footer {
      margin-top: 2.5rem;
      color: #555;
      font-size: 0.75rem;
    }
    .footer a {
      color: #d4c19a;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Premium Research API</h1>
    <p class="subtitle">AI-ready content &bull; Protected by Tollgate</p>

    <div class="endpoints">
      <div class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/article</span>
        <p class="desc">Full-length research article on AI agent payments and the x402 protocol.</p>
        <span class="badge">$0.001 per request</span>
      </div>
      <div class="endpoint">
        <span class="method">GET</span>
        <span class="path">/api/market-data</span>
        <p class="desc">Live AI infrastructure market report with segment analysis and growth metrics.</p>
        <span class="badge">$0.005 per request</span>
      </div>
    </div>

    <p class="footer">
      Powered by <a href="https://tollgate.obul.ai">Tollgate</a> &mdash; x402 bot payment gateway
    </p>
  </div>
</body>
</html>`;
}

export default app;
