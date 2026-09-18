import { getDeviceInfo } from "@zos/device";
import { launchApp, SYSTEM_APP_CALENDAR } from '@zos/router';
import { Time } from "@zos/sensor";
import * as hmUI from "@zos/ui";

const COLORS = {
  background: 0x000000,
  accent: 0xf2c94c,
  border: 0x65735c,
  normalGhost: 0x242424,
  aodGhost: 0x0f0f0f,
  primary: 0xe6f4c7,
  secondary: 0x9eae91,
};

const ALARM_ASSET_ROOT = "alarm/";
const INTERACTION_ASSET_ROOT = "interaction/";
const WEATHER_ASSET_ROOT = "weather/";
const DSEG7_FONT = "fonts/DSEG7Classic-Bold.ttf";
const INTER_REGULAR_FONT = "fonts/Inter-Regular.ttf";
const INTER_BOLD_FONT = "fonts/Inter-Bold.ttf";

const ALARM_ROW = {
  x: 56,
  y: 140,
};

const WEATHER_ROW = {
  iconX: 345,
  textW: 50,
  iconW: 28,
  gap: 12,
};

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEATHER_ICONS = [
  'cloud-sun.png',           // 0  Cloudy
  'cloud-sun-rain.png',      // 1  Showers
  'cloud-snow.png',          // 2  Snow showers
  'sun.png',                 // 3  Sunny
  'cloudy.png',              // 4  Overcast
  'cloud-drizzle.png',       // 5  Light rain
  'cloud-snow.png',          // 6  Light snow
  'cloud-rain.png',          // 7  Moderate rain
  'cloud-snow.png',          // 8  Moderate snow
  'cloud-snow.png',          // 9  Heavy snow
  'cloud-rain-wind.png',     // 10 Heavy rain
  'tornado.png',             // 11 Sandstorm
  'custom-sleet.png',        // 12 Rain and snow
  'cloud-fog.png',           // 13 Fog
  'haze.png',                // 14 Haze
  'cloud-lightning.png',     // 15 Thunderstorms
  'cloud-snow.png',          // 16 Snowstorm
  'wind.png',                // 17 Floating dust
  'cloud-rain-wind.png',     // 18 Very heavy rainstorm
  'cloud-hail.png',          // 19 Rain and hail
  'custom-thunder-hail.png', // 20 Thunderstorms and hail
  'cloud-rain-wind.png',     // 21 Heavy rainstorm
  'wind.png',                // 22 Dust
  'tornado.png',             // 23 Heavy sandstorm
  'cloud-rain-wind.png',     // 24 Rainstorm
  'cloud-off.png',           // 25 Unknown
  'cloud-moon.png',          // 26 Cloudy nighttime
  'cloud-moon-rain.png',     // 27 Showers nighttime
  'moon.png',                // 28 Sunny nighttime
].map(function (icon) {
  return WEATHER_ASSET_ROOT + icon;
});

let screenWidth = 480;
let screenHeight = 480;
let screenScale = 1;
let timeSensor = null;
let refreshTimer = null;
let normalTimeText = null;
let normalSecondText = null;
let normalDateText = null;
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
  };

  if (font) {
    options.font = font;
  }

  return hmUI.createWidget(hmUI.widget.TEXT, options);
}

function createDivider(x, y, w, level) {
  hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
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

  createText(
    80,
    72,
    320,
    24,
    "RETRO // DIGITAL",
    20,
    COLORS.accent,
    level,
    INTER_BOLD_FONT,
  );
  createDivider(50, 176, 380, level);
  createDivider(50, 302, 380, level);
  createText(
    187,
    409,
    107,
    18,
    "ZEPP OS / 24H",
    15,
    COLORS.secondary,
    level,
    INTER_REGULAR_FONT,
  );
}

function createAlarm(level) {
  createImage(
    ALARM_ROW.x,
    ALARM_ROW.y + 1,
    ALARM_ASSET_ROOT + "status-empty.png",
    level,
    28,
    28,
  );
  hmUI.createWidget(hmUI.widget.IMG_STATUS, {
    x: scaled(ALARM_ROW.x),
    y: scaled(ALARM_ROW.y + 1),
    w: scaled(28),
    h: scaled(28),
    src: ALARM_ASSET_ROOT + "status.png",
    type: hmUI.system_status.CLOCK,
    show_level: level,
  });

  hmUI.createWidget(hmUI.widget.TEXT_FONT, {
    x: scaled(ALARM_ROW.x + 39),
    y: scaled(ALARM_ROW.y + 4),
    w: scaled(124),
    h: scaled(22),
    text_size: scaled(22),
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
    y: scaled(141),
    w: scaled(WEATHER_ROW.iconW),
    h: scaled(28),
    image_array: WEATHER_ICONS,
    image_length: WEATHER_ICONS.length,
    type: hmUI.data_type.WEATHER_CURRENT,
    show_level: level,
  });
  hmUI.createWidget(hmUI.widget.TEXT_FONT, {
    x: scaled(textX),
    y: scaled(144),
    w: scaled(WEATHER_ROW.textW),
    h: scaled(22),
    text_size: scaled(22),
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

function createTime(level) {
  createText(
    95,
    198,
    291,
    84,
    "88:88",
    84,
    COLORS.normalGhost,
    level,
    DSEG7_FONT,
  );
  normalTimeText = createText(
    95,
    198,
    291,
    84,
    "",
    84,
    COLORS.primary,
    level,
    DSEG7_FONT,
  );
  normalSecondText = createText(
    387,
    258,
    40,
    24,
    "",
    24,
    COLORS.secondary,
    level,
    DSEG7_FONT,
  );
}

function createDate(level) {
  normalDateText = createText(
    127,
    318,
    226,
    28,
    "",
    28,
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
    timeSensor.getFullYear();

  normalDateText.setProperty(hmUI.prop.TEXT, dateText);
}

function updateDynamicData() {
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
    x: scaled(127),
    y: scaled(318),
    w: scaled(226),
    h: scaled(28),
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
    createAlarm(level);
    createWeather(level);
    createTime(level);
    createDate(level);
    createCalendarTapZone(level);

    createTapZone(310, 116, 135, 64, hmUI.data_type.WEATHER_CURRENT, level);
    createTapZone(55, 116, 135, 64, hmUI.data_type.ALARM_CLOCK, level);
    createTapZone(95, 198, 111, 84, hmUI.data_type.ALARM_CLOCK, level);
    createTapZone(275, 198, 111, 84, hmUI.data_type.COUNT_DOWN, level);
    createTapZone(387, 258, 40, 24, hmUI.data_type.STOP_WATCH, level);

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
      101,
      200,
      291,
      84,
      "88:88",
      84,
      COLORS.aodGhost,
      level,
      DSEG7_FONT,
    );
    aodTimeText = createText(
      95,
      198,
      291,
      84,
      "",
      84,
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
