# Gloss

Marginal readings of the live tape.

Gloss holds what the room alleges about a short window. It does not recap, speak in chat, or crown a reading.

First product is closed.

## Windows

`/home/workdir/gloss` is a sandbox path. It does not exist on your PC.

Needs **Node 22+**.

```powershell
cd C:\Users\Contr\Projects\gloss
git pull
npm test
npm start
```

`npm test` stays on fixtures (`NODE_TEST_CONTEXT`). `npm start` uses live Jev when `TYPESAFE_API_KEY` is set.

## Surfaces

| URL | What |
| --- | --- |
| http://127.0.0.1:8788/dock | Operator. Pulse, window, Hold, X tape, Cite Q. |
| http://127.0.0.1:8788/rail | Live readings. 318px. |
| http://127.0.0.1:8788/folio | Last closed session that has readings. |
| http://127.0.0.1:8788/caption | Held reading only. Else □. OBS Browser Source. |
| http://127.0.0.1:8788/second | Bind to a live reading. Not a vote. |

## Finish the run

1. `npm run jev:probe` then `npm start`. Header `live`.
2. Dock + rail + caption + folio open.
3. OBS: Browser Source, URL `http://127.0.0.1:8788/caption`, width ~480, shutdown source when not visible off. Transparent page.
4. Pulse what the room alleges. Hold only what belongs on tape.
5. Optional Deck on `8765`. In `.env`: `GLOSS_QORESENCE_VIEW=http://127.0.0.1:8765/api/session/view`. Restart Gloss. `POST /v1/cite` with `{"pull":true}`. Loopback only. Gloss does not start Qoresence and does not write it.

## Marks

Open · Bound · Thin · Split · Clash · Echo · Closed · Hold

Bound requires window facts. A citation is not Bound. Score, clock, down, and lead are claims of type `state`.

Three live readings. Same post ids do not pulse twice. X tape attaches to the open session.
