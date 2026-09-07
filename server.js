const http = require("http");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { WebSocketServer } = require("ws");
const { scenarios, chains, emergency, LEVELS: DIFFICULTY_LEVELS, pickForMatch, chainForDifficulty, publicScenario, stats: scenarioStats, casefiles, caseFilesForDifficulty, publicCaseFile, getCaseFile, getCaseNode } = require("./scenario-engine");

const app = express();
const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.disable("x-powered-by");
app.get("/health", (_req, res) => res.json({ ok: true, service: "jehu-arena", rooms: rooms.size }));

app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const MAX_PLAYERS = 8;
const ROOM_TTL = 1000 * 60 * 60 * 3;
const ROUND_TIME = 35;
const REVEAL_TIME = 8;

app.get("/api/scenarios", (_req, res) => res.json(scenarios.map(s => publicScenario(s, false))));
app.get("/api/chains", (_req, res) => res.json(chains));
app.get("/api/scenario-stats", (_req, res) => res.json(scenarioStats()));
app.get("/api/emergency", (_req, res) => res.json(emergency));
app.get("/api/casefiles", (req, res) => res.json(caseFilesForDifficulty(req.query.difficulty || "rookie")));
app.get("/api/casefiles/:id", (req, res) => { const c = getCaseFile(req.params.id); if (!c) return res.status(404).json({message:"Case file not found"}); res.json(publicCaseFile(c)); });
app.get("/api/casefiles/:id/node/:nodeId", (req, res) => { const c = getCaseFile(req.params.id); if (!c) return res.status(404).json({message:"Case file not found"}); const n = getCaseNode(c, req.params.nodeId); if (!n) return res.status(404).json({message:"Case node not found"}); if (!n.scenario) return res.json({ terminal:n.terminal, summary:n.summary }); const scenario = scenarios.find(s => s.id === n.scenario); if (!scenario) return res.status(500).json({message:"Scenario missing"}); res.json(publicScenario(scenario, true)); });

app.get("*", (_req, res) => { res.sendFile(path.join(__dirname, "public", "index.html")); });

function cleanName(name) {
  return String(name || "Defender").replace(/[<>]/g, "").trim().slice(0, 22) || "Defender";
}
function code() {
  let c;
  do c = crypto.randomBytes(3).toString("hex").toUpperCase(); while (rooms.has(c));
  return c;
}
function send(ws, type, payload = {}) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ type, ...payload }));
}
function broadcast(room, type, payload = {}) {
  room.players.forEach(p => send(p.ws, type, payload));
}
function publicPlayers(room) {
  return [...room.players.values()].map(p => ({
    id: p.id, name: p.name, avatar: p.avatar, score: p.score, streak: p.streak,
    answered: room.answers.has(p.id)
  }));
}
function lobby(room) {
  return {
    code: room.code, hostId: room.hostId, mode: room.mode, difficulty: room.difficulty,
    players: publicPlayers(room), maxPlayers: MAX_PLAYERS
  };
}
function clearRoundTimer(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
}
function startRound(room) {
  clearRoundTimer(room);
  room.round++;
  room.answers = new Map();

  let scenario;
  if (room.chain && room.chainIndex < room.chain.stages.length) {
    const id = room.chain.stages[room.chainIndex++];
    scenario = scenarios.find(s => s.id === id);
  } else {
    room.chain = null;
    room.chainIndex = 0;
    // About one in four eligible rounds becomes a multi-stage attack when possible.
    if (Math.random() < 0.25) {
      const c = chainForDifficulty(room.difficulty, room.usedScenarioIds);
      if (c) {
        room.chain = c;
        room.chainIndex = 1;
        scenario = scenarios.find(s => s.id === c.stages[0]);
      }
    }
    if (!scenario) scenario = pickForMatch(room.difficulty, room.usedScenarioIds);
  }
  room.scenario = scenario;
  room.usedScenarioIds.add(scenario.id);
  room.phase = "question";
  room.roundStartedAt = Date.now();
  broadcast(room, "round:start", {
    round: room.round,
    totalRounds: room.totalRounds,
    endsAt: room.roundStartedAt + ROUND_TIME * 1000,
    scenario: publicScenario(room.scenario, false),
    chain: room.chain ? { id:room.chain.id, title:room.chain.title, stage:room.chainIndex, total:room.chain.stages.length } : null,
    players: publicPlayers(room)
  });
  room.timer = setTimeout(() => reveal(room), ROUND_TIME * 1000);
}
function reveal(room) {
  if (!rooms.has(room.code) || room.phase !== "question") return;
  clearRoundTimer(room);
  room.phase = "reveal";
  const results = [];
  room.players.forEach(p => {
    const a = room.answers.get(p.id);
    let correct = false, points = 0, elapsed = null;
    if (a) {
      correct = a.choice === room.scenario.correct;
      elapsed = Math.max(0, a.at - room.roundStartedAt);
      if (correct) {
        const speed = Math.max(0, 350 - Math.floor(elapsed / 100));
        points = 650 + speed + (p.streak * 75);
        p.score += points;
        p.streak += 1;
      } else {
        p.score += 50;
        p.streak = 0;
        points = 50;
      }
    } else {
      p.streak = 0;
    }
    results.push({ id: p.id, correct, points, choice: a ? a.choice : null, elapsed });
    for (const button of (room.scenario.buttons || [])) {
      p.buttonStats[button] = p.buttonStats[button] || { seen: 0, correct: 0 };
      p.buttonStats[button].seen += 1;
      if (correct) p.buttonStats[button].correct += 1;
    }
  });
  if (room.mode === "team") {
    const correctCount = results.filter(r => r.correct).length;
    const missing = results.filter(r => r.choice === null).length;
    room.teamShield = Math.max(0, Math.min(100, room.teamShield + correctCount * 7 - missing * 8 - (room.players.size - correctCount - missing) * 5));
  }
  broadcast(room, "round:reveal", {
    round: room.round, correct: room.scenario.correct,
    scenario: publicScenario(room.scenario, true),
    teamShield: room.teamShield, lesson: room.scenario.lesson, consequence: room.scenario.consequence || null,
    chain: room.chain ? { id:room.chain.id, title:room.chain.title, stage:room.chainIndex, total:room.chain.stages.length, next:room.chainIndex < room.chain.stages.length } : null,
    results, players: publicPlayers(room)
  });
  if (room.round >= room.totalRounds) {
    room.timer = setTimeout(() => finish(room), REVEAL_TIME * 1000);
  } else {
    room.timer = setTimeout(() => startRound(room), REVEAL_TIME * 1000);
  }
}
function finish(room) {
  if (!rooms.has(room.code)) return;
  clearRoundTimer(room);
  room.phase = "finished";
  const ranking = publicPlayers(room).sort((a,b) => b.score - a.score);
  const defenderProfiles = [...room.players.values()].map(p => {
    const entries = Object.entries(p.buttonStats || {}).map(([button, v]) => ({ button, seen:v.seen, correct:v.correct, resilience:v.seen ? Math.round(v.correct / v.seen * 100) : 0 }));
    entries.sort((a,b) => a.resilience - b.resilience);
    return { id:p.id, name:p.name, strengths:entries.slice(-2).reverse(), watchouts:entries.slice(0,2) };
  });
  broadcast(room, "game:finished", { ranking, defenderProfiles });
}
function removePlayer(room, id) {
  room.players.delete(id);
  room.answers.delete(id);
  if (room.hostId === id) room.hostId = room.players.keys().next().value || null;
  if (!room.players.size) {
    clearRoundTimer(room);
    rooms.delete(room.code);
    return;
  }
  broadcast(room, "lobby:update", lobby(room));
}

