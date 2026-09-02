let session = JSON.parse(sessionStorage.getItem("jehuCampSession") || "null");
let es = null;
let roundTickInterval = null;

const el = document.getElementById("app");

function saveSession(s) { session = s; sessionStorage.setItem("jehuCampSession", JSON.stringify(s)); }
function clearSession() { session = null; sessionStorage.removeItem("jehuCampSession"); }

async function post(path, body) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

function connectStream() {
  if (es) es.close();
  es = new EventSource(`/api/rooms/${session.code}/stream?playerId=${encodeURIComponent(session.playerId)}&token=${encodeURIComponent(session.token)}`);
  es.addEventListener("state", (e) => render(JSON.parse(e.data)));
  es.onerror = () => { /* EventSource auto-reconnects */ };
}

async function createRoom(mode, roundCount, name) {
  const data = await post("/api/rooms", { mode, roundCount, name });
  saveSession({ code: data.code, playerId: data.playerId, token: data.token });
  connectStream();
}
async function joinRoom(code, name) {
  const data = await post(`/api/rooms/${code.toUpperCase()}/join`, { name });
  saveSession({ code: data.code, playerId: data.playerId, token: data.token });
  connectStream();
}
function leaveRoom() { if (es) es.close(); clearSession(); renderHome(); }

function renderHome(err) {
  el.innerHTML = `
   <div class="wrap">
    <div class="crest">🏕️</div>
    <h1>JEHU CAMP</h1>
    <p class="lead">Multiplayer Pressure Protocol. Everyone gets the same scam. Everyone decides privately. Nobody sees the others' answers until it's locked.</p>
    ${err ? `<div class="err">${err}</div>` : ""}
    <div class="card">
      <h2>Create a camp</h2>
      <input id="hostName" placeholder="Your name" maxlength="20">
      <div class="row">
        <label><input type="radio" name="mode" value="duel" checked> ⚔️ Defender Duel<small>Compete — every player for themselves, correctness beats speed</small></label>
        <label><input type="radio" name="mode" value="household"> 🛡️ Household Shield<small>Cooperate — one shared shield, everyone survives or falls together</small></label>
      </div>
      <label>Rounds
        <select id="roundCount"><option>6</option><option selected>10</option><option>14</option><option>16</option></select>
      </label>
      <button class="btn" id="createBtn">Create Camp</button>
    </div>
    <div class="card">
      <h2>Join a camp</h2>
      <input id="joinCode" placeholder="ROOM CODE" maxlength="6" style="text-transform:uppercase">
      <input id="joinName" placeholder="Your name" maxlength="20">
      <button class="btn secondary" id="joinBtn">Join Camp</button>
    </div>
   </div>`;
  document.getElementById("createBtn").onclick = async () => {
    const name = document.getElementById("hostName").value.trim();
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const roundCount = Number(document.getElementById("roundCount").value);
    try { await createRoom(mode, roundCount, name); } catch (e) { renderHome(e.message); }
  };
  document.getElementById("joinBtn").onclick = async () => {
    const code = document.getElementById("joinCode").value.trim();
    const name = document.getElementById("joinName").value.trim();
    try { await joinRoom(code, name); } catch (e) { renderHome(e.message); }
  };
  const params = new URLSearchParams(location.search);
  if (params.get("join")) document.getElementById("joinCode").value = params.get("join").toUpperCase();
}

function render(state) {
  if (state.state === "lobby") return renderLobby(state);
  if (state.state === "round") return renderRound(state);
  if (state.state === "reveal") return renderReveal(state);
  if (state.state === "ended") return renderEnded(state);
}

