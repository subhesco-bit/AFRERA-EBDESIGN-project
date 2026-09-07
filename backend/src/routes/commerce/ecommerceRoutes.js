const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');

// ecommerceRoutes — minimal in-memory CRUD scaffold.
let _items = [];
let _nextId = 1;

router.get('/', (req, res) => {
  res.json({ success: true, data: _items });
});

router.get('/:id', (req, res) => {
  const item = _items.find(i => String(i.id) === String(req.params.id));
  if (!item) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: item });
});

router.post('/', authMiddleware, (req, res) => {
  const item = { id: _nextId++, ...req.body, created_at: new Date().toISOString() };
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
