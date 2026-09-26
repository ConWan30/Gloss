# Gloss

Marginal readings of the live tape.

Gloss holds what the room alleges about a short window. It does not recap, score, speak in chat, or crown a reading.

## Windows (your machine)

`/home/workdir/gloss` is a sandbox path. It does not exist on your PC.

Needs **Node 22+** (`node:sqlite` + type stripping).

```powershell
node -v
cd C:\Users\Contr\Projects
git clone https://github.com/ConWan30/Gloss.git gloss
cd gloss
npm test
npm start
```

Then open http://127.0.0.1:8788/dock

If `npm test` complains about `--experimental-strip-types` or `node:sqlite`, your Node is too old. Install current Node LTS 22+ from nodejs.org, open a new PowerShell, run `node -v` again.

Optional live judge (server only):

```powershell
copy .env.example .env
notepad .env
```

Set `TYPESAFE_API_KEY`. Never put that key in the dock page.

Slice 2: dock **X tape** pulses `fixtures/x-session.jsonl` through `/v1/ingest`. Posts are lines. Gloss does not post back to X.

Slice 3: **Margin Glass** is off. Check it, tap `clock_ns` + `frame_seq`. Header shows `fN` or `□`. A citation is not Bound. Gloss does not write Qoresence.

```powershell
cd C:\Users\Contr\Projects\gloss
git pull
npm test
npm start
```

## Marks

Open · Bound · Thin · Split · Clash · Echo · Closed · Hold

Bound requires window facts. Empty facts stay Thin or Open.
