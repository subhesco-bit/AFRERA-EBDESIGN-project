'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const service = require('../services/labourService');

const router = express.Router();
router.use(authMiddleware);

const handle = (fn, successStatus = 200) => async (req, res, next) => {
  try {
    const data = await fn(req);
    res.status(successStatus).json({ success: true, data });
  } catch (error) {
    next(error);
  }router.get('/workers', handle(() => service.listWorkers()));
router.post('/workers', handle((req) => service.createWorker(req.body), 201));
router.put('/workers/:id', handle((req) => service.updateWorker(req.params.id, req.body)));
router.get('/attendance', handle(() => service.listAttendance()));
router.post('/attendance', handle((req) => service.recordAttendance(req.body), 201));
router.get('/payments', handle(() => service.listPayments()));
router.post('/payments', handle((req) => service.recordPayment(req.body), 201));


}

module.exports = router;