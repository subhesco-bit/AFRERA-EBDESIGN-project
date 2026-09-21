const express=require('express');
const router=express.Router();
const service=require('../services/predictiveOptimizationService');
const {authMiddleware}=require('../middleware/auth');
router.use(authMiddleware);
router.post('/forecast',async(req,res,next)=>{try{const result=service.forecast(req.body);const run=await service.persistPrediction(req.body,result);res.json({success:true,result,run_id:run.id});}catch(e){next(e);}});
router.post('/optimize-allocations',async(req,res,next)=>{try{const result=service.optimizeAllocations(req.body);const run=await service.persistPrediction({...req.body,runType:'allocation_optimization'},result);res.json({success:true,result,run_id:run.id});}catch(e){next(e);}});
module.exports=router;
