import { chromium } from "playwright";
import { createApp } from "../src/server.js";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const tmp = await mkdtemp(path.join(os.tmpdir(), "whatdaduck-browser-"));
const fixture = path.join(tmp, "fixture.mp4");
await mkdir("artifacts", { recursive: true });
execFileSync("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-f",
  "lavfi",
  "-i",
  "color=c=0x294c3e:s=640x360:d=2",
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:duration=2",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-shortest",
  fixture,
]);
const app = await createApp({
  port: 0,
  host: "127.0.0.1",
  prepare: async (url) => ({
    url,
    platform: "youtube",
    status: "ready",
    media: "/fixture.mp4",
    duration: 2,
  }),
});
app.app.get("/fixture.mp4", (_req, res) => res.sendFile(fixture));
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
} catch (e) {
  await app.close();
  await rm(tmp, { recursive: true, force: true });
  throw e;
}
const errors = [];
try {
  const hostContext = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      locale: "en-GB",
    }),
    phoneContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      locale: "de-DE",
    });
  const host = await hostContext.newPage(),
    phone = await phoneContext.newPage(),
    guestContext = await browser.newContext({ locale: "en-GB" }),
    guest = await guestContext.newPage();
  for (const p of [host, phone, guest])
    p.on("pageerror", (e) => errors.push(e.message));
  const url = `http://127.0.0.1:${app.port}`;
  await host.goto(url);
  await host.screenshot({
    path: "artifacts/whatdaduck-landing.png",
    fullPage: true,
  });
  await host.locator("#name").fill("The Host");
  await host.locator("#create").click();
  await host.locator("#invite").waitFor();
  const room = [...app.game.rooms.values()][0];
  await phone.goto(`${url}/?room=${room.code}`);
  await phone.locator("#name").fill("Player Zwei");
  await phone.locator("#join").click();
  await phone.locator("#leave").waitFor();
  await guest.goto(`${url}/?room=${room.code}`);
  await guest.locator("#name").fill("Third Player");
  await guest.locator("#join").click();
  await guest.locator("#leave").waitFor();
  await host.locator("summary").click();
  await host.locator("[name=judgeMode]").selectOption("host");
  await host.locator("[name=promptCount]").fill("10");
  const visitor = app.game.join(room.code, "Visitor").player;
  app.game.emit(room);
  await host.getByText("Visitor", { exact: true }).waitFor();
  assert.equal(await host.locator("[name=judgeMode]").inputValue(), "host");
  assert.equal(await host.locator("[name=promptCount]").inputValue(), "10");
  assert.equal(
    await host.locator("details.settings").evaluate((el) => el.open),
    true,
  );
  app.game.leave(room, visitor.id);
  await host.locator("#settings-form button").click();
  await host.locator("#judge-choice").selectOption(room.hostId);
  await host.locator("#start").click();
  await host.locator("[data-prompt]").first().waitFor();
  await host.screenshot({
    path: "artifacts/whatdaduck-prompts.png",
    fullPage: true,
  });
  const promptForm = host
    .locator("[data-prompt]")
    .filter({ has: host.locator("select") })
    .first();
  const names = promptForm.locator("select");
  await names.first().selectOption("Player Zwei");
  const visitor2 = app.game.join(room.code, "Visitor two").player;
  app.game.emit(room);
  await host
    .locator(".sidebar")
    .getByText("Visitor two", { exact: true })
    .waitFor();
  assert.equal(await names.first().inputValue(), "Player Zwei");
  app.game.leave(room, visitor2.id);
  await promptForm.locator("button").click();
  await phone.locator("#meme-url").fill("https://youtu.be/abcdefghijk");
  await phone.locator("#meme-url").focus();
  assert.equal(await host.locator("#submit-form").count(), 0);
  await host
    .getByText(
      "You’re the Memeinator: you choose the winner and cannot submit a meme. Waiting for the players’ memes.",
      { exact: true },
    )
    .waitFor();
  const forged = await host.evaluate(() =>
    socket.emitWithAck("command", {
      type: "submit",
      data: { url: "https://youtu.be/abcdefghijk" },
    }),
  );
  assert.equal(forged.error, "judgeCannotSubmit");
  await guest.locator("#meme-url").fill("https://youtu.be/abcdefghijk");
  await guest.locator("#submit-form button").click();
  await phone.waitForFunction(() =>
    document.querySelector(".progress-list")?.textContent.includes("Abgegeben"),
  );
  assert.equal(
    await phone.locator("#meme-url").inputValue(),
    "https://youtu.be/abcdefghijk",
  );
  assert.equal(
    await phone
      .locator("#meme-url")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await phone.locator("#submit-form button").click();
  await host.locator("video").waitFor();
  await phone.locator("#play-here").waitFor();
  assert.equal(await phone.locator("video").count(), 0);
  assert.equal(await host.locator("video").evaluate((v) => v.loop), true);
  assert.equal(room.deadline - room.startedAt, 15000);
  await host.screenshot({
    path: "artifacts/whatdaduck-watch.png",
    fullPage: true,
  });
  await phone.screenshot({
    path: "artifacts/whatdaduck-phone.png",
    fullPage: true,
  });
  const id = room.players.find((p) => p.name === "Player Zwei").id;
  await host.evaluate(() => {
    window.originalVideo = document.querySelector("video");
  });
  await phone.reload();
  await phone.locator("#play-here").waitFor();
  assert.equal(room.players.filter((p) => !p.left).length, 3);
  assert.equal(room.players.find((p) => p.id === id).connected, true);
  assert.equal(
    await host.evaluate(
      () => window.originalVideo === document.querySelector("video"),
    ),
    true,
  );
  const colors = await phone.locator("#play-here").evaluate((el) => ({
    text: getComputedStyle(el).color,
    background: getComputedStyle(el).backgroundColor,
  }));
  assert.notEqual(colors.text, colors.background);
  await phone.locator("#play-here").click();
  await phone.locator("video").waitFor();
  room.startedAt = Date.now() - 15500;
  room.deadline = Date.now() - 1;
  app.game.tick();
  await host.waitForFunction(
    () => document.querySelector(".eyebrow")?.textContent,
  );
  room.startedAt = Date.now() - 15500;
  room.deadline = Date.now() - 1;
  app.game.tick();
  await host.locator("[data-vote]").first().waitFor();
  await host.locator("[data-vote]").first().click();
  await host.locator("#start").waitFor();
  assert.equal(room.phase, "result");
  assert.equal(
    room.players.reduce((sum, p) => sum + p.score, 0),
    1,
  );
  await host.screenshot({
    path: "artifacts/whatdaduck-result.png",
    fullPage: true,
  });
  await phone.locator("#leave").click();
  await phone.locator("#name").waitFor();
  assert.equal(
    await phone.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Browser smoke passed: EN/DE, host settings, prompt, submit, TV mode, 15s looping, refresh/rejoin, local playback, vote, result, leave; no page errors.",
  );
} finally {
  await browser.close();
  await app.close();
  await rm(tmp, { recursive: true, force: true });
}
