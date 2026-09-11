#!/usr/bin/env bash

set -eu

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  echo 'Usage: create-visual-diff.sh <reference.png> <simulator.png> [output.png]' >&2
  exit 1
fi

if ! command -v magick >/dev/null 2>&1; then
  echo 'ImageMagick command "magick" is required.' >&2
  exit 1
fi

REFERENCE=$1
ACTUAL=$2
OUTPUT=${3:-/tmp/retro-digital-watchface/visual-diff.png}

for image in "$REFERENCE" "$ACTUAL"; do
  if [ ! -f "$image" ]; then
    echo "Image does not exist: $image" >&2
    exit 1
  fi
done

reference_size=$(magick identify -format '%wx%h' "$REFERENCE")
actual_size=$(magick identify -format '%wx%h' "$ACTUAL")

if [ "$reference_size" != "$actual_size" ]; then
  echo "Image sizes differ: Reference=$reference_size Simulator=$actual_size" >&2
  exit 1
fi

output_dir=$(dirname -- "$OUTPUT")
mkdir -p "$output_dir"

temp_dir=$(mktemp -d /tmp/retro-digital-visual-diff.XXXXXX)
trap 'rm -rf "$temp_dir"' EXIT

difference="$temp_dir/difference.png"
magick "$REFERENCE" "$ACTUAL" -compose difference -composite "$difference"
magick "$REFERENCE" "$ACTUAL" "$difference" +append "$OUTPUT"

differing_pixels=$(magick compare -metric AE "$REFERENCE" "$ACTUAL" null: 2>&1 || true)
echo "Visual diff: $OUTPUT"
echo "Differing pixels: $differing_pixels"
