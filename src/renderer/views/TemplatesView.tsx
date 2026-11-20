import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, FilePlus2, Trash2, Upload } from 'lucide-react';
import { api, newId } from '../api';
import { appStore, confirmDiscard, newTemplate, openTemplate, toast } from '../state/app';
import { LABEL_PRESETS, sizeLabel, type LabelTemplate } from '../editor/template';
import { sampleTemplates } from '../editor/samples';
import { Field, Modal, NumberInput } from '../components/ui';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function NewLabelDialog(props: { onClose: () => void }) {
  const [w, setW] = useState(50);
  const [h, setH] = useState(30);
  return (
    <Modal
      title="New label"
      onClose={props.onClose}
      footer={
        <>
          <button className="btn" onClick={props.onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            onClick={() => {
              void newTemplate(w, h);
              props.onClose();
            }}
          >
            Create
          </button>
        </>
      }
    >
      <div className="field-row">
        <Field label="Width">
          <NumberInput unit="mm" min={5} max={300} value={w} onChange={setW} />
        </Field>
        <Field label="Height">
          <NumberInput unit="mm" min={5} max={500} value={h} onChange={setH} />
        </Field>
      </div>
      <Field label="Common sizes">
        <div className="preset-list">
          {LABEL_PRESETS.map((g) => (
            <div key={g.group}>
              <div className="group">{g.group}</div>
              {g.sizes.map((s) => (
                <button
                  key={`${g.group}-${sizeLabel(s)}`}
                  onDoubleClick={() => {
                    void newTemplate(s.widthMm, s.heightMm, s.labelType);
                    props.onClose();
                  }}
                  onClick={() => {
                    setW(s.widthMm);
                    setH(s.heightMm);
                  }}
                >
                  {sizeLabel(s)}
                </button>
              ))}
            </div>
          ))}
        </div>
      </Field>
    </Modal>
  );
}

export function TemplatesView() {
  const [items, setItems] = useState<LabelTemplate[]>([]);
  const [creating, setCreating] = useState(false);
  const samples = useMemo(() => sampleTemplates(), []);

  const reload = async () => {
    const list = await api.store.list<LabelTemplate>('templates');
    setItems(list.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    void reload();
  }, []);

  const open = (t: LabelTemplate) => {
    if (!confirmDiscard()) return;
    void openTemplate(t);
  };

  const duplicate = async (t: LabelTemplate) => {
    const copy = { ...t, id: newId(), name: `${t.name} copy`, createdAt: Date.now(), updatedAt: Date.now() };
    await api.store.put('templates', copy.id, copy);
    await reload();
  };

  const remove = async (t: LabelTemplate) => {
    if (!window.confirm(`Delete "${t.name}"? You cannot undo this.`)) return;
    await api.store.delete('templates', t.id);
    if (appStore.get().template.id === t.id) appStore.set({ template: { ...appStore.get().template, id: '' } });
    await reload();
  };

  const exportOne = async (t: LabelTemplate) => {
    await api.files.save({
      defaultName: `${t.name || 'label'}.oynlabel.json`,
      filters: [{ name: 'Label file', extensions: ['json'] }],
      data: JSON.stringify({ format: 'ownyourniimbot-label', version: 1, template: t }, null, 2),
    });
  };

  const importFile = async () => {
    const file = await api.files.open({ filters: [{ name: 'Label file', extensions: ['json'] }] });
    if (!file) return;
    try {
      const parsed = JSON.parse(file.data);
      const t: LabelTemplate = parsed.template ?? parsed;
      if (!t.canvas || !t.widthMm || !t.heightMm) throw new Error('This file is not a label file.');
      const copy = { ...t, id: newId(), updatedAt: Date.now() };
      await api.store.put('templates', copy.id, copy);
      await reload();
      toast(`Imported "${copy.name}"`, 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <div className="page">
      <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2>Saved labels</h2>
          <p className="lead" style={{ margin: 0 }}>
            Labels are saved on this computer only.
          </p>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => void importFile()}>
            <Upload size={15} /> Import
          </button>
          <button
            className="btn primary"
            onClick={() => {
              if (confirmDiscard()) setCreating(true);
            }}
          >
            <FilePlus2 size={15} /> New label
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card empty">No saved labels yet. Create a label or start from an example.</div>
      ) : (
        <div className="template-grid">
          {items.map((t) => (
            <div key={t.id} className="template-card" onClick={() => open(t)}>
              <div className="thumb">{t.thumbnail ? <img src={t.thumbnail} alt="" /> : <span className="muted">No preview</span>}</div>
              <div className="meta" onClick={(e) => e.stopPropagation()}>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => open(t)}>
                  <div className="name">{t.name}</div>
                  <small>
                    {t.widthMm} × {t.heightMm} mm · {formatDate(t.updatedAt)}
                  </small>
                </div>
                <button className="btn ghost small icon" title="Duplicate" onClick={() => void duplicate(t)}>
                  <Copy size={14} />
                </button>
                <button className="btn ghost small icon" title="Export" onClick={() => void exportOne(t)}>
                  <Download size={14} />
                </button>
                <button className="btn ghost small icon danger" title="Delete" onClick={() => void remove(t)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 32 }}>Examples</h2>
      <p className="lead">Open an example and change it. Fields in braces, such as {'{{Name}}'}, take values from a data file.</p>
      <div className="template-grid">
        {samples.map((t) => (
          <div key={t.id} className="template-card" onClick={() => open({ ...t, id: '' })}>
            <div className="thumb new-card">
              <strong>
                {t.widthMm} × {t.heightMm}
              </strong>
            </div>
            <div className="meta">
              <div className="name">{t.name}</div>
            </div>
          </div>
        ))}
      </div>

      {creating && <NewLabelDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
