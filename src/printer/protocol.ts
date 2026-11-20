// NIIMBOT packet format
//
//   55 55 | cmd | len | data[len] | checksum | AA AA
//
// The checksum is the XOR of cmd, len and every data byte. The connect
// request is the only packet that has an extra 0x03 byte before the head.

export const PACKET_HEAD = [0x55, 0x55] as const;
export const PACKET_TAIL = [0xaa, 0xaa] as const;

export const Req = {
  PrintStart: 0x01,
  PageStart: 0x03,
  SetPageSize: 0x13,
  PrintQuantity: 0x15,
  RfidInfo: 0x1a,
  PrintClear: 0x20,
  SetDensity: 0x21,
  SetLabelType: 0x23,
  SetAutoShutdownTime: 0x27,
  PrinterReset: 0x28,
  PrinterInfo: 0x40,
  SoundSettings: 0x58,
  GetPaperInfo: 0x59,
  PrintTestPage: 0x5a,
  PrintBitmapRowIndexed: 0x83,
  PrintEmptyRow: 0x84,
  PrintBitmapRow: 0x85,
  LabelPositioningCalibration: 0x8e,
  PrintStatus: 0xa3,
  PrinterStatusData: 0xa5,
  Connect: 0xc1,
  CancelPrint: 0xda,
  Heartbeat: 0xdc,
  PageEnd: 0xe3,
  PrintEnd: 0xf3,
} as const;

export const Res = {
  NotSupported: 0x00,
  PrintStart: 0x02,
  PageStart: 0x04,
  SetPageSize: 0x14,
  PrintQuantity: 0x16,
  RfidInfo: 0x1b,
  PrintClear: 0x30,
  SetDensity: 0x31,
  SetLabelType: 0x33,
  SetAutoShutdownTime: 0x37,
  PrinterReset: 0x38,
  SoundSettings: 0x68,
  GetPaperInfo: 0x69,
  PrintTestPage: 0x6a,
  LabelPositioningCalibration: 0x8f,
  PrintStatus: 0xb3,
  PrinterStatusData: 0xb5,
  Connect: 0xc2,
  CancelPrint: 0xd0,
  PrinterCheckLine: 0xd3,
  HeartbeatAdvanced2: 0xd9,
  PrintError: 0xdb,
  HeartbeatAdvanced1: 0xdd,
  HeartbeatBasic: 0xde,
  HeartbeatUnknown: 0xdf,
  PrinterPageIndex: 0xe0,
  PageEnd: 0xe4,
  PrintEnd: 0xf4,
} as const;

export const HEARTBEAT_RESPONSES = [
  Res.HeartbeatAdvanced1,
  Res.HeartbeatAdvanced2,
  Res.HeartbeatBasic,
  Res.HeartbeatUnknown,
];

/** Keys for the PrinterInfo (0x40) request. The response command is 0x40 + key. */
export const InfoKey = {
  Density: 1,
  PrintSpeed: 2,
  LabelType: 3,
  Language: 6,
  AutoShutdownTime: 7,
  ModelId: 8,
  SoftwareVersion: 9,
  BatteryLevel: 10,
  SerialNumber: 11,
  HardwareVersion: 12,
  BluetoothAddress: 13,
  PrintMode: 14,
  Area: 15,
} as const;

/** Label (paper) types. The codes match the paper codes in the official printer list. */
export const LabelType = {
  Gap: 1,
  BlackMark: 2,
  Continuous: 3,
  Perforated: 4,
  Transparent: 5,
  PvcTag: 6,
  BlackMarkGap: 10,
  HeatShrinkTube: 11,
} as const;

export const LABEL_TYPE_NAMES: Record<number, string> = {
  1: 'Gap (die-cut)',
  2: 'Black mark',
  3: 'Continuous',
  4: 'Perforated (hole)',
  5: 'Transparent',
  6: 'PVC tag',
  10: 'Black mark gap',
  11: 'Heat-shrink tube',
};

