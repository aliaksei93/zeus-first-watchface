import { getDeviceInfo } from '@zos/device'
import { Time } from '@zos/sensor'
import * as hmUI from '@zos/ui'

const COLORS = {
  background: 0x000000,
  border: 0x65735c,
}

const UI_ASSET_ROOT = 'ui/'
const PRIMARY_TIME_ASSET_ROOT = 'normal/primary/'
const SECOND_TIME_ASSET_ROOT = 'normal/seconds/'
const ALARM_ASSET_ROOT = 'alarm/'
const DATE_ASSET_ROOT = 'date/'
const WEATHER_ASSET_ROOT = 'weather/'
const AOD_ASSET_ROOT = 'aod/'

function createDigitArray(root) {
  return Array.from({ length: 10 }, function (_, index) {
    return root + index + '.png'
  })
}

const PRIMARY_TIME_DIGITS = createDigitArray(PRIMARY_TIME_ASSET_ROOT)
const SECOND_TIME_DIGITS = createDigitArray(SECOND_TIME_ASSET_ROOT)
const ALARM_DIGITS = createDigitArray(ALARM_ASSET_ROOT)
const DATE_DIGITS = createDigitArray(DATE_ASSET_ROOT)
const WEATHER_DIGITS = createDigitArray(WEATHER_ASSET_ROOT)
const AOD_DIGITS = createDigitArray(AOD_ASSET_ROOT)

const WEEKDAY_IMAGES = [
  DATE_ASSET_ROOT + 'weekday-mon.png',
  DATE_ASSET_ROOT + 'weekday-tue.png',
  DATE_ASSET_ROOT + 'weekday-wed.png',
  DATE_ASSET_ROOT + 'weekday-thu.png',
  DATE_ASSET_ROOT + 'weekday-fri.png',
  DATE_ASSET_ROOT + 'weekday-sat.png',
  DATE_ASSET_ROOT + 'weekday-sun.png',
]
const WEEKDAY_PREFIX_WIDTHS = [70, 58, 67, 62, 47, 55, 62]
const DATE_DIGITS_WIDTH = 142

let screenWidth = 480
let screenHeight = 480
let screenScale = 1
let timeSensor = null
let refreshTimer = null
let normalHourDigits = null
let normalMinuteDigits = null
let normalSecondImages = []
let normalWeekdayImage = null
let normalDateImages = []

function scaled(value) {
  return Math.round(value * screenScale)
}

function padded(value) {
  return String(value).padStart(2, '0')
}

function createImage(x, y, src, level, w, h) {
  const options = {
    x: scaled(x),
    y: scaled(y),
    src: src,
    show_level: level,
  }

  if (w !== undefined) {
    options.w = scaled(w)
  }

  if (h !== undefined) {
    options.h = scaled(h)
  }

  return hmUI.createWidget(hmUI.widget.IMG, options)
}

function createDivider(y, level) {
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: scaled(70),
    y: scaled(y),
    w: scaled(340),
    h: scaled(2),
    color: COLORS.border,
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

  createImage(80, 70, UI_ASSET_ROOT + 'brand.png', level, 320, 28)
  createDivider(156, level)
  createDivider(348, level)
  createImage(60, 354, UI_ASSET_ROOT + 'action-alarm.png', level, 120, 40)
  createImage(180, 354, UI_ASSET_ROOT + 'action-timer.png', level, 120, 40)
  createImage(300, 354, UI_ASSET_ROOT + 'action-stopwatch.png', level, 120, 40)
  createImage(110, 406, UI_ASSET_ROOT + 'meta.png', level, 260, 24)
}

function createAlarm(level) {
  hmUI.createWidget(hmUI.widget.IMG_STATUS, {
    x: scaled(80),
    y: scaled(117),
    src: ALARM_ASSET_ROOT + 'status.png',
    type: hmUI.system_status.CLOCK,
    show_level: level,
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(110),
    y: scaled(120),
    w: scaled(53),
    h: scaled(22),
    font_array: ALARM_DIGITS,
    dot_image: ALARM_ASSET_ROOT + 'colon.png',
    invalid_image: ALARM_ASSET_ROOT + 'empty.png',
    h_space: 0,
    padding: true,
    align_h: hmUI.align.LEFT,
    type: hmUI.data_type.ALARM_CLOCK,
    show_level: level,
  })
}

