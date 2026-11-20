import { useState } from 'react';
import { ClipboardPaste, FileSpreadsheet, Trash2 } from 'lucide-react';
import readXlsxFile from 'read-excel-file';
import { api, base64ToBytes } from '../api';
import { appStore, toast } from '../state/app';
import type { Dataset } from '../editor/template';
import { checkXlsxSize, parseDelimited, toDataset } from '../dataImport';
import { t, tn } from '../i18n';

export async function loadDataFile(): Promise<void> {
  const file = await api.files.open({
    filters: [
      { name: t('data.fileTypeSpreadsheets'), extensions: ['xlsx', 'csv', 'tsv', 'txt'] },
      { name: t('data.fileTypeAll'), extensions: ['*'] },
    ],
    binary: true,
  });
  if (!file) return;
  const ext = file.name.split('.').pop()?.toLowerCase();
  let dataset: Dataset;
  if (ext === 'xlsx') {
    const bytes = base64ToBytes(file.data);
    checkXlsxSize(bytes);
    const rows = await readXlsxFile(new Blob([bytes as BlobPart]));
    dataset = toDataset(file.name, rows as unknown[][]);
  } else {
    const text = new TextDecoder().decode(base64ToBytes(file.data)).replace(/^﻿/, '');
    dataset = toDataset(file.name, parseDelimited(text, ext === 'tsv' ? '\t' : ''));
  }
  appStore.set({ dataset });
  toast(tn('data.loaded', dataset.rows.length, { name: file.name }), 'success');
}

export function DataView() {
  const { dataset } = appStore.use();
  const [filter, setFilter] = useState('');

  const paste = async () => {
    try {
      const text = await api.clipboard.readText();
      const ds = toDataset(t('data.pastedName'), parseDelimited(text, text.includes('\t') ? '\t' : ''));
      appStore.set({ dataset: ds });
      toast(tn('data.pasted', ds.rows.length), 'success');
    } catch (err) {
      toast((err as Error).message || t('data.noClipboardTable'), 'error');
    }
  };

  const copyColumn = async (col: string) => {
    await navigator.clipboard.writeText(`{{${col}}}`);
    toast(t('data.copiedField', { field: `{{${col}}}` }), 'success');
  };

  const rows = dataset
    ? dataset.rows.map((r, i) => ({ r, i })).filter(({ r }) => !filter || r.some((c) => c.toLowerCase().includes(filter.toLowerCase())))
    : [];

  return (
    <div className="page">
      <h2>{t('data.title')}</h2>
      <p className="lead">
        {t('data.lead', { example: '{{Name}}' })}
      </p>
      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button className="btn primary" onClick={() => void loadDataFile().catch((e) => toast((e as Error).message, 'error'))}>
          <FileSpreadsheet size={15} /> {t('data.openFile')}
        </button>
        <button className="btn" onClick={() => void paste()}>
          <ClipboardPaste size={15} /> {t('data.paste')}
        </button>
        {dataset && (
          <button className="btn danger" onClick={() => appStore.set({ dataset: undefined })}>
            <Trash2 size={15} /> {t('data.clear')}
          </button>
        )}
      </div>

      {!dataset ? (
        <div className="card empty">{t('data.empty')}</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>
              {dataset.name} · {tn('data.rows', dataset.rows.length)}
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              {t('data.columnsHint')}
            </p>
            <div className="btn-row">
              {dataset.columns.map((c) => (
                <button key={c} className="btn small" onClick={() => void copyColumn(c)}>
                  {`{{${c}}}`}
                </button>
              ))}
            </div>
          </div>
          <input type="search" placeholder={t('data.filterRows')} value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 10, maxWidth: 320 }} />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  {dataset.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 1000).map(({ r, i }) => (
                  <tr key={i}>
                    <td className="num">{i + 1}</td>
                    {r.map((c, j) => (
                      <td key={j} title={c}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 1000 && <p className="muted">{t('data.showingFirst')}</p>}
        </>
      )}
    </div>
  );
}
