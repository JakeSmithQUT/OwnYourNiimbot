import { CircleCheck, Download, RefreshCw, RotateCw, X } from 'lucide-react';
import { formatMegabytes, formatSpeed } from '../../main/updateRules';
import type { UpdateStatus } from '../../main/preload';
import { api } from '../api';
import { appStore, saveTemplate, toast } from '../state/app';
import { createStore } from '../state/store';
import { Check } from './ui';
import { t } from '../i18n';

export const updateStore = createStore<{ status?: UpdateStatus; dismissed?: string; updatedSeen?: boolean }>({});

let started = false;

/** Follows the update status from the main process. Call one time at start-up. */
export function startUpdateTracking(): void {
  if (started) return;
  started = true;
  api.updates.onStatus((status) => updateStore.set({ status }));
  void api.updates.getStatus().then((status) => updateStore.set({ status }));
}

/** Saves the open label if it has changes, then restarts the app to install the update. */
async function restartAndInstall(): Promise<void> {
  try {
    if (appStore.get().dirty) await saveTemplate();
    await api.updates.install();
  } catch (err) {
    toast((err as Error).message, 'error');
  }
}

/** Download progress as text, for example "42% · 52 of 125 MB · 6.1 MB/s". */
export function progressText(s: UpdateStatus): string {
  const parts = [`${s.percent ?? 0}%`];
  if (s.total) parts.push(t('updates.progressOf', { done: formatMegabytes(s.transferred ?? 0), total: formatMegabytes(s.total) }));
  if (s.bytesPerSecond) parts.push(formatSpeed(s.bytesPerSecond));
  return parts.join(' · ');
}

/**
 * A bar under the top bar: the app was updated, a new version downloads, is
 * ready to install, or is available to download.
 */
export function UpdateBanner() {
  const { status, dismissed, updatedSeen } = updateStore.use();
  const { dirty } = appStore.use();
  if (status?.updatedFrom && !updatedSeen && status.state !== 'ready') {
    return (
      <div className="update-banner" role="status">
        <CircleCheck size={16} />
        <span>{t('updates.updatedTo', { version: status.current })}</span>
        <button className="btn small" onClick={() => void api.updates.openRelease('current')}>
          {t('updates.whatsNew')}
        </button>
        <button className="btn small ghost" onClick={() => updateStore.set({ updatedSeen: true })} aria-label={t('common.close')}>
          <X size={14} />
        </button>
      </div>
    );
  }
  if (!status?.version || dismissed === status.version) return null;
  const close = () => updateStore.set({ dismissed: status.version });
  if (status.state === 'downloading') {
    return (
      <div className="update-banner" role="status">
        <Download size={16} />
        <span>
          {t('updates.downloadingBanner', { version: status.version, progress: progressText(status) })}
          <span className="update-progress" aria-hidden="true">
            <span style={{ width: `${status.percent ?? 0}%` }} />
          </span>
        </span>
        <button className="btn small ghost" onClick={close}>
          {t('common.hide')}
        </button>
      </div>
    );
  }
  if (status.state === 'ready') {
    return (
      <div className="update-banner" role="status">
        <RotateCw size={16} />
        <span>{t(dirty ? 'updates.readyToInstallSave' : 'updates.readyToInstall', { version: status.version })}</span>
        <button className="btn small primary" onClick={() => void restartAndInstall()}>
          {dirty ? t('updates.saveAndRestart') : t('updates.restartNow')}
        </button>
        <button className="btn small ghost" onClick={close}>
          {t('updates.later')}
        </button>
      </div>
    );
  }
  if (status.state === 'available') {
    return (
      <div className="update-banner" role="status">
        <Download size={16} />
        <span>{t('updates.availableBanner', { version: status.version })}</span>
        <button className="btn small primary" onClick={() => void api.updates.openRelease('new')}>
          {t('updates.openReleasePage')}
        </button>
        <button className="btn small ghost" onClick={close} aria-label={t('common.close')}>
          <X size={14} />
        </button>
      </div>
    );
  }
  return null;
}

/** A button in the top bar while an update waits to install, like the download arrow in Discord. */
export function UpdatePill() {
  const { status } = updateStore.use();
  const { dirty } = appStore.use();
  if (status?.state !== 'ready' || status.mode !== 'install') return null;
  return (
    <button
      className="update-pill"
      onClick={() => void restartAndInstall()}
      title={t(dirty ? 'updates.pillTitleSave' : 'updates.pillTitle', { version: status.version ?? '' })}
    >
      <RotateCw size={14} /> {t('updates.restartToUpdate')}
    </button>
  );
}

function describe(s: UpdateStatus): string {
  switch (s.state) {
    case 'checking':
      return t('updates.checking');
    case 'none':
      return t('updates.latest', { version: s.current });
    case 'available':
      return t('updates.available', { version: s.version ?? '' });
    case 'downloading':
      return t('updates.downloading', { version: s.version ?? '', progress: progressText(s) });
    case 'ready':
      return t('updates.ready', { version: s.version ?? '' });
    case 'error':
      return s.message ?? t('updates.checkFailed');
    default:
      return t('updates.current', { version: s.current });
  }
}

/** The Updates card on the Settings page. */
export function UpdateSettings() {
  const { status } = updateStore.use();
  if (!status) return null;
  const busy = status.state === 'checking' || status.state === 'downloading';
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>{t('updates.title')}</h3>
      {status.mode === 'none' ? (
        <p className="muted" style={{ marginTop: 0 }}>
          {t('updates.devBuild')}
        </p>
      ) : (
        <>
          <Check checked={status.checkOnLaunch} onChange={(v) => void api.updates.setCheckOnLaunch(v).then((s) => updateStore.set({ status: s }))}>
            {t('updates.checkAutomatically')}
          </Check>
          <p className="muted">
            {t('updates.privacy')} {status.mode === 'install' ? t('updates.scheduleInstall') : t('updates.scheduleNotify')}
          </p>
          <p>{describe(status)}</p>
          <div className="btn-row">
            <button className="btn" disabled={busy} onClick={() => void api.updates.check().then((s) => updateStore.set({ status: s }))}>
              <RefreshCw size={15} /> {t('updates.checkNow')}
            </button>
            {status.state === 'ready' && (
              <button className="btn primary" onClick={() => void restartAndInstall()}>
                <RotateCw size={15} /> {t('updates.restartAndInstall')}
              </button>
            )}
            {status.state === 'available' && (
              <button className="btn primary" onClick={() => void api.updates.openRelease('new')}>
                <Download size={15} /> {t('updates.openReleasePage')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
