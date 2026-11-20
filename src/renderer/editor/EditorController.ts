import {
  ActiveSelection,
  Canvas,
  Ellipse,
  FabricImage,
  FabricObject,
  Group,
  Line,
  loadSVGFromString,
  Point,
  Rect,
  Textbox,
  util,
  type TPointerEventInfo,
} from 'fabric';
import { LabelBarcode, LabelTable, barcodeFormat } from './objects';
import { oyn, type OynData } from './render';
import { DEFAULT_IMAGE_SETTINGS, processImage, type ImageSettings } from './imageProcessing';
import { formatDate, formatSerial, type SerialSettings } from './placeholders';
import { mmToUnits, ptToUnits, UNITS_PER_MM } from './units';

export const SERIAL_PROPS = ['oyn'];
FabricObject.customProperties = ['oyn'];

const ACCENT = '#2563eb';
FabricObject.ownDefaults.transparentCorners = false;
FabricObject.ownDefaults.cornerColor = '#ffffff';
FabricObject.ownDefaults.cornerStrokeColor = ACCENT;
FabricObject.ownDefaults.borderColor = ACCENT;
FabricObject.ownDefaults.cornerStyle = 'circle';
FabricObject.ownDefaults.cornerSize = 10;
FabricObject.ownDefaults.padding = 2;
FabricObject.ownDefaults.borderScaleFactor = 1.5;

type Listener = () => void;

export type AlignOp = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

const HISTORY_LIMIT = 100;

export class EditorController {
  canvas?: Canvas;
  widthMm = 50;
  heightMm = 30;
  zoom = 4;
  snapToGrid = true;
  gridMm = 0.5;
  /** Dots per mm of the selected printer. Used to process images at print resolution. */
  dotsPerMm = 8;
  version = 0;

  private listeners = new Set<Listener>();
  private contentListeners = new Set<Listener>();
  private history: string[] = [];
  private historyIndex = -1;
  private suspendHistory = false;
  private historyTimer?: ReturnType<typeof setTimeout>;
  private clipboard?: FabricObject;
  private guides: { x?: number; y?: number } = {};

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Called when the label content changes. Selection changes do not count. */
  onContentChange(fn: Listener): () => void {
    this.contentListeners.add(fn);
    return () => this.contentListeners.delete(fn);
  }

  /** Notifies React that something changed. */
  emit(): void {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  attach(el: HTMLCanvasElement): void {
    this.detach();
    const canvas = new Canvas(el, {
      preserveObjectStacking: true,
      backgroundColor: '#ffffff',
      selectionColor: 'rgba(37, 99, 235, 0.08)',
      selectionBorderColor: ACCENT,
      selectionLineWidth: 1,
      stopContextMenu: true,
      fireRightClick: true,
      uniformScaling: false,
    });
    this.canvas = canvas;
    canvas.on('selection:created', () => this.emit());
    canvas.on('selection:updated', () => this.emit());
    canvas.on('selection:cleared', () => this.emit());
    canvas.on('object:added', () => this.recordHistory());
    canvas.on('object:removed', () => this.recordHistory());
    canvas.on('object:modified', (e) => {
      if (e.target) this.normaliseScale(e.target);
      this.recordHistory();
      this.emit();
    });
    canvas.on('text:changed', () => {
      this.recordHistory(true);
      this.emit();
    });
    canvas.on('object:moving', (e) => this.handleMoving(e.target));
    canvas.on('mouse:up', () => {
      if (this.guides.x !== undefined || this.guides.y !== undefined) {
        this.guides = {};
        canvas.requestRenderAll();
      }
    });
    canvas.on('after:render', () => this.drawGuides());
    canvas.on('mouse:dblclick', (e: TPointerEventInfo) => {
      if (e.target instanceof LabelTable || e.target instanceof LabelBarcode) this.emit();
    });
    this.applySize();
  }

  detach(): void {
    if (this.canvas) {
      void this.canvas.dispose();
      this.canvas = undefined;
    }
  }

  // ---------- size and zoom ----------

  setLabelSize(widthMm: number, heightMm: number): void {
    this.widthMm = widthMm;
    this.heightMm = heightMm;
    this.applySize();
    this.emit();
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.5, Math.min(40, zoom));
    this.applySize();
    this.emit();
  }

  fitZoom(viewWidth: number, viewHeight: number): void {
    const z = Math.min((viewWidth - 80) / mmToUnits(this.widthMm), (viewHeight - 80) / mmToUnits(this.heightMm));
    this.setZoom(Math.max(0.5, Math.min(20, z)));
  }

