# SyllaKeep — UI/UX Design Brief

**Status:** Draft v1.0

## 1. Experience direction
SyllaKeep should feel like a calm, precise study record: dependable, private, clear and lightweight. Avoid generic dashboard clutter, decorative gradients, noisy gamification, public comparison and artificial urgency.

## 2. Existing brand foundation
Follow the repository's established Paper Ledger direction and `docs/brand-system.md`:
- Warm neutral surfaces with deep navy and restrained amber.
- Light theme “Paper Clean”; dark theme “Midnight Focus”.
- JEE blue and NEET green identify workspaces only; they do not represent success/failure.
- Fraunces is reserved for selected display headings; Inter handles interface/body text and tabular numerals.
- Preserve semantic design tokens and offline font fallbacks.

## 3. Information architecture
Primary navigation: Today, Syllabus, Revisions, Progress. Settings/account remains discoverable. School and competitive workspaces are separately switchable.

## 4. Today page hierarchy
1. Active workspace identity.
2. Today's revision/tasks.
3. Chapter completion summary.
4. Optional Daily Quote card.
5. Local save and synchronization status.

The quote is secondary content. It must not appear above urgent revision tasks or displace the progress summary.

## 5. Daily Quote card — Quotable
- Compact, low-emphasis card labelled “Daily quote”.
- Display the exact validated quote text and supplied author attribution.
- Add provider attribution only as required by verified service terms.
- Use semantic blockquote/attribution markup.
- No large illustration, oversized hero treatment, sound or attention-seeking animation.
- No empty card when quote is unavailable.
- No large skeleton or layout reservation while waiting for the API.
- A cached quote may remain visible offline; do not falsely label an old cached quote as freshly retrieved today.
- Quote text must wrap safely on narrow screens and in both themes.
- The card must not imply that the quote is academic guidance or a progress insight.
- Failure is quiet: use cached content if available; otherwise omit the component.

## 6. Progress and revision presentation
- Completed count and total tracked chapters are primary; percentage is secondary.
- Empty workspace has a useful empty state, not a misleading achievement display.
- In progress and Complete remain distinct.
- Revision schedule/completion remains separate from syllabus completion.
- JEE/NEET identity colours must not be used as semantic success colours.

## 7. Component states
Design relevant states: default, hover, focus, active, disabled, loading, empty, error, offline, syncing, synced and sync failure.
Daily Quote-specific states: fresh quote, cached quote, cached while offline, no cache/no network, malformed provider payload, refresh failure.

## 8. Accessibility and responsive requirements
- Keyboard-visible focus and logical tab order.
- Accessible names and semantic headings.
- Screen-reader-readable progress labels and quote attribution.
- Adequate contrast in both themes.
- Touch targets appropriate for mobile.
- Reduced-motion support.
- Single-column layout on narrow screens; no horizontal scrolling for core tasks.
- Test small Android widths and desktop layouts; do not assume a desktop mock proves mobile usability.
