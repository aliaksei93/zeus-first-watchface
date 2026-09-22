import { getDeviceInfo } from '@zos/device'
import { Time, Weather } from '@zos/sensor'
import * as hmUI from '@zos/ui'

import { LAYOUT } from './config/layout.ts'
import { createAlarmDomain } from './domains/alarm/index.js'
import { createClockDomain } from './domains/clock/index.js'
import { createNavigationDomain } from './domains/navigation/index.js'
import { createWeatherDomain } from './domains/weather/index.js'
import { createFrame } from './shell/frame.js'
import { createUi } from './shared/ui.js'

let frame = null
let clockDomain = null
let weatherDomain = null
let alarmDomain = null
let navigationDomain = null
let refreshTimer = null

function updateVisibleData() {
  clockDomain.update()
  weatherDomain.update()
}

function refreshDynamicData() {
  weatherDomain.refresh()
  updateVisibleData()
}

WatchFace({
  drawNormal() {
    const level = hmUI.show_level.ONLY_NORMAL

    frame.drawNormal(level)
    weatherDomain.drawCurrent(level)
    weatherDomain.drawSun(level)
    clockDomain.drawNormal(level)
    alarmDomain.draw(level)
    navigationDomain.draw(level)

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: refreshDynamicData,
    })
  },

  drawAod() {
    const level = hmUI.show_level.ONAL_AOD

    frame.drawAod(level)
    clockDomain.drawAod(level)
  },

  onInit() {
    const deviceInfo = getDeviceInfo()
    const ui = createUi({
      screenWidth: deviceInfo.width,
      screenHeight: deviceInfo.height,
      designWidth: LAYOUT.designWidth,
    })
    const timeSensor = new Time()

    frame = createFrame({ ui })
    clockDomain = createClockDomain({ ui, timeSensor })
    weatherDomain = createWeatherDomain({
      ui,
      timeSensor,
      weatherSensor: new Weather(),
    })
    alarmDomain = createAlarmDomain({ ui })
    navigationDomain = createNavigationDomain({ ui })
  },

  build() {
    this.drawNormal()
    this.drawAod()
    refreshDynamicData()
    refreshTimer = setInterval(updateVisibleData, 1000)
  },

  onDestroy() {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  },
})
