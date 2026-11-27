/* All player-provided text is escaped before insertion. Sessions stay on this device. */
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const copy = {
  en: {
    online: "Connected",
    offline: "Reconnecting…",
    footer: "Good friends. Terrible memes.",
    tag: "2–20 players · phones + a big screen",
    hero: 'Your friends.<br>Your memes.<br><span class="highlight">Zero dignity.</span>',
    intro:
      "Crown a Memeinator. Find the perfect meme. Make the room lose it. A party game powered by your questionable taste.",
    seat: "Grab a seat.",
    seatText: "One screen for the room. A phone for every bad idea.",
    name: "Your name",
    namePlaceholder: "A very serious person",
    create: "Host a party",
    or: "OR CRASH ONE",
    code: "Room code",
    join: "Join party",
    step1: "Crown the Memeinator",
    desc1: "A new ruler picks the prompt each round.",
    step2: "Find your masterpiece",
    desc2: "Drop a link from your favorite corner of the internet.",
    step3: "Watch the chaos",
    desc3: "Sit back. The big screen does the talking.",
    step4: "Win the crown’s favor",
    desc4: "The Memeinator picks a winner. Repeat.",
    room: "YOUR PARTY",
    invite: "Copy invite",
    copied: "Invite copied",
    leave: "Leave",
    players: "The flock",
    you: "you",
    host: "host",
    judge: "Memeinator",
    spectator: "view only",
    disconnected: "offline",
    round: "ROUND",
    lobby: "The gathering",
    prompt: "A royal decision",
    submit: "Feed the meme machine",
    watch: "Roll the memes",
    vote: "Judgment time",
    result: "The verdict",
    waitingTitle: "The flock is assembling.",
    waitingText:
      "Share the room code or invite link. You need at least two playing guests to start.",
    start: "Start round",
    next: "Next round",
    waitingHost: "Waiting for the host to start the round.",
    settings: "Room settings",
    language: "Prompt language",
    hostViewOnly: "Host is a spectator",
    tvMode: "TV mode: autoplay only on the host screen",
    autoFill: "Fill player blanks automatically",
    judgeMode: "Choose the Memeinator",
    random: "Random each round",
    manual: "Host chooses",
    promptSeconds: "Prompt time (seconds)",
    promptCount: "Prompt choices",
    submissionSeconds: "Submission time (seconds)",
    maxPlaySeconds: "Maximum playback (seconds)",
    save: "Save settings",
    saved: "Settings saved",
    chooseJudge: "Select the next Memeinator",
    noRepeat: "The previous Memeinator sits out the next selection.",
    isJudge: "is the Memeinator.",
    pickPrompt: "Choose the setup. They bring the punchline.",
    choose: "Choose this prompt",
    waitingPrompt: "The Memeinator is choosing your fate.",
    autoPrompt: "A prompt is selected automatically when time runs out.",
    sendTitle: "One link. Make it count.",
    url: "Meme link",
    urlPlaceholder: "Paste a YouTube, TikTok, X or Reddit link",
    send: "Submit meme",
    pending: "Preparing your meme…",
    ready: "Your meme is locked in.",
    embed: "Saved. We’ll use the platform embed.",
    submitted: "Submitted",
    waitSubmit: "Find a meme while the others hunt for theirs.",
    observer: "You’re watching this round.",
    observerText: "New arrivals can play from the next round.",
    judging: "Watch closely. You pick the winner.",
    judgeWaiting:
      "You’re the Memeinator: you choose the winner and cannot submit a meme. Waiting for the players’ memes.",
    watchTv: "Eyes on the big screen.",
    watchTvText: "TV mode is on. Memes play automatically on the host screen.",
    playHere: "Play on this device",
    unlock: "Enable sound / play",
    nextMeme: "Next meme",
    source: "Open original",
    fallback:
      "Platform playback may require consent or a login. Use the original link if the embed is unavailable.",
    meme: "Meme",
    of: "of",
    pickWinner: "Which meme deserves the point?",
    waitVote: "The Memeinator is choosing the best meme.",
    voteTimeout:
      "If the Memeinator is away, a winner is drawn after 60 seconds.",
    winner: "WON THE ROUND",
    point: "One point. Infinite bragging rights.",
    noMemes: "No memes this time.",
    noMemesText: "Nobody submitted before time ran out. Try another round.",
    scoreboard: "Scoreboard",
    rules: "The house rules",
    rulesText:
      "Short clips loop for at least 15 seconds. The Memeinator chooses the winner, then gives up the throne.",
    resume: "Rejoin your party",
    resumeText: "Your seat is saved on this device.",
    rejoin: "Rejoin",
    forget: "Start fresh",
    resuming: "Rejoining your party…",
    lost: "Connection lost. Your seat is saved; we’ll rejoin automatically.",
    replaced: "This seat was opened in another tab.",
    errors: {
      invalidName: "Enter a name with 1–24 characters.",
      invalidSettings: "Check the setting values.",
      roomMissing: "That room no longer exists.",
      roomFull: "This room is full.",
      serverFull: "The server is full. Try again later.",
      hostOnly: "Only the host can do that.",
      judgeOnly: "Only the Memeinator can do that.",
      judgeCannotSubmit: "The Memeinator cannot submit memes.",
      wrongPhase: "That action is not available in this phase.",
      needPlayers: "You need at least two connected players.",
      chooseJudge: "Choose an eligible Memeinator first.",
      invalidPrompt: "Choose one of the offered prompts.",
      invalidNames: "Choose a player for every blank.",
      spectator: "You can play from the next round.",
      alreadySubmitted: "You already submitted a meme.",
      invalidUrl:
        "Use a public YouTube video, TikTok video, X status or Reddit post link.",
      invalidVote: "Choose an available meme.",
      minimumPlay: "Every meme gets at least 15 seconds.",
      sessionExpired: "Your seat is no longer available. Join again.",
      rateLimit: "Too many requests. Wait a moment.",
      alreadyJoined: "You are already in a room.",
      invalidAction: "That action could not be completed.",
      network: "No connection. Please try again.",
    },
  },
  de: {
    online: "Verbunden",
    offline: "Verbindung wird hergestellt…",
    footer: "Gute Freunde. Schlechte Memes.",
    tag: "2–20 Spieler · Handys + ein großer Bildschirm",
    hero: 'Deine Freunde.<br>Deine Memes.<br><span class="highlight">Keine Würde.</span>',
    intro:
      "Krönt einen Memeinator. Findet das perfekte Meme. Bringt den Raum zum Lachen. Das Partyspiel für euren fragwürdigen Humor.",
    seat: "Setz dich dazu.",
    seatText: "Ein Bildschirm für alle. Ein Handy für jede schlechte Idee.",
    name: "Dein Name",
    namePlaceholder: "Eine sehr seriöse Person",
    create: "Party veranstalten",
    or: "ODER MISCH DICH EIN",
    code: "Raumcode",
    join: "Beitreten",
    step1: "Memeinator krönen",
    desc1: "Jede Runde wählt ein neuer Herrscher das Thema.",
    step2: "Meisterwerk finden",
    desc2: "Teile einen Link aus deiner Lieblingsecke des Internets.",
    step3: "Chaos anschauen",
    desc3: "Lehnt euch zurück. Die Memes laufen auf dem großen Bildschirm.",
    step4: "Die Krone überzeugen",
    desc4: "Der Memeinator wählt den Gewinner. Und noch mal.",
    room: "DEINE PARTY",
    invite: "Einladung kopieren",
    copied: "Einladung kopiert",
    leave: "Verlassen",
    players: "Die Entenschar",
    you: "du",
    host: "Host",
    judge: "Memeinator",
    spectator: "schaut zu",
    disconnected: "offline",
    round: "RUNDE",
    lobby: "Die Versammlung",
    prompt: "Königliche Entscheidung",
    submit: "Füttert die Meme-Maschine",
    watch: "Film ab",
    vote: "Zeit für das Urteil",
    result: "Das Ergebnis",
    waitingTitle: "Die Entenschar versammelt sich.",
    waitingText:
      "Teile den Raumcode oder Einladungslink. Zum Start braucht ihr mindestens zwei aktive Spieler.",
    start: "Runde starten",
    next: "Nächste Runde",
    waitingHost: "Warte darauf, dass der Host die Runde startet.",
    settings: "Raumeinstellungen",
    language: "Sprache der Themen",
    hostViewOnly: "Host schaut nur zu",
    tvMode: "TV-Modus: automatische Wiedergabe nur beim Host",
    autoFill: "Spielernamen automatisch einsetzen",
    judgeMode: "Memeinator bestimmen",
    random: "Jede Runde zufällig",
    manual: "Host wählt",
    promptSeconds: "Themenwahl (Sekunden)",
    promptCount: "Themen zur Auswahl",
    submissionSeconds: "Abgabezeit (Sekunden)",
    maxPlaySeconds: "Maximale Wiedergabe (Sekunden)",
    save: "Einstellungen speichern",
    saved: "Einstellungen gespeichert",
    chooseJudge: "Nächsten Memeinator auswählen",
    noRepeat: "Der bisherige Memeinator setzt bei der nächsten Auswahl aus.",
    isJudge: "ist der Memeinator.",
    pickPrompt: "Du wählst das Thema. Die anderen liefern die Pointe.",
    choose: "Dieses Thema wählen",
    waitingPrompt: "Der Memeinator entscheidet über euer Schicksal.",
    autoPrompt: "Nach Ablauf der Zeit wird automatisch ein Thema gewählt.",
    sendTitle: "Ein Link. Gib alles.",
    url: "Meme-Link",
    urlPlaceholder: "YouTube-, TikTok-, X- oder Reddit-Link einfügen",
    send: "Meme abgeben",
    pending: "Dein Meme wird vorbereitet…",
    ready: "Dein Meme ist abgegeben.",
    embed: "Gespeichert. Wir nutzen die Plattform-Einbettung.",
    submitted: "Abgegeben",
    waitSubmit: "Finde ein Meme, während die anderen auf die Jagd gehen.",
    observer: "Du schaust diese Runde zu.",
    observerText: "Neu beigetretene Spieler spielen ab der nächsten Runde mit.",
    judging: "Schau genau hin. Du wählst den Gewinner.",
    judgeWaiting:
      "Du bist der Memeinator: Du wählst den Gewinner und kannst kein Meme abgeben. Warte auf die Memes der anderen.",
    watchTv: "Augen auf den großen Bildschirm.",
    watchTvText:
      "Der TV-Modus ist an. Memes starten automatisch auf dem Host-Bildschirm.",
    playHere: "Auf diesem Gerät abspielen",
    unlock: "Ton / Wiedergabe aktivieren",
    nextMeme: "Nächstes Meme",
    source: "Original öffnen",
    fallback:
      "Die Plattform kann Zustimmung oder eine Anmeldung verlangen. Falls die Einbettung nicht läuft, öffne das Original.",
    meme: "Meme",
    of: "von",
    pickWinner: "Welches Meme verdient den Punkt?",
    waitVote: "Der Memeinator wählt das beste Meme.",
    voteTimeout:
      "Ist der Memeinator weg, wird nach 60 Sekunden ein Gewinner ausgelost.",
    winner: "GEWINNT DIE RUNDE",
    point: "Ein Punkt. Unendliche Angeberei.",
    noMemes: "Dieses Mal keine Memes.",
    noMemesText: "Niemand hat rechtzeitig abgegeben. Versucht eine neue Runde.",
    scoreboard: "Punktestand",
    rules: "Die Hausregeln",
    rulesText:
      "Kurze Clips laufen mindestens 15 Sekunden in Schleife. Der Memeinator wählt den Gewinner und gibt dann den Thron ab.",
    resume: "Zurück zu deiner Party",
    resumeText: "Dein Platz ist auf diesem Gerät gespeichert.",
    rejoin: "Wieder beitreten",
    forget: "Neu anfangen",
    resuming: "Deiner Party wird beigetreten…",
    lost: "Verbindung verloren. Dein Platz bleibt gespeichert; wir verbinden dich automatisch.",
    replaced: "Dieser Platz wurde in einem anderen Tab geöffnet.",
    errors: {
      invalidName: "Gib einen Namen mit 1–24 Zeichen ein.",
      invalidSettings: "Prüfe die Einstellungen.",
      roomMissing: "Diesen Raum gibt es nicht mehr.",
      roomFull: "Dieser Raum ist voll.",
      serverFull: "Der Server ist voll. Versuche es später erneut.",
      hostOnly: "Das darf nur der Host.",
      judgeOnly: "Das darf nur der Memeinator.",
      judgeCannotSubmit: "Der Memeinator kann keine Memes abgeben.",
      wrongPhase: "Diese Aktion ist in dieser Phase nicht möglich.",
      needPlayers: "Ihr braucht mindestens zwei verbundene Spieler.",
      chooseJudge: "Wähle zuerst einen verfügbaren Memeinator.",
      invalidPrompt: "Wähle eines der angebotenen Themen.",
      invalidNames: "Wähle für jede Lücke einen Spieler.",
      spectator: "Du spielst ab der nächsten Runde mit.",
      alreadySubmitted: "Du hast schon ein Meme abgegeben.",
      invalidUrl:
        "Nutze einen öffentlichen YouTube-, TikTok-, X-Status- oder Reddit-Beitragslink.",
      invalidVote: "Wähle ein verfügbares Meme.",
      minimumPlay: "Jedes Meme bekommt mindestens 15 Sekunden.",
      sessionExpired: "Dein Platz ist nicht mehr verfügbar. Tritt erneut bei.",
      rateLimit: "Zu viele Anfragen. Warte einen Moment.",
      alreadyJoined: "Du bist bereits in einem Raum.",
      invalidAction: "Die Aktion konnte nicht ausgeführt werden.",
      network: "Keine Verbindung. Versuche es erneut.",
    },
  },
};
let lang =
  localStorage.getItem("whatdaduck-language") ||
  (navigator.language.startsWith("de") ? "de" : "en");
