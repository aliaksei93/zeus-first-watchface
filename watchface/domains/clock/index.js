import * as hmUI from '@zos/ui'

import { LAYOUT } from '../../config/layout.ts'
import { COLORS, FONTS } from '../../config/theme.ts'
import { padTwo } from '../../shared/format.js'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function createClockDomain({ ui, timeSensor }) {
  let normalTimeText = null
  let normalSecondText = null
  let normalDateText = null
  let aodTimeText = null

  function drawNormal(level) {
    const { time, seconds, date } = LAYOUT.clock

    ui.createText({
      ...time,
      text: '88:88',
      color: COLORS.normalGhost,
      level,
      font: FONTS.digitalBold,
    })
    normalTimeText = ui.createText({
      ...time,
      text: '',
      color: COLORS.primary,
      level,
      font: FONTS.digitalBold,
    })
    normalSecondText = ui.createText({
      ...seconds,
      text: '',
      color: COLORS.secondary,
      level,
      font: FONTS.digitalBold,
    })
    normalDateText = ui.createText({
      ...date,
      text: '',
      color: COLORS.primary,
      level,
      font: FONTS.interRegular,
    })
  }

  function drawAod(level) {
    const { time } = LAYOUT.clock

    ui.createText({
      ...time,
      text: '88:88',
      color: COLORS.aodGhost,
      level,
      font: FONTS.digitalBold,
    })
    aodTimeText = ui.createText({
      ...time,
      text: '',
      color: COLORS.primary,
      level,
      font: FONTS.digitalBold,
    })
  }

  function update() {
    const weekdayIndex = Math.max(0, Math.min(6, timeSensor.getDay() - 1))
    const timeText =
      padTwo(timeSensor.getHours()) + ':' + padTwo(timeSensor.getMinutes())

    normalTimeText.setProperty(hmUI.prop.TEXT, timeText)
    normalSecondText.setProperty(
      hmUI.prop.TEXT,
      padTwo(timeSensor.getSeconds()),
    )

    if (aodTimeText !== null) {
      aodTimeText.setProperty(hmUI.prop.TEXT, timeText)
    }

    const dateText =
      WEEKDAYS[weekdayIndex] +
      ' ' +
      padTwo(timeSensor.getDate()) +
      '.' +
      padTwo(timeSensor.getMonth()) +
      '.' +
      String(timeSensor.getFullYear()).slice(-2)

    normalDateText.setProperty(hmUI.prop.TEXT, dateText)
  }

  return {
    drawAod,
    drawNormal,
    update,
  }
}
