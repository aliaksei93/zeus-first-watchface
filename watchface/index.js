import { getDeviceInfo } from '@zos/device'
import { Time } from '@zos/sensor'
import * as hmUI from '@zos/ui'

const COLORS = {
  background: 0x000000,
  panel: 0x0b100d,
  border: 0x65735c,
  primary: 0xe6f4c7,
  secondary: 0x9eae91,
  accent: 0xf2c94c,
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const ALARM_ASSET_ROOT = 'alarm/'
const AOD_ASSET_ROOT = 'aod/'
const ALARM_DIGITS = Array.from({ length: 10 }, function (_, index) {
  return ALARM_ASSET_ROOT + index + '.png'
})
const AOD_DIGITS = Array.from({ length: 10 }, function (_, index) {
  return AOD_ASSET_ROOT + index + '.png'
})

let screenWidth = 480
let screenHeight = 480
let screenScale = 1
let timeSensor = null
let refreshTimer = null
let normalHourText = null
let normalMinuteText = null
let normalSecondText = null
let normalDateText = null

function scaled(value) {
  return Math.round(value * screenScale)
}

function padded(value) {
  return String(value).padStart(2, '0')
}

function currentDate() {
  const weekday = WEEKDAYS[Math.max(0, Math.min(6, timeSensor.getDay() - 1))]

  return weekday + '  ' + padded(timeSensor.getDate()) + '.' +
    padded(timeSensor.getMonth()) + '.' + timeSensor.getFullYear()
}

function createText(x, y, w, h, text, size, color, level, align) {
  return hmUI.createWidget(hmUI.widget.TEXT, {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
    h: scaled(h),
    text: text,
    color: color,
    text_size: scaled(size),
    align_h: align || hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
    show_level: level,
  })
}

function createFrame(level) {
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: 0,
    y: 0,
    w: screenWidth,
    h: screenHeight,
    color: COLORS.background,
    show_level: level,
  })

  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: scaled(40),
    y: scaled(60),
    w: scaled(400),
    h: scaled(360),
    radius: scaled(36),
    color: COLORS.panel,
    show_level: level,
  })

  hmUI.createWidget(hmUI.widget.STROKE_RECT, {
    x: scaled(40),
    y: scaled(60),
    w: scaled(400),
    h: scaled(360),
    radius: scaled(36),
    line_width: scaled(2),
    color: COLORS.border,
    show_level: level,
  })

  createText(
    80,
    78,
    320,
    28,
    'RETRO // DIGITAL',
    20,
    COLORS.accent,
    level,
  )

  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: scaled(70),
    y: scaled(156),
    w: scaled(340),
    h: scaled(2),
    color: COLORS.border,
    show_level: level,
  })
}

function createAlarm(level) {
  createText(
    114,
    112,
    102,
    38,
    'NEXT ALARM',
    16,
    COLORS.secondary,
    level,
    hmUI.align.LEFT,
  )

  hmUI.createWidget(hmUI.widget.IMG_STATUS, {
    x: scaled(78),
    y: scaled(115),
    src: ALARM_ASSET_ROOT + 'status.png',
    type: hmUI.system_status.CLOCK,
    show_level: level,
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(226),
    y: scaled(110),
    w: scaled(170),
    h: scaled(42),
    font_array: ALARM_DIGITS,
    dot_image: ALARM_ASSET_ROOT + 'colon.png',
    invalid_image: ALARM_ASSET_ROOT + 'no-alarms.png',
    h_space: scaled(2),
    padding: true,
    align_h: hmUI.align.CENTER_H,
    type: hmUI.data_type.ALARM_CLOCK,
    show_level: level,
  })
}

function updateTime() {
  normalHourText.setProperty(hmUI.prop.TEXT, padded(timeSensor.getHours()))
  normalMinuteText.setProperty(hmUI.prop.TEXT, padded(timeSensor.getMinutes()))
  normalSecondText.setProperty(hmUI.prop.TEXT, padded(timeSensor.getSeconds()))
  normalDateText.setProperty(hmUI.prop.TEXT, currentDate())
}

function createTapZone(x, y, w, h, type, level) {
  hmUI.createWidget(hmUI.widget.IMG_CLICK, {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
    h: scaled(h),
    src: ALARM_ASSET_ROOT + 'tap.png',
    type: type,
    show_level: level,
  })
}

WatchFace({
  drawNormal() {
    const level = hmUI.show_level.ONLY_NORMAL

    createFrame(level)
    createAlarm(level)

    normalHourText = createText(52, 164, 116, 104, '--', 86, COLORS.primary, level)
    createText(168, 164, 28, 104, ':', 70, COLORS.primary, level)
    normalMinuteText = createText(196, 164, 116, 104, '--', 86, COLORS.primary, level)
    createText(312, 184, 24, 78, ':', 50, COLORS.secondary, level)
    normalSecondText = createText(336, 184, 88, 78, '--', 54, COLORS.secondary, level)

    normalDateText = createText(76, 274, 328, 42, '', 28, COLORS.primary, level)

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: scaled(70),
      y: scaled(326),
      w: scaled(340),
      h: scaled(2),
      color: COLORS.border,
      show_level: level,
    })

    createText(60, 338, 120, 30, 'ALARM', 16, COLORS.accent, level)
    createText(180, 338, 120, 30, 'TIMER', 16, COLORS.accent, level)
    createText(300, 338, 120, 30, 'STOPWATCH', 16, COLORS.accent, level)
    createText(110, 378, 260, 24, 'ZEPP OS  /  24H', 15, COLORS.secondary, level)

    createTapZone(52, 164, 116, 104, hmUI.data_type.ALARM_CLOCK, level)
    createTapZone(196, 164, 116, 104, hmUI.data_type.COUNT_DOWN, level)
    createTapZone(336, 184, 88, 78, hmUI.data_type.STOP_WATCH, level)

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: updateTime,
    })
  },

  drawAod() {
    const level = hmUI.show_level.ONAL_AOD

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: screenWidth,
      h: screenHeight,
      color: COLORS.background,
      show_level: level,
    })

    hmUI.createWidget(hmUI.widget.IMG_TIME, {
      hour_zero: 1,
      hour_startX: scaled(101),
      hour_startY: scaled(192),
      hour_array: AOD_DIGITS,
      hour_space: scaled(4),
      hour_unit_sc: AOD_ASSET_ROOT + 'colon.png',
      hour_unit_tc: AOD_ASSET_ROOT + 'colon.png',
      hour_unit_en: AOD_ASSET_ROOT + 'colon.png',
      hour_align: hmUI.align.LEFT,
      minute_follow: 1,
      minute_zero: 1,
      minute_array: AOD_DIGITS,
      minute_space: scaled(4),
      second_follow: 0,
      show_level: level,
    })
  },

  onInit() {
    const deviceInfo = getDeviceInfo()

    screenWidth = deviceInfo.width
    screenHeight = deviceInfo.height
    screenScale = screenWidth / 480
    timeSensor = new Time()
  },

  build() {
    this.drawNormal()
    this.drawAod()
    updateTime()
    refreshTimer = setInterval(updateTime, 1000)
  },

  onDestroy() {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  },
})
