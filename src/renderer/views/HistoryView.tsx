import { useEffect, useState } from 'react';
import { FolderOpen, Printer as PrinterIcon, Trash2 } from 'lucide-react';
import { api } from '../api';
import { appStore, confirmDiscard, openTemplate } from '../state/app';
import type { HistoryEntry } from '../components/PrintDialog';

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
    await openTemplate({ ...h.template, thumbnail: h.thumbnail });
    if (print) appStore.set({ printOpen: true });
  };

  const remove = async (h: HistoryEntry) => {
    await api.store.delete('history', h.id);
    await reload();
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all print history? You cannot undo this.')) return;
    await Promise.all(items.map((h) => api.store.delete('history', h.id)));
    await reload();
  };

  return (
    <div className="page">
      <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2>Print history</h2>
          <p className="lead" style={{ margin: 0 }}>
            Each print job keeps a copy of the label, so you can print it again.
          </p>
        </div>
        {items.length > 0 && (
          <button className="btn danger" onClick={() => void clearAll()}>
            <Trash2 size={15} /> Clear history
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="card empty">Nothing has been printed yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {items.map((h) => (
            <div key={h.id} className="history-row">
              {h.thumbnail ? <img src={h.thumbnail} alt="" /> : <div style={{ width: 72 }} />}
              <div className="info">
                <strong>{h.name}</strong>
                <span className="muted">
                  {new Date(h.time).toLocaleString()} · {h.labels} label{h.labels === 1 ? '' : 's'} · {h.modelName}
                </span>
              </div>
              <button className="btn small" onClick={() => void open(h, false)}>
                <FolderOpen size={14} /> Open
              </button>
              <button className="btn small" onClick={() => void open(h, true)}>
                <PrinterIcon size={14} /> Print again
              </button>
              <button className="btn small icon ghost danger" title="Delete" onClick={() => void remove(h)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
