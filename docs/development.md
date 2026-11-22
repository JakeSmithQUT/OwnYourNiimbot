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
| `npm run licences` | Writes `THIRD_PARTY_LICENSES.txt` from the bundled packages and fonts. The build runs this too. |

## Project layout

| Path | Contents |
|---|---|
| `src/main/` | Electron main process and preload script. Device pickers, permissions and file storage. |
| `src/printer/` | Printer protocol, Bluetooth and serial transports, image encoding and the model table. This folder has no dependency on the interface. |
| `src/renderer/` | React interface. |
| `src/renderer/editor/` | Label editor based on Fabric.js, barcode and table objects, image processing, label file checks and print rendering. |
| `src/renderer/templates/` | Template library: layout helpers, ornaments and the designs. |
| `src/main/mcp/` | Local MCP server: request checks, tool schemas and the stdio bridge. |
| `src/renderer/mcp/` | MCP tool handlers that run in the app window. |
| `tests/` | Vitest unit tests. |
| `tools/` | One-time tools, for example the printer list import. |
| `scripts/` | Build scripts. |
| `docs/` | Documentation. |

## Print area

`src/printer/printArea.ts` gives the part of a label that the print head can reach, in label coordinates. It follows the print pipeline: the image is turned by the print direction of the model (and 180° more with **Turn the print 180°**), then `fitToPrinthead` crops it to the print head width with the alignment of the model. A test checks the area against the real pipeline for each alignment and direction. The design view, the print preview, the label panel warning and the MCP tools all use this function.

## Label coordinates

The editor stores positions and sizes in units of 0.1 mm. A 50 × 30 mm label is 500 × 300 units. At print time, the label is rendered at the resolution of the printer and converted to 1 bit with a threshold.

Barcodes are drawn with a whole number of dots for each module, so that the printed code scans reliably. Images are converted to black and white when you insert or resize them, at the resolution of the selected printer.

## Add a template

The template library is in `src/renderer/templates/`.

| File | Contents |
|---|---|
| `layout.ts` | Parts of a label: text, codes, shapes, tables, icons and ornaments. Sizes are in millimetres. |
| `ornaments.ts`, `motifs.ts` | Vector ornaments: frames, bands, background shapes and small pictures. |
| `compose.ts` | Builds a label from a description: rows from top to bottom, with an optional frame, background shape, bands and side panel. |
| `presets.ts` | Descriptions that many templates share: a symbol with lines of text, a heading with captions and values, a code with details, and signs. |
| `catalogue.ts`, `creative.ts` | Templates with their own layout code. |
| `practical.ts`, `makers.ts`, `occasions.ts` | Templates that use `compose.ts`. |

To add a template, add a `design(...)` entry to `practical.ts` (plain text), `makers.ts` or `occasions.ts` (fonts and ornaments). An entry has these parts:

1. An ID. Do not change the ID of a template after a release, because the assistant tools use it.
2. A name, a group and a description. The search on the **Templates** page uses all three.
3. The label sizes, as width and height on the screen.
4. The description of the layout. Give `narrow`, `short`, `small`, `tall` or `round` descriptions if the label needs fewer rows at those sizes.

A template that sets a font shows in the **Decorative** filter.

Text gets the largest font size that fits its row. Rows of plain text, dates, serial numbers, captions with values, tick boxes and the text in a row of columns share one size when they have the same weight and font. A bold line is not made smaller to match captions of the same weight. A row with less weight is never larger than a row with more weight, and detail lines are at most 0.8 times the size of the main line. If the sample text is long, the font is small on the smallest sizes. Remove those sizes from the list, or give a shorter description for them.

On a round label, text stays inside a circle: each row is as wide as the circle where the row ends up. `packInCircle()` in `layout.ts` does this for templates with their own layout code.

A text row is one line. When the row is too narrow for the text at the smallest size, the font gets smaller and the text does not wrap. Only a text with `minPt` wraps at its spaces, for example a list of ingredients. If a small size makes a line hard to read, leave that line out at that size, as the Thank you sticker does for its web address under 30 mm.

Rows are kept together. When the width makes text smaller than its row, `pack()` in `layout.ts` gives the free height back, puts an even gap between the rows and centres the group on its letters. A symbol, a code or a block of left-aligned text that is shorter than the label is centred across it with the text beside it. QR and Data Matrix codes get a whole number of 203 dpi printer dots for each module and go to the outer edge of their space. Symbols are placed by their lines, not by the square of the icon. A black bar with `hug` is as high as its text.

In a template with its own layout code, use the same helpers: `pack()` for rows, `withIcon()` and `withCode()` for a symbol or a code beside text, `pairs()` for captions with values, `onBaseline()` for texts side by side on one line, and `centreX()` for a short block of text.

After a change, start `npm run dev`, open the **Templates** page and look at each size of the new template. Make sure that no text is smaller than 5 points and that no text wraps to a second line.

To add a symbol, add an entry to a group in `src/renderer/editor/icons.tsx`. The cute animals are in `src/renderer/editor/cuteAnimals.ts`. An animal with a face there gets four symbols: plain, happy, sleepy and in love. Draw the head and the ears as one outline, make the eyes and the nose solid, and give the animal one feature that identifies it. Look at each new drawing at 5 mm and at full size before you add it. Symbol names are lower case and must not change after a release, because saved labels and the assistant tools use them.

## Translations

The interface text is in `src/i18n`. English is the source and the fallback.

