import { useSyncExternalStore } from 'react';
import { NiimbotClient } from '../../printer/client';
import { BluetoothTransport, SerialTransport } from '../../printer/transports';
import { defaultVariant, findModelByName, guessModelFromDeviceName, modelToRemember, type PrinterModel, type PrintVariant } from '../../printer/models';
import { appStore, updateSettings } from './app';

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
  rememberConnectedModel();
}

export async function connectSerial(): Promise<void> {
  const transport = await SerialTransport.request();
  await printer.connect(transport);
  rememberConnectedModel();
}

/**
 * Keeps the model of the connected printer as the model for when no printer is
 * connected. The print area, resolution and print width then stay the same
 * after a restart, until another printer connects.
 */
function rememberConnectedModel(): void {
  const name = modelToRemember(printer.info.model, appStore.get().settings.modelName);
  if (name) updateSettings({ modelName: name });
}

/** The model to design and print for: the connected printer, or else the last connected printer or the one chosen in settings. */
export function activeModel(): PrinterModel {
  return printer.info.model ?? findModelByName(appStore.get().settings.modelName) ?? findModelByName('B1')!;
}

export function activeVariant(model: PrinterModel): PrintVariant {
  const v = appStore.get().settings.variant;
  return v === 'auto' ? defaultVariant(model) : v;
}
