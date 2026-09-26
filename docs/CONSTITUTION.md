# Gloss constitution

Gloss holds what the room alleges about a short window of tape.
It does not recap the stream, speak in chat, or crown a reading.

First product is closed.

## Planes

| Plane | Owns |
| --- | --- |
| Ingest | Lines. Dedup. Window tap. X posts as lines. Attach to open session. |
| Judge | Typed questions over prepared state. Citation omitted from state. |
| Compose | Marks from vectors. Caps. Echo merge. Second bind. |
| Ledger | Readings, pulses, folio. Closed Holds stay in folio. |
| Surface | Dock. Rail. Folio. Caption. Second. |
| Glass | Opt-in window citation. Default off. Fail-closed. |

The model does not write the reading label. A span from chat or a canned string is the record.

## Marks

Open · Bound · Thin · Split · Clash · Echo · Closed · Hold

- Concentration is not a mark.
- Support and contradiction both high → Clash. Persist → Hold.
- Echo is identity across wording, not proof.
- Second is a bind to a live reading. Not a vote. Not a new slot.
- Bound requires window facts. No facts → never Bound.
- Caption is the held live reading. No Hold → □.
- Promises do not auto-close when the window advances.
- Score, lead, down and distance, quarter, and game clock are claims of type `state`.

## Caps

Three live readings. Opening a fourth is forbidden. Merge or close first.

## Glass

Default OFF. On, a reading may show `clock_ns` and `frame_seq` from a tapped window.
Missing or malformed citation renders □. Glass does not invent a clock.
A citation is not evidence. Bound still requires window facts.
`same_seq` false renders □. Gloss does not own Qoresence's clock.
Folio may show a citation only when that closed session has readings.

## Out of product

Bits pins, chat bots, generated recaps, game APIs,
client-held keys, a winner, a fourth live reading, live X API polling,
writing into Qoresence, starting Qoresence from Gloss.

## Keys

`TYPESAFE_API_KEY` stays on the server.
`npm test` uses the fixture judge (`NODE_TEST_CONTEXT`).
`npm start` uses live Jev when the key is set.
Live Jev uses `POST https://api.typesafe.ai/v1/systemone` with `model`, `state`, `questions`.
A live miss falls back to the fixture judge and stamps `live-down`. Do not invent request fields.
