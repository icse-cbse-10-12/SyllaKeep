# SyllaKeep — Technical Requirements Document (TRD)

**Status:** Draft v1.0  
**Architecture target:** React + Vite + TypeScript + Tailwind; Dexie/IndexedDB; Firebase Authentication and Cloud Firestore.

## 1. Current baseline versus target
The repository currently contains a React/Vite frontend prototype, Dexie dependency and local persistence for chapter records, with browser local storage for profile/workspace preferences. The README explicitly notes that Firebase Authentication, Firestore sync, sync queues, conflict recovery, verified syllabus packs, production PWA caching and automated tests are not connected yet. This document specifies the target architecture; it does not claim those systems are implemented.

## 2. Technology and boundaries
- UI: React, TypeScript, Tailwind CSS.
- Build: Vite.
- Local persistence: Dexie.js over IndexedDB.
- Identity/remote data: Firebase Authentication and Cloud Firestore.
- Security-rule verification: Firebase Emulator Suite.
- Tests: Vitest, Testing Library, Playwright.
- PWA: service worker and install/offline behaviour planned.
- Domain services own validation and progress commands.
- Repositories own local/remote persistence.
- Sync worker owns outbox delivery and acknowledgement.
- Components must not write directly to Firestore.
- External quote integration is isolated behind a provider adapter.

## 3. Offline-first write protocol
1. Validate the user's command locally.
2. Generate a unique UUID `operationId`.
3. In one Dexie transaction, update local progress and append the operation to the durable outbox.
4. Reflect the committed local state in the UI.
5. When online and authenticated, submit the operation using its stable operationId.
6. Server processing is idempotent; retry the same operationId after unknown outcomes.
7. Mark the operation acknowledged only after server confirmation.
8. Retain recoverable failure records; never silently discard an operation.

Suggested states: `local_saved`, `pending_sync`, `syncing`, `synced`, `sync_failed`. “Saved on this device” and “Synced” must have distinct meanings.

## 4. Synchronization and conflict handling
- Durable outbox survives reload, browser restart and connectivity interruption.
- Use bounded exponential backoff with jitter for transient failures.
- A timeout does not establish whether the server committed; retry idempotently.
- Preserve enough operation metadata to diagnose and recover failures.
- Define concurrent multi-device conflict policy before release. Do not silently adopt last-write-wins.
- Only server acknowledgement can move an operation to synced.
- Sign-out must not silently erase pending local operations.

## 5. Firebase security
- Authenticate all user-owned remote access.
- Scope user data beneath the authenticated UID.
- Require path UID and immutable owner UID to match `request.auth.uid`.
- Restrict allowed fields and value types.
- Prevent ordinary clients from writing roles, admin flags or privilege fields.
- Validate workspace type/track compatibility.
- Validate operation document ID equals operationId.
- Test owner read/write, cross-user denial, unauthenticated denial, ownership mutation denial and privilege escalation denial in Firebase Emulator Suite.
- Client-side route guards are not a security boundary.

## 6. Daily Quote provider adapter — Quotable
### Interface
Define a small `QuoteProvider` contract returning a normalized quote object. Implement `QuotableQuoteProvider` behind that interface. The UI must not depend on raw provider payload shape.

### Contract verification gate
Before implementing the adapter, verify:
- Current reachable base URL and exact endpoint path.
- HTTP method and supported query parameters.
- Actual response schema and required/optional fields.
- Browser CORS behaviour and whether an API key is required.
- Rate limits, service availability and usage expectations.
- Attribution, caching, display and reuse terms.
The supplied `https://api.quotable.io` base URL alone is not a verified endpoint contract. Do not hardcode guessed response fields or assume availability.

### Runtime behaviour
- Read local cache first and render it without waiting for network.
- If cache is missing/stale and device is online, refresh in background.
- Default to no more than one successful refresh per local calendar day.
- Use a request timeout; handle non-2xx, malformed JSON, missing quote text/author and network errors.
- Normalize and validate plain text before caching; never inject provider HTML.
- Cache quote text, author, provider identifier, optional provider quote ID/source URL, retrievedAt and local display date.
- On failure, retain prior valid cache. With no cache, render no card.
- Do not include account IDs, emails, workspace IDs, chapter/progress/revision records or analytics identifiers in the request.
- Do not add Firestore storage or a backend solely for this optional feature.
- Avoid tight retry loops and refreshes caused by rerenders.

## 7. Data and syllabus provenance
Syllabus pack metadata must include source publisher, source URL, source document/title, source version/publication date, retrieval date, verification date, status and optional checksum. Only a recorded primary-source review can mark a pack VERIFIED.

## 8. Performance, accessibility and resilience
- Dashboard must render independently of Quotable availability.
- External quote request must be cancellable/timeout-bounded and nonblocking.
- Avoid layout shift; quote card is compact and secondary.
- Use semantic blockquote and author attribution.
- Support keyboard navigation, accessible names, sufficient contrast and reduced motion.
- Treat browser online/offline events as hints; actual request outcomes are authoritative.

## 9. Test strategy
- Unit: progress calculations, operation IDs, quote normalization and schema validation.
- Local DB: atomic progress + outbox transaction; migration; recovery after reload.
- Sync: idempotent retry, timeout/unknown outcome, server acknowledgement states.
- Quotable adapter: success, malformed payload, missing fields, non-2xx, timeout, offline, CORS/network failure.
- Cache: same-day reuse, stale refresh, offline fallback, no-cache failure.
- UI: Today page renders without quote; cached quote appears offline; no broken placeholder; quote never blocks primary content.
- Firebase Emulator: ownership and privilege-boundary cases.
- Playwright: mobile viewport, offline mutation/reload/reconnect and accessibility smoke checks.
