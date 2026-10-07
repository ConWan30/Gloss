# Motion notes

The design language for the Gloss surfaces. Front end only. Marks, caps, and copy follow `docs/CONSTITUTION.md`.

## Picture

A strip of live tape runs down the left of the margin. Readings are glass plates in that margin, each tied to the tape by a hairline leader. The window is a fixed bracket that the tape runs under. Nothing is crowned, so no plate ever outranks another in size or position.

## Marks

Each mark has one shape and one color. The shape alone is enough, so marks still read in grayscale or for colorblind viewers. Glyphs are inline SVG masks in `public/gloss.css` (`--g-*`). They do not depend on a font.

| Mark | Glyph | Color | Plate treatment |
| --- | --- | --- | --- |
| Open | hollow ring | `--open` #b4aea2 | glyph breathes slowly while open |
| Bound | ring with a core | `--bound` #8fb898 | still. Settled by window facts |
| Thin | dotted ring | `--thin` #8796a6 | dashed edge, softer label |
| Split | half-filled ring | `--split` #d39c5c | margin rule broken in two |
| Clash | two wedges meeting | `--clash` #d76d61 | two pressures push along the top edge from opposite sides |
| Echo | two overlapping rings | `--echo` #a698d2 | offset ghost edge behind the plate |
| Closed | ring with a bar | `--closed` #77726a | dimmed |
| Hold | sealed diamond | `--hold` #e2c072 | gold edge, warmer glass, pin dot. Never animates once sealed |
| □ | plain text □ | ink | an empty frame. No plate behind it |

## Motion rules

- The tape advances slowly and linearly (`tape-advance`, `reel`). It uses `transform` only, so the compositor does the work.
- The folio tape is still. That session is closed.
- A plate animates only when it is new (`is-new`, settle in 620ms) or when its mark changes (`is-remarked`, one soft ring). Polling an unchanged view changes no DOM, so nothing re-animates. See `public/gloss.js`.
- Becoming Hold plays one short seal. After that the plate is still.
- Clash keeps a slow two-sided press. Open keeps a slow breath. Nothing else loops.
- Durations are 400 to 900ms with one settle curve. No bounce and no neon glow.

## Caption (OBS)

- `html.caption-doc` and `body.caption` are transparent. OBS reads the root background too.
- No `backdrop-filter`. The plate is a plain translucent gradient, which costs OBS almost nothing.
- No constant animation. The caption repaints only when the held reading changes. That repaint plays one 420ms fade and one sheen.
- No Hold renders a bare □. There is no plate behind it.

## Fallbacks

- `prefers-reduced-motion: reduce` turns off every animation and transition. The tape stops. The landing hero shows one settled state and does not loop.
- No `backdrop-filter` support: plates fall back to opaque `--plate` fills with the same edges. The glass styling sits inside `@supports`.
- Fonts are system stacks only. Nothing is fetched at runtime and there are no new dependencies.

## Landing

`public/index.html` is served at `/`. It links `gloss.css` relatively, so it also works from a static server or from `file://`. The hero uses inline demo text and is labeled as not live. When opened from disk, surface links point at `http://127.0.0.1:8788`.
