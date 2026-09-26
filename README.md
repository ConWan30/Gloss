# Gloss

Marginal readings of the live tape.

Gloss holds what the room alleges about a short window. It does not recap, score, speak in chat, or crown a reading.

Slice 1: dock, three-reading cap, echo / thin / split / clash, folio at close. No Second. No Caption. No game API.

## Run

```bash
node -v   # 22+
npm test
npm start
```

Dock: http://127.0.0.1:8788/dock  
Rail: http://127.0.0.1:8788/rail  

Without `TYPESAFE_API_KEY` the judge is the fixture. Put the key in `.env` on the server only.

```bash
npm run replay
```

## Marks

Open · Bound · Thin · Split · Clash · Echo · Closed · Hold

Bound requires window facts. Empty facts stay Thin or Open.

## Layout

```
src/compose   marks, labels, pulse
src/jev       question pack, fixture, live client
src/ledger.ts sqlite
src/server.ts dock + /v1
public/       dock and rail
docs/         constitution
```

## Not this product

A cohost. A sentiment meter. A prediction winner. A Twitch extension (later, maybe never). A merge into the observatory brain.
