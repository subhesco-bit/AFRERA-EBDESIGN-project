const express=require('express');
const router=express.Router();
const service=require('../services/masterDataIntelligenceService');
const {authMiddleware,requireRole}=require('../middleware/auth');
router.use(authMiddleware,requireRole('admin','superadmin'));
router.post('/reconcile',async(req,res,next)=>{try{res.status(201).json({success:true,run:await service.reconcile(req.body)});}catch(e){next(e);}});
router.post('/duplicates',(req,res)=>res.json({success:true,duplicates:service.findDuplicates(req.body.records||[],req.body.key||'name')}));
router.post('/quality',async(req,res,next)=>{try{const entity=req.body.entity||{};const findings=service.normalize(entity);const rules=[];if(!findings.name)rules.push({rule_code:'MD_REQUIRED_NAME',severity:'error'});if(!findings.code)rules.push({rule_code:'MD_REQUIRED_CODE',severity:'error'});res.json({success:true,entity:findings,findings:rules});}catch(e){next(e);}});
module.exports=router;
