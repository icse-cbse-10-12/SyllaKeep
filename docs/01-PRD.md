# SyllaKeep — Product Requirements Document (PRD)

**Status:** Draft v1.0  
**Repository baseline reviewed:** `main` at `af11025bfe085bf48b03defc3260157ea809dfea`  
**Product:** Private, offline-first multi-exam student progress tracker for Indian students.

## 1. Product vision
SyllaKeep gives students one dependable place to record syllabus progress and revision across school and competitive-exam tracks. The product is a progress record and planning aid—not a public leaderboard, content marketplace, AI-first tutor or exam-readiness predictor.

## 2. Supported tracks and account model
- School: CBSE Class 11, CBSE Class 12, ISC Class 11, ISC Class 12.
- Competitive: JEE Main, JEE Advanced, NEET UG.
- One account may hold multiple tracks.
- Competitive-exam selection is optional.
- School and competitive tracks live in separate, switchable workspaces.
- First-run setup collects board, class/standard and academic year, then offers optional competitive-track selection.

## 3. Users and primary jobs
**Student:** configure tracks; view syllabus; update chapter status; schedule and record revision; understand progress; work offline; recover pending changes after reconnecting.

## 4. Product goals
1. Make chapter-level progress easy to record.
2. Keep school and competitive progress separate but accessible from one account.
3. Preserve work locally during connectivity loss.
4. Make progress calculations transparent and reproducible.
5. Provide revision planning based on actual student-entered dates and statuses.
6. Ship only syllabus data with traceable official-source provenance.
7. Remain fast, accessible and usable on low-end Android devices.

## 5. Non-goals for the initial release
- AI tutor, AI-generated insights or AI-generated exam papers.
- Public rankings, social feeds, guilt-based streaks or gamified pressure.
- A general trivia product.
- Cloud dependency for core tracking.
- Claims of mastery, marks prediction or exam readiness based only on chapter completion.

## 6. Functional requirements
### 6.1 Onboarding and workspaces
- Ask for board, class and academic year on first launch.
- Make competitive-exam selection optional.
- Support multiple tracks under one account.
- Provide a clear workspace switcher.
- Never merge school and competitive progress implicitly.

### 6.2 Syllabus and chapter progress
- Syllabus packs must record publisher, official source URL, document/version date, retrieval date, verification date and verification status.
- Sample/illustrative content must be visibly labelled and must never masquerade as an official syllabus.
- Chapter states: Not started, In progress, Complete.
- Progress percentage = completed tracked chapters ÷ all tracked chapters in the active workspace.
- Show completed count and denominator with the percentage.
- With zero tracked chapters, show an empty state—not a celebratory 0% achievement.
- Completion is not proof of mastery or readiness.

### 6.3 Revision
- Students can schedule revision against a chapter.
- Due/overdue status is derived from the stored schedule and current date.
- Revision completion is recorded separately from chapter completion.
- Do not infer that a student revised a topic unless they record it.

### 6.4 Local-first progress and synchronization
- Core tracking, viewing and editing must work offline.
- Persist a mutation locally before reporting it as saved.
- Every progress event has a unique `operationId`.
- Offline operations remain durable and recoverable.
- Remote processing is idempotent.
- “Synced” is shown only after server confirmation.
- Distinguish local save, pending sync, syncing, synced and sync failure.
- A timeout is an unknown remote outcome; never discard the local operation.

### 6.5 Daily Quote — Quotable API (approved optional feature)
- Add a compact, optional Daily Quote card to the Today page.
- Use Quotable as the quote provider only after verifying the live endpoint, response schema, availability, CORS, rate limits and applicable attribution/reuse/caching terms.
- Display quote text and the supplied author attribution. Do not invent missing authors.
- Cache the latest accepted quote locally with provider and retrieval/display-date metadata.
- Default refresh policy: at most one successful refresh per local calendar day; do not request on every render or navigation.
- Refresh in the background; quote retrieval must never delay Today page or core study workflows.
- If refresh fails, keep a valid cached quote. If there is no valid cache, omit the card without a blocking error or empty placeholder.
- Send no student identifiers, email, workspace, syllabus, progress or revision data to Quotable.
- Keep this feature removable and nonessential. It must not require a new backend or Firestore collection by default.
- Quotes are optional editorial content, not academic facts, instructions or evidence of progress.

## 7. Quality requirements
- Mobile-first responsive UI; usable on low-end Android.
- Local-first core behaviour and recoverable offline changes.
- Accessible labels, keyboard focus, screen-reader semantics and reduced-motion support.
- Fast initial render; optional external calls never block the core app.
- Privacy by default; no public exposure of student records.
- No fake metrics, placeholder charts, invented testimonials or unsupported AI insights.

## 8. Success criteria
- Offline progress survives reload/restart tests.
- Every progress operation has a unique operationId.
- No “Synced” state before server acknowledgement.
- Emulator tests deny cross-user access and privilege escalation.
- Every shipped official syllabus pack has auditable provenance.
- Quotable failure does not affect core workflows and sends no student data.
- No performance or accessibility regression on supported mobile layouts.

## 9. Risks and unresolved decisions
- Confirm authoritative syllabus source and update cadence per track.
- Verify Quotable's current service contract and legal/attribution terms before implementation.
- Define multi-device conflict resolution; do not silently assume last-write-wins.
- Confirm account recovery and local-data ownership behaviour at sign-out.
- The repository is currently a frontend prototype; planned Firebase, durable outbox, verified syllabus packs and automated tests must not be described as already implemented.
