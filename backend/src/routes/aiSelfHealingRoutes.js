const express = require('express');
const router = express.Router();
const legacy = require('../services/legacy/aiSelfHealingService');
const control = require('../services/aiSelfHealingResilienceService');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware, requireRole('admin', 'superadmin'));
router.post('/detect', async (req,res,next)=>{ try { const legacyResult=await legacy.detectAndClassifyError(req.body.error); const incident=await control.detectFailure({component:req.body.component||'unknown',failureClass:legacyResult?.classification?.type||'runtime',evidence:{error:req.body.error}}); res.json({success:true,legacy:legacyResult,incident}); } catch(e){ next(e); } });
router.post('/diagnose', (req,res)=>res.json({success:true,diagnosis:control.diagnose(req.body.incident||req.body)}));
router.post('/health', async (req,res,next)=>{try{res.status(201).json({success:true,event:await control.recordHealth(req.body)});}catch(e){next(e);}});
router.post('/circuits/:component', async (req,res,next)=>{try{res.json({success:true,state:await control.setCircuitState(req.params.component,req.body.state,req.body.metadata)});}catch(e){next(e);}});
router.get('/service-health',(req,res)=>res.json({success:true,status:'healthy',timestamp:new Date().toISOString()}));
module.exports=router;
