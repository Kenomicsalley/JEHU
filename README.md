# JEHU ARENA — V2

**Kenomicsalley | Keep Your Trust Guarded**

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
