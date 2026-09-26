# Gloss constitution

Gloss holds what the room alleges about a short window of tape.
It does not recap the stream, score the play, speak in chat, or crown a reading.

## Planes

| Plane | Owns |
| --- | --- |
| Ingest | Lines. Dedup. Clock. Window tap. X posts as lines. |
| Judge | Typed questions over prepared state. Full vectors stored. |
| Compose | Marks from vectors. Caps. Decay. Echo merge. |
| Ledger | Readings, pulses, folio. Source of record. |
| Surface | Dock now. Rail later. Caption later. |
| Glass | Opt-in window citation. Default off. Fail-closed. |

The model does not write the reading label. A span from chat or a canned string is the record.

## Marks

Open · Bound · Thin · Split · Clash · Echo · Closed · Hold

- Concentration is not a mark.
- Support and contradiction both high → Clash. Persist → Hold.
- Echo is identity across wording, not proof.
- Bound requires a window descriptor. No window → never Bound.
- Promises do not auto-close when the window advances.

## Caps

Three live readings. Opening a fourth is forbidden. Merge or close first.

## Glass

Default OFF. On, a reading may show `clock_ns` and `frame_seq` from a tapped window.
Missing or malformed citation renders □. Glass does not invent a clock.
A citation is not evidence. Bound still requires window facts.
Gloss does not own Qoresence's clock.

## Out of product (slice 3)

Second, Caption, Bits pins, chat bots, generated recaps, game APIs,
client-held keys, a winner, a fourth live reading, live X API polling,
writing into Qoresence.

## Keys

`TYPESAFE_API_KEY` stays on the server. Tests run on fixtures when it is unset.
Live Jev uses `POST https://api.typesafe.ai/v1/systemone` with `model`, `state`, `questions`.
A live miss falls back to the fixture judge and stamps `live-down`. Do not invent request fields.
