const {DependencyGraph}=require('../core/dependencyGraph');

describe('DependencyGraph',()=>{
  it('resolves a DAG in topological order',()=>{const g=new DependencyGraph();g.addEdge('A','B');g.addEdge('B','C');const r=g.topologicalOrder();expect(r.complete).toBe(true);expect(r.order.indexOf('A')).toBeLessThan(r.order.indexOf('B'));});
  it('detects dependency cycles',()=>{const g=new DependencyGraph();g.addEdge('A','B');g.addEdge('B','C');g.addEdge('C','A');expect(g.cycles()).toEqual(expect.arrayContaining([expect.arrayContaining(['A','B','C'])]));expect(g.topologicalOrder().complete).toBe(false);});
  it('detects isolated nodes without deleting them',()=>{const g=new DependencyGraph();g.addNode('ORPHAN',{kind:'module'});g.addEdge('A','B');expect(g.orphans((n)=>n.kind==='module').map((n)=>n.id)).toContain('ORPHAN');});
  it('tracks typed forward and reverse edges',()=>{const g=new DependencyGraph();g.addEdge('MODULE:A','SERVICE:B','service');expect(g.dependencies('MODULE:A','service')).toEqual(['SERVICE:B']);expect(g.reverseDependencies('SERVICE:B','service')).toEqual(['MODULE:A']);});
});
