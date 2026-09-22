import * as hmUI from '@zos/ui'

import { ASSETS } from '../../config/assets.ts'
import { LAYOUT } from '../../config/layout.ts'
import { COLORS, FONTS } from '../../config/theme.ts'

export function createAlarmDomain({ ui }) {
  function draw(level) {
    const { icon, text } = LAYOUT.alarm

    ui.createImage({ ...icon, src: ASSETS.alarm.status, level })

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
      align_h: hmUI.align.LEFT,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
      type: hmUI.data_type.ALARM_CLOCK,
      show_level: level,
    })
  }

  return { draw }
}
