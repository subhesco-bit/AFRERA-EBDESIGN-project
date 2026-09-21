/**
 * Mounts standard REST endpoints for a resource produced by
 * services/legacy/resourceCrudFactory.js's createCrudService() (shape:
 * { list, get, create, update, remove }) onto an Express router.
 *
 * One reusable mounting helper for every legacy service built on that
 * factory, instead of hand-writing the same five endpoints per resource
 * per module.
 */
'use strict';

function mountCrudResource(router, basePath, resource) {
  router.get(basePath, async (req, res) => {
    try {
      const result = await resource.list(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.get(`${basePath}/:id`, async (req, res) => {
    try {
      const item = await resource.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.post(basePath, async (req, res) => {
    try {
      const item = await resource.create(req.body);
      res.status(201).json({ success: true, item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.put(`${basePath}/:id`, async (req, res) => {
    try {
      const item = await resource.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, item });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  router.delete(`${basePath}/:id`, async (req, res) => {
    try {
      const removed = await resource.remove(req.params.id);
      if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
}

module.exports = { mountCrudResource };
