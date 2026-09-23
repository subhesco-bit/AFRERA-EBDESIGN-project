'use strict';
const assert = require('node:assert/strict');
const { BODY_PARTS, BODY_VIEW, RELAX_ACTIONS } = require('./anatomy');
const { actBody, bodyTone, defaultFacts, fingerPrecision, heartPulse, millTone, relaxBody, veinFlow } = require('./actions');
const { attemptWrong, correctRelax, factsForIssue, reactNow, reactToIssue } = require('./reflex');


describe("human-equivalent body", () => {
  it("names eleven parts equivalent to a human, none painted living if missing", () => {
    assert.equal(BODY_PARTS.length, 11);
    assert.equal(RELAX_ACTIONS.length, 5);
    const ids = BODY_PARTS.map((p) => p.id);
    assert.equal(ids.length, new Set(ids).size);
    for (const p of BODY_PARTS) {
      assert.ok(p.human.trim(), p.id);
      assert.ok(p.dora.trim(), p.id);
      assert.ok(p.present.trim(), p.id);
      assert.ok(p.missing.trim(), p.id);
      assert.ok(p.next.trim(), p.id);
      assert.ok(p.href.startsWith("/"), p.id);
      assert.ok(p.cx >= 0 && p.cx <= BODY_VIEW.w, p.id);
      assert.ok(p.cy >= 0 && p.cy <= BODY_VIEW.h, p.id);
    }
    assert.equal(BODY_PARTS.filter((p) => p.status === "blocked").length, 0);
    assert.ok(BODY_PARTS.filter((p) => p.status === "living").length >= 9);
    assert.equal(BODY_PARTS.find((p) => p.id === "ligament")?.status, "partial");
  });

  it("skin seals rupee writes and holds remaining inside", () => {
    const hold = actBody("skin", defaultFacts());
    assert.equal(hold.decision, "pass");
    assert.equal(hold.rupee, null);
    const seal = actBody("skin", defaultFacts({ rupeeWrite: true }));
    assert.equal(seal.decision, "block");
    assert.match(seal.reason, /cannot write rupees/i);
    assert.equal(seal.moved, false);
  });

  it("muscle rests on alert + heat and does not freeze EMI", () => {
    const rest = actBody("muscle", defaultFacts({ alert: true, iotTempC: 31.4 }));
    assert.equal(rest.decision, "block");
    assert.equal(rest.freezeEmi, false);
    assert.equal(rest.moved, false);
    assert.ok(rest.signals.includes("alert"));
    assert.ok(rest.signals.includes("heat"));
    const go = actBody("muscle", defaultFacts({ kwh: 12 }));
    assert.equal(go.decision, "pass");
    assert.equal(go.moved, false);
    assert.equal(millTone(defaultFacts({ alert: true, iotTempC: 31.4 })), "resting");
    assert.equal(millTone(defaultFacts()), "deferred");
    assert.equal(millTone(defaultFacts({ kwh: 12 })), "contracted");
  });

  it("vein conserves remaining along harvest → godown → offtake", () => {
    const flow = veinFlow({ mintedGrams: 180000, offtakeGrams: 40000, spoilageGrams: 2000 });
    assert.equal(flow.remainingGrams, 138000);
    assert.equal(flow.conserved, true);
    assert.deepEqual(flow.path, ["harvest", "godown", "offtake"]);
    assert.equal(flow.rupee, null);
    const act = actBody("vein", defaultFacts({ mintedGrams: 180000, offtakeGrams: 40000, spoilageGrams: 2000 }));
    assert.equal(act.decision, "pass");
    assert.equal(act.remainingGrams, 138000);
    assert.throws(() => veinFlow({ mintedGrams: 100, offtakeGrams: 40, spoilageGrams: 80 }));
  });

  it("heart pulses harvest / intake / settle on one lot body", () => {
    const pulse = heartPulse("c-enghi");
    assert.deepEqual(pulse.beats, ["harvest.completed", "intake", "settle"]);
    const beat = actBody("heart", defaultFacts());
    assert.equal(beat.decision, "pass");
    assert.ok(beat.signals.includes("harvest.completed"));
  });

  it("ear names mill signals; eye inspects a cell without a login profile", () => {
    const hear = actBody("ear", defaultFacts({ outage: true, alert: true, iotTempC: 31.4 }));
    assert.equal(hear.decision, "block");
    assert.ok(hear.signals.includes("outage"));
    const see = actBody("eye", defaultFacts());
    assert.equal(see.decision, "pass");
    assert.match(see.reason, /no login dossier/i);
  });

  it("hand grasps remaining; finger reads grams not kg", () => {
    const grasp = actBody("hand", defaultFacts());
    assert.equal(grasp.decision, "pass");
    assert.match(grasp.reason, /180000 g/);
    assert.equal(actBody("hand", defaultFacts({ remainingGrams: 0 })).decision, "block");
    const fine = fingerPrecision(180000);
    assert.equal(fine.unit, "g");
    assert.equal(fine.kg, null);
    assert.equal(actBody("finger", defaultFacts()).decision, "pass");
  });

  it("feet stand on the village remaining journey and refuse tourism", () => {
    const stand = actBody("feet", defaultFacts());
    assert.equal(stand.decision, "pass");
    assert.match(stand.reason, /tourism refused/i);
    const tour = actBody("feet", defaultFacts({ tourism: true }));
    assert.equal(tour.decision, "refuse");
    assert.match(tour.reason, /tourism itinerary refused/i);
  });

  it("ligament reports dual-truth and does not paint missing joints living", () => {
    const joint = actBody("ligament", defaultFacts());
    assert.equal(joint.decision, "pass");
    assert.match(joint.reason, /missing stay dashed/i);
    assert.match(joint.reason, /Integrity 3\d%/);
  });

  it("relax actions: mill rest, hold remaining, period rest, unclench, seal — never invent ₹", () => {
    const rest = relaxBody("rest-mill", defaultFacts());
    assert.equal(rest.decision, "block");
    assert.equal(rest.moved, false);
    assert.equal(rest.freezeEmi, false);
    assert.equal(rest.rupee, null);
    assert.match(rest.reason, /EMI not frozen/);

    const hold = relaxBody("hold-remaining", defaultFacts());
    assert.equal(hold.moved, false);
    assert.equal(hold.remainingGrams, 180000);

    const period = relaxBody("period-rest", defaultFacts());
    assert.equal(period.decision, "pass");
    assert.equal(relaxBody("period-rest", defaultFacts({ balanced: false })).decision, "block");

    const clenched = relaxBody("unclench", defaultFacts({ alert: true, iotTempC: 31.4 }));
    assert.equal(clenched.decision, "block");
    const wait = relaxBody("unclench", defaultFacts());
    assert.equal(wait.decision, "defer");
    const open = relaxBody("unclench", defaultFacts({ kwh: 12 }));
    assert.equal(open.decision, "pass");

    const seal = relaxBody("seal-skin", defaultFacts({ rupeeWrite: true }));
    assert.equal(seal.decision, "block");
  });

  it("every part fires without throwing and never writes a rupee", () => {
    const facts = defaultFacts();
    for (const p of BODY_PARTS) {
      const out = actBody(p.id, facts);
      assert.equal(out.rupee, null, p.id);
      assert.equal(out.freezeEmi, false, p.id);
      assert.ok(out.reason.trim(), p.id);
    }
    const tone = bodyTone(defaultFacts({ alert: true, iotTempC: 31.4 }));
    assert.equal(tone.mill, "resting");
    assert.equal(tone.skinSealed, true);
    assert.equal(tone.living, 10);
    assert.equal(tone.partial, 1);
  });

  it("immediate reaction: heat rests mill, remaining held, unclench refused, EMI not frozen", () => {
    const hot = defaultFacts({ alert: true, iotTempC: 31.4 });
    const now = reactNow(hot);
    assert.ok(now.issues.some((i) => i.id === "heat"));
    assert.equal(now.primary.id, "heat");
    assert.equal(now.reflex.posture, "relax");
    assert.equal(now.reflex.relax, "rest-mill");
    assert.equal(now.reflex.act.decision, "block");
    assert.equal(now.reflex.act.moved, false);
    assert.equal(now.remainingHeld, true);
    assert.equal(now.freezeEmi, false);
    assert.equal(now.rupee, null);
    assert.equal(now.reflex.hold.remainingGrams, 180000);

    const forced = attemptWrong("unclench", hot);
    assert.equal(forced.act.decision, "refuse");
    assert.match(forced.reason, /unclench refused|wrong reaction/i);
    assert.equal(forced.freezeEmi, false);

    const emi = attemptWrong("freeze-emi", hot);
    assert.equal(emi.act.decision, "refuse");
    assert.equal(emi.freezeEmi, false);
    assert.match(emi.reason, /EMI is not a muscle/i);
  });

  it("rupee write seals skin first; tourism is refused; mass leak does not invent grams", () => {
    const rupee = reactNow(defaultFacts({ rupeeWrite: true, alert: true, iotTempC: 31.4 }));
    assert.equal(rupee.primary.id, "rupee-write");
    assert.equal(rupee.reflex.sense, "skin");
    assert.equal(rupee.reflex.act.decision, "block");
    assert.match(rupee.reflex.act.reason, /cannot write rupees/i);

    const tour = reactToIssue("tourism", factsForIssue(defaultFacts(), "tourism"));
    assert.equal(tour.posture, "refuse");
    assert.equal(tour.act.decision, "refuse");

    const leakFacts = factsForIssue(defaultFacts(), "mass-leak");
    const leak = reactToIssue("mass-leak", leakFacts);
    assert.equal(leak.act.decision, "block");
    assert.equal(leak.hold.moved, false);
    assert.equal(attemptWrong("move-remaining", leakFacts).act.moved, false);
  });

  it("clear signals recover by unclench; undeclared kWh waits; unbalanced Magh cannot close", () => {
    const clear = reactNow(factsForIssue(defaultFacts(), "clear"));
    assert.equal(clear.primary.id, "clear");
    assert.equal(clear.reflex.posture, "recover");
    assert.equal(clear.reflex.act.decision, "pass");

    const waitFacts = factsForIssue(defaultFacts(), "undeclared-kwh");
    const wait = reactNow(waitFacts);
    assert.equal(wait.primary.id, "undeclared-kwh");
    assert.equal(wait.reflex.posture, "wait");
    assert.equal(wait.reflex.act.decision, "defer");
    assert.equal(attemptWrong("invent-kwh", waitFacts).act.decision, "refuse");

    const magh = reactToIssue("unbalanced", factsForIssue(defaultFacts(), "unbalanced"));
    assert.equal(magh.act.decision, "block");
    assert.equal(attemptWrong("close-unbalanced", defaultFacts({ balanced: true })).act.decision, "refuse");
  });

  it("correct relax during heat is rest-mill and hold, never unclench", () => {
    const kinds = correctRelax(defaultFacts({ alert: true, iotTempC: 31.4 }));
    assert.ok(kinds.includes("rest-mill"));
    assert.ok(kinds.includes("hold-remaining"));
    assert.ok(!kinds.includes("unclench"));
    const recovered = correctRelax(factsForIssue(defaultFacts(), "clear"));
    assert.ok(recovered.includes("unclench"));
  });

  it("issue drills isolate from live heat so tourism and rupee are the named reaction", () => {
    const hot = defaultFacts({ alert: true, iotTempC: 31.4 });
    assert.equal(reactNow(factsForIssue(hot, "tourism")).primary.id, "tourism");
    assert.equal(reactNow(factsForIssue(hot, "rupee-write")).primary.id, "rupee-write");
    assert.equal(reactNow(factsForIssue(hot, "clear")).primary.id, "clear");
    assert.equal(reactNow(hot).primary.id, "heat");
  });
});
