import { useEffect, useMemo, useRef, useState } from 'react';
import { Database, Search } from 'lucide-react';
import { CATEGORIES, DESIGNS, isRoundSize, type Category, type Size, type TemplateDesign } from '../templates/catalogue';
import { buildTemplate, fitFor, thumbnail, type Fit } from '../templates/materialise';
import { appStore, confirmDiscard, openTemplate, toast } from '../state/app';
import { activeModel, usePrinter } from '../state/printer';
import { rollEditorSize, rollStore } from '../state/roll';
import type { PrinterModel } from '../../printer/models';

type Compat = 'loaded' | 'rolls' | 'fits' | 'all';

const near = (a: number, b: number) => Math.abs(a - b) < 0.6;
const sizeText = ([w, h]: Size) => `${w} × ${h}`;

function Thumb(props: { design: TemplateDesign; size: Size }) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string>();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        io.disconnect();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let live = true;
    setSrc(undefined);
    void thumbnail(props.design, props.size[0], props.size[1]).then((s) => live && setSrc(s)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [visible, props.design, props.size[0], props.size[1]]);

  const round = isRoundSize(props.design, props.size[0], props.size[1]);
  return (
    <div className="thumb" ref={ref}>
      {src ? <img src={src} alt="" style={round ? { borderRadius: '50%' } : undefined} /> : <span className="muted">…</span>}
    </div>
  );
}

