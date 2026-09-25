#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TARGET=${ZEPP_TARGET:-480x480-amazfit-balance-2}
SOURCE_DIR="$PROJECT_DIR/design/battery-icons"
OUTPUT_DIR="$PROJECT_DIR/assets/$TARGET/battery"
SUN_SOURCE_DIR="$PROJECT_DIR/design/weather-icons/upstream/tabler"
WEATHER_OUTPUT_DIR="$PROJECT_DIR/assets/$TARGET/weather"

if ! command -v magick >/dev/null 2>&1; then
  echo 'Required command is not available: magick' >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

for state in empty low medium high full; do
  source="$SOURCE_DIR/$state.svg"
  output="$OUTPUT_DIR/$state.png"

  if [ ! -f "$source" ]; then
    echo "Missing battery source: $source" >&2
    exit 1
  fi

  magick -background none -density 1152 "$source" \
    -filter Lanczos -resize 32x32 -gravity center -extent 32x32 \
    "PNG32:$output"
done

for name in sunrise sunset; do
  source="$SUN_SOURCE_DIR/$name.svg"
  output="$WEATHER_OUTPUT_DIR/$name.png"

  if [ ! -f "$source" ]; then
    echo "Missing sun source: $source" >&2
    exit 1
  fi

  magick -background none -density 288 "$source" \
    -resize 28x28 -gravity center -extent 28x28 \
    -channel RGB -fill '#F2C94C' -colorize 100 +channel "PNG32:$output"
done
