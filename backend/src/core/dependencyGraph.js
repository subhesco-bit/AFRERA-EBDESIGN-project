'use strict';

class DependencyGraph {
  constructor(){ this.nodes=new Map(); this.out=new Map(); this.incoming=new Map(); }
  addNode(id, metadata={}){ const key=String(id); if(!this.nodes.has(key))this.nodes.set(key,{id:key,...metadata}); else this.nodes.set(key,{...this.nodes.get(key),...metadata,id:key}); if(!this.out.has(key))this.out.set(key,new Map()); if(!this.incoming.has(key))this.incoming.set(key,new Map()); return this.nodes.get(key); }
  addEdge(from,to,type='dependency',metadata={}){ const a=String(from),b=String(to); this.addNode(a);this.addNode(b); const key=type+'|'+b; this.out.get(a).set(key,{from:a,to:b,type,...metadata}); const ikey=type+'|'+a; this.incoming.get(b).set(ikey,{from:a,to:b,type,...metadata}); }
  edges(){ return [...this.out.values()].flatMap((m)=>[...m.values()]); }
  neighbors(id){ return [...(this.out.get(String(id))||new Map()).values()]; }
  dependencies(id,type=null){ return this.neighbors(id).filter((e)=>!type||e.type===type).map((e)=>e.to); }
  reverseDependencies(id,type=null){ return [...(this.incoming.get(String(id))||new Map()).values()].filter((e)=>!type||e.type===type).map((e)=>e.from); }
  orphans(predicate=null){ return [...this.nodes.values()].filter((node)=>{if(predicate&&!predicate(node))return false; return (this.out.get(node.id)?.size||0)===0 && (this.incoming.get(node.id)?.size||0)===0;}); }
  cycles(){
    const index=new Map(),low=new Map(),stack=[],onStack=new Set(),components=[];let cursor=0;
    const visit=(v)=>{ index.set(v,cursor);low.set(v,cursor);cursor++;stack.push(v);onStack.add(v); for(const e of this.neighbors(v)){const w=e.to;if(!index.has(w)){visit(w);low.set(v,Math.min(low.get(v),low.get(w)));}else if(onStack.has(w)){low.set(v,Math.min(low.get(v),index.get(w)));}} if(low.get(v)===index.get(v)){const c=[];let w;do{w=stack.pop();onStack.delete(w);c.push(w);}while(w!==v);if(c.length>1 || this.neighbors(v).some((e)=>e.to===v))components.push(c);}};
    for(const id of this.nodes.keys()) if(!index.has(id)) visit(id);
    return components;
  }
  topologicalOrder(){
    const indegree=new Map([...this.nodes.keys()].map((id)=>[id,0])); for(const e of this.edges())indegree.set(e.to,(indegree.get(e.to)||0)+1);
    const queue=[...indegree.entries()].filter(([,d])=>d===0).map(([id])=>id).sort();const order=[];
    while(queue.length){const v=queue.shift();order.push(v);for(const e of this.neighbors(v)){const d=indegree.get(e.to)-1;indegree.set(e.to,d);if(d===0){queue.push(e.to);queue.sort();}}}
    return {order,complete:order.length===this.nodes.size,remaining:[...this.nodes.keys()].filter((id)=>!order.includes(id))};
  }
  toJSON(){return {nodes:[...this.nodes.values()],edges:this.edges(),cycles:this.cycles(),orphans:this.orphans().map((n)=>n.id)};}
}

module.exports={DependencyGraph};
