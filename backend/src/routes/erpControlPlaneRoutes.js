const express=require('express');const router=express.Router();const service=require('../services/erpControlPlaneService');const {authMiddleware,requireRole}=require('../middleware/auth');router.use(authMiddleware);
router.get('/companies/:companyId/trial-balance',async(req,res,next)=>{try{res.json({success:true,trial_balance:await service.trialBalance(req.params.companyId,req.query.as_of||new Date().toISOString().slice(0,10))});}catch(e){next(e);}});
router.post('/fiscal-periods/:periodId/close',requireRole('admin','finance','superadmin'),async(req,res,next)=>{try{res.json({success:true,period:await service.closePeriod(req.params.periodId,req.user?.id)});}catch(e){next(e);}});
router.post('/fpo/members',async(req,res,next)=>{try{res.status(201).json({success:true,member:await service.registerFpoMember(req.body)});}catch(e){next(e);}});
module.exports=router;