function DesignCard(props: {
  design: TemplateDesign;
  sizes: { size: Size; fit: Fit; loaded: boolean }[];
  model: PrinterModel;
  onOpen: (d: TemplateDesign, s: Size) => void;
}) {
  const preferred = props.sizes.find((s) => s.loaded) ?? props.sizes.find((s) => s.fit === 'roll') ?? props.sizes[0];
  const [chosen, setChosen] = useState<Size>(preferred.size);
  useEffect(() => setChosen(preferred.size), [preferred.size[0], preferred.size[1]]);
  return (
    <div className="template-card library-card">
      <div onClick={() => props.onOpen(props.design, chosen)}>
        <Thumb design={props.design} size={chosen} />
      </div>
      <div className="library-meta">
        <div className="name" title={props.design.name}>
          {props.design.name}
          {props.design.sampleData && (
            <span className="pill" title="Uses data fields. Example data loads with it." style={{ marginLeft: 6 }}>
              <Database size={11} /> data
            </span>
          )}
        </div>
        <div className="desc">{props.design.description}</div>
        <div className="chips">
          {props.sizes.map(({ size, fit, loaded }) => (
            <button
              key={sizeText(size)}
              className={`chip${near(size[0], chosen[0]) && near(size[1], chosen[1]) ? ' on' : ''}${loaded ? ' loaded' : ''}${fit === 'no' ? ' dim' : ''}`}
              title={loaded ? 'Matches the roll in the printer' : fit === 'roll' ? `A NIIMBOT roll for the ${props.model.name}` : fit === 'fits' ? `Fits the ${props.model.name} print head` : `Too wide for the ${props.model.name}`}
              onMouseEnter={() => setChosen(size)}
              onClick={() => props.onOpen(props.design, size)}
            >
              {sizeText(size)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LibraryView() {
  const p = usePrinter();
  const { roll } = rollStore.use();
  const { dataset } = appStore.use();
  const model = activeModel();
  const rollSize = roll ? rollEditorSize(roll) : undefined;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [compat, setCompat] = useState<Compat>(p.connected ? (rollSize ? 'loaded' : 'rolls') : 'all');
  const [sizeFilter, setSizeFilter] = useState('any');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DESIGNS.map((design) => {
      const sizes = design.sizes.map((size) => ({
        size,
        fit: fitFor(size[0], size[1], model),
        loaded: Boolean(rollSize && near(rollSize.widthMm, size[0]) && near(rollSize.heightMm, size[1])),
      }));
      const shown = sizes.filter((s) => {
        if (sizeFilter !== 'any' && sizeText(s.size) !== sizeFilter) return false;
        if (compat === 'loaded') return s.loaded;
        if (compat === 'rolls') return s.fit === 'roll';
        if (compat === 'fits') return s.fit !== 'no';
        return true;
      });
      const textOk = !q || `${design.name} ${design.description} ${design.category}`.toLowerCase().includes(q);
      const catOk = category === 'all' || design.category === category;
      return { design, sizes: shown, ok: textOk && catOk && shown.length > 0 };
    });
  }, [query, category, compat, sizeFilter, model, rollSize?.widthMm, rollSize?.heightMm]);

  const visible = rows.filter((r) => r.ok);
  const counts = new Map<string, number>();
  for (const r of rows) if (r.sizes.length) counts.set(r.design.category, (counts.get(r.design.category) ?? 0) + 1);
  const allSizes = [...new Set(DESIGNS.flatMap((d) => d.sizes.map(sizeText)))].sort((a, b) => {
    const [aw, ah] = a.split(' × ').map(Number);
    const [bw, bh] = b.split(' × ').map(Number);
    return aw - bw || ah - bh;
  });
  const templateCount = DESIGNS.reduce((n, d) => n + d.sizes.length, 0);

  const open = async (design: TemplateDesign, [w, h]: Size) => {
    if (!confirmDiscard()) return;
    const t = await buildTemplate(design, w, h);
    await openTemplate({ ...t, id: '', createdAt: Date.now(), updatedAt: Date.now() });
    if (design.sampleData) {
      const have = new Set((dataset?.columns ?? []).map((c) => c.toLowerCase()));
      if (!design.sampleData.columns.every((c) => have.has(c.toLowerCase()))) {
        appStore.set({ dataset: design.sampleData });
        toast('Example data is loaded. Replace it with your own file on the Data page.', 'info');
      }
    }
  };

  return (
    <div className="page library">
      <h2>Template library</h2>
      <p className="lead">
        {DESIGNS.length} designs in {templateCount} sizes. Open a template, then change the text on the label.
      </p>

      <div className="library-filters">
        <div className="search">
          <Search size={15} />
          <input type="search" placeholder="Search templates, for example server, freezer or price" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select value={compat} onChange={(e) => setCompat(e.target.value as Compat)} style={{ width: 'auto' }}>
          {rollSize && (
            <option value="loaded">
              Matches the loaded roll ({rollSize.widthMm} × {rollSize.heightMm} mm)
            </option>
          )}
          <option value="rolls">NIIMBOT roll sizes for the {model.name}</option>
          <option value="fits">Fits the {model.name} print head</option>
          <option value="all">All sizes</option>
        </select>
        <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="any">Any size</option>
          {allSizes.map((s) => (
            <option key={s} value={s}>
              {s} mm
            </option>
          ))}
        </select>
      </div>

      <div className="category-chips">
        <button className={`chip${category === 'all' ? ' on' : ''}`} onClick={() => setCategory('all')}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip${category === c ? ' on' : ''}${counts.get(c) ? '' : ' dim'}`} onClick={() => setCategory(c)}>
            {c} {counts.get(c) ? <span className="count">{counts.get(c)}</span> : null}
          </button>
        ))}
      </div>

      {!p.connected && (
        <p className="muted" style={{ marginTop: 0 }}>
          Sizes are checked against the {model.name}, the model in Settings. Connect a printer to check against your printer and its loaded roll.
        </p>
      )}

      {visible.length === 0 ? (
        <div className="card empty">
          No templates match these filters.
          {compat !== 'all' && (
            <div style={{ marginTop: 10 }}>
              <button className="btn" onClick={() => setCompat('all')}>
                Show all sizes
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="template-grid library-grid">
          {visible.map((r) => (
            <DesignCard key={r.design.id} design={r.design} sizes={r.sizes} model={model} onOpen={(d, s) => void open(d, s)} />
          ))}
        </div>
      )}
    </div>
  );
}
