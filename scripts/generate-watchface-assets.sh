#!/usr/bin/env bash

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

draw_digit() {
  digit=$1
  output=$2
  segments=''

  case "$digit" in
    0) segments='a b c d e f' ;;
    1) segments='b c' ;;
    2) segments='a b g e d' ;;
    3) segments='a b g c d' ;;
    4) segments='f g b c' ;;
    5) segments='a f g c d' ;;
    6) segments='a f g e c d' ;;
    7) segments='a b c' ;;
    8) segments='a b c d e f g' ;;
    9) segments='a b c d f g' ;;
  esac

  drawing=''
  for segment in $segments; do
    case "$segment" in
      a) drawing="$drawing polygon 5,1 20,1 24,5 20,8 5,8 1,5" ;;
      b) drawing="$drawing polygon 21,5 25,9 25,18 21,22 18,18 18,9" ;;
      c) drawing="$drawing polygon 21,21 25,25 25,34 21,38 18,34 18,25" ;;
      d) drawing="$drawing polygon 5,35 20,35 24,39 20,42 5,42 1,39" ;;
      e) drawing="$drawing polygon 1,21 5,25 5,34 1,38 0,34 0,25" ;;
      f) drawing="$drawing polygon 1,5 5,9 5,18 1,22 0,18 0,9" ;;
      g) drawing="$drawing polygon 5,18 20,18 24,22 20,25 5,25 1,22" ;;
    esac
  done

  magick -size 26x43 xc:none -fill '#e6f4c7' -stroke none \
    -draw "$drawing" "$output"
}

for target in \
  '480x480-amazfit-balance-2'; do
  output_dir="$PROJECT_DIR/assets/$target/alarm"
  mkdir -p "$output_dir"

  for digit in 0 1 2 3 4 5 6 7 8 9; do
    draw_digit "$digit" "$output_dir/$digit.png"
  done

  magick -size 12x43 xc:none -fill '#e6f4c7' -stroke none \
    -draw 'circle 6,14 6,17 circle 6,29 6,32' \
    "$output_dir/colon.png"

  magick -size 142x43 xc:none -fill '#e6f4c7' \
    -font Helvetica-Narrow-Bold -pointsize 17 -gravity center \
    -annotate +0+0 'NO ALARMS' "$output_dir/no-alarms.png"

  magick -size 32x32 xc:none -fill none -stroke '#f2c94c' -strokewidth 3 \
    -draw 'roundrectangle 8,4 24,22 8,8 line 5,22 27,22' \
    -fill '#f2c94c' -stroke none -draw 'circle 16,26 19,26' \
    "$output_dir/status.png"

  magick -size 8x8 xc:none "$output_dir/tap.png"
done
