/**
 * CRITICAL SERVICES ROUTES (30 endpoints)
 * Notifications + Payments + Logistics + Search + Audit
 */

import express from 'express';
import { NotificationService } from '../modules/notifications/NotificationService.js';
import { PaymentGateway } from '../modules/payments/PaymentGateway.js';
import { LogisticsService, SearchService, AuditService, createAuditMiddleware } from '../modules/critical/CriticalServices.js';

export function setupCriticalRoutes(app, database, elasticsearchClient) {
  const router = express.Router();

  // Initialize services
  const notif = new NotificationService(process.env, database);
  const payments = new PaymentGateway(process.env, database);
  const logistics = new LogisticsService(database);
  const search = new SearchService(elasticsearchClient, database);
  const audit = new AuditService(database);

  // UNIVERSAL AUDIT MIDDLEWARE
  router.use(createAuditMiddleware(audit));

  // ===== NOTIFICATIONS (7 endpoints) =====
  router.post('/notifications/send', async (req, res) => {
    const result = await notif.send(req.body);
    res.json({ success: true, result });
  });

  router.post('/notifications/preferences', async (req, res) => {
    await database.query(
      `INSERT INTO notification_preferences (user_id, notification_type, enabled_channels)
       VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE enabled_channels = ?`,
      [req.user.id, req.body.type, req.body.channels, req.body.channels]
    );
    res.json({ success: true });
  });

  router.get('/notifications/preferences/:type', async (req, res) => {
    const prefs = await database.query(
      `SELECT * FROM notification_preferences WHERE user_id = ? AND notification_type = ?`,
      [req.user.id, req.params.type]
    );
    res.json(prefs[0] || {});
  });

  router.get('/notifications/history', async (req, res) => {
    const history = await database.query(
      `SELECT * FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [req.user.id, req.query.limit || 50]
    );
    res.json({ count: history.length, history });
  });

  router.post('/notifications/batch-send', async (req, res) => {
    const results = await Promise.all(
      req.body.notifications.map(n => notif.send(n))
    );
    res.json({ success: true, sent: results.length });
  });

  router.put('/notifications/:id/read', async (req, res) => {
    await database.query(
      `UPDATE notifications SET read_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    res.json({ success: true });
  });

  router.delete('/notifications/:id', async (req, res) => {
    await database.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  });

  // ===== PAYMENTS (6 endpoints) =====
  router.post('/payments/charge', async (req, res) => {
    const result = await payments.processPayment(req.body.order);
    res.json({ success: result.status === 'SUCCESS', result });
  });

  router.post('/payments/refund', async (req, res) => {
    const result = await payments.refund(req.body.transactionId, req.body.amount);
    res.json({ success: true, result });
  });

  router.get('/payments/balance', async (req, res) => {
    const balance = await payments.getBalance();
    res.json(balance);
  });

  router.get('/payments/transactions', async (req, res) => {
    const txns = await database.query(
      `SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 100`
    );
    res.json({ count: txns.length, transactions: txns });
  });

  router.post('/payments/webhook/stripe', async (req, res) => {
    // Stripe webhook handler
    res.json({ received: true });
  });

  router.post('/payments/webhook/razorpay', async (req, res) => {
    // Razorpay webhook handler
    res.json({ received: true });
  });

  // ===== LOGISTICS (6 endpoints) =====
  router.post('/logistics/optimize-route', async (req, res) => {
    const optimized = await logistics.optimizeRoute(req.body.deliveries);
    res.json({ success: true, optimized });
  });

  router.post('/logistics/create-shipment', async (req, res) => {
    const shipmentId = await database.query(
      `INSERT INTO shipments (order_id, status, origin, destination, data)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [req.body.orderId, 'CREATED', JSON.stringify(req.body.origin),
       JSON.stringify(req.body.destination), JSON.stringify(req.body)]
    );
    res.json({ success: true, shipmentId });
  });

  router.get('/logistics/track/:shipmentId', async (req, res) => {
    const tracking = await logistics.trackShipment(req.params.shipmentId);
    res.json({ shipmentId: req.params.shipmentId, tracking });
  });

  router.put('/logistics/update-tracking', async (req, res) => {
    await logistics.updateShipment(req.body.shipmentId, req.body.location, req.body.status);
    res.json({ success: true });
  });

  router.get('/logistics/shipments', async (req, res) => {
    const shipments = await database.query(
      `SELECT * FROM shipments WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ count: shipments.length, shipments });
  });

  router.post('/logistics/bulk-optimize', async (req, res) => {
    const results = await Promise.all(
      req.body.deliveryBatches.map(batch => logistics.optimizeRoute(batch))
    );
    res.json({ success: true, optimizedRoutes: results });
  });

  // ===== SEARCH (6 endpoints) =====
  router.post('/search/query', async (req, res) => {
    const results = await search.search(req.body.query, req.body.filters);
    res.json({ count: results.length, results });
  });

  router.get('/search/suggestions', async (req, res) => {
    const suggestions = await search.getSuggestions(req.query.prefix);
    res.json({ suggestions });
  });

  router.post('/search/save', async (req, res) => {
    await search.saveSearch(req.user.id, req.body.query);
    res.json({ success: true });
  });

  router.get('/search/recent', async (req, res) => {
    const recent = await search.getRecentSearches(req.user.id);
    res.json({ recent });
  });

  router.post('/search/filter', async (req, res) => {
    const results = await search.search('*', req.body.filters);
    res.json({ count: results.length, results });
  });

  router.post('/search/advanced', async (req, res) => {
    const results = await search.search(req.body.query, {
      priceMin: req.body.priceMin,
      priceMax: req.body.priceMax,
      category: req.body.category,
      minRating: req.body.minRating
    });
    res.json({ count: results.length, results });
  });

  // ===== AUDIT (5 endpoints) =====
  router.get('/audit/logs', async (req, res) => {
    const logs = await database.query(
      `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100`
    );
    res.json({ count: logs.length, logs });
  });

  router.get('/audit/trail/:resource/:recordId', async (req, res) => {
    const trail = await audit.getAuditTrail(req.params.resource, req.params.recordId);
    res.json({ count: trail.length, trail });
  });

  router.get('/audit/user/:userId', async (req, res) => {
    const logs = await database.query(
      `SELECT * FROM audit_logs WHERE user_id = ?
       ORDER BY timestamp DESC LIMIT 50`,
      [req.params.userId]
    );
    res.json({ count: logs.length, logs });
  });

  router.get('/audit/compliance-report', async (req, res) => {
    const report = await audit.generateComplianceReport(
      req.query.startDate,
      req.query.endDate
    );
    res.json(report);
  });

  router.post('/audit/export', async (req, res) => {
    const logs = await database.query(
      `SELECT * FROM audit_logs WHERE timestamp BETWEEN ? AND ?`,
      [req.body.startDate, req.body.endDate]
    );
    res.json({ totalRecords: logs.length, format: 'JSON', data: logs });
  });

  app.use('/api/v1/critical', router);
  return router;
}

export default setupCriticalRoutes;