  private applySize(): void {
    if (!this.canvas) return;
    const w = mmToUnits(this.widthMm);
    const h = mmToUnits(this.heightMm);
    this.canvas.setDimensions({ width: Math.round(w * this.zoom), height: Math.round(h * this.zoom) });
    this.canvas.setZoom(this.zoom);
    this.canvas.requestRenderAll();
  }

  get labelUnits(): { w: number; h: number } {
    return { w: mmToUnits(this.widthMm), h: mmToUnits(this.heightMm) };
  }

  // ---------- serialise ----------

  toJSON(): { objects?: unknown[]; [key: string]: unknown } {
    if (!this.canvas) return { objects: [] };
    return this.canvas.toObject(SERIAL_PROPS) as { objects?: unknown[] };
  }

  async load(json: object | undefined, widthMm: number, heightMm: number): Promise<void> {
    if (!this.canvas) return;
    this.suspendHistory = true;
    this.widthMm = widthMm;
    this.heightMm = heightMm;
    this.canvas.discardActiveObject();
    await this.canvas.loadFromJSON(json ?? { objects: [] });
    this.canvas.backgroundColor = '#ffffff';
    for (const obj of this.canvas.getObjects()) {
      this.applyLock(obj, Boolean(oyn(obj).locked));
      const data = oyn(obj);
      // Show today's date in date fields when a saved label opens.
      if (obj instanceof Textbox && data.kind === 'datetime') {
        obj.set('text', formatDate(new Date(Date.now() + (data.offsetDays ?? 0) * 86400000), data.format ?? 'DD/MM/YYYY'));
      }
    }
    this.applySize();
    this.suspendHistory = false;
    this.history = [JSON.stringify(this.toJSON())];
    this.historyIndex = 0;
    this.emit();
  }

  thumbnail(maxPx = 320): string {
    if (!this.canvas) return '';
    const { w, h } = this.labelUnits;
    const multiplier = maxPx / Math.max(w, h);
    const active = this.canvas.getActiveObject();
    this.canvas.discardActiveObject();
    const vt = this.canvas.viewportTransform.slice() as typeof this.canvas.viewportTransform;
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const url = this.canvas.toDataURL({ format: 'png', multiplier, left: 0, top: 0, width: w, height: h });
    this.canvas.setViewportTransform(vt);
    if (active) this.canvas.setActiveObject(active);
    this.canvas.requestRenderAll();
    return url;
  }

  // ---------- history ----------

  private recordHistory(debounce = false): void {
    if (this.suspendHistory || !this.canvas) return;
    const commit = () => {
      const snap = JSON.stringify(this.toJSON());
      if (this.history[this.historyIndex] === snap) return;
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(snap);
      if (this.history.length > HISTORY_LIMIT) this.history.shift();
      this.historyIndex = this.history.length - 1;
      for (const fn of this.contentListeners) fn();
      this.emit();
    };
    if (this.historyTimer) clearTimeout(this.historyTimer);
    if (debounce) this.historyTimer = setTimeout(commit, 400);
    else this.historyTimer = setTimeout(commit, 0);
  }

  get canUndo(): boolean {
    return this.historyIndex > 0;
  }

  get canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  async undo(): Promise<void> {
    if (!this.canUndo) return;
    this.historyIndex--;
    await this.restore(this.history[this.historyIndex]);
    for (const fn of this.contentListeners) fn();
  }

  async redo(): Promise<void> {
    if (!this.canRedo) return;
    this.historyIndex++;
    await this.restore(this.history[this.historyIndex]);
    for (const fn of this.contentListeners) fn();
  }

  private async restore(snap: string): Promise<void> {
    if (!this.canvas) return;
    this.suspendHistory = true;
    this.canvas.discardActiveObject();
    await this.canvas.loadFromJSON(JSON.parse(snap));
    this.canvas.backgroundColor = '#ffffff';
    for (const obj of this.canvas.getObjects()) this.applyLock(obj, Boolean(oyn(obj).locked));
    this.canvas.requestRenderAll();
    this.suspendHistory = false;
    this.emit();
  }

  // ---------- selection ----------

  get selection(): FabricObject[] {
    return this.canvas?.getActiveObjects() ?? [];
  }

  get active(): FabricObject | undefined {
    return this.canvas?.getActiveObject() ?? undefined;
  }

  select(obj: FabricObject): void {
    this.canvas?.setActiveObject(obj);
    this.canvas?.requestRenderAll();
    this.emit();
  }

  selectAll(): void {
    if (!this.canvas) return;
    const objs = this.canvas.getObjects().filter((o) => o.selectable);
    if (!objs.length) return;
    this.canvas.discardActiveObject();
    this.canvas.setActiveObject(new ActiveSelection(objs, { canvas: this.canvas }));
    this.canvas.requestRenderAll();
    this.emit();
  }

