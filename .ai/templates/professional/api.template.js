import { Router } from 'express';
import { validateRequest, validateResponse, errorHandler } from '../middleware/validators';
import { {SERVICE_NAME} } from '../services/{SERVICE_NAME}';

const router = Router();
const service = new {SERVICE_NAME}();

/**
 * GET /{RESOURCE}
 * @returns {{ success: boolean, data: T[], meta: { total, page, limit } }}
 */
router.get('/', validateRequest('query', 'pageSchema'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await service.getAll(page, limit);
    
    validateResponse(result);
    res.json({
      success: true,
      data: result.items,
      meta: { total: result.total, page, limit }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /{RESOURCE}
 * @param {{ {FIELDS} }}
 * @returns {{ success: boolean, data: T }}
 */
router.post('/', validateRequest('body', 'createSchema'), async (req, res, next) => {
  try {
    const result = await service.create(req.body);
    validateResponse(result);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /{RESOURCE}/:id
 * @returns {{ success: boolean, data: T }}
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await service.getById(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Not found' });
    validateResponse(result);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /{RESOURCE}/:id
 * @param {{ {FIELDS} }}
 * @returns {{ success: boolean, data: T }}
 */
router.put('/:id', validateRequest('body', 'updateSchema'), async (req, res, next) => {
  try {
    const result = await service.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ success: false, error: 'Not found' });
    validateResponse(result);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /{RESOURCE}/:id
 * @returns {{ success: boolean }}
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await service.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.use(errorHandler);
export default router;
