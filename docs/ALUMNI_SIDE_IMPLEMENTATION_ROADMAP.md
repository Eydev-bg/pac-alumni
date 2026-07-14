# ALUMNI SIDE IMPLEMENTATION ROADMAP
### PAC Alumni Tracking System — Official Development Guide

> **For Claude Code:** This is the official implementation guide for the Alumni Side. Read the entire document before starting. **Implement only one phase at a time.** Do not skip ahead to the next phase until the project owner has approved the current one. Follow all Global Rules below without exception.

---

## How to Use This Document

1. Start with **Phase 1**. Read the Objective, Scope, and Step-by-step Plan.
2. Implement the phase **fully but minimally** — only what is listed in the Scope.
3. Run the complete **QA/Testing Checklist**.
4. Confirm all **Acceptance Criteria**.
5. Commit using the **Git Commit Recommendation**.
6. **STOP.** Wait for approval before moving to the next phase.

---

## Global Development Rules

These rules override all phase-specific instructions.

- **One phase at a time.** Do not combine phases. Do not begin Phase N+1 before Phase N is approved.
- **No unnecessary refactoring.** Modify only the files listed in the current phase's Scope. Do not "clean up while you're in there" outside the scope.
- **Do not break existing functionality.** All current features (RSVP, messaging, notifications, profile edit, board exam, employment, job apply redirect) must continue to work exactly as before after every phase.
- **Preserve architecture.** Keep the current patterns: service-repository on the backend, lazy-loaded routes, `AuthContext`, the `alumniApi` layer, and `AlumniLayout` as the single source of background/layout.
- **Reuse over reinvention.** Use existing components/utilities (`Pagination`, `useDebounce`, `formatters`, the `DOMPurify` pattern) before creating new ones.
- **Follow best practices.** Laravel 12 conventions on the backend; React hooks best practices (stable deps, cleanup functions, no unnecessary state) on the frontend; Tailwind CSS v4 utility-first.
- **Separate commits.** Keep backend and frontend commits separate. Docs in their own commit. Small, scoped, logical units.
- **Verify before done.** Review `git status`; run `php -l` on changed PHP files; run a frontend build/lint check. No phase is "complete" without a verification pass.
- **Ask, don't assume.** If there is ambiguity, or if a fix would require changing something outside the Scope, stop and ask before proceeding.

---

## Design Guidelines (Alumni Side Identity)

The Alumni Side must have its **own identity** and **must not look like the Admin Panel.**

| | Admin Side | Alumni Side |
| --- | --- | --- |
| **Feel** | Professional, dashboard-oriented | Modern, social-media-inspired |
| **Tone** | Administrative, system management | Friendly, engaging, welcoming |
| **Surface** | Dark navy glass panels (`Card` = `bg-navy-800/40`) | **Light**: white cards, `bg-slate-50` page background |
| **Priority** | Data density, control | Clean feed, smooth mobile UX |

### Alumni Side Visual Rules
- **Light theme by default.** White cards (`bg-white border border-slate-200`), light page background (`bg-slate-50`), text `text-slate-700/800`, muted `text-slate-400/500`.
- **Branding accents (keep these):** Navy `#1a2e5a` (primary/CTA), Gold `#c8a84e` (highlight/unread/pinned). This is the PAC palette — do not change it unless there is a clear consistency reason.
- **Header banners** may use the navy gradient (`from-[#1a2e5a] via-[#243a6e] to-[#1e3466]`) with white text — this is the established pattern (see Announcements/Careers/Board Exam/Employment). Use it as the consistency reference.
- **Mobile-first.** Test from 320px up. No horizontal scroll, no hidden buttons, adequate touch targets (min 40px).
- **Consistent spacing/typography.** Follow the existing scale: cards `rounded-xl`/`rounded-2xl`, padding `p-5`/`p-6`, section gaps `space-y-6`.

### UX Principles to Emulate (NOT Facebook's exact design)
Do not copy Facebook's exact colors, typography, icons, or layout. Use **only** the UX principles: clean feed layout, smooth scrolling, responsive cards, loading skeletons, consistent spacing, clear visual hierarchy, fast interactions, polished empty states, smooth transitions, and easy-to-use navigation.

---

## Phase Overview

