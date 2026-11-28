import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ActiveSelection, type FabricObject } from 'fabric';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpToLine,
  Barcode,
  Calendar,
  ChevronRight,
  Circle,
  Copy,
  Hash,
  Image as ImageIcon,
  ImageUp,
  Lock,
  Minus,
  QrCode,
  Replace,
  Shapes,
  Slash,
  Square,
  SquareDashed,
  Table,
  Trash2,
  Type,
  Unlock,
  type LucideIcon,
} from 'lucide-react';
import { editor, type ContextMenuRequest, type ElementKind } from '../editor/EditorController';
import { iconSvg, searchIcons } from '../editor/icons';
import { pickImage, replaceImageFromFile } from '../editor/pickImage';
import { oyn } from '../editor/render';
import { toast } from '../state/app';
import { t } from '../i18n';
import type { MessageKey } from '../../i18n/translate';

const REPLACE_ITEMS: { kind: ElementKind; label: MessageKey; icon: LucideIcon }[] = [
  { kind: 'text', label: 'element.type.text', icon: Type },
  { kind: 'barcode', label: 'element.type.barcode', icon: Barcode },
  { kind: 'qrcode', label: 'element.type.qrCode', icon: QrCode },
  { kind: 'image', label: 'element.type.image', icon: ImageIcon },
  { kind: 'date', label: 'element.type.date', icon: Calendar },
  { kind: 'serial', label: 'element.type.serial', icon: Hash },
  { kind: 'table', label: 'element.type.table', icon: Table },
  { kind: 'rect', label: 'element.type.rectangle', icon: Square },
  { kind: 'rounded', label: 'element.type.rounded', icon: SquareDashed },
  { kind: 'circle', label: 'element.type.circle', icon: Circle },
  { kind: 'line', label: 'element.type.line', icon: Minus },
  { kind: 'vline', label: 'element.type.verticalLine', icon: Slash },
  { kind: 'symbol', label: 'element.type.symbol', icon: Shapes },
];

type Panel = 'none' | 'replace' | 'symbols';

function Item(props: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean; title?: string; keys?: string; sub?: boolean; danger?: boolean; onHover?: () => void; onFocus?: () => void; expanded?: boolean }) {
  const { icon: Icon } = props;
  return (
    <button
      type="button"
      role="menuitem"
      className={`ctx-item${props.danger ? ' danger' : ''}`}
      disabled={props.disabled}
      title={props.title}
      aria-haspopup={props.sub ? 'menu' : undefined}
      aria-expanded={props.sub ? Boolean(props.expanded) : undefined}
      onClick={props.onClick}
      onMouseEnter={props.onHover}
      onFocus={props.onFocus}
    >
      <Icon size={15} />
      <span>{props.label}</span>
      {props.keys && <span className="ctx-keys">{props.keys}</span>}
      {props.sub && <ChevronRight size={14} className="ctx-keys" />}
    </button>
  );
}

/** Moves the focus between the items of one menu panel with the arrow keys. */
function moveFocus(e: ReactKeyboardEvent<HTMLDivElement>): boolean {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return false;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(':scope > [role=menuitem]:not(:disabled), :scope > .ctx-icons > [role=menuitem]'));
  if (!items.length) return false;
  const i = items.indexOf(document.activeElement as HTMLButtonElement);
  let next = 0;
  if (e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % items.length;
  if (e.key === 'ArrowUp') next = i <= 0 ? items.length - 1 : i - 1;
  if (e.key === 'End') next = items.length - 1;
  items[next].focus();
  e.preventDefault();
  e.stopPropagation();
  return true;
}

function focusFirst(el: HTMLElement | null): void {
  el?.querySelector<HTMLButtonElement>('[role=menuitem]:not(:disabled)')?.focus();
}

