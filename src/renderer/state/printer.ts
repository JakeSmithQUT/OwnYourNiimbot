import { useSyncExternalStore } from 'react';
import { NiimbotClient } from '../../printer/client';
import { BluetoothTransport, SerialTransport } from '../../printer/transports';
import { defaultVariant, findModelByName, guessModelFromDeviceName, type PrinterModel, type PrintVariant } from '../../printer/models';
import { appStore } from './app';

export const printer = new NiimbotClient();

let version = 0;
printer.subscribe(() => {
  version++;
});

export function usePrinter(): NiimbotClient {
  useSyncExternalStore(
    (fn) => printer.subscribe(fn),
    () => version,
  );
  return printer;
}

export async function connectBluetooth(): Promise<void> {
  const transport = await BluetoothTransport.request();
  await printer.connect(transport);
  if (!printer.info.model) {
    const guess = guessModelFromDeviceName(transport.name);
    if (guess) printer.info.model = guess;
  }
}

export async function connectSerial(): Promise<void> {
  const transport = await SerialTransport.request();
  await printer.connect(transport);
}

/** The model to design and print for: the connected printer, or the one chosen in settings. */
export function activeModel(): PrinterModel {
  return printer.info.model ?? findModelByName(appStore.get().settings.modelName) ?? findModelByName('B1')!;
}

export function activeVariant(model: PrinterModel): PrintVariant {
  const v = appStore.get().settings.variant;
  return v === 'auto' ? defaultVariant(model) : v;
}
