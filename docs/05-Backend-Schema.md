# SyllaKeep — Backend and Local Data Schema

**Status:** Draft v1.0  
**Note:** This is a target schema proposal, not a claim that Firebase collections or final sync infrastructure are already deployed.

## 1. Design rules
- User-owned records are private and scoped to authenticated UID.
- IndexedDB is the local source for immediate offline workflows.
- Every progress event has a unique operationId.
- Outbox writes are durable and idempotent.
- Privilege fields are never client-controlled.
- Syllabus data carries verifiable provenance.
- Quotable cache is non-user-specific local content, not part of the progress record.

## 2. Proposed Firestore layout
```text
users/{uid}
  workspaces/{workspaceId}
    progress/{chapterId}
    revisions/{revisionId}
    operations/{operationId}
```

### users/{uid}
- uid: string, must match authenticated UID.
- createdAt, updatedAt: server timestamps where appropriate.
- preferences: map (theme, locale, selectedWorkspaceId).
- No client-writable role/admin/privilege fields.

### workspaces/{workspaceId}
- ownerUid: string.
- trackType: SCHOOL | COMPETITIVE.
- board: CBSE | ISC | null.
- classLevel: 11 | 12 | null.
- exam: JEE_MAIN | JEE_ADVANCED | NEET_UG | null.
- academicYear: string.
- createdAt, updatedAt: timestamps.
- Validate mutually compatible fields for school vs competitive workspace.

### progress/{chapterId}
- chapterId: string.
- syllabusPackId: string.
- subjectId: string.
- status: NOT_STARTED | IN_PROGRESS | COMPLETE.
- updatedAt: timestamp.
- lastOperationId: string.

### revisions/{revisionId}
- revisionId, chapterId: strings.
- scheduledFor: timestamp/date.
- completedAt: timestamp | null.
- createdAt, updatedAt: timestamps.
- lastOperationId: string.

### operations/{operationId}
- operationId: string; document ID must equal this value.
- ownerUid, workspaceId, entityType, entityId, operationType: strings.
- payload: validated map.
- clientCreatedAt: timestamp.
- serverAcknowledgedAt: timestamp.
- schemaVersion: integer.
- Server processing must be idempotent by operationId.

## 3. Local Dexie/IndexedDB tables
Suggested tables:
- profile
- workspaces
- syllabusPacks
- chapterProgress
- revisions
- progressOperations (durable outbox)
- quoteCache

Write a progress mutation and its outbox event in one IndexedDB transaction. Migrations must preserve pending operations.

## 4. Syllabus provenance record
- syllabusPackId
- boardOrExam
- classLevel (where applicable)
- subject/chapter payload
- sourcePublisher
- sourceUrl
- sourceDocumentTitle
- sourceVersionOrPublicationDate
- retrievedAt
- verifiedAt
- verificationStatus: VERIFIED | NEEDS_REVIEW | RETIRED
- checksum (optional)
Only primary-source-checked records may be marked VERIFIED.

## 5. Daily Quote local cache
Suggested `quoteCache` record:
- cacheKey: `daily-quote`
- quoteText: string
- author: string | null (only if provider contract permits missing author)
- provider: `quotable`
- providerQuoteId: string | null
- sourceUrl: string | null
- retrievedAt: ISO timestamp
- displayDateLocal: `YYYY-MM-DD`
- schemaVersion: integer

Validation and privacy:
- Reject empty or malformed quote text.
- Bound text length for layout safety.
- Render plain text only; never inject HTML.
- Do not invent missing attribution.
- Keep only the latest accepted quote unless a future product decision requires history.
- Do not include uid, email, workspaceId, chapter, revision or progress fields.
- Cache locally; no Firestore collection is needed for the initial optional feature.
- Exact provider response mapping and endpoint configuration remain gated on live contract verification.

## 6. Firestore security requirements
- Require authentication for user-owned documents.
- Enforce path UID = request.auth.uid.
- Enforce ownerUid equality and prevent ownership changes.
- Restrict allowed fields, types and enum values.
- Deny cross-user reads/writes.
- Deny client writes to role/admin/privilege fields.
- Validate operation document ID = operationId.
- Test all rules in Firebase Emulator Suite, including negative cases.
