import * as hmUI from '@zos/ui'

import { COLORS } from '../config/theme.ts'

export function createUi({ screenWidth, screenHeight, designWidth }) {
  const screenScale = screenWidth / designWidth

  function scaled(value) {
    return Math.round(value * screenScale)
  }

  function createImage({ x, y, src, level, w, h }) {
    const options = {
      x: scaled(x),
      y: scaled(y),
      src,
      show_level: level,
    }

    if (w !== undefined) {
      options.w = scaled(w)
    }

    if (h !== undefined) {
      options.h = scaled(h)
    }

    return hmUI.createWidget(hmUI.widget.IMG, options)
  }

  function createText({
    x,
    y,
    w,
    h,
    text,
    size,
    color,
    level,
    font,
    alignH,
  }) {
    const options = {
      x: scaled(x),
      y: scaled(y),
      w: scaled(w),
      h: scaled(h),
      text,
      text_size: scaled(size),
      color,
      align_h: alignH || hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.NONE,
      char_space: 0,
      show_level: level,
    }

    if (font) {
      options.font = font
    }

    return hmUI.createWidget(hmUI.widget.TEXT, options)
  }

  function drawBackground(level) {
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: 0,
      y: 0,
      w: screenWidth,
      h: screenHeight,
      color: COLORS.background,
      show_level: level,
    })
  }

  return {
    createImage,
    createText,
    drawBackground,
    scaled,
  }
}
