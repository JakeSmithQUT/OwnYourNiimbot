# NIIMBOT printer protocol

This document describes the protocol that the app uses to communicate with NIIMBOT printers. The implementation is in `src/printer/`.

## Transports

| Transport | Details |
|---|---|
| Bluetooth LE | Service `e7810a71-73ae-499d-8c15-faa9aef0c3f2`. Characteristic `bef8d6c9-9c21-4c9e-b632-bd58c1009f9f`, with notify and write without response. |
| USB | USB CDC serial port at 115200 baud, 8 data bits, no parity, 1 stop bit. |
| Bluetooth serial | Older models pair as an RFCOMM serial port. The settings are the same as for USB. |

The app uses Web Bluetooth and Web Serial in Electron. The main process shows the device lists in the app window. Refer to `src/main/main.ts`.

On Bluetooth, the app waits 10 ms between packets. One notification can contain part of a packet or more than one packet. `PacketParser` joins the bytes and returns complete packets.

## Packet format

| Offset | Size | Value |
|---|---|---|
| 0 | 2 | Head, `55 55` |
| 2 | 1 | Command |
| 3 | 1 | Data length (n) |
| 4 | n | Data |
| 4 + n | 1 | Checksum: XOR of the command, the length and all data bytes |
| 5 + n | 2 | Tail, `AA AA` |

The connect request has one more byte, `03`, before the head.

Example: the heartbeat request is `55 55 DC 01 01 DC AA AA`.

## Commands

Values are hexadecimal. The response command is the command that the printer sends back.

| Request | Name | Data | Response |
|---|---|---|---|
| `C1` | Connect | `01`, with the `03` prefix | `C2` |
| `40` | Printer information | 1 key byte (refer to the next table) | `40` + key |
| `DC` | Heartbeat | `01` | `DD`, `DE`, `DF` or `D9` |
| `1A` | RFID label data | `01` | `1B` |
| `21` | Set density | 1 byte | `31` |
| `23` | Set label type | 1 byte (refer to the label type table) | `33` |
| `01` | Print start | `01`, or 7 bytes in the modern command set | `02` |
| `20` | Print clear | `01` | `30` |
| `03` | Page start | `01` | `04` |
| `13` | Set page size | rows (u16), columns (u16), and copies (u16) in the modern command set | `14` |
| `15` | Print quantity | copies (u16) | `16` |
| `85` | Bitmap row | refer to "Image rows" | none |
| `84` | Empty rows | row (u16), repeat count (u8) | none |
| `E3` | Page end | `01` | `E4` |
| `A3` | Print status | `01` | `B3` |
| `F3` | Print end | `01` | `F4` |
| `DA` | Cancel print | `01` | `D0` |
| `27` | Set auto power-off time | 1 = 15 min, 2 = 30 min, 3 = 45 min, 4 = 60 min | `37` |
| `58` | Sound setting | `01`, sound type (1 = connect, 2 = power), on (1) or off (0) | `68` |
| `8E` | Label position calibration | label type | `8F` |
| `59` | Paper information | `01` | `69` (refer to "Label size") |

All 16-bit values are big-endian. A response with data `01` means that the printer accepted the request.

The printer can send `DB` at any time during a print job. The first data byte is the error code. Refer to `PRINT_ERRORS` in `src/printer/protocol.ts`. Code 1 means that the cover is open. Code 2 means that no labels are loaded.

The printer sends `00` when it does not support a request.

### Printer information keys

| Key | Value | Response data |
|---|---|---|
| 1 | Density | 1 byte |
| 3 | Label type | 1 byte |
| 7 | Auto power-off time | 1 byte |
| 8 | Model ID | u16. The app finds the model by this ID. |
| 9 | Firmware version | u16 divided by 100 |
| 10 | Battery level | 1 byte. Older models report a level from 1 to 4. |
| 11 | Serial number | ASCII text or raw bytes |
| 12 | Hardware version | u16 divided by 100 |
| 13 | Bluetooth address | 6 bytes in reverse order |

### Label types

| Value | Label type |
|---|---|
| 1 | Gap (die-cut labels) |
| 2 | Black mark |
| 3 | Continuous |
| 4 | Perforated (hole) |
| 5 | Transparent |
| 6 | PVC tag |
| 10 | Black mark gap |
| 11 | Heat-shrink tube |

