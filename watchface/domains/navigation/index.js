import { launchApp, SYSTEM_APP_CALENDAR } from '@zos/router'
import * as hmUI from '@zos/ui'

import { ASSETS } from '../../config/assets.ts'
import { LAYOUT } from '../../config/layout.ts'

export function createNavigationDomain({ ui }) {
  function createTapZone(rect, type, level) {
    hmUI.createWidget(hmUI.widget.IMG_CLICK, {
      x: ui.scaled(rect.x),
      y: ui.scaled(rect.y),
      w: ui.scaled(rect.w),
      h: ui.scaled(rect.h),
      src: ASSETS.interaction.tap,
      type,
      show_level: level,
    })
  }

  function createCalendarTapZone(level) {
    const rect = LAYOUT.interactions.calendar
    const tapZone = ui.createImage({
      ...rect,
      src: ASSETS.interaction.tap,
      level,
    })

    tapZone.addEventListener(hmUI.event.CLICK_UP, function () {
      launchApp({
        appId: SYSTEM_APP_CALENDAR,
        native: true,
      })
    })
  }

  function draw(level) {
    const interactions = LAYOUT.interactions

    createCalendarTapZone(level)
    createTapZone(interactions.weather, hmUI.data_type.WEATHER_CURRENT, level)
    createTapZone(interactions.sun, hmUI.data_type.SUN_CURRENT, level)
    createTapZone(interactions.alarm, hmUI.data_type.ALARM_CLOCK, level)
    createTapZone(
      interactions.alarmShortcut,
      hmUI.data_type.ALARM_CLOCK,
      level,
    )
    createTapZone(interactions.countdown, hmUI.data_type.COUNT_DOWN, level)
    createTapZone(interactions.stopwatch, hmUI.data_type.STOP_WATCH, level)
  }

  return { draw }
}
