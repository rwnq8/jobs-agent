#!/usr/bin/env bash
# DEPLOY-SYNC-1: worker/ here is the source; QNFO/qnfo-workers qnfo-jobsearch/ is the canonical-deploy copy. Opens (or updates) one sync PR there.
# Needs GH_TOKEN with write access to QNFO/qnfo-workers (secret QNFO_SYNC_TOKEN). Usage: scripts/sync_to_qnfo_workers.sh
set -euo pipefail
SRC="$(cd "$(dirname "$0")/.." && pwd)/worker"
BR="sync/jobs-agent"
WORK="$(mktemp -d)"
gh repo clone QNFO/qnfo-workers "$WORK/qw" -- --depth 1 -q
cd "$WORK/qw"
git checkout -q -B "$BR"
rsync -a --delete --exclude node_modules "$SRC"/ qnfo-jobsearch/
cmp -s qnfo-jobsearch/worker.js qnfo-jobsearch/deployed-current.worker.js || cp qnfo-jobsearch/worker.js qnfo-jobsearch/deployed-current.worker.js
git add -A qnfo-jobsearch
git diff --cached --quiet && { echo "qnfo-jobsearch already in sync"; exit 0; }
V=$(grep -m1 -oE 'var VERSION = "[^"]*"' qnfo-jobsearch/worker.js | sed -E 's/.*"(.*)"/\1/')
git -c user.name=jobs-agent-sync -c user.email=sync@users.noreply.github.com commit -q -m "qnfo-jobsearch $V: sync from rwnq8/jobs-agent"
git push -q -f origin "$BR"
gh pr view "$BR" --repo QNFO/qnfo-workers >/dev/null 2>&1 || gh pr create --repo QNFO/qnfo-workers --head "$BR" --title "qnfo-jobsearch $V: sync from rwnq8/jobs-agent" --body "work-claim: unreachable; sync PR from rwnq8/jobs-agent worker/. probes: none (sync of an already-probed worker)"
