'use strict';
const express = require('express');
const router = express.Router();
const assurance = require('../services/moduleProductionAssuranceService');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware, requireRole('admin','superadmin','manager'));

router.get('/catalog', (req,res) => {
  res.json({ success:true, modules:Object.entries(assurance.CONTRACTS).map(([id,c])=>({id,...c})) });
});

router.post('/:moduleId/validate', (req,res,next) => {
  try { res.json({ success:true, result:assurance.validateModule(req.params.moduleId.toUpperCase(),req.body) }); }
  catch(e){ next(e); }
});

router.post('/:moduleId/assess', async (req,res,next) => {
  try {
    const id=req.params.moduleId.toUpperCase();
    const result=await assurance.assess(id,req.body);
    const recorded=await assurance.recordAssessment(id,req.body,result);
    res.json({success:result.valid, result:recorded});
  } catch(e){ next(e); }
});

module.exports=router;
