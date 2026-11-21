import { useEffect, useState } from 'react';
import { Bot, Copy, ExternalLink, FolderOpen, RefreshCw, ScrollText } from 'lucide-react';
import LICENCES from '../../../THIRD_PARTY_LICENSES.txt?raw';
import type { McpPublicConfig } from '../../main/preload';
import { toast } from '../state/app';
import { api } from '../api';
import { appStore, updateSettings, type Settings } from '../state/app';
import { MODELS, PRINT_VARIANTS, type PrintVariant } from '../../printer/models';
import { Check, Field, Modal, Segmented } from '../components/ui';
import { UpdateSettings } from '../components/Updates';
import { t, useLanguage } from '../i18n';
import { LANGUAGES, type LanguageCode } from '../../i18n/languages';
import { chooseLanguage } from '../state/app';

/**
 * A value with a copy button. A secret value is hidden, and the app reads it
 * from the main process only when the user shows or copies it.
 */
function CopyBox(props: { label: string; value: string | (() => Promise<string>); secret?: boolean; hint?: string }) {
  const [shown, setShown] = useState<string | undefined>(props.secret ? undefined : (props.value as string));
  const read = async () => (typeof props.value === 'string' ? props.value : props.value());
  useEffect(() => {
    if (!props.secret) setShown(props.value as string);
  }, [props.value, props.secret]);
  return (
    <div className="field">
      <label>{props.label}</label>
      <div className="copy-box">
        <code>{shown ?? '•'.repeat(24)}</code>
        {props.secret && (
          <button className="btn small ghost" onClick={() => void (shown === undefined ? read().then(setShown) : setShown(undefined))}>
            {shown === undefined ? t('common.show') : t('common.hide')}
          </button>
        )}
        <button
          className="btn small"
          onClick={() =>
            void read()
              .then((v) => navigator.clipboard.writeText(v))
              .then(() => toast(t('common.copied'), 'success'))
          }
        >
          <Copy size={13} /> {t('common.copy')}
        </button>
      </div>
      {props.hint && <small className="muted">{props.hint}</small>}
    </div>
  );
}

const quote = (s: string) => `"${s}"`;

