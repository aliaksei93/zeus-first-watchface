import * as hmUI from '@zos/ui'
import { getTimeFormat, TIME_FORMAT_12 } from '@zos/settings'

import { ASSETS } from '../../config/assets.ts'
import { LAYOUT } from '../../config/layout.ts'
import { COLORS, FONTS } from '../../config/theme.ts'
import { padTwo } from '../../shared/format.js'

export function createSunDomain({ ui, timeSensor, weatherSensor }) {
  let sunIcon = null
  let sunTimesText = null
  let sunTimes = null
  let sunTimesDate = ''
  let shownAsset = ASSETS.sun.sunrise
  let shownText = '--'

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

    let asset = ASSETS.sun.sunrise
    let text = '--'

    if (sunTimes !== null) {
      const currentMinutes = timeSensor.getHours() * 60 + timeSensor.getMinutes()
      const sunriseMinutes = sunTimes.sunrise.hour * 60 + sunTimes.sunrise.minute
      const sunsetMinutes = sunTimes.sunset.hour * 60 + sunTimes.sunset.minute

      if (currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes) {
        asset = ASSETS.sun.sunset
        text = formatSunTime(sunTimes.sunset)
      } else {
        text = formatSunTime(sunTimes.sunrise)
      }
    }

    if (shownAsset !== asset) {
      sunIcon.setProperty(hmUI.prop.SRC, asset)
      shownAsset = asset
    }

    if (shownText !== text) {
      sunTimesText.setProperty(hmUI.prop.TEXT, text)
      shownText = text
    }
  }

  function draw(level) {
    const { icon, text } = LAYOUT.sun

    sunIcon = ui.createImage({
      ...icon,
      src: ASSETS.sun.sunrise,
      level,
    })
    sunTimesText = ui.createText({
      ...text,
      text: '--',
      color: COLORS.primary,
      level,
      font: FONTS.interRegular,
      alignH: hmUI.align.LEFT,
    })
  }

  return { draw, refresh, update }
}
