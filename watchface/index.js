import { getDeviceInfo } from "@zos/device";
import { launchApp, SYSTEM_APP_CALENDAR } from "@zos/router";
import { Time, Weather } from "@zos/sensor";
import * as hmUI from "@zos/ui";

const COLORS = {
  background: 0x000000,
  accent: 0xf2c94c,
  border: 0x65735c,
  normalGhost: 0x1e1e1e,
  aodGhost: 0x1e1e1e,
  primary: 0xe6f4c7,
  secondary: 0x9eae91,
};

const ALARM_ASSET_ROOT = "alarm/";
const INTERACTION_ASSET_ROOT = "interaction/";
const WEATHER_ASSET_ROOT = "weather/";
const DSEG7_FONT = "fonts/DSEG7Classic-Bold.ttf";
const INTER_REGULAR_FONT = "fonts/Inter-Regular.ttf";

const ALARM_ROW = {
  x: 55,
  y: 123,
};

const WEATHER_ROW = {
  iconX: 340,
  y: 123,
  textW: 51,
  iconW: 30,
  gap: 9,
};

const SUN_ROW = {
  iconX: 189,
  textW: 65,
  iconW: 28,
  gap: 3,
};

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEATHER_ICONS = [
  "cloud-sun.png", // 0  Cloudy
  "cloud-sun-rain.png", // 1  Showers
  "cloud-snow.png", // 2  Snow showers
  "sun.png", // 3  Sunny
  "cloudy.png", // 4  Overcast
  "cloud-drizzle.png", // 5  Light rain
  "cloud-snow.png", // 6  Light snow
  "cloud-rain.png", // 7  Moderate rain
  "cloud-snow.png", // 8  Moderate snow
  "cloud-snow.png", // 9  Heavy snow
  "cloud-rain-wind.png", // 10 Heavy rain
  "tornado.png", // 11 Sandstorm
  "custom-sleet.png", // 12 Rain and snow
  "cloud-fog.png", // 13 Fog
  "haze.png", // 14 Haze
  "cloud-lightning.png", // 15 Thunderstorms
  "cloud-snow.png", // 16 Snowstorm
  "wind.png", // 17 Floating dust
  "cloud-rain-wind.png", // 18 Very heavy rainstorm
  "cloud-hail.png", // 19 Rain and hail
  "custom-thunder-hail.png", // 20 Thunderstorms and hail
  "cloud-rain-wind.png", // 21 Heavy rainstorm
  "wind.png", // 22 Dust
  "tornado.png", // 23 Heavy sandstorm
  "cloud-rain-wind.png", // 24 Rainstorm
  "cloud-off.png", // 25 Unknown
  "cloud-moon.png", // 26 Cloudy nighttime
  "cloud-moon-rain.png", // 27 Showers nighttime
  "moon.png", // 28 Sunny nighttime
].map(function (icon) {
  return WEATHER_ASSET_ROOT + icon;
});

let screenWidth = 480;
let screenHeight = 480;
let screenScale = 1;
let timeSensor = null;
let weatherSensor = null;
let refreshTimer = null;
let normalTimeText = null;
let normalSecondText = null;
let normalDateText = null;
let sunIcon = null;
let sunTimesText = null;
let sunTimes = null;
let sunTimesDate = "";
let aodTimeText = null;

function scaled(value) {
  return Math.round(value * screenScale);
}

function padded(value) {
  return String(value).padStart(2, "0");
}

function createImage(x, y, src, level, w, h) {
  const options = {
    x: scaled(x),
    y: scaled(y),
    src: src,
    show_level: level,
  };

  if (w !== undefined) {
    options.w = scaled(w);
  }

  if (h !== undefined) {
    options.h = scaled(h);
  }

  return hmUI.createWidget(hmUI.widget.IMG, options);
}

function createText(x, y, w, h, text, size, color, level, font, alignH) {
  const options = {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
    h: scaled(h),
    text: text,
    text_size: scaled(size),
    color: color,
    align_h: alignH || hmUI.align.CENTER_H,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
    char_space: 0,
    show_level: level,
  };

  if (font) {
    options.font = font;
  }

  return hmUI.createWidget(hmUI.widget.TEXT, options);
}

function createDivider(y, level) {
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: scaled(45),
    y: scaled(y),
    w: scaled(390),
    h: scaled(2),
    color: COLORS.border,
    show_level: level,
  });
}

