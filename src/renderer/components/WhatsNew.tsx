import { Sparkles } from 'lucide-react';
import { releasesFor, type Release } from '../../i18n/releases';
import { api } from '../api';
import { t, useLanguage } from '../i18n';
import { updateStore } from './Updates';
import { Modal } from './ui';

/** The date of a release in the language of the app, for example 22 Nov 2026. */
function releaseDate(date: string, language: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  try {
    return new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(d);
  } catch {
    return date;
  }
}

function ReleaseNotes(props: { release: Release; language: string }) {
  const { release } = props;
  return (
    <section className="release">
      <h3>
        {t('updates.versionHeading', { version: release.version })}
        <span className="muted">{releaseDate(release.date, props.language)}</span>
      </h3>
      <ul>
        {release.notes.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </section>
  );
}

/**
 * What's new in the app, in the app: the notes of the versions since the last
 * update, or of this version, and the earlier versions under them.
 */
export function WhatsNew() {
  const { whatsNew, status } = updateStore.use();
  const language = useLanguage();
  if (!whatsNew) return null;
  const close = () => updateStore.set({ whatsNew: false, updatedSeen: true });
  const current = status?.current ?? '';
  const { recent, earlier } = releasesFor(current, status?.updatedFrom);
  return (
    <Modal
      title={t('updates.whatsNew')}
      icon={<Sparkles size={18} />}
      onClose={close}
      footer={
        <>
          {status?.mode !== 'none' && current && (
            <button className="btn ghost" onClick={() => void api.updates.openRelease('current')}>
              {t('updates.openReleasePage')}
            </button>
          )}
          <button className="btn primary" onClick={close}>
            {t('common.close')}
          </button>
        </>
      }
    >
      <div className="changelog">
        {status?.updatedFrom && <p className="muted since">{t('updates.sinceVersion', { version: status.updatedFrom })}</p>}
        {recent.map((r) => (
          <ReleaseNotes key={r.version} release={r} language={language} />
        ))}
        {earlier.length > 0 && (
          <details>
            <summary>{t('updates.earlier')}</summary>
            {earlier.map((r) => (
              <ReleaseNotes key={r.version} release={r} language={language} />
            ))}
          </details>
        )}
      </div>
    </Modal>
  );
}