/** Settings for the local MCP server that lets AI assistants make and print labels. */
function AssistantSettings() {
  const [cfg, setCfg] = useState<McpPublicConfig>();
  // Changes when the user makes a new token, so that a token on the screen is hidden again.
  const [tokenVersion, setTokenVersion] = useState(0);
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
  // The bridge reads the token from the settings file, so these setups do not contain it.
  // No "--" and no option after the command: PowerShell removes a bare "--", and Command Prompt keeps quotes around "'--'".
  // With -e at the end, the same command works in PowerShell, Command Prompt and other shells.
  const claudeCodeBridge = `claude mcp add --scope user ownyourniimbot ${quote(cfg.command)} ${quote(cfg.bridge)} ${quote(cfg.configFile)} -e ELECTRON_RUN_AS_NODE=1`;
  const claudeCodeHttp = async () =>
    `claude mcp add --scope user --transport http ownyourniimbot ${cfg.url} --header "Authorization: Bearer ${await api.mcp.getToken()}"`;
  const desktopJson = JSON.stringify(
    { mcpServers: { ownyourniimbot: { command: cfg.command, args: [cfg.bridge, '--config', cfg.configFile], env: { ELECTRON_RUN_AS_NODE: '1' } } } },
    null,
    2,
  );
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>
        <Bot size={16} /> {t('settings.ai.title')}
      </h3>
      <p className="muted" style={{ marginTop: 0 }}>
        {t('settings.ai.intro')}
      </p>
      <Check checked={cfg.enabled} onChange={(enabled) => void set({ enabled })}>
        {t('settings.ai.allow')}
      </Check>
      <Check checked={cfg.confirmPrint} onChange={(confirmPrint) => void set({ confirmPrint })}>
        {t('settings.ai.confirmPrint')}
      </Check>
      {cfg.enabled && (
        <>
          <p>
            <span className={`pill ${cfg.running ? 'ok' : 'warn'}`}>{cfg.running ? t('settings.ai.running', { port: cfg.port ?? '' }) : t('common.notRunning')}</span>
          </p>
          <CopyBox label={t('settings.ai.address')} value={cfg.url} />
          <CopyBox key={`token-${tokenVersion}`} label={t('settings.ai.token')} value={() => api.mcp.getToken()} secret hint={t('settings.ai.tokenHint')} />
          <div className="btn-row" style={{ marginBottom: 12 }}>
            <button
              className="btn small"
              onClick={() =>
                void api.mcp.newToken().then((c) => {
                  setCfg(c);
                  setTokenVersion((v) => v + 1);
                  toast(t('settings.ai.newTokenDone'), 'info');
                })
              }
            >
              <RefreshCw size={13} /> {t('settings.ai.newToken')}
            </button>
          </div>
          {cfg.bridgeAvailable ? (
            <>
              <CopyBox label={t('settings.ai.claudeCode')} value={claudeCodeBridge} hint={t('settings.ai.claudeCodeHint')} />
              <CopyBox label={t('settings.ai.claudeDesktop')} value={desktopJson} />
              {!cfg.packaged && <p className="muted">{t('settings.ai.devBuild')}</p>}
            </>
          ) : (
            <>
              <CopyBox key={`http-${tokenVersion}`} label={t('settings.ai.claudeCode')} value={claudeCodeHttp} secret />
              <p className="muted">{t('settings.ai.portable')}</p>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function SettingsView() {
  const { settings } = appStore.use();
  const language = useLanguage();
  const [info, setInfo] = useState<{ version: string; platform: string; arch: string; electron: string; chrome: string }>();
  const [showLicences, setShowLicences] = useState(false);

  useEffect(() => {
    void api.app.info().then(setInfo);
  }, []);

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{t('settings.appearance')}</h3>
        <Field label={t('settings.language')} hint={t('settings.languageHint')}>
          <select value={language} onChange={(e) => void chooseLanguage(e.target.value as LanguageCode)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('settings.theme')}>
          <Segmented<Settings['theme']>
            value={settings.theme}
            options={[
              { value: 'system', label: t('settings.theme.system') },
              { value: 'light', label: t('settings.theme.light') },
              { value: 'dark', label: t('settings.theme.dark') },
            ]}
            onChange={(theme) => updateSettings({ theme })}
          />
        </Field>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{t('settings.printing')}</h3>
        <Field label={t('settings.model')} hint={t('settings.modelHint')}>
          <select value={settings.modelName} onChange={(e) => updateSettings({ modelName: e.target.value })}>
            {MODELS.filter((m) => m.protocol === 'niimbot').map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.dpi} dpi, {m.printWidthMm.max} mm)
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('settings.commandSet')} hint={t('settings.commandSetHint')}>
          <select value={settings.variant} onChange={(e) => updateSettings({ variant: e.target.value as 'auto' | PrintVariant })}>
            <option value="auto">{t('settings.commandSetAuto')}</option>
            {PRINT_VARIANTS.map((v) => (
              <option key={v.value} value={v.value}>
                {t(v.labelKey)}: {t(v.hintKey)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('settings.blackLevel', { level: settings.threshold })} hint={t('settings.blackLevelHint')}>
          <input type="range" min={40} max={220} value={settings.threshold} onChange={(e) => updateSettings({ threshold: Number(e.target.value) })} />
        </Field>
        <Check checked={settings.flip180} onChange={(flip180) => updateSettings({ flip180 })}>
          {t('settings.flip180')}
        </Check>
        <Check checked={settings.autoLabelSize} onChange={(autoLabelSize) => updateSettings({ autoLabelSize })}>
          {t('settings.autoLabelSize')}
        </Check>
      </div>

      <AssistantSettings />

      <UpdateSettings />

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>{t('settings.data')}</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {t('settings.dataText')}
        </p>
        <button className="btn" onClick={() => void api.app.openDataFolder()}>
          <FolderOpen size={15} /> {t('settings.openDataFolder')}
        </button>
      </div>

      <div className="card">
        <h3>{t('settings.about')}</h3>
        <dl className="kv">
          <dt>{t('settings.version')}</dt>
          <dd>{info?.version ?? '–'}</dd>
          <dt>{t('settings.platform')}</dt>
          <dd>
            {info?.platform} {info?.arch}
          </dd>
          <dt>Electron</dt>
          <dd>{info?.electron}</dd>
        </dl>
        <p className="muted">{t('settings.independent')}</p>
        <div className="btn-row">
          <button className="btn" onClick={() => void api.app.openExternal('https://github.com/JakeSmithQUT/OwnYourNiimbot')}>
            <ExternalLink size={15} /> {t('settings.projectPage')}
          </button>
          <button className="btn" onClick={() => setShowLicences(true)}>
            <ScrollText size={15} /> {t('settings.licences')}
          </button>
        </div>
        {showLicences && (
          <Modal title={t('settings.licences')} wide onClose={() => setShowLicences(false)}>
            <pre className="licences">{LICENCES}</pre>
          </Modal>
        )}
      </div>
    </div>
  );
}
