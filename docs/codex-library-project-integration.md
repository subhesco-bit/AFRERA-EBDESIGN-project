# Library Project Integration

Generated: 2026-09-12

## Purpose

The EBDESIGN Library is now the shared project workspace for coding agents and project improvement. ChatGPT/Codex, Claude, Copilot, Devin, Visual Studio agents, and human reviewers should use the same Library records before reading, changing, merging, or deleting project files.

## Integrated API

- `GET /api/ai/library-workspace/status`
- `GET /api/ai/library-workspace/files/search`
- `GET /api/ai/library-workspace/files/:libraryId`
- `GET /api/ai/library-workspace/files/:libraryId/content`
- `POST /api/ai/library-workspace/context`
- `POST /api/ai/library-workspace/improvement-workspace`
- `POST /api/ai/library-workspace/events`

Equivalent mounts:

- `/api/library-ai-workspace`
- `/api/ai/library-workspace`
- `/api/v1/ai/library-workspace`

## Agent Rule

Every coding agent must:

1. Search the Library for the feature or file.
2. Use `library_id` to identify the exact file.
3. Check activity state and duplicate-name risk.
4. Read bounded safe content only when needed.
5. Create an improvement workspace packet.
6. Edit project files.
7. Run verification.
8. Record the agent event.
9. Regenerate the Library index.
10. Run the Library activity tracker.
11. Refresh `_ACTIVE_PROJECT/current`.

## Why This Matters

This makes the Library an active part of the system. It prevents blind duplicate merges, avoids slow 650k-file rescans during AI requests, records file movement, and gives every AI or human worker the same project truth.
