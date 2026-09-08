const $ = s => document.querySelector(s);
const ROUND_TIME = 35;
let socket, me = null, room = null, current = null, answered = false, lastResults = [];
let remoteScenariosLoaded = false;

function normalizeScenario(s) {
  if (!s || typeof s !== 'object') return null;
  const message = s.message ?? s.question ?? s.prompt ?? s.description ?? '';
  const evidence = Array.isArray(s.evidence) ? s.evidence : (Array.isArray(s.clues) ? s.clues : (Array.isArray(s.signals) ? s.signals : []));
  const options = Array.isArray(s.options) ? s.options : (Array.isArray(s.choices) ? s.choices : (Array.isArray(s.responses) ? s.responses : []));
  const correct = Number.isInteger(s.correct) ? s.correct : (Number.isInteger(s.correctIndex) ? s.correctIndex : s.answerIndex);
  return {...s, message, evidence, options, correct};
}

const state = { avatar: "🛡️", name: localStorage.getItem("jehu-arena-name") || "", botDifficulty: "rookie" };

// Local AI challenge pack. It deliberately uses the same defensive principles as multiplayer.
const BOT_SCENARIOS = [
  {category:"BANK IMPERSONATION", title:"The OTP Call", message:"A caller says they are from your bank. They know your name and the last four digits of your account. They say a suspicious transfer is being stopped and ask for the OTP that just arrived on your phone.", evidence:["Unsolicited call","Requests OTP","Creates urgency","Knows partial details"], options:["Read the OTP so the transfer can be blocked","Hang up and contact the bank through an official channel","Ask for the caller's staff ID, then provide the OTP","Tell them you will call back using the number they gave you"], correct:1, lesson:"A genuine bank representative should not need you to disclose an OTP or PIN. End the call and independently contact the bank through a trusted channel.", buttons:["TRUST","URGENCY"]},
  {category:"PHISHING", title:"Ten Minutes Left", message:"A text says: 'SECURITY ALERT: Your account will be permanently blocked in 10 minutes. Verify now: secure-check.example'. The sender name looks like your bank.", evidence:["10-minute deadline","Link included","Sender name can be spoofed","Threat of account loss"], options:["Tap the link immediately","Reply asking if it is real","Open your bank app or type the official website yourself","Forward it to a friend and ask them to test it"], correct:2, lesson:"Urgency is being used to bypass careful thinking. Do not use the message's link. Go to the service through an independently verified route.", buttons:["URGENCY","FEAR"]},
  {category:"AUTHORITY", title:"The Investigator", message:"Someone claiming to be a senior fraud investigator says your account is compromised. They instruct you to move your money to a 'safe account' while they investigate.", evidence:["Authority claim","Safe-account story","Money transfer requested","High pressure"], options:["Move the money as instructed","Ask for their name and transfer details","End the conversation and verify with your bank independently","Send a small amount first to test the account"], correct:2, lesson:"'Safe account' transfers are a classic social-engineering pattern. Treat unexpected instructions to move money as a major warning sign.", buttons:["TRUST","FEAR"]},
  {category:"CURIOSITY", title:"Is This You?", message:"A friend’s WhatsApp account sends: 'Bro 😂 is this you in this video?' followed by a shortened link. The message feels like something your friend might actually write.", evidence:["Unexpected link","Emotional curiosity","Compromised account possible","Shortened URL"], options:["Open it quickly","Ask your friend through another channel whether they sent it","Send the link to someone else first","Download whatever the page asks for"], correct:1, lesson:"A compromised account can send believable messages. Verify unexpected links out-of-band before opening them.", buttons:["CURIOSITY","TRUST"]},
  {category:"GREED", title:"You Won ₦5 Million", message:"A social post says you have won ₦5 million. To release the prize, you must pay a ₦25,000 'processing and verification fee' today.", evidence:["Unexpected prize","Upfront fee","Deadline","No prior entry"], options:["Pay the fee because ₦25,000 is small compared with ₦5m","Ask for their official registration details","Ignore it and verify the promotion through the organisation's official channels","Give them your bank details instead"], correct:2, lesson:"Unexpected prizes combined with an upfront payment request are a strong scam signal. Verify the promotion independently and never let the prize pressure you into paying.", buttons:["GREED","URGENCY"]},
  {category:"SYMPATHY", title:"Emergency Message", message:"A saved contact messages you: 'Please help me. I'm at the hospital. I lost my phone and need ₦80,000 urgently. Send it to this new account.'",
    evidence:["Emotional emergency","New account","Unusual payment request","Pressure to act fast"], options:["Send it immediately","Call the person using a known number to verify","Ask them for a photo of their ID","Post the message publicly to see if anyone knows them"], correct:1, lesson:"Real emergencies can happen, but scammers exploit sympathy. Verify the person's identity using a trusted, independent contact route before sending money.", buttons:["SYMPATHY","URGENCY"]},
  {category:"BUSINESS FRAUD", title:"New Supplier Account", message:"An email from a supplier says their bank account has changed and asks you to use the new details for today's ₦1.8m payment. The email thread looks familiar.", evidence:["Payment change","Large amount","Familiar thread can be compromised","No independent confirmation"], options:["Pay using the new details","Reply to the same email asking them to confirm","Verify the change using a previously known phone number or trusted contact","Split the payment between the old and new accounts"], correct:2, lesson:"Business email compromise can hijack real conversations. Payment-detail changes should be independently verified using a trusted channel.", buttons:["TRUST","CURIOSITY"]},
  {category:"AI IMPERSONATION", title:"It Sounds Like Mum", message:"You receive a voice call that sounds exactly like a family member. The caller says they are stranded and need you to transfer money immediately. The voice quality is slightly unusual.", evidence:["Voice can be cloned","Urgent money request","Slightly unusual audio","Caller asks for secrecy"], options:["Transfer immediately because you recognise the voice","Ask a personal question only they would know","Hang up and call the family member on your normal saved number","Keep them talking until they give more details, then transfer"], correct:2, lesson:"AI-generated voices can imitate people convincingly. For an unexpected urgent money request, verify using a known contact route rather than trusting the voice alone.", buttons:["TRUST","SYMPATHY","URGENCY"]},
  {category:"QR PHISHING", title:"Free Reward QR", message:"A poster at an event says: 'Scan this QR to claim your free data bundle.' The page asks you to enter your banking login to 'confirm identity'.",
    evidence:["QR code","Free reward","Login request","Untrusted landing page"], options:["Enter your login because the QR is on an official-looking poster","Scan it and check the page carefully before entering anything","Do not enter banking credentials; verify the offer through the provider's official site","Give the page your OTP if it asks for one"], correct:2, lesson:"QR codes can hide phishing destinations. Never enter banking credentials into an unverified page, especially to claim a small reward.", buttons:["CURIOSITY","GREED"]},
  {category:"FAKE SUPPORT", title:"Verified Support Account", message:"You complain publicly about a failed payment. A new account with a bank logo replies: 'DM us your card number, PIN and OTP so we can reverse the transaction.'",
    evidence:["Public complaint","Impersonation account","Requests PIN + OTP","Unsolicited DM"], options:["Send the requested details privately","Check whether the account is the bank's official support account and contact it through a trusted channel","Send only the card number","Ask them to call you and provide the OTP by phone"], correct:1, lesson:"Scammers monitor public complaints and impersonate support teams. PINs and OTPs should never be shared. Verify support channels independently.", buttons:["TRUST","AUTHORITY"]}
];