| Phase | Theme | Issues Covered | Priority |
| --- | --- | --- | --- |
| **Phase 1** | Visual Consistency | C1 (Events light theme) | Critical |
| **Phase 2** | Accessibility Foundations | H1 (modal a11y), H2 (form labels) | High |
| **Phase 3** | Performance | H3 (dup dashboard fetch), H4 (polling) | High |
| **Phase 4** | UX Polish | M1 (skeletons), M5 (feed refresh), L5 (empty states) | Medium |
| **Phase 5** | State & Navigation | M2 (URL pagination), L2 (inbox height), L3 (breakpoint) | Medium |
| **Phase 6** | Code Cleanup | M3 (useDebounce), M4 (unused imports), L1 (guards), L4 (stripHtml) | Low |

---

# Phase 1 — Events Page Light Theme (Visual Consistency)

### Objective
Align the Alumni Events page with the light theme used across the rest of the Alumni Side. The Events page is the only one using the admin dark-theme `Card` component and dark text, so it looks broken on the light background. After this phase, the entire Alumni Side will be visually consistent.

### Scope
Presentational only. **No** logic, state, API, or data-flow changes. RSVP toggle behavior, pagination, and modal open/close must remain exactly the same.

### Files / Components Affected
- `frontend/src/pages/alumni/events/AlumniEventsPage.jsx` — primary file (`EventCard`, `EventModal`, `DateBadge`, `PinnedBadge`, `PastBadge`, `RsvpControl`)
- **Reference only (do not modify):** `frontend/src/pages/alumni/announcements/AlumniAnnouncementsPage.jsx` (the light pattern to follow), `frontend/src/pages/alumni/jobs/AlumniCareerCenterPage.jsx`

### Step-by-Step Implementation Plan
1. **Remove** `import Card from "../../../ui/Card"`. Replace `Card` usages with a light-surface `div`: `bg-white rounded-2xl border border-slate-200 shadow-sm`.
2. **EventCard:** replace the dark classes:
   - Container: `bg-white border border-slate-200` (pinned variant: `border-[#c8a84e]/40 ring-1 ring-[#c8a84e]/20`).
   - Title: `text-white` → `text-slate-800`; location text → `text-slate-600`; meta → `text-slate-400/500`.
   - Snippet: `text-slate-400` → `text-slate-500`.
   - Border dividers: `border-white/[0.06]` → `border-slate-100`.
3. **DateBadge:** convert to light — badge surface `bg-slate-50` or `bg-[#1a2e5a]/[0.06]`; month `text-[#c8a84e]`; day `text-slate-800`; time `text-slate-400`. Keep the brand gold on the month label.
4. **RsvpControl:** restyle the pills for a light surface:
   - Inactive: `bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200`.
   - Active "going": `bg-emerald-50 border-emerald-200 text-emerald-700`.
   - Active "interested": `bg-[#c8a84e]/10 border-[#c8a84e]/30 text-[#a8893a]`.
   - "(N going)" text: `text-slate-500`.
5. **PinnedBadge / PastBadge:** align with the Announcements pinned badge (`bg-[#c8a84e]/10 text-[#a88a3a]`); past badge `bg-slate-100 text-slate-500`.
6. **EventModal:** convert from `bg-navy-800 border-white/10` to `bg-white border-slate-200`; close button `text-slate-400 hover:text-slate-700 hover:bg-slate-100`; title `text-slate-900`; meta text light; keep the overlay `bg-black/50 backdrop-blur-sm`.
7. **Rich-text `<style>` block:** update the `.event-content` colors for a light surface (headings `#1e293b`, paragraph inherit, links `#1a2e5a`, blockquote border `#c8a84e` with `#64748b` text) — match `.announcement-content` on the Announcements page.
8. Keep `DOMPurify.sanitize` on `dangerouslySetInnerHTML` — **do not** remove it.
9. Verify that `stripHtml`, `dateParts`, `isPast`, `applyGoingDelta`, and the entire RSVP handler are **unchanged**.

### Acceptance Criteria
- [x] The Events page uses white cards and light text — no navy glass panel.
- [x] The Events page is visually consistent with the Announcements and Careers pages (side-by-side comparison).
- [x] RSVP toggle still works (Going/Interested/cancel) with optimistic update and revert-on-failure.
- [x] The event modal opens/closes; rich-text renders correctly on the light surface.
- [x] Pinned/past badges and the going count are preserved.
- [x] No new console warnings/errors.

