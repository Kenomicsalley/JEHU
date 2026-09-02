# JEHU CAMP

Multiplayer for **JEHU** (a Kenomicsalley project). Same scam, everyone decides
privately, nobody sees the others' answers until it's locked — then JEHU
reveals who fell for it and why.

This is the social layer on top of the solo JEHU game, reusing its own
Six Buttons scenarios and tagging system, not a separate product.

## What's actually built right now

- **Two modes**, both running the same round mechanic ("Pressure Protocol"):
  - **⚔️ Defender Duel** — competitive. Correctness is worth far more than
    speed (100 pts for a correct answer, a small speed bonus on top, a streak
    bonus for consecutive correct answers — 0 for a wrong or missed answer,
    ever, no matter how fast).
  - **🛡️ Household Shield** — cooperative. One shared shield (starts at 100).
    Correct answers strengthen it, wrong/missed answers weaken it. If it hits
    zero before the rounds run out, the household loses; if the rounds run
    out with shield remaining, everyone survives together.
- Real-time lobby, round, reveal and results screens, synced across every
  connected player.
- No accounts needed. A host creates a room, gets a 6-character code and an
  invite link (`?join=CODE`), sends it over WhatsApp/whatever, and people
  join from their own phones.
- A **vulnerability profile** at the end of every game: each player's correct
  rate broken down by manipulation tag (Trust, Urgency, Fear, Curiosity,
  Greed, Sympathy, AI, Business) with their weakest one called out — the
  same tags the solo Cyber Academy lessons are organized around, so the
  natural next step is "go read that lesson."
- 2–8 players per room. Host disconnect auto-reassigns to another connected
  player. A round auto-locks after 25s even if someone goes AFK, so the game
  never hangs.

## Architecture — and one deliberate change from the original brief

The original design called for Node + Express + `ws` (WebSockets). I don't
have package-registry access in the environment I built this in, so rather
than hand you an unverified dependency list, **I built this with zero
external dependencies** — just Node's built-in `http` module — and used
**Server-Sent Events** instead of raw WebSockets for the server → client
push (client → server actions go through plain JSON `POST` requests).

For this specific game shape — everyone answers privately, then a
synchronized reveal — SSE does the same job as a WebSocket. It's simpler,
has no install step to go wrong, and deploys identically on Railway (it just
needs a long-lived HTTP connection, same as a WS would). If you later want
true bidirectional low-latency messaging (for something like a live typing
indicator), swapping the transport for `ws` is a contained change — the
whole game logic lives in `server.js` independent of the transport.

Rooms are **in-memory** (a JS `Map`, no database). That's intentional for
this first version, same reasoning as the original brief: it lets you find
out whether people actually enjoy playing before adding Postgres/Redis and
accounts. A room is swept if it's had no activity for 3 hours. Restarting
the server clears all rooms — that's the real cost of skipping a database
right now, and worth knowing before a live event.

## Project layout

```
jehu-camp/
├── server.js         # everything: rooms, scoring, SSE, HTTP routing
├── package.json       # no dependencies
├── railway.toml
├── .gitignore
├── README.md
├── GAME_DESIGN.md
└── public/
    ├── index.html
    ├── styles.css
    └── app.js          # single-page client: lobby / round / reveal / results
```

## Run it locally

```
node server.js
```

Then open `http://localhost:3000` in two browser tabs (or two devices on the
same network, using your machine's local IP instead of `localhost`) to play
against yourself while testing.

## Deploy to Railway

1. Push this folder to a GitHub repo.
2. Create a new Railway project from that repo. `railway.toml` and
   `package.json`'s `start` script are already set up — Railway's Nixpacks
   builder will detect it automatically, no config needed.
3. Railway sets `PORT` itself; `server.js` already reads `process.env.PORT`.
4. Once deployed, share `https://your-app.up.railway.app` as the join link.
   The client already checks `location.protocol` implicitly through
   `fetch`/`EventSource`, which both work correctly over HTTPS with no code
   changes needed.
5. `/health` is wired up as the Railway healthcheck path in `railway.toml`.

I can't push this into a GitHub repo or Railway project for you directly —
I don't have a connected GitHub/Railway tool in this conversation — so
you'll need to do the push and the Railway project creation yourself.
Everything on the code side is ready for it.

## Known limitations (read before a real event)

- **Server restart = rooms gone.** Fine for casual play, not for anything
  you can't afford to lose mid-game.
- **No reconnection-with-history.** If a player's tab closes and they
  rejoin, they're back in the room but the client rebuilds its view from
  the next broadcast — there's no "catch me up" replay of what they missed
  while gone.
- **No profanity/name filtering** on player names.
- **No persistent stats across games.** Vulnerability profiles are
  per-session only right now — see GAME_DESIGN.md for what a "remembers you
  across camps" version would need.

## What I did not build (and why)

The original brief's "Arena 2.0" wishlist — accounts, household profiles,
avatars, persistent XP, public/private rooms, QR-code joining, 20–50+
scenario packs, national/school/company leaderboards, weekly challenges,
automatic personalized training paths — is a genuinely good roadmap, but
it's a different-sized project (a database, auth, and a content pipeline,
at minimum) from "does real-time multiplayer work." I built the part that
answers that question solidly, end-to-end, and documented the rest in
GAME_DESIGN.md as the actual next milestones rather than promising
something I hadn't built.
