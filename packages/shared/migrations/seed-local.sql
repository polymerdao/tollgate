-- Seed data for local development
-- Run: cd apps/gateway && npx wrangler d1 execute tollgate --file=../../packages/shared/migrations/seed-local.sql --local

INSERT INTO sites (
  id, account_id, domain, status, verification_token, verified_at,
  stripe_account_id, default_price, origin_method, origin_url,
  origin_secret, origin_secret_prev, origin_secret_prev_expires_at,
  network, created_at, updated_at
) VALUES (
  '01JQTEST000000000000000001',
  'dev-account-001',
  'localhost:8787',
  'active',
  'tg_test_token_123',
  '2026-04-03T00:00:00.000Z',
  NULL,
  10000,  -- $0.01 USDC
  'backend_api',
  'https://example.com',
  NULL, NULL, NULL,
  'base',
  '2026-04-03T00:00:00.000Z',
  '2026-04-03T00:00:00.000Z'
);

INSERT INTO balances (site_id, amount, updated_at)
VALUES ('01JQTEST000000000000000001', 0, '2026-04-03T00:00:00.000Z');

-- A second test site for the dashboard (simulates pay.example.com → example.com)
INSERT INTO sites (
  id, account_id, domain, status, verification_token, verified_at,
  stripe_account_id, default_price, origin_method, origin_url,
  origin_secret, origin_secret_prev, origin_secret_prev_expires_at,
  network, created_at, updated_at
) VALUES (
  '01JQTEST000000000000000002',
  'dev-account-001',
  'example.com',
  'active',
  'tg_test_token_456',
  '2026-04-03T00:00:00.000Z',
  NULL,
  50000,  -- $0.05 USDC
  'secret_header',
  NULL,
  'test-secret-header-value-1234567890',
  NULL, NULL,
  'base',
  '2026-04-03T00:00:00.000Z',
  '2026-04-03T00:00:00.000Z'
);

INSERT INTO balances (site_id, amount, updated_at)
VALUES ('01JQTEST000000000000000002', 5230000, '2026-04-03T00:00:00.000Z');

-- Sample bot allowlist entry
INSERT INTO bot_allowlist (id, site_id, user_agent_pattern)
VALUES ('01JQTEST000000000000000010', '01JQTEST000000000000000002', 'Googlebot');

-- Sample path exclusion
INSERT INTO path_exclusions (id, site_id, pattern)
VALUES ('01JQTEST000000000000000020', '01JQTEST000000000000000002', '/admin.*');

-- Sample verified payments for analytics
INSERT INTO payments (id, site_id, payment_id, tx_hash, payer_address, amount, path, status, user_agent, created_at, verified_at)
VALUES
  ('01JQPAY0000000000000000001', '01JQTEST000000000000000002', 'pay_001', '0xabc1', '0xbot1', 50000, '/article/ai-trends', 'verified', 'GPTBot/1.0', '2026-04-01T10:00:00.000Z', '2026-04-01T10:00:02.000Z'),
  ('01JQPAY0000000000000000002', '01JQTEST000000000000000002', 'pay_002', '0xabc2', '0xbot1', 50000, '/article/ai-trends', 'verified', 'GPTBot/1.0', '2026-04-01T14:00:00.000Z', '2026-04-01T14:00:03.000Z'),
  ('01JQPAY0000000000000000003', '01JQTEST000000000000000002', 'pay_003', '0xabc3', '0xbot2', 50000, '/article/web3-payments', 'verified', 'ClaudeBot/1.0', '2026-04-02T09:00:00.000Z', '2026-04-02T09:00:01.000Z'),
  ('01JQPAY0000000000000000004', '01JQTEST000000000000000002', 'pay_004', '0xabc4', '0xbot1', 50000, '/article/web3-payments', 'verified', 'GPTBot/1.0', '2026-04-02T11:00:00.000Z', '2026-04-02T11:00:02.000Z'),
  ('01JQPAY0000000000000000005', '01JQTEST000000000000000002', 'pay_005', '0xabc5', '0xbot3', 50000, '/docs/getting-started', 'verified', 'PerplexityBot/1.0', '2026-04-03T08:00:00.000Z', '2026-04-03T08:00:01.000Z'),
  ('01JQPAY0000000000000000006', '01JQTEST000000000000000002', 'pay_006', NULL, NULL, 50000, '/article/ai-trends', 'failed', 'UnknownBot/1.0', '2026-04-03T09:00:00.000Z', NULL),
  ('01JQPAY0000000000000000007', '01JQTEST000000000000000002', 'pay_007', '0xabc7', '0xbot2', 50000, '/docs/api-reference', 'verified', 'ClaudeBot/1.0', '2026-04-03T12:00:00.000Z', '2026-04-03T12:00:02.000Z');
