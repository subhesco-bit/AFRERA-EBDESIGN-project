// Controller for User Management (M011)
// HTTP handlers mapping to the service layer
const { logger } = require('../../utils/logger');
const service = require('./service');

async function list(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await service.listUsers({ page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('list users error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function get(req, res) {
  try {
    const id = req.params.id;
    const user = await service.getUserById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('get user error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function create(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.email || !payload.password) return res.status(400).json({ success: false, error: 'email and password required' });
    const existing = await service.getUserByEmail(payload.email);
    if (existing) return res.status(409).json({ success: false, error: 'User already exists' });
    const user = await service.createUser(payload);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    logger.error('create user error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function update(req, res) {
  try {
    const id = req.params.id;
    const payload = req.body || {};
    const user = await service.updateUser(id, payload);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('update user error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function remove(req, res) {
  try {
    const id = req.params.id;
    const ok = await service.deleteUser(id);
    if (!ok) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true });
  } catch (error) {
    logger.error('delete user error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { list, get, create, update, remove };

