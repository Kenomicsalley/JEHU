// JEHU CAMP — multiplayer server
// Zero external dependencies: Node's built-in http module only.
// Real-time push via Server-Sent Events (SSE); actions via JSON POST.
// Rooms are in-memory (see README for why, and what v2 changes).

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const ROUND_MS = 25000;        // time players get to answer a round
const REVEAL_AUTO_MS = 20000;  // if host goes AFK on the reveal screen, auto-advance
const ROOM_TTL_MS = 1000 * 60 * 60 * 3; // rooms older than 3h with no activity get swept

const PUBLIC_DIR = path.join(__dirname, "public");

// ---------------------------------------------------------------------------
// Scenario bank — reused straight from JEHU's own Six Buttons campaign and
// Scam Lab, so the Camp is trained on the same content as the solo game.
// ---------------------------------------------------------------------------
const SCENARIOS = [
 {id:"S01",tag:"Trust",prompt:"A caller says: \u201cHello, this is your bank\u2019s fraud department. We\u2019ve detected an unauthorized transfer. Read out the OTP that was just sent to your phone so we can stop it.\u201d",choices:["Give the OTP so they can stop the transfer","Hang up and call the bank using the number on your card","Ask them to send a second code first"],correct:1,explain:"No legitimate bank asks you to read out an OTP over the phone. Hang up and call back on a number you already trust."},
 {id:"S02",tag:"Urgency",prompt:"A text says: \u201cYour account will be permanently blocked in 10 minutes. Verify now: secure-check.example\u201d",choices:["Click the link immediately, before time runs out","Ignore the countdown and verify independently through the official app","Forward it to a friend to check first"],correct:1,explain:"Countdown timers exist to stop you thinking. A genuine issue survives you checking through the official app."},
 {id:"S03",tag:"Fear",prompt:"A message claims you\u2019re under investigation and must move your money to a \u201csafe account\u201d immediately to avoid seizure.",choices:["Transfer the money to the safe account","Refuse to transfer, and verify the claim independently","Send your ID to prove your innocence"],correct:1,explain:"No real investigation ever asks you to move your own money to \u201cprotect\u201d it. That instruction is always the scam."},
 {id:"S04",tag:"Curiosity",prompt:"A friend\u2019s account sends: \u201cIs this you in this video? \ud83d\ude02\u201d with an unfamiliar link.",choices:["Open it right away","Verify with your friend through a separate, trusted channel first","Ask them to resend the same link"],correct:1,explain:"Compromised accounts are one of the most common ways scam links spread \u2014 verify before you click, even for friends."},
 {id:"S05",tag:"Greed",prompt:"\u201cCongratulations! You\u2019ve won \u20a65,000,000. Pay a \u20a625,000 processing fee within 30 minutes to claim it.\u201d",choices:["Pay quickly, before the offer expires","Stop \u2014 an upfront fee to claim a prize you didn\u2019t enter is a major red flag","Send your name and address to confirm"],correct:1,explain:"If you have to pay to receive a prize, it isn\u2019t a prize. This pattern is one of the oldest scams there is."},
 {id:"S06",tag:"Sympathy",prompt:"Someone you met online says their child is in hospital and urgently needs \u20a650,000 \u2014 today, from you specifically.",choices:["Send it right away \u2014 it\u2019s an emergency","Verify their identity and story independently before sending anything","Send half now and half later"],correct:1,explain:"Compassion is valuable \u2014 the lesson isn\u2019t \u2018never help\u2019, it\u2019s that verification should never be skipped because of urgency or guilt."},
 {id:"S07",tag:"Greed",prompt:"A job offer arrives for a role you never applied for. Before onboarding, they ask for a \u201cregistration fee.\u201d",choices:["Pay it \u2014 the salary offered is excellent","Verify the employer independently before paying or sharing any information","Send your bank details so they can pay the fee for you"],correct:1,explain:"Real employers don\u2019t charge you to be hired. An upfront fee is the tell."},
 {id:"S08",tag:"Urgency",prompt:"A loan app you borrowed from a week ago sends: \u201cYou\u2019re 1 day late. Pay now or we message everyone in your contacts.\u201d",choices:["Pay immediately out of panic","Don\u2019t panic-pay under threat \u2014 document it and report the app","Ask them to message your contacts instead, to prove they mean it"],correct:1,explain:"Threatening your contacts over a debt is an illegal harassment tactic used by predatory apps, not a normal reminder."},
 {id:"S09",tag:"Trust",prompt:"Someone calls claiming to be your network provider: \u201cYour SIM needs re-registration. Please read out the verification code you just received.\u201d",choices:["Read out the code so the SIM gets fixed","End the call and contact your provider through an official channel","Give your date of birth as extra proof first"],correct:1,explain:"A verification code should never leave your hands for an unexpected caller \u2014 this is a classic SIM-swap attempt."},
 {id:"S10",tag:"Curiosity",prompt:"A QR code at a public counter reads \u201cScan to claim your reward.\u201d It opens a page asking you to log in with your bank details.",choices:["Log in \u2014 it looks official","Close it, and use your bank\u2019s own app or website instead","Enter your password but not your OTP"],correct:1,explain:"A QR code is just a delivery method for a link \u2014 treat its destination exactly like you would any other suspicious link."},
 {id:"S11",tag:"Greed",prompt:"A DM reads: \u201cOur AI trading bot guarantees 40% profit every week. Send USDT to this wallet to start today. Slots closing soon!\u201d",choices:["Send a small amount to test it","Treat it as a scam \u2014 guaranteed high returns don\u2019t exist, and crypto sent can\u2019t be reversed","Ask for their trading license first, then send funds"],correct:1,explain:"No legitimate investment can guarantee returns. Combined with irreversible crypto payment, this is a total loss waiting to happen."},
 {id:"S12",tag:"Sympathy",prompt:"An online partner you\u2019ve never met in person says they\u2019re stranded at the airport and need \u20a6150,000 to get home to you.",choices:["Send the money \u2014 refusing would prove you don\u2019t care","Verify their identity independently before sending anything","Ask a mutual friend to vouch for them instead"],correct:1,explain:"An unverifiable emergency story from someone you\u2019ve never met is one of the most common and costly scam patterns."},
 {id:"AI1",tag:"AI",prompt:"A video call appears to show your manager, asking for an urgent, confidential transfer. Something about the request feels slightly off.",choices:["Transfer immediately \u2014 the video looks completely real","Pause, and verify the request through a separate trusted channel","Record the call as proof, then transfer"],correct:1,explain:"Realistic audio or video is not proof of identity. High-impact requests always deserve independent verification, AI or not."},
 {id:"AI2",tag:"AI",prompt:"A voice note that sounds exactly like your child says their phone was lost and urgently asks you to transfer money.",choices:["Send the money \u2014 you\u2019d know your own child\u2019s voice","Call them back on a number you already have, or use a family safe word","Ask them to send another voice note as proof"],correct:1,explain:"Voice cloning needs only a short public clip to sound convincing. Changing channels to verify beats trusting your ears alone."},
 {id:"B1",tag:"Business",prompt:"A supplier\u2019s email says their bank account has changed, and asks you to use the new details for today\u2019s invoice.",choices:["Pay using the new account right away","Verify the change through a previously known contact, not the email itself","Reply to the email asking them to confirm"],correct:1,explain:"Payment-detail changes are high-risk. Business email compromise like this has cost companies far more than most consumer scams combined."},
 {id:"B2",tag:"Business",prompt:"You complain about your bank on social media. Minutes later, an account with the bank\u2019s logo comments asking you to DM your account number and PIN to \u201cresolve\u201d it.",choices:["DM the details \u2014 they clearly work for the bank","Ignore it, and use the bank\u2019s official app or verified support line","Ask them to call you instead"],correct:1,explain:"Fake \u2018customer care\u2019 accounts intercept people who are already frustrated and looking for a fast fix. No real support needs your PIN."}
];

