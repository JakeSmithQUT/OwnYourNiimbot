import { createRoot } from 'react-dom/client';
import { App } from './App';
import { loadBundledFonts } from './editor/bundledFonts';
import './styles.css';

// Load the bundled fonts before the first label is drawn, so text sizes are
// measured with the real font. Start anyway after 4 seconds.
const timeout = new Promise<void>((resolve) => setTimeout(resolve, 4000));
void Promise.race([loadBundledFonts(), timeout]).then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
