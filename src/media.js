import { spawn } from "node:child_process";
import { mkdir, readdir, stat, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

export function parseMedia(value) {
  if (typeof value !== "string" || value.length > 2048)
    throw new Error("invalidUrl");
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    (u.port && u.port !== "443")
  )
    throw new Error("invalidUrl");
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  let platform, id;
  if (["youtube.com", "m.youtube.com", "youtu.be"].includes(host)) {
    platform = "youtube";
    id =
      host === "youtu.be"
        ? u.pathname.slice(1)
        : u.searchParams.get("v") ||
          u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1];
    if (!/^[\w-]{11}$/.test(id || "")) throw new Error("invalidUrl");
    return { platform, id, url: `https://www.youtube.com/watch?v=${id}` };
  }
  if (["x.com", "twitter.com", "mobile.twitter.com"].includes(host)) {
    platform = "x";
    id = u.pathname.match(/^\/(?:[\w]+|i\/web)\/status\/(\d+)\/?$/)?.[1];
  }
  if (["tiktok.com", "m.tiktok.com"].includes(host)) {
    platform = "tiktok";
    id = u.pathname.match(/^\/@[\w.-]+\/video\/(\d+)\/?$/)?.[1];
  }
  if (
    ["vm.tiktok.com", "vt.tiktok.com"].includes(host) &&
    /^\/[\w-]+\/?$/.test(u.pathname)
  ) {
    platform = "tiktok";
    id = "short";
  }
  if (
    ["reddit.com", "old.reddit.com", "m.reddit.com"].includes(host) &&
    /^\/r\/[\w]+\/s\/[\w]+\/?$/.test(u.pathname)
  ) {
    platform = "reddit";
    id = "short";
  } else if (["reddit.com", "old.reddit.com", "m.reddit.com"].includes(host)) {
    platform = "reddit";
    id = u.pathname.match(
      /^\/r\/[\w]+\/comments\/([a-z0-9]+)(?:\/[\w-]+)?\/?$/i,
    )?.[1];
  }
  if (host === "redd.it") {
    platform = "reddit";
    id = u.pathname.match(/^\/([a-z0-9]+)\/?$/i)?.[1];
  }
  if (!platform || !id) throw new Error("invalidUrl");
  u.hash = "";
  u.search = "";
  return { platform, id, url: u.href };
}
export function isPublic(address) {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}
async function publicAddress(host) {
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => !isPublic(a.address)))
    throw new Error("Private address");
  return addresses[0];
}
// Every downloader HTTP request/CONNECT is resolved and pinned to a public IP.
// This also applies to redirects and CDN URLs extracted from submitted pages.
async function resolveSharedLink(parsed) {
  if (parsed.id !== "short" && !parsed.url.startsWith("https://redd.it/"))
    return parsed;
  let url = parsed.url;
  for (let i = 0; i < 3; i++) {
    const u = new URL(url);
    if (
      u.protocol !== "https:" ||
      (u.port && u.port !== "443") ||
      u.username ||
      u.password
    )
      throw new Error("Redirect");
    const a = await publicAddress(u.hostname);
    const location = await new Promise((resolve, reject) => {
      const req = https.request(
        u,
        {
          method: "HEAD",
          lookup: (_host, options, cb) =>
            options.all ? cb(null, [a]) : cb(null, a.address, a.family),
        },
        (res) => {
          res.resume();
          resolve(
            res.statusCode >= 300 && res.statusCode < 400
              ? res.headers.location
              : null,
          );
        },
      );
      req.setTimeout(3000, () => req.destroy(new Error("Timeout")));
      req.on("error", reject);
      req.end();
    });
    if (!location) break;
    url = new URL(location, u).href;
  }
  const result = parseMedia(url);
  if (result.id === "short") throw new Error("Unresolved share link");
  return result;
}
export async function createDownloadProxy() {
  const server = http.createServer(async (req, res) => {
    let upstream;
    try {
      const u = new URL(req.url);
      if (u.protocol !== "http:" || (u.port && u.port !== "80"))
        throw new Error("Protocol");
      const a = await publicAddress(u.hostname);
      upstream = http.request(
        {
          host: a.address,
          family: a.family,
          port: 80,
          path: u.pathname + u.search,
          method: req.method,
          headers: { ...req.headers, host: u.host },
        },
        (r) => {
          res.writeHead(r.statusCode, r.headers);
          r.pipe(res);
        },
      );
      upstream.on("error", () => res.destroy());
      req.pipe(upstream);
    } catch {
      res.writeHead(403);
      res.end();
    }
    req.on("error", () => upstream?.destroy());
  });
  server.on("connect", async (req, client, head) => {
    try {
      const u = new URL(`https://${req.url}`);
      if (u.port && u.port !== "443") throw new Error("Port");
      const a = await publicAddress(u.hostname);
      const remote = net.connect(
        { host: a.address, family: a.family, port: 443 },
        () => {
          client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
          if (head.length) remote.write(head);
          remote.pipe(client);
          client.pipe(remote);
        },
      );
      remote.setTimeout(20000, () => remote.destroy());
      remote.on("error", () => client.destroy());
      client.on("error", () => remote.destroy());
      client.on("close", () => remote.destroy());
    } catch {
      client.end("HTTP/1.1 403 Forbidden\r\n\r\n");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
function run(command, args, { timeout = 60000, cwd, onSpawn } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });
    onSpawn?.(child);
    let output = "";
    const kill = () => {
      try {
        if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
        else child.kill("SIGKILL");
      } catch {}
    };
    const timer = setTimeout(kill, timeout);
    child.stdout.on("data", (d) => {
      output += d;
      if (output.length > 1024 * 1024) kill();
    });
    child.stderr.resume();
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0 ? resolve(output) : reject(new Error("Download failed"));
    });
  });
}
export async function createMedia({
  root = path.resolve("cache"),
  proxy,
  downloader = process.env.YTDLP_PATH || "yt-dlp",
} = {}) {
  await mkdir(root, { recursive: true });
  let active = 0;
  const maxBytes = 80 * 1024 * 1024;
  async function prepare(value) {
    let parsed = parseMedia(value);
    try {
      parsed = await resolveSharedLink(parsed);
    } catch {}
    const fallback = { ...parsed, status: "embed" };
    if (active >= 3 || process.env.DISABLE_DOWNLOADS === "1") return fallback;
    active++;
    const key = randomUUID(),
      dir = path.join(root, key);
    try {
      let total = 0;
      for (const folder of await readdir(root)) {
        for (const f of await readdir(path.join(root, folder))) {
          total += (await stat(path.join(root, folder, f))).size;
        }
      }
      if (total + active * maxBytes > 2 * 1024 ** 3) {
        active--;
        return fallback;
      }
      await mkdir(dir);
    } catch {
      active--;
      return fallback;
    }
    let child;
    const monitor = setInterval(async () => {
      try {
        const files = await readdir(dir);
        let total = 0;
        for (const f of files) total += (await stat(path.join(dir, f))).size;
        if (total > maxBytes && child?.pid) {
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {
            child.kill();
          }
        }
      } catch {}
    }, 500);
    try {
      await run(
        downloader,
        [
          "--ignore-config",
          "--js-runtimes",
          "node",
          "--no-playlist",
          "--no-warnings",
          "--no-progress",
          "--socket-timeout",
          "15",
          "--retries",
          "1",
          "--fragment-retries",
          "1",
          "--max-filesize",
          "70M",
          "--match-filters",
          "!is_live & duration <=? 600",
          "--format",
          "best[ext=mp4][height<=720]/best[height<=720]",
          "--merge-output-format",
          "mp4",
          "--remux-video",
          "mp4",
          "--downloader",
          "native",
          "--hls-prefer-native",
          "--proxy",
          proxy,
          "--output",
          "clip.%(ext)s",
          "--",
          parsed.url,
        ],
        { cwd: dir, timeout: 65000, onSpawn: (c) => (child = c) },
      );
      const file = path.join(dir, "clip.mp4");
      if ((await stat(file)).size > maxBytes) throw new Error("Size");
      const probe = JSON.parse(
        await run(
          "ffprobe",
          ["-v", "quiet", "-show_format", "-show_streams", "-of", "json", file],
          { timeout: 5000 },
        ),
      );
      const duration = Number(probe.format?.duration);
      if (
        !Number.isFinite(duration) ||
        duration <= 0 ||
        !probe.streams?.some((s) => s.codec_type === "video")
      )
        throw new Error("Invalid media");
      return {
        ...parsed,
        status: "ready",
        media: `/media/${key}/clip.mp4`,
        duration,
      };
    } catch {
      await rm(dir, { recursive: true, force: true });
      return fallback;
    } finally {
      clearInterval(monitor);
      active--;
    }
  }
  async function cleanup() {
    for (const dir of await readdir(root)) {
      try {
        const p = path.join(root, dir);
        if (Date.now() - (await stat(p)).mtimeMs > 8 * 3600000)
          await rm(p, { recursive: true, force: true });
      } catch {}
    }
  }
  return { prepare, cleanup, root };
}