### QA / Testing Checklist
- [x] 320px, 375px, 768px, 1024px, desktop — no horizontal scroll or overflow.
- [x] RSVP "Going" → count +1; tap again → cancel, count −1; toggle to "Interested".
- [x] Simulate a network failure on RSVP (offline) → the UI reverts.
- [x] Open the modal of an event with an image and rich-text body → correct render, readable text.
- [x] Past event → no RSVP controls, shows the "Past event" badge.
- [x] Pagination works when there is more than 1 page.
- [x] Frontend build/lint: no new errors. *(Build clean; ESLint is not runnable in this repo — config exists but its packages were never installed. Pre-existing.)*

### Git Commit Recommendation
```
style(alumni-events): convert Events page to light theme for Alumni Side consistency

- Replace admin dark Card with light white-surface cards
- Restyle EventCard, DateBadge, RsvpControl, badges, and EventModal
- Update .event-content rich-text styles for light surface
- No logic/state/API changes; RSVP behavior preserved
```

### Notes & Regression Risks
- **Risk: Low.** Purely presentational.
- Be careful **not** to accidentally change the RSVP handler or `applyGoingDelta` while swapping classes.
- Make sure no `navy-*` or `text-white` remains on the page.
- If a shared gold/navy token is cleaner than a hardcoded hex, use the existing `index.css` tokens — but do not add any new token in this phase.

---

# Phase 2 — Accessibility Foundations

### Objective
Make the Alumni modals and forms accessible: keyboard-operable modals (Escape, focus trap) and properly associated form labels. This is the foundation of an inclusive and "smooth" UX.

### Scope
Two sub-tasks: **(2A)** a shared modal accessibility wrapper, **(2B)** form label associations. Additive only — no visual design or business logic changes.

### Files / Components Affected
**2A — Modal accessibility:**
- New: `frontend/src/components/common/AccessibleModal.jsx` (or `hooks/useModalA11y.js`) — shared wrapper/hook.
- `frontend/src/pages/alumni/announcements/AlumniAnnouncementsPage.jsx` (`AnnouncementModal`)
- `frontend/src/pages/alumni/events/AlumniEventsPage.jsx` (`EventModal`)
- `frontend/src/pages/alumni/messages/AlumniInboxPage.jsx` (`NewMessageModal`)

**2B — Form labels:**
- `frontend/src/pages/alumni/profile/AlumniProfilePage.jsx`
- `frontend/src/pages/alumni/board-exam/AlumniBoardExamPage.jsx`
- `frontend/src/pages/alumni/employment/AlumniEmploymentPage.jsx`
- Search inputs in `AlumniCareerCenterPage.jsx` and `AlumniInboxPage.jsx`

### Step-by-Step Implementation Plan
**2A:**
1. Create an `AccessibleModal` wrapper (or `useModalA11y` hook) that:
   - Listens for the `Escape` keydown → calls `onClose`.
   - Traps focus inside the modal while open (Tab/Shift+Tab cycle).
   - Auto-focuses the first focusable element or the close button on open.
   - Restores focus to the trigger element on close.
   - Applies `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` (linked to the modal title `id`).
   - Cleans up event listeners on unmount (no memory leak).
2. Refactor the three modals to use it **without changing their visual layout**. Overlay-click-to-close must remain.
3. Give each modal title an `id` and reference it in `aria-labelledby`.

**2B:**
4. On each form input, add a unique `id` and `<label htmlFor>`. If a visual label already exists, associate it; if not, add an `aria-label`.
5. On the file input (profile picture), add an `aria-label` or a visually-hidden label.
6. Add appropriate `autoComplete`: `tel` (phone), `address-level2`/`street-address` (location).
7. Ensure every interactive element has a visible `:focus` state (Tailwind `focus:ring` — many already have it; complete the missing ones).

