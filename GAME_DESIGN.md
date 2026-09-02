# JEHU CAMP — Game Design

## Core mechanic: Pressure Protocol

Every mode runs the same round loop:

1. The server picks the next scenario and broadcasts it to everyone at once.
2. Each player answers **privately** — nobody can see anyone else's choice
   while the round is live, only whether they've locked one in yet.
3. The round ends the moment everyone connected has answered, or after 25
   seconds, whichever comes first (so one AFK player can't freeze the room).
4. **Reveal**: the correct answer, the explanation, and everyone's choice
   (including whether they got it right) are shown together.
5. The host advances to the next round (or the game auto-advances after 20s
   if the host is idle on the reveal screen).

This is the same "pause, verify, decide" loop the solo campaign trains —
Camp just makes it social and synchronous.

## Modes

### ⚔️ Defender Duel (competitive)

Scoring per round, correct answer only:

```
points = 100 (base for being correct)
        + speed bonus, up to 20, scaled by how much of the 25s you had left
        + streak bonus, min(10 × (streak − 1), 50) for consecutive correct rounds
```

A wrong or missing answer scores 0 and resets the streak to 0.

This is deliberately lopsided toward correctness: the fastest possible wrong
answer is still worth nothing, and the slowest possible correct answer is
still worth 100. Speed only ever adds a little on top of being right — it
never substitutes for it. That was an explicit design goal in the original
brief ("I don't want JEHU teaching 'click quickly.' I want it teaching
'think correctly.'") and it's enforced structurally, not just described.

### 🛡️ Household Shield (cooperative)

One shared shield, starts at 100.

```
correct answer:  shield += 4   (capped at 100)
wrong/no answer: shield -= 8
```

If shield hits 0 before all rounds are played, the household loses ("the
scammer got in"). If the rounds run out with shield remaining, everyone
wins together. There's no individual score in this mode by design — it's
meant for a family or team to feel like they're defending one thing
together, not competing against each other while a scammer is the actual
opponent.

## Scenario tags and the vulnerability profile

Every scenario carries one tag: `Trust`, `Urgency`, `Fear`, `Curiosity`,
`Greed`, `Sympathy`, `AI`, or `Business` — the same categories the solo
Cyber Academy is organized around. At the end of a game, each player's
per-tag correct rate is shown as a set of bars, with their weakest tag
flagged. This is the "Ali's Defender Profile" idea from the original brief,
implemented as-is: it's genuinely useful because it points a player at a
*specific* Academy lesson afterward instead of a vague "do better."

Right now this profile resets every game — there's no persistent per-player
history. See "Not yet built" below for what that needs.

## Scenario bank

16 scenarios currently, ported directly from JEHU's own campaign and Scam
Lab content (not written fresh for Camp) so the two products stay in sync
and a player who's done the solo campaign recognizes the material. A room
draws a random subset (4–16, host's choice) each game, shuffled, so replays
don't feel identical.

Growing the bank is just adding entries to the `SCENARIOS` array in
`server.js` — no schema change needed. That's the natural first content
task if Camp gets used regularly.

## Room lifecycle

`lobby → round → reveal → (round → reveal)* → ended`

- **lobby**: players join via code/link; host needs ≥2 connected players to
  start.
- **round/reveal** repeat once per scenario in the room's shuffled set.
- **ended**: final standings (Duel) or survived/shield (Household), plus
  everyone's vulnerability profile.

A disconnected host is reassigned to the next connected player automatically
so a dropped call doesn't strand the room.

## Not yet built (the real "Camp 2.0" list)

Everything below is a genuinely good next step, deliberately not attempted
in this pass because each one changes the project's shape (needs a
database, or auth, or a content pipeline) rather than extending what's
already running:

- **Accounts + persistent stats** — so a vulnerability profile accumulates
  across camps instead of resetting every game. Needs a database (Postgres
  is the obvious Railway-native choice) and some form of login (even a
  lightweight magic-link or device-based identity would do for v1 of this).
- **Household/family profiles** — a named group whose members' shields and
  history persist together across sessions, not just within one game.
- **Public rooms + browsing** — right now every room is private-by-code.
  Public rooms need moderation thinking (open rooms + no accounts is an
  abuse vector) before they're a good idea.
- **QR-code joining** — genuinely trivial to add (generate a QR for the
  invite URL client-side) whenever it's wanted; deliberately left out of
  this pass only because it's decoration on top of a feature that needed to
  be proven first.
- **Larger scenario packs with difficulty levels** — growing the 16-item
  bank toward the 20–50+ the original brief describes, plus a way to tag
  difficulty, once there's a sense of which scenarios actually play well.
- **Leaderboards (family/school/company/national)** — all downstream of
  accounts existing first; a national leaderboard also implies real
  moderation and anti-cheat thinking that a household game doesn't need.
- **Automatic personalized training path** — "JEHU keeps generating Fear
  scenarios because that's your weak tag" — the data model for this
  (per-player, per-tag history) is compatible with what Camp already tracks
  per-game; it just needs to persist across games, which again comes back
  to accounts.

None of this is hard in principle. It's sequenced this way because shipping
a solid, tested real-time game loop first is what makes the rest of the list
worth building — there's no point building leaderboards for a multiplayer
mode nobody's confirmed people enjoy playing yet.