  /** Applies property changes to the active object and records one history step. */
  update(obj: FabricObject, props: Record<string, unknown>): void {
    obj.set(props);
    obj.setCoords();
    obj.dirty = true;
    this.canvas?.requestRenderAll();
    this.recordHistory(true);
    this.emit();
  }

  // ---------- add elements ----------

  private place(obj: FabricObject, select = true): void {
    if (!this.canvas) return;
    const { w, h } = this.labelUnits;
    const ow = obj.getScaledWidth();
    const oh = obj.getScaledHeight();
    obj.set({ left: Math.max(0, (w - ow) / 2), top: Math.max(0, (h - oh) / 2) });
    obj.setCoords();
    this.canvas.add(obj);
    if (select) this.canvas.setActiveObject(obj);
    this.canvas.requestRenderAll();
    this.emit();
  }

  private defaultFontSize(): number {
    return Math.max(ptToUnits(6), Math.min(ptToUnits(14), mmToUnits(this.heightMm) * 0.22));
  }

  addText(text = 'Text', data: OynData = { kind: 'text' }): Textbox {
    const { w } = this.labelUnits;
    const box = new Textbox(text, {
      width: Math.min(w * 0.8, Math.max(80, text.length * this.defaultFontSize() * 0.6)),
      fontSize: this.defaultFontSize(),
      fontFamily: 'Arial',
      fill: '#000000',
      textAlign: 'center',
      splitByGrapheme: false,
      lineHeight: 1.1,
    });
    (box as unknown as { oyn: OynData }).oyn = data;
    this.place(box);
    return box;
  }

  addDateTime(format = 'DD/MM/YYYY'): Textbox {
    return this.addText(formatDate(new Date(), format), { kind: 'datetime', format, offsetDays: 0 });
  }

  addSerial(serial: SerialSettings = { start: 1, step: 1, digits: 4, prefix: 'SN-', suffix: '' }): Textbox {
    return this.addText(formatSerial(serial, 0), { kind: 'serial', serial });
  }

  addBarcode(format = 'code128', value?: string): LabelBarcode {
    const f = barcodeFormat(format);
    const { w, h } = this.labelUnits;
    const size = Math.min(w, h) * 0.7;
    const barcode = new LabelBarcode({
      format,
      value: value ?? f.sample,
      width: f.twoD ? size : Math.min(w * 0.85, Math.max(250, w * 0.6)),
      height: f.twoD ? size : Math.min(h * 0.5, 120),
      textSize: Math.max(ptToUnits(5), Math.min(ptToUnits(9), h * 0.12)),
      showText: !f.twoD,
    });
    this.place(barcode);
    return barcode;
  }

