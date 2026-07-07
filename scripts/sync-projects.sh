#!/usr/bin/env bash
# Sync embedded project snapshots from their source repos.
# The copies under projects/ are deploy artifacts — NEVER edit them here.
# Develop in the source repo, then run this script and commit the result.
set -euo pipefail
cd "$(dirname "$0")/.."

sync_eclipse() {
  local src="../eclipse-sim"
  local dst="projects/eclipse"
  local commit
  commit=$(git -C "$src" rev-parse --short HEAD)
  rm -rf "$dst"
  mkdir -p "$dst"
  cp "$src/index.html" "$dst/"
  cp -r "$src/src" "$dst/src"
  printf "source: https://github.com/hornof/eclipse-sim\ncommit: %s\nsynced: %s\nrule: deploy artifact — do not edit; run scripts/sync-projects.sh\n" \
    "$commit" "$(date -u +%Y-%m-%dT%H:%MZ)" > "$dst/PROVENANCE.txt"
  echo "eclipse: synced at $commit"
}

sync_eclipse
