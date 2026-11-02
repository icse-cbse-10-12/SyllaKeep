# SyllaKeep brand system

**Brand promise:** Your syllabus. Your progress. Your record.

**Positioning:** A calm, private and dependable place for students to keep an honest record of preparation. The identity communicates clarity, ownership and reliability—not coaching-centre urgency or competitive pressure.

## Colour architecture

The 60/30/10 principle describes visual balance across a screen; it is a design guide, not a mathematically enforced ratio.

### Light theme — Paper Clean

| Role | Token | Value |
|---|---|---|
| Dominant canvas | `--sylla-bg` | `#F8FAFC` |
| Surface | `--sylla-surface` | `#FFFFFF` |
| Border | `--sylla-border` | `#E2E8F0` |
| Primary text | `--sylla-text` | `#0F172A` |
| Muted text | `--sylla-muted` | `#64748B` |
| JEE identity accent | `--sylla-jee` | `#2563EB` |
| NEET identity accent | `--sylla-neet` | `#059669` |

### Dark theme — Midnight Focus

| Role | Token | Value |
|---|---|---|
| Dominant canvas | `--sylla-bg` | `#101318` |
| Surface | `--sylla-surface` | `#203B5E` |
| Border | `--sylla-border` | `#2A4D7C` |
| Primary text | `--sylla-text` | `#F1F5F9` |
| Muted text | `--sylla-muted` | `#94A3B8` |
| JEE identity accent | `--sylla-jee` | `#3B82F6` |
| NEET identity accent | `--sylla-neet` | `#10B981` |

JEE blue and NEET green identify workspaces only. They do not communicate completion, correctness or performance. Success, warning and error use separate semantic tokens (`--sylla-success`, `--sylla-warning`, `--sylla-danger`).

## Theme behaviour

- The theme switch is available in the top bar and exposes its state to assistive technology.
- The selected theme is stored locally as `syllakeep-theme`; when no preference exists, the device colour preference is used.
- The initial HTML applies the stored/device theme before the app mounts to reduce a flash of the wrong theme.
- The browser theme colour follows the active theme. If local storage is unavailable, switching still works for the current session.
- Theme selection is a presentation preference; it does not alter student data or progress calculations.

## Typography

**Selected pairing: Fraunces + Inter.** This pairing adds a restrained editorial signature without making the working interface ornamental.

- **Fraunces — display role only:** primary page titles, the setup welcome headline and the empty-workspace headline. Use 600 weight, compact line-height and restrained negative tracking. Do not use it for dense lists, table-like data, controls or long paragraphs.
- **Inter — interface role:** body copy, navigation, card headings, chapter names, buttons, form labels, helper text and all other interface typography. Use 400 for reading, 500–600 for emphasis and 700 for compact labels.
- **Inter — data role:** counts, percentages, dates and progress figures. Enable tabular numerals so changing values do not cause visual jitter.
- Keep the wordmark and utility labels in Inter; the brand mark should remain clear at small sizes.
- Use a maximum of two font families. Do not introduce a third font for numbers or icons.
- Google Fonts load when online; Georgia and system sans-serif fallbacks keep the interface usable when offline. The fallback may differ visually, but must preserve hierarchy and legibility.
- Load only the weights used by the interface. Keep `font-display: swap` so text remains visible while web fonts load.

### Type hierarchy

| Role | Typeface | Guidance |
|---|---|---|
| Display / page title | Fraunces | Large, selective, high-level page identity |
| Section and card headings | Inter | Clear hierarchy without competing with the page title |
| Body and supporting copy | Inter | Comfortable reading; avoid overly small text |
| Labels and metadata | Inter | Compact but readable; use weight and spacing, not all-caps everywhere |
| Data and metrics | Inter | Tabular numerals for stable alignment |

## Shape and graphic motif

The logo's folded document, checked syllabus rows and rising path form a low-contrast background motif. Use it sparingly and never behind dense text or controls.

## Voice and product rules

Calm, clear, respectful and quietly encouraging. Describe what the record says; never infer mastery, exam readiness or personal worth from completion data. Avoid guilt, urgency, streak pressure and exaggerated promises. Prefer real interface examples and purposeful diagrams over generic stock imagery.

## Verification checklist

- Check both themes at narrow Android widths and desktop widths.
- Verify keyboard focus, screen-reader names, reduced-motion behaviour and readable contrast.
- Test theme persistence and the first paint with storage available and unavailable.
- Verify all actual screens and modal states; this token layer does not substitute for full accessibility or device testing.
- Keep the core interface functional when offline; fonts may fall back to system fonts.
