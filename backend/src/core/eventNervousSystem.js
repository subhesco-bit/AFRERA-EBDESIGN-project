'use strict';

const crypto=require('crypto');
const {signalBus:defaultBus,SEVERITY}=require('./signalBus');
const {EventSchemaRegistry}=require('./eventSchemaRegistry');

class EventNervousSystem {
  constructor(options={}){
    this.bus=options.bus||defaultBus;this.registry=options.registry||new EventSchemaRegistry();
    this.durablePublisher=options.durablePublisher||null;this.queuePublisher=options.queuePublisher||null;
    this.reflexes=[];
  }
  registerSchema(type,version,schema){return this.registry.register(type,version,schema);}
  registerReflex(reflex){if(!reflex?.id||!reflex.type||typeof reflex.when!=='function'||typeof reflex.act!=='function')throw new Error('reflex requires id,type,when,act');this.reflexes.push(reflex);return reflex;}
  async publish(type,payload={},meta={}){
    const schemaVersion=String(meta.schemaVersion||'1.0.0');
    const validation=this.registry.validate(type,schemaVersion,payload);
    if(!validation.valid){const e=new Error('event schema validation failed: '+validation.errors.join('; '));e.code='EVENT_SCHEMA_INVALID';e.details=validation.errors;throw e;}
    const event={eventId:meta.eventId||crypto.randomUUID(),type,schemaVersion,payload,source:meta.source||'unknown',severity:meta.severity??SEVERITY.INFO,entityId:meta.entityId??null,tenantId:meta.tenantId??null,correlationId:meta.correlationId||crypto.randomUUID(),causationId:meta.causationId||null,occurredAt:meta.occurredAt||new Date().toISOString(),provenance:meta.provenance||{}};
    const signal=this.bus.emitSignal(type,payload,{severity:event.severity,source:event.source,entityId:event.entityId,correlationId:event.correlationId,eventId:event.eventId,schemaVersion});
    const reflexResults=[];
    for(const reflex of this.reflexes){if(reflex.type!==type)continue;if(await reflex.when(event)){reflexResults.push({id:reflex.id,result:await reflex.act(event)});}}
    let durability='ephemeral-in-process';
    if(this.durablePublisher){await this.durablePublisher.publish(event);durability='durable-publisher';}
    if(this.queuePublisher && meta.queue){await this.queuePublisher.enqueue(meta.queue,event);}
    return {event,signal,durability,reflexResults};
  }
  health(){return {status:'healthy',schemas:this.registry.list().length,reflexes:this.reflexes.length,durability:this.durablePublisher?'durable-publisher':'ephemeral-in-process',queue:Boolean(this.queuePublisher)};}
}

module.exports={EventNervousSystem};
