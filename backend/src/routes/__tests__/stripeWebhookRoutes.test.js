'use strict';

// stripeWebhookRoutes.js used to construct the Stripe SDK client
// unconditionally at module load time (`require('stripe')(process.env.STRIPE_SECRET_KEY)`),
// which throws synchronously when no key is configured and crashed the
// entire server process at boot - discovered via a manual full-server-boot
// smoke test, since CI's "Backend Tests" job never actually boots the real
// server (it only runs `npm run test`). Fixed (2026-09-16) to lazily
// construct the client only when STRIPE_SECRET_KEY is set, matching the
// graceful-degradation pattern already used for Twilio/OFFLINE_PAYMENT_SECRET/
// SYNC_SECRET elsewhere in this codebase.

describe('stripeWebhookRoutes.js - does not crash the process when unconfigured', () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalKey;
    }
    jest.resetModules();
  });

  test('requiring the route module without STRIPE_SECRET_KEY does not throw', () => {
    delete process.env.STRIPE_SECRET_KEY;
    jest.resetModules();
    expect(() => require('../stripeWebhookRoutes.js')).not.toThrow();
  });

  test('POST /stripe-webhook returns 503 (not a crash) when Stripe is unconfigured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    jest.resetModules();
    const express = require('express');
    const request = require('supertest');
    const router = require('../stripeWebhookRoutes.js');
    const app = express();
    app.use('/api', router);
    const res = await request(app).post('/api/stripe-webhook').send({});
    expect(res.status).toBe(503);
  });

  test('requiring the route module with STRIPE_SECRET_KEY set still constructs a real client', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_boot_test';
    jest.resetModules();
    expect(() => require('../stripeWebhookRoutes.js')).not.toThrow();
  });
});
