const express=require('express');
const router=express.Router();
const service=require('../services/fulfillmentOrchestrationService');
function auth(req,res,next){const token=req.headers.authorization?.replace(/^Bearer\s+/i,'');if(!token)return res.status(401).json({success:false,error:'Unauthorized'});req.userId=token;next();}
router.post('/shipments',auth,async(req,res)=>{try{res.status(201).json({success:true,data:await service.createShipment(req.body)});}catch(e){res.status(400).json({success:false,error:e.message});}});
router.get('/shipments/:id',auth,async(req,res)=>{try{const data=await service.getShipment(req.params.id);if(!data)return res.status(404).json({success:false,error:'Shipment not found'});res.json({success:true,data});}catch(e){res.status(500).json({success:false,error:e.message});}});
router.post('/shipments/:id/allocate',auth,async(req,res)=>{try{res.json({success:true,data:await service.allocate({shipmentId:req.params.id,allocations:req.body.allocations||[]})});}catch(e){res.status(e.message==='Shipment not found'?404:400).json({success:false,error:e.message});}});
router.post('/shipments/:id/transition',auth,async(req,res)=>{try{res.json({success:true,data:await service.transition(req.params.id,req.body.toStatus,req.userId,req.body.notes)});}catch(e){res.status(e.message==='Shipment not found'?404:400).json({success:false,error:e.message});}});
module.exports=router;
