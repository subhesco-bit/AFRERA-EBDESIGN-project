'use strict';
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { OS_ITEMS, OS_STAGES } = require('./catalog');
const { chainFor, composeOs, emitOsCatalog, emitOsTodos, filterOs } = require('./compose');
const { NEED_INTENTS, rankIntents } = require('./intents');
const { evidencePassport } = require('./passport');
const { MATRIX_LINKS } = require('./matrix');
const { enhanceFor } = require('./enhance');
const { remainingWork, todoCounts } = require('./todos');
const { evaluateConstitution } = require('./constitution');
const { envelopeFor, envelopeInventedRupee } = require('./envelope');
const { canAdvance, livingAgriculture, SECTOR_JOURNEYS } = require('./journeys');
const { livingEvents, unknownEventFails } = require('./events');
const { grievancesFrom } = require('./grievance');
const { assessSuitability } = require('./suitability');
const {
  allStagesComplete,
  autoOp,
  blockLog,
  climateAutopilot,
  closePeriod,
  compareLots,
  consentGrant,
  coopLicense,
  engCalc,
  enqueueOffline,
  esgAttribution,
  evalHarness,
  farmTwin,
  federatedAsk,
  fileClaim,
  formInconsistencies,
  infraTwin,
  inspectCell,
  neverTranslate,
  personalTwin,
  policyLab,
  proofOfDelivery,
  protectionGap,
  scenario,
  schemeRule,
  syncOffline,
  term,
  travelPlan,
} = require('./index');

