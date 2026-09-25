from pathlib import Path
p=Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN\tools\build-external-integration-catalog.js")
t=p.read_text(encoding="utf-8")
old="const unmappedEnv=integrationLikeEnv.filter(name=>!envToProvider.has(name)).sort();"
new="""const unmappedEnv=integrationLikeEnv.filter(name=>!envToProvider.has(name)).sort();
function classifyUnmappedEnv(name){
  if(/^AI_(ANALYSIS|OPTIMIZATION|PREDICTION|RECOMMENDATION)_ENDPOINT$/.test(name)||['USE_REAL_IMAGE_API','CLAUDE_MAX_TOKENS'].includes(name))return {class:'ai-runtime-internal',ownerPhase:'042/044',reason:'Internal AI routing/tuning, not a standalone external provider.'};
  if(/^(AMQP_HOST|DATABASE_URL|DB_|PG_|MONGODB_URL|REDIS_|JAEGER_HOST|TEST_DATABASE_URL)/.test(name))return {class:'platform-infrastructure',ownerPhase:'090+',reason:'Database, queue, cache or telemetry infrastructure configuration.'};
  if(/^AZURE_(CLIENT_ID|CLIENT_SECRET|REGION|SUBSCRIPTION_ID|TENANT_ID)$/.test(name)||/^GCP_(KEY_FILE|PROJECT_ID|REGION)$/.test(name))return {class:'cloud-control-plane',ownerPhase:'090+',reason:'Cloud infrastructure management rather than business-provider integration.'};
  if(['BASE_URL','FRONTEND_URL','PUBLIC_BASE_URL','REACT_APP_API_URL','REACT_APP_WS_URL','MARKETPLACE_URL','CDN_BASE_URL','HOST','HOSTNAME'].includes(name))return {class:'internal-application-endpoint',ownerPhase:'deployment',reason:'Self/application routing endpoint or hostname.'};
  if(/(ENCRYPTION_KEY|JWT_SECRET|JWT_REFRESH_SECRET|SESSION_SECRET|SYNC_SECRET|OFFLINE_PAYMENT_SECRET|MFA_SECRET_LENGTH|CORE_API_KEY)/.test(name))return {class:'security-secret-or-control',ownerPhase:'security',reason:'Internal security material/control; not an external provider.'};
  if(['DEFAULT_REGION','GDPR_DATA_REGION'].includes(name))return {class:'policy-or-region',ownerPhase:'governance',reason:'Deployment/data-governance policy metadata.'};
  if(['GOOGLE_API_KEY','GOOGLE_PROJECT_ID'].includes(name))return {class:'inactive-or-comment-only',ownerPhase:'reconciliation',reason:'No active production integration call site found in Phase 43 usage trace.'};
  return {class:'unclassified',ownerPhase:null,reason:'Requires review.'};
}
const unmappedClassified=unmappedEnv.map(name=>({name,...classifyUnmappedEnv(name)}));
const unexplainedEnv=unmappedClassified.filter(item=>item.class==='unclassified');"""
if old not in t: raise RuntimeError("unmapped env anchor missing")
t=t.replace(old,new,1)
old2="unmappedIntegrationEnvNames:unmappedEnv,"
new2="unmappedIntegrationEnvNames:unmappedEnv,unmappedEnvClassifications:unmappedClassified,unexplainedIntegrationEnvNames:unexplainedEnv,"
if old2 not in t: raise RuntimeError("manifest unmapped anchor missing")
t=t.replace(old2,new2,1)
old3="unmappedIntegrationEnvNames:manifest.unmappedIntegrationEnvNames.length,"
new3="unmappedIntegrationEnvNames:manifest.unmappedIntegrationEnvNames.length,unexplainedIntegrationEnvNames:manifest.unexplainedIntegrationEnvNames.length,"
if old3 not in t: raise RuntimeError("console unmapped anchor missing")
t=t.replace(old3,new3,1)
p.write_text(t,encoding="utf-8")
print("phase43 env classification patched")