function createFrame(level) {
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: 0,
    y: 0,
    w: screenWidth,
    h: screenHeight,
    color: COLORS.background,
    show_level: level,
  });

  createDivider(163, level);
  createDivider(315, level);
}

function createAlarm(level) {
  hmUI.createWidget(hmUI.widget.IMG, {
    x: scaled(ALARM_ROW.x),
    y: scaled(ALARM_ROW.y),
    w: scaled(30),
    h: scaled(30),
    src: ALARM_ASSET_ROOT + "status.png",
    show_level: level,
  });

  hmUI.createWidget(hmUI.widget.TEXT_FONT, {
    x: scaled(ALARM_ROW.x + 39),
    y: scaled(ALARM_ROW.y + 3),
    w: scaled(124),
    h: scaled(24),
    text_size: scaled(24),
    font: INTER_REGULAR_FONT,
    color: COLORS.primary,
    char_space: 0,
    line_space: 0,
    padding: true,
    align_h: hmUI.align.LEFT,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
    type: hmUI.data_type.ALARM_CLOCK,
    show_level: level,
  });
}

function createWeather(level) {
  const textX = WEATHER_ROW.iconX + WEATHER_ROW.iconW + WEATHER_ROW.gap;

  hmUI.createWidget(hmUI.widget.IMG_LEVEL, {
    x: scaled(WEATHER_ROW.iconX),
    y: scaled(WEATHER_ROW.y),
    w: scaled(WEATHER_ROW.iconW),
    h: scaled(28),
    image_array: WEATHER_ICONS,
    image_length: WEATHER_ICONS.length,
    type: hmUI.data_type.WEATHER_CURRENT,
    show_level: level,
  });
  hmUI.createWidget(hmUI.widget.TEXT_FONT, {
    x: scaled(textX),
    y: scaled(WEATHER_ROW.y + 3),
    w: scaled(WEATHER_ROW.textW),
    h: scaled(24),
    text_size: scaled(24),
    font: INTER_REGULAR_FONT,
    color: COLORS.primary,
    char_space: 0,
    line_space: 0,
    align_h: hmUI.align.LEFT,
    align_v: hmUI.align.CENTER_V,
    text_style: hmUI.text_style.NONE,
    type: hmUI.data_type.WEATHER_CURRENT,
    unit_type: 1,
    show_level: level,
  });
}

function getDateKey() {
  return (
    timeSensor.getFullYear() +
    "-" +
    padded(timeSensor.getMonth()) +
    "-" +
    padded(timeSensor.getDate())
  );
}

function refreshSunTimes() {
  sunTimesDate = getDateKey();
  sunTimes = null;

  try {
    const forecast = weatherSensor.getForecast();

    if (forecast && forecast.tideData && forecast.tideData.count > 0) {
      sunTimes = forecast.tideData.data[0];
    }
  } catch (error) {
    sunTimes = null;
  }
}

function updateSunIcon() {
  if (sunIcon === null || sunTimesText === null) {
    return;
  }

  if (sunTimesDate !== getDateKey()) {
    refreshSunTimes();
  }

  let asset = WEATHER_ASSET_ROOT + "sunrise.png";
  let text = "--";

  if (sunTimes !== null) {
    const currentMinutes = timeSensor.getHours() * 60 + timeSensor.getMinutes();
    const sunriseMinutes = sunTimes.sunrise.hour * 60 + sunTimes.sunrise.minute;
    const sunsetMinutes = sunTimes.sunset.hour * 60 + sunTimes.sunset.minute;

    if (currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes) {
      asset = WEATHER_ASSET_ROOT + "sunset.png";
      text =
        padded(sunTimes.sunset.hour) + ":" + padded(sunTimes.sunset.minute);
    } else {
      text =
        padded(sunTimes.sunrise.hour) + ":" + padded(sunTimes.sunrise.minute);
    }
  }

  sunIcon.setProperty(hmUI.prop.SRC, asset);
  sunTimesText.setProperty(hmUI.prop.TEXT, text);
}

function createSun(level) {
  const textX = SUN_ROW.iconX + SUN_ROW.iconW + SUN_ROW.gap;

  sunIcon = createImage(
    SUN_ROW.iconX,
    417,
    WEATHER_ASSET_ROOT + "sunrise.png",
    level,
    SUN_ROW.iconW,
    SUN_ROW.iconW,
  );
  sunTimesText = createText(
    textX,
    420,
    SUN_ROW.textW,
    22,
    "--",
    22,
    COLORS.primary,
    level,
    INTER_REGULAR_FONT,
    hmUI.align.RIGHT,
  );

  refreshSunTimes();
  updateSunIcon();
}

