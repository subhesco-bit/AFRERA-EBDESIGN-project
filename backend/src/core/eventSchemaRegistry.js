'use strict';

class EventSchemaRegistry {
  constructor(){this.schemas=new Map();}
  register(type,version,schema={}){
    if(!type||!version)throw new Error('type and version are required');
    const key=String(type)+'@'+String(version);
    if(this.schemas.has(key))throw new Error('event schema already registered: '+key);
    const normalized={
      type:String(type),
      version:String(version),
      required:Array.isArray(schema.required)?schema.required:[],
      validate:typeof schema.validate==='function'?schema.validate:null,
      description:schema.description||'',
      payloadSchema:schema.payloadSchema&&typeof schema.payloadSchema==='object'?schema.payloadSchema:null,
      dataContentType:schema.dataContentType||'application/json',
      retention:schema.retention||null,
      classification:schema.classification||'internal',
      owner:schema.owner||null
    };
    this.schemas.set(key,normalized);return normalized;
  }
  get(type,version='1.0.0'){return this.schemas.get(String(type)+'@'+String(version))||null;}
  validate(type,version,payload){
    const schema=this.get(type,version);
    if(!schema)return {valid:false,errors:['schema not registered: '+type+'@'+version]};
    const errors=[];
    for(const field of schema.required){if(payload==null||!(field in payload))errors.push('missing payload field '+field);}
    if(schema.validate){const result=schema.validate(payload);if(result===false)errors.push('custom validation failed');else if(Array.isArray(result))errors.push(...result);}
    return {valid:errors.length===0,errors,schema};
  }
  list(){return [...this.schemas.values()];}
  toAsyncApiDocument(options={}){
    const title=options.title||'AFRERA Governed Event API';
    const version=options.version||'1.0.0';
    const channels={};
    const messages={};
    for(const schema of this.schemas.values()){
      const safeName=(schema.type+'_'+schema.version).replace(/[^A-Za-z0-9_]/g,'_');
      const address=schema.type.replace(/\./g,'/');
      messages[safeName]={
        name:safeName,
        title:schema.type,
        summary:schema.description||('Governed event '+schema.type),
        contentType:schema.dataContentType,
        payload:schema.payloadSchema||{type:'object'},
        'x-afrera-schema-version':schema.version,
        'x-afrera-classification':schema.classification
      };
      channels[safeName]={address,messages:{[safeName]:{$ref:'#/components/messages/'+safeName}}};
    }
    return {
      asyncapi:'3.1.0',
      info:{title,version,description:'Machine-readable contract for AFRERA governed domain events.'},
      channels,
      components:{messages},
      'x-event-envelope':'CloudEvents 1.0-compatible structured fields'
    };
  }
}

module.exports={EventSchemaRegistry};
