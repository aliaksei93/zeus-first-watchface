#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
INTER_FONT=${INTER_FONT:-$PROJECT_DIR/assets/480x480-amazfit-balance-2/fonts/Inter-Regular.ttf}
PRIMARY_COLOR='#e6f4c7'
BACKGROUND_COLOR='#000000'

if [ -z "$INTER_FONT" ] || [ ! -f "$INTER_FONT" ]; then
  echo "Inter Regular font is not available: $INTER_FONT" >&2
  exit 1
fi

render_glyph() {
  text=$1
  point_size=$2
  width=$3
  height=$4
  color=$5
  output=$6

  magick -background none -fill "$color" -font "$INTER_FONT" \
    -pointsize "$point_size" "label:$text" -gravity center \
    -extent "${width}x${height}" "$output"
}

render_padded_glyph() {
  text=$1
  point_size=$2
  width=$3
  height=$4
  color=$5
  output=$6

  magick -background none -fill "$color" -font "$INTER_FONT" \
    -pointsize "$point_size" "label:$text" -trim +repage -gravity center \
    -extent "${width}x${height}" "$output"
}

for target in \
  '480x480-amazfit-balance-2'; do
  asset_dir="$PROJECT_DIR/assets/$target"
  alarm_dir="$asset_dir/alarm"
  weather_dir="$asset_dir/weather"

  mkdir -p "$alarm_dir" "$weather_dir"

  for digit in 0 1 2 3 4 5 6 7 8 9; do
    render_padded_glyph "$digit" 22 14 22 "$PRIMARY_COLOR" "$alarm_dir/$digit.png"
    render_glyph "$digit" 22 13 22 "$PRIMARY_COLOR" "$weather_dir/$digit.png"
  done

  render_glyph ':' 22 7 22 "$PRIMARY_COLOR" "$alarm_dir/colon.png"
  magick "$alarm_dir/status.png" -channel RGB -fill "$PRIMARY_COLOR" \
    -colorize 100% -type TrueColorAlpha -define png:color-type=6 \
    "PNG32:$alarm_dir/status-empty.png"
  magick -size 163x30 "xc:$BACKGROUND_COLOR" "$alarm_dir/status.png" \
    -geometry +0+1 -composite -type TrueColorAlpha -define png:color-type=6 \
    "PNG32:$alarm_dir/status-active-row.png"
  render_glyph '+' 22 14 22 "$PRIMARY_COLOR" "$weather_dir/plus.png"
  render_glyph '-' 22 14 22 "$PRIMARY_COLOR" "$weather_dir/minus.png"
  render_padded_glyph '℃' 22 28 22 "$PRIMARY_COLOR" "$weather_dir/unit-c.png"
  render_padded_glyph '℉' 22 28 22 "$PRIMARY_COLOR" "$weather_dir/unit-f.png"
done