const TAGS = ["Trust","Urgency","Fear","Curiosity","Greed","Sympathy","AI","Business"];

// ---------------------------------------------------------------------------
// Room state
// ---------------------------------------------------------------------------
const rooms = new Map(); // code -> room
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 ambiguity

function makeCode() {
  let c;
  do {
    c = "";
    for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  } while (rooms.has(c));
  return c;
}
function makeId() { return crypto.randomBytes(9).toString("hex"); }
function shuffled(arr) { return [...arr].map(v => [Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(v=>v[1]); }

function newRoom(mode, roundCount) {
  const code = makeCode();
  const room = {
    code,
    mode: mode === "household" ? "household" : "duel",
    state: "lobby", // lobby | round | reveal | ended
    hostId: null,
    players: new Map(), // id -> player
    scenarios: shuffled(SCENARIOS).slice(0, Math.max(4, Math.min(roundCount || 10, SCENARIOS.length))),
    roundIndex: -1,
    shield: 100,
    roundEndsAt: 0,
    timer: null,
    lastActivity: Date.now()
  };
  rooms.set(code, room);
  return room;
}

function addPlayer(room, name) {
  const id = makeId(), token = makeId();
  const p = {
    id, token, name: (name || "Defender").toString().slice(0, 20) || "Defender",
    score: 0, streak: 0, connected: false, ready: false,
    sseRes: null, answers: {}, tagStats: {} // tagStats[tag] = {correct,total}
  };
  room.players.set(id, p);
  if (!room.hostId) room.hostId = id;
  return p;
}

function touch(room) { room.lastActivity = Date.now(); }

function currentScenario(room) {
  return room.roundIndex >= 0 && room.roundIndex < room.scenarios.length ? room.scenarios[room.roundIndex] : null;
}

function connectedPlayers(room) { return [...room.players.values()].filter(p => p.connected); }

function allAnswered(room) {
  const cp = connectedPlayers(room);
  if (cp.length === 0) return false;
  return cp.every(p => room.roundIndex in p.answers);
}

// ---------------------------------------------------------------------------
// Broadcasting (SSE)
// ---------------------------------------------------------------------------
function send(res, event, data) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch (e) { /* client gone, will be cleaned up on 'close' */ }
}

function snapshot(room) {
  const scenario = currentScenario(room);
  const players = [...room.players.values()].map(p => ({
    id: p.id, name: p.name, score: p.score, streak: p.streak,
    connected: p.connected, ready: p.ready, isHost: p.id === room.hostId,
    answered: room.state === "round" ? (room.roundIndex in p.answers) : false
  }));
  const base = {
    code: room.code, mode: room.mode, state: room.state,
    roundIndex: room.roundIndex, totalRounds: room.scenarios.length,
    shield: room.mode === "household" ? room.shield : undefined,
    players,
    roundEndsAt: room.state === "round" ? room.roundEndsAt : undefined
  };
  if (room.state === "round" && scenario) {
    base.round = { tag: scenario.tag, prompt: scenario.prompt, choices: scenario.choices };
  }
  if (room.state === "reveal" && scenario) {
    base.reveal = {
      tag: scenario.tag, prompt: scenario.prompt, choices: scenario.choices,
      correct: scenario.correct, explain: scenario.explain,
      answers: [...room.players.values()].map(p => ({
        id: p.id, name: p.name, choice: p.answers[room.roundIndex] ?? null,
        correct: p.answers[room.roundIndex] === scenario.correct
      }))
    };
  }
  if (room.state === "ended") {
    base.results = buildResults(room);
  }
  return base;
}

function broadcast(room) {
  const snap = snapshot(room);
  for (const p of room.players.values()) {
    if (p.sseRes) send(p.sseRes, "state", snap);
  }
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------
function startGame(room) {
  if (room.state !== "lobby") return;
  room.roundIndex = -1;
  room.shield = 100;
  for (const p of room.players.values()) { p.score = 0; p.streak = 0; p.answers = {}; p.tagStats = {}; }
  nextRound(room);
}

function nextRound(room) {
  clearTimeout(room.timer);
  room.roundIndex++;
  if (room.roundIndex >= room.scenarios.length || (room.mode === "household" && room.shield <= 0)) {
    room.state = "ended";
    touch(room);
    broadcast(room);
    return;
  }
  room.state = "round";
  room.roundEndsAt = Date.now() + ROUND_MS;
  touch(room);
  broadcast(room);
  room.timer = setTimeout(() => revealRound(room), ROUND_MS);
}

function revealRound(room) {
  if (room.state !== "round") return;
  clearTimeout(room.timer);
  const scenario = currentScenario(room);
  const now = Date.now();
  for (const p of room.players.values()) {
    if (!p.connected) continue;
    const choice = p.answers[room.roundIndex];
    const correct = choice === scenario.correct;
    const stat = p.tagStats[scenario.tag] || (p.tagStats[scenario.tag] = { correct: 0, total: 0 });
    stat.total++;
    if (correct) stat.correct++;

    if (room.mode === "duel") {
      if (correct) {
        const elapsed = Math.max(0, now - (room.roundEndsAt - ROUND_MS));
        const speedBonus = Math.max(0, Math.round(20 * (1 - elapsed / ROUND_MS)));
        p.streak++;
        const streakBonus = p.streak > 1 ? Math.min((p.streak - 1) * 10, 50) : 0;
        p.score += 100 + speedBonus + streakBonus;
      } else {
        p.streak = 0;
      }
    } else { // household
      room.shield = Math.max(0, Math.min(100, room.shield + (correct ? 4 : -8)));
    }
  }
  room.state = "reveal";
  touch(room);
  broadcast(room);
  room.timer = setTimeout(() => nextRound(room), REVEAL_AUTO_MS);
}

function buildResults(room) {
  const players = [...room.players.values()].map(p => {
    let weakest = null, weakestRate = 2;
    for (const tag of Object.keys(p.tagStats)) {
      const s = p.tagStats[tag];
      if (s.total === 0) continue;
      const rate = s.correct / s.total;
      if (rate < weakestRate) { weakestRate = rate; weakest = tag; }
    }
    return {
      id: p.id, name: p.name, score: p.score,
      tagStats: p.tagStats, weakestTag: weakest
    };
  });
  if (room.mode === "duel") {
    players.sort((a, b) => b.score - a.score);
  }
  return {
    mode: room.mode,
    survived: room.mode === "household" ? room.shield > 0 : undefined,
    shield: room.mode === "household" ? room.shield : undefined,
    players
  };
}

function sweepRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivity > ROOM_TTL_MS) {
      clearTimeout(room.timer);
      rooms.delete(code);
    }
  }
}
setInterval(sweepRooms, 1000 * 60 * 30);