/** Right-click menu for an element on the label: replace it with another type, and the common actions. */
export function ElementMenu() {
  const [req, setReq] = useState<ContextMenuRequest>();
  const [panel, setPanel] = useState<Panel>('none');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [pos, setPos] = useState<{ left: number; top: number }>();
  const [subPos, setSubPos] = useState<{ left: number; top: number }>();
  const menuRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const replaceRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<Element | null>(null);
  /** True when the submenu opened from the keyboard or a click, so that it gets the focus. */
  const focusSub = useRef(false);

  const close = () => {
    setReq(undefined);
    setPanel('none');
    setPos(undefined);
    setSubPos(undefined);
  };

  useEffect(
    () =>
      editor.onContextMenu((r) => {
        restoreFocus.current = document.activeElement;
        setSymbolQuery('');
        setPanel('none');
        setPos(undefined);
        setSubPos(undefined);
        setReq(r);
      }),
    [],
  );

  // Close on a click outside the menu, Escape, scrolling, resizing and window changes.
  useEffect(() => {
    if (!req) return;
    const onDown = (e: PointerEvent) => {
      const node = e.target as Node;
      if (menuRef.current?.contains(node) || subRef.current?.contains(node)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (panel === 'symbols') openPanel('replace', true);
      else if (panel === 'replace') {
        setPanel('none');
        focusFirst(replaceRef.current);
      } else close();
    };
    const onScroll = (e: Event) => {
      if (subRef.current?.contains(e.target as Node)) return;
      close();
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('wheel', onScroll, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('wheel', onScroll, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    };
  }, [req, panel]);

  // Keep the menu inside the window.
  useLayoutEffect(() => {
    if (!req || !menuRef.current) return;
    const r = menuRef.current.getBoundingClientRect();
    setPos({
      left: Math.max(8, Math.min(req.x, window.innerWidth - r.width - 8)),
      top: Math.max(8, Math.min(req.y, window.innerHeight - r.height - 8)),
    });
  }, [req]);

  // A hidden element cannot take the focus, so wait until the menu has its position.
  useEffect(() => {
    if (pos) focusFirst(menuRef.current);
  }, [pos === undefined]);

  // Open the submenu to the right of the "Replace with" item, or to the left if there is no space.
  useLayoutEffect(() => {
    if (panel === 'none' || !subRef.current || !replaceRef.current || !menuRef.current) return;
    const anchor = replaceRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    const sub = subRef.current.getBoundingClientRect();
    const right = menu.right + 4;
    const left = right + sub.width > window.innerWidth - 8 ? Math.max(8, menu.left - sub.width - 4) : right;
    const top = Math.max(8, Math.min(anchor.top - 5, window.innerHeight - sub.height - 8));
    setSubPos({ left, top });
  }, [panel, pos]);

  useEffect(() => {
    if (panel === 'none' || !subPos || !focusSub.current) return;
    focusSub.current = false;
    focusFirst(subRef.current);
  }, [panel, subPos]);

  const openPanel = (next: Panel, withFocus: boolean) => {
    focusSub.current = withFocus;
    setPanel(next);
  };

  if (!req) return null;
  const target: FabricObject = req.target;
  const multiple = target instanceof ActiveSelection;
  const locked = !multiple && Boolean(oyn(target).locked);
  const current = multiple ? undefined : editor.kindOf(target);
  const replaceHint = multiple ? t('element.replaceOne') : locked ? t('element.replaceUnlock') : undefined;

  const finish = () => {
    close();
    (restoreFocus.current as HTMLElement | null)?.focus?.();
  };

  const run = (fn: () => unknown) => () => {
    finish();
    void Promise.resolve()
      .then(fn)
      .catch((err: unknown) => toast((err as Error).message, 'error'));
  };

  const replace = (kind: ElementKind) => {
    if (kind === 'symbol') {
      openPanel('symbols', true);
      return;
    }
    const doReplace = async () => {
      if (kind === 'image') {
        const dataUrl = await pickImage();
        if (!dataUrl) return;
        await editor.replace(target, 'image', { dataUrl });
      } else {
        await editor.replace(target, kind);
      }
    };
    run(doReplace)();
  };

  // Keys in the menu must not reach the editor shortcuts, for example Delete or the arrow keys.
  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') e.stopPropagation();
    if (moveFocus(e)) return;
    if (e.key === 'ArrowRight' && replaceRef.current?.contains(document.activeElement) && !replaceHint) {
      openPanel('replace', true);
      e.preventDefault();
    }
  };

  const onSubKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') e.stopPropagation();
    // In the search field, the arrow keys move the text cursor. Only the down arrow goes to the symbols.
    if (e.target instanceof HTMLInputElement) {
      if (e.key === 'ArrowDown') {
        e.currentTarget.querySelector<HTMLButtonElement>('.ctx-icons > [role=menuitem]')?.focus();
        e.preventDefault();
      }
      return;
    }
    if (moveFocus(e)) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (panel === 'symbols') openPanel('replace', true);
      else {
        setPanel('none');
        focusFirst(replaceRef.current);
      }
    }
  };

  let sub: ReactNode = null;
  if (panel === 'replace') {
    sub = REPLACE_ITEMS.map((it) => (
      <Item
        key={it.kind}
        icon={it.icon}
        label={t(it.label)}
        disabled={it.kind === current}
        title={it.kind === current ? t('element.sameType') : undefined}
        sub={it.kind === 'symbol'}
        onClick={() => replace(it.kind)}
      />
    ));
  } else if (panel === 'symbols') {
    sub = (
      <>
        <Item icon={ArrowLeft} label={t('element.back')} onClick={() => openPanel('replace', true)} />
        <div className="ctx-sep" />
        <input
          type="search"
          className="ctx-search"
          placeholder={t('element.searchSymbols')}
          aria-label={t('element.searchSymbols')}
          value={symbolQuery}
          onChange={(e) => setSymbolQuery(e.target.value)}
        />
        <div className="ctx-icons">
          {searchIcons(symbolQuery).map(({ name, Icon }) => (
            <button key={name} type="button" role="menuitem" title={name} aria-label={name} onClick={run(() => editor.replace(target, 'symbol', { svg: iconSvg(Icon), name }))}>
              <Icon size={17} />
            </button>
          ))}
        </div>
      </>
    );
  }

  return createPortal(
    <>
      <div
        ref={menuRef}
        className="ctx-menu"
        role="menu"
        aria-label={t('element.menu')}
        style={pos ? { left: pos.left, top: pos.top } : { left: req.x, top: req.y, visibility: 'hidden' }}
        onKeyDown={onMenuKey}
        onContextMenu={(e) => e.preventDefault()}
      >
        {current === 'image' && (
          <Item
            icon={ImageUp}
            label={t('element.replaceImage')}
            disabled={locked}
            title={locked ? t('element.replaceUnlock') : undefined}
            onClick={run(() => replaceImageFromFile(target))}
            onHover={() => setPanel('none')}
            onFocus={() => setPanel('none')}
          />
        )}
        <div ref={replaceRef} className="ctx-row">
          <Item
            icon={Replace}
            label={t('element.replaceWith')}
            sub
            expanded={panel !== 'none'}
            disabled={Boolean(replaceHint)}
            title={replaceHint}
            onClick={() => openPanel(panel === 'none' ? 'replace' : 'none', true)}
            onHover={() => !replaceHint && panel === 'none' && openPanel('replace', false)}
          />
        </div>
        <div className="ctx-sep" />
        <Item icon={Copy} label={t('element.duplicate')} keys="Ctrl+D" onClick={run(() => editor.duplicate())} onHover={() => setPanel('none')} onFocus={() => setPanel('none')} />
        {!multiple && <Item icon={ArrowUpToLine} label={t('element.toFront')} onClick={run(() => editor.layer('front'))} onHover={() => setPanel('none')} onFocus={() => setPanel('none')} />}
        {!multiple && <Item icon={ArrowDownToLine} label={t('element.toBack')} onClick={run(() => editor.layer('back'))} onHover={() => setPanel('none')} onFocus={() => setPanel('none')} />}
        {!multiple && <Item icon={locked ? Unlock : Lock} label={locked ? t('element.unlock') : t('element.lock')} onClick={run(() => editor.toggleLock())} onHover={() => setPanel('none')} onFocus={() => setPanel('none')} />}
        <div className="ctx-sep" />
        <Item icon={Trash2} label={t('element.delete')} keys="Del" danger disabled={locked} onClick={run(() => editor.deleteSelection())} onHover={() => setPanel('none')} onFocus={() => setPanel('none')} />
      </div>
      {panel !== 'none' && (
        <div
          ref={subRef}
          className={`ctx-menu ctx-sub${panel === 'symbols' ? ' wide' : ''}`}
          role="menu"
          aria-label={panel === 'symbols' ? t('element.symbols') : t('element.replaceWith')}
          style={subPos ? { left: subPos.left, top: subPos.top } : { left: 0, top: 0, visibility: 'hidden' }}
          onKeyDown={onSubKey}
          onContextMenu={(e) => e.preventDefault()}
        >
          {sub}
        </div>
      )}
    </>,
    document.body,
  );
}
