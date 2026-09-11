#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET=${ZEPP_TARGET:-480x480-amazfit-balance-2}
ASSET_DIR="$PROJECT_DIR/assets/$TARGET"

for executable in node jq zeus; do
  if ! command -v "$executable" >/dev/null 2>&1; then
    echo "Required command is not available: $executable" >&2
    exit 1
  fi
done

cd "$PROJECT_DIR"

node --check app.js
node --check watchface/index.js
jq empty app.json
jq -e '
  .direction == "design-system-to-repository" and
  .designSystem.provider == "penpot" and
  .designSystem.readOnly == true and
  .repository.target == "480x480-amazfit-balance-2" and
  .repository.designWidth == 480
' design/design-system.json >/dev/null
bash -n scripts/generate-watchface-assets.sh
bash -n scripts/dev-watchface.sh
bash -n scripts/create-visual-diff.sh

for group in normal/primary normal/seconds alarm date aod; do
  for digit in 0 1 2 3 4 5 6 7 8 9; do
    asset="$ASSET_DIR/$group/$digit.png"
    if [ ! -f "$asset" ]; then
      echo "Missing generated asset: $asset" >&2
      exit 1
    fi
  done
done

for asset in \
  normal/primary/colon.png \
  alarm/colon.png \
  date/dot.png \
  weather/thunder.png; do
  if [ ! -f "$ASSET_DIR/$asset" ]; then
    echo "Missing required asset: $ASSET_DIR/$asset" >&2
    exit 1
  fi
done

zeus build -t "$TARGET"
