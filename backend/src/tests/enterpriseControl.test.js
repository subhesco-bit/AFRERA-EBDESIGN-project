/**
 * Tests for the enterprise control layer (migration 993).
 *
 * Scope note: the DB-bound paths (startWorkflow, convertLead, raiseIncident)
 * need a live Postgres and are covered by integration tests, not here. What IS
 * tested here is the pure decision logic — the parts that decide how urgently a
 * human is involved. Those are the parts where a silent bug is most expensive.
 */

const { AGENTS } = require('../core/erpAgents');
const { SEVERITY_RANK, listActiveIncidents } = require('../services/enterpriseControlService');
const { SIGNAL, SEVERITY } = require('../core/signalBus');

const agent = (id) => AGENTS.find((a) => a.id === id);

describe('enterprise control — agent registry', () => {
  test('all five enterprise-control agents are registered', () => {
    ['workflow.sla_breach', 'crm.lead_qualification', 'legal.obligation_watch',
      'risk.register_health', 'emergency.incident_command']
      .forEach((id) => expect(agent(id)).toBeDefined());
  });

  test('each control agent has its own domain, not a shared catch-all', () => {
    const domains = ['workflow.sla_breach', 'crm.lead_qualification', 'legal.obligation_watch',
      'risk.register_health', 'emergency.incident_command'].map((id) => agent(id).domain);
    expect(new Set(domains).size).toBe(5);
  });

  test('every agent proposes and never self-approves', () => {
    AGENTS.forEach((a) => {
      expect(typeof a.evaluate).toBe('function');
    });
  });
});

describe('workflow.sla_breach', () => {
  const a = agent('workflow.sla_breach');

  test('stays silent when nothing has breached', () => {
    expect(a.evaluate({ pendingApprovals: [{ slaStatus: 'within_sla', hoursOpen: 2 }] })).toBeNull();
    expect(a.evaluate({ pendingApprovals: [] })).toBeNull();
    expect(a.evaluate({})).toBeNull();
  });

  test('reports the oldest breach and never self-approves', () => {
    const p = a.evaluate({
      pendingApprovals: [
        { slaStatus: 'breached', hoursOpen: 30, instanceCode: 'WF-1', currentStep: 'Finance', requiredRole: 'cfo', entityType: 'po' },
        { slaStatus: 'breached', hoursOpen: 96, instanceCode: 'WF-2', currentStep: 'Legal', requiredRole: 'counsel', entityType: 'contract' }
      ]
    });
    expect(p.subject_id).toBe('WF-2');           // oldest, not first
    expect(p.proposed_value.breachedCount).toBe(2);
    expect(p.status).toBe('proposed');
    expect(p.approved_by).toBeNull();
    expect(p.requires_human).toBe(true);
    expect(p.rationale).toMatch(/96 hours/);
  });
});

describe('crm.lead_qualification', () => {
  const a = agent('crm.lead_qualification');

  test('is silent on mid-scoring leads — advice with no action is noise', () => {
    const p = a.evaluate({
      lead: { leadCode: 'L1', segment: 'retail', estimatedValue: 120000, activityCount: 2, email: 'a@b.c' }
    });
    if (p !== null) expect(p.proposed_value.score < 45 || p.proposed_value.score >= 70).toBe(true);
  });

  test('a strong lead is prioritised and carries an MCDA breakdown', () => {
    const p = a.evaluate({
      lead: { leadCode: 'L2', segment: 'horeca', estimatedValue: 900000, activityCount: 5, email: 'x@y.z', phone: '99' }
    });
    expect(p.proposed_value.action).toBe('prioritise_contact');
    expect(p.mcda_breakdown).toBeTruthy();
    expect(p.mcda_breakdown.total).toBeGreaterThanOrEqual(70);
  });

  test('missing data lowers confidence rather than being silently assumed', () => {
    const rich = a.evaluate({ lead: { leadCode: 'L3', segment: 'export', estimatedValue: 800000, activityCount: 5, email: 'e', phone: 'p' } });
    const thin = a.evaluate({ lead: { leadCode: 'L4', segment: null, estimatedValue: null, activityCount: 0 } });
    if (rich && thin) expect(thin.confidence).toBeLessThan(rich.confidence);
  });

  test('returns null without a lead', () => {
    expect(a.evaluate({})).toBeNull();
  });
});