describe('digital super-organism registry', () => {
  it('classifies every catalog item — Stage 0 complete', () => {
    const os = composeOs();
    assert.ok(OS_ITEMS.length >= 90, `catalog ${OS_ITEMS.length}`);
    assert.equal(os.classified, OS_ITEMS.length);
    assert.equal(os.stage0Pct, 100);
    assert.equal(OS_STAGES.length, 7);
    const ids = OS_ITEMS.map((x) => x.id);
    assert.equal(ids.length, new Set(ids).size);
    for (const x of OS_ITEMS) {
      assert.ok(x.name.trim(), x.id);
      assert.ok(x.present.trim(), x.id);
      assert.ok(x.missing.trim(), x.id);
      assert.ok(x.next.trim(), x.id);
      assert.ok(x.organs.length >= 1, x.id);
      assert.ok(x.href.startsWith('/'), x.id);
    }
  });

  it('does not claim GitHub is the kernel', () => {
    const os = composeOs();
    assert.ok(os.kernelVerified >= 15, `verified ${os.kernelVerified}`);
    assert.ok(os.githubScaffolded >= 10);
    assert.equal(os.open, 0);
    assert.equal(os.blocked, 0);
    const auth = OS_ITEMS.find((x) => x.id === 'c-auth');
    assert.equal(auth?.kernel, 'verified');
    assert.equal(auth?.github, 'disconnected');
  });

  it('marks living innovations as done: passport, need, exception, rules, assist, suit, grief', () => {
    for (const id of [
      'n-passport',
      'n-need',
      'n-exception',
      'n-rules',
      'n-assist',
      'g-sot',
      'b-gov',
      'n-suit',
      'n-grief',
      'n-event',
      'b-consent',
      'a-comp',
    ]) {
      assert.equal(OS_ITEMS.find((x) => x.id === id)?.todo, 'done', id);
      assert.ok(['verified', 'partial'].includes(OS_ITEMS.find((x) => x.id === id)?.kernel ?? ''), id);
    }
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-scheme')?.kernel, 'partial');
    assert.equal(OS_ITEMS.find((x) => x.id === 'b-off')?.kernel, 'verified');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-eng')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-eng')?.kernel, 'partial');
    assert.equal(OS_ITEMS.find((x) => x.id === 'g-eng')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'n-profile')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-travel')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-body')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-body')?.kernel, 'partial');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-body')?.href, '/body');
    assert.equal(OS_ITEMS.find((x) => x.id === 'n-relax')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'n-relax')?.href, '/body');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-vet')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-vet')?.href, '/vet');
    assert.equal(OS_ITEMS.find((x) => x.id === 'n-lineage')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-vet-code')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-vet-code')?.href, '/vet');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-share')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-share')?.href, '/share');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-organic')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'n-share')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-share')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-share')?.href, '/share');
    assert.equal(OS_ITEMS.find((x) => x.id === 'f-infra')?.href, '/share');
    assert.equal(OS_ITEMS.find((x) => x.id === 'f-reflex')?.href, '/body');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-flows')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-flows')?.href, '/flows');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-erp-atlas')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-erp-atlas')?.href, '/platform');
    assert.equal(OS_ITEMS.find((x) => x.id === 'n-stake')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-erp-manage')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'b-nested')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-ai-atlas')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'c-ai-atlas')?.href, '/brain');
    assert.equal(OS_ITEMS.find((x) => x.id === 'n-ai-ack')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-travel')?.kernel, 'partial');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-brain')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-frontier')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-agentic')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-physical')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-sec')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'a-scientist')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'f-fed')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'f-policy')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'f-infra')?.todo, 'done');
    assert.equal(OS_ITEMS.find((x) => x.id === 'f-coop')?.todo, 'done');
  });

  it('filters stages and traces the 16-link concept → runtime matrix', () => {
    const s0 = filterOs({ stage: 0 });
    assert.ok(s0.length >= 3);
    const chain = chainFor('n-passport');
    assert.ok(chain?.concept.includes('Passport'));
    assert.match(chain?.database ?? '', /remaining/);
    assert.equal(MATRIX_LINKS.length, 16);
    for (const k of MATRIX_LINKS) {
      assert.ok(chain && String(chain[k]).trim(), k);
    }
  });

  it('need intents are problems, not module names', () => {
    assert.ok(NEED_INTENTS.some((i) => i.id === 'sell-crop'));
    assert.ok(NEED_INTENTS.some((i) => i.id === 'see-flows'));
    assert.ok(NEED_INTENTS.some((i) => i.id === 'see-atlas'));
    assert.ok(NEED_INTENTS.some((i) => i.id === 'ack-ai'));
    assert.ok(NEED_INTENTS.some((i) => i.id === 'react-now'));
    assert.ok(NEED_INTENTS.some((i) => i.id === 'code-herd'));
    assert.ok(NEED_INTENTS.some((i) => i.id === 'book-muscle'));
    assert.ok(NEED_INTENTS.some((i) => i.id === 'trace-organic'));
    assert.ok(NEED_INTENTS.every((i) => i.href.startsWith('/')));
    const ranked = rankIntents(null);
    assert.equal(ranked.length, NEED_INTENTS.length);
  });

  it('evidence passport never invents a premium or a price', () => {
    const lot = {
      id: 'lot-x',
      cellId: 'c1',
      cellName: 'Enghi',
      fpoId: 'f1',
      variety: 'Chakhao Poireiton',
      commodity: 'rice',
      grams: 510000,
      remainingGrams: 510000,
      grade: null,
      giMarker: 'GI-AS-CHAKHAO',
      moistureBp: null,
      status: 'minted',
      coverStatus: 'bound',
      policyId: 'POL-LANGTHASA-GODOWN',
      plantingId: null,
      giMinted: true,
      mintedAt: '2026-01-01',
      fusScore: 74,
      fusComplete: false,
    };
    const books = {
      lots: [lot],
      receipts: [],
      orders: [],
      journal: [],
      giChain: [{ id: 'g1', lotId: 'lot-x', seq: 1, event: 'mint', handler: 'Biren', geo: 'Langthasa', season: 'Magh 2026', createdAt: '2026-01-01' }],
      kpis: { journalBalanced: true },
    };
    const p = evidencePassport(lot, books);
    assert.equal(p.complete, true);
    assert.ok(p.atoms.some((a) => a.kind === 'cover' && a.confidence === 'declared'));
    assert.ok(p.atoms.some((a) => a.kind === 'paymentRef' && a.confidence === 'absent'));
    assert.ok(!p.atoms.some((a) => /premium|invent/i.test(a.value)));
  });

  it('enhances every concept at four simultaneous levels', () => {
    for (const x of OS_ITEMS) {
      const levels = enhanceFor(x.id);
      assert.equal(levels?.length, 4, x.id);
      assert.deepEqual(levels?.map((l) => l.level), ['component', 'industry', 'rural', 'future']);
    }
  });

  it('closes every stage: done or honestly blocked — never paints CFD or tourism', () => {
    const os = composeOs();
    assert.equal(os.stagesComplete, true);
    assert.equal(os.open, 0);
    for (const s of OS_STAGES) {
      assert.equal(os.stageDone[s.stage].pct, 100, `stage ${s.stage}`);
      assert.equal(os.stageDone[s.stage].closed, os.stageDone[s.stage].total, `stage ${s.stage} closed`);
    }
    const counts = todoCounts();
    assert.equal(counts.total, OS_ITEMS.length);
    assert.equal(counts.open, 0);
    assert.equal(counts.blocked, 0);
    assert.equal(remainingWork(12).length, 0);
    const rural = OS_ITEMS.find((x) => x.id === 'g-rural');
    assert.ok(rural?.present.includes('offline queue'));
    assert.ok(!rural?.next.includes('Offline does not'));
  });

  it('registry dump matches the kernel: 0 open, stages 0–6 closed, docs in sync', () => {
    const dump = emitOsCatalog();
    const todos = emitOsTodos();
    assert.equal(dump.snapshot.open, 0);
    assert.equal(dump.snapshot.stagesComplete, true);
    assert.equal(todos.counts.open, 0);
    assert.ok(todos.remaining.every((t) => t.status === 'blocked'));
    assert.equal(todos.remaining.length, 0);
    const disk = JSON.parse(readFileSync(path.join(__dirname, '../../../docs/os/catalog.json'), 'utf8'));
    assert.equal(disk.snapshot.open, 0);
    assert.equal(disk.snapshot.stagesComplete, true);
  });

  it('constitution blocks inferred caste and rupee writes', () => {
    assert.equal(evaluateConstitution({}).allowed, true);
    assert.equal(evaluateConstitution({ inferredTrait: 'caste' }).allowed, false);
    assert.ok(evaluateConstitution({ rupeeWrite: true }).violated.includes('E3'));
    assert.ok(evaluateConstitution({ eligibilityFromConstraint: true }).violated.includes('E4'));
  });

  it('AI envelope never writes a rupee', () => {
    const env = envelopeFor({ organ: 'orders', body: 'Propose settle. Clerk names paymentRef.', action: 'settle' });
    assert.equal(env.humanApproval, 'required');
    assert.match(env.actionBoundary, /propose/);
    assert.equal(envelopeInventedRupee(env), false);
  });

  it('agriculture journey is living; remaining journey is living; finance cannot be skipped as living', () => {
    const agri = SECTOR_JOURNEYS.find((j) => j.id === 'agriculture');
    assert.equal(agri?.status, 'living');
    assert.ok(livingAgriculture().some((s) => s.id === 'harvest'));
    assert.equal(canAdvance('harvest', 'store'), true);
    assert.equal(canAdvance('plan', 'finance'), false);
    assert.equal(agri?.steps.find((s) => s.id === 'finance')?.status, 'missing');
    assert.equal(agri?.steps.find((s) => s.id === 'procure')?.status, 'missing');
    const trip = SECTOR_JOURNEYS.find((j) => j.id === 'travel');
    assert.equal(trip?.status, 'living');
    assert.equal(trip?.steps.find((s) => s.id === 'v-tourism')?.status, 'missing');
    const herd = SECTOR_JOURNEYS.find((j) => j.id === 'livestock');
    assert.equal(herd?.status, 'living');
    assert.equal(herd?.steps.find((s) => s.id === 'vet-cash')?.status, 'missing');
    assert.equal(SECTOR_JOURNEYS.find((j) => j.id === 'health')?.status, 'named');
    const muscle = SECTOR_JOURNEYS.find((j) => j.id === 'shared-infra');
    assert.equal(muscle?.status, 'living');
    assert.equal(muscle?.steps.find((s) => s.id === 'share-book')?.status, 'living');
    assert.equal(muscle?.steps.find((s) => s.id === 'share-gst')?.status, 'missing');
    assert.equal(muscle?.steps.find((s) => s.id === 'share-rent')?.status, 'missing');
  });

  it('living events fire; unknown events fail; flood opens a claim window', () => {
    assert.ok(livingEvents().some((e) => e.id === 'harvest.completed'));
    assert.ok(livingEvents().some((e) => e.id === 'weather.alert'));
    assert.ok(livingEvents().some((e) => e.id === 'share.booked'));
    assert.ok(livingEvents().some((e) => e.id === 'organic.traced'));
    assert.equal(unknownEventFails('weather.tornado'), true);
    assert.equal(unknownEventFails('harvest.completed'), false);
  });

  it('suitability refuses loan, travel, invented premium; cover may bind', () => {
    assert.equal(assessSuitability('loan').refuse, true);
    assert.equal(assessSuitability('travel').refuse, true);
    assert.equal(assessSuitability('insurance-quote').refuse, true);
    assert.equal(assessSuitability('price').refuse, true);
    assert.equal(assessSuitability('price', { declared: true }).suitable, true);
    assert.equal(assessSuitability('cover').suitable, true);
    assert.equal(assessSuitability('cover').refuse, false);
  });

  it('grievance spine files village gates and never invents a rupee', () => {
    const cases = grievancesFrom([
      {
        code: 'G2',
        severity: 'defer',
        title: '1 offtake waits on paymentRef',
        body: 'Clerk names the payment.',
        href: '/trade',
        impact: 'cell',
        owner: 'clerk',
        action: 'Name paymentRef.',
      },
      {
        code: 'G9',
        severity: 'note',
        title: 'AI cannot write rupees',
        body: 'Firewall.',
        href: '/modules',
        impact: 'policy',
        owner: 'spine',
        action: 'Keep the firewall.',
      },
    ]);
    assert.equal(cases.length, 1);
    assert.equal(cases[0].source, 'G2');
    assert.equal(cases[0].inventsRupee, false);
    assert.equal(cases[0].stage, 'ack');
  });

  it('stage runtime: period, offline, schemes, climate, twin — never invents ₹', () => {
    assert.equal(allStagesComplete(), true);
    const closed = closePeriod({ season: 'Magh 2026', balanced: true, clerk: 'Biren' });
    assert.equal(closed.status, 'closed');
    assert.equal(closed.rupee, null);
    assert.equal(closePeriod({ season: 'Magh 2026', balanced: false, clerk: 'Biren' }).status, 'blocked');

    const q = enqueueOffline('harvest', 'lot-x 50kg');
    const synced = syncOffline(q, 'rcpt-1');
    assert.equal(synced.receipt, 'rcpt-1');
    assert.throws(() => syncOffline(q, ' '));

    const sch = schemeRule({
      code: 'PM-KISAN',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      acresCenti: 240,
      plantingCount: 1,
      horticulture: false,
      amountPaise: null,
    });
    assert.equal(sch.eligible, true);
    assert.equal(sch.amountPaise, null);
    assert.throws(() =>
      schemeRule({
        code: 'PM-KISAN',
        effectiveFrom: '2026-01-01',
        effectiveTo: '2026-12-31',
        acresCenti: 240,
        plantingCount: 1,
        horticulture: false,
        amountPaise: 600000,
      }),
    );

    const claim = fileClaim({ lotId: 'lot-x', policyId: 'POL-LANGTHASA-WEATHER', hazard: 'flood', payoutPaise: null });
    assert.equal(claim.payoutPaise, null);
    assert.throws(() => fileClaim({ lotId: 'lot-x', policyId: 'POL', hazard: 'flood', payoutPaise: 1 }));

    const climate = climateAutopilot({
      alert: true,
      outage: true,
      iotTempC: 31.4,
      remainingGrams: 100000,
      clerkLossGrams: null,
    });
    assert.equal(climate.process, 'block');
    assert.equal(climate.claimOpen, true);
    assert.equal(climate.freezeEmi, false);
    assert.equal(climate.moved, false);
    assert.equal(climate.remainingGrams, 100000);
    assert.deepEqual([...climate.why].sort(), ['alert', 'heat', 'outage']);
    const quiet = climateAutopilot({
      alert: false,
      outage: false,
      iotTempC: 22,
      remainingGrams: 100000,
      clerkLossGrams: null,
    });
    assert.equal(quiet.process, 'pass');
    assert.deepEqual(quiet.why, []);
    const overflow = climateAutopilot({
      alert: true,
      outage: false,
      iotTempC: null,
      remainingGrams: 100000,
      clerkLossGrams: 400000,
    });
    assert.equal(overflow.moved, false);
    assert.equal(overflow.remainingGrams, 100000);
    assert.equal(overflow.process, 'block');
    const log = blockLog({
      balanced: false,
      clerk: 'Biren',
      outage: true,
      alert: true,
      iotTempC: 31.4,
      remainingGrams: 100000,
      rupeeWrite: true,
    });
    assert.equal(log.find((l) => l.domain === 'period')?.decision, 'block');
    assert.equal(log.find((l) => l.domain === 'mill')?.decision, 'block');
    assert.match(log.find((l) => l.domain === 'mill')?.reason ?? '', /outage/);
    assert.equal(log.find((l) => l.domain === 'rupee')?.decision, 'block');
    assert.ok(log.filter((l) => l.domain === 'catalog').length === 0);
    assert.ok(!log.some((l) => /a-travel/.test(l.reason)));
    const moved = climateAutopilot({
      alert: true,
      outage: true,
      iotTempC: 31.4,
      remainingGrams: 100000,
      clerkLossGrams: 40000,
    });
    assert.equal(moved.moved, true);
    assert.equal(moved.remainingGrams, 60000);

    assert.equal(proofOfDelivery({ lotId: 'lot-x', declared: true, etaMinutes: null }).eta, null);
    assert.throws(() => proofOfDelivery({ lotId: 'lot-x', declared: true, etaMinutes: 40 }));
    assert.throws(() => esgAttribution({ spoilageGrams: 40000, kwh: null, emissionsKg: 12 }));
    assert.equal(protectionGap({ coverBound: true, premiumPaise: null }).quote, null);
    assert.equal(evalHarness({ libraryHit: true, rupeeWrite: true, cited: true }).pass, false);
    assert.equal(autoOp({ kind: 'library-reflex', rupeeWrite: true, clerkApproved: true, risk: 'low' }).status, 'blocked');
    assert.equal(autoOp({ kind: 'library-reflex', rupeeWrite: false, clerkApproved: false, risk: 'low' }).status, 'ran');
    assert.equal(personalTwin('loan').refuse, true);
    assert.equal(personalTwin('store').autoExecute, false);
    assert.equal(scenario({ remainingGrams: 100000, lossPctDeclared: 10 }).rupee, null);
    assert.equal(farmTwin({ remainingGrams: 100000, lossPctDeclared: 10 }).autoExecute, false);
    assert.equal(compareLots([{ id: 'a', remainingGrams: 1, fus: 74, pricePaise: 999 }, { id: 'b', remainingGrams: 9, fus: 63, pricePaise: 1 }]).usedPrice, false);
    assert.deepEqual(formInconsistencies({ pricePaisePerKg: 0 }), ['Zero price is not a declared sale.']);
    const consent = consentGrant('no-onion', 'kitchen-filter', true);
    assert.equal(consent.granted, true);
    assert.throws(() => consentGrant('veg', 'eligibility', true));
    assert.equal(neverTranslate('firewall'), true);
    assert.equal(term('firewall', 'hi'), 'AI cannot write rupees');
    assert.equal(SECTOR_JOURNEYS.find((j) => j.id === 'insurance')?.status, 'living');
    assert.equal(SECTOR_JOURNEYS.find((j) => j.id === 'government')?.status, 'living');
    assert.equal(SECTOR_JOURNEYS.find((j) => j.id === 'engineering')?.status, 'living');
    assert.equal(SECTOR_JOURNEYS.find((j) => j.id === 'travel')?.status, 'living');
  });

  it('rectifies catalog blocks honestly: remaining journey lives; tourism refused', () => {
    const stamped = engCalc({
      qty: 12,
      unit: 'm',
      standard: 'IS 456',
      engineer: 'Biren',
      ratePaise: 400,
      simulateCfd: false,
    });
    assert.equal(stamped.status, 'stamped');
    assert.equal(stamped.amountPaise, 4800);
    assert.equal(stamped.cfd, false);
    const undeclared = engCalc({
      qty: 12,
      unit: 'm',
      standard: 'IS 456',
      engineer: 'Biren',
      ratePaise: null,
      simulateCfd: false,
    });
    assert.equal(undeclared.amountPaise, null);
    assert.equal(undeclared.status, 'stamped');
    assert.equal(
      engCalc({
        qty: 12,
        unit: 'm',
        standard: 'IS 456',
        engineer: 'Biren',
        ratePaise: null,
        simulateCfd: true,
      }).status,
      'blocked',
    );
    assert.equal(
      engCalc({
        qty: 12,
        unit: 'm',
        standard: 'IS 456',
        engineer: ' ',
        ratePaise: null,
        simulateCfd: false,
      }).reason,
      'Professional stamp required.',
    );
    assert.throws(() =>
      engCalc({
        qty: 12,
        unit: 'm',
        standard: 'IS 456',
        engineer: 'Biren',
        ratePaise: -1,
        simulateCfd: false,
      }),
    );

    const consent = consentGrant('no-onion', 'kitchen-filter', true);
    const seen = inspectCell({
      cellId: 'c-enghi',
      remainingGrams: 180000,
      consents: [consent],
    });
    assert.equal(seen.login, false);
    assert.equal(seen.profile, false);
    assert.equal(seen.remainingGrams, 180000);
    const revoked = inspectCell({
      cellId: 'c-enghi',
      remainingGrams: 180000,
      consents: [consent],
      revokePurpose: 'kitchen-filter',
    });
    assert.equal(revoked.consents[0]?.granted, false);
    assert.throws(() => inspectCell({ cellId: ' ', remainingGrams: 1, consents: [] }));

    const empty = travelPlan();
    assert.equal(empty.status, 'blocked');
    assert.equal(empty.refuse, true);
    assert.equal(empty.itinerary, null);
    const planned = travelPlan({ remainingGrams: 180000, kitchenAccess: true, millBlocked: false });
    assert.equal(planned.status, 'planned');
    assert.equal(planned.refuse, false);
    assert.equal(planned.budgetPaise, null);
    assert.equal(planned.itinerary?.length, 5);
    assert.equal(travelPlan({ remainingGrams: 180000, tourism: true }).status, 'blocked');
    assert.throws(() => travelPlan({ remainingGrams: 180000, budgetPaise: 500 }));

    const local = federatedAsk({
      cells: [
        { cellId: 'c-enghi', remainingGrams: 180000 },
        { cellId: 'c-haflong', remainingGrams: 90000 },
      ],
      national: false,
    });
    assert.equal(local.national, null);
    assert.equal(local.trained, false);
    assert.equal(local.centralized, false);
    assert.equal(local.local.length, 2);
    const nation = federatedAsk({
      cells: [{ cellId: 'c-enghi', remainingGrams: 180000 }],
      national: true,
    });
    assert.equal(nation.national, null);
    assert.match(nation.reason, /National/);

    const lab = policyLab({
      code: 'PM-KISAN',
      acresCenti: 240,
      plantingCount: 1,
      horticulture: false,
      gazette: false,
      amountPaise: null,
    });
    assert.equal(lab.eligible, true);
    assert.equal(lab.amountPaise, null);
    assert.equal(lab.gazette, false);
    assert.equal(lab.live, false);
    assert.equal(
      policyLab({
        code: 'PM-KISAN',
        acresCenti: 240,
        plantingCount: 1,
        horticulture: false,
        gazette: true,
        amountPaise: null,
      }).reason,
      'Gazette twin refused. Scheme what-if stays on this kernel.',
    );
    assert.throws(() =>
      policyLab({
        code: 'PM-KISAN',
        acresCenti: 240,
        plantingCount: 1,
        horticulture: false,
        gazette: false,
        amountPaise: 600000,
      }),
    );

    const twin = infraTwin({
      tempC: 31.4,
      kwh: 12,
      waterLitres: 40,
      capacityKw: null,
      thermalTwin: false,
    });
    assert.equal(twin.status, 'observed');
    assert.equal(twin.capacityKw, null);
    assert.equal(twin.thermal, false);
    assert.equal(
      infraTwin({
        tempC: 31.4,
        kwh: null,
        waterLitres: null,
        capacityKw: null,
        thermalTwin: true,
      }).status,
      'blocked',
    );
    assert.throws(() =>
      infraTwin({
        tempC: 31.4,
        kwh: null,
        waterLitres: null,
        capacityKw: 50,
        thermalTwin: false,
      }),
    );

    const coop = coopLicense({
      cells: [
        { cellId: 'c-enghi', remainingGrams: 180000 },
        { cellId: 'c-haflong', remainingGrams: 20000 },
      ],
      spoilageGrams: 40000,
      farmgatePaise: 10000,
    });
    assert.equal(coop.eligibility, false);
    assert.equal(coop.valuePaise, 10000);
    assert.equal(coop.spoilageGrams, 40000);
    assert.equal(
      coop.license.reduce((n, r) => n + (r.sharePaise ?? 0), 0),
      10000,
    );
    const blank = coopLicense({
      cells: [{ cellId: 'c-enghi', remainingGrams: 180000 }],
      spoilageGrams: 0,
      farmgatePaise: null,
    });
    assert.equal(blank.valuePaise, null);
    assert.equal(blank.license[0]?.sharePaise, null);

    assert.equal(OS_ITEMS.filter((x) => x.todo === 'blocked').map((x) => x.id).join(','), '');
  });
});
