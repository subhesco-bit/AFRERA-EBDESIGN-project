'use strict';
module.exports=function operationalContext(req,res,next){
 const raw=req.params?.moduleCode||req.headers['x-module-code'];
 if(raw&&/^M0(?:0[1-9]|[1-4][0-9]|50)$/i.test(raw)){req.operationalContext={moduleCode:raw.toUpperCase(),actorId:req.user?.id||req.user?.userId||null,tenantId:req.user?.tenantId||null,geography:req.user?.geography||null,correlationId:req.headers['x-correlation-id']||req.id||null};}
 next();
};
