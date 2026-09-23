import * as hmUI from "@zos/ui";
import {
  DATE_FORMAT_DMY,
  DATE_FORMAT_MDY,
  DATE_FORMAT_YMD,
  getDateFormat,
  getLanguage,
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
  let normalSecondText = null;
  let normalDateText = null;
  let normalWeekdayInterText = null;
  let normalWeekdaySystemText = null;
  let aodTimeText = null;

  function drawNormal(level) {
    const { time, seconds, date, weekday } = LAYOUT.clock;

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
    const { time } = LAYOUT.clock;

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
  }

  function update() {
    const weekdayIndex = Math.max(0, Math.min(6, timeSensor.getDay() - 1));
    const timeText =
      padTwo(timeSensor.getHours()) + ":" + padTwo(timeSensor.getMinutes());

    normalTimeText.setProperty(hmUI.prop.TEXT, timeText);
    normalSecondText.setProperty(
      hmUI.prop.TEXT,
      padTwo(timeSensor.getSeconds()),
    );

    if (aodTimeText !== null) {
      aodTimeText.setProperty(hmUI.prop.TEXT, timeText);
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
