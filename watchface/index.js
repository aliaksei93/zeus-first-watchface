import { getDeviceInfo } from "@zos/device";
import { Time } from "@zos/sensor";
import * as hmUI from "@zos/ui";

const COLORS = {
  background: 0x000000,
  border: 0x65735c,
  normalGhost: 0x242424,
  aodGhost: 0x0f0f0f,
  primary: 0xe6f4c7,
  secondary: 0x9eae91,
};

const UI_ASSET_ROOT = "ui/";
const ALARM_ASSET_ROOT = "alarm/";
const DATE_ASSET_ROOT = "date/";
const WEATHER_ASSET_ROOT = "weather/";
const DSEG7_FONT = "fonts/DSEG7Classic-Bold.ttf";

function createDigitArray(root) {
  return Array.from({ length: 10 }, function (_, index) {
    return root + index + ".png";
  });
}

const ALARM_DIGITS = createDigitArray(ALARM_ASSET_ROOT);
const DATE_DIGITS = createDigitArray(DATE_ASSET_ROOT);
const WEATHER_DIGITS = createDigitArray(WEATHER_ASSET_ROOT);

const WEEKDAY_IMAGES = [
  DATE_ASSET_ROOT + "weekday-mon.png",
  DATE_ASSET_ROOT + "weekday-tue.png",
  DATE_ASSET_ROOT + "weekday-wed.png",
  DATE_ASSET_ROOT + "weekday-thu.png",
  DATE_ASSET_ROOT + "weekday-fri.png",
  DATE_ASSET_ROOT + "weekday-sat.png",
  DATE_ASSET_ROOT + "weekday-sun.png",
];
const WEEKDAY_PREFIX_WIDTHS = [77, 65, 74, 69, 51, 62, 69];
const DATE_DIGITS_WIDTH = 152;

let screenWidth = 480;
let screenHeight = 480;
let screenScale = 1;
let timeSensor = null;
let refreshTimer = null;
let normalTimeText = null;
let normalSecondText = null;
let normalWeekdayImage = null;
let normalDateImages = [];
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

  createImage(80, 70, UI_ASSET_ROOT + "brand.png", level, 320, 28);
  createDivider(55, 176, 380, level);
  createDivider(50, 302, 380, level);
  createImage(110, 406, UI_ASSET_ROOT + "meta.png", level, 260, 24);
}

function createAlarm(level) {
  hmUI.createWidget(hmUI.widget.IMG_STATUS, {
    x: scaled(57),
    y: scaled(140),
    src: ALARM_ASSET_ROOT + "status.png",
    type: hmUI.system_status.CLOCK,
    show_level: level,
  });

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(94),
    y: scaled(144),
    w: scaled(59),
    h: scaled(22),
    font_array: ALARM_DIGITS,
    dot_image: ALARM_ASSET_ROOT + "colon.png",
    invalid_image: ALARM_ASSET_ROOT + "empty.png",
    h_space: 0,
    padding: true,
    align_h: hmUI.align.LEFT,
    type: hmUI.data_type.ALARM_CLOCK,
    show_level: level,
  });
}

function createWeather(level) {
  createImage(335, 140, WEATHER_ASSET_ROOT + "thunder.png", level, 30, 30);
  createImage(377, 142, WEATHER_ASSET_ROOT + "plus.png", level, 14, 22);

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: scaled(391),
    y: scaled(142),
    w: scaled(47),
    h: scaled(22),
    font_array: WEATHER_DIGITS,
    unit_sc: WEATHER_ASSET_ROOT + "unit-c.png",
    unit_en: WEATHER_ASSET_ROOT + "unit-c.png",
    unit_tc: WEATHER_ASSET_ROOT + "unit-c.png",
    imperial_unit_sc: WEATHER_ASSET_ROOT + "unit-f.png",
    imperial_unit_en: WEATHER_ASSET_ROOT + "unit-f.png",
    imperial_unit_tc: WEATHER_ASSET_ROOT + "unit-f.png",
    negative_image: WEATHER_ASSET_ROOT + "minus.png",
    invalid_image: WEATHER_ASSET_ROOT + "empty.png",
    h_space: 0,
    align_h: hmUI.align.RIGHT,
    type: hmUI.data_type.WEATHER_CURRENT,
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
  normalWeekdayImage = createImage(127, 318, WEEKDAY_IMAGES[0], level);

  normalDateImages = [];
  let x = 204;
  const placeholder = "00.00.0000";

  for (let index = 0; index < placeholder.length; index += 1) {
    const isDot = placeholder[index] === ".";
    const width = isDot ? 8 : 17;
    const src = isDot ? DATE_ASSET_ROOT + "dot.png" : DATE_DIGITS[0];

    normalDateImages.push(createImage(x, 318, src, level, width, 28));
    x += width;
  }
}

function updateTime() {
  const weekdayIndex = Math.max(0, Math.min(6, timeSensor.getDay() - 1));
  const weekdayWidth = WEEKDAY_PREFIX_WIDTHS[weekdayIndex];
  const dateStartX = Math.floor((480 - weekdayWidth - DATE_DIGITS_WIDTH) / 2);

  const timeText =
    padded(timeSensor.getHours()) + ":" + padded(timeSensor.getMinutes());
  const secondText = padded(timeSensor.getSeconds());

  normalTimeText.setProperty(hmUI.prop.TEXT, timeText);
  normalSecondText.setProperty(hmUI.prop.TEXT, secondText);

  if (aodTimeText !== null) {
    aodTimeText.setProperty(hmUI.prop.TEXT, timeText);
  }

  normalWeekdayImage.setProperty(hmUI.prop.MORE, {
    x: scaled(dateStartX),
    y: scaled(318),
    src: WEEKDAY_IMAGES[weekdayIndex],
    w: scaled(weekdayWidth),
    h: scaled(28),
    show_level: hmUI.show_level.ONLY_NORMAL,
  });

  const dateText =
    padded(timeSensor.getDate()) +
    "." +
    padded(timeSensor.getMonth()) +
    "." +
    timeSensor.getFullYear();
  let dateX = dateStartX + weekdayWidth;

  for (let index = 0; index < dateText.length; index += 1) {
    const isDot = dateText[index] === ".";
    const width = isDot ? 8 : 17;
    const src = isDot
      ? DATE_ASSET_ROOT + "dot.png"
      : DATE_DIGITS[Number(dateText[index])];

    normalDateImages[index].setProperty(hmUI.prop.MORE, {
      x: scaled(dateX),
      y: scaled(318),
      w: scaled(width),
      h: scaled(28),
      src: src,
      show_level: hmUI.show_level.ONLY_NORMAL,
    });
    dateX += width;
  }
}

function createTapZone(x, y, w, h, type, level) {
  hmUI.createWidget(hmUI.widget.IMG_CLICK, {
    x: scaled(x),
    y: scaled(y),
    w: scaled(w),
    h: scaled(h),
    src: ALARM_ASSET_ROOT + "tap.png",
    type: type,
    show_level: level,
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

    createTapZone(95, 198, 111, 84, hmUI.data_type.ALARM_CLOCK, level);
    createTapZone(275, 198, 111, 84, hmUI.data_type.COUNT_DOWN, level);
    createTapZone(387, 258, 40, 24, hmUI.data_type.STOP_WATCH, level);

    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
      resume_call: updateTime,
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
    updateTime();
    refreshTimer = setInterval(updateTime, 1000);
  },

  onDestroy() {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  },
});
