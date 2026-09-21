'use strict';

const pool = require('../../database/pool');

const round = (n) => Math.round(n * 10000) / 10000;
function scoreCandidate(demand, capability) {
  const quantity = Number(demand.quantity || 0); const capacity = Number(capability.availableCapacity || 0);
  const requiredSkills = demand.requiredSkills || []; const skills = new Set(capability.skills || []);
  const skillCoverage = requiredSkills.length ? requiredSkills.filter((x) => skills.has(x)).length / requiredSkills.length : 1;
  const capacityCoverage = quantity > 0 ? Math.min(1, capacity / quantity) : 0;
  const quality = Math.max(0, Math.min(1, Number(capability.qualityScore || 0) / 100));
  const delivery = Math.max(0, Math.min(1, 1 - Math.max(0, Number(capability.leadDays || 0) - Number(demand.maxLeadDays || 0)) / Math.max(1, Number(demand.maxLeadDays || 1))));
  const quoted = Number(capability.unitCost || 0); const ceiling = Number(demand.maxUnitCost || 0);
  const cost = ceiling > 0 && quoted > 0 ? Math.max(0, Math.min(1, ceiling / quoted)) : 0;
  const underserved = Math.max(0, Math.min(1, Number(capability.underservedShare || 0)));
  const feasibility = round(skillCoverage * .35 + capacityCoverage * .30 + quality * .20 + delivery * .15);
  const fairness = round(underserved * .65 + Math.min(1, Number(capability.priorAwards || 0) === 0 ? 1 : 1 / Number(capability.priorAwards)) * .35);
  const total = round(feasibility * .60 + fairness * .20 + cost * .20);
  return { feasibility, fairness, cost: round(cost), total, eligible: skillCoverage === 1 && capacity > 0 && delivery > 0,
    evidence: { skillCoverage: round(skillCoverage), capacityCoverage: round(capacityCoverage), quality: round(quality), delivery: round(delivery) } };
}

async function createCapability(data, actor) {
  const { rows } = await pool.query(`INSERT INTO village_capability_profiles
   (tenant_id,village_id,entity_type,entity_id,display_name,skills,certifications,available_capacity,capacity_unit,lead_days,unit_cost,quality_score,underserved_share,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
  [data.tenantId,data.villageId,data.entityType,data.entityId,data.displayName,data.skills||[],data.certifications||[],data.availableCapacity,data.capacityUnit,data.leadDays,data.unitCost,data.qualityScore||0,data.underservedShare||0,actor]); return rows[0];
}
async function createDemand(data, actor) { const { rows } = await pool.query(`INSERT INTO institutional_demand_briefs
 (tenant_id,buyer_id,title,specification,quantity,unit,max_unit_cost,max_lead_days,required_skills,delivery_location,state,created_by)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11) RETURNING *`,[data.tenantId,data.buyerId,data.title,data.specification,data.quantity,data.unit,data.maxUnitCost,data.maxLeadDays,data.requiredSkills||[],data.deliveryLocation,actor]); return rows[0]; }
async function rankDemand(id) { const demand=(await pool.query('SELECT * FROM institutional_demand_briefs WHERE id=$1',[id])).rows[0]; if(!demand) throw new Error('Demand brief not found'); const caps=(await pool.query('SELECT *,0 prior_awards FROM village_capability_profiles WHERE tenant_id=$1 AND status=\'active\'',[demand.tenant_id])).rows; return caps.map(c=>({capability:c,score:scoreCandidate({quantity:demand.quantity,maxUnitCost:demand.max_unit_cost,maxLeadDays:demand.max_lead_days,requiredSkills:demand.required_skills},{availableCapacity:c.available_capacity,unitCost:c.unit_cost,leadDays:c.lead_days,qualityScore:c.quality_score,underservedShare:c.underserved_share,skills:c.skills,priorAwards:c.prior_awards})})).filter(x=>x.score.eligible).sort((a,b)=>b.score.total-a.score.total||String(a.capability.id).localeCompare(String(b.capability.id))); }

module.exports={scoreCandidate,createCapability,createDemand,rankDemand};