// ---------------------------------------------------------------------------
// HTTP layer (no framework)
// ---------------------------------------------------------------------------
const MIME = { ".html":"text/html", ".css":"text/css", ".js":"application/javascript", ".json":"application/json", ".svg":"image/svg+xml", ".ico":"image/x-icon" };

function serveStatic(req, res, urlPath) {
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end("Forbidden"); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, {"Content-Type":"text/plain"}); res.end("Not found"); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function readJson(req, cb) {
  let body = "";
  req.on("data", c => { body += c; if (body.length > 1e6) req.destroy(); });
  req.on("end", () => { try { cb(null, body ? JSON.parse(body) : {}); } catch (e) { cb(e); } });
}

function json(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(s);
}

function authPlayer(room, body) {
  const p = room && room.players.get(body.playerId);
  if (!p || p.token !== body.token) return null;
  return p;
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const parts = u.pathname.split("/").filter(Boolean);

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
    return res.end();
  }

  if (u.pathname === "/") {
    res.writeHead(200, {"Content-Type":"text/plain"});
    return res.end("JEHU API is running. Rooms: " + rooms.size);
  }

  if (u.pathname === "/health") { return json(res, 200, { ok: true, rooms: rooms.size }); }

  if (parts[0] === "api" && parts[1] === "rooms") {
    // your existing api routes go here. I didn't cut them
  }

  serveStatic(req, res, u.pathname);
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`JEHU CAMP listening on :${PORT}`)
})

  // ADD THIS TEMP ROOT ROUTE FOR TESTING
  if (u.pathname === "/") {
    res.writeHead(200, {"Content-Type":"text/plain"});
    return res.end("JEHU API is running. Rooms: " + rooms.size);
  }

  if (u.pathname === "/health") { return json(res, 200, { ok: true, rooms: rooms.size }); }

  if (parts[0] === "api" && parts[1] === "rooms") {
    //... the rest of your api code stays the same
  }

  // fallback to static files
  serveStatic(req, res, u.pathname);
});

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" });
    return res.end();
  }

  if (u.pathname === "/health") { return json(res, 200, { ok: true, rooms: rooms.size }); }

  if (parts[0] === "api" && parts[1] === "rooms") {
    // POST /api/rooms  { mode, roundCount, name }
    if (parts.length === 2 && req.method === "POST") {
      return readJson(req, (err, body) => {
        if (err) return json(res, 400, { error: "bad json" });
        const room = newRoom(body.mode, body.roundCount);
        const p = addPlayer(room, body.name);
        touch(room);
        return json(res, 200, { code: room.code, playerId: p.id, token: p.token });
      });
    }
    const code = parts[2];
    const room = code ? rooms.get(code.toUpperCase()) : null;

    // POST /api/rooms/:code/join  { name }
    if (parts[3] === "join" && req.method === "POST") {
      return readJson(req, (err, body) => {
        if (err) return json(res, 400, { error: "bad json" });
        if (!room) return json(res, 404, { error: "room not found" });
        if (room.state !== "lobby") return json(res, 409, { error: "game already started" });
        if (room.players.size >= 8) return json(res, 409, { error: "room full (8 max)" });
        const p = addPlayer(room, body.name);
        touch(room);
        broadcast(room);
        return json(res, 200, { code: room.code, playerId: p.id, token: p.token, mode: room.mode });
      });
    }

    // GET /api/rooms/:code/stream?playerId=&token=
    if (parts[3] === "stream" && req.method === "GET") {
      if (!room) { res.writeHead(404); return res.end(); }
      const playerId = u.searchParams.get("playerId"), token = u.searchParams.get("token");
      const p = room.players.get(playerId);
      if (!p || p.token !== token) { res.writeHead(403); return res.end(); }
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*"
      });
      p.sseRes = res; p.connected = true; touch(room);
      send(res, "state", snapshot(room));
      broadcast(room);
      const keepAlive = setInterval(() => { try { res.write(":ping\n\n"); } catch(e){} }, 15000);
      req.on("close", () => {
        clearInterval(keepAlive);
        p.connected = false; p.sseRes = null;
        if (room.hostId === p.id) {
          const next = connectedPlayers(room)[0];
          if (next) room.hostId = next.id;
        }
        broadcast(room);
      });
      return;
    }

    // POST /api/rooms/:code/ready { playerId, token, ready }
    if (parts[3] === "ready" && req.method === "POST") {
      return readJson(req, (err, body) => {
        if (err || !room) return json(res, 400, { error: "bad request" });
        const p = authPlayer(room, body);
        if (!p) return json(res, 403, { error: "not authorized" });
        p.ready = !!body.ready;
        touch(room); broadcast(room);
        return json(res, 200, { ok: true });
      });
    }

    // POST /api/rooms/:code/start { playerId, token }
    if (parts[3] === "start" && req.method === "POST") {
      return readJson(req, (err, body) => {
        if (err || !room) return json(res, 400, { error: "bad request" });
        const p = authPlayer(room, body);
        if (!p || p.id !== room.hostId) return json(res, 403, { error: "only the host can start" });
        if (room.players.size < 2) return json(res, 409, { error: "need at least 2 players" });
        startGame(room);
        return json(res, 200, { ok: true });
      });
    }

    // POST /api/rooms/:code/answer { playerId, token, choice }
    if (parts[3] === "answer" && req.method === "POST") {
      return readJson(req, (err, body) => {
        if (err || !room) return json(res, 400, { error: "bad request" });
        const p = authPlayer(room, body);
        if (!p) return json(res, 403, { error: "not authorized" });
        if (room.state !== "round") return json(res, 409, { error: "no active round" });
        if (room.roundIndex in p.answers) return json(res, 409, { error: "already answered" });
        const idx = Number(body.choice);
        if (!Number.isInteger(idx)) return json(res, 400, { error: "bad choice" });
        p.answers[room.roundIndex] = idx;
        touch(room);
        broadcast(room);
        if (allAnswered(room)) revealRound(room);
        return json(res, 200, { ok: true });
      });
    }

    // POST /api/rooms/:code/next { playerId, token }  (host: advance early)
    if (parts[3] === "next" && req.method === "POST") {
      return readJson(req, (err, body) => {
        if (err || !room) return json(res, 400, { error: "bad request" });
        const p = authPlayer(room, body);
        if (!p || p.id !== room.hostId) return json(res, 403, { error: "only the host can advance" });
        if (room.state === "round") revealRound(room);
        else if (room.state === "reveal") nextRound(room);
        return json(res, 200, { ok: true });
      });
    }

    if (room && parts.length === 3 && req.method === "GET") {
      return json(res, 200, snapshot(room));
    }
  }

  serveStatic(req, res, u.pathname);
});

server.listen(PORT, () => console.log(`JEHU CAMP listening on :${PORT}`));

module.exports = { server, rooms, SCENARIOS };