wss.on("connection", ws => {
  ws.on("message", raw => {
    let m;
    try { m = JSON.parse(raw.toString()); } catch { return send(ws, "error", { message: "Invalid message." }); }

    if (m.type === "room:create") {
      const c = code();
      const id = crypto.randomUUID();
      const room = {
        code: c, hostId: id, mode: m.mode === "team" ? "team" : "duel",
        difficulty: DIFFICULTY_LEVELS[m.difficulty] ? m.difficulty : "rookie",
        usedScenarioIds: new Set(),
        totalRounds: Math.min(10, Math.max(3, Number(m.rounds) || 7)),
        round: 0, phase: "lobby", teamShield: 100, chain: null, chainIndex: 0, players: new Map(), answers: new Map(), createdAt: Date.now(), timer: null
      };
      rooms.set(c, room);
      room.players.set(id, { id, ws, name: cleanName(m.name), avatar: m.avatar || "🛡️", score: 0, streak: 0, buttonStats: {} });
      ws.roomCode = c; ws.playerId = id;
      send(ws, "room:created", lobby(room));
      send(ws, "room:joined", { me: room.players.get(id), lobby: lobby(room) });
      return;
    }

    if (m.type === "room:join") {
      const c = String(m.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const room = rooms.get(c);
      if (!room) return send(ws, "error", { message: "Room not found. Check the code." });
      if (room.phase !== "lobby") return send(ws, "error", { message: "That game has already started." });
      if (room.players.size >= MAX_PLAYERS) return send(ws, "error", { message: "Room is full." });
      const id = crypto.randomUUID();
      room.players.set(id, { id, ws, name: cleanName(m.name), avatar: m.avatar || "🛡️", score: 0, streak: 0, buttonStats: {} });
      ws.roomCode = c; ws.playerId = id;
      send(ws, "room:joined", { me: room.players.get(id), lobby: lobby(room) });
      broadcast(room, "lobby:update", lobby(room));
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) return send(ws, "error", { message: "Join a room first." });
    const me = room.players.get(ws.playerId);
    if (!me) return;

    if (m.type === "room:start") {
      if (room.hostId !== me.id) return send(ws, "error", { message: "Only the host can start." });
      if (room.players.size < 2) return send(ws, "error", { message: "Invite at least one other defender." });
      startRound(room);
      return;
    }
    if (m.type === "round:answer") {
      if (room.phase !== "question" || room.answers.has(me.id)) return;
      const choice = Number(m.choice);
      if (!Number.isInteger(choice) || choice < 0 || choice >= room.scenario.options.length) return;
      room.answers.set(me.id, { choice, at: Date.now() });
      send(ws, "answer:locked", { choice });
      broadcast(room, "players:update", { players: publicPlayers(room) });
      if (room.answers.size === room.players.size) reveal(room);
      return;
    }
    if (m.type === "room:leave") {
      removePlayer(room, me.id);
      ws.roomCode = null; ws.playerId = null;
      return;
    }
    if (m.type === "room:restart") {
      if (room.hostId !== me.id) return;
      room.players.forEach(p => { p.score = 0; p.streak = 0; p.buttonStats = {}; });
      room.round = 0; room.phase = "lobby"; room.teamShield = 100; room.chain = null; room.chainIndex = 0; room.answers.clear(); room.usedScenarioIds.clear();
      broadcast(room, "lobby:update", lobby(room));
      return;
    }
  });

  ws.on("close", () => {
    const room = rooms.get(ws.roomCode);
    if (room && ws.playerId) removePlayer(room, ws.playerId);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [c, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL) {
      clearRoundTimer(room);
      broadcast(room, "error", { message: "Room expired. Please create a new room." });
      rooms.delete(c);
    }
  }
}, 10 * 60 * 1000);

server.listen(PORT, () => console.log(`JEHU Arena listening on ${PORT}`));
