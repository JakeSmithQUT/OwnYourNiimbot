import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  Barcode,
  Calendar,
  Circle,
  Copy,
  Grid3x3,
  Hash,
  Image as ImageIcon,
  Lock,
  Maximize,
  Minus,
  QrCode,
  Redo2,
  RotateCw,
  Slash,
  Square,
  Tag,
  SquareDashed,
  Table,
  Trash2,
  Type,
  Undo2,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { editor } from '../editor/EditorController';
import { useVersion } from '../state/store';
import { appStore, toast, updateSettings } from '../state/app';
import { activeModel, usePrinter } from '../state/printer';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { ICONS, iconSvg } from '../editor/icons';
import { oyn } from '../editor/render';
import { api } from '../api';
import { pixelsPerMm } from '../../printer/models';
import { rollEditorSize, rollStore, applyRollSize } from '../state/roll';
import { SOURCE_TEXT } from '../components/LabelPicker';

export function useEditor(): number {
  return useVersion((fn) => editor.subscribe(fn), () => editor.version);
}

const IMAGE_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp', svg: 'image/svg+xml' };

export async function pickImage(): Promise<string | null> {
  const file = await api.files.open({ filters: [{ name: 'Images', extensions: Object.keys(IMAGE_TYPES) }], binary: true });
  if (!file) return null;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  return `data:${IMAGE_TYPES[ext] ?? 'image/png'};base64,${file.data}`;
}

