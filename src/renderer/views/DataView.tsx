import { useState } from 'react';
import { ClipboardPaste, FileSpreadsheet, Trash2 } from 'lucide-react';
import readXlsxFile from 'read-excel-file';
import { api, base64ToBytes } from '../api';
import { appStore, toast } from '../state/app';
import type { Dataset } from '../editor/template';
import { checkXlsxSize, parseDelimited, toDataset } from '../dataImport';

export async function loadDataFile(): Promise<void> {
  const file = await api.files.open({
    filters: [
      { name: 'Spreadsheets', extensions: ['xlsx', 'csv', 'tsv', 'txt'] },
      { name: 'All files', extensions: ['*'] },
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
  toast(`Loaded ${dataset.rows.length} rows from ${file.name}`, 'success');
}

export function DataView() {
  const { dataset } = appStore.use();
  const [filter, setFilter] = useState('');

  const paste = async () => {
    try {
      const text = await api.clipboard.readText();
      const ds = toDataset('Pasted data', parseDelimited(text, text.includes('\t') ? '\t' : ''));
      appStore.set({ dataset: ds });
      toast(`Pasted ${ds.rows.length} rows`, 'success');
    } catch (err) {
      toast((err as Error).message || 'The clipboard has no table data.', 'error');
    }
  };

  const copyColumn = async (col: string) => {
    await navigator.clipboard.writeText(`{{${col}}}`);
    toast(`Copied {{${col}}}. Paste it into a text field or barcode on the label.`, 'success');
  };

  const rows = dataset
    ? dataset.rows.map((r, i) => ({ r, i })).filter(({ r }) => !filter || r.some((c) => c.toLowerCase().includes(filter.toLowerCase())))
    : [];

  return (
    <div className="page">
      <h2>Data for batch printing</h2>
      <p className="lead">
        Load a spreadsheet to print one label for each row. The first row must hold the column names. Put a column on a label as a field, for example {'{{Name}}'}.
      </p>
      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button className="btn primary" onClick={() => void loadDataFile().catch((e) => toast((e as Error).message, 'error'))}>
          <FileSpreadsheet size={15} /> Open Excel or CSV file
        </button>
        <button className="btn" onClick={() => void paste()}>
          <ClipboardPaste size={15} /> Paste table
        </button>
        {dataset && (
          <button className="btn danger" onClick={() => appStore.set({ dataset: undefined })}>
            <Trash2 size={15} /> Clear data
          </button>
        )}
      </div>

      {!dataset ? (
        <div className="card empty">No data is loaded. Supported files: .xlsx, .csv and .tsv.</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>
              {dataset.name} · {dataset.rows.length} rows
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Click a column to copy its field. You can also pick a field from the list under a text or barcode in the design view.
            </p>
            <div className="btn-row">
              {dataset.columns.map((c) => (
                <button key={c} className="btn small" onClick={() => void copyColumn(c)}>
                  {`{{${c}}}`}
                </button>
              ))}
            </div>
          </div>
          <input type="search" placeholder="Filter rows" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ marginBottom: 10, maxWidth: 320 }} />
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
          {rows.length > 1000 && <p className="muted">Showing the first 1000 rows. All rows are printed.</p>}
        </>
      )}
    </div>
  );
}
