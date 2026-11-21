import { createRoot } from 'react-dom/client';
import { App } from './App';
import { api } from './api';
import { setLanguage, t } from './i18n';
import { isLanguage } from '../i18n/languages';
import { appStore } from './state/app';
import { loadBundledFonts } from './editor/bundledFonts';
import './styles.css';

/**
 * Loads the language before the first render, so that no English text shows
 * first: the language that the user chose, else the language of the system.
 */
async function loadLanguage(): Promise<void> {
  const saved = await api.store.get<{ language?: string }>('settings', 'app').catch(() => null);
  const language = isLanguage(saved?.language) ? saved.language : await api.app.getLanguage().catch(() => undefined);
  const untitled = t('labels.untitled');
  await setLanguage(language);
  // The first empty label was made before the language loaded, so it has the English default name.
  // Change only that name, not the name of a label that the user opened in the meantime.
  const { template, dirty } = appStore.get();
  if (!template.id && !dirty && template.name === untitled) appStore.set({ template: { ...template, name: t('labels.untitled') } });
}

// Load the bundled fonts before the first label is drawn, so text sizes are
// measured with the real font. Start anyway after 4 seconds.
const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
void Promise.race([Promise.all([loadBundledFonts(), loadLanguage()]), timeout]).then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
