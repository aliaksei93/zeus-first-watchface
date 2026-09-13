import { getDeviceInfo } from '@zos/device'
import { Time, Weather } from '@zos/sensor'
import * as hmUI from '@zos/ui'

const COLORS = {
  background: 0x000000,
  accent: 0xf2c94c,
  border: 0x65735c,
  normalGhost: 0x242424,
  aodGhost: 0x0f0f0f,
  primary: 0xe6f4c7,
  secondary: 0x9eae91,
}

const ALARM_ASSET_ROOT = 'alarm/'
const WEATHER_ASSET_ROOT = 'weather/'
const DSEG7_FONT = 'fonts/DSEG7Classic-Bold.ttf'
const INTER_REGULAR_FONT = 'fonts/Inter-Regular.ttf'
const INTER_BOLD_FONT = 'fonts/Inter-Bold.ttf'

function createDigitArray(root) {
  return Array.from({ length: 10 }, function (_, index) {
    return root + index + '.png'
  })
}

const ALARM_DIGITS = createDigitArray(ALARM_ASSET_ROOT)
const WEATHER_DIGITS = createDigitArray(WEATHER_ASSET_ROOT)

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const WEATHER_ICON_GROUPS = [
  { icon: 'sunny.png', codes: [3] },
  { icon: 'cloudy.png', codes: [0, 4, 26] },
  { icon: 'rain.png', codes: [1, 5, 7, 27] },
  { icon: 'heavy-rain.png', codes: [10, 18, 19, 21, 24] },
  { icon: 'snow.png', codes: [2, 6, 8, 9, 12, 16] },
  { icon: 'thunder.png', codes: [15, 20] },
  { icon: 'atmosphere.png', codes: [11, 13, 14, 17, 22, 23] },
  { icon: 'night.png', codes: [28] },
  { icon: 'unknown.png', codes: [25] },
]

let screenWidth = 480
let screenHeight = 480
let screenScale = 1
let timeSensor = null
let weatherSensor = null
let refreshTimer = null
let weatherRefreshTimer = null
let normalTimeText = null
let normalSecondText = null
let normalDateText = null
let normalWeatherIcon = null
let aodTimeText = null

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

function createText(x, y, w, h, text, size, color, level, font) {
  const options = {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
    h: scaled(h),
    text: text,
    text_size: scaled(size),
    color: color,
    align_h: hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
    char_space: 0,
    show_level: level,
  }

  if (font) {
    options.font = font
  }

  return hmUI.createWidget(hmUI.widget.TEXT, options)
}

function createDivider(x, y, w, level) {
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
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

  createText(
    80,
    72,
    320,
    24,
    'RETRO // DIGITAL',
    20,
    COLORS.accent,
    level,
    INTER_BOLD_FONT,
  )
  createDivider(55, 176, 380, level)
  createDivider(50, 302, 380, level)
  createText(
    187,
    409,
    107,
    18,
    'ZEPP OS / 24H',
    15,
    COLORS.secondary,
    level,
    INTER_REGULAR_FONT,
  )
}

function createAlarm(level) {
  hmUI.createWidget(hmUI.widget.IMG_STATUS, {
    x: scaled(58),
    y: scaled(141),
    src: ALARM_ASSET_ROOT + 'status.png',
    type: hmUI.system_status.CLOCK,
    show_level: level,
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(94),
    y: scaled(144),
    w: scaled(59),
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
  normalWeatherIcon = createImage(
    337,
    141,
    WEATHER_ASSET_ROOT + 'unknown.png',
    level,
    28,
    28,
  )
  createImage(377, 142, WEATHER_ASSET_ROOT + 'plus.png', level, 14, 22)

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(391),
    y: scaled(142),
    w: scaled(26),
    h: scaled(22),
    font_array: WEATHER_DIGITS,
    negative_image: WEATHER_ASSET_ROOT + 'minus.png',
    invalid_image: WEATHER_ASSET_ROOT + 'empty.png',
    h_space: 0,
    align_h: hmUI.align.RIGHT,
    type: hmUI.data_type.WEATHER_CURRENT,
    show_level: level,
  })
  createText(
    417,
    140,
    21,
    27,
    '℃',
    22,
    COLORS.primary,
    level,
    INTER_REGULAR_FONT,
  )
}

