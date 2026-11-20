import { useEffect, useState } from 'react';
import { Bot, Copy, ExternalLink, FolderOpen, RefreshCw, ScrollText } from 'lucide-react';
import LICENCES from '../../../THIRD_PARTY_LICENSES.txt?raw';
import type { McpPublicConfig } from '../../main/preload';
import { toast } from '../state/app';
import { api } from '../api';
import { appStore, updateSettings, type Settings } from '../state/app';
import { MODELS, PRINT_VARIANTS, type PrintVariant } from '../../printer/models';
import { Check, Field, Modal, Segmented } from '../components/ui';

function CopyBox(props: { label: string; value: string; secret?: boolean }) {
  const [shown, setShown] = useState(!props.secret);
  return (
    <div className="field">
      <label>{props.label}</label>
      <div className="copy-box">
        <code>{shown ? props.value : '•'.repeat(24)}</code>
        {props.secret && (
          <button className="btn small ghost" onClick={() => setShown(!shown)}>
            {shown ? 'Hide' : 'Show'}
          </button>
        )}
        <button
          className="btn small"
          onClick={() => {
            void navigator.clipboard.writeText(props.value);
            toast('Copied', 'success');
          }}
        >
          <Copy size={13} /> Copy
        </button>
      </div>
    </div>
  );
}

/** Settings for the local MCP server that lets AI assistants make and print labels. */
function AssistantSettings() {
  const [cfg, setCfg] = useState<McpPublicConfig>();
  useEffect(() => {
    void api.mcp.getConfig().then(setCfg);
  }, []);
  if (!cfg) return null;
  const set = async (patch: { enabled?: boolean; confirmPrint?: boolean }) => {
    try {
      setCfg(await api.mcp.setConfig(patch));
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };
  const claudeCode = `claude mcp add --transport http ownyourniimbot ${cfg.url} --header "Authorization: Bearer ${cfg.token}"`;
  const desktopJson = JSON.stringify(
    { mcpServers: { ownyourniimbot: { command: cfg.command, args: [cfg.bridge, '--config', cfg.configFile], env: { ELECTRON_RUN_AS_NODE: '1' } } } },
    null,
    2,
  );
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>
        <Bot size={16} /> AI assistants (MCP)
      </h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Lets an AI assistant on this computer, for example Claude, make, preview and print labels through the Model Context Protocol. The connection is local only and needs the token below.
      </p>
      <Check checked={cfg.enabled} onChange={(enabled) => void set({ enabled })}>
        Allow AI assistants to use OwnYourNiimbot
      </Check>
      <Check checked={cfg.confirmPrint} onChange={(confirmPrint) => void set({ confirmPrint })}>
        Ask me before an assistant prints
      </Check>
      {cfg.enabled && (
        <>
          <p>
            <span className={`pill ${cfg.running ? 'ok' : 'warn'}`}>{cfg.running ? `Running on port ${cfg.port}` : 'Not running'}</span>
          </p>
          <CopyBox label="Address" value={cfg.url} />
          <CopyBox label="Token" value={cfg.token} secret />
          <div className="btn-row" style={{ marginBottom: 12 }}>
            <button
              className="btn small"
              onClick={() =>
                void api.mcp.newToken().then((c) => {
                  setCfg(c);
                  toast('New token made. Update the token in your assistant.', 'info');
                })
              }
            >
              <RefreshCw size={13} /> Make a new token
            </button>
          </div>
          <CopyBox label="Claude Code command" value={claudeCode} secret />
          <CopyBox label="Claude Desktop (claude_desktop_config.json)" value={desktopJson} />
          {!cfg.packaged && <p className="muted">The Claude Desktop setting works with the installed app. In development, use the address and token.</p>}
        </>
      )}
    </div>
  );
}

export function SettingsView() {
  const { settings } = appStore.use();
  const [info, setInfo] = useState<{ version: string; platform: string; arch: string; electron: string; chrome: string }>();
  const [showLicences, setShowLicences] = useState(false);

  useEffect(() => {
    void api.app.info().then(setInfo);
  }, []);

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Appearance</h3>
        <Field label="Theme">
          <Segmented<Settings['theme']>
            value={settings.theme}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={(theme) => updateSettings({ theme })}
          />
        </Field>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Printing</h3>
        <Field label="Printer model when no printer is connected" hint="The design view uses this model for resolution and print width.">
          <select value={settings.modelName} onChange={(e) => updateSettings({ modelName: e.target.value })}>
            {MODELS.filter((m) => m.protocol === 'niimbot').map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.dpi} dpi, {m.printWidthMm.max} mm)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Command set" hint="Leave this on Auto. Change it only if a printer does not print with the automatic choice.">
          <select value={settings.variant} onChange={(e) => updateSettings({ variant: e.target.value as 'auto' | PrintVariant })}>
            <option value="auto">Auto (by model)</option>
            {PRINT_VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}: {v.hint}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Black level ${settings.threshold}`} hint="Grey pixels darker than this level print black. Increase it to make thin or light content print darker.">
          <input type="range" min={40} max={220} value={settings.threshold} onChange={(e) => updateSettings({ threshold: Number(e.target.value) })} />
        </Field>
        <Check checked={settings.flip180} onChange={(flip180) => updateSettings({ flip180 })}>
          Turn every print 180°
        </Check>
        <Check checked={settings.autoLabelSize} onChange={(autoLabelSize) => updateSettings({ autoLabelSize })}>
          Give a new, empty label the size of the roll in the printer
        </Check>
      </div>

      <AssistantSettings />

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Data</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Labels, history and settings are stored in the app data folder on this computer. The app does not send data to any server.
        </p>
        <button className="btn" onClick={() => void api.app.openDataFolder()}>
          <FolderOpen size={15} /> Open data folder
        </button>
      </div>

      <div className="card">
        <h3>About</h3>
        <dl className="kv">
          <dt>Version</dt>
          <dd>{info?.version ?? '–'}</dd>
          <dt>Platform</dt>
          <dd>
            {info?.platform} {info?.arch}
          </dd>
          <dt>Electron</dt>
          <dd>{info?.electron}</dd>
        </dl>
        <p className="muted">
          OwnYourNiimbot is an independent project. It is not made, approved or supported by NIIMBOT. NIIMBOT is a trademark of its owner.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={() => void api.app.openExternal('https://github.com/JakeSmithQUT/OwnYourNiimbot')}>
            <ExternalLink size={15} /> Project page
          </button>
          <button className="btn" onClick={() => setShowLicences(true)}>
            <ScrollText size={15} /> Open-source licences
          </button>
        </div>
        {showLicences && (
          <Modal title="Open-source licences" wide onClose={() => setShowLicences(false)}>
            <pre className="licences">{LICENCES}</pre>
          </Modal>
        )}
      </div>
    </div>
  );
}
