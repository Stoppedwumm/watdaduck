import test from "node:test";
import assert from "node:assert/strict";
import { Game, defaults, settings } from "../src/game.js";
function fixture(input = {}) {
  let now = 1000;
  const game = new Game({
    clock: () => now,
    prepare: async (url) => ({
      url,
      status: "ready",
      platform: "youtube",
      media: "/media/demo/clip.mp4",
      duration: 4,
    }),
  });
  const { room: r, player: host } = game.create("Host", input);
  const { player: p } = game.join(r.code, "Player");
  return { game, r, host, p, advance: (ms) => (now += ms) };
}
test("validates settings and protects host controls", () => {
  assert.equal(defaults.promptSeconds, 30);
  assert.equal(defaults.maxPlaySeconds, 90);
  assert.throws(() => settings({ maxPlaySeconds: 14 }));
  assert.throws(() => settings({ hostViewOnly: "true" }));
  const { game, r, p } = fixture();
  assert.throws(() => game.action(r, p.id, "settings", {}), /hostOnly/);
  assert.throws(() => game.start(r, p.id), /hostOnly/);
});
test("complete round, private choices and anonymous submissions, fixed 15 second minimum", async () => {
  const { game, r, host, p, advance } = fixture();
  game.start(r, host.id);
  const judge = r.judgeId;
  assert.equal(r.choices.length, 3);
  assert.equal(
    game.state(r, judge === host.id ? p.id : host.id).choices.length,
    0,
  );
  const prompt = r.choices[0];
  game.choose(r, judge, prompt.id, prompt.fills);
  assert(!r.prompt.includes("{player}"));
  await game.submit(r, host.id, "https://youtu.be/abcdefghijk");
  await game.submit(r, p.id, "https://youtu.be/abcdefghijk");
  assert.equal(r.phase, "watch");
  assert.equal(r.deadline - r.startedAt, 15000);
  const s = game.state(r, p.id);
  assert(!JSON.stringify(s).includes(host.token));
  assert(!s.current.playerId);
  assert.equal(s.queue, undefined);
  assert.throws(() => game.action(r, host.id, "skip"), /minimumPlay/);
  advance(15000);
  game.tick();
  advance(15000);
  game.tick();
  assert.equal(r.phase, "vote");
  game.vote(r, judge, r.queue[0].id);
  assert.equal(r.phase, "result");
  assert.equal(r.judgeId, null);
  assert.equal(
    r.players.reduce((n, p) => n + p.score, 0),
    1,
  );
  game.start(r, host.id);
  assert.notEqual(r.judgeId, judge);
});
test("rejoin keeps identity and returns the current phase and deadline", async () => {
  const { game, r, host, p } = fixture();
  game.start(r, host.id);
  const id = p.id;
  p.connected = false;
  const rejoin = game.join(r.code, "ignored", p.token);
  assert.equal(rejoin.player.id, id);
  assert.equal(rejoin.player.connected, true);
  assert.equal(game.state(r, id).deadline, r.deadline);
  assert.equal(game.state(r, id).phase, "prompt");
  game.leave(r, id);
  const fresh = game.join(r.code, "New seat", p.token);
  assert.notEqual(fresh.player.id, id);
});
test("view-only host cannot be crowned or submit, and can choose the judge", () => {
  const { game, r, host, p } = fixture({
    hostViewOnly: true,
    judgeMode: "host",
    autoFill: true,
  });
  const { player: q } = game.join(r.code, "Other");
  game.start(r, host.id, p.id);
  assert.equal(r.judgeId, p.id);
  const prompt = r.choices[0];
  game.choose(r, p.id, prompt.id, []);
  assert.equal(game.state(r, host.id).canSubmit, false);
  assert.equal(game.state(r, q.id).canSubmit, true);
  return assert.rejects(
    game.submit(r, host.id, "https://example.com"),
    /spectator/,
  );
});
test("mid-round join waits until next round and host leave transfers ownership", () => {
  const { game, r, host } = fixture();
  game.start(r, host.id);
  const { player: newcomer } = game.join(r.code, "Late");
  assert.equal(game.state(r, newcomer.id).canSubmit, false);
  game.leave(r, host.id);
  assert.notEqual(r.hostId, host.id);
  assert(r.hostId);
});
test("timeouts progress even when judge disconnects and pending downloads never enter playback", async () => {
  const { game, r, host, advance } = fixture();
  game.start(r, host.id);
  advance(30000);
  game.tick();
  assert.equal(r.phase, "submit");
  let finish;
  game.prepare = () => new Promise((resolve) => (finish = resolve));
  const pending = game.submit(r, host.id, "https://youtu.be/abcdefghijk");
  advance(90000);
  game.tick();
  assert.equal(r.phase, "result");
  finish({ url: "https://youtu.be/abcdefghijk", status: "embed" });
  await pending;
  assert.equal(r.phase, "result");
  assert.equal(r.queue.length, 0);
});
test("manual judge rejects prior ruler; settings locked during active round", () => {
  const { game, r, host, p } = fixture({ judgeMode: "host" });
  assert.throws(() => game.start(r, host.id), /chooseJudge/);
  game.start(r, host.id, p.id);
  assert.throws(
    () => game.action(r, host.id, "settings", { language: "de" }),
    /wrongPhase/,
  );
});
test("invalid submission can be retried and pending duplicate rejected", async () => {
  const { game, r, host } = fixture();
  game.start(r, host.id);
  const prompt = r.choices[0];
  game.choose(r, r.judgeId, prompt.id, prompt.fills);
  game.prepare = async () => {
    throw Error("bad");
  };
  await assert.rejects(game.submit(r, host.id, "bad"), /invalidUrl/);
  assert.equal(r.submissions.length, 0);
});
test("German prompts substitute the selected player names", () => {
  const { game, r, host, p } = fixture({ language: "de", promptCount: 10 });
  game.start(r, host.id);
  const prompt = r.choices.find((p) => p.de.includes("{player}"));
  assert(prompt);
  const fills = prompt.fills.map((_, i) => (i % 2 ? p.name : host.name));
  game.choose(r, r.judgeId, prompt.id, fills);
  assert(!r.prompt.includes("{player}"));
  assert(r.prompt.includes("Host"));
  assert.equal(r.phase, "submit");
});
test("vote timeout awards exactly one point and removes the crown", async () => {
  const { game, r, host, p, advance } = fixture();
  game.start(r, host.id);
  const prompt = r.choices[0];
  game.choose(r, r.judgeId, prompt.id, prompt.fills);
  await game.submit(r, host.id, "one");
  await game.submit(r, p.id, "two");
  advance(15000);
  game.tick();
  advance(15000);
  game.tick();
  assert.equal(r.phase, "vote");
  advance(60000);
  game.tick();
  assert.equal(r.phase, "result");
  assert.equal(r.judgeId, null);
  assert.equal(
    r.players.reduce((n, p) => n + p.score, 0),
    1,
  );
});
test("embedded metadata duration cannot exceed room maximum or lower the 15s minimum", async () => {
  const { game, r, host, p } = fixture();
  game.prepare = async (url) => ({ url, status: "embed" });
  game.start(r, host.id);
  const prompt = r.choices[0];
  game.choose(r, r.judgeId, prompt.id, prompt.fills);
  await game.submit(r, host.id, "one");
  await game.submit(r, p.id, "two");
  game.action(r, host.id, "duration", { id: r.queue[0].id, duration: 2 });
  assert.equal(r.deadline - r.startedAt, 15000);
  assert.equal(game.state(r, host.id).current.duration, 2);
  game.action(r, host.id, "duration", { id: r.queue[0].id, duration: 9999 });
  assert.equal(r.deadline - r.startedAt, 90000);
  assert.throws(
    () => game.action(r, p.id, "duration", { id: r.queue[0].id, duration: 1 }),
    /hostOnly/,
  );
});
