# SyllaKeep — Implementation Plan

**Status:** Draft v1.0  
**Planning rule:** This plan distinguishes the current prototype from target work. A phase is complete only after implementation and evidence-based verification.

## 1. Delivery workflow
1. Inspect current branch, files, architecture and open changes.
2. Implement only approved scope on an isolated feature branch.
3. Preserve unrelated functionality and production/main.
4. Run relevant automated checks and inspect actual results.
5. Review final diff, data-loss risks, security and edge cases.
6. Commit and open/update a PR.
7. Merge only when checks pass and the change is within approved scope.
8. Verify the resulting branch and deployment separately.
Never report a test, merge or deployment without confirmation.

## 2. Phase 0 — Product and source validation
- Confirm onboarding, track and workspace requirements.
- Inventory current code and local schema.
- Identify primary official syllabus sources for each track.
- Verify Quotable endpoint path, schema, CORS, rate limits, availability, attribution and caching/reuse terms.
- Record decisions and unresolved risks.
**Exit:** source provenance and external API contract are documented; no guessed API contract remains.

## 3. Phase 1 — Local-first data foundation
- Complete Dexie schema and migrations.
- Implement domain services and local repositories.
- Persist progress + outbox event atomically.
- Generate unique operationId for every progress event.
- Add recoverable local save and sync-state model.
**Tests:** persistence after reload, offline mutation, operation uniqueness, transaction rollback/recovery.

## 4. Phase 2 — Onboarding, workspaces and syllabus
- Implement board/class/year setup.
- Keep competitive exam selection optional.
- Implement separate switchable workspaces.
- Add versioned syllabus packs with source provenance.
- Clearly distinguish unavailable/unverified content from official packs.
**Tests:** onboarding variants, workspace isolation, source metadata validation.

## 5. Phase 3 — Revision and transparent progress
- Implement revision scheduling and completion.
- Keep revision completion separate from chapter completion.
- Retain transparent completed/total calculation.
- Implement zero-chapter empty state.
**Tests:** date boundaries/time zones, status transitions, zero/one/many chapters.

## 6. Phase 4 — Firebase identity and sync
- Integrate Firebase Authentication.
- Implement owner-scoped Firestore persistence and security rules.
- Add durable sync worker, bounded retry and idempotency.
- Define multi-device conflict resolution before release.
- Preserve pending local work during sign-out/recovery.
**Tests:** Firebase Emulator ownership/privilege cases; offline/online Playwright scenarios; unknown-outcome retry.

## 7. Phase 5 — Quotable Daily Quote (approved, low priority)
### Prerequisites
- Complete Quotable contract verification from current service documentation and a real response.
- Confirm terms permit display, attribution and local caching.
- Verify browser CORS or choose a compliant integration path.

### Build
- Define `QuoteProvider` and a Quotable adapter.
- Add local `quoteCache` table and migration.
- Read cache first; render it without blocking Today.
- Refresh in background at most once per local calendar day by default.
- Validate quote text and author; reject malformed payloads.
- Retain last valid cache on failure; hide card if no valid cache exists.
- Send no student data; do not add Firestore storage or a backend solely for quotes.

### Acceptance criteria
- Today renders when Quotable is unavailable.
- Cached quote remains visible offline.
- No cache + request failure results in no card, not a broken placeholder.
- No duplicate fetch loop from rerenders/navigation.
- Quote cache contains no student identity or study progress.
- Attribution and caching comply with verified provider terms.
- Removing the feature does not affect core progress or sync.

## 8. Phase 6 — Quality and release
- Vitest unit and service tests.
- Testing Library component tests.
- Playwright end-to-end and offline recovery tests.
- Firebase Emulator Suite security-rule tests.
- Keyboard, screen-reader, contrast and reduced-motion review.
- Low-end Android performance checks.
- PWA install and offline verification.
- Final diff/security review and documented release gate.

## 9. Release blockers
Do not release if:
- Offline progress can be lost.
- Any progress event lacks operationId.
- Synced appears without server acknowledgement.
- Firestore rules allow cross-user access or privilege escalation.
- Official syllabus data lacks primary-source provenance.
- Core workflows depend on Quotable or another optional external API.
- Critical accessibility, data recovery or security defects remain.

## 10. Current status
The repository README describes a frontend prototype. Firebase Authentication, Firestore sync, sync queue, conflict recovery, verified official syllabus packs, production PWA caching and automated tests are not yet connected according to that baseline. This document set is planning documentation, not evidence those capabilities are implemented.
