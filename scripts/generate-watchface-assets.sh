#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
OXANIUM_FONT=${OXANIUM_FONT:-}
PRIMARY_COLOR='#e6f4c7'
SECONDARY_COLOR='#9eae91'

if [ -z "$OXANIUM_FONT" ] || [ ! -f "$OXANIUM_FONT" ]; then
  echo 'Set OXANIUM_FONT to the static Oxanium Regular TTF path.' >&2
  exit 1
fi

render_glyph() {
  text=$1
  point_size=$2
  width=$3
  height=$4
  color=$5
  output=$6

  magick -background none -fill "$color" -font "$OXANIUM_FONT" \
    -pointsize "$point_size" "label:$text" -gravity northwest \
    -crop "${width}x${height}+0+0" +repage "$output"
}

for target in \
  '480x480-amazfit-balance-2'; do
  asset_dir="$PROJECT_DIR/assets/$target"
  primary_dir="$asset_dir/normal/primary"
  seconds_dir="$asset_dir/normal/seconds"
  alarm_dir="$asset_dir/alarm"
  date_dir="$asset_dir/date"
  aod_dir="$asset_dir/aod"

  mkdir -p "$primary_dir" "$seconds_dir" "$alarm_dir" "$date_dir" "$aod_dir"

  for digit in 0 1 2 3 4 5 6 7 8 9; do
    render_glyph "$digit" 96 56 98 "$PRIMARY_COLOR" "$primary_dir/$digit.png"
    cp "$primary_dir/$digit.png" "$aod_dir/$digit.png"
    render_glyph "$digit" 40 23 42 "$SECONDARY_COLOR" "$seconds_dir/$digit.png"
    render_glyph "$digit" 20 12 22 "$PRIMARY_COLOR" "$alarm_dir/$digit.png"
    render_glyph "$digit" 28 16 30 "$PRIMARY_COLOR" "$date_dir/$digit.png"
  done

  render_glyph ':' 96 24 98 "$PRIMARY_COLOR" "$primary_dir/colon.png"
  cp "$primary_dir/colon.png" "$aod_dir/colon.png"
  render_glyph ':' 20 5 22 "$PRIMARY_COLOR" "$alarm_dir/colon.png"
  render_glyph '.' 28 7 30 "$PRIMARY_COLOR" "$date_dir/dot.png"
  render_glyph 'MON ' 28 70 30 "$PRIMARY_COLOR" "$date_dir/weekday-mon.png"
  render_glyph 'TUE ' 28 58 30 "$PRIMARY_COLOR" "$date_dir/weekday-tue.png"
  render_glyph 'WED ' 28 67 30 "$PRIMARY_COLOR" "$date_dir/weekday-wed.png"
  render_glyph 'THU ' 28 62 30 "$PRIMARY_COLOR" "$date_dir/weekday-thu.png"
  render_glyph 'FRI ' 28 47 30 "$PRIMARY_COLOR" "$date_dir/weekday-fri.png"
  render_glyph 'SAT ' 28 55 30 "$PRIMARY_COLOR" "$date_dir/weekday-sat.png"
  render_glyph 'SUN ' 28 62 30 "$PRIMARY_COLOR" "$date_dir/weekday-sun.png"

  weather_icon="$asset_dir/weather/thunder.png"
  weather_icon_size=$(identify -format '%wx%h' "$weather_icon")
  if [ "$weather_icon_size" != '24x24' ]; then
    magick "$weather_icon" -resize '24x24!' "$weather_icon.tmp.png"
    mv "$weather_icon.tmp.png" "$weather_icon"
  fi
done
