const { taxonomy, getDomain, getSystem, validateTaxonomy, validateNode, childId } = require('../core/domainTaxonomy');

describe('Canonical domain taxonomy', () => {
  it('is internally valid with unique domains and valid parents', () => {
    const result = validateTaxonomy();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.domainCount).toBeGreaterThanOrEqual(30);
    expect(result.hierarchy).toEqual(['domain','system','module','submodule','capability','feature','service','businessCell']);
  });

  it('resolves canonical domains and systems by stable identifiers', () => {
    expect(getDomain('finance')).toEqual(expect.objectContaining({ id: 'DOMAIN:FINANCE' }));
    expect(getSystem('SYSTEM:KNOWLEDGE_RETRIEVAL:HYBRID')).toEqual(expect.objectContaining({ parentId: 'DOMAIN:KNOWLEDGE_RETRIEVAL' }));
  });

  it('rejects invalid security and data classifications', () => {
    const invalid = { id:'SERVICE:TEST', name:'Test', level:'service', parentId:'FEATURE:TEST', owner:'test', status:'catalogued', dataClassification:'unknown', securityClass:'everything', lifecycle:'catalogued' };
    expect(validateNode(invalid)).toEqual(expect.arrayContaining(['invalid securityClass everything','invalid dataClassification unknown']));
  });

  it('creates deterministic child identifiers', () => {
    expect(childId('DOMAIN:FINANCE', 'system', 'core accounting')).toBe('SYSTEM:FINANCE:CORE_ACCOUNTING');
  });

  it('defines business cells as auditable outcome-owning units', () => {
    expect(taxonomy.businessCellDefinition.required).toEqual(expect.arrayContaining(['roles','inputs','outputs','controls','kpis','sla','evidence']));
  });
});
