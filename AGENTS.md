# AGENTS.md - Work Record Database Project

## Session Kickoff Checklist
- Working directory: C:\work\projects\work-record-database
- Confirm git status: git status -sb
- Re-read key docs: doc/プロジェクト概要仕様書_v2.0.md (project overview), doc/API仕様書.md
- Check doc/doc_for_claude/ for the latest handover notes

## Working Agreements
- Follow existing TypeScript / Next.js typing and lint rules
- Prefer project APIs (e.g. /api/files) for file access
- Match current UI conventions (Tailwind + custom classes) with shop-floor users in mind
- Log meaningful messages; Japanese copy is welcome when user-facing

## Security & Data Handling
- Respect admin feature flags such as ADMIN_ENABLED
- Accept only whitelisted upload types (PDF / images / videos / NC programs)
- Reuse sanitizer utilities for user input and file names
- Keep both NAS and local path layouts in mind when dealing with file I/O

## Typical Workflow
1. Capture the task scope; add context to doc/doc_for_claude/ if needed
2. Ensure the repo is clean (git status) before editing
3. After changes, run 
pm run lint and any targeted tests
4. Record decisions/findings in a memo or formal doc
5. Review git diff before committing or handing off

## Key Resources
- src/app/page.tsx – Main landing (company selection & search)
- src/app/admin/ – Admin UI and back-office APIs
- src/lib/dataLoader.ts – Data loading helpers and shared types
- src/lib/drawingRegistrationTransaction.ts – Drawing registration flow
- doc/ – Authoritative specs and ops guides

## Notes & Documentation
- Temporary notes live in doc/doc_for_claude/ (ignored by Git)
- Long-term knowledge should be promoted to doc/
- Save text files in UTF-8 to avoid mojibake

## Caution Points
- Preserve transaction integrity, validation logic, and existing tests
- Use powershell.exe -NoLogo -Command when invoking shell commands via Codex CLI
- Check the approval policy before attempting network or privileged operations

## Done Checklist
- [ ] Code and docs updated to satisfy the task
- [ ] No unintended changes in git diff
- [ ] Required lint/test commands executed
- [ ] Notes/specs updated with outcomes
