'use strict';

const crypto=require('crypto');
const {signalBus:defaultBus,SEVERITY}=require('./signalBus');
const {EventSchemaRegistry}=require('./eventSchemaRegistry');

function normalizedSource(source){
  const value=String(source||'unknown').trim();
  if(/^([a-z][a-z0-9+.-]*:|\/)/i.test(value))return value;
  return '/afrera/'+value.replace(/[^a-z0-9._-]+/gi,'-').toLowerCase();
}

class EventNervousSystem {
  constructor(options={}){
    this.bus=options.bus||defaultBus;
    this.registry=options.registry||new EventSchemaRegistry();
    this.durablePublisher=options.durablePublisher||null;
    this.queuePublisher=options.queuePublisher||null;
    this.messagingSystem=options.messagingSystem||'afrera-signal-bus';
    this.reflexes=[];
  }
  registerSchema(type,version,schema){return this.registry.register(type,version,schema);}
  registerReflex(reflex){
    if(!reflex?.id||!reflex.type||typeof reflex.when!=='function'||typeof reflex.act!=='function')throw new Error('reflex requires id,type,when,act');
    this.reflexes.push(reflex);return reflex;
  }
  async publish(type,payload={},meta={}){
    const schemaVersion=String(meta.schemaVersion||'1.0.0');
    const validation=this.registry.validate(type,schemaVersion,payload);
    if(!validation.valid){const e=new Error('event schema validation failed: '+validation.errors.join('; '));e.code='EVENT_SCHEMA_INVALID';e.details=validation.errors;throw e;}
    const eventId=meta.eventId||meta.id||crypto.randomUUID();
    const correlationId=meta.correlationId||crypto.randomUUID();
    const occurredAt=meta.occurredAt||meta.time||new Date().toISOString();
    const source=normalizedSource(meta.source);
    const subject=meta.subject||meta.entityId||undefined;
    const event={
      specversion:'1.0',
      id:eventId,
      source,
      type:String(type),
      time:occurredAt,
      subject,
      datacontenttype:validation.schema.dataContentType||'application/json',
      dataschema:meta.dataSchema||('urn:afrera:event-schema:'+encodeURIComponent(type)+':'+encodeURIComponent(schemaVersion)),
      data:payload,
      schemaVersion,
      correlationid:correlationId,
      causationid:meta.causationId||null,
      tenantid:meta.tenantId||null,
      severity:meta.severity??SEVERITY.INFO,
      provenance:meta.provenance||{},
      traceparent:meta.traceparent||null,
      eventId,
      payload,
      entityId:meta.entityId??null,
      tenantId:meta.tenantId??null,
      correlationId,
      causationId:meta.causationId||null,
      occurredAt
    };
    event.telemetry={
      'messaging.system':this.messagingSystem,
      'messaging.operation.name':'publish',
      'messaging.message.id':event.id,
      'messaging.destination.name':event.type,
      'afrera.event.schema_version':schemaVersion,
      'afrera.event.correlation_id':correlationId,
      'afrera.event.tenant_id':event.tenantid
    };
    const signal=this.bus.emitSignal(type,payload,{
      severity:event.severity,source:event.source,entityId:event.entityId,correlationId,eventId,schemaVersion,
      cloudEvent:event,traceparent:event.traceparent
    });
    const reflexResults=[];
    for(const reflex of this.reflexes){
      if(reflex.type!==type)continue;
      if(await reflex.when(event)){reflexResults.push({id:reflex.id,result:await reflex.act(event)});}
    }
    let durability='ephemeral-in-process';
    if(this.durablePublisher){await this.durablePublisher.publish(event);durability='durable-publisher';}
    if(this.queuePublisher && meta.queue){await this.queuePublisher.enqueue(meta.queue,event);}
    return {event,signal,durability,reflexResults};
  }
  async writeAsyncApiContract(filePath,options={}){
    const fs=require('fs');const path=require('path');
    const doc=this.registry.toAsyncApiDocument(options);
    fs.mkdirSync(path.dirname(filePath),{recursive:true});
    fs.writeFileSync(filePath,JSON.stringify(doc,null,2)+'\n','utf8');
    return {filePath,channels:Object.keys(doc.channels).length,asyncapi:doc.asyncapi};
  }
  health(){return {
    status:'healthy',schemas:this.registry.list().length,reflexes:this.reflexes.length,
    durability:this.durablePublisher?'durable-publisher':'ephemeral-in-process',
    queue:Boolean(this.queuePublisher),eventEnvelope:'CloudEvents-1.0-compatible',asyncapi:'3.1.0',
    telemetry:'OpenTelemetry-messaging-compatible-attributes'
  };}
}

module.exports={EventNervousSystem,normalizedSource};
