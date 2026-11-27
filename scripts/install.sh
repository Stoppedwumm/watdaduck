#!/usr/bin/env bash
set -euo pipefail
# Debian/Ubuntu + systemd. Run as root. No Docker required.
APP_DIR="${APP_DIR:-/opt/whatdaduck}"
APP_BRANCH="${APP_BRANCH:-main}"
APP_REPO="${APP_REPO:-https://github.com/Stoppedwumm/watdaduck.git}"
if [[ $EUID -ne 0 ]]; then echo 'Run with sudo bash scripts/install.sh'; exit 1; fi
if ! command -v apt-get >/dev/null || ! command -v systemctl >/dev/null; then echo 'This installer requires Debian/Ubuntu with systemd.'; exit 1; fi
[[ "$APP_DIR" =~ ^/[a-zA-Z0-9/_-]+$ ]] || { echo 'APP_DIR must be an absolute path without spaces.'; exit 1; }
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg git ffmpeg python3-venv
if ! command -v node >/dev/null || [[ $(node -p 'Number(process.versions.node.split(".")[0])') -lt 22 ]]; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key -o /tmp/whatdaduck-nodesource.key
  gpg --dearmor --yes -o /etc/apt/keyrings/whatdaduck-nodesource.gpg /tmp/whatdaduck-nodesource.key
  rm /tmp/whatdaduck-nodesource.key
  echo 'deb [signed-by=/etc/apt/keyrings/whatdaduck-nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main' > /etc/apt/sources.list.d/whatdaduck-node.list
  apt-get update
  apt-get install -y nodejs
fi
command -v npm >/dev/null || apt-get install -y npm
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$APP_BRANCH" -- "$APP_REPO" "$APP_DIR"
else
  [[ -z $(git -C "$APP_DIR" status --porcelain --untracked-files=no) ]] || { echo 'Local changes found. Commit or stash them before installing.'; exit 1; }
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$APP_BRANCH"
  git -C "$APP_DIR" merge --ff-only "origin/$APP_BRANCH"
fi
python3 -m venv /opt/whatdaduck-tools
/opt/whatdaduck-tools/bin/pip install --upgrade 'yt-dlp[default]'
cd "$APP_DIR"
npm ci
npm run check
npm test
npm prune --omit=dev
id whatdaduck >/dev/null 2>&1 || useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin whatdaduck
install -d -o whatdaduck -g whatdaduck -m 0750 "$APP_DIR/cache"
if [[ ! -f /etc/whatdaduck.env ]]; then
  cat > /etc/whatdaduck.env <<ENV
PORT=9090
HOST=0.0.0.0
PUBLIC_ORIGIN=https://whatdaduck.stoppedwumm.net
YTDLP_PATH=/opt/whatdaduck-tools/bin/yt-dlp
NODE_ENV=production
ENV
  chmod 0640 /etc/whatdaduck.env
fi
NODE_BIN="$(command -v node)"
cat > /etc/systemd/system/whatdaduck.service <<UNIT
[Unit]
Description=whatdaduck online meme party game
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=whatdaduck
Group=whatdaduck
WorkingDirectory=$APP_DIR
EnvironmentFile=/etc/whatdaduck.env
ExecStart=$NODE_BIN $APP_DIR/src/server.js
Restart=on-failure
RestartSec=3
TimeoutStopSec=15
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR/cache
UMask=0027
TasksMax=128
MemoryMax=1G

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable whatdaduck.service
systemctl restart whatdaduck.service
sleep 2
systemctl is-active --quiet whatdaduck.service
printf 'whatdaduck is running on port 9090.\nUpdate: sudo bash %s/scripts/update.sh\nLogs: journalctl -u whatdaduck -f\n' "$APP_DIR"
