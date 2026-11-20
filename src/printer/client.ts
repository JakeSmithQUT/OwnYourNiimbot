import { imageToRowPackets, type MonoImage } from './encoder';
import { findModelById, type PrinterModel, type PrintVariant } from './models';
import {
  encodePacket,
  HEARTBEAT_RESPONSES,
  InfoKey,
  PacketParser,
  PRINT_ERRORS,
  readU16,
  Req,
  Res,
  toHex,
  u16,
  type Packet,
} from './protocol';
import type { Transport } from './transports';

export interface PrinterInfo {
  modelId?: number;
  model?: PrinterModel;
  firmware?: string;
  hardware?: string;
  serialNumber?: string;
  bluetoothAddress?: string;
  batteryLevel?: number;
  density?: number;
  labelType?: number;
  autoShutdown?: number;
}

export interface PrinterStatus {
  lidClosed?: boolean;
  paperLoaded?: boolean;
  rfidRead?: boolean;
  batteryLevel?: number;
  updatedAt: number;
}

export interface RfidInfo {
  present: boolean;
  uuid?: string;
  barcode?: string;
  serial?: string;
  totalLabels?: number;
  usedLabels?: number;
  type?: number;
}

/** Label size that the printer reads from the roll. Only newer firmware reports it. */
export interface PaperInfo {
  /** Label width across the print head. */
  widthMm: number;
  /** Label length along the feed, without the gap. */
  lengthMm: number;
  gapMm: number;
  /** Tail length of cable labels. */
  tailMm: number;
  labelType: number;
  widthDots: number;
  lengthDots: number;
}

export interface PrintPage {
  image: MonoImage;
  copies: number;
}

export interface PrintJob {
  pages: PrintPage[];
  density: number;
  labelType: number;
  variant: PrintVariant;
  headDots: number;
}

export interface PrintProgress {
  page: number;
  pageCount: number;
  printed: number;
  total: number;
  message: string;
}

export interface LogEntry {
  time: number;
  dir: 'tx' | 'rx' | 'info' | 'error';
  text: string;
}

export class PrintError extends Error {
  constructor(readonly code: number) {
    super(PRINT_ERRORS[code] ?? `Printer error ${code}`);
    this.name = 'PrintError';
  }
}

