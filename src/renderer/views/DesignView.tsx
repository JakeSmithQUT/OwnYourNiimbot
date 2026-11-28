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
  Crop,
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
import { COMMON_ICONS, ICON_GROUPS, ICONS, iconSvg, searchIcons, type SymbolEntry } from '../editor/icons';
import { oyn } from '../editor/render';
import { pickImage, replaceImageFromFile } from '../editor/pickImage';
import { pixelsPerMm } from '../../printer/models';
import { rollEditorSize, rollStore, applyRollSize } from '../state/roll';
import { SOURCE_TEXT } from '../components/LabelPicker';
import { ElementMenu } from '../components/ElementMenu';
import { PrintAreaOverlay } from '../components/PrintAreaOverlay';
import { printArea } from '../../printer/printArea';
import { t, tn, tr } from '../i18n';
import type { MessageKey } from '../../i18n/translate';

export function useEditor(): number {
  return useVersion((fn) => editor.subscribe(fn), () => editor.version);
}

function Sidebar() {
  const [showIcons, setShowIcons] = useState(false);
  const [iconQuery, setIconQuery] = useState('');
  const found = iconQuery.trim() ? searchIcons(iconQuery) : [];
  const symbolGrid = (items: SymbolEntry[]) => (
    <div className="icon-grid">
      {items.map(({ name, Icon }) => (
        <button key={name} title={name} aria-label={name} onClick={() => void editor.addSvg(iconSvg(Icon), name)}>
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
  const insertImage = async () => {
    try {
      const url = await pickImage();
      if (url) await editor.addImageFromDataUrl(url);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };
  const tools: { label: MessageKey; icon: typeof Type; run: () => unknown }[] = [
    { label: 'design.insert.text', icon: Type, run: () => editor.addText() },
    { label: 'design.insert.barcode', icon: Barcode, run: () => editor.addBarcode('code128') },
    { label: 'design.insert.qrCode', icon: QrCode, run: () => editor.addBarcode('qrcode') },
    { label: 'design.insert.image', icon: ImageIcon, run: insertImage },
    { label: 'design.insert.date', icon: Calendar, run: () => editor.addDateTime() },
    { label: 'design.insert.serial', icon: Hash, run: () => editor.addSerial() },
    { label: 'design.insert.table', icon: Table, run: () => editor.addTable() },
    { label: 'design.insert.rectangle', icon: Square, run: () => editor.addRect() },
    { label: 'design.insert.rounded', icon: SquareDashed, run: () => editor.addRect(true) },
    { label: 'design.insert.circle', icon: Circle, run: () => editor.addEllipse() },
    { label: 'design.insert.line', icon: Minus, run: () => editor.addLine() },
    { label: 'design.insert.vertical', icon: Slash, run: () => editor.addLine(true) },
  ];
  return (
    <aside className="sidebar">
      <div className="section-title">{t('design.insert')}</div>
      <div className="tools">
        {tools.map((tool) => (
          <button key={tool.label} className="tool" onClick={() => void tool.run()}>
            <tool.icon size={20} />
            {t(tool.label)}
          </button>
        ))}
      </div>
      <div className="section-title">
        {t('design.symbols')}
        <button className="btn ghost small" onClick={() => setShowIcons(!showIcons)}>
          {showIcons ? t('design.symbols.less') : t('design.symbols.all')}
        </button>
      </div>
      <input
        type="search"
        className="icon-search"
        placeholder={tn('design.symbols.search', ICONS.length)}
        aria-label={t('design.symbols.searchLabel')}
        value={iconQuery}
        onChange={(e) => setIconQuery(e.target.value)}
      />
      {iconQuery.trim() ? (
        found.length ? symbolGrid(found) : <div className="muted icon-none">{t('design.symbols.none')}</div>
      ) : showIcons ? (
        ICON_GROUPS.map((g) => (
          <div key={g}>
            <div className="icon-group">{g}</div>
            {symbolGrid(ICONS.filter((i) => i.group === g))}
          </div>
        ))
      ) : (
        symbolGrid(COMMON_ICONS)
      )}
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
      <button className="btn ghost icon" title={t('design.toolbar.undo')} disabled={!editor.canUndo} onClick={() => void editor.undo()}>
        <Undo2 size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.redo')} disabled={!editor.canRedo} onClick={() => void editor.redo()}>
        <Redo2 size={17} />
      </button>
      <div className="sep" />
      <button className="btn ghost icon" title={t('design.toolbar.zoomOut')} onClick={() => editor.setZoom(editor.zoom / 1.2)}>
        <ZoomOut size={17} />
      </button>
      <span className="zoom-label" title={t('design.toolbar.zoomHint')}>{Math.round(((editor.zoom * 10) / (96 / 25.4)) * 100)}%</span>
      <button className="btn ghost icon" title={t('design.toolbar.zoomIn')} onClick={() => editor.setZoom(editor.zoom * 1.2)}>
        <ZoomIn size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.fit')} onClick={() => window.dispatchEvent(new Event('oyn-fit'))}>
        <Maximize size={16} />
      </button>
      <button className={`btn ghost icon${settings.snap ? ' active' : ''}`} title={t('design.toolbar.snap')} onClick={() => updateSettings({ snap: !settings.snap })}>
        <Grid3x3 size={16} />
      </button>
      <button
        className={`btn ghost icon${settings.printArea ? ' active' : ''}`}
        title={t('design.toolbar.printArea')}
        aria-pressed={settings.printArea}
        onClick={() => updateSettings({ printArea: !settings.printArea })}
      >
        <Crop size={16} />
      </button>
      <div className="sep" />
      <button className="btn ghost icon" title={t('design.toolbar.alignLeft')} disabled={!active} onClick={() => editor.align('left')}>
        <AlignStartVertical size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.centreHorizontally')} disabled={!active} onClick={() => editor.align('hcenter')}>
        <AlignCenterVertical size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.alignRight')} disabled={!active} onClick={() => editor.align('right')}>
        <AlignEndVertical size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.alignTop')} disabled={!active} onClick={() => editor.align('top')}>
        <AlignStartHorizontal size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.centreVertically')} disabled={!active} onClick={() => editor.align('vcenter')}>
        <AlignCenterHorizontal size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.alignBottom')} disabled={!active} onClick={() => editor.align('bottom')}>
        <AlignEndHorizontal size={17} />
      </button>
      <div className="sep" />
      <button className="btn ghost icon" title={t('design.toolbar.toFront')} disabled={!active} onClick={() => editor.layer('front')}>
        <ArrowUpToLine size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.toBack')} disabled={!active} onClick={() => editor.layer('back')}>
        <ArrowDownToLine size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.rotate')} disabled={!active || locked} onClick={() => editor.rotate(90)}>
        <RotateCw size={17} />
      </button>
      <button className="btn ghost icon" title={t('design.toolbar.duplicate')} disabled={!active} onClick={() => void editor.duplicate()}>
        <Copy size={16} />
      </button>
      <button className="btn ghost icon" title={locked ? t('design.toolbar.unlock') : t('design.toolbar.lock')} disabled={!active} onClick={() => editor.toggleLock()}>
        {locked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
      <button className="btn ghost icon danger" title={t('design.toolbar.delete')} disabled={!active || locked} onClick={() => editor.deleteSelection()}>
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
        {t('design.roll.loaded', {
          width: size.widthMm,
          height: size.heightMm,
          source: SOURCE_TEXT[suggestion.source],
          labelWidth: editor.widthMm,
          labelHeight: editor.heightMm,
        })}
      </span>
      <button className="btn small primary" onClick={() => applyRollSize(suggestion)}>
        {t('design.roll.use', { width: size.widthMm, height: size.heightMm })}
      </button>
      <button className="btn small ghost" onClick={() => rollStore.set({ suggestion: undefined })}>
        {t('design.roll.keep')}
      </button>
    </div>
  );
}

function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { template, settings } = appStore.use();
  usePrinter();
  useEditor();
  const model = activeModel();
  const area = printArea(editor.widthMm, editor.heightMm, model, settings.flip180);

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

  // A double-click on an image opens the file picker for a new picture.
  useEffect(
    () =>
      editor.onImageDoubleClick((target) => {
        if (oyn(target).locked) {
          toast(t('element.replaceUnlock'));
          return;
        }
        replaceImageFromFile(target).catch((err: unknown) => toast((err as Error).message, 'error'));
      }),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;
      // Keys in a dialog, for example on its buttons, do not change the label behind it.
      if (target.closest?.('[role="dialog"]')) return;
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
            {settings.printArea && <PrintAreaOverlay widthMm={editor.widthMm} heightMm={editor.heightMm} area={area} />}
            <span className="feed-hint">{rotated ? t('design.sideways') : ''}</span>
          </div>
        </div>
      </div>
      <div className="stage-status">
        <span>{t('design.status.model', { model: model.name, dpi: model.dpi, width: model.printWidthMm.max ?? '?' })}</span>
        <span>{tr('design.status.help', { kbd: (s) => <kbd>{s}</kbd> })}</span>
      </div>
      <ElementMenu />
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
