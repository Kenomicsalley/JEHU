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
