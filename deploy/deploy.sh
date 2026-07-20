#!/usr/bin/env bash
#
# FHA Placement — VPS deploy script.
#
# Pulls the latest master, installs dependencies, rebuilds the Next.js app, and
# restarts the PM2 process. Intended to be invoked by the n8n auto-deploy
# workflow (GitHub push -> n8n webhook -> SSH -> this script), but it is also
# safe to run by hand over SSH.
#
# It is idempotent and guards against overlapping runs with a lock file so two
# near-simultaneous pushes can't rebuild on top of each other.
#
# One-time setup on the VPS:
#   1. Copy this script to the server (or just run it from the repo checkout).
#   2. chmod +x deploy/deploy.sh
#   3. Set APP_DIR below (or export it in the environment) to the repo path.
#
set -euo pipefail

# Absolute path to the deployed repo on the VPS. Override by exporting APP_DIR.
APP_DIR="${APP_DIR:-/docker/fha-placement}"
PM2_PROCESS="${PM2_PROCESS:-fha-placement}"
BRANCH="${DEPLOY_BRANCH:-master}"
LOCK_FILE="/tmp/fha-placement-deploy.lock"
LOG_TAG="[fha-deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)]"

log() { echo "$LOG_TAG $*"; }

# Prevent concurrent deploys.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deploy is already running — exiting."
  exit 0
fi

cd "$APP_DIR"

log "Fetching latest $BRANCH…"
git fetch --quiet origin "$BRANCH"

LOCAL_REV="$(git rev-parse HEAD)"
REMOTE_REV="$(git rev-parse "origin/$BRANCH")"

if [ "$LOCAL_REV" = "$REMOTE_REV" ]; then
  log "Already up to date at ${LOCAL_REV:0:8}; nothing to deploy."
  exit 0
fi

log "Deploying ${LOCAL_REV:0:8} -> ${REMOTE_REV:0:8}"
git reset --hard "origin/$BRANCH"

# Use npm ci for reproducible installs when the lockfile is present.
if [ -f package-lock.json ]; then
  log "Installing dependencies (npm ci)…"
  npm ci
else
  log "Installing dependencies (npm install)…"
  npm install
fi

log "Building…"
npm run build

log "Restarting PM2 process '$PM2_PROCESS'…"
pm2 restart "$PM2_PROCESS" --update-env

log "Deploy complete at ${REMOTE_REV:0:8}."
