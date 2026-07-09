#!/usr/bin/env bash
# Sync embedded project snapshots from their source repos.
# The copies under projects/ are deploy artifacts — NEVER edit them here.
# Develop in the source repo, then run this script and commit the result.
#
# Source repos are expected as SIBLING checkouts next to this repo:
#   ../eclipse-sim   → github.com/hornof/eclipse-sim
# Override the location with an env var if yours lives elsewhere:
#   ECLIPSE_SIM_SRC=/path/to/eclipse-sim ./scripts/sync-projects.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Warn-only freshness check: is the deployed snapshot behind its source? This
# never fails the script (informational). A source that isn't checked out just
# skips the check rather than erroring.
check_freshness() {
  local name="$1" src="$2" provenance="$3"
  if [ ! -d "$src/.git" ]; then
    echo "freshness[$name]: source '$src' not checked out — skipping check"
    return 0
  fi
  local pinned head
  pinned=$(grep -m1 '^commit:' "$provenance" 2>/dev/null | awk '{print $2}' || true)
  head=$(git -C "$src" rev-parse --short HEAD)
  if [ -z "$pinned" ]; then
    echo "freshness[$name]: no pinned commit in $provenance (first sync?)"
  elif [ "$pinned" = "$head" ]; then
    echo "freshness[$name]: up to date (pinned $pinned == source HEAD)"
  else
    echo "freshness[$name]: WARNING — snapshot pins $pinned but source HEAD is $head; snapshot is stale, re-syncing to update"
  fi
}

sync_eclipse() {
  local src="${ECLIPSE_SIM_SRC:-../eclipse-sim}"
  # public/ is the Astro passthrough zone — the eclipse snapshot moved here in the
  # Astro migration; the old "projects/eclipse" path synced to a stray repo-root dir.
  local dst="public/projects/eclipse"
  check_freshness eclipse "$src" "$dst/PROVENANCE.txt"
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
