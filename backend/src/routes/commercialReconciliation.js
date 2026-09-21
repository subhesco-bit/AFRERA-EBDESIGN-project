const express=require('express');
const router=express.Router();
const service=require('../services/commercialReconciliationService');
function auth(req,res,next){const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');if(!token)return res.status(401).json({success:false,error:'Unauthorized'});req.userId=token;next();}
router.post('/reconciliation/entries',auth,async(req,res)=>{try{res.status(201).json({success:true,data:await service.createEntry(req.body)});}catch(e){res.status(400).json({success:false,error:e.message});}});
router.get('/reconciliation/orders/:orderId',auth,async(req,res)=>{try{const data=await service.buildOrderSummary(req.params.orderId);if(!data)return res.status(404).json({success:false,error:'Order not found'});res.json({success:true,data});}catch(e){res.status(500).json({success:false,error:e.message});}});
router.post('/reconciliation/entries/:id/reconcile',auth,async(req,res)=>{try{res.json({success:true,data:await service.reconcileEntry(req.params.id)});}catch(e){res.status(e.message==='Reconciliation record not found'?404:400).json({success:false,error:e.message});}});
module.exports=router;
