import { useEffect, useState } from 'react';
import { Copy, Download, FilePlus2, Trash2, Upload } from 'lucide-react';
import { api, newId } from '../api';
import { appStore, confirmDiscard, openTemplate, requestNewLabel, toast } from '../state/app';
import type { LabelTemplate } from '../editor/template';
import { isPreview, validateTemplate } from '../editor/validate';
import { t } from '../i18n';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TemplatesView() {
  const [items, setItems] = useState<LabelTemplate[]>([]);

  const reload = async () => {
    const list = await api.store.list<LabelTemplate>('templates');
    setItems(list.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    void reload();
  }, []);

  const open = (tpl: LabelTemplate) => {
    if (!confirmDiscard()) return;
    void openTemplate(tpl);
  };

  const duplicate = async (tpl: LabelTemplate) => {
    const copy = { ...tpl, id: newId(), name: t('labels.copyName', { name: tpl.name }), createdAt: Date.now(), updatedAt: Date.now() };
    await api.store.put('templates', copy.id, copy);
    await reload();
  };

  const remove = async (tpl: LabelTemplate) => {
    if (!window.confirm(t('labels.deleteConfirm', { name: tpl.name }))) return;
    await api.store.delete('templates', tpl.id);
    if (appStore.get().template.id === tpl.id) appStore.set({ template: { ...appStore.get().template, id: '' } });
    await reload();
  };

  const exportOne = async (tpl: LabelTemplate) => {
    await api.files.save({
      defaultName: `${tpl.name || 'label'}.oynlabel.json`,
      filters: [{ name: t('labels.fileType'), extensions: ['json'] }],
      data: JSON.stringify({ format: 'ownyourniimbot-label', version: 1, template: tpl }, null, 2),
    });
  };

  const importFile = async () => {
    const file = await api.files.open({ filters: [{ name: t('labels.fileType'), extensions: ['json'] }] });
    if (!file) return;
    try {
      const parsed = JSON.parse(file.data);
      const tpl = validateTemplate(parsed?.template ?? parsed);
      const copy = { ...tpl, id: newId(), updatedAt: Date.now() };
      await api.store.put('templates', copy.id, copy);
      await reload();
      toast(t('labels.imported', { name: copy.name }), 'success');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <div className="page">
      <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2>{t('labels.title')}</h2>
          <p className="lead" style={{ margin: 0 }}>
            {t('labels.lead')}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => void importFile()}>
            <Upload size={15} /> {t('labels.import')}
          </button>
          <button className="btn primary" onClick={requestNewLabel}>
            <FilePlus2 size={15} /> {t('labels.newLabel')}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card empty">{t('labels.empty')}</div>
      ) : (
        <div className="template-grid">
          {items.map((tpl) => (
            <div key={tpl.id} className="template-card" onClick={() => open(tpl)}>
              <div className="thumb">{isPreview(tpl.thumbnail) ? <img src={tpl.thumbnail} alt="" /> : <span className="muted">{t('labels.noPreview')}</span>}</div>
              <div className="meta" onClick={(e) => e.stopPropagation()}>
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => open(tpl)}>
                  <div className="name">{tpl.name}</div>
                  <small>
                    {tpl.widthMm} × {tpl.heightMm} mm · {formatDate(tpl.updatedAt)}
                  </small>
                </div>
                <button className="btn ghost small icon" title={t('labels.duplicate')} onClick={() => void duplicate(tpl)}>
                  <Copy size={14} />
                </button>
                <button className="btn ghost small icon" title={t('labels.export')} onClick={() => void exportOne(tpl)}>
                  <Download size={14} />
                </button>
                <button className="btn ghost small icon danger" title={t('common.delete')} onClick={() => void remove(tpl)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <strong>{t('labels.library.title')}</strong>
          <div className="muted">{t('labels.library.text')}</div>
        </div>
        <button className="btn primary" onClick={() => appStore.set({ view: 'library' })}>
          {t('labels.library.open')}
        </button>
      </div>
    </div>
  );
}
