const express=require('express');
const router=express.Router();
const wiring=require('../services/m051m100ModuleWiringService');
const {authMiddleware}=require('../middleware/auth');
router.use(authMiddleware);
router.get('/inventory',(req,res)=>res.json({success:true,modules:wiring.MODULE_CODES.map(wiring.resolveModule)}));
router.post('/:moduleCode/execute/:operation',async(req,res,next)=>{try{const code=req.params.moduleCode;if(!wiring.MODULE_CODES.includes(code))return res.status(404).json({success:false,error:'Module outside M051-M100'});const result=await wiring.execute(code,req.params.operation,req.body,{actorId:req.user?.id,correlationId:req.headers['x-correlation-id']||undefined});res.json({success:true,...result});}catch(e){next(e);}});
module.exports=router;
