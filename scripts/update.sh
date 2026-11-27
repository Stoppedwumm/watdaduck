#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/whatdaduck}"
APP_BRANCH="${APP_BRANCH:-main}"
if [[ $EUID -ne 0 ]]; then echo 'Run with sudo bash scripts/update.sh'; exit 1; fi
cd "$APP_DIR"
[[ -z $(git status --porcelain --untracked-files=no) ]] || { echo 'Local changes found. Commit or stash them before updating.'; exit 1; }
[[ $(git branch --show-current) == "$APP_BRANCH" ]] || { echo "Expected branch $APP_BRANCH; set APP_BRANCH to update another branch."; exit 1; }
git fetch origin
# Refuse diverged histories before stopping the live process.
git merge-base --is-ancestor HEAD "origin/$APP_BRANCH"
OLD_REV="$(git rev-parse HEAD)"
restore() {
  echo "Update failed. Restoring $OLD_REV."
  git reset --hard "$OLD_REV"
  npm ci --omit=dev
  systemctl restart whatdaduck.service
}
systemctl stop whatdaduck.service
trap restore ERR
git merge --ff-only "origin/$APP_BRANCH"
npm ci
npm run check
npm test
/opt/whatdaduck-tools/bin/pip install --upgrade 'yt-dlp[default]'
npm prune --omit=dev
systemctl restart whatdaduck.service
sleep 2
systemctl is-active --quiet whatdaduck.service
curl -fsS "http://127.0.0.1:$(sed -n 's/^PORT=//p' /etc/whatdaduck.env)/health"
trap - ERR
echo 'Update complete. Active rooms restart with the service.'
