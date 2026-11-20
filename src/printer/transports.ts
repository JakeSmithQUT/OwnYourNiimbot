/// <reference types="web-bluetooth" />
/// <reference types="w3c-web-serial" />

import { t } from '../renderer/i18n';

export type TransportKind = 'bluetooth' | 'serial';

export interface Transport {
  readonly kind: TransportKind;
  readonly name: string;
  /** Time to wait between packets. Bluetooth needs a short gap, USB does not. */
  readonly packetIntervalMs: number;
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  onData?: (data: Uint8Array) => void;
  onClose?: () => void;
}

export const NIIMBOT_SERVICE = 'e7810a71-73ae-499d-8c15-faa9aef0c3f2';
export const NIIMBOT_CHARACTERISTIC = 'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f';

export class BluetoothTransport implements Transport {
  readonly kind = 'bluetooth' as const;
  readonly packetIntervalMs = 10;
  onData?: (data: Uint8Array) => void;
  onClose?: () => void;

  private constructor(
    private device: BluetoothDevice,
    private characteristic: BluetoothRemoteGATTCharacteristic,
  ) {
    characteristic.addEventListener('characteristicvaluechanged', this.handleValue);
    device.addEventListener('gattserverdisconnected', this.handleDisconnect);
  }

  get name(): string {
    return this.device.name ?? t('device.bluetoothPrinter');
  }

  /** Opens the system device picker. In the desktop app the picker is drawn by the app itself. */
  static async request(): Promise<BluetoothTransport> {
    if (!navigator.bluetooth) throw new Error(t('errors.bluetooth.notAvailable'));
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [NIIMBOT_SERVICE],
    });
    return BluetoothTransport.open(device);
  }

  static async open(device: BluetoothDevice): Promise<BluetoothTransport> {
    if (!device.gatt) throw new Error(t('errors.bluetooth.noLe'));
    const server = await device.gatt.connect();
    let characteristic: BluetoothRemoteGATTCharacteristic | undefined;
    try {
      const service = await server.getPrimaryService(NIIMBOT_SERVICE);
      try {
        characteristic = await service.getCharacteristic(NIIMBOT_CHARACTERISTIC);
      } catch {
        const all = await service.getCharacteristics();
        characteristic = all.find((c) => c.properties.notify && c.properties.writeWithoutResponse);
      }
    } catch (err) {
      server.disconnect();
      throw new Error(t('errors.bluetooth.noService', { error: (err as Error).message }));
    }
    if (!characteristic) {
      server.disconnect();
      throw new Error(t('errors.bluetooth.noChannel'));
    }
    await characteristic.startNotifications();
    return new BluetoothTransport(device, characteristic);
  }

  private handleValue = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (value) this.onData?.(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  };

  private handleDisconnect = () => {
    this.characteristic.removeEventListener('characteristicvaluechanged', this.handleValue);
    this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
    this.onClose?.();
  };

  async write(data: Uint8Array): Promise<void> {
    await this.characteristic.writeValueWithoutResponse(data as BufferSource);
  }

  async close(): Promise<void> {
    try {
      await this.characteristic.stopNotifications();
    } catch {
      // The link can already be down.
    }
    this.device.gatt?.disconnect();
  }
}

export class SerialTransport implements Transport {
  readonly kind = 'serial' as const;
  readonly packetIntervalMs = 0;
  onData?: (data: Uint8Array) => void;
  onClose?: () => void;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;
  private closed = false;

  private constructor(private port: SerialPort, readonly name: string) {
    void this.readLoop();
    port.addEventListener('disconnect', this.handleDisconnect);
  }

  static async request(baudRate = 115200): Promise<SerialTransport> {
    if (!navigator.serial) throw new Error(t('errors.serial.notAvailable'));
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate });
    const info = port.getInfo();
    const name = info.usbVendorId !== undefined
      ? `USB ${info.usbVendorId.toString(16).padStart(4, '0')}:${(info.usbProductId ?? 0).toString(16).padStart(4, '0')}`
      : info.bluetoothServiceClassId
        ? t('device.bluetoothSerialPort')
        : t('device.serialPort');
    return new SerialTransport(port, name);
  }

  private handleDisconnect = () => {
    void this.close();
  };

  private async readLoop(): Promise<void> {
    while (!this.closed && this.port.readable) {
      this.reader = this.port.readable.getReader();
      try {
        for (;;) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) this.onData?.(value);
        }
      } catch {
        break;
      } finally {
        this.reader.releaseLock();
      }
    }
    if (!this.closed) {
      this.closed = true;
      this.onClose?.();
    }
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.port.writable) throw new Error(t('errors.serial.notOpen'));
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  async close(): Promise<void> {
    const wasOpen = !this.closed;
    this.closed = true;
    this.port.removeEventListener('disconnect', this.handleDisconnect);
    try {
      await this.reader?.cancel();
    } catch {
      // Ignore. The port can already be gone.
    }
    try {
      await this.port.close();
    } catch {
      // Ignore.
    }
    if (wasOpen) this.onClose?.();
  }
}
