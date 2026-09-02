# JEHU Arena — Multiplayer Cyber Awareness

A real-time multiplayer extension for **JEHU**, the Kenomicsalley cybersecurity awareness game.

## Game concept: Pressure Protocol

2–8 defenders join the same room from separate phones or computers.

Each round:
1. Everyone receives the same realistic scam/fraud scenario.
2. Players inspect the message and evidence.
3. Each player privately chooses a response.
4. The decision locks.
5. The server reveals the safest response.
6. Everyone sees the educational debrief and the round leaderboard.
7. Correct decisions earn the most XP; speed is a secondary bonus.
8. The final scoreboard crowns the strongest defender.

### Modes
- **Defender Duel** — competitive individual scoring.
- **Household Shield** — the same engine, intended for families/households. The UI is ready for a future cooperative scoring layer.

## Why this fits JEHU

The original JEHU already teaches the six psychological buttons — trust, urgency, fear, curiosity, sympathy and greed — and includes a campaign, digital simulator, Scam Lab, Cyber Academy, AI Threat Lab, security checkup, incident response, XP and achievements. The Arena turns those lessons into a social decision experience rather than another quiz.

## Architecture

- Node.js
- Express
- WebSocket (`ws`)
- Static HTML/CSS/JS frontend
- Server-authoritative rooms and scoring
- In-memory room state for the first deployment
- No database required for this MVP
- Railway-compatible health endpoint at `/health`
- WebSocket connection automatically uses `wss://` when deployed over HTTPS

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000

Open the same URL on multiple devices on your network (using the host computer's LAN address) or deploy to Railway.

## Railway

1. Push this folder to a GitHub repository.
2. In Railway, create a new project from the GitHub repository.
3. Railway detects Node.js from `package.json`.
4. Start command: `npm start` (already in `railway.toml`).
5. Health check: `/health`.
6. Railway's public HTTPS domain will support WebSockets through `wss://`.

## Important production upgrade before large public launch

The current server stores rooms in memory. This is intentional for the first multiplayer deployment: it keeps the system simple and cheap. For a multi-instance production environment, add Redis/pub-sub or another shared realtime state layer, persistent player accounts, rate limiting, abuse controls, telemetry, and database-backed profiles.

## Safety

JEHU is a defensive education platform. Scenario content teaches recognition, verification and recovery. It deliberately does not provide operational instructions for fraud, credential theft, malware, unauthorized access, or other criminal activity.
