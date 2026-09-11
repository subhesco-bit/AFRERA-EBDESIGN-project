const {
  listDomains,
  getDomain,
  getActorTypes,
  getWorkflow,
  getCapabilityMatrix,
} = require('../unifiedERPRegistry');

describe('unified ERP registry', () => {
  test('contains the core enterprise and rural domains', () => {
    const ids = listDomains().map(domain => domain.id);
    expect(ids).toEqual(expect.arrayContaining([
      'finance', 'supply_chain', 'sales', 'marketing', 'logistics', 'crm',
      'erm', 'workforce', 'insurance', 'retail', 'ecommerce', 'production',
      'quality', 'asset', 'projects', 'governance', 'data_ai',
    ]));
  });

  test('models rural participants as economic actors', () => {
    const rural = getActorTypes('rural');
    expect(rural).toEqual(expect.arrayContaining([
      'household', 'farmer', 'contract_labour', 'rural_freelancer', 'fpo', 'village', 'panchayat',
    ]));
    expect(rural).not.toContain('employee');
  });

  test('exposes cross-economy workflows', () => {
    expect(getWorkflow('rural_to_metro_product').steps).toEqual(expect.arrayContaining([
      'quality_check', 'packaging', 'pre_cooling', 'cold_storage', 'logistics', 'payment', 'accounting',
    ]));
    expect(getWorkflow('corporate_procure_to_pay').steps).toEqual(expect.arrayContaining([
      'purchase_order', 'goods_receipt', 'three_way_match', 'payment', 'general_ledger',
    ]));
  });

  test('provides a shared capability matrix', () => {
    const matrix = getCapabilityMatrix();
    expect(matrix.corporate.length).toBeGreaterThan(0);
    expect(matrix.rural.length).toBe(matrix.corporate.length);
    expect(matrix.shared.map(domain => domain.id)).toEqual(expect.arrayContaining([
      'finance', 'supply_chain', 'logistics', 'insurance', 'governance', 'data_ai',
    ]));
  });

  test('returns null for unknown domain and workflow', () => {
    expect(getDomain('does_not_exist')).toBeNull();
    expect(getWorkflow('does_not_exist')).toBeNull();
  });
});
