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

for asset in \
  fonts/DSEG-LICENSE.txt \
  fonts/DSEG7Classic-Bold.ttf \
  fonts/INTER-LICENSE.txt \
  fonts/Inter-Bold.ttf \
  fonts/Inter-Regular.ttf \
  alarm/status-empty.png \
  alarm/status.png \
  interaction/tap.png; do
  if [ ! -f "$ASSET_DIR/$asset" ]; then
    echo "Missing required asset: $ASSET_DIR/$asset" >&2
    exit 1
  fi
done

alarm_icon_size=$(identify -format '%wx%h' "$ASSET_DIR/alarm/status.png")
alarm_empty_icon_size=$(identify -format '%wx%h' "$ASSET_DIR/alarm/status-empty.png")

if [ "$alarm_icon_size" != '28x28' ]; then
  echo "Alarm icon must be 28x28: $ASSET_DIR/alarm/status.png ($alarm_icon_size)" >&2
  exit 1
fi

if [ "$alarm_empty_icon_size" != '28x28' ]; then
  echo "Empty alarm icon must be 28x28: $ASSET_DIR/alarm/status-empty.png ($alarm_empty_icon_size)" >&2
  exit 1
fi

for name in cloud-drizzle cloud-fog cloud-hail cloud-lightning cloud-moon \
  cloud-moon-rain cloud-off cloud-rain cloud-rain-wind cloud-snow \
  cloud-sun cloud-sun-rain cloudy custom-sleet custom-thunder-hail \
  haze moon sun sunrise sunset tornado wind; do
  icon="weather/$name.png"

  if [ ! -f "$ASSET_DIR/$icon" ]; then
    echo "Missing required asset: $ASSET_DIR/$icon" >&2
    exit 1
  fi

  icon_size=$(identify -format '%wx%h' "$ASSET_DIR/$icon")

  if [ "$icon_size" != '28x28' ]; then
    echo "Icon must be 28x28: $ASSET_DIR/$icon ($icon_size)" >&2
    exit 1
  fi
done

zeus build -t "$TARGET"
