import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMedia,
  isPublic,
  createDownloadProxy,
  createMedia,
} from "../src/media.js";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import net from "node:net";
test("accepts all four platforms and strips tracking parameters", () => {
  for (const [url, platform] of [
    ["https://www.youtube.com/shorts/abcdefghijk", "youtube"],
    ["https://youtu.be/abcdefghijk?t=2", "youtube"],
    ["https://x.com/person/status/12345?s=20", "x"],
    ["https://www.tiktok.com/@person/video/12345", "tiktok"],
    ["https://vm.tiktok.com/abc123/", "tiktok"],
    ["https://www.reddit.com/r/funny/comments/abcd12/a_funny_post/", "reddit"],
  ]) {
    assert.equal(parseMedia(url).platform, platform);
  }
  assert(!parseMedia("https://x.com/a/status/1?s=2").url.includes("?"));
});
test("rejects arbitrary hosts, credentials, protocols, ports, malformed post links", () => {
  for (const value of [
    "http://youtube.com/watch?v=abcdefghijk",
    "https://youtube.com.evil.test/watch?v=abcdefghijk",
    "https://youtube.com@127.0.0.1/",
    "file:///etc/passwd",
    "https://www.youtube.com:9090/watch?v=abcdefghijk",
    "https://www.youtube.com/playlist?list=123",
    "https://reddit.com/",
    "https://x.com/person",
    "not a url",
  ])
    assert.throws(() => parseMedia(value));
});
test("blocks loopback, private, link-local and mapped addresses", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "::1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fc00::1",
    "0.0.0.0",
  ])
    assert.equal(isPublic(ip), false, ip);
  assert.equal(isPublic("1.1.1.1"), true);
});
test("proxy refuses private HTTP and CONNECT targets", async () => {
  const proxy = await createDownloadProxy();
  try {
    const port = new URL(proxy.url).port;
    const status = await new Promise((resolve, reject) => {
      http
        .get({ host: "127.0.0.1", port, path: "http://127.0.0.1/" }, (res) => {
          res.resume();
          resolve(res.statusCode);
        })
        .on("error", reject);
    });
    assert.equal(status, 403);
    const connect = await new Promise((resolve, reject) => {
      const s = net.connect(port, "127.0.0.1", () =>
        s.write("CONNECT 127.0.0.1:443 HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n"),
      );
      s.on("data", (d) => {
        resolve(d.toString());
        s.destroy();
      });
      s.on("error", reject);
    });
    assert.match(connect, /403/);
  } finally {
    proxy.server.close();
  }
});
test("missing downloader gracefully falls back to an embed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "whatdaduck-"));
  try {
    const media = await createMedia({
      root,
      proxy: "http://127.0.0.1:1",
      downloader: "/nonexistent/yt-dlp",
    });
    const result = await media.prepare("https://youtu.be/abcdefghijk");
    assert.equal(result.status, "embed");
    assert.equal(result.platform, "youtube");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("successful downloads are probed and exposed as bounded local MP4s", async (t) => {
  const { execFileSync, spawnSync } = await import("node:child_process");
  const { writeFile } = await import("node:fs/promises");
  if (
    spawnSync("ffmpeg", ["-version"]).status !== 0 ||
    spawnSync("ffprobe", ["-version"]).status !== 0
  ) {
    t.skip("FFmpeg/ffprobe not installed");
    return;
  }
  const tmp = await mkdtemp(path.join(os.tmpdir(), "whatdaduck-download-"));
  try {
    const fixture = path.join(tmp, "fixture.mp4");
    execFileSync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=blue:s=64x64:d=1",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      fixture,
    ]);
    const downloader = path.join(tmp, "downloader");
    await writeFile(
      downloader,
      `#!/usr/bin/env node\nrequire('node:fs').copyFileSync(${JSON.stringify(fixture)}, 'clip.mp4');\n`,
      { mode: 0o755 },
    );
    const media = await createMedia({
      root: path.join(tmp, "cache"),
      proxy: "http://127.0.0.1:1",
      downloader,
    });
    const result = await media.prepare("https://youtu.be/abcdefghijk");
    assert.equal(result.status, "ready");
    assert.equal(result.platform, "youtube");
    assert.match(result.media, /^\/media\/[a-f0-9-]{36}\/clip.mp4$/);
    assert(result.duration >= 0.9 && result.duration <= 1.1);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
