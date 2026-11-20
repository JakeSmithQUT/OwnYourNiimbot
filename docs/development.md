# Development

## Prerequisites

- Node.js 22 or later.
- Git.

## Commands

| Command | Result |
|---|---|
| `npm install` | Installs the dependencies and downloads Electron. |
| `npm run dev` | Starts the Vite dev server and opens the app with hot reload. |
| `npm test` | Runs the unit tests. The tests include full print jobs against a simulated printer. |
| `npm run typecheck` | Checks the TypeScript types. |
| `npm run build` | Builds the interface to `dist/renderer` and the main process to `dist/main`. |
| `npm start` | Opens the built app. |
| `npm run dist` | Builds the installers for the current system to `release/`. |
| `npm run install:local` | Windows only. Builds the x64 installer, installs it for the current user and makes sure that the installed app starts. Close the app first, or add `-- --force` to close it. |
| `npm run check:secrets` | Checks the tracked files for keys, tokens and app packages. |

## Project layout

| Path | Contents |
|---|---|
| `src/main/` | Electron main process and preload script. Device pickers, permissions and file storage. |
| `src/printer/` | Printer protocol, Bluetooth and serial transports, image encoding and the model table. This folder has no dependency on the interface. |
| `src/renderer/` | React interface. |
| `src/renderer/editor/` | Label editor based on Fabric.js, barcode and table objects, image processing and print rendering. |
| `tests/` | Vitest unit tests. |
| `tools/` | One-time tools, for example the printer list import. |
| `scripts/` | Build scripts. |
| `docs/` | Documentation. |

## Label coordinates

The editor stores positions and sizes in units of 0.1 mm. A 50 × 30 mm label is 500 × 300 units. At print time, the label is rendered at the resolution of the printer and converted to 1 bit with a threshold.

Barcodes are drawn with a whole number of dots for each module, so that the printed code scans reliably. Images are converted to black and white when you insert or resize them, at the resolution of the selected printer.

## Update the printer model table

The model table `src/printer/models.json` comes from the printer list in the official Android app.

1. Extract `base.apk` from the app package to a folder outside this repository.
2. Find `assets/flutter_assets/assets/config/printerList.json` in the extracted files.
3. Run the import tool:

   ```bash
   node tools/import-printer-list.mjs <path to printerList.json>
   ```

4. Run `node scripts/printer-table.mjs` to update `docs/supported-printers.md`.
5. Run `npm test`.

CAUTION: Do not copy files from the official app into this repository. The secret check and the pre-commit hook block app packages and known app files.

## Pre-commit hook

The hook runs the secret check on the staged files. Enable it once for each clone:

```bash
git config core.hooksPath .githooks
```

## Release procedure

1. Change `version` in `package.json`.
2. Commit the change.
3. Create a tag with the same version and push it:

   ```bash
   git tag v1.0.1
   git push origin main --tags
   ```

4. The `Release` workflow builds the installers on Windows, macOS and Linux. Then it creates a GitHub release with the installers and a `SHA256SUMS.txt` file.

The installers are not code signed. To sign them, add the certificates as repository secrets and set the electron-builder signing variables in `.github/workflows/release.yml`.

## Update the label roll list

The roll list is in `src/printer/labels.json`. Each entry has these fields:

| Field | Value |
|---|---|
| `widthMm` | Width across the print head |
| `lengthMm` | Length along the feed. For cable labels, include the tail. |
| `type` | Label type code (1 = gap, 3 = continuous, 5 = transparent) |
| `shape` | `round` or `cable`, if the label is not a rectangle |
| `tailMm` | Tail length of a cable label |
| `series` | Printer series names from `models.json`, or model names |
| `note` | Short text that shows in the list |
| `barcodes` | EAN-13 codes that the RFID tag reports for the roll |

The sizes come from the official NIIMBOT store and from retailer product pages. Add a barcode only if two sources agree, or if the barcode comes from an RFID read of the roll. The barcode field on the official store has copy errors.

Run `npm test` after a change. The tests make sure that each series name exists and that no barcode links to two rolls.

## Add a printer model

If a printer reports a model ID that is not in the table, the **Printer** page shows the ID. To add the model:

1. Add an entry to `src/printer/models.json` with the model ID and the hardware values.
2. If the model needs a specific command set, add its name to the correct set in `src/printer/models.ts`.
3. Run `npm test` and `node scripts/printer-table.mjs`.
