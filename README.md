# JEHU ARENA — V2

**Kenomicsalley | Keep Your Trust Guarded**

## v2.1 fixes (read this first if you pulled this build)

Two real bugs were found and fixed in this pass — both verified with actual
running tests, not just read-through:

1. **Server crash on every room join (multiplayer only).** `room:joined`
   was sending the *entire* internal player record back to the client,
   which included the raw WebSocket connection object. Serializing that
   with `JSON.stringify` throws `Converting circular structure to JSON` —
   uncaught, inside a WebSocket message handler, which crashes the whole
   Node process. In practice: the moment anyone created or joined a room,
   the server died, so no round could ever start. Fixed by sending only
   the public player fields (`id`, `name`, `avatar`, `score`, `streak`).
   Verified by actually running `server.js` end-to-end (room create → join
   → start → answer → reveal → finish, both Duel and Household modes) and
   confirming a full game completes without a crash.
2. **Missing `#chainBadge` / `#botChainBadge` elements (both Arena and
   Computer mode).** `startRound()` and `nextBotRound()` both look up
   these elements and call `.classList.toggle(...)` on them immediately
   after setting the scenario title — but neither element existed in
   `index.html`. That throws `Cannot read properties of null`, which
   aborts the function *before* it reaches the lines that render the
   message, evidence, answer choices, or start the countdown timer. This
   is the direct cause of "no questions/options, timer stuck at 35" in
   **both** multiplayer and vs-computer modes, since both functions have
   the same bug independently. Fixed by adding both elements to
   `index.html`. Verified by auditing every `$("#id")` reference in
   `app.js` against `index.html` — all 97 now resolve, zero missing.

Bug 2 explains the reported symptom directly and affects both modes;
bug 1 would have caused a second, separate failure specific to
multiplayer even after bug 2 was fixed. Both needed fixing.

## v2.2 fixes

3. **Arena answer options looked identical round after round.** This
   turned out to be a **content** bug, not a code bug: 200 of the 300
   scenarios (spanning 10 different threat categories) shared the exact
   same 4 generic answer options, a leftover from the content-expansion
   script that generated them. Since two-thirds of the pool shared one
   option set, most rounds showed the same four answers even though the
   question text was genuinely different each time. **Fully re-authored:**
   all 100 affected base scenarios now have their own scenario-specific
   options, written from their actual title/message — see
   `SCENARIO_AUTHORING.md` for the full breakdown. 189 distinct option
   sets across 300 scenarios now (was 1 covering 200 of them). The only
   remaining shared set (12 scenarios) is the single-category
   LEGITIMATE VERIFICATION set, which is intentional, not leftover.
4. **Case Files showed a blank grid.** All 10 case files require
   difficulty 2 or higher, but "Rookie" (difficulty 1, the default for
   every new player) filtered all 10 out, leaving nothing to show. Fixed
   by no longer hard-filtering the 10 case files by difficulty — they're
   a small, curated set, so all 10 now show for every difficulty, sorted
   easiest-first, with their star rating visible for the player to judge.
5. **Round timer:** now 40 seconds (was 35), updated in both the
   server-authoritative round timer and the client display default, for
   both Arena and Computer mode.

### JEHU — Train the Human Firewall

JEHU Arena is a browser-based cybersecurity awareness game. V2 keeps the real-time multiplayer experience and adds **JEHU vs Computer**, with four difficulty levels.

## Modes

- **Defender Duel:** 2–8 human players compete.
- **Household Shield:** 2–8 human players cooperate.
- **JEHU vs Computer:** one human plays against a local AI-style opponent.

### Computer difficulty

| Level | Behaviour |
|---|---|
| Rookie | Forgiving and inconsistent |
| Analyst | Solid defensive judgement |
| Elite | Strong and difficult |
| JEHU Guardian | Very consistent, intentionally tough but beatable |

The computer is **not connected to a paid AI service**. Its decisions are generated locally from the same scenario evidence the player receives, keeping the feature free to run.

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Railway

The app is designed for Railway with a Node start command of `node server.js`. WebSocket connections automatically use `wss://` when the site is served over HTTPS.

The first multiplayer deployment uses in-memory room state. For a larger production deployment, add Redis/shared state, persistence, reconnect/resume, rate limiting, moderation and observability.

## Project structure

```text
server.js
package.json
railway.toml
public/
  index.html
  styles.css
  app.js
  solo/index.html
```

## Safety

JEHU is a defensive awareness product. Scenarios are designed to teach recognition, verification and recovery—not to provide operational instructions for committing fraud.


## Scenario & Threat Simulation Engine

JEHU now ships with **300 scenarios**, including **280 scam/fraud cases and 20 legitimate verification cases**, plus **40 reusable multi-stage attack chains**, **10 branching Case Files**, and **8 Emergency Room playbooks**.

The content is data-driven: scenarios live in `data/scenarios.json`, chains in `data/chains.json`, Case Files in `data/casefiles.json`, and recovery guidance in `data/emergency.json`. Adding a new threat should normally require adding content data and running `npm run validate:content`, not changing the game engine.

### Learning systems
- **JEHU Emergency Room:** defensive response paths for incidents that may already have happened.
- **Multi-stage attack chains:** threats can develop across several linked scenarios.
- **Branching Case Files:** player decisions can change the next stage and final outcome.
- **Adaptive computer:** targets recurring weak psychological buttons when enough evidence exists.
- **Legitimate cases:** teaches verification rather than blanket distrust.
- **Defender Intelligence:** surfaces strengths and watch-outs across the six-button framework.
- **Difficulty gates:** Rookie, Analyst, Elite and JEHU Guardian.

### Six-button framework
Trust • Urgency • Fear • Curiosity • Sympathy • Greed

### Content growth
The scenario schema is designed to scale beyond **500 and 1,000 scenarios**. New content should use stable IDs and include difficulty, category, evidence, choices, answer, lesson, legitimacy and psychological-button metadata where applicable. Run `npm run validate:content` before deployment.
