# JEHU ARENA — V2 GAME DESIGN

## Vision
JEHU Arena is a browser-based cybersecurity awareness game by Kenomicsalley. Version 2 expands the original multiplayer concept with a local **JEHU vs Computer** challenge while preserving the real-time room experience.

## Modes

### 1. Defender Duel
2–8 human defenders compete in the same room. Everyone receives the same scenario and privately locks a response.

### 2. Household Shield
2–8 humans cooperate around a shared shield meter. The goal is to keep the household protected by making safe decisions together.

### 3. JEHU vs Computer
One human plays against an AI-style computer opponent directly in the browser. No account, server-side bot or paid AI API is required.

Difficulty levels:
- **Rookie** — forgiving and inconsistent.
- **Analyst** — usually recognises obvious danger.
- **Elite** — strong defensive judgement.
- **JEHU Guardian** — highly consistent; intended to be genuinely difficult, but still beatable.

The computer does not receive hidden evidence. Difficulty changes its decision accuracy and response timing, not the information available to it.

## Core Loop
Receive → Inspect → Decide → Lock → Reveal → Debrief → Score → Rematch

## Six Psychological Buttons
Scenarios can be tagged with combinations of:
- Trust
- Urgency
- Fear
- Curiosity
- Sympathy
- Greed

Future releases can turn these tags into a defender-strength profile and targeted training system.

## Scoring Philosophy
Safety is worth more than speed. A correct decision earns the majority of the points; speed is only a secondary bonus. The computer follows the same principle.

## Scenario Roadmap
Phishing, bank impersonation, OTP/SIM scams, fake support, marketplace fraud, investment scams, property/rental scams, jobs, romance, scholarship, AI voice impersonation, QR phishing, business email compromise, account takeover and other awareness scenarios.

## V2 Product Direction
- Preserve V1 solo academy.
- Preserve multiplayer rooms and shareable links.
- Add computer difficulty selection.
- Keep the AI challenge fully client-side so it does not introduce paid AI API costs.
- Add player progression and defender analytics in later releases.
- Add reconnect/resume, persistence, moderation, rate limiting and shared state before large-scale public growth.

## Design Rule
**JEHU must never reward reckless clicking.** The winning behaviour is pause, verify, decide and defend.


## Scenario Engine — 300 Cases

JEHU Arena V2 now uses an 300-case scenario library. Each scenario is tagged by difficulty and threat category. A match tracks recently used scenario IDs so a 7-round match does not repeat a case. Starting a new match clears the match history and reshuffles the pool.

### Difficulty gates
- Rookie: foundational cases
- Analyst: foundational + intermediate cases
- Elite: foundational + intermediate + advanced cases
- JEHU Guardian: full scenario library, including sophisticated social-engineering, account-takeover, AI impersonation, business fraud, money-mule and incident-response cases

### Safety principle
JEHU teaches defensive recognition and response. It should not publish operational instructions that help someone commit fraud, evade investigation, launder funds, or defeat security controls. Where bank or government contact details are relevant, the game should teach players to use the institution's independently verified official channel rather than hard-coding an unverified number.


## Cyber-Threat Simulation Engine

JEHU V2 treats content as data rather than hard-coded game logic. The scenario library can grow from 300 to 500, 1,000 or more cases by adding records to `data/scenarios.json`.

### Five impact systems
1. **Emergency Room** — post-incident defensive guidance.
2. **Multi-stage attack chains** — a single social-engineering attack can unfold across several decisions.
3. **Adaptive opponent** — the computer prioritises scenarios connected to the player's recurring weak psychological button.
4. **False positives / legitimate cases** — players practise verification instead of learning to distrust everything.
5. **Defender Intelligence** — match outcomes build a lightweight resilience profile around Trust, Urgency, Fear, Curiosity, Sympathy and Greed.

### Content architecture
- `data/scenarios.json`: individual cases.
- `data/chains.json`: ordered case IDs for multi-stage attacks.
- `data/emergency.json`: incident response playbooks.
- `scenario-engine.js`: selection, difficulty filtering, unique reshuffling, chain selection and public-data shaping.

