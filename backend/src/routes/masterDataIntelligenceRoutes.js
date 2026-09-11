const express=require('express');
const router=express.Router();
const service=require('../services/masterDataIntelligenceService');
const {authMiddleware,requireRole}=require('../middleware/auth');
router.use(authMiddleware,requireRole('admin','superadmin'));
router.post('/reconcile',async(req,res,next)=>{try{res.status(201).json({success:true,run:await service.reconcile(req.body)});}catch(e){next(e);}});
router.post('/duplicates',(req,res)=>res.json({success:true,duplicates:service.findDuplicates(req.body.records||[],req.body.key||'name')}));
router.post('/quality',async(req,res,next)=>{try{const findings=[];for(const f of service.reconcile({entityType:req.body.entityType||'unknown',sources:[{name:req.body.source||'api',records:[req.body.entity]}]}).then?[]:[]);res.json({success:true,findings});}catch(e){next(e);}});
module.exports=router;
