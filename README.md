# JEHU ARENA — V2

**Kenomicsalley | Keep Your Trust Guarded**

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
