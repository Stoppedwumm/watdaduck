import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Game } from "./game.js";
import { createDownloadProxy, createMedia } from "./media.js";

export async function createApp({
  prepare,
  port = Number(process.env.PORT || 9090),
  host = process.env.HOST || "0.0.0.0",
  publicOrigin = process.env.PUBLIC_ORIGIN,
} = {}) {
  const configuredOrigin = publicOrigin ? new URL(publicOrigin).origin : null;
  const proxy = prepare ? null : await createDownloadProxy();
  const media = prepare ? null : await createMedia({ proxy: proxy.url });
  const app = express(),
    server = createServer(app),
    io = new Server(server, {
      maxHttpBufferSize: 8192,
      allowRequest: (req, done) => {
        const origin = req.headers.origin;
        try {
          done(
            null,
            !origin ||
              new URL(origin).host === req.headers.host ||
              new URL(origin).origin === configuredOrigin,
          );
        } catch {
          done(null, false);
        }
      },
    });
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "SAMEORIGIN",
    });
    next();
  });
  app.get("/health", (_req, res) => res.json({ ok: true }));
  if (media)
    app.get("/media/:id/clip.mp4", (req, res) => {
      if (!/^[a-f0-9-]{36}$/.test(req.params.id)) return res.sendStatus(404);
      res
        .type("video/mp4")
        .sendFile(path.join(media.root, req.params.id, "clip.mp4"));
    });
  app.use(express.static(fileURLToPath(new URL("../public", import.meta.url))));
  const sessions = new Map();
  const game = new Game({
    prepare: prepare || media.prepare,
    broadcast: (r) => {
      for (const [socketId, s] of sessions) {
        if (s.room === r) {
          const sock = io.sockets.sockets.get(socketId);
          if (sock) sock.emit("state", game.state(r, s.player.id));
        }
      }
    },
  });
  const joins = new Map();
  io.on("connection", (socket) => {
    let count = 0,
      window = Date.now();
    socket.on("command", async (payload, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        if (Date.now() - window > 10000) {
          count = 0;
          window = Date.now();
        }
        if (++count > 40) throw new Error("rateLimit");
        if (!payload || typeof payload !== "object")
          throw new Error("invalidAction");
        const { type, data = {} } = payload;
        if (!data || typeof data !== "object" || Array.isArray(data))
          throw new Error("invalidAction");
        if (["create", "join"].includes(type)) {
          if (sessions.has(socket.id)) throw new Error("alreadyJoined");
          const ip = socket.handshake.address,
            limit = joins.get(ip) || { at: Date.now(), count: 0 };
          if (Date.now() - limit.at > 60000) {
            limit.at = Date.now();
            limit.count = 0;
          }
          if (++limit.count > 30) throw new Error("rateLimit");
          joins.set(ip, limit);
          const result =
            type === "create"
              ? game.create(data.name, data.settings)
              : game.join(data.code, data.name, data.token);
          // A reconnect replaces the old transport without marking the player offline.
          for (const [sid, s] of sessions)
            if (s.player === result.player) {
              sessions.delete(sid);
              io.sockets.sockets.get(sid)?.emit("replaced");
              io.sockets.sockets.get(sid)?.disconnect(true);
            }
          sessions.set(socket.id, result);
          reply({
            ok: true,
            token: result.player.token,
            code: result.room.code,
          });
          game.emit(result.room);
          return;
        }
        const s = sessions.get(socket.id);
        if (!s || !game.rooms.has(s.room.code))
          throw new Error("sessionExpired");
        await game.action(s.room, s.player.id, type, data);
        if (type === "leave") {
          sessions.delete(socket.id);
          socket.emit("left");
        }
        reply({ ok: true });
      } catch (e) {
        reply({ ok: false, error: e.message });
      }
    });
    socket.on("disconnect", () => {
      const s = sessions.get(socket.id);
      sessions.delete(socket.id);
      if (s) {
        s.player.connected = false;
        game.emit(s.room);
      }
    });
  });
  const timer = setInterval(() => {
    game.tick();
    for (const [ip, l] of joins)
      if (Date.now() - l.at > 60000) joins.delete(ip);
  }, 250);
  const cleaner = media
    ? setInterval(() => media.cleanup().catch(console.error), 3600000)
    : null;
  await media?.cleanup();
  await new Promise((resolve) => server.listen(port, host, resolve));
  return {
    app,
    server,
    io,
    game,
    port: server.address().port,
    close: async () => {
      clearInterval(timer);
      clearInterval(cleaner);
      await new Promise((resolve) => io.close(resolve));
      proxy?.server.close();
    },
  };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const app = await createApp();
  console.log(`whatdaduck listening on port ${app.port}`);
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, async () => {
      await app.close();
      process.exit(0);
    });
}