function createTime(level) {
  createText(
    84,
    195,
    312,
    90,
    "88:88",
    90,
    COLORS.normalGhost,
    level,
    DSEG7_FONT,
  );
  normalTimeText = createText(
    84,
    195,
    312,
    90,
    "",
    90,
    COLORS.primary,
    level,
    DSEG7_FONT,
  );
  normalSecondText = createText(
    394,
    259,
    43,
    26,
    "",
    26,
    COLORS.secondary,
    level,
    DSEG7_FONT,
  );
}

function createDate(level) {
  normalDateText = createText(
    151,
    345,
    178,
    26,
    "",
    26,
    COLORS.primary,
    level,
    INTER_REGULAR_FONT,
  );
}

function updateTime() {
  const weekdayIndex = Math.max(0, Math.min(6, timeSensor.getDay() - 1));

  const timeText =
    padded(timeSensor.getHours()) + ":" + padded(timeSensor.getMinutes());
  const secondText = padded(timeSensor.getSeconds());

  normalTimeText.setProperty(hmUI.prop.TEXT, timeText);
  normalSecondText.setProperty(hmUI.prop.TEXT, secondText);

  if (aodTimeText !== null) {
    aodTimeText.setProperty(hmUI.prop.TEXT, timeText);
  }

  const dateText =
    WEEKDAYS[weekdayIndex] +
    " " +
    padded(timeSensor.getDate()) +
    "." +
    padded(timeSensor.getMonth()) +
    "." +
    String(timeSensor.getFullYear()).slice(-2);

  normalDateText.setProperty(hmUI.prop.TEXT, dateText);
  updateSunIcon();
}

function updateDynamicData() {
  refreshSunTimes();
  updateTime();
}

function createTapZone(x, y, w, h, type, level) {
  hmUI.createWidget(hmUI.widget.IMG_CLICK, {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
    h: scaled(h),
    src: INTERACTION_ASSET_ROOT + "tap.png",
    type: type,
    show_level: level,
  });
}

function createCalendarTapZone(level) {
  const tapZone = hmUI.createWidget(hmUI.widget.IMG, {
    x: scaled(135),
    y: scaled(334),
    w: scaled(210),
    h: scaled(48),
    src: INTERACTION_ASSET_ROOT + "tap.png",
    show_level: level,
  });

  tapZone.addEventListener(hmUI.event.CLICK_UP, function () {
    launchApp({
      appId: SYSTEM_APP_CALENDAR,
      native: true,
    });
  });
}

WatchFace({
  drawNormal() {
    const level = hmUI.show_level.ONLY_NORMAL;

    createFrame(level);
    createWeather(level);
    createSun(level);
    createTime(level);
    createDate(level);
    createAlarm(level);
    createCalendarTapZone(level);

    createTapZone(305, 108, 140, 60, hmUI.data_type.WEATHER_CURRENT, level);
    createTapZone(180, 400, 120, 56, hmUI.data_type.SUN_CURRENT, level);
    createTapZone(45, 108, 185, 60, hmUI.data_type.ALARM_CLOCK, level);
    createTapZone(84, 195, 112, 90, hmUI.data_type.ALARM_CLOCK, level);
    createTapZone(284, 195, 110, 90, hmUI.data_type.COUNT_DOWN, level);
    createTapZone(394, 249, 43, 46, hmUI.data_type.STOP_WATCH, level);

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: updateDynamicData,
    });
  },

  drawAod() {
    const level = hmUI.show_level.ONAL_AOD;

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: screenWidth,
      h: screenHeight,
      color: COLORS.background,
      show_level: level,
    });

    createText(
      84,
      195,
      312,
      90,
      "88:88",
      90,
      COLORS.aodGhost,
      level,
      DSEG7_FONT,
    );
    aodTimeText = createText(
      84,
      195,
      312,
      90,
      "",
      90,
      COLORS.primary,
      level,
      DSEG7_FONT,
    );
  },

  onInit() {
    const deviceInfo = getDeviceInfo();

    screenWidth = deviceInfo.width;
    screenHeight = deviceInfo.height;
    screenScale = screenWidth / 480;
    timeSensor = new Time();
    weatherSensor = new Weather();
  },

  build() {
    this.drawNormal();
    this.drawAod();
    updateDynamicData();
    refreshTimer = setInterval(updateTime, 1000);
  },

  onDestroy() {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  },
});
