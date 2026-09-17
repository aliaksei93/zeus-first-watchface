# Weather icon set

The editable 28 × 28 vector set is on the [05 · Weather icons / Zepp Penpot page](https://design.penpot.app/#/workspace?team-id=d8ac01df-6646-81d2-8008-9f16a40734a5&file-id=d8ac01df-6646-81d2-8008-9f1833294164&page-id=98fbeb39-3f72-804c-8008-a6f432d5d291&layout=layers&board-id=98fbeb39-3f72-804c-8008-a6f43333883b). It has one slot for each of Zepp's 29 weather condition codes, plus sunrise and sunset. Similar conditions intentionally share a vector icon. The corresponding PNGs in `assets/480x480-amazfit-balance-2/weather/` were exported from that Penpot page at 28 × 28. `watchface/index.js` maps condition codes 0–28 to the PNGs.

The source vectors are stored here for future edits and reimport:

- `upstream/lucide/`: 18 [Lucide](https://lucide.dev/icons/) icons from `lucide-static@1.47.0`, with the complete upstream license in `LICENSE`.
- `upstream/tabler/`: [Tabler](https://tabler.io/icons) sunrise and sunset icons from `@tabler/icons@3.46.0`, with the complete upstream license in `LICENSE`. Their stroke is 1.5 to make them lighter than the previous sun-time icons.
- `custom/`: sleet and thunder-with-hail icons drawn for weather conditions without a matching icon in the selected sets.

All vectors use the watch face's light green `#e6f4c7`. The SVGs have a 28 × 28 outer size; their original view boxes are retained. The sunrise and sunset PNGs are ready for the sun-time widget but are not yet used by the current watch-face runtime.
