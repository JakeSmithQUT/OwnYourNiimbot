import { useEffect } from 'react';
import {
  BatteryMedium,
  Bluetooth,
  CircleAlert,
  CircleCheck,
  Database,
  FolderOpen,
  History,
  Info,
  LayoutTemplate,
  PenTool,
  Printer as PrinterIcon,
  Save,
  Settings as SettingsIcon,
  Tag,
  Usb,
} from 'lucide-react';
import { appStore, loadSettings, markDirty, saveTemplate, type View } from './state/app';
import { usePrinter } from './state/printer';
import { editor } from './editor/EditorController';
import { batteryPercent } from '../printer/client';
import { DesignView } from './views/DesignView';
import { TemplatesView } from './views/TemplatesView';
import { LibraryView } from './views/LibraryView';
import { DataView } from './views/DataView';
import { PrinterView } from './views/PrinterView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { PrintDialog } from './components/PrintDialog';
import { startRollTracking } from './state/roll';
import { startMcpHandlers } from './mcp/handlers';
import { ConnectDialog } from './components/ConnectDialog';
import { startUpdateTracking, UpdateBanner, UpdatePill } from './components/Updates';

const NAV: { view: View; label: string; icon: typeof PenTool }[] = [
  { view: 'design', label: 'Design', icon: PenTool },
  { view: 'library', label: 'Templates', icon: LayoutTemplate },
  { view: 'templates', label: 'Labels', icon: FolderOpen },
  { view: 'data', label: 'Data', icon: Database },
  { view: 'printer', label: 'Printer', icon: PrinterIcon },
  { view: 'history', label: 'History', icon: History },
];

export function App() {
  const state = appStore.use();
  const p = usePrinter();

  useEffect(() => {
    void loadSettings();
    startRollTracking();
    startMcpHandlers();
    startUpdateTracking();
    return editor.onContentChange(() => markDirty());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = state.settings.theme === 'dark' || (state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.settings.theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveTemplate();
      } else if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        appStore.set({ printOpen: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const battery = batteryPercent(p.info.batteryLevel);
  const modelName = p.info.model?.name;

  return (
    <div className="app">
      <nav className="rail">
        <div className="logo" title="OwnYourNiimbot">
          <Tag size={22} />
        </div>
        {NAV.map((n) => (
          <button key={n.view} className={state.view === n.view ? 'active' : ''} onClick={() => appStore.set({ view: n.view })}>
            <n.icon size={20} />
            {n.label}
          </button>
        ))}
        <div className="spacer" />
        <button className={state.view === 'settings' ? 'active' : ''} onClick={() => appStore.set({ view: 'settings' })}>
          <SettingsIcon size={20} />
          Settings
        </button>
      </nav>

      <div className="main">
        <header className="topbar">
          {state.view === 'design' ? (
            <input
              className="title-input"
              value={state.template.name}
              onChange={(e) => appStore.set({ template: { ...state.template, name: e.target.value }, dirty: true })}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Label name"
            />
          ) : (
            <h1>{state.view === 'templates' ? 'Labels' : NAV.find((n) => n.view === state.view)?.label ?? 'Settings'}</h1>
          )}
          {state.view === 'design' && state.dirty && <span className="muted">Not saved</span>}
          <div className="grow" />
          {state.view === 'design' && (
            <button className="btn" onClick={() => void saveTemplate()} title="Save (Ctrl+S)">
              <Save size={16} /> Save
            </button>
          )}
          <UpdatePill />
          <button className="printer-pill" onClick={() => (p.connected ? appStore.set({ view: 'printer' }) : appStore.set({ connectOpen: true }))}>
            <span className={`dot${p.connected ? ' on' : ''}`} />
            {p.connected ? (
              <>
                {p.transport?.kind === 'bluetooth' ? <Bluetooth size={14} /> : <Usb size={14} />}
                <span>{modelName ?? p.transport?.name ?? 'Printer'}</span>
                {battery !== undefined && (
                  <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <BatteryMedium size={14} /> {battery}%
                  </span>
                )}
              </>
            ) : (
              <span>Connect printer</span>
            )}
          </button>
          <button className="btn primary" onClick={() => appStore.set({ printOpen: true })} title="Print (Ctrl+P)">
            <PrinterIcon size={16} /> Print
          </button>
        </header>

        <UpdateBanner />

        <section className="content">
          {state.view === 'design' && <DesignView />}
          {state.view === 'library' && <LibraryView />}
          {state.view === 'templates' && <TemplatesView />}
          {state.view === 'data' && <DataView />}
          {state.view === 'printer' && <PrinterView />}
          {state.view === 'history' && <HistoryView />}
          {state.view === 'settings' && <SettingsView />}
        </section>
      </div>

      {state.printOpen && <PrintDialog onClose={() => appStore.set({ printOpen: false })} />}
      {state.connectOpen && <ConnectDialog onClose={() => appStore.set({ connectOpen: false })} />}
      {state.toast && (
        <div className={`toast ${state.toast.kind}`}>
          {state.toast.kind === 'error' ? <CircleAlert size={16} /> : state.toast.kind === 'success' ? <CircleCheck size={16} /> : <Info size={16} />}
          {state.toast.text}
        </div>
      )}
    </div>
  );
}
