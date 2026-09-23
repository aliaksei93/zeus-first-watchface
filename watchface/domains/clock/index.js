import * as hmUI from "@zos/ui";
import {
  DATE_FORMAT_DMY,
  DATE_FORMAT_MDY,
  DATE_FORMAT_YMD,
  getDateFormat,
  getLanguage,
  getTimeFormat,
  TIME_FORMAT_12,
} from "@zos/settings";

import { LAYOUT } from "../../config/layout.ts";
import { COLORS, FONTS } from "../../config/theme.ts";
import { padTwo } from "../../shared/format.js";
import {
  INTER_WEEKDAY_LANGUAGE_IDS,
  WEEKDAYS_BY_LANGUAGE,
} from "../../shared/weekdays.js";

export function createClockDomain({ ui, timeSensor }) {
  let normalTimeText = null;
  let normalPeriodText = null;
  let normalSecondText = null;
  let normalDateText = null;
  let normalWeekdayInterText = null;
  let normalWeekdaySystemText = null;
  let aodTimeText = null;
  let aodPeriodText = null;

  function drawNormal(level) {
    const { time, period, seconds, date, weekday } = LAYOUT.clock;

    ui.createText({
      ...time,
      text: "88:88",
      color: COLORS.normalGhost,
      level,
      font: FONTS.digitalBold,
    });
    normalTimeText = ui.createText({
      ...time,
      text: "",
      color: COLORS.primary,
      level,
      font: FONTS.digitalBold,
    });
    normalPeriodText = ui.createText({
      ...period,
      text: "",
      color: COLORS.secondary,
      level,
      font: FONTS.interRegular,
    });
    normalSecondText = ui.createText({
      ...seconds,
      text: "",
      color: COLORS.secondary,
      level,
      font: FONTS.digitalBold,
    });
    normalDateText = ui.createText({
      ...date,
      text: "",
      color: COLORS.primary,
      level,
      font: FONTS.interRegular,
    });
    normalWeekdayInterText = ui.createText({
      ...weekday,
      text: "",
      color: COLORS.accent,
      level,
      font: FONTS.interRegular,
      alignH: hmUI.align.CENTER_H,
    });
    normalWeekdaySystemText = ui.createText({
      ...weekday,
      text: "",
      color: COLORS.accent,
      level,
      alignH: hmUI.align.CENTER_H,
    });
  }

  function drawAod(level) {
    const { time, period } = LAYOUT.clock;

    ui.createText({
      ...time,
      text: "88:88",
      color: COLORS.aodGhost,
      level,
      font: FONTS.digitalBold,
    });
    aodTimeText = ui.createText({
      ...time,
      text: "",
      color: COLORS.primary,
      level,
      font: FONTS.digitalBold,
    });
    aodPeriodText = ui.createText({
      ...period,
      text: "",
      color: COLORS.secondary,
      level,
      font: FONTS.interRegular,
    });
  }

  function update() {
    const weekdayIndex = Math.max(0, Math.min(6, timeSensor.getDay() - 1));
    const hours = timeSensor.getHours();
    const use12Hour = getTimeFormat() === TIME_FORMAT_12;
    const displayHours = use12Hour ? timeSensor.getFormatHour() : hours;
    const timeText = padTwo(displayHours) + ":" + padTwo(timeSensor.getMinutes());
    const periodText = hours < 12 ? "AM" : "PM";

    normalTimeText.setProperty(hmUI.prop.TEXT, timeText);
    normalPeriodText.setProperty(hmUI.prop.TEXT, periodText);
    normalPeriodText.setProperty(hmUI.prop.VISIBLE, use12Hour);
    normalSecondText.setProperty(
      hmUI.prop.TEXT,
      padTwo(timeSensor.getSeconds()),
    );

    if (aodTimeText !== null) {
      aodTimeText.setProperty(hmUI.prop.TEXT, timeText);
      aodPeriodText.setProperty(hmUI.prop.TEXT, periodText);
      aodPeriodText.setProperty(hmUI.prop.VISIBLE, use12Hour);
    }

    const day = padTwo(timeSensor.getDate());
    const month = padTwo(timeSensor.getMonth());
    const year = String(timeSensor.getFullYear());
    let dateText = day + "." + month + "." + year;

    switch (getDateFormat()) {
      case DATE_FORMAT_YMD:
        dateText = year + "." + month + "." + day;
        break;
      case DATE_FORMAT_MDY:
        dateText = month + "." + day + "." + year;
        break;
      case DATE_FORMAT_DMY:
      default:
        break;
    }

    normalDateText.setProperty(hmUI.prop.TEXT, dateText);
    const language = getLanguage();
    const weekdays = WEEKDAYS_BY_LANGUAGE[language] || WEEKDAYS_BY_LANGUAGE[2];
    const weekdayText = weekdays[weekdayIndex];
    const useInter = INTER_WEEKDAY_LANGUAGE_IDS[language] === true;

    normalWeekdayInterText.setProperty(hmUI.prop.TEXT, weekdayText);
    normalWeekdaySystemText.setProperty(hmUI.prop.TEXT, weekdayText);
    normalWeekdayInterText.setProperty(hmUI.prop.VISIBLE, useInter);
    normalWeekdaySystemText.setProperty(hmUI.prop.VISIBLE, !useInter);
  }

  return {
    drawAod,
    drawNormal,
    update,
  };
}
