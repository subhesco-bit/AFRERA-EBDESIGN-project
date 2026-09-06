// Controller for Harvest Planning (M069)
const service = require('./service');
const { logger } = require('../../utils/logger');

// NOTE: `list` responds with `data` as the flat items array (not the
// {items, pagination} object listItems() returns internally). The
// frontend's ResourceManager component expects `res.data.data` to be an
// array it can call .map() on directly — several sibling modules built
// from this same template (M022, M055, M056, M007's listRoles, ...)
// instead nest under `data.items`, which breaks ResourceManager's rows
// rendering. Deviating here deliberately so M069Page.jsx actually works.
async function list(req, res) {
  try {
    const result = await service.listItems({ page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20 });
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (e) {
    logger.error('M069 list error', { error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
}

async function get(req, res) {
  try {
    const item = await service.getItem(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) {
    logger.error('M069 get error', { error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
}

async function create(req, res) {
  try {
    const payload = req.body || {};
    const item = await service.createItem(payload);
    res.status(201).json({ success: true, data: item });
  } catch (e) {
    logger.error('M069 create error', { error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
}

async function update(req, res) {
  try {
    const payload = req.body || {};
    const item = await service.updateItem(req.params.id, payload);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) {
    logger.error('M069 update error', { error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
}

async function remove(req, res) {
  try {
    const ok = await service.deleteItem(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    logger.error('M069 delete error', { error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = { list, get, create, update, remove };
