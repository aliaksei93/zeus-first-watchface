# Repository Guidelines

## Project Structure & Module Organization

This is a minimal Zepp OS 2 watch-face project. `app.js` owns application-level lifecycle hooks and shared state. `watchface/index.js` contains the watch-face lifecycle and is the main place for UI construction and sensor binding. `app.json` defines metadata, API compatibility, permissions, and supported device targets. Keep device-specific resources under `assets/<resolution>-<device>/`, matching the target keys in `app.json`. The `dist/` directory contains generated `.zab` packages; do not edit its contents manually.

## Build, Test, and Development Commands

The project has no `package.json`; commands require the globally installed Zeus CLI (`npm install --global @zeppos/zeus-cli`). Run commands from the repository root:

- `zeus dev` compiles the watch face, connects to the running Zepp OS Simulator, and rebuilds on changes.
- `zeus build` produces an installable `.zab` package in `dist/`.
- `zeus preview` builds a device preview and displays a QR code for installation through Zepp App Developer Mode.
- `zeus status` checks CLI login and simulator connectivity when previewing fails.

## Coding Style & Naming Conventions

Use two-space indentation in JavaScript and JSON, single quotes in JavaScript, and no semicolons, consistent with the current files. Keep Zepp lifecycle method names exact (`onCreate`, `onInit`, `build`, `onDestroy`). Prefer descriptive `camelCase` identifiers and uppercase constants for reusable layout values. Name new target asset directories exactly like their `app.json` target key. No formatter or linter is configured, so keep diffs focused and preserve surrounding style.

## Testing Guidelines

There is no automated test suite or coverage threshold. Before submitting a change, run `zeus build`, then exercise it with `zeus dev` on both configured resolutions. Check lifecycle logs, element placement, clipping, and readability. For hardware-dependent behavior, also run `zeus preview` on a compatible watch. Document which targets were tested and any unavailable hardware.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so no repository-specific commit convention can be inferred. Use short, imperative subjects such as `Add battery indicator`, and keep unrelated changes separate. Pull requests should explain the visible behavior, list validation commands and devices, link the relevant issue, and include before/after screenshots for UI changes. Call out changes to permissions, API versions, target metadata, or generated release artifacts.

## Configuration & Security

Keep permissions in `app.json` minimal. Never commit account tokens, QR-login data, or device identifiers. Update version code and name deliberately for release builds.
