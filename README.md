# OwnYourNiimbot

OwnYourNiimbot is a desktop app to design and print labels on NIIMBOT label printers. It operates on Windows, macOS and Linux. It connects to the printer over Bluetooth LE or a USB cable.

The app does not need an account or an internet connection. Labels, print history and settings stay on your computer.

## Features

- A template library with 105 designs in 632 sizes, which you can filter by the connected printer and the loaded roll.
- 19 fonts that ship with the app, so labels look the same on every computer and print offline.
- An optional local MCP server, so that an AI assistant such as Claude can make, preview and print labels.
- Automatic label size. The app finds the size of the roll in the printer and gives a new label that size.
- A list of the NIIMBOT rolls that fit the selected printer, with the loaded roll at the top.
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

## Template library

The **Templates** page has ready-made labels in twelve groups:

| Group | Examples |
|---|---|
| IT and servers | Server label (hostname, IP, BMC address, serial number, role, QR code), rack ear label, rack position, asset tags, laptop, drive, network device, Wi-Fi QR code, service record |
| Network and cables | Cable flags for the 12.5 mm and 25 mm cable rolls, power cable flag, cable wrap, patch panel strip, switch port map |
| Office | File folder tab, name badge, return address, address label, shelf label, lost property, desk number |
| Home and kitchen | Pantry jar, spice jar lid, freezer meal, leftovers, storage box, moving box, children's name label, plant marker, charger tag |
| Food and hospitality | Food prep and rotation, allergen notice, day of the week, product ingredients, table number |
| Retail | Price tag with barcode, shelf price strip, sale sticker, thank you sticker, jewellery tag, clothing size, product SKU, modern product label |
| Small business | Coffee bag, bakery box, craft beer, wine bottle, "new" star burst, boutique price tag, review QR code, follow us, packed with care, market stall price card |
| Gifts and crafts | Script gift tag, gift ticket, handmade seal, script thank you, wedding favour, party bag, ex libris bookplate, candle, soap, vintage jam jar, handwritten plant tag |
| Shipping and storage | Shipping label, bin location, inventory item, fragile mark, box number |
| Electrical and workshop | Circuit breaker, switchboard schedule, tool owner, inspection tag, warning sign |
| Lab and health | Sample tube, specimen barcode, medication schedule, first aid kit |
| School and events | Book plate, pencil name, lunchbox, event badge |

Each design has a layout for each roll size that it suits. The size buttons on a card show these sizes. The list at the top of the page filters the sizes:

| Filter | Sizes shown |
|---|---|
| Matches the loaded roll | The size of the roll in the connected printer |
| NIIMBOT roll sizes | Sizes of the NIIMBOT rolls for the printer model |
| Fits the print head | Sizes that are not wider than the print head |
| All sizes | All sizes |

The page uses the connected printer. If no printer is connected, it uses the model in **Settings**.

Some templates count up for each label: the numbered asset tags, the moving box, the gift ticket and the sample tube. Set the number of labels in the print dialog.

The **Decorative** filter shows the designs that use the included fonts and ornaments: frames, scalloped seals, star bursts, ribbons, ticket shapes, dividers and hazard stripes. Each card lists the fonts that it uses.

### Fonts

The app includes these fonts. All are under the SIL Open Font Licence 1.1 or the Apache Licence 2.0.

| Style | Fonts |
|---|---|
| Sans serif | Inter, Montserrat, Oswald |
| Display | Bebas Neue, Archivo Black, Abril Fatface, Righteous |
| Serif | Playfair Display, Cinzel, Roboto Slab |
| Script and handwriting | Pacifico, Great Vibes, Dancing Script, Caveat, Permanent Marker, Amatic SC |
| Rounded | Fredoka |
| Monospace | Space Mono, JetBrains Mono |

The font list in the design view shows these fonts first, then the fonts on your computer.

### Server labels from a spreadsheet

