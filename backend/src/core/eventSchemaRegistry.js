'use strict';

class EventSchemaRegistry {
  constructor(){this.schemas=new Map();}
  register(type,version,schema={}){
    if(!type||!version)throw new Error('type and version are required');
    const key=String(type)+'@'+String(version);
    if(this.schemas.has(key))throw new Error('event schema already registered: '+key);
    const normalized={type:String(type),version:String(version),required:Array.isArray(schema.required)?schema.required:[],validate:typeof schema.validate==='function'?schema.validate:null,description:schema.description||''};
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
}

module.exports={EventSchemaRegistry};
