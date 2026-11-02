# SyllaKeep — Application Flow

**Status:** Draft v1.0

## 1. First launch and onboarding
1. Launch application and inspect local profile/database.
2. If no setup exists, show onboarding.
3. Select school board: CBSE or ISC.
4. Select class: 11 or 12.
5. Select academic year.
6. Offer optional competitive tracks: JEE Main, JEE Advanced and/or NEET UG.
7. Explain that school and competitive tracks remain separate workspaces.
8. Save setup locally.
9. Open Today in the school workspace by default, unless the student selects another initial workspace.

## 2. Returning launch
1. Load local profile, workspace selection and local records.
2. Render the interface from local data immediately.
3. Start background sync only when authenticated and connectivity is available.
4. Read the local Daily Quote cache.
5. Refresh Quotable in the background only when the cache is absent/stale and a network request is appropriate.
6. Display sync state accurately; never imply cloud sync based on local persistence alone.

## 3. Main navigation and workspace switching
Primary destinations:
- Today
- Syllabus
- Revisions
- Progress
- Settings/account

Workspace selector:
- School workspace.
- Each configured competitive workspace.
Switching changes active data scope; it must not merge records or progress between workspaces.

## 4. Today page
1. Render active workspace context.
2. Show relevant revision tasks.
3. Show chapter completion count and denominator.
4. Show Daily Quote only if a valid cached or freshly retrieved quote exists.
5. Show accurate local save/sync state.
6. Quote loading/failure must not block tasks, progress or navigation.

## 5. Syllabus and progress update
1. Open Syllabus in active workspace.
2. Select subject and chapter from a verified syllabus pack.
3. If no verified pack exists, explain the unavailable/verification state; do not fabricate official chapter data.
4. Change chapter status to Not started, In progress or Complete.
5. Validate locally.
6. Generate operationId.
7. Commit progress mutation and outbox event atomically to IndexedDB.
8. Update UI from committed local data.
9. Sync later when eligible; show Synced only after server acknowledgement.

## 6. Revision workflow
1. Open a chapter or Revisions.
2. Choose a revision date.
3. Save the schedule locally.
4. Show due/overdue based on the stored date.
5. Student explicitly records completion.
6. Keep revision completion distinct from chapter completion.

## 7. Progress page
- Calculate completed tracked chapters divided by all tracked chapters in active workspace.
- Show count and denominator.
- Explain the calculation.
- If there are no tracked chapters, show an empty state.
- Do not infer mastery, predicted marks or readiness.

## 8. Daily Quote — Quotable subflow
1. Today page loads from local data without waiting for any external request.
2. Read `daily-quote` cache.
3. If cache is valid for the current local date, display it.
4. If cache is absent/stale and the device appears online, request through the Quotable adapter in the background.
5. Validate quote text and author against the verified provider contract.
6. Store the accepted quote and retrieval/display metadata locally.
7. Update the card when valid data is available.
8. If request fails, keep the previous valid cached quote.
9. If no valid cache exists, hide the card entirely.
10. Never send student profile, identity, workspace or progress data.
11. Do not repeatedly retry or fetch on render/navigation.

## 9. Offline and recovery flow
- App loads from local database.
- Student can view/update local progress.
- Every progress mutation creates a durable operationId/outbox entry.
- UI reports locally saved and pending sync distinctly.
- Reconnect triggers safe idempotent retries.
- Server acknowledgement changes status to Synced.
- Failures remain recoverable and are not silently discarded.

## 10. Account/settings flow
- Manage authentication and account preferences.
- Manage workspaces.
- Theme and accessibility preferences.
- Explain local data and sync status.
- Sign-out must preserve or explicitly resolve pending local operations; never silently delete them.
