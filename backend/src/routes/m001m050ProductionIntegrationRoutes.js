const express=require('express');
const router=express.Router();
const service=require('../services/m001m050ProductionIntegrationService');
const {authMiddleware}=require('../middleware/auth');
router.use(authMiddleware);
router.get('/contracts',(req,res)=>res.json({success:true,modules:Object.keys(require('../services/m001m050ProductionIntegrationService').constructor===Object?{}:{})}));
router.post('/:moduleCode/execute',async(req,res,next)=>{try{const actorId=req.user?.id||req.user?.userId||null;const result=await service.execute(req.params.moduleCode,req.body,{actorId,correlationId:req.headers['x-correlation-id']});res.json({success:true,...result});}catch(e){next(e);}});
module.exports=router;
