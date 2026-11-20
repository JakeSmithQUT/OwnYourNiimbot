import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { LANGUAGES, shortCode } from '../../i18n/languages';
import { chooseLanguage } from '../state/app';
import { t, useLanguage } from '../i18n';

/**
 * A small language button at the bottom of the side bar, so that a user who
 * does not read English can find it. The list shows each language in its own
 * language.
 */
export function LanguageMenu() {
  const language = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lang" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen(!open)} title={t('lang.choose')} aria-label={t('lang.choose')} aria-expanded={open}>
        <Globe size={15} />
        {shortCode(language)}
      </button>
      {open && (
        <div className="lang-menu" role="menu" aria-label={t('lang.title')}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              role="menuitemradio"
              aria-checked={l.code === language}
              className={l.code === language ? 'active' : ''}
              lang={l.code}
              title={l.english}
              onClick={() => {
                setOpen(false);
                if (l.code !== language) void chooseLanguage(l.code);
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
