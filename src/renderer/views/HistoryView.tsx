import { useEffect, useState } from 'react';
import { FolderOpen, Printer as PrinterIcon, Trash2 } from 'lucide-react';
import { api } from '../api';
import { appStore, confirmDiscard, openTemplate } from '../state/app';
import type { HistoryEntry } from '../components/PrintDialog';
import { isPreview } from '../editor/validate';
import { t, tn } from '../i18n';

export function HistoryView() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  const reload = async () => {
    const list = await api.store.list<HistoryEntry>('history');
    setItems(list.sort((a, b) => b.time - a.time));
  };

  useEffect(() => {
    void reload();
  }, []);

  const open = async (h: HistoryEntry, print: boolean) => {
    if (!confirmDiscard()) return;
    const opened = await openTemplate({ ...h.template, thumbnail: h.thumbnail });
    if (opened && print) appStore.set({ printOpen: true });
  };

  const remove = async (h: HistoryEntry) => {
    await api.store.delete('history', h.id);
    await reload();
  };

  const clearAll = async () => {
    if (!window.confirm(t('history.confirmClear'))) return;
    await Promise.all(items.map((h) => api.store.delete('history', h.id)));
    await reload();
  };

  return (
    <div className="page">
      <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2>{t('history.title')}</h2>
          <p className="lead" style={{ margin: 0 }}>
            {t('history.lead')}
          </p>
        </div>
        {items.length > 0 && (
          <button className="btn danger" onClick={() => void clearAll()}>
            <Trash2 size={15} /> {t('history.clear')}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="card empty">{t('history.empty')}</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {items.map((h) => (
            <div key={h.id} className="history-row">
              {isPreview(h.thumbnail) ? <img src={h.thumbnail} alt="" /> : <div style={{ width: 72 }} />}
              <div className="info">
                <strong>{h.name}</strong>
                <span className="muted">
                  {new Date(h.time).toLocaleString()} · {tn('history.labels', h.labels)} · {h.modelName}
                </span>
              </div>
              <button className="btn small" onClick={() => void open(h, false)}>
                <FolderOpen size={14} /> {t('common.open')}
              </button>
              <button className="btn small" onClick={() => void open(h, true)}>
                <PrinterIcon size={14} /> {t('history.printAgain')}
              </button>
              <button className="btn small icon ghost danger" title={t('common.delete')} onClick={() => void remove(h)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
