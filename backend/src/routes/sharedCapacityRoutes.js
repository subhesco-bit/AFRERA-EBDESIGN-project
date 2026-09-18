'use strict';
const express=require('express'); const {authMiddleware,requireRole}=require('../middleware/auth'); const service=require('../services/operations/sharedCapacityService');
const router=express.Router(); const operator=requireRole('admin','super_admin','logistics','fpo','corporate'); const fail=(res,e)=>res.status(e.statusCode||500).json({success:false,error:e.statusCode?e.message:'Shared capacity operation failed'});
router.post('/optimize',authMiddleware,async(req,res)=>{try{const result=service.optimize(req.body.demand,req.body.options);res.json({success:true,data:req.body.includeExplanation?{...result,explanation:await service.explain(result)}:result});}catch(e){fail(res,e);}});
router.post('/resources',authMiddleware,operator,async(req,res)=>{try{res.status(201).json({success:true,data:await service.registerResource(req.body,req.user)});}catch(e){fail(res,e);}});
router.post('/slots',authMiddleware,operator,async(req,res)=>{try{res.status(201).json({success:true,data:await service.createSlot(req.body,req.user)});}catch(e){fail(res,e);}});
router.post('/reservations',authMiddleware,async(req,res)=>{try{res.status(201).json({success:true,data:await service.reserve(req.body,req.user)});}catch(e){fail(res,e);}});
router.post('/reservations/:id/cancel',authMiddleware,async(req,res)=>{try{res.json({success:true,data:await service.cancel(req.params.id,req.user)});}catch(e){fail(res,e);}});
module.exports=router;
