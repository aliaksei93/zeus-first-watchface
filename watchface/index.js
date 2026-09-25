import { getDeviceInfo } from "@zos/device";
import { Battery, Time, Weather } from "@zos/sensor";
import * as hmUI from "@zos/ui";

import { LAYOUT } from "./config/layout.ts";
import { createAlarmDomain } from "./domains/alarm/index.js";
import { createBatteryDomain } from "./domains/battery/index.js";
import { createClockDomain } from "./domains/clock/index.js";
import { createNavigationDomain } from "./domains/navigation/index.js";
import { createSunDomain } from "./domains/sun/index.js";
import { createWeatherDomain } from "./domains/weather/index.js";
import { createFrame } from "./shell/frame.js";
import { createUi } from "./shared/ui.js";

let frame = null;
let clockDomain = null;
let weatherDomain = null;
let sunDomain = null;
let alarmDomain = null;
let batteryDomain = null;
let navigationDomain = null;
let timeSensor = null;
let secondsTimer = null;
let isActive = false;

function updateMinuteData() {
  if (!isActive) {
    return;
  }

  clockDomain.updateTime();
  clockDomain.updateDate();
  sunDomain.update();
  batteryDomain.refresh();
}

function pauseWatchface() {
  isActive = false;

  if (secondsTimer !== null) {
    clearInterval(secondsTimer);
    secondsTimer = null;
  }
}

function resumeWatchface() {
  if (isActive) {
    return;
  }

  isActive = true;
  sunDomain.refresh();
  updateMinuteData();
  clockDomain.updateSeconds();
  secondsTimer = setInterval(function () {
    clockDomain.updateSeconds();
  }, 1000);
}

WatchFace({
  drawNormal() {
    const level = hmUI.show_level.ONLY_NORMAL;

    frame.drawNormal(level);
    weatherDomain.draw(level);
    sunDomain.draw(level);
    clockDomain.drawNormal(level);
    alarmDomain.draw(level);
    batteryDomain.draw(level);
    navigationDomain.draw(level);
  },

  drawAod() {
    const level = hmUI.show_level.ONAL_AOD;

    frame.drawAod(level);
    clockDomain.drawAod(level);
  },

  onInit() {
    const deviceInfo = getDeviceInfo();
    const ui = createUi({
      screenWidth: deviceInfo.width,
      screenHeight: deviceInfo.height,
      designWidth: LAYOUT.designWidth,
    });
    timeSensor = new Time();

    frame = createFrame({ ui });
    clockDomain = createClockDomain({ ui, timeSensor });
    weatherDomain = createWeatherDomain({ ui });
    sunDomain = createSunDomain({
      ui,
      timeSensor,
      weatherSensor: new Weather(),
    });
    alarmDomain = createAlarmDomain({ ui });
    batteryDomain = createBatteryDomain({
      ui,
      batterySensor: new Battery(),
    });
    navigationDomain = createNavigationDomain({ ui });
  },

  build() {
    this.drawNormal();
    this.drawAod();
    timeSensor.onPerMinute(updateMinuteData);

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: resumeWatchface,
      pause_call: pauseWatchface,
    });

    resumeWatchface();
  },

  onDestroy() {
    batteryDomain.destroy();
    pauseWatchface();
  },
});