  addRect(rounded = false): Rect {
    const { w, h } = this.labelUnits;
    const rect = new Rect({
      width: w * 0.5,
      height: h * 0.4,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 4,
      strokeUniform: true,
      rx: rounded ? 20 : 0,
      ry: rounded ? 20 : 0,
    });
    (rect as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
    this.place(rect);
    return rect;
  }

  addEllipse(): Ellipse {
    const { w, h } = this.labelUnits;
    const r = Math.min(w, h) * 0.25;
    const el = new Ellipse({ rx: r, ry: r, fill: 'transparent', stroke: '#000000', strokeWidth: 4, strokeUniform: true });
    (el as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
    this.place(el);
    return el;
  }

  addLine(vertical = false): Line {
    const { w, h } = this.labelUnits;
    const len = vertical ? h * 0.7 : w * 0.7;
    const line = new Line(vertical ? [0, 0, 0, len] : [0, 0, len, 0], {
      stroke: '#000000',
      strokeWidth: 4,
      strokeUniform: true,
    });
    (line as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
    this.place(line);
    return line;
  }

  addTable(rows = 3, cols = 2): LabelTable {
    const { w, h } = this.labelUnits;
    const table = new LabelTable({
      rows,
      cols,
      width: w * 0.85,
      height: h * 0.7,
      fontSize: this.defaultFontSize() * 0.8,
    });
    table.cells = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => (c === 0 ? `Item ${r + 1}` : '')));
    this.place(table);
    return table;
  }

  async addImageFromDataUrl(dataUrl: string, settings: ImageSettings = DEFAULT_IMAGE_SETTINGS): Promise<FabricImage> {
    const probe = await util.loadImage(dataUrl);
    const { w, h } = this.labelUnits;
    const scale = Math.min((w * 0.8) / probe.width, (h * 0.8) / probe.height);
    const targetW = probe.width * scale;
    const targetH = probe.height * scale;
    const processed = await processImage(dataUrl, (targetW / UNITS_PER_MM) * this.dotsPerMm, (targetH / UNITS_PER_MM) * this.dotsPerMm, settings);
    const img = await FabricImage.fromURL(processed);
    img.set({ imageSmoothing: false });
    img.scaleToWidth(targetW);
    (img as unknown as { oyn: OynData }).oyn = { kind: 'image', original: dataUrl, settings: { ...settings } };
    this.place(img);
    return img;
  }

  /** Processes the original image again with new settings at the current size. */
  async reprocessImage(img: FabricImage, settings: ImageSettings): Promise<void> {
    const data = oyn(img);
    const original = data.original as string | undefined;
    if (!original) return;
    const wUnits = img.getScaledWidth();
    const hUnits = img.getScaledHeight();
    const processed = await processImage(original, (wUnits / UNITS_PER_MM) * this.dotsPerMm, (hUnits / UNITS_PER_MM) * this.dotsPerMm, settings);
    await img.setSrc(processed);
    img.set({ scaleX: wUnits / img.width, scaleY: hUnits / img.height, imageSmoothing: false });
    data.settings = { ...settings };
    img.setCoords();
    this.canvas?.requestRenderAll();
    this.recordHistory();
    this.emit();
  }

  async addSvg(svg: string, name: string): Promise<FabricObject | undefined> {
    const { objects, options } = await loadSVGFromString(svg);
    const parts = objects.filter((o): o is FabricObject => Boolean(o));
    if (!parts.length) return undefined;
    const group = util.groupSVGElements(parts, options) as FabricObject;
    const { w, h } = this.labelUnits;
    const size = Math.min(w, h) * 0.5;
    group.scaleToWidth(size);
    if (group.getScaledHeight() > size) group.scaleToHeight(size);
    (group as unknown as { oyn: OynData }).oyn = { kind: 'icon', name };
    this.place(group);
    return group;
  }

  // ---------- edit operations ----------

  deleteSelection(): void {
    if (!this.canvas) return;
    const objs = this.canvas.getActiveObjects().filter((o) => !oyn(o).locked);
    if (!objs.length) return;
    this.canvas.discardActiveObject();
    for (const o of objs) this.canvas.remove(o);
    this.canvas.requestRenderAll();
    this.emit();
  }

  async copy(): Promise<void> {
    const active = this.active;
    if (active) this.clipboard = await active.clone(SERIAL_PROPS);
  }

  async paste(): Promise<void> {
    if (!this.canvas || !this.clipboard) return;
    const clone = await this.clipboard.clone(SERIAL_PROPS);
    this.canvas.discardActiveObject();
    clone.set({ left: (clone.left ?? 0) + 20, top: (clone.top ?? 0) + 20, evented: true });
    const ownData = (o: FabricObject) => {
      const holder = o as unknown as { oyn?: OynData };
      if (holder.oyn) holder.oyn = structuredClone(holder.oyn);
    };
    if (clone instanceof ActiveSelection) {
      clone.canvas = this.canvas;
      clone.forEachObject((o) => {
        ownData(o);
        this.canvas!.add(o);
      });
      clone.setCoords();
    } else {
      ownData(clone);
      this.canvas.add(clone);
    }
    this.clipboard.set({ left: (this.clipboard.left ?? 0) + 20, top: (this.clipboard.top ?? 0) + 20 });
    this.canvas.setActiveObject(clone);
    this.canvas.requestRenderAll();
    this.emit();
  }

  async duplicate(): Promise<void> {
    await this.copy();
    await this.paste();
  }

  nudge(dxMm: number, dyMm: number): void {
    const active = this.active;
    if (!active || oyn(active).locked) return;
    active.set({ left: (active.left ?? 0) + mmToUnits(dxMm), top: (active.top ?? 0) + mmToUnits(dyMm) });
    active.setCoords();
    this.canvas?.requestRenderAll();
    this.recordHistory(true);
    this.emit();
  }

  align(op: AlignOp): void {
    const active = this.active;
    if (!active || !this.canvas) return;
    const { w, h } = this.labelUnits;
    for (const obj of [active]) {
      // Bounding rect in the scene plane, which is the same as label units.
      const { width: bw, height: bh, left: bl, top: bt } = obj.getBoundingRect();
      let dx = 0;
      let dy = 0;
      if (op === 'left') dx = -bl;
      if (op === 'hcenter') dx = (w - bw) / 2 - bl;
      if (op === 'right') dx = w - bw - bl;
      if (op === 'top') dy = -bt;
      if (op === 'vcenter') dy = (h - bh) / 2 - bt;
      if (op === 'bottom') dy = h - bh - bt;
      obj.set({ left: (obj.left ?? 0) + dx, top: (obj.top ?? 0) + dy });
      obj.setCoords();
    }
    this.canvas.requestRenderAll();
    this.recordHistory();
    this.emit();
  }

  rotate(deg: number): void {
    const active = this.active;
    if (!active || oyn(active).locked) return;
    const next = (((active.angle ?? 0) + deg) % 360 + 360) % 360;
    active.rotate(next);
    active.setCoords();
    this.canvas?.requestRenderAll();
    this.recordHistory();
    this.emit();
  }

  layer(op: 'front' | 'back' | 'forward' | 'backward'): void {
    const active = this.active;
    if (!active || !this.canvas) return;
    if (op === 'front') this.canvas.bringObjectToFront(active);
    if (op === 'back') this.canvas.sendObjectToBack(active);
    if (op === 'forward') this.canvas.bringObjectForward(active);
    if (op === 'backward') this.canvas.sendObjectBackwards(active);
    this.canvas.requestRenderAll();
    this.recordHistory();
    this.emit();
  }

  toggleLock(): void {
    const active = this.active;
    if (!active) return;
    const locked = !oyn(active).locked;
    this.applyLock(active, locked);
    this.canvas?.requestRenderAll();
    this.recordHistory();
    this.emit();
  }

  private applyLock(obj: FabricObject, locked: boolean): void {
    oyn(obj).locked = locked;
    obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      hasControls: !locked,
    });
  }

  /** Converts scale into size for objects where scaling would distort text. */
  private normaliseScale(obj: FabricObject): void {
    const sx = obj.scaleX ?? 1;
    const sy = obj.scaleY ?? 1;
    if (sx === 1 && sy === 1) return;
    if (obj instanceof Textbox) {
      obj.set({ fontSize: (obj.fontSize ?? 12) * sy, width: (obj.width ?? 0) * sx, scaleX: 1, scaleY: 1 });
    } else if (obj instanceof LabelBarcode || obj instanceof LabelTable) {
      obj.set({ width: obj.width * sx, height: obj.height * sy, scaleX: 1, scaleY: 1 });
    } else if (obj instanceof FabricImage && oyn(obj).kind === 'image') {
      void this.reprocessImage(obj, (oyn(obj).settings as ImageSettings) ?? DEFAULT_IMAGE_SETTINGS);
      return;
    }
    obj.setCoords();
  }

  // ---------- snapping ----------

  private handleMoving(obj: FabricObject | undefined): void {
    if (!obj || !this.canvas) return;
    const { w, h } = this.labelUnits;
    const threshold = 6 / this.zoom + 2;
    this.guides = {};
    if (this.snapToGrid) {
      const g = mmToUnits(this.gridMm);
      obj.set({ left: Math.round((obj.left ?? 0) / g) * g, top: Math.round((obj.top ?? 0) / g) * g });
    }
    const center = obj.getCenterPoint();
    if (Math.abs(center.x - w / 2) < threshold) {
      obj.setPositionByOrigin(new Point(w / 2, center.y), 'center', 'center');
      this.guides.x = w / 2;
    }
    const c2 = obj.getCenterPoint();
    if (Math.abs(c2.y - h / 2) < threshold) {
      obj.setPositionByOrigin(new Point(c2.x, h / 2), 'center', 'center');
      this.guides.y = h / 2;
    }
    obj.setCoords();
  }

  private drawGuides(): void {
    if (!this.canvas || (this.guides.x === undefined && this.guides.y === undefined)) return;
    const ctx = this.canvas.getTopContext();
    const z = this.zoom;
    ctx.save();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    if (this.guides.x !== undefined) {
      ctx.beginPath();
      ctx.moveTo(this.guides.x * z, 0);
      ctx.lineTo(this.guides.x * z, this.canvas.height);
      ctx.stroke();
    }
    if (this.guides.y !== undefined) {
      ctx.beginPath();
      ctx.moveTo(0, this.guides.y * z);
      ctx.lineTo(this.canvas.width, this.guides.y * z);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Objects that need data from a data source, for the print dialog. */
  usesData(): boolean {
    const json = JSON.stringify(this.toJSON());
    return /\{\{/.test(json);
  }

  hasSerial(): boolean {
    return (this.canvas?.getObjects() ?? []).some((o) => oyn(o).kind === 'serial');
  }

  allObjects(): FabricObject[] {
    return this.canvas?.getObjects() ?? [];
  }

  isGroup(obj: FabricObject): obj is Group {
    return obj instanceof Group;
  }
}

export const editor = new EditorController();
