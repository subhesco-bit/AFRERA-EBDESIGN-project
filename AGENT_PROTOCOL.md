<!-- Claude AI Ready Module - Systematic Reorganization -->
<!-- Category: documentation -->
<!-- Processed: 2026-08-28 14:27:18 -->
<!-- Status: AI Integration Ready -->
<!-- File: AGENT_PROTOCOL.md -->

# AGENT PROTOCOL

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Version:** 1.0  
**Created:** 24 August 2026

## Operating Protocol for Claude + Devin Collaboration

### Core Principles

1. **CONTINUITY FIRST:** This is ONE continuous project, not separate projects
2. **EXISTING WORK IS AUTHORITATIVE:** Do not rewrite working code without documented reason
3. **SHARED INTELLIGENCE:** .ai/ directory is the persistent memory for both agents
4. **GIT IS TRUTH:** Single source of truth for code and history
5. **MUTUAL RESPECT:** Claude provides architecture, Devin provides implementation

### Before ANY Work

**Claude:**
1. Read `.ai/PROJECT_CONTEXT.md`
2. Read `.ai/AGENT_PROTOCOL.md`
3. Read relevant architecture documents
4. Check `.ai/tasks/ACTIVE.md`
5. Check `.ai/history/` for recent work
6. Inspect Git status and recent commits
7. Review existing implementation before proposing changes

**Devin:**
1. Read `.ai/PROJECT_CONTEXT.md`
2. Read `.ai/AGENT_PROTOCOL.md`
3. Read Claude's latest decisions/reviews
4. Check `.ai/tasks/ACTIVE.md`
5. Check `.ai/handoffs/` for pending work
6. Inspect Git status before making changes
7. Preserve uncommitted user work

### During Implementation

**Claude:**
- Provide clear architectural direction
- Document decisions in `.ai/decisions/`
- Review code without losing unrelated functionality
- Identify conflicts and propose safe migrations
- Focus on design, architecture, and requirements

**Devin:**
- Implement following Claude's architectural direction
- Do not create parallel duplicate implementations
- Test changes before committing
- Update `.ai/tasks/ACTIVE.md` with progress
- Report conflicts rather than silently changing architecture

### After Implementation

**Claude:**
- Review implementation against architectural decisions
- Update `.ai/reviews/` with review findings
- Document any new architectural decisions
- Update `.ai/tasks/ACTIVE.md` if task complete
- Create handoff record for next phase

**Devin:**
- Update documentation where architecture/behavior changed
- Update `.ai/tasks/ACTIVE.md` with completion status
- Record important decisions in `.ai/decisions/`
- Update `.ai/history/IMPLEMENTATION_HISTORY.md`
- Commit changes with clear commit message
- Create handoff/review record for Claude

### Git Safety Rules

**Both Agents:**
- ✅ Inspect git status before modifying anything
- ✅ Check current branch and recent commits
- ✅ Preserve uncommitted user work
- ✅ Do not perform destructive resets
- ✅ Do not delete branches/tags
- ✅ Do not force-push unless explicitly authorized
- ✅ Create baseline commit/tag only after verification

### Conflict Resolution

**When Claude's direction conflicts with existing code:**
1. Analyze the conflict
2. Document it in `.ai/decisions/`
3. Propose the safest migration path
4. Preserve backward compatibility where practical
5. Do not blindly destroy existing functionality

**When Devin encounters implementation conflicts:**
1. Analyze the conflict
2. Document it in `.ai/tasks/ACTIVE.md`
3. Propose solutions to Claude
4. Do not silently change architecture
5. Wait for Claude's architectural guidance

### Handoff Protocol

**Claude → Devin Handoff:**
1. Create handoff record in `.ai/handoffs/`
2. Include: architectural decisions, requirements, acceptance criteria
3. Update `.ai/tasks/ACTIVE.md`
4. Clear timeline and dependencies
5. Document any risks or considerations

**Devin → Claude Handoff:**
1. Create handoff record in `.ai/handoffs/`
2. Include: implementation results, test evidence, blockers
3. Update `.ai/tasks/ACTIVE.md`
4. Request review if needed
5. Document any technical debt discovered

### Continuous Synchronization

**Daily Sync (both agents):**
1. Read `.ai/PROJECT_CONTEXT.md` for updates
2. Check `.ai/tasks/ACTIVE.md` for current priorities
3. Review `.ai/handoffs/` for pending work
4. Check Git status for uncommitted changes
5. Review recent commits from other agent

**Before Major Work:**
1. Full reconnaissance of relevant code
2. Check all .ai documentation
3. Verify Git state
4. Coordinate with other agent if needed
5. Document plan in `.ai/tasks/ACTIVE.md`

### Quality Standards

**Claude:**
- Ensure architectural decisions are sound and documented
- Review code for maintainability and scalability
- Identify security and performance concerns
- Provide clear acceptance criteria
- Focus on system-level quality

**Devin:**
- Ensure code follows project patterns
- Test thoroughly before claiming completion
- Follow Claude's architectural direction
- Report issues honestly and promptly
- Focus on implementation quality

### Documentation Requirements

**Claude:**
- Document all architectural decisions
- Update system architecture docs when changed
- Create clear requirements and specifications
- Review and update .ai documentation regularly
- Maintain design rationale

**Devin:**
- Update code documentation when behavior changes
- Document implementation decisions
- Update .ai tasks and history files
- Create clear commit messages
- Maintain implementation notes

### Emergency Procedures

**If Claude's guidance is unclear:**
1. Document the ambiguity in `.ai/tasks/ACTIVE.md`
2. Request clarification from Claude
3. Do not make assumptions about architecture
4. Wait for clear direction before proceeding

**If Devin encounters unexpected blockers:**
1. Document the blocker in `.ai/tasks/ACTIVE.md`
2. Propose alternative approaches to Claude
3. Do not work around silently
4. Request architectural guidance

### Success Metrics

**Project Success:**
- ✅ All skeleton modules completed to launch level
- ✅ Full test coverage achieved
- ✅ Security and compliance validated
- ✅ Zero breaking changes from historical baseline
- ✅ Claude and Claude AI integration functional
- ✅ Launch readiness with evidence

**Collaboration Success:**
- ✅ No duplicate implementations
- ✅ Clear handoff records for all major work
- ✅ Updated .ai documentation reflecting current state
- ✅ Git history shows continuous progression
- ✅ Both agents understand complete project context

### Violation Protocol

**If protocol is violated:**
1. Document the violation in `.ai/history/`
2. Assess impact on project continuity
3. Propose remediation steps
4. Update protocol if needed to prevent recurrence
5. Re-establish shared understanding

---

*This protocol ensures Claude and Devin work as coordinated agents on ONE continuous project. Both agents must follow this protocol for all work.*