let saved;
try {
  saved = JSON.parse(localStorage.getItem("whatdaduck-session"));
} catch {}
let state = null,
  clockOffset = 0,
  mediaKey = "",
  mediaNode = null,
  localPlayback = false,
  joining = false,
  replaced = false,
  signature = "";
const socket = io({ autoConnect: false });
const t = (k) => copy[lang][k] || k;
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("#toast").hidden = true), 5000);
}
async function command(type, data = {}) {
  if (!socket.connected) throw new Error("network");
  const result = await socket
    .timeout(type === "submit" ? 85000 : 10000)
    .emitWithAck("command", { type, data })
    .catch(() => {
      throw new Error("network");
    });
  if (!result.ok) throw new Error(result.error);
  return result;
}
function perform(type, data) {
  return command(type, data).catch((error) =>
    toast(copy[lang].errors[error.message] || t("errors").invalidAction),
  );
}
function reset() {
  saved = null;
  state = null;
  signature = "";
  mediaKey = "";
  mediaNode = null;
  localPlayback = false;
  localStorage.removeItem("whatdaduck-session");
  render();
}
async function enter(type, data) {
  if (joining) return;
  joining = true;
  try {
    const r = await command(type, data);
    saved = { code: r.code, token: r.token, name: data.name };
    localStorage.setItem("whatdaduck-session", JSON.stringify(saved));
  } catch (e) {
    toast(copy[lang].errors[e.message] || copy[lang].errors.network);
    if (["roomMissing", "sessionExpired"].includes(e.message)) reset();
  } finally {
    joining = false;
  }
}
function name(id) {
  return state.players.find((p) => p.id === id)?.name || "—";
}
function isHost() {
  return state.me === state.hostId;
}
function isJudge() {
  return state.me === state.judgeId;
}
function playerOptions(selected) {
  return state.players
    .filter((p) => !(state.settings.hostViewOnly && p.id === state.hostId))
    .map(
      (p) =>
        `<option value="${esc(p.name)}" ${p.name === selected ? "selected" : ""}>${esc(p.name)}</option>`,
    )
    .join("");
}
function updateLanguage() {
  document.documentElement.lang = lang;
  $("#language").value = lang;
  $("#footer-text").textContent = t("footer");
  $("#connection").textContent = t(socket.connected ? "online" : "offline");
}
$("#language").addEventListener("change", (e) => {
  lang = e.target.value;
  localStorage.setItem("whatdaduck-language", lang);
  mediaKey = "";
  mediaNode = null;
  render();
});
function landing() {
  const code = new URLSearchParams(location.search).get("room") || "";
  return `<section class="landing"><div class="intro"><span class="tag">${t("tag")}</span><h1>${t("hero")}</h1><p class="muted">${t("intro")}</p><div class="platforms"><span class="tag">YouTube</span><span class="tag">TikTok</span><span class="tag">X / Twitter</span><span class="tag">Reddit</span></div></div><div class="card entry">${saved ? `<h2>${t("resume")}</h2><p class="muted">${t("resumeText")} <strong>${esc(saved.code)}</strong></p><div class="actions"><button class="primary" id="rejoin">${t("rejoin")}</button><button class="ghost" id="forget">${t("forget")}</button></div>` : `<h2>${t("seat")}</h2><p class="note">${t("seatText")}</p><form id="entry-form"><label for="name">${t("name")}</label><input id="name" autocomplete="nickname" maxlength="24" placeholder="${t("namePlaceholder")}" required><button type="submit" class="primary" id="create">${t("create")}</button><div class="divider">${t("or")}</div><label for="code">${t("code")}</label><div class="join-row"><input id="code" value="${esc(code)}" placeholder="ABC123" maxlength="6" autocapitalize="characters" autocomplete="off"><button type="button" class="dark" id="join">${t("join")}</button></div></form>`}</div></section><section class="steps">${[1, 2, 3, 4].map((i) => `<div class="step"><span class="num">0${i} /</span><b>${t("step" + i)}</b><p>${t("desc" + i)}</p></div>`).join("")}</section>`;
}
function settingsForm() {
  const s = state.settings;
  return `<details class="settings"><summary>${t("settings")}</summary><form id="settings-form"><div class="settings-grid"><div><label>${t("language")}</label><select name="language"><option value="en" ${s.language === "en" ? "selected" : ""}>English</option><option value="de" ${s.language === "de" ? "selected" : ""}>Deutsch</option></select></div><div><label>${t("judgeMode")}</label><select name="judgeMode"><option value="random" ${s.judgeMode === "random" ? "selected" : ""}>${t("random")}</option><option value="host" ${s.judgeMode === "host" ? "selected" : ""}>${t("manual")}</option></select></div>${[
    ["promptSeconds", 10, 180],
    ["promptCount", 1, 10],
    ["submissionSeconds", 15, 600],
    ["maxPlaySeconds", 15, 600],
  ]
    .map(
      ([k, min, max]) =>
        `<div><label for="setting-${k}">${t(k)}</label><input id="setting-${k}" name="${k}" type="number" min="${min}" max="${max}" value="${s[k]}" required></div>`,
    )
    .join(
      "",
    )}</div>${["hostViewOnly", "tvMode", "autoFill"].map((k) => `<label class="check"><input name="${k}" type="checkbox" ${s[k] ? "checked" : ""}>${t(k)}</label>`).join("")}<button class="small" style="margin-top:15px">${t("save")}</button></form></details>`;
}
function startControls() {
  return isHost()
    ? `<div class="actions">${
        state.settings.judgeMode === "host"
          ? `<select id="judge-choice" aria-label="${t("chooseJudge")}"><option value="">${t("chooseJudge")}</option>${state.players
              .filter(
                (p) =>
                  p.connected &&
                  p.id !== state.previousJudgeId &&
                  !(state.settings.hostViewOnly && p.id === state.hostId),
              )
              .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
              .join("")}</select>`
          : ""
      }<button class="primary" id="start">${t(state.phase === "result" ? "next" : "start")}</button></div>${state.settings.judgeMode === "host" ? `<p class="note">${t("noRepeat")}</p>` : ""}${settingsForm()}`
    : `<p class="note">${t("waitingHost")}</p>`;
}
function phaseContent() {
  switch (state.phase) {
    case "lobby":
      return `<div class="center"><div class="empty-duck">quack.</div><h2>${t("waitingTitle")}</h2><p class="muted">${t("waitingText")}</p></div>${startControls()}`;
    case "prompt":
      return `<div class="crown">${esc(name(state.judgeId))}</div><h2>${t("isJudge")}</h2><p class="muted">${t(isJudge() ? "pickPrompt" : "waitingPrompt")}</p>${
        isJudge()
          ? `<div class="prompt-grid">${state.choices
              .map((p) => {
                let i = 0;
                const text = p[state.settings.language]
                  .split("{player}")
                  .map(
                    (part, n, a) =>
                      `${esc(part)}${n < a.length - 1 ? (state.settings.autoFill ? `<strong>${esc(p.fills[i++])}</strong>` : `<select name="fill">${playerOptions(p.fills[i++])}</select>`) : ""}`,
                  )
                  .join("");
                return `<form class="prompt-card" data-prompt="${p.id}"><p>${text}</p><button class="small">${t("choose")}</button></form>`;
              })
              .join("")}</div>`
          : ""
      }<p class="note">${t("autoPrompt")}</p>`;
    case "submit": {
      const observer = state.canSubmit === false;
      return `<span class="eyebrow">${t("sendTitle")}</span><h2>${esc(state.prompt)}</h2>${isJudge() ? `<p class="note">${t("judging")}</p>` : ""}${isJudge() ? `<p class="muted">${t("judgeWaiting")}</p>` : observer ? `<p>${t("observer")} ${t("observerText")}</p>` : state.mySubmission ? `<div class="card"><strong>${t(state.mySubmission === "pending" ? "pending" : state.mySubmission === "ready" ? "ready" : "embed")}</strong></div>` : `<p class="muted">${t("waitSubmit")}</p><form id="submit-form"><label for="meme-url">${t("url")}</label><input id="meme-url" class="url-input" type="url" placeholder="${t("urlPlaceholder")}" maxlength="2048" required><button class="primary">${t("send")}</button></form>`}<div class="progress-list">${state.players
        .filter((p) => state.submitterIds.includes(p.id))
        .map(
          (p) =>
            `<span class="pill">${esc(p.name)} · ${state.submitted.includes(p.id) ? t("submitted") : "…"}</span>`,
        )
        .join("")}</div>`;
    }
    case "watch":
      return `<span class="eyebrow">${t("meme")} ${state.current.number} ${t("of")} ${state.current.total}</span><h2>${esc(state.prompt)}</h2><div id="media-slot"></div><div class="playback-actions"><button class="small" id="unlock">${t("unlock")}</button>${isHost() ? `<button class="small ghost" id="skip">${t("nextMeme")}</button>` : ""}</div><p class="note">${t("fallback")}</p>`;
    case "vote":
      return `<h2>${t("pickWinner")}</h2><p class="muted">${t(isJudge() ? "judging" : "waitVote")}</p><div class="vote-grid">${state.candidates.map((c, i) => `<div><button ${isJudge() ? "" : "disabled"} data-vote="${c.id}">${t("meme")} ${i + 1}</button><a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${t("source")}</a></div>`).join("")}</div><p class="note">${t("voteTimeout")}</p>`;
    case "result":
      return `<div class="center">${state.winnerId ? `<span class="crown">${t("winner")}</span><div class="result-name">${esc(name(state.winnerId))}</div><p class="muted">${t("point")}</p>` : `<h2>${t("noMemes")}</h2><p class="muted">${t("noMemesText")}</p>`}</div>${startControls()}`;
    default:
      return "";
  }
}
function playerList() {
  return `<div class="eyebrow">${t("players")} / ${state.players.length}</div>${state.players.map((p) => `<div class="person"><span class="avatar">${esc(p.name[0].toUpperCase())}</span><span class="person-name">${esc(p.name)}${p.id === state.me ? ` <small>${t("you")}</small>` : ""}<small>${[p.id === state.hostId ? t("host") : "", p.id === state.judgeId ? t("judge") : "", state.settings.hostViewOnly && p.id === state.hostId ? t("spectator") : "", !p.connected ? t("disconnected") : ""].filter(Boolean).join(" · ")}</small></span><span class="score">${p.score}</span></div>`).join("")}`;
}
function playbackKey() {
  return `${state.current.id}:${state.settings.tvMode}:${isHost()}:${localPlayback}:${lang}`;
}
let renderedScope = "",
  renderedSettings = "";