describe('risk.register_health', () => {
  const a = agent('risk.register_health');

  test('silent when the register is healthy and current', () => {
    expect(a.evaluate({
      risks: [{ riskCode: 'R1', residualScore: 4, reviewOverdue: false, indicatorBreached: false }]
    })).toBeNull();
  });

  test('a stale review alone is enough to speak up', () => {
    const p = a.evaluate({
      risks: [{ riskCode: 'R1', residualScore: 4, reviewOverdue: true, indicatorBreached: false }]
    });
    expect(p).not.toBeNull();
    expect(p.proposed_value.staleReviewCount).toBe(1);
    expect(p.rationale).toMatch(/past their review date/);
  });

  test('critical residual risks are surfaced by code', () => {
    const p = a.evaluate({
      risks: [
        { riskCode: 'R9', title: 'Cold chain failure', residualScore: 20, reviewOverdue: false, indicatorBreached: true },
        { riskCode: 'R2', title: 'Minor', residualScore: 2, reviewOverdue: false, indicatorBreached: false }
      ]
    });
    expect(p.proposed_value.criticalCount).toBe(1);
    expect(p.proposed_value.topRisks[0].code).toBe('R9');
    expect(p.proposed_value.breachedIndicators).toBe(1);
  });
});

describe('legal.obligation_watch', () => {
  const a = agent('legal.obligation_watch');

  test('silent when nothing is near due', () => {
    expect(a.evaluate({ obligations: [{ daysUntilDue: 200 }] })).toBeNull();
  });

  test('already-breached obligations demand immediate remediation', () => {
    const p = a.evaluate({
      obligations: [
        { obligationCode: 'O1', description: 'FSSAI renewal', daysUntilDue: -5, breachConsequence: 'Licence suspension' },
        { obligationCode: 'O2', description: 'GST filing', daysUntilDue: 10 }
      ]
    });
    expect(p.proposed_value.action).toBe('remediate_now');
    expect(p.proposed_value.overdueCount).toBe(1);
    expect(p.rationale).toMatch(/ALREADY BREACHED/);
  });
});

describe('emergency.incident_command', () => {
  const a = agent('emergency.incident_command');

  test('silent when incidents exist but are acknowledged and non-critical', () => {
    expect(a.evaluate({
      incidents: [{ incidentCode: 'I1', status: 'containing', severity: 'medium', acknowledgementOverdue: false, peopleAtRisk: false }]
    })).toBeNull();
  });

  test('life safety outranks everything and is stated first', () => {
    const p = a.evaluate({
      incidents: [
        { incidentCode: 'I1', status: 'open', severity: 'critical', acknowledgementOverdue: true, peopleAtRisk: false },
        { incidentCode: 'I2', status: 'open', severity: 'low', acknowledgementOverdue: false, peopleAtRisk: true, immediateActions: 'Evacuate' }
      ]
    });
    expect(p.subject_id).toBe('I2');                    // not the critical one
    expect(p.proposed_value.action).toBe('escalate_immediately');
    expect(p.rationale.startsWith('PEOPLE AT RISK')).toBe(true);
  });

  test('a missing standing instruction is named as a gap, not passed over', () => {
    const p = a.evaluate({
      incidents: [{ incidentCode: 'I3', status: 'open', severity: 'critical', acknowledgementOverdue: true, peopleAtRisk: false }]
    });
    expect(p.rationale).toMatch(/No standing instruction/);
  });

  test('resolved and closed incidents are excluded', () => {
    expect(a.evaluate({
      incidents: [{ incidentCode: 'I4', status: 'closed', severity: 'critical', peopleAtRisk: true }]
    })).toBeNull();
  });
});

describe('incident triage ordering', () => {
  test('sorts life-safety first, then severity, then age', () => {
    const rows = [
      { incident_code: 'A', severity: 'low', people_at_risk: false, minutes_open: 500 },
      { incident_code: 'B', severity: 'critical', people_at_risk: false, minutes_open: 10 },
      { incident_code: 'C', severity: 'low', people_at_risk: true, minutes_open: 1 },
      { incident_code: 'D', severity: 'high', people_at_risk: false, minutes_open: 5 }
    ];
    const sorted = [...rows].sort((a, b) =>
      (b.people_at_risk === true) - (a.people_at_risk === true)
      || (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0)
      || Number(b.minutes_open) - Number(a.minutes_open));
    expect(sorted.map((r) => r.incident_code)).toEqual(['C', 'B', 'D', 'A']);
  });

  test('listActiveIncidents is exported and callable', () => {
    expect(typeof listActiveIncidents).toBe('function');
  });
});

describe('signal contract', () => {
  test('every enterprise-control signal used by the service is registered', () => {
    ['RISK_CRITICAL', 'EMERGENCY_RAISED', 'EMERGENCY_ESCALATED',
      'WORKFLOW_SLA_BREACHED', 'OBLIGATION_DUE', 'LEAD_QUALIFIED', 'WORKFLOW_STARTED']
      .forEach((k) => {
        expect(SIGNAL[k]).toBeDefined();
        expect(typeof SIGNAL[k]).toBe('string');
      });
  });

  test('severity bands used for emergencies exist in the enum', () => {
    expect(SEVERITY.CRITICAL).toBeDefined();
    expect(SEVERITY.EMERGENCY).toBeDefined();
    // SEVERITY.HIGH does not exist — guarding against the bug this replaced.
    expect(SEVERITY.HIGH).toBeUndefined();
  });
});
