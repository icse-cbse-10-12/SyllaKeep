# SyllaKeep brand system

**Brand promise:** Your syllabus. Your progress. Your record.

**Positioning:** A calm, private and dependable place for students to keep an honest record of preparation. The identity should communicate clarity, ownership and reliability—not coaching-centre urgency or competitive pressure.

## Visual identity

### Colour roles

| Role | Token | Value | Usage |
|---|---|---|---|
| Primary (about 60%) | `--brand-primary` | `#203B5E` | Navigation, primary actions, key headings and progress marks |
| Neutral (about 30%) | `--brand-neutral` / `--brand-surface` | `#F6F5F1` / `#FFFEFA` | App canvas, cards and reading surfaces |
| Accent (about 10%) | `--brand-accent` | `#E6A72E` | Small emphasis, due/revision cues and selected highlights |

Supporting colours are semantic, not extra brand accents: ink `#202936`, muted text `#747C86`, lines `#E8E6DF`, positive state `#2F7256`.

### Typography

- **Headlines and brand wordmark:** Manrope, with a system fallback.
- **Interface and body copy:** DM Sans, with a system fallback.
- Keep body copy readable; use weight and spacing rather than decorative type treatments.

The font stylesheet is loaded from Google Fonts when online. System fallbacks keep the interface usable when the font service is unavailable or the app is offline.

### Shape and graphic motif

The existing logo combines a folded document, three checked syllabus rows and an upward path. `public/brand-pattern.svg` abstracts those elements into a low-contrast repeating motif. Use it sparingly as a background texture; never place it behind dense text or interactive controls.

### Photography and illustration

The product UI should prefer its own real interface and purposeful diagrams over generic stock photography. If photography is introduced later, use one consistent natural-light treatment, restrained backgrounds and authentic student study contexts. Do not use staged success imagery or imply results the product cannot substantiate.

### Voice

**Calm, clear, respectful and quietly encouraging.** Use specific, non-judgmental language. Describe what the record says; never infer mastery, exam readiness or personal worth from completion data. Avoid guilt, urgency, streak pressure and exaggerated promises.

## Application rules

- Keep the primary/neutral/accent balance close to 60/30/10 across each screen, not every component.
- Reserve amber for meaningful emphasis; do not colour every icon or card.
- Keep surfaces, borders, corner radii and focus states consistent.
- Preserve contrast, keyboard focus visibility, reduced-motion preferences and mobile readability.
- The brand pattern is decorative only and must never carry information.
- Keep all identity assets lightweight and local so the core interface remains useful offline.

## Touchpoint checklist

Apply the same tokens and voice to onboarding, workspace navigation, Today, Syllabus, Revisions, Progress, empty/error/offline states, app icon, website metadata, release notes and social assets. Verify at narrow Android widths, keyboard-only navigation, reduced motion and with network access disabled.
