# SyllaKeep

An offline-first student progress tracker prototype for school and competitive exam preparation.

## Current prototype

- Mobile-first dashboard with Today, Syllabus, Revisions and Progress views.
- First-run setup for CBSE/ISC, Class 11/12, academic year and optional JEE Main/JEE Advanced/NEET UG tracks.
- Separate switchable school and competitive workspaces.
- Add chapters, search/filter by status, change chapter status and schedule revisions.
- Progress counts are calculated from the chapters tracked in the active workspace.
- Local persistence using IndexedDB via Dexie for chapter records, plus browser local storage for profile/workspace preferences.
- Explicit illustrative preview mode; sample chapter names are not presented as a verified official syllabus.
- Responsive layout, keyboard focus states, labelled controls and reduced-motion support.

## Run locally

Requires Node.js 20 or newer.

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Create a production build: `npm run build`
4. Preview the build: `npm run preview`

## Prototype limitations

This is a frontend prototype. Firebase Authentication, Firestore sync, sync queues, conflict recovery, verified official syllabus packs, production PWA caching, automated tests and deployment workflows are not connected yet. “Saved on this device” means browser-local storage only; it does not mean cloud-synced. Do not enter sensitive personal information.

## Product principles

- Student-owned progress, without public rankings or guilt-based streaks.
- School and competitive exam workspaces remain separate and switchable.
- Competitive exam selection is optional.
- Progress calculations are transparent and based only on tracked chapters.
- Official syllabus content must be verified against primary sources before being shipped.

## Brand direction

Paper Ledger: warm neutral surfaces, deep navy (`#203B5E`), restrained amber (`#E6A72E`), clear rows and calm, practical language. The current mark is an initial visual proposal, not trademark clearance.

## Next implementation steps

1. Add verified syllabus packs with source URL, publication/version date and verification status.
2. Add Firebase Authentication and owner-scoped Firestore security rules.
3. Implement operation IDs, an offline operation queue, server-confirmed sync states and conflict recovery.
4. Add unit, integration, security-rule and browser tests.
5. Add a production PWA service worker and verify install/offline behavior.
