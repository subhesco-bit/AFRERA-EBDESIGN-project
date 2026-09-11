# EBDESIGN-CHATGPT-CLONE

Independent ChatGPT working environment for EBDESIGN.

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