interface Waiter {
  expect: number[];
  resolve: (p: Packet) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

type Listener = () => void;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class NiimbotClient {
  transport?: Transport;
  info: PrinterInfo = {};
  status: PrinterStatus = { updatedAt: 0 };
  rfid?: RfidInfo;
  paper?: PaperInfo;
  /** False when the printer answered that it does not support the paper info command. */
  paperInfoSupported?: boolean;
  printing = false;
  log: LogEntry[] = [];

  private parser = new PacketParser();
  private waiters: Waiter[] = [];
  private queue: Promise<unknown> = Promise.resolve();
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private listeners = new Set<Listener>();
  private lastPrintError?: PrintError;
  private rollTimer?: ReturnType<typeof setTimeout>;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  private addLog(dir: LogEntry['dir'], text: string): void {
    this.log.push({ time: Date.now(), dir, text });
    if (this.log.length > 500) this.log.splice(0, this.log.length - 500);
  }

  get connected(): boolean {
    return Boolean(this.transport);
  }

  async connect(transport: Transport): Promise<PrinterInfo> {
    await this.disconnect();
    this.transport = transport;
    this.parser.reset();
    transport.onData = (data) => this.handleData(data);
    transport.onClose = () => this.handleClose();
    this.addLog('info', `Connected to ${transport.name} over ${transport.kind}`);

    try {
      await this.request(Req.Connect, [1], [Res.Connect], 1000, true);
    } catch {
      // Some models do not answer the connect request. They still accept commands.
    }
    await this.refreshInfo();
    if (this.info.model?.rfid !== false) await this.readRfid().catch(() => undefined);
    await this.readPaperInfo().catch(() => undefined);
    await this.heartbeat().catch(() => undefined);
    this.heartbeatTimer = setInterval(() => {
      if (!this.printing) void this.heartbeat().catch(() => undefined);
    }, 3000);
    this.emit();
    return this.info;
  }

  async disconnect(): Promise<void> {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
    const t = this.transport;
    this.transport = undefined;
    if (t) {
      t.onClose = undefined;
      t.onData = undefined;
      await t.close().catch(() => undefined);
      this.addLog('info', 'Disconnected');
    }
    this.rejectAll(new Error('Disconnected'));
    this.resetState();
    this.emit();
  }

  private handleClose(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
    this.transport = undefined;
    this.addLog('error', 'The printer connection closed');
    this.rejectAll(new Error('The printer connection closed'));
    this.resetState();
    this.emit();
  }

  private resetState(): void {
    if (this.rollTimer) clearTimeout(this.rollTimer);
    this.rollTimer = undefined;
    this.info = {};
    this.status = { updatedAt: 0 };
    this.rfid = undefined;
    this.paper = undefined;
    this.paperInfoSupported = undefined;
  }

  private rejectAll(err: Error): void {
    for (const w of this.waiters.splice(0)) {
      clearTimeout(w.timer);
      w.reject(err);
    }
  }

  private handleData(data: Uint8Array): void {
    for (const packet of this.parser.push(data)) {
      this.addLog('rx', `${packet.command.toString(16).padStart(2, '0')} [${toHex(packet.data)}]`);
      if (packet.command === Res.PrintError) {
        const err = new PrintError(packet.data[0] ?? 0);
        this.lastPrintError = err;
        this.addLog('error', err.message);
        this.rejectAll(err);
        continue;
      }
      if (packet.command === Res.NotSupported) {
        const w = this.waiters.shift();
        if (w) {
          clearTimeout(w.timer);
          w.reject(new Error('The printer does not support this command'));
        }
        continue;
      }
      const idx = this.waiters.findIndex((w) => w.expect.includes(packet.command));
      if (idx >= 0) {
        const [w] = this.waiters.splice(idx, 1);
        clearTimeout(w.timer);
        w.resolve(packet);
      }
    }
  }

  private async write(bytes: Uint8Array): Promise<void> {
    if (!this.transport) throw new Error('No printer is connected');
    await this.transport.write(bytes);
  }

  /** Sends one packet and waits for one of the expected response commands. */
  request(command: number, data: number[], expect: number[], timeoutMs = 2000, prefix = false): Promise<Packet> {
    const run = async () => {
      if (!this.transport) throw new Error('No printer is connected');
      const bytes = encodePacket(command, data, prefix);
      let waiter: Waiter | undefined;
      const response = new Promise<Packet>((resolve, reject) => {
        const timer = setTimeout(() => {
          const i = this.waiters.findIndex((w) => w.timer === timer);
          if (i >= 0) this.waiters.splice(i, 1);
          reject(new Error(`No response to command 0x${command.toString(16)}`));
        }, timeoutMs);
        waiter = { expect, resolve, reject, timer };
        this.waiters.push(waiter);
      });
      this.addLog('tx', `${command.toString(16).padStart(2, '0')} [${toHex(data)}]`);
      try {
        await this.write(bytes);
      } catch (err) {
        if (waiter) {
          clearTimeout(waiter.timer);
          const i = this.waiters.indexOf(waiter);
          if (i >= 0) this.waiters.splice(i, 1);
        }
        response.catch(() => undefined);
        throw err;
      }
      return response;
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  async getInfo(key: number): Promise<Uint8Array> {
    const p = await this.request(Req.PrinterInfo, [key], [Req.PrinterInfo + key], 1500);
    return p.data;
  }

  async refreshInfo(): Promise<PrinterInfo> {
    const info: PrinterInfo = {};
    const tryGet = async (key: number) => this.getInfo(key).catch(() => undefined);

    const model = await tryGet(InfoKey.ModelId);
    if (model && model.length >= 2) {
      info.modelId = readU16(model);
      info.model = findModelById(info.modelId);
    }
    const sw = await tryGet(InfoKey.SoftwareVersion);
    if (sw) info.firmware = formatVersion(sw);
    const hw = await tryGet(InfoKey.HardwareVersion);
    if (hw) info.hardware = formatVersion(hw);
    const sn = await tryGet(InfoKey.SerialNumber);
    if (sn) info.serialNumber = formatSerial(sn);
    const battery = await tryGet(InfoKey.BatteryLevel);
    if (battery && battery.length) info.batteryLevel = battery[0];
    const density = await tryGet(InfoKey.Density);
    if (density && density.length) info.density = density[0];
    const labelType = await tryGet(InfoKey.LabelType);
    if (labelType && labelType.length) info.labelType = labelType[0];
    const shutdown = await tryGet(InfoKey.AutoShutdownTime);
    if (shutdown && shutdown.length) info.autoShutdown = shutdown[0];
    const mac = await tryGet(InfoKey.BluetoothAddress);
    if (mac && mac.length >= 6) {
      info.bluetoothAddress = Array.from(mac.slice(0, 6)).reverse().map((b) => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
    }
    this.info = info;
    this.emit();
    return info;
  }

  async heartbeat(): Promise<PrinterStatus> {
    const p = await this.request(Req.Heartbeat, [1], HEARTBEAT_RESPONSES, 1500);
    const prev = this.status;
    this.status = parseHeartbeat(p.data);
    if (this.status.batteryLevel !== undefined) this.info.batteryLevel = this.status.batteryLevel;
    // A closed cover, newly loaded labels or a new tag read can mean a different roll.
    const became = (a: boolean | undefined, b: boolean | undefined) => a === false && b === true;
    if (
      prev.updatedAt &&
      (became(prev.lidClosed, this.status.lidClosed) || became(prev.paperLoaded, this.status.paperLoaded) || became(prev.rfidRead, this.status.rfidRead))
    ) {
      this.scheduleRollRefresh();
    }
    this.emit();
    return this.status;
  }

  /** Reads the roll again after the printer has finished its own label calibration. */
  private scheduleRollRefresh(delayMs = 2500): void {
    if (this.rollTimer) clearTimeout(this.rollTimer);
    this.rollTimer = setTimeout(() => {
      this.rollTimer = undefined;
      if (!this.printing) void this.refreshRoll();
    }, delayMs);
  }

  /** Reads the RFID tag and the paper size of the loaded roll. */
  async refreshRoll(): Promise<void> {
    if (!this.transport) return;
    if (this.info.model?.rfid !== false) await this.readRfid().catch(() => undefined);
    await this.readPaperInfo().catch(() => undefined);
    this.emit();
  }

  /** Asks the printer for the size of the loaded labels (command 0x59, newer firmware only). */
  async readPaperInfo(): Promise<PaperInfo | undefined> {
    if (this.paperInfoSupported === false) return undefined;
    try {
      const p = await this.request(Req.GetPaperInfo, [1], [Res.GetPaperInfo], 1200);
      this.paperInfoSupported = true;
      this.paper = parsePaperInfo(p.data, this.info.modelId);
    } catch (err) {
      // Older firmware rejects the command or does not answer. Do not ask again on this connection.
      if (!(err instanceof PrintError)) this.paperInfoSupported = false;
      this.paper = undefined;
    }
    this.emit();
    return this.paper;
  }

  async readRfid(): Promise<RfidInfo> {
    const p = await this.request(Req.RfidInfo, [1], [Res.RfidInfo], 1500);
    this.rfid = parseRfid(p.data);
    this.emit();
    return this.rfid;
  }

  async setAutoShutdown(value: number): Promise<boolean> {
    const p = await this.request(Req.SetAutoShutdownTime, [value], [Res.SetAutoShutdownTime]);
    const ok = p.data[0] === 1;
    if (ok) this.info.autoShutdown = value;
    this.emit();
    return ok;
  }

  /** Sound types: 1 = Bluetooth connection sound, 2 = power sound. */
  async setSound(soundType: 1 | 2, enabled: boolean): Promise<boolean> {
    const p = await this.request(Req.SoundSettings, [1, soundType, enabled ? 1 : 0], [Res.SoundSettings]);
    return p.data[0] === 1 || p.data.length > 0;
  }

  /** Feeds labels until the printer finds the label gap or mark. */
  async calibrate(labelType: number): Promise<boolean> {
    const p = await this.request(Req.LabelPositioningCalibration, [labelType], [Res.LabelPositioningCalibration], 15000);
    return p.data[0] === 1;
  }

  async print(job: PrintJob, onProgress?: (p: PrintProgress) => void, signal?: AbortSignal): Promise<void> {
    if (!this.transport) throw new Error('No printer is connected');
    if (this.printing) throw new Error('A print job is already in progress');
    this.printing = true;
    this.lastPrintError = undefined;
    this.emit();

    const total = job.pages.reduce((n, p) => n + p.copies, 0);
    const report = (page: number, printed: number, message: string) =>
      onProgress?.({ page, pageCount: job.pages.length, printed, total, message });
    const checkAbort = () => {
      if (this.lastPrintError) throw this.lastPrintError;
      if (signal?.aborted) throw new DOMException('Print cancelled', 'AbortError');
    };

    try {
      report(0, 0, 'Preparing the printer');
      await this.request(Req.SetDensity, [job.density], [Res.SetDensity]);
      await this.request(Req.SetLabelType, [job.labelType], [Res.SetLabelType]);
      if (job.variant === 'modern') {
        await this.request(Req.PrintStart, [...u16(total), 0, 0, 0, 0, 0], [Res.PrintStart]);
      } else {
        await this.request(Req.PrintStart, [1], [Res.PrintStart]);
      }

      let done = 0;
      for (let i = 0; i < job.pages.length; i++) {
        checkAbort();
        const { image, copies } = job.pages[i];
        report(i + 1, done, `Sending label ${i + 1} of ${job.pages.length}`);

        if (job.variant === 'd110') {
          await this.request(Req.PrintClear, [1], [Res.PrintClear]).catch(() => undefined);
        }
        await this.request(Req.PageStart, [1], [Res.PageStart]);
        if (job.variant === 'modern') {
          await this.request(Req.SetPageSize, [...u16(image.rows), ...u16(image.cols), ...u16(copies)], [Res.SetPageSize]);
        } else {
          await this.request(Req.SetPageSize, [...u16(image.rows), ...u16(image.cols)], [Res.SetPageSize]);
          await this.request(Req.PrintQuantity, u16(copies), [Res.PrintQuantity]);
        }

        const rows = imageToRowPackets(image, job.headDots);
        await this.sendRaw(rows, signal);

        let pageEnded = false;
        for (let attempt = 0; attempt < 60 && !pageEnded; attempt++) {
          checkAbort();
          const r = await this.request(Req.PageEnd, [1], [Res.PageEnd]);
          pageEnded = r.data[0] === 1;
          if (!pageEnded) await sleep(50);
        }
        if (!pageEnded) throw new Error('The printer did not accept the label data');

        done += copies;
        await this.waitForPrinted(done, copies, (printed) => report(i + 1, printed, `Printing label ${i + 1} of ${job.pages.length}`), signal);
      }

      report(job.pages.length, total, 'Finishing');
      for (let attempt = 0; attempt < 30; attempt++) {
        const r = await this.request(Req.PrintEnd, [1], [Res.PrintEnd]);
        if (r.data[0] === 1) break;
        await sleep(100);
      }
      report(job.pages.length, total, 'Done');
    } catch (err) {
      this.addLog('error', (err as Error).message);
      if (this.transport) {
        await this.request(Req.CancelPrint, [1], [Res.CancelPrint], 1000).catch(() => undefined);
        await this.request(Req.PrintEnd, [1], [Res.PrintEnd], 1000).catch(() => undefined);
      }
      throw err;
    } finally {
      this.printing = false;
      this.emit();
    }
  }

  /** Sends packets that have no response, such as image rows. */
  private async sendRaw(packets: Uint8Array[], signal?: AbortSignal): Promise<void> {
    const interval = this.transport?.packetIntervalMs ?? 0;
    const run = async () => {
      for (const p of packets) {
        if (signal?.aborted) throw new DOMException('Print cancelled', 'AbortError');
        if (this.lastPrintError) throw this.lastPrintError;
        await this.write(p);
        if (interval) await sleep(interval);
      }
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  /**
   * Polls the print status until the printer reports the expected label count.
   * Some firmware counts labels for the whole job, other firmware counts them
   * for the current page only, so both are accepted.
   */
  private async waitForPrinted(target: number, pageCopies: number, onCount: (n: number) => void, signal?: AbortSignal): Promise<void> {
    const deadline = Date.now() + 20000 + pageCopies * 8000;
    let sawWork = false;
    while (Date.now() < deadline) {
      if (signal?.aborted) throw new DOMException('Print cancelled', 'AbortError');
      if (this.lastPrintError) throw this.lastPrintError;
      const p = await this.request(Req.PrintStatus, [1], [Res.PrintStatus], 1500).catch((e) => {
        if (e instanceof PrintError) throw e;
        return undefined;
      });
      if (p && p.data.length >= 2) {
        const page = readU16(p.data);
        const progress1 = p.data[2] ?? 100;
        const progress2 = p.data[3] ?? 100;
        if (progress1 < 100 || progress2 < 100) sawWork = true;
        onCount(Math.min(page, target));
        if (page >= target) return;
        if (sawWork && page >= pageCopies && progress1 >= 100 && progress2 >= 100) return;
      }
      await sleep(300);
    }
    this.addLog('info', 'The printer did not report the label count in time. Continuing.');
  }
}

function formatVersion(data: Uint8Array): string {
  if (data.length >= 2) return (readU16(data) / 100).toFixed(2);
  return String(data[0] ?? '');
}

function formatSerial(data: Uint8Array): string {
  const printable = Array.from(data).every((b) => b >= 0x20 && b < 0x7f);
  if (printable && data.length > 0) return new TextDecoder().decode(data);
  return toHex(data).replace(/ /g, '').toUpperCase();
}

export function parseHeartbeat(d: Uint8Array): PrinterStatus {
  let closing: number | undefined;
  let power: number | undefined;
  let paper: number | undefined;
  let rfid: number | undefined;
  switch (d.length) {
    case 20:
      paper = d[18];
      rfid = d[19];
      break;
    case 19:
      closing = d[15];
      power = d[16];
      paper = d[17];
      rfid = d[18];
      break;
    case 13:
      closing = d[9];
      power = d[10];
      paper = d[11];
      rfid = d[12];
      break;
    case 10:
      closing = d[8];
      power = d[9];
      rfid = d[8];
      break;
    case 9:
      closing = d[8];
      break;
  }
  return {
    lidClosed: closing === undefined ? undefined : closing === 0,
    paperLoaded: paper === undefined ? undefined : paper === 0,
    rfidRead: rfid === undefined ? undefined : rfid !== 0,
    batteryLevel: power,
    updatedAt: Date.now(),
  };
}

export function parseRfid(d: Uint8Array): RfidInfo {
  if (d.length === 0 || d[0] === 0) return { present: false };
  try {
    const uuid = toHex(d.slice(0, 8)).replace(/ /g, '');
    let i = 8;
    const barcodeLen = d[i++];
    const barcode = new TextDecoder().decode(d.slice(i, i + barcodeLen));
    i += barcodeLen;
    const serialLen = d[i++];
    const serial = new TextDecoder().decode(d.slice(i, i + serialLen));
    i += serialLen;
    const totalLabels = readU16(d, i);
    const usedLabels = readU16(d, i + 2);
    const type = d[i + 4];
    return { present: true, uuid, barcode, serial, totalLabels, usedLabels, type };
  } catch {
    return { present: true };
  }
}

/** Model IDs whose paper info includes the gap in the total height. */
const HEIGHT_INCLUDES_GAP = new Set([785]);

/**
 * Parses the 0x69 paper info response. The 18-byte layout is: gap (dots),
 * total height (dots), paper type, gap (0.1 mm), total height (0.1 mm),
 * width (dots), width (0.1 mm), direction, tail (dots), tail (0.1 mm).
 * Shorter responses do not hold a usable size.
 */
export function parsePaperInfo(d: Uint8Array, modelId?: number): PaperInfo | undefined {
  if (d.length !== 18) return undefined;
  const gapDots = readU16(d, 0);
  let lengthDots = readU16(d, 2);
  const labelType = d[4];
  const gapMm = readU16(d, 5) / 10;
  let lengthMm = readU16(d, 7) / 10;
  const widthDots = readU16(d, 9);
  const widthMm = readU16(d, 11) / 10;
  const tailMm = readU16(d, 16) / 10;
  if (modelId !== undefined && HEIGHT_INCLUDES_GAP.has(modelId)) {
    lengthMm -= gapMm;
    lengthDots -= gapDots;
  }
  if (widthMm <= 0 || lengthMm <= 0) return undefined;
  return { widthMm, lengthMm, gapMm, tailMm, labelType, widthDots, lengthDots };
}

/** Battery value to a percentage. Older models report a level from 1 to 4. */
export function batteryPercent(level: number | undefined): number | undefined {
  if (level === undefined) return undefined;
  if (level <= 4) return Math.round((level / 4) * 100);
  return Math.min(100, level);
}
