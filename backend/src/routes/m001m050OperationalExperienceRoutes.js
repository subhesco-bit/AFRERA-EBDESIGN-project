'use strict';
const express=require('express');
const router=express.Router();
const service=require('../services/m001m050OperationalExperienceService');
const {authMiddleware}=require('../middleware/auth');
router.use(authMiddleware);
router.get('/portfolio',(req,res)=>res.json({success:true,modules:service.portfolio()}));
router.get('/:moduleCode/workspace',(req,res,next)=>{try{res.json({success:true,workspace:service.profile(req.params.moduleCode.toUpperCase())});}catch(e){next(e);}});
module.exports=router;
