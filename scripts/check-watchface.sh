#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET=${ZEPP_TARGET:-480x480-amazfit-balance-2}
ASSET_DIR="$PROJECT_DIR/assets/$TARGET"

for executable in node jq sha256sum stat zeus identify; do
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
node --check scripts/zeus-preview-utils.mjs
node --check scripts/preview-release.mjs
node --check scripts/preview-zab.mjs

for manifest in "$PROJECT_DIR"/releases/v*/release.json; do
  if [ ! -e "$manifest" ]; then
    continue
  fi

  release_dir=$(dirname -- "$manifest")
  release_name=$(basename -- "$release_dir")
  artifact_name=$(jq -er '
    select(
      .schemaVersion == 1 and
      .build.mode == "preview" and
      .target == "480x480-amazfit-balance-2" and
      (.artifact.sha256 | type == "string" and test("^[0-9a-f]{64}$")) and
      (.artifact.sizeBytes | type == "number" and . > 0) and
      (.app.version.name | type == "string" and length > 0) and
      (.app.version.code | type == "number" and . > 0)
    ) |
    .artifact.file
  ' "$manifest")
  manifest_version=$(jq -er '.app.version.name' "$manifest")

  if [ "$release_name" != "v$manifest_version" ]; then
    echo "Release directory and manifest version differ: $release_dir" >&2
    exit 1
  fi

  case "$artifact_name" in
    */*)
      echo "Release artifact must be in its manifest directory: $artifact_name" >&2
      exit 1
      ;;
  esac

  if [ ! -f "$release_dir/$artifact_name" ]; then
    echo "Missing release artifact: $release_dir/$artifact_name" >&2
    exit 1
  fi

  if [ ! -f "$release_dir/SHA256SUMS" ]; then
    echo "Missing release checksum file: $release_dir/SHA256SUMS" >&2
    exit 1
  fi

  expected_sha256=$(jq -er '.artifact.sha256' "$manifest")
  actual_sha256=$(sha256sum "$release_dir/$artifact_name" | awk '{print $1}')
  expected_size=$(jq -er '.artifact.sizeBytes' "$manifest")
  actual_size=$(stat -c '%s' "$release_dir/$artifact_name")

  if [ "$actual_sha256" != "$expected_sha256" ]; then
    echo "Release checksum mismatch: $release_dir/$artifact_name" >&2
    exit 1
  fi

  if [ "$actual_size" != "$expected_size" ]; then
    echo "Release size mismatch: $release_dir/$artifact_name" >&2
    exit 1
  fi

  (cd "$release_dir" && sha256sum -c SHA256SUMS)
done

for group in alarm weather; do
  for digit in 0 1 2 3 4 5 6 7 8 9; do
    asset="$ASSET_DIR/$group/$digit.png"
    if [ ! -f "$asset" ]; then
      echo "Missing generated asset: $asset" >&2
      exit 1
    fi
  done
done

for asset in \
  fonts/DSEG-LICENSE.txt \
  fonts/DSEG7Classic-Bold.ttf \
  fonts/INTER-LICENSE.txt \
  fonts/Inter-Bold.ttf \
  fonts/Inter-Regular.ttf \
  alarm/status.png \
  alarm/colon.png \
  weather/atmosphere.png \
  weather/cloudy.png \
  weather/heavy-rain.png \
  weather/night.png \
  weather/rain.png \
  weather/snow.png \
  weather/sunny.png \
  weather/thunder.png \
  weather/unknown.png; do
  if [ ! -f "$ASSET_DIR/$asset" ]; then
    echo "Missing required asset: $ASSET_DIR/$asset" >&2
    exit 1
  fi
done

for icon in alarm/status.png weather/atmosphere.png weather/cloudy.png \
  weather/heavy-rain.png weather/night.png weather/rain.png weather/snow.png \
  weather/sunny.png weather/thunder.png weather/unknown.png; do
  icon_size=$(identify -format '%wx%h' "$ASSET_DIR/$icon")

  if [ "$icon_size" != '28x28' ]; then
    echo "Icon must be 28x28: $ASSET_DIR/$icon ($icon_size)" >&2
    exit 1
  fi
done

zeus build -t "$TARGET"
