// The small update window that shows at start-up, like Discord and Steam:
// checking, download progress, then installing.

import { formatMegabytes, formatSpeed } from '../../main/updateRules';
import type { UpdateStatus } from '../../main/preload';

interface UpdaterApi {
  onStatus(cb: (status: UpdateStatus) => void): () => void;
  ready(): void;
  skip(): void;
}

const api = (window as unknown as { oynUpdater?: UpdaterApi }).oynUpdater;
const statusEl = document.getElementById('status')!;
const detailEl = document.getElementById('detail')!;
const fill = document.getElementById('fill')!;
const bar = fill.parentElement!;
const skip = document.getElementById('skip') as HTMLButtonElement;

function progress(percent: number | undefined): void {
  if (percent === undefined) {
    fill.classList.add('indeterminate');
    fill.style.width = '';
    bar.removeAttribute('aria-valuenow');
  } else {
    fill.classList.remove('indeterminate');
    fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    bar.setAttribute('aria-valuenow', String(percent));
  }
}

function render(s: UpdateStatus): void {
  const version = s.version ? `version ${s.version}` : 'the update';
  switch (s.state) {
    case 'downloading': {
      const pct = s.percent ?? 0;
      statusEl.textContent = `Downloading ${version}…`;
      progress(pct);
      const parts = [`${pct}%`];
      if (s.total) parts.push(`${formatMegabytes(s.transferred ?? 0)} of ${formatMegabytes(s.total)}`);
      if (s.bytesPerSecond) parts.push(formatSpeed(s.bytesPerSecond));
      detailEl.textContent = parts.join(' · ');
      skip.hidden = false;
      break;
    }
    case 'ready':
      statusEl.textContent = `Installing ${version}…`;
      progress(undefined);
      detailEl.textContent = 'OwnYourNiimbot opens again when the update is installed.';
      skip.hidden = true;
      break;
    case 'none':
      statusEl.textContent = 'OwnYourNiimbot is up to date';
      progress(100);
      detailEl.textContent = 'Starting…';
      skip.hidden = true;
      break;
    case 'error':
      statusEl.textContent = 'Could not check for updates';
      progress(100);
      detailEl.textContent = 'Starting…';
      skip.hidden = true;
      break;
    default:
      statusEl.textContent = 'Checking for updates…';
      progress(undefined);
      detailEl.textContent = ' ';
      skip.hidden = true;
  }
}

skip.addEventListener('click', () => {
  skip.disabled = true;
  skip.textContent = 'Starting…';
  api?.skip();
});

if (api) {
  api.onStatus(render);
  api.ready();
} else if (import.meta.env.DEV) {
  // Development preview in a browser: a page message sets the status.
  window.addEventListener('message', (e: MessageEvent<{ oynUpdaterStatus?: UpdateStatus }>) => {
    if (e.data?.oynUpdaterStatus) render(e.data.oynUpdaterStatus);
  });
}
