import json
from pathlib import Path

ROOT = Path(r"C:\Users\DIYA GOEL\Downloads\EBDESIGN")
IN_FILE = ROOT / ".audit" / "phase-program" / "conflict-regression" / "findings.jsonl"
OUT = ROOT / ".audit" / "phase-program" / "reconciliation-design"
OUT.mkdir(parents=True, exist_ok=True)

policies = {
    "optional_auth": {
        "disposition": "BRIDGE",
        "action": "Classify endpoint as explicitly public or protected from domain contract; protected endpoints must fail closed through canonical auth/RBAC middleware.",
        "proof": ["route reachability","public/private classification","auth test","role/permission test"],
        "noLoss": "Do not blanket-protect or blanket-open routes; preserve legitimate public commerce/discovery while closing unintended bypasses."
    },
    "disconnected_route_stub": {
        "disposition": "RECOVER_OR_IMPLEMENT",
        "action": "Search same capability across current services, modules, consolidated, backups, worktrees and GitHub; mount richest verified implementation or implement missing domain behavior.",
        "proof": ["source-family comparison","service wiring","contract tests","runtime route test"],
        "noLoss": "Stub is not deleted until richer behavior is mounted and regression-tested."
    },
    "route_stub": {
        "disposition": "RECOVER_OR_IMPLEMENT",
        "action": "Replace operational-message behavior with actual service invocation and typed result/error contract.",
        "proof": ["service dependency","integration test","non-stub response"],
        "noLoss": "Preserve route URL compatibility while upgrading behavior."
    },
    "placeholder_behavior": {
        "disposition": "VERIFY_THEN_SUPERSEDE",
        "action": "Determine whether marker is runtime behavior, demo-only, documentation or test fixture; runtime placeholder must be replaced by real implementation.",
        "proof": ["reachability","runtime classification","test"],
        "noLoss": "Demo/test fixtures remain isolated; production paths gain real behavior."
    },
    "random_auditable_identifier": {
        "disposition": "SUPERSEDE",
        "action": "Use cryptographically strong UUID/ULID or database identity appropriate to transaction semantics.",
        "proof": ["uniqueness test","format contract","audit trace"],
        "noLoss": "Existing IDs remain readable; new ID generation changes prospectively."
    },
    "swallowed_error": {
        "disposition": "SUPERSEDE",
        "action": "Log/categorize error and either propagate, return typed failure, or apply explicit fallback.",
        "proof": ["negative-path test","observability event"],
        "noLoss": "Fallback behavior retained only when explicit and testable."
    },
    "in_memory_state": {
        "disposition": "CLASSIFY",
        "action": "Classify state as cache/session/ephemeral versus canonical business state; canonical state receives durable repository/event persistence with idempotency.",
        "proof": ["state ownership","restart test","persistence test"],
        "noLoss": "Caches may remain in memory; canonical records must survive restart."
    },
    "unfinished_marker": {
        "disposition": "VERIFY_THEN_IMPLEMENT",
        "action": "Inspect context and reachability; active production TODO/FIXME becomes tracked implementation work with test evidence.",
        "proof": ["reachability","completed behavior test"],
        "noLoss": "Comment is removed only with corresponding implementation evidence."
    },
    "legacy_current_divergence": {
        "disposition": "MERGE_OR_BRIDGE",
        "action": "Prove live callers and behavioral deltas; merge complementary features or collapse to authoritative implementation through compatibility wrapper.",
        "proof": ["caller graph","feature diff","regression tests"],
        "noLoss": "Neither copy is discarded until unique behaviors are reconciled."
    }
}

rows=[]
with IN_FILE.open("r",encoding="utf-8",errors="replace") as f:
    for line in f:
        line=line.strip()
        if line:
            rows.append(json.loads(line))

decisions=[]
for idx,finding in enumerate(rows,1):
    policy=policies.get(finding.get("type"),{
        "disposition":"RETAIN_AND_REVIEW",
        "action":"Retain and require explicit technical review before mutation.",
        "proof":["manual/automated review"],
        "noLoss":"Unknown conflict types are preserved by default."
    })
    decisions.append({
        "decisionId":f"REC-{idx:06d}",
        "findingType":finding.get("type"),
        "severity":finding.get("severity"),
        "file":finding.get("file"),
        "line":finding.get("line"),
        "counterpart":finding.get("counterpart"),
        "disposition":policy["disposition"],
        "action":policy["action"],
        "requiredProof":policy["proof"],
        "noLossRationale":policy["noLoss"],
        "status":"PLANNED_NOT_YET_APPLIED"
    })

by_disposition={}
by_severity={}
for d in decisions:
    by_disposition[d["disposition"]]=by_disposition.get(d["disposition"],0)+1
    by_severity[d["severity"]]=by_severity.get(d["severity"],0)+1

with (OUT/"decisions.jsonl").open("w",encoding="utf-8") as f:
    for d in decisions:
        f.write(json.dumps(d,ensure_ascii=False)+"\n")

manifest={
    "schemaVersion":1,
    "decisionCount":len(decisions),
    "byDisposition":by_disposition,
    "bySeverity":by_severity,
    "policies":policies,
    "rules":[
        "No decision authorizes deletion before Phase 100.",
        "Current, consolidated, old, backup, worktree, NE and GitHub sources remain eligible evidence.",
        "Production behavior may be superseded only after regression proof.",
        "Public/private route classification must be explicit before auth changes.",
        "Exact duplicate identity is not sufficient proof of architectural redundancy."
    ],
    "detailFile":"decisions.jsonl"
}
(OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(json.dumps({"ok":True,"decisionCount":len(decisions),"byDisposition":by_disposition,"bySeverity":by_severity}))
