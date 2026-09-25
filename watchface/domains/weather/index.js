import * as hmUI from '@zos/ui'

import { WEATHER_ICONS } from '../../config/assets.ts'
import { LAYOUT } from '../../config/layout.ts'
import { COLORS, FONTS } from '../../config/theme.ts'

export function createWeatherDomain({ ui }) {
  function draw(level) {
    const { icon, text } = LAYOUT.weather

    hmUI.createWidget(hmUI.widget.IMG_LEVEL, {
      x: ui.scaled(icon.x),
      y: ui.scaled(icon.y),
      w: ui.scaled(icon.w),
      h: ui.scaled(icon.h),
      image_array: WEATHER_ICONS,
      image_length: WEATHER_ICONS.length,
      type: hmUI.data_type.WEATHER_CURRENT,
      show_level: level,
    })
    hmUI.createWidget(hmUI.widget.TEXT_FONT, {
      x: ui.scaled(text.x),
      y: ui.scaled(text.y),
      w: ui.scaled(text.w),
      h: ui.scaled(text.h),
      text_size: ui.scaled(text.size),
      font: FONTS.interRegular,
      color: COLORS.primary,
      char_space: 0,
      line_space: 0,
      padding: true,
      align_h: hmUI.align.RIGHT,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
      type: hmUI.data_type.WEATHER_CURRENT,
      unit_type: 1,
      show_level: level,
    })
  }

  return { draw }
}
