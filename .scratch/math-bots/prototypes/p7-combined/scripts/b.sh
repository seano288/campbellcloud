#!/bin/zsh
# build + capture: b.sh 'query' name seconds [name seconds ...]
cd "$(dirname "$0")/.."
S=/private/tmp/claude-501/-Users-seancampbell--t3-worktrees-campbellcloud-t3-579a7c1d/2c8d5d7b-c0e9-4da9-8452-66f8dcfa7542/scratchpad
../../../../node_modules/.bin/vite build --config vite.config.mjs 2>&1 | grep -E "rror|built in" | head
Qs=$1; shift
BASE=http://localhost:5197/p7-combined/dist/ OUT=$S Q="$Qs" node scripts/shot.mjs "$@" 2>&1 | grep -v "404" | cut -c1-420 | tail -14
