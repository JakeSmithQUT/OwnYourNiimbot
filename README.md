# OwnYourNiimbot

OwnYourNiimbot is a desktop app to design and print labels on NIIMBOT label printers. It operates on Windows, macOS and Linux. It connects to the printer over Bluetooth LE or a USB cable.

The app does not need an account or an internet connection. Labels, print history and settings stay on your computer.

![The design view with a 50 × 30 mm service record label. The insert tools and symbols are on the left. The label size, roll and type are on the right.](docs/images/editor.png)

## Features

- A template library with 529 designs in 3,704 sizes, which you can filter by the connected printer and the loaded roll.
- 19 fonts that ship with the app, so labels look the same on every computer and print offline.
- An optional local MCP server, so that an AI assistant such as Claude can make, preview and print labels.
- Automatic label size. The app finds the size of the roll in the printer and gives a new label that size.
- A list of the NIIMBOT rolls that fit the selected printer, with the loaded roll at the top.
- Label editor with text, barcodes, QR codes, Data Matrix, PDF417, Aztec codes, images, rectangles, circles, lines, tables and symbols.
- A library of 445 symbols in 15 groups, with a search.
- Replace an element with a different type. Right-click the element, then select **Replace with**. For example, change a QR code to an image. The new element keeps the position, size and rotation, and the text or code value where possible.
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
- Updates from the GitHub releases of this project. The Windows installer and the Linux AppImage install them when the app restarts.

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