function createWeather(level) {
  createImage(320, 117, WEATHER_ASSET_ROOT + 'thunder.png', level, 24, 24)
  createImage(350, 118, WEATHER_ASSET_ROOT + 'plus.png', level, 12, 21)

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(350),
    y: scaled(118),
    w: scaled(50),
    h: scaled(21),
    font_array: WEATHER_DIGITS,
    unit_sc: WEATHER_ASSET_ROOT + 'unit-c.png',
    unit_en: WEATHER_ASSET_ROOT + 'unit-c.png',
    unit_tc: WEATHER_ASSET_ROOT + 'unit-c.png',
    imperial_unit_sc: WEATHER_ASSET_ROOT + 'unit-f.png',
    imperial_unit_en: WEATHER_ASSET_ROOT + 'unit-f.png',
    imperial_unit_tc: WEATHER_ASSET_ROOT + 'unit-f.png',
    negative_image: WEATHER_ASSET_ROOT + 'minus.png',
    invalid_image: WEATHER_ASSET_ROOT + 'empty.png',
    h_space: scaled(1),
    align_h: hmUI.align.RIGHT,
    type: hmUI.data_type.WEATHER_CURRENT,
    show_level: level,
  })
}

function createTime(level) {
  normalHourDigits = hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(116),
    y: scaled(191),
    w: scaled(111),
    h: scaled(98),
    font_array: PRIMARY_TIME_DIGITS,
    h_space: scaled(-1),
    align_h: hmUI.align.LEFT,
    text: '',
    show_level: level,
  })

  createImage(227, 191, PRIMARY_TIME_ASSET_ROOT + 'colon.png', level, 24, 98)

  normalMinuteDigits = hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(251),
    y: scaled(191),
    w: scaled(111),
    h: scaled(98),
    font_array: PRIMARY_TIME_DIGITS,
    h_space: scaled(-1),
    align_h: hmUI.align.LEFT,
    text: '',
    show_level: level,
  })

  normalSecondImages = [
    createImage(374, 235, SECOND_TIME_DIGITS[0], level, 23, 42),
    createImage(396, 235, SECOND_TIME_DIGITS[0], level, 23, 42),
  ]
}

function createDate(level) {
  normalWeekdayImage = createImage(134, 303, WEEKDAY_IMAGES[0], level)

  normalDateImages = []
  let x = 204
  const placeholder = '00.00.0000'

  for (let index = 0; index < placeholder.length; index += 1) {
    const isDot = placeholder[index] === '.'
    const width = isDot ? 7 : 16
    const src = isDot ? DATE_ASSET_ROOT + 'dot.png' : DATE_DIGITS[0]

    normalDateImages.push(createImage(x, 303, src, level, width, 30))
    x += width
  }
}

function updateTime() {
  const weekdayIndex = Math.max(0, Math.min(6, timeSensor.getDay() - 1))
  const weekdayWidth = WEEKDAY_PREFIX_WIDTHS[weekdayIndex]
  const dateStartX = Math.floor((480 - weekdayWidth - DATE_DIGITS_WIDTH) / 2)

  normalHourDigits.setProperty(hmUI.prop.TEXT, padded(timeSensor.getHours()))
  normalMinuteDigits.setProperty(hmUI.prop.TEXT, padded(timeSensor.getMinutes()))
  const secondText = padded(timeSensor.getSeconds())

  for (let index = 0; index < secondText.length; index += 1) {
    normalSecondImages[index].setProperty(hmUI.prop.MORE, {
      x: scaled(374 + index * 22),
      y: scaled(235),
      w: scaled(23),
      h: scaled(42),
      src: SECOND_TIME_DIGITS[Number(secondText[index])],
      show_level: hmUI.show_level.ONLY_NORMAL,
    })
  }
  normalWeekdayImage.setProperty(hmUI.prop.MORE, {
    x: scaled(dateStartX),
    y: scaled(303),
    src: WEEKDAY_IMAGES[weekdayIndex],
    w: scaled(weekdayWidth),
    h: scaled(30),
    show_level: hmUI.show_level.ONLY_NORMAL,
  })

  const dateText =
    padded(timeSensor.getDate()) + '.' + padded(timeSensor.getMonth()) + '.' +
    timeSensor.getFullYear()
  let dateX = dateStartX + weekdayWidth

  for (let index = 0; index < dateText.length; index += 1) {
    const isDot = dateText[index] === '.'
    const width = isDot ? 7 : 16
    const src = isDot ? DATE_ASSET_ROOT + 'dot.png' : DATE_DIGITS[Number(dateText[index])]

    normalDateImages[index].setProperty(hmUI.prop.MORE, {
      x: scaled(dateX),
      y: scaled(303),
      w: scaled(width),
      h: scaled(30),
      src: src,
      show_level: hmUI.show_level.ONLY_NORMAL,
    })
    dateX += width
  }
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
    createWeather(level)
    createTime(level)
    createDate(level)

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
      hour_startX: scaled(116),
      hour_startY: scaled(191),
      hour_array: AOD_DIGITS,
      hour_space: scaled(-1),
      hour_unit_sc: AOD_ASSET_ROOT + 'colon.png',
      hour_unit_tc: AOD_ASSET_ROOT + 'colon.png',
      hour_unit_en: AOD_ASSET_ROOT + 'colon.png',
      hour_align: hmUI.align.LEFT,
      minute_follow: 1,
      minute_zero: 1,
      minute_array: AOD_DIGITS,
      minute_space: scaled(-1),
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
