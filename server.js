const http = require("http");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.disable("x-powered-by");
app.get("/health", (_req, res) => res.json({ ok: true, service: "jehu-arena", rooms: rooms.size }));
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const MAX_PLAYERS = 8;
const ROOM_TTL = 1000 * 60 * 60 * 3;
const ROUND_TIME = 35;
const REVEAL_TIME = 8;

const scenarios = [
  {
    id: "A01", title: "The Bank Call", category: "TRUST",
    message: "A caller says they are from your bank. They know your name and the last four digits of your account. They say a suspicious transfer is happening and ask for the OTP that just arrived on your phone.",
    evidence: ["Unexpected caller", "Partial personal details", "OTP request", "Fear of account loss"],
    options: ["Give the OTP", "Hang up and call the bank using a trusted number", "Ask the caller to send another code"],
    correct: 1,
    lesson: "Partial knowledge does not prove identity. One-time codes are not something an unexpected caller should receive."
  },
  {
    id: "A02", title: "10 Minutes", category: "URGENCY",
    message: "A text says: “Your account will be permanently blocked in 10 minutes. Verify now.” A link is included.",
    evidence: ["Countdown pressure", "Threat of loss", "Unexpected link", "Demand for immediate action"],
    options: ["Click immediately", "Pause and verify through the official app/site", "Forward it to a friend"],
    correct: 1,
    lesson: "Urgency is a lever. Breaking the sender's communication path gives you time to verify."
  },
  {
    id: "A03", title: "Safe Account", category: "FEAR",
    message: "Someone claiming to be an investigator says your account is connected to a crime. They demand that you transfer your money to a “safe account” immediately.",
    evidence: ["Authority claim", "Fear", "Money transfer", "Isolation"],
    options: ["Transfer the money", "Ask for a badge number and comply", "Do not transfer; independently verify the claim"],
    correct: 2,
    lesson: "Threats and authority claims should make you verify, not surrender control of your money."
  },
  {
    id: "A04", title: "Is This You?", category: "CURIOSITY",
    message: "A friend's account sends: “Is this you in this video? 😂” followed by an unfamiliar link. The message is unusual for them.",
    evidence: ["Curiosity hook", "Unexpected link", "Friend account may be compromised", "Emotional trigger"],
    options: ["Open the link", "Verify with the friend through another channel", "Ask them to resend it"],
    correct: 1,
    lesson: "Familiar accounts can be compromised. Verify unexpected links before opening them."
  },
  {
    id: "A05", title: "The Millionaire Prize", category: "GREED",
    message: "You receive a message saying you won ₦5,000,000. To release it, you must pay a ₦25,000 processing fee within 20 minutes.",
    evidence: ["Unexpected prize", "Upfront fee", "Scarcity", "Huge reward"],
    options: ["Pay the fee", "Send your ID first", "Stop and treat the fee demand as a major scam signal"],
    correct: 2,
    lesson: "Unexpected prizes plus upfront fees are a classic fraud pattern."
  },
  {
    id: "A06", title: "Hospital Emergency", category: "SYMPATHY",
    message: "A person you met online says their child is in hospital and urgently asks for ₦50,000. They say refusing means you do not care.",
    evidence: ["Emotional story", "Urgency", "Money request", "Guilt"],
    options: ["Send immediately", "Verify the identity and story independently", "Borrow money for them"],
    correct: 1,
    lesson: "Compassion is good. Verification keeps compassion from being exploited."
  },
  {
    id: "A07", title: "Changed Supplier", category: "BUSINESS",
    message: "An email from a supplier says their bank account has changed and asks you to pay today's ₦850,000 invoice to a new account immediately.",
    evidence: ["Payment-detail change", "Large amount", "Urgency", "Email-only verification"],
    options: ["Pay the new account", "Verify using a previously known contact method", "Reply asking if the change is real"],
    correct: 1,
    lesson: "Payment changes should be verified outside the channel that requested the change."
  },
  {
    id: "A08", title: "AI Voice", category: "AI",
    message: "You receive a voice note that sounds exactly like a family member. They say they lost their phone and need money urgently. The number is unfamiliar.",
    evidence: ["Familiar voice", "Changed number", "Urgency", "Money request"],
    options: ["Send the money", "Verify through a known number or trusted channel", "Ask for a voice note proving it"],
    correct: 1,
    lesson: "A convincing voice is no longer strong identity proof. Change channel and verify."
  },
  {
    id: "A09", title: "Fake Support", category: "IMPERSONATION",
    message: "You complain about your bank on social media. An account using the bank's logo replies and asks you to DM your PIN and OTP so they can “fix” the issue.",
    evidence: ["Impersonation", "Social-media contact", "PIN request", "OTP request"],
    options: ["Send the details", "Use the bank's official app/site support", "Send only the PIN"],
    correct: 1,
    lesson: "Use official support channels. Legitimate support should not need your password, PIN or OTP."
  },
  {
    id: "A10", title: "The QR Reward", category: "QR PHISHING",
    message: "A poster says: “Scan to claim your reward.” The QR code opens a page asking for your banking login.",
    evidence: ["Reward lure", "QR code", "Login page", "Unexpected destination"],
    options: ["Log in", "Close it and navigate to the official service yourself", "Enter the password but not the OTP"],
    correct: 1,
    lesson: "QR codes are just links in another form. Inspect the destination and verify it."
  }
];

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
    code: room.code, hostId: room.hostId, mode: room.mode,
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
  room.scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  room.phase = "question";
  room.roundStartedAt = Date.now();
  broadcast(room, "round:start", {
    round: room.round,
    totalRounds: room.totalRounds,
    endsAt: room.roundStartedAt + ROUND_TIME * 1000,
    scenario: {
      id: room.scenario.id, title: room.scenario.title, category: room.scenario.category,
      message: room.scenario.message, evidence: room.scenario.evidence, options: room.scenario.options
    },
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
  });
  if (room.mode === "team") {
    const correctCount = results.filter(r => r.correct).length;
    const missing = room.players.size - results.length;
    room.teamShield = Math.max(0, Math.min(100, room.teamShield + correctCount * 7 - missing * 8 - (room.players.size - correctCount - missing) * 5));
  }
  broadcast(room, "round:reveal", {
    round: room.round, correct: room.scenario.correct,
    scenario: { title: room.scenario.title, options: room.scenario.options },
    teamShield: room.teamShield, lesson: room.scenario.lesson, results, players: publicPlayers(room)
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
  broadcast(room, "game:finished", { ranking });
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
        totalRounds: Math.min(10, Math.max(3, Number(m.rounds) || 7)),
        round: 0, phase: "lobby", teamShield: 100, players: new Map(), answers: new Map(), createdAt: Date.now(), timer: null
      };
      rooms.set(c, room);
      room.players.set(id, { id, ws, name: cleanName(m.name), avatar: m.avatar || "🛡️", score: 0, streak: 0 });
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
      room.players.set(id, { id, ws, name: cleanName(m.name), avatar: m.avatar || "🛡️", score: 0, streak: 0 });
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
      room.players.forEach(p => { p.score = 0; p.streak = 0; });
      room.round = 0; room.phase = "lobby"; room.teamShield = 100; room.answers.clear();
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
