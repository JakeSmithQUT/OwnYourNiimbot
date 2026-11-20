// The small update window that shows at start-up, like Discord and Steam:
// checking, download progress, then installing.
//
// This page does not use React, so it loads its texts here and not through
// src/renderer/i18n.tsx. The main process gives the language in the page
// address, for example updater.html?lang=de.

import { formatMegabytes, formatSpeed } from '../../main/updateRules';
import type { UpdateStatus } from '../../main/preload';
import { createTranslator, type Catalog, type Translator } from '../../i18n/translate';
import { checkLanguage, DEFAULT_LANGUAGE } from '../../i18n/languages';

interface UpdaterApi {
  onStatus(cb: (status: UpdateStatus) => void): () => void;
  ready(): void;
  skip(): void;
}

const loaders = import.meta.glob<Catalog>('../../i18n/locales/*.json', { import: 'default' });

const api = (window as unknown as { oynUpdater?: UpdaterApi }).oynUpdater;
const statusEl = document.getElementById('status')!;
const detailEl = document.getElementById('detail')!;
const fill = document.getElementById('fill')!;
const bar = fill.parentElement!;
const skip = document.getElementById('skip') as HTMLButtonElement;

let i18n: Translator = createTranslator(DEFAULT_LANGUAGE, {});

/** Loads the language from the page address. An unknown code loads English. */
async function loadLanguage(): Promise<void> {
  const language = checkLanguage(new URLSearchParams(window.location.search).get('lang'));
  let catalog: Catalog = {};
  if (language !== DEFAULT_LANGUAGE) {
    const load = loaders[`../../i18n/locales/${language}.json`];
    if (load) catalog = await load().catch(() => ({}));
  }
  i18n = createTranslator(language, catalog);
  document.documentElement.lang = language;
}

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
  const { t } = i18n;
  switch (s.state) {
    case 'downloading': {
      const pct = s.percent ?? 0;
      statusEl.textContent = s.version ? t('updater.downloadingVersion', { version: s.version }) : t('updater.downloadingUpdate');
      progress(pct);
      const parts = [`${pct}%`];
      if (s.total) parts.push(t('updates.progressOf', { done: formatMegabytes(s.transferred ?? 0), total: formatMegabytes(s.total) }));
      if (s.bytesPerSecond) parts.push(formatSpeed(s.bytesPerSecond));
      detailEl.textContent = parts.join(' · ');
      skip.hidden = false;
      break;
    }
    case 'ready':
      statusEl.textContent = s.version ? t('updater.installingVersion', { version: s.version }) : t('updater.installingUpdate');
      progress(undefined);
      detailEl.textContent = t('updater.opensAgain');
      skip.hidden = true;
      break;
    case 'none':
      statusEl.textContent = t('updater.upToDate');
      progress(100);
      detailEl.textContent = t('updater.starting');
      skip.hidden = true;
      break;
    case 'error':
      statusEl.textContent = t('updater.checkFailed');
      progress(100);
      detailEl.textContent = t('updater.starting');
      skip.hidden = true;
      break;
    default:
      statusEl.textContent = t('updater.checking');
      progress(undefined);
      detailEl.textContent = ' ';
      skip.hidden = true;
  }
}

skip.addEventListener('click', () => {
  skip.disabled = true;
  skip.textContent = i18n.t('updater.starting');
  api?.skip();
});

// The texts of the page are empty in the HTML. They show after the language loads.
void loadLanguage().then(() => {
  statusEl.textContent = i18n.t('updater.checking');
  skip.textContent = i18n.t('updater.skip');
  if (api) {
    api.onStatus(render);
    api.ready();
  } else if (import.meta.env.DEV) {
    // Development preview in a browser: a page message sets the status.
    window.addEventListener('message', (e: MessageEvent<{ oynUpdaterStatus?: UpdateStatus }>) => {
      if (e.data?.oynUpdaterStatus) render(e.data.oynUpdaterStatus);
    });
  }
});
