import { CircleCheck, Download, RefreshCw, RotateCw, X } from 'lucide-react';
import { formatMegabytes, formatSpeed } from '../../main/updateRules';
import type { UpdateStatus } from '../../main/preload';
import { api } from '../api';
import { appStore, saveTemplate, toast } from '../state/app';
import { createStore } from '../state/store';
import { Check } from './ui';

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
  if (s.total) parts.push(`${formatMegabytes(s.transferred ?? 0)} of ${formatMegabytes(s.total)}`);
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
        <span>OwnYourNiimbot is updated to version {status.current}.</span>
        <button className="btn small" onClick={() => void api.updates.openRelease('current')}>
          What's new
        </button>
        <button className="btn small ghost" onClick={() => updateStore.set({ updatedSeen: true })} aria-label="Close">
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
          Downloading version {status.version}. {progressText(status)}
          <span className="update-progress" aria-hidden="true">
            <span style={{ width: `${status.percent ?? 0}%` }} />
          </span>
        </span>
        <button className="btn small ghost" onClick={close}>
          Hide
        </button>
      </div>
    );
  }
  if (status.state === 'ready') {
    return (
      <div className="update-banner" role="status">
        <RotateCw size={16} />
        <span>
          Version {status.version} is ready to install. The app restarts to install it{dirty ? ', after it saves this label' : ''}.
        </span>
        <button className="btn small primary" onClick={() => void restartAndInstall()}>
          {dirty ? 'Save and restart' : 'Restart now'}
        </button>
        <button className="btn small ghost" onClick={close}>
          Later
        </button>
      </div>
    );
  }
  if (status.state === 'available') {
    return (
      <div className="update-banner" role="status">
        <Download size={16} />
        <span>Version {status.version} is available. This version of the app cannot install it, so download it from the release page.</span>
        <button className="btn small primary" onClick={() => void api.updates.openRelease('new')}>
          Open release page
        </button>
        <button className="btn small ghost" onClick={close} aria-label="Close">
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
      title={`Version ${status.version} is ready. ${dirty ? 'The app saves this label, then restarts' : 'The app restarts'} to install it.`}
    >
      <RotateCw size={14} /> Restart to update
    </button>
  );
}

function describe(s: UpdateStatus): string {
  switch (s.state) {
    case 'checking':
      return 'Checking for updates…';
    case 'none':
      return `Version ${s.current} is the latest version.`;
    case 'available':
      return `Version ${s.version} is available. Download it from the release page.`;
    case 'downloading':
      return `Downloading version ${s.version}… ${progressText(s)}`;
    case 'ready':
      return `Version ${s.version} is ready. Restart the app to install it.`;
    case 'error':
      return s.message ?? 'The app could not check for updates.';
    default:
      return `Version ${s.current}.`;
  }
}

/** The Updates card on the Settings page. */
export function UpdateSettings() {
  const { status } = updateStore.use();
  if (!status) return null;
  const busy = status.state === 'checking' || status.state === 'downloading';
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>Updates</h3>
      {status.mode === 'none' ? (
        <p className="muted" style={{ marginTop: 0 }}>
          The installed app checks for updates. This development build does not.
        </p>
      ) : (
        <>
          <Check checked={status.checkOnLaunch} onChange={(v) => void api.updates.setCheckOnLaunch(v).then((s) => updateStore.set({ status: s }))}>
            Check for updates automatically
          </Check>
          <p className="muted">
            The app asks the GitHub releases of this project for the latest version. GitHub gets the app version and the IP address of this computer. No labels or
            other data are sent.{' '}
            {status.mode === 'install'
              ? 'The app checks when it starts and every 6 hours while it is open. It downloads an update, checks it, and installs it when the app restarts.'
              : 'The app checks when it starts and every 6 hours while it is open. This version of the app cannot install updates itself. It shows a link to the release page.'}
          </p>
          <p>{describe(status)}</p>
          <div className="btn-row">
            <button className="btn" disabled={busy} onClick={() => void api.updates.check().then((s) => updateStore.set({ status: s }))}>
              <RefreshCw size={15} /> Check now
            </button>
            {status.state === 'ready' && (
              <button className="btn primary" onClick={() => void restartAndInstall()}>
                <RotateCw size={15} /> Restart and install
              </button>
            )}
            {status.state === 'available' && (
              <button className="btn primary" onClick={() => void api.updates.openRelease('new')}>
                <Download size={15} /> Open release page
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