### Design rule
JEHU must never reward reckless speed over careful verification. Difficulty should increase the sophistication of the threat, not simply shorten the player's thinking time.

## Scenario Engine Architecture

JEHU is now content-first rather than question-first. Scenario records define the threat, psychological pressure, evidence, choices, correct defensive action, lesson and consequence. Chains compose those records into multi-stage attacks.

### Chain library target

The first expansion grows the chain library from 5 to 23 structures. These cover account takeover, money mule activity, supplier compromise, family/AI impersonation, marketplace fraud, SIM swap, recovery-code theft, bank impersonation, rental fraud, investment recovery, job scams, QR phishing, executive impersonation, device compromise, cloud takeover, social-media verification, fake authority pressure, delivery/payment fraud, romance/investment manipulation and AI/deepfake business attacks, plus beginner chains.

The architecture is intentionally open-ended: new chains are data records, not new game code.

### Content quality principle

A larger library is useful only if it remains varied and educational. JEHU should prefer realistic, defensively framed cases; include legitimate situations; teach verification and recovery; and avoid operational details that would help a criminal execute an attack.

## Front Page & JEHU Biblical Campaign — V2.1

The JEHU front page is now structured as a product dashboard rather than a single multiplayer form. The primary modules are:

- **JEHU Arena** — live 2–8 player cyber-threat simulation.
- **JEHU Emergency Room** — dedicated post-incident defensive playbooks.
- **JEHU Case Files** — branching incident simulations.
- **JEHU Academy** — the learning/solo experience.
- **JEHU: The Furious Chariot** — a separate story-driven action campaign inspired by the biblical narrative around Jehu.

Every module exposes a persistent Home route/button so users can return to the main JEHU command centre.

### Biblical Campaign design principles

The campaign is explicitly labelled **inspired by 2 Kings 9–10**. The biblical account establishes Jehu's chariot ride to Jezreel, his reputation for driving furiously, his use of a bow against Joram, and subsequent campaign events. The playable combat is deliberately **fictionalised and non-graphic**: hostile units are abstract targets, and the player is rewarded for accuracy, timing and objective completion rather than graphic violence.

The first campaign version contains three chapters:

1. **The Furious Ride** — horseback movement and precision bow fire.
2. **Chariot of Fire** — rapid chariot movement and multi-arrow volley fire.
3. **The Stronghold** — a strategic objective chapter built around breaking hostile formations and securing a city objective.

The campaign engine is intentionally separated from JEHU Arena so future chapters can add story, maps, boss encounters, upgrades, difficulty and achievements without altering the cybersecurity multiplayer engine.

### Campaign v1.1 — story throughline and liveliness pass

The three chapters now carry one continuous story beat instead of three
disconnected shooting galleries: **a corrupt throne has to be confronted
before anything resembling justice can be rebuilt.** Concretely:

1. **The Furious Ride** — riding to confront a throne built on injustice;
   enemy units are the **Royal Guard** sent to slow the approach.
2. **Chariot of Fire** — the confrontation itself; enemy units are the
   **House of Ahab**'s formation, framed as "what was built on injustice
   doesn't step aside on its own."
3. **The Stronghold** — the aftermath: clearing what's left of the old
   order (**Corrupt Court**) so the standard of justice has a chance to be
   restored. Deliberately framed around clearing a *court/formation*, not
   individuals — kept symbolic and non-graphic throughout, same as before.

Every chapter still carries the "story campaign, inspired by 2 Kings 9–10,
not a depiction of it" framing, now printed directly on the play screen
itself, not just the intro copy.

**What's new mechanically:**
- A **mission briefing** screen per chapter: narrative + three explicit
  objectives (Primary / Secondary / Mastery), matching the "objectives
  before the action" structure from the original brief.
- A **mission-complete** screen with real computed stats: accuracy (hits ÷
  shots fired), time, enemies neutralised, chariot integrity, and a 1–3
  star mastery rating derived from the chapter's own integrity/accuracy
  thresholds — not a flat "good job."