- `src/i18n/en/*.ts`: the English text, one file for each part of the app. A key is `<area>.<name>`.
- `src/i18n/locales/<code>.json`: one file for each other language, with the same keys.
- `src/i18n/languages.ts`: the list of languages, with the name of each language in that language.

Until the user chooses a language, the app uses the first preferred language of the system (`app.getPreferredSystemLanguages()`) if it has that language, else English. `matchLanguage()` in `languages.ts` changes a system tag such as `de-AT` or `zh-Hant-TW` to a language of the app. The main process decides the language at start-up (`loadMainLanguage()`), and the renderer gets it with `api.app.getLanguage()`. The settings file has `language` only after the user chooses a language.

To show a text, call `t('area.name')` in the renderer (`src/renderer/i18n.tsx`) or `tm('area.name')` in the main process (`src/main/i18n.ts`). Rules:

- Use one key for a full sentence. Do not join translated parts, because the word order changes between languages.
- Put values in the text as `{name}` and pass them: `t('settings.blackLevel', { level })`.
- A text with a count has a key for each plural form (`_one`, `_other` in English) and uses `tn('key', count)`. Other languages use the forms of `Intl.PluralRules`, for example `one`, `few`, `many` and `other` in Polish.
- Mark styled parts with tags, `<b>...</b>`, and show them with `tr()`.
- Do not call `t()` when a module loads. Keep the key in constants, and call `t()` when the component renders.
- Templates, symbol names and texts for AI assistants stay in English.
- The side bar and the Insert buttons are narrow. A long word there has soft hyphens (U+00AD) at syllable breaks, so that it breaks with a hyphen at a correct place. Keep them when you change a translation.

When you add or change an English text, add or change it in every language file. `tests/i18n.test.ts` checks that each language has every key, every plural form, the same `{values}` and the same tags.

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

## Test the MCP server

To test with data that is apart from your own app data, start a development build with `OYN_USER_DATA` set to an empty folder. The installed app ignores this variable.

1. Create `mcp.json` in the folder: `{"enabled": true, "token": "<at least 32 characters>", "port": 47899, "confirmPrint": true}`.
2. Run `npm run build`, then start the app with `OYN_USER_DATA=<folder> npx electron .`.
3. Connect an MCP client to `http://127.0.0.1:47899/mcp` with the header `Authorization: Bearer <token>`.

To test the stdio bridge, run `ELECTRON_RUN_AS_NODE=1 npx electron dist/main/mcp-bridge.js <folder>/mcp.json` and send JSON-RPC messages on stdin. The bridge also accepts `--config <folder>/mcp.json`, which earlier versions of the setup used.

The **Claude Code command** in the settings has no `--` and puts `-e` last. PowerShell removes a bare `--` from the arguments, and Command Prompt keeps the quotes around `'--'`. Test a change to this command in PowerShell, Command Prompt and bash.

## Test the update check

The installed app checks the GitHub releases. A development build checks only when `OYN_UPDATE_FEED` points to a test feed. The installed app ignores this variable.

1. Make a folder with an installer and a `latest.yml` file for a higher version. `npm run dist` makes `latest.yml` in `release/`. Change its `version` value.
2. Serve the folder, for example with `python -m http.server 8765 --bind 127.0.0.1`.
3. Run `npm run build`, then start the app with `OYN_USER_DATA=<empty folder> OYN_UPDATE_FEED=http://127.0.0.1:8765/ npx electron .`.

The update window opens and shows the download progress. To see the progress bar, serve the folder at a limited speed. When the download is complete, the main window opens with the **Restart to update** button. A test feed never installs the update. A test download goes to the `ownyourniimbot-updater-test` folder in the local app data folder, not to the folder of the installed app. Delete this folder to download the update again in the next test.

To test **Start without updating**, click it while the update downloads. The main window must open, and the download must continue in the bar at the top of the window.

`OYN_SMOKE_TEST=1` skips the update window.

The Windows installer runs `build/installer.nsh` after it installs the files. It points the Start menu and desktop shortcuts at the installed app again. Then it starts the app from its own file, not through a shortcut, and keeps the installer window open until the app shows a window. The first start after an install can take several seconds while Windows checks the new files. An update moves the old files to a temporary folder before it deletes them. A file that is in use, for example `OwnYourNiimbot.exe` of an AI assistant bridge, stays in that folder, and Windows can change the shortcuts to point at it. The installer is a one-click installer. An update runs it without `/S`, so that it shows its progress window. To test a change to this file, run the new installer with `--updated --force-run` (the arguments of an update) while a copy of the installed app runs with `ELECTRON_RUN_AS_NODE=1`.

## Release procedure

1. Do an independent security review of the code. Fix the findings, or record why a finding is not an issue.
2. Change `version` in `package.json`.
3. Commit the change.
4. Create a tag with the same version and push it:

   ```bash
   git tag v1.0.1
   git push origin main --tags
   ```

5. The `Release` workflow builds the installers on Windows, macOS and Linux. Then it creates a GitHub release with the installers, a `SHA256SUMS.txt` file and the update files (`latest.yml`, `latest-mac.yml`, `latest-linux.yml`, `latest-linux-arm64.yml` and the `.blockmap` files).

CAUTION: The update check reads the `latest*.yml` files of the newest release. Do not remove them from a release. Do not publish a release as the latest release before the workflow has uploaded all the files.

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
