const { ExternalIntegrationRegistry } = require('../core/integration/externalIntegrationRegistry');
const { buildExternalIntegrationRegistry } = require('../core/integration/externalIntegrationCatalog');
const { IntegrationHub } = require('../platform/integration/integrationHub');

describe('External integration governance', () => {
  it('tracks configuration by environment variable names without reading or exposing secret values', () => {
    const env={RAZORPAY_KEY_ID:'id',RAZORPAY_KEY_SECRET:'secret-value'};
    const registry=buildExternalIntegrationRegistry({env});
    const razorpay=registry.status('razorpay');
    const stripe=registry.status('stripe');
    expect(razorpay.configuration).toEqual(expect.objectContaining({configured:true,missingRequiredEnv:[]}));
    expect(JSON.stringify(razorpay)).not.toContain('secret-value');
    expect(stripe.configuration.configured).toBe(false);
    expect(stripe.configuration.missingRequiredEnv).toContain('STRIPE_SECRET_KEY');
  });

  it('never reports a registered provider as available until an adapter is actually bound', async () => {
    const registry=new ExternalIntegrationRegistry({env:{KEY:'x'}});
    registry.register('partner',{provider:'Partner',category:'other',transport:'https',authMode:'api-key',capabilities:['lookup'],requiredEnv:['KEY']});
    expect(registry.status('partner')).toEqual(expect.objectContaining({state:'configured_no_adapter',available:false}));
    const hub=new IntegrationHub({registry});
    await hub.initialize();
    await expect(hub.callService('partner','lookup',{})).rejects.toMatchObject({code:'INTEGRATION_ADAPTER_MISSING'});
  });

  it('retries only idempotent calls and replays an idempotency-key result without a second provider call', async () => {
    const registry=new ExternalIntegrationRegistry({env:{KEY:'x'}});
    let calls=0;
    const adapter={
      async lookup(payload){calls+=1;if(calls===1){const e=new Error('temporary');e.statusCode=503;throw e;}return {value:payload.value};}
    };
    registry.register('partner',{provider:'Partner',category:'other',transport:'https',authMode:'api-key',capabilities:['lookup'],requiredEnv:['KEY'],idempotentOperations:['lookup'],maxAttempts:3},adapter);
    const hub=new IntegrationHub({registry,failureThreshold:5});
    await hub.initialize();
    const first=await hub.callService('partner','lookup',{value:7},{idempotencyKey:'abc'});
    const second=await hub.callService('partner','lookup',{value:7},{idempotencyKey:'abc'});
    expect(first.success).toBe(true);
    expect(first.attempt).toBe(2);
    expect(second.replayed).toBe(true);
    expect(calls).toBe(2);
  });

  it('does not retry a non-idempotent operation after provider failure', async () => {
    const registry=new ExternalIntegrationRegistry({env:{KEY:'x'}});
    let calls=0;
    registry.register('partner',{provider:'Partner',category:'payment',transport:'https',authMode:'api-key',capabilities:['charge'],requiredEnv:['KEY'],maxAttempts:3},{async charge(){calls+=1;const e=new Error('temporary');e.statusCode=503;throw e;}});
    const hub=new IntegrationHub({registry});
    await hub.initialize();
    await expect(hub.callService('partner','charge',{amount:100})).rejects.toThrow('temporary');
    expect(calls).toBe(1);
  });

  it('fails closed when webhook verification is required but absent or invalid', async () => {
    const registry=new ExternalIntegrationRegistry({env:{KEY:'x'}});
    registry.register('hook',{provider:'Hook',category:'payment',transport:'webhook',authMode:'signed-webhook',capabilities:['webhook'],requiredEnv:['KEY'],webhookVerification:'hmac'},{async handleWebhook(){return {processed:true};}});
    const hub=new IntegrationHub({registry});
    await hub.initialize();
    await expect(hub.handleWebhook('hook','body',{signature:'bad'})).rejects.toMatchObject({code:'WEBHOOK_VERIFIER_MISSING'});
    registry.bindAdapter('hook',{verifyWebhook:async()=>false,handleWebhook:async()=>({processed:true})});
    await expect(hub.handleWebhook('hook','body',{signature:'bad'})).rejects.toMatchObject({code:'WEBHOOK_SIGNATURE_INVALID'});
  });

  it('returns unknown connectivity rather than fake connected=true when no health operation exists', async () => {
    const registry=new ExternalIntegrationRegistry({env:{KEY:'x'}});
    registry.register('partner',{provider:'Partner',category:'other',transport:'https',authMode:'api-key',capabilities:['lookup'],requiredEnv:['KEY']},{async lookup(){return {ok:true};}});
    const hub=new IntegrationHub({registry});
    await hub.initialize();
    const status=await hub.testConnection('partner');
    expect(status.connected).toBeNull();
    expect(status.state).toBe('adapter_ready_unverified');
  });

  it('redacts sensitive keys before request fingerprinting or logging metadata', () => {
    const registry=new ExternalIntegrationRegistry();
    const redacted=registry.redact({authorization:'Bearer x',nested:{apiKey:'abc',name:'safe'}});
    expect(redacted).toEqual({authorization:'[REDACTED]',nested:{apiKey:'[REDACTED]',name:'safe'}});
    expect(registry.fingerprintRequest('x','y',{token:'secret'})).toMatch(/^[a-f0-9]{64}$/);
  });
});