The **Server labels from a spreadsheet** template prints one label for each server in a file. Export the servers from your inventory system as a CSV or Excel file with the columns `Hostname`, `IP`, `BMC`, `Serial` and `Role`.

1. On the **Templates** page, open **Server labels from a spreadsheet**. Example data for four servers loads with it.
2. On the **Data** page, open your file.
3. Click **Print** and set the range of rows.

Do not put passwords or other credentials on a label. Use the management address and the asset number to find the details in your inventory system.

## Label size detection

When a printer connects, and each time that you close the cover after you change the roll, the app gets the size of the loaded roll. It uses the first of these sources that has a size:

1. The printer. Newer firmware reads the size from the roll and reports it.
2. A size that you saved for the roll barcode on this computer.
3. The roll barcode list in the app.

A new, empty label changes to the roll size. If the open label already has content, the design view shows the roll size and a button to use it. To turn off the automatic change, go to **Settings** and clear **Give a new, empty label the size of the roll in the printer**.

If the app cannot find the size of a roll, select the size in the **NIIMBOT roll** list, then click **Save** under the list. The app uses that size the next time that you load a roll with the same barcode.

The **NIIMBOT roll** list in the design view shows the rolls that fit the printer. The size is shown as on the box: width across the print head, then length. Narrow printers, for example the D110, print sideways. On these printers a 12 × 40 mm roll shows as a 40 × 12 mm label on the screen.

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

## Use with AI assistants (MCP)

OwnYourNiimbot has an optional MCP (Model Context Protocol) server. An AI assistant on the same computer can use it to make labels, look at a preview and print.

The server is off by default. To turn it on:

1. Go to **Settings**, **AI assistants (MCP)**.
2. Select **Allow AI assistants to use OwnYourNiimbot**.
3. Copy the setup for your assistant from the same section.

| Assistant | Setup |
|---|---|
| Claude Code | Run the **Claude Code command** from the settings. It adds the server with its address and token. |
| Claude Desktop | Add the **Claude Desktop** JSON from the settings to `claude_desktop_config.json`, then restart Claude Desktop. The app's own executable acts as the connection, so you do not need Node.js. |
| Other MCP clients | Use the address `http://127.0.0.1:47821/mcp` with the header `Authorization: Bearer <token>`. |

The assistant can use these tools:

| Tool | Result |
|---|---|
| `get_status` | The printer, the loaded roll, the open label, the fonts and the barcode types |
| `list_label_sizes` | The NIIMBOT rolls for the printer |
| `list_templates` | Templates from the library, with their sizes |
| `create_label` | A new label from lines of text and a code, or from elements at set positions |
| `create_from_template` | A label from a template, with the sample text replaced |
| `edit_label_text` | A copy of a label with text replaced |
| `preview_label` | An image of the label as the printer prints it |
| `list_saved_labels`, `save_label` | Your saved labels |
| `print_label` | Prints a label, with copies, data records or a serial count |

Security:

- The server accepts connections from this computer only, and each request must have the token. Requests from web pages are refused.
- By default, the app asks you before an assistant prints. You can turn this off in the settings.
- Labels from an assistant open in the editor only if the open label has no changes that are not saved.
- To stop access, clear the setting or click **Make a new token**.

## Privacy

The app does not connect to the internet. It does not use an account, a cloud service, analytics or automatic updates. The printer connects over Bluetooth or a serial port. If you turn on AI assistant access, the app also accepts local connections from this computer.

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

The included fonts and libraries keep their own licences. **Settings**, **About**, **Open-source licences** shows the notices, which are also in [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt).

The protocol was studied to make the printers work with more computers. This repository contains no code, images, fonts, templates or translations from the official app. The model table contains hardware facts only: model names, model IDs, resolution, print widths, density ranges and label types. The roll list contains sizes and retail barcodes from public product listings.

## Licence

MIT. Refer to [LICENSE](LICENSE).
