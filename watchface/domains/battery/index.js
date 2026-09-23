import { ASSETS } from "../../config/assets.ts";
import { LAYOUT } from "../../config/layout.ts";
import * as hmUI from "@zos/ui";

const BATTERY_STATES = [
  { maximum: 0, asset: "empty" },
  { maximum: 10, asset: "warning" },
  { maximum: 35, asset: "low" },
  { maximum: 70, asset: "medium" },
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
    if (shownLevel !== null) {
      render(shownLevel);
    }
  }

  function draw(level) {
    shownLevel = level;
    render(level);
    batterySensor.onChange(onChange);
  }

  function destroy() {
    batterySensor.offChange(onChange);
  }

  return { draw, destroy };
}
