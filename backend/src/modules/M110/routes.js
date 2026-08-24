// Express routes for Asset Lifecycle Management (M110)
// Matches the action-based route shape used by its M102/M103/M104/M107/
// M108/M109 siblings (register/update-stage/track/report), not simple CRUD.
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.listAssets);
router.get('/:id', controller.getAsset);
router.post('/register', controller.registerAsset);
router.put('/lifecycle-stage/:id', controller.updateLifecycleStage);
router.get('/depreciation/:id', controller.trackAssetDepreciation);
router.get('/report/:farmerId', controller.generateLifecycleReport);

module.exports = router;
