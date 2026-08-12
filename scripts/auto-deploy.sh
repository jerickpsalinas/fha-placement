#!/bin/bash
# Polls origin/claude/git-pull-sc192y for new commits; if found, pulls,
# rebuilds, and restarts the PM2 process. Run on a cron schedule.
set -e
cd "$(dirname "$0")/.."

BRANCH="claude/git-pull-sc192y"

git fetch origin "$BRANCH" --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "$(date): new commits found, deploying..."
git pull origin "$BRANCH"
npm install
npm run build
pm2 restart fha-placement
echo "$(date): deploy complete."