const DIFFICULTY = {
  rookie:{label:"ROOKIE", accuracy:.58, speed:[9000,15000], mistakes:.42},
  analyst:{label:"ANALYST", accuracy:.72, speed:[6500,11500], mistakes:.28},
  elite:{label:"ELITE", accuracy:.84, speed:[4200,8500], mistakes:.16},
  guardian:{label:"JEHU GUARDIAN", accuracy:.93, speed:[2500,6500], mistakes:.07}
};

function show(id) { document.querySelectorAll(".screen").forEach(x => x.classList.remove("active")); const target=$("#"+id); if(target) target.classList.add("active"); const dock=$("#homeDock"); if(dock) dock.classList.toggle("hidden", id === "home"); window.scrollTo({top:0,behavior:"smooth"}); }
function esc(s) { return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function connect(){ const proto=location.protocol==="https:"?"wss":"ws"; socket=new WebSocket(`${proto}://${location.host}`); socket.onopen=()=>setStatus("ONLINE",true); socket.onclose=()=>setStatus("OFFLINE",false); socket.onerror=()=>setStatus("CONNECTION ERROR",false); socket.onmessage=e=>handle(JSON.parse(e.data)); }
function setStatus(t,ok){ $("#status").textContent=t; $("#status").className="status "+(ok?"ok":"bad"); }
function send(type,payload={}){ if(!socket||socket.readyState!==1)return alert("Connection is not ready."); socket.send(JSON.stringify({type,...payload})); }
function nameOrDefault(){const n=($("#name").value.trim()||state.name||"Defender").slice(0,22);state.name=n;localStorage.setItem("jehu-arena-name",n);return n;}
function createRoom(){if(socket?.readyState!==1)return;send("room:create",{name:nameOrDefault(),avatar:state.avatar,mode:$("#mode").value,difficulty:$("#difficulty").value,rounds:Number($("#rounds").value)});}
function joinRoom(){const code=$("#joinCode").value.trim().toUpperCase();if(code.length!==6)return toast("Enter the 6-character room code.");send("room:join",{code,name:nameOrDefault(),avatar:state.avatar});}
function handle(m){if(m.type==="room:created"){room=m;me={id:m.hostId};renderLobby();} if(m.type==="room:joined"){me=m.me;room=m.lobby;renderLobby();} if(m.type==="lobby:update"){room=m;renderLobby();} if(m.type==="round:start")startRound(m); if(m.type==="answer:locked"){answered=true;renderChoices();toast("Decision locked.");} if(m.type==="players:update"){room.players=m.players;renderScoreboard();} if(m.type==="round:reveal")revealRound(m); if(m.type==="game:finished")finishGame(m); if(m.type==="error")toast(m.message);}
function renderLobby(){show("lobby");$("#roomCode").textContent=room.code;$("#roomDifficulty") && ($("#roomDifficulty").textContent=(room.difficulty||"rookie").toUpperCase());$("#shareLink").value=`${location.origin}/?join=${room.code}`;$("#hostControls").classList.toggle("hidden",room.hostId!==me.id);$("#startBtn").disabled=room.players.length<2||room.hostId!==me.id;$("#playerCount").textContent=`${room.players.length}/8`;$("#players").innerHTML=room.players.map(p=>`<div class="player ${p.id===me.id?"self":""}"><span class="avatar">${esc(p.avatar)}</span><span><b>${esc(p.name)}</b><small>${p.id===room.hostId?"HOST":"DEFENDER"}</small></span><span class="readyDot"></span></div>`).join("");}
function copyLink(){navigator.clipboard?.writeText($("#shareLink").value).then(()=>toast("Invite link copied."));}
function startGame(){send("room:start");}
function startRound(m){m.scenario=normalizeScenario(m.scenario);if(!m.scenario||!m.scenario.title||!m.scenario.options?.length){toast("This round could not load its response choices. Refreshing the match…");console.error("[JEHU] Invalid round payload",m);return;}current=m;answered=false;show("arena");$("#roundNo").textContent=`ROUND ${m.round} / ${m.totalRounds}`;$("#category").textContent=m.scenario.category;$("#shieldWrap").classList.toggle("hidden",room.mode!=="team");$("#shield").textContent=`${m.teamShield??100}%`;$("#scenarioTitle").textContent=m.scenario.title;$("#chainBadge").classList.toggle("hidden",!m.chain);if(m.chain)$("#chainBadge").textContent=`CHAIN ${m.chain.stage}/${m.chain.total}`;$("#scenarioText").textContent=m.scenario.message;$("#evidence").innerHTML=m.scenario.evidence.map(x=>`<span>${esc(x)}</span>`).join("");$("#timer").textContent=ROUND_TIME;renderChoices();renderScoreboard();clearInterval(window.tick);window.tick=setInterval(()=>{const left=Math.max(0,Math.ceil((m.endsAt-Date.now())/1000));$("#timer").textContent=left;if(left<=0)clearInterval(window.tick);},250);}
function renderChoices(){$("#choices").innerHTML=current.scenario.options.map((x,i)=>`<button class="choice ${answered?"locked":""}" ${answered?"disabled":""} onclick="answer(${i})"><span>${String.fromCharCode(65+i)}</span>${esc(x)}</button>`).join("");$("#lock").textContent=answered?"DECISION LOCKED":"CHOOSE YOUR RESPONSE";}
function answer(i){if(answered)return;send("round:answer",{choice:i});}
function renderScoreboard(){const ps=(room?.players||[]).slice().sort((a,b)=>b.score-a.score);$("#scoreboard").innerHTML=ps.map((p,i)=>`<div class="rank"><b>${i+1}</b><span class="avatar">${esc(p.avatar)}</span><span class="grow">${esc(p.name)}<small>${p.streak} streak</small></span><strong>${p.score}</strong>${p.answered?'<i>✓</i>':''}</div>`).join("");}
function revealRound(m){lastResults=m.results;room.players=m.players;clearInterval(window.tick);const mine=m.results.find(x=>x.id===me.id);$("#revealTitle").textContent=mine?.correct?"🛡️ Your defense held.":"⚠️ The pressure got through.";$("#revealTitle").className=mine?.correct?"goodText":"badText";$("#correctAnswer").textContent=m.scenario?.options?.[m.correct]||"Correct response";$("#lesson").textContent=m.lesson;$("#points").textContent=mine?`+${mine.points} XP`:"+0 XP";$("#shieldWrap").classList.toggle("hidden",room.mode!=="team");$("#shield").textContent=`${m.teamShield??100}%`;$("#resultList").innerHTML=m.results.map(r=>{const p=m.players.find(x=>x.id===r.id);return `<div class="resultRow"><span>${esc(p?.avatar||"🛡️")} ${esc(p?.name||"Defender")}</span><b class="${r.correct?"goodText":"badText"}">${r.correct?"CORRECT":"MISSED"}</b><strong>${r.points>0?"+":""}${r.points}</strong></div>`;}).join("");show("reveal");}
function finishGame(m){clearInterval(window.tick);$("#finalList").innerHTML=m.ranking.map((p,i)=>`<div class="finalRank ${i===0?"champ":""}"><b>#${i+1}</b><span class="avatar">${esc(p.avatar)}</span><span class="grow"><strong>${esc(p.name)}</strong><small>${p.streak} final streak</small></span><strong>${p.score} XP</strong></div>`).join("");$("#champion").textContent=m.ranking[0]?.name||"Defenders";const mine=m.defenderProfiles?.find(x=>x.id===me.id);if(mine){$("#profileSummary").innerHTML=`<h3>🧠 Your Defender Intelligence</h3><div class="profileBox"><b>Strengths</b><div>${mine.strengths?.length?mine.strengths.map(x=>`<span class="profileTag">${esc(x.button)} • ${x.resilience}% resilience</span>`).join(""):"Keep playing to build your profile."}</div><b style="display:block;margin-top:12px">Watch-outs</b><div>${mine.watchouts?.length?mine.watchouts.map(x=>`<span class="profileTag warn">${esc(x.button)} • ${x.resilience}% resilience</span>`).join(""):"No watch-outs yet."}</div></div>`;}show("finished");}
function leaveRoom(){send("room:leave");room=null;me=null;current=null;show("home");}
function restart(){send("room:restart");}
function toast(t){$("#toast").textContent=t;$("#toast").classList.add("show");clearTimeout(window.toastT);window.toastT=setTimeout(()=>$("#toast").classList.remove("show"),2600);}
function chooseAvatar(el){document.querySelectorAll(".avatarPick").forEach(x=>x.classList.remove("selected"));el.classList.add("selected");state.avatar=el.dataset.a;}

// ---------------- JEHU EMERGENCY ROOM ----------------
let emergencyGuides=[];
function openEmergencyRoom(){show("emergencyRoom");$("#emergencyDetail").classList.add("hidden");if(emergencyGuides.length){renderEmergencyCards();return;}fetch("/api/emergency").then(r=>r.json()).then(data=>{emergencyGuides=Array.isArray(data)?data:[];renderEmergencyCards();}).catch(()=>toast("Emergency guides are temporarily unavailable."));}
function renderEmergencyCards(){$("#emergencyGrid").innerHTML=emergencyGuides.map(e=>`<button class="emergencyCard" onclick="showEmergency('${e.id}')"><b>${esc(e.title)}</b><small>${esc(e.category)}</small></button>`).join("");}
function showEmergency(id){const e=emergencyGuides.find(x=>x.id===id);if(!e)return;$("#emergencyCategory").textContent=e.category;$("#emergencyTitle").textContent=e.title;$("#emergencySteps").innerHTML=e.steps.map((x,i)=>`<div class="emergencyStep"><span class="stepNum">${i+1}</span><span>${esc(x)}</span></div>`).join("");$("#emergencyAvoidList").innerHTML=`<ul>${(e.avoid||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;$("#emergencyDetail").classList.remove("hidden");$("#emergencyDetail").scrollIntoView({behavior:"smooth",block:"start"});}

// ---------------- JEHU vs COMPUTER ----------------
let bot = {difficulty:"rookie", round:0,total:7,userScore:0,aiScore:0,current:null,answered:false,lockedChoice:null,aiLockedChoice:null,aiLocked:false,usedIds:new Set(),profile:{}};
function openComputerSetup(){show("computerSetup");document.querySelectorAll(".difficulty").forEach(x=>x.classList.toggle("selected",x.dataset.diff===state.botDifficulty));}
function chooseDifficulty(el){document.querySelectorAll(".difficulty").forEach(x=>x.classList.remove("selected"));el.classList.add("selected");state.botDifficulty=el.dataset.diff;bot.difficulty=state.botDifficulty;}
function startComputerGame(){bot={difficulty:state.botDifficulty,round:0,total:Number($("#botRounds").value),userScore:0,aiScore:0,current:null,answered:false,lockedChoice:null,aiLockedChoice:null,aiLocked:false,usedIds:new Set(),profile:{}};nextBotRound();}
function shuffle(arr){return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}
function nextBotRound(){if(bot.round>=bot.total)return finishBot();bot.round++;bot.answered=false;bot.lockedChoice=null;const level={rookie:1,analyst:2,elite:3,guardian:4}[bot.difficulty]||1;const eligible=BOT_SCENARIOS.filter(s=>(s.difficulty||1)<=level);let pool=eligible.filter(s=>!bot.usedIds.has(s.id||s.title));if(!pool.length){bot.usedIds.clear();pool=eligible.length?eligible:BOT_SCENARIOS;}const weak=Object.entries(bot.profile).filter(([,v])=>v.seen>=1).sort((a,b)=>(a[1].correct/a[1].seen)-(b[1].correct/b[1].seen))[0]?.[0];const targeted=weak?pool.filter(s=>(s.buttons||[]).includes(weak)):[];if(targeted.length)pool=targeted;bot.current=normalizeScenario(pool[Math.floor(Math.random()*pool.length)]);if(!bot.current||!bot.current.options?.length){toast("The computer challenge could not load this case. Please restart JEHU.");return;}bot.usedIds.add(bot.current.id||bot.current.title);show("computerArena");$("#botRoundNo").textContent=`ROUND ${bot.round} / ${bot.total}`;$("#botCategory").textContent=bot.current.category;$("#botScenarioTitle").textContent=bot.current.title;$("#botChainBadge").classList.add("hidden");$("#botScenarioText").textContent=bot.current.message;$("#botEvidence").innerHTML=bot.current.evidence.map(x=>`<span>${esc(x)}</span>`).join("");$("#botUserScore").textContent=bot.userScore;$("#botAIScore").textContent=bot.aiScore;$("#botLock").textContent="CHOOSE YOUR RESPONSE";$("#botThinking").textContent=`🤖 ${DIFFICULTY[bot.difficulty].label} is analysing the evidence…`;renderBotChoices();clearInterval(window.botTick);const end=Date.now()+ROUND_TIME*1000;$("#botTimer").textContent=ROUND_TIME;window.botTick=setInterval(()=>{const left=Math.max(0,Math.ceil((end-Date.now())/1000));$("#botTimer").textContent=left;if(left<=0){clearInterval(window.botTick);if(!bot.answered)botAnswer(null);}},250);scheduleAI();}
function renderBotChoices(){const s=bot.current;$("#botChoices").innerHTML=s.options.map((x,i)=>`<button class="choice ${bot.answered?"locked":""}" ${bot.answered?"disabled":""} onclick="botAnswer(${i})"><span>${String.fromCharCode(65+i)}</span>${esc(x)}</button>`).join("");}
function botAnswer(i){if(bot.answered)return;bot.answered=true;bot.lockedChoice=i;clearInterval(window.botTick);$("#botChoices").innerHTML=bot.current.options.map((x,n)=>`<button class="choice ${n===i?"botSelected":"locked"}" disabled><span>${String.fromCharCode(65+n)}</span>${esc(x)}</button>`).join("");$("#botLock").textContent=i===null?"TIME EXPIRED — NO DECISION":"DECISION LOCKED";$("#botThinking").textContent=bot.aiLocked?"🤖 Computer has also locked. Comparing defences…":"🤖 Waiting for the computer to lock its decision…";if(bot.aiLocked)setTimeout(revealBotRound,500);}
let aiTimer;
function scheduleAI(){clearTimeout(aiTimer);const d=DIFFICULTY[bot.difficulty];const delay=d.speed[0]+Math.random()*(d.speed[1]-d.speed[0]);aiTimer=setTimeout(()=>{bot.aiLockedChoice=aiChoice();bot.aiLocked=true;$("#botThinking").textContent="🤖 Computer decision locked.";if(bot.answered)setTimeout(revealBotRound,500);},delay);}
function aiChoice(){const s=bot.current,d=DIFFICULTY[bot.difficulty];if(Math.random()>d.accuracy){const wrong=s.options.map((_,i)=>i).filter(i=>i!==s.correct);return wrong[Math.floor(Math.random()*wrong.length)];}return s.correct;}
function revealBotRound(){if(!bot.answered||!bot.aiLocked)return;const s=bot.current, ai=bot.aiLockedChoice;const userCorrect=bot.lockedChoice===s.correct;const aiCorrect=ai===s.correct;for(const button of (s.buttons||[])){bot.profile[button]=bot.profile[button]||{seen:0,correct:0};bot.profile[button].seen++;if(userCorrect)bot.profile[button].correct++;}const userSpeed=bot.lockedChoice===null?0:Math.max(0,Math.round((ROUND_TIME-(Number($("#botTimer").textContent)||0))*0.6));const userPoints=userCorrect?100+userSpeed:0;const aiPoints=aiCorrect?100+Math.max(0,Math.floor(Math.random()*18)):0;bot.userScore+=userPoints;bot.aiScore+=aiPoints;$("#botRevealTitle").textContent=userCorrect?"🛡️ You read the trap.":"⚠️ The pressure got through.";$("#botRevealTitle").className=userCorrect?"goodText":"badText";$("#botPoints").textContent=`+${userPoints} XP`;$("#botCorrectAnswer").textContent=s.options[s.correct];$("#botLesson").textContent=s.lesson;$("#botDecision").innerHTML=`<div><span>YOU</span><b class="${userCorrect?"goodText":"badText"}">${userCorrect?"CORRECT":"WRONG / MISSED"}</b></div><div><span>🤖 COMPUTER • ${DIFFICULTY[bot.difficulty].label}</span><b class="${aiCorrect?"goodText":"badText"}">${aiCorrect?"CORRECT":"WRONG"}</b></div>`;$("#botWaiting").innerHTML=`<b>Your choice:</b> ${bot.lockedChoice===null?"No decision":esc(s.options[bot.lockedChoice])}<br><b>Computer chose:</b> ${esc(s.options[ai])}`;$("#botUserScore").textContent=bot.userScore;$("#botAIScore").textContent=bot.aiScore;show("computerReveal");setTimeout(nextBotRound,5000);}
function finishBot(){clearInterval(window.botTick);clearTimeout(aiTimer);const u=bot.userScore,a=bot.aiScore;$("#botFinalUser").textContent=u;$("#botFinalAI").textContent=a;$("#botFinalTitle").textContent=u>a?"🏆 You beat the machine!":u===a?"🤝 It's a draw!":"🤖 The machine wins this one.";$("#botFinalSummary").textContent=`${DIFFICULTY[bot.difficulty].label} difficulty • ${bot.total} rounds • Safety first, speed second.`;show("computerFinished");}

window.addEventListener("DOMContentLoaded",()=>{$("#name").value=state.name;fetch("/api/scenarios").then(r=>r.json()).then(data=>{if(Array.isArray(data)&&data.length){BOT_SCENARIOS.length=0;data.forEach(s=>{const n=normalizeScenario(s);if(n)BOT_SCENARIOS.push(n);});remoteScenariosLoaded=true;}}).catch(()=>{});const join=new URLSearchParams(location.search).get("join");if(join)$("#joinCode").value=join;document.querySelectorAll(".avatarPick").forEach(x=>x.addEventListener("click",()=>chooseAvatar(x)));document.querySelectorAll(".difficulty").forEach(x=>x.addEventListener("click",()=>chooseDifficulty(x)));connect();});


// ---------------- JEHU BIBLICAL CAMPAIGN ----------------
const CHAPTER_ORDER = ['ride','chariot','city'];
const campaignState = { mission:'ride', wave:1, score:0, hp:100, playerX:.22, targets:[], running:false, raf:null, last:0, arrows:[], cooldown:0, particles:[], shake:0, flash:0, banner:null, bannerT:0, shotsFired:0, shotsHit:0, neutralized:0, startTime:0 };
const campaignMissions = {
  ride:{
    label:'MISSION I • THE FURIOUS RIDE', enemyLabel:'ROYAL GUARD',
    narrative:"Word has reached Jezreel that you're coming, and you're driving like a madman. The throne there was built on injustice, and it's still standing. Break through the riders sent to slow you down — the road only stays open if you keep moving.",
    narrativeStart:'The watchman sees the company approaching. The ride begins.',
    winNarrative:'The road is open. Jezreel is ahead, and there is no turning back now.',
    loseNarrative:"The formation broke through. Reset and find a tighter rhythm — the ride isn't over.",
    waves:3, targetCount:4, speed:.000035, colorMode:'horse', accent:'#ffd166',
    objectives:{primary:'Clear all 3 waves and hold the road to Jezreel.', secondary:'Finish with chariot integrity above 50%.', master:'Finish with 70%+ accuracy and 70%+ integrity.'},
    secondaryIntegrity:50, masteryAccuracy:70, masteryIntegrity:70
  },
  chariot:{
    label:'MISSION II • CHARIOT OF FIRE', enemyLabel:'HOUSE OF AHAB',
    narrative:"You've taken the chariot. The king rides out to meet you himself, still asking if you come in peace — that was never going to be the answer. A house built on corruption doesn't step aside on its own. Meet the formation head-on and don't let it regroup.",
    narrativeStart:"The chariot rolls out. The king's formation holds the field ahead.",
    winNarrative:'The formation is broken. What was built on injustice does not hold when it is finally confronted.',
    loseNarrative:'The chariot took too much damage. Reset and press the volley harder.',
    waves:3, targetCount:6, speed:.00005, colorMode:'chariot', accent:'#ff8a65',
    objectives:{primary:"Break the House of Ahab's formation across all 3 waves.", secondary:'Finish with chariot integrity above 50%.', master:'Finish with 75%+ accuracy and 60%+ integrity.'},
    secondaryIntegrity:50, masteryAccuracy:75, masteryIntegrity:60
  },
  city:{
    label:'MISSION III • THE STRONGHOLD', enemyLabel:'CORRUPT COURT',
    narrative:"Samaria is ahead — the last stronghold of the old order, where corruption has been dressed up as tradition for too long. This is a defensive, strategic chapter: hold your ground, protect the chariot, and clear out what remains standing so something better can be rebuilt in its place.",
    narrativeStart:'The stronghold gates are close. Hold the line.',
    winNarrative:'The stronghold is cleared. Order doesn\u2019t repair itself — but it finally has a chance to.',
    loseNarrative:"The line didn't hold. Reset the mission and try a tighter defensive position.",
    waves:3, targetCount:5, speed:.00004, colorMode:'city', accent:'#38d9ff',
    objectives:{primary:"Clear the stronghold's corrupt court across all 3 waves.", secondary:'Finish with chariot integrity above 40%.', master:'Finish with 80%+ accuracy and 50%+ integrity — the standard of justice is restored.'},
    secondaryIntegrity:40, masteryAccuracy:80, masteryIntegrity:50
  }
};

function openJehuCampaign(){ show('jehuCampaign'); campaignShowBriefing(); }
function selectCampaignMission(m){
  if(!campaignMissions[m])return; cancelAnimationFrame(campaignState.raf); campaignState.running=false;
  campaignState.mission=m; document.querySelectorAll('.chapter').forEach(x=>x.classList.toggle('active',x.dataset.mission===m));
  campaignShowBriefing();
}
function campaignShowBriefing(){
  const m=campaignMissions[campaignState.mission];
  $('#briefLabel').textContent=m.label; $('#briefNarrative').textContent=m.narrative;
  $('#objPrimary').textContent=m.objectives.primary; $('#objSecondary').textContent=m.objectives.secondary; $('#objMaster').textContent=m.objectives.master;
  $('#campaignMissionLabel').textContent=m.label; $('#campaignWave').textContent=1; $('#campaignScore').textContent=0; $('#campaignHP').textContent=100;
  $('#campaignNarrative').textContent=m.narrativeStart;
  $('#missionComplete').classList.add('hidden'); $('#missionBriefing').classList.remove('hidden');
  drawCampaign();
}
function beginCampaignMission(){
  $('#missionBriefing').classList.add('hidden'); $('#missionComplete').classList.add('hidden');
  cancelAnimationFrame(campaignState.raf);
  Object.assign(campaignState, { wave:1, score:0, hp:100, playerX:.22, arrows:[], cooldown:0, particles:[], shake:0, flash:1, banner:null, bannerT:0, shotsFired:0, shotsHit:0, neutralized:0, running:true, last:performance.now(), startTime:performance.now() });
  spawnCampaignTargets(); updateCampaignHUD();
  const m=campaignMissions[campaignState.mission]; $('#campaignMissionLabel').textContent=m.label; $('#campaignNarrative').textContent=m.narrativeStart;
  campaignLoop(campaignState.last);
}
function spawnCampaignTargets(){
  const m=campaignMissions[campaignState.mission];
  campaignState.targets=Array.from({length:m.targetCount},(_,i)=>({x:.68+(i%3)*.09+(Math.random()*.03),y:.22+Math.floor(i/3)*.27+(Math.random()*.08),r:.035,alive:true,vx:-(m.speed*(0.7+Math.random()*.7)),phase:Math.random()*6.28}));
}
function updateCampaignHUD(){ $('#campaignWave').textContent=campaignState.wave;$('#campaignScore').textContent=campaignState.score;$('#campaignHP').textContent=campaignState.hp; }
function campaignMove(dir){ if(!campaignState.running)return; campaignState.playerX=Math.max(.12,Math.min(.42,campaignState.playerX+dir*.045)); }
function campaignFire(){
  if(!campaignState.running || campaignState.cooldown>0)return; campaignState.cooldown=190; campaignState.shotsFired++;
  if(campaignState.mission==='chariot'){[-.045,0,.045].forEach(offset=>{campaignState.arrows.push({x:campaignState.playerX+.08,y:.52+offset,v:.021});});}
  else{campaignState.arrows.push({x:campaignState.playerX+.08,y:.52,v:.018});}
}
function spawnHitParticles(x,y,color){
  for(let i=0;i<10;i++)campaignState.particles.push({x,y,vx:(Math.random()-.5)*.06,vy:(Math.random()-.5)*.06,life:1,color});
}
function campaignLoop(now){
  if(!campaignState.running)return; const dt=Math.min(40,now-campaignState.last);campaignState.last=now;campaignState.cooldown=Math.max(0,campaignState.cooldown-dt);
  const m=campaignMissions[campaignState.mission];
  campaignState.flash=Math.max(0,campaignState.flash-dt*.003);
  campaignState.shake=Math.max(0,campaignState.shake-dt*.02);
  if(campaignState.bannerT>0){campaignState.bannerT-=dt;} else campaignState.banner=null;
  campaignState.particles.forEach(p=>{p.x+=p.vx*dt*.06;p.y+=p.vy*dt*.06;p.life-=dt*.0022;});
  campaignState.particles=campaignState.particles.filter(p=>p.life>0);

  campaignState.targets.forEach(t=>{if(t.alive){t.x+=t.vx*dt;t.phase+=dt*.004;if(t.x<.08){t.alive=false;campaignState.hp=Math.max(0,campaignState.hp-18);campaignState.shake=1;campaignState.flash=.5;}}});
  campaignState.arrows.forEach(a=>a.x+=a.v*dt);
  campaignState.arrows=campaignState.arrows.filter(a=>a.x<1.02);
  for(const a of campaignState.arrows){for(const t of campaignState.targets){if(t.alive && Math.hypot(a.x-t.x,a.y-t.y)<.055){t.alive=false;a.x=2;campaignState.score+=m.colorMode==='chariot'?150:125;campaignState.shotsHit++;campaignState.neutralized++;spawnHitParticles(t.x,t.y,m.accent);}}}

  if(campaignState.hp<=0){ campaignState.running=false; return campaignFinish(false); }
  if(campaignState.targets.every(t=>!t.alive)){
    if(campaignState.wave<m.waves){
      campaignState.wave++;spawnCampaignTargets();campaignState.arrows=[];
      campaignState.banner=`WAVE ${campaignState.wave}`;campaignState.bannerT=1600;
      $('#campaignNarrative').textContent=`Wave ${campaignState.wave}: the road opens, but another ${m.enemyLabel.toLowerCase()} formation appears.`;
    } else { campaignState.running=false; return campaignFinish(true); }
  }
  updateCampaignHUD();drawCampaign();if(campaignState.running)campaignState.raf=requestAnimationFrame(campaignLoop);
}
function campaignFinish(success){
  const m=campaignMissions[campaignState.mission];
  const accuracy = campaignState.shotsFired ? Math.round(campaignState.shotsHit/campaignState.shotsFired*100) : 0;
  const integrity = campaignState.hp;
  const timeMs = performance.now()-campaignState.startTime;
  const mm = Math.floor(timeMs/60000), ss = Math.floor((timeMs%60000)/1000);
  let stars=0;
  if(success){ stars=1; if(integrity>=m.secondaryIntegrity){stars=2; if(accuracy>=m.masteryAccuracy && integrity>=m.masteryIntegrity) stars=3;} }
  $('#completeEyebrow').textContent = success? 'MISSION COMPLETE' : 'MISSION FAILED';
  $('#completeTitle').textContent = success? m.winNarrative : m.loseNarrative;
  $('#completeNarrative').textContent = success
    ? `${m.enemyLabel} formation cleared across ${m.waves} waves.`
    : `The ${m.enemyLabel.toLowerCase()} formation broke through before the objective was secured.`;
  $('#statAccuracy').textContent=accuracy+'%'; $('#statTime').textContent=`${mm}:${String(ss).padStart(2,'0')}`;
  $('#statNeutralized').textContent=campaignState.neutralized; $('#statIntegrity').textContent=integrity+'%';
  $('#masteryStars').innerHTML=[0,1,2].map(i=>`<span class="${i<stars?'starOn':'starOff'}">★</span>`).join('');
  const isLast = CHAPTER_ORDER.indexOf(campaignState.mission)===CHAPTER_ORDER.length-1;
  const nextBtn=$('#nextChapterBtn');
  nextBtn.textContent = !success ? 'TRY AGAIN' : (isLast? '↻ REPLAY CAMPAIGN':'NEXT CHAPTER →');
  nextBtn.style.display = !success ? 'none' : '';
  $('#missionComplete').classList.remove('hidden');
  drawCampaign();
}
function advanceChapter(){
  const i=CHAPTER_ORDER.indexOf(campaignState.mission);
  const next = i<CHAPTER_ORDER.length-1 ? CHAPTER_ORDER[i+1] : CHAPTER_ORDER[0];
  selectCampaignMission(next);
}
function drawCampaign(){
  const c=$('#jehuCanvas');if(!c)return;const ctx=c.getContext('2d');const W=c.width,H=c.height;
  const m=campaignMissions[campaignState.mission];
  ctx.save();
  if(campaignState.shake>0){ctx.translate((Math.random()-.5)*14*campaignState.shake,(Math.random()-.5)*14*campaignState.shake);}
  ctx.clearRect(-20,-20,W+40,H+40);
  const skyTints={horse:['#07182a','#102d38','#1b1a12'],chariot:['#210a0e','#2b1210','#1b1a12'],city:['#041824','#0a2430','#0f1b12']};
  const tint=skyTints[m.colorMode]||skyTints.horse;
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,tint[0]);sky.addColorStop(.58,tint[1]);sky.addColorStop(1,tint[2]);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#0b1c27';ctx.beginPath();ctx.moveTo(0,H*.62);ctx.lineTo(W*.18,H*.43);ctx.lineTo(W*.34,H*.58);ctx.lineTo(W*.5,H*.39);ctx.lineTo(W*.67,H*.55);ctx.lineTo(W*.82,H*.4);ctx.lineTo(W,H*.56);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  ctx.fillStyle='#172d2d';ctx.fillRect(W*.74,H*.32,W*.18,H*.27);ctx.fillStyle='#caa95b';ctx.fillRect(W*.81,H*.42,W*.04,H*.17);ctx.fillStyle='#101b24';ctx.fillRect(W*.79,H*.29,W*.08,H*.04);
  ctx.fillStyle='#29271e';ctx.beginPath();ctx.moveTo(W*.08,H);ctx.lineTo(W*.38,H*.55);ctx.lineTo(W*.63,H*.55);ctx.lineTo(W*.92,H);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#6c6040';ctx.setLineDash([18,16]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(W*.5,H*.56);ctx.lineTo(W*.5,H);ctx.stroke();ctx.setLineDash([]);
  const px=W*campaignState.playerX, py=H*.67; drawJehuUnit(ctx,px,py,m.colorMode);
  ctx.strokeStyle='#ffd166';ctx.lineWidth=4;for(const a of campaignState.arrows){const ax=W*a.x,ay=H*a.y;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-26,ay);ctx.stroke();ctx.fillStyle='#ffd166';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-9,ay-5);ctx.lineTo(ax-9,ay+5);ctx.closePath();ctx.fill();}
  for(const t of campaignState.targets){
    if(!t.alive)continue;const x=W*t.x,y=H*t.y;ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#3a1418';ctx.beginPath();ctx.arc(1,3,26,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8d3037';ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();ctx.strokeStyle=m.accent;ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#2a0f12';ctx.fillRect(-3,-33,6,14);
    ctx.fillStyle='#f0d49a';ctx.font='900 9px system-ui';ctx.textAlign='center';ctx.fillText(m.enemyLabel,0,4);
    ctx.restore();
  }
  for(const p of campaignState.particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(W*p.x,H*p.y,3.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  ctx.fillStyle='#d8e7f2';ctx.font='900 13px system-ui';ctx.fillText(m.colorMode==='horse'?'HORSEBACK • BOW READY':m.colorMode==='chariot'?'WAR CHARIOT • VOLLEY READY':'CHARIOT • STRONGHOLD OBJECTIVE',24,32);
  ctx.fillStyle='#8199aa';ctx.font='12px system-ui';ctx.fillText('Non-graphic gameplay adaptation • inspired by the biblical narrative, not a depiction of it',24,H-22);
  if(campaignState.banner){
    ctx.globalAlpha=Math.min(1,campaignState.bannerT/500);
    ctx.fillStyle=m.accent;ctx.font='900 46px system-ui';ctx.textAlign='center';ctx.fillText(campaignState.banner,W/2,H/2);
    ctx.globalAlpha=1;
  }
  if(campaignState.flash>0){ctx.fillStyle=`rgba(255,120,120,${campaignState.flash*.35})`;ctx.fillRect(0,0,W,H);}
  ctx.restore();
}
function drawJehuUnit(ctx,x,y,mode){
  ctx.save();ctx.translate(x,y);
  if(mode==='horse'){ctx.fillStyle='#4d2f20';ctx.beginPath();ctx.ellipse(0,10,75,27,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(58,-10,25,20,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#8a6044';ctx.lineWidth=7;for(const lx of [-38,-10,22,48]){ctx.beginPath();ctx.moveTo(lx,26);ctx.lineTo(lx-6,65);ctx.stroke();}ctx.fillStyle='#d8e5ed';ctx.beginPath();ctx.arc(2,-42,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#102638';ctx.fillRect(-11,-29,25,42);ctx.strokeStyle='#ffd166';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(14,-22);ctx.lineTo(48,-43);ctx.stroke();
  }else{ctx.fillStyle='#6e4b2e';ctx.fillRect(-55,5,115,40);ctx.fillStyle='#2b2220';ctx.fillRect(-35,-18,24,20);ctx.fillRect(22,-18,24,20);ctx.fillStyle='#d8e5ed';ctx.beginPath();ctx.arc(0,-47,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#12293b';ctx.fillRect(-13,-33,27,43);ctx.strokeStyle='#ffd166';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(12,-27);ctx.lineTo(55,-42);ctx.stroke();ctx.fillStyle='#d4b26a';ctx.fillRect(-72,-2,17,7);ctx.fillRect(58,-2,17,7);}
  ctx.restore();
}

// ---------------- JEHU CASE FILES: BRANCHING INCIDENT SIMULATIONS ----------------
let caseState = { list:[], file:null, node:null, difficulty:state.botDifficulty || 'rookie', used:[] , timer:null, choice:null };
async function openCaseFiles(){
  show('caseFiles');
  const diff = $('#difficulty')?.value || state.botDifficulty || 'rookie';
  caseState.difficulty=diff;
  try { const r=await fetch('/api/casefiles?difficulty='+encodeURIComponent(diff)); caseState.list=await r.json(); renderCaseCards(); }
  catch(e){ $('#caseGrid').innerHTML='<div class="panel"><p>Case files are temporarily unavailable.</p></div>'; }
}
function renderCaseCards(){
  $('#caseGrid').innerHTML=caseState.list.map(c=>`<button class="caseCard" onclick="startCaseFile('${esc(c.id)}')"><b>📁 ${esc(c.title)}</b><div class="caseMeta"><span class="pill">${esc(c.category)}</span><span class="pill">${'★'.repeat(c.difficulty)}</span><span class="pill">${c.stages} stages</span></div><small>${esc(c.brief)}</small></button>`).join('');
}
async function startCaseFile(id){
  try { const r=await fetch('/api/casefiles/'+encodeURIComponent(id)); caseState.file=await r.json(); caseState.used=[]; caseState.choice=null; loadCaseNode(caseState.file.nodes[0].id); }
  catch(e){ toast('Unable to open that case file.'); }
}
function loadCaseNode(nodeId){
  const n=caseState.file.nodes.find(x=>x.id===nodeId); if(!n)return finishCase('bad','Case data ended unexpectedly.');
  if(n.terminal)return finishCase(n.terminal,n.summary);
  caseState.node=n; caseState.choice=null; caseState.used.push(n.scenario); const p=fetch('/api/casefiles/'+encodeURIComponent(caseState.file.id)+'/node/'+encodeURIComponent(n.id)).then(r=>r.json());
  p.then(s=>{ if(!s)return finishCase('bad','The scenario could not be loaded.'); caseState.scenario=s; renderCaseScenario(s); }).catch(()=>finishCase('bad','The scenario could not be loaded.'));
}
function renderCaseScenario(s){
  show('caseArena'); $('#caseStage').textContent=`CASE STAGE ${caseState.used.length}`; $('#caseCategory').textContent=s.category; $('#caseTitle').textContent=s.title; $('#caseMessage').textContent=s.message; $('#caseEvidence').innerHTML=(s.evidence||[]).map(x=>`<span>${esc(x)}</span>`).join(''); $('#caseMeta').innerHTML=(s.buttons||[]).map(x=>`<span class="pill">${esc(x)}</span>`).join('');
  $('#caseChoices').innerHTML=s.options.map((x,i)=>`<button class="choice" onclick="chooseCase(${i})"><span>${String.fromCharCode(65+i)}</span>${esc(x)}</button>`).join('');
  clearInterval(caseState.timer); let left=45; $('#caseTimer').textContent=left; caseState.timer=setInterval(()=>{left--;$('#caseTimer').textContent=Math.max(0,left);if(left<=0){clearInterval(caseState.timer);chooseCase(null);}},1000);
}
function chooseCase(i){
  if(caseState.choice!==null)return; caseState.choice=i; clearInterval(caseState.timer); const s=caseState.scenario; document.querySelectorAll('#caseChoices .choice').forEach((b,n)=>{b.disabled=true;b.classList.toggle('botSelected',n===i);});
  const next=caseState.file.nodes.find(x=>x.id===caseState.node.id)?.next; const target=next && Object.prototype.hasOwnProperty.call(next,String(i)) ? next[String(i)] : next && Object.values(next)[0];
  const correct=i!==null && i===s.correct; const lesson=s.lesson||'Pause, verify independently, and choose the safest defensive action.';
  // Show a short transition/debrief before the branch continues.
  $('#caseOutcomeTitle').textContent=correct?'🛡️ Good decision':'⚠️ The attack advanced'; $('#caseOutcomeBox').className='caseOutcome '+(correct?'good':'bad'); $('#caseOutcomeBox').innerHTML=`<b>${correct?'You contained this stage.':'Your decision gave the attacker an opening.'}</b><p>${esc(lesson)}</p><div class="caseChoiceNote"><b>Your choice:</b> ${i===null?'No decision':esc(s.options[i])}</div>`; show('caseOutcome');
  setTimeout(()=>{ if(target) loadCaseNode(target); else finishCase(correct?'good':'bad', correct?'You kept the incident on a defensive path.':'The incident escalated because the safer response was missed.'); }, 3500);
}
function finishCase(kind,summary){clearInterval(caseState.timer); $('#caseOutcomeTitle').textContent=kind==='good'?'🛡️ CASE CONTAINED':'🚨 CASE ESCALATED'; $('#caseOutcomeBox').className='caseOutcome '+(kind==='good'?'good':'bad'); $('#caseOutcomeBox').innerHTML=`<b>${kind==='good'?'You reached a defensive outcome.':'The case reached a high-risk outcome.'}</b><p>${esc(summary)}</p><div class="caseChoiceNote">Stages completed: <b>${caseState.used.length}</b></div>`;show('caseOutcome');}
