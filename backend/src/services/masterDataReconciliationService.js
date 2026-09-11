const masterData = require('./masterDataIntelligenceService');

class MasterDataReconciliationService {
  normalizeEntity(entity) {
    return { ...entity, name: masterData.normalize(entity.name), code: masterData.normalize(entity.code) };
  }
  reconcileRecords(records, key='name') {
    return masterData.findDuplicates(records.map(this.normalizeEntity.bind(this)), key);
  }
  qualityRules(entity) {
    const findings=[];
    if (!entity?.name || !String(entity.name).trim()) findings.push({rule_code:'MD_REQUIRED_NAME',severity:'error'});
    if (!entity?.code || !String(entity.code).trim()) findings.push({rule_code:'MD_REQUIRED_CODE',severity:'error'});
    return findings;
  }
}
module.exports = new MasterDataReconciliationService();