function updateWeatherIcon() {
  if (weatherSensor === null || normalWeatherIcon === null) {
    return
  }

  try {
    const weather = weatherSensor.getForecastWeather()
    const current = weather.forecastData.data[0]
    let icon = 'unknown.png'

    for (let index = 0; index < WEATHER_ICON_GROUPS.length; index += 1) {
      const group = WEATHER_ICON_GROUPS[index]

      if (group.codes.indexOf(current.index) !== -1) {
        icon = group.icon
        break
      }
    }

    normalWeatherIcon.setProperty(
      hmUI.prop.SRC,
      WEATHER_ASSET_ROOT + icon,
    )
  } catch (error) {
    normalWeatherIcon.setProperty(
      hmUI.prop.SRC,
      WEATHER_ASSET_ROOT + 'unknown.png',
    )
  }
}

function createTime(level) {
  createText(
    95,
    198,
    291,
    84,
    '88:88',
    84,
    COLORS.normalGhost,
    level,
    DSEG7_FONT,
  )
  normalTimeText = createText(
    95,
    198,
    291,
    84,
    '',
    84,
    COLORS.primary,
    level,
    DSEG7_FONT,
  )
  normalSecondText = createText(
    387,
    258,
    40,
    24,
    '',
    24,
    COLORS.secondary,
    level,
    DSEG7_FONT,
  )
}

function createDate(level) {
  normalDateText = createText(
    127,
    318,
    226,
    28,
    '',
    28,
    COLORS.primary,
    level,
    INTER_REGULAR_FONT,
  )
}

function updateTime() {
  const weekdayIndex = Math.max(0, Math.min(6, timeSensor.getDay() - 1))

  const timeText =
    padded(timeSensor.getHours()) + ':' + padded(timeSensor.getMinutes())
  const secondText = padded(timeSensor.getSeconds())

  normalTimeText.setProperty(hmUI.prop.TEXT, timeText)
  normalSecondText.setProperty(hmUI.prop.TEXT, secondText)

  if (aodTimeText !== null) {
    aodTimeText.setProperty(hmUI.prop.TEXT, timeText)
  }

  const dateText =
    WEEKDAYS[weekdayIndex] +
    ' ' +
    padded(timeSensor.getDate()) +
    '.' +
    padded(timeSensor.getMonth()) +
    '.' +
    timeSensor.getFullYear()

  normalDateText.setProperty(hmUI.prop.TEXT, dateText)
}

function updateDynamicData() {
  updateTime()
  updateWeatherIcon()
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

    createTapZone(337, 140, 100, 30, hmUI.data_type.WEATHER_CURRENT, level)
    createTapZone(95, 198, 111, 84, hmUI.data_type.ALARM_CLOCK, level)
    createTapZone(275, 198, 111, 84, hmUI.data_type.COUNT_DOWN, level)
    createTapZone(387, 258, 40, 24, hmUI.data_type.STOP_WATCH, level)

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: updateDynamicData,
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

    createText(
      101,
      200,
      291,
      84,
      '88:88',
      84,
      COLORS.aodGhost,
      level,
      DSEG7_FONT,
    )
    aodTimeText = createText(
      95,
      198,
      291,
      84,
      '',
      84,
      COLORS.primary,
      level,
      DSEG7_FONT,
    )
  },

  onInit() {
    const deviceInfo = getDeviceInfo();

    screenWidth = deviceInfo.width
    screenHeight = deviceInfo.height
    screenScale = screenWidth / 480
    timeSensor = new Time()
    weatherSensor = new Weather()
  },

  build() {
    this.drawNormal()
    this.drawAod()
    updateDynamicData()
    refreshTimer = setInterval(updateTime, 1000)
    weatherRefreshTimer = setInterval(updateWeatherIcon, 15 * 60 * 1000)
  },

  onDestroy() {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }

    if (weatherRefreshTimer !== null) {
      clearInterval(weatherRefreshTimer)
      weatherRefreshTimer = null
    }
  },
})