export const PRINT_ERRORS: Record<number, string> = {
  1: 'The cover is open',
  2: 'No labels are loaded',
  3: 'The battery is low',
  4: 'Battery fault',
  5: 'Print cancelled on the printer',
  6: 'The printer rejected the print data',
  7: 'The print head is too hot',
  8: 'Label output fault',
  9: 'The printer is busy',
  10: 'No print head detected',
  11: 'The temperature is too low',
  12: 'The print head is loose',
  13: 'No ribbon is loaded',
  14: 'The ribbon is loose',
  15: 'The ribbon is used up',
  16: 'This label type is not supported',
  17: 'Label type setting error',
  18: 'No label size is set',
  19: 'RFID write failed',
  20: 'The command is not supported',
};

export const AUTO_SHUTDOWN_OPTIONS = [
  { value: 1, label: '15 minutes' },
  { value: 2, label: '30 minutes' },
  { value: 3, label: '45 minutes' },
  { value: 4, label: '60 minutes' },
];

export interface Packet {
  command: number;
  data: Uint8Array;
}

export function checksum(command: number, data: ArrayLike<number>): number {
  let sum = command ^ data.length;
  for (let i = 0; i < data.length; i++) sum ^= data[i];
  return sum & 0xff;
}

export function encodePacket(command: number, data: ArrayLike<number> = [], prefix = false): Uint8Array {
  if (data.length > 0xff) throw new Error(`Packet data too long (${data.length} bytes)`);
  const offset = prefix ? 1 : 0;
  const out = new Uint8Array(offset + data.length + 7);
  if (prefix) out[0] = 0x03;
  out[offset] = 0x55;
  out[offset + 1] = 0x55;
  out[offset + 2] = command;
  out[offset + 3] = data.length;
  out.set(data as ArrayLike<number>, offset + 4);
  out[offset + 4 + data.length] = checksum(command, data);
  out[offset + 5 + data.length] = 0xaa;
  out[offset + 6 + data.length] = 0xaa;
  return out;
}

/**
 * Collects bytes from the transport and returns complete packets.
 * A notification can hold part of a packet or more than one packet.
 */
export class PacketParser {
  private buffer = new Uint8Array(0);

  push(chunk: Uint8Array): Packet[] {
    const merged = new Uint8Array(this.buffer.length + chunk.length);
    merged.set(this.buffer);
    merged.set(chunk, this.buffer.length);
    this.buffer = merged;

    const packets: Packet[] = [];
    let i = 0;
    while (i + 7 <= this.buffer.length) {
      if (this.buffer[i] !== 0x55 || this.buffer[i + 1] !== 0x55) {
        i++;
        continue;
      }
      const len = this.buffer[i + 3];
      const end = i + len + 7;
      if (end > this.buffer.length) break;
      const command = this.buffer[i + 2];
      const data = this.buffer.slice(i + 4, i + 4 + len);
      const sum = this.buffer[i + 4 + len];
      const tailOk = this.buffer[end - 2] === 0xaa && this.buffer[end - 1] === 0xaa;
      if (tailOk && sum === checksum(command, data)) {
        packets.push({ command, data });
        i = end;
      } else {
        i++;
      }
    }
    this.buffer = this.buffer.slice(i);
    if (this.buffer.length > 4096) this.buffer = new Uint8Array(0);
    return packets;
  }

  reset(): void {
    this.buffer = new Uint8Array(0);
  }
}

export function u16(value: number): [number, number] {
  return [(value >> 8) & 0xff, value & 0xff];
}

export function readU16(data: Uint8Array, offset = 0): number {
  return ((data[offset] ?? 0) << 8) | (data[offset + 1] ?? 0);
}

export function toHex(data: ArrayLike<number>): string {
  return Array.from(data, (b) => b.toString(16).padStart(2, '0')).join(' ');
}
