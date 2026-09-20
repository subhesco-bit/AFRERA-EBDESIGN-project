// Controller for M013 Module (M013)
const logger = require('../../utils/logger').logger || console;
const service = require('./service');

// Was service.listItems/getItem/createItem/updateItem/deleteItem - a generic
// CRUD-template naming that this service (a real, class-based authorization/
// permission service) never exported. Corrected to the real exported names.
async function list(req, res) { try { const result = await service.listAuthorizations({ page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20 }); res.json({ success: true, data: result }); } catch (e) { logger.error('list error', e); res.status(500).json({ success:false, error: e.message }); } }
async function get(req, res) { try { const item = await service.getAuthorization(req.params.id); if (!item) return res.status(404).json({ success:false, error:'Not found' }); res.json({ success:true, data:item }); } catch (e) { logger.error('get error', e); res.status(500).json({ success:false, error:e.message }); } }
async function create(req, res) { try { const payload = req.body || {}; const item = await service.createAuthorization(payload); res.status(201).json({ success:true, data:item }); } catch (e) { logger.error('create error', e); res.status(500).json({ success:false, error:e.message }); } }
async function update(req, res) { try { const payload = req.body || {}; const item = await service.updateAuthorization(req.params.id, payload); if (!item) return res.status(404).json({ success:false, error:'Not found' }); res.json({ success:true, data:item }); } catch (e) { logger.error('update error', e); res.status(500).json({ success:false, error:e.message }); } }
async function remove(req, res) { try { const ok = await service.deleteAuthorization(req.params.id); if (!ok) return res.status(404).json({ success:false, error:'Not found' }); res.json({ success:true }); } catch (e) { logger.error('delete error', e); res.status(500).json({ success:false, error:e.message }); } }

module.exports = { list, get, create, update, remove };
