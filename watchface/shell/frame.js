import * as hmUI from '@zos/ui'

import { LAYOUT } from '../config/layout.ts'
import { COLORS } from '../config/theme.ts'

export function createFrame({ ui }) {
  function drawDivider(y, level) {
    const frame = LAYOUT.frame

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: ui.scaled(frame.dividerX),
      y: ui.scaled(y),
      w: ui.scaled(frame.dividerWidth),
      h: ui.scaled(frame.dividerHeight),
      color: COLORS.border,
      show_level: level,
    })
  }

  function drawNormal(level) {
    ui.drawBackground(level)

    LAYOUT.frame.dividerY.forEach(function (y) {
      drawDivider(y, level)
    })
  }

  function drawAod(level) {
    ui.drawBackground(level)
  }

  return { drawAod, drawNormal }
}
