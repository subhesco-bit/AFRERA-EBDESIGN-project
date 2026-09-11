const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const {
  listDomains,
  getDomain,
  getActorTypes,
  getWorkflow,
  getCapabilityMatrix,
} = require('../../services/erp/unifiedERPRegistry');

// Compatibility CRUD store for legacy consumers. Domain capability APIs below
// are registry-backed and do not depend on this temporary compatibility store.
let _items = [];
let _nextId = 1;

// Canonical ERP capability discovery.
router.get('/capabilities', authMiddleware, (req, res) => {
  res.json({ success: true, data: getCapabilityMatrix() });
});

router.get('/domains', authMiddleware, (req, res) => {
  res.json({ success: true, data: listDomains() });
});

router.get('/domains/:id', authMiddleware, (req, res) => {
  const domain = getDomain(req.params.id);
  if (!domain) return res.status(404).json({ success: false, error: 'ERP domain not found' });
  res.json({ success: true, data: domain });
});

router.get('/actors/:economy', authMiddleware, (req, res) => {
  const actors = getActorTypes(req.params.economy);
  if (!actors.length) return res.status(404).json({ success: false, error: 'Economy actor set not found' });
  res.json({ success: true, data: { economy: req.params.economy, actors } });
});

router.get('/workflows/:id', authMiddleware, (req, res) => {
  const workflow = getWorkflow(req.params.id);
  if (!workflow) return res.status(404).json({ success: false, error: 'ERP workflow not found' });
  res.json({ success: true, data: workflow });
});

// Legacy generic ERP CRUD compatibility endpoints.
router.get('/', authMiddleware, (req, res) => {
  res.json({ success: true, data: _items });
});

router.get('/:id', authMiddleware, (req, res) => {
  const item = _items.find(i => String(i.id) === String(req.params.id));
  if (!item) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: item });
});

router.post('/', authMiddleware, (req, res) => {
  const item = {
    id: _nextId++,
    ...req.body,
    created_at: new Date().toISOString(),
  };
  _items.push(item);
  res.status(201).json({ success: true, data: item });
});

router.put('/:id', authMiddleware, (req, res) => {
  const idx = _items.findIndex(i => String(i.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  _items[idx] = { ..._items[idx], ...req.body, updated_at: new Date().toISOString() };
  res.json({ success: true, data: _items[idx] });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const idx = _items.findIndex(i => String(i.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  _items.splice(idx, 1);
  res.json({ success: true });
});

module.exports = router;
