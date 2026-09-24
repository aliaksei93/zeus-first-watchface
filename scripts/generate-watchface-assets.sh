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

for state in charging empty full low medium warning; do
  source="$SOURCE_DIR/$state.svg"
  output="$OUTPUT_DIR/$state.png"

  if [ ! -f "$source" ]; then
    echo "Missing battery source: $source" >&2
    exit 1
  fi

  magick -background none -density 288 "$source" \
    -resize 34x34 -gravity center -extent 34x34 "PNG32:$output"
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
