const $ = s => document.querySelector(s);
const ROUND_TIME = 35;
let socket, me = null, room = null, current = null, answered = false, lastResults = [];

const state = { avatar: "🛡️", name: localStorage.getItem("jehu-arena-name") || "" };

function show(id) {
  document.querySelectorAll(".screen").forEach(x => x.classList.remove("active"));
  $("#" + id).classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function connect() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${proto}://${location.host}`);
  socket.onopen = () => setStatus("ONLINE", true);
  socket.onclose = () => setStatus("OFFLINE", false);
  socket.onerror = () => setStatus("CONNECTION ERROR", false);
  socket.onmessage = e => handle(JSON.parse(e.data));
}
function setStatus(t, ok) {
  $("#status").textContent = t;
  $("#status").className = "status " + (ok ? "ok" : "bad");
}
function send(type, payload={}) {
  if (!socket || socket.readyState !== 1) return alert("Connection is not ready.");
  socket.send(JSON.stringify({type, ...payload}));
}
function nameOrDefault() {
  const n = ($("#name").value.trim() || state.name || "Defender").slice(0,22);
  state.name = n; localStorage.setItem("jehu-arena-name", n); return n;
}
function createRoom() {
  if (!socket || socket.readyState !== 1) return;
  send("room:create", {name:nameOrDefault(), avatar:state.avatar, mode:$("#mode").value, rounds:Number($("#rounds").value)});
}
function joinRoom() {
  const code = $("#joinCode").value.trim().toUpperCase();
  if (code.length !== 6) return toast("Enter the 6-character room code.");
  send("room:join", {code, name:nameOrDefault(), avatar:state.avatar});
}
function handle(m) {
  if (m.type === "room:created") { room=m; renderLobby(); }
  if (m.type === "room:joined") { me=m.me; room=m.lobby; renderLobby(); }
  if (m.type === "lobby:update") { room=m; renderLobby(); }
  if (m.type === "round:start") startRound(m);
  if (m.type === "answer:locked") { answered=true; renderChoices(); toast("Decision locked."); }
  if (m.type === "players:update") { room.players=m.players; renderScoreboard(); }
  if (m.type === "round:reveal") revealRound(m);
  if (m.type === "game:finished") finishGame(m);
  if (m.type === "error") toast(m.message);
}
function renderLobby() {
  show("lobby");
  $("#roomCode").textContent = room.code;
  $("#shareLink").value = `${location.origin}/?join=${room.code}`;
  $("#hostControls").classList.toggle("hidden", room.hostId !== me.id);
  $("#startBtn").disabled = room.players.length < 2 || room.hostId !== me.id;
  $("#playerCount").textContent = `${room.players.length}/8`;
  $("#players").innerHTML = room.players.map(p => `
    <div class="player ${p.id===me.id?"self":""}">
      <span class="avatar">${esc(p.avatar)}</span><span><b>${esc(p.name)}</b><small>${p.id===room.hostId?"HOST":"DEFENDER"}</small></span>
      <span class="readyDot"></span>
    </div>`).join("");
}
function copyLink() {
  navigator.clipboard?.writeText($("#shareLink").value).then(()=>toast("Invite link copied."));
}
function startGame() { send("room:start"); }
function startRound(m) {
  current=m; answered=false; show("arena");
  $("#roundNo").textContent = `ROUND ${m.round} / ${m.totalRounds}`;
  $("#category").textContent = m.scenario.category;
  $("#shieldWrap").classList.toggle("hidden", room.mode !== "team");
  $("#shield").textContent = `${m.teamShield ?? 100}%`;
  $("#scenarioTitle").textContent = m.scenario.title;
  $("#scenarioText").textContent = m.scenario.message;
  $("#evidence").innerHTML = m.scenario.evidence.map(x=>`<span>${esc(x)}</span>`).join("");
  $("#timer").textContent = ROUND_TIME;
  renderChoices();
  renderScoreboard();
  const end = m.endsAt;
  clearInterval(window.tick);
  window.tick = setInterval(()=> {
    const left=Math.max(0, Math.ceil((end-Date.now())/1000));
    $("#timer").textContent=left;
    if(left<=0) clearInterval(window.tick);
  },250);
}
function renderChoices() {
  $("#choices").innerHTML = current.scenario.options.map((x,i)=>`
    <button class="choice ${answered ? "locked":""}" ${answered?"disabled":""} onclick="answer(${i})">
      <span>${String.fromCharCode(65+i)}</span>${esc(x)}
    </button>`).join("");
  $("#lock").textContent = answered ? "DECISION LOCKED" : "CHOOSE YOUR RESPONSE";
}
function answer(i) {
  if(answered) return;
  send("round:answer",{choice:i});
}
function renderScoreboard() {
  const ps=(room?.players||[]).slice().sort((a,b)=>b.score-a.score);
  $("#scoreboard").innerHTML=ps.map((p,i)=>`
    <div class="rank"><b>${i+1}</b><span class="avatar">${esc(p.avatar)}</span><span class="grow">${esc(p.name)}<small>${p.streak} streak</small></span><strong>${p.score}</strong>${p.answered?'<i>✓</i>':''}</div>`).join("");
}
function revealRound(m) {
  lastResults=m.results; room.players=m.players; clearInterval(window.tick);
  const mine=m.results.find(x=>x.id===me.id);
  $("#revealTitle").textContent = mine?.correct ? "🛡️ Your defense held." : "⚠️ The pressure got through.";
  $("#revealTitle").className = mine?.correct ? "goodText" : "badText";
  $("#correctAnswer").textContent = m.scenario?.options?.[m.correct] || "Correct response";
  $("#lesson").textContent=m.lesson;
  $("#points").textContent = mine ? `+${mine.points} XP` : "+0 XP";
  $("#shieldWrap").classList.toggle("hidden", room.mode !== "team");
  $("#shield").textContent = `${m.teamShield ?? 100}%`;
  $("#resultList").innerHTML=m.results.map(r=>{
    const p=m.players.find(x=>x.id===r.id);
    return `<div class="resultRow"><span>${esc(p?.avatar||"🛡️")} ${esc(p?.name||"Defender")}</span><b class="${r.correct?"goodText":"badText"}">${r.correct?"CORRECT":"MISSED"}</b><strong>${r.points>0?"+":""}${r.points}</strong></div>`;
  }).join("");
  show("reveal");
}
function nextAfterReveal() {
  // Server schedules the next round; return to a waiting reveal screen.
  $("#waiting").textContent="Preparing the next threat...";
}
function finishGame(m) {
  clearInterval(window.tick);
  $("#finalList").innerHTML=m.ranking.map((p,i)=>`
    <div class="finalRank ${i===0?"champ":""}">
      <b>#${i+1}</b><span class="avatar">${esc(p.avatar)}</span><span class="grow"><strong>${esc(p.name)}</strong><small>${p.streak} final streak</small></span><strong>${p.score} XP</strong>
    </div>`).join("");
  $("#champion").textContent=m.ranking[0]?.name || "Defenders";
  show("finished");
}
function leaveRoom() {
  send("room:leave");
  room=null; me=null; current=null;
  show("home");
}
function restart() { send("room:restart"); }
function toast(t) {
  $("#toast").textContent=t; $("#toast").classList.add("show");
  clearTimeout(window.toastT); window.toastT=setTimeout(()=>$("#toast").classList.remove("show"),2600);
}
function chooseAvatar(el) {
  document.querySelectorAll(".avatarPick").forEach(x=>x.classList.remove("selected"));
  el.classList.add("selected"); state.avatar=el.dataset.a;
}
window.addEventListener("DOMContentLoaded",()=>{
  $("#name").value=state.name;
  const join=new URLSearchParams(location.search).get("join");
  if(join) $("#joinCode").value=join;
  document.querySelectorAll(".avatarPick").forEach(x=>x.addEventListener("click",()=>chooseAvatar(x)));
  connect();
});
