# 00 — Development Standards (Mandatory Implementation Rules)

> **Status:** Binding. These rules govern how every phase of the PAC_ALUMNI_TRACKING_SYSTEM Admin Side is implemented.
> This is **not** a roadmap, **not** an architecture guide, and **not** a coding tutorial. It exists solely to prevent poor implementations and keep code quality consistent across all phases.

---

## Purpose

This document defines the mandatory implementation standards that Claude Code must follow while executing every phase of this project.

**These standards override any implementation shortcut.** If a faster, easier, or "temporary" path conflicts with any rule in this document, the rule wins. Convenience, speed of delivery, and automatic scaffolding are never valid reasons to violate these standards. When a rule here conflicts with an instinct to move quickly, Claude Code must stop and follow the rule.

No phase may be implemented in a way that contradicts this document. Where a phase document and these standards appear to conflict, Claude Code must pause and surface the conflict rather than silently picking one.

---

## Mandatory Implementation Rules

While executing any phase, Claude Code **MUST NOT**:

- **Never hardcode values.** No magic numbers, inline credentials, literal colors, fixed URLs, or embedded configuration. Use config, environment variables, constants, enums, or theme tokens as appropriate to the layer.
- **Never duplicate code.** If the same logic, markup, or query pattern is needed twice, extract it into a shared, reusable unit.
- **Never create temporary fixes.** No "we'll fix this later" patches. Every change must be a real, complete solution.
- **Never implement quick hacks.** No workarounds that bypass the intended design to save time.
- **Never ignore the existing project architecture.** Follow the established Controller → Service → Repository layering on the backend and the established component/context/hook structure on the frontend.
- **Never bypass Services, Repositories, Form Requests, or API Resources.** Business logic belongs in Services; data access belongs in Repositories; input validation belongs in Form Requests; output shaping belongs in API Resources. No controller may talk directly to the database, skip validation, or return raw models.
- **Never create technical debt intentionally.** Do not knowingly leave the codebase worse than the standards require.
- **Never change unrelated modules.** Touch only what the current phase requires.
- **Never modify files outside the current phase unless absolutely required.** If an out-of-phase change is unavoidable, it must be minimal, justified in the commit, and never expand scope.
- **Never remove existing functionality.** Do not delete working features while implementing new ones.
- **Never break backward compatibility.** API contracts, response envelopes, and existing behavior must remain intact unless the current phase explicitly authorizes a change.

---

## Reusability Rules

Before creating anything new, Claude Code must **first search the project**.

If an existing component, helper, service, hook, utility, repository, modal, table, or function already provides the needed capability, it **must be reused** — not re-implemented.

Only create a new implementation when no suitable reusable solution exists in the project. If a near-match exists, extend or adapt it rather than building a parallel version. Creating a second implementation of something that already exists is a standards violation.

---

## Library Installation Rules

**Do NOT install new packages by default.** The existing dependency set is the starting assumption.

Before installing any library, Claude Code must:

1. Check whether the existing project already provides the required functionality.
2. Explain why a new library is necessary.
3. Compare the proposed library against the current implementation.
4. Install only mature, actively maintained, production-ready libraries.
5. Avoid libraries that duplicate functionality already present in the project.
6. Avoid unnecessary dependencies.
7. Prefer lightweight libraries over heavy ones.
8. Ensure compatibility with Laravel 12, React, Vite, and Tailwind CSS.
9. If a reusable in-house solution is better than a library, do not install the library.

Every proposed new dependency must be accompanied by:

- **Justification** — why it is needed and why the existing project cannot meet the need.
- **Expected benefit** — the concrete improvement it delivers.
- **Affected modules** — what parts of the codebase will depend on it.
- **Possible risks** — maintenance, bundle size, security surface, or compatibility concerns.

A dependency that cannot satisfy all of the above must not be installed.

---

## Existing Component First Policy

Before creating any of the following, Claude Code must first search the project for an existing implementation:

- Button
- Modal
- Table
- Card
- Toast
- Input
- Select
- Search
- Badge
- Loader

If one already exists, **extend or improve it** — do not create another one. A second Button, second Modal, or second Table is not permitted where one already exists. Consolidation and reuse are always preferred over parallel implementations.

---

## Refactoring Rules

- Refactor only code that belongs to the **current implementation phase**.
- Do not perform unrelated refactoring, however tempting.
- Do not rename files unnecessarily.
- Do not reorganize folders unless the roadmap explicitly requires it.

Refactoring scope is bounded by the current phase. Opportunistic cleanup outside that scope is prohibited because it introduces regression risk into modules the phase was never meant to touch.

---

## Code Quality Rules

Every implementation must be:

- **Reusable** — built to be used in more than one place where applicable.
- **Maintainable** — easy for another developer to understand and change.
- **Production-ready** — complete, safe, and suitable for real deployment.
- **Readable** — clearly named and structured; no cleverness at the cost of clarity.
- **Scalable** — behaves correctly as data volume and usage grow.
- **Optimized** — free of avoidable performance costs (e.g., N+1 queries, unnecessary re-renders).

**Shortcuts are prohibited.** An implementation that fails any of these qualities is not complete.

---

## Validation Rules

Before marking any task as completed, Claude Code must verify:

- Existing functionality still works.
- No regression has been introduced.
- No duplicated code has been created.
- No hardcoded values have been introduced.
- The implementation follows the existing architecture.
- The implementation complies with the current phase document.

A task that cannot pass all six checks is not done, regardless of how much of it appears finished.

---

## Final Rule

Before implementing any phase, Claude Code must read the following documents, in this exact order:

1. `docs/00_DEVELOPMENT_STANDARDS.md` (this document)
2. `docs/ROADMAP.md`
3. The current `PHASE` document only.

No other phase documents should be opened or acted upon while executing the current phase.

**These implementation standards override any shortcut or automatic implementation.** They apply to every phase, every task, and every commit without exception.

---

*End of 00_DEVELOPMENT_STANDARDS.md*
