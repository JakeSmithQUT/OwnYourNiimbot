import { useEffect, useState } from 'react';
import { ExternalLink, FolderOpen } from 'lucide-react';
import { api } from '../api';
import { appStore, updateSettings, type Settings } from '../state/app';
import { MODELS, PRINT_VARIANTS, type PrintVariant } from '../../printer/models';
import { Check, Field, Segmented } from '../components/ui';

export function SettingsView() {
  const { settings } = appStore.use();
  const [info, setInfo] = useState<{ version: string; platform: string; arch: string; electron: string; chrome: string }>();

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
      </div>

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
        <button className="btn" onClick={() => void api.app.openExternal('https://github.com/JakeSmithQUT/OwnYourNiimbot')}>
          <ExternalLink size={15} /> Project page
        </button>
      </div>
    </div>
  );
}