- Hit particles on every kill, a screen-shake + red flash when a target
  breaks through (instead of the HP bar just silently dropping), and a
  large on-canvas wave-clear banner between waves.
- Enemy tokens now show the chapter's actual antagonist label (Royal
  Guard / House of Ahab / Corrupt Court) instead of a generic "HOSTILE."
- `advanceChapter()` chains straight into the next chapter's briefing on a
  win, so a full III-chapter run is playable back-to-back without
  returning to the module home screen each time.

**Deliberately not attempted in this pass** (real scope, not a quick add):
a world map, RPG-style riding/archery/chariot/command progression trees,
save state across sessions, boss encounters, and city-siege strategy
layers. Those need their own data model (persistent player progression)
and are the natural next milestone once this three-chapter version has
actually been played.

### Campaign v1.3 — progression system, world map, bosses (the "not attempted" list, attempted)

Everything flagged as deferred above is now built, using `localStorage`
only — zero database, zero ongoing cost:

- **Save state**: `localStorage` persists gold, four stat levels, and
  per-chapter unlock/star state across sessions (`SAVE_KEY =
  'jehuCampaignSave.v1'`). No accounts needed, same reasoning as JEHU CAMP's
  zero-cost design elsewhere in this project.
- **World map**: the chapter selector is now driven by save state —
  locked chapters show 🔒 and can't be clicked; completed chapters show
  their earned stars (★☆☆ to ★★★).
- **Progression (Riding / Archery / Chariot / Command)**: four stats,
  levels 1–5 each, bought with Gold on an increasing cost curve (50 → 100
  → 175 → 275 per level, 600 to max one stat, 2,400 to max all four).
  Riding raises move speed, Archery lowers fire cooldown, Chariot raises
  max integrity and reduces damage taken, Command shortens Volley/Run
  cooldowns. Verified numerically (not just read through) that every stat
  scales monotonically across all 5 levels and respects its floor/ceiling.
- **Gold economy**: earned from Treasure pickups during a run (+12 each)
  and a mission-completion bonus (30 flat + 15 per star). Gold collected
  during a run is kept even on failure — only the completion bonus and
  chapter unlock require winning. A typical 3-star run funds roughly 1/6
  of a single stat's full upgrade path.
- **New chapter: Megiddo: The Pursuit** (Mission III), inserted between
  Chariot of Fire and The Stronghold — a faster-paced pursuit chapter,
  still on horseback, ending in a boss encounter.
- **Bosses**: Megiddo's Pursuit Champion (3 hits) and the Stronghold's
  final boss (6 hits) replace the last wave's normal formation with a
  single multi-hit target that periodically attacks — jumping at the
  right moment dodges the attack instead of just clearing a hurdle,
  reusing the same jump mechanic for a second purpose rather than adding
  a new one.
- **Pickups**: Blood Bank (+15 integrity) and Treasure (+12 gold) spawn
  on the ground track alongside hurdles and traps, auto-collected on
  reaching the front line — no jump needed, since they're a bonus, not a
  hazard.

Still not attempted, and still a real future milestone, not a quiet
downgrade of the ask: city-siege-specific strategy layers beyond the
existing defensive framing, and cross-device save sync (today's save is
per-browser, per-device, same as any `localStorage`-based save).

### Master Blueprint v1.0 — Phase 1 (visual identity) + Phase 3 (combat depth)

Following the blueprint's own sequencing ("no feature starts without
fitting the system first"), this pass rebuilt the design foundation and
the combat layer together.

**Phase 1 — design system:**
- New CSS design tokens: obsidian/charcoal base, aged gold (authority),
  restrained crimson (danger), bone/ivory text. Electric cyan is now
  *restricted* to Arena/cyber contexts specifically, not used globally —
  matching the blueprint's critique that the old palette made every
  module look the same.
- Typography: Oswald (condensed display, for mission titles and impact
  moments) + Inter (body/data), loaded via Google Fonts.