These values are the same as the paper type codes in the printer list of the official app.

## Print sequence

The three command sets use the same sequence with small differences.

1. Send Set density (`21`).
2. Send Set label type (`23`).
3. Send Print start (`01`).
4. For each page, do steps 5 to 10.
5. In the D110 command set only, send Print clear (`20`).
6. Send Page start (`03`).
7. Send Set page size (`13`).
8. In the legacy and D110 command sets, send Print quantity (`15`).
9. Send the image rows.
10. Send Page end (`E3`) until the printer returns `01`. Then poll Print status (`A3`) until the printer reports that the copies are printed.
11. Send Print end (`F3`) until the printer returns `01`.

| Step | Legacy | D110 | Modern |
|---|---|---|---|
| Print start data | `01` | `01` | total labels (u16), `00 00 00 00`, page colour (`00`) |
| Print clear | No | Yes | No |
| Set page size data | rows, columns | rows, columns | rows, columns, copies |
| Print quantity | Yes | Yes | No |

The Print status response contains the printed label count (u16), the print progress (%) and the feed progress (%). Some firmware counts labels for the whole job. Other firmware counts labels for the current page. The app accepts both.

## Image rows

The image is 1 bit for each dot. Each row is packed with the most significant bit first. A bit value of 1 prints a black dot.

The bitmap row packet (`85`) contains:

| Offset | Size | Value |
|---|---|---|
| 0 | 2 | Row number (u16) |
| 2 | 3 | Black dot counts |
| 5 | 1 | Repeat count. The printer prints the same row this number of times. |
| 6 | n | Row data |

For the black dot counts, the print head is divided into three equal parts. Each byte holds the count for one part. If a part has more than 255 black dots, the app sends `00` followed by the total count as a u16.

The app sends a row once with a repeat count when the next rows are the same. It sends blank rows with the empty row packet (`84`).

### Image orientation

Narrow printers, for example the D11, D110 and B18, feed the label sideways. The official printer list gives a print direction of 90 or 270 degrees for these models. The app turns the image by this angle before it sends the rows. Each row is then one line across the print head.

The image width must not be more than the print head width. The app crops a wider image. The print head width is the maximum print width in the model table multiplied by the dots per millimetre (8 at 203 dpi, 11.81 at 300 dpi).

## Label size

Newer firmware (protocol version 4 and later) answers the paper information request (`59`) with the size of the loaded roll. Older firmware sends `00` or no response. The app then does not send the request again on that connection.

The response has 18 data bytes. All values are u16 except where the table shows u8.

| Offset | Value |
|---|---|
| 0 | Gap (dots) |
| 2 | Total height (dots) |
| 4 | Label type (u8) |
| 5 | Gap (0.1 mm) |
| 7 | Total height (0.1 mm) |
| 9 | Width (dots) |
| 11 | Width (0.1 mm) |
| 13 | Direction (u8) |
| 14 | Tail length (dots) |
| 16 | Tail length (0.1 mm) |

The width is across the print head. The total height is along the feed. On the B21 Pro (model ID 785), the total height includes the gap, so the app subtracts the gap.

The RFID response (`1B`) does not contain the label size. The tag stores the size in an encrypted area that the printer uses for its own calibration.

## Status packets

The heartbeat response length changes with the model. The app reads these bytes:

| Data length | Cover | Battery | Labels | RFID |
|---|---|---|---|---|
| 9 | byte 8 | | | |
| 10 | byte 8 | byte 9 | | byte 8 |
| 13 | byte 9 | byte 10 | byte 11 | byte 12 |
| 19 | byte 15 | byte 16 | byte 17 | byte 18 |
| 20 | | | byte 18 | byte 19 |

For the cover and the labels, 0 means closed and loaded.

The RFID response (`1B`) starts with `00` when no tag is found. Otherwise it contains these fields in sequence:

| Field | Size |
|---|---|
| Tag UUID | 8 bytes |
| Roll barcode | 1 length byte, then the text |
| Roll serial | 1 length byte, then the text |
| Total label count | u16 |
| Used label count | u16 |
| Label type | 1 byte |
