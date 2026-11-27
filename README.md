# whatdaduck

An online meme party game for 2–20 players. One Node.js server, phones for players, an optional shared TV, and absolutely questionable taste. Runs on **port 9090**, without Docker.

Play at **[whatdaduck.stoppedwumm.net](https://whatdaduck.stoppedwumm.net)**. The Node.js service still listens on port 9090 behind your HTTPS reverse proxy.

## Play

1. Host a party and share its six-character room code or invitation link.
2. Configure the room. The host can play or be a view-only TV operator.
3. A randomly crowned **Memeinator** chooses one of three JSON-defined prompts in 30 seconds. Alternatively, the host chooses the Memeinator. The previous ruler cannot be chosen for the next round.
4. Prompts with `{player}` blanks let the Memeinator select player names, or the room can fill them automatically.
**Special card:** After the prompt is chosen, **Random Bullshit Go!** plays the bundled 11.68-second cutscene once. The submission timer starts only afterward. TV mode and reconnect position apply to the cutscene; it does not use the 15-second meme loop rule.

5. All playing participants except the Memeinator submit one YouTube, TikTok, X/Twitter, or Reddit post link. The Memeinator only chooses the prompt and judges the memes; they cannot submit. The other players submit within 90 seconds by default. Players joining mid-round start playing next round.
6. The server attempts a bounded yt-dlp download for each submission and serves a local MP4. If extraction, conversion, capacity or downloading fails, the game uses a platform embed with an original-link fallback.
7. Watch the memes in shuffled, anonymous order. TV mode defaults to **on**: only the host device starts playback automatically. Other devices can explicitly opt into local playback.
8. Each meme gets at least **15 seconds**. Downloaded clips shorter than that loop; longer clips stop at their duration or the room maximum, whichever comes first. The default maximum is **90 seconds**. The 15-second minimum cannot be changed.
9. The Memeinator chooses the best meme, awarding its submitter one point, and is dethroned. The host starts the next round.

The UI is available in English and German independently on each device. The host separately selects the language used for prompts.

## Run locally

Requires Node.js **22 or newer** and npm. For local MP4 playback, also install FFmpeg (including ffprobe), Python 3 and a current yt-dlp:

```sh
git clone https://github.com/Stoppedwumm/watdaduck.git
cd watdaduck
npm ci
python3 -m venv .venv
.venv/bin/pip install 'yt-dlp[default]'
YTDLP_PATH="$PWD/.venv/bin/yt-dlp" npm start
```

Open `http://localhost:9090`. Other devices on the same network use `http://YOUR-SERVER-IP:9090`. Node is explicitly enabled as yt-dlp's JavaScript runtime for YouTube extraction. Without yt-dlp/ffprobe the game still works using embeds.

Environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `9090` | HTTP and Socket.IO port |
| `HOST` | `0.0.0.0` | Listen address |
| `PUBLIC_ORIGIN` | unset (installer sets `https://whatdaduck.stoppedwumm.net`) | Explicit public origin allowed for proxied Socket.IO connections |
| `YTDLP_PATH` | `yt-dlp` | Downloader executable |
| `DISABLE_DOWNLOADS` | unset | Set `1` for embed-only mode |

## Install as a service (Debian / Ubuntu)

Run from the repository checkout:

```sh
sudo bash scripts/install.sh
```

The installer pulls the latest `main`, installs system dependencies and Node 22 when needed, installs an isolated yt-dlp environment, runs checks and tests, and enables the `whatdaduck` systemd service. The process runs as an unprivileged service account. The application lives at `/opt/whatdaduck`; environment settings live in `/etc/whatdaduck.env`. Install commands require root; the game does not.

To install a feature branch before it is merged:

```sh
sudo env APP_BRANCH=feat/whatdaduck-party-game bash scripts/install.sh
```

To update, pull the latest changes, reinstall dependencies and restart:

```sh
sudo bash /opt/whatdaduck/scripts/update.sh
```

When following a feature branch, pass the same `APP_BRANCH` to the update script. `APP_DIR` overrides the installation directory for both scripts. The updater refuses tracked local changes or divergent history, runs validation before restarting, and restores the previous application commit if the update fails. Restarts and updates end existing rooms; tell players before updating. Environment settings and the media cache are preserved.

```sh
sudo systemctl status whatdaduck
sudo journalctl -u whatdaduck -f
sudo systemctl restart whatdaduck
```

For `https://whatdaduck.stoppedwumm.net`, point DNS to your server and forward HTTPS requests to `127.0.0.1:9090`, including WebSocket upgrades. A Caddy configuration is included in `deploy/Caddyfile` (requires Caddy installed separately). Invitation links use the browser's current origin, so they automatically use the public domain when opened there.

The installer sets `PUBLIC_ORIGIN=https://whatdaduck.stoppedwumm.net` for new installations. For an existing installation, add that line to `/etc/whatdaduck.env` and restart the service. This lets Socket.IO accept the public domain even if a proxy rewrites the upstream Host header; arbitrary forwarded headers are not trusted.

For LAN-only use, open TCP 9090 in your firewall. A single process owns all rooms; multiple workers need a shared state implementation and are not supported.

## Reconnect and room behavior

- A random private seat token is saved in browser local storage. Refreshes and network disconnects restore the same player, score, role, round, selected prompt, submission status, current meme and server deadline.
- Downloaded playback seeks to the current shared playback position on rejoin. The server owns phase transitions; reconnects never restart timers.
- Opening the same seat in another tab replaces the old connection. Use separate browsers/profiles for separate players on one device.
- **Leave** abandons the seat. If the host leaves, a connected remaining player becomes host. Disconnecting keeps the host's seat reserved so it can rejoin.
- If the Memeinator explicitly leaves, an available player takes over. If a prompt times out, the first offered prompt is selected with valid player names. A missing vote is resolved by a random draw after 60 seconds.
- Rooms with no connected players expire after 30 minutes. Other inactive rooms expire after six hours. Scores and rooms are held in memory, so restarting the service clears them.
- Room settings can be edited between rounds. Maximum 20 seats; spectators count toward the seat limit. A view-only host requires at least two other connected players.

## Media behavior and limits

Public video/post URLs only. YouTube watch/shorts/youtu.be, X/Twitter status, TikTok video/share and Reddit post/share URLs are accepted. Share links are resolved before embedding where possible. Arbitrary download URLs, credentials, non-HTTPS inputs and custom ports are rejected.

Downloads have a 65-second timeout, a 70 MB declared file limit, an 80 MB disk watchdog, a 720p format preference, a ten-minute source-duration filter, and at most three concurrent jobs. The cache has a 2 GiB admission budget and files expire after eight hours. A public-address-only local HTTP/CONNECT proxy resolves and pins downloader connections to prevent requests to private or metadata addresses, including redirects. FFmpeg is used for local remuxing/probing. The game does not provide a general-purpose public proxy.

Platforms can block downloads or embeds, require sign-in/consent, disable embedding, or change their APIs. Original links remain available when this happens. Browsers can block autoplay with sound; use **Enable sound / play**, or the embedded player's controls, on the TV. External embeds cannot offer the same timing guarantees as local files: YouTube and TikTok report duration when available and support looping, while X/Reddit and unresolved share links may require manual playback. All embeds still use the server's bounded watch timer. Reliable automatic short-clip looping is guaranteed for downloaded media; third-party pages control their own players.

## Customize prompts

Edit `data/prompts.json` and restart. Each entry has a unique `id`, an `en` string and a `de` string. Each `{player}` placeholder becomes a player-name selector:

```json
{
  "id": "weekend",
  "en": "{player}'s and {player}'s favorite activity on the weekend",
  "de": "Die Lieblingsbeschäftigung von {player} und {player} am Wochenende"
}
```

Keep the number of placeholders consistent between translations. The sample pack contains 16 prompts; prompt-choice counts are bounded by the pack size and a maximum of ten.

## Development and checks

```sh
npm ci
npm run check
npm test
bash -n scripts/install.sh scripts/update.sh
npx playwright install chromium
npm run test:browser
npm run dev
```

Tests cover the full round state machine, authority checks, settings validation, hidden player tokens, anonymous playback, fixed short-clip timing, prompt/submission timeouts, late downloads, spectator eligibility, reconnect snapshots, host transfer, URL parsing, public-IP checks, proxy denial and downloader failure fallback. The socket integration test starts a real server with multiple clients. The browser smoke test uses a generated two-second MP4 and English desktop / German phone sessions to verify settings, the complete round, TV-only autoplay, fixed looping, rejoin during playback, voting and leaving. GitHub Actions runs the checks and browser test on Node 22 and uploads screenshots. Live third-party platform availability is not exercised by the fixture-based tests.
