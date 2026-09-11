const assurance = require('../src/services/moduleProductionAssuranceService');

describe('M001-M050 production assurance contracts', () => {
  test('all M001-M050 contracts are present and domain-specific', () => {
    expect(Object.keys(assurance.CONTRACTS)).toHaveLength(50);
    for (let n=1;n<=50;n++) {
      const id=`M${String(n).padStart(3,'0')}`;
      expect(assurance.CONTRACTS[id]).toBeDefined();
      expect(assurance.CONTRACTS[id].name).toBeTruthy();
      expect(assurance.CONTRACTS[id].domain).toBeTruthy();
      expect(assurance.CONTRACTS[id].required.length).toBeGreaterThan(0);
      expect(assurance.CONTRACTS[id].invariant).toBeTruthy();
      expect(assurance.CONTRACTS[id].ai).toBeTruthy();
    }
  });

  test('security-sensitive contracts reject unsafe states', () => {
    expect(assurance.validateModule('M007',{flag_key:'x',environment:'production',rollout_percentage:101}).valid).toBe(false);
    expect(assurance.validateModule('M009',{timezone:'not-a-timezone'}).valid).toBe(false);
    expect(assurance.validateModule('M033',{land_id:'L1',lessor:'A',lessee:'B',start_date:'2026-09-20',end_date:'2026-09-10'}).valid).toBe(false);
  });

  test('farmer and community controls produce meaningful risk signals', async () => {
    const kyc=await assurance.assess('M024',{farmer_id:'F1',document_type:'aadhaar',document_reference:'DOC1',verification_status:'verified'});
    expect(kyc.risk_signals).toContain('unattributed_kyc_verification');
    const shg=await assurance.assess('M046',{group_id:'G1',members:['F1','F1'],meeting_frequency:'monthly'});
    expect(shg.risk_signals).toContain('duplicate_shg_member');
    const coop=await assurance.assess('M047',{cooperative_id:'C1',members:['F1'],member_shares_total:100,ledger_share_total:90});
    expect(coop.risk_signals).toContain('cooperative_share_ledger_mismatch');
  });
});
