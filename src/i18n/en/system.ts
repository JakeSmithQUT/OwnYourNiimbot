// English texts. See src/i18n/translate.ts for the rules.
// System dialogs and update messages of the main process, label file errors,
// printer and connection texts, and messages from the app state.
export const system = {
  // Bluetooth pairing dialog
  'main.pairing.message': 'A Bluetooth device asks to pair with this computer.',
  'main.pairing.detail': 'NIIMBOT printers do not need pairing. Pair only if you expect this request.',
  'main.pairing.pin': 'PIN: {pin}',
  'main.pairing.pair': 'Pair',

  // Open and save dialogs
  'main.file.tooLarge': 'The file is larger than {size} MB.',
  'main.file.dataTooLarge': 'The data is too large to save.',

  // Print approval dialog for AI assistants
  'main.printApproval.message': 'An AI assistant asks to print labels.',
  'main.printApproval.detail_one': '{count} label of "{name}" ({size}) on the {model}.',
  'main.printApproval.detail_other': '{count} labels of "{name}" ({size}) on the {model}.',
  'main.printApproval.print': 'Print',

  // Update check and install
  'main.update.noUpdateInfo': 'The latest release has no update information. Look for a new version on the release page.',
  'main.update.checkFailed': 'The app could not check for updates. Make sure that the computer is connected to the internet, then try again.',
  'main.update.installingTitle': 'Installing OwnYourNiimbot {version}',
  'main.update.installingBody': 'OwnYourNiimbot opens again when the update is installed.',

  // Label files that cannot be opened
  'errors.label.notLabelFile': 'This file is not a label file.',
  'errors.label.notNumber': '{name} is not a valid number.',
  'errors.label.widthNotNumber': 'The label width is not a valid number.',
  'errors.label.heightNotNumber': 'The label height is not a valid number.',
  'errors.label.imageNotEmbedded': 'An image must be an embedded image. Links to files or websites are not accepted.',
  'errors.label.imageTooLarge': 'An image is too large.',
  'errors.label.imageNotValid': 'An image is not a valid image.',
  'errors.label.imagePixels': 'An image is too large ({width} x {height} pixels).',
  'errors.label.imagesTooLarge': 'The images in the label are too large together.',
  'errors.label.elementNotValid': 'A label element is not valid.',
  'errors.label.tooManyElements': 'The label has more than {max} elements.',
  'errors.label.unknownType': 'The label has an element of an unknown type ({type}).',
  'errors.label.elementTooLarge': 'An element of the label is too large.',
  'errors.label.notColour': '{name} must be a colour.',
  'errors.label.textTooLong': 'A text element is too long.',
  'errors.label.shapeTooLarge': 'A shape is too large.',
  'errors.label.barcodeTooLong': 'A barcode value is too long.',
  'errors.label.barcodeType': 'A barcode type is not valid.',
  'errors.label.tableNotValid': 'A table is not valid.',
  'errors.label.tooDeep': 'The label has too many nested elements.',
  'errors.label.groupNotValid': 'A group is not valid.',

  // Printer connection and print job
  'errors.printer.notConnected': 'No printer is connected',
  'errors.printer.disconnected': 'Disconnected',
  'errors.printer.connectionClosed': 'The printer connection closed',
  'errors.printer.notSupported': 'The printer does not support this command',
  'errors.printer.writeTimeout': 'The printer did not accept the data. Disconnect the printer and connect it again.',
  'errors.printer.noResponse': 'No response to command {command}',
  'errors.printer.jobInProgress': 'A print job is already in progress',
  'errors.printer.tooManyLabels': 'One print job can have up to {max} labels.',
  'errors.printer.pageNotAccepted': 'The printer did not accept the label data',
  'errors.printer.code': 'Printer error {code}',

  // Errors that the printer reports
  'errors.printer.coverOpen': 'The cover is open',
  'errors.printer.noLabels': 'No labels are loaded',
  'errors.printer.batteryLow': 'The battery is low',
  'errors.printer.batteryFault': 'Battery fault',
  'errors.printer.cancelledOnPrinter': 'Print cancelled on the printer',
  'errors.printer.dataRejected': 'The printer rejected the print data',
  'errors.printer.headTooHot': 'The print head is too hot',
  'errors.printer.outputFault': 'Label output fault',
  'errors.printer.printerBusy': 'The printer is busy',
  'errors.printer.noHead': 'No print head detected',
  'errors.printer.tooCold': 'The temperature is too low',
  'errors.printer.headLoose': 'The print head is loose',
  'errors.printer.noRibbon': 'No ribbon is loaded',
  'errors.printer.ribbonLoose': 'The ribbon is loose',
  'errors.printer.ribbonUsedUp': 'The ribbon is used up',
  'errors.printer.labelTypeNotSupported': 'This label type is not supported',
  'errors.printer.labelTypeSetting': 'Label type setting error',
  'errors.printer.noLabelSize': 'No label size is set',
  'errors.printer.rfidWrite': 'RFID write failed',
  'errors.printer.commandNotSupported': 'The command is not supported',

  // Bluetooth and serial connections
  'errors.bluetooth.notAvailable': 'Bluetooth is not available on this computer.',
  'errors.bluetooth.noLe': 'This device does not support Bluetooth LE.',
  'errors.bluetooth.noService': 'The printer service was not found. Make sure that this is a NIIMBOT printer. ({error})',
  'errors.bluetooth.noChannel': 'The printer data channel was not found.',
  'errors.serial.notAvailable': 'Serial ports are not available on this computer.',
  'errors.serial.notOpen': 'The serial port is not open.',
  'device.bluetoothPrinter': 'Bluetooth printer',
  'device.bluetoothSerialPort': 'Bluetooth serial port',
  'device.serialPort': 'Serial port',

  // Print progress
  'device.progress.preparing': 'Preparing the printer',
  'device.progress.sending': 'Sending label {page} of {total}',
  'device.progress.printing': 'Printing label {page} of {total}',
  'device.progress.finishing': 'Finishing',
  'device.progress.done': 'Done',

  // Label roll names
  'device.roll.size': '{width} × {length} mm',
  'device.roll.round': 'Ø {width} mm round',
  'device.roll.cable': 'cable label, {tail} mm tail',
  'device.roll.withDetails': '{size} ({details})',

  // Label types
  'device.labelType.gap': 'Gap (die-cut)',
  'device.labelType.blackMark': 'Black mark',
  'device.labelType.continuous': 'Continuous',
  'device.labelType.perforated': 'Perforated (hole)',
  'device.labelType.transparent': 'Transparent',
  'device.labelType.pvcTag': 'PVC tag',
  'device.labelType.blackMarkGap': 'Black mark gap',
  'device.labelType.heatShrinkTube': 'Heat-shrink tube',

  // Auto shutdown times
  'device.autoShutdown.minutes_one': '{count} minute',
  'device.autoShutdown.minutes_other': '{count} minutes',

  // Command sets
  'device.variant.legacy': 'Legacy (D11, B21, B3S)',
  'device.variant.legacyHint': 'Older D11, B21 and B3S firmware',
  'device.variant.d110': 'D110 family',
  'device.variant.d110Hint': 'D110, B21S, B18 and similar',
  'device.variant.modern': 'Modern (B1 and newer)',
  'device.variant.modernHint': 'B1, B2, B31, B32, K3, M2, M3, P1 and newer models',

  // Open, save and discard labels
  'state.saved': 'Saved "{name}"',
  'state.savedAsNew': 'Saved "{name}" as a new label',
  'state.cannotOpen': 'This label cannot be opened. {error}',
  'state.confirmDiscard': 'The current label has changes that are not saved. Continue and lose the changes?',
  'state.importedLabel': 'Imported label',
  'state.dataName': 'Data',

  // Loaded roll
  'state.roll.unknownSize': 'Unknown size',
  'state.roll.sizeSet': 'Label size set to {width} × {height} mm from the loaded roll',
} as const;