function Sidebar() {
  const [showIcons, setShowIcons] = useState(false);
  const insertImage = async () => {
    try {
      const url = await pickImage();
      if (url) await editor.addImageFromDataUrl(url);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };
  const tools: { label: string; icon: typeof Type; run: () => unknown }[] = [
    { label: 'Text', icon: Type, run: () => editor.addText() },
    { label: 'Barcode', icon: Barcode, run: () => editor.addBarcode('code128') },
    { label: 'QR code', icon: QrCode, run: () => editor.addBarcode('qrcode') },
    { label: 'Image', icon: ImageIcon, run: insertImage },
    { label: 'Date', icon: Calendar, run: () => editor.addDateTime() },
    { label: 'Serial', icon: Hash, run: () => editor.addSerial() },
    { label: 'Table', icon: Table, run: () => editor.addTable() },
    { label: 'Rectangle', icon: Square, run: () => editor.addRect() },
    { label: 'Rounded', icon: SquareDashed, run: () => editor.addRect(true) },
    { label: 'Circle', icon: Circle, run: () => editor.addEllipse() },
    { label: 'Line', icon: Minus, run: () => editor.addLine() },
    { label: 'Vertical', icon: Slash, run: () => editor.addLine(true) },
  ];
  return (
    <aside className="sidebar">
      <div className="section-title">Insert</div>
      <div className="tools">
        {tools.map((t) => (
          <button key={t.label} className="tool" onClick={() => void t.run()}>
            <t.icon size={20} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="section-title">
        Symbols
        <button className="btn ghost small" onClick={() => setShowIcons(!showIcons)}>
          {showIcons ? 'Less' : 'All'}
        </button>
      </div>
      <div className="icon-grid">
        {(showIcons ? ICONS : ICONS.slice(0, 24)).map(({ name, Icon }) => (
          <button key={name} title={name} onClick={() => void editor.addSvg(iconSvg(Icon), name)}>
            <Icon size={18} />
          </button>
        ))}
      </div>
    </aside>
  );
}

function Toolbar() {
  useEditor();
  const active = editor.active;
  const locked = active ? Boolean(oyn(active).locked) : false;
  const { settings } = appStore.use();
  return (
    <div className="toolbar">
      <button className="btn ghost icon" title="Undo (Ctrl+Z)" disabled={!editor.canUndo} onClick={() => void editor.undo()}>
        <Undo2 size={17} />
      </button>
      <button className="btn ghost icon" title="Redo (Ctrl+Y)" disabled={!editor.canRedo} onClick={() => void editor.redo()}>
        <Redo2 size={17} />
      </button>
      <div className="sep" />
      <button className="btn ghost icon" title="Zoom out" onClick={() => editor.setZoom(editor.zoom / 1.2)}>
        <ZoomOut size={17} />
      </button>
      <span className="zoom-label" title="100% is the real size on a 96 dpi screen">{Math.round(((editor.zoom * 10) / (96 / 25.4)) * 100)}%</span>
      <button className="btn ghost icon" title="Zoom in" onClick={() => editor.setZoom(editor.zoom * 1.2)}>
        <ZoomIn size={17} />
      </button>
      <button className="btn ghost icon" title="Fit to window" onClick={() => window.dispatchEvent(new Event('oyn-fit'))}>
        <Maximize size={16} />
      </button>
      <button className={`btn ghost icon${settings.snap ? ' active' : ''}`} title="Snap to grid" onClick={() => updateSettings({ snap: !settings.snap })}>
        <Grid3x3 size={16} />
      </button>
      <div className="sep" />
      <button className="btn ghost icon" title="Align left" disabled={!active} onClick={() => editor.align('left')}>
        <AlignStartVertical size={17} />
      </button>
      <button className="btn ghost icon" title="Centre horizontally" disabled={!active} onClick={() => editor.align('hcenter')}>
        <AlignCenterVertical size={17} />
      </button>
      <button className="btn ghost icon" title="Align right" disabled={!active} onClick={() => editor.align('right')}>
        <AlignEndVertical size={17} />
      </button>
      <button className="btn ghost icon" title="Align top" disabled={!active} onClick={() => editor.align('top')}>
        <AlignStartHorizontal size={17} />
      </button>
      <button className="btn ghost icon" title="Centre vertically" disabled={!active} onClick={() => editor.align('vcenter')}>
        <AlignCenterHorizontal size={17} />
      </button>
      <button className="btn ghost icon" title="Align bottom" disabled={!active} onClick={() => editor.align('bottom')}>
        <AlignEndHorizontal size={17} />
      </button>
      <div className="sep" />
      <button className="btn ghost icon" title="Bring to front" disabled={!active} onClick={() => editor.layer('front')}>
        <ArrowUpToLine size={17} />
      </button>
      <button className="btn ghost icon" title="Send to back" disabled={!active} onClick={() => editor.layer('back')}>
        <ArrowDownToLine size={17} />
      </button>
      <button className="btn ghost icon" title="Rotate 90°" disabled={!active || locked} onClick={() => editor.rotate(90)}>
        <RotateCw size={17} />
      </button>
      <button className="btn ghost icon" title="Duplicate (Ctrl+D)" disabled={!active} onClick={() => void editor.duplicate()}>
        <Copy size={16} />
      </button>
      <button className="btn ghost icon" title={locked ? 'Unlock' : 'Lock'} disabled={!active} onClick={() => editor.toggleLock()}>
        {locked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
      <button className="btn ghost icon danger" title="Delete (Del)" disabled={!active || locked} onClick={() => editor.deleteSelection()}>
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function RollSuggestion() {
  const { suggestion } = rollStore.use();
  useEditor();
  if (!suggestion) return null;
  const size = rollEditorSize(suggestion);
  if (!size) return null;
  return (
    <div className="roll-banner">
      <Tag size={16} />
      <span>
        The printer has {size.widthMm} × {size.heightMm} mm labels loaded ({SOURCE_TEXT[suggestion.source]}). This label is {editor.widthMm} × {editor.heightMm} mm.
      </span>
      <button className="btn small primary" onClick={() => applyRollSize(suggestion)}>
        Use {size.widthMm} × {size.heightMm} mm
      </button>
      <button className="btn small ghost" onClick={() => rollStore.set({ suggestion: undefined })}>
        Keep this size
      </button>
    </div>
  );
}

function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { template } = appStore.use();
  usePrinter();
  useEditor();
  const model = activeModel();

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    editor.attach(canvasRef.current);
    void editor.load(appStore.get().template.canvas, appStore.get().template.widthMm, appStore.get().template.heightMm).then(() => {
      if (stageRef.current) editor.fitZoom(stageRef.current.clientWidth, stageRef.current.clientHeight);
    });
    return () => {
      appStore.set({ template: { ...appStore.get().template, canvas: editor.toJSON(), widthMm: editor.widthMm, heightMm: editor.heightMm } });
      editor.detach();
    };
  }, []);

  useEffect(() => {
    editor.dotsPerMm = pixelsPerMm(model.dpi);
  }, [model.dpi]);

  useEffect(() => {
    const fit = () => stageRef.current && editor.fitZoom(stageRef.current.clientWidth, stageRef.current.clientHeight);
    window.addEventListener('oyn-fit', fit);
    return () => window.removeEventListener('oyn-fit', fit);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      editor.setZoom(editor.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;
      const active = editor.active as unknown as { isEditing?: boolean } | undefined;
      if (active?.isEditing) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const step = e.shiftKey ? 5 : 0.5;
      if (key === 'delete' || key === 'backspace') editor.deleteSelection();
      else if (mod && key === 'z' && !e.shiftKey) void editor.undo();
      else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) void editor.redo();
      else if (mod && key === 'c') void editor.copy();
      else if (mod && key === 'v') void editor.paste();
      else if (mod && key === 'd') void editor.duplicate();
      else if (mod && key === 'a') editor.selectAll();
      else if (key === 'arrowleft') editor.nudge(-step, 0);
      else if (key === 'arrowright') editor.nudge(step, 0);
      else if (key === 'arrowup') editor.nudge(0, -step);
      else if (key === 'arrowdown') editor.nudge(0, step);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const radiusPx = template.cornerRadiusMm * 10 * editor.zoom;
  const rotated = model.printDirection === 90 || model.printDirection === 270;
  return (
    <div className="stage-wrap">
      <Toolbar />
      <RollSuggestion />
      <div className="stage" ref={stageRef}>
        <div className="stage-inner">
          <div className="label-frame" style={{ borderRadius: radiusPx }}>
            <span className="size-badge">
              {editor.widthMm} × {editor.heightMm} mm
            </span>
            <canvas ref={canvasRef} />
            <span className="feed-hint">{rotated ? 'Printed sideways on this model' : ''}</span>
          </div>
        </div>
      </div>
      <div className="stage-status">
        <span>
          {model.name} · {model.dpi} dpi · print head {model.printWidthMm.max ?? '?'} mm
        </span>
        <span>
          <kbd>Ctrl</kbd> + scroll to zoom · <kbd>Shift</kbd> + arrows to move 5 mm
        </span>
      </div>
    </div>
  );
}

export function DesignView() {
  return (
    <div className="design">
      <Sidebar />
      <Stage />
      <PropertiesPanel />
    </div>
  );
}
