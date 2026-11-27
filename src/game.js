import { randomBytes, randomInt, randomUUID } from "node:crypto";
import prompts from "../data/prompts.json" with { type: "json" };

export const defaults = {
  language: "en",
  hostViewOnly: false,
  tvMode: true,
  judgeMode: "random",
  autoFill: false,
  promptSeconds: 30,
  promptCount: 3,
  submissionSeconds: 90,
  maxPlaySeconds: 90,
};
const fail = (code) => {
  throw new Error(code);
};
function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function settings(input = {}, previous = defaults) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("invalidSettings");
  const out = { ...previous };
  for (const key of ["hostViewOnly", "tvMode", "autoFill"])
    if (key in input) {
      if (typeof input[key] !== "boolean") fail("invalidSettings");
      out[key] = input[key];
    }
  for (const [key, choices] of Object.entries({
    language: ["en", "de"],
    judgeMode: ["random", "host"],
  }))
    if (key in input) {
      if (!choices.includes(input[key])) fail("invalidSettings");
      out[key] = input[key];
    }
  for (const [key, min, max] of [
    ["promptSeconds", 10, 180],
    ["promptCount", 1, Math.min(10, prompts.length)],
    ["submissionSeconds", 15, 600],
    ["maxPlaySeconds", 15, 600],
  ])
    if (key in input) {
      if (!Number.isInteger(input[key]) || input[key] < min || input[key] > max)
        fail("invalidSettings");
      out[key] = input[key];
    }
  return out;
}
export class Game {
  constructor({
    broadcast = () => {},
    prepare = async (url) => ({ url, status: "embed" }),
    clock = Date.now,
  } = {}) {
    this.rooms = new Map();
    this.broadcast = broadcast;
    this.prepare = prepare;
    this.clock = clock;
  }
  player(name) {
    if (typeof name !== "string" || !name.trim() || name.trim().length > 24)
      fail("invalidName");
    return {
      id: randomUUID(),
      token: randomBytes(32).toString("hex"),
      name: name.trim(),
      score: 0,
      connected: true,
      left: false,
    };
  }
  create(name, input) {
    if (this.rooms.size >= 200) fail("serverFull");
    let code;
    do {
      code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
    } while (this.rooms.has(code));
    const p = this.player(name);
    const room = {
      code,
      hostId: p.id,
      players: [p],
      settings: settings(input),
      phase: "lobby",
      round: 0,
      judgeId: null,
      previousJudgeId: null,
      submissions: [],
      queue: [],
      index: 0,
      deadline: null,
      touched: this.clock(),
    };
    this.rooms.set(code, room);
    return { room, player: p };
  }
  join(code, name, token) {
    const room = this.rooms.get(String(code).toUpperCase());
    if (!room) fail("roomMissing");
    let p = token && room.players.find((p) => p.token === token && !p.left);
    if (!p) {
      if (room.players.filter((p) => !p.left).length >= 20) fail("roomFull");
      p = this.player(name);
      room.players.push(p);
    }
    p.connected = true;
    room.touched = this.clock();
    return { room, player: p };
  }
  active(r) {
    return r.players.filter(
      (p) => !p.left && !(r.settings.hostViewOnly && p.id === r.hostId),
    );
  }
  host(r, id) {
    if (r.hostId !== id) fail("hostOnly");
  }
  emit(r) {
    r.touched = this.clock();
    this.broadcast(r);
  }
  state(r, id) {
    const { players, submissions, choices, ...rest } = r;
    delete rest.roundPlayers;
    return {
      ...rest,
      canSubmit: Boolean(
        r.roundPlayers?.includes(id) && this.active(r).some((p) => p.id === id),
      ),
      serverTime: this.clock(),
      me: id,
      players: players.filter((p) => !p.left).map(({ token, ...p }) => p),
      choices: r.phase === "prompt" && id === r.judgeId ? choices : [],
      submitted: submissions
        .filter((s) => s.status !== "pending")
        .map((s) => s.playerId),
      mySubmission: submissions.find((s) => s.playerId === id)?.status || null,
      current: r.phase === "watch" ? this.current(r) : null,
      candidates: ["vote", "result"].includes(r.phase)
        ? r.queue.map((s) => ({ id: s.id, playerId: s.playerId, url: s.url }))
        : [],
      queue: undefined,
    };
  }
  start(r, id, judgeId) {
    this.host(r, id);
    if (!["lobby", "result"].includes(r.phase)) fail("wrongPhase");
    if (this.active(r).filter((p) => p.connected).length < 2)
      fail("needPlayers");
    this.round(r, judgeId);
  }
  round(r, judgeId) {
    const all = this.active(r).filter((p) => p.connected);
    if (all.length < 2) {
      r.phase = "lobby";
      r.deadline = null;
      this.emit(r);
      return;
    }
    let eligible = all.filter((p) => p.id !== r.previousJudgeId);
    if (!eligible.length) eligible = all;
    if (
      r.settings.judgeMode === "host" &&
      !eligible.some((p) => p.id === judgeId)
    )
      fail("chooseJudge");
    r.judgeId =
      r.settings.judgeMode === "host"
        ? judgeId
        : eligible[randomInt(eligible.length)].id;
    r.previousJudgeId = r.judgeId;
    r.round++;
    r.roundPlayers = all.map((p) => p.id);
    r.phase = "prompt";
    r.prompt = null;
    r.winnerId = null;
    r.submissions = [];
    r.queue = [];
    r.index = 0;
    r.choices = shuffled(prompts)
      .slice(0, r.settings.promptCount)
      .map((p) => ({
        ...p,
        fills: this.fillNames(
          r,
          (p[r.settings.language].match(/\{player\}/g) || []).length,
        ),
      }));
    r.deadline = this.clock() + r.settings.promptSeconds * 1000;
    this.emit(r);
  }
  fillNames(r, n) {
    const names = this.active(r).map((p) => p.name);
    return Array.from({ length: n }, (_, i) => names[i % names.length]);
  }
  choose(r, id, promptId, fills = []) {
    if (r.phase !== "prompt") fail("wrongPhase");
    if (r.judgeId !== id) fail("judgeOnly");
    const p = r.choices.find((p) => p.id === promptId);
    if (!p) fail("invalidPrompt");
    const count = (p[r.settings.language].match(/\{player\}/g) || []).length;
    const names = r.settings.autoFill ? this.fillNames(r, count) : fills;
    if (
      !Array.isArray(names) ||
      names.length !== count ||
      names.some((n) => !this.active(r).some((p) => p.name === n))
    )
      fail("invalidNames");
    let i = 0;
    r.prompt = p[r.settings.language].replace(/\{player\}/g, () => names[i++]);
    r.phase = "submit";
    r.deadline = this.clock() + r.settings.submissionSeconds * 1000;
    this.emit(r);
  }
  async submit(r, id, url) {
    if (r.phase !== "submit") fail("wrongPhase");
    if (
      !r.roundPlayers.includes(id) ||
      !this.active(r).some((p) => p.id === id)
    )
      fail("spectator");
    if (r.submissions.some((s) => s.playerId === id)) fail("alreadySubmitted");
    const s = { id: randomUUID(), playerId: id, status: "pending", url };
    r.submissions.push(s);
    const round = r.round;
    this.emit(r);
    try {
      Object.assign(s, await this.prepare(url));
    } catch {
      r.submissions = r.submissions.filter((x) => x !== s);
      this.emit(r);
      fail("invalidUrl");
    }
    if (r.round !== round || r.phase !== "submit") return;
    this.emit(r);
    if (
      r.roundPlayers.every(
        (id) =>
          !this.active(r).some((p) => p.id === id) ||
          r.submissions.some(
            (s) => s.playerId === id && s.status !== "pending",
          ),
      )
    )
      this.watch(r);
  }
  watch(r) {
    r.queue = shuffled(
      r.submissions.filter(
        (s) =>
          s.status !== "pending" &&
          !r.players.find((p) => p.id === s.playerId)?.left,
      ),
    );
    r.index = 0;
    if (!r.queue.length) {
      r.phase = "result";
      r.deadline = null;
      r.judgeId = null;
      this.emit(r);
      return;
    }
    r.phase = "watch";
    this.play(r);
  }
  current(r) {
    const s = r.queue[r.index];
    return s
      ? {
          id: s.id,
          url: s.url,
          platform: s.platform,
          media: s.media,
          duration: s.duration,
          status: s.status,
          startedAt: r.startedAt,
          endsAt: r.deadline,
          number: r.index + 1,
          total: r.queue.length,
        }
      : null;
  }
  play(r) {
    const s = r.queue[r.index];
    r.startedAt = this.clock();
    r.deadline =
      r.startedAt +
      Math.min(
        r.settings.maxPlaySeconds,
        Math.max(15, s.duration || r.settings.maxPlaySeconds),
      ) *
        1000;
    this.emit(r);
  }
  next(r) {
    if (++r.index < r.queue.length) this.play(r);
    else {
      r.phase = "vote";
      r.deadline = this.clock() + 60000;
      this.emit(r);
    }
  }
  vote(r, id, submissionId) {
    if (r.phase !== "vote") fail("wrongPhase");
    if (id !== r.judgeId) fail("judgeOnly");
    const winner = r.queue.find((s) => s.id === submissionId);
    if (!winner) fail("invalidVote");
    r.winnerId = winner.playerId;
    const p = r.players.find((p) => p.id === winner.playerId);
    if (p) p.score++;
    r.phase = "result";
    r.judgeId = null;
    r.deadline = null;
    this.emit(r);
  }
  action(r, id, type, data = {}) {
    if (!r.players.some((p) => p.id === id && !p.left)) fail("sessionExpired");
    switch (type) {
      case "settings":
        this.host(r, id);
        if (!["lobby", "result"].includes(r.phase)) fail("wrongPhase");
        r.settings = settings(data, r.settings);
        this.emit(r);
        break;
      case "start":
        this.start(r, id, data.judgeId);
        break;
      case "choose":
        this.choose(r, id, data.promptId, data.fills);
        break;
      case "submit":
        return this.submit(r, id, data.url);
      case "skip":
        this.host(r, id);
        if (r.phase !== "watch") fail("wrongPhase");
        if (this.clock() - r.startedAt < 15000) fail("minimumPlay");
        this.next(r);
        break;
      case "duration":
        this.host(r, id);
        if (
          r.phase !== "watch" ||
          data.id !== r.queue[r.index]?.id ||
          !Number.isFinite(data.duration) ||
          data.duration <= 0
        )
          break;
        r.queue[r.index].duration = data.duration;
        r.deadline =
          r.startedAt +
          Math.min(r.settings.maxPlaySeconds, Math.max(15, data.duration)) *
            1000;
        this.emit(r);
        break;
      case "vote":
        this.vote(r, id, data.id);
        break;
      case "leave":
        this.leave(r, id);
        break;
      default:
        fail("invalidAction");
    }
  }
  leave(r, id) {
    const p = r.players.find((p) => p.id === id);
    p.left = true;
    p.connected = false;
    if (r.hostId === id)
      r.hostId =
        r.players.find((p) => !p.left && p.connected)?.id ||
        r.players.find((p) => !p.left)?.id;
    if (!r.hostId) {
      this.rooms.delete(r.code);
      return;
    }
    if (r.judgeId === id) {
      const replacement = this.active(r).find((p) => p.connected);
      r.judgeId = replacement?.id;
      r.previousJudgeId = replacement?.id;
      if (!replacement) {
        r.phase = "lobby";
        r.deadline = null;
      }
    }
    if (r.phase === "prompt")
      for (const prompt of r.choices) {
        prompt.fills = this.fillNames(
          r,
          (prompt[r.settings.language].match(/\{player\}/g) || []).length,
        );
      }
    this.emit(r);
  }
  tick() {
    for (const r of this.rooms.values()) {
      if (
        this.clock() - r.touched > 6 * 3600000 ||
        (!r.players.some((p) => p.connected) &&
          this.clock() - r.touched > 30 * 60000)
      ) {
        this.rooms.delete(r.code);
        continue;
      }
      if (!r.deadline || this.clock() < r.deadline) continue;
      if (r.phase === "prompt") {
        const p = r.choices[0];
        const fills = this.fillNames(
          r,
          (p[r.settings.language].match(/\{player\}/g) || []).length,
        );
        this.choose(r, r.judgeId, p.id, fills);
      } else if (r.phase === "submit") this.watch(r);
      else if (r.phase === "watch") this.next(r);
      else if (r.phase === "vote")
        this.vote(r, r.judgeId, r.queue[randomInt(r.queue.length)].id);
    }
  }
}
