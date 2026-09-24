import * as hmUI from '@zos/ui'
import { getTimeFormat, TIME_FORMAT_12 } from '@zos/settings'

import { ASSETS, WEATHER_ICONS } from '../../config/assets.ts'
import { LAYOUT } from '../../config/layout.ts'
import { COLORS, FONTS } from '../../config/theme.ts'
import { padTwo } from '../../shared/format.js'

export function createWeatherDomain({ ui, timeSensor, weatherSensor }) {
  let sunIcon = null
  let sunTimesText = null
  let sunTimes = null
  let sunTimesDate = ''

  function getDateKey() {
    return (
      timeSensor.getFullYear() +
      '-' +
      padTwo(timeSensor.getMonth()) +
      '-' +
      padTwo(timeSensor.getDate())
    )
  }

  function formatSunTime(time) {
    const hours =
      getTimeFormat() === TIME_FORMAT_12
        ? ((time.hour + 11) % 12) + 1
        : time.hour

    return padTwo(hours) + ':' + padTwo(time.minute)
  }

  function refresh() {
    sunTimesDate = getDateKey()
    sunTimes = null

    try {
      const forecast = weatherSensor.getForecast()

      if (forecast && forecast.tideData && forecast.tideData.count > 0) {
        sunTimes = forecast.tideData.data[0]
      }
    } catch (error) {
      sunTimes = null
    }
  }

  function update() {
    if (sunIcon === null || sunTimesText === null) {
      return
    }

    if (sunTimesDate !== getDateKey()) {
      refresh()
    }

    let asset = ASSETS.weather.sunrise
    let text = '--'

    if (sunTimes !== null) {
      const currentMinutes = timeSensor.getHours() * 60 + timeSensor.getMinutes()
      const sunriseMinutes = sunTimes.sunrise.hour * 60 + sunTimes.sunrise.minute
      const sunsetMinutes = sunTimes.sunset.hour * 60 + sunTimes.sunset.minute

      if (currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes) {
        asset = ASSETS.weather.sunset
        text = formatSunTime(sunTimes.sunset)
      } else {
        text = formatSunTime(sunTimes.sunrise)
      }
    }

    sunIcon.setProperty(hmUI.prop.SRC, asset)
    sunTimesText.setProperty(hmUI.prop.TEXT, text)
  }

  function drawCurrent(level) {
    const { icon, text } = LAYOUT.weather

    hmUI.createWidget(hmUI.widget.IMG_LEVEL, {
      x: ui.scaled(icon.x),
      y: ui.scaled(icon.y),
      w: ui.scaled(icon.w),
      h: ui.scaled(icon.h),
      image_array: WEATHER_ICONS,
      image_length: WEATHER_ICONS.length,
      type: hmUI.data_type.WEATHER_CURRENT,
      show_level: level,
    })
    hmUI.createWidget(hmUI.widget.TEXT_FONT, {
      x: ui.scaled(text.x),
      y: ui.scaled(text.y),
      w: ui.scaled(text.w),
      h: ui.scaled(text.h),
      text_size: ui.scaled(text.size),
      font: FONTS.interRegular,
      color: COLORS.primary,
      char_space: 0,
      line_space: 0,
      padding: true,
      align_h: hmUI.align.RIGHT,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
      type: hmUI.data_type.WEATHER_CURRENT,
      unit_type: 1,
      show_level: level,
    })
  }

  function drawSun(level) {
    const { icon, text } = LAYOUT.sun

    sunIcon = ui.createImage({
      ...icon,
      src: ASSETS.weather.sunrise,
      level,
    })
    sunTimesText = ui.createText({
      ...text,
      text: '--',
      color: COLORS.primary,
      level,
      font: FONTS.interRegular,
      alignH: hmUI.align.RIGHT,
    })

    refresh()
    update()
  }

  return {
    drawCurrent,
    drawSun,
    refresh,
    update,
  }
}