function renderLobby(state) {
  const me = state.players.find(p => p.id === session.playerId);
  const isHost = me && me.isHost;
  el.innerHTML = `
   <div class="wrap">
    <div class="crest">🏕️</div>
    <h1>JEHU CAMP</h1>
    <div class="card">
      <div class="kicker">${state.mode === "household" ? "🛡️ Household Shield" : "⚔️ Defender Duel"}</div>
      <h2>Room code</h2>
      <div class="code">${state.code}</div>
      <button class="btn secondary" id="copyLink">Copy invite link</button>
      <p class="hint">${state.totalRounds} rounds. Share the code or link with whoever's joining.</p>
    </div>
    <div class="card">
      <h2>Players (${state.players.length}/8)</h2>
      <div class="plist">${state.players.map(p => `<div class="prow ${p.connected ? "" : "off"}"><span>${p.isHost ? "👑 " : ""}${p.name}${p.id === session.playerId ? " (you)" : ""}</span><span>${p.connected ? "online" : "offline"}</span></div>`).join("")}</div>
      ${isHost
        ? `<button class="btn" id="startBtn" ${state.players.length < 2 ? "disabled" : ""}>Start Camp</button>${state.players.length < 2 ? `<p class="hint">Need at least 2 players to start.</p>` : ""}`
        : `<p class="hint">Waiting for the host to start…</p>`}
      <button class="btn secondary" id="leaveBtn">Leave</button>
    </div>
   </div>`;
  document.getElementById("copyLink").onclick = () => {
    const link = `${location.origin}${location.pathname}?join=${state.code}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link);
    toast("Invite link copied");
  };
  document.getElementById("leaveBtn").onclick = leaveRoom;
  if (isHost) document.getElementById("startBtn").onclick = async () => {
    try { await post(`/api/rooms/${state.code}/start`, { playerId: session.playerId, token: session.token }); }
    catch (e) { toast(e.message); }
  };
}

function renderRound(state) {
  clearInterval(roundTickInterval);
  const already = state.players.find(p => p.id === session.playerId)?.answered;
  el.innerHTML = `
   <div class="wrap">
    <div class="topbar"><span class="tag">${state.round.tag.toUpperCase()}</span><span>Round ${state.roundIndex + 1} / ${state.totalRounds}</span>${state.shield !== undefined ? `<span>🛡️ ${state.shield}</span>` : ""}</div>
    <div class="timerbar"><i id="timerFill"></i></div>
    <div class="card">
      <div class="question">${state.round.prompt}</div>
      <div class="choices">${state.round.choices.map((c, i) => `<button class="choice" data-i="${i}" ${already ? "disabled" : ""}>${c}</button>`).join("")}</div>
      ${already ? `<p class="hint">Locked in. Waiting for the others…</p>` : ""}
    </div>
    <div class="card">
      <h2>Who's answered</h2>
      <div class="plist">${state.players.map(p => `<div class="prow ${p.connected ? "" : "off"}"><span>${p.name}${p.id === session.playerId ? " (you)" : ""}</span><span>${p.answered ? "🔒 Locked" : "…thinking"}</span></div>`).join("")}</div>
    </div>
   </div>`;
  if (!already) {
    el.querySelectorAll(".choice").forEach(btn => {
      btn.onclick = async () => {
        el.querySelectorAll(".choice").forEach(b => b.disabled = true);
        try { await post(`/api/rooms/${state.code}/answer`, { playerId: session.playerId, token: session.token, choice: Number(btn.dataset.i) }); }
        catch (e) { toast(e.message); }
      };
    });
  }
  const fill = document.getElementById("timerFill");
  const totalMs = state.roundEndsAt - (state.roundEndsAt - 25000);
  function tick() {
    const remain = Math.max(0, state.roundEndsAt - Date.now());
    const pct = Math.max(0, Math.min(100, remain / 25000 * 100));
    if (fill) fill.style.width = pct + "%";
    if (remain <= 0) clearInterval(roundTickInterval);
  }
  tick();
  roundTickInterval = setInterval(tick, 200);
}

function renderReveal(state) {
  clearInterval(roundTickInterval);
  const me = state.players.find(p => p.id === session.playerId);
  const isHost = me && me.isHost;
  const r = state.reveal;
  const isLastRound = state.roundIndex + 1 >= state.totalRounds || (state.shield !== undefined && state.shield <= 0);
  el.innerHTML = `
   <div class="wrap">
    <div class="topbar"><span class="tag">${r.tag.toUpperCase()}</span><span>Round ${state.roundIndex + 1} / ${state.totalRounds}</span>${state.shield !== undefined ? `<span>🛡️ ${state.shield}</span>` : ""}</div>
    <div class="card">
      <div class="question">${r.prompt}</div>
      <div class="choices">${r.choices.map((c, i) => `<div class="choice static ${i === r.correct ? "good" : ""}">${c}${i === r.correct ? " ✅" : ""}</div>`).join("")}</div>
      <div class="feedback good"><b>Why</b><br>${r.explain}</div>
    </div>
    <div class="card">
      <h2>Round results</h2>
      <div class="plist">${r.answers.map(a => `<div class="prow"><span>${a.name}</span><span>${a.choice === null ? "No answer" : (a.correct ? "✅ Correct" : "❌ Wrong")}</span></div>`).join("")}</div>
    </div>
    <div class="card">
      <h2>${state.mode === "household" ? "Shield status" : "Leaderboard"}</h2>
      <div class="plist">${[...state.players].sort((a, b) => b.score - a.score).map(p => `<div class="prow"><span>${p.name}${p.id === session.playerId ? " (you)" : ""}${p.streak > 1 ? ` 🔥${p.streak}` : ""}</span><span>${state.mode === "duel" ? p.score + " pts" : ""}</span></div>`).join("")}</div>
    </div>
    ${isHost ? `<button class="btn" id="nextBtn">${isLastRound ? "See Results" : "Next Round"}</button>` : `<p class="hint">Waiting for the host to continue…</p>`}
   </div>`;
  if (isHost) document.getElementById("nextBtn").onclick = async () => {
    try { await post(`/api/rooms/${state.code}/next`, { playerId: session.playerId, token: session.token }); }
    catch (e) { toast(e.message); }
  };
}

function renderEnded(state) {
  const res = state.results;
  el.innerHTML = `
   <div class="wrap">
    <div class="crest">${res.mode === "household" ? (res.survived ? "🛡️" : "💥") : "🏆"}</div>
    <h1>${res.mode === "household" ? (res.survived ? "You survived." : "The scammer got in.") : "Camp complete"}</h1>
    ${res.mode === "household" ? `<p class="lead">Final shield: ${res.shield}/100</p>` : ""}
    <div class="card">
      <h2>${res.mode === "household" ? "Team" : "Final standings"}</h2>
      <div class="plist">${res.players.map((p, i) => `<div class="prow"><span>${res.mode === "duel" ? `#${i + 1} ` : ""}${p.name}${p.id === session.playerId ? " (you)" : ""}</span><span>${res.mode === "duel" ? p.score + " pts" : ""}</span></div>`).join("")}</div>
    </div>
    <div class="card">
      <h2>Your vulnerability profile</h2>
      ${renderProfile(res.players.find(p => p.id === session.playerId))}
    </div>
    <button class="btn" id="againBtn">Back to home</button>
   </div>`;
  document.getElementById("againBtn").onclick = leaveRoom;
}

function renderProfile(p) {
  if (!p || !p.tagStats || Object.keys(p.tagStats).length === 0) return `<p class="hint">No rounds recorded.</p>`;
  const rows = Object.entries(p.tagStats).map(([tag, s]) => {
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    return `<div class="skillrow"><span>${tag}${tag === p.weakestTag ? " ⚠️" : ""}</span><div class="meter"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`;
  }).join("");
  return rows + (p.weakestTag ? `<p class="hint">Your softest spot right now: <b>${p.weakestTag}</b>. Worth a visit to the matching Cyber Academy lesson in JEHU.</p>` : "");
}

function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

if (session && session.code) connectStream();
else renderHome();
