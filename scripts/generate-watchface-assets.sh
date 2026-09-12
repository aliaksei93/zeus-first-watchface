#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
INTER_FONT=${INTER_FONT:-}
PRIMARY_COLOR='#e6f4c7'
SECONDARY_COLOR='#9eae91'

if [ -z "$INTER_FONT" ] || [ ! -f "$INTER_FONT" ]; then
  echo 'Set INTER_FONT to the Inter Regular TTF path.' >&2
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

for target in \
  '480x480-amazfit-balance-2'; do
  asset_dir="$PROJECT_DIR/assets/$target"
  alarm_dir="$asset_dir/alarm"
  date_dir="$asset_dir/date"
  weather_dir="$asset_dir/weather"

  mkdir -p "$alarm_dir" "$date_dir" "$weather_dir"

  for digit in 0 1 2 3 4 5 6 7 8 9; do
    render_glyph "$digit" 22 13 22 "$PRIMARY_COLOR" "$alarm_dir/$digit.png"
    render_glyph "$digit" 28 17 28 "$PRIMARY_COLOR" "$date_dir/$digit.png"
    render_glyph "$digit" 22 13 22 "$PRIMARY_COLOR" "$weather_dir/$digit.png"
  done

  render_glyph ':' 22 7 22 "$PRIMARY_COLOR" "$alarm_dir/colon.png"
  render_glyph '.' 28 8 28 "$PRIMARY_COLOR" "$date_dir/dot.png"
  render_glyph 'MON ' 28 77 28 "$PRIMARY_COLOR" "$date_dir/weekday-mon.png"
  render_glyph 'TUE ' 28 65 28 "$PRIMARY_COLOR" "$date_dir/weekday-tue.png"
  render_glyph 'WED ' 28 74 28 "$PRIMARY_COLOR" "$date_dir/weekday-wed.png"
  render_glyph 'THU ' 28 69 28 "$PRIMARY_COLOR" "$date_dir/weekday-thu.png"
  render_glyph 'FRI ' 28 51 28 "$PRIMARY_COLOR" "$date_dir/weekday-fri.png"
  render_glyph 'SAT ' 28 62 28 "$PRIMARY_COLOR" "$date_dir/weekday-sat.png"
  render_glyph 'SUN ' 28 69 28 "$PRIMARY_COLOR" "$date_dir/weekday-sun.png"
  render_glyph '+' 22 14 22 "$PRIMARY_COLOR" "$weather_dir/plus.png"
  render_glyph '-' 22 14 22 "$PRIMARY_COLOR" "$weather_dir/minus.png"
  render_glyph '℃' 22 21 22 "$PRIMARY_COLOR" "$weather_dir/unit-c.png"
  render_glyph '℉' 22 21 22 "$PRIMARY_COLOR" "$weather_dir/unit-f.png"

  weather_icon="$weather_dir/thunder.png"
  weather_icon_size=$(identify -format '%wx%h' "$weather_icon")
  if [ "$weather_icon_size" != '30x30' ]; then
    magick "$weather_icon" -resize '30x30!' "$weather_icon.tmp.png"
    mv "$weather_icon.tmp.png" "$weather_icon"
  fi
done
