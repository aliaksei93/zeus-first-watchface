#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PRIMARY_COLOR='#e6f4c7'

for target in \
  '480x480-amazfit-balance-2'; do
  asset_dir="$PROJECT_DIR/assets/$target"
  alarm_dir="$asset_dir/alarm"

  mkdir -p "$alarm_dir"

  magick "$alarm_dir/status.png" -channel RGB -fill "$PRIMARY_COLOR" \
    -colorize 100% -type TrueColorAlpha -define png:color-type=6 \
    "PNG32:$alarm_dir/status-empty.png"
done
