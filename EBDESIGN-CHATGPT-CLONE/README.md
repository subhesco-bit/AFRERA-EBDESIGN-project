# EBDESIGN-CHATGPT-CLONE

Independent ChatGPT working environment for EBDESIGN.

This clone now contains the evidence-based governance foundation required by the AFRERA shortcomings and future-concept specification. It converts the vision into machine-readable capabilities, professional workflow contracts and a generated completion backlog without claiming that candidate files are working implementations.

The implementation baseline includes last week’s ChatGPT work through commit `054ddb12`. The active `consolidated/final` branch is a descendant of `codex/chatgpt-tree-consolidation` and contains 22 additional commits, so this directory governs continuation of that work rather than a separate restart.

## Boundary

- Work is performed in this directory/clone branch.
- Existing main-tree code is not modified directly by this workflow.
- Docker, CI/CD, and IaC are maintained independently here.
- Changes move to the main tree only through review and approval.

## Workflow

```text
ChatGPT Clone
  -> implement
  -> validate
  -> update .ai/WORK_LOG.md
  -> notify Claude AI
  -> Claude review / approval
  -> merge approved changes to main tree
```

## Review gate

No change is considered approved for main-tree integration until Claude AI has reviewed it and the repository review/merge process accepts it.

## Evidence audit

```text
cd EBDESIGN-CHATGPT-CLONE
npm run check
```

The command scans the parent project, records candidate implementation evidence and generates `generated/TODO.md`. Every capability remains incomplete until all required evidence gates are verified.

## Agent efficiency

All agents use [TOKEN_OPTIMIZATION.md](TOKEN_OPTIMIZATION.md) and the shared `registry/MEMOIZED.json` decision register. These reduce repeated analysis while preserving complete verification for high-impact workflows.
