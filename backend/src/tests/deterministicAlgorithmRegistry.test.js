const { DeterministicAlgorithmRegistry } = require('../core/deterministicAlgorithmRegistry');
const { buildDeterministicAlgorithmRegistry } = require('../core/deterministicAlgorithmCatalog');

describe('Deterministic algorithm governance', () => {
  it('registers canonical pure calculations with basis, provenance and limitations', () => {
    const registry=buildDeterministicAlgorithmRegistry();
    const rows=registry.list();
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for(const row of rows){
      expect(row.deterministic).toBe(true);
      expect(row.basis).toBeTruthy();
      expect(row.source).toMatch(/^backend\//);
    }
  });

  it('runs mass balance deterministically and exposes evidence metadata', () => {
    const registry=buildDeterministicAlgorithmRegistry();
    const a=registry.run('VC_MASS_BALANCE_RECONCILE',{qtyIn:100,qtyOut:80,byproduct:10,waste:5,loss:5,unit:'kg'});
    const b=registry.run('VC_MASS_BALANCE_RECONCILE',{qtyIn:100,qtyOut:80,byproduct:10,waste:5,loss:5,unit:'kg'});
    expect(a.value).toEqual(b.value);
    expect(a.value.balanced).toBe(true);
    expect(a.evidenceClass).toBe('CALCULATED');
  });

  it('rejects asynchronous/I-O algorithms from the pure deterministic runner', () => {
    const registry=new DeterministicAlgorithmRegistry();
    registry.register('ASYNC_BAD',{domain:'TEST',kind:'bad',deterministic:true,basis:'test',source:'test',execute:async()=>1});
    expect(()=>registry.run('ASYNC_BAD',{})).toThrow(/synchronous pure calculation/);
  });

  it('preserves advisory limitations for thermal proxies', () => {
    const registry=buildDeterministicAlgorithmRegistry();
    const out=registry.run('COLD_ROOM_LOAD_ADVISORY',{volume_m3:100,delta_t_c:30,u_wall:0.3,surface_area_m2:120,product_load_w:1500});
    expect(out.value.cooling_kw).toBeGreaterThan(0);
    expect(out.limitations).toEqual(expect.arrayContaining([expect.stringMatching(/CFD/)]));
  });
});
