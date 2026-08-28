# Ledger Import Check — visual thesis

## Direction: cassette-era reconciliation zine

A bank export is an opaque spool of rows. Ledger Import Check turns it into a physical-feeling checkpoint: load the tape, align the tracks, listen for skips, keep the receipt. The interface borrows the honesty of home-recorded cassette labels and photocopied instruction sheets—not nostalgia as decoration, but a vocabulary for direction, duplication, gaps, and a local copy that belongs to its owner.

The product is explicitly single-mode. Warm paper and ink colors make the work feel inspectable and calm, while the transport-green action color identifies the next mechanical step. There is no dark theme: the zine/receipt metaphor depends on a stable paper surface, and the background is explicitly painted.

## Palette

- `paper #F2E8D5`: page background, like unbleached statement stock.
- `sheet #FFF9ED`: working surfaces and fields.
- `ink #1D1B19`: primary copy (15.1:1 on paper).
- `muted #625B52`: secondary copy (5.5:1 on paper).
- `oxide #A63D2F`: cassette oxide / danger and discrepancy marks (5.1:1 on sheet).
- `transport #176B52`: primary action / reconciled state (6.3:1 on sheet).
- `amber #8A5A00`: warnings, always paired with a word or icon.
- `hairline #B9A98F`: rules and field outlines; never the only focus indicator.
- `focus #075D96`: 3px keyboard focus ring (5.6:1 on sheet).

No status relies on color alone. Reconciled, review, duplicate, and gap states carry plain labels and symbols.

## Typography

- Headlines and labels: `Courier Prime`, self-hosted WOFF2 regular and bold, or the platform monospace fallback while fonts load. Its typewriter texture makes field mapping and evidence identifiers feel native.
- Body and data: `Atkinson Hyperlegible`, self-hosted WOFF2 regular and bold. Open letterforms keep dense transaction tables legible.
- Scale: 16px body, 18px lead, 20px section title, 28–48px display, 13px microcopy. Financial figures use tabular numerals.

## Layout and spacing

An 8px base rhythm: 4, 8, 12, 16, 24, 32, 48, 64. The desktop page is a 1180px workbench with an asymmetrical 7/5 introductory split. Workflow sections read as consecutive tape tracks, separated by dashed rules rather than generic floating cards. On 390px screens, decoration is removed, actions become full-width, the reconciliation summary stacks, and tables become labeled transaction strips rather than squeezed columns.

Touch targets are at least 44px. Copy measures 45–72 characters. The only sticky element is the compact stage rail on larger screens; mobile retains normal document flow and safe-area padding.

## Interaction grammar

- Primary verbs follow the physical sequence: “Choose CSV” → “Map columns” → “Run check” → “Export cleaned CSV.”
- The three-stage rail uses numbered tape-track markers, text, and completion ticks.
- File drop gives an immediate filename/row-count response. Mapping previews update in place. Excluding a transaction behaves like muting a track and can be undone by toggling it back on.
- Results open as a receipt sheet attached to the same workbench, not a modal. Details remain inspectable and printable.
- Empty, parse-error, offline, install, and update states always explain what is true and what to do next.

## Motion

Transitions last 160–220ms and use only opacity and transform. A newly completed stage settles upward by 6px; the receipt unfolds once from its origin. Nothing loops. With `prefers-reduced-motion: reduce`, all movement and smooth scrolling are removed, while hierarchy, outlines, and state text remain identical.

## Asset plan and provenance

The hero image is an original generated editorial still life: a translucent cassette containing ledger grid paper, a red pencil reconciliation mark, and a torn thermal receipt on a warm paper desk. It clarifies the “private checkpoint” concept and supplies the product-specific object vocabulary. It contains no people, brands, logos, or intended text. Small transport marks, the waveform rule, PWA icons, and status symbols are hand-authored CSS/SVG.

### Prompt sheet

Subject: top-down editorial still life of one transparent blank audio cassette whose tape window contains tiny abstract ledger grid marks, beside a red accounting pencil and a short torn receipt; world: independent 1980s photocopied finance zine; materials: translucent smoke plastic, matte paper fibers, graphite, rubber stamp ink; light: soft raking daylight with crisp shallow shadows; lens: 50mm top-down product photograph; palette words: oat paper, near-black ink, muted oxide red, forest transport green; composition: object cluster in lower-right with generous clean paper space; treatment: lightly screen-printed, tactile grain, restrained halftone. Negative list: no readable text, no numbers, no watermark, no logo, no brands, no hands, no people, no currency symbols, no neon, no gradient, no glossy app UI.

Generated with the factory Azure OpenAI image deployment (`factory-image`) on 2026-08-28. The selected output and prompt sidecar are stored in `assets/src/`; the shipped WebP is an optimized derivative. Generated specifically for this product and treated as original product artwork.

The 1200×630 social preview (`public/assets/ledger-social.jpg`) is a 2026-08-28 crop and resize of the selected original artwork. The 180px apple-touch icon is a resize of the hand-authored product icon. Neither introduces third-party material.
