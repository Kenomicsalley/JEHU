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
