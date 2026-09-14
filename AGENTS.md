# Repository Guidelines

## Penpot-to-Repository Contract

- Penpot is the read-only source of truth for design-sync tasks. The repository is the mutation target.
- Never modify Penpot or upload repository renders, screenshots, or generated assets to it unless the user explicitly requests a design edit. The Penpot MCP exposes write tools, so begin every connection with a read-only inspection.
- At the start of every sync, state the contract explicitly: `Penpot (read-only) -> repository -> build -> Normal/AOD verification`.
- The only supported target is `480x480-amazfit-balance-2` with a design width of 480.
- Use `design/design-system.json` as the repository-side map of required design frames, target metadata, and verification limits. Inspect only its named Normal, AOD, and tap-zone pages or frames; do not inventory the whole file unless a required frame cannot be found.
- Prefer structured Penpot MCP reads and targeted asset exports. Use Chrome DevTools MCP for plugin activation and visual confirmation as described below.
- Collect the complete design-to-code diff before editing, then apply one focused patch. Do not make one patch per coordinate or asset.
- A routine sync has a budget of 50 tool calls and at most two visual correction loops. If access or runtime failures require more, stop and report the blocker before continuing.
- Use `medium` reasoning for routine syncs when the caller can select effort. Do not use subagents for this single-target workflow.

## Browser and External Access

### Localhost UI debugging

- For pages served from `localhost` or `127.0.0.1`, use Chrome DevTools MCP as the first browser-control mechanism.
- Reuse a matching Chrome tab when available; otherwise open the local URL through Chrome DevTools MCP.
- Inspect DOM, console, network, responses, and relevant runtime state before changing application code.
- Do not silently switch to Computer Use, a browser extension, or another mechanism. Report an attachment blocker and ask before falling back.
- State that Chrome DevTools MCP will be used before browser actions.

### Local Penpot MCP workflow

- Use the official local Penpot MCP server and the Penpot plugin. The MCP endpoint is `http://localhost:4401/mcp`; the plugin manifest is `http://localhost:4400/manifest.json`.
- Before each design-sync session, determine the current Penpot version and inspect the published `@penpot/mcp` versions. Prefer an exact version match; do not use a dist-tag blindly. If no matching package exists, use the newest compatible published version only after reporting the mismatch and its risk.
- Check whether the local server is already listening before starting another instance. If it is not running, start `npx -y @penpot/mcp@<version>` in the background, keep its PID and log under `/tmp`, and wait until the MCP and plugin endpoints are ready. Do not install its dependencies into this repository.
- Use Chrome DevTools MCP with the dedicated debug Chrome profile to activate and verify the Penpot plugin. Launch it with `gtk-launch chrome-devtools-mcp.desktop`, then verify `curl -sS http://127.0.0.1:9222/json/version` before browser calls.
- Confirm Penpot authentication and access to the required file, page, and named frames. Reuse an existing matching Penpot tab when available.
- Loading the plugin manifest is a one-time setup, repeated only after a plugin/server version update. At the start of each fresh browser session, open the installed plugin, click `Connect to MCP server`, confirm `Connected`, and keep both the plugin window and Penpot tab open while MCP tools are in use.
- Automate server startup and plugin activation when Chrome DevTools MCP is available. Initial login and Chromium local-network permission may require the user. The Penpot MCP cannot activate its own disconnected plugin.
- Never silently switch to Computer Use, a browser extension, or another browser-control mechanism. If Chrome DevTools MCP cannot attach, report the exact blocker and ask before using a fallback.
- After connecting, verify that the Penpot MCP tools are available and make one small read-only request before collecting the design diff. Treat version-mismatch warnings as compatibility risks, not connection failures.
- Keep reads targeted and use screenshots only for visual verification. State the actual browser-control mechanism in the final report.
- At handoff, report whether the local MCP process is still running. Stop a task-owned process after the sync unless the user asks to keep it available.

## Project Structure & Module Organization

This is a minimal Zepp OS API 4.2 watch-face project. `app.js` owns application-level lifecycle hooks and shared state. `watchface/index.js` contains the watch-face lifecycle and is the main place for UI construction and sensor binding. `app.json` defines metadata, API compatibility, permissions, and the supported device target. Keep device-specific resources under `assets/<resolution>-<device>/`, matching the target key in `app.json`. The ignored `dist/` directory contains temporary generated packages. Immutable preview packages live under `releases/v<version>/` with their manifest and checksum and are tracked by Git.

## Build, Test, and Development Commands

The project has a small `package.json`, while Zeus itself is provided by the globally installed CLI. Run commands from the repository root:

- `npm run check` performs syntax/config/asset validation and one target-specific Zeus build.
- `npm run dev` runs target-specific `zeus dev` and writes its log outside the repository so the watcher cannot rebuild on its own output.
- `npm run preview` (also `npm run preview:release`) requires a clean source tree, builds and uploads a target-specific preview, displays its QR code, and archives the exact uploaded `.zab` under `releases/v<app.version.name>/`. A version cannot be archived twice.
- `npm run preview:zab -- releases/v<version>/<package>.zab` verifies and uploads an archived package without rebuilding it, then displays a fresh QR code. The private uploader is pinned to Zeus CLI 1.9.3 and must be reviewed when Zeus changes.
- `npm run visual:diff -- <penpot.png> <simulator.png> [output.png]` produces a three-panel reference/actual/difference image.
- In a managed sandbox, Zeus may fail with `spawnSync /bin/sh EPERM`; rerun the same command with approval instead of changing the CLI or project.

## Coding Style & Naming Conventions

Use two-space indentation in JavaScript and JSON, single quotes in JavaScript, and no semicolons, consistent with the current files. Keep Zepp lifecycle method names exact (`onCreate`, `onInit`, `build`, `onDestroy`). Prefer descriptive `camelCase` identifiers and uppercase constants for reusable layout values. Name new target asset directories exactly like their `app.json` target key. No formatter or linter is configured, so keep diffs focused and preserve surrounding style.

## Testing Guidelines

There is no automated test suite or coverage threshold. Before submitting a change, run `npm run check`, then exercise it once with `npm run dev` on the single Balance 2 target. Capture Normal and AOD once, combine each Penpot/Simulator pair with `npm run visual:diff`, and inspect the composites for placement, clipping, typography, and readability. Allow at most two correction loops. For hardware-dependent behavior, commit the source state, run `npm run preview` on a compatible watch, and commit the generated release directory after verification. Document which screens and hardware were tested.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so no repository-specific commit convention can be inferred. Use short, imperative subjects such as `Add battery indicator`, and keep unrelated changes separate. Pull requests should explain the visible behavior, list validation commands and devices, link the relevant issue, and include before/after screenshots for UI changes. Call out changes to permissions, API versions, target metadata, or generated release artifacts.

## Configuration & Security

Keep permissions in `app.json` minimal. Never commit account tokens, QR-login data, or device identifiers. Update version code and name deliberately for release builds.
Never commit Penpot MCP keys or authenticated remote-MCP URLs. Local MCP mode does not require a key; use remote credentials only when the user explicitly requests remote mode.
Do not save preview QR URLs or Zeus credentials in release manifests. Preserved `.zab` files are release artifacts; never overwrite an existing version directory.