- Command Center rebuild: a real hero with a rank badge (computed from
  campaign star totals), a rotating "intel" ticker, and one dominant CTA
  — replacing the old flat 5-card grid. Campaign / Grand Arena / Academy
  are now three large, visually distinct primary pillars; Case Files and
  Emergency Room are a visually subordinate secondary row, matching the
  blueprint's hierarchy rule.
- Explicitly *not* attempted: bespoke illustrated iconography (still
  emoji-based in most spots) and composed audio — flagged as a real gap,
  not silently skipped, since neither is achievable without an art/audio
  pipeline this environment doesn't have.

**Phase 3 — combat depth, plus a real bug fix found while building it:**
- **Found and fixed:** roughly half of every wave's enemies (the "top
  row" of the spawn grid) were mathematically unreachable by normal fire
  — verified numerically before and after the fix. Fixed with a fire-time
  aim-assist (arrows are biased 85% toward the nearest live target's
  height at the moment they're loosed, not gradually homed in flight —
  arrows cross the screen in about one frame at this game's speed, so
  in-flight homing would have been meaningless; the bias had to happen at
  the point of firing instead).
- **Four enemy archetypes**, each with genuinely different movement and a
  distinct sprite (not just a recolor): Rusher (default approach),
  Weaver (sine-wave vertical movement, harder to predict), Blocker (slow,
  2 hits to kill), Strafer (holds position, periodically attacks at
  range — dodgeable with a well-timed jump, reusing the jump mechanic a
  third way). Verified every mission's enemy-mix array references real
  archetype keys (a typo here would have silently fallen back to Rusher
  rather than erroring).
- **Destructible crates**: a bonus, not a hazard — must be shot for +18
  gold; ignoring one costs nothing. Genuine "environment matters"
  interaction per the blueprint's ask.
- **Rescue objective**: Chariot of Fire adds a Supply Wagon (visible on
  screen, not just a HUD stat) that Raider-archetype enemies beeline for
  instead of the player. Protecting it is a bonus (+25 gold), not a hard
  requirement — deliberately kept non-blocking so it can't break the
  existing, tested mastery-star formula for other missions.
- **Branching route**: The Furious Ride now opens with a real choice —
  Open Road (more enemies, easier mix) vs River Shortcut (fewer enemies,
  tougher mix) — chosen at the briefing screen, changing that run's
  actual enemy composition, not just flavor text.

Deferred from the blueprint's "advanced version" tier on purpose: weapon
loadouts with resource trade-offs, elite enemy variants, multi-phase
telegraphed boss attacks with arena changes, and branching routes in more
than one chapter. Same reasoning as everywhere else in this project: ship
a real, tested version of the minimum viable tier before reaching for the
advanced one.

### Campaign v1.2 — real controls and terrain hazards

- **Joystick + gamepad buttons.** Movement is now a draggable on-screen
  joystick (Pointer Events, so it works with touch or mouse) instead of
  flat move buttons, alongside four action buttons: **A** fire, **B**
  jump, **C** volley (a 5-arrow burst on a ~4s cooldown, available in
  every chapter now, not just Chapter II), **D** run (a temporary speed
  boost, also on cooldown, with a dust-trail visual). Keyboard works too:
  arrow keys to move, Space to fire, ↑ to jump, Shift to run — same input
  channel as the joystick, so both work simultaneously.
- **Hurdles and traps.** Ground obstacles now spawn alongside the enemy
  waves. Jumping over one in the right window clears it for a small score
  bonus; missing the timing costs chariot integrity (less than an enemy
  breakthrough, so it's a real but forgiving mechanic). You can still fire
  while airborne — jumping was never meant to disable the bow.
- **Terrain per chapter, not just color.** Chapter I (open road) has
  wooden-barricade hurdles and caltrop traps; Chapter II (rocky pass) adds
  a river band across the ground and boulder/pit hazards; Chapter III
  (city gate) uses market-cart and collapsed-archway hazards against a
  city-wall backdrop. Each terrain has its own ground color and hazard
  sprite set rather than only a re-tinted background.