const formKey = (form) => form.id || form.dataset.prompt;
const fields = (form) =>
  [...form.elements].filter((el) => ["INPUT", "SELECT"].includes(el.tagName));
function captureDrafts(keepSettings) {
  return {
    forms: [...document.querySelectorAll("#app form")]
      .filter((form) => keepSettings || form.id !== "settings-form")
      .map((form) => ({
        key: formKey(form),
        values: fields(form).map((el) => ({
          value: el.value,
          checked: el.checked,
          focused: el === document.activeElement,
          start: el.selectionStart,
          end: el.selectionEnd,
        })),
      })),
    settingsOpen: $("details.settings")?.open,
    judge: keepSettings ? $("#judge-choice")?.value : undefined,
  };
}
function restoreDrafts(drafts) {
  if (!drafts) return;
  for (const draft of drafts.forms) {
    const form = [...document.querySelectorAll("#app form")].find(
      (form) => formKey(form) === draft.key,
    );
    if (!form) continue;
    fields(form).forEach((el, i) => {
      const value = draft.values[i];
      if (!value) return;
      if (
        el.tagName !== "SELECT" ||
        [...el.options].some((option) => option.value === value.value)
      )
        el.value = value.value;
      if (el.type === "checkbox") el.checked = value.checked;
      if (value.focused) {
        el.focus({ preventScroll: true });
        try {
          el.setSelectionRange(value.start, value.end);
        } catch {}
      }
    });
  }
  const details = $("details.settings");
  if (details) details.open = drafts.settingsOpen;
  const judge = $("#judge-choice");
  if (
    judge &&
    [...judge.options].some((option) => option.value === drafts.judge)
  )
    judge.value = drafts.judge;
}
function render() {
  updateLanguage();
  // Presence and timer snapshots must not detach an active iframe/video.
  if (
    state?.phase === "watch" &&
    mediaKey === playbackKey() &&
    $("#media-slot")?.firstChild === mediaNode
  ) {
    $(".sidebar .card").innerHTML = playerList();
    updateTimer();
    return;
  }
  const scope = state ? `${state.code}:${state.round}:${state.phase}` : "";
  const settingsVersion = state ? JSON.stringify(state.settings) : "";
  const drafts =
    scope && scope === renderedScope
      ? captureDrafts(settingsVersion === renderedSettings)
      : null;
  renderedScope = scope;
  renderedSettings = settingsVersion;
  const oldMedia = mediaNode;
  if (!state) {
    $("#app").innerHTML = landing();
    $("#entry-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      enter("create", { name: $("#name").value, settings: { language: lang } });
    });
    $("#join")?.addEventListener("click", () =>
      enter("join", { name: $("#name").value, code: $("#code").value.trim() }),
    );
    $("#rejoin")?.addEventListener("click", () => enter("join", saved));
    $("#forget")?.addEventListener("click", reset);
    return;
  }
  $("#app").innerHTML =
    `${!socket.connected ? `<div class="connection-banner">${t("lost")}</div>` : ""}<div class="room-top"><div><div class="eyebrow">${t("room")}</div><span class="room-code">${state.code}</span></div><div class="actions"><button class="small" id="invite">${t("invite")}</button><button class="small ghost" id="leave">${t("leave")}</button></div></div><div class="room-layout"><aside class="sidebar"><div class="card">${playerList()}</div><div class="card"><h3>${t("rules")}</h3><p class="note">${t("rulesText")}</p></div></aside><section class="card stage"><div class="stage-header"><div><span class="eyebrow">${t("round")} ${String(state.round).padStart(2, "0")}</span><span class="phase-label">${t(state.phase)}</span></div><span id="timer" class="timer" role="timer"></span></div>${phaseContent()}</section></div>`;
  restoreDrafts(drafts);
  $("#invite").onclick = () => {
    const link = `${location.origin}/?room=${state.code}`;
    navigator.clipboard
      ?.writeText(link)
      .then(() => toast(t("copied")))
      .catch(() => toast(link)) || toast(link);
  };
  $("#leave").onclick = () => perform("leave");
  $("#start")?.addEventListener("click", () =>
    perform("start", { judgeId: $("#judge-choice")?.value }),
  );
  $("#settings-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    for (const k of [
      "promptSeconds",
      "promptCount",
      "submissionSeconds",
      "maxPlaySeconds",
    ])
      data[k] = Number(data[k]);
    for (const k of ["hostViewOnly", "tvMode", "autoFill"])
      data[k] = e.target.elements[k].checked;
    try {
      await command("settings", data);
      toast(t("saved"));
    } catch (err) {
      toast(copy[lang].errors[err.message]);
    }
  });
  document.querySelectorAll("[data-prompt]").forEach(
    (form) =>
      (form.onsubmit = (e) => {
        e.preventDefault();
        const p = state.choices.find((p) => p.id === form.dataset.prompt);
        perform("choose", {
          promptId: p.id,
          fills: state.settings.autoFill
            ? p.fills
            : [...form.querySelectorAll("[name=fill]")].map((s) => s.value),
        });
      }),
  );
  $("#submit-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#meme-url");
    const url = input.value;
    await perform("submit", { url });
  });
  document
    .querySelectorAll("[data-vote]")
    .forEach(
      (b) => (b.onclick = () => perform("vote", { id: b.dataset.vote })),
    );
  $("#skip")?.addEventListener("click", () => perform("skip"));
  if (state.phase === "watch") {
    const key = playbackKey();
    if (key !== mediaKey) {
      mediaKey = key;
      mediaNode = buildMedia();
    } else mediaNode = oldMedia;
    $("#media-slot").append(mediaNode);
    $("#unlock").onclick = () => {
      const v = mediaNode.querySelector("video");
      if (v) {
        v.muted = false;
        v.play().catch(() => toast(t("unlock")));
      } else if (mediaNode.querySelector("iframe")) {
        const frame = mediaNode.querySelector("iframe");
        if (state.current.platform === "youtube")
          for (const func of ["unMute", "playVideo"])
            frame.contentWindow.postMessage(
              JSON.stringify({ event: "command", func, args: [] }),
              "https://www.youtube.com",
            );
        if (state.current.platform === "tiktok")
          for (const type of ["unMute", "play"])
            frame.contentWindow.postMessage(
              { type, "x-tiktok-player": true },
              "https://www.tiktok.com",
            );
      } else {
        localPlayback = true;
        mediaKey = "";
        render();
      }
    };
  } else {
    mediaKey = "";
    mediaNode = null;
    localPlayback = false;
  }
  updateTimer();
}
function buildMedia() {
  const node = document.createElement("div");
  node.className = "player-screen";
  const c = state.current;
  const auto = !state.settings.tvMode || isHost() || localPlayback;
  if (!auto) {
    node.innerHTML = `<div class="center"><h2>${t("watchTv")}</h2><p>${t("watchTvText")}</p><button id="play-here">${t("playHere")}</button></div>`;
    node.querySelector("button").onclick = () => {
      localPlayback = true;
      mediaKey = "";
      render();
    };
    return node;
  }
  if (c.media) {
    const v = document.createElement("video");
    v.src = c.media;
    v.controls = true;
    v.playsInline = true;
    v.autoplay = true;
    v.loop = Boolean(c.duration < 15);
    v.addEventListener("loadedmetadata", () => {
      const elapsed = Math.max(
        0,
        (Date.now() + clockOffset - c.startedAt) / 1000,
      );
      if (elapsed > 0.5)
        v.currentTime = v.loop
          ? elapsed % v.duration
          : Math.min(elapsed, v.duration - 0.1);
      v.play().catch(() => toast(t("unlock")));
    });
    v.addEventListener("error", () => {
      node.replaceChildren(embed(c));
    });
    node.append(v);
  } else node.append(embed(c));
  return node;
}
function embed(c) {
  const wrap = document.createElement("div");
  wrap.className = "embed-stack";
  const frame = document.createElement("iframe");
  frame.title = `${t("meme")} ${c.number}`;
  frame.allow = "autoplay; fullscreen; encrypted-media";
  frame.allowFullscreen = true;
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  let id;
  if (c.platform === "youtube") {
    id = new URL(c.url).searchParams.get("v");
    const elapsed = Math.floor(
      Math.max(0, (Date.now() + clockOffset - c.startedAt) / 1000),
    );
    frame.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&loop=1&playlist=${id}&start=${elapsed}&origin=${encodeURIComponent(location.origin)}`;
    frame.onload = () => {
      frame.contentWindow.postMessage(
        JSON.stringify({ event: "listening", id: "whatdaduck" }),
        "https://www.youtube.com",
      );
      frame.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: "addEventListener",
          args: ["onReady"],
        }),
        "https://www.youtube.com",
      );
    };
  } else if (
    c.platform === "tiktok" &&
    (id = c.url.match(/\/video\/(\d+)/)?.[1])
  ) {
    frame.src = `https://www.tiktok.com/player/v1/${id}?autoplay=1&loop=1`;
  } else if (c.platform === "x") {
    id = c.url.match(/status\/(\d+)/)?.[1];
    frame.src = `https://platform.twitter.com/embed/Tweet.html?id=${id}&lang=${lang}`;
  } else if (c.platform === "reddit") {
    const u = new URL(c.url);
    frame.src =
      u.hostname === "redd.it"
        ? `https://www.redditmedia.com/comments/${u.pathname.slice(1)}/?ref_source=embed&ref=share&embed=true`
        : `https://www.redditmedia.com${u.pathname}?ref_source=embed&ref=share&embed=true`;
  }
  if (frame.src) wrap.append(frame);
  const a = document.createElement("a");
  a.href = c.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = t("source");
  wrap.append(a);
  return wrap;
}
// Official players report metadata through postMessage; only the host may adjust the shared timer.
window.addEventListener("message", (e) => {
  if (
    !state ||
    state.phase !== "watch" ||
    e.source !== mediaNode?.querySelector("iframe")?.contentWindow
  )
    return;
  let d = e.data;
  try {
    if (typeof d === "string") d = JSON.parse(d);
  } catch {
    return;
  }
  const youtubeDuration =
    e.origin === "https://www.youtube.com" && d?.event === "infoDelivery"
      ? Number(d.info?.duration)
      : 0;
  const tiktokDuration =
    e.origin === "https://www.tiktok.com" &&
    d?.["x-tiktok-player"] === true &&
    d.type === "onCurrentTime"
      ? Number(d.value?.duration)
      : 0;
  const duration = youtubeDuration || tiktokDuration;
  if (tiktokDuration > 0) {
    const frame = mediaNode.querySelector("iframe");
    if (!frame.dataset.synced) {
      frame.dataset.synced = "true";
      const elapsed = Math.max(
        0,
        (Date.now() + clockOffset - state.current.startedAt) / 1000,
      );
      if (elapsed > 0.5)
        frame.contentWindow.postMessage(
          {
            type: "seekTo",
            value:
              tiktokDuration < 15
                ? elapsed % tiktokDuration
                : Math.min(elapsed, tiktokDuration - 0.1),
            "x-tiktok-player": true,
          },
          "https://www.tiktok.com",
        );
    }
  }
  if (
    isHost() &&
    Number.isFinite(duration) &&
    duration > 0 &&
    !state.current.duration
  ) {
    state.current.duration = duration;
    perform("duration", {
      id: state.current.id,
      duration: state.current.duration,
    });
  }
});
function updateTimer() {
  if (!state) return;
  const el = $("#timer");
  if (el) {
    const sec = state.deadline
      ? Math.max(
          0,
          Math.ceil((state.deadline - Date.now() - clockOffset) / 1000),
        )
      : null;
    el.textContent =
      sec === null
        ? ""
        : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  }
  if ($("#skip"))
    $("#skip").disabled =
      Date.now() + clockOffset - state.current.startedAt < 15000;
}
setInterval(updateTimer, 250);
socket.on("state", (next) => {
  clockOffset = next.serverTime - Date.now();
  const sig = JSON.stringify({ ...next, serverTime: 0, touched: 0 });
  state = next;
  if (sig !== signature) {
    signature = sig;
    render();
  }
});
socket.on("connect", () => {
  updateLanguage();
  if (saved && !replaced) enter("join", saved);
  else render();
});
socket.on("disconnect", () => {
  updateLanguage();
  render();
});
socket.on("left", reset);
socket.on("replaced", () => {
  replaced = true;
  reset();
  toast(t("replaced"));
});
render();
socket.connect();
