import test from "node:test";
import assert from "node:assert/strict";
import { io } from "socket.io-client";
import { createApp } from "../src/server.js";
const connect = (url) =>
  new Promise((resolve) => {
    const s = io(url, { transports: ["websocket"], forceNew: true });
    s.on("connect", () => resolve(s));
  });
const cmd = (s, type, data = {}) =>
  s.timeout(3000).emitWithAck("command", { type, data });
const snapshot = (s) => new Promise((resolve) => s.once("state", resolve));
test("real sockets create, join, restore state, transfer host, and leave", async () => {
  const app = await createApp({
    port: 0,
    host: "127.0.0.1",
    prepare: async (url) => ({ url, status: "embed" }),
  });
  const url = `http://127.0.0.1:${app.port}`;
  const sockets = [];
  try {
    assert.equal((await fetch(url + "/health")).status, 200);
    assert.match(await (await fetch(url)).text(), /whatdaduck/);
    const h = await connect(url);
    sockets.push(h);
    const hs = snapshot(h);
    const room = await cmd(h, "create", { name: "Host" });
    const initial = await hs;
    assert.equal(room.ok, true);
    const p = await connect(url);
    sockets.push(p);
    const ps = snapshot(p);
    const seat = await cmd(p, "join", { code: room.code, name: "Player" });
    const joined = await ps;
    assert.equal(joined.players.length, 2);
    assert(!JSON.stringify(joined).includes(room.token));
    assert.equal((await cmd(p, "start")).error, "hostOnly");
    const round = snapshot(p);
    await cmd(h, "start");
    const active = await round;
    assert.equal(active.phase, "prompt");
    p.disconnect();
    const q = await connect(url);
    sockets.push(q);
    const restored = snapshot(q);
    const resumed = await cmd(q, "join", {
      code: room.code,
      token: seat.token,
    });
    assert.equal(resumed.token, seat.token);
    const state = await restored;
    assert.equal(state.me, joined.me);
    assert.equal(state.deadline, active.deadline);
    const transferred = snapshot(q);
    await cmd(h, "leave");
    const next = await transferred;
    assert.equal(next.hostId, state.me);
    assert.equal((await cmd(h, "start")).error, "sessionExpired");
  } finally {
    sockets.forEach((s) => s.disconnect());
    await app.close();
  }
});

test("configured public origin supports proxy Host rewriting and rejects foreign origins", async () => {
  const app = await createApp({
    port: 0,
    host: "127.0.0.1",
    publicOrigin: "https://whatdaduck.stoppedwumm.net",
    prepare: async (url) => ({ url, status: "embed" }),
  });
  const clients = [];
  const dial = (origin) =>
    new Promise((resolve) => {
      const s = io(`http://127.0.0.1:${app.port}`, {
        transports: ["websocket"],
        forceNew: true,
        reconnection: false,
        timeout: 2000,
        extraHeaders: { Origin: origin },
      });
      clients.push(s);
      s.once("connect", () => resolve(true));
      s.once("connect_error", () => resolve(false));
    });
  try {
    assert.equal(await dial("https://whatdaduck.stoppedwumm.net"), true);
    assert.equal(await dial("https://unrelated.example"), false);
    assert.equal(await dial(`http://127.0.0.1:${app.port}`), true);
  } finally {
    clients.forEach((s) => s.disconnect());
    await app.close();
  }
});
