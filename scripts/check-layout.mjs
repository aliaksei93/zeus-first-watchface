import { LAYOUT } from '../watchface/config/layout.ts'

function contains(outer, inner) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  )
}

function overlaps(left, right) {
  return (
    left.x < right.x + right.w &&
    left.x + left.w > right.x &&
    left.y < right.y + right.h &&
    left.y + left.h > right.y
  )
}

function bounds(...rects) {
  const x = Math.min(...rects.map(rect => rect.x))
  const y = Math.min(...rects.map(rect => rect.y))
  const right = Math.max(...rects.map(rect => rect.x + rect.w))
  const bottom = Math.max(...rects.map(rect => rect.y + rect.h))

  return { x, y, w: right - x, h: bottom - y }
}

const widgets = {
  calendar: LAYOUT.clock.date,
  schedule: LAYOUT.clock.weekday,
  battery: LAYOUT.battery.icon,
  weather: bounds(LAYOUT.weather.icon, LAYOUT.weather.text),
  sun: bounds(LAYOUT.sun.icon, LAYOUT.sun.text),
  alarm: bounds(LAYOUT.alarm.icon, LAYOUT.alarm.text),
  alarmShortcut: { x: 84, y: 195, w: 112, h: 90 },
  countdown: { x: 284, y: 195, w: 110, h: 90 },
  stopwatch: LAYOUT.clock.seconds,
}

const designCenterX = LAYOUT.designWidth / 2

for (const [name, widget] of Object.entries({
  weekday: LAYOUT.clock.weekday,
})) {
  if (Math.abs(widget.x + widget.w / 2 - designCenterX) > 0.5) {
    throw new Error(name + ' widget is not centered')
  }
}

const widgetGaps = [
  ['alarm', LAYOUT.alarm.icon, LAYOUT.alarm.text],
  ['weather', LAYOUT.weather.icon, LAYOUT.weather.text],
  ['sun', LAYOUT.sun.text, LAYOUT.sun.icon],
]

for (const [name, left, right] of widgetGaps) {
  const gap = right.x - (left.x + left.w)

  if (gap !== 9) {
    throw new Error(name + ' icon and text must have a 9px gap')
  }
}

for (const [name, widget] of Object.entries(widgets)) {
  const tapZone = LAYOUT.interactions[name]

  if (!contains(tapZone, widget)) {
    throw new Error(name + ' widget is outside its tap zone')
  }
}

for (const name of ['calendar', 'schedule', 'battery', 'weather', 'sun', 'alarm']) {
  const widget = widgets[name]
  const tapZone = LAYOUT.interactions[name]
  const padding = [
    widget.x - tapZone.x,
    widget.y - tapZone.y,
    tapZone.x + tapZone.w - (widget.x + widget.w),
    tapZone.y + tapZone.h - (widget.y + widget.h),
  ]

  if (Math.min(...padding) < 10) {
    throw new Error(name + ' tap zone must have at least 10px padding')
  }
}

const tapZones = Object.entries(LAYOUT.interactions)

for (let index = 0; index < tapZones.length; index += 1) {
  const [leftName, left] = tapZones[index]

  for (let otherIndex = index + 1; otherIndex < tapZones.length; otherIndex += 1) {
    const [rightName, right] = tapZones[otherIndex]

    if (overlaps(left, right)) {
      throw new Error(leftName + ' tap zone overlaps ' + rightName)
    }
  }
}