### Acceptance Criteria
- [x] All three modals close on Escape.
- [x] While a modal is open, keyboard focus stays inside it (focus trap).
- [ ] On close, focus returns to the trigger button. *(Works for Announcement and Event modals; FAILS for NewMessageModal — its autoFocus input is captured as the "previous focus" before the hook's effect runs, so focus drops to body on close. Known 2A follow-up.)*
- [x] Each modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- [x] Each form input has an associated label or `aria-label`.
- [x] Clicking a label → focuses the corresponding input.
- [x] No visual regression in modals or forms.

### QA / Testing Checklist
- [ ] Keyboard-only: open each modal, Tab through it, Escape to close → focus returns. *(Tab trap and Escape verified on all three; focus return fails on NewMessageModal — see Acceptance Criteria note.)*
- [ ] Screen reader (VoiceOver/NVDA) smoke test: the modal role and title are announced; field labels are read. *(Not yet performed.)*
- [x] Overlay-click-to-close still works.
- [x] Message send (Enter-to-send in ConversationThread) is **not** affected.
- [x] Mobile: modals still open/close correctly.
- [x] Lint/build: no new errors. *(Build clean; ESLint not runnable — pre-existing, see Phase 1 note.)*

### Git Commit Recommendation
```
feat(alumni-a11y): add accessible modal wrapper and form label associations

2A: shared AccessibleModal (Escape, focus trap, focus restore, role=dialog)
    applied to Announcement, Event, and NewMessage modals
2B: htmlFor/id label pairs + autoComplete on profile, board-exam,
    employment, and search inputs
```
*(Can be split into two commits: `2A` and `2B` — better for review.)*

### Notes & Regression Risks
- **Risk: Low–Medium.** The focus trap must clean up properly to avoid a listener leak.
- Do not change the modals' open/close **state logic** in the pages — just wrap them.
- Make sure the focus trap does not interfere with the `autoFocus` search input in `NewMessageModal`.

---

# Phase 3 — Performance

### Objective
Remove the redundant dashboard fetch in the layout and make polling efficient (pause in the background, consolidated unread counts). Reduce unnecessary network and server load.

### Scope
**(3A)** Remove the duplicate `getDashboard()` in `AlumniLayout`. **(3B)** Background-aware and consolidated polling. No new features.

### Files / Components Affected
- `frontend/src/components/layout/AlumniLayout.jsx`
- `frontend/src/components/layout/Header.jsx`
- `frontend/src/pages/alumni/messages/AlumniInboxPage.jsx`
- `frontend/src/pages/alumni/messages/ConversationThread.jsx`
- Possibly new: `frontend/src/context/UnreadContext.jsx` (if the consolidated approach is chosen)
- Backend (if needed for 3A): add `is_board_program` to the user/me payload — **confirm first** before doing this.

### Step-by-Step Implementation Plan
**3A:**
1. Investigate where `is_board_program` comes from. Goal: stop fetching the entire dashboard in `AlumniLayout` just for one boolean.
2. Choose the smallest change:
   - **Preferred:** expose `is_board_program` in the `authApi.getMe()`/user object (a small backend addition to the user resource), then read it from `useAuth()` in the layout.
   - **Alternative (frontend-only):** share the dashboard data via a lightweight context that fetches once, used by the layout and by `AlumniDashboardPage`.
3. Remove the `getDashboard()` call in `AlumniLayout` after securing the boolean's source.

**3B:**
4. Create a helper that polls only when `document.visibilityState === "visible"`; pauses on `hidden`, resumes on focus.
5. Consolidate the unread counts (announcements + messages + notifications) into a single polling source (context) consumed by the Header bell and Sidebar badges — instead of 3+ separate intervals fetching the same data.
6. Ensure all have `clearInterval` and listener cleanup (no leaks).

### Acceptance Criteria
- [ ] `AlumniLayout` **no longer** calls the full `getDashboard()` for nav gating.
- [ ] The "Board Exam" nav item still shows/hides correctly.
- [ ] Polling pauses when the tab is in the background; resumes on focus.
- [ ] Unread badges (Header bell, sidebar Announcements/Messages) are still accurate.
- [ ] The number of duplicate unread requests is reduced (verify in the Network tab).

### QA / Testing Checklist
- [ ] Network tab: confirm the duplicate dashboard request on Alumni shell load is gone.
- [ ] Board-program alumni → the Board Exam nav appears; non-board → hidden.
- [ ] Switch tabs (background) → polling stops; return → polling resumes.
- [ ] Send a message to an account → the unread badge on the other side increases within the poll interval.
- [ ] No stale or double-counted unread.
- [ ] No React "state update on unmounted component" warning.

### Git Commit Recommendation
```
perf(alumni): remove duplicate dashboard fetch and add background-aware polling

3A: source is_board_program from user payload; drop full getDashboard()
    call in AlumniLayout
3B: pause polling when tab hidden; consolidate unread-count polling into
    a single shared source for Header + Sidebar
```
*(Split into `3A` backend+frontend and `3B` frontend if cleaner.)*

### Notes & Regression Risks
- **Risk: Medium.** The polling consolidation can affect unread accuracy — testing-heavy.
- If a backend change is needed for 3A, commit it separately and verify `php -l` and existing tests.
- Do not change the polling **intervals** (60s/30s) unless part of the consolidation; keep the current refresh cadence.

---

# Phase 4 — UX Polish

### Objective
Add the features that make it feel "smooth": loading skeletons, feed freshness, and polished empty states — for a modern, engaging Alumni experience.

### Scope
**(4A)** Reusable loading skeleton on list pages. **(4B)** Achievement feed refresh-on-focus. **(4C)** Standardized empty-state component. Presentational + minor state.

### Files / Components Affected
- New: `frontend/src/components/common/SkeletonCard.jsx`, `frontend/src/components/common/EmptyState.jsx`
- `AlumniAnnouncementsPage.jsx`, `AlumniCareerCenterPage.jsx`, `AlumniEventsPage.jsx`, `AlumniNotificationsPage.jsx`, `AlumniInboxPage.jsx`
- `frontend/src/pages/alumni/dashboard/AchievementFeed.jsx`

### Step-by-Step Implementation Plan
1. Create a `SkeletonCard` (grey pulse blocks via `animate-pulse`) that matches the card shape of the list rows.
2. Replace the plain "Loading…" text with a skeleton list (3–5 rows) while `loading` on each list page.
3. Create an `EmptyState` component (icon + heading + subtext + optional CTA). Standardize the existing empty states.
4. In `AchievementFeed`, add a refetch on window focus (or an exposed refresh) so it isn't stale after an update on another page. Ensure the listener is cleaned up.

### Acceptance Criteria
- [ ] List pages show a skeleton (not plain text) while loading.
- [ ] No layout shift when the skeleton is replaced by the actual content.
- [ ] Empty states are consistent across all list pages (same component).
- [ ] The achievement feed refreshes when the window regains focus.
- [ ] No regression in data loading.

### QA / Testing Checklist
- [ ] Throttle the network (Slow 3G) → skeletons are visible.
- [ ] Empty account (no announcements/events/jobs/messages) → polished empty state.
- [ ] Update employment in another tab, return to the dashboard → the feed refreshes.
- [ ] Mobile and desktop: skeleton/empty layout is consistent.
- [ ] No listener leak (mount/unmount repeatedly).

### Git Commit Recommendation
```
feat(alumni-ux): add loading skeletons, standardized empty states, and feed refresh

- SkeletonCard + EmptyState shared components
- Apply skeletons to all Alumni list pages
- Refetch achievement feed on window focus
```

### Notes & Regression Risks
- **Risk: Low.** Mostly presentational.
- Make sure the skeleton dimensions match the actual cards to avoid layout shift.
- Do not over-fetch the feed — debounce/guard the focus refetch so it doesn't spam.

---

# Phase 5 — State & Navigation

### Objective
Make pagination/search state robust (URL-synced) and fix the small responsive edge cases in the inbox.

### Scope
**(5A)** URL-synced pagination + search. **(5B)** Responsive inbox height and reactive breakpoint. No new features.

### Files / Components Affected
- `AlumniCareerCenterPage.jsx`, `AlumniNotificationsPage.jsx`, `AlumniAnnouncementsPage.jsx`, `AlumniEventsPage.jsx`
- `AlumniInboxPage.jsx`

### Step-by-Step Implementation Plan
1. Use `useSearchParams` to sync `page` (and `search` if present) to the URL on the list pages. Restore from the URL on mount.
2. Optional: scroll-to-top on page change for better UX.
3. In `AlumniInboxPage`, replace the fixed `calc(100vh-220px)` with a flex-based or `dvh`-based height to adapt to small viewports.
4. Replace the one-time `window.innerWidth < 1024` check with a `matchMedia` listener so desktop/mobile routing is reactive on resize.

### Acceptance Criteria
- [ ] Refresh on page 2 of Careers → stays on page 2.
- [ ] The search term is in the URL and restored on refresh (if scoped).
- [ ] The inbox has no overflow/cutoff at 320–375px.
- [ ] Resizing from desktop→mobile (or vice versa) produces correct routing behavior.

### QA / Testing Checklist
- [ ] Change the page, refresh, use the back button → correct position.
- [ ] Inbox on a small viewport → the list and input are reachable.
- [ ] Resize the window across the 1024px boundary → correct open behavior.
- [ ] No regression in conversation open (desktop panel vs mobile page).

### Git Commit Recommendation
```
feat(alumni-nav): url-synced pagination/search and responsive inbox fixes

5A: sync page/search to useSearchParams across Alumni list pages
5B: flex/dvh inbox height + matchMedia reactive breakpoint
```

### Notes & Regression Risks
- **Risk: Low–Medium.** URL sync can affect initial-load fetch timing — test deep links.
- Preserve the backend's `whereNumber`/param expectations (no backend change here).

---

# Phase 6 — Code Cleanup

### Objective
Remove duplication and dead code for maintainability — no functional changes.

### Scope
**(6A)** Use the `useDebounce` hook. **(6B)** Remove unused imports. **(6C)** Clean up the guard sessionStorage fallback (with testing). **(6D)** Consolidate `stripHtml`.

### Files / Components Affected
- `AlumniCareerCenterPage.jsx`, `AlumniInboxPage.jsx` (6A)
- `AlumniProfilePage.jsx` and others (6B)
- `frontend/src/guards/index.jsx` (6C)
- `AlumniAnnouncementsPage.jsx`, `AlumniEventsPage.jsx`, `frontend/src/utils/formatters.js` (6D)

### Step-by-Step Implementation Plan
1. Replace the hand-rolled `setTimeout` debounce with the existing `useDebounce(value, 400)` hook.
2. Run ESLint `no-unused-vars`; remove the confirmed unused imports.
3. Move `stripHtml` to `utils/formatters.js`; import it in both pages; remove the duplicate definitions.
4. **6C with care:** check whether it is safe to remove the direct `sessionStorage` read in the guards (relying on `useAuth()` + the `loading` gate). **Test the auth timing thoroughly** (hard refresh while logged in, deep link, logout). If there is a risk of an initial-load race, **leave it as is** and flag it for a separate discussion.

### Acceptance Criteria
- [ ] Only one debounce implementation (`useDebounce`) remains.
- [ ] No unused imports (lint clean).
- [ ] Only one `stripHtml`, in `formatters.js`.
- [ ] If the guards were changed: no auth regression on refresh/deep-link/logout.

### QA / Testing Checklist
- [ ] Search debounce still works (Careers, NewMessageModal).
- [ ] `npm run lint` / build is clean.
- [ ] Announcements and Events snippet stripping is still correct.
- [ ] Auth: hard refresh while logged in → stays authenticated; logout → redirect to /login; deep link → correct guard.

### Git Commit Recommendation
```
refactor(alumni): consolidate debounce/stripHtml, remove unused imports

6A: use shared useDebounce hook
6B: remove unused icon imports (lint clean)
6C: simplify guard auth source (if verified safe)
6D: move stripHtml to formatters util
```
*(Split each sub-task if the diff is large, especially 6C.)*

### Notes & Regression Risks
- **Risk: Low**, except **6C (Medium)** — auth guards are sensitive. When in doubt, do not force it.
- Pure cleanup — no new behavior should appear.

---

## Completion Definition (Per Phase)

A phase is **complete** only when:
1. All **Acceptance Criteria** are checked.
2. The entire **QA/Testing Checklist** has passed.
3. `git status` is clean (only the intended files changed).
4. `php -l` (if there is a PHP change) and the frontend build/lint have no errors.
5. It has been committed using the recommended message.
6. **The project owner has approved it.** Until then, do not start the next phase.

---

## Final Notes for Claude Code

- Follow the phase order unless the owner says otherwise.
- If a phase would require changing a file outside the listed Scope, **stop and ask** before proceeding.
- Preserve the Alumni Side identity: **light, modern, friendly, mobile-first** — not admin-panel dark.
- Preserve the PAC branding (navy `#1a2e5a`, gold `#c8a84e`) and existing palette.
- Avoid scope creep. Each phase is small, safe, and reviewable.
