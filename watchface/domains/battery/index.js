import { ASSETS } from "../../config/assets.ts";
import { LAYOUT } from "../../config/layout.ts";
import * as hmUI from "@zos/ui";

const BATTERY_STATES = [
  // 0–5%
  { maximum: 5, asset: "empty" },
  // 6–30%
  { maximum: 30, asset: "low" },
  // 31–60%
  { maximum: 60, asset: "medium" },
  // 61–89%
  { maximum: 89, asset: "high" },
  // 90–100%
  { maximum: 100, asset: "full" },
];

function getBatteryAsset(charge) {
  const normalizedCharge = Math.max(0, Math.min(100, charge));
  return BATTERY_STATES.find(({ maximum }) => normalizedCharge <= maximum)
    .asset;
}

export function createBatteryDomain({ ui, batterySensor }) {
  let widget = null;
  let shownAsset = null;
  let shownLevel = null;
  let isListening = false;

  function render(level) {
    const asset = getBatteryAsset(batterySensor.getCurrent());

    if (widget !== null && asset === shownAsset) {
      return;
    }

    shownAsset = asset;

    if (widget === null) {
      widget = ui.createImage({
        ...LAYOUT.battery.icon,
        src: ASSETS.battery[asset],
        level,
      });
      return;
    }

    widget.setProperty(hmUI.prop.MORE, { src: ASSETS.battery[asset] });
  }

  function onChange() {
    refresh();
  }

  function refresh() {
    if (shownLevel !== null) {
      render(shownLevel);
    }
  }

  function subscribe() {
    if (isListening) {
      return;
    }

    batterySensor.onChange(onChange);
    isListening = true;
  }

  function draw(level) {
    shownLevel = level;
    subscribe();
    refresh();
  }

  function destroy() {
    if (isListening) {
      batterySensor.offChange(onChange);
      isListening = false;
    }
  }

  return { draw, refresh, destroy };
}
