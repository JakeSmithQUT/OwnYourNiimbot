# OwnYourNiimbot

OwnYourNiimbot is a desktop app to design and print labels on NIIMBOT label printers. It operates on Windows, macOS and Linux. It connects to the printer over Bluetooth LE or a USB cable.

The app does not need an account or an internet connection. Labels, print history and settings stay on your computer.

## Features

- Label editor with text, barcodes, QR codes, Data Matrix, PDF417, Aztec codes, images, rectangles, circles, lines, tables and symbols.
- Date fields with an optional day offset, for best-before and expiry dates.
- Serial number fields with a prefix, a suffix, a start value, a step and a fixed number of digits.
- Batch printing from Excel (.xlsx), CSV and TSV files, or from a table that you paste. Put a column on a label as a field, for example `{{Name}}`.
- Conversion of photos and logos to black and white, with dithering, threshold, brightness and contrast controls.
- A print preview that shows the exact dots that the printer receives.
- Printer status: battery level, cover, labels, firmware version and serial number.
- Label roll data from the RFID tag on genuine rolls, with the number of labels that remain.
- Printer settings: automatic power-off time, sounds and label position calibration.
- Saved labels, label import and export, print history and reprint.
- Light and dark themes.

## Supported printers

The app knows 80 models from the printer list in the official app. 69 of these models use the NIIMBOT command set and work with this app. These include the D11, D110, D101, H1S, B18, B21, B1, B3S, B31, B32, K3, M2 and M3 series.

Refer to [docs/supported-printers.md](docs/supported-printers.md) for the full list. The list includes the resolution, the print width, the density range and the label types for each model.

The app selects one of three command sets from the model. If a model does not print correctly, open **Advanced** in the print dialog and try a different command set. Then open an issue with the result.

## Download

Download the installer for your computer from the [Releases](https://github.com/JakeSmithQUT/OwnYourNiimbot/releases) page.

| System | File |
|---|---|
| Windows 10 and 11 (x64 or Arm) | `OwnYourNiimbot-<version>-windows-<arch>-setup.exe` |
| Windows, no installation | `OwnYourNiimbot-<version>-windows-x64-portable.exe` |
| macOS (Apple silicon or Intel) | `OwnYourNiimbot-<version>-macos-<arch>.dmg` |
| Linux (x64 or Arm64) | `OwnYourNiimbot-<version>-linux-<arch>.AppImage` or `.deb` |

The installers are not code signed. Each system shows a warning the first time that you open the app.

### Open the app on Windows

1. Start the installer.
2. If Windows SmartScreen shows "Windows protected your PC", click **More info**.
3. Click **Run anyway**.

### Open the app on macOS

1. Open the disk image and drag OwnYourNiimbot to the Applications folder.
2. In the Applications folder, right-click OwnYourNiimbot and click **Open**.
3. Click **Open** in the dialog.

If macOS reports that the app is damaged, enter this command in Terminal, then open the app again:

```bash
xattr -dr com.apple.quarantine /Applications/OwnYourNiimbot.app
```

When the app asks for Bluetooth access, click **Allow**.

### Open the app on Linux

1. Make the AppImage executable with `chmod +x OwnYourNiimbot-*.AppImage`.
2. Start the AppImage.

To use a USB cable, your user must be a member of the `dialout` group (Debian and Ubuntu) or the `uucp` group (Arch). Add your user to the group, then log out and log in again:

```bash
sudo usermod -aG dialout $USER
```

Bluetooth on Linux needs BlueZ 5.41 or later.

## Connect a printer

### Bluetooth

1. Turn on the printer.
2. If a phone is connected to the printer, close the phone app or turn off Bluetooth on the phone. The printer accepts one connection at a time.
3. Click **Connect printer** at the top of the window.
4. Click **Bluetooth**.
5. Click the printer in the list. The name starts with the model, for example `D110-` or `B1-`.

You do not need to pair the printer in the system Bluetooth settings.

### USB cable

1. Connect the printer to the computer with a USB data cable. A charge-only cable does not work.
2. Turn on the printer.
3. Click **Connect printer**, then click **USB cable or serial port**.
4. Click the port of the printer.

Some older models, for example the B3S, also show as a Bluetooth serial port after you pair them in the system settings. Select that port with the same procedure.

## Design and print a label

1. On the **Labels** page, click **New label** and select the label size. You can also start from an example.
2. Add elements from the **Insert** panel on the left.
3. Select an element to change it in the panel on the right.
4. Click **Print**.
5. Set the number of copies, the density and the label type.
6. Click **Print**.

To print one label for each row of a spreadsheet:

1. On the **Data** page, open an .xlsx, .csv or .tsv file. The first row must contain the column names.
2. In the design view, select a text or barcode element.
3. Select a column in the **Insert a data field** list. The field shows as `{{Column name}}`.
4. Click **Print** and set the range of rows.

## Privacy

The app has no network code. It does not use an account, a cloud service, analytics or automatic updates. The only connections are to the printer, over Bluetooth or a serial port.

Labels, history and settings are stored in the app data folder. To open this folder, go to **Settings** and click **Open data folder**.

## Build from source

You need Node.js 22 or later.

```bash
npm install
npm run dev
```

Refer to [docs/development.md](docs/development.md) for the project layout, the tests and the release procedure. Refer to [docs/protocol.md](docs/protocol.md) for the printer protocol.

## Legal

OwnYourNiimbot is an independent project. NIIMBOT did not make, approve or support it. NIIMBOT is a trademark of its owner. The name is used only to identify compatible printers.

The protocol was studied to make the printers work with more computers. This repository contains no code, images, fonts, templates or translations from the official app. The model table contains hardware facts only: model names, model IDs, resolution, print widths, density ranges and label types.

## Licence

MIT. Refer to [LICENSE](LICENSE).