The installers are not code signed. Each system shows a warning the first time that you open the app. Because of this, download the app only from the [Releases](https://github.com/JakeSmithQUT/OwnYourNiimbot/releases) page of this repository. Do not use copies from other websites.

To make sure that a download is complete and not changed, compare its SHA-256 checksum with the value in `SHA256SUMS.txt` on the same release page:

| System | Command |
|---|---|
| Windows (PowerShell) | `Get-FileHash <file> -Algorithm SHA256` |
| macOS | `shasum -a 256 <file>` |
| Linux | `sha256sum <file>` |

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

The **Templates** page has ready-made labels in 17 groups:

| Group | Examples |
|---|---|
| IT and servers | Server label (hostname, IP, BMC address, serial number, role, QR code), rack ear label, asset tags, laptop, drive, network device, Wi-Fi QR code, service record, UPS battery record, loan device, power feed, static IP address, IT support QR code, KVM ports |
| Network and cables | Cable flags for the 12.5 mm and 25 mm cable rolls, cable wrap, patch panel strip, switch port map, fibre link, numbered cable markers, data outlet, VLAN list |
| Office | File folder tab, name badge, return address, shelf label, desk number, meeting room, archive box, key tag, visitor badge, approval mark, binder spine, phone extensions, planner flag, status stamp |
| Home and kitchen | Pantry jar, spice jar lid, freezer meal, storage box, moving box, bin collection day, light switch names, paint tin, filter change, emergency numbers, valve signs, meal prep, chore strip, chalkboard and deco pantry labels |
| Food and hospitality | Food prep and rotation, allergen notice, prepared and use-by dates, defrosted, fridge temperature check, allergen boxes, dietary sticker, cup order, beer tap, reserved table, QR menu |
| Retail | Price tag with barcode, shelf price strip, sale sticker, clothing size, clearance price, multi-buy offer, shelf label with unit price, lay-by, return authorisation, garment care, coupon, percent off |
| Small business | Coffee bag, bakery box, craft beer, wine bottle, honey jar, tea blend, hot sauce, olive oil, kombucha, lip balm, bath bomb, candle safety label, vegan seal, limited edition number, loyalty card |
| Gifts and crafts | Script gift tag, gift ticket, handmade seal, script thank you, wedding favour, party bag, ex libris bookplate, candle, soap, vintage jam jar, handwritten plant tag |
| Shipping and storage | Shipping label, bin location, inventory item, pallet label, this way up, heavy item, keep frozen, do not stack, box contents list, aisle, bay and level, batch and expiry, quality check passed, quarantine |
| Electrical and workshop | Circuit breaker, switchboard schedule, inspection tag, appliance test record, lock-out tag, out of service, phase markers, screws and fasteners, component bin, calibration record, maximum load |
| Lab and health | Sample tube, specimen barcode, medication schedule, reagent bottle, microscope slide, Petri dish, freezer box grid, pill organiser days, allergy alert, emergency contact |
| School and events | Book plate, pencil name, lunchbox, event badge, exercise book, locker number, timetable, library spine label, cloakroom ticket, race number, raffle ticket, bake sale price |
| Garden and pets | Saved seeds, seed tray, plant care card, garden row marker, plant price tag, beehive record, pet ID tag, pet food tub, pet medicine, aquarium water change, vaccination due |
| Hobbies and collections | 3D printer filament, film roll, record sleeve, yarn band, home brew batch, memory card, board game box, collection specimen, artwork card, mixtape spine, time capsule |
| Travel and vehicles | Luggage tag, next vehicle service, tyre pressures, parking permit, fuel type, trailer details, helmet ID, camping box, oil change sticker, suitcase sticker |
| Safety and signs | 54 signs: no smoking, fire extinguisher, first aid, exit, wet floor, hearing and eye protection, no entry, keep clear, fire door, hot surface, drinking water, push and pull, out of order, wet paint |
| Celebrations and seasons | Christmas gift tag, advent numbers, New Year, Valentine's Day, Easter, Halloween, Mother's Day, Father's Day, Eid, Diwali, Hanukkah, Lunar New Year, birthday, new baby, save the date, wedding table number, graduation, gift voucher |

Each design has a layout for each roll size that it suits. The size buttons on a card show these sizes. The list at the top of the page filters the sizes:

| Filter | Sizes shown |
|---|---|
| Matches the loaded roll | The size of the roll in the connected printer |
| NIIMBOT roll sizes | Sizes of the NIIMBOT rolls for the printer model |
| Fits the print head | Sizes that are not wider than the print head |
| All sizes | All sizes |

The page uses the connected printer. If no printer is connected, it uses the model in **Settings**.

Some templates count up for each label, for example the numbered asset tags, the cable markers, the cloakroom ticket, the raffle ticket and the advent numbers. Set the number of labels in the print dialog.

Some templates put a date on the label and calculate a second date from it, for example a use-by date three days later or a test date 12 months later. Select the date on the label to change the number of days.

The **Decorative** filter shows the designs that use the included fonts and ornaments: frames, stamp edges, scalloped seals, star bursts, leaf wreaths, ticket and tag shapes, bunting, dividers, hazard stripes and small pictures such as a pine tree, a pumpkin and a paw print. Each card lists the fonts that it uses.

The signs and the test records are layouts only. Make sure that a safety sign or a test tag obeys the rules that apply to you before you use it.

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

### Symbols

The **Symbols** panel in the design view has 445 symbols in 15 groups:

| Group | Examples |
|---|---|
| Warnings and safety | Warning, high voltage, flammable, toxic, biohazard, no smoking, first aid, fire extinguisher |
| Packaging and shipping | Fragile, keep dry, this side up, do not stack, centre of gravity, keep cold, forklift |
| Arrows and marks | Arrows, chevrons, check, cross, plus, shapes, link |
| Home | Key, lock, lamp, door, fridge, washing machine, bed, sofa |
| Laundry care | Machine wash, do not bleach, tumble dry, line dry, dry flat, iron |
| Food and drink | Fruit, vegetables, meat, fish, bread, cake, coffee, milk, vegan, no gluten |
| Shops and money | Cart, bag, card, coins, receipt, discount, gem, trophy |
| Office and school | Phone, mail, people, calendar, folder, clipboard, pen, book, building |
| Technology | Laptop, server, router, cable, drive, battery, monitor, printer, USB, Bluetooth |
| Electrical and tools | Wrench, hammer, drill, ruler, gear, earth, alternating current, direct current, fuse |
| Health and science | Medicine, syringe, stethoscope, microscope, flask, test tube |
| Nature and weather | Sun, moon, leaf, flower, trees, mountain, rain, snow |
| Animals | Paw, cat, dog, rabbit, bird, turtle, bone |
| Travel and vehicles | Car, bike, bus, train, plane, ship, tent, compass, map |
| Celebration and fun | Star, heart, party, balloon, music, film, dice, faces |

Click **All** to show the groups. Type in the search field to find a symbol by its name or its group, for example `tree` or `laundry`. Click a symbol to put it on the label.

To change an element to a symbol, right-click the element, select **Replace with**, then select **Symbol**. The symbol list in this menu has the same search.

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

### Print area

On some printers, the print head is narrower than the label. For example, the H1S prints 12 mm across, so on a 15 mm roll 1.5 mm on each side does not print. The design view shades the parts of the label that do not print, and the print preview shows the same area.

If an element goes outside the print area, the label panel shows a warning. Click **Fit into the print area** to make all elements smaller by the same amount and move them inside the area. To undo it, press Ctrl+Z. To show or hide the shading, click **Show the print area** in the toolbar.

### Print from a spreadsheet

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
| Claude Code | Run the **Claude Code command** from the settings. It adds the server for all your projects. |
| Claude Desktop | Add the **Claude Desktop** JSON from the settings to `claude_desktop_config.json`, then restart Claude Desktop. |
| Other MCP clients | Use the address `http://127.0.0.1:47821/mcp` with the header `Authorization: Bearer <token>`. |

The Claude Code and Claude Desktop setups start the app's own executable as a small bridge program, so you do not need Node.js. The bridge reads the token from the app settings, so the setup does not contain the token. The portable Windows app and the Linux AppImage run from a temporary folder, so they cannot use the bridge. With these versions, Claude Code uses the address and the token.

The assistant gets the print area of each label (`print_area_mm`). The automatic layout for lines of text and a code stays inside it, results list elements that go outside it, and preview images show the parts that do not print in grey.

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

## Updates

When the app starts, it checks the [Releases](https://github.com/JakeSmithQUT/OwnYourNiimbot/releases) page of this project for a newer version. To turn off the check, go to **Settings**, **Updates**, and clear **Check for updates when the app starts**. **Check now** checks at any time.

| Version of the app | Result of the update check |
|---|---|
| Windows installer | The app downloads the update and checks its SHA-512 checksum. A bar at the top of the window tells you when the update is ready. Click **Restart now**, or install the update the next time that you close the app. |
| Linux AppImage | The same as the Windows installer. |
| macOS | A bar shows a link to the new release. Download and install it as in [Download](#download). macOS does not let an app that is not code signed replace itself. |
| Windows portable app, Linux .deb | A bar shows a link to the new release. |

If the open label has changes that are not saved, **Save and restart** saves the label before the app restarts.

## Privacy

The app does not need an internet connection or an account. It does not use a cloud service or analytics.

The update check is the only internet connection. It asks GitHub for the latest release of this project. GitHub gets the app version and the IP address of your computer. The app does not send labels or other data. You can turn off the check in **Settings**.

The printer connects over Bluetooth or a serial port. If you turn on AI assistant access, the app also accepts local connections from this computer.

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
